import { useState } from "react";
import { useT } from "../i18n";

export function ChannelPasswordDialog({
  channelName,
  wrongPassword,
  onSubmit,
  onCancel,
}: {
  channelName: string;
  wrongPassword: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [password, setPassword] = useState("");
  const backdrop = { onClick: onCancel };
  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-channel-password-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("channelPasswordDialog.title")}</span>
        </div>
        <div className="ts-dialog-body">
          <p>
            {wrongPassword ? t("channelPasswordDialog.wrongPassword") : t("channelPasswordDialog.prompt")}
            {channelName ? ` (${channelName})` : ""}
          </p>
          <label className="ts-dialog-field ts-dialog-field-grow">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit(password);
                if (e.key === "Escape") onCancel();
              }}
            />
          </label>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button type="button" onClick={onCancel}>
              {t("channelPasswordDialog.cancel")}
            </button>
            <button type="button" onClick={() => onSubmit(password)}>
              {t("channelPasswordDialog.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
