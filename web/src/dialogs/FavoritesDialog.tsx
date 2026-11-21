import { useRef, useState } from "react";
import { type Favorite, randomId } from "../app/prefs";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";
import { SoundPackOptions } from "../settings/MeldungenPanel";

export function FavoritesDialog({
  favorites,
  prefillNew,
  onSave,
  onClose,
}: {
  favorites: Favorite[];
  prefillNew?: Omit<Favorite, "id" | "bookmarkName">;
  onSave: (favorites: Favorite[]) => void;
  onClose: () => void;
}) {
  const t = useT();
  const pendingNewRef = useRef<Favorite | null>(
    prefillNew
      ? {
          id: randomId(),
          bookmarkName: prefillNew.host || t("favorites.newFavoriteName"),
          ...prefillNew,
          showServerQueryClients: prefillNew.showServerQueryClients === true,
        }
      : null
  );
  const [draft, setDraft] = useState<Favorite[]>(() =>
    pendingNewRef.current ? [...favorites, pendingNewRef.current] : favorites.map((f) => ({ ...f }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    pendingNewRef.current ? pendingNewRef.current.id : (favorites[0]?.id ?? null)
  );

  const selected = draft.find((f) => f.id === selectedId) ?? null;

  const updateSelected = (patch: Partial<Favorite>) => {
    if (!selectedId) return;
    setDraft((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  };

  const handleNewFavorite = () => {
    const nf: Favorite = {
      id: randomId(),
      bookmarkName: t("favorites.newFavoriteName"),
      nickname: "",
      host: "",
      serverPassword: "",
      defaultChannel: "",
      defaultChannelPassword: "",
      showServerQueryClients: false,
    };
    setDraft((prev) => [...prev, nf]);
    setSelectedId(nf.id);
  };

  const handleRemove = () => {
    if (!selectedId) return;
    setDraft((prev) => prev.filter((f) => f.id !== selectedId));
    setSelectedId(null);
  };

  const backdrop = useBackdropDismiss(onClose);
  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-favorites-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("favorites.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-favorites-body">
          <div className="ts-favorites-list-col">
            <div className="ts-favorites-list-group-title">{t("favorites.synced")}</div>
            <div className="ts-favorites-list-empty">{t("favorites.notLoggedIn")}</div>
            <div className="ts-favorites-list-group-title">{t("favorites.local")}</div>
            <ul className="ts-favorites-list">
              {draft.map((f) => (
                <li
                  key={f.id}
                  className={`ts-favorites-list-item${f.id === selectedId ? " ts-favorites-list-item-selected" : ""}`}
                  onClick={() => setSelectedId(f.id)}
                >
                  <button type="button" className="ts-plain-button" aria-current={f.id === selectedId}>
                    {f.bookmarkName || t("favorites.unnamed")}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="ts-favorites-fields-col">
            <label className="ts-dialog-field">
              {t("favorites.bookmarkName")}
              <input
                disabled={!selected}
                value={selected?.bookmarkName ?? ""}
                onChange={(e) => updateSelected({ bookmarkName: e.target.value })}
              />
            </label>
            <label className="ts-dialog-field">
              {t("connect.nickname")}
              <input
                disabled={!selected}
                value={selected?.nickname ?? ""}
                onChange={(e) => updateSelected({ nickname: e.target.value })}
              />
            </label>
            <label className="ts-dialog-field">
              {t("connect.phoneticNickname")}
              <input disabled title={t("clientContext.notSupported")} />
            </label>
            <label className="ts-dialog-field">
              {t("connect.serverAddress")}
              <input
                disabled={!selected}
                value={selected?.host ?? ""}
                onChange={(e) => updateSelected({ host: e.target.value })}
              />
            </label>
            <label className="ts-dialog-field">
              {t("connect.serverPassword")}
              <input
                type="password"
                disabled={!selected}
                value={selected?.serverPassword ?? ""}
                onChange={(e) => updateSelected({ serverPassword: e.target.value })}
              />
            </label>
            <label className="ts-dialog-field">
              {t("connect.defaultChannel")}
              <input
                disabled={!selected}
                value={selected?.defaultChannel ?? ""}
                onChange={(e) => updateSelected({ defaultChannel: e.target.value })}
              />
            </label>
            <label className="ts-dialog-field">
              {t("connect.channelPassword")}
              <input
                type="password"
                disabled={!selected}
                value={selected?.defaultChannelPassword ?? ""}
                onChange={(e) => updateSelected({ defaultChannelPassword: e.target.value })}
              />
            </label>
          </div>

          <div className="ts-favorites-profile-col">
            <label className="ts-dialog-field">
              {t("connect.identity")}
              <select disabled defaultValue="Standard">
                <option>Standard</option>
              </select>
            </label>
            <label className="ts-dialog-field">
              {t("connect.recordingProfile")}
              <select disabled defaultValue="Standard">
                <option>Standard</option>
              </select>
            </label>
            <label className="ts-dialog-field">
              {t("connect.playbackProfile")}
              <select disabled defaultValue="Standard">
                <option>Standard</option>
              </select>
            </label>
            <label className="ts-dialog-field">
              {t("connect.hotkeyProfile")}
              <select disabled defaultValue="Standard">
                <option>Standard</option>
              </select>
            </label>
            <label className="ts-dialog-field">
              {t("connect.soundPack")}
              <select
                disabled={!selected}
                value={selected?.soundPack ?? ""}
                onChange={(e) => updateSelected({ soundPack: e.target.value || undefined })}
              >
                <option value="">Standard</option>
                <SoundPackOptions />
              </select>
            </label>
            <label className="ts-dialog-checkbox">
              <input
                type="checkbox"
                disabled={!selected}
                checked={selected?.showServerQueryClients ?? false}
                onChange={(e) => updateSelected({ showServerQueryClients: e.target.checked })}
              />
              {t("favorites.showServerQueryClients")}
            </label>
            <label className="ts-dialog-checkbox">
              <input type="checkbox" disabled title={t("clientContext.notSupported")} />
              {t("favorites.connectOnStartup")}
            </label>
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button onClick={handleNewFavorite}>{t("favorites.new")}</button>
            <button disabled title="Not supported in the web client">
              {t("favorites.newFolder")}
            </button>
            <button onClick={handleRemove} disabled={!selected}>
              {t("favorites.remove")}
            </button>
          </div>
          <div className="ts-dialog-buttons-right">
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              {t("favorites.ok")}
            </button>
            <button onClick={onClose}>{t("favorites.cancel")}</button>
            <button onClick={() => onSave(draft)}>{t("favorites.apply")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
