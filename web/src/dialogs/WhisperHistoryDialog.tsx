import type { WhisperLogEntry } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function WhisperHistoryDialog({
  serverName,
  entries,
  onClear,
  onClose,
}: {
  serverName: string;
  entries: WhisperLogEntry[];
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-whisper-history-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("whisperHistory.title", { server: serverName })}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <div className="ts-whisper-history-list">
            {entries.length === 0 && (
              <div className="ts-whisper-history-empty">{t("whisperHistory.empty")}</div>
            )}
            {entries.map((e) => (
              <div key={e.id} className="ts-whisper-history-row">
                <span className="ts-log-time">{new Date(e.timestamp).toLocaleString()}</span>
                <span>{e.description}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <button onClick={onClear}>{t("whisperHistory.clear")}</button>
          <div className="ts-dialog-buttons-right">
            <button disabled title={t("clientContext.notSupported")}>
              {t("whisperHistory.options")}
            </button>
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
