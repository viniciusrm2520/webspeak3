import { useEffect, useState } from "react";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

export function ServerProtocolLogDialog({
  lines,
  onClose,
}: {
  lines: string[] | null;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  // The server may silently decline (e.g. missing b_virtualserver_log_view
  // permission) without ever replying - fall back to an error instead of
  // spinning forever.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (lines) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [lines]);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-server-protocol-log-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("serverProtocolLog.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          {!lines ? (
            <div className="ts-connection-info-loading">
              {timedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
            </div>
          ) : lines.length === 0 ? (
            <div className="ts-connection-info-loading">{t("serverProtocolLog.empty")}</div>
          ) : (
            <div className="ts-log-list">
              {lines.map((line, i) => (
                <div key={i} className="ts-server-protocol-log-line">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
