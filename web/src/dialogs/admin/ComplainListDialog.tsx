import { useEffect, useState } from "react";
import type { ComplainListEntry } from "../../app/prefs";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

export function ComplainListDialog({
  entries,
  onDelete,
  onClose,
}: {
  entries: ComplainListEntry[] | null;
  onDelete: (targetClientDbId: number, fromClientDbId: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (entries) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [entries]);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-complain-list-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("complainList.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          {!entries ? (
            <div className="ts-connection-info-loading">
              {timedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
            </div>
          ) : entries.length === 0 ? (
            <div className="ts-connection-info-loading">{t("complainList.empty")}</div>
          ) : (
            <table className="ts-ban-list-table">
              <thead>
                <tr>
                  <th>{t("complainList.target")}</th>
                  <th>{t("complainList.from")}</th>
                  <th>{t("complainList.message")}</th>
                  <th>{t("complainList.timestamp")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i}>
                    <td>{e.targetName}</td>
                    <td>{e.fromName}</td>
                    <td>{e.message}</td>
                    <td>{e.timestamp}</td>
                    <td>
                      <button onClick={() => onDelete(e.targetClientDbId, e.fromClientDbId)}>
                        {t("banList.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
