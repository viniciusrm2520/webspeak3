import { useEffect, useRef, useState } from "react";
import { type FileListEntry, formatBytes } from "../../app/model";
import { ftJoinPath } from "../../app/shared";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

function ftParentPath(dir: string): string {
  if (dir === "/" || dir === "") return "/";
  const trimmed = dir.replace(/\/+$/, "");
  const idx = trimmed.lastIndexOf("/");
  return idx <= 0 ? "/" : trimmed.slice(0, idx);
}

export function FileBrowserDialog({
  channelName,
  path,
  entries,
  onNavigate,
  onCreateDir,
  onDelete,
  onRename,
  onDownload,
  onUpload,
  onRefresh,
  onClose,
}: {
  channelName: string;
  path: string;
  entries: FileListEntry[] | null;
  onNavigate: (path: string) => void;
  onCreateDir: (name: string) => void;
  onDelete: (entry: FileListEntry) => void;
  onRename: (entry: FileListEntry, newName: string) => void;
  onDownload: (entry: FileListEntry) => void;
  onUpload: (file: File) => void;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [timedOut, setTimedOut] = useState(false);
  const [renaming, setRenaming] = useState<{ entry: FileListEntry; value: string } | null>(null);
  const [creatingDir, setCreatingDir] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimedOut(false);
    if (entries) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [entries, path]);

  const sorted =
    entries
      ?.slice()
      .sort((a, b) => (a.isFile === b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1)) ?? null;

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-file-browser-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>
            {t("fileBrowser.title")} - {channelName}
          </span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <div className="ts-file-browser-toolbar">
            <button onClick={() => onNavigate(ftParentPath(path))} disabled={path === "/"} title={t("fileBrowser.up")}>
              ⬆ {t("fileBrowser.up")}
            </button>
            <span className="ts-file-browser-path">{path}</span>
            <button onClick={onRefresh} title={t("fileBrowser.refresh")}>
              🔄
            </button>
            <button onClick={() => setCreatingDir(true)} title={t("fileBrowser.newFolder")}>
              🗀 {t("fileBrowser.newFolder")}
            </button>
            <button onClick={() => fileInputRef.current?.click()} title={t("fileBrowser.upload")}>
              ⬆️ {t("fileBrowser.upload")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
          </div>
          {creatingDir && (
            <form
              className="ts-dialog-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (newDirName.trim()) onCreateDir(newDirName.trim());
                setNewDirName("");
                setCreatingDir(false);
              }}
            >
              <input
                autoFocus
                value={newDirName}
                onChange={(e) => setNewDirName(e.target.value)}
                placeholder={t("fileBrowser.folderName")}
              />
              <button type="submit">{t("dialog.ok")}</button>
              <button type="button" onClick={() => setCreatingDir(false)}>
                {t("dialog.cancel")}
              </button>
            </form>
          )}
          {!sorted ? (
            <div className="ts-connection-info-loading">
              {timedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
            </div>
          ) : sorted.length === 0 ? (
            <div className="ts-connection-info-loading">{t("fileBrowser.empty")}</div>
          ) : (
            <div className="ts-permission-overview-scroll">
              <table className="ts-ban-list-table">
                <thead>
                  <tr>
                    <th>{t("fileBrowser.name")}</th>
                    <th>{t("fileBrowser.size")}</th>
                    <th>{t("fileBrowser.modified")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry) => (
                    <tr key={entry.name}>
                      <td>
                        {renaming?.entry.name === entry.name ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (renaming.value.trim()) onRename(entry, renaming.value.trim());
                              setRenaming(null);
                            }}
                          >
                            <input
                              autoFocus
                              value={renaming.value}
                              onChange={(ev) => setRenaming({ entry, value: ev.target.value })}
                              onBlur={() => setRenaming(null)}
                            />
                          </form>
                        ) : entry.isFile ? (
                          <span>📄 {entry.name}</span>
                        ) : (
                          <button
                            className="ts-link-button"
                            onClick={() => onNavigate(ftJoinPath(path, entry.name))}
                          >
                            📁 {entry.name}
                          </button>
                        )}
                      </td>
                      <td>{entry.isFile ? formatBytes(entry.size) : ""}</td>
                      <td>{entry.timestamp}</td>
                      <td className="ts-file-browser-actions">
                        {entry.isFile && (
                          <button onClick={() => onDownload(entry)} title={t("fileBrowser.download")}>
                            ⬇
                          </button>
                        )}
                        <button
                          onClick={() => setRenaming({ entry, value: entry.name })}
                          title={t("fileBrowser.rename")}
                        >
                          ✏
                        </button>
                        <button onClick={() => onDelete(entry)} title={t("fileBrowser.delete")}>
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
