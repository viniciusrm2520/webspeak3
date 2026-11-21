import { useContext } from "react";
import { DisplayPrefsContext } from "../app/prefs";
import {
  canPickFolder,
  clearDownloadDir,
  type DownloadSettings,
  pickDownloadDir,
} from "../downloads";
import { useT } from "../i18n";

export function DownloadsPanel() {
  const t = useT();
  const { downloads, setDownloads, downloadDir, setDownloadDir } = useContext(DisplayPrefsContext);
  const set = (patch: Partial<DownloadSettings>) => setDownloads({ ...downloads, ...patch });
  const limitRow = (key: "uploadLimit" | "downloadLimit") => (
    <fieldset className="ts-options-fieldset">
      <legend>{t(`downloadSettings.${key}`)}</legend>
      <label className="ts-options-radio">
        <input type="radio" checked={downloads[key] === 0} onChange={() => set({ [key]: 0 })} />
        {t("downloadSettings.unlimited")}
      </label>
      <label className="ts-options-radio">
        <input type="radio" checked={downloads[key] > 0} onChange={() => set({ [key]: 5 })} />
        {t("downloadSettings.limitedTo")}
        <input
          type="number"
          min={1}
          className="ts-download-number"
          value={downloads[key] || 5}
          disabled={downloads[key] === 0}
          onChange={(e) => set({ [key]: Math.max(1, Number(e.target.value) || 1) })}
        />
        KiB/s
      </label>
    </fieldset>
  );
  const countRow = (key: "maxUploads" | "maxDownloads") => (
    <fieldset className="ts-options-fieldset">
      <legend>{t(`downloadSettings.${key}`)}</legend>
      <label className="ts-options-field">
        {t("downloadSettings.limitedTo")}
        <input
          type="number"
          min={1}
          className="ts-download-number"
          value={downloads[key]}
          onChange={(e) => set({ [key]: Math.max(1, Number(e.target.value) || 1) })}
        />
      </label>
    </fieldset>
  );
  return (
    <>
      <h3>{t("options.section.downloads")}</h3>
      <p className="ts-options-subtitle">{t("downloadSettings.subtitle")}</p>
      <div className="ts-options-fields">
        <fieldset className="ts-options-fieldset">
          <legend>{t("downloadSettings.directory")}</legend>
          <div className="ts-download-dir">
            {t("downloadSettings.directoryLabel")} <strong>{downloadDir?.name ?? t("downloadSettings.browserDefault")}</strong>
            <button
              disabled={!canPickFolder}
              onClick={() => void pickDownloadDir().then((dir) => dir && setDownloadDir(dir))}
            >
              {t("downloadSettings.change")}
            </button>
            {downloadDir && (
              <button onClick={() => void clearDownloadDir().then(() => setDownloadDir(null))}>
                {t("downloadSettings.reset")}
              </button>
            )}
          </div>
          <label className="ts-options-radio">
            <input type="radio" checked={downloads.saveMode === "dir"} onChange={() => set({ saveMode: "dir" })} />
            {t("downloadSettings.alwaysDir")}
          </label>
          <label className="ts-options-radio">
            <input
              type="radio"
              disabled={!canPickFolder}
              checked={downloads.saveMode === "ask"}
              onChange={() => set({ saveMode: "ask" })}
            />
            {t("downloadSettings.askEachTime")}
          </label>
          {!canPickFolder && <p className="ts-options-hint">{t("downloadSettings.unsupported")}</p>}
        </fieldset>
        <fieldset className="ts-options-fieldset">
          <legend>{t("downloadSettings.interface")}</legend>
          {(["showWindowOnStart", "closeWindowWhenDone", "popupWhenDone"] as const).map((key) => (
            <label key={key} className="ts-options-checkbox">
              <input type="checkbox" checked={downloads[key]} onChange={(e) => set({ [key]: e.target.checked })} />
              {t(`downloadSettings.${key}`)}
            </label>
          ))}
        </fieldset>
        <div className="ts-design-native">
          <div className="ts-design-col">
            {limitRow("uploadLimit")}
            {countRow("maxUploads")}
          </div>
          <div className="ts-design-col">
            {limitRow("downloadLimit")}
            {countRow("maxDownloads")}
          </div>
        </div>
      </div>
    </>
  );
}
