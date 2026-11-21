import { useEffect, useRef, useState } from "react";
import type { FileListEntry } from "../../app/model";
import { iconDataUrl } from "../../app/shared";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

/** The icon repository lives under TS3's special "channel 0" - not a real,
 *  selectable channel, just the server-wide filebase icons are stored in.
 *  Icon files are always named "icon_<id>", where <id> is what a server/
 *  channel/group's icon field references. Reuses the same ftlist/download/
 *  upload/delete plumbing as the per-channel file browser. */
export function ServerIconsDialog({
  entries,
  images,
  onUpload,
  onDelete,
  onClose,
}: {
  entries: FileListEntry[] | null;
  images: Record<string, string>;
  onUpload: (iconId: number, file: File) => void;
  onDelete: (entry: FileListEntry) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [timedOut, setTimedOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [newIconId, setNewIconId] = useState("");

  useEffect(() => {
    setTimedOut(false);
    if (entries) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [entries]);

  const nextFreeId = () => {
    const ids = (entries ?? [])
      .map((e) => parseInt(e.name.replace("icon_", ""), 10))
      .filter((n) => !Number.isNaN(n));
    return (ids.length ? Math.max(...ids) : 99) + 1;
  };

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-server-icons-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("serverIcons.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <div className="ts-file-browser-toolbar">
            <button
              onClick={() => {
                setNewIconId(String(nextFreeId()));
                fileInputRef.current?.click();
              }}
              title={t("serverIcons.upload")}
            >
              ⬆️ {t("serverIcons.upload")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) setPendingFile(file);
              }}
            />
          </div>
          {pendingFile && (
            <form
              className="ts-dialog-row"
              onSubmit={(e) => {
                e.preventDefault();
                const id = parseInt(newIconId, 10);
                if (!Number.isNaN(id) && pendingFile) onUpload(id, pendingFile);
                setPendingFile(null);
              }}
            >
              <label className="ts-dialog-field">
                {t("serverIcons.iconId")}
                <input
                  type="number"
                  autoFocus
                  value={newIconId}
                  onChange={(e) => setNewIconId(e.target.value)}
                />
              </label>
              <button type="submit">{t("dialog.ok")}</button>
              <button type="button" onClick={() => setPendingFile(null)}>
                {t("dialog.cancel")}
              </button>
            </form>
          )}
          {!entries ? (
            <div className="ts-connection-info-loading">
              {timedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
            </div>
          ) : entries.length === 0 ? (
            <div className="ts-connection-info-loading">{t("serverIcons.empty")}</div>
          ) : (
            <div className="ts-server-icons-grid">
              {entries.map((entry) => {
                const path = `/${entry.name}`;
                const base64 = images[path];
                return (
                  <div className="ts-server-icons-tile" key={entry.name}>
                    {base64 ? (
                      <img src={iconDataUrl(base64)} alt={entry.name} />
                    ) : (
                      <div className="ts-server-icons-tile-loading" />
                    )}
                    <span>{entry.name.replace("icon_", "#")}</span>
                    <button onClick={() => onDelete(entry)} title={t("fileBrowser.delete")}>
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="ts-dialog-buttons">
          <div />
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
