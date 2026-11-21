import { useEffect, useRef, useState } from "react";
import type { Identity } from "../app/prefs";
import { useT } from "../i18n";
import { identityUid } from "../identityUid";
import { useBackdropDismiss } from "../lib/a11y";

/** Mirrors the native client's "Identitäten" window: a list on the left plus
 *  a detail panel on the right (Name/Nickname/Phonetischer Nickname/
 *  Eindeutige ID), rather than the old flat list-with-inline-rename layout.
 *  The native window also has a myTeamSpeak-synced identity list and a
 *  "Sicherheitsstufe erhöhen" button - both deliberately out of scope here:
 *  the former needs a whole separate cloud-account system this self-hosted
 *  client doesn't have, and the latter (tsclientlib's proof-of-work identity
 *  level increase) already runs automatically during connect whenever a
 *  server demands a higher level, so there's nothing a manual button would
 *  add beyond letting you pre-compute it before connecting. */
export function IdentitiesDialog({
  identities,
  activeId,
  ownUid,
  onActivate,
  onAdd,
  onRename,
  onNicknameChange,
  onPhoneticChange,
  onDelete,
  onExport,
  onImport,
  onClose,
}: {
  identities: Identity[];
  activeId: string | null;
  /** The connected own client's unique ID, if currently connected with the
   *  active identity - shown as that identity's "Eindeutige ID". */
  ownUid: string | null;
  onActivate: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onNicknameChange: (id: string, value: string) => void;
  onPhoneticChange: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onImport: (file: File) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState(activeId ?? identities[0]?.id ?? null);
  const selected = identities.find((i) => i.id === selectedId) ?? identities[0] ?? null;
  const [computedUid, setComputedUid] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    setComputedUid(null);
    if (selected?.blob) void identityUid(selected.blob).then((uid) => current && setComputedUid(uid));
    return () => {
      current = false;
    };
  }, [selected?.blob]);

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-identities-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("identities.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body ts-identities-body">
          <div>
            <div className="ts-identities-list-label">{t("identities.listLabel")}</div>
            <ul className="ts-identities-list">
              {identities.map((identity) => (
                <li key={identity.id}>
                  <button
                    className={`ts-link-button ts-identities-list-item${
                      identity.id === selectedId ? " ts-perms-editor-selected" : ""
                    }${identity.id === activeId ? " ts-identities-list-item-default" : ""}`}
                    onClick={() => setSelectedId(identity.id)}
                    title={identity.id === activeId ? t("identities.isDefault") : undefined}
                  >
                    {identity.id === activeId ? "★ " : ""}
                    {identity.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="ts-identities-detail">
            {selected && (
              <>
                <label className="ts-dialog-field">
                  {t("identities.name")}
                  <input value={selected.name} onChange={(e) => onRename(selected.id, e.target.value)} />
                </label>
                <label className="ts-dialog-field">
                  {t("connect.nickname")}
                  <input
                    value={selected.nickname}
                    onChange={(e) => onNicknameChange(selected.id, e.target.value)}
                  />
                </label>
                <label className="ts-dialog-field">
                  {t("identities.phoneticNickname")}
                  <input
                    value={selected.phoneticName}
                    onChange={(e) => onPhoneticChange(selected.id, e.target.value)}
                  />
                </label>
                <label className="ts-dialog-field">
                  {t("identities.uniqueId")}
                  <input
                    readOnly
                    value={computedUid || (selected.id === activeId && ownUid) || t("identities.unknown")}
                    className="ts-identities-readonly ts-identities-uid"
                  />
                </label>
                <div className="ts-identities-status">
                  {selected.blob ? t("identities.generated") : t("identities.pending")}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <div>
            <button onClick={onAdd}>{t("identities.add")}</button>
            <button onClick={() => importInputRef.current?.click()}>{t("identities.import")}</button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,.ini,application/json,text/plain"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onImport(file);
              }}
            />
            {selected && (
              <>
                <button disabled={!selected.blob} onClick={() => onExport(selected.id)}>
                  {t("identities.export")}
                </button>
                <button onClick={() => onActivate(selected.id)} disabled={selected.id === activeId}>
                  {t("identities.setDefault")}
                </button>
                <button
                  disabled={identities.length <= 1}
                  onClick={() => {
                    const wasActive = selected.id === activeId;
                    const idx = identities.findIndex((i) => i.id === selected.id);
                    onDelete(selected.id);
                    if (selected.id === selectedId) {
                      const remaining = identities.filter((i) => i.id !== selected.id);
                      setSelectedId((wasActive ? remaining[0] : remaining[Math.max(0, idx - 1)])?.id ?? null);
                    }
                  }}
                >
                  {t("identities.delete")}
                </button>
              </>
            )}
          </div>
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
