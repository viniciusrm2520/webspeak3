import { useState } from "react";
import { APP_SETTINGS_KEY, type AppSettings, loadAppSettings } from "../app/prefs";
import { type LangPref, useLanguage, useT } from "../i18n";

export function AnwendungPanel({
  showServerBanner,
  onShowServerBannerChange,
  chatImages,
  onChatImagesChange,
}: {
  showServerBanner: boolean;
  onShowServerBannerChange: (on: boolean) => void;
  chatImages: boolean;
  onChatImagesChange: (on: boolean) => void;
}) {
  const t = useT();
  const { langPref, setLangPref } = useLanguage();
  const [settings, setSettings] = useState(loadAppSettings);
  const check = (key: keyof AppSettings) => (
    <label className="ts-options-checkbox">
      <input
        type="checkbox"
        checked={settings[key]}
        onChange={(e) => {
          const next = { ...settings, [key]: e.target.checked };
          setSettings(next);
          localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(next));
        }}
      />
      {t(`app.${key}`)}
    </label>
  );
  return (
    <>
      <h3>{t("app.title")}</h3>
      <p className="ts-options-subtitle">{t("app.subtitle")}</p>
      <div className="ts-options-columns">
        <div className="ts-options-fields">
          <fieldset className="ts-options-fieldset">
            <legend>{t("app.group.server")}</legend>
            {check("micOnServerSwitch")}
            {check("reconnectAfterSleep")}
            {check("middleClickQuickAccess")}
            {check("updateFavoriteNickname")}
          </fieldset>
          <fieldset className="ts-options-fieldset">
            <legend>{t("app.group.misc")}</legend>
            {check("autoOpenChannelChat")}
            {check("mutedTalkingSound")}
            {check("neverShowPokeDialog")}
          </fieldset>
          <fieldset className="ts-options-fieldset">
            <legend>{t("app.group.subscribe")}</legend>
            <label className="ts-options-radio">
              <input type="radio" name="ts-app-subscribe" checked readOnly />
              {t("app.subscribe.all")}
            </label>
            {/* The connector always subscribes everything; "current only" needs connector work. */}
            <label className="ts-options-radio ts-options-disabled" title={t("design.notAvailable")}>
              <input type="radio" name="ts-app-subscribe" disabled />
              {t("app.subscribe.current")}
            </label>
          </fieldset>
        </div>
        <div className="ts-options-fields">
          <label className="ts-options-field">
            {t("app.language")}
            <select value={langPref} onChange={(e) => setLangPref(e.target.value as LangPref)}>
              <option value="auto">{t("app.language.auto")}</option>
              <option value="de">{t("app.language.de")}</option>
              <option value="en">{t("app.language.en")}</option>
              <option value="zh-CN">{t("app.language.zh-CN")}</option>
              <option value="fa">{t("app.language.fa")}</option>
              <option value="cs-CZ">{t("app.language.cs-CZ")}</option>
              <option value="ru">{t("app.language.ru")}</option>
            </select>
          </label>
          <p className="ts-options-hint">
            <a href="https://github.com/WebSpeak3/webspeak3#translating" target="_blank" rel="noreferrer">
              {t("app.language.helpTranslate")}
            </a>
          </p>
          <fieldset className="ts-options-fieldset">
            <legend>{t("app.group.privacy")}</legend>
            <label className="ts-options-checkbox">
              <input type="checkbox" checked={showServerBanner} onChange={(e) => onShowServerBannerChange(e.target.checked)} />
              {t("app.serverBanner")}
            </label>
            <p className="ts-options-hint">{t("app.serverBanner.hint")}</p>
            <label className="ts-options-checkbox">
              <input type="checkbox" checked={chatImages} onChange={(e) => onChatImagesChange(e.target.checked)} />
              {t("app.chatImages")}
            </label>
            <p className="ts-options-hint">{t("app.chatImages.hint")}</p>
          </fieldset>
        </div>
      </div>
    </>
  );
}
