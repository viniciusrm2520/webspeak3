import "./App.css";
// After App.css: its :where() base variables have the same (zero) specificity.
import "./styles/ide.css";
import "./styles/standard.css";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Aec3Instance, createAec3 } from "./aec3";
import {
  AUTO_CONNECT_FROM_URL,
  DEFAULT_CHANNEL,
  DEFAULT_SERVER,
  DONATE_URL,
  GATEWAY_URL,
  getTurnstileToken,
  hasAcceptedToS,
  IS_OWN_HOSTED_INSTANCE,
  LAST_HOST_KEY,
  LAST_NICKNAME_KEY,
  LAST_SERVER_TYPE_KEY,
  loadServerType,
  SERVER_CHOICES,
  type ServerType,
  TOS_KEY,
  TOS_VERSION,
  TURNSTILE_PASS_KEY,
} from "./app/config";
import {
  base64Blob,
  type ChannelInfo,
  type ClientConnectionInfoData,
  type ClientInfo,
  type FileListEntry,
  type GroupEntry,
  type LogEntry,
  type PermissionCatalogEntry,
  type PermissionOverviewEntry,
  type PermScope,
  type SelectedItem,
  type ServerConnectionInfoData,
  type Transfer,
  triggerBrowserDownload,
} from "./app/model";
import {
  ACTIVE_IDENTITY_KEY,
  AEC3_ENABLED_KEY,
  AUTO_GAIN_CONTROL_KEY,
  AUTO_VOLUME_KEY,
  type BanListEntry,
  CHAT_IMAGES_KEY,
  clearBrowserCaches,
  CLIENT_VOLUMES_KEY,
  type ClientLogEntry,
  COLLECTED_URLS_KEY,
  type CollectedUrl,
  type ComplainListEntry,
  type ConnectParams,
  type Contact,
  CONTACTS_KEY,
  CONTINUOUS_KEY,
  VAD_MODE_KEY,
  type CustomTheme,
  DESIGN_SELECTION_KEY,
  DESIGN_THEME_KEY,
  type DesignTheme,
  designThemeClassName,
  DisplayPrefsContext,
  ECHO_CANCELLATION_KEY,
  type Favorite,
  FAVORITES_KEY,
  IDE_PIXEL_FONT_KEY,
  IDENTITIES_KEY,
  type Identity,
  INPUT_DEVICE_KEY,
  isTypingTarget,
  loadAppSettings,
  loadAwayPresets,
  loadBoolPref,
  loadClientVolumes,
  loadCollectedUrls,
  loadContacts,
  loadCustomThemes,
  loadDesignSelection,
  loadDisconnectMessage,
  loadFavorites,
  loadIdentities,
  loadNumberPref,
  loadMuteBinding,
  loadPttBinding,
  loadSecuritySettings,
  loadTreeOptions,
  loadWhisperLists,
  loadWhisperSettings,
  type LogLevel,
  MAX_LOG_ENTRIES,
  type MessagePreset,
  NOISE_SUPPRESSION_KEY,
  normalizeFavorite,
  type OfflineMessageListEntry,
  OTHER_MIC_CLICKS_KEY,
  OWN_MIC_CLICKS_KEY,
  PLAYBACK_VOLUME_KEY,
  PTT_BINDING_KEY,
  MUTE_BINDING_KEY,
  type PttBinding,
  PUSH_TO_TALK_KEY,
  GLOBAL_PTT_KEY,
  PTT_HELPER_PORT,
  randomId,
  resolveDesignThemeBase,
  saveAwayPresets,
  saveCustomThemes,
  SECURITY_SETTINGS_KEY,
  type SecuritySettings,
  SERVER_BANNER_KEY,
  storeChannelPassword,
  storedChannelPassword,
  TAB_AUDIO_SUPPORTED,
  TREE_OPTIONS_KEY,
  type TreeOptions,
  TYPING_ATTENUATION_KEY,
  VAD_HANGOVER_KEY,
  WHISPER_LISTS_KEY,
  WHISPER_SETTINGS_KEY,
  type WhisperList,
  type WhisperLogEntry,
  type WhisperSettings,
} from "./app/prefs";
import {
  avatarPath,
  CUSTOM_ICON_ID_THRESHOLD,
  downloadBlob,
  ftJoinPath,
  lastChannelClickBySession,
  OPTIONS_SECTIONS,
  type PttHelperStatus,
} from "./app/shared";
import {
  appendChatLog,
  capLines,
  type ChatSettings,
  loadChatSettings,
  readChatLog,
  saveChatSettings,
} from "./chatlog";
import { ChannelTree, ServerIcon } from "./components/ChannelTree";
import { DonateFab } from "./components/DonateFab";
import { FeedbackFab } from "./components/FeedbackFab";
import { FileTransfersWindow } from "./components/FileTransfersWindow";
import { InfoPanel } from "./components/InfoPanel";
import { NewsTicker } from "./components/NewsTicker";
import { SpeakingNowBar } from "./components/SpeakingNowBar";
import { AlphaBadge, AvatarTile, MobileIcon } from "./components/ui";
import { UpdatePrompt } from "./components/UpdatePrompt";
import {
  applyParkedGatewayEvent,
  emptyParkedState,
  type ParkedSessionState,
  sessionLabel,
  type SessionRecord,
  type SessionTabInfo,
} from "./connectionSessions";
import { ConnectionTabs } from "./ConnectionTabs";
import { DEMO_HOST, DEMO_MODE, DemoSocket } from "./demoMode";
import { AboutDialog } from "./dialogs/AboutDialog";
import { BanListDialog } from "./dialogs/admin/BanListDialog";
import { ComplainListDialog } from "./dialogs/admin/ComplainListDialog";
import { FileBrowserDialog } from "./dialogs/admin/FileBrowserDialog";
import { GroupAssignDialog } from "./dialogs/admin/GroupAssignDialog";
import { MoveClientDialog } from "./dialogs/admin/MoveClientDialog";
import { PermissionOverviewDialog } from "./dialogs/admin/PermissionOverviewDialog";
import { PermissionsEditorDialog } from "./dialogs/admin/PermissionsEditorDialog";
import { ServerEditDialog } from "./dialogs/admin/ServerEditDialog";
import { ServerIconsDialog } from "./dialogs/admin/ServerIconsDialog";
import { ServerProtocolLogDialog } from "./dialogs/admin/ServerProtocolLogDialog";
import { AwayDialog } from "./dialogs/AwayDialog";
import { ChannelPasswordDialog } from "./dialogs/ChannelPasswordDialog";
import { ClientConnectionInfoDialog } from "./dialogs/ClientConnectionInfoDialog";
import { ClientLogDialog } from "./dialogs/ClientLogDialog";
import { CollectedUrlsDialog } from "./dialogs/CollectedUrlsDialog";
import { ConnectDialog } from "./dialogs/ConnectDialog";
import { ContactsDialog } from "./dialogs/ContactsDialog";
import { FavoritesDialog } from "./dialogs/FavoritesDialog";
import { FeedbackDialog } from "./dialogs/FeedbackDialog";
import { IdentitiesDialog } from "./dialogs/IdentitiesDialog";
import { InviteFriendDialog } from "./dialogs/InviteFriendDialog";
import { OfflineMessagesDialog } from "./dialogs/OfflineMessagesDialog";
import { RestartNoticeDialog } from "./dialogs/RestartNoticeDialog";
import { ServerConnectionInfoDialog } from "./dialogs/ServerConnectionInfoDialog";
import { StreamSettingsDialog } from "./dialogs/StreamSettingsDialog";
import { ToSDialog } from "./dialogs/ToSDialog";
import { WhisperHistoryDialog } from "./dialogs/WhisperHistoryDialog";
import { WhisperListsDialog } from "./dialogs/WhisperListsDialog";
import {
  type DownloadSettings,
  loadDownloadDir,
  loadDownloadSettings,
  resolveSaveTarget,
  saveDownloadSettings,
  writeToTarget,
} from "./downloads";
import { LanguageProvider, useT } from "./i18n";
import {
  type IconPack,
  iconPackCss,
  loadIconPacks,
  loadSelectedIconPack,
  saveIconPacks,
  saveSelectedIconPack,
} from "./iconpack";
import {
  FOCUSABLE,
  focusFirstItem,
  handleMenuKeyDown,
  handleTreeKeyDown,
  useBackdropDismiss,
} from "./lib/a11y";
import { BARE_URL_REGEX, renderBbcode, wrapUrls } from "./lib/bbcode";
import { clearStillCache } from "./lib/still";
import {
  notificationTextPositions,
  notify,
  setNotificationPlaybackMuted,
  setSessionSoundPack,
} from "./notifications";
import { type PublishState, StreamPublisher, type StreamPublishOptions } from "./publish";
import { OptionsDialog } from "./settings/OptionsDialog";
import { setSoundsOutputDevice, setSoundStyle } from "./sounds";
import {
  DEFAULT_ICE_SERVERS,
  parseStreamInfo,
  type StreamEvent,
  type StreamInfo,
  StreamViewer,
} from "./stream";
import {
  AudioPlayer,
  encodeWavStereo,
  hasNativeOutputPicker,
  listAudioInputDevices,
  listAudioOutputDevices,
  MicCapture,
  pickAudioOutputDevice,
  SAMPLE_RATE,
  type VadMode,
} from "./voice";

/** Gateway serverLog kind -> Options -> Meldungen key. The server doesn't say who did it, so "by other". */
const SERVER_LOG_NOTIFICATIONS = {
  clientJoin: "CLIENT_CONNECTION_CONNECTED_SERVER",
  clientLeave: "CLIENT_CONNECTION_DISCONNECTED_SERVER",
  clientChannelSwitch: "CLIENT_SWITCHED_TO_OTHER_CHANNEL_STAYS",
  clientChannelGroupAssigned: "CLIENT_CHANNELGROUP_CHANGED_BY_USER",
  channelCreated: "CHANNEL_CREATED_BY_OTHER",
  channelDeleted: "CHANNEL_DELETED_BY_OTHER",
  channelEdited: "CHANNEL_EDITED_OTHER_BY_OTHER",
  serverEdited: "SERVER_EDITED_BY_OTHER",
  permissionError: "SERVER_INSUFFICIENT_PERMISSIONS",
} as const;

interface ChatEntry {
  from: string;
  message: string;
  /** Set for server-log notifications (join/leave/switch/etc.) so they render
   *  without a "from:" prefix, like the native client's server tab. */
  isLog?: boolean;
  /** Restored from the chat log (Options -> Chat), shown dimmed. */
  fromLog?: boolean;
}

interface PmMessage {
  fromSelf: boolean;
  message: string;
  fromLog?: boolean;
  /** Notification text (Options -> Meldungen -> Text Position "Client"). */
  isLog?: boolean;
}

interface PmThread {
  partnerId: number;
  partnerName: string;
  messages: PmMessage[];
  unread: boolean;
}

type ActiveTab = "channel" | "server" | number;

/** Private chat logs are keyed by the partner's identity, falling back to the nickname. */
function pmLogKind(uid: string | undefined, name: string): string {
  return `pm:${uid || name}`;
}

function loggedPmMessages(server: string, kind: string, lines: number): PmMessage[] {
  return readChatLog(server, kind, lines).map((l) => ({ fromSelf: !!l.self, message: l.message, fromLog: true }));
}

interface PokeNotice {
  id: number;
  from: string;
  message: string;
}
// Keep in sync with WS_MAX_PAYLOAD in gateway/src/index.ts (base64 adds ~4/3).
const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;

function readBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // data:*/*;base64,AAAA...
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function AppInner() {
  const t = useT();
  const [host, setHost] = useState(
    () =>
      localStorage.getItem(LAST_HOST_KEY) ??
      (DEMO_MODE ? DEMO_HOST : "")
  );
  const [nickname, setNickname] = useState(
    () => localStorage.getItem(LAST_NICKNAME_KEY) ?? (DEMO_MODE ? "Guest" : "")
  );
  const [serverPassword, setServerPassword] = useState("");
  const [channelPassword, setChannelPassword] = useState("");
  const [defaultChannel, setDefaultChannel] = useState("");
  const [privilegeKey, setPrivilegeKey] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [serverType, setServerType] = useState<ServerType>(loadServerType);
  // Prompt shown when switching into a password-protected channel mid-session
  // (the initial-connect "default channel" password above is a separate field).
  const [channelPasswordPrompt, setChannelPasswordPrompt] = useState<{
    channelId: number;
    channelName: string;
    wrongPassword: boolean;
  } | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // Gateway-broadcast "notice" (currently: SIGTERM restart warning). Global,
  // not per-session - it should show no matter which tab is active.
  const [restartNotice, setRestartNotice] = useState<string | null>(null);
  // What the gateway announced in its "hello" (gateway/src/index.ts). Empty for
  // a gateway older than the handshake, so a feature newer than it stays hidden.
  const [gatewayFeatures, setGatewayFeatures] = useState<ReadonlySet<string>>(new Set());
  // TURN relay the gateway offers for screen streams (TURN_URLS), if any.
  const [turnServers, setTurnServers] = useState<RTCIceServer[]>([]);
  // Terms of use, own-hosted instance only (see IS_OWN_HOSTED_INSTANCE): shown
  // mandatorily on first visit, reopenable any time from the menu afterwards.
  const [tosOpen, setTosOpen] = useState(false);
  // client.webspeak3.de/#about opens the About dialog directly (shareable link).
  const [aboutOpen, setAboutOpen] = useState(() => window.location.hash === "#about");
  const [tosMandatory, setTosMandatory] = useState(false);
  useEffect(() => {
    if (IS_OWN_HOSTED_INSTANCE && !hasAcceptedToS()) {
      setTosMandatory(true);
      setTosOpen(true);
    }
  }, []);
  const [connectDialogExpanded, setConnectDialogExpanded] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [treeFilter, setTreeFilter] = useState("");
  const [clientVolumes, setClientVolumes] = useState<Record<string, number>>(loadClientVolumes);
  /** Stream metadata per publishing client id, keyed by clid. */
  const [streamInfos, setStreamInfos] = useState<Record<number, StreamInfo>>({});
  const [watchedStream, setWatchedStream] = useState<StreamInfo | null>(null);
  const [streamMedia, setStreamMedia] = useState<MediaStream | null>(null);
  const [streamState, setStreamState] = useState<RTCPeerConnectionState>("new");
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamViewerRef = useRef<StreamViewer | null>(null);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishViewers, setPublishViewers] = useState<number[]>([]);
  const [publishPending, setPublishPending] = useState<[number, string][]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const publisherRef = useRef<StreamPublisher | null>(null);
  const publishPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [streamSettingsOpen, setStreamSettingsOpen] = useState(false);
  const streamVideoRef = useRef<HTMLVideoElement | null>(null);
  /** Clients we already pulled a `notifystreaminfo` for, so we ask only once. */
  const requestedStreamInfoRef = useRef<Set<number>>(new Set());
  /** Stable self id from the connector (`own_client_id`); nickname match is fallback only. */
  const [ownClientId, setOwnClientId] = useState<number | null>(null);
  const [serverName, setServerName] = useState("");
  const [serverMaxClients, setServerMaxClients] = useState(0);
  const [serverClientsOnline, setServerClientsOnline] = useState(0);
  const [serverChannelsOnline, setServerChannelsOnline] = useState(0);
  const [serverVersion, setServerVersion] = useState("");
  const [serverLicense, setServerLicense] = useState("");
  const [serverLicenseId, setServerLicenseId] = useState(0);
  const [serverBannerUrl, setServerBannerUrl] = useState("");
  const [showServerBanner, setShowServerBanner] = useState(() => localStorage.getItem(SERVER_BANNER_KEY) !== "off");
  const [idePixelFont, setIdePixelFont] = useState(() => localStorage.getItem(IDE_PIXEL_FONT_KEY) !== "off");
  const [chatImages, setChatImages] = useState(() => localStorage.getItem(CHAT_IMAGES_KEY) === "on");
  const [serverWelcomeMessage, setServerWelcomeMessage] = useState("");
  const [serverEditOpen, setServerEditOpen] = useState(false);
  const [serverProtocolLogOpen, setServerProtocolLogOpen] = useState(false);
  const [serverProtocolLog, setServerProtocolLog] = useState<string[] | null>(null);
  const [banListOpen, setBanListOpen] = useState(false);
  const [banList, setBanList] = useState<BanListEntry[] | null>(null);
  const [complainListOpen, setComplainListOpen] = useState(false);
  const [complainList, setComplainList] = useState<ComplainListEntry[] | null>(null);
  const [offlineMessagesOpen, setOfflineMessagesOpen] = useState(false);
  const [offlineMessageList, setOfflineMessageList] = useState<OfflineMessageListEntry[] | null>(null);
  const [offlineMessageDetail, setOfflineMessageDetail] = useState<
    { messageId: number; clientUid: string; subject: string; message: string; timestamp: string } | null
  >(null);
  const [channelGroups, setChannelGroups] = useState<GroupEntry[] | null>(null);
  const [serverGroups, setServerGroups] = useState<GroupEntry[] | null>(null);
  const [groupAssignTarget, setGroupAssignTarget] = useState<{
    kind: "channel" | "server";
    clientId: number;
    clientName: string;
  } | null>(null);
  const [moveClientTarget, setMoveClientTarget] = useState<{
    clientId: number;
    clientName: string;
    channelId: number;
  } | null>(null);
  const [permissionOverviewOpen, setPermissionOverviewOpen] = useState(false);
  const [permissionOverview, setPermissionOverview] = useState<PermissionOverviewEntry[] | null>(null);
  const [permissionsEditorOpen, setPermissionsEditorOpen] = useState(false);
  const [permissionsEditorScope, setPermissionsEditorScope] = useState<PermScope>("server");
  const [permissionsEditorEntries, setPermissionsEditorEntries] = useState<PermissionOverviewEntry[] | null>(null);
  const [permissionsEditorTarget, setPermissionsEditorTarget] = useState<
    { scope: PermScope; id1: number; id2?: number } | null
  >(null);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogEntry[] | null>(null);
  const permissionCatalogRequestedRef = useRef(false);
  const [fileBrowserTarget, setFileBrowserTarget] = useState<{ channelId: number; channelName: string } | null>(
    null
  );
  const [fileBrowserPath, setFileBrowserPath] = useState("/");
  const [fileBrowserEntries, setFileBrowserEntries] = useState<FileListEntry[] | null>(null);
  const [serverIconsOpen, setServerIconsOpen] = useState(false);
  const [serverIconEntries, setServerIconEntries] = useState<FileListEntry[] | null>(null);
  const [serverIconImages, setServerIconImages] = useState<Record<string, string>>({});
  const [treeWidth, setTreeWidth] = useState(260);
  const [upperHeight, setUpperHeight] = useState(340);
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  // Standard desktop: the info column only opens once something is picked.
  const [infoOpen, setInfoOpen] = useState(false);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [serverChat, setServerChat] = useState<ChatEntry[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [pmThreads, setPmThreads] = useState<Record<number, PmThread>>({});
  const [pokes, setPokes] = useState<PokeNotice[]>([]);
  const [pokeTarget, setPokeTarget] = useState<{ id: number; name: string } | null>(null);
  const [pokeMessage, setPokeMessage] = useState("");
  const pokeBackdrop = useBackdropDismiss(() => setPokeTarget(null));
  const [kickTarget, setKickTarget] = useState<{ id: number; name: string; scope: "channel" | "server" } | null>(
    null
  );
  const [kickReason, setKickReason] = useState("");
  const kickBackdrop = useBackdropDismiss(() => setKickTarget(null));
  const [banTarget, setBanTarget] = useState<{ id: number; name: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banSeconds, setBanSeconds] = useState("0");
  const banBackdrop = useBackdropDismiss(() => setBanTarget(null));
  const [demoForceMobile, setDemoForceMobile] = useState(false);
  // Phones get their own shell (header + big tree + bottom voice bar/tabs)
  // instead of the squeezed desktop layout.
  const [narrowScreen, setNarrowScreen] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const onChange = () => setNarrowScreen(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const mobile = narrowScreen || demoForceMobile;
  const [mobileTab, setMobileTab] = useState<"tree" | "chat" | "info">("tree");
  const [clientContextMenu, setClientContextMenu] = useState<{
    x: number;
    y: number;
    clientId: number;
    clientName: string;
    isSelf: boolean;
  } | null>(null);
  const clientContextMenuRef = useRef<HTMLDivElement>(null);
  const [serverContextMenu, setServerContextMenu] = useState<{ x: number; y: number } | null>(null);
  const serverContextMenuRef = useRef<HTMLDivElement>(null);
  const [channelContextMenu, setChannelContextMenu] = useState<{
    x: number;
    y: number;
    channelId: number;
    channelName: string;
  } | null>(null);
  const channelContextMenuRef = useRef<HTMLDivElement>(null);
  const [whisperChannelIds, setWhisperChannelIds] = useState<Set<number>>(new Set());
  const [whisperClientIds, setWhisperClientIds] = useState<Set<number>>(new Set());
  const [whisperMenuOpen, setWhisperMenuOpen] = useState(false);
  const whisperMenuRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("channel");
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => loadCustomThemes());
  const [designSelection, setDesignSelection] = useState<string>(() => loadDesignSelection());
  const activeCustomTheme = designSelection.startsWith("custom:")
    ? customThemes.find((th) => `custom:${th.id}` === designSelection) ?? null
    : null;
  // Structural base - everywhere else in the app that branches on "nova" /
  // "pulse" behavior keeps working unchanged, whether that behavior
  // came from picking the builtin directly or from a custom theme on top of it.
  const designTheme: DesignTheme = resolveDesignThemeBase(designSelection, customThemes);
  useEffect(() => setSoundStyle(designTheme === "ide" ? "ide" : "classic"), [designTheme]);
  const handleDesignSelectionChange = (next: string) => {
    setDesignSelection(next);
    localStorage.setItem(DESIGN_SELECTION_KEY, next);
  };
  // Persisted from the resolved value, not in the handler: a theme selected
  // right after being created/installed isn't in the handler's customThemes yet.
  useEffect(() => {
    localStorage.setItem(DESIGN_THEME_KEY, designTheme);
  }, [designTheme]);
  const handleSaveCustomTheme = (nextTheme: CustomTheme) => {
    setCustomThemes((prev) => {
      const idx = prev.findIndex((th) => th.id === nextTheme.id);
      const next = idx === -1 ? [...prev, nextTheme] : prev.map((th, i) => (i === idx ? nextTheme : th));
      saveCustomThemes(next);
      return next;
    });
  };
  const handleDeleteCustomTheme = (id: string) => {
    setCustomThemes((prev) => {
      const next = prev.filter((th) => th.id !== id);
      saveCustomThemes(next);
      return next;
    });
    if (designSelection === `custom:${id}`) handleDesignSelectionChange("standard");
  };
  // Custom themes ship as free-form CSS - inject/replace it in a dedicated <style>
  // tag while active, and drop it the moment no custom theme is selected.
  useEffect(() => {
    const css = activeCustomTheme?.css ?? "";
    const existing = document.getElementById("ts-custom-theme-style") as HTMLStyleElement | null;
    if (!css) {
      existing?.remove();
      return;
    }
    const el = existing ?? document.createElement("style");
    el.id = "ts-custom-theme-style";
    el.textContent = css;
    if (!existing) document.head.appendChild(el);
  }, [activeCustomTheme?.id, activeCustomTheme?.css]);
  const [treeOptions, setTreeOptions] = useState(loadTreeOptions);
  const [iconPacks, setIconPacks] = useState(loadIconPacks);
  const [iconPackId, setIconPackId] = useState(loadSelectedIconPack);
  const [whisperSettings, setWhisperSettings] = useState(loadWhisperSettings);
  const [downloadSettings, setDownloadSettings] = useState(loadDownloadSettings);
  const downloadSettingsRef = useRef(downloadSettings);
  downloadSettingsRef.current = downloadSettings;
  const [downloadDir, setDownloadDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [chatSettings, setChatSettings] = useState(loadChatSettings);
  const [securitySettings, setSecuritySettings] = useState(loadSecuritySettings);
  const securitySettingsRef = useRef(securitySettings);
  securitySettingsRef.current = securitySettings;
  // "... beim Beenden": pagehide is the last event a closing tab reliably gets.
  useEffect(() => {
    const onHide = () => {
      const settings = securitySettingsRef.current;
      if (settings.clearUrlsOnExit) localStorage.removeItem(COLLECTED_URLS_KEY);
      if (settings.clearCacheOnExit) void clearBrowserCaches();
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);
  const chatSettingsRef = useRef(chatSettings);
  chatSettingsRef.current = chatSettings;
  // "Hinweis für eingehende Nachrichten" for the two fixed tabs (private chats have their own flag).
  const [chatUnread, setChatUnread] = useState({ channel: false, server: false });
  useEffect(() => {
    void loadDownloadDir().then(setDownloadDir);
  }, []);
  const whisperSettingsRef = useRef(whisperSettings);
  whisperSettingsRef.current = whisperSettings;
  const displayPrefs = useMemo(
    () => ({
      tree: treeOptions,
      setTree: (next: TreeOptions) => {
        setTreeOptions(next);
        localStorage.setItem(TREE_OPTIONS_KEY, JSON.stringify(next));
      },
      iconPacks,
      iconPackId,
      setIconPackId: (id: string) => {
        setIconPackId(id);
        saveSelectedIconPack(id);
      },
      saveIconPacks: (packs: IconPack[]) => {
        saveIconPacks(packs); // throws when storage is full - before the state changes
        setIconPacks(packs);
      },
      whisper: whisperSettings,
      setWhisper: (next: WhisperSettings) => {
        setWhisperSettings(next);
        localStorage.setItem(WHISPER_SETTINGS_KEY, JSON.stringify(next));
      },
      downloads: downloadSettings,
      setDownloads: (next: DownloadSettings) => {
        setDownloadSettings(next);
        saveDownloadSettings(next);
      },
      downloadDir,
      setDownloadDir,
      chat: chatSettings,
      setChat: (next: ChatSettings) => {
        setChatSettings(next);
        saveChatSettings(next);
      },
      security: securitySettings,
      setSecurity: (next: SecuritySettings) => {
        setSecuritySettings(next);
        localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(next));
      },
    }),
    [treeOptions, iconPacks, iconPackId, whisperSettings, downloadSettings, downloadDir, chatSettings, securitySettings]
  );
  const iconPackStyle = iconPackCss(iconPacks.find((p) => p.id === iconPackId));
  const [micOn, setMicOn] = useState(false);
  const [talkers, setTalkers] = useState<Set<number>>(new Set());
  const [selfActive, setSelfActive] = useState(false);
  const [vadThreshold, setVadThreshold] = useState(0.02);
  const [vadHangover, setVadHangover] = useState(() => loadNumberPref(VAD_HANGOVER_KEY, 0.3));
  const [pushToTalk, setPushToTalk] = useState(() => loadBoolPref(PUSH_TO_TALK_KEY, false));
  // Only matters while pushToTalk is off: send all the time instead of voice activation.
  const [continuous, setContinuous] = useState(() => loadBoolPref(CONTINUOUS_KEY, false));
  const continuousRef = useRef(continuous);
  // Voice activation by volume, or Hybrid (volume + speech detection).
  const [vadMode, setVadMode] = useState<VadMode>(() =>
    localStorage.getItem(VAD_MODE_KEY) === "hybrid" ? "hybrid" : "volume",
  );
  const vadModeRef = useRef(vadMode);
  const [typingAttenuation, setTypingAttenuation] = useState(() => loadBoolPref(TYPING_ATTENUATION_KEY, false));
  const typingAttenuationRef = useRef(typingAttenuation);
  const [pttBinding, setPttBinding] = useState<PttBinding | null>(loadPttBinding);
  const [pttPressed, setPttPressed] = useState(false);
  // Press once to mute the microphone, again to unmute.
  const [muteBinding, setMuteBinding] = useState<PttBinding | null>(loadMuteBinding);
  // handleToggleMic is defined much further down; key handlers call it through this.
  const toggleMicRef = useRef<() => void>(() => {});
  // Keys watched system-wide by the ptt-helper companion app.
  const [globalPtt, setGlobalPtt] = useState(() => loadBoolPref(GLOBAL_PTT_KEY, false));
  const [pttHelperStatus, setPttHelperStatus] = useState<PttHelperStatus>("off");
  // True while the helper reports the mute key, so the in-page listener
  // doesn't toggle a second time for the same press.
  const helperMuteActiveRef = useRef(false);
  // Read when a new MicCapture is created, which happens outside render.
  const pushToTalkRef = useRef(pushToTalk);
  const pttPressedRef = useRef(false);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDeviceId, setOutputDeviceId] = useState("");
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [inputDeviceId, setInputDeviceId] = useState(() => localStorage.getItem(INPUT_DEVICE_KEY) ?? "");
  const [playbackVolume, setPlaybackVolume] = useState(() => loadNumberPref(PLAYBACK_VOLUME_KEY, 1));
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(() =>
    loadBoolPref(NOISE_SUPPRESSION_KEY, true)
  );
  const [echoCancellationEnabled, setEchoCancellationEnabled] = useState(() =>
    loadBoolPref(ECHO_CANCELLATION_KEY, true)
  );
  const [autoGainControlEnabled, setAutoGainControlEnabled] = useState(() =>
    loadBoolPref(AUTO_GAIN_CONTROL_KEY, true)
  );
  // Off by default: a heavier, opt-in alternative/supplement to native AEC for
  // speaker+mic (no headset) setups (github.com/WebSpeak3/webspeak3 issue #2).
  const [aec3Enabled, setAec3Enabled] = useState(() => loadBoolPref(AEC3_ENABLED_KEY, false));
  // Playback options. The clicks themselves are sounds (micClickOn/Off).
  const [autoVolume, setAutoVolume] = useState(() => loadBoolPref(AUTO_VOLUME_KEY, true));
  const [ownMicClicks, setOwnMicClicks] = useState(() => loadBoolPref(OWN_MIC_CLICKS_KEY, false));
  const [otherMicClicks, setOtherMicClicks] = useState(() => loadBoolPref(OTHER_MIC_CLICKS_KEY, false));
  // Read from the socket handler, which only sees the first render's state.
  const otherMicClicksRef = useRef(otherMicClicks);
  const talkersRef = useRef<Set<number>>(new Set());
  const [aec3Loading, setAec3Loading] = useState(false);
  const aec3Ref = useRef<Aec3Instance | null>(null);
  // Mirrors aec3Enabled but updates immediately, for startMic() calls made in
  // the same tick as a toggle (restartMic right after setAec3Enabled).
  const aec3EnabledRef = useRef(aec3Enabled);
  const [micTestOn, setMicTestOn] = useState(false);
  const [connectionsMenuOpen, setConnectionsMenuOpen] = useState(false);
  // Nova-theme-only: collapses the classic menu items behind a hamburger button.
  const [novaMenuOpen, setNovaMenuOpen] = useState(false);
  const novaMenuRef = useRef<HTMLDivElement | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadFavorites());
  /** Favorite that opened the active session tab; drives ServerQuery visibility. */
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const [favoritesMenuOpen, setFavoritesMenuOpen] = useState(false);
  const [favoritesDialogMode, setFavoritesDialogMode] = useState<
    { kind: "add"; prefill: Omit<Favorite, "id" | "bookmarkName"> } | { kind: "manage" } | null
  >(null);
  const [awayMenuOpen, setAwayMenuOpen] = useState(false);
  const [awayDialogOpen, setAwayDialogOpen] = useState(false);
  const [awayDialogMessage, setAwayDialogMessage] = useState("");
  const [awayPresets, setAwayPresets] = useState<MessagePreset[]>(() => loadAwayPresets());
  const [extrasMenuOpen, setExtrasMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [collectedUrls, setCollectedUrls] = useState<CollectedUrl[]>(() => loadCollectedUrls());
  const [collectedUrlsOpen, setCollectedUrlsOpen] = useState(false);
  const [inviteFriendOpen, setInviteFriendOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<ClientLogEntry[]>([]);
  const [clientLogOpen, setClientLogOpen] = useState(false);
  const logIdRef = useRef(0);
  const [whisperLog, setWhisperLog] = useState<WhisperLogEntry[]>([]);
  const [whisperHistoryOpen, setWhisperHistoryOpen] = useState(false);
  const [whisperLists, setWhisperLists] = useState<WhisperList[]>(() => loadWhisperLists());
  const [whisperListsOpen, setWhisperListsOpen] = useState(false);
  const [identities, setIdentities] = useState<Identity[]>(() => loadIdentities());
  const [activeIdentityId, setActiveIdentityId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_IDENTITY_KEY)
  );
  const [identitiesOpen, setIdentitiesOpen] = useState(false);
  const [clientConnectionInfoTarget, setClientConnectionInfoTarget] = useState<{ id: number; name: string } | null>(
    null
  );
  const [clientConnectionInfo, setClientConnectionInfo] = useState<ClientConnectionInfoData | null>(null);
  const [serverConnectionInfoOpen, setServerConnectionInfoOpen] = useState(false);
  const [serverConnectionInfo, setServerConnectionInfo] = useState<ServerConnectionInfoData | null>(null);
  const [selfMenuOpen, setSelfMenuOpen] = useState(false);
  const selfMenuRef = useRef<HTMLDivElement | null>(null);
  const [rightsMenuOpen, setRightsMenuOpen] = useState(false);
  const rightsMenuRef = useRef<HTMLDivElement | null>(null);
  const [changeNicknameOpen, setChangeNicknameOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const nicknameBackdrop = useBackdropDismiss(() => setChangeNicknameOpen(false));
  const [serverQueryLoginOpen, setServerQueryLoginOpen] = useState(false);
  const [serverQueryUsername, setServerQueryUsername] = useState("");
  const [serverQueryPassword, setServerQueryPassword] = useState("");
  const serverQueryLoginBackdrop = useBackdropDismiss(() => setServerQueryLoginOpen(false));
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts());
  const [contactsOpen, setContactsOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const whisperLogIdRef = useRef(0);
  const prevWhisperTargetsRef = useRef<{ channels: Set<number>; clients: Set<number> } | null>(null);
  // Channel passwords entered this session, so re-entering a channel already
  // unlocked doesn't prompt again. In-memory only - cleared on disconnect.
  const channelPasswordCacheRef = useRef<Map<number, string>>(new Map());

  const logClient = (level: LogLevel, category: string, message: string) => {
    const entry: ClientLogEntry = { id: ++logIdRef.current, timestamp: Date.now(), category, level, message };
    setLogEntries((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
  };
  // client.webspeak3.de/#options/konto opens Options on that section (shareable link, e.g. for the ticker).
  const linkedOptionsSection = OPTIONS_SECTIONS.find((s) => window.location.hash === `#options/${s.id}`)?.id;
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(!!linkedOptionsSection);
  const [optionsSection, setOptionsSection] = useState<string>(linkedOptionsSection ?? OPTIONS_SECTIONS[0].id);
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (hash === "#about") setAboutOpen(true);
      const section = OPTIONS_SECTIONS.find((s) => hash === `#options/${s.id}`)?.id;
      if (section) {
        setOptionsSection(section);
        setOptionsDialogOpen(true);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const socketRef = useRef<WebSocket | DemoSocket | null>(null);
  /** Multi-join: one gateway WebSocket (+ connector) per session tab. */
  const [sessionTabs, setSessionTabs] = useState<SessionTabInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const sessionsRef = useRef<Map<string, SessionRecord>>(new Map());
  const activeSessionIdRef = useRef<string | null>(null);
  /** Last-used connect params per session, kept around so a dropped session
   *  (active OR parked/background) can reconnect itself without the user
   *  re-entering host/password — see reconnectSession(). */
  const sessionParamsRef = useRef<Map<string, ConnectParams>>(new Map());
  const connectionsMenuRef = useRef<HTMLDivElement | null>(null);
  const favoritesMenuRef = useRef<HTMLDivElement | null>(null);
  const awayMenuRef = useRef<HTMLDivElement | null>(null);
  const extrasMenuRef = useRef<HTMLDivElement | null>(null);
  const helpMenuRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const micCaptureRef = useRef<MicCapture | null>(null);
  // A shared tab's or window's audio, mixed into the mic (MicCapture.setExtraAudio).
  const tabAudioRef = useRef<MediaStream | null>(null);
  const [tabAudioOn, setTabAudioOn] = useState(false);
  const recordProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recordSilenceRef = useRef<GainNode | null>(null);
  const recordChunksRef = useRef<{ left: Float32Array[]; right: Float32Array[] }>({ left: [], right: [] });
  const activeTabRef = useRef<ActiveTab>("channel");
  const hasConnectedRef = useRef(false);
  // Sessions that reached "connected" at least once. hasConnectedRef (and
  // parked.hasConnected) reset for every reconnect attempt; this doesn't, so
  // a failed reconnect keeps retrying instead of closing the tab outright.
  const everConnectedRef = useRef(new Set<string>());
  // Set when a "disconnected" event is received, so the socket's onclose
  // handler (which fires shortly after, on its own close handshake) can tell
  // a clean disconnect apart from the socket dying before ever connecting.
  const cleanDisconnectRef = useRef(false);
  const previousClientsRef = useRef<ClientInfo[] | null>(null);
  const pokeIdRef = useRef(0);
  const inputMutedRef = useRef(false);
  const outputMutedRef = useRef(false);
  const micLevelRef = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [chat, serverChat, pmThreads, activeTab]);

  useEffect(() => {
    localStorage.setItem(COLLECTED_URLS_KEY, JSON.stringify(collectedUrls));
  }, [collectedUrls]);

  useEffect(() => {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(CLIENT_VOLUMES_KEY, JSON.stringify(clientVolumes));
  }, [clientVolumes]);

  // Push each visible client's volume to its connector. Remembered per socket,
  // so a reconnect (fresh connector) resends everything, and a client id reused
  // by someone else gets reset to that person's volume.
  const sentClientVolumesRef = useRef(new WeakMap<object, Map<number, number>>());
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected || !gatewayFeatures.has("clientVolume")) return;
    let sent = sentClientVolumesRef.current.get(socket);
    if (!sent) sentClientVolumesRef.current.set(socket, (sent = new Map()));
    for (const c of clients) {
      const volume = clientVolumes[c.uid] ?? 1;
      if ((sent.get(c.id) ?? 1) === volume) continue;
      socket.send(JSON.stringify({ type: "setClientVolume", clientId: c.id, volume }));
      sent.set(c.id, volume);
    }
  }, [clients, clientVolumes, connected, gatewayFeatures]);

  useEffect(() => {
    localStorage.setItem(WHISPER_LISTS_KEY, JSON.stringify(whisperLists));
  }, [whisperLists]);

  useEffect(() => {
    localStorage.setItem(IDENTITIES_KEY, JSON.stringify(identities));
  }, [identities]);

  useEffect(() => {
    if (activeIdentityId) localStorage.setItem(ACTIVE_IDENTITY_KEY, activeIdentityId);
  }, [activeIdentityId]);

  const isSenderIgnored = (senderName: string) => {
    const senderClient = clients.find((c) => c.name === senderName);
    if (!senderClient?.uid) return false;
    return contacts.some((c) => c.uid === senderClient.uid && c.ignored);
  };

  const recordUrlsFromMessage = (message: string, sender: string) => {
    const found = message.match(BARE_URL_REGEX);
    if (!found) return;
    const now = Date.now();
    setCollectedUrls((prev) => {
      const next = [...prev];
      for (const url of found) {
        const idx = next.findIndex((u) => u.url === url);
        if (idx >= 0) {
          next[idx] = { ...next[idx], count: next[idx].count + 1, lastSeen: now, lastSender: sender };
        } else {
          next.push({ url, count: 1, lastSeen: now, lastSender: sender });
        }
      }
      return next;
    });
  };

  // Same lookup as `ownClient` below: by server-reported id first, since a
  // nickname match breaks as soon as we're renamed (by us or the server).
  const ownNameRef = useRef<string | null>(null);
  useEffect(() => {
    const own =
      (ownClientId != null ? clients.find((c) => c.id === ownClientId) : null) ??
      clients.find((c) => c.name === nickname) ??
      null;
    inputMutedRef.current = own?.inputMuted ?? false;
    outputMutedRef.current = own?.outputMuted ?? false;
    ownNameRef.current = own?.name ?? null;
  }, [clients, nickname, ownClientId]);

  useEffect(() => {
    if (micCaptureRef.current) micCaptureRef.current.threshold = vadThreshold;
  }, [vadThreshold]);

  useEffect(() => {
    if (micCaptureRef.current) micCaptureRef.current.hangoverSeconds = vadHangover;
    localStorage.setItem(VAD_HANGOVER_KEY, String(vadHangover));
  }, [vadHangover]);

  useEffect(() => {
    pushToTalkRef.current = pushToTalk;
    if (micCaptureRef.current) micCaptureRef.current.pushToTalk = pushToTalk;
    localStorage.setItem(PUSH_TO_TALK_KEY, pushToTalk ? "1" : "0");
  }, [pushToTalk]);

  useEffect(() => {
    localStorage.setItem(GLOBAL_PTT_KEY, globalPtt ? "1" : "0");
  }, [globalPtt]);

  useEffect(() => {
    continuousRef.current = continuous;
    if (micCaptureRef.current) micCaptureRef.current.continuous = continuous;
    localStorage.setItem(CONTINUOUS_KEY, continuous ? "1" : "0");
  }, [continuous]);

  useEffect(() => {
    vadModeRef.current = vadMode;
    micCaptureRef.current?.setVadMode(vadMode);
    localStorage.setItem(VAD_MODE_KEY, vadMode);
  }, [vadMode]);

  useEffect(() => {
    typingAttenuationRef.current = typingAttenuation;
    if (micCaptureRef.current) micCaptureRef.current.typingAttenuation = typingAttenuation;
    localStorage.setItem(TYPING_ATTENUATION_KEY, typingAttenuation ? "1" : "0");
    if (!typingAttenuation) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // The push-to-talk key is not typing.
      if (e.code !== pttBinding?.code) micCaptureRef.current?.noteTyping();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [typingAttenuation, pttBinding]);

  useEffect(() => {
    pttPressedRef.current = pttPressed;
    if (micCaptureRef.current) micCaptureRef.current.pttPressed = pttPressed;
  }, [pttPressed]);

  useEffect(() => {
    if (pttBinding) localStorage.setItem(PTT_BINDING_KEY, JSON.stringify(pttBinding));
  }, [pttBinding]);

  useEffect(() => {
    if (muteBinding) localStorage.setItem(MUTE_BINDING_KEY, JSON.stringify(muteBinding));
    else localStorage.removeItem(MUTE_BINDING_KEY);
  }, [muteBinding]);

  // Mute toggle while this tab has focus. With ptt-helper connected the
  // helper reports the key instead (it also sees it here), so skip then.
  useEffect(() => {
    if (!muteBinding) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== muteBinding.code || e.repeat || e.defaultPrevented) return;
      if (e.key.length === 1 && isTypingTarget(e.target)) return;
      if (!isTypingTarget(e.target)) e.preventDefault();
      if (!helperMuteActiveRef.current) toggleMicRef.current();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (`Mouse${e.button}` !== muteBinding.code) return;
      e.preventDefault();
      if (!helperMuteActiveRef.current) toggleMicRef.current();
    };
    // Side buttons navigate back/forward on release.
    const onMouseUp = (e: MouseEvent) => {
      if (`Mouse${e.button}` === muteBinding.code) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [muteBinding]);

  // Browsers only deliver keys while this tab has focus - there's no global
  // hotkey for websites, so PTT can't work while another program is in front.
  useEffect(() => {
    if (!pushToTalk || !pttBinding) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== pttBinding.code || e.defaultPrevented) return;
      // A letter key still has to type in chat; F-keys or modifiers work anywhere.
      if (e.key.length === 1 && isTypingTarget(e.target)) return;
      if (!isTypingTarget(e.target)) e.preventDefault();
      setPttPressed(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === pttBinding.code) setPttPressed(false);
    };
    // preventDefault: no middle-click autoscroll, no back/forward navigation
    // from the side buttons (which fires on release).
    const onMouseDown = (e: MouseEvent) => {
      if (`Mouse${e.button}` !== pttBinding.code) return;
      e.preventDefault();
      setPttPressed(true);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (`Mouse${e.button}` !== pttBinding.code) return;
      e.preventDefault();
      setPttPressed(false);
    };
    // The keyup goes to whatever has focus next; don't leave the mic open.
    const release = () => setPttPressed(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", release);
      release();
    };
  }, [pushToTalk, pttBinding]);

  // ptt-helper: the browser never sees keys pressed in another program, so a
  // small local app watches the push-to-talk and mute keys system-wide and
  // reports their edges over ws://127.0.0.1. Retries every few seconds while
  // it isn't running.
  const helperPttCode = pushToTalk && pttBinding ? pttBinding.code : null;
  const helperMuteCode = muteBinding?.code ?? null;
  useEffect(() => {
    helperMuteActiveRef.current = false;
    if (!globalPtt) {
      setPttHelperStatus("off");
      return;
    }
    const codes = [...new Set([helperPttCode, helperMuteCode].filter((c): c is string => !!c))];
    if (codes.length === 0) {
      setPttHelperStatus("nokey");
      return;
    }
    let ws: WebSocket | null = null;
    let retry: number | undefined;
    let stopped = false;
    // 0.1 helpers watch a single key and only report it as {"type":"ptt"}.
    let legacy = false;
    const connect = () => {
      try {
        ws = new WebSocket(`ws://127.0.0.1:${PTT_HELPER_PORT}`);
      } catch {
        setPttHelperStatus("missing");
        retry = window.setTimeout(connect, 5000);
        return;
      }
      ws.onmessage = (e) => {
        let msg: { type?: string; version?: string; ok?: boolean; unsupported?: string[]; code?: string; pressed?: boolean };
        try {
          msg = JSON.parse(String(e.data));
        } catch {
          return;
        }
        if (msg.type === "hello") {
          legacy = /^0\.1\./.test(msg.version ?? "");
          if (!legacy) ws?.send(JSON.stringify({ type: "bind", codes }));
          else if (helperPttCode) ws?.send(JSON.stringify({ type: "bind", code: helperPttCode }));
          else setPttHelperStatus("outdated");
        } else if (msg.type === "bound") {
          if (legacy) {
            setPttHelperStatus(!msg.ok ? "unsupported" : helperMuteCode ? "outdated" : "connected");
          } else {
            const unsupported = msg.unsupported ?? [];
            helperMuteActiveRef.current = !!helperMuteCode && !unsupported.includes(helperMuteCode);
            setPttHelperStatus(msg.ok ? "connected" : "unsupported");
          }
        } else if (msg.type === "ptt") {
          setPttPressed(!!msg.pressed);
        } else if (msg.type === "key") {
          if (msg.code === helperPttCode) setPttPressed(!!msg.pressed);
          if (msg.code === helperMuteCode && msg.pressed) toggleMicRef.current();
        }
      };
      ws.onclose = () => {
        helperMuteActiveRef.current = false;
        if (stopped) return;
        // Never leave the mic open because the helper went away mid-press.
        setPttPressed(false);
        setPttHelperStatus("missing");
        retry = window.setTimeout(connect, 5000);
      };
    };
    connect();
    return () => {
      stopped = true;
      helperMuteActiveRef.current = false;
      window.clearTimeout(retry);
      ws?.close();
    };
  }, [globalPtt, helperPttCode, helperMuteCode]);

  useEffect(() => {
    audioPlayerRef.current?.setVolume(playbackVolume);
    localStorage.setItem(PLAYBACK_VOLUME_KEY, String(playbackVolume));
  }, [playbackVolume]);

  useEffect(() => {
    audioPlayerRef.current?.setAutoVolume(autoVolume);
    localStorage.setItem(AUTO_VOLUME_KEY, autoVolume ? "1" : "0");
  }, [autoVolume]);

  useEffect(() => {
    localStorage.setItem(OWN_MIC_CLICKS_KEY, ownMicClicks ? "1" : "0");
  }, [ownMicClicks]);

  useEffect(() => {
    otherMicClicksRef.current = otherMicClicks;
    localStorage.setItem(OTHER_MIC_CLICKS_KEY, otherMicClicks ? "1" : "0");
  }, [otherMicClicks]);

  useEffect(() => {
    localStorage.setItem(NOISE_SUPPRESSION_KEY, noiseSuppressionEnabled ? "1" : "0");
  }, [noiseSuppressionEnabled]);

  useEffect(() => {
    localStorage.setItem(ECHO_CANCELLATION_KEY, echoCancellationEnabled ? "1" : "0");
  }, [echoCancellationEnabled]);

  useEffect(() => {
    localStorage.setItem(AUTO_GAIN_CONTROL_KEY, autoGainControlEnabled ? "1" : "0");
  }, [autoGainControlEnabled]);

  useEffect(() => {
    localStorage.setItem(AEC3_ENABLED_KEY, aec3Enabled ? "1" : "0");
  }, [aec3Enabled]);

  useEffect(() => {
    if (inputDeviceId) localStorage.setItem(INPUT_DEVICE_KEY, inputDeviceId);
  }, [inputDeviceId]);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === "channel" || activeTab === "server")
      setChatUnread((prev) => (prev[activeTab] ? { ...prev, [activeTab]: false } : prev));
    if (typeof activeTab === "number") {
      setPmThreads((prev) => {
        const thread = prev[activeTab];
        if (!thread || !thread.unread) return prev;
        return { ...prev, [activeTab]: { ...thread, unread: false } };
      });
    }
  }, [activeTab]);

  const refreshOutputDevices = async () => {
    try {
      const devices = await listAudioOutputDevices();
      setOutputDevices(devices);
    } catch {
      // Device labels/enumeration may be unavailable before mic permission is granted.
    }
  };

  const refreshInputDevices = async () => {
    try {
      const devices = await listAudioInputDevices();
      setInputDevices(devices);
    } catch {
      // Device labels/enumeration may be unavailable before mic permission is granted.
    }
  };

  useEffect(() => {
    const refreshBoth = () => {
      void refreshOutputDevices();
      void refreshInputDevices();
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshBoth);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshBoth);
  }, []);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    const sessions = sessionsRef.current;
    return () => {
      for (const rec of sessions.values()) {
        try {
          rec.socket?.close();
        } catch {
          /* ignore */
        }
      }
      sessions.clear();
    };
  }, []);

  const appendLog = (entry: LogEntry) => setLog((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);

  const startTreeResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = treeWidth;
    const onMove = (ev: MouseEvent) => {
      setTreeWidth(Math.min(500, Math.max(150, startWidth + (ev.clientX - startX))));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startUpperResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = upperHeight;
    const onMove = (ev: MouseEvent) => {
      setUpperHeight(Math.min(700, Math.max(120, startHeight + (ev.clientY - startY))));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Bumped by every start/stop: a startMic() still awaiting getUserMedia
  // compares against it afterwards and discards its mic if it was superseded,
  // instead of installing it after a stopMic() that already "ran".
  const micGenerationRef = useRef(0);

  const stopMic = () => {
    micGenerationRef.current++;
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    setMicOn(false);
    setSelfActive(false);
  };

  // Mic/output-device setup shouldn't require an active server connection (like
  // the real TS3 client, where you can test your devices before connecting) -
  // lazily create the audio context on first use instead of tying it to connect.
  const ensureAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = audioContext;
      const player = new AudioPlayer(audioContext);
      audioPlayerRef.current = player;
      // The volume effect and the device picker only ever touch the player
      // that existed at the time - a fresh one (first use, or after
      // disposeAudioIfIdle) has to be brought up to the current settings.
      player.setVolume(playbackVolume);
      player.setAutoVolume(autoVolume);
      if (outputDeviceId) {
        player.setOutputDevice(outputDeviceId).catch((error: Error) =>
          appendLog({ text: `Output device error: ${error.message}`, kind: "error" }),
        );
      }
    }
    return audioContextRef.current;
  };

  // Browsers keep an AudioContext created without a user gesture (auto-mic
  // on page load, a reconnect) "suspended" - silent - until one happens. The
  // mic permission prompt used to be the only thing resuming it, so with the
  // mic denied or absent you'd never hear anyone. Any click/keypress does it,
  // and also starts the player's hidden <audio> element (see unlock()).
  useEffect(() => {
    const resume = () => {
      const ctx = audioContextRef.current;
      if (ctx?.state === "suspended") ctx.resume().catch(() => {});
      audioPlayerRef.current?.unlock();
    };
    // pointerup too: on touch screens pointerdown doesn't count as a user
    // gesture, so resume()/play() from it alone are refused on phones.
    window.addEventListener("pointerdown", resume, true);
    window.addEventListener("pointerup", resume, true);
    window.addEventListener("keydown", resume, true);
    return () => {
      window.removeEventListener("pointerdown", resume, true);
      window.removeEventListener("pointerup", resume, true);
      window.removeEventListener("keydown", resume, true);
    };
  }, []);

  const snapshotActiveToParked = (): ParkedSessionState =>
    emptyParkedState({
      host,
      nickname,
      connected,
      connecting,
      connectError,
      channels,
      clients,
      ownClientId,
      serverName,
      serverMaxClients,
      serverClientsOnline,
      serverChannelsOnline,
      serverVersion,
      serverLicense,
      serverLicenseId,
      serverBannerUrl,
      serverWelcomeMessage,
      selected,
      chat,
      serverChat,
      pmThreads,
      pokes,
      chatTab: activeTab,
      talkers: [...talkers],
      whisperChannelIds: [...whisperChannelIds],
      whisperClientIds: [...whisperClientIds],
      whisperLog,
      log,
      hasConnected: hasConnectedRef.current,
      previousClients: previousClientsRef.current,
      micWasOn: micOn,
      favoriteId: activeFavoriteId,
    });

  const applyParkedToUi = (parked: ParkedSessionState) => {
    setHost(parked.host);
    setNickname(parked.nickname);
    setConnected(parked.connected);
    setConnecting(parked.connecting);
    setConnectError(parked.connectError);
    setChannels(parked.channels);
    setClients(parked.clients);
    setOwnClientId(parked.ownClientId);
    setServerName(parked.serverName);
    setServerMaxClients(parked.serverMaxClients);
    setServerClientsOnline(parked.serverClientsOnline);
    setServerChannelsOnline(parked.serverChannelsOnline);
    setServerVersion(parked.serverVersion);
    setServerLicense(parked.serverLicense);
    setServerLicenseId(parked.serverLicenseId);
    setServerBannerUrl(parked.serverBannerUrl);
    setServerWelcomeMessage(parked.serverWelcomeMessage);
    setSelected(parked.selected);
    setChat(parked.chat);
    setServerChat(parked.serverChat);
    setPmThreads(parked.pmThreads);
    setPokes(parked.pokes);
    setActiveFavoriteId(parked.favoriteId);
    setActiveTab(parked.chatTab);
    talkersRef.current = new Set(parked.talkers);
    setTalkers(talkersRef.current);
    setWhisperChannelIds(new Set(parked.whisperChannelIds));
    setWhisperClientIds(new Set(parked.whisperClientIds));
    setWhisperLog(parked.whisperLog);
    setLog(parked.log);
    hasConnectedRef.current = parked.hasConnected;
    previousClientsRef.current = parked.previousClients;
    // Sync the "previous" whisper-target baseline to the tab we're restoring,
    // so the whisper-target effect (keyed on whisperChannelIds/whisperClientIds)
    // sees no change on this switch and doesn't replay a spurious started/stopped
    // log entry or resend setWhisperTargets for a target that didn't change.
    prevWhisperTargetsRef.current = {
      channels: new Set(parked.whisperChannelIds),
      clients: new Set(parked.whisperClientIds),
    };
    cleanDisconnectRef.current = false;
  };

  const clearActiveUi = () => {
    setConnected(false);
    setConnecting(false);
    setConnectError(null);
    setChannelPasswordPrompt(null);
    channelPasswordCacheRef.current.clear();
    setChannels([]);
    setClients([]);
    setOwnClientId(null);
    setServerName("");
    setServerMaxClients(0);
    setServerClientsOnline(0);
    setServerChannelsOnline(0);
    setServerVersion("");
    setServerLicense("");
    setServerLicenseId(0);
    setServerBannerUrl("");
    setServerWelcomeMessage("");
    setSelected(null);
    setChat([]);
    setServerChat([]);
    setPmThreads({});
    setChatUnread({ channel: false, server: false });
    setPokes([]);
    setActiveTab("channel");
    talkersRef.current = new Set();
    setTalkers(talkersRef.current);
    setWhisperChannelIds(new Set());
    setWhisperClientIds(new Set());
    setWhisperLog([]);
    prevWhisperTargetsRef.current = null;
    hasConnectedRef.current = false;
    previousClientsRef.current = null;
    cleanDisconnectRef.current = false;
    setActiveFavoriteId(null);
  };

  // serverGroups/channelGroups/permissionCatalog/banList/fileBrowser* are
  // per-server data cached at the page level rather than per-tab (they're not
  // part of ParkedSessionState). Without invalidating them on a multi-join tab
  // switch, the existing "if (!serverGroups) fetch" guards would keep serving
  // the previous session's server the newly active tab belongs to.
  const resetPerServerCaches = () => {
    setServerGroups(null);
    setChannelGroups(null);
    setPermissionCatalog(null);
    permissionCatalogRequestedRef.current = false;
    setBanList(null);
    setFileBrowserTarget(null);
    setFileBrowserPath("/");
    setFileBrowserEntries(null);
  };

  const updateTabMeta = (id: string, patch: Partial<SessionTabInfo>) => {
    setSessionTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const disposeAudioIfIdle = () => {
    if (sessionsRef.current.size > 0) return;
    stopMic();
    stopRecording();
    // AEC3 is bound to this context's render tap - keep the preference, but
    // drop the instance so startMic() builds a fresh one on the next context.
    teardownAec3();
    audioPlayerRef.current?.dispose();
    audioPlayerRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  };

  const parkActiveSession = () => {
    const id = activeSessionIdRef.current;
    if (!id) return;
    const rec = sessionsRef.current.get(id);
    if (!rec) return;
    rec.parked = snapshotActiveToParked();
    updateTabMeta(id, {
      label: sessionLabel(rec.parked),
      connected: rec.parked.connected,
      connecting: rec.parked.connecting,
    });
    stopMic();
    stopRecording();
    // Stream state is global, not per tab: left running, its signaling would
    // go out on the next tab's socket and its clids would name other people.
    handleStopWatchingStream();
    handleStopPublishing();
    setStreamInfos({});
    requestedStreamInfoRef.current.clear();
  };

  const switchToSession = (id: string) => {
    if (id === activeSessionIdRef.current) return;
    const target = sessionsRef.current.get(id);
    if (!target) return;
    parkActiveSession();
    const parked = target.parked ?? emptyParkedState({ host: target.id });
    target.parked = null;
    applyParkedToUi(parked);
    resetPerServerCaches();
    socketRef.current = target.socket as WebSocket | DemoSocket | null;
    activeSessionIdRef.current = id;
    setActiveSessionId(id);
    updateTabMeta(id, {
      label: sessionLabel(parked),
      connected: parked.connected,
      connecting: parked.connecting,
    });
    // parkActiveSession() above stopped the mic when leaving the previous tab -
    // restore it here if it was on for the tab we're switching back to, so
    // re-entering a tab doesn't silently leave the user unable to transmit.
    // "Mikrofon beim Wechseln des Servers automatisch aktivieren" turns it on either way.
    if (parked.micWasOn || (parked.connected && loadAppSettings().micOnServerSwitch)) void startMic();
  };

  const removeSession = (id: string, opts?: { skipSocketClose?: boolean }) => {
    everConnectedRef.current.delete(id);
    const rec = sessionsRef.current.get(id);
    if (rec && !opts?.skipSocketClose) {
      try {
        const sock = rec.socket;
        if (sock && sock.readyState === WebSocket.OPEN) {
          const message = loadDisconnectMessage();
          if (message) sock.send(JSON.stringify({ type: "disconnect", message }));
        }
        sock?.close();
      } catch {
        /* ignore */
      }
    }
    if (rec) {
      try {
        if (rec.socket) (rec.socket as WebSocket).onmessage = null;
      } catch {
        /* ignore */
      }
    }
    sessionsRef.current.delete(id);
    sessionParamsRef.current.delete(id);
    lastChannelClickBySession.delete(id);
    setSessionTabs((prev) => prev.filter((t) => t.id !== id));

    if (activeSessionIdRef.current !== id) {
      disposeAudioIfIdle();
      return;
    }

    const remaining = [...sessionsRef.current.keys()];
    if (remaining.length > 0) {
      const nextId = remaining[remaining.length - 1];
      const nextRec = sessionsRef.current.get(nextId)!;
      const parked = nextRec.parked ?? emptyParkedState();
      nextRec.parked = null;
      applyParkedToUi(parked);
      resetPerServerCaches();
      socketRef.current = nextRec.socket as WebSocket | DemoSocket | null;
      activeSessionIdRef.current = nextId;
      setActiveSessionId(nextId);
      if (parked.micWasOn) void startMic();
    } else {
      clearActiveUi();
      socketRef.current = null;
      activeSessionIdRef.current = null;
      setActiveSessionId(null);
      disposeAudioIfIdle();
    }
  };

  // Wires onopen/onmessage/onerror/onclose for one session's socket. Shared
  // by handleConnect (brand-new session) and reconnectSession (an existing
  // session — active or parked in the background — getting a fresh socket
  // after an unexpected drop), so a reconnect behaves identically to the
  // original connect from the gateway/UI's point of view.
  // Rebuilt every render and only ever called through socketHandlersRef, so
  // a long-lived socket always sees current state (clients, contacts, t,
  // mic settings, ...) instead of whatever existed when it connected.
  const socketHandlers = (sessionId: string, socket: WebSocket | DemoSocket, params: ConnectParams) => {
    const connectHost = params.host;
    const connectNickname = params.nickname;
    const connectServerPassword = params.serverPassword;
    const connectChannelPassword = params.channelPassword;
    const connectDefaultChannel = params.defaultChannel;
    const connectPrivilegeKey = params.privilegeKey;
    const connectServerType = params.serverType;
    const connectIdentityId = params.identityId;
    const connectFavoriteId = params.favoriteId;
    const connectIdentityBlob = identities.find((i) => i.id === connectIdentityId)?.blob ?? undefined;

    const sendConnect = (extra: Record<string, unknown> = {}) => {
      let turnstilePass: string | undefined;
      try {
        turnstilePass = localStorage.getItem(TURNSTILE_PASS_KEY) ?? undefined;
      } catch {
        /* storage blocked */
      }
      socket.send(
        JSON.stringify({
          ...extra,
          turnstilePass,
          type: "connect",
          host: connectHost,
          nickname: connectNickname,
          serverPassword: connectServerPassword || undefined,
          channelPassword: connectChannelPassword || undefined,
          defaultChannel: connectDefaultChannel || undefined,
          identity: connectIdentityBlob || undefined,
          privilegeKey: connectPrivilegeKey.trim() || undefined,
          serverType: connectServerType || "auto",
          loginName: (connectServerType === "ts2" && params.loginName?.trim()) || undefined,
          loginPassword: (connectServerType === "ts2" && params.loginPassword) || undefined,
        })
      );
    };
    const onopen = () => {
      logClient("info", "Connection", `Connecting to ${connectHost}…`);
      sendConnect();
    };

    // Downloads arrive in pieces (see the connector's TRANSFER_CHUNK_BYTES),
    // keyed by channel + path; every piece but the last is a whole number of
    // base64 groups, so the strings just concatenate.
    const downloadChunks = new Map<string, string[]>();

    const onmessage = (event: MessageEvent) => {
      let data = JSON.parse(event.data);
      if (data.type === "fileDownloadChunk") {
        const key = `${data.cid}\n${data.path}`;
        if (data.offset === 0) downloadChunks.set(key, []);
        const pieces = downloadChunks.get(key);
        if (!pieces) return;
        pieces.push(data.data);
        const transfer = findTransfer("down", data.cid, data.path);
        if (transfer) {
          transfer.done = data.offset + (data.data.length * 3) / 4;
          commitTransfers();
        }
        if (!data.done) return;
        downloadChunks.delete(key);
        data = { type: "fileDownloadData", cid: data.cid, path: data.path, data: pieces.join("") };
      }

      // Broadcast, not tied to any one session - show it regardless of which
      // tab is active, and regardless of which tab's socket it arrived on
      // (every open session gets its own copy of the same broadcast).
      if (data.type === "notice") {
        // messageKey lets the gateway send a fixed, translated notice (e.g.
        // the SIGTERM restart warning) without knowing the client's language;
        // message is a plain-text fallback for anything else.
        setRestartNotice(data.messageKey ? t(data.messageKey) : String(data.message || ""));
        return;
      }
      if (data.type === "hello") {
        setGatewayFeatures(new Set(Array.isArray(data.features) ? data.features : []));
        setTurnServers(Array.isArray(data.iceServers) ? data.iceServers : []);
        return;
      }
      if (data.type === "turnstileRequired") {
        void getTurnstileToken().then((turnstileToken) => {
          if (socket.readyState === WebSocket.OPEN) sendConnect({ turnstileToken });
        });
        return;
      }
      if (data.type === "turnstilePass") {
        try {
          localStorage.setItem(TURNSTILE_PASS_KEY, String(data.pass));
        } catch {
          /* storage blocked: the check just runs again next time */
        }
        return;
      }

      // Inactive tab: update parked snapshot only (no audio playback).
      if (sessionId !== activeSessionIdRef.current) {
        const rec = sessionsRef.current.get(sessionId);
        if (!rec) return;
        if (!rec.parked) {
          rec.parked = emptyParkedState({
            host: connectHost,
            nickname: connectNickname,
            favoriteId: connectFavoriteId,
          });
        }
        if (data.type === "disconnected") {
          sessionsRef.current.delete(sessionId);
          sessionParamsRef.current.delete(sessionId);
          setSessionTabs((prev) => prev.filter((t) => t.id !== sessionId));
          void notify("CONNECTION_DISCONNECTED");
          return;
        }
        // Background tabs get logged too (Options -> Chat).
        const chatPrefs = chatSettingsRef.current;
        if (data.type === "chatMessage" && chatPrefs.logChannel)
          appendChatLog(connectHost, "channel", { from: data.from, message: data.message, self: data.from === connectNickname });
        else if (data.type === "serverMessage" && chatPrefs.logServer)
          appendChatLog(connectHost, "server", { from: data.from, message: data.message, self: data.from === connectNickname });
        else if (data.type === "privateMessage" && chatPrefs.logPrivate)
          appendChatLog(
            connectHost,
            pmLogKind(rec.parked.clients.find((c) => c.id === data.partnerId)?.uid, data.partnerName),
            { from: data.partnerName, message: data.message, self: data.fromSelf }
          );
        const result = applyParkedGatewayEvent(rec.parked, data, {
          connectNickname,
          chatTab: rec.parked.chatTab,
        });
        rec.parked = result.state;
        updateTabMeta(sessionId, {
          label: sessionLabel(rec.parked),
          connected: rec.parked.connected,
          connecting: rec.parked.connecting,
        });
        if (data.type === "connected") {
          connectedAtRef.current.set(sessionId, Date.now());
          void notify("CONNECTION_CONNECTED");
        }
        else if (data.type === "poke") void notify("OTHER_RECEIVED_POKE");
        return;
      }

      switch (data.type) {
        case "connected":
          logClient("info", "Connection", `Connected to ${data.serverName}`);
          connectedAtRef.current.set(sessionId, Date.now());
          autoConnectPendingRef.current = false;
          hasConnectedRef.current = true;
          everConnectedRef.current.add(sessionId);
          setConnecting(false);
          setConnectError(null);
          setConnected(true);
          setChat(
            readChatLog(connectHost, "channel", chatSettingsRef.current.restoreChannelLines).map((l) => ({
              from: l.from,
              message: l.message,
              fromLog: true,
            }))
          );
          updateTabMeta(sessionId, {
            label: String(data.serverName || connectHost),
            connected: true,
            connecting: false,
          });
          localStorage.setItem(LAST_HOST_KEY, connectHost);
          localStorage.setItem(LAST_NICKNAME_KEY, connectNickname);
          localStorage.setItem(LAST_SERVER_TYPE_KEY, connectServerType);
          if (connectIdentityId) {
            setIdentities((prev) =>
              prev.map((i) =>
                i.id === connectIdentityId
                  ? { ...i, blob: data.identity || i.blob, nickname: connectNickname }
                  : i
              )
            );
          }
          setServerName(data.serverName);
          setServerMaxClients(data.serverMaxClients);
          setServerClientsOnline(0);
          setServerChannelsOnline(0);
          setServerVersion(data.serverVersion);
          setServerLicense(data.serverLicense);
          setServerLicenseId(typeof data.serverLicenseId === "number" ? data.serverLicenseId : 0);
          setServerBannerUrl(data.serverBannerUrl);
          setServerWelcomeMessage(data.welcomeMessage);
          setSelected({ type: "server" });
          setServerChat((prev) => capLines([...prev, { from: "Server", message: data.welcomeMessage }], chatSettingsRef.current.maxLines));
          previousClientsRef.current = null;
          void notify("CONNECTION_CONNECTED");
          break;
        case "channels": {
          const newClients: ClientInfo[] = data.clients;
          const prevClients = previousClientsRef.current;
          if (prevClients) {
            const ownId = typeof data.ownClientId === "number" && data.ownClientId > 0 ? data.ownClientId : null;
            const isOwn = (c: ClientInfo) => (ownId != null ? c.id === ownId : c.name === connectNickname);
            const prevById = new Map(prevClients.map((c) => [c.id, c]));
            const newIds = new Set(newClients.map((c) => c.id));
            const oldOwn = prevClients.find(isOwn)?.channel;
            const newOwn = newClients.find(isOwn)?.channel;
            // One sound per kind per update; ServerQuery churn is noisy, never notify for those.
            const keys = new Set<string>();
            if (oldOwn != null && newOwn != null && oldOwn !== newOwn) {
              keys.add("YOU_SWITCHED_CHANNEL");
              if (loadAppSettings().autoOpenChannelChat) setActiveTab("channel");
            }
            for (const c of newClients) {
              if (isOwn(c) || c.isQuery) continue;
              const before = prevById.get(c.id);
              if (!before) keys.add(`CLIENT_CONNECTION_CONNECTED_${c.channel === newOwn ? "CURRENT_CHANNEL" : "SERVER"}`);
              else if (before.channel !== c.channel)
                keys.add(
                  c.channel === newOwn
                    ? "CLIENT_SWITCHED_TO_CURRENT_CHANNEL_STAYS"
                    : before.channel === oldOwn
                      ? "CLIENT_SWITCHED_FROM_CURRENT_CHANNEL_STAYS"
                      : "CLIENT_SWITCHED_TO_OTHER_CHANNEL_STAYS"
                );
            }
            for (const c of prevClients)
              if (!newIds.has(c.id) && !isOwn(c) && !c.isQuery)
                keys.add(`CLIENT_CONNECTION_DISCONNECTED_${c.channel === oldOwn ? "CURRENT_CHANNEL" : "SERVER"}`);
            for (const key of keys) void notify(key);
          }
          previousClientsRef.current = newClients;
          setChannels(data.channels);
          setClients(newClients);
          if (typeof data.ownClientId === "number" && data.ownClientId > 0) {
            setOwnClientId(data.ownClientId);
          }
          // Only apply positive max — gateway maps missing connector fields to 0.
          if (typeof data.serverMaxClients === "number" && data.serverMaxClients > 0) {
            setServerMaxClients(data.serverMaxClients);
          }
          if (typeof data.serverClientsOnline === "number" && data.serverClientsOnline >= 0) {
            setServerClientsOnline(data.serverClientsOnline);
          }
          if (typeof data.serverChannelsOnline === "number" && data.serverChannelsOnline >= 0) {
            setServerChannelsOnline(data.serverChannelsOnline);
          }
          break;
        }
        case "chatMessage":
        case "serverMessage": {
          if (isSenderIgnored(data.from)) break;
          const tab = data.type === "chatMessage" ? "channel" : "server";
          const settings = chatSettingsRef.current;
          const fromSelf = data.from === connectNickname || data.from === ownNameRef.current;
          const entry = { from: data.from, message: data.message };
          (tab === "channel" ? setChat : setServerChat)((prev) => capLines([...prev, entry], settings.maxLines));
          if (tab === "channel" ? settings.logChannel : settings.logServer)
            appendChatLog(connectHost, tab, { ...entry, self: fromSelf });
          if (!fromSelf && activeTabRef.current !== tab && (tab === "channel" ? settings.notifyChannel : settings.notifyServer))
            setChatUnread((prev) => ({ ...prev, [tab]: true }));
          recordUrlsFromMessage(data.message, data.from);
          void notify(fromSelf ? "CHAT_SENT_MESSAGE" : "CHAT_RECEIVED_MESSAGE");
          break;
        }
        case "privateMessage": {
          if (!data.fromSelf && isSenderIgnored(data.partnerName)) break;
          const settings = chatSettingsRef.current;
          const logKind = pmLogKind(
            previousClientsRef.current?.find((c) => c.id === data.partnerId)?.uid,
            data.partnerName
          );
          // Read before appending this message, so a new thread's history doesn't contain it twice.
          const history = loggedPmMessages(connectHost, logKind, settings.restorePrivateLines);
          setPmThreads((prev) => {
            const existing = prev[data.partnerId];
            const thread: PmThread = existing ?? {
              partnerId: data.partnerId,
              partnerName: data.partnerName,
              messages: history,
              unread: false,
            };
            return {
              ...prev,
              [data.partnerId]: {
                ...thread,
                partnerName: data.partnerName,
                messages: capLines(
                  [...thread.messages, { fromSelf: data.fromSelf, message: data.message }],
                  settings.maxLines
                ),
                unread:
                  thread.unread ||
                  (settings.notifyPrivate && !data.fromSelf && activeTabRef.current !== data.partnerId),
              },
            };
          });
          if (settings.logPrivate)
            appendChatLog(connectHost, logKind, { from: data.partnerName, message: data.message, self: data.fromSelf });
          recordUrlsFromMessage(data.message, data.fromSelf ? connectNickname : data.partnerName);
          void notify(data.fromSelf ? "CHAT_SENT_MESSAGE" : "CHAT_RECEIVED_MESSAGE");
          break;
        }
        case "audioOut":
          // Audio only for the active session tab.
          if (!outputMutedRef.current) audioPlayerRef.current?.playFrame(data.pcm);
          break;
        case "talkers": {
          const next = new Set<number>(data.clients);
          const prev = talkersRef.current;
          if (otherMicClicksRef.current && !outputMutedRef.current) {
            // One click per update, even if several people start at once.
            if ([...next].some((id) => !prev.has(id))) void notify("SPECIAL_MIC_CLICK_OTHER_ON");
            else if ([...prev].some((id) => !next.has(id))) void notify("SPECIAL_MIC_CLICK_OTHER_OFF");
          }
          talkersRef.current = next;
          setTalkers(next);
          break;
        }
        case "whisperReceived": {
          const name = previousClientsRef.current?.find((c) => c.id === data.clientId)?.name ?? `#${data.clientId}`;
          setWhisperLog((prevLog) => [
            ...prevLog,
            {
              id: ++whisperLogIdRef.current,
              timestamp: Date.now(),
              description: t("whisperHistory.received", { name }),
              incoming: true,
            },
          ]);
          if (whisperSettingsRef.current.sound && !outputMutedRef.current) void notify("SPECIAL_WHISPER_NOTIFY");
          if (whisperSettingsRef.current.openHistory) setWhisperHistoryOpen(true);
          break;
        }
        case "reconnecting":
          // The gateway lost the TS server and is reconnecting by itself.
          appendLog({ text: t("log.serverReconnecting"), kind: "error" });
          void notify("CONNECTION_LOST_CONNECTION");
          logClient("warning", "Connection", `Lost the server, reconnecting: ${data.reason}`);
          updateTabMeta(sessionId, { connecting: true });
          break;
        case "reconnected":
          appendLog({ text: t("log.serverReconnected"), kind: "info" });
          logClient("info", "Connection", "Reconnected to the server");
          updateTabMeta(sessionId, { connecting: false });
          break;
        case "streamEvent": {
          const streamEvent = data as StreamEvent;
          if (streamEvent.name === "notifystreaminfo" || streamEvent.name === "notifystreamstarted") {
            const info = parseStreamInfo(streamEvent.args);
            if (info) setStreamInfos((prev) => ({ ...prev, [info.clientId]: info }));
          }
          if (streamEvent.name === "notifystreamstopped") {
            const clid = Number(streamEvent.args.clid);
            if (Number.isFinite(clid)) {
              setStreamInfos((prev) => {
                if (!(clid in prev)) return prev;
                const next = { ...prev };
                delete next[clid];
                return next;
              });
            }
          }
          streamViewerRef.current?.handleEvent(streamEvent);
          publisherRef.current?.handleEvent(streamEvent);
          break;
        }
        case "poke": {
          if (!loadAppSettings().neverShowPokeDialog) {
            const id = ++pokeIdRef.current;
            setPokes((prev) => [...prev, { id, from: data.from, message: data.message }]);
            setTimeout(() => setPokes((prev) => prev.filter((p) => p.id !== id)), 10000);
          }
          void notify("OTHER_RECEIVED_POKE", { clientName: data.from });
          break;
        }
        case "serverLog": {
          let message: string;
          switch (data.kind) {
            case "clientJoin":
              message = t("serverLog.clientJoin", { client: data.client, channel: data.channel });
              break;
            case "clientLeave":
              message = t("serverLog.clientLeave", { client: data.client });
              break;
            case "clientChannelSwitch":
              message = t("serverLog.clientChannelSwitch", {
                client: data.client,
                fromChannel: data.fromChannel,
                toChannel: data.toChannel,
              });
              break;
            case "clientChannelGroupAssigned":
              message = t("serverLog.clientChannelGroupAssigned", { client: data.client, group: data.group });
              break;
            case "channelCreated":
              message = t("serverLog.channelCreated", { channel: data.channel });
              break;
            case "channelDeleted":
              message = t("serverLog.channelDeleted", { channel: data.channel });
              break;
            case "channelEdited":
              message = t("serverLog.channelEdited", { channel: data.channel });
              break;
            case "serverEdited":
              message = t("serverLog.serverEdited");
              break;
            case "permissionError":
              message = t("serverLog.permissionError", { action: data.action });
              break;
          }
          const key = SERVER_LOG_NOTIFICATIONS[data.kind as keyof typeof SERVER_LOG_NOTIFICATIONS];
          // Join/leave/switch sounds come from the channel diff above; these only place the text.
          if (!["clientJoin", "clientLeave", "clientChannelSwitch"].includes(data.kind)) void notify(key);
          const maxLines = chatSettingsRef.current.maxLines;
          for (const position of notificationTextPositions(key)) {
            if (position === "client") {
              // Into an open private chat with that client, if there is one.
              const client = "client" in data ? data.client : undefined;
              setPmThreads((prev) => {
                const thread = Object.values(prev).find((th) => th.partnerName === client);
                if (!thread) return prev;
                const messages = capLines([...thread.messages, { fromSelf: false, message, isLog: true }], maxLines);
                return { ...prev, [thread.partnerId]: { ...thread, messages } };
              });
            } else
              (position === "channel" ? setChat : setServerChat)((prev) =>
                capLines([...prev, { from: "", message, isLog: true }], maxLines)
              );
          }
          break;
        }
        case "disconnected": {
          const wasConnected = hasConnectedRef.current;
          cleanDisconnectRef.current = true;
          setChannelPasswordPrompt(null);
          channelPasswordCacheRef.current.clear();
          appendLog({ text: `Disconnected: ${data.reason}`, kind: "info" });
          logClient("info", "Connection", `Disconnected: ${data.reason}`);
          if (wasConnected) void notify("CONNECTION_DISCONNECTED");
          streamViewerRef.current?.close();
          streamViewerRef.current = null;
          setWatchedStream(null);
          setStreamMedia(null);
          setStreamInfos({});
          requestedStreamInfoRef.current.clear();
          publisherRef.current?.stop();
          publisherRef.current = null;
          setPublishState("idle");
          setPublishViewers([]);
          setPublishPending([]);
          removeSession(sessionId, { skipSocketClose: true });
          break;
        }
        case "channelPasswordRequired": {
          // A cached password just got rejected (channel password changed,
          // or was wrong) - drop it so the next auto-switch doesn't reuse it.
          channelPasswordCacheRef.current.delete(data.channelId);
          if (storedChannelPassword(connectHost, data.channelId) !== undefined)
            storeChannelPassword(connectHost, data.channelId, null);
          setChannelPasswordPrompt((prev) => ({
            channelId: data.channelId,
            channelName: channels.find((c) => c.id === data.channelId)?.name ?? "",
            wrongPassword: prev?.channelId === data.channelId,
          }));
          break;
        }
        case "error": {
          logClient("error", "Connection", data.message);
          // Transfer errors carry the transfer's channel + path.
          if (typeof data.path === "string") {
            const failed = transfersRef.current.find(
              (x) => x.status === "running" && x.cid === data.cid && x.path === data.path
            );
            if (failed) finishTransfer(failed, false);
          }
          if (hasConnectedRef.current) {
            appendLog({ text: data.message, kind: "error" });
          } else {
            setConnecting(false);
            setConnectError(
              data.code === "gateway_full"
                ? t("connectError.gatewayFull")
                : data.code === "turnstile_failed"
                  ? t("connectError.botCheck")
                  : data.message
            );
            updateTabMeta(sessionId, { connecting: false, connected: false });
          }
          break;
        }
        case "clientConnectionInfo":
          setClientConnectionInfo({
            clientId: data.clientId,
            pingMs: data.pingMs,
            connectedSecs: data.connectedSecs,
            ip: data.ip,
            packetsSent: data.packetsSent,
            bytesSent: data.bytesSent,
            packetsReceived: data.packetsReceived,
            bytesReceived: data.bytesReceived,
            packetLossPercent: data.packetLossPercent,
          });
          break;
        case "serverConnectionInfo":
          setServerConnectionInfo({
            pingMs: data.pingMs,
            connectedSecs: data.connectedSecs,
            packetLossPercent: data.packetLossPercent,
            packetsSentTotal: data.packetsSentTotal,
            bytesSentTotal: data.bytesSentTotal,
            packetsReceivedTotal: data.packetsReceivedTotal,
            bytesReceivedTotal: data.bytesReceivedTotal,
            bandwidthSentLastSecond: data.bandwidthSentLastSecond,
            bandwidthReceivedLastSecond: data.bandwidthReceivedLastSecond,
            bandwidthSentLastMinute: data.bandwidthSentLastMinute ?? 0,
            bandwidthReceivedLastMinute: data.bandwidthReceivedLastMinute ?? 0,
            filetransferBandwidthSent: data.filetransferBandwidthSent ?? 0,
            filetransferBandwidthReceived: data.filetransferBandwidthReceived ?? 0,
            filetransferBytesSent: data.filetransferBytesSent ?? 0,
            filetransferBytesReceived: data.filetransferBytesReceived ?? 0,
          });
          break;
        case "serverProtocolLog":
          setServerProtocolLog(data.lines);
          break;
        case "banList":
          setBanList(data.entries);
          break;
        case "complainList":
          setComplainList(data.entries);
          break;
        case "offlineMessageList":
          setOfflineMessageList(data.entries);
          break;
        case "offlineMessage":
          setOfflineMessageDetail({
            messageId: data.messageId,
            clientUid: data.clientUid,
            subject: data.subject,
            message: data.message,
            timestamp: data.timestamp,
          });
          break;
        case "channelGroupList":
          setChannelGroups(data.entries);
          break;
        case "serverGroupList":
          setServerGroups(data.entries);
          break;
        case "permissionOverview":
          setPermissionOverview(data.entries);
          break;
        case "fileList":
          // Channel 0 isn't a real, selectable channel - it's TS3's special
          // server-wide icon repository, so a listing for it always means the
          // server icons window, never the per-channel file browser.
          if (data.cid === 0) {
            setServerIconEntries(
              data.entries.filter((e: FileListEntry) => e.isFile && /^icon_\d+$/.test(e.name))
            );
          } else {
            setFileBrowserEntries(data.entries);
          }
          break;
        case "fileDownloadData": {
          if (data.cid === 0) {
            // Icon preview fetch, not a user-initiated download - stash the
            // bytes for the server icons grid instead of saving a file.
            setServerIconImages((prev) => ({ ...prev, [data.path]: data.data }));
          } else {
            const filename = data.path.split("/").filter(Boolean).pop() ?? "download";
            const transfer = findTransfer("down", data.cid, data.path);
            if (!transfer) {
              triggerBrowserDownload(filename, data.data);
              break;
            }
            const blob = base64Blob(data.data);
            void writeToTarget(transfer.target ?? null, blob).then((saved) => {
              if (!saved) downloadBlob(blob, filename);
              finishTransfer(transfer, true);
            });
          }
          break;
        }
        case "fileUploadDone": {
          const transfer = findTransfer("up", data.cid, data.path);
          if (transfer) finishTransfer(transfer, true);
          if (data.cid === 0) handleServerIconsRefresh();
          else handleFileBrowserRefresh();
          break;
        }
        case "permList":
          setPermissionsEditorEntries(data.entries);
          break;
        case "permissionCatalog":
          setPermissionCatalog(data.entries);
          break;
      }
    };

    const onerror = () => {
      logClient("error", "WebSocket", "WebSocket error (is the gateway running?)");
      if (sessionId !== activeSessionIdRef.current) {
        const rec = sessionsRef.current.get(sessionId);
        if (rec?.parked && !rec.parked.hasConnected) {
          rec.parked = {
            ...rec.parked,
            connecting: false,
            connectError: "Could not reach the gateway - is it running?",
          };
          updateTabMeta(sessionId, { connecting: false, connected: false });
        }
        return;
      }
      if (!hasConnectedRef.current) {
        setConnecting(false);
        setConnectError("Could not reach the gateway - is it running?");
        updateTabMeta(sessionId, { connecting: false, connected: false });
      } else {
        appendLog({ text: "WebSocket error (is the gateway running?)", kind: "error" });
      }
    };
    const onclose = () => {
      if (sessionId !== activeSessionIdRef.current) {
        const rec = sessionsRef.current.get(sessionId);
        // Missing already means a deliberate disconnect (the "disconnected"
        // message handler above already removed it) — nothing to do.
        if (!rec) return;
        if (rec.parked?.hasConnected || everConnectedRef.current.has(sessionId)) {
          // Unexpected drop of a background tab (network blip, or the OS
          // suspended the backgrounded/screen-off page) — keep the tab
          // instead of dropping it, same as a real TS3 client keeps other
          // server connections open while you're looking at a different
          // one. It comes back on its own (immediately if we're still in
          // the foreground, otherwise the visibilitychange handler retries
          // it once the page is visible again), mic still off throughout.
          if (rec.parked) rec.parked = { ...rec.parked, connecting: false, connected: false };
          updateTabMeta(sessionId, { connecting: false, connected: false });
          if (document.visibilityState === "visible") scheduleReconnectRef.current(sessionId);
          return;
        }
        sessionsRef.current.delete(sessionId);
        sessionParamsRef.current.delete(sessionId);
        setSessionTabs((prev) => prev.filter((t) => t.id !== sessionId));
        return;
      }
      if (!hasConnectedRef.current && !cleanDisconnectRef.current && everConnectedRef.current.has(sessionId)) {
        // A reconnect attempt of a session that was connected before failed
        // - same as a drop: keep the tab and let the backoff try again.
        setConnecting(false);
        setConnected(false);
        updateTabMeta(sessionId, { connecting: false, connected: false });
        if (document.visibilityState === "visible") scheduleReconnectRef.current(sessionId);
        return;
      }
      if (!hasConnectedRef.current && !cleanDisconnectRef.current) {
        setConnecting(false);
        setConnectError((prev) => prev ?? "Connection closed before the server responded");
        cleanDisconnectRef.current = false;
        if (sessionsRef.current.has(sessionId)) {
          removeSession(sessionId, { skipSocketClose: true });
        }
        return;
      }
      const wasConnected = hasConnectedRef.current;
      cleanDisconnectRef.current = false;
      if (wasConnected && sessionsRef.current.has(sessionId)) {
        // Same as above, for the active tab: an unexpected drop after a
        // successful connect tries to come back rather than closing the tab.
        // A deliberate disconnect goes through the "disconnected" message
        // handler (or handleDisconnect()), both of which remove the session
        // before this fires, so we only land here for a real hiccup.
        setConnected(false);
        updateTabMeta(sessionId, { connecting: false, connected: false });
        if (document.visibilityState === "visible") scheduleReconnectRef.current(sessionId);
        return;
      }
      if (sessionsRef.current.has(sessionId)) {
        removeSession(sessionId, { skipSocketClose: true });
      }
    };
    return { onopen, onmessage, onerror, onclose };
  };
  const socketHandlersRef = useRef(socketHandlers);
  socketHandlersRef.current = socketHandlers;

  const wireSocket = (sessionId: string, socket: WebSocket | DemoSocket, params: ConnectParams) => {
    const current = () => socketHandlersRef.current(sessionId, socket, params);
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    socket.onopen = () => current().onopen();
    socket.onmessage = (event) => {
      // Armed by the "hello" announcing "keepalive", or by the first keepalive.
      // The quoted word cannot come from user text, where JSON escapes quotes.
      if (watchdog !== undefined || String(event.data).includes('"keepalive"')) {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => {
          // close() on a dead link may take a minute to fire onclose, so
          // detach and run the drop handling right away.
          socket.onmessage = socket.onerror = socket.onclose = null;
          socket.close();
          logClient("warning", "Connection", `No keepalive from the gateway for ${KEEPALIVE_TIMEOUT_MS / 1000} s`);
          current().onclose();
        }, KEEPALIVE_TIMEOUT_MS);
      }
      if (event.data !== KEEPALIVE_MESSAGE) current().onmessage(event);
    };
    socket.onerror = () => current().onerror();
    socket.onclose = (event) => {
      clearTimeout(watchdog);
      // 1000/1001 are clean closes; 1006 means the link died without a close frame.
      logClient("info", "Connection", `Gateway connection closed (code ${event.code ?? "?"})`);
      current().onclose();
    };
  };

  // A remembered or favorite host outside the admin's list isn't one of the
  // choices; fall back to the first.
  const dialogHost = SERVER_CHOICES.length && !SERVER_CHOICES.includes(host) ? SERVER_CHOICES[0] : host;

  const handleConnect = (overrides?: {
    host?: string;
    nickname?: string;
    serverPassword?: string;
    channelPassword?: string;
    defaultChannel?: string;
    privilegeKey?: string;
    serverType?: ServerType;
    favoriteId?: string | null;
  }) => {
    const params: ConnectParams = {
      host: overrides?.host ?? host,
      nickname: overrides?.nickname ?? nickname,
      serverPassword: overrides?.serverPassword ?? serverPassword,
      channelPassword: overrides?.channelPassword ?? channelPassword,
      defaultChannel: overrides?.defaultChannel ?? defaultChannel,
      privilegeKey: overrides?.privilegeKey ?? privilegeKey,
      serverType: overrides?.serverType ?? serverType,
      loginName,
      loginPassword,
      identityId: activeIdentityId,
      favoriteId: overrides?.favoriteId !== undefined ? overrides.favoriteId : null,
    };

    // Multi-join: keep existing sessions; park the active tab and open a new one.
    if (activeSessionIdRef.current && sessionsRef.current.has(activeSessionIdRef.current)) {
      parkActiveSession();
    }

    clearActiveUi();
    setActiveFavoriteId(params.favoriteId);
    hasConnectedRef.current = false;
    setConnecting(true);
    setConnectError(null);
    setConnectDialogOpen(false);
    setHost(params.host);
    setNickname(params.nickname);

    ensureAudioContext();

    const sessionId = randomId();
    sessionParamsRef.current.set(sessionId, params);

    const socket = DEMO_MODE ? new DemoSocket() : new WebSocket(GATEWAY_URL);
    sessionsRef.current.set(sessionId, { id: sessionId, socket, parked: null });
    socketRef.current = socket;
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
    setSessionTabs((prev) => [
      ...prev,
      { id: sessionId, label: params.host || "…", connected: false, connecting: true },
    ]);

    wireSocket(sessionId, socket, params);
  };

  // Auto-connect from a ?connect=... share link or a build-time default
  // server (issue #10). Fires once, after the mandatory first-visit ToS gate
  // (if any) is out of the way, so it never races the gate or connects
  // before the user has had a chance to accept it.
  const autoConnectedRef = useRef(false);
  const autoConnectPendingRef = useRef(false);
  useEffect(() => {
    if (autoConnectedRef.current) return;
    if (tosMandatory && tosOpen) return;
    const target = AUTO_CONNECT_FROM_URL ??
      (DEFAULT_SERVER
        ? { host: DEFAULT_SERVER, nickname: undefined, defaultChannel: DEFAULT_CHANNEL, privilegeKey: undefined }
        : null);
    if (!target) return;
    autoConnectedRef.current = true;
    autoConnectPendingRef.current = true;
    handleConnect({
      host: target.host,
      nickname: target.nickname || nickname || `Guest-${Math.floor(1000 + Math.random() * 9000)}`,
      defaultChannel: target.defaultChannel,
      privilegeKey: target.privilegeKey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tosMandatory, tosOpen]);

  // A manual connect attempt leaves its error as a dismissable banner with the
  // dialog already closed - fine, since the user just closed it themselves.
  // An auto-connect attempt has no dialog open at all, so on failure reopen it
  // prefilled with the attempted host, letting the user fix and retry by hand.
  useEffect(() => {
    if (!autoConnectPendingRef.current || !connectError) return;
    autoConnectPendingRef.current = false;
    setHost(AUTO_CONNECT_FROM_URL?.host ?? DEFAULT_SERVER ?? host);
    setConnectDialogOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectError]);

  // Opens a fresh socket for a session that already exists (active or
  // parked) and re-runs the same connect handshake, reusing the params
  // stored at connect time. Used to recover from an unexpected drop —
  // network blip, or the page coming back from being backgrounded/suspended
  // — without disturbing which tab is active or losing chat/scroll history.
  const reconnectSession = (sessionId: string) => {
    let params = sessionParamsRef.current.get(sessionId);
    const rec = sessionsRef.current.get(sessionId);
    if (!params || !rec) return;
    // Already open or mid-(re)connect — nothing to do.
    if (rec.socket && rec.socket.readyState !== WebSocket.CLOSED && rec.socket.readyState !== WebSocket.CLOSING) {
      return;
    }

    // Come back in the channel we were in, like the native client does. Kept
    // in the params so a failed attempt (empty client list) still aims there.
    const isActive = sessionId === activeSessionIdRef.current;
    const state = isActive ? { clients, ownClientId } : rec.parked;
    const lastChannel = state?.clients.find((c) => c.id === state.ownClientId)?.channel;
    if (lastChannel) {
      const cachedPassword = isActive
        ? (channelPasswordCacheRef.current.get(lastChannel) ?? savedChannelPassword(lastChannel))
        : undefined;
      params = { ...params, defaultChannel: `/${lastChannel}`, channelPassword: cachedPassword ?? params.channelPassword };
      sessionParamsRef.current.set(sessionId, params);
    }

    logClient("info", "Connection", `Reconnecting to ${params.host}…`);
    const socket = DEMO_MODE ? new DemoSocket() : new WebSocket(GATEWAY_URL);
    rec.socket = socket;
    if (sessionId === activeSessionIdRef.current) {
      socketRef.current = socket;
      hasConnectedRef.current = false;
      setConnecting(true);
      setConnectError(null);
    } else if (rec.parked) {
      rec.parked = { ...rec.parked, connecting: true, connected: false, connectError: null };
    }
    updateTabMeta(sessionId, { connecting: true, connected: false });
    wireSocket(sessionId, socket, params);
  };

  const reconnectSessionRef = useRef(reconnectSession);
  reconnectSessionRef.current = reconnectSession;

  // Per-session backoff so a persistently unreachable gateway doesn't get
  // hammered with back-to-back reconnect attempts (each one fails near-
  // instantly, which without a delay would tight-loop). Reset to 0 once a
  // session actually reaches "connected" again (see the two spots below).
  const reconnectAttemptsRef = useRef<Map<string, number>>(new Map());
  // The backoff only starts over once a connection held for a while: on a
  // flaky network a reconnect that drops again after a few seconds used to
  // reset it to 1 s every time, so each tab reconnected every few seconds.
  const connectedAtRef = useRef<Map<string, number>>(new Map());
  const STABLE_CONNECTION_MS = 30_000;
  // The gateway sends this every 20 s (heartbeat in gateway/src/index.ts). A
  // network that dies silently never closes the socket on this side, so a
  // socket that stays quiet this long counts as dropped.
  const KEEPALIVE_MESSAGE = '{"type":"keepalive"}';
  const KEEPALIVE_TIMEOUT_MS = 50_000;
  const reconnectTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const scheduleReconnect = (sessionId: string) => {
    if (reconnectTimersRef.current.has(sessionId)) return; // already scheduled
    const connectedAt = connectedAtRef.current.get(sessionId);
    connectedAtRef.current.delete(sessionId);
    if (connectedAt !== undefined && Date.now() - connectedAt >= STABLE_CONNECTION_MS) {
      reconnectAttemptsRef.current.delete(sessionId);
    }
    const attempt = reconnectAttemptsRef.current.get(sessionId) ?? 0;
    const delay = Math.min(1000 * 2 ** attempt, 30_000);
    reconnectAttemptsRef.current.set(sessionId, attempt + 1);
    const timer = setTimeout(() => {
      reconnectTimersRef.current.delete(sessionId);
      // A manual disconnect meanwhile drops the session's stored params, so
      // reconnectSession() below is a no-op in that case — no explicit
      // cancellation needed.
      reconnectSessionRef.current(sessionId);
    }, delay);
    reconnectTimersRef.current.set(sessionId, timer);
  };
  const scheduleReconnectRef = useRef(scheduleReconnect);
  scheduleReconnectRef.current = scheduleReconnect;

  // Android/mobile browsers aggressively suspend backgrounded or screen-off
  // tabs — timers stall and the OS/browser can silently drop a WebSocket
  // without ever firing onerror/onclose while hidden. There's no event for
  // that; the only reliable signal is coming back to a socket that isn't
  // OPEN anymore. Wake Lock keeps the screen (and the tab's throttling) at
  // bay while any session is live — active tab AND parked background ones,
  // same as a real TS3 client keeping every joined server connected, mic
  // only ever live for the foreground tab. The visibilitychange re-check
  // below catches whatever still slips through (screen-off ignores Wake
  // Lock on some devices, the lock request can be refused, full app
  // backgrounding on Android isn't preventable from a web page at all) by
  // reconnecting every dropped session with the params used last time.
  useEffect(() => {
    if (sessionTabs.length === 0) return;

    let wakeLock: { release: () => Promise<void> } | null = null;
    const releaseWakeLock = () => {
      wakeLock?.release().catch(() => {});
      wakeLock = null;
    };
    const requestWakeLock = () => {
      const wl = (navigator as { wakeLock?: { request: (type: "screen") => Promise<any> } }).wakeLock;
      if (!wl || document.visibilityState !== "visible") return;
      wl.request("screen")
        .then((lock) => {
          wakeLock = lock;
          lock.addEventListener("release", () => {
            if (wakeLock === lock) wakeLock = null;
          });
        })
        .catch(() => {
          /* refused (battery saver, unsupported, …) — non-fatal */
        });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      requestWakeLock();
      if (!loadAppSettings().reconnectAfterSleep) return;
      for (const id of sessionsRef.current.keys()) {
        reconnectSessionRef.current(id);
      }
    };

    // Back online: retry now instead of waiting out a backoff of up to 30 s.
    const onOnline = () => {
      if (!loadAppSettings().reconnectAfterSleep) return;
      reconnectAttemptsRef.current.clear();
      for (const id of sessionsRef.current.keys()) reconnectSessionRef.current(id);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    requestWakeLock();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      releaseWakeLock();
    };
  }, [sessionTabs.length]);

  const handleDisconnect = () => {
    const id = activeSessionIdRef.current;
    if (id) {
      removeSession(id);
      return;
    }
    const socket = socketRef.current;
    if (!socket) return;
    const message = loadDisconnectMessage();
    if (message && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "disconnect", message }));
    }
    socket.close();
  };

  const handleDisconnectAll = () => {
    const ids = [...sessionsRef.current.keys()];
    for (const id of ids) {
      const rec = sessionsRef.current.get(id);
      if (!rec) continue;
      try {
        const sock = rec.socket;
        if (sock && sock.readyState === WebSocket.OPEN) {
          const message = loadDisconnectMessage();
          if (message) sock.send(JSON.stringify({ type: "disconnect", message }));
        }
        sock?.close();
      } catch {
        /* ignore */
      }
    }
    sessionsRef.current.clear();
    setSessionTabs([]);
    clearActiveUi();
    socketRef.current = null;
    activeSessionIdRef.current = null;
    setActiveSessionId(null);
    disposeAudioIfIdle();
  };

  const closeSessionTab = (id: string) => {
    removeSession(id);
  };


  const connectToFavorite = (f: Favorite) => {
    setHost(f.host);
    setNickname(f.nickname);
    setServerPassword(f.serverPassword);
    setChannelPassword(f.defaultChannelPassword);
    setDefaultChannel(f.defaultChannel);
    handleConnect({
      host: f.host,
      nickname: f.nickname,
      serverPassword: f.serverPassword,
      channelPassword: f.defaultChannelPassword,
      defaultChannel: f.defaultChannel,
      favoriteId: f.id,
    });
  };

  const saveFavorites = (next: Favorite[]) => {
    const normalized = next.map((f) => normalizeFavorite(f));
    setFavorites(normalized);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(normalized));
  };

  const openAddFavorite = () => {
    setFavoritesDialogMode({
      kind: "add",
      prefill: {
        host,
        nickname,
        serverPassword,
        defaultChannel,
        defaultChannelPassword: channelPassword,
        showServerQueryClients: false,
      },
    });
    setFavoritesMenuOpen(false);
  };

  const openManageFavorites = () => {
    setFavoritesDialogMode({ kind: "manage" });
    setFavoritesMenuOpen(false);
  };

  const sendAway = (away: boolean, message: string) => {
    socketRef.current?.send(JSON.stringify({ type: "setAway", away, message }));
    void notify(away ? "STATUS_SET_AWAY" : "STATUS_SET_PRESENT");
  };

  const handleSaveAwayTemplate = () => {
    const trimmed = awayDialogMessage.trim();
    if (!trimmed) return;
    setAwayPresets((prev) => {
      if (prev.some((p) => p.message === trimmed)) return prev;
      const next = [...prev, { name: trimmed, message: trimmed }];
      saveAwayPresets(next);
      return next;
    });
    setAwayDialogOpen(false);
  };

  const handleConfirmAway = () => {
    sendAway(true, awayDialogMessage);
    setAwayDialogOpen(false);
  };

  useEffect(() => {
    if (!novaMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!novaMenuRef.current?.contains(e.target as Node)) setNovaMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNovaMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [novaMenuOpen]);

  useEffect(() => {
    if (!connectionsMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!connectionsMenuRef.current?.contains(e.target as Node)) setConnectionsMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConnectionsMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [connectionsMenuOpen]);

  useEffect(() => {
    if (!favoritesMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!favoritesMenuRef.current?.contains(e.target as Node)) setFavoritesMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFavoritesMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [favoritesMenuOpen]);

  useEffect(() => {
    if (!awayMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!awayMenuRef.current?.contains(e.target as Node)) setAwayMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAwayMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [awayMenuOpen]);

  useEffect(() => {
    if (!clientContextMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!clientContextMenuRef.current?.contains(e.target as Node)) setClientContextMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClientContextMenu(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    // Keyboard users (context-menu key / Shift+F10) land in the menu and get
    // focus back on the row once it closes.
    const previous = document.activeElement as HTMLElement | null;
    clientContextMenuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      if (document.activeElement === document.body) previous?.focus();
    };
  }, [clientContextMenu]);

  useEffect(() => {
    if (!serverContextMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!serverContextMenuRef.current?.contains(e.target as Node)) setServerContextMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setServerContextMenu(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    // Keyboard users (context-menu key / Shift+F10) land in the menu and get
    // focus back on the row once it closes.
    const previous = document.activeElement as HTMLElement | null;
    serverContextMenuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      if (document.activeElement === document.body) previous?.focus();
    };
  }, [serverContextMenu]);

  useEffect(() => {
    if (!channelContextMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!channelContextMenuRef.current?.contains(e.target as Node)) setChannelContextMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChannelContextMenu(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    // Keyboard users (context-menu key / Shift+F10) land in the menu and get
    // focus back on the row once it closes.
    const previous = document.activeElement as HTMLElement | null;
    channelContextMenuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      if (document.activeElement === document.body) previous?.focus();
    };
  }, [channelContextMenu]);

  // Icon files aren't previewable from the listing alone - fetch each one's
  // bytes individually once, then cache them in serverIconImages so re-runs
  // (triggered by that same state update) become no-ops for already-fetched icons.
  useEffect(() => {
    if (!serverIconsOpen || !serverIconEntries) return;
    for (const entry of serverIconEntries) {
      const path = `/${entry.name}`;
      if (!(path in serverIconImages)) {
        socketRef.current?.send(JSON.stringify({ type: "downloadFile", channelId: 0, path }));
      }
    }
  }, [serverIconsOpen, serverIconEntries, serverIconImages]);

  // Server group badges next to client names need the group list (for the
  // id->icon lookup) even if the user never opens a group-related dialog -
  // fetch it once per connection instead of only on demand.
  useEffect(() => {
    if (!connected || serverGroups) return;
    socketRef.current?.send(JSON.stringify({ type: "getServerGroupList" }));
  }, [connected, serverGroups]);
  useEffect(() => {
    if (!connected || channelGroups) return;
    socketRef.current?.send(JSON.stringify({ type: "getChannelGroupList" }));
  }, [connected, channelGroups]);

  // Same icon-file cache as the server icons dialog (fileDownloadData for
  // cid 0 always lands in serverIconImages, regardless of who asked) - fetch
  // any group icon referenced by a currently visible client that isn't
  // cached yet.
  const requestedIconPathsRef = useRef(new Set<string>());
  useEffect(() => {
    if (!connected) requestedIconPathsRef.current.clear();
  }, [connected]);

  useEffect(() => {
    if (!serverGroups) return;
    const iconById = new Map(serverGroups.map((g) => [g.id, g.iconId]));
    const channelIconById = new Map((channelGroups ?? []).map((g) => [g.id, g.iconId]));
    // Plus every group listed in an open group menu, so unassigned ones show their icon too.
    const menuGroups = !groupAssignTarget
      ? []
      : ((groupAssignTarget.kind === "channel" ? channelGroups : serverGroups) ?? []);
    const wantedIconIds = new Set(
      clients
        .flatMap((c) => [...c.serverGroups.map((gid) => iconById.get(gid) ?? 0), channelIconById.get(c.channelGroup) ?? 0])
        .concat(menuGroups.map((g) => g.iconId))
        .filter((id) => id >= CUSTOM_ICON_ID_THRESHOLD)
    );
    for (const iconId of wantedIconIds) {
      const path = `/icon_${iconId}`;
      // Once per path and connection: without this, every client-list update
      // re-requested icons still in flight (or ones that failed for good).
      if (!(path in serverIconImages) && !requestedIconPathsRef.current.has(path)) {
        requestedIconPathsRef.current.add(path);
        socketRef.current?.send(JSON.stringify({ type: "downloadFile", channelId: 0, path }));
      }
    }
  }, [clients, serverGroups, serverIconImages, groupAssignTarget, channelGroups]);

  // Avatars share that cid-0 cache, keyed by path; the hash makes a changed
  // avatar download again. ponytail: only the own channel and the selected
  // client - a big server's every avatar would be megabytes through the
  // gateway; widen this if the tree designs ever need all of them.
  const requestedAvatarHashesRef = useRef(new Map<string, string>());
  useEffect(() => {
    if (!connected) requestedAvatarHashesRef.current.clear();
  }, [connected]);

  useEffect(() => {
    const ownChannel = clients.find((c) => c.id === ownClientId)?.channel;
    for (const c of clients) {
      const wanted = c.channel === ownChannel || (selected?.type === "client" && selected.id === c.id);
      const path = wanted && c.avatarHash ? avatarPath(c.uid) : null;
      if (!path || requestedAvatarHashesRef.current.get(path) === c.avatarHash) continue;
      requestedAvatarHashesRef.current.set(path, c.avatarHash!);
      socketRef.current?.send(JSON.stringify({ type: "downloadFile", channelId: 0, path }));
    }
  }, [clients, ownClientId, selected]);

  useEffect(() => {
    if (!connected) {
      setWhisperChannelIds(new Set());
      setWhisperClientIds(new Set());
    }
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    const prev = prevWhisperTargetsRef.current;
    const setsEqual = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((x) => b.has(x));
    const unchanged =
      !!prev && setsEqual(prev.channels, whisperChannelIds) && setsEqual(prev.clients, whisperClientIds);
    prevWhisperTargetsRef.current = { channels: new Set(whisperChannelIds), clients: new Set(whisperClientIds) };
    // Nothing actually changed for the now-active session (e.g. this run was
    // triggered by restoring a parked multi-join tab, not by the user toggling
    // a whisper target) - skip both the gateway resend and the log entry below.
    if (unchanged) return;

    socketRef.current?.send(
      JSON.stringify({
        type: "setWhisperTargets",
        channelIds: [...whisperChannelIds],
        clientIds: [...whisperClientIds],
      })
    );

    const wasEmpty = !prev || (prev.channels.size === 0 && prev.clients.size === 0);
    const isEmpty = whisperChannelIds.size === 0 && whisperClientIds.size === 0;
    if (wasEmpty && isEmpty) return;

    const describe = () => {
      const channelNames = [...whisperChannelIds]
        .map((id) => channels.find((c) => c.id === id)?.name)
        .filter((n): n is string => Boolean(n));
      const clientNames = [...whisperClientIds]
        .map((id) => clients.find((c) => c.id === id)?.name)
        .filter((n): n is string => Boolean(n));
      return [...channelNames, ...clientNames].join(", ");
    };

    const description = isEmpty
      ? t("whisperHistory.stopped")
      : t("whisperHistory.started", { targets: describe() });
    setWhisperLog((prevLog) => [
      ...prevLog,
      { id: ++whisperLogIdRef.current, timestamp: Date.now(), description },
    ]);
    // Only a change of whisper targets should log; channels/clients/t are
    // read for the description but must not re-trigger it (renames, joins).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whisperChannelIds, whisperClientIds, connected]);

  // Tell the connector whose whispers to let through: the mode's default plus
  // the online clients whose contact entry says otherwise. Resent whenever
  // that changes or the socket is new (the connector forgets it on reconnect).
  const sentWhisperPolicyRef = useRef<{ socket: WebSocket | DemoSocket | null; payload: string }>({ socket: null, payload: "" });
  useEffect(() => {
    const socket = socketRef.current;
    // Older gateways answer unknown messages with an error line.
    if (!connected || !socket || !gatewayFeatures.has("whisperPolicy")) return;
    const block = whisperSettings.mode !== "allow";
    const exceptionMode = block ? "allow" : "block";
    const exceptions =
      whisperSettings.mode === "blockAll"
        ? []
        : clients
            .filter((c) => contacts.find((k) => k.uid === c.uid)?.whisper === exceptionMode)
            .map((c) => c.id)
            .sort((a, b) => a - b);
    const payload = JSON.stringify({ type: "setWhisperPolicy", block, exceptions });
    const sent = sentWhisperPolicyRef.current;
    if (sent.socket === socket && sent.payload === payload) return;
    socket.send(payload);
    sentWhisperPolicyRef.current = { socket, payload };
  }, [connected, clients, contacts, whisperSettings.mode, gatewayFeatures]);

  // "Clients in Whisper Verlauf löschen nach": drop old incoming entries.
  useEffect(() => {
    const minutes = whisperSettings.clearAfterMin;
    if (!minutes) return;
    const prune = () =>
      setWhisperLog((prev) => {
        const cutoff = Date.now() - minutes * 60_000;
        const next = prev.filter((e) => !e.incoming || e.timestamp >= cutoff);
        return next.length === prev.length ? prev : next;
      });
    prune();
    const timer = setInterval(prune, 15_000);
    return () => clearInterval(timer);
  }, [whisperSettings.clearAfterMin]);

  useEffect(() => {
    if (!whisperMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!whisperMenuRef.current?.contains(e.target as Node)) setWhisperMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhisperMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [whisperMenuOpen]);

  useEffect(() => {
    if (!extrasMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!extrasMenuRef.current?.contains(e.target as Node)) setExtrasMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExtrasMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [extrasMenuOpen]);

  useEffect(() => {
    if (!helpMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!helpMenuRef.current?.contains(e.target as Node)) setHelpMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [helpMenuOpen]);

  useEffect(() => {
    if (!selfMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!selfMenuRef.current?.contains(e.target as Node)) setSelfMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelfMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selfMenuOpen]);

  useEffect(() => {
    if (!rightsMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rightsMenuRef.current?.contains(e.target as Node)) setRightsMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRightsMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rightsMenuOpen]);

  // Rebuilt each render and read through the ref, so the listener below is
  // registered once yet always sees current state.
  const shortcutHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  shortcutHandlerRef.current = (e: KeyboardEvent) => {
    if (!e.ctrlKey) return;
    // Typing in a field (chat, dialogs) must never trigger e.g. Ctrl+D.
    const el = e.target as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    if (e.key.toLowerCase() === "s" && !connecting) {
      e.preventDefault();
      setConnectDialogOpen(true);
    } else if (e.key.toLowerCase() === "d" && (connected || sessionTabs.length > 0)) {
      e.preventDefault();
      handleDisconnect();
    } else if (e.key.toLowerCase() === "b") {
      e.preventDefault();
      openAddFavorite();
    }
  };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => shortcutHandlerRef.current(e);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Nova-theme-only: the connect dialog IS the app until a connection exists -
  // it's forced open on load and after every disconnect, and closes itself the
  // moment a connection succeeds (an auto-connect never went through the
  // dialog's own close, so this has to do it).
  useEffect(() => {
    if (designTheme === "nova") setConnectDialogOpen(!connected);
  }, [designTheme, connected]);

  // Overrides let a device/DSP-setting change take effect immediately, without
  // waiting for the next render's (possibly still-stale) state closure.
  const startMic = async (overrides?: {
    deviceId?: string;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  }) => {
    const audioContext = ensureAudioContext();
    const generation = ++micGenerationRef.current;
    // AEC3 enabled (persisted pref, or left over from a disposed context) but
    // not instantiated for this context yet: build it now, before the mic
    // below decides whether to turn the native canceller off.
    if (aec3EnabledRef.current && !aec3Ref.current) {
      try {
        const aec3 = await createAec3(audioContext.sampleRate, 2, 1);
        if (aec3Ref.current || audioContextRef.current !== audioContext) {
          aec3.free();
        } else {
          aec3Ref.current = aec3;
          audioPlayerRef.current?.attachAecRenderTap(aec3);
        }
      } catch (error) {
        appendLog({ text: `Advanced echo cancellation failed to load: ${(error as Error).message}`, kind: "error" });
        aec3EnabledRef.current = false;
        setAec3Enabled(false);
      }
      if (generation !== micGenerationRef.current) return;
    }
    let mic: MicCapture | null = null;
    try {
      mic = new MicCapture(audioContext, {
        onFrame: (pcm) => {
          // A reconnecting socket is still CONNECTING, where send() throws.
          if (!inputMutedRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "sendAudio", pcm }));
          }
        },
        onActivity: (active) => setSelfActive(active),
        onLevel: (rms) => {
          micLevelRef.current = rms;
        },
        threshold: vadThreshold,
        hangoverSeconds: vadHangover,
        deviceId: overrides?.deviceId ?? (inputDeviceId || undefined),
        // AEC3 replaces (not stacks with) the native canceller - running both
        // fights over the same signal.
        echoCancellation: aec3Ref.current ? false : (overrides?.echoCancellation ?? echoCancellationEnabled),
        noiseSuppression: overrides?.noiseSuppression ?? noiseSuppressionEnabled,
        autoGainControl: overrides?.autoGainControl ?? autoGainControlEnabled,
        aec3: aec3Ref.current ?? undefined,
      });
      await mic.start();
      if (generation !== micGenerationRef.current) {
        mic.stop();
        return;
      }
      micCaptureRef.current?.stop();
      micCaptureRef.current = mic;
      mic.pushToTalk = pushToTalkRef.current;
      mic.continuous = continuousRef.current;
      mic.setVadMode(vadModeRef.current);
      mic.typingAttenuation = typingAttenuationRef.current;
      mic.pttPressed = pttPressedRef.current;
      mic.setExtraAudio(tabAudioRef.current);
      setMicOn(true);
      refreshOutputDevices();
      refreshInputDevices();
      connectMicToRecorder();
    } catch (error) {
      mic?.stop();
      if (generation !== micGenerationRef.current) return;
      appendLog({ text: `Microphone error: ${(error as Error).message}`, kind: "error" });
    }
  };

  const restartMic = async (overrides?: {
    deviceId?: string;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  }) => {
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    await startMic(overrides);
  };

  const handleToggleMic = async () => {
    if (!micOn) {
      await startMic();
      return;
    }
    socketRef.current?.send(JSON.stringify({ type: "setInputMuted", muted: !inputMutedRef.current }));
    void notify(inputMutedRef.current ? "SOUND_CAPTURE_UNMUTED" : "SOUND_CAPTURE_MUTED");
  };
  toggleMicRef.current = () => void handleToggleMic();

  // Enable the mic automatically on page load (voice activation still gates
  // what's actually sent) instead of requiring an explicit click every time.
  const autoMicAttemptedRef = useRef(false);
  useEffect(() => {
    if (autoMicAttemptedRef.current) return;
    autoMicAttemptedRef.current = true;
    void handleToggleMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputDeviceChange = (deviceId: string) => {
    setInputDeviceId(deviceId);
    if (micCaptureRef.current) void restartMic({ deviceId });
  };

  const handleToggleNoiseSuppression = () => {
    const next = !noiseSuppressionEnabled;
    setNoiseSuppressionEnabled(next);
    if (micCaptureRef.current) void restartMic({ noiseSuppression: next });
  };

  const handleToggleEchoCancellation = () => {
    const next = !echoCancellationEnabled;
    setEchoCancellationEnabled(next);
    if (micCaptureRef.current) void restartMic({ echoCancellation: next });
  };

  const handleToggleAutoGainControl = () => {
    const next = !autoGainControlEnabled;
    setAutoGainControlEnabled(next);
    if (micCaptureRef.current) void restartMic({ autoGainControl: next });
  };

  const teardownAec3 = () => {
    audioPlayerRef.current?.detachAecRenderTap();
    aec3Ref.current?.free();
    aec3Ref.current = null;
  };

  const handleToggleAec3 = async () => {
    if (aec3Enabled) {
      aec3EnabledRef.current = false;
      setAec3Enabled(false);
      teardownAec3();
      if (micCaptureRef.current) void restartMic({});
      return;
    }
    setAec3Loading(true);
    try {
      const audioContext = ensureAudioContext();
      if (audioContext.state === "suspended") await audioContext.resume();
      // The context is *requested* at SAMPLE_RATE, but that constructor hint
      // isn't guaranteed - some audio backends (notably Linux/PulseAudio) run
      // it at their own native rate regardless. AEC3 must be told the rate
      // its ScriptProcessorNode buffers are actually sampled at, or its
      // internal frame timing drifts - audibly, as a progressively descending
      // pitch on repeated echo.
      const aec3 = await createAec3(audioContext.sampleRate, 2, 1);
      aec3Ref.current = aec3;
      audioPlayerRef.current?.attachAecRenderTap(aec3);
      aec3EnabledRef.current = true;
      setAec3Enabled(true);
      if (micCaptureRef.current) await restartMic({});
    } catch (error) {
      appendLog({ text: `Advanced echo cancellation failed to load: ${(error as Error).message}`, kind: "error" });
      teardownAec3();
      aec3EnabledRef.current = false;
      setAec3Enabled(false);
    } finally {
      setAec3Loading(false);
    }
  };

  const stopTabAudio = () => {
    tabAudioRef.current?.getTracks().forEach((track) => track.stop());
    tabAudioRef.current = null;
    micCaptureRef.current?.setExtraAudio(null);
    setTabAudioOn(false);
  };

  const handleToggleTabAudio = async () => {
    if (tabAudioRef.current) {
      stopTabAudio();
      return;
    }
    let stream: MediaStream;
    try {
      // Browsers only offer audio together with a video capture. The video
      // track stays alive (at 1 fps) until sharing stops: stopping it right
      // away may end or silence the capture session the audio belongs to.
      // Edge applies voice processing to the capture by default: echo
      // cancellation then subtracts exactly what the speakers play, so
      // Windows system audio arrives as pure silence (measured: peak 0).
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      return; // picker cancelled
    }
    const track = stream.getAudioTracks()[0];
    if (!track) {
      stream.getTracks().forEach((track) => track.stop());
      appendLog({ text: t("tabAudio.noAudio"), kind: "error" });
      return;
    }
    // Also the browser's own "stop sharing" bar.
    track.addEventListener("ended", stopTabAudio);
    tabAudioRef.current = stream;
    micCaptureRef.current?.setExtraAudio(stream);
    setTabAudioOn(true);
    // Windows system audio can arrive as pure silence (seen in Edge, with or
    // without the mic open), with nothing else to tell why.
    setTimeout(() => {
      if (tabAudioRef.current !== stream || !micCaptureRef.current || micCaptureRef.current.extraPeak >= 1e-4) return;
      appendLog({ text: t("tabAudio.silent"), kind: "error" });
    }, 5000);
  };

  const handleToggleMicTest = () => {
    const next = !micTestOn;
    setMicTestOn(next);
    const inputNode = audioPlayerRef.current?.getInputNode();
    if (inputNode) micCaptureRef.current?.setMonitoring(next, inputNode);
  };

  const handleToggleOutputMuted = () => {
    socketRef.current?.send(JSON.stringify({ type: "setOutputMuted", muted: !outputMutedRef.current }));
    void notify(outputMutedRef.current ? "SOUND_PLAYBACK_UNMUTED" : "SOUND_PLAYBACK_MUTED");
  };

  // Connects the current mic (if any) into the active recording, so a device
  // switch or a mic (re)start mid-recording doesn't silently drop it from the mix.
  const connectMicToRecorder = () => {
    const processor = recordProcessorRef.current;
    const source = micCaptureRef.current?.getSourceNode();
    if (processor && source) source.connect(processor);
  };

  const startRecording = () => {
    if (recordProcessorRef.current) return;
    const audioContext = ensureAudioContext();
    // Captures raw PCM via a ScriptProcessorNode (rather than MediaRecorder) so the
    // download can be an uncompressed WAV instead of a browser-codec-dependent webm/ogg.
    const processor = audioContext.createScriptProcessor(4096, 2, 2);
    const silence = audioContext.createGain();
    silence.gain.value = 0;
    recordChunksRef.current = { left: [], right: [] };
    processor.onaudioprocess = (event) => {
      const left = event.inputBuffer.getChannelData(0);
      const right = event.inputBuffer.numberOfChannels > 1 ? event.inputBuffer.getChannelData(1) : left;
      recordChunksRef.current.left.push(left.slice());
      recordChunksRef.current.right.push(right.slice());
    };
    // A ScriptProcessorNode only fires while connected to a destination; route
    // through a muted gain node so the recording tap isn't also heard.
    processor.connect(silence);
    silence.connect(audioContext.destination);
    recordProcessorRef.current = processor;
    recordSilenceRef.current = silence;
    audioPlayerRef.current?.getInputNode().connect(processor);
    connectMicToRecorder();

    setRecording(true);
    logClient("info", "Recording", "Started local recording");
  };

  const stopRecording = () => {
    const processor = recordProcessorRef.current;
    if (!processor) return;
    processor.onaudioprocess = null;
    processor.disconnect();
    recordSilenceRef.current?.disconnect();
    recordProcessorRef.current = null;
    recordSilenceRef.current = null;
    setRecording(false);

    const { left, right } = recordChunksRef.current;
    recordChunksRef.current = { left: [], right: [] };
    const totalFrames = left.reduce((sum, chunk) => sum + chunk.length, 0);
    if (totalFrames === 0) return;

    const mergedLeft = new Float32Array(totalFrames);
    const mergedRight = new Float32Array(totalFrames);
    let offset = 0;
    for (let i = 0; i < left.length; i++) {
      mergedLeft.set(left[i], offset);
      mergedRight.set(right[i], offset);
      offset += left[i].length;
    }

    const blob = encodeWavStereo(mergedLeft, mergedRight, audioContextRef.current?.sampleRate ?? SAMPLE_RATE);
    const safeServerName = (serverName || "session").replace(/[\\/:*?"<>|]+/g, "_").trim() || "session";
    const filename = `webspeak3-${safeServerName}-${new Date().toISOString().replace(/[:.]/g, "-")}.wav`;
    downloadBlob(blob, filename);
    logClient("info", "Recording", `Saved recording as ${filename}`);
  };

  const handleSetNickname = (newNickname: string) => {
    socketRef.current?.send(JSON.stringify({ type: "setNickname", nickname: newNickname }));
    if (loadAppSettings().updateFavoriteNickname && activeFavoriteId)
      saveFavorites(favorites.map((f) => (f.id === activeFavoriteId ? { ...f, nickname: newNickname } : f)));
  };

  const handleServerQueryLogin = () => {
    if (!serverQueryUsername.trim() || !serverQueryPassword) return;
    socketRef.current?.send(
      JSON.stringify({
        type: "serverQueryLogin",
        username: serverQueryUsername.trim(),
        password: serverQueryPassword,
      })
    );
    setServerQueryLoginOpen(false);
  };

  const handleOutputDeviceChange = async (deviceId: string) => {
    setOutputDeviceId(deviceId);
    await audioPlayerRef.current?.setOutputDevice(deviceId);
    setSoundsOutputDevice(deviceId);
  };

  const handlePickOutputDevice = async () => {
    try {
      const device = await pickAudioOutputDevice();
      if (device) await handleOutputDeviceChange(device.deviceId);
    } catch (error) {
      appendLog({ text: `Output device error: ${(error as Error).message}`, kind: "error" });
    }
  };

  const handlePlayTestTone = () => {
    const ctx = ensureAudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    audioPlayerRef.current?.unlock();
    audioPlayerRef.current?.playTestTone();
  };

  const handleSwitchChannel = (channelId: number, channelPassword?: string) => {
    const id = Number(channelId);
    if (!Number.isFinite(id)) return;
    // Prefer server-reported own client id - nickname match breaks when the
    // server renames us (Guest -> Guest1) or another client shares our nick.
    const me =
      ownClientId != null
        ? clients.find((c) => c.id === ownClientId)
        : clients.find((c) => c.name === nickname);
    if (me?.channel === id) return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      appendLog({ text: t("tree.joinNotConnected"), kind: "error" });
      return;
    }
    const password = channelPassword ?? channelPasswordCacheRef.current.get(id) ?? savedChannelPassword(id);
    socket.send(JSON.stringify({ type: "switchChannel", channelId: id, channelPassword: password }));
  };

  const savedChannelPassword = (channelId: number) =>
    securitySettings.saveChannelPasswords ? storedChannelPassword(host, channelId) : undefined;

  // Options -> Sicherheit -> "Cache löschen": icons/avatars download again right away.
  const handleClearCache = () => {
    void clearBrowserCaches();
    clearStillCache();
    setServerIconImages({});
    requestedIconPathsRef.current.clear();
    requestedAvatarHashesRef.current.clear();
    appendLog({ text: t("securitySettings.cacheCleared"), kind: "info" });
  };

  const handleChannelPasswordSubmit = (password: string) => {
    if (!channelPasswordPrompt) return;
    channelPasswordCacheRef.current.set(channelPasswordPrompt.channelId, password);
    if (securitySettings.saveChannelPasswords) storeChannelPassword(host, channelPasswordPrompt.channelId, password);
    handleSwitchChannel(channelPasswordPrompt.channelId, password);
    setChannelPasswordPrompt(null);
  };

  const handleChannelPasswordCancel = () => setChannelPasswordPrompt(null);

  const handleSelectItem = (item: SelectedItem) => {
    setSelected(item);
    setInfoOpen(true);
  };

  useEffect(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [chatInput, designTheme, connected]);

  const handleSendChat = () => {
    const message = wrapUrls(chatInput.trim());
    if (!message) return;
    if (activeTab === "channel") {
      socketRef.current?.send(JSON.stringify({ type: "sendChatMessage", message }));
    } else if (activeTab === "server") {
      socketRef.current?.send(JSON.stringify({ type: "sendServerMessage", message }));
    } else {
      socketRef.current?.send(JSON.stringify({ type: "sendPrivateMessage", clientId: activeTab, message }));
    }
    setChatInput("");
  };

  const handleOpenPrivateChat = (clientId: number, clientName: string) => {
    const history = loggedPmMessages(
      host,
      pmLogKind(clients.find((c) => c.id === clientId)?.uid, clientName),
      chatSettings.restorePrivateLines
    );
    setPmThreads((prev) => ({
      ...prev,
      [clientId]: prev[clientId] ?? { partnerId: clientId, partnerName: clientName, messages: history, unread: false },
    }));
    setActiveTab(clientId);
  };

  const handlePokeClient = (clientId: number, clientName: string) => {
    setPokeTarget({ id: clientId, name: clientName });
    setPokeMessage("");
  };

  const toggleWhisperChannel = (channelId: number) => {
    setWhisperChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  };

  const toggleWhisperClient = (clientId: number) => {
    setWhisperClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const clearWhisperTargets = () => {
    setWhisperChannelIds(new Set());
    setWhisperClientIds(new Set());
  };

  const handleSaveWhisperList = (name: string) => {
    const channelNames = channels.filter((c) => whisperChannelIds.has(c.id)).map((c) => c.name);
    const clientNames = clients.filter((c) => whisperClientIds.has(c.id)).map((c) => c.name);
    if (channelNames.length === 0 && clientNames.length === 0) return;
    setWhisperLists((prev) => [...prev, { id: randomId(), name, channelNames, clientNames }]);
  };

  const handleActivateWhisperList = (list: WhisperList) => {
    const nextChannelIds = new Set(
      channels.filter((c) => list.channelNames.includes(c.name)).map((c) => c.id)
    );
    const nextClientIds = new Set(clients.filter((c) => list.clientNames.includes(c.name)).map((c) => c.id));
    setWhisperChannelIds(nextChannelIds);
    setWhisperClientIds(nextClientIds);
  };

  const handleDeleteWhisperList = (id: string) => {
    setWhisperLists((prev) => prev.filter((list) => list.id !== id));
  };

  /** Switching identities (in the connect dialog's picker) also switches the
   *  nickname field to that identity's own remembered nickname, like the
   *  native client - only when it actually has one saved, so a fresh
   *  identity doesn't blank out what the user already typed. */
  const handleActiveIdentityChange = (id: string) => {
    setActiveIdentityId(id);
    const identity = identities.find((i) => i.id === id);
    if (identity?.nickname) setNickname(identity.nickname);
  };

  const handleAddIdentity = () => {
    const identity: Identity = {
      id: randomId(),
      name: t("identities.newName"),
      nickname: "",
      phoneticName: "",
      blob: null,
    };
    setIdentities((prev) => [...prev, identity]);
  };

  const handleRenameIdentity = (id: string, name: string) => {
    setIdentities((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)));
  };

  const handleIdentityNicknameChange = (id: string, value: string) => {
    setIdentities((prev) => prev.map((i) => (i.id === id ? { ...i, nickname: value } : i)));
    if (id === activeIdentityId) setNickname(value);
  };

  const handleIdentityPhoneticChange = (id: string, value: string) => {
    setIdentities((prev) => prev.map((i) => (i.id === id ? { ...i, phoneticName: value } : i)));
  };

  const handleDeleteIdentity = (id: string) => {
    setIdentities((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((i) => i.id !== id);
      if (activeIdentityId === id) setActiveIdentityId(next[0]?.id ?? null);
      return next;
    });
  };

  /** Downloads one identity's opaque tsclientlib blob as a JSON file - the
   *  same file this dialog's "Importieren" button reads back in, so it
   *  doubles as a backup/transfer mechanism between browsers or devices. */
  const handleExportIdentity = (id: string) => {
    const identity = identities.find((i) => i.id === id);
    if (!identity?.blob) return;
    const blob = new Blob([identity.blob], { type: "application/json" });
    downloadBlob(blob, `${identity.name.replace(/[^a-z0-9_-]+/gi, "_") || "identity"}.ts3identity.json`);
  };

  /** Parses the native client's identity .ini format:
   *  [Identity]
   *  id=<name, with \xHH-escaped non-ASCII chars>
   *  identity="<counter>V<base64 key>"
   *  nickname=<...>
   *  phonetic_nickname=<...>
   *  Returns null if it doesn't look like one. */
  /** Undoes Qt's QSettings .ini string escaping: `\xH..HHHH` (1-4 hex
   *  digits) is one UTF-16 *code unit*, not one byte - astral characters
   *  (emoji etc.) come out as two consecutive escapes forming a surrogate
   *  pair, e.g. "\xd83d\xde43" for 🙃. Treating each \xHH as a standalone
   *  Latin-1 byte (the previous approach) mangles anything outside the
   *  Latin-1 range into mojibake, which is exactly what showed up in the
   *  nickname field for names with Greek/Turkish letters or emoji. */
  const unescapeQtIni = (value: string): string => {
    let result = "";
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "\\") {
        const next = value[i + 1];
        if (next === "x") {
          let hex = "";
          let j = i + 2;
          while (j < value.length && hex.length < 4 && /[0-9a-fA-F]/.test(value[j])) {
            hex += value[j];
            j++;
          }
          if (hex.length > 0) {
            result += String.fromCharCode(parseInt(hex, 16));
            i = j - 1;
            continue;
          }
        } else if (next === "n") {
          result += "\n";
          i++;
          continue;
        } else if (next === "t") {
          result += "\t";
          i++;
          continue;
        } else if (next === "r") {
          result += "\r";
          i++;
          continue;
        } else if (next === "\\" || next === '"') {
          result += next;
          i++;
          continue;
        }
      }
      result += value[i];
    }
    return result;
  };

  const parseIniIdentity = (text: string): { name: string; nickname: string; phonetic: string; blob: string } | null => {
    if (!/^\s*\[Identity\]/im.test(text)) return null;
    const fields: Record<string, string> = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^(\w+)\s*=\s*(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      fields[m[1]] = unescapeQtIni(value);
    }
    if (!fields.identity) return null;
    return { name: fields.id ?? "", nickname: fields.nickname ?? "", phonetic: fields.phonetic_nickname ?? "", blob: fields.identity };
  };

  const handleImportIdentity = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string).trim();
      const ini = parseIniIdentity(text);
      if (ini) {
        const identity: Identity = {
          id: randomId(),
          name: ini.name || file.name.replace(/\.ini$/i, "") || t("identities.newName"),
          nickname: ini.nickname,
          phoneticName: ini.phonetic,
          blob: ini.blob,
        };
        setIdentities((prev) => [...prev, identity]);
        return;
      }
      try {
        JSON.parse(text);
      } catch {
        logClient("error", "Identities", t("identity.importInvalid", { file: file.name }));
        return;
      }
      const name = file.name.replace(/\.(ts3identity\.)?json$/i, "") || t("identities.newName");
      const identity: Identity = { id: randomId(), name, nickname: "", phoneticName: "", blob: text };
      setIdentities((prev) => [...prev, identity]);
    };
    reader.readAsText(file);
  };

  // --- TS6 Stream/Call -----------------------------------------------------
  //
  // A client that was already streaming when we joined announces nothing: TS6
  // only sets the `client_is_streaming` property, and the stream id has to be
  // pulled with `requeststreaminfo` (ts6-re findings 6b). So whenever a
  // streaming client shows up in the tree, ask once.
  useEffect(() => {
    const streaming = new Set(clients.filter((c) => c.isStreaming).map((c) => c.id));
    for (const id of streaming) {
      if (requestedStreamInfoRef.current.has(id)) continue;
      requestedStreamInfoRef.current.add(id);
      socketRef.current?.send(JSON.stringify({ type: "requestStreamInfo", clientId: id }));
    }
    // Forget clients that stopped, so a later stream is looked up again.
    for (const id of requestedStreamInfoRef.current) {
      if (!streaming.has(id)) requestedStreamInfoRef.current.delete(id);
    }
    setStreamInfos((prev) => {
      const stale = Object.keys(prev).filter((id) => !streaming.has(Number(id)));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      for (const id of stale) delete next[Number(id)];
      return next;
    });
  }, [clients]);

  useEffect(() => {
    const video = streamVideoRef.current;
    if (video && video.srcObject !== streamMedia) video.srcObject = streamMedia;
  }, [streamMedia, watchedStream]);

  useEffect(() => {
    // The publisher owns the capture; the preview only mirrors it, so it is
    // read off the peer connection's senders rather than kept in state.
    const video = publishPreviewRef.current;
    if (!video) return;
    const media = publisherRef.current?.previewStream ?? null;
    if (video.srcObject !== media) video.srcObject = media;
  }, [publishState, publishViewers]);

  const handleStopWatchingStream = () => {
    // close() sends leaveStream and fires onClosed, which clears the rest.
    streamViewerRef.current?.close();
    streamViewerRef.current = null;
    setWatchedStream(null);
    setStreamMedia(null);
    setStreamState("new");
  };

  const handleWatchStream = (clientId: number) => {
    const info = streamInfos[clientId];
    if (!info) return;
    handleStopWatchingStream();
    setStreamError(null);
    const viewer = new StreamViewer(info.id, info.clientId, {
      send: (message) => socketRef.current?.send(JSON.stringify(message)),
      onTrack: setStreamMedia,
      iceServers: [...DEFAULT_ICE_SERVERS, ...turnServers],
      onStateChange: setStreamState,
      onError: setStreamError,
      onClosed: () => {
        // Also reached when the publisher stops, not just via the close button.
        streamViewerRef.current = null;
        setWatchedStream(null);
        setStreamMedia(null);
      },
    });
    streamViewerRef.current = viewer;
    setWatchedStream(info);
    viewer.join();
  };

  const handleStopPublishing = () => {
    publisherRef.current?.stop();
    publisherRef.current = null;
    setPublishState("idle");
    setPublishViewers([]);
    setPublishPending([]);
  };

  const handleStreamButton = () => {
    if (publisherRef.current) {
      handleStopPublishing();
      return;
    }
    setStreamSettingsOpen(true);
  };

  const publishClientName = (clid: number) =>
    clients.find((c) => c.id === clid)?.name ?? `#${clid}`;

  const handleStartPublishing = (options: StreamPublishOptions) => {
    if (ownClientId === null) return;
    setStreamSettingsOpen(false);
    setPublishError(null);
    const publisher = new StreamPublisher({
      send: (message) => socketRef.current?.send(JSON.stringify(message)),
      ownClientId,
      onStateChange: (state) => {
        setPublishState(state);
        // "stopped" is also how the browser's own stop-sharing bar reports in,
        // so the ref has to be dropped here and not only in the click handler.
        if (state === "stopped" || state === "idle") {
          publisherRef.current = null;
          setPublishViewers([]);
          setPublishPending([]);
        }
      },
      onViewersChange: setPublishViewers,
      onPendingChange: setPublishPending,
      onError: setPublishError,
      iceServers: [...DEFAULT_ICE_SERVERS, ...turnServers],
    });
    publisherRef.current = publisher;
    void publisher.start(options);
  };

  const handleShowClientConnectionInfo = (clientId: number, clientName: string) => {
    setClientConnectionInfoTarget({ id: clientId, name: clientName });
    setClientConnectionInfo(null);
    socketRef.current?.send(JSON.stringify({ type: "getClientConnectionInfo", clientId }));
  };

  const handleShowServerConnectionInfo = () => {
    setServerConnectionInfoOpen(true);
    setServerConnectionInfo(null);
    socketRef.current?.send(JSON.stringify({ type: "getServerConnectionInfo" }));
  };

  const handleShowServerProtocolLog = () => {
    setServerProtocolLogOpen(true);
    setServerProtocolLog(null);
    socketRef.current?.send(JSON.stringify({ type: "getServerLog" }));
  };

  const handleShowBanList = () => {
    setBanListOpen(true);
    setBanList(null);
    socketRef.current?.send(JSON.stringify({ type: "getBanList" }));
  };

  const handleDeleteBan = (banId: number) => {
    socketRef.current?.send(JSON.stringify({ type: "deleteBan", banId }));
    setBanList((prev) => (prev ? prev.filter((e) => e.banId !== banId) : prev));
  };

  const handleDeleteAllBans = () => {
    socketRef.current?.send(JSON.stringify({ type: "deleteAllBans" }));
    setBanList([]);
  };

  const handleShowComplainList = () => {
    setComplainListOpen(true);
    setComplainList(null);
    socketRef.current?.send(JSON.stringify({ type: "getComplainList" }));
  };

  const handleDeleteComplaint = (targetClientDbId: number, fromClientDbId: number) => {
    socketRef.current?.send(
      JSON.stringify({ type: "deleteComplaint", targetClientDbId, fromClientDbId })
    );
    setComplainList((prev) =>
      prev
        ? prev.filter(
            (e) => !(e.targetClientDbId === targetClientDbId && e.fromClientDbId === fromClientDbId)
          )
        : prev
    );
  };

  const handleShowOfflineMessages = () => {
    setOfflineMessagesOpen(true);
    setOfflineMessageList(null);
    setOfflineMessageDetail(null);
    socketRef.current?.send(JSON.stringify({ type: "getOfflineMessageList" }));
  };

  const handleSelectOfflineMessage = (messageId: number) => {
    if (messageId === -1) {
      setOfflineMessageDetail(null);
      return;
    }
    socketRef.current?.send(JSON.stringify({ type: "getOfflineMessage", messageId }));
  };

  const handleDeleteOfflineMessage = (messageId: number) => {
    socketRef.current?.send(JSON.stringify({ type: "deleteOfflineMessage", messageId }));
    setOfflineMessageList((prev) => (prev ? prev.filter((e) => e.messageId !== messageId) : prev));
    setOfflineMessageDetail((prev) => (prev?.messageId === messageId ? null : prev));
  };

  const handleMarkOfflineMessageRead = (messageId: number) => {
    socketRef.current?.send(JSON.stringify({ type: "markOfflineMessageRead", messageId }));
    setOfflineMessageList((prev) =>
      prev ? prev.map((e) => (e.messageId === messageId ? { ...e, isRead: true } : e)) : prev
    );
  };

  const handleSendOfflineMessage = (clientUid: string, subject: string, message: string) => {
    socketRef.current?.send(JSON.stringify({ type: "sendOfflineMessage", clientUid, subject, message: wrapUrls(message) }));
  };

  const handleClientContextMenu = (
    e: React.MouseEvent,
    clientId: number,
    clientName: string,
    isSelf: boolean
  ) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 300);
    setClientContextMenu({ x, y, clientId, clientName, isSelf });
  };

  const handleServerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 300);
    setServerContextMenu({ x, y });
  };

  const handleShowChannelGroupAssign = (clientId: number, clientName: string) => {
    setGroupAssignTarget({ kind: "channel", clientId, clientName });
    setChannelGroups(null);
    socketRef.current?.send(JSON.stringify({ type: "getChannelGroupList" }));
  };

  const handleShowMoveClient = (clientId: number, clientName: string) => {
    const target = clients.find((c) => c.id === clientId);
    setMoveClientTarget({
      clientId,
      clientName,
      channelId: target?.channel ?? 0,
    });
  };

  const handleMoveClient = (clientId: number, channelId: number) => {
    const client = clients.find((c) => c.id === clientId);
    if (client && client.channel === channelId) return;
    // Moving yourself (e.g. dragging your own row) is a plain channel join,
    // not an admin action - route it through the normal switch flow so it
    // only needs join permission and still prompts for a channel password
    // when required. The `moveClient` command below is for moving OTHER
    // clients, which - like the native client - bypasses the target
    // channel's password for whoever holds the move permission.
    if (clientId === ownClientId) {
      handleSwitchChannel(channelId);
      return;
    }
    socketRef.current?.send(
      JSON.stringify({
        type: "moveClient",
        clientId,
        channelId,
      })
    );
  };

  const handleMoveClientToChannel = (channelId: number) => {
    if (!moveClientTarget) return;
    handleMoveClient(moveClientTarget.clientId, channelId);
    setMoveClientTarget(null);
  };

  const handleShowServerGroupAssign = (clientId: number, clientName: string) => {
    setGroupAssignTarget({ kind: "server", clientId, clientName });
    setServerGroups(null);
    socketRef.current?.send(JSON.stringify({ type: "getServerGroupList" }));
  };

  const handleSelectGroup = (groupId: number, alreadyAssigned: boolean) => {
    if (!groupAssignTarget) return;
    const target = clients.find((c) => c.id === groupAssignTarget.clientId);
    if (!target) {
      setGroupAssignTarget(null);
      return;
    }
    if (groupAssignTarget.kind === "channel") {
      socketRef.current?.send(
        JSON.stringify({
          type: "setChannelGroup",
          channelGroupId: groupId,
          channelId: target.channel,
          clientDbId: target.databaseId,
        })
      );
      setGroupAssignTarget(null);
    } else {
      socketRef.current?.send(
        JSON.stringify({
          type: alreadyAssigned ? "removeServerGroup" : "addServerGroup",
          serverGroupId: groupId,
          clientDbId: target.databaseId,
        })
      );
      // Server group membership is multi-select, so keep the dialog open for
      // further toggling instead of closing after a single action.
    }
  };

  const handleShowPermissionOverview = () => {
    setPermissionOverviewOpen(true);
    setPermissionOverview(null);
    socketRef.current?.send(JSON.stringify({ type: "getPermissionOverview" }));
  };

  const handleOpenPermissionsEditor = (scope: PermScope) => {
    setPermissionsEditorScope(scope);
    setPermissionsEditorEntries(null);
    setPermissionsEditorTarget(null);
    setPermissionsEditorOpen(true);
    // Fetch both lists regardless of the initial tab - the dialog lets the
    // user switch to any of the 5 tabs, including the group ones, later.
    if (!serverGroups) socketRef.current?.send(JSON.stringify({ type: "getServerGroupList" }));
    if (!channelGroups) socketRef.current?.send(JSON.stringify({ type: "getChannelGroupList" }));
  };

  const handlePermsLoadCatalog = () => {
    if (permissionCatalogRequestedRef.current) return;
    permissionCatalogRequestedRef.current = true;
    socketRef.current?.send(JSON.stringify({ type: "getPermissionCatalog" }));
  };

  const handlePermsSelectTarget = (scope: PermScope, id1: number, id2?: number) => {
    setPermissionsEditorEntries(null);
    setPermissionsEditorTarget({ scope, id1, id2 });
    socketRef.current?.send(JSON.stringify({ type: "getPermList", scope, id1, id2 }));
  };

  const handlePermsRefresh = () => {
    if (!permissionsEditorTarget) return;
    const { scope, id1, id2 } = permissionsEditorTarget;
    setPermissionsEditorEntries(null);
    socketRef.current?.send(JSON.stringify({ type: "getPermList", scope, id1, id2 }));
  };

  const handlePermsAdd = (
    scope: PermScope,
    ids: number[],
    permId: number,
    value: number,
    negated: boolean,
    skip: boolean
  ) => {
    socketRef.current?.send(JSON.stringify({ type: "addPermission", scope, ids, permId, value, negated, skip }));
    window.setTimeout(handlePermsRefresh, 300);
  };

  const handlePermsRemove = (scope: PermScope, ids: number[], permId: number) => {
    socketRef.current?.send(JSON.stringify({ type: "removePermission", scope, ids, permId }));
    window.setTimeout(handlePermsRefresh, 300);
  };

  const handleChannelContextMenu = (e: React.MouseEvent, channelId: number, channelName: string) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setChannelContextMenu({ x, y, channelId, channelName });
  };

  const handleShowFileBrowser = (channelId: number, channelName: string) => {
    setFileBrowserTarget({ channelId, channelName });
    setFileBrowserPath("/");
    setFileBrowserEntries(null);
    socketRef.current?.send(JSON.stringify({ type: "getFileList", channelId, path: "/" }));
  };

  const handleFileBrowserNavigate = (path: string) => {
    if (!fileBrowserTarget) return;
    setFileBrowserPath(path);
    setFileBrowserEntries(null);
    socketRef.current?.send(JSON.stringify({ type: "getFileList", channelId: fileBrowserTarget.channelId, path }));
  };

  const handleFileBrowserRefresh = () => {
    if (!fileBrowserTarget) return;
    setFileBrowserEntries(null);
    socketRef.current?.send(
      JSON.stringify({ type: "getFileList", channelId: fileBrowserTarget.channelId, path: fileBrowserPath })
    );
  };

  const handleFileBrowserCreateDir = (name: string) => {
    if (!fileBrowserTarget) return;
    socketRef.current?.send(
      JSON.stringify({
        type: "createDirectory",
        channelId: fileBrowserTarget.channelId,
        dirname: ftJoinPath(fileBrowserPath, name),
      })
    );
    // ftcreatedir gets no dedicated reply - the server processes commands from
    // one connection in order, so a refresh sent right after is guaranteed to
    // see the new directory.
    window.setTimeout(handleFileBrowserRefresh, 300);
  };

  const handleFileBrowserDelete = (entry: FileListEntry) => {
    if (!fileBrowserTarget) return;
    if (!window.confirm(t("fileBrowser.deleteConfirm"))) return;
    socketRef.current?.send(
      JSON.stringify({
        type: "deleteFile",
        channelId: fileBrowserTarget.channelId,
        name: ftJoinPath(fileBrowserPath, entry.name),
      })
    );
    window.setTimeout(handleFileBrowserRefresh, 300);
  };

  const handleFileBrowserRename = (entry: FileListEntry, newName: string) => {
    if (!fileBrowserTarget) return;
    socketRef.current?.send(
      JSON.stringify({
        type: "renameFile",
        channelId: fileBrowserTarget.channelId,
        oldName: ftJoinPath(fileBrowserPath, entry.name),
        newName: ftJoinPath(fileBrowserPath, newName),
      })
    );
    window.setTimeout(handleFileBrowserRefresh, 300);
  };

  // Options -> Download: queue, limits and the transfer window. transfersRef is
  // the source of truth because socket handlers keep old closures; the state
  // copy only drives re-renders.
  const transfersRef = useRef<Transfer[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transfersOpen, setTransfersOpen] = useState(false);
  const [transferToast, setTransferToast] = useState<{ name: string } | null>(null);
  const nextTransferIdRef = useRef(1);
  const commitTransfers = () => setTransfers([...transfersRef.current]);

  const enqueueTransfer = (x: Omit<Transfer, "id" | "done" | "status">) => {
    transfersRef.current.push({ ...x, id: nextTransferIdRef.current++, done: 0, status: "queued" });
    if (downloadSettings.showWindowOnStart) setTransfersOpen(true);
    commitTransfers();
  };

  const findTransfer = (dir: Transfer["dir"], cid: number, path: string) =>
    transfersRef.current.find((x) => x.status === "running" && x.dir === dir && x.cid === cid && x.path === path);

  const finishTransfer = (x: Transfer, ok: boolean) => {
    x.status = ok ? "done" : "error";
    if (ok) x.done = x.size;
    const settings = downloadSettingsRef.current;
    if (ok && settings.popupWhenDone) setTransferToast({ name: x.name });
    void notify(ok ? "OTHER_FILETRANSFER_COMPLETE" : "OTHER_FILETRANSFER_FAILED");
    if (settings.closeWindowWhenDone && transfersRef.current.every((y) => y.status === "done")) setTransfersOpen(false);
    commitTransfers();
  };

  // Start queued transfers while under the "Gleichzeitige Uploads/Downloads" caps.
  useEffect(() => {
    let started = false;
    for (const dir of ["down", "up"] as const) {
      const max = dir === "down" ? downloadSettings.maxDownloads : downloadSettings.maxUploads;
      let running = transfersRef.current.filter((x) => x.dir === dir && x.status === "running").length;
      for (const x of transfersRef.current) {
        if (running >= max) break;
        if (x.dir !== dir || x.status !== "queued") continue;
        x.status = "running";
        running++;
        started = true;
        if (dir === "down")
          socketRef.current?.send(JSON.stringify({ type: "downloadFile", channelId: x.cid, path: x.path }));
        else void sendUpload(x.cid, x.path, x.file!, x);
      }
    }
    if (started) commitTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transfers, downloadSettings.maxDownloads, downloadSettings.maxUploads]);

  useEffect(() => {
    if (!transferToast) return;
    const id = window.setTimeout(() => setTransferToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [transferToast]);

  // Bandwidth caps are enforced by the connector; resend for every new connection.
  const sentTransferLimitRef = useRef<{ socket: WebSocket | DemoSocket | null; payload: string }>({
    socket: null,
    payload: "",
  });
  useEffect(() => {
    const socket = socketRef.current;
    if (!connected || !socket || !gatewayFeatures.has("transferLimit")) return;
    const payload = JSON.stringify({
      type: "setTransferLimit",
      up: downloadSettings.uploadLimit * 1024,
      down: downloadSettings.downloadLimit * 1024,
    });
    const sent = sentTransferLimitRef.current;
    if (sent.socket === socket && sent.payload === payload) return;
    socket.send(payload);
    sentTransferLimitRef.current = { socket, payload };
  }, [connected, activeSessionId, gatewayFeatures, downloadSettings.uploadLimit, downloadSettings.downloadLimit]);

  const handleFileBrowserDownload = async (entry: FileListEntry) => {
    if (!fileBrowserTarget) return;
    const target = await resolveSaveTarget(downloadSettings, downloadDir, entry.name);
    if (target === "cancelled") return;
    enqueueTransfer({
      dir: "down",
      cid: fileBrowserTarget.channelId,
      path: ftJoinPath(fileBrowserPath, entry.name),
      name: entry.name,
      size: entry.size,
      target,
    });
  };

  // The connector refuses anything bigger. Gateways without "chunkedUpload"
  // also take the whole file as one WebSocket message, capped by maxPayload.
  const rejectOversizedUpload = (file: File): boolean => {
    if (file.size <= MAX_UPLOAD_BYTES) return false;
    appendLog({ text: t("fileBrowser.tooLarge", { mb: String(MAX_UPLOAD_BYTES >> 20) }), kind: "error" });
    return true;
  };

  const handleFileBrowserUpload = (file: File) => {
    if (!fileBrowserTarget) return;
    if (rejectOversizedUpload(file)) return;
    enqueueTransfer({
      dir: "up",
      cid: fileBrowserTarget.channelId,
      path: ftJoinPath(fileBrowserPath, file.name),
      name: file.name,
      size: file.size,
      file,
    });
  };

  // Small pieces keep the gateway from holding a whole file (several times
  // over) in memory. 192 KiB is a multiple of 3, so each piece base64-encodes
  // on its own without padding.
  const sendUpload = async (channelId: number, path: string, file: File, transfer?: Transfer) => {
    const socket = socketRef.current;
    if (!gatewayFeatures.has("chunkedUpload")) {
      socket?.send(JSON.stringify({ type: "uploadFile", channelId, path, dataBase64: await readBase64(file) }));
      return;
    }
    const chunkBytes = 192 * 1024;
    // offset === 0 still sends one (empty) piece for an empty file.
    for (let offset = 0; offset === 0 || offset < file.size; offset += chunkBytes) {
      const data = await readBase64(file.slice(offset, offset + chunkBytes));
      socket?.send(JSON.stringify({ type: "uploadFileChunk", channelId, path, offset, total: file.size, data }));
      if (transfer) {
        transfer.done = Math.min(file.size, offset + chunkBytes);
        commitTransfers();
      }
    }
  };

  const handleShowServerIcons = () => {
    setServerIconsOpen(true);
    setServerIconEntries(null);
    setServerIconImages({});
    requestedAvatarHashesRef.current.clear();
    socketRef.current?.send(JSON.stringify({ type: "getFileList", channelId: 0, path: "/" }));
  };

  const handleServerIconsRefresh = () => {
    setServerIconImages({});
    requestedAvatarHashesRef.current.clear();
    socketRef.current?.send(JSON.stringify({ type: "getFileList", channelId: 0, path: "/" }));
  };

  const handleServerIconUpload = (iconId: number, file: File) => {
    if (rejectOversizedUpload(file)) return;
    void sendUpload(0, `/icon_${iconId}`, file);
  };

  const handleServerIconDelete = (entry: FileListEntry) => {
    if (!window.confirm(t("fileBrowser.deleteConfirm"))) return;
    socketRef.current?.send(JSON.stringify({ type: "deleteFile", channelId: 0, name: `/${entry.name}` }));
    window.setTimeout(handleServerIconsRefresh, 300);
  };

  const handleSendPoke = () => {
    if (!pokeTarget) return;
    socketRef.current?.send(
      JSON.stringify({ type: "sendPoke", clientId: pokeTarget.id, message: pokeMessage })
    );
    setPokeTarget(null);
    setPokeMessage("");
  };

  const handleConfirmKick = () => {
    if (!kickTarget) return;
    socketRef.current?.send(
      JSON.stringify({
        type: kickTarget.scope === "channel" ? "kickFromChannel" : "kickFromServer",
        clientId: kickTarget.id,
        reason: kickReason,
      })
    );
    logClient("info", "Moderation", `Kicked ${kickTarget.name} from ${kickTarget.scope}`);
    setKickTarget(null);
    setKickReason("");
  };

  const handleConfirmBan = () => {
    if (!banTarget) return;
    socketRef.current?.send(
      JSON.stringify({
        type: "banClient",
        clientId: banTarget.id,
        seconds: Number(banSeconds) || 0,
        reason: banReason,
      })
    );
    logClient("info", "Moderation", `Banned ${banTarget.name}`);
    setBanTarget(null);
    setBanReason("");
    setBanSeconds("0");
  };

  const handleClosePrivateChat = (clientId: number) => {
    setPmThreads((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
    setActiveTab((current) => (current === clientId ? "channel" : current));
  };

  const ownClient =
    (ownClientId != null ? clients.find((c) => c.id === ownClientId) : null) ??
    clients.find((c) => c.name === nickname) ??
    null;
  const isAway = ownClient?.away ?? false;
  const inputMuted = ownClient?.inputMuted ?? false;
  const outputMuted = ownClient?.outputMuted ?? false;
  const selfTalking = Boolean(selfActive && !inputMuted && ownClient?.hasTalkPower);
  const displayTalkers = selfTalking && ownClient ? new Set(talkers).add(ownClient.id) : talkers;
  useEffect(() => setNotificationPlaybackMuted(outputMuted), [outputMuted]);
  useEffect(
    () => setSessionSoundPack(favorites.find((f) => f.id === activeFavoriteId)?.soundPack),
    [favorites, activeFavoriteId]
  );
  // "Akustischen Hinweis abspielen, wenn das Mikrofon gemutet ist": once per talk start.
  const talkingWhileMuted = Boolean(selfActive && inputMuted);
  useEffect(() => {
    if (talkingWhileMuted && loadAppSettings().mutedTalkingSound) void notify("SPECIAL_TALKING_WHILE_MUTED");
  }, [talkingWhileMuted]);
  const selfTalkingSeenRef = useRef(false);
  useEffect(() => {
    // Skip the initial render so opening the client doesn't click.
    if (!selfTalkingSeenRef.current) {
      selfTalkingSeenRef.current = true;
      return;
    }
    if (ownMicClicks && !outputMuted) void notify(selfTalking ? "SPECIAL_MIC_CLICK_SELF_ON" : "SPECIAL_MIC_CLICK_SELF_OFF");
  }, [selfTalking]); // eslint-disable-line react-hooks/exhaustive-deps
  const showServerQueryClients =
    activeFavoriteId != null &&
    favorites.some((f) => f.id === activeFavoriteId && f.showServerQueryClients);
  // clients can be a large, frequently-unchanged list re-scanned on every
  // render - including on every "talkers" voice-activity update, which has
  // nothing to do with the client list itself - so memoize on the inputs
  // that actually affect the result instead of re-filtering/re-reducing it
  // every time.
  const treeClients = useMemo(
    () => (showServerQueryClients ? clients : clients.filter((c) => !c.isQuery)),
    [clients, showServerQueryClients]
  );
  // Tree search: a channel whose name matches keeps all its clients, a client
  // whose name matches keeps its channel; either way the parent chain stays so
  // the match is shown where it lives.
  const treeSearch = useMemo(() => {
    const query = treeFilter.trim().toLowerCase();
    if (!query) return null;
    const hit = (name: string) => name.toLowerCase().includes(query);
    const channelHits = new Set(channels.filter((c) => hit(c.name)).map((c) => c.id));
    const shownClients = treeClients.filter((c) => hit(c.name) || channelHits.has(c.channel));
    const parentOf = new Map(channels.map((c) => [c.id, c.parent]));
    const keep = new Set<number>();
    for (let id of [...channelHits, ...shownClients.map((c) => c.channel)]) {
      while (id && !keep.has(id)) {
        keep.add(id);
        id = parentOf.get(id) ?? 0;
      }
    }
    return { channels: channels.filter((c) => keep.has(c.id)), clients: shownClients };
  }, [treeFilter, channels, treeClients]);
  const queryClientCount = useMemo(
    () => clients.reduce((n, c) => n + (c.isQuery ? 1 : 0), 0),
    [clients]
  );
  const displayClientCount =
    serverClientsOnline > 0
      ? serverClientsOnline + (showServerQueryClients ? queryClientCount : 0)
      : treeClients.length;
  const novaSplash = designTheme === "nova" && !connected;
  // Nova and IDE collapse the menubar behind a hamburger button.
  const compactMenu = designTheme === "nova" || designTheme === "ide" || designTheme === "standard" || mobile;
  // Standard on desktop: server rail | channels + own voice bar | channel
  // header, members and chat | info. Mobile keeps its own layout.
  const standardLayout = designTheme === "standard" && !mobile;
  const ownChannel = ownClient ? channels.find((c) => c.id === ownClient.channel) : undefined;
  // Standard puts the sender on its own line, so no "Name:" colon there.
  const chatColon = standardLayout ? "" : ":";
  const ownChannelCount = ownClient ? treeClients.filter((c) => c.channel === ownClient.channel).length : 0;
  const micLabel = !micOn ? t("toolbar.micEnable") : inputMuted ? t("toolbar.micUnmute") : t("toolbar.micMute");
  const streamLabel = DEMO_MODE
    ? t("publish.demoUnavailable")
    : `${publishState === "live" ? t("publish.stop") : t("publish.start")} (${t("publish.alpha")})`;

  // The menubar sits on top in every layout except Standard on desktop,
  // where it collapses into the ☰ button at the top of the server rail.
  const menubarEl = (
    <div className="ts-menubar">
      <div className={compactMenu ? "ts-nova-menu-dropdown" : undefined} ref={novaMenuRef}>
      {compactMenu && (
        <button
          className="ts-icon-button ts-nova-menu-toggle"
          onClick={() => setNovaMenuOpen((v) => !v)}
          aria-label={t("menu.connections")}
          aria-expanded={novaMenuOpen}
        >
          ☰
        </button>
      )}
      <div
        className={`ts-menubar-items${compactMenu ? " ts-nova-menu-panel" : ""}${
          novaMenuOpen ? " ts-nova-menu-panel-open" : ""
        }`}
        // Picking an entry closes the whole ☰ panel, not just the submenu -
        // otherwise it stays on top of the dialog the entry just opened.
        onClick={(e) => {
          if (compactMenu && (e.target as HTMLElement).closest(".ts-menu-item")) setNovaMenuOpen(false);
        }}
      >
      <div className="ts-menubar-dropdown" ref={connectionsMenuRef}>
        <button
          type="button"
          className="ts-menubar-item ts-menubar-item-active ts-plain-button"
          aria-expanded={connectionsMenuOpen}
          onClick={() => setConnectionsMenuOpen((v) => !v)}
        >
          {t("menu.connections")}
        </button>
        {connectionsMenuOpen && (
          <div className="ts-menu" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
            <button
              className="ts-menu-item"
              disabled={connecting}
              onClick={() => {
                setConnectDialogOpen(true);
                setConnectionsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🟢</span>
              <span className="ts-menu-item-label">{t("menu.connections.connect")}</span>
              <span className="ts-menu-item-shortcut">{t("shortcut.ctrl")}+S</span>
            </button>
            <button
              className="ts-menu-item"
              disabled={!connected && sessionTabs.length === 0}
              onClick={() => {
                handleDisconnect();
                setConnectionsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🔴</span>
              <span className="ts-menu-item-label">{t("menu.connections.disconnectCurrent")}</span>
              <span className="ts-menu-item-shortcut">{t("shortcut.ctrl")}+D</span>
            </button>
            <button
              className="ts-menu-item"
              disabled={sessionTabs.length === 0}
              onClick={() => {
                handleDisconnectAll();
                setConnectionsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">❌</span>
              <span className="ts-menu-item-label">{t("menu.connections.disconnectAll")}</span>
            </button>
          </div>
        )}
      </div>
      <div className="ts-menubar-dropdown" ref={favoritesMenuRef}>
        <button
          type="button"
          className="ts-menubar-item ts-menubar-item-active ts-plain-button"
          aria-expanded={favoritesMenuOpen}
          onClick={() => setFavoritesMenuOpen((v) => !v)}
        >
          {t("menu.favorites")}
        </button>
        {favoritesMenuOpen && (
          <div className="ts-menu" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
            <button className="ts-menu-item" onClick={openAddFavorite}>
              <span className="ts-menu-item-icon">⭐</span>
              <span className="ts-menu-item-label">{t("menu.favorites.add")}</span>
              <span className="ts-menu-item-shortcut">{t("shortcut.ctrl")}+B</span>
            </button>
            <button className="ts-menu-item" onClick={openManageFavorites}>
              <span className="ts-menu-item-icon">🗂️</span>
              <span className="ts-menu-item-label">{t("menu.favorites.manage")}</span>
            </button>
            {favorites.length > 0 && <div className="ts-menu-separator" />}
            {favorites.map((f) => (
              <button
                key={f.id}
                className="ts-menu-item"
                disabled={connecting}
                onClick={() => {
                  connectToFavorite(f);
                  setFavoritesMenuOpen(false);
                }}
              >
                <span className="ts-menu-item-icon">🔖</span>
                <span className="ts-menu-item-label">{f.bookmarkName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="ts-menubar-dropdown" ref={selfMenuRef}>
        <button
          type="button"
          className="ts-menubar-item ts-menubar-item-active ts-plain-button"
          aria-expanded={selfMenuOpen}
          onClick={() => setSelfMenuOpen((v) => !v)}
        >
          {t("menu.self")}
        </button>
        {selfMenuOpen && (
          <div className="ts-menu" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">🎙️</span>
              <span className="ts-menu-item-label">{t("menu.self.recordingProfile")}</span>
            </button>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">🔊</span>
              <span className="ts-menu-item-label">{t("menu.self.playbackProfile")}</span>
            </button>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">⌨️</span>
              <span className="ts-menu-item-label">{t("menu.self.hotkeyProfile")}</span>
            </button>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">🔔</span>
              <span className="ts-menu-item-label">{t("menu.self.soundPack")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              disabled={!connected}
              onClick={() => {
                setAwayDialogMessage("");
                setAwayDialogOpen(true);
                setSelfMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">💤</span>
              <span className="ts-menu-item-label">{t("menu.self.setAway")}</span>
            </button>
            <button
              className="ts-menu-item"
              disabled={!connected}
              onClick={() => {
                void handleToggleMic();
                setSelfMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">{micOn ? "🔇" : "🎤"}</span>
              <span className="ts-menu-item-label">
                {micOn ? t("menu.self.disableMic") : t("menu.self.enableMic")}
              </span>
            </button>
            <button
              className="ts-menu-item"
              disabled={!connected}
              onClick={() => {
                handleToggleOutputMuted();
                setSelfMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">{outputMuted ? "🔊" : "🔇"}</span>
              <span className="ts-menu-item-label">
                {outputMuted ? t("menu.self.unmuteOutput") : t("menu.self.muteOutput")}
              </span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              disabled={!connected}
              onClick={() => {
                setNicknameDraft(nickname);
                setChangeNicknameOpen(true);
                setSelfMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">✎</span>
              <span className="ts-menu-item-label">{t("menu.self.changeNickname")}</span>
            </button>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">🗣️</span>
              <span className="ts-menu-item-label">{t("menu.self.requestTalkPower")}</span>
            </button>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">🖼️</span>
              <span className="ts-menu-item-label">{t("menu.self.setAvatar")}</span>
            </button>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">🔤</span>
              <span className="ts-menu-item-label">{t("menu.self.setPhoneticNickname")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              disabled={!ownClient}
              onClick={() => {
                if (ownClient) handleShowClientConnectionInfo(ownClient.id, ownClient.name);
                setSelfMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">ℹ️</span>
              <span className="ts-menu-item-label">{t("menu.self.connectionInfo")}</span>
            </button>
          </div>
        )}
      </div>
      <div className="ts-menubar-dropdown" ref={rightsMenuRef}>
        <button
          type="button"
          className="ts-menubar-item ts-menubar-item-active ts-plain-button"
          aria-expanded={rightsMenuOpen}
          onClick={() => setRightsMenuOpen((v) => !v)}
        >
          {t("menu.rights")}
        </button>
        {rightsMenuOpen && (
          <div className="ts-menu" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
            <button
              className="ts-menu-item"
              onClick={() => {
                handleOpenPermissionsEditor("server");
                setRightsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🏷️</span>
              <span className="ts-menu-item-label">{t("menu.rights.serverGroups")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                handleOpenPermissionsEditor("channelgroup");
                setRightsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🎖️</span>
              <span className="ts-menu-item-label">{t("menu.rights.channelGroups")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              onClick={() => {
                handleOpenPermissionsEditor("client");
                setRightsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🔐</span>
              <span className="ts-menu-item-label">{t("menu.rights.serverPermissions")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                handleOpenPermissionsEditor("channel");
                setRightsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🔑</span>
              <span className="ts-menu-item-label">{t("menu.rights.channelPermissions")}</span>
            </button>
            <button className="ts-menu-item" disabled title={t("clientContext.notSupported")}>
              <span className="ts-menu-item-icon">📖</span>
              <span className="ts-menu-item-label">{t("menu.rights.overview")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              onClick={() => {
                handleShowPermissionOverview();
                setRightsMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🙋</span>
              <span className="ts-menu-item-label">{t("menu.rights.myRights")}</span>
            </button>
          </div>
        )}
      </div>
      <div className="ts-menubar-dropdown" ref={extrasMenuRef}>
        <button
          type="button"
          className="ts-menubar-item ts-menubar-item-active ts-plain-button"
          aria-expanded={extrasMenuOpen}
          onClick={() => setExtrasMenuOpen((v) => !v)}
        >
          {t("menu.extras")}
        </button>
        {extrasMenuOpen && (
          <div className="ts-menu" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
            <button
              className="ts-menu-item"
              onClick={() => {
                setIdentitiesOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🪪</span>
              <span className="ts-menu-item-label">{t("menu.extras.identities")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                setContactsOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">📇</span>
              <span className="ts-menu-item-label">{t("menu.extras.contacts")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                setCollectedUrlsOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🔗</span>
              <span className="ts-menu-item-label">{t("menu.extras.collectedUrls")}</span>
            </button>
            <button
              className="ts-menu-item"
              disabled={!connected}
              onClick={() => {
                setInviteFriendOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🧑‍🤝‍🧑</span>
              <span className="ts-menu-item-label">{t("menu.extras.inviteFriend")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                setTransfersOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">⇅</span>
              <span className="ts-menu-item-label">{t("menu.extras.fileTransfers")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              onClick={() => {
                setWhisperListsOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🗒️</span>
              <span className="ts-menu-item-label">{t("menu.extras.whisperLists")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                setWhisperHistoryOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🕓</span>
              <span className="ts-menu-item-label">{t("menu.extras.whisperHistory")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                setClientLogOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">📜</span>
              <span className="ts-menu-item-label">{t("menu.extras.clientLog")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              onClick={() => {
                handleShowBanList();
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🚫</span>
              <span className="ts-menu-item-label">{t("menu.extras.banList")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                handleShowComplainList();
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">⚠️</span>
              <span className="ts-menu-item-label">{t("menu.extras.complaintList")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                handleShowOfflineMessages();
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">📧</span>
              <span className="ts-menu-item-label">{t("menu.extras.offlineMessages")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                setServerQueryUsername("");
                setServerQueryPassword("");
                setServerQueryLoginOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🔑</span>
              <span className="ts-menu-item-label">{t("menu.extras.serverQueryLogin")}</span>
            </button>
            <button
              className="ts-menu-item"
              onClick={() => {
                handleShowServerProtocolLog();
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">📄</span>
              <span className="ts-menu-item-label">{t("menu.extras.serverLog")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              disabled={recording}
              onClick={() => {
                startRecording();
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">🔴</span>
              <span className="ts-menu-item-label">{t("menu.extras.startRecording")}</span>
            </button>
            <button className="ts-menu-item" disabled>
              <span className="ts-menu-item-icon">🔴</span>
              <span className="ts-menu-item-label">{t("menu.extras.startMultitrackRecording")}</span>
            </button>
            <button
              className="ts-menu-item"
              disabled={!recording}
              onClick={() => {
                stopRecording();
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">⏹️</span>
              <span className="ts-menu-item-label">{t("menu.extras.stopRecording")}</span>
            </button>
            <div className="ts-menu-separator" />
            <button
              className="ts-menu-item"
              onClick={() => {
                setOptionsDialogOpen(true);
                setExtrasMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">⚙️</span>
              <span className="ts-menu-item-label">{t("menu.extras.options")}</span>
            </button>
          </div>
        )}
      </div>
      {IS_OWN_HOSTED_INSTANCE && (
        <button
          type="button"
          className="ts-menubar-item ts-plain-button ts-menubar-feedback"
          onClick={() => setFeedbackOpen(true)}
        >
          💬 {t("menu.extras.feedback")}
        </button>
      )}
      <div className="ts-menubar-dropdown" ref={helpMenuRef}>
        <button
          type="button"
          className="ts-menubar-item ts-menubar-item-active ts-plain-button"
          aria-expanded={helpMenuOpen}
          onClick={() => setHelpMenuOpen((v) => !v)}
        >
          {t("menu.help")}
        </button>
        {helpMenuOpen && (
          <div className="ts-menu" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
            <button
              className="ts-menu-item"
              onClick={() => {
                setAboutOpen(true);
                setHelpMenuOpen(false);
              }}
            >
              <span className="ts-menu-item-icon">ℹ️</span>
              <span className="ts-menu-item-label">{t("menu.help.about")}</span>
            </button>
            <a
              className="ts-menu-item"
              href="https://github.com/WebSpeak3/webspeak3"
              target="_blank"
              rel="noreferrer"
              onClick={() => setHelpMenuOpen(false)}
            >
              <span className="ts-menu-item-icon">🐙</span>
              <span className="ts-menu-item-label">{t("menu.help.github")}</span>
            </a>
            <a
              className="ts-menu-item"
              href="https://github.com/WebSpeak3/webspeak3/releases"
              target="_blank"
              rel="noreferrer"
              onClick={() => setHelpMenuOpen(false)}
            >
              <span className="ts-menu-item-icon">📋</span>
              <span className="ts-menu-item-label">{t("menu.help.changelog")}</span>
            </a>
            <a
              className="ts-menu-item"
              href="https://github.com/WebSpeak3/webspeak3#translating"
              target="_blank"
              rel="noreferrer"
              onClick={() => setHelpMenuOpen(false)}
            >
              <span className="ts-menu-item-icon">🌐</span>
              <span className="ts-menu-item-label">{t("menu.help.translate")}</span>
            </a>
            {IS_OWN_HOSTED_INSTANCE && (
              <button
                className="ts-menu-item"
                onClick={() => {
                  setTosMandatory(false);
                  setTosOpen(true);
                  setHelpMenuOpen(false);
                }}
              >
                <span className="ts-menu-item-icon">📜</span>
                <span className="ts-menu-item-label">{t("menu.extras.tos")}</span>
              </button>
            )}
          </div>
        )}
      </div>
      </div>
      </div>
      {mobile && designTheme !== "nova" && (
        <div className="ts-mobile-title">
          <span className="ts-mobile-title-name">{connected ? serverName || host : "WebSpeak3"}</span>
          <span className={`ts-mobile-title-status${connected ? " ts-mobile-title-status-on" : ""}`}>
            {connected ? ownClient?.name ?? t("design.status.connected") : t("tree.notConnected")}
          </span>
        </div>
      )}
      {designTheme === "nova" && (
        <div className="ts-nova-topbar-server">
          <span className="ts-nova-topbar-logo">W</span>
          <span className="ts-nova-topbar-name">{connected ? serverName || host : "WebSpeak3"}</span>
          <span className={`ts-nova-topbar-status${connected ? " ts-nova-topbar-status-on" : ""}`}>
            <span className="ts-nova-topbar-dot" />
            {connected ? t("design.status.connected") : t("tree.notConnected")}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <DisplayPrefsContext.Provider value={displayPrefs}>
    <div
      className={`ts-app ts-theme-${theme}${designThemeClassName(designTheme)}${
        activeCustomTheme ? " ts-design-custom" : ""
      }${demoForceMobile ? " ts-force-mobile" : ""}${mobile ? ` ts-mobile ts-mobile-tab-${mobileTab}` : ""}${novaSplash ? " ts-nova-splash" : ""}${
        designTheme === "ide" && !idePixelFont ? " ts-ide-plain-font" : ""
      }`}
      data-custom-theme={activeCustomTheme?.id}
      data-design-theme={designTheme}
    >
      {DEMO_MODE && (
        <div className="ts-demo-banner">
          Demo mode — simulated data only, no real TeamSpeak server involved.{" "}
          <a href="https://github.com/WebSpeak3/webspeak3" target="_blank" rel="noreferrer">
            Get WebSpeak3
          </a>
          {!narrowScreen && <button className="ts-demo-mobile-toggle" onClick={() => setDemoForceMobile((v) => !v)}>
            {demoForceMobile ? "🖥 Desktop view" : "📱 Mobile view"}
          </button>}
        </div>
      )}
      {!standardLayout && menubarEl}

      {!standardLayout && <div className="ts-toolbar">
        {designTheme === "nova" && connected && ownClient && (
          <div className="ts-nova-toolbar-self">
            <span className="ts-nova-toolbar-avatar">
              {ownClient.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className="ts-nova-toolbar-self-info">
              <span className="ts-nova-toolbar-self-name">{ownClient.name}</span>
              <span className="ts-nova-toolbar-self-status">
                {isAway ? t("tree.away") : t("design.status.connected")}
              </span>
            </span>
          </div>
        )}
        <div className="ts-toolbar-icons">
          <div className="ts-toolbar-away" ref={awayMenuRef}>
            <button
              className={`ts-icon-button${isAway ? " ts-away-on" : ""}`}
              onClick={() => sendAway(!isAway, "")}
              disabled={!connected}
              title={isAway ? t("toolbar.backOnline") : t("toolbar.setAway")}
              aria-label={isAway ? t("toolbar.backOnline") : t("toolbar.setAway")}
            >
              💤
            </button>
            <button
              className="ts-icon-caret"
              onClick={() => {
                setAwayPresets(loadAwayPresets());
                setAwayMenuOpen((v) => !v);
              }}
              disabled={!connected}
              title={t("toolbar.awayOptions")}
              aria-label={t("toolbar.awayOptions")}
              aria-haspopup="menu"
              aria-expanded={awayMenuOpen}
            >
              ▾
            </button>
            {awayMenuOpen && (
              <div className="ts-menu ts-menu-away" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
                <button
                  className="ts-menu-item"
                  onClick={() => {
                    sendAway(true, "");
                    setAwayMenuOpen(false);
                  }}
                >
                  <span className="ts-menu-item-icon">💤</span>
                  <span className="ts-menu-item-label">{t("away.setGlobal")}</span>
                </button>
                <button
                  className="ts-menu-item"
                  onClick={() => {
                    setAwayDialogMessage("");
                    setAwayDialogOpen(true);
                    setAwayMenuOpen(false);
                  }}
                >
                  <span className="ts-menu-item-icon">✎</span>
                  <span className="ts-menu-item-label">{t("away.setGlobalStatus")}</span>
                </button>
                {awayPresets.length > 0 && <div className="ts-menu-separator" />}
                {awayPresets.map((preset) => (
                  <button
                    key={preset.name}
                    className="ts-menu-item"
                    onClick={() => {
                      sendAway(true, preset.message);
                      setAwayMenuOpen(false);
                    }}
                  >
                    <span className="ts-menu-item-label">{preset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="ts-toolbar-sep" />
          <div className="ts-toolbar-away" ref={whisperMenuRef}>
            <button
              className={`ts-icon-button${whisperChannelIds.size > 0 || whisperClientIds.size > 0 ? " ts-away-on" : ""}`}
              onClick={() => setWhisperMenuOpen((v) => !v)}
              disabled={!connected}
              title={t("toolbar.whisper")}
              aria-label={t("toolbar.whisper")}
              aria-haspopup="menu"
              aria-expanded={whisperMenuOpen}
            >
              🤫
            </button>
            {whisperMenuOpen && (
              <div className="ts-menu ts-menu-away" ref={focusFirstItem} onKeyDown={handleMenuKeyDown}>
                <div className="ts-context-menu-title">{t("whisper.channels")}</div>
                {channels.map((ch) => (
                  <label key={ch.id} className="ts-menu-item">
                    <input
                      type="checkbox"
                      checked={whisperChannelIds.has(ch.id)}
                      onChange={() => toggleWhisperChannel(ch.id)}
                    />
                    <span className="ts-menu-item-label">{ch.name}</span>
                  </label>
                ))}
                {whisperClientIds.size > 0 && (
                  <>
                    <div className="ts-menu-separator" />
                    <div className="ts-context-menu-title">{t("whisper.clients")}</div>
                    {[...whisperClientIds].map((id) => (
                      <button key={id} className="ts-menu-item" onClick={() => toggleWhisperClient(id)}>
                        <span className="ts-menu-item-icon">✕</span>
                        <span className="ts-menu-item-label">
                          {clients.find((c) => c.id === id)?.name ?? id}
                        </span>
                      </button>
                    ))}
                  </>
                )}
                {(whisperChannelIds.size > 0 || whisperClientIds.size > 0) && (
                  <>
                    <div className="ts-menu-separator" />
                    <button className="ts-menu-item" onClick={clearWhisperTargets}>
                      <span className="ts-menu-item-label">{t("whisper.clearAll")}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <span className="ts-toolbar-sep" />
          <button
            className={`ts-icon-button${micOn && !inputMuted ? " ts-mic-on" : ""}${micOn && inputMuted ? " ts-muted-on" : ""}`}
            onClick={handleToggleMic}
            title={micLabel}
            aria-label={micLabel}
          >
            {micOn && !inputMuted ? "🎤" : "🔇"}
          </button>
          {pushToTalk ? (
            <button
              className={`ts-icon-button ts-ptt-button${pttPressed ? " ts-mic-on" : ""}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setPttPressed(true);
              }}
              onPointerUp={() => setPttPressed(false)}
              onPointerCancel={() => setPttPressed(false)}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                  e.preventDefault();
                  setPttPressed(true);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") setPttPressed(false);
              }}
              onContextMenu={(e) => e.preventDefault()}
              title={t("toolbar.pushToTalk")}
              aria-label={t("toolbar.pushToTalk")}
              aria-pressed={pttPressed}
            >
              🗣️
            </button>
          ) : continuous ? null : (
            <label className="ts-icon-slider" title={t("toolbar.vadSensitivity")}>
              🎚️
              <input
                type="range"
                min={0.002}
                max={0.15}
                step={0.002}
                value={vadThreshold}
                onChange={(e) => setVadThreshold(Number(e.target.value))}
                aria-label={t("toolbar.vadSensitivity")}
              />
            </label>
          )}
          <button
            className={`ts-icon-button${publishState === "live" ? " ts-mic-on" : ""}`}
            onClick={handleStreamButton}
            // DemoSocket has no answer for setupstream, so in demo mode the
            // panel would sit at "starting" forever - after the browser has
            // already asked the visitor to pick a screen. Don't offer it.
            disabled={!connected || ownClientId === null || DEMO_MODE}
            title={streamLabel}
            aria-label={streamLabel}
          >
            {publishState === "live" ? "🛑" : "🖥️"}
          </button>
          {TAB_AUDIO_SUPPORTED && (
            <button
              className={`ts-icon-button${tabAudioOn ? " ts-mic-on" : ""}`}
              onClick={handleToggleTabAudio}
              disabled={!micOn}
              title={tabAudioOn ? t("tabAudio.stop") : t("tabAudio.start")}
              aria-label={tabAudioOn ? t("tabAudio.stop") : t("tabAudio.start")}
            >
              🎵
            </button>
          )}
          <span className="ts-toolbar-sep" />
          <button
            className={`ts-icon-button${outputMuted ? " ts-muted-on" : ""}`}
            onClick={handleToggleOutputMuted}
            disabled={!connected}
            title={outputMuted ? t("toolbar.unmuteSound") : t("toolbar.muteSound")}
            aria-label={outputMuted ? t("toolbar.unmuteSound") : t("toolbar.muteSound")}
          >
            {outputMuted ? "🔇" : "🔊"}
          </button>
          {hasNativeOutputPicker() ? (
            <button className="ts-icon-button" onClick={handlePickOutputDevice} title={t("toolbar.chooseOutputDevice")} aria-label={t("toolbar.chooseOutputDevice")}>
              🎧
            </button>
          ) : (
            <label className="ts-icon-select">
              🎧
              <select
                value={outputDeviceId}
                onChange={(e) => handleOutputDeviceChange(e.target.value)}
                onFocus={refreshOutputDevices}
                aria-label={t("toolbar.chooseOutputDevice")}
              >
                <option value="">{t("playback.systemDefault")}</option>
                {outputDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Output ${d.deviceId.slice(0, 6)}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          {recording && (
            <button className="ts-icon-button ts-recording-on" onClick={stopRecording} title={t("menu.extras.stopRecording")} aria-label={t("menu.extras.stopRecording")}>
              🔴
            </button>
          )}
          <span className="ts-toolbar-sep" />
          <button
            className="ts-icon-button"
            onClick={() => setTheme((mode) => (mode === "dark" ? "light" : "dark"))}
            title={t("toolbar.toggleTheme")}
            aria-label={t("toolbar.toggleTheme")}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="ts-app-logo" />
          <span className="ts-app-title" role="heading" aria-level={1}>WebSpeak3</span>
        </div>

      </div>}

      {!standardLayout && sessionTabs.length > (mobile ? 1 : 0) ? (
        <ConnectionTabs
          tabs={sessionTabs}
          activeTabId={activeSessionId}
          onSelectTab={switchToSession}
          onCloseTab={closeSessionTab}
        />
      ) : null}

      {connectDialogOpen && (
        <ConnectDialog
          host={dialogHost}
          nickname={nickname}
          serverPassword={serverPassword}
          channelPassword={channelPassword}
          defaultChannel={defaultChannel}
          privilegeKey={privilegeKey}
          serverType={serverType}
          loginName={loginName}
          loginPassword={loginPassword}
          expanded={connectDialogExpanded}
          connecting={connecting}
          identities={identities}
          activeIdentityId={activeIdentityId}
          onHostChange={setHost}
          onNicknameChange={setNickname}
          onServerPasswordChange={setServerPassword}
          onChannelPasswordChange={setChannelPassword}
          onDefaultChannelChange={setDefaultChannel}
          onPrivilegeKeyChange={setPrivilegeKey}
          onServerTypeChange={setServerType}
          onLoginNameChange={setLoginName}
          onLoginPasswordChange={setLoginPassword}
          onActiveIdentityChange={handleActiveIdentityChange}
          onToggleExpanded={() => setConnectDialogExpanded((v) => !v)}
          onConnect={() => handleConnect({ host: dialogHost })}
          onConnectNewTab={() => handleConnect({ host: dialogHost })}
          canOpenNewTab={sessionTabs.length > 0 || connected}
          onCancel={novaSplash ? () => {} : () => setConnectDialogOpen(false)}
          nova={designTheme === "nova"}
          onOpenOptions={() => setOptionsDialogOpen(true)}
        />
      )}

      <UpdatePrompt />

      {/* The feedback button sits above the donation pill where that one is
          shown, and takes its spot where it is not. */}
      {IS_OWN_HOSTED_INSTANCE && !feedbackOpen && (
        <FeedbackFab onOpen={() => setFeedbackOpen(true)} stacked={!!DONATE_URL} />
      )}

      <DonateFab />

      {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} audioState={audioContextRef.current?.state ?? "not started"} />}

      {favoritesDialogMode && (
        <FavoritesDialog
          favorites={favorites}
          prefillNew={favoritesDialogMode.kind === "add" ? favoritesDialogMode.prefill : undefined}
          onSave={saveFavorites}
          onClose={() => setFavoritesDialogMode(null)}
        />
      )}

      {collectedUrlsOpen && (
        <CollectedUrlsDialog
          urls={collectedUrls}
          onClear={() => setCollectedUrls([])}
          onClose={() => setCollectedUrlsOpen(false)}
        />
      )}

      {transfersOpen && (
        <FileTransfersWindow
          transfers={transfers}
          onClearFinished={() => {
            transfersRef.current = transfersRef.current.filter((x) => x.status === "queued" || x.status === "running");
            commitTransfers();
          }}
          onClose={() => setTransfersOpen(false)}
        />
      )}
      {transferToast && (
        <div className="ts-transfer-toast" role="status">
          {t("transfers.finished", { name: transferToast.name })}
        </div>
      )}
      {restartNotice && <RestartNoticeDialog message={restartNotice} onAck={() => setRestartNotice(null)} />}

      {aboutOpen && (
        <AboutDialog
          onClose={() => {
            setAboutOpen(false);
            if (window.location.hash === "#about") window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }}
        />
      )}

      {tosOpen && (
        <ToSDialog
          mandatory={tosMandatory}
          onAccept={() => {
            localStorage.setItem(TOS_KEY, `${TOS_VERSION}:${new Date().toISOString().slice(0, 10)}`);
            setTosOpen(false);
            setTosMandatory(false);
          }}
          onClose={() => setTosOpen(false)}
        />
      )}

      {channelPasswordPrompt && (
        <ChannelPasswordDialog
          channelName={channelPasswordPrompt.channelName}
          wrongPassword={channelPasswordPrompt.wrongPassword}
          onSubmit={handleChannelPasswordSubmit}
          onCancel={handleChannelPasswordCancel}
        />
      )}

      {inviteFriendOpen && (
        <InviteFriendDialog
          host={host}
          channelId={selected?.type === "channel" ? selected.id : null}
          channelPath={(() => {
            if (selected?.type !== "channel") return null;
            const names: string[] = [];
            for (let ch = channels.find((c) => c.id === selected.id); ch && names.length < 50; ch = channels.find((c) => c.id === ch!.parent)) names.unshift(ch.name);
            return names.join("/");
          })()}
          onClose={() => setInviteFriendOpen(false)}
        />
      )}

      {clientLogOpen && (
        <ClientLogDialog entries={logEntries} onClose={() => setClientLogOpen(false)} />
      )}

      {whisperHistoryOpen && (
        <WhisperHistoryDialog
          serverName={serverName}
          entries={whisperLog}
          onClear={() => setWhisperLog([])}
          onClose={() => setWhisperHistoryOpen(false)}
        />
      )}

      {whisperListsOpen && (
        <WhisperListsDialog
          lists={whisperLists}
          hasCurrentSelection={whisperChannelIds.size > 0 || whisperClientIds.size > 0}
          onSave={handleSaveWhisperList}
          onActivate={handleActivateWhisperList}
          onDelete={handleDeleteWhisperList}
          onClose={() => setWhisperListsOpen(false)}
        />
      )}

      {identitiesOpen && (
        <IdentitiesDialog
          identities={identities}
          activeId={activeIdentityId}
          ownUid={connected ? ownClient?.uid ?? null : null}
          onActivate={setActiveIdentityId}
          onAdd={handleAddIdentity}
          onRename={handleRenameIdentity}
          onNicknameChange={handleIdentityNicknameChange}
          onPhoneticChange={handleIdentityPhoneticChange}
          onDelete={handleDeleteIdentity}
          onExport={handleExportIdentity}
          onImport={handleImportIdentity}
          onClose={() => setIdentitiesOpen(false)}
        />
      )}

      {clientConnectionInfoTarget && (
        <ClientConnectionInfoDialog
          clientName={clientConnectionInfoTarget.name}
          info={clientConnectionInfo?.clientId === clientConnectionInfoTarget.id ? clientConnectionInfo : null}
          onClose={() => setClientConnectionInfoTarget(null)}
        />
      )}

      {serverConnectionInfoOpen && (
        <ServerConnectionInfoDialog
          info={serverConnectionInfo}
          serverName={serverName}
          host={host}
          serverVersion={serverVersion}
          serverLicense={serverLicense}
          onClose={() => setServerConnectionInfoOpen(false)}
        />
      )}

      {serverEditOpen && (
        <ServerEditDialog
          serverName={serverName}
          welcomeMessage={serverWelcomeMessage}
          hostbannerGfxUrl={serverBannerUrl}
          onSave={(payload) => {
            socketRef.current?.send(JSON.stringify({ type: "editServer", payload }));
            logClient("info", "Moderation", "Edited server settings");
          }}
          onClose={() => setServerEditOpen(false)}
        />
      )}

      {serverProtocolLogOpen && (
        <ServerProtocolLogDialog
          lines={serverProtocolLog}
          onClose={() => setServerProtocolLogOpen(false)}
        />
      )}

      {banListOpen && (
        <BanListDialog
          entries={banList}
          onDelete={handleDeleteBan}
          onDeleteAll={handleDeleteAllBans}
          onClose={() => setBanListOpen(false)}
        />
      )}

      {complainListOpen && (
        <ComplainListDialog
          entries={complainList}
          onDelete={handleDeleteComplaint}
          onClose={() => setComplainListOpen(false)}
        />
      )}

      {offlineMessagesOpen && (
        <OfflineMessagesDialog
          entries={offlineMessageList}
          detail={offlineMessageDetail}
          onSelect={handleSelectOfflineMessage}
          onDelete={handleDeleteOfflineMessage}
          onMarkRead={handleMarkOfflineMessageRead}
          onSend={handleSendOfflineMessage}
          onClose={() => setOfflineMessagesOpen(false)}
        />
      )}

      {groupAssignTarget && (
        <GroupAssignDialog
          kind={groupAssignTarget.kind}
          clientName={groupAssignTarget.clientName}
          groups={groupAssignTarget.kind === "channel" ? channelGroups : serverGroups}
          currentGroupIds={(() => {
            const target = clients.find((c) => c.id === groupAssignTarget.clientId);
            if (!target) return [];
            return groupAssignTarget.kind === "channel" ? [target.channelGroup] : target.serverGroups;
          })()}
          iconImages={serverIconImages}
          onSelect={handleSelectGroup}
          onClose={() => setGroupAssignTarget(null)}
        />
      )}

      {moveClientTarget && (
        <MoveClientDialog
          clientName={moveClientTarget.clientName}
          currentChannelId={moveClientTarget.channelId}
          channels={channels}
          onSelect={handleMoveClientToChannel}
          onClose={() => setMoveClientTarget(null)}
        />
      )}

      {permissionOverviewOpen && (
        <PermissionOverviewDialog
          entries={permissionOverview}
          onClose={() => setPermissionOverviewOpen(false)}
        />
      )}

      {permissionsEditorOpen && (
        <PermissionsEditorDialog
          initialScope={permissionsEditorScope}
          channelGroups={channelGroups}
          serverGroups={serverGroups}
          channels={channels}
          clients={clients}
          entries={permissionsEditorEntries}
          catalog={permissionCatalog}
          onSelectTarget={handlePermsSelectTarget}
          onLoadCatalog={handlePermsLoadCatalog}
          onAdd={handlePermsAdd}
          onRemove={handlePermsRemove}
          onClose={() => setPermissionsEditorOpen(false)}
        />
      )}

      {fileBrowserTarget && (
        <FileBrowserDialog
          channelName={fileBrowserTarget.channelName}
          path={fileBrowserPath}
          entries={fileBrowserEntries}
          onNavigate={handleFileBrowserNavigate}
          onCreateDir={handleFileBrowserCreateDir}
          onDelete={handleFileBrowserDelete}
          onRename={handleFileBrowserRename}
          onDownload={handleFileBrowserDownload}
          onUpload={handleFileBrowserUpload}
          onRefresh={handleFileBrowserRefresh}
          onClose={() => setFileBrowserTarget(null)}
        />
      )}

      {serverIconsOpen && (
        <ServerIconsDialog
          entries={serverIconEntries}
          images={serverIconImages}
          onUpload={handleServerIconUpload}
          onDelete={handleServerIconDelete}
          onClose={() => setServerIconsOpen(false)}
        />
      )}

      {contactsOpen && (
        <ContactsDialog
          contacts={contacts}
          onlineClients={clients}
          onSave={setContacts}
          onWhisper={toggleWhisperClient}
          onShow={(clientId) => {
            const client = clients.find((c) => c.id === clientId);
            if (client) setSelected({ type: "channel", id: client.channel });
          }}
          onClose={() => setContactsOpen(false)}
        />
      )}

      {awayDialogOpen && (
        <AwayDialog
          message={awayDialogMessage}
          presets={awayPresets}
          onMessageChange={setAwayDialogMessage}
          onOk={handleConfirmAway}
          onSaveTemplate={handleSaveAwayTemplate}
          onCancel={() => setAwayDialogOpen(false)}
        />
      )}

      {optionsDialogOpen && (
        <OptionsDialog
          onOpenWhisperLists={() => setWhisperListsOpen(true)}
          onOpenIdentities={() => setIdentitiesOpen(true)}
          onOpenFavorites={openManageFavorites}
          // Native's ✔: the chosen pack becomes every favorite's pack (drop their overrides).
          onApplyPackToFavorites={() => saveFavorites(favorites.map(({ soundPack: _, ...f }) => f))}
          onClearCache={handleClearCache}
          section={optionsSection}
          onSectionChange={setOptionsSection}
          onClose={() => {
            setOptionsDialogOpen(false);
            if (window.location.hash.startsWith("#options/")) window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }}
          designSelection={designSelection}
          onDesignSelectionChange={handleDesignSelectionChange}
          customThemes={customThemes}
          onSaveCustomTheme={handleSaveCustomTheme}
          onDeleteCustomTheme={handleDeleteCustomTheme}
          idePixelFont={idePixelFont}
          onIdePixelFontChange={(on) => {
            setIdePixelFont(on);
            try {
              localStorage.setItem(IDE_PIXEL_FONT_KEY, on ? "on" : "off");
            } catch {
              /* private mode: setting just doesn't persist */
            }
          }}
          showServerBanner={showServerBanner}
          onShowServerBannerChange={(on) => {
            setShowServerBanner(on);
            try {
              localStorage.setItem(SERVER_BANNER_KEY, on ? "on" : "off");
            } catch {
              /* private mode: setting just doesn't persist */
            }
          }}
          chatImages={chatImages}
          onChatImagesChange={(on) => {
            setChatImages(on);
            try {
              localStorage.setItem(CHAT_IMAGES_KEY, on ? "on" : "off");
            } catch {
              /* private mode: setting just doesn't persist */
            }
          }}
          audio={{
            outputDevices,
            outputDeviceId,
            onOutputDeviceChange: handleOutputDeviceChange,
            onRefreshOutputDevices: refreshOutputDevices,
            playbackVolume,
            onPlaybackVolumeChange: setPlaybackVolume,
            autoVolume,
            onAutoVolumeChange: setAutoVolume,
            ownMicClicks,
            onOwnMicClicksChange: setOwnMicClicks,
            otherMicClicks,
            onOtherMicClicksChange: setOtherMicClicks,
            onPlayTestTone: handlePlayTestTone,
            inputDevices,
            inputDeviceId,
            onInputDeviceChange: handleInputDeviceChange,
            onRefreshInputDevices: refreshInputDevices,
            micOn,
            micLevelRef,
            micTestOn,
            onToggleMicTest: handleToggleMicTest,
            vadThreshold,
            onVadThresholdChange: setVadThreshold,
            vadHangover,
            onVadHangoverChange: setVadHangover,
            pushToTalk,
            continuous,
            onContinuousChange: setContinuous,
            vadMode,
            onVadModeChange: setVadMode,
            typingAttenuation,
            onTypingAttenuationChange: setTypingAttenuation,
            onPushToTalkChange: setPushToTalk,
            pttBinding,
            onPttBindingChange: setPttBinding,
            muteBinding,
            onMuteBindingChange: setMuteBinding,
            globalPtt,
            onGlobalPttChange: setGlobalPtt,
            pttHelperStatus,
            noiseSuppressionEnabled,
            onToggleNoiseSuppression: handleToggleNoiseSuppression,
            echoCancellationEnabled,
            onToggleEchoCancellation: handleToggleEchoCancellation,
            autoGainControlEnabled,
            onToggleAutoGainControl: handleToggleAutoGainControl,
            aec3Enabled,
            aec3Loading,
            onToggleAec3: handleToggleAec3,
          }}
        />
      )}

      {connectError && (
        <div className="ts-connect-error">
          <span>⚠️ {connectError}</span>
          <button onClick={() => setConnectError(null)} title={t("connectError.dismiss")}>
            ✕
          </button>
        </div>
      )}

      {changeNicknameOpen && (
        <div className="ts-poke-compose-backdrop" {...nicknameBackdrop}>
          <div className="ts-poke-compose" onClick={(e) => e.stopPropagation()}>
            <span>✎ {t("menu.self.changeNickname")}</span>
            <input
              autoFocus
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nicknameDraft.trim()) {
                  handleSetNickname(nicknameDraft.trim());
                  setChangeNicknameOpen(false);
                }
                if (e.key === "Escape") setChangeNicknameOpen(false);
              }}
            />
            <button
              disabled={!nicknameDraft.trim()}
              onClick={() => {
                handleSetNickname(nicknameDraft.trim());
                setChangeNicknameOpen(false);
              }}
            >
              {t("favorites.ok")}
            </button>
            <button onClick={() => setChangeNicknameOpen(false)}>{t("favorites.cancel")}</button>
          </div>
        </div>
      )}

      {serverQueryLoginOpen && (
        <div className="ts-poke-compose-backdrop" {...serverQueryLoginBackdrop}>
          <div className="ts-poke-compose ts-serverquery-login-compose" onClick={(e) => e.stopPropagation()}>
            <span>🔑 {t("menu.extras.serverQueryLogin")}</span>
            <input
              autoFocus
              placeholder={t("serverQueryLogin.username")}
              value={serverQueryUsername}
              onChange={(e) => setServerQueryUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setServerQueryLoginOpen(false);
              }}
            />
            <input
              type="password"
              placeholder={t("serverQueryLogin.password")}
              value={serverQueryPassword}
              onChange={(e) => setServerQueryPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleServerQueryLogin();
                if (e.key === "Escape") setServerQueryLoginOpen(false);
              }}
            />
            <button
              disabled={!serverQueryUsername.trim() || !serverQueryPassword}
              onClick={handleServerQueryLogin}
            >
              {t("serverQueryLogin.login")}
            </button>
            <button onClick={() => setServerQueryLoginOpen(false)}>{t("favorites.cancel")}</button>
          </div>
        </div>
      )}

      {pokeTarget && (
        <div className="ts-poke-compose-backdrop" {...pokeBackdrop}>
          <div className="ts-poke-compose" onClick={(e) => e.stopPropagation()}>
            <span>
              👉 {t("poke.title")} <strong>{pokeTarget.name}</strong>
            </span>
            <input
              autoFocus
              value={pokeMessage}
              onChange={(e) => setPokeMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendPoke();
                if (e.key === "Escape") setPokeTarget(null);
              }}
              placeholder={t("poke.optionalMessage")}
            />
            <button onClick={handleSendPoke}>{t("poke.send")}</button>
            <button onClick={() => setPokeTarget(null)}>{t("poke.cancel")}</button>
          </div>
        </div>
      )}

      {kickTarget && (
        <div className="ts-poke-compose-backdrop" {...kickBackdrop}>
          <div className="ts-poke-compose" onClick={(e) => e.stopPropagation()}>
            <span>
              👢 {t("kick.title")} <strong>{kickTarget.name}</strong>
            </span>
            <input
              autoFocus
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmKick();
                if (e.key === "Escape") setKickTarget(null);
              }}
              placeholder={t("kick.reasonPlaceholder")}
            />
            <button onClick={handleConfirmKick}>{t("kick.confirm")}</button>
            <button onClick={() => setKickTarget(null)}>{t("kick.cancel")}</button>
          </div>
        </div>
      )}

      {banTarget && (
        <div className="ts-poke-compose-backdrop" {...banBackdrop}>
          <div className="ts-poke-compose ts-ban-compose" onClick={(e) => e.stopPropagation()}>
            <span>
              🚫 {t("ban.title")} <strong>{banTarget.name}</strong>
            </span>
            <label className="ts-ban-duration-field">
              {t("ban.duration")}
              <select value={banSeconds} onChange={(e) => setBanSeconds(e.target.value)}>
                <option value="0">{t("ban.durationPermanent")}</option>
                <option value="3600">{t("ban.duration1h")}</option>
                <option value="86400">{t("ban.duration1d")}</option>
                <option value="604800">{t("ban.duration1w")}</option>
              </select>
            </label>
            <input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmBan();
                if (e.key === "Escape") setBanTarget(null);
              }}
              placeholder={t("ban.reasonPlaceholder")}
            />
            <button onClick={handleConfirmBan}>{t("ban.confirm")}</button>
            <button onClick={() => setBanTarget(null)}>{t("ban.cancel")}</button>
          </div>
        </div>
      )}

      {pokes.map((poke) => (
        <div key={poke.id} className="ts-poke-notice">
          <span>
            👉 <strong>{poke.from}</strong> {t("poke.pokedYou")}{poke.message ? `: ${poke.message}` : ""}
          </span>
          <button onClick={() => setPokes((prev) => prev.filter((p) => p.id !== poke.id))} title={t("poke.dismiss")}>
            ✕
          </button>
        </div>
      ))}

      {streamSettingsOpen && (
        <StreamSettingsDialog
          ownName={ownClient?.name ?? "WebSpeak3"}
          onStart={handleStartPublishing}
          onCancel={() => setStreamSettingsOpen(false)}
        />
      )}
      {(watchedStream || (publishState !== "idle" && publishState !== "stopped")) && (
      <div className="ts-stream-panels">
      {publishState !== "idle" && publishState !== "stopped" && (
        <div className="ts-stream-panel ts-stream-panel-publish">
          <div className="ts-stream-panel-header">
            <span className="ts-stream-panel-title">
              🖥️ {t("publish.title")} <AlphaBadge />
            </span>
            <span className="ts-stream-panel-state">
              {publishState === "live"
                ? t("publish.viewers", { count: String(publishViewers.length) })
                : t("publish.starting")}
            </span>
            <button
              className="ts-stream-panel-close"
              onClick={handleStopPublishing}
              title={t("publish.stop")}
            >
              ✕
            </button>
          </div>
          {/* muted: this is our own capture playing back locally */}
          <video ref={publishPreviewRef} autoPlay playsInline muted />
          {publishPending.map(([clid, message]) => (
            <div className="ts-stream-request" key={clid}>
              <span className="ts-stream-request-who">
                {publishClientName(clid)}
                {message && <em>{message}</em>}
              </span>
              <button
                className="ts-stream-request-allow"
                onClick={() => void publisherRef.current?.approve(clid)}
              >
                {t("publish.request.allow")}
              </button>
              <button onClick={() => publisherRef.current?.deny(clid)}>
                {t("publish.request.deny")}
              </button>
              <button
                className="ts-stream-request-block"
                onClick={() => publisherRef.current?.deny(clid, true)}
                title={t("publish.request.blockHint")}
              >
                {t("publish.request.block")}
              </button>
            </div>
          ))}
          {publishError && <div className="ts-stream-panel-error">{publishError}</div>}
        </div>
      )}
      {watchedStream && (
        <div className="ts-stream-panel">
          <div className="ts-stream-panel-header">
            <span className="ts-stream-panel-title">
              📺 {watchedStream.name || t("stream.untitled")} <AlphaBadge />
            </span>
            <span className="ts-stream-panel-state">
              {streamState === "connected" ? t("stream.live") : t(`stream.state.${streamState}`)}
            </span>
            <button
              className="ts-stream-panel-close"
              onClick={handleStopWatchingStream}
              title={t("stream.stop")}
            >
              ✕
            </button>
          </div>
          {/* muted so autoplay is never blocked; the user unmutes via the controls */}
          <video ref={streamVideoRef} autoPlay playsInline muted controls />
          {streamError && <div className="ts-stream-panel-error">{streamError}</div>}
        </div>
      )}
      </div>
      )}
      {clientContextMenu && (
        <div
          ref={clientContextMenuRef}
          className="ts-context-menu"
          onKeyDown={handleMenuKeyDown}
          style={{ top: clientContextMenu.y, left: clientContextMenu.x }}
        >
          <div className="ts-context-menu-title">{clientContextMenu.clientName}</div>
          <button
            className="ts-menu-item"
            disabled={clientContextMenu.isSelf}
            onClick={() => {
              handleOpenPrivateChat(clientContextMenu.clientId, clientContextMenu.clientName);
              setClientContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">💬</span>
            <span className="ts-menu-item-label">{t("clientContext.privateChat")}</span>
          </button>
          <button
            className="ts-menu-item"
            disabled={clientContextMenu.isSelf}
            onClick={() => {
              handlePokeClient(clientContextMenu.clientId, clientContextMenu.clientName);
              setClientContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">👉</span>
            <span className="ts-menu-item-label">{t("clientContext.poke")}</span>
          </button>
          {!clientContextMenu.isSelf &&
            gatewayFeatures.has("clientVolume") &&
            (() => {
              const uid = clients.find((c) => c.id === clientContextMenu.clientId)?.uid;
              if (!uid) return null;
              const percent = Math.round((clientVolumes[uid] ?? 1) * 100);
              return (
                <label className="ts-menu-item ts-menu-volume" title={t("clientContext.volumeHint")}>
                  <span className="ts-menu-item-icon">{percent === 0 ? "🔇" : "🔉"}</span>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={percent}
                    aria-label={t("clientContext.volume")}
                    onChange={(e) => {
                      const volume = Number(e.target.value) / 100;
                      setClientVolumes((prev) => {
                        const next = { ...prev };
                        if (volume === 1) delete next[uid];
                        else next[uid] = volume;
                        return next;
                      });
                    }}
                    onDoubleClick={() =>
                      setClientVolumes((prev) => {
                        const { [uid]: _, ...rest } = prev;
                        return rest;
                      })
                    }
                  />
                  <span className="ts-menu-volume-value">{percent}%</span>
                </label>
              );
            })()}
          {!clientContextMenu.isSelf && streamInfos[clientContextMenu.clientId] && (
            <button
              className="ts-menu-item"
              onClick={() => {
                handleWatchStream(clientContextMenu.clientId);
                setClientContextMenu(null);
              }}
            >
              <span className="ts-menu-item-icon">📺</span>
              <span className="ts-menu-item-label">{t("clientContext.watchStream")}</span>
            </button>
          )}
          {!clientContextMenu.isSelf && (
            <button
              className="ts-menu-item"
              onClick={() => {
                handleShowMoveClient(clientContextMenu.clientId, clientContextMenu.clientName);
                setClientContextMenu(null);
              }}
            >
              <span className="ts-menu-item-icon">🚚</span>
              <span className="ts-menu-item-label">{t("clientContext.moveTo")}</span>
            </button>
          )}
          <button
            className="ts-menu-item"
            onClick={() => {
              void navigator.clipboard?.writeText(clientContextMenu.clientName);
              setClientContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">📋</span>
            <span className="ts-menu-item-label">{t("clientContext.copyName")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowClientConnectionInfo(clientContextMenu.clientId, clientContextMenu.clientName);
              setClientContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">🔌</span>
            <span className="ts-menu-item-label">{t("clientContext.connectionInfo")}</span>
          </button>
          {!clientContextMenu.isSelf && (
            <button
              className="ts-menu-item"
              onClick={() => {
                toggleWhisperClient(clientContextMenu.clientId);
                setClientContextMenu(null);
              }}
            >
              <span className="ts-menu-item-icon">🤫</span>
              <span className="ts-menu-item-label">
                {whisperClientIds.has(clientContextMenu.clientId)
                  ? t("clientContext.removeWhisperTarget")
                  : t("clientContext.addWhisperTarget")}
              </span>
            </button>
          )}
          <div className="ts-menu-separator" />
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowChannelGroupAssign(clientContextMenu.clientId, clientContextMenu.clientName);
              setClientContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">🏷️</span>
            <span className="ts-menu-item-label">{t("clientContext.assignChannelGroup")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowServerGroupAssign(clientContextMenu.clientId, clientContextMenu.clientName);
              setClientContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">🎖️</span>
            <span className="ts-menu-item-label">{t("clientContext.assignServerGroup")}</span>
          </button>
          {!clientContextMenu.isSelf && (
            <>
              <div className="ts-menu-separator" />
              <button
                className="ts-menu-item"
                onClick={() => {
                  setKickTarget({
                    id: clientContextMenu.clientId,
                    name: clientContextMenu.clientName,
                    scope: "channel",
                  });
                  setKickReason("");
                  setClientContextMenu(null);
                }}
              >
                <span className="ts-menu-item-icon">🚪</span>
                <span className="ts-menu-item-label">{t("clientContext.kickChannel")}</span>
              </button>
              <button
                className="ts-menu-item"
                onClick={() => {
                  setKickTarget({
                    id: clientContextMenu.clientId,
                    name: clientContextMenu.clientName,
                    scope: "server",
                  });
                  setKickReason("");
                  setClientContextMenu(null);
                }}
              >
                <span className="ts-menu-item-icon">👢</span>
                <span className="ts-menu-item-label">{t("clientContext.kick")}</span>
              </button>
              <button
                className="ts-menu-item"
                onClick={() => {
                  setBanTarget({ id: clientContextMenu.clientId, name: clientContextMenu.clientName });
                  setBanReason("");
                  setBanSeconds("0");
                  setClientContextMenu(null);
                }}
              >
                <span className="ts-menu-item-icon">🚫</span>
                <span className="ts-menu-item-label">{t("clientContext.ban")}</span>
              </button>
            </>
          )}
        </div>
      )}

      {serverContextMenu && (
        <div
          ref={serverContextMenuRef}
          className="ts-context-menu"
          onKeyDown={handleMenuKeyDown}
          style={{ top: serverContextMenu.y, left: serverContextMenu.x }}
        >
          <div className="ts-context-menu-title">{serverName || host}</div>
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowServerConnectionInfo();
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">🔌</span>
            <span className="ts-menu-item-label">{t("serverContext.connectionInfo")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              setServerEditOpen(true);
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">✏️</span>
            <span className="ts-menu-item-label">{t("serverEdit.title")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              void navigator.clipboard?.writeText(host);
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">📋</span>
            <span className="ts-menu-item-label">{t("serverContext.copyAddress")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              openAddFavorite();
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">⭐</span>
            <span className="ts-menu-item-label">{t("serverContext.addFavorite")}</span>
          </button>
          <div className="ts-menu-separator" />
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowServerIcons();
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">🖼️</span>
            <span className="ts-menu-item-label">{t("serverContext.icons")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowServerProtocolLog();
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">📜</span>
            <span className="ts-menu-item-label">{t("menu.extras.serverLog")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowBanList();
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">🚫</span>
            <span className="ts-menu-item-label">{t("menu.extras.banList")}</span>
          </button>
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowComplainList();
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">⚠️</span>
            <span className="ts-menu-item-label">{t("menu.extras.complaintList")}</span>
          </button>
          <div className="ts-menu-separator" />
          <button
            className="ts-menu-item"
            onClick={() => {
              handleDisconnect();
              setServerContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">❌</span>
            <span className="ts-menu-item-label">{t("serverContext.disconnect")}</span>
          </button>
        </div>
      )}

      {channelContextMenu && (
        <div
          ref={channelContextMenuRef}
          className="ts-context-menu"
          onKeyDown={handleMenuKeyDown}
          style={{ top: channelContextMenu.y, left: channelContextMenu.x }}
        >
          <div className="ts-context-menu-title">{channelContextMenu.channelName}</div>
          {ownClient?.channel !== channelContextMenu.channelId && (
            <button
              className="ts-menu-item"
              onMouseDown={(e) => {
                // mousedown + stopPropagation beats the document dismiss listener
                // (which also listens on mousedown) so Join actually fires.
                e.preventDefault();
                e.stopPropagation();
                handleSwitchChannel(channelContextMenu.channelId);
                handleSelectItem({ type: "channel", id: channelContextMenu.channelId });
                setChannelContextMenu(null);
              }}
            >
              <span className="ts-menu-item-icon">➡️</span>
              <span className="ts-menu-item-label">{t("channelContext.join")}</span>
            </button>
          )}
          <button
            className="ts-menu-item"
            onClick={() => {
              handleShowFileBrowser(channelContextMenu.channelId, channelContextMenu.channelName);
              setChannelContextMenu(null);
            }}
          >
            <span className="ts-menu-item-icon">📁</span>
            <span className="ts-menu-item-label">{t("channelContext.files")}</span>
          </button>
        </div>
      )}

      <main className={`ts-body${standardLayout && !infoOpen ? " ts-info-closed" : ""}`}>
        {standardLayout && (
          <ConnectionTabs
            variant="rail"
            tabs={sessionTabs}
            activeTabId={activeSessionId}
            onSelectTab={switchToSession}
            onCloseTab={closeSessionTab}
            onNewConnection={() => setConnectDialogOpen(true)}
            header={menubarEl}
            footer={
              <>
                <span className="ts-visually-hidden" role="heading" aria-level={1}>WebSpeak3</span>
                <button
                  className="ts-rail-icon-btn"
                  onClick={() => setTheme((mode) => (mode === "dark" ? "light" : "dark"))}
                  title={t("toolbar.toggleTheme")}
                  aria-label={t("toolbar.toggleTheme")}
                >
                  <MobileIcon name={theme === "dark" ? "sun" : "moon"} />
                </button>
              </>
            }
          />
        )}
        <div className="ts-upper" style={{ height: upperHeight }}>
          <div className="ts-tree-panel" style={{ width: treeWidth }} onKeyDown={handleTreeKeyDown}>
            {connected ? (
              <>
                <div
                  className={`ts-row ts-server-row${selected?.type === "server" ? " ts-row-selected" : ""}`}
                  onClick={() => handleSelectItem({ type: "server" })}
                  onContextMenu={handleServerContextMenu}
                  tabIndex={0}
                  onFocus={(e) => {
                    if (e.target === e.currentTarget && selected?.type !== "server") handleSelectItem({ type: "server" });
                  }}
                >
                  <ServerIcon />
                  <span>{serverName || host}</span>
                </div>
                <input
                  type="search"
                  className="ts-tree-search"
                  value={treeFilter}
                  placeholder={t("tree.search")}
                  aria-label={t("tree.search")}
                  onChange={(e) => setTreeFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setTreeFilter("");
                  }}
                />
                {treeSearch && treeSearch.channels.length === 0 && (
                  <div className="ts-tree-empty">{t("tree.noMatches")}</div>
                )}
                <ChannelTree
                  channels={treeSearch?.channels ?? channels}
                  clients={treeSearch?.clients ?? treeClients}
                  expandAll={!!treeSearch}
                  parent={0}
                  ownClientId={ownClientId ?? ownClient?.id ?? null}
                  talkers={displayTalkers}
                  serverGroups={serverGroups}
                  channelGroups={channelGroups}
                  groupIconImages={serverIconImages}
                  selected={selected}
                  sessionKey={activeSessionId ?? ""}
                  onSelectItem={handleSelectItem}
                  onSwitchChannel={handleSwitchChannel}
                  onOpenPrivateChat={handleOpenPrivateChat}
                  onMoveClient={handleMoveClient}
                  onClientContextMenu={handleClientContextMenu}
                  onChannelContextMenu={handleChannelContextMenu}
                />
                {standardLayout && ownClient && (
                  <div className="ts-self-bar">
                    <AvatarTile client={ownClient} images={serverIconImages} className="ts-self-bar-avatar" isSelf />
                    <span className="ts-self-bar-name">{ownClient.name}</span>
                    {pushToTalk && micOn && (
                      <button
                        className={`ts-self-bar-btn${pttPressed ? " ts-self-bar-btn-on" : ""}`}
                        onPointerDown={(e) => {
                          e.currentTarget.setPointerCapture(e.pointerId);
                          setPttPressed(true);
                        }}
                        onPointerUp={() => setPttPressed(false)}
                        onPointerCancel={() => setPttPressed(false)}
                        onKeyDown={(e) => {
                          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                            e.preventDefault();
                            setPttPressed(true);
                          }
                        }}
                        onKeyUp={(e) => {
                          if (e.key === " " || e.key === "Enter") setPttPressed(false);
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        title={t("toolbar.pushToTalk")}
                        aria-label={t("toolbar.pushToTalk")}
                        aria-pressed={pttPressed}
                      >
                        <MobileIcon name="talk" />
                      </button>
                    )}
                    <button
                      className={`ts-self-bar-btn${isAway ? " ts-self-bar-btn-away" : ""}`}
                      onClick={() => sendAway(!isAway, "")}
                      title={isAway ? t("toolbar.backOnline") : t("toolbar.setAway")}
                      aria-label={isAway ? t("toolbar.backOnline") : t("toolbar.setAway")}
                      aria-pressed={isAway}
                    >
                      <MobileIcon name="moon" />
                    </button>
                    <button
                      className={`ts-self-bar-btn${micOn && !inputMuted ? "" : " ts-self-bar-btn-off"}`}
                      onClick={handleToggleMic}
                      title={micLabel}
                      aria-label={micLabel}
                    >
                      <MobileIcon name={micOn && !inputMuted ? "mic" : "micOff"} />
                    </button>
                    <button
                      className={`ts-self-bar-btn${outputMuted ? " ts-self-bar-btn-off" : ""}`}
                      onClick={handleToggleOutputMuted}
                      title={outputMuted ? t("toolbar.unmuteSound") : t("toolbar.muteSound")}
                      aria-label={outputMuted ? t("toolbar.unmuteSound") : t("toolbar.muteSound")}
                    >
                      <MobileIcon name={outputMuted ? "soundOff" : "sound"} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="ts-tree-empty">
                {connecting ? (
                  <>
                    <span className="ts-spinner" aria-hidden="true" /> {t("tree.connectingTo", { host })}
                    <button onClick={handleDisconnect}>{t("connect.cancel")}</button>
                  </>
                ) : (
                  <>
                    {t("tree.notConnected")}
                    {!mobile && (
                      <button className="ts-mobile-connect-btn" onClick={() => setConnectDialogOpen(true)}>
                        {t("menu.connections.connect")}
                      </button>
                    )}
                    {!DEMO_MODE && (
                      <a className="ts-tree-empty-demo" href="https://demo.webspeak3.de" target="_blank" rel="noreferrer">
                        {t("tree.tryDemo")}
                      </a>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="ts-resize-handle-vertical" onMouseDown={startTreeResize} />

          <div className="ts-side-panel">
            {connected && standardLayout && (
              <button className="ts-side-panel-close" onClick={() => setInfoOpen(false)} title={t("dialog.close")} aria-label={t("dialog.close")}>
                ×
              </button>
            )}
            {connected && serverBannerUrl && showServerBanner && (
              <div className="ts-banner-panel">
                <img className="ts-server-banner" src={serverBannerUrl} alt="" referrerPolicy="no-referrer" />
              </div>
            )}
            {connected && (
              <InfoPanel
                selected={selected}
                host={host}
                serverName={serverName}
                serverMaxClients={serverMaxClients}
                serverVersion={serverVersion}
                serverLicense={serverLicense}
                serverLicenseId={serverLicenseId}
                totalClientCount={displayClientCount}
                totalChannelCount={
                  serverChannelsOnline > 0 ? serverChannelsOnline : channels.length
                }
                channels={channels}
                clients={treeClients}
                serverGroups={serverGroups}
                images={serverIconImages}
                onShowServerConnectionInfo={handleShowServerConnectionInfo}
                onEditServer={() => setServerEditOpen(true)}
              />
            )}
          </div>
        </div>

        <div className="ts-resize-handle-horizontal" onMouseDown={startUpperResize} />

        <div className="ts-chat-panel">
          {connected && designTheme === "ide" && (
            <div className="ts-ide-breadcrumb">
              {serverName || host}
              {" / "}
              <span>{channels.find((c) => c.id === ownClient?.channel)?.name ?? ""}</span>
            </div>
          )}
          {connected && standardLayout && (
            <div className="ts-channel-header">
              <h2 className="ts-channel-header-name">{ownChannel ? ownChannel.name : serverName || host}</h2>
              <span className="ts-channel-header-meta">
                {ownChannel
                  ? [ownChannel.codec, ownChannel.maxClients ? `${ownChannelCount} / ${ownChannel.maxClients}` : `${ownChannelCount}`]
                      .filter(Boolean)
                      .join(" · ")
                  : serverName || host}
              </span>
              {recording && (
                <button
                  className="ts-channel-header-recording"
                  onClick={stopRecording}
                  title={t("menu.extras.stopRecording")}
                  aria-label={t("menu.extras.stopRecording")}
                >
                  <span className="ts-channel-header-recording-dot" aria-hidden="true" />
                  REC
                </button>
              )}
              <button
                className={`ts-channel-header-btn${publishState === "live" ? " ts-channel-header-btn-on" : ""}`}
                onClick={handleStreamButton}
                disabled={ownClientId === null || DEMO_MODE}
                title={streamLabel}
                aria-label={streamLabel}
              >
                <MobileIcon name={publishState === "live" ? "screenStop" : "screen"} />
              </button>
              {TAB_AUDIO_SUPPORTED && (
                <button
                  className={`ts-channel-header-btn${tabAudioOn ? " ts-channel-header-btn-on" : ""}`}
                  onClick={handleToggleTabAudio}
                  disabled={!micOn}
                  title={tabAudioOn ? t("tabAudio.stop") : t("tabAudio.start")}
                  aria-label={tabAudioOn ? t("tabAudio.stop") : t("tabAudio.start")}
                >
                  <MobileIcon name="music" />
                </button>
              )}
              <button
                className="ts-channel-header-leave"
                onClick={handleDisconnect}
                title={t("menu.connections.disconnectCurrent")}
                aria-label={t("menu.connections.disconnectCurrent")}
              >
                <MobileIcon name="leave" />
                {t("mobile.leave")}
              </button>
            </div>
          )}
          {connected && (designTheme === "pulse" || designTheme === "ide" || standardLayout) && (
            <SpeakingNowBar
              clients={treeClients}
              talkers={displayTalkers}
              ownClientId={ownClient?.id ?? null}
              images={serverIconImages}
              serverGroups={designTheme === "ide" ? serverGroups : undefined}
              selectedClientId={selected?.type === "client" ? selected.id : null}
              showStatus={standardLayout}
              onSelect={(id) => handleSelectItem({ type: "client", id })}
              onOpenPrivateChat={handleOpenPrivateChat}
              onContextMenu={handleClientContextMenu}
            />
          )}
          <div
            className="ts-chat-messages"
            style={{
              fontFamily: chatSettings.fontFamily || undefined,
              fontSize: chatSettings.fontSize ? `${chatSettings.fontSize}px` : undefined,
            }}
          >
            {activeTab === "channel"
              ? chat.map((entry, i) => entry.isLog ? (
                  <div key={i} className="ts-chat-line ts-chat-line-log">
                    <span>{entry.message}</span>
                  </div>
                ) : (
                  <div
                    key={i}
                    className={`ts-chat-line${entry.from === ownClient?.name ? " ts-chat-line-self" : ""}${
                      entry.fromLog ? " ts-chat-line-logged" : ""
                    }`}
                  >
                    <span className="ts-chat-from">{entry.from}{chatColon}</span>{" "}
                    <span className="ts-chat-bubble">{renderBbcode(entry.message, { images: chatImages, stillImages: !treeOptions.animateImages })}</span>
                  </div>
                ))
              : activeTab === "server"
                ? serverChat.map((entry, i) =>
                    entry.isLog ? (
                      <div key={i} className="ts-chat-line ts-chat-line-log">
                        <span>{entry.message}</span>
                      </div>
                    ) : (
                      <div
                        key={i}
                        className={`ts-chat-line${entry.from === ownClient?.name ? " ts-chat-line-self" : ""}`}
                      >
                        <span className="ts-chat-from">{entry.from}{chatColon}</span>{" "}
                        <span className="ts-chat-bubble">{renderBbcode(entry.message, { images: chatImages, stillImages: !treeOptions.animateImages })}</span>
                      </div>
                    )
                  )
                : pmThreads[activeTab]?.messages.map((entry, i) => entry.isLog ? (
                    <div key={i} className="ts-chat-line ts-chat-line-log">
                      <span>{entry.message}</span>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className={`ts-chat-line${entry.fromSelf ? " ts-chat-line-self" : ""}${
                        entry.fromLog ? " ts-chat-line-logged" : ""
                      }`}
                    >
                      <span className="ts-chat-from">
                        {entry.fromSelf ? t("chat.you") : pmThreads[activeTab].partnerName}{chatColon}
                      </span>{" "}
                      <span className="ts-chat-bubble">{renderBbcode(entry.message, { images: chatImages, stillImages: !treeOptions.animateImages })}</span>
                    </div>
                  ))}
            <div ref={chatEndRef} />
          </div>
          <div className="ts-chat-tabs">
            <button
              className={`ts-chat-tab${activeTab === "server" ? " ts-chat-tab-active" : ""}${
                chatUnread.server ? " ts-chat-tab-unread" : ""
              }`}
              onClick={() => setActiveTab("server")}
            >
              {t("chat.server")}
            </button>
            <button
              className={`ts-chat-tab${activeTab === "channel" ? " ts-chat-tab-active" : ""}${
                chatUnread.channel ? " ts-chat-tab-unread" : ""
              }`}
              onClick={() => setActiveTab("channel")}
            >
              {t("chat.channel")}
            </button>
            {Object.values(pmThreads).map((thread) => (
              <button
                key={thread.partnerId}
                className={`ts-chat-tab${activeTab === thread.partnerId ? " ts-chat-tab-active" : ""}${
                  thread.unread ? " ts-chat-tab-unread" : ""
                }`}
                onClick={() => setActiveTab(thread.partnerId)}
                aria-keyshortcuts="Delete"
                onKeyDown={(e) => {
                  // The × can't be its own button inside this one; Delete closes from the keyboard.
                  if (e.key === "Delete") handleClosePrivateChat(thread.partnerId);
                }}
              >
                {thread.partnerName}
                <span
                  aria-hidden="true"
                  className="ts-chat-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClosePrivateChat(thread.partnerId);
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
          <div className="ts-chat-input-row">
            <textarea
              ref={chatInputRef}
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              disabled={!connected}
              placeholder={
                !connected
                  ? t("chat.notConnected")
                  : activeTab === "channel"
                    ? t("chat.messageChannel")
                    : activeTab === "server"
                      ? t("chat.messageServer")
                      : t("chat.messagePartner", { name: pmThreads[activeTab]?.partnerName ?? "" })
              }
            />
            <button onClick={handleSendChat} disabled={!connected}>
              {t("chat.send")}
            </button>
          </div>
        </div>
      </main>

      {mobile && (
        <div className="ts-mobile-bottom">
          {connected ? (
            <div className="ts-mobile-voicebar">
              {pushToTalk && micOn && (
                <button
                  className={`ts-mobile-voice-btn ts-mobile-ptt${pttPressed ? " ts-mobile-voice-on" : ""}`}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setPttPressed(true);
                  }}
                  onPointerUp={() => setPttPressed(false)}
                  onPointerCancel={() => setPttPressed(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-label={t("toolbar.pushToTalk")}
                  aria-pressed={pttPressed}
                >
                  <MobileIcon name="talk" />
                  <span className="ts-mobile-voice-label">{t("mobile.talk")}</span>
                </button>
              )}
              <button
                className={`ts-mobile-voice-btn${micOn && !inputMuted ? " ts-mobile-voice-on" : ""}${
                  micOn && inputMuted ? " ts-mobile-voice-off" : ""
                }`}
                onClick={handleToggleMic}
                aria-label={micLabel}
              >
                <MobileIcon name={micOn && !inputMuted ? "mic" : "micOff"} />
                <span className="ts-mobile-voice-label">{t("mobile.mic")}</span>
              </button>
              <button
                className={`ts-mobile-voice-btn${outputMuted ? " ts-mobile-voice-off" : ""}`}
                onClick={handleToggleOutputMuted}
                aria-label={outputMuted ? t("toolbar.unmuteSound") : t("toolbar.muteSound")}
              >
                <MobileIcon name={outputMuted ? "soundOff" : "sound"} />
                <span className="ts-mobile-voice-label">{t("mobile.sound")}</span>
              </button>
              <button className="ts-mobile-voice-btn ts-mobile-voice-hangup" onClick={handleDisconnect} aria-label={t("menu.connections.disconnectCurrent")}>
                <MobileIcon name="leave" />
                <span className="ts-mobile-voice-label">{t("mobile.leave")}</span>
              </button>
            </div>
          ) : (
            <div className="ts-mobile-voicebar">
              <button className="ts-mobile-connect-btn" onClick={() => setConnectDialogOpen(true)} disabled={connecting}>
                {t("menu.connections.connect")}
              </button>
            </div>
          )}
          <nav className="ts-mobile-tabs">
            {(
              [
                ["tree", t("mobile.tab.channels")],
                ["chat", t("mobile.tab.chat")],
                ["info", t("mobile.tab.info")],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={`ts-mobile-tab${mobileTab === id ? " ts-mobile-tab-active" : ""}${
                  id === "chat" && (chatUnread.server || chatUnread.channel || Object.values(pmThreads).some((p) => p.unread))
                    ? " ts-mobile-tab-unread"
                    : ""
                }`}
                onClick={() => setMobileTab(id)}
                aria-current={mobileTab === id ? "page" : undefined}
              >
                <MobileIcon name={id} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="ts-log">
        {log.slice(-50).map((entry, i) => {
          let text = entry.text;
          if (/os[- ]?error\s*10049/i.test(text) || /angeforderte Adresse ist in diesem Kontext ungültig/i.test(text)) {
            text = t("log.fileTransferInvalidAddress");
          } else {
            text = text.replace(/^(file transfer failed:\s*)+/i, `${t("log.fileTransferFailed")} `);
          }
          return (
            <div key={i} className={entry.kind === "error" ? "ts-log-error" : "ts-log-info"}>
              {text}
            </div>
          );
        })}
      </div>
      <NewsTicker />
      {iconPackStyle && <style>{iconPackStyle}</style>}
    </div>
    </DisplayPrefsContext.Provider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
