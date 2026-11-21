import { useContext, useState } from "react";
import { CHANNEL_PASSWORDS_KEY, DisplayPrefsContext, type SecuritySettings } from "../app/prefs";
import { useT } from "../i18n";
import {
  checkMasterPassword,
  isVaultUnlocked,
  removeMasterPassword,
  setMasterPassword,
} from "../vault";

/** Options -> Sicherheit -> "Master Passwort benutzen" / "ändern" (vault.ts). */
function MasterPasswordRow() {
  const t = useT();
  const [on, setOn] = useState(isVaultUnlocked);
  // What the inline form is doing: turning it on, changing it, or turning it off.
  const [mode, setMode] = useState<"enable" | "change" | "disable" | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const open = (m: typeof mode) => {
    setMode(m);
    setCurrent("");
    setNext("");
    setRepeat("");
    setError("");
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "enable" && !(await checkMasterPassword(current))) return setError(t("vault.wrong"));
    if (mode !== "disable" && next !== repeat) return setError(t("securitySettings.masterMismatch"));
    setBusy(true);
    if (mode === "disable") await removeMasterPassword();
    else await setMasterPassword(next);
    setBusy(false);
    setOn(isVaultUnlocked());
    setMode(null);
  };
  return (
    <>
      <div className="ts-security-row">
        <label className="ts-options-checkbox" title={t("securitySettings.masterHint")}>
          <input type="checkbox" checked={on || mode === "enable"} onChange={(e) => open(e.target.checked ? "enable" : "disable")} />
          {t("securitySettings.masterPassword")}
        </label>
        <button disabled={!on} onClick={() => open("change")}>
          {t("securitySettings.changeMasterPassword")}
        </button>
      </div>
      {mode && (
        <form className="ts-master-form" onSubmit={submit}>
          {mode !== "enable" && (
            <label className="ts-dialog-field">
              {t("securitySettings.masterCurrent")}
              <input type="password" autoFocus value={current} onChange={(e) => setCurrent(e.target.value)} />
            </label>
          )}
          {mode !== "disable" && (
            <>
              <label className="ts-dialog-field">
                {t("securitySettings.masterNew")}
                <input type="password" autoFocus={mode === "enable"} value={next} onChange={(e) => setNext(e.target.value)} />
              </label>
              <label className="ts-dialog-field">
                {t("securitySettings.masterRepeat")}
                <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
              </label>
            </>
          )}
          {mode === "enable" && <p className="ts-master-note">{t("securitySettings.masterNote")}</p>}
          {error && <p className="ts-vault-wrong">{error}</p>}
          <div className="ts-security-row">
            <button type="submit" disabled={busy || (mode === "disable" ? !current : !next)}>
              {t("options.ok")}
            </button>
            <button type="button" onClick={() => setMode(null)}>
              {t("options.cancel")}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export function SecurityPanel({ onOpenIdentities, onClearCache }: { onOpenIdentities: () => void; onClearCache: () => void }) {
  const t = useT();
  const { security, setSecurity } = useContext(DisplayPrefsContext);
  const set = (patch: Partial<SecuritySettings>) => setSecurity({ ...security, ...patch });
  return (
    <>
      <h3>{t("options.section.sicherheit")}</h3>
      <p className="ts-options-subtitle">{t("securitySettings.subtitle")}</p>
      <div className="ts-options-fields">
        <fieldset className="ts-options-fieldset">
          <legend>{t("securitySettings.passwords")}</legend>
          <div className="ts-security-row">
            <label className="ts-options-checkbox">
              <input
                type="checkbox"
                checked={security.saveChannelPasswords}
                onChange={(e) => set({ saveChannelPasswords: e.target.checked })}
              />
              {t("securitySettings.saveChannelPasswords")}
            </label>
            <button
              onClick={() => {
                localStorage.removeItem(CHANNEL_PASSWORDS_KEY);
                window.alert(t("securitySettings.channelPasswordsCleared"));
              }}
            >
              {t("securitySettings.clearChannelPasswords")}
            </button>
          </div>
          <MasterPasswordRow />
        </fieldset>
        <fieldset className="ts-options-fieldset">
          <legend>{t("securitySettings.cleanup")}</legend>
          <label className="ts-options-checkbox">
            <input
              type="checkbox"
              checked={security.clearCacheOnExit}
              onChange={(e) => set({ clearCacheOnExit: e.target.checked })}
            />
            {t("securitySettings.clearCacheOnExit")}
          </label>
          <label className="ts-options-checkbox">
            <input
              type="checkbox"
              checked={security.clearUrlsOnExit}
              onChange={(e) => set({ clearUrlsOnExit: e.target.checked })}
            />
            {t("securitySettings.clearUrlsOnExit")}
          </label>
          <div>
            <button onClick={onClearCache}>{t("securitySettings.clearCache")}</button>
          </div>
        </fieldset>
        <fieldset className="ts-options-fieldset">
          <legend>{t("securitySettings.identities")}</legend>
          <div>
            <button onClick={onOpenIdentities}>{t("securitySettings.manageIdentities")}</button>
          </div>
        </fieldset>
      </div>
    </>
  );
}
