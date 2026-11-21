import { useEffect, useState } from "react";
import type { OfflineMessageListEntry } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function OfflineMessagesDialog({
  entries,
  detail,
  onSelect,
  onDelete,
  onMarkRead,
  onSend,
  onClose,
}: {
  entries: OfflineMessageListEntry[] | null;
  detail: { messageId: number; clientUid: string; subject: string; message: string; timestamp: string } | null;
  onSelect: (messageId: number) => void;
  onDelete: (messageId: number) => void;
  onMarkRead: (messageId: number) => void;
  onSend: (clientUid: string, subject: string, message: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [timedOut, setTimedOut] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeUid, setComposeUid] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");

  useEffect(() => {
    setTimedOut(false);
    if (entries) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [entries]);

  const handleSend = () => {
    if (!composeUid.trim() || !composeSubject.trim()) return;
    onSend(composeUid.trim(), composeSubject.trim(), composeMessage.trim());
    setComposing(false);
    setComposeUid("");
    setComposeSubject("");
    setComposeMessage("");
  };

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-offline-messages-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("offlineMessages.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          {composing ? (
            <div className="ts-offline-message-compose">
              <label className="ts-dialog-field ts-dialog-field-grow">
                {t("offlineMessages.targetUid")}
                <input value={composeUid} onChange={(e) => setComposeUid(e.target.value)} />
              </label>
              <label className="ts-dialog-field ts-dialog-field-grow">
                {t("offlineMessages.subject")}
                <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
              </label>
              <label className="ts-dialog-field ts-dialog-field-grow">
                {t("offlineMessages.message")}
                <textarea value={composeMessage} onChange={(e) => setComposeMessage(e.target.value)} rows={5} />
              </label>
            </div>
          ) : detail ? (
            <div className="ts-offline-message-detail">
              <div className="ts-offline-message-detail-header">
                <strong>{detail.subject}</strong>
                <span>{detail.timestamp}</span>
              </div>
              <div className="ts-offline-message-detail-uid">{detail.clientUid}</div>
              <div className="ts-offline-message-detail-body">{detail.message}</div>
            </div>
          ) : !entries ? (
            <div className="ts-connection-info-loading">
              {timedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
            </div>
          ) : entries.length === 0 ? (
            <div className="ts-connection-info-loading">{t("offlineMessages.empty")}</div>
          ) : (
            <table className="ts-ban-list-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t("offlineMessages.subject")}</th>
                  <th>{t("offlineMessages.from")}</th>
                  <th>{t("offlineMessages.timestamp")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.messageId}>
                    <td>{e.isRead ? "" : "●"}</td>
                    <td>
                      <a href="#" onClick={(ev) => { ev.preventDefault(); onSelect(e.messageId); }}>
                        {e.subject}
                      </a>
                    </td>
                    <td>{e.clientUid}</td>
                    <td>{e.timestamp}</td>
                    <td>
                      <button onClick={() => onDelete(e.messageId)}>{t("banList.delete")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-left">
            {composing ? (
              <>
                <button onClick={handleSend}>{t("offlineMessages.send")}</button>
                <button onClick={() => setComposing(false)}>{t("dialog.cancel")}</button>
              </>
            ) : detail ? (
              <>
                <button onClick={() => onMarkRead(detail.messageId)}>{t("offlineMessages.markRead")}</button>
                <button onClick={() => onSelect(-1)}>{t("offlineMessages.backToList")}</button>
              </>
            ) : (
              <button onClick={() => setComposing(true)}>{t("offlineMessages.new")}</button>
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
