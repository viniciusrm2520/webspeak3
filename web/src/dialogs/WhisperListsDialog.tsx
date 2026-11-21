import { useState } from "react";
import type { WhisperList } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function WhisperListsDialog({
  lists,
  hasCurrentSelection,
  onSave,
  onActivate,
  onDelete,
  onClose,
}: {
  lists: WhisperList[];
  hasCurrentSelection: boolean;
  onSave: (name: string) => void;
  onActivate: (list: WhisperList) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [nameDraft, setNameDraft] = useState("");

  const handleSave = () => {
    const name = nameDraft.trim();
    if (!name || !hasCurrentSelection) return;
    onSave(name);
    setNameDraft("");
  };

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-whisper-lists-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("whisperLists.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          <div className="ts-dialog-row">
            <input
              placeholder={t("whisperLists.namePlaceholder")}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
            />
            <button disabled={!nameDraft.trim() || !hasCurrentSelection} onClick={handleSave}>
              {t("whisperLists.saveCurrent")}
            </button>
          </div>
          <ul className="ts-whisper-lists-list">
            {lists.map((list) => (
              <li key={list.id} className="ts-whisper-lists-item">
                <div className="ts-whisper-lists-item-info">
                  <span className="ts-whisper-lists-item-name">{list.name}</span>
                  <span className="ts-whisper-lists-item-detail">
                    {t("whisperLists.itemDetail", {
                      channels: String(list.channelNames.length),
                      clients: String(list.clientNames.length),
                    })}
                  </span>
                </div>
                <div className="ts-whisper-lists-item-actions">
                  <button onClick={() => onActivate(list)}>{t("whisperLists.activate")}</button>
                  <button onClick={() => onDelete(list.id)}>{t("whisperLists.delete")}</button>
                </div>
              </li>
            ))}
            {lists.length === 0 && <li className="ts-whisper-lists-empty">{t("whisperLists.empty")}</li>}
          </ul>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
