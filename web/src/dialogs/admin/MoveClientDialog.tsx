import type { ChannelInfo } from "../../app/model";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";
import { spacerDisplayName } from "../../lib/spacer";

export function MoveClientDialog({
  clientName,
  currentChannelId,
  channels,
  onSelect,
  onClose,
}: {
  clientName: string;
  currentChannelId: number;
  channels: ChannelInfo[];
  onSelect: (channelId: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const movable = [...channels].sort((a, b) => a.order - b.order);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-group-assign-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>
            {t("moveClient.title")} - {clientName}
          </span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          {movable.length === 0 ? (
            <div className="ts-connection-info-loading">{t("moveClient.empty")}</div>
          ) : (
            <ul className="ts-group-assign-list">
              {movable.map((ch) => {
                const current = ch.id === currentChannelId;
                const spacer = spacerDisplayName(ch.name, ch.parent === 0);
                const label = spacer.isSpacer
                  ? spacer.label.trim() || ch.name
                  : ch.name;
                return (
                  <li key={ch.id}>
                    <button
                      className={`ts-menu-item${current ? " ts-group-assign-current" : ""}`}
                      disabled={current || spacer.isSpacer}
                      onClick={() => onSelect(ch.id)}
                    >
                      <span className="ts-menu-item-icon">
                        {current ? "✔️" : spacer.isSpacer ? "➖" : "📁"}
                      </span>
                      <span className="ts-menu-item-label">{label}</span>
                      {current && (
                        <span className="ts-group-assign-hint">{t("moveClient.current")}</span>
                      )}
                      {!current && spacer.isSpacer && (
                        <span className="ts-group-assign-hint">{t("moveClient.spacer")}</span>
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
