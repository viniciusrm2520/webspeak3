import type { SaveTarget } from "../downloads";
import { downloadBlob } from "./shared";

export type LogEntry = { text: string; kind: "info" | "error" };

export interface ChannelInfo {
  id: number;
  parent: number;
  order: number;
  name: string;
  topic: string;
  codec: string;
  maxClients: number | null;
  hasPassword: boolean;
}

export type SelectedItem =
  | { type: "server" }
  | { type: "channel"; id: number }
  | { type: "client"; id: number };

export interface ClientInfo {
  id: number;
  channel: number;
  name: string;
  inputMuted: boolean;
  outputMuted: boolean;
  inputHardwareEnabled: boolean;
  away: boolean;
  awayMessage: string;
  isChannelCommander: boolean;
  country: string;
  uid: string;
  databaseId: number;
  channelGroup: number;
  serverGroups: number[];
  hasTalkPower: boolean;
  /** TS6 Stream/Call broadcast running; absent on servers that don't report it. */
  isStreaming?: boolean;
  /** ServerQuery client; filtered from the tree unless a favorite enables them. */
  isQuery?: boolean;
  /** MD5 of the avatar, empty without one; missing from gateways before v0.15. */
  avatarHash?: string;
}

export interface GroupEntry {
  id: number;
  name: string;
  iconId: number;
}

export interface PermissionOverviewEntry {
  name: string;
  description: string;
  value: number;
  negated: boolean;
  skip: boolean;
}

export interface FileListEntry {
  path: string;
  name: string;
  size: number;
  isFile: boolean;
  timestamp: string;
}

export interface PermissionCatalogEntry {
  id: number;
  name: string;
  description: string;
}

export type PermScope = "server" | "channelgroup" | "channel" | "client" | "channelclient";

export interface ClientConnectionInfoData {
  clientId: number;
  pingMs: number | null;
  connectedSecs: number | null;
  ip: string | null;
  packetsSent: number;
  bytesSent: number;
  packetsReceived: number;
  bytesReceived: number;
  packetLossPercent: number;
}

export interface ServerConnectionInfoData {
  pingMs: number;
  connectedSecs: number;
  packetLossPercent: number;
  packetsSentTotal: number;
  bytesSentTotal: number;
  packetsReceivedTotal: number;
  bytesReceivedTotal: number;
  bandwidthSentLastSecond: number;
  bandwidthReceivedLastSecond: number;
  bandwidthSentLastMinute: number;
  bandwidthReceivedLastMinute: number;
  filetransferBandwidthSent: number;
  filetransferBandwidthReceived: number;
  filetransferBytesSent: number;
  filetransferBytesReceived: number;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/** Compact counts like GreenTeaSpeak (`772.92 k`) — avoids DE locale `772.920`. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} k`;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

export function formatRate(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

/** Turns a base64-encoded file (as delivered by the "fileDownloadData" event)
 *  into an actual browser download, without ever round-tripping through the
 *  gateway's HTTP surface - it's all-in-memory via a Blob + object URL. */
export function triggerBrowserDownload(filename: string, base64Data: string): void {
  downloadBlob(base64Blob(base64Data), filename);
}

export function base64Blob(base64Data: string): Blob {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes]);
}

/** One entry of the file transfer window (Options -> Download queue/limits). */
export interface Transfer {
  id: number;
  dir: "up" | "down";
  cid: number;
  path: string;
  name: string;
  size: number;
  done: number;
  status: "queued" | "running" | "done" | "error";
  /** Downloads: picked at click time. */
  target?: SaveTarget;
  /** Uploads. */
  file?: File;
}
