import { useEffect, useState } from "react";
import type { BanListEntry } from "../../app/prefs";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

export function BanListDialog({
  entries,
  onDelete,
  onDeleteAll,
  onClose,
}: {
  entries: BanListEntry[] | null;
  onDelete: (banId: number) => void;
  onDeleteAll: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  // Same silent-decline story as connection-info/server-log: a guest account
  // without b_virtualserver_client_dblist/banlist permission never gets a reply.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (entries) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [entries]);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-ban-list-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("banList.title")}</span>
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
            <div className="ts-connection-info-loading">{t("banList.empty")}</div>
          ) : (
            <table className="ts-ban-list-table">
              <thead>
                <tr>
                  <th>{t("banList.name")}</th>
                  <th>{t("banList.ip")}</th>
                  <th>{t("banList.created")}</th>
                  <th>{t("banList.duration")}</th>
                  <th>{t("banList.invoker")}</th>
                  <th>{t("banList.reason")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.banId}>
                    <td>{e.name || e.lastNickname || "-"}</td>
                    <td>{e.ip || "-"}</td>
                    <td>{e.created}</td>
                    <td>{e.durationSecs === 0 ? t("banList.permanent") : `${e.durationSecs}s`}</td>
                    <td>{e.invokerName}</td>
                    <td>{e.reason}</td>
                    <td>
                      <button onClick={() => onDelete(e.banId)}>{t("banList.delete")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-left">
            {entries && entries.length > 0 && (
              <button onClick={onDeleteAll}>{t("banList.deleteAll")}</button>
            )}
          </div>
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
