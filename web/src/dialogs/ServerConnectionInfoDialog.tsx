import { useEffect, useState } from "react";
import {
  formatBytes,
  formatCount,
  formatRate,
  type ServerConnectionInfoData,
} from "../app/model";
import { formatDurationSecs } from "../app/shared";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function ServerConnectionInfoDialog({
  info,
  serverName,
  host,
  serverVersion,
  serverLicense,
  onClose,
}: {
  info: ServerConnectionInfoData | null;
  serverName: string;
  host: string;
  serverVersion: string;
  serverLicense: string;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  // The server may silently decline (e.g. missing b_virtualserver_connectioninfo_view
  // permission) without ever replying - fall back to an error instead of spinning forever.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (info) return;
    const id = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [info]);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-connection-info-dialog ts-server-conn-info" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("connectionInfo.serverTitle")}</span>
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
            <>
              <div className="ts-connection-info-grid">
                <span>{t("connectionInfo.name")}</span>
                <span>{serverName || host}</span>
                <span>{t("info.address")}</span>
                <span>{host}</span>
                {serverVersion ? (
                  <>
                    <span>{t("info.version")}</span>
                    <span>{serverVersion}</span>
                  </>
                ) : null}
                {serverLicense ? (
                  <>
                    <span>{t("info.license")}</span>
                    <span>{serverLicense}</span>
                  </>
                ) : null}
                <span>{t("connectionInfo.uptime")}</span>
                <span>{formatDurationSecs(info.connectedSecs)}</span>
                <span>{t("connectionInfo.avgPing")}</span>
                <span>{Math.round(info.pingMs)} ms</span>
                <span>{t("connectionInfo.avgPacketLoss")}</span>
                <span>{info.packetLossPercent.toFixed(2)} %</span>
              </div>
              <table className="ts-server-conn-table">
                <thead>
                  <tr>
                    <th />
                    <th>{t("connectionInfo.incoming")}</th>
                    <th>{t("connectionInfo.outgoing")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t("connectionInfo.packetsTransferred")}</td>
                    <td>{formatCount(info.packetsReceivedTotal)}</td>
                    <td>{formatCount(info.packetsSentTotal)}</td>
                  </tr>
                  <tr>
                    <td>{t("connectionInfo.bytesTransferred")}</td>
                    <td>{formatBytes(info.bytesReceivedTotal)}</td>
                    <td>{formatBytes(info.bytesSentTotal)}</td>
                  </tr>
                  <tr>
                    <td>{t("connectionInfo.bandwidthLastSecond")}</td>
                    <td>{formatRate(info.bandwidthReceivedLastSecond)}</td>
                    <td>{formatRate(info.bandwidthSentLastSecond)}</td>
                  </tr>
                  <tr>
                    <td>{t("connectionInfo.bandwidthLastMinute")}</td>
                    <td>{formatRate(info.bandwidthReceivedLastMinute)}</td>
                    <td>{formatRate(info.bandwidthSentLastMinute)}</td>
                  </tr>
                  <tr>
                    <td>{t("connectionInfo.ftBandwidth")}</td>
                    <td>{formatRate(info.filetransferBandwidthReceived)}</td>
                    <td>{formatRate(info.filetransferBandwidthSent)}</td>
                  </tr>
                  <tr>
                    <td>{t("connectionInfo.ftBytes")}</td>
                    <td>{formatBytes(info.filetransferBytesReceived)}</td>
                    <td>{formatBytes(info.filetransferBytesSent)}</td>
                  </tr>
                </tbody>
              </table>
            </>
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
