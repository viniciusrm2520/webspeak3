import { useEffect, useState } from "react";
import { NEWS_CONFIG_URL, NEWS_FEED_URL } from "../app/config";
import { OPTIONS_SECTIONS } from "../app/shared";
import { useT } from "../i18n";

/** Small donation pill, pinned to the bottom right corner. */
type NewsItem =
  | { id: string; kind: "text"; text: string; url?: string }
  | { id: string; kind: "release"; version: string; url: string }
  | { id: string; kind: "theme"; name: string; author: string };

const NEWS_DISMISSED_STORAGE_KEY = "webspeak3.newsTicker.dismissed";

/** Hash links that open a dialog in this client (#about, #options/<section>). */
const isInAppHash = (hash: string) => hash === "#about" || OPTIONS_SECTIONS.some((s) => hash === `#options/${s.id}`);

// Like the scrolling news line at the bottom of the native TS3 client.
// Dismissing hides the current set of items until a new one shows up.
export function NewsTicker() {
  const t = useT();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(NEWS_DISMISSED_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    const getJson = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    };
    const load = async () => {
      // A gateway older than the ticker answers 404: treat it as the default.
      const config = (NEWS_CONFIG_URL ? await getJson(NEWS_CONFIG_URL).catch(() => null) : null) ?? {
        enabled: true,
        central: true,
        items: [],
      };
      if (!config.enabled) return setItems([]);
      const central = config.central ? ((await getJson(NEWS_FEED_URL).catch(() => null))?.items ?? []) : [];
      setItems([...config.items, ...central]);
    };
    void load();
    const timer = window.setInterval(() => void load(), 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const key = items.map((i) => i.id).join(",");
  if (!items.length || key === dismissed) return null;

  const label = (item: NewsItem) =>
    item.kind === "release"
      ? t("news.release", { version: item.version })
      : item.kind === "theme"
        ? t("news.theme", { name: item.name, author: item.author })
        : item.text;
  const entries = items.map((item) => {
    const url = item.kind === "theme" ? undefined : item.url;
    // https://…/#options/konto or #about: open the dialog here instead of a new tab.
    const inApp = url && isInAppHash(new URL(url).hash);
    return (
      <span key={item.id} className="ts-news-item">
        {inApp ? (
          <a href={new URL(url).hash}>{label(item)}</a>
        ) : url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {label(item)}
          </a>
        ) : (
          label(item)
        )}
      </span>
    );
  });

  return (
    <div className="ts-news-ticker">
      <span className="ts-news-label">{t("news.label")}</span>
      <div className="ts-news-track">
        {/* Duration from the distance travelled (track + text), so the speed is
            the same ~45 px/s on every screen width. */}
        <div
          className="ts-news-scroll"
          ref={(el) => {
            if (el) el.style.animationDuration = `${el.scrollWidth / 45}s`;
          }}
        >
          {entries}
        </div>
      </div>
      <button
        className="ts-news-close"
        title={t("dialog.close")}
        aria-label={t("dialog.close")}
        onClick={() => {
          setDismissed(key);
          try {
            localStorage.setItem(NEWS_DISMISSED_STORAGE_KEY, key);
          } catch {
            // ignore
          }
        }}
      >
        ✕
      </button>
    </div>
  );
}
