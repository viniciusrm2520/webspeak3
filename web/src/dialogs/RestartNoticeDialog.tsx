import { useT } from "../i18n";

export function RestartNoticeDialog({ message, onAck }: { message: string; onAck: () => void }) {
  const t = useT();
  return (
    <div className="ts-dialog-backdrop">
      <div className="ts-dialog ts-restart-notice-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("restartNotice.title")}</span>
        </div>
        <div className="ts-dialog-body">
          <p>{message}</p>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button type="button" onClick={onAck}>
              {t("restartNotice.ack")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
