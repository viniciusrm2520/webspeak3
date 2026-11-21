import type { ClientInfo, GroupEntry } from "../app/model";
import { groupBadgeColor } from "../app/shared";
import { useT } from "../i18n";
import { TalkLamp } from "./ChannelTree";
import { AvatarTile } from "./ui";

/** Pulse-theme-only: a row of avatar tiles for everyone in the player's current
 *  channel, with a highlighted ring on whoever is currently talking - the
 *  "who's speaking" strip from the reference client's connected view. Purely
 *  derived from state ChannelTree already has (own channel + `talkers`), no
 *  new backend data needed. */
export function SpeakingNowBar({
  clients,
  talkers,
  ownClientId,
  images,
  serverGroups,
  selectedClientId,
  showStatus,
  onSelect,
  onOpenPrivateChat,
  onContextMenu,
}: {
  clients: ClientInfo[];
  talkers: Set<number>;
  ownClientId: number | null;
  images: Record<string, string>;
  /** IDE layout only: render group tags and a mic status next to the name. */
  serverGroups?: GroupEntry[] | null;
  selectedClientId: number | null;
  /** Standard layout: a status line (talking, away, muted) under the name. */
  showStatus?: boolean;
  onSelect: (clientId: number) => void;
  onOpenPrivateChat: (clientId: number, clientName: string) => void;
  onContextMenu: (e: React.MouseEvent, clientId: number, clientName: string, isSelf: boolean) => void;
}) {
  const t = useT();
  const own = clients.find((c) => c.id === ownClientId);
  if (!own) return null;
  const channelClients = clients.filter((c) => c.channel === own.channel);
  if (channelClients.length === 0) return null;

  return (
    <div className="ts-speaking-now">
      {channelClients.map((c) => (
        <div
          key={c.id}
          className={`ts-speaking-now-tile${talkers.has(c.id) ? " ts-speaking-now-tile-active" : ""}${
            c.id === selectedClientId ? " ts-speaking-now-tile-selected" : ""
          }`}
          title={c.name}
          onClick={() => onSelect(c.id)}
          onDoubleClick={c.id === ownClientId ? undefined : () => onOpenPrivateChat(c.id, c.name)}
          onContextMenu={(e) => onContextMenu(e, c.id, c.name, c.id === ownClientId)}
        >
          <AvatarTile client={c} images={images} className="ts-speaking-now-avatar" isSelf={c.id === ownClientId} />
          {serverGroups === undefined ? (
            <>
              <span className="ts-speaking-now-name">{c.name}</span>
              {showStatus && (
                <span className="ts-speaking-now-state">
                  {talkers.has(c.id)
                    ? t("tree.talking")
                    : c.away
                      ? t("tree.away")
                      : c.outputMuted
                        ? t("tree.soundMuted")
                        : c.inputMuted || !c.inputHardwareEnabled
                          ? t("tree.micMuted")
                          : " "}
                </span>
              )}
            </>
          ) : (
            <div className="ts-speaking-now-body">
              <div className="ts-speaking-now-head">
                <span className="ts-speaking-now-name">{c.name}</span>
                {talkers.has(c.id) ? (
                  <span className="ts-speaking-now-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  (c.inputMuted || !c.inputHardwareEnabled) && (
                    <TalkLamp talking={false} inputMuted={c.inputMuted} inputHardwareEnabled={c.inputHardwareEnabled} />
                  )
                )}
              </div>
              <div className="ts-speaking-now-groups">
                {c.serverGroups
                  .map((gid) => serverGroups?.find((g) => g.id === gid))
                  .filter((g): g is GroupEntry => !!g)
                  .map((g) => (
                    <span
                      key={g.id}
                      className="ts-speaking-now-group"
                      style={{ "--group-color": g.iconId ? groupBadgeColor(g.iconId) : "#71717a" } as React.CSSProperties}
                    >
                      {g.name}
                    </span>
                  ))}
              </div>
              {(c.away || c.outputMuted) && (
                <div className="ts-speaking-now-status">
                  {c.away ? `${t("tree.away")}${c.awayMessage ? `: ${c.awayMessage}` : ""}` : t("tree.soundMuted")}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
