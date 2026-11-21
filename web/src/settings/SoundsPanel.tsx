import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { parseSoundpack } from "../soundpack";
import {
  clearCustomSound,
  loadCustomSound,
  loadEventSoundEnabled,
  loadSoundsEnabled,
  loadSoundsVolume,
  playSound,
  saveCustomSound,
  saveEventSoundEnabled,
  saveSoundsEnabled,
  saveSoundsVolume,
  SOUND_EVENTS,
  type SoundEventId,
} from "../sounds";

export function SoundsPanel() {
  const t = useT();
  const [enabled, setEnabled] = useState(() => loadSoundsEnabled());
  const [volume, setVolume] = useState(() => loadSoundsVolume());
  const [customNames, setCustomNames] = useState<Partial<Record<SoundEventId, string>>>({});
  const [eventEnabled, setEventEnabled] = useState<Record<SoundEventId, boolean>>(() =>
    Object.fromEntries(SOUND_EVENTS.map((id) => [id, loadEventSoundEnabled(id)])) as Record<SoundEventId, boolean>
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<SoundEventId | null>(null);
  const soundpackInputRef = useRef<HTMLInputElement | null>(null);
  const [soundpackResult, setSoundpackResult] = useState<{
    matchedCount: number;
    unmatchedFiles: string[];
  } | null>(null);
  const [soundpackFailed, setSoundpackFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        SOUND_EVENTS.map(async (id) => [id, (await loadCustomSound(id))?.name] as const)
      );
      if (cancelled) return;
      const next: Partial<Record<SoundEventId, string>> = {};
      for (const [id, name] of entries) if (name) next[id] = name;
      setCustomNames(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    saveSoundsEnabled(next);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    saveSoundsVolume(v);
  };

  const handleToggleEventEnabled = (event: SoundEventId) => {
    const next = !eventEnabled[event];
    setEventEnabled((prev) => ({ ...prev, [event]: next }));
    saveEventSoundEnabled(event, next);
  };

  const handleUploadClick = (event: SoundEventId) => {
    uploadTargetRef.current = event;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const event = uploadTargetRef.current;
    e.target.value = "";
    if (!file || !event) return;
    await saveCustomSound(event, file);
    setCustomNames((prev) => ({ ...prev, [event]: file.name }));
  };

  const handleReset = async (event: SoundEventId) => {
    await clearCustomSound(event);
    setCustomNames((prev) => {
      const next = { ...prev };
      delete next[event];
      return next;
    });
  };

  const handleImportSoundpackClick = () => soundpackInputRef.current?.click();

  const handleSoundpackSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSoundpackResult(null);
    setSoundpackFailed(false);
    let parsed: Awaited<ReturnType<typeof parseSoundpack>>;
    try {
      parsed = await parseSoundpack(file);
    } catch {
      setSoundpackFailed(true);
      return;
    }
    const { matched, unmatchedFiles } = parsed;
    for (const [event, sound] of Object.entries(matched) as [SoundEventId, { name: string; blob: Blob }][]) {
      await saveCustomSound(event, new File([sound.blob], sound.name, { type: sound.blob.type }));
    }
    setCustomNames((prev) => {
      const next = { ...prev };
      for (const [event, sound] of Object.entries(matched) as [SoundEventId, { name: string; blob: Blob }][]) {
        next[event] = sound.name;
      }
      return next;
    });
    setSoundpackResult({ matchedCount: Object.keys(matched).length, unmatchedFiles });
  };

  return (
    <>
      <h3>{t("sounds.title")}</h3>
      <p className="ts-options-subtitle">{t("sounds.subtitle")}</p>
      <label className="ts-options-field-row">
        <input type="checkbox" checked={enabled} onChange={handleToggleEnabled} />
        {t("sounds.enable")}
      </label>
      <div className="ts-options-slider-with-value">
        <span className="ts-options-slider-label">{t("sounds.volume")}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>
      <div className="ts-options-field-row">
        <button onClick={handleImportSoundpackClick}>{t("sounds.importSoundpack")}</button>
      </div>
      {soundpackFailed && <p className="ts-options-subtitle">{t("sounds.importFailed")}</p>}
      {soundpackResult && (
        <p className="ts-options-subtitle">
          {t("sounds.importResult", {
            matched: String(soundpackResult.matchedCount),
            unmatched: String(soundpackResult.unmatchedFiles.length),
          })}
        </p>
      )}
      <table className="ts-options-sounds-table">
        <tbody>
          {SOUND_EVENTS.map((eventId) => (
            <tr key={eventId}>
              <td>
                <input
                  type="checkbox"
                  checked={eventEnabled[eventId]}
                  onChange={() => handleToggleEventEnabled(eventId)}
                  title={t("sounds.eventEnable")}
                />
              </td>
              <td>{t(`sounds.event.${eventId}`)}</td>
              <td className="ts-options-sounds-source">
                {customNames[eventId] ? t("sounds.custom", { name: customNames[eventId]! }) : t("sounds.default")}
              </td>
              <td>
                <button onClick={() => void playSound(eventId)}>{t("sounds.test")}</button>
              </td>
              <td>
                <button onClick={() => handleUploadClick(eventId)}>{t("sounds.upload")}</button>
              </td>
              <td>
                {customNames[eventId] && <button onClick={() => void handleReset(eventId)}>{t("sounds.reset")}</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={(e) => void handleFileSelected(e)}
      />
      <input
        ref={soundpackInputRef}
        type="file"
        accept=".ts3soundpack,.zip"
        style={{ display: "none" }}
        onChange={(e) => void handleSoundpackSelected(e)}
      />
    </>
  );
}
