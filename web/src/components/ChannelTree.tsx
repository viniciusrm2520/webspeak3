import { useContext, useState } from "react";
import type {
  ChannelInfo,
  ClientInfo,
  GroupEntry,
  SelectedItem,
} from "../app/model";
import { DisplayPrefsContext, loadAppSettings } from "../app/prefs";
import {
  countryFlag,
  CUSTOM_ICON_ID_THRESHOLD,
  groupBadgeColor,
  iconDataUrl,
  lastChannelClickBySession,
} from "../app/shared";
import { useT } from "../i18n";
import { spacerDisplayName } from "../lib/spacer";
import { AvatarTile } from "./ui";

export function ChannelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" data-pack-icon="channel">
      <path
        d="M1.5 3.5c0-.55.45-1 1-1h3.4l1.2 1.4h6.4c.55 0 1 .45 1 1v7.1c0 .55-.45 1-1 1h-11c-.55 0-1-.45-1-1v-8.5Z"
        fill="#e8c46a"
        stroke="#b8923f"
        strokeWidth="0.6"
      />
    </svg>
  );
}

/** GTS2-style talk lamp: blue idle / green talking / muted mic. */
/** Red "off" badge in the lamp's bottom-right corner, shared by the mute icons. */
const OFF_BADGE = (
  <>
    <circle cx="10.35" cy="10.35" r="2.55" fill="#e53935" stroke="#1a1a1a" strokeWidth="0.55" />
    <path d="M9.35 9.35l2 2M11.35 9.35l-2 2" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
  </>
);

/** The status slot in front of a client's name. Like the native client, away
 *  and mute replace the talk dot instead of being listed after the name.
 *  Order as in TeamSpeak: away, sound muted, mic muted, talking/idle. */
export function TalkLamp({
  talking,
  inputMuted,
  inputHardwareEnabled,
  outputMuted = false,
  away = false,
  commander = false,
}: {
  talking: boolean;
  inputMuted: boolean;
  inputHardwareEnabled: boolean;
  outputMuted?: boolean;
  away?: boolean;
  /** Channel commander: drawn as its own lamp when the design option asks for it. */
  commander?: boolean;
}) {
  const t = useT();
  const { tree } = useContext(DisplayPrefsContext);
  const muted = inputMuted || !inputHardwareEnabled;
  const asCommander = commander && tree.commanderLamp;

  const icon = (title: string, packIcon: string, paths: React.ReactNode) => (
    <span className="ts-talk-lamp ts-talk-lamp-muted" title={title} aria-hidden="true" data-pack-icon={packIcon}>
      <svg width="14" height="14" viewBox="0 0 14 14" focusable="false">
        {paths}
      </svg>
    </span>
  );

  if (away) {
    return (
      <span className="ts-talk-lamp ts-talk-lamp-muted ts-talk-lamp-away" title={t("tree.away")} aria-hidden="true" data-pack-icon="away">
        💤
      </span>
    );
  }

  if (outputMuted) {
    return icon(
      t("tree.soundMuted"),
      "soundMuted",
      <>
        <path d="M1.6 5h2.3l3.2-2.7v8.6L3.9 8.2H1.6Z" fill="#9aa3ad" stroke="#8a939c" strokeWidth="0.5" strokeLinejoin="round" />
        <path d="M8.6 4.6c.7.6 1 1.3 1 2s-.3 1.4-1 2" fill="none" stroke="#8a939c" strokeWidth="1.1" strokeLinecap="round" />
        {OFF_BADGE}
      </>
    );
  }

  if (muted) {
    return icon(
      t("tree.micMuted"),
      inputMuted ? "micMuted" : "hardwareMicMuted",
      <>
        <path
          d="M7 1.4c-1.15 0-2.05.9-2.05 2.05v3.1c0 1.15.9 2.05 2.05 2.05s2.05-.9 2.05-2.05v-3.1C9.05 2.3 8.15 1.4 7 1.4Z"
          fill="#9aa3ad"
        />
        <path
          d="M3.2 6.4v.4c0 2 1.7 3.55 3.8 3.55s3.8-1.55 3.8-3.55v-.4"
          fill="none"
          stroke="#8a939c"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
        <path d="M7 10.35v2" stroke="#8a939c" strokeWidth="1.15" strokeLinecap="round" />
        <path d="M5.2 12.35h3.6" stroke="#8a939c" strokeWidth="1.15" strokeLinecap="round" />
        {OFF_BADGE}
      </>
    );
  }

  if (talking) {
    return (
      <span
        className={`ts-talk-lamp ts-talk-lamp-talking${asCommander ? " ts-talk-lamp-commander" : ""}`}
        title={t("tree.talking")}
        aria-hidden="true"
        data-pack-icon={asCommander ? "commanderTalking" : "talking"}
      />
    );
  }

  return (
    <span
      className={`ts-talk-lamp ts-talk-lamp-idle${asCommander ? " ts-talk-lamp-commander" : ""}`}
      aria-hidden="true"
      data-pack-icon={asCommander ? "commanderIdle" : "talkIdle"}
    />
  );
}

function ClientStatusIcons({ client }: { client: ClientInfo }) {
  const t = useT();
  const { tree } = useContext(DisplayPrefsContext);
  // Away and mute are shown on the TalkLamp; keep secondary flags here.
  return (
    <span className="ts-status-icons">
      {client.isChannelCommander && !tree.commanderLamp && <span title={t("tree.channelCommander")}>⭐</span>}
      {!client.inputMuted && client.inputHardwareEnabled && !client.hasTalkPower && (
        <span title={t("tree.noTalkPower")}>🔒</span>
      )}
      {client.isStreaming && <span title={t("tree.streaming")}>📺</span>}
    </span>
  );
}

export function ServerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" data-pack-icon="server">
      <rect x="1.5" y="2" width="13" height="4.2" rx="0.6" fill="#7a8a99" stroke="#5c6b78" strokeWidth="0.5" />
      <rect x="1.5" y="7" width="13" height="4.2" rx="0.6" fill="#8a9aab" stroke="#5c6b78" strokeWidth="0.5" />
      <circle cx="3.5" cy="4.1" r="0.6" fill="#4caf50" />
      <circle cx="3.5" cy="9.1" r="0.6" fill="#4caf50" />
    </svg>
  );
}

/** A group's uploaded icon, or a colored letter badge for TS's built-in icons we don't have. */
export function GroupIcon({ group, images }: { group: GroupEntry; images: Record<string, string> }) {
  const base64 = group.iconId >= CUSTOM_ICON_ID_THRESHOLD ? images[`/icon_${group.iconId}`] : undefined;
  if (base64) return <img className="ts-group-icon" src={iconDataUrl(base64)} alt="" title={group.name} />;
  return (
    <svg className="ts-group-badge" width="16" height="16" viewBox="0 0 16 16" role="img" aria-label={group.name}>
      <title>{group.name}</title>
      <circle cx="6.5" cy="4.6" r="2.9" fill="#8b95a1" />
      <path d="M1 14.6c0-3.3 2.4-5.6 5.5-5.6s5.5 2.3 5.5 5.6Z" fill="#8b95a1" />
      <circle cx="11.6" cy="11.4" r="4.1" fill={groupBadgeColor(group.iconId)} stroke="var(--bg, #fff)" strokeWidth="0.9" />
      <text x="11.6" y="13.95" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
        {group.name.trim().charAt(0).toUpperCase() || "?"}
      </text>
    </svg>
  );
}
let switchArmedUntil = 0;

const CLIENT_DRAG_MIME = "application/x-webspeak3-client";

type ClientDragPayload = { clientId: number; channelId: number };

function parseClientDragPayload(raw: string): ClientDragPayload | null {
  try {
    const data = JSON.parse(raw) as Partial<ClientDragPayload>;
    if (
      typeof data.clientId === "number" &&
      Number.isFinite(data.clientId) &&
      typeof data.channelId === "number" &&
      Number.isFinite(data.channelId)
    ) {
      return { clientId: data.clientId, channelId: data.channelId };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function ChannelTree({
  channels,
  clients,
  parent,
  ownClientId,
  talkers,
  serverGroups,
  channelGroups = null,
  groupIconImages,
  selected,
  sessionKey,
  expandAll,
  level = 1,
  onSelectItem,
  onSwitchChannel,
  onOpenPrivateChat,
  onMoveClient,
  onClientContextMenu,
  onChannelContextMenu,
}: {
  channels: ChannelInfo[];
  clients: ClientInfo[];
  parent: number;
  ownClientId: number | null;
  talkers: Set<number>;
  serverGroups: GroupEntry[] | null;
  /** For the channel group icon, shown after the server group icons like in the native client. */
  channelGroups?: GroupEntry[] | null;
  groupIconImages: Record<string, string>;
  selected: SelectedItem | null;
  /** Identifies which multi-join tab this tree belongs to, so the manual
   *  double-click detection below can't pair clicks across two tabs. */
  sessionKey: string;
  /** While searching: show every match, ignoring channels the user collapsed. */
  expandAll?: boolean;
  /** aria-level of this list's channels; their clients sit one deeper. */
  level?: number;
  onSelectItem: (item: SelectedItem) => void;
  onSwitchChannel: (channelId: number) => void;
  onOpenPrivateChat: (clientId: number, clientName: string) => void;
  onMoveClient: (clientId: number, channelId: number) => void;
  onClientContextMenu: (e: React.MouseEvent, clientId: number, clientName: string, isSelf: boolean) => void;
  onChannelContextMenu: (e: React.MouseEvent, channelId: number, channelName: string) => void;
}) {
  const t = useT();
  const { tree } = useContext(DisplayPrefsContext);
  // Channels the user expanded/collapsed against the design tab's default.
  const [toggled, setToggled] = useState<Set<number>>(() => new Set());
  const [dragOverChannelId, setDragOverChannelId] = useState<number | null>(null);
  // Module-level click tracking (see lastChannelClick) — refs alone are not
  // enough when Select re-renders remount nested ChannelTree instances.
  const children = channels.filter((c) => c.parent === parent).sort((a, b) => a.order - b.order);
  if (children.length === 0) return null;

  // Server group icons, then the channel group icon (the flag follows last).
  const clientGroupBadges = (client: ClientInfo): GroupEntry[] =>
    [
      ...(serverGroups ? client.serverGroups.map((gid) => serverGroups.find((g) => g.id === gid)) : []),
      channelGroups?.find((g) => g.id === client.channelGroup),
    ].filter((g): g is GroupEntry => !!g && g.iconId !== 0);

  // "Own channel" mode keeps the own channel and the channels above it open.
  const ownPath = new Set<number>();
  if (tree.expandMode === "own") {
    let id = clients.find((c) => c.id === ownClientId)?.channel;
    while (id && !ownPath.has(id)) {
      ownPath.add(id);
      id = channels.find((c) => c.id === id)?.parent;
    }
  }
  const collapsedByDefault = (channelId: number) =>
    tree.expandMode === "own" ? !ownPath.has(channelId) : tree.expandDepth > 0 && level > tree.expandDepth;

  // "Tooltip Info bei Hover": a plain-text client info card in the native title tooltip.
  const clientTooltip = (c: ClientInfo) => {
    const groupNames = serverGroups
      ? c.serverGroups.map((gid) => serverGroups.find((g) => g.id === gid)?.name).filter(Boolean)
      : [];
    return [
      c.name,
      groupNames.length > 0 && `${t("info.serverGroups")} ${groupNames.join(", ")}`,
      c.country && `${t("info.country")} ${c.country}`,
      c.away && (c.awayMessage ? `${t("tree.away")}: ${c.awayMessage}` : t("tree.away")),
      (c.inputMuted || !c.inputHardwareEnabled) && t("tree.micMuted"),
      c.outputMuted && t("tree.soundMuted"),
      c.id !== ownClientId && `${t("tree.privateChatWith")} ${c.name}`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const toggleCollapsed = (channelId: number, event: React.SyntheticEvent) => {
    event.stopPropagation();
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  };

  return (
    <ul
      className={`ts-tree-list${parent === 0 ? " ts-tree-list-root" : ""}`}
      role={parent === 0 ? "tree" : "group"}
      aria-label={parent === 0 ? t("tree.label") : undefined}
    >
      {children.map((channel, index) => {
        const isRoot = parent === 0;
        const spacer = spacerDisplayName(channel.name, isRoot);
        const channelClients = clients.filter((c) => c.channel === channel.id);
        const hasSubChannels = channels.some((c) => c.parent === channel.id);
        const hasChildren = channelClients.length > 0 || hasSubChannels;
        const isCollapsed = !expandAll && collapsedByDefault(channel.id) !== toggled.has(channel.id);
        const isSelected = selected?.type === "channel" && selected.id === channel.id;
        // One Tab stop for the whole tree (arrow keys move inside it, see
        // handleTreeKeyDown): the selected row, or the first channel while
        // nothing in the tree is selected.
        const isTabStop = isSelected || (parent === 0 && index === 0 && selected?.type !== "channel" && selected?.type !== "client");
        const spacerClass = spacer.isSpacer
          ? ` ts-spacer ts-spacer-align-${spacer.alignment}${spacer.isLine ? " ts-spacer-line" : ""}${
              spacer.isBoxArt ? " ts-spacer-boxart" : ""
            }`
          : "";
        const subTree = !isCollapsed && (
          <ChannelTree
            channels={channels}
            clients={clients}
            parent={channel.id}
            ownClientId={ownClientId}
            talkers={talkers}
            serverGroups={serverGroups}
            channelGroups={channelGroups}
            groupIconImages={groupIconImages}
            selected={selected}
            sessionKey={sessionKey}
            expandAll={expandAll}
            level={level + 1}
            onSelectItem={onSelectItem}
            onSwitchChannel={onSwitchChannel}
            onOpenPrivateChat={onOpenPrivateChat}
            onMoveClient={onMoveClient}
            onClientContextMenu={onClientContextMenu}
            onChannelContextMenu={onChannelContextMenu}
          />
        );
        return (
        <li key={channel.id} role="none">
          <div
            className={`ts-row ts-channel-row${spacerClass}${
              isSelected ? " ts-row-selected" : ""
            }${dragOverChannelId === channel.id ? " ts-drop-target" : ""}`}
            role="treeitem"
            aria-level={level}
            aria-selected={isSelected}
            aria-expanded={hasChildren ? !isCollapsed : undefined}
            onClick={() => {
              onSelectItem({ type: "channel", id: channel.id });
              // Manual double-click: native dblclick is often lost when the first
              // click's Select setState remounts this row before the second click.
              // Spacers are joinable (TS/GTS): visual-only difference.
              const now = performance.now();
              const prev = lastChannelClickBySession.get(sessionKey) ?? null;
              if (prev && prev.id === channel.id && now - prev.at < 450) {
                lastChannelClickBySession.delete(sessionKey);
                switchArmedUntil = now + 50;
                onSwitchChannel(channel.id);
              } else {
                lastChannelClickBySession.set(sessionKey, { id: channel.id, at: now });
              }
            }}
            onDoubleClick={() => {
              if (performance.now() < switchArmedUntil) return;
              onSwitchChannel(channel.id);
            }}
            onContextMenu={(e) => onChannelContextMenu(e, channel.id, channel.name)}
            onAuxClick={(e) => {
              if (e.button === 1 && loadAppSettings().middleClickQuickAccess) onSwitchChannel(channel.id);
            }}
            tabIndex={isTabStop ? 0 : -1}
            onFocus={(e) => {
              if (e.target === e.currentTarget && !isSelected) onSelectItem({ type: "channel", id: channel.id });
            }}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter") onSwitchChannel(channel.id);
              else if (e.key === " ") onSelectItem({ type: "channel", id: channel.id });
              else if (hasChildren && (e.key === "ArrowLeft" || e.key === "ArrowRight") && isCollapsed === (e.key === "ArrowRight"))
                toggleCollapsed(channel.id, e);
              else return;
              e.preventDefault();
            }}
            onDragOver={(e) => {
              if (![...e.dataTransfer.types].includes(CLIENT_DRAG_MIME)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverChannelId !== channel.id) setDragOverChannelId(channel.id);
            }}
            onDragLeave={(e) => {
              const related = e.relatedTarget as Node | null;
              if (related && e.currentTarget.contains(related)) return;
              setDragOverChannelId((prev) => (prev === channel.id ? null : prev));
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverChannelId(null);
              const payload = parseClientDragPayload(e.dataTransfer.getData(CLIENT_DRAG_MIME));
              if (!payload || payload.channelId === channel.id) return;
              onMoveClient(payload.clientId, channel.id);
            }}
            title={tree.tooltips ? t("tree.clickToJoin") : undefined}
          >
            {!spacer.isSpacer && (
              <button
                type="button"
                className={`ts-tree-expander${hasChildren ? "" : " ts-tree-expander-empty"}${
                  isCollapsed ? " ts-tree-expander-collapsed" : ""
                }`}
                aria-hidden="true"
                tabIndex={-1}
                onMouseDown={(e) => {
                  // Keep focus on the row so a nearby double-click still joins.
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasChildren) return;
                  toggleCollapsed(channel.id, e);
                }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <span />
              </button>
            )}
            {!spacer.isSpacer && <ChannelIcon />}
            {spacer.isSpacer ? (
              spacer.isLine ? (
                <span className="ts-spacer-label ts-spacer-line-rule" aria-hidden="true" />
              ) : (
                <span className="ts-spacer-label">{spacer.label}</span>
              )
            ) : (
              <span className="ts-tree-label">{channel.name}</span>
            )}
            {!spacer.isSpacer && channel.hasPassword && (
              <span title={t("tree.passwordProtected")}>🔒</span>
            )}
          </div>
          {tree.clientsBelow && subTree}
          {!isCollapsed && (
            <ul className="ts-tree-list" role="group">
              {channelClients.map((c) => {
                const clientSelected = selected?.type === "client" && selected.id === c.id;
                return (
                <li key={c.id} role="none">
                  <div
                    className={`ts-row ts-client-row${c.id === ownClientId ? " ts-self" : ""}${
                      talkers.has(c.id) &&
                      c.hasTalkPower &&
                      !c.inputMuted &&
                      c.inputHardwareEnabled
                        ? " ts-talking"
                        : ""
                    }${clientSelected ? " ts-row-selected" : ""}`}
                    role="treeitem"
                    aria-level={level + 1}
                    aria-selected={clientSelected}
                    draggable
                    onDragStart={(e) => {
                      const payload: ClientDragPayload = {
                        clientId: c.id,
                        channelId: c.channel,
                      };
                      const raw = JSON.stringify(payload);
                      e.dataTransfer.setData(CLIENT_DRAG_MIME, raw);
                      e.dataTransfer.setData("text/plain", raw);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDragOverChannelId(null)}
                    onClick={() => onSelectItem({ type: "client", id: c.id })}
                    onDoubleClick={
                      c.id === ownClientId ? undefined : () => onOpenPrivateChat(c.id, c.name)
                    }
                    onContextMenu={(e) => onClientContextMenu(e, c.id, c.name, c.id === ownClientId)}
                    onAuxClick={(e) => {
                      if (e.button === 1 && c.id !== ownClientId && loadAppSettings().middleClickQuickAccess)
                        onOpenPrivateChat(c.id, c.name);
                    }}
                    tabIndex={clientSelected ? 0 : -1}
                    onFocus={(e) => {
                      if (e.target === e.currentTarget && !clientSelected) onSelectItem({ type: "client", id: c.id });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && c.id !== ownClientId) onOpenPrivateChat(c.id, c.name);
                      else if (e.key === " ") onSelectItem({ type: "client", id: c.id });
                      else return;
                      e.preventDefault();
                    }}
                    title={tree.tooltips ? clientTooltip(c) : undefined}
                  >
                    <span className="ts-tree-expander ts-tree-expander-empty" aria-hidden="true">
                      <span />
                    </span>
                    <TalkLamp
                      talking={
                        talkers.has(c.id) &&
                        c.hasTalkPower &&
                        !c.inputMuted &&
                        c.inputHardwareEnabled
                      }
                      inputMuted={c.inputMuted}
                      inputHardwareEnabled={c.inputHardwareEnabled}
                      outputMuted={c.outputMuted}
                      away={c.away}
                      commander={c.isChannelCommander}
                    />
                    <span className="ts-client-status-leading">
                      <ClientStatusIcons client={c} />
                    </span>
                    <AvatarTile
                      client={c}
                      images={groupIconImages}
                      className="ts-client-avatar"
                      isSelf={c.id === ownClientId}
                    />
                    <span className="ts-tree-label">{c.name}</span>
                    {tree.awayMessage && c.away && c.awayMessage && (
                      <span className="ts-client-away-message">({c.awayMessage})</span>
                    )}
                    <span className="ts-client-icons">
                      {clientGroupBadges(c).map((g) => (
                        <GroupIcon key={g.id} group={g} images={groupIconImages} />
                      ))}
                      {tree.flags && countryFlag(c.country) && (
                        <span className="ts-flag" title={c.country}>{countryFlag(c.country)}</span>
                      )}
                    </span>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
          {!tree.clientsBelow && subTree}
        </li>
        );
      })}
    </ul>
  );
}
