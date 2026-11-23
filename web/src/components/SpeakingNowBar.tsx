import type { ClientInfo, GroupEntry } from "../app/model";
import { useEffect, useRef } from "react";
import { groupBadgeColor } from "../app/shared";
import { useT } from "../i18n";
import { TalkLamp } from "./ChannelTree";
import { AvatarTile } from "./ui";

/** Live video inside a card: a stream being watched, or your own preview. */
function TileVideo({ stream, own }: { stream: MediaStream; own: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  }, [stream]);
  // Muted so autoplay is never blocked; controls let the viewer unmute or go
  // fullscreen. Your own preview never plays its audio back to you.
  return <video ref={ref} className="ts-speaking-now-video" autoPlay playsInline muted controls={!own} />;
}

/** Standard layout: streams on the member cards. */
export interface TileStreams {
  /** Whether the stream of this client can be joined (its id is known). */
  canWatch: (clientId: number) => boolean;
  watchingClientId: number | null;
  /** Media of the stream being watched, once it arrived. */
  media: MediaStream | null;
  /** You are broadcasting, and the capture to preview. */
  selfLive: boolean;
  selfPreview: MediaStream | null;
  /** People watching your broadcast, shown as your card's status. */
  selfViewers: number;
  onWatch: (clientId: number) => void;
  onStopWatching: () => void;
}

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
  streams,
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
  /** Standard layout: LIVE badge, a Watch button and the video in the card. */
  streams?: TileStreams;
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
      {channelClients.map((c) => {
        const isSelf = c.id === ownClientId;
        const live = !!streams && (isSelf ? streams.selfLive : !!c.isStreaming);
        const video =
          streams && isSelf && streams.selfLive
            ? streams.selfPreview
            : streams && streams.watchingClientId === c.id
              ? streams.media
              : null;
        const watching = !!streams && !isSelf && streams.watchingClientId === c.id;
        return (
        <div
          key={c.id}
          className={`ts-speaking-now-tile${talkers.has(c.id) ? " ts-speaking-now-tile-active" : ""}${
            c.id === selectedClientId ? " ts-speaking-now-tile-selected" : ""
          }${live ? " ts-speaking-now-tile-live" : ""}${video || watching ? " ts-speaking-now-tile-video" : ""}`}
          title={c.name}
          onClick={() => onSelect(c.id)}
          onDoubleClick={c.id === ownClientId ? undefined : () => onOpenPrivateChat(c.id, c.name)}
          onContextMenu={(e) => onContextMenu(e, c.id, c.name, c.id === ownClientId)}
        >
          {video ? (
            <TileVideo stream={video} own={isSelf} />
          ) : watching ? (
            <span className="ts-speaking-now-video ts-speaking-now-video-wait">{t("stream.state.connecting")}</span>
          ) : (
            <AvatarTile client={c} images={images} className="ts-speaking-now-avatar" isSelf={isSelf} />
          )}
          {live && <span className="ts-speaking-now-live">{t("stream.live")}</span>}
          {watching && (
            <button
              className="ts-speaking-now-stop"
              title={t("stream.stop")}
              aria-label={t("stream.stop")}
              onClick={(e) => {
                e.stopPropagation();
                streams.onStopWatching();
              }}
            >
              ✕
            </button>
          )}
          {serverGroups === undefined ? (
            <>
              <span className="ts-speaking-now-name">{c.name}</span>
              {showStatus && (
                <span className="ts-speaking-now-state">
                  {live && isSelf
                    ? t("publish.viewers", { count: String(streams.selfViewers) })
                    : live
                    ? t("tree.streaming")
                    : talkers.has(c.id)
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
              {live && !isSelf && !watching && streams.canWatch(c.id) && (
                <button
                  className="ts-speaking-now-watch"
                  onClick={(e) => {
                    e.stopPropagation();
                    streams.onWatch(c.id);
                  }}
                >
                  ▶ {t("clientContext.watchStream")}
                </button>
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
        );
      })}
    </div>
  );
}
