import type { MessagePreset } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function AwayDialog({
  message,
  presets,
  onMessageChange,
  onOk,
  onSaveTemplate,
  onCancel,
}: {
  message: string;
  presets: MessagePreset[];
  onMessageChange: (v: string) => void;
  onOk: () => void;
  onSaveTemplate: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onCancel);
  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-away-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("away.dialog.title")}</span>
          <button onClick={onCancel} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <div className="ts-dialog-row">
            <span className="ts-dialog-away-label">{t("away.dialog.message")}</span>
            <label className="ts-dialog-field">
              {t("away.dialog.template")}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onMessageChange(e.target.value);
                }}
              >
                <option value="">{t("away.dialog.none")}</option>
                {presets.map((p) => (
                  <option key={p.name} value={p.message}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <input
            autoFocus
            className="ts-away-message-input"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onOk()}
          />
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button onClick={onOk}>{t("away.dialog.ok")}</button>
            <button onClick={onSaveTemplate} disabled={!message.trim()}>
              {t("away.dialog.save")}
            </button>
            <button onClick={onCancel}>{t("away.dialog.cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
