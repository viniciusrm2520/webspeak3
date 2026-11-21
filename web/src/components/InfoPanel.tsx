import type {
  ChannelInfo,
  ClientInfo,
  GroupEntry,
  SelectedItem,
} from "../app/model";
import { clientAvatarUrl, countryFlag } from "../app/shared";
import { useT } from "../i18n";
import { parseChannelName } from "../lib/spacer";
import { ChannelIcon, ServerIcon, TalkLamp } from "./ChannelTree";

export function InfoPanel({
  selected,
  host,
  serverName,
  serverMaxClients,
  serverVersion,
  serverLicense,
  serverLicenseId,
  totalClientCount,
  totalChannelCount,
  channels,
  clients,
  serverGroups,
  images,
  onShowServerConnectionInfo,
  onEditServer,
}: {
  selected: SelectedItem | null;
  host: string;
  serverName: string;
  serverMaxClients: number;
  serverVersion: string;
  serverLicense: string;
  serverLicenseId: number;
  totalClientCount: number;
  totalChannelCount: number;
  channels: ChannelInfo[];
  clients: ClientInfo[];
  serverGroups: GroupEntry[] | null;
  images: Record<string, string>;
  onShowServerConnectionInfo: () => void;
  onEditServer: () => void;
}) {
  const t = useT();
  if (!selected || selected.type === "server") {
    return (
      <div className="ts-info-panel">
        <div className="ts-info-title">
          <ServerIcon />
          <span>{serverName || host}</span>
        </div>
        <div className="ts-info-row">
          <span>{t("info.address")}</span> <span>{host}</span>
        </div>
        {serverVersion && (
          <div className="ts-info-row">
            <span>{t("info.version")}</span> <span>{serverVersion}</span>
          </div>
        )}
        {serverLicense && (
          <div className="ts-info-row">
            <span>{t("info.license")}</span>{" "}
            <span className={`ts-license-label ts-license-${serverLicenseId}`}>{serverLicense}</span>
          </div>
        )}
        <div className="ts-info-row">
          <span>{t("info.currentClients")}</span>{" "}
          <span>
            {totalClientCount} / {serverMaxClients > 0 ? serverMaxClients : "∞"}
          </span>
        </div>
        <div className="ts-info-row">
          <span>{t("info.currentChannels")}</span> <span>{totalChannelCount}</span>
        </div>
        <button className="ts-info-connection-link" onClick={onShowServerConnectionInfo}>
          🔌 {t("connectionInfo.serverTitle")}
        </button>
        <button className="ts-info-connection-link" onClick={onEditServer}>
          ✏️ {t("serverEdit.title")}
        </button>
      </div>
    );
  }

  if (selected.type === "client") {
    const client = clients.find((c) => c.id === selected.id);
    if (!client) return <div className="ts-info-panel" />;
    const groups = serverGroups
      ? client.serverGroups
          .map((gid) => serverGroups.find((g) => g.id === gid)?.name)
          .filter((n): n is string => !!n)
      : [];
    return (
      <div className="ts-info-panel">
        <div className="ts-info-title">
          <TalkLamp
            talking={false}
            inputMuted={client.inputMuted}
            inputHardwareEnabled={client.inputHardwareEnabled}
            outputMuted={client.outputMuted}
            away={client.away}
          />
          <span>{client.name}</span>
        </div>
        {clientAvatarUrl(client, images) && (
          <img className="ts-info-avatar" src={clientAvatarUrl(client, images)!} alt="" />
        )}
        {client.country && (
          <div className="ts-info-row">
            <span>{t("info.country")}</span>{" "}
            <span>
              {countryFlag(client.country) && <span className="ts-flag">{countryFlag(client.country)} </span>}
              {client.country}
            </span>
          </div>
        )}
        <div className="ts-info-row">
          <span>{t("info.muted")}</span>{" "}
          <span>
            {client.inputMuted || !client.inputHardwareEnabled
              ? t("info.yes")
              : t("info.no")}
          </span>
        </div>
        <div className="ts-info-row">
          <span>{t("info.outputMuted")}</span>{" "}
          <span>{client.outputMuted ? t("info.yes") : t("info.no")}</span>
        </div>
        {groups.length > 0 && (
          <div className="ts-info-row">
            <span>{t("info.serverGroups")}</span> <span>{groups.join(", ")}</span>
          </div>
        )}
      </div>
    );
  }

  const channel = channels.find((c) => c.id === selected.id);
  if (!channel) return <div className="ts-info-panel" />;
  const clientCount = clients.filter((c) => c.channel === channel.id).length;
  const parsed = parseChannelName(channel.name, channel.parent === 0);
  const isSpacer = parsed.alignment !== null;

  return (
    <div className="ts-info-panel">
      <div className="ts-info-title">
        {!isSpacer && <ChannelIcon />}
        <span>{isSpacer ? parsed.name || channel.name : channel.name}</span>
      </div>
      {isSpacer && (
        <div className="ts-info-row">
          <span>{t("info.spacer")}</span> <span>{parsed.alignment}</span>
        </div>
      )}
      {isSpacer && (
        <div className="ts-info-row">
          <span>{t("info.rawName")}</span> <span>{channel.name}</span>
        </div>
      )}
      {channel.topic && (
        <div className="ts-info-row">
          <span>{t("info.topic")}</span> <span>{channel.topic}</span>
        </div>
      )}
      <div className="ts-info-row">
        <span>{t("info.audioCodec")}</span> <span>{channel.codec}</span>
      </div>
      <div className="ts-info-row">
        <span>{t("info.passwordProtected")}</span> <span>{channel.hasPassword ? t("info.yes") : t("info.no")}</span>
      </div>
      <div className="ts-info-row">
        <span>{t("info.clients")}</span> <span>{clientCount} / {channel.maxClients ?? "∞"}</span>
      </div>
    </div>
  );
}
