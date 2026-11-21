import type { AudioSettings } from "../app/shared";
import { PttKeyButton } from "../components/ui";
import { useT } from "../i18n";

export function HotkeysPanel({ audio }: { audio: AudioSettings }) {
  const t = useT();
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
