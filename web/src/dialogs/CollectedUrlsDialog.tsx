import { useState } from "react";
import type { CollectedUrl } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function CollectedUrlsDialog({
  urls,
  onClear,
  onClose,
}: {
  urls: CollectedUrl[];
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const [search, setSearch] = useState("");
  const backdrop = useBackdropDismiss(onClose);

  const filtered = urls
    .filter((u) => u.url.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.lastSeen - a.lastSeen);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-collected-urls-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("collectedUrls.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <label className="ts-dialog-field">
            {t("collectedUrls.search")}
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <table className="ts-collected-urls-table">
            <thead>
              <tr>
                <th>{t("collectedUrls.url")}</th>
                <th>{t("collectedUrls.count")}</th>
                <th>{t("collectedUrls.lastSeen")}</th>
                <th>{t("collectedUrls.mentionedBy")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.url}>
                  <td>
                    <a href={u.url} target="_blank" rel="noreferrer noopener">
                      {u.url}
                    </a>
                  </td>
                  <td>{u.count}</td>
                  <td>{new Date(u.lastSeen).toLocaleString()}</td>
                  <td>{u.lastSender}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ts-dialog-buttons">
          <button onClick={onClear}>{t("collectedUrls.clearList")}</button>
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
