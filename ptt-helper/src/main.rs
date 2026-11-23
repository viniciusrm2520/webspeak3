//! ptt-helper: a global push-to-talk key for the WebSpeak3 web client.
//!
//! Browsers only deliver keyboard input to a page while its tab has focus, so
//! push-to-talk stops working the moment a game or another program is in
//! front. This helper listens for a few keys system-wide (push-to-talk, a
//! mute toggle...) and tells the page over a WebSocket on 127.0.0.1 when they
//! go down and up.
//!
//! It is deliberately not a general keyboard bridge:
//! - each connected page names the keys it wants (KeyboardEvent.code values
//!   such as "NumpadSubtract", at most four) and only ever hears about those;
//! - only pages from allowed origins may connect (localhost by default, plus
//!   any listed with --allow-origin or in allowed-origins.txt next to the
//!   executable), because any website could otherwise open the socket;
//! - it binds to the loopback interface only.
//!
//! Protocol (JSON text frames):
//!   helper -> page    {"type":"hello","version":"0.2.0"}
//!   page   -> helper  {"type":"bind","codes":["NumpadSubtract","F9"]}
//!   helper -> page    {"type":"bound","ok":true,"unsupported":[]}
//!   helper -> page    {"type":"key","code":"F9","pressed":true}
//! The 0.1 single-key form still works: {"type":"bind","code":"X"} answers
//! {"type":"bound","code":"X","ok":..} and reports {"type":"ptt","pressed":..}.

use std::collections::HashMap;
use std::io::ErrorKind;
use std::net::{SocketAddr, TcpListener, TcpStream};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use rdev::{Button, EventType, Key};
use tungstenite::handshake::server::{ErrorResponse, Request, Response};
use tungstenite::http::StatusCode;
use tungstenite::{accept_hdr, Message};

const DEFAULT_PORT: u16 = 37373;
const VERSION: &str = env!("CARGO_PKG_VERSION");

/// What a client is listening for, in rdev's terms.
#[derive(Clone, Copy, PartialEq, Debug)]
enum Trigger {
    Key(Key),
    Button(Button),
}

/// Most keys one page may watch: push-to-talk plus a few toggles, few enough
/// that a page can't turn the helper into a keyboard logger.
const MAX_KEYS: usize = 4;

struct Watch {
    code: String,
    trigger: Trigger,
    pressed: bool,
}

struct Client {
    watches: Vec<Watch>,
    /// Bound with the 0.1 single-key message: report as {"type":"ptt"}.
    legacy: bool,
    tx: Sender<String>,
}

type Clients = Arc<Mutex<HashMap<u64, Client>>>;

fn main() {
    let config = Config::from_env();
    let addr = SocketAddr::from(([127, 0, 0, 1], config.port));
    let listener = match TcpListener::bind(addr) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("ptt-helper: cannot listen on {addr}: {e} (already running?)");
            std::process::exit(1);
        }
    };
    println!("ptt-helper {VERSION} listening on ws://{addr}");
    println!("allowed origins: localhost, 127.0.0.1{}", config.describe_extra());

    let clients: Clients = Arc::new(Mutex::new(HashMap::new()));
    let next_id = Arc::new(AtomicU64::new(1));

    {
        let clients = clients.clone();
        let origins = Arc::new(config.origins);
        thread::spawn(move || {
            for stream in listener.incoming().flatten() {
                let id = next_id.fetch_add(1, Ordering::Relaxed);
                let clients = clients.clone();
                let origins = origins.clone();
                thread::spawn(move || serve(stream, id, clients, &origins));
            }
        });
    }

    // rdev::listen runs the OS hook and its message loop on this thread.
    let hook_clients = clients.clone();
    if let Err(e) = rdev::listen(move |event| {
        let (trigger, down) = match event.event_type {
            EventType::KeyPress(k) => (Trigger::Key(k), true),
            EventType::KeyRelease(k) => (Trigger::Key(k), false),
            EventType::ButtonPress(b) => (Trigger::Button(b), true),
            EventType::ButtonRelease(b) => (Trigger::Button(b), false),
            _ => return,
        };
        let mut map = hook_clients.lock().unwrap();
        for client in map.values_mut() {
            for watch in client.watches.iter_mut() {
                // Auto-repeat sends KeyPress again and again while held; only
                // the edges matter.
                if watch.trigger == trigger && watch.pressed != down {
                    watch.pressed = down;
                    let msg = if client.legacy {
                        format!(r#"{{"type":"ptt","pressed":{down}}}"#)
                    } else {
                        format!(r#"{{"type":"key","code":"{}","pressed":{down}}}"#, watch.code)
                    };
                    let _ = client.tx.send(msg);
                }
            }
        }
    }) {
        eprintln!("ptt-helper: could not install the keyboard hook: {e:?}");
        std::process::exit(1);
    }
}

/// One WebSocket client: checks the origin, then alternates between reading
/// bind requests and forwarding key edges until either side goes away.
fn serve(stream: TcpStream, id: u64, clients: Clients, origins: &Origins) {
    let mut origin = String::new();
    let check = |req: &Request, resp: Response| -> Result<Response, ErrorResponse> {
        let o = req
            .headers()
            .get("origin")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");
        origin = o.to_string();
        if origins.allows(o) {
            Ok(resp)
        } else {
            let mut err = ErrorResponse::new(Some("origin not allowed".into()));
            *err.status_mut() = StatusCode::FORBIDDEN;
            Err(err)
        }
    };
    let mut ws = match accept_hdr(stream, check) {
        Ok(ws) => ws,
        Err(_) => {
            if !origin.is_empty() {
                println!("refused connection from {origin} (not in the allowed origins)");
            }
            return;
        }
    };
    println!("page connected: {origin}");

    let (tx, rx): (Sender<String>, Receiver<String>) = channel();
    clients.lock().unwrap().insert(id, Client { watches: Vec::new(), legacy: false, tx });
    let _ = ws.send(Message::text(format!(r#"{{"type":"hello","version":"{VERSION}"}}"#)));
    let _ = ws.get_ref().set_read_timeout(Some(Duration::from_millis(15)));

    'outer: loop {
        while let Ok(out) = rx.try_recv() {
            if ws.send(Message::text(out)).is_err() {
                break 'outer;
            }
        }
        match ws.read() {
            Ok(Message::Text(text)) => {
                let Some(bind) = parse_bind(&text) else { continue };
                let mut watches = Vec::new();
                let mut unsupported = Vec::new();
                for code in &bind.codes {
                    match trigger_for(code) {
                        Some(trigger) => watches.push(Watch { code: code.clone(), trigger, pressed: false }),
                        None => unsupported.push(code.clone()),
                    }
                }
                let ok = unsupported.is_empty();
                let listed = if bind.codes.is_empty() { "nothing".to_string() } else { bind.codes.join(", ") };
                let note = if ok { String::new() } else { format!(" (unsupported: {})", unsupported.join(", ")) };
                println!("{origin} listens for {listed}{note}");
                if let Some(c) = clients.lock().unwrap().get_mut(&id) {
                    c.watches = watches;
                    c.legacy = bind.legacy;
                }
                // Codes are validated alphanumeric in parse_bind, so they
                // can go into the JSON unescaped.
                let reply = if bind.legacy {
                    let code = bind.codes.first().map(String::as_str).unwrap_or("");
                    format!(r#"{{"type":"bound","code":"{code}","ok":{ok}}}"#)
                } else {
                    let list: Vec<String> = unsupported.iter().map(|c| format!(r#""{c}""#)).collect();
                    format!(r#"{{"type":"bound","ok":{ok},"unsupported":[{}]}}"#, list.join(","))
                };
                if ws.send(Message::text(reply)).is_err() {
                    break;
                }
            }
            Ok(Message::Close(_)) => break,
            Ok(_) => {}
            Err(tungstenite::Error::Io(e)) if matches!(e.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) => {}
            Err(_) => break,
        }
    }
    clients.lock().unwrap().remove(&id);
    println!("page disconnected: {origin}");
}

struct Bind {
    codes: Vec<String>,
    legacy: bool,
}

/// Reads the only message a page ever sends: {"type":"bind","codes":[..]},
/// or the 0.1 form {"type":"bind","code":".."}. Codes are KeyboardEvent.code
/// names, so anything but short alphanumeric strings is refused outright.
fn parse_bind(text: &str) -> Option<Bind> {
    let v: serde_json::Value = serde_json::from_str(text).ok()?;
    if v.get("type")?.as_str()? != "bind" {
        return None;
    }
    let valid = |c: &str| !c.is_empty() && c.len() <= 32 && c.chars().all(|ch| ch.is_ascii_alphanumeric());
    if let Some(list) = v.get("codes").and_then(|c| c.as_array()) {
        let mut codes: Vec<String> = Vec::new();
        for c in list {
            let c = c.as_str()?;
            if !valid(c) {
                return None;
            }
            if !codes.iter().any(|x| x == c) {
                codes.push(c.to_string());
            }
        }
        if codes.len() > MAX_KEYS {
            return None;
        }
        return Some(Bind { codes, legacy: false });
    }
    let code = v.get("code")?.as_str()?;
    valid(code).then(|| Bind { codes: vec![code.to_string()], legacy: true })
}

/// Maps a browser KeyboardEvent.code (or the web client's "MouseN" for mouse
/// buttons) to the key rdev reports.
fn trigger_for(code: &str) -> Option<Trigger> {
    if let Some(n) = code.strip_prefix("Mouse") {
        // The web client stores MouseEvent.button: 1 middle, 3 back, 4 forward.
        return match n {
            "1" => Some(Trigger::Button(Button::Middle)),
            "3" => Some(Trigger::Button(Button::Unknown(1))),
            "4" => Some(Trigger::Button(Button::Unknown(2))),
            _ => None,
        };
    }
    if let Some(letter) = code.strip_prefix("Key") {
        return letter_key(letter).map(Trigger::Key);
    }
    if let Some(d) = code.strip_prefix("Digit") {
        return digit_key(d, false).map(Trigger::Key);
    }
    if let Some(d) = code.strip_prefix("Numpad") {
        if let Some(k) = digit_key(d, true) {
            return Some(Trigger::Key(k));
        }
    }
    if let Some(n) = code.strip_prefix('F').and_then(|n| n.parse::<u32>().ok()) {
        return function_key(n).map(Trigger::Key);
    }
    let key = match code {
        "NumpadSubtract" => Key::KpMinus,
        "NumpadAdd" => Key::KpPlus,
        "NumpadMultiply" => Key::KpMultiply,
        "NumpadDivide" => Key::KpDivide,
        "NumpadEnter" => Key::KpReturn,
        "NumpadDecimal" => Key::KpDelete,
        "Space" => Key::Space,
        "Tab" => Key::Tab,
        "CapsLock" => Key::CapsLock,
        "ShiftLeft" => Key::ShiftLeft,
        "ShiftRight" => Key::ShiftRight,
        "ControlLeft" => Key::ControlLeft,
        "ControlRight" => Key::ControlRight,
        "AltLeft" => Key::Alt,
        "AltRight" => Key::AltGr,
        "MetaLeft" => Key::MetaLeft,
        "MetaRight" => Key::MetaRight,
        "Insert" => Key::Insert,
        "Delete" => Key::Delete,
        "Home" => Key::Home,
        "End" => Key::End,
        "PageUp" => Key::PageUp,
        "PageDown" => Key::PageDown,
        "ArrowUp" => Key::UpArrow,
        "ArrowDown" => Key::DownArrow,
        "ArrowLeft" => Key::LeftArrow,
        "ArrowRight" => Key::RightArrow,
        "Pause" => Key::Pause,
        "ScrollLock" => Key::ScrollLock,
        "PrintScreen" => Key::PrintScreen,
        "Backquote" => Key::BackQuote,
        "Minus" => Key::Minus,
        "Equal" => Key::Equal,
        "BracketLeft" => Key::LeftBracket,
        "BracketRight" => Key::RightBracket,
        "Backslash" => Key::BackSlash,
        "IntlBackslash" => Key::IntlBackslash,
        "Semicolon" => Key::SemiColon,
        "Quote" => Key::Quote,
        "Comma" => Key::Comma,
        "Period" => Key::Dot,
        "Slash" => Key::Slash,
        _ => return None,
    };
    Some(Trigger::Key(key))
}

fn letter_key(l: &str) -> Option<Key> {
    Some(match l {
        "A" => Key::KeyA, "B" => Key::KeyB, "C" => Key::KeyC, "D" => Key::KeyD,
        "E" => Key::KeyE, "F" => Key::KeyF, "G" => Key::KeyG, "H" => Key::KeyH,
        "I" => Key::KeyI, "J" => Key::KeyJ, "K" => Key::KeyK, "L" => Key::KeyL,
        "M" => Key::KeyM, "N" => Key::KeyN, "O" => Key::KeyO, "P" => Key::KeyP,
        "Q" => Key::KeyQ, "R" => Key::KeyR, "S" => Key::KeyS, "T" => Key::KeyT,
        "U" => Key::KeyU, "V" => Key::KeyV, "W" => Key::KeyW, "X" => Key::KeyX,
        "Y" => Key::KeyY, "Z" => Key::KeyZ,
        _ => return None,
    })
}

fn digit_key(d: &str, numpad: bool) -> Option<Key> {
    Some(match (d, numpad) {
        ("0", false) => Key::Num0, ("1", false) => Key::Num1, ("2", false) => Key::Num2,
        ("3", false) => Key::Num3, ("4", false) => Key::Num4, ("5", false) => Key::Num5,
        ("6", false) => Key::Num6, ("7", false) => Key::Num7, ("8", false) => Key::Num8,
        ("9", false) => Key::Num9,
        ("0", true) => Key::Kp0, ("1", true) => Key::Kp1, ("2", true) => Key::Kp2,
        ("3", true) => Key::Kp3, ("4", true) => Key::Kp4, ("5", true) => Key::Kp5,
        ("6", true) => Key::Kp6, ("7", true) => Key::Kp7, ("8", true) => Key::Kp8,
        ("9", true) => Key::Kp9,
        _ => return None,
    })
}

fn function_key(n: u32) -> Option<Key> {
    Some(match n {
        1 => Key::F1, 2 => Key::F2, 3 => Key::F3, 4 => Key::F4, 5 => Key::F5, 6 => Key::F6,
        7 => Key::F7, 8 => Key::F8, 9 => Key::F9, 10 => Key::F10, 11 => Key::F11, 12 => Key::F12,
        // rdev has no names past F12; on Windows they arrive as their virtual
        // key codes (VK_F13 = 0x7C ... VK_F24 = 0x87).
        #[cfg(windows)]
        13..=24 => Key::Unknown(0x7C + (n - 13)),
        _ => return None,
    })
}

/// Origins (scheme://host[:port]) allowed to open the socket.
struct Origins {
    extra: Vec<String>,
}

impl Origins {
    fn allows(&self, origin: &str) -> bool {
        let origin = origin.trim_end_matches('/').to_ascii_lowercase();
        let host_part = origin
            .strip_prefix("http://")
            .or_else(|| origin.strip_prefix("https://"))
            .unwrap_or("");
        let host = host_part.split(':').next().unwrap_or("");
        if host == "localhost" || host == "127.0.0.1" || host == "[::1]" {
            return true;
        }
        self.extra.iter().any(|o| *o == origin)
    }
}

struct Config {
    port: u16,
    origins: Origins,
}

impl Config {
    /// `--port N`, `--allow-origin URL` (repeatable), plus one origin per line
    /// in allowed-origins.txt next to the executable.
    fn from_env() -> Self {
        let mut port = DEFAULT_PORT;
        let mut extra = Vec::new();
        let mut args = std::env::args().skip(1);
        while let Some(arg) = args.next() {
            match arg.as_str() {
                "--port" => {
                    if let Some(p) = args.next().and_then(|p| p.parse().ok()) {
                        port = p;
                    }
                }
                "--allow-origin" => {
                    if let Some(o) = args.next() {
                        extra.push(normalize_origin(&o));
                    }
                }
                "--help" | "-h" => {
                    println!("usage: ptt-helper [--port {DEFAULT_PORT}] [--allow-origin https://your.site]...");
                    println!("Origins can also be listed one per line in allowed-origins.txt next to the executable.");
                    std::process::exit(0);
                }
                other => eprintln!("ptt-helper: ignoring unknown argument {other}"),
            }
        }
        if let Some(file) = std::env::current_exe().ok().and_then(|p| p.parent().map(|d| d.join("allowed-origins.txt"))) {
            if let Ok(text) = std::fs::read_to_string(file) {
                for line in text.lines().map(str::trim).filter(|l| !l.is_empty() && !l.starts_with('#')) {
                    extra.push(normalize_origin(line));
                }
            }
        }
        Config { port, origins: Origins { extra } }
    }

    fn describe_extra(&self) -> String {
        self.origins.extra.iter().map(|o| format!(", {o}")).collect()
    }
}

fn normalize_origin(o: &str) -> String {
    o.trim().trim_end_matches('/').to_ascii_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_numpad_minus() {
        assert_eq!(trigger_for("NumpadSubtract"), Some(Trigger::Key(Key::KpMinus)));
        assert_eq!(trigger_for("KeyV"), Some(Trigger::Key(Key::KeyV)));
        assert_eq!(trigger_for("Mouse3"), Some(Trigger::Button(Button::Unknown(1))));
        assert_eq!(trigger_for("Bogus"), None);
    }

    #[test]
    fn parses_bind() {
        let b = parse_bind(r#"{"type":"bind","codes":["NumpadSubtract","F9","F9"]}"#).unwrap();
        assert_eq!(b.codes, vec!["NumpadSubtract", "F9"]);
        assert!(!b.legacy);
        let b = parse_bind(r#"{"type":"bind","code":"NumpadSubtract"}"#).unwrap();
        assert_eq!(b.codes, vec!["NumpadSubtract"]);
        assert!(b.legacy);
        assert!(parse_bind(r#"{"type":"bind","codes":[]}"#).unwrap().codes.is_empty());
        assert!(parse_bind(r#"{"type":"bind","code":"x\" or 1"}"#).is_none());
        assert!(parse_bind(r#"{"type":"bind","codes":["KeyA","KeyB","KeyC","KeyD","KeyE"]}"#).is_none());
        assert!(parse_bind(r#"{"type":"other"}"#).is_none());
    }

    #[test]
    fn origin_rules() {
        let o = Origins { extra: vec!["https://ts.example.com".into()] };
        assert!(o.allows("http://localhost:5173"));
        assert!(o.allows("http://127.0.0.1:8080"));
        assert!(o.allows("https://ts.example.com"));
        assert!(o.allows("https://TS.example.com/"));
        assert!(!o.allows("https://evil.example.com"));
        assert!(!o.allows("https://localhost.evil.com"));
        assert!(!o.allows(""));
    }
}
