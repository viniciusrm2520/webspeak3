import { useState } from "react";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

const SERVER_EDIT_TABS = ["host", "misc", "transmission", "antiflood", "security", "log"] as const;

interface ServerEditPayload {
  name?: string;
  welcomeMessage?: string;
  password?: string;
  maxClients?: number;
  hostmessage?: string;
  hostmessageMode?: string;
  hostbannerUrl?: string;
  hostbannerGfxUrl?: string;
  hostbannerGfxIntervalSecs?: number;
  hostbannerMode?: string;
  hostbuttonTooltip?: string;
  hostbuttonUrl?: string;
  hostbuttonGfxUrl?: string;
  nickname?: string;
  phoneticName?: string;
  codecEncryptionMode?: string;
}

export function ServerEditDialog({
  serverName,
  welcomeMessage,
  hostbannerGfxUrl,
  onSave,
  onClose,
}: {
  serverName: string;
  welcomeMessage: string;
  hostbannerGfxUrl: string;
  onSave: (payload: ServerEditPayload) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [tab, setTab] = useState<(typeof SERVER_EDIT_TABS)[number]>("host");

  const [name, setName] = useState(serverName);
  const [welcome, setWelcome] = useState(welcomeMessage);
  const [clearPassword, setClearPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [hostmessage, setHostmessage] = useState("");
  const [hostmessageMode, setHostmessageMode] = useState("");
  const [hostbannerUrl, setHostbannerUrl] = useState("");
  const [bannerGfxUrl, setBannerGfxUrl] = useState(hostbannerGfxUrl);
  const [hostbannerGfxInterval, setHostbannerGfxInterval] = useState("");
  const [hostbannerMode, setHostbannerMode] = useState("");
  const [hostbuttonTooltip, setHostbuttonTooltip] = useState("");
  const [hostbuttonUrl, setHostbuttonUrl] = useState("");
  const [hostbuttonGfxUrl, setHostbuttonGfxUrl] = useState("");
  const [maxClients, setMaxClients] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneticName, setPhoneticName] = useState("");
  const [codecEncryptionMode, setCodecEncryptionMode] = useState("");

  const handleSave = () => {
    const payload: ServerEditPayload = {};
    if (name.trim() && name !== serverName) payload.name = name.trim();
    if (welcome !== welcomeMessage) payload.welcomeMessage = welcome;
    if (clearPassword) payload.password = "";
    else if (password) payload.password = password;
    if (hostmessage) payload.hostmessage = hostmessage;
    if (hostmessageMode) payload.hostmessageMode = hostmessageMode;
    if (hostbannerUrl) payload.hostbannerUrl = hostbannerUrl;
    if (bannerGfxUrl !== hostbannerGfxUrl) payload.hostbannerGfxUrl = bannerGfxUrl;
    if (hostbannerGfxInterval) payload.hostbannerGfxIntervalSecs = Number(hostbannerGfxInterval) || 0;
    if (hostbannerMode) payload.hostbannerMode = hostbannerMode;
    if (hostbuttonTooltip) payload.hostbuttonTooltip = hostbuttonTooltip;
    if (hostbuttonUrl) payload.hostbuttonUrl = hostbuttonUrl;
    if (hostbuttonGfxUrl) payload.hostbuttonGfxUrl = hostbuttonGfxUrl;
    if (maxClients) payload.maxClients = Number(maxClients) || 0;
    if (nickname) payload.nickname = nickname;
    if (phoneticName) payload.phoneticName = phoneticName;
    if (codecEncryptionMode) payload.codecEncryptionMode = codecEncryptionMode;
    onSave(payload);
    onClose();
  };

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-options-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("serverEdit.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-options-body">
          <div className="ts-options-sidebar">
            {SERVER_EDIT_TABS.map((id) => (
              <button
                key={id}
                className={`ts-options-sidebar-item${id === tab ? " ts-options-sidebar-item-active" : ""}`}
                onClick={() => setTab(id)}
              >
                <span>{t(`serverEdit.tab.${id}`)}</span>
              </button>
            ))}
          </div>
          <div className="ts-options-content">
            {tab === "host" && (
              <>
                <label className="ts-dialog-field">
                  {t("serverEdit.name")}
                  <input value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.welcomeMessage")}
                  <textarea rows={3} value={welcome} onChange={(e) => setWelcome(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  <span>
                    <input
                      type="checkbox"
                      checked={clearPassword}
                      onChange={(e) => setClearPassword(e.target.checked)}
                    />{" "}
                    {t("serverEdit.clearPassword")}
                  </span>
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.newPassword")}
                  <input
                    type="password"
                    disabled={clearPassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostmessage")}
                  <input value={hostmessage} onChange={(e) => setHostmessage(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostmessageMode")}
                  <select value={hostmessageMode} onChange={(e) => setHostmessageMode(e.target.value)}>
                    <option value="">{t("serverEdit.unchanged")}</option>
                    <option value="none">{t("serverEdit.hostmessageMode.none")}</option>
                    <option value="log">{t("serverEdit.hostmessageMode.log")}</option>
                    <option value="modal">{t("serverEdit.hostmessageMode.modal")}</option>
                    <option value="modalquit">{t("serverEdit.hostmessageMode.modalquit")}</option>
                  </select>
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostbannerUrl")}
                  <input value={hostbannerUrl} onChange={(e) => setHostbannerUrl(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostbannerGfxUrl")}
                  <input value={bannerGfxUrl} onChange={(e) => setBannerGfxUrl(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostbannerGfxInterval")}
                  <input
                    type="number"
                    min={0}
                    value={hostbannerGfxInterval}
                    onChange={(e) => setHostbannerGfxInterval(e.target.value)}
                  />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostbannerMode")}
                  <select value={hostbannerMode} onChange={(e) => setHostbannerMode(e.target.value)}>
                    <option value="">{t("serverEdit.unchanged")}</option>
                    <option value="noadjust">{t("serverEdit.hostbannerMode.noadjust")}</option>
                    <option value="adjustignoreaspect">{t("serverEdit.hostbannerMode.adjustignoreaspect")}</option>
                    <option value="adjustkeepaspect">{t("serverEdit.hostbannerMode.adjustkeepaspect")}</option>
                  </select>
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostbuttonTooltip")}
                  <input value={hostbuttonTooltip} onChange={(e) => setHostbuttonTooltip(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostbuttonUrl")}
                  <input value={hostbuttonUrl} onChange={(e) => setHostbuttonUrl(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.hostbuttonGfxUrl")}
                  <input value={hostbuttonGfxUrl} onChange={(e) => setHostbuttonGfxUrl(e.target.value)} />
                </label>
              </>
            )}
            {tab === "misc" && (
              <>
                <label className="ts-dialog-field">
                  {t("serverEdit.maxClients")}
                  <input
                    type="number"
                    min={0}
                    value={maxClients}
                    onChange={(e) => setMaxClients(e.target.value)}
                  />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.nickname")}
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.phoneticName")}
                  <input value={phoneticName} onChange={(e) => setPhoneticName(e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("serverEdit.codecEncryptionMode")}
                  <select
                    value={codecEncryptionMode}
                    onChange={(e) => setCodecEncryptionMode(e.target.value)}
                  >
                    <option value="">{t("serverEdit.unchanged")}</option>
                    <option value="perchannel">{t("serverEdit.codecEncryptionMode.perchannel")}</option>
                    <option value="forcedoff">{t("serverEdit.codecEncryptionMode.forcedoff")}</option>
                    <option value="forcedon">{t("serverEdit.codecEncryptionMode.forcedon")}</option>
                  </select>
                </label>
              </>
            )}
            {(tab === "transmission" || tab === "antiflood" || tab === "security" || tab === "log") && (
              <>
                <h3>{t(`serverEdit.tab.${tab}`)}</h3>
                <p className="ts-options-placeholder">{t("options.notImplemented")}</p>
              </>
            )}
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button onClick={handleSave}>{t("serverEdit.save")}</button>
            <button onClick={onClose}>{t("serverEdit.cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
