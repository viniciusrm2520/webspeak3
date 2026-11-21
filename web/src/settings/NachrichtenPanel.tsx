import { useState } from "react";
import {
  loadAwayPresets,
  loadDisconnectMessage,
  type MessagePreset,
  saveAwayPresets,
  saveDisconnectMessage,
} from "../app/prefs";
import { useT } from "../i18n";

export function NachrichtenPanel() {
  const t = useT();
  const [presets, setPresets] = useState<MessagePreset[]>(() => loadAwayPresets());
  const [disconnectMessage, setDisconnectMessageState] = useState(() => loadDisconnectMessage());
  const [newName, setNewName] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const handleDisconnectMessageChange = (v: string) => {
    setDisconnectMessageState(v);
    saveDisconnectMessage(v);
  };

  const handleAdd = () => {
    const name = newName.trim();
    const message = newMessage.trim();
    if (!name || !message) return;
    const next = [...presets, { name, message }];
    setPresets(next);
    saveAwayPresets(next);
    setNewName("");
    setNewMessage("");
  };

  const handleDelete = (index: number) => {
    const next = presets.filter((_, i) => i !== index);
    setPresets(next);
    saveAwayPresets(next);
  };

  return (
    <>
      <h3>{t("nachrichten.title")}</h3>
      <p className="ts-options-subtitle">{t("nachrichten.subtitle")}</p>
      <label className="ts-dialog-field">
        {t("nachrichten.disconnectMessage")}
        <input
          value={disconnectMessage}
          onChange={(e) => handleDisconnectMessageChange(e.target.value)}
          placeholder={t("nachrichten.disconnectMessagePlaceholder")}
        />
      </label>
      <h4>{t("nachrichten.presetsTitle")}</h4>
      <table className="ts-options-sounds-table">
        <thead>
          <tr>
            <th>{t("nachrichten.type")}</th>
            <th>{t("nachrichten.templateName")}</th>
            <th>{t("nachrichten.message")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {presets.map((preset, index) => (
            <tr key={`${preset.name}-${index}`}>
              <td>{t("nachrichten.type.away")}</td>
              <td>{preset.name}</td>
              <td>{preset.message}</td>
              <td>
                <button onClick={() => handleDelete(index)}>{t("nachrichten.delete")}</button>
              </td>
            </tr>
          ))}
          <tr>
            <td>{t("nachrichten.type.away")}</td>
            <td>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("nachrichten.templateName")}
              />
            </td>
            <td>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("nachrichten.message")}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </td>
            <td>
              <button onClick={handleAdd} disabled={!newName.trim() || !newMessage.trim()}>
                {t("nachrichten.add")}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
