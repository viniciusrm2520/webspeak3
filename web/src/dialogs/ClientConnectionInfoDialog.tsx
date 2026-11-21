import { useEffect, useState } from "react";
import { type ClientConnectionInfoData, formatBytes } from "../app/model";
import { formatDurationSecs } from "../app/shared";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function ClientConnectionInfoDialog({
  clientName,
  info,
  onClose,
}: {
  clientName: string;
  info: ClientConnectionInfoData | null;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  // The server may silently decline (e.g. missing permission to view another
  // client's connection info) without ever replying - fall back to an error
  // instead of spinning forever.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (info) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [info, clientName]);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-connection-info-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("connectionInfo.clientTitle", { name: clientName })}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          {!info ? (
            <div className="ts-connection-info-loading">
              {timedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
            </div>
          ) : (
            <div className="ts-connection-info-grid">
              <span>{t("connectionInfo.ping")}</span>
              <span>{info.pingMs != null ? `${info.pingMs.toFixed(1)} ms` : "-"}</span>
              <span>{t("connectionInfo.connectedSince")}</span>
              <span>{info.connectedSecs != null ? formatDurationSecs(info.connectedSecs) : "-"}</span>
              <span>{t("connectionInfo.ip")}</span>
              <span>{info.ip ?? "-"}</span>
              <span>{t("connectionInfo.packetLoss")}</span>
              <span>{info.packetLossPercent.toFixed(2)}%</span>
              <span>{t("connectionInfo.packetsSent")}</span>
              <span>{info.packetsSent.toLocaleString()}</span>
              <span>{t("connectionInfo.packetsReceived")}</span>
              <span>{info.packetsReceived.toLocaleString()}</span>
              <span>{t("connectionInfo.bytesSent")}</span>
              <span>{formatBytes(info.bytesSent)}</span>
              <span>{t("connectionInfo.bytesReceived")}</span>
              <span>{formatBytes(info.bytesReceived)}</span>
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
