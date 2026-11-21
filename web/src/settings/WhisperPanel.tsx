import { useContext } from "react";
import { DisplayPrefsContext, type WhisperSettings } from "../app/prefs";
import { useT } from "../i18n";

export function WhisperPanel({ onOpenWhisperLists }: { onOpenWhisperLists: () => void }) {
  const t = useT();
  const { whisper, setWhisper } = useContext(DisplayPrefsContext);
  const set = (patch: Partial<WhisperSettings>) => setWhisper({ ...whisper, ...patch });
  return (
    <>
      <h3>{t("options.section.whispern")}</h3>
      <p className="ts-options-subtitle">{t("whisperSettings.subtitle")}</p>
      <div className="ts-options-fields">
        <fieldset className="ts-options-fieldset">
          <legend>{t("whisperSettings.rights")}</legend>
          {(["allow", "block", "blockAll"] as const).map((mode) => (
            <label key={mode} className="ts-options-radio">
              <input type="radio" name="ts-whisper-mode" checked={whisper.mode === mode} onChange={() => set({ mode })} />
              {t(`whisperSettings.mode.${mode}`)}
            </label>
          ))}
        </fieldset>
        <fieldset className="ts-options-fieldset">
          <legend>{t("whisperSettings.incoming")}</legend>
          <label className="ts-options-checkbox">
            <input type="checkbox" checked={whisper.sound} onChange={(e) => set({ sound: e.target.checked })} />
            {t("whisperSettings.sound")}
          </label>
          <label className="ts-options-checkbox">
            <input
              type="checkbox"
              checked={whisper.openHistory}
              onChange={(e) => set({ openHistory: e.target.checked })}
            />
            {t("whisperSettings.openHistory")}
          </label>
          <label className="ts-options-field">
            {t("whisperSettings.clearAfter")}
            <span>
              <input
                type="number"
                min={1}
                max={999}
                className="ts-download-number"
                value={whisper.clearAfterMin}
                onChange={(e) => set({ clearAfterMin: Math.min(999, Math.max(1, Number(e.target.value) || 1)) })}
              />{" "}
              {t("whisperSettings.minutes")}
            </span>
          </label>
        </fieldset>
        <div>
          <button onClick={onOpenWhisperLists}>{t("menu.extras.whisperLists")}</button>
        </div>
      </div>
    </>
  );
}
