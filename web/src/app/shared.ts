import type { ClientInfo } from "./model";
import type { PttBinding } from "./prefs";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking right after click() can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function formatDurationSecs(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Converts an ISO 3166-1 alpha-2 country code (e.g. "DE") to its flag emoji
 *  via Unicode regional indicator symbols. Returns null for codes the server
 *  doesn't report (empty string - common when geo-IP isn't configured). */
export function countryFlag(code: string): string | null {
  if (!/^[A-Za-z]{2}$/.test(code)) return null;
  const codePoints = [...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

/** Survives ChannelTree remounts when Select's setState rebuilds the tree.
 *  Keyed per session (multi-join tab) so a click in one tab's tree can never
 *  be paired with a click in another tab's tree as a false double-click. */
export const lastChannelClickBySession = new Map<string, { id: number; at: number }>();

export const FEEDBACK_BUBBLE_STORAGE_KEY = "webspeak3.feedbackBubble.lastShown";

/** Builds the full channel-relative path TS3's ft* commands expect (e.g.
 *  "/foo/bar.txt") from a directory and a bare entry name. */
export function ftJoinPath(dir: string, name: string): string {
  const base = dir === "/" || dir === "" ? "" : dir.replace(/\/+$/, "");
  return `${base}/${name}`;
}

/** Sniffs an image MIME type from decoded bytes so uploaded icons (which can
 *  be PNG/GIF/JPEG/BMP) render correctly as data URIs regardless of format. */
function sniffImageMime(binary: string): string {
  if (binary.startsWith("\x89PNG")) return "image/png";
  if (binary.startsWith("GIF87a") || binary.startsWith("GIF89a")) return "image/gif";
  if (binary.charCodeAt(0) === 0xff && binary.charCodeAt(1) === 0xd8) return "image/jpeg";
  if (binary.startsWith("BM")) return "image/bmp";
  return "image/png";
}

export function iconDataUrl(base64: string): string {
  return `data:${sniffImageMime(atob(base64))};base64,${base64}`;
}

// TeamSpeak keeps a client's avatar as /avatar_<uid> in channel 0's files,
// with the UID's decoded bytes spelled as one letter a-p per nibble.
export function avatarPath(uid: string): string | null {
  try {
    const letters = [...atob(uid)].map((ch) => {
      const b = ch.charCodeAt(0);
      return String.fromCharCode(97 + (b >> 4), 97 + (b & 15));
    });
    return letters.length ? `/avatar_${letters.join("")}` : null;
  } catch {
    return null;
  }
}

/** Data URL of a client's downloaded avatar, or null to fall back to initials. */
export function clientAvatarUrl(client: ClientInfo, images: Record<string, string>): string | null {
  const path = client.avatarHash ? avatarPath(client.uid) : null;
  const base64 = path ? images[path] : undefined;
  return base64 ? iconDataUrl(base64) : null;
}

// IDs below this are TeamSpeak's built-in default group icons - they ship
// inside the official client and were never uploaded to the server's icon
// filebase, so downloadFile() for them just hangs forever (nothing to send
// back). We don't have those graphics to embed, so those get a generic
// colored-letter badge instead; only real custom uploads (id >= threshold)
// are fetched as actual images.
export const CUSTOM_ICON_ID_THRESHOLD = 1000;

/** Deterministic color for a group's letter badge - same icon id always
 *  produces the same hue, so a group looks consistent across the tree
 *  without needing the real (unavailable) TeamSpeak icon graphics. */
export function groupBadgeColor(iconId: number): string {
  const hue = (iconId * 47) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

export const OPTIONS_SECTIONS = [
  { id: "anwendung", icon: "🎧" },
  { id: "konto", icon: "👤" },
  { id: "wiedergabe", icon: "🔊" },
  { id: "aufnahme", icon: "🎙️" },
  { id: "sounds", icon: "🔔" },
  { id: "design", icon: "🖌️" },
  { id: "erweiterungen", icon: "🧩" },
  { id: "hotkeys", icon: "⌨️" },
  { id: "whispern", icon: "🤫" },
  { id: "downloads", icon: "⬇️" },
  { id: "chat", icon: "💬" },
  { id: "sicherheit", icon: "🛡️" },
  { id: "nachrichten", icon: "🔤" },
  { id: "meldungen", icon: "ℹ️" },
] as const;

/** ptt-helper connection: off (not wanted), nokey (nothing to watch yet),
 *  missing (not running), connected, unsupported (can't watch a chosen key),
 *  outdated (a 0.1 helper, which only knows the push-to-talk key). */
export type PttHelperStatus = "off" | "nokey" | "missing" | "connected" | "unsupported" | "outdated";

export interface AudioSettings {
  outputDevices: MediaDeviceInfo[];
  outputDeviceId: string;
  onOutputDeviceChange: (id: string, label?: string) => void;
  onRefreshOutputDevices: () => void;
  playbackVolume: number;
  onPlaybackVolumeChange: (v: number) => void;
  autoVolume: boolean;
  onAutoVolumeChange: (v: boolean) => void;
  ownMicClicks: boolean;
  onOwnMicClicksChange: (v: boolean) => void;
  otherMicClicks: boolean;
  onOtherMicClicksChange: (v: boolean) => void;
  onPlayTestTone: () => void;
  inputDevices: MediaDeviceInfo[];
  inputDeviceId: string;
  onInputDeviceChange: (id: string) => void;
  onRefreshInputDevices: () => void;
  micOn: boolean;
  micLevelRef: React.MutableRefObject<number>;
  micTestOn: boolean;
  onToggleMicTest: () => void;
  vadThreshold: number;
  onVadThresholdChange: (v: number) => void;
  vadHangover: number;
  onVadHangoverChange: (v: number) => void;
  pushToTalk: boolean;
  onPushToTalkChange: (on: boolean) => void;
  continuous: boolean;
  onContinuousChange: (on: boolean) => void;
  typingAttenuation: boolean;
  onTypingAttenuationChange: (on: boolean) => void;
  pttBinding: PttBinding | null;
  onPttBindingChange: (binding: PttBinding) => void;
  muteBinding: PttBinding | null;
  onMuteBindingChange: (binding: PttBinding | null) => void;
  globalPtt: boolean;
  onGlobalPttChange: (on: boolean) => void;
  pttHelperStatus: PttHelperStatus;
  noiseSuppressionEnabled: boolean;
  onToggleNoiseSuppression: () => void;
  echoCancellationEnabled: boolean;
  onToggleEchoCancellation: () => void;
  autoGainControlEnabled: boolean;
  onToggleAutoGainControl: () => void;
  aec3Enabled: boolean;
  aec3Loading: boolean;
  onToggleAec3: () => void;
}
