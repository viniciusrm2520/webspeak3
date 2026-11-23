import { DEMO_MODE } from "../demoMode";

// In dev, the gateway runs standalone on its own port. In production it's
// normally served from the same origin/port as the web app (single
// container behind a reverse proxy), so the WebSocket URL is derived from
// the current location by default. If the static frontend is hosted
// separately from the gateway (e.g. a static host for the landing/app
// bundle, with the gateway staying on your own server), set
// VITE_GATEWAY_URL at build time to the gateway's public wss:// address
// instead - the browser will still block a plain ws:// gateway from an
// https:// page (mixed content), so that address needs real TLS.
// Either way the gateway's WebSocketServer only listens on /ws (see
// gateway/src/index.ts), so that path always gets appended here - a
// VITE_GATEWAY_URL override only needs to name the host, not the path.
export const GATEWAY_URL = import.meta.env.DEV
  ? "ws://localhost:8080/ws"
  : import.meta.env.VITE_GATEWAY_URL
    ? `${import.meta.env.VITE_GATEWAY_URL.replace(/\/$/, "")}/ws`
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

// Same derivation as GATEWAY_URL above, but for a plain HTTP POST (the
// feedback form) instead of the WebSocket - see gateway/src/index.ts's
// /api/feedback handler. VITE_GATEWAY_URL names a WebSocket origin, so its
// scheme has to be mapped back to http(s) here: fetch() refuses anything
// else outright ("TypeError: unknown scheme"), so with VITE_GATEWAY_URL set
// the form could not submit at all.
export const FEEDBACK_URL = import.meta.env.DEV
  ? "http://localhost:8080/api/feedback"
  : import.meta.env.VITE_GATEWAY_URL
    ? `${import.meta.env.VITE_GATEWAY_URL.replace(/\/$/, "").replace(/^ws(s?):\/\//, "http$1://")}/api/feedback`
    : `${window.location.protocol}//${window.location.host}/api/feedback`;

// News ticker: the instance's own gateway says whether it's on and adds its
// own messages (gateway/src/news.ts); the central feed is fetched directly,
// like the store. The demo has no gateway and only shows the central feed.
export const NEWS_CONFIG_URL = DEMO_MODE ? null : FEEDBACK_URL.replace(/\/api\/feedback$/, "/api/news");
export const NEWS_FEED_URL = import.meta.env.DEV
  ? "http://localhost:8080/api/store/news"
  : import.meta.env.VITE_NEWS_URL || "https://gateway.webspeak3.de/api/store/news";

// Unlike GATEWAY_URL/FEEDBACK_URL above, the design store is NOT per-instance:
// it's a single, centrally curated catalog run on the maintainer's own VPS
// (see gateway/src/store.ts), so every build - official and self-hosted
// Docker image alike - points at the same one by default, regardless of
// which TS3/TeaSpeak gateway that build otherwise talks to. A self-hoster who
// wants to run their own separate community store instead (their own
// gateway's STORE_ENABLED=1) can override with VITE_STORE_URL at build time.
// DEMO_MODE keeps the old same-origin derivation instead, which 404s on the
// static demo host - the public demo has no write access to the real store.
export const STORE_URL = import.meta.env.DEV
  ? "http://localhost:8080/api/store/themes"
  : DEMO_MODE
    ? `${window.location.protocol}//${window.location.host}/api/store/themes`
    : import.meta.env.VITE_STORE_URL || "https://gateway.webspeak3.de/api/store/themes";

// Ko-fi page of the project (.github/FUNDING.yml). Unlike the feedback button
// below this is not limited to the maintainer's own instance: it ships in
// every build, the Docker image included. Self-hosters who would rather not
// carry someone else's donation link can build with VITE_DONATE_URL= (empty)
// to drop the button, or point it somewhere else.
export const DONATE_URL = import.meta.env.VITE_DONATE_URL ?? "https://ko-fi.com/moepchi";

// Where the Hotkeys tab sends people to download ptt-helper (the global
// push-to-talk companion). Builds of ptt-helper-release.yml land there.
// VITE_PTT_HELPER_URL overrides it; empty hides the link.
export const PTT_HELPER_DOWNLOAD_URL =
  import.meta.env.VITE_PTT_HELPER_URL ?? "https://github.com/viniciusrm2520/webspeak3/releases?q=ptt-helper&expanded=true";

// This file's frontend is deployed as multiple Cloudflare Pages projects
// from the same repo/build (see mem:deployment) - only the maintainer's own
// production instance talks to a gateway they actually operate and read
// feedback from, so the "Feedback" menu entry only appears there. Every
// other deployment (self-hosted forks, and the public demo - which has no
// real gateway at all, see DEMO_MODE) simply never shows it. This is a UI
// nicety, not a security boundary: the gateway's own FEEDBACK_ENABLED
// opt-in (see gateway/src/index.ts) is what actually decides whether
// submissions are accepted at all.
const OWN_HOSTED_HOSTNAMES = new Set(["client.webspeak3.de"]);
export const IS_OWN_HOSTED_INSTANCE = !DEMO_MODE && OWN_HOSTED_HOSTNAMES.has(window.location.hostname);

// Auto-connect from a share link (?connect=host[:port]&nickname=&channel=&token=,
// see GitHub issue #10). Parsed once at module load and immediately stripped
// from the URL via replaceState so a reload/refresh doesn't silently
// reconnect off a stale link sitting in the address bar or browser history.
export const AUTO_CONNECT_FROM_URL = (() => {
  const params = new URLSearchParams(window.location.search);
  // The token may also sit in the fragment (#token=...), which - unlike the
  // query - never reaches server logs or Referer headers.
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const connectHost = params.get("connect");
  if (!connectHost) return null;
  const target = {
    host: connectHost,
    nickname: params.get("nickname") || undefined,
    defaultChannel: params.get("channel") || undefined,
    privilegeKey: hashParams.get("token") || params.get("token") || undefined,
  };
  for (const key of ["connect", "nickname", "channel", "token"]) params.delete(key);
  let hash = window.location.hash;
  if (hashParams.has("token")) {
    hashParams.delete("token");
    hash = hashParams.size ? `#${hashParams}` : "";
  }
  const rest = params.toString();
  window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : "") + hash);
  return target;
})();

// A self-hosted build can also bake in a default server so the page
// auto-connects with zero URL params at all - set via `docker compose build
// --build-arg DEFAULT_SERVER=...` (see Dockerfile/README) or plain
// VITE_DEFAULT_SERVER= at build time. The Docker image can set the same thing
// at runtime instead (DEFAULT_SERVER/DEFAULT_CHANNEL env vars, issue #12): the
// gateway passes them in as <meta> tags, which take precedence over the build
// values. AUTO_CONNECT_FROM_URL above always wins when a share link is present.
const runtimeConfig = (name: string) =>
  document.querySelector<HTMLMetaElement>(`meta[name="webspeak3-${name}"]`)?.content;
export const DEFAULT_SERVER = runtimeConfig("default-server") || import.meta.env.VITE_DEFAULT_SERVER || null;
export const DEFAULT_CHANNEL = runtimeConfig("default-channel") || import.meta.env.VITE_DEFAULT_CHANNEL || "";
// The gateway admin's ALLOWED_SERVERS (unless SERVER_PICKER=0): one server
// locks the address field to it, several turn it into a dropdown.
export const SERVER_CHOICES = runtimeConfig("allowed-servers")?.split(",").filter(Boolean) ?? [];

// Terms of use, own-hosted instance only (see TODO.md #2/#7.1). Versioned so
// a rule change can re-surface the modal: bump TOS_VERSION and everyone who
// accepted an older version is asked again.
export const TOS_VERSION = "v1";
export const TOS_KEY = "webspeak3-tos-accepted";
export function hasAcceptedToS(): boolean {
  return (localStorage.getItem(TOS_KEY) ?? "").startsWith(TOS_VERSION + ":");
}

// One-time migration from the pre-rename "ts-web-client:*" localStorage
// namespace so existing users don't lose their favorites/preferences.
(function migrateLegacyStorageKeys() {
  const oldPrefix = "ts-web-client:";
  const newPrefix = "webspeak3:";
  for (const oldKey of Object.keys(localStorage).filter((k) => k.startsWith(oldPrefix))) {
    const newKey = newPrefix + oldKey.slice(oldPrefix.length);
    if (localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey)!);
    }
    localStorage.removeItem(oldKey);
  }
})();

export const LAST_HOST_KEY = "webspeak3:last-host";
export const LAST_NICKNAME_KEY = "webspeak3:last-nickname";
// Privilege keys are one-shot grants, so they're no longer remembered across
// reloads; drop what older versions stored in plain text.
localStorage.removeItem("webspeak3:last-privilege-key");
export const LAST_SERVER_TYPE_KEY = "webspeak3:last-server-type";

export type ServerType = "teamspeak" | "teaspeak" | "auto" | "ts2";

export function loadServerType(): ServerType {
  const raw = localStorage.getItem(LAST_SERVER_TYPE_KEY);
  return raw === "teamspeak" || raw === "teaspeak" || raw === "auto" || raw === "ts2" ? raw : "auto";
}

// The gateway's feature list, readable before connecting. TeamSpeak 2 is
// opt-in per gateway (ENABLE_TS2), so the connect dialog only offers it then.
const FEATURES_URL = DEMO_MODE ? null : FEEDBACK_URL.replace(/\/api\/feedback$/, "/api/features");
type GatewayInfo = { features?: unknown; turnstileSiteKey?: unknown };
let gatewayInfoPromise: Promise<GatewayInfo> | null = null;
function fetchGatewayInfo(): Promise<GatewayInfo> {
  if (!FEATURES_URL) return Promise.resolve({});
  gatewayInfoPromise ??= fetch(FEATURES_URL)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return gatewayInfoPromise;
}
export function fetchGatewayFeatures(): Promise<string[]> {
  return fetchGatewayInfo().then((d) => (Array.isArray(d.features) ? d.features : []));
}

// Cloudflare Turnstile bot check, only when the gateway asks for it
// ("turnstileRequired"). Invisible for most visitors; the widget only shows
// up when Cloudflare wants an interaction. The gateway then hands out a pass
// (kept here) so later connects and reconnects skip the check.
export const TURNSTILE_PASS_KEY = "ws3.turnstilePass";
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
let turnstileScript: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  turnstileScript ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (api) resolve(api);
      else reject(new Error("turnstile missing"));
    };
    s.onerror = () => {
      turnstileScript = null;
      reject(new Error("turnstile blocked"));
    };
    document.head.appendChild(s);
  });
  return turnstileScript;
}
export async function getTurnstileToken(): Promise<string> {
  const { turnstileSiteKey } = await fetchGatewayInfo();
  if (typeof turnstileSiteKey !== "string") return "";
  try {
    const api = await loadTurnstile();
    const box = document.createElement("div");
    box.className = "ts-turnstile";
    document.body.appendChild(box);
    return await new Promise<string>((resolve) => {
      let id = "";
      const done = (token: string) => {
        if (id) api.remove(id);
        box.remove();
        resolve(token);
      };
      id = api.render(box, {
        sitekey: turnstileSiteKey,
        appearance: "interaction-only",
        callback: done,
        "error-callback": () => done(""),
        "timeout-callback": () => done(""),
      });
    });
  } catch {
    return "";
  }
}
