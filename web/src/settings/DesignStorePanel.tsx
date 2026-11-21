import { useEffect, useState } from "react";
import { STORE_URL } from "../app/config";
import {
  type CustomTheme,
  type DesignTheme,
  isDesignTheme,
  STORE_ADMIN_TOKEN_KEY,
  STORE_SCREENSHOT_MAX_DATA_URL_LENGTH,
  type StoreThemeSummary,
} from "../app/prefs";
import { useT } from "../i18n";

/** Browse community-submitted designs (GET STORE_URL) and publish one of the
 *  viewer's own custom themes (POST STORE_URL) - see gateway/src/index.ts's
 *  /api/store/themes handler. Reports "unavailable" rather than erroring when
 *  the gateway has STORE_ENABLED off (the default), same as a 404. */
export function DesignStorePanel({
  customThemes,
  onInstall,
  onClose,
}: {
  customThemes: CustomTheme[];
  onInstall: (theme: { name: string; baseTheme: DesignTheme; css: string }) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [themes, setThemes] = useState<StoreThemeSummary[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [publishTarget, setPublishTarget] = useState("");
  const [publishAuthor, setPublishAuthor] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishScreenshot, setPublishScreenshot] = useState<string | null>(null);
  const [publishAdminToken, setPublishAdminToken] = useState(
    () => localStorage.getItem(STORE_ADMIN_TOKEN_KEY) ?? ""
  );
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<"ok" | "pending" | "duplicate" | "error" | null>(null);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  const refreshThemes = () =>
    fetch(STORE_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<StoreThemeSummary[]>;
      })
      .then(setThemes)
      .catch(() => setUnavailable(true));

  useEffect(() => {
    refreshThemes();
    // Only ever needs to run once per panel open - refreshThemes is re-created
    // each render but doesn't depend on any prop/state that would need it here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async (id: string) => {
    try {
      const res = await fetch(`${STORE_URL}/${id}`);
      if (!res.ok) throw new Error(String(res.status));
      const parsed = await res.json();
      if (
        !parsed ||
        typeof parsed.name !== "string" ||
        !isDesignTheme(parsed.baseTheme) ||
        typeof parsed.css !== "string"
      ) {
        throw new Error("invalid");
      }
      onInstall({ name: parsed.name, baseTheme: parsed.baseTheme, css: parsed.css });
      setInstalledIds((prev) => new Set(prev).add(id));
    } catch {
      window.alert(t("design.custom.importError"));
    }
  };

  const handleScreenshotChange = (file: File | undefined) => {
    if (!file) {
      setPublishScreenshot(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl.length > STORE_SCREENSHOT_MAX_DATA_URL_LENGTH) {
        window.alert(t("design.store.publish.screenshotTooLarge"));
        return;
      }
      setPublishScreenshot(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    const theme = customThemes.find((c) => c.id === publishTarget);
    if (!theme) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const token = publishAdminToken.trim();
      if (token) localStorage.setItem(STORE_ADMIN_TOKEN_KEY, token);
      const res = await fetch(STORE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: theme.name,
          baseTheme: theme.baseTheme,
          css: theme.css,
          author: publishAuthor.trim() || undefined,
          description: publishDescription.trim() || undefined,
          screenshot: publishScreenshot ?? undefined,
        }),
      });
      if (res.status === 409) {
        setPublishResult("duplicate");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json().catch(() => ({}))) as { status?: string };
      setPublishResult(body.status === "pending" ? "pending" : "ok");
      setPublishAuthor("");
      setPublishDescription("");
      setPublishScreenshot(null);
      await refreshThemes();
    } catch {
      setPublishResult("error");
    } finally {
      setPublishing(false);
    }
  };

  const handleRate = async (id: string, stars: number) => {
    setRatedIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`${STORE_URL}/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const parsed = await res.json();
      setThemes(
        (prev) => prev?.map((th) => (th.id === id ? { ...th, rating: parsed.rating } : th)) ?? prev
      );
    } catch {
      // Vote didn't count (already rated, offline, etc.) - the star stays marked
      // used locally so the person doesn't just click it again; no error UI needed
      // for what's a nice-to-have.
    }
  };

  return (
    <>
      <div className="ts-design-store-header">
        <button className="ts-design-store-back" onClick={onClose}>
          ← {t("design.store.back")}
        </button>
        <h3>{t("design.store.title")}</h3>
      </div>
      {unavailable ? (
        <p className="ts-options-subtitle">{t("design.store.unavailable")}</p>
      ) : themes === null ? (
        <p className="ts-options-subtitle">{t("design.store.loading")}</p>
      ) : (
        <>
          <div className="ts-design-theme-grid">
            {themes.length === 0 && <p className="ts-options-subtitle">{t("design.store.empty")}</p>}
            {themes.map((theme) => (
              <div key={theme.id} className="ts-design-theme-card ts-design-theme-card-custom">
                {theme.hasScreenshot && (
                  <img
                    className="ts-design-theme-card-screenshot"
                    src={`${STORE_URL}/${theme.id}/screenshot`}
                    alt={t("design.store.screenshotAlt", { name: theme.name })}
                  />
                )}
                <div className="ts-design-theme-card-select">
                  <span className="ts-design-theme-swatch ts-design-theme-swatch-custom" />
                  <span className="ts-design-theme-card-name">{theme.name}</span>
                  <span className="ts-design-theme-card-desc">{t("design.store.by", { author: theme.author })}</span>
                </div>
                {theme.description && <p className="ts-design-theme-card-desc">{theme.description}</p>}
                <div className="ts-design-theme-card-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="ts-design-theme-card-star"
                      disabled={ratedIds.has(theme.id)}
                      onClick={() => handleRate(theme.id, star)}
                      title={t("design.store.rating.rate", { stars: String(star) })}
                    >
                      {star <= Math.round(theme.rating.average) ? "★" : "☆"}
                    </button>
                  ))}
                  <span className="ts-design-theme-card-rating-count">
                    {theme.rating.count > 0
                      ? t("design.store.rating.summary", {
                          average: theme.rating.average.toFixed(1),
                          count: String(theme.rating.count),
                        })
                      : t("design.store.rating.none")}
                  </span>
                </div>
                <div className="ts-design-store-card-actions">
                  <button onClick={() => handleInstall(theme.id)} disabled={installedIds.has(theme.id)}>
                    {installedIds.has(theme.id) ? t("design.store.installed") : t("design.store.install")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h3>{t("design.store.publishTitle")}</h3>
          {customThemes.length === 0 ? (
            <p className="ts-options-subtitle">{t("design.store.publish.none")}</p>
          ) : (
            <>
              <label className="ts-options-field">
                {t("design.store.publish.select")}
                <select value={publishTarget} onChange={(e) => setPublishTarget(e.target.value)}>
                  <option value="" />
                  {customThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ts-options-field">
                {t("design.store.publish.author")}
                <input
                  value={publishAuthor}
                  onChange={(e) => setPublishAuthor(e.target.value)}
                  placeholder={t("design.store.publish.authorPlaceholder")}
                />
              </label>
              <label className="ts-options-field">
                {t("design.store.publish.description")}
                <textarea
                  value={publishDescription}
                  onChange={(e) => setPublishDescription(e.target.value)}
                  placeholder={t("design.store.publish.descriptionPlaceholder")}
                  maxLength={300}
                  rows={3}
                />
              </label>
              <label className="ts-options-field">
                {t("design.store.publish.screenshot")}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleScreenshotChange(e.target.files?.[0])}
                />
              </label>
              <label className="ts-options-field">
                {t("design.store.publish.adminToken")}
                <input
                  type="password"
                  value={publishAdminToken}
                  onChange={(e) => setPublishAdminToken(e.target.value)}
                  placeholder={t("design.store.publish.adminTokenPlaceholder")}
                />
              </label>
              <button className="ts-design-store-publish-submit" onClick={handlePublish} disabled={!publishTarget || publishing}>
                {t("design.store.publish.submit")}
              </button>
              {publishResult === "ok" && <p className="ts-options-subtitle">{t("design.store.publish.success")}</p>}
              {publishResult === "pending" && <p className="ts-options-subtitle">{t("design.store.publish.pending")}</p>}
              {publishResult === "duplicate" && <p className="ts-options-subtitle">{t("design.store.publish.duplicate")}</p>}
              {publishResult === "error" && <p className="ts-options-subtitle">{t("design.store.publish.error")}</p>}
            </>
          )}
        </>
      )}
    </>
  );
}
