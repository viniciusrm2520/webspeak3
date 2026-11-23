import type { AudioSettings } from "../app/shared";
import { PTT_HELPER_DOWNLOAD_URL } from "../app/config";
import { PttKeyButton } from "../components/ui";
import { useT } from "../i18n";

export function HotkeysPanel({ audio }: { audio: AudioSettings }) {
  const t = useT();
  const helperMessage =
    audio.pttHelperStatus === "connected"
      ? t("hotkeys.globalHelper.connected")
      : audio.pttHelperStatus === "unsupported"
        ? t("hotkeys.globalHelper.unsupported")
        : audio.pttHelperStatus === "outdated"
          ? t("hotkeys.globalHelper.outdated")
          : audio.pttHelperStatus === "nokey"
            ? t("hotkeys.globalHelper.nokey")
            : t("hotkeys.globalHelper.missing");
  return (
    <>
      <h3>{t("options.section.hotkeys")}</h3>
      <p className="ts-options-subtitle">{t("hotkeys.subtitle")}</p>
      <fieldset className="ts-options-fieldset">
        <legend>{t("recording.pushToTalk")}</legend>
        <label className="ts-options-checkbox">
          <input type="checkbox" checked={audio.pushToTalk} onChange={(e) => audio.onPushToTalkChange(e.target.checked)} />
          {t("hotkeys.pttEnabled")}
        </label>
        <div className="ts-options-field-row">
          {t("recording.pttKey")}
          <PttKeyButton binding={audio.pttBinding} onChange={audio.onPttBindingChange} />
        </div>
        <p className="ts-options-hint">{t("recording.pttHint")}</p>
      </fieldset>
      <fieldset className="ts-options-fieldset">
        <legend>{t("hotkeys.mute")}</legend>
        <div className="ts-options-field-row">
          {t("hotkeys.muteKey")}
          <PttKeyButton binding={audio.muteBinding} onChange={audio.onMuteBindingChange} />
          {audio.muteBinding && (
            <button type="button" onClick={() => audio.onMuteBindingChange(null)}>
              {t("hotkeys.clear")}
            </button>
          )}
        </div>
        <p className="ts-options-hint">{t("hotkeys.muteHint")}</p>
      </fieldset>
      <fieldset className="ts-options-fieldset">
        <legend>{t("hotkeys.globalHelper.legend")}</legend>
        <label className="ts-options-checkbox">
          <input type="checkbox" checked={audio.globalPtt} onChange={(e) => audio.onGlobalPttChange(e.target.checked)} />
          {t("hotkeys.globalHelper")}
        </label>
        {audio.globalPtt && (
          <p className={`ts-ptt-helper-status ts-ptt-helper-${audio.pttHelperStatus}`} role="status">
            {helperMessage}
          </p>
        )}
        <p className="ts-options-hint">
          {t("hotkeys.globalHelper.hint")}
          {PTT_HELPER_DOWNLOAD_URL && (
            <>
              {" "}
              <a href={PTT_HELPER_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                {t("hotkeys.globalHelper.download")}
              </a>
            </>
          )}
        </p>
      </fieldset>
      <fieldset className="ts-options-fieldset">
        <legend>{t("hotkeys.shortcuts")}</legend>
        <table className="ts-hotkeys-table">
          <tbody>
            {(
              [
                ["Ctrl + S", "menu.connections.connect"],
                ["Ctrl + D", "menu.connections.disconnectCurrent"],
                ["Ctrl + B", "menu.favorites.add"],
              ] as const
            ).map(([keys, label]) => (
              <tr key={keys}>
                <td>
                  <kbd>{keys}</kbd>
                </td>
                <td>{t(label)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ts-options-hint">{t("hotkeys.shortcutsHint")}</p>
      </fieldset>
    </>
  );
}
