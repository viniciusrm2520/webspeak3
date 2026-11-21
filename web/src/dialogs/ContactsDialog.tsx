import { useState } from "react";
import type { ClientInfo } from "../app/model";
import type { Contact, ContactCategory } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

export function ContactsDialog({
  contacts,
  onlineClients,
  onSave,
  onWhisper,
  onShow,
  onClose,
}: {
  contacts: Contact[];
  onlineClients: ClientInfo[];
  onSave: (contacts: Contact[]) => void;
  onWhisper: (clientId: number) => void;
  onShow: (clientId: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [draft, setDraft] = useState<Contact[]>(() => contacts.map((c) => ({ ...c })));
  const [selectedUid, setSelectedUid] = useState<string | null>(draft[0]?.uid ?? null);
  const [addClientId, setAddClientId] = useState("");

  const selected = draft.find((c) => c.uid === selectedUid) ?? null;
  const displayName = (c: Contact) => {
    const online = onlineClients.find((cl) => cl.uid === c.uid);
    return c.customName || online?.name || c.uid;
  };

  const updateSelected = (patch: Partial<Contact>) => {
    if (!selectedUid) return;
    setDraft((prev) => prev.map((c) => (c.uid === selectedUid ? { ...c, ...patch } : c)));
  };

  const save = (next: Contact[]) => {
    setDraft(next);
    onSave(next);
  };

  const handleAdd = () => {
    const client = onlineClients.find((c) => String(c.id) === addClientId);
    if (!client || !client.uid || draft.some((c) => c.uid === client.uid)) return;
    const contact: Contact = {
      uid: client.uid,
      customName: client.name,
      category: "acquaintance",
      phoneticName: "",
      ignored: false,
    };
    save([...draft, contact]);
    setSelectedUid(contact.uid);
    setAddClientId("");
  };

  const handleRemove = () => {
    if (!selectedUid) return;
    save(draft.filter((c) => c.uid !== selectedUid));
    setSelectedUid(null);
  };

  const addableClients = onlineClients.filter(
    (c) => c.uid && !draft.some((contact) => contact.uid === c.uid)
  );
  const selectedOnlineClient = selected ? onlineClients.find((c) => c.uid === selected.uid) : undefined;

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-contacts-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("contacts.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-contacts-body">
          <div className="ts-contacts-list-col">
            <div className="ts-dialog-row">
              <select value={addClientId} onChange={(e) => setAddClientId(e.target.value)}>
                <option value="">{t("contacts.addOnlineClient")}</option>
                {addableClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button disabled={!addClientId} onClick={handleAdd}>
                {t("contacts.add")}
              </button>
            </div>
            <ul className="ts-contacts-list">
              {draft.map((c) => (
                <li
                  key={c.uid}
                  className={`ts-contacts-list-item ts-contacts-category-${c.category}${c.uid === selectedUid ? " ts-contacts-list-item-selected" : ""}`}
                  onClick={() => setSelectedUid(c.uid)}
                >
                  <button type="button" className="ts-plain-button" aria-current={c.uid === selectedUid}>
                    {onlineClients.some((cl) => cl.uid === c.uid) && <span className="ts-contacts-online-dot" />}
                    {displayName(c)}
                    {c.ignored && " 🚫"}
                  </button>
                </li>
              ))}
              {draft.length === 0 && <li className="ts-contacts-list-empty">{t("contacts.empty")}</li>}
            </ul>
          </div>
          <div className="ts-contacts-fields-col">
            <label className="ts-dialog-field">
              {t("contacts.customName")}
              <input
                disabled={!selected}
                value={selected?.customName ?? ""}
                onChange={(e) => updateSelected({ customName: e.target.value })}
              />
            </label>
            <div className="ts-contacts-category-group">
              {(["acquaintance", "blocked", "friend"] as ContactCategory[]).map((cat) => (
                <label key={cat} className="ts-dialog-checkbox">
                  <input
                    type="radio"
                    name="contact-category"
                    disabled={!selected}
                    checked={selected?.category === cat}
                    onChange={() => updateSelected({ category: cat })}
                  />
                  {t(`contacts.category.${cat}`)}
                </label>
              ))}
            </div>
            <label className="ts-dialog-field">
              {t("contacts.phoneticName")}
              <input
                disabled={!selected}
                value={selected?.phoneticName ?? ""}
                onChange={(e) => updateSelected({ phoneticName: e.target.value })}
              />
            </label>
            <label className="ts-dialog-field">
              {t("contacts.whisperSetting")}
              <select
                disabled={!selected}
                value={selected?.whisper ?? ""}
                onChange={(e) => updateSelected({ whisper: (e.target.value || undefined) as Contact["whisper"] })}
              >
                <option value="">{t("contacts.whisperSetting.default")}</option>
                <option value="allow">{t("contacts.whisperSetting.allow")}</option>
                <option value="block">{t("contacts.whisperSetting.block")}</option>
              </select>
            </label>
            <div className="ts-contacts-actions">
              <button
                disabled={!selectedOnlineClient}
                onClick={() => selectedOnlineClient && onShow(selectedOnlineClient.id)}
              >
                {t("contacts.show")}
              </button>
              <button disabled={!selected} onClick={() => updateSelected({ ignored: !selected?.ignored })}>
                {selected?.ignored ? t("contacts.unignore") : t("contacts.ignore")}
              </button>
              <button
                disabled={!selectedOnlineClient}
                onClick={() => selectedOnlineClient && onWhisper(selectedOnlineClient.id)}
              >
                {t("contacts.whisper")}
              </button>
            </div>
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <button onClick={handleRemove} disabled={!selected}>
            {t("contacts.remove")}
          </button>
          <div className="ts-dialog-buttons-right">
            <button disabled title={t("clientContext.notSupported")}>
              {t("contacts.preferences")}
            </button>
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              {t("dialog.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
