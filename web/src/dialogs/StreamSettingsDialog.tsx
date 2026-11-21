import { useState } from "react";
import { AlphaBadge, SegmentedChoice } from "../components/ui";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";
import { StreamAccess, StreamMode, type StreamPublishOptions } from "../publish";

/**
 * Presets from TS6's own stream dialog. Each one fills in the advanced
 * fields; "source" keeps the capture's native resolution and "presentation"
 * trades frame rate for sharp text, which is what the encoder's content hint
 * is for.
 */
const STREAM_PRESETS: Record<
  string,
  { height: number; fps: number; videoBitrateKbps: number; contentHint: "motion" | "detail" }
> = {
  "360": { height: 360, fps: 30, videoBitrateKbps: 1000, contentHint: "motion" },
  "480": { height: 480, fps: 30, videoBitrateKbps: 1500, contentHint: "motion" },
  "720": { height: 720, fps: 30, videoBitrateKbps: 2500, contentHint: "motion" },
  "1080": { height: 1080, fps: 30, videoBitrateKbps: 4000, contentHint: "motion" },
  "1440": { height: 1440, fps: 30, videoBitrateKbps: 6000, contentHint: "motion" },
  source: { height: 0, fps: 60, videoBitrateKbps: 8000, contentHint: "motion" },
  presentation: { height: 0, fps: 5, videoBitrateKbps: 3000, contentHint: "detail" },
};

const RESOLUTION_CHOICES = [360, 480, 720, 1080, 1440, 0];
const FPS_CHOICES = [5, 30, 60];
const AUDIO_BITRATE_CHOICES = [64, 96, 128, 192, 256, 320];

export function StreamSettingsDialog({
  ownName,
  onStart,
  onCancel,
}: {
  ownName: string;
  onStart: (options: StreamPublishOptions) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onCancel);
  const [preset, setPreset] = useState<string | null>("720");
  const [source, setSource] = useState<"display" | "camera">("display");
  const [audio, setAudio] = useState(true);
  const [accessibility, setAccessibility] = useState<number>(StreamAccess.PUBLIC);
  const [advanced, setAdvanced] = useState(false);
  const [height, setHeight] = useState(STREAM_PRESETS["720"]!.height);
  const [fps, setFps] = useState(STREAM_PRESETS["720"]!.fps);
  const [videoBitrateKbps, setVideoBitrateKbps] = useState(STREAM_PRESETS["720"]!.videoBitrateKbps);
  const [audioBitrateKbps, setAudioBitrateKbps] = useState(128);
  const [viewerLimit, setViewerLimit] = useState(0);
  const [mode, setMode] = useState<number>(StreamMode.P2P);
  const [contentHint, setContentHint] = useState<"motion" | "detail">("motion");

  const applyPreset = (key: string) => {
    const p = STREAM_PRESETS[key];
    if (!p) return;
    setPreset(key);
    setHeight(p.height);
    setFps(p.fps);
    setVideoBitrateKbps(p.videoBitrateKbps);
    setContentHint(p.contentHint);
  };

  // Any hand-tuned value means the result is no longer one of the presets, so
  // the highlight is dropped rather than left lying about what will be sent.
  const custom = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPreset(null);
  };

  const resolutionLabel = (value: number) => (value === 0 ? t("publish.res.source") : String(value));

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-stream-settings" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>
            {t("publish.dialog.title")} <AlphaBadge />
          </span>
          <button onClick={onCancel} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <p className="ts-alpha-note">{t("publish.alphaNote")}</p>
          <h4 className="ts-stream-settings-section">{t("publish.dialog.basic")}</h4>

          <div className="ts-stream-settings-row">
            <span>{t("publish.kind")}</span>
            <SegmentedChoice
              value={source}
              onChange={setSource}
              options={[
                { value: "display", label: `🖥️ ${t("publish.kind.display")}` },
                { value: "camera", label: `📷 ${t("publish.camera")}` },
              ]}
            />
          </div>

          <div className="ts-stream-settings-row">
            <span>{t("publish.preset")}</span>
            <SegmentedChoice
              value={preset ?? ""}
              onChange={applyPreset}
              options={[
                ...["360", "480", "720", "1080", "1440"].map((k) => ({ value: k, label: k })),
                { value: "source", label: t("publish.res.source") },
                { value: "presentation", label: t("publish.preset.presentation") },
              ]}
            />
          </div>

          <div className="ts-stream-settings-row">
            <span>{t("publish.audio")}</span>
            <label
              className="ts-stream-settings-toggle"
              title={source === "camera" ? t("publish.audio.cameraHint") : undefined}
            >
              <input
                type="checkbox"
                checked={audio && source === "display"}
                disabled={source === "camera"}
                onChange={(e) => setAudio(e.target.checked)}
              />
              <span />
            </label>
          </div>

          <div className="ts-stream-settings-row">
            <span>{t("publish.privacy")}</span>
            <SegmentedChoice
              value={accessibility}
              onChange={setAccessibility}
              options={[
                { value: StreamAccess.PUBLIC, label: `🌐 ${t("publish.privacy.public")}` },
                { value: StreamAccess.CONTACTS_ONLY, label: `👥 ${t("publish.privacy.contacts")}` },
                { value: StreamAccess.PRIVATE, label: `🔒 ${t("publish.privacy.private")}` },
              ]}
            />
          </div>

          <button
            type="button"
            className="ts-stream-settings-section ts-stream-settings-expand"
            onClick={() => setAdvanced((v) => !v)}
          >
            {t("publish.dialog.advanced")} <span>{advanced ? "⌄" : "›"}</span>
          </button>

          {advanced && (
            <>
              <div className="ts-stream-settings-row">
                <span>{t("publish.resolution")}</span>
                <SegmentedChoice
                  value={height}
                  onChange={custom(setHeight)}
                  options={RESOLUTION_CHOICES.map((v) => ({ value: v, label: resolutionLabel(v) }))}
                />
              </div>

              <div className="ts-stream-settings-row">
                <span>{t("publish.fps")}</span>
                <SegmentedChoice
                  value={fps}
                  onChange={custom(setFps)}
                  options={FPS_CHOICES.map((v) => ({ value: v, label: String(v) }))}
                />
              </div>

              <div className="ts-stream-settings-row">
                <span>{t("publish.bitrate")}</span>
                <div className="ts-stream-settings-stepper">
                  <button type="button" onClick={() => custom(setVideoBitrateKbps)(Math.max(200, videoBitrateKbps - 500))}>
                    −
                  </button>
                  <input
                    type="number"
                    min={200}
                    step={100}
                    value={videoBitrateKbps}
                    onChange={(e) => custom(setVideoBitrateKbps)(Math.max(200, Number(e.target.value) || 200))}
                  />
                  <span className="ts-stream-settings-unit">Kbps</span>
                  <button type="button" onClick={() => custom(setVideoBitrateKbps)(videoBitrateKbps + 500)}>
                    +
                  </button>
                </div>
              </div>

              <div className="ts-stream-settings-row">
                <span>{t("publish.audioBitrate")}</span>
                <SegmentedChoice
                  value={audioBitrateKbps}
                  onChange={custom(setAudioBitrateKbps)}
                  disabled={!audio || source === "camera"}
                  options={AUDIO_BITRATE_CHOICES.map((v) => ({ value: v, label: String(v) }))}
                />
              </div>

              <div className="ts-stream-settings-row">
                <span>{t("publish.viewerLimit")}</span>
                <div className="ts-stream-settings-stepper">
                  <button type="button" onClick={() => setViewerLimit(Math.max(0, viewerLimit - 1))}>
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={viewerLimit}
                    onChange={(e) => setViewerLimit(Math.max(0, Number(e.target.value) || 0))}
                  />
                  <button type="button" onClick={() => setViewerLimit(viewerLimit + 1)}>
                    +
                  </button>
                </div>
              </div>

              <div className="ts-stream-settings-row">
                <span>{t("publish.mode")}</span>
                <SegmentedChoice
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: StreamMode.P2P, label: `👥 ${t("publish.mode.p2p")}` },
                    {
                      value: StreamMode.SFU,
                      label: `🖧 ${t("publish.mode.server")}`,
                      // The SFU path is a different transport entirely
                      // (requestsfuaccessinfo + mediasoup) and is not built
                      // yet; offering it would announce a stream nobody can
                      // watch.
                      disabled: true,
                      title: t("publish.mode.serverUnavailable"),
                    },
                  ]}
                />
              </div>
            </>
          )}
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button type="button" onClick={onCancel}>
              {t("publish.dialog.cancel")}
            </button>
            <button
              type="button"
              className="ts-stream-settings-go"
              onClick={() =>
                onStart({
                  name: `${ownName} - ${t(source === "camera" ? "publish.camera" : "publish.screen")}`,
                  source,
                  audio: audio && source === "display",
                  accessibility,
                  mode,
                  viewerLimit,
                  height,
                  fps,
                  videoBitrateKbps,
                  audioBitrateKbps,
                  contentHint,
                })
              }
            >
              {t("publish.dialog.golive")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
