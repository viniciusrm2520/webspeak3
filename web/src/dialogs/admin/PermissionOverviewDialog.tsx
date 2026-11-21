import { useEffect, useState } from "react";
import type { PermissionOverviewEntry } from "../../app/model";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

export function PermissionOverviewDialog({
  entries,
  onClose,
}: {
  entries: PermissionOverviewEntry[] | null;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [search, setSearch] = useState("");
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (entries) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [entries]);

  const filtered = entries?.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())) ?? null;

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-permission-overview-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("permissionOverview.title")}</span>
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
            <div className="ts-connection-info-loading">{t("permissionOverview.empty")}</div>
          ) : (
            <>
              <div className="ts-dialog-row">
                <label className="ts-dialog-field ts-dialog-field-grow">
                  {t("clientLog.filter")}
                  <input value={search} onChange={(e) => setSearch(e.target.value)} />
                </label>
              </div>
              <div className="ts-permission-overview-scroll">
                <table className="ts-ban-list-table">
                  <thead>
                    <tr>
                      <th>{t("permissionOverview.name")}</th>
                      <th>{t("permissionOverview.value")}</th>
                      <th>{t("permissionOverview.negated")}</th>
                      <th>{t("permissionOverview.skip")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered!.map((e, i) => (
                      <tr key={`${e.name}-${i}`} title={e.description || undefined}>
                        <td>{e.name}</td>
                        <td>{e.value}</td>
                        <td>{e.negated ? "✔️" : ""}</td>
                        <td>{e.skip ? "✔️" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
