import qrcode from "qrcode-generator";
import {
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ClientInfo } from "../app/model";
import { DisplayPrefsContext, keyBindingLabel, type PttBinding } from "../app/prefs";
import { clientAvatarUrl } from "../app/shared";
import { useT } from "../i18n";
import { StillImg } from "../lib/still";

// Streaming talks to TS6 over a protocol nobody published, so it is marked
// alpha everywhere the user can reach it: the settings dialog, both stream
// panels, and the toolbar button's tooltip.
export function AlphaBadge() {
  const t = useT();
  return (
    <span className="ts-alpha-badge" title={t("publish.alphaTitle")}>
      {t("publish.alpha")}
    </span>
  );
}

export function SegmentedChoice<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: string; title?: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="ts-segmented">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={option.value === value ? "ts-segmented-on" : ""}
          disabled={disabled || option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Line icons for the mobile shell (24px grid, stroke = currentColor). */
const MOBILE_ICONS = {
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  micOff: "M3 3l18 18M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V6a3 3 0 0 0-5.7-1.3M5 11a7 7 0 0 0 11.9 4.9M19 11a7 7 0 0 1-.6 2.8M12 18v3",
  sound: "M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13",
  soundOff: "M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6",
  leave: "M3.6 13.4c4.6-4.5 12.2-4.5 16.8 0l-2.3 2.3-3-1.3v-2.1a11 11 0 0 0-6.2 0v2.1l-3 1.3z",
  talk: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M2 8v4M22 8v4",
  tree: "M4 5h16M8 10h12M8 15h12M4 5v15M4 10h4M4 15h4M8 20h12M4 20h4",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
} as const;

export function MobileIcon({ name }: { name: keyof typeof MOBILE_ICONS }) {
  return (
    <svg className="ts-mobile-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={MOBILE_ICONS[name]} />
    </svg>
  );
}

/** The initials tile, or the real avatar once it has been downloaded. */
export function AvatarTile({
  client,
  images,
  className,
  isSelf,
}: {
  client: ClientInfo;
  images: Record<string, string>;
  className: string;
  isSelf: boolean;
}) {
  const url = clientAvatarUrl(client, images);
  const { tree } = useContext(DisplayPrefsContext);
  return (
    <span
      className={className}
      style={{ background: url ? undefined : isSelf ? "var(--accent)" : clientAvatarColor(client.name) }}
    >
      {url ? <StillImg still={!tree.animateAvatars} className="ts-avatar-img" src={url} alt="" /> : client.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Nova-theme-only: a stable per-name color for the client avatar chips,
 *  hashed from the name so the same person always gets the same color. */
function clientAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `oklch(0.6 0.13 ${hue})`;
}

export function PttKeyButton({ binding, onChange }: { binding: PttBinding | null; onChange: (b: PttBinding) => void }) {
  const t = useT();
  const [listening, setListening] = useState(false);
  useEffect(() => {
    if (!listening) return;
    // Capture phase on window: the next key or mouse button wins wherever the
    // pointer is, and never reaches the dialog (Escape) or the live PTT listener.
    const take = (e: Event, next?: PttBinding) => {
      e.preventDefault();
      e.stopPropagation();
      setListening(false);
      if (next) onChange(next);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") return setListening(false);
      take(e, e.key === "Escape" ? undefined : { code: e.code, label: keyBindingLabel(e) });
    };
    const onMouse = (e: MouseEvent) => {
      // Left click is how you started (and how you click away), so it can't be PTT.
      if (e.button === 0) return setListening(false);
      take(e, { code: `Mouse${e.button}`, label: `Mouse ${e.button + 1}` });
      // The back/forward side buttons navigate on release; keep the page.
      window.addEventListener("mouseup", (up) => up.preventDefault(), { capture: true, once: true });
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onMouse, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onMouse, true);
    };
  }, [listening, onChange]);
  return (
    <button className={listening ? "ts-ptt-key-listening" : undefined} onClick={() => setListening(true)}>
      {listening ? t("recording.pttKeyPress") : (binding?.label ?? t("recording.pttKeyNone"))}
    </button>
  );
}

export function MicLevelBar({ levelRef, active }: { levelRef: React.MutableRefObject<number>; active: boolean }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }
    let raf = 0;
    const tick = () => {
      setLevel(levelRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, levelRef]);
  const pct = Math.min(100, Math.round((level / 0.2) * 100));
  return (
    <div className="ts-options-level-track">
      <div className="ts-options-level-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** QR code as inline SVG (no data: URL, so no CSP img-src exception needed). */
export function QrCode({ text }: { text: string }) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n, d };
  }, [text]);
  return (
    <svg className="ts-sync-qr" viewBox={`-3 -3 ${n + 6} ${n + 6}`} width="220" height="220" role="img">
      <rect x={-3} y={-3} width={n + 6} height={n + 6} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

/** Shared stroke-icon wrapper for the custom-theme-card action row, so all
 *  four icons (edit/duplicate/export/delete) render at the same size and
 *  color - mixing text glyphs with an emoji (as before) made them look
 *  inconsistent across fonts/platforms. */
export function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
