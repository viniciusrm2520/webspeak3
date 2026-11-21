import { useContext } from "react";
import { DisplayPrefsContext } from "../app/prefs";
import type { ChatSettings } from "../chatlog";
import { useT } from "../i18n";

const CHAT_FONTS = [
  "Arial",
  "Verdana",
  "Tahoma",
  "Segoe UI",
  "Trebuchet MS",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Consolas",
  "sans-serif",
  "serif",
  "monospace",
];

export function ChatPanel() {
  const t = useT();
  const { chat, setChat } = useContext(DisplayPrefsContext);
  const set = (patch: Partial<ChatSettings>) => setChat({ ...chat, ...patch });
  const restoreRow = (key: "restoreChannelLines" | "restorePrivateLines") => (
    <div className="ts-chat-restore-row">
      <label className="ts-options-checkbox">
        <input type="checkbox" checked={chat[key] > 0} onChange={(e) => set({ [key]: e.target.checked ? 100 : 0 })} />
        {t(`chatSettings.${key}`)}
      </label>
      <span>
        {t("chatSettings.last")}{" "}
        <input
          type="number"
          min={1}
          max={1000}
          className="ts-download-number"
          value={chat[key] || 100}
          disabled={chat[key] === 0}
          onChange={(e) => set({ [key]: Math.min(1000, Math.max(1, Number(e.target.value) || 1)) })}
        />{" "}
        {t("chatSettings.linesUnit")}
      </span>
    </div>
  );
  return (
    <>
      <h3>{t("options.section.chat")}</h3>
      <p className="ts-options-subtitle">{t("chatSettings.subtitle")}</p>
      <div className="ts-options-fields">
        <fieldset className="ts-options-fieldset">
          <legend>{t("chatSettings.window")}</legend>
          <label className="ts-options-field">
            {t("chatSettings.maxLines")}
            <span>
              <input
                type="number"
                min={10}
                className="ts-download-number"
                value={chat.maxLines}
                onChange={(e) => set({ maxLines: Math.max(10, Number(e.target.value) || 10) })}
              />{" "}
              {t("chatSettings.linesUnit")}
            </span>
          </label>
          <div className="ts-chat-font-row">
            {t("chatSettings.font")}
            <select value={chat.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })}>
              <option value="">{t("chatSettings.fontDefault")}</option>
              {CHAT_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={8}
              max={32}
              className="ts-download-number"
              placeholder={t("chatSettings.fontDefault")}
              value={chat.fontSize || ""}
              onChange={(e) => set({ fontSize: Math.min(32, Math.max(0, Number(e.target.value) || 0)) })}
            />
            px
            <button
              title={t("chatSettings.fontReset")}
              aria-label={t("chatSettings.fontReset")}
              onClick={() => set({ fontFamily: "", fontSize: 0 })}
            >
              ↻
            </button>
          </div>
          <div
            className="ts-chat-font-preview"
            style={{ fontFamily: chat.fontFamily || undefined, fontSize: chat.fontSize ? `${chat.fontSize}px` : undefined }}
          >
            {t("chatSettings.fontPreview")}
          </div>
        </fieldset>
        <fieldset className="ts-options-fieldset">
          <legend>{t("chatSettings.autoLog")}</legend>
          {(["logChannel", "logPrivate", "logServer"] as const).map((key) => (
            <label key={key} className="ts-options-checkbox">
              <input type="checkbox" checked={chat[key]} onChange={(e) => set({ [key]: e.target.checked })} />
              {t(`chatSettings.${key}`)}
            </label>
          ))}
          <p className="ts-options-hint">{t("chatSettings.logHint")}</p>
        </fieldset>
        <fieldset className="ts-options-fieldset">
          <legend>{t("chatSettings.restore")}</legend>
          {restoreRow("restoreChannelLines")}
          {restoreRow("restorePrivateLines")}
        </fieldset>
        <fieldset className="ts-options-fieldset">
          <legend>{t("chatSettings.notify")}</legend>
          {(["notifyServer", "notifyChannel", "notifyPrivate"] as const).map((key) => (
            <label key={key} className="ts-options-checkbox">
              <input type="checkbox" checked={chat[key]} onChange={(e) => set({ [key]: e.target.checked })} />
              {t(`chatSettings.${key}`)}
            </label>
          ))}
        </fieldset>
      </div>
    </>
  );
}
