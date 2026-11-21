import { useRef, useState } from "react";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function InviteFriendDialog({
  host,
  channelId,
  channelPath,
  onClose,
}: {
  host: string;
  channelId: number | null;
  /** "Parent/Child" names, what ?channel= of a WebSpeak3 link expects. */
  channelPath: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const [type, setType] = useState<"webspeak3" | "ts3server">("webspeak3");
  const [includeChannel, setIncludeChannel] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const backdrop = useBackdropDismiss(onClose);

  const withChannel = includeChannel && channelId !== null;
  // Opens this same WebSpeak3 instance and joins right away (see AUTO_CONNECT_FROM_URL).
  const webspeak3Link = () => {
    const params = new URLSearchParams({ connect: host });
    if (withChannel && channelPath) params.set("channel", channelPath);
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };
  const link = type === "webspeak3" ? webspeak3Link() : `ts3server://${host}${withChannel ? `?channel=${channelId}` : ""}`;

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-invite-friend-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("inviteFriend.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <div className="ts-dialog-row">
            <label className="ts-dialog-field ts-dialog-field-grow">
              {t("inviteFriend.type")}
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="webspeak3">{t("inviteFriend.webspeak3Link")}</option>
                <option value="ts3server">ts3server link</option>
              </select>
            </label>
            <label className="ts-dialog-checkbox">
              <input
                type="checkbox"
                checked={includeChannel}
                disabled={channelId === null}
                onChange={(e) => setIncludeChannel(e.target.checked)}
              />
              {t("inviteFriend.includeChannel")}
            </label>
          </div>
          <label className="ts-dialog-field">
            {t("inviteFriend.link")}
            <input ref={linkInputRef} readOnly value={link} onFocus={(e) => e.target.select()} />
          </label>
        </div>
        <div className="ts-dialog-buttons">
          <button disabled title={t("clientContext.notSupported")}>
            {t("inviteFriend.addPermissionKey")}
          </button>
          <div className="ts-dialog-buttons-right">
            <button
              onClick={() => {
                // No clipboard API on plain-http origins - select the link
                // instead so it can be copied by hand.
                (navigator.clipboard?.writeText(link) ?? Promise.reject()).then(
                  () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  },
                  () => linkInputRef.current?.select()
                );
              }}
            >
              {copied ? t("inviteFriend.copied") : t("inviteFriend.copyToClipboard")}
            </button>
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
