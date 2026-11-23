# ptt-helper

A global push-to-talk key for the WebSpeak3 web client.

Browsers only hand keyboard input to a page while its tab has focus, so the
web client's push-to-talk stops working as soon as a game or any other
program is in front. `ptt-helper` is a small background program that watches
**one** key system-wide and tells the page, over a WebSocket on
`127.0.0.1:37373`, when that key goes down and up.

## Download

Prebuilt archives for Windows, Linux and macOS are attached to the
[ptt-helper releases](https://github.com/viniciusrm2520/webspeak3/releases?q=ptt-helper&expanded=true),
built by `.github/workflows/ptt-helper-release.yml` whenever a
`ptt-helper-v*` tag is pushed. Each archive includes an
`allowed-origins.txt` you can edit.

## Use it

1. Start `ptt-helper` (see *Build* below) and leave it running.
2. In WebSpeak3: **Options → Hotkeys**, turn on push-to-talk, pick the key,
   then tick **"Global key via ptt-helper"**. The line under it turns green
   ("ptt-helper connected") once the page has found the helper.

Supported keys: letters, digits, the numpad (including `−`, `+`, `*`, `/`,
Enter), F1–F12 (F13–F24 on Windows), arrows, Insert/Delete/Home/End/PgUp/PgDn,
Space, Tab, modifiers, punctuation, and the middle and side mouse buttons.

## Allowed sites

Any website could try to open a socket on `127.0.0.1`, so the helper only
accepts pages from:

- `http://localhost` and `http://127.0.0.1` (any port), always;
- origins passed with `--allow-origin`, e.g.
  `ptt-helper --allow-origin https://ts.example.com`;
- origins listed one per line in `allowed-origins.txt` next to the
  executable (lines starting with `#` are ignored).

An origin is the scheme and host exactly as in the address bar, without a
path: `https://ts.example.com`, not `https://ts.example.com/`.

Each page only ever hears about the single key it asked for. The helper never
reports other keys, never blocks the key from reaching other programs, and
listens on the loopback interface only.

Chrome may ask once for permission to access devices on your local network
when an HTTPS site connects to the helper; allow it.

## Build

Needs Rust (`rustup`). On Windows also the Visual Studio C++ build tools.

```sh
cd ptt-helper
cargo build --release
```

The binary lands in `target/release/ptt-helper` (`ptt-helper.exe` on
Windows). Copy it, plus an `allowed-origins.txt` if you need one, wherever
you like.

On Linux it needs an X11 session; on macOS, grant it Accessibility access
(System Settings → Privacy & Security) the first time.

## Start with Windows

Press `Win + R`, type `shell:startup`, and put a shortcut to
`ptt-helper.exe` in the folder that opens.

## Options

```
ptt-helper [--port 37373] [--allow-origin https://your.site]...
```

The web client always connects to port 37373, so only change `--port` if you
also change `PTT_HELPER_PORT` in `web/src/app/prefs.ts`.
