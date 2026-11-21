import type { AudioSettings } from "../app/shared";
import { useT } from "../i18n";

export function WiedergabePanel({ audio }: { audio: AudioSettings }) {
  const t = useT();
  const volumeDb = Math.round(20 * Math.log10(audio.playbackVolume || 0.001) * 10) / 10;
  return (
    <>
      <h3>{t("playback.title")}</h3>
      <p className="ts-options-subtitle">{t("playback.subtitle")}</p>
      <div className="ts-options-field-row">
        <label>{t("playback.profile")}</label>
      </div>
      <div className="ts-options-columns">
        <ul className="ts-options-profile-list">
          <li className="ts-options-profile-item-active">{t("playback.default")}</li>
        </ul>
        <div className="ts-options-fields">
          <label className="ts-options-field">
            {t("playback.device")}
            <select
              value={audio.outputDeviceId}
              onFocus={audio.onRefreshOutputDevices}
              onChange={(e) => audio.onOutputDeviceChange(e.target.value)}
            >
              <option value="">{t("playback.systemDefault")}</option>
              {audio.outputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Output ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </label>
          <div className="ts-options-slider-row">
            <span>{t("playback.quiet")}</span>
            <span className="ts-options-slider-label">{t("playback.voiceVolume")}</span>
            <span>{t("playback.loud")}</span>
          </div>
          <div className="ts-options-slider-with-value">
            <input
              type="range"
              min={0}
              max={2}
              step={0.02}
              value={audio.playbackVolume}
              onChange={(e) => audio.onPlaybackVolumeChange(Number(e.target.value))}
            />
            <span className="ts-options-db-value">
              {volumeDb > 0 ? "+" : ""}
              {volumeDb} dB
            </span>
          </div>
          <button onClick={audio.onPlayTestTone}>{t("playback.playTestTone")}</button>
          <fieldset className="ts-options-fieldset">
            <legend>{t("playback.options")}</legend>
            <label className="ts-options-checkbox">
              <input type="checkbox" checked={audio.autoVolume} onChange={(e) => audio.onAutoVolumeChange(e.target.checked)} />
              {t("playback.autoVolume")}
            </label>
            <label className="ts-options-checkbox">
              <input type="checkbox" checked={audio.ownMicClicks} onChange={(e) => audio.onOwnMicClicksChange(e.target.checked)} />
              {t("playback.ownMicClicks")}
            </label>
            <label className="ts-options-checkbox">
              <input type="checkbox" checked={audio.otherMicClicks} onChange={(e) => audio.onOtherMicClicksChange(e.target.checked)} />
              {t("playback.otherMicClicks")}
            </label>
          </fieldset>
        </div>
      </div>
    </>
  );
}
