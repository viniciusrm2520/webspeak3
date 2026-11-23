import type { AudioSettings } from "../app/shared";
import { MicLevelBar, PttKeyButton } from "../components/ui";
import type { VadMode } from "../voice";
import { useT } from "../i18n";

export function AufnahmePanel({ audio }: { audio: AudioSettings }) {
  const t = useT();
  return (
    <>
      <h3>{t("recording.title")}</h3>
      <p className="ts-options-subtitle">{t("recording.subtitle")}</p>
      <div className="ts-options-columns">
        <ul className="ts-options-profile-list">
          <li className="ts-options-profile-item-active">{t("playback.default")}</li>
        </ul>
        <div className="ts-options-fields">
          <label className="ts-options-field">
            {t("recording.device")}
            <select
              value={audio.inputDeviceId}
              onFocus={audio.onRefreshInputDevices}
              onChange={(e) => audio.onInputDeviceChange(e.target.value)}
            >
              <option value="">{t("playback.systemDefault")}</option>
              {audio.inputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Input ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="ts-options-fieldset">
            <legend>{t("recording.activation")}</legend>
            <label className="ts-options-radio">
              <input
                type="radio"
                name="activation"
                checked={audio.pushToTalk}
                onChange={() => audio.onPushToTalkChange(true)}
              />
              {t("recording.pushToTalk")}
            </label>
            {audio.pushToTalk && (
              <>
                <div className="ts-options-field-row">
                  {t("recording.pttKey")}
                  <PttKeyButton binding={audio.pttBinding} onChange={audio.onPttBindingChange} />
                </div>
                <p className="ts-options-hint">{t("recording.pttHint")}</p>
              </>
            )}
            <label className="ts-options-radio">
              <input
                type="radio"
                name="activation"
                checked={!audio.pushToTalk && audio.continuous}
                onChange={() => {
                  audio.onPushToTalkChange(false);
                  audio.onContinuousChange(true);
                }}
              />
              {t("recording.continuous")}
            </label>
            <label className="ts-options-radio">
              <input
                type="radio"
                name="activation"
                checked={!audio.pushToTalk && !audio.continuous}
                onChange={() => {
                  audio.onPushToTalkChange(false);
                  audio.onContinuousChange(false);
                }}
              />
              {t("recording.voiceActivation")}
            </label>
            {!audio.pushToTalk && !audio.continuous && (
              <>
                <label className="ts-options-field-row">
                  {t("recording.vadMode")}
                  <select value={audio.vadMode} onChange={(e) => audio.onVadModeChange(e.target.value as VadMode)}>
                    <option value="volume">{t("recording.vadMode.volume")}</option>
                    <option value="hybrid">{t("recording.vadMode.hybrid")}</option>
                  </select>
                </label>
                <p className="ts-options-hint">{t("recording.vadMode.hint")}</p>
              </>
            )}
            <div className="ts-options-level-wrap">
              <MicLevelBar levelRef={audio.micLevelRef} active={audio.micOn} />
              <input
                className="ts-options-level-threshold"
                type="range"
                min={0.002}
                max={0.15}
                step={0.002}
                value={audio.vadThreshold}
                onChange={(e) => audio.onVadThresholdChange(Number(e.target.value))}
              />
            </div>
            <div className="ts-options-field-row">
              <button onClick={audio.onToggleMicTest} disabled={!audio.micOn}>
                {audio.micTestOn ? t("recording.testStop") : t("recording.testStart")}
              </button>
              <span className={`ts-options-test-dot${audio.micTestOn ? " ts-options-test-dot-on" : ""}`} />
              <label className="ts-options-field-inline">
                {t("recording.hangoverDelay")}
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={audio.vadHangover}
                  onChange={(e) => audio.onVadHangoverChange(Number(e.target.value))}
                />
                {t("recording.secondsUnit")}
              </label>
            </div>
          </fieldset>
          <fieldset className="ts-options-fieldset">
            <legend>{t("recording.dsp")}</legend>
            <div className="ts-options-dsp-grid">
              <label className="ts-options-checkbox">
                <input
                  type="checkbox"
                  checked={audio.typingAttenuation}
                  onChange={(e) => audio.onTypingAttenuationChange(e.target.checked)}
                />
                {t("recording.typingAttenuation")}
              </label>
              <label className="ts-options-checkbox">
                <input
                  type="checkbox"
                  checked={audio.echoCancellationEnabled}
                  disabled={audio.aec3Enabled}
                  onChange={audio.onToggleEchoCancellation}
                />
                {t("recording.echoCancellation")}
              </label>
              <label className="ts-options-checkbox">
                <input
                  type="checkbox"
                  checked={audio.noiseSuppressionEnabled}
                  onChange={audio.onToggleNoiseSuppression}
                />
                {t("recording.noiseSuppression")}
              </label>
              <label className="ts-options-checkbox">
                <input
                  type="checkbox"
                  checked={audio.autoGainControlEnabled}
                  onChange={audio.onToggleAutoGainControl}
                />
                {t("recording.autoGainControl")}
              </label>
              <label className="ts-options-checkbox">
                <input
                  type="checkbox"
                  checked={audio.aec3Enabled}
                  disabled={audio.aec3Loading}
                  onChange={audio.onToggleAec3}
                />
                {t("recording.aec3")}
                {audio.aec3Loading ? "…" : ""}
              </label>
            </div>
          </fieldset>
        </div>
      </div>
    </>
  );
}
