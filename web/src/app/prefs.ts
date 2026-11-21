import { createContext } from "react";
import { type ChatSettings, DEFAULT_CHAT_SETTINGS } from "../chatlog";
import { DEFAULT_DOWNLOAD_SETTINGS, type DownloadSettings } from "../downloads";
import type { IconPack } from "../iconpack";
import { LAST_NICKNAME_KEY, type ServerType } from "./config";

/** Everything needed to (re)open a gateway connection for one session, kept
 *  around per session id so a dropped socket — active tab or a parked
 *  background one — can be silently reconnected. */
export type ConnectParams = {
  host: string;
  nickname: string;
  serverPassword: string;
  channelPassword: string;
  defaultChannel: string;
  privilegeKey: string;
  /** TeamSpeak 2 registered account (anonymous when empty). */
  loginName?: string;
  loginPassword?: string;
  serverType: ServerType;
  identityId: string | null;
  favoriteId: string | null;
};
/** Identity persisted across sessions so the server sees the same client UID
 *  each time, instead of a fresh one being generated per connection. */
const IDENTITY_KEY = "webspeak3:identity";
export const IDENTITIES_KEY = "webspeak3:identities";
export const ACTIVE_IDENTITY_KEY = "webspeak3:active-identity";

export interface Identity {
  id: string;
  name: string;
  /** Per-identity nickname/phonetic nickname, like the native client - selecting
   *  an identity in the connect dialog fills these in. Empty until first set. */
  nickname: string;
  phoneticName: string;
  /** Opaque tsclientlib identity blob - null until the first successful connect generates one. */
  blob: string | null;
}

// randomId() only exists in a secure context, so it is missing on a
// plain-http origin - which is exactly how a self-hosted instance is reached
// on a LAN before TLS is set up. It used to throw at module load and leave a
// blank page; these ids are local identifiers, not secrets, so fall back.
export function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// One-time migration from the old single flat identity key to a list of named
// identities (so users can maintain more than one persona), and to seed a
// default entry for users who never had one either. Runs once at module load.
(function ensureIdentitiesSeeded() {
  if (localStorage.getItem(IDENTITIES_KEY) !== null) return;
  const legacyBlob = localStorage.getItem(IDENTITY_KEY);
  const legacyNickname = localStorage.getItem(LAST_NICKNAME_KEY) ?? "";
  const id = randomId();
  const identities: Identity[] = [
    { id, name: "Standard", nickname: legacyNickname, phoneticName: "", blob: legacyBlob },
  ];
  localStorage.setItem(IDENTITIES_KEY, JSON.stringify(identities));
  localStorage.setItem(ACTIVE_IDENTITY_KEY, id);
  localStorage.removeItem(IDENTITY_KEY);
})();

export function loadIdentities(): Identity[] {
  try {
    const raw = localStorage.getItem(IDENTITIES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Identity>[]) : [];
    if (parsed.length > 0) {
      // Backfill fields older saves (before per-identity nickname/phonetic
      // name existed) don't have.
      return parsed.map((i) => ({
        id: i.id ?? randomId(),
        name: i.name ?? "Standard",
        nickname: i.nickname ?? "",
        phoneticName: i.phoneticName ?? "",
        blob: i.blob ?? null,
      }));
    }
  } catch {
    // fall through
  }
  return [{ id: randomId(), name: "Standard", nickname: "", phoneticName: "", blob: null }];
}

export const FAVORITES_KEY = "webspeak3:favorites";
export const INPUT_DEVICE_KEY = "webspeak3:input-device";
export const PLAYBACK_VOLUME_KEY = "webspeak3:playback-volume";
export const NOISE_SUPPRESSION_KEY = "webspeak3:noise-suppression";
export const ECHO_CANCELLATION_KEY = "webspeak3:echo-cancellation";
export const AUTO_GAIN_CONTROL_KEY = "webspeak3:auto-gain-control";
export const AUTO_VOLUME_KEY = "webspeak3:auto-volume";
export const OWN_MIC_CLICKS_KEY = "webspeak3:own-mic-clicks";
export const OTHER_MIC_CLICKS_KEY = "webspeak3:other-mic-clicks";
export const AEC3_ENABLED_KEY = "webspeak3:aec3-enabled";
export const VAD_HANGOVER_KEY = "webspeak3:vad-hangover";
export const PUSH_TO_TALK_KEY = "webspeak3:push-to-talk";
export const CONTINUOUS_KEY = "webspeak3:continuous-transmission";
export const TYPING_ATTENUATION_KEY = "webspeak3:typing-attenuation";
export const PTT_BINDING_KEY = "webspeak3:ptt-key";
export const DESIGN_THEME_KEY = "webspeak3:design-theme";
// The user's actual pick - "standard" | "nova" | "pulse" | "ide" | "custom:<id>".
// DESIGN_THEME_KEY above keeps tracking just the resolved structural base, since a
// couple of early call sites (e.g. the host-field default below) need that cheaply,
// before customThemes is loaded.
export const DESIGN_SELECTION_KEY = "webspeak3:design-selection";
const CUSTOM_THEMES_KEY = "webspeak3:custom-themes";

export type DesignTheme = "standard" | "nova" | "pulse" | "ide";

/** A user-authored theme package: a name, which built-in layout it behaves like
 *  (Standard's plain chrome, Nova's collapsed menu/splash, Pulse's card/sidebar
 *  layout or IDE), and raw CSS that gets injected while it's
 *  active - free-form, so it can restyle or even reflow the existing markup
 *  (e.g. via flex `order`, `display:none`, overlays). */
export type CustomTheme = {
  id: string;
  name: string;
  baseTheme: DesignTheme;
  css: string;
};

/** Metadata for one theme listed by GET /api/store/themes - deliberately
 *  without `css`, so browsing the store doesn't pull every submission's full
 *  stylesheet up front. The full package (matching CustomTheme's export
 *  shape) is fetched separately per-id on install, see STORE_URL above. */
export type StoreThemeSummary = {
  id: string;
  name: string;
  baseTheme: DesignTheme;
  author: string;
  description: string;
  hasScreenshot: boolean;
  rating: { average: number; count: number };
  createdAt: string;
};

// The operator's own admin token for publishing under a reserved author name
// (see STORE_RESERVED_AUTHORS in gateway/src/index.ts) - kept in localStorage
// so it only has to be entered once per browser, same idea as the last-used
// connection fields above.
export const STORE_ADMIN_TOKEN_KEY = "webspeak3:store-admin-token";

// Mirrors the gateway's STORE_SCREENSHOT_MAX_DATA_URL_LENGTH - checked client-side
// too so a rejected upload doesn't cost a round trip.
export const STORE_SCREENSHOT_MAX_DATA_URL_LENGTH = 400_000;

export function isDesignTheme(value: string): value is DesignTheme {
  return (
    value === "standard" || value === "nova" || value === "pulse" || value === "ide"
  );
}

function loadDesignTheme(): DesignTheme {
  const raw = localStorage.getItem(DESIGN_THEME_KEY);
  if (raw && isDesignTheme(raw)) return raw;
  return "standard";
}

export function resolveDesignThemeBase(selection: string, customThemes: CustomTheme[]): DesignTheme {
  if (selection.startsWith("custom:")) {
    // A removed base (e.g. the old GreenTeaSpeak theme) falls back to Standard.
    const base = customThemes.find((th) => `custom:${th.id}` === selection)?.baseTheme;
    return base && isDesignTheme(base) ? base : "standard";
  }
  return isDesignTheme(selection) ? selection : "standard";
}

export function designThemeClassName(theme: DesignTheme): string {
  if (theme === "nova") return " ts-design-nova";
  if (theme === "pulse") return " ts-design-pulse";
  if (theme === "ide") return " ts-design-ide";
  return " ts-design-standard";
}

export function designThemeLabel(theme: DesignTheme, t: (key: string) => string): string {
  if (theme === "nova") return t("design.theme.nova");
  if (theme === "pulse") return t("design.theme.pulse");
  if (theme === "ide") return t("design.theme.ide");
  return t("design.theme.standard");
}

export function loadCustomThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is CustomTheme =>
        v &&
        typeof v.id === "string" &&
        typeof v.name === "string" &&
        isDesignTheme(v.baseTheme) &&
        typeof v.css === "string"
    );
  } catch {
    return [];
  }
}

export function saveCustomThemes(list: CustomTheme[]) {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(list));
}

export function loadDesignSelection(): string {
  const raw = localStorage.getItem(DESIGN_SELECTION_KEY);
  // A removed builtin (e.g. "greenteaspeak") falls back to Standard.
  return raw && (raw.startsWith("custom:") || isDesignTheme(raw)) ? raw : loadDesignTheme();
}

export function loadBoolPref(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : raw === "1";
}

export interface PttBinding {
  code: string;
  label: string;
}

export function loadPttBinding(): PttBinding | null {
  try {
    const v = JSON.parse(localStorage.getItem(PTT_BINDING_KEY) ?? "null");
    return v && typeof v.code === "string" && typeof v.label === "string" ? v : null;
  } catch {
    return null;
  }
}

export function keyBindingLabel(e: KeyboardEvent): string {
  return e.key.length === 1 && e.key !== " " ? e.key.toUpperCase() : e.code;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export function loadNumberPref(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface Favorite {
  id: string;
  bookmarkName: string;
  nickname: string;
  host: string;
  serverPassword: string;
  defaultChannel: string;
  defaultChannelPassword: string;
  /** When true, ServerQuery clients appear in the channel tree. Default: false. */
  showServerQueryClients: boolean;
  /** Overrides Options -> Meldungen's sound pack for this server; unset = that one. */
  soundPack?: string;
}

export function normalizeFavorite(raw: Partial<Favorite> & Pick<Favorite, "id">): Favorite {
  return {
    id: raw.id,
    bookmarkName: typeof raw.bookmarkName === "string" ? raw.bookmarkName : "",
    nickname: typeof raw.nickname === "string" ? raw.nickname : "",
    host: typeof raw.host === "string" ? raw.host : "",
    serverPassword: typeof raw.serverPassword === "string" ? raw.serverPassword : "",
    defaultChannel: typeof raw.defaultChannel === "string" ? raw.defaultChannel : "",
    defaultChannelPassword:
      typeof raw.defaultChannelPassword === "string" ? raw.defaultChannelPassword : "",
    showServerQueryClients: raw.showServerQueryClients === true,
    ...(typeof raw.soundPack === "string" && raw.soundPack ? { soundPack: raw.soundPack } : {}),
  };
}

export function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is Partial<Favorite> & Pick<Favorite, "id"> => v && typeof v.id === "string")
      .map(normalizeFavorite);
  } catch {
    return [];
  }
}

// Only Chromium hands out tab/system audio via getDisplayMedia; Firefox and
// Safari return video only, so the button would just say "no audio" there.
// userAgentData itself only exists in Chromium-based browsers.
// Switched off for now (2026-10-03): clicks in the mix, and Edge delivers
// Windows system audio as silence. Code stays; flip back once that's solved.
export const TAB_AUDIO_SUPPORTED =
  false &&
  typeof navigator.mediaDevices?.getDisplayMedia === "function" &&
  !!(navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands.some(
    (b) => b.brand === "Chromium"
  );
const AWAY_PRESETS_KEY = "webspeak3:away-presets";
/** "off" hides the server banner: it loads from whatever host the server
 *  admin picked, which then sees the viewer's IP (review S12). */
export const SERVER_BANNER_KEY = "webspeak3:server-banner";
export const IDE_PIXEL_FONT_KEY = "webspeak3:ide-pixel-font";
// Off by default: an inline chat image loads from whatever host the sender picked.
export const CHAT_IMAGES_KEY = "webspeak3:chat-images";
export const WHISPER_SETTINGS_KEY = "webspeak3:whisper-settings";

/** Options -> Whispern (TS3's "Whispereinstellungen"). */
export interface WhisperSettings {
  /** allow/block: what applies to contacts without their own whisper setting. */
  mode: "allow" | "block" | "blockAll";
  sound: boolean;
  openHistory: boolean;
  /** Incoming entries leave the whisper history after this many minutes; 0 = never. */
  clearAfterMin: number;
}

const DEFAULT_WHISPER_SETTINGS: WhisperSettings = { mode: "allow", sound: true, openHistory: true, clearAfterMin: 5 };

export function loadWhisperSettings(): WhisperSettings {
  try {
    return { ...DEFAULT_WHISPER_SETTINGS, ...JSON.parse(localStorage.getItem(WHISPER_SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_WHISPER_SETTINGS;
  }
}

export const APP_SETTINGS_KEY = "webspeak3:app-settings";

/** Options -> Anwendung. Read on use, so the socket handlers need no refs. */
export interface AppSettings {
  micOnServerSwitch: boolean;
  reconnectAfterSleep: boolean;
  middleClickQuickAccess: boolean;
  updateFavoriteNickname: boolean;
  autoOpenChannelChat: boolean;
  mutedTalkingSound: boolean;
  neverShowPokeDialog: boolean;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  micOnServerSwitch: true,
  reconnectAfterSleep: true,
  middleClickQuickAccess: true,
  updateFavoriteNickname: false,
  autoOpenChannelChat: false,
  mutedTalkingSound: false,
  neverShowPokeDialog: false,
};

export function loadAppSettings(): AppSettings {
  try {
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export const SECURITY_SETTINGS_KEY = "webspeak3:security-settings";
export const CHANNEL_PASSWORDS_KEY = "webspeak3:channel-passwords";

/** Options -> Sicherheit. */
export interface SecuritySettings {
  saveChannelPasswords: boolean;
  clearCacheOnExit: boolean;
  clearUrlsOnExit: boolean;
}

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  saveChannelPasswords: false,
  clearCacheOnExit: false,
  clearUrlsOnExit: false,
};

export function loadSecuritySettings(): SecuritySettings {
  try {
    return { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(localStorage.getItem(SECURITY_SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}

/** Saved channel passwords: server host -> channel id -> password. */
function loadChannelPasswords(): Record<string, Record<string, string>> {
  try {
    return JSON.parse(localStorage.getItem(CHANNEL_PASSWORDS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function storedChannelPassword(host: string, channelId: number): string | undefined {
  return loadChannelPasswords()[host.trim().toLowerCase()]?.[channelId];
}

/** null removes the entry. */
export function storeChannelPassword(host: string, channelId: number, password: string | null): void {
  const all = loadChannelPasswords();
  const key = host.trim().toLowerCase();
  const server = { ...all[key] };
  if (password === null) delete server[channelId];
  else server[channelId] = password;
  all[key] = server;
  localStorage.setItem(CHANNEL_PASSWORDS_KEY, JSON.stringify(all));
}

/** The service worker's CacheStorage; the app shell comes from the network until the worker refills it. */
export async function clearBrowserCaches(): Promise<void> {
  try {
    await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  } catch {
    // No CacheStorage (insecure context): nothing to clear.
  }
}

export const TREE_OPTIONS_KEY = "webspeak3:tree-options";

/** Design tab -> "Channel Baum" and "GIF Animation" (TS3's options). */
export interface TreeOptions {
  expandMode: "all" | "own";
  /** Channel levels to expand with expandMode "all"; 0 = every level. */
  expandDepth: number;
  clientsBelow: boolean;
  flags: boolean;
  groupIconsInMenus: boolean;
  commanderLamp: boolean;
  awayMessage: boolean;
  tooltips: boolean;
  animateAvatars: boolean;
  animateImages: boolean;
}

const DEFAULT_TREE_OPTIONS: TreeOptions = {
  expandMode: "all",
  expandDepth: 0,
  clientsBelow: false,
  flags: true,
  groupIconsInMenus: true,
  commanderLamp: false,
  awayMessage: true,
  tooltips: true,
  animateAvatars: true,
  animateImages: true,
};

export function loadTreeOptions(): TreeOptions {
  try {
    return { ...DEFAULT_TREE_OPTIONS, ...JSON.parse(localStorage.getItem(TREE_OPTIONS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_TREE_OPTIONS;
  }
}

/** Display prefs read deep in the tree; a context spares threading them through every level. */
export const DisplayPrefsContext = createContext<{
  tree: TreeOptions;
  setTree: (next: TreeOptions) => void;
  iconPacks: IconPack[];
  iconPackId: string;
  setIconPackId: (id: string) => void;
  saveIconPacks: (packs: IconPack[]) => void;
  whisper: WhisperSettings;
  setWhisper: (next: WhisperSettings) => void;
  downloads: DownloadSettings;
  setDownloads: (next: DownloadSettings) => void;
  downloadDir: FileSystemDirectoryHandle | null;
  setDownloadDir: (dir: FileSystemDirectoryHandle | null) => void;
  chat: ChatSettings;
  setChat: (next: ChatSettings) => void;
  security: SecuritySettings;
  setSecurity: (next: SecuritySettings) => void;
}>({
  tree: DEFAULT_TREE_OPTIONS,
  setTree: () => {},
  iconPacks: [],
  iconPackId: "",
  setIconPackId: () => {},
  saveIconPacks: () => {},
  whisper: DEFAULT_WHISPER_SETTINGS,
  setWhisper: () => {},
  downloads: DEFAULT_DOWNLOAD_SETTINGS,
  setDownloads: () => {},
  downloadDir: null,
  setDownloadDir: () => {},
  chat: DEFAULT_CHAT_SETTINGS,
  setChat: () => {},
  security: DEFAULT_SECURITY_SETTINGS,
  setSecurity: () => {},
});
const DISCONNECT_MESSAGE_KEY = "webspeak3:disconnect-message";
export const COLLECTED_URLS_KEY = "webspeak3:collected-urls";

export interface CollectedUrl {
  url: string;
  count: number;
  lastSeen: number;
  lastSender: string;
}

export function loadCollectedUrls(): CollectedUrl[] {
  try {
    const raw = localStorage.getItem(COLLECTED_URLS_KEY);
    return raw ? (JSON.parse(raw) as CollectedUrl[]) : [];
  } catch {
    return [];
  }
}

export type LogLevel = "critical" | "error" | "warning" | "info" | "debug";

export interface ClientLogEntry {
  id: number;
  timestamp: number;
  category: string;
  level: LogLevel;
  message: string;
}

export const LOG_LEVELS: LogLevel[] = ["critical", "error", "warning", "info", "debug"];
export const MAX_LOG_ENTRIES = 500;

export interface WhisperLogEntry {
  id: number;
  timestamp: number;
  description: string;
  /** Someone whispered to us (as opposed to our own whisper target changes). */
  incoming?: boolean;
}

export interface BanListEntry {
  banId: number;
  ip: string;
  name: string;
  uid: string;
  lastNickname: string;
  created: string;
  durationSecs: number;
  invokerName: string;
  reason: string;
  enforcements: number;
}

export interface ComplainListEntry {
  targetClientDbId: number;
  targetName: string;
  fromClientDbId: number;
  fromName: string;
  message: string;
  timestamp: string;
}

export interface OfflineMessageListEntry {
  messageId: number;
  clientUid: string;
  subject: string;
  timestamp: string;
  isRead: boolean;
}

export type ContactCategory = "acquaintance" | "blocked" | "friend";

export interface Contact {
  uid: string;
  customName: string;
  category: ContactCategory;
  phoneticName: string;
  ignored: boolean;
  /** Incoming whispers from this contact; unset follows Options -> Whispern. */
  whisper?: "allow" | "block";
}

export const CONTACTS_KEY = "webspeak3:contacts";
// Per-speaker playback volume by client UID (1 = unchanged), mixed in the
// connector. Keyed by UID so it follows a person across servers and reconnects.
export const CLIENT_VOLUMES_KEY = "webspeak3:client-volumes";

export function loadClientVolumes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CLIENT_VOLUMES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    return raw ? (JSON.parse(raw) as Contact[]) : [];
  } catch {
    return [];
  }
}

export interface MessagePreset {
  name: string;
  message: string;
}

/** A saved whisper target selection. Channels/clients are matched by name when
 *  activated (rather than by id), since ids are only stable for the current
 *  connection - the same names are what a user would recognize across sessions. */
export interface WhisperList {
  id: string;
  name: string;
  channelNames: string[];
  clientNames: string[];
}

export const WHISPER_LISTS_KEY = "webspeak3:whisper-lists";

export function loadWhisperLists(): WhisperList[] {
  try {
    const raw = localStorage.getItem(WHISPER_LISTS_KEY);
    return raw ? (JSON.parse(raw) as WhisperList[]) : [];
  } catch {
    return [];
  }
}

export function loadAwayPresets(): MessagePreset[] {
  try {
    const raw = localStorage.getItem(AWAY_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Older versions stored presets as plain strings (name == message) - migrate on read.
    return parsed.map((p) => (typeof p === "string" ? { name: p, message: p } : (p as MessagePreset)));
  } catch {
    return [];
  }
}

export function saveAwayPresets(presets: MessagePreset[]): void {
  localStorage.setItem(AWAY_PRESETS_KEY, JSON.stringify(presets));
}

export function loadDisconnectMessage(): string {
  return localStorage.getItem(DISCONNECT_MESSAGE_KEY) ?? "";
}

export function saveDisconnectMessage(message: string): void {
  localStorage.setItem(DISCONNECT_MESSAGE_KEY, message);
}
