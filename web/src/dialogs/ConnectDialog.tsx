import { useEffect, useState } from "react";
import { fetchGatewayFeatures, SERVER_CHOICES, type ServerType } from "../app/config";
import type { Identity } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function ConnectDialog({
  host,
  nickname,
  serverPassword,
  channelPassword,
  defaultChannel,
  privilegeKey,
  serverType,
  loginName,
  loginPassword,
  expanded,
  connecting,
  identities,
  activeIdentityId,
  onHostChange,
  onNicknameChange,
  onServerPasswordChange,
  onChannelPasswordChange,
  onDefaultChannelChange,
  onPrivilegeKeyChange,
  onServerTypeChange,
  onLoginNameChange,
  onLoginPasswordChange,
  onActiveIdentityChange,
  onToggleExpanded,
  onConnect,
  onConnectNewTab,
  onCancel,
  nova,
  onOpenOptions,
  canOpenNewTab,
}: {
  host: string;
  nickname: string;
  serverPassword: string;
  channelPassword: string;
  defaultChannel: string;
  privilegeKey: string;
  serverType: ServerType;
  loginName: string;
  loginPassword: string;
  expanded: boolean;
  connecting: boolean;
  identities: Identity[];
  activeIdentityId: string | null;
  onHostChange: (v: string) => void;
  onNicknameChange: (v: string) => void;
  onServerPasswordChange: (v: string) => void;
  onChannelPasswordChange: (v: string) => void;
  onDefaultChannelChange: (v: string) => void;
  onPrivilegeKeyChange: (v: string) => void;
  onLoginNameChange: (v: string) => void;
  onLoginPasswordChange: (v: string) => void;
  onServerTypeChange: (v: ServerType) => void;
  onActiveIdentityChange: (id: string) => void;
  onToggleExpanded: () => void;
  /** Connect always opens a new session tab (GTS multi-join). */
  onConnect: () => void;
  onConnectNewTab: () => void;
  onCancel: () => void;
  /** Nova-theme-only: renders the TS6-redesign "connect hero" (logo, title,
   *  subtitle, settings shortcut) around the same form instead of the
   *  Standard theme's plain titled dialog box. */
  nova: boolean;
  onOpenOptions: () => void;
  canOpenNewTab: boolean;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onCancel);
  const [ts2Available, setTs2Available] = useState(false);
  useEffect(() => {
    void fetchGatewayFeatures().then((f) => setTs2Available(f.includes("ts2")));
  }, []);

  // Nova-theme-only: the "Erweiterte Optionen" toggle moves from the footer
  // (Standard) to right under the nickname field, with a rotating chevron -
  // matching the TS6 redesign's Connect screen instead of a plain button.
  const expandToggle = nova ? (
    <button className="ts-connect-nova-expand" onClick={onToggleExpanded}>
      <svg
        className={`ts-connect-nova-chevron${expanded ? " ts-connect-nova-chevron-open" : ""}`}
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
      {expanded ? t("connect.less") : t("connect.more")}
    </button>
  ) : (
    <button onClick={onToggleExpanded}>{expanded ? t("connect.less") : t("connect.more")}</button>
  );

  const dialogBody = (
    <div className="ts-dialog ts-connect-dialog" onClick={(e) => e.stopPropagation()}>
      {nova ? (
        <button className="ts-connect-nova-settings" onClick={onOpenOptions} title={t("menu.extras.options")}>
          ⚙️
        </button>
      ) : (
        <div className="ts-dialog-titlebar">
          <span>{t("connect.title")}</span>
          <button onClick={onCancel} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
      )}
      <div className="ts-dialog-body">
        <div className="ts-dialog-row">
          <label className="ts-dialog-field ts-dialog-field-grow">
            {t("connect.serverAddress")}
            {SERVER_CHOICES.length > 1 ? (
              <select autoFocus value={host} onChange={(e) => onHostChange(e.target.value)}>
                {SERVER_CHOICES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                autoFocus
                value={host}
                placeholder={t("connect.hostPlaceholder")}
                disabled={SERVER_CHOICES.length === 1}
                onChange={(e) => onHostChange(e.target.value)}
              />
            )}
          </label>
          <label className="ts-dialog-field">
            {t("connect.serverPassword")}
            <input
              type="password"
              value={serverPassword}
              onChange={(e) => onServerPasswordChange(e.target.value)}
            />
          </label>
        </div>
        <label className="ts-dialog-field">
          {t("connect.nickname")}
          <input value={nickname} onChange={(e) => onNicknameChange(e.target.value)} />
        </label>

        {nova && expandToggle}

        {expanded && (
            <div className="ts-dialog-grid">
              <label className="ts-dialog-field">
                {t("connect.phoneticNickname")}
                <input disabled title={t("clientContext.notSupported")} />
              </label>
              <label className="ts-dialog-field">
                {t("connect.identity")}
                <select value={activeIdentityId ?? ""} onChange={(e) => onActiveIdentityChange(e.target.value)}>
                  {identities.map((identity) => (
                    <option key={identity.id} value={identity.id}>
                      {identity.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ts-dialog-field">
                {t("connect.defaultChannel")}
                <input value={defaultChannel} onChange={(e) => onDefaultChannelChange(e.target.value)} />
              </label>
              <label className="ts-dialog-field">
                {t("connect.recordingProfile")}
                <select disabled defaultValue="Standard">
                  <option>Standard</option>
                </select>
              </label>
              <label className="ts-dialog-field">
                {t("connect.channelPassword")}
                <input
                  type="password"
                  value={channelPassword}
                  onChange={(e) => onChannelPasswordChange(e.target.value)}
                />
              </label>
              <label className="ts-dialog-field">
                {t("connect.playbackProfile")}
                <select disabled defaultValue="Standard">
                  <option>Standard</option>
                </select>
              </label>
              <label className="ts-dialog-field">
                {t("connect.onetimeGrant")}
                <input
                  type="password"
                  value={privilegeKey}
                  onChange={(e) => onPrivilegeKeyChange(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="ts-dialog-field">
                {t("connect.serverType")}
                <select
                  value={serverType}
                  onChange={(e) => onServerTypeChange(e.target.value as ServerType)}
                >
                  <option value="auto">{t("connect.serverType.auto")}</option>
                  <option value="teamspeak">{t("connect.serverType.teamspeak")}</option>
                  <option value="teaspeak">{t("connect.serverType.teaspeak")}</option>
                  {(ts2Available || serverType === "ts2") && (
                    <option value="ts2">{t("connect.serverType.ts2")}</option>
                  )}
                </select>
              </label>
              {serverType === "ts2" && (
                <>
                  <label className="ts-dialog-field">
                    {t("connect.ts2LoginName")}
                    <input
                      value={loginName}
                      onChange={(e) => onLoginNameChange(e.target.value)}
                      autoComplete="username"
                    />
                  </label>
                  <label className="ts-dialog-field">
                    {t("connect.ts2LoginPassword")}
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => onLoginPasswordChange(e.target.value)}
                      autoComplete="current-password"
                    />
                  </label>
                </>
              )}
              <label className="ts-dialog-field">
                {t("connect.hotkeyProfile")}
                <select disabled defaultValue="Standard">
                  <option>Standard</option>
                </select>
              </label>
              <label className="ts-dialog-field">
                {t("connect.soundPack")}
                <select disabled defaultValue="Standard">
                  <option>Standard</option>
                </select>
              </label>
            </div>
          )}
        </div>
        <div className={nova ? "ts-connect-nova-buttons" : "ts-dialog-buttons"}>
          {!nova && expandToggle}
          <div className={nova ? undefined : "ts-dialog-buttons-right"}>
            {nova && (
              <button className="ts-connect-cancel" onClick={onCancel}>
                {t("connect.cancel")}
              </button>
            )}
            {!nova && (
              <button onClick={onConnect} disabled={connecting || !host || !nickname}>
                {connecting ? t("connect.connecting") : t("connect.connect")}
              </button>
            )}
            <button
              className={nova ? "ts-connect-cancel" : undefined}
              onClick={onConnectNewTab}
              disabled={connecting || !host || !nickname || !canOpenNewTab}
              title={canOpenNewTab ? undefined : t("connect.newTab")}
            >
              {t("connect.newTab")}
            </button>
            {nova ? (
              <button
                className="ts-connect-nova-primary"
                onClick={onConnect}
                disabled={connecting || !host || !nickname}
              >
                {connecting ? t("connect.connecting") : t("connect.connect")}
              </button>
            ) : (
              <button onClick={onCancel}>{t("connect.cancel")}</button>
            )}
          </div>
        </div>
      </div>
  );

  if (!nova)
    return (
      <div className="ts-dialog-backdrop" {...backdrop}>
        {dialogBody}
      </div>
    );

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-connect-nova-wrap">
        <div className="ts-connect-nova-hero">
          <span className="ts-connect-nova-logo">W</span>
          <div className="ts-connect-nova-heading">
            <div className="ts-connect-nova-title">{t("connect.title")}</div>
            <div className="ts-connect-nova-subtitle">{t("connect.novaSubtitle")}</div>
          </div>
        </div>
        {dialogBody}
      </div>
    </div>
  );
}
