import { useRef, useState } from "react";
import { type ClientLogEntry, LOG_LEVELS, type LogLevel } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function ClientLogDialog({ entries, onClose }: { entries: ClientLogEntry[]; onClose: () => void }) {
  const t = useT();
  const [enabledLevels, setEnabledLevels] = useState<Set<LogLevel>>(new Set(LOG_LEVELS));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const backdrop = useBackdropDismiss(onClose);
  const listRef = useRef<HTMLDivElement | null>(null);

  const toggleLevel = (level: LogLevel) => {
    setEnabledLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const matches = (message: string, needle: string) =>
    caseSensitive ? message.includes(needle) : message.toLowerCase().includes(needle.toLowerCase());

  const visible = entries
    .filter((e) => enabledLevels.has(e.level))
    .filter((e) => !filter || matches(e.message, filter));

  const handleMark = () => {
    if (!search) return;
    const idx = visible.findIndex((e) => matches(e.message, search));
    if (idx >= 0) {
      const row = listRef.current?.querySelector(`[data-log-id="${visible[idx].id}"]`);
      row?.scrollIntoView({ block: "center" });
    }
  };

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-client-log-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("clientLog.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <div className="ts-dialog-row ts-log-level-row">
            {LOG_LEVELS.map((level) => (
              <label key={level} className="ts-dialog-checkbox">
                <input
                  type="checkbox"
                  checked={enabledLevels.has(level)}
                  onChange={() => toggleLevel(level)}
                />
                {t(`clientLog.level.${level}`)}
              </label>
            ))}
          </div>
          <div className="ts-log-list" ref={listRef}>
            {visible.map((e) => (
              <div key={e.id} data-log-id={e.id} className={`ts-log-row ts-log-row-${e.level}`}>
                <span className="ts-log-time">{new Date(e.timestamp).toLocaleString()}</span>
                <span className="ts-log-category">{e.category}</span>
                <span className="ts-log-level">{t(`clientLog.level.${e.level}`)}</span>
                <span className="ts-log-message">{e.message}</span>
              </div>
            ))}
          </div>
          <div className="ts-dialog-row">
            <label className="ts-dialog-field ts-dialog-field-grow">
              {t("clientLog.search")}
              <input value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <label className="ts-dialog-checkbox">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              {t("clientLog.caseSensitive")}
            </label>
          </div>
          <div className="ts-dialog-row">
            <label className="ts-dialog-field ts-dialog-field-grow">
              {t("clientLog.filter")}
              <input value={filter} onChange={(e) => setFilter(e.target.value)} />
            </label>
            <button onClick={handleMark}>{t("clientLog.mark")}</button>
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <div />
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
