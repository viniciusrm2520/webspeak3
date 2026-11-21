import { useContext, useEffect, useState } from "react";
import type { GroupEntry } from "../../app/model";
import { DisplayPrefsContext } from "../../app/prefs";
import { GroupIcon } from "../../components/ChannelTree";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

export function GroupAssignDialog({
  kind,
  clientName,
  groups,
  currentGroupIds,
  iconImages,
  onSelect,
  onClose,
}: {
  kind: "channel" | "server";
  clientName: string;
  groups: GroupEntry[] | null;
  currentGroupIds: number[];
  iconImages: Record<string, string>;
  onSelect: (groupId: number, alreadyAssigned: boolean) => void;
  onClose: () => void;
}) {
  const t = useT();
  const { tree } = useContext(DisplayPrefsContext);
  const backdrop = useBackdropDismiss(onClose);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (groups) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [groups]);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-group-assign-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>
            {kind === "channel" ? t("groupAssign.channelTitle") : t("groupAssign.serverTitle")} - {clientName}
          </span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          {!groups ? (
            <div className="ts-connection-info-loading">
              {timedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
            </div>
          ) : groups.length === 0 ? (
            <div className="ts-connection-info-loading">{t("groupAssign.empty")}</div>
          ) : (
            <ul className="ts-group-assign-list">
              {groups.map((g) => {
                const assigned = currentGroupIds.includes(g.id);
                return (
                  <li key={g.id}>
                    <button
                      className={`ts-menu-item${assigned ? " ts-group-assign-current" : ""}`}
                      onClick={() => onSelect(g.id, assigned)}
                    >
                      <span className="ts-menu-item-icon">{assigned ? "✔️" : ""}</span>
                      {tree.groupIconsInMenus && g.iconId !== 0 && <GroupIcon group={g} images={iconImages} />}
                      <span className="ts-menu-item-label">{g.name}</span>
                      {kind === "server" && assigned && (
                        <span className="ts-group-assign-hint">{t("groupAssign.clickToRemove")}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
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
