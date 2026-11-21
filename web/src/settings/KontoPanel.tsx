import { useEffect, useState, useSyncExternalStore } from "react";
import { QrCode } from "../components/ui";
import { useT } from "../i18n";
import {
  accountInfo,
  changeSyncPassword,
  createSyncAccount,
  DEFAULT_SYNC_SERVER,
  deleteSyncAccount,
  formatAccountNumber,
  getSyncStatus,
  loadSyncAccount,
  loginSyncAccount,
  logoutSyncAccount,
  normalizeAccountNumber,
  normalizePassword,
  recoveryText,
  resolveConflict,
  setSyncCategories,
  subscribeSyncStatus,
  SYNC_CATEGORIES,
  type SyncCategory,
  syncErrorKey,
  syncLink,
  syncNow,
} from "../sync";

/** Options -> Konto: Mullvad-style sync account (see sync.ts). */
export function KontoPanel() {
  const t = useT();
  const status = useSyncExternalStore(subscribeSyncStatus, getSyncStatus);
  const [account, setAccount] = useState(loadSyncAccount);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [withPassword, setWithPassword] = useState(true);
  // Empty = the default server, whose address isn't shown.
  const [serverInput, setServerInput] = useState("");
  const server = serverInput.trim() || DEFAULT_SYNC_SERVER;
  const [loginNumber, setLoginNumber] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Status changes (a push in the background) also move version/lastSync.
  useEffect(() => setAccount(loadSyncAccount()), [status]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError("");
    try {
      await fn();
      setAccount(loadSyncAccount());
    } catch (err) {
      setError(t(syncErrorKey(err)));
    } finally {
      setBusy(null);
    }
  };
  const copy = (what: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1500);
  };

  if (!account) {
    const number = normalizeAccountNumber(loginNumber);
    return (
      <>
        <h3>{t("options.section.konto")}</h3>
        <p className="ts-options-subtitle">{t("sync.subtitle")}</p>
        <p className="ts-options-hint">{t("sync.intro")}</p>
        <div className="ts-options-fields">
          <fieldset className="ts-options-fieldset">
            <legend>{t("sync.create.title")}</legend>
            <label className="ts-options-checkbox">
              <input type="checkbox" checked={withPassword} onChange={(e) => setWithPassword(e.target.checked)} />
              {t("sync.create.withPassword")}
            </label>
            <p className="ts-options-hint">{t("sync.create.withPasswordHint")}</p>
            <button
              disabled={busy !== null}
              onClick={() => void run("create", () => createSyncAccount(withPassword, server, SYNC_CATEGORIES))}
            >
              {busy === "create" ? t("sync.create.busy") : t("sync.create.button")}
            </button>
          </fieldset>
          <fieldset className="ts-options-fieldset">
            <legend>{t("sync.login.title")}</legend>
            <label className="ts-options-field">
              {t("sync.number")}
              <input
                value={loginNumber}
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                onChange={(e) => setLoginNumber(e.target.value)}
              />
            </label>
            <label className="ts-options-field">
              {t("sync.passwordOptional")}
              <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </label>
            <p className="ts-options-hint">{t("sync.login.hint")}</p>
            <button
              disabled={busy !== null || !number}
              onClick={() =>
                void run("login", async () => {
                  const password = loginPassword.trim() ? normalizePassword(loginPassword) : undefined;
                  if (!password && (await accountInfo(number!, server)).hasPassword) throw new Error("password_required");
                  await loginSyncAccount(number!, password, server, SYNC_CATEGORIES);
                  window.location.reload();
                })
              }
            >
              {t("sync.login.button")}
            </button>
          </fieldset>
          <label className="ts-options-field">
            {t("sync.server")}
            <input
              value={serverInput}
              placeholder={t("sync.serverDefault")}
              onChange={(e) => setServerInput(e.target.value)}
            />
          </label>
          <p className="ts-options-hint">{t("sync.serverHint")}</p>
          {error && <p className="ts-vault-wrong">{error}</p>}
        </div>
      </>
    );
  }

  const toggleCategory = (c: SyncCategory, on: boolean) =>
    void run("categories", () =>
      setSyncCategories(on ? [...account.categories, c] : account.categories.filter((x) => x !== c))
    );
  return (
    <>
      <h3>{t("options.section.konto")}</h3>
      <p className="ts-options-subtitle">{t("sync.subtitle")}</p>
      <div className="ts-options-columns">
        <div className="ts-options-fields">
          <fieldset className="ts-options-fieldset">
            <legend>{t("sync.account.title")}</legend>
            <label className="ts-options-field">
              {t("sync.number")}
              <span className="ts-sync-secret">
                <code>{formatAccountNumber(account.number)}</code>
                <button onClick={() => copy("number", account.number)}>
                  {copied === "number" ? t("sync.copied") : t("sync.copy")}
                </button>
              </span>
            </label>
            <label className="ts-options-field">
              {t("sync.password")}
              {account.password ? (
                <span className="ts-sync-secret">
                  <code>{showPassword ? account.password : "•••••-•••••-•••••-•••••"}</code>
                  <button onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? t("sync.hide") : t("sync.show")}
                  </button>
                  <button onClick={() => copy("password", account.password!)}>
                    {copied === "password" ? t("sync.copied") : t("sync.copy")}
                  </button>
                </span>
              ) : (
                <span className="ts-sync-secret">{t("sync.noPassword")}</span>
              )}
            </label>
            <p className="ts-options-hint ts-sync-warning">{t("sync.keepSafe")}</p>
            <div className="ts-sync-buttons">
              <button
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([recoveryText(account)], { type: "text/plain" }));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "webspeak3-account.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                {t("sync.recoveryFile")}
              </button>
              <button onClick={() => setShowQr((v) => !v)}>{showQr ? t("sync.qr.hide") : t("sync.qr.show")}</button>
              <button
                disabled={busy !== null}
                onClick={() => {
                  if (window.confirm(t(account.password ? "sync.password.removeConfirm" : "sync.password.addConfirm")))
                    void run("password", () => changeSyncPassword(!account.password));
                }}
              >
                {account.password ? t("sync.password.remove") : t("sync.password.add")}
              </button>
            </div>
            {showQr && (
              <div className="ts-sync-qr-box">
                <QrCode text={syncLink(account)} />
                <p className="ts-options-hint">{t("sync.qr.hint")}</p>
              </div>
            )}
          </fieldset>
        </div>
        <div className="ts-options-fields">
          <fieldset className="ts-options-fieldset">
            <legend>{t("sync.categories")}</legend>
            {SYNC_CATEGORIES.map((c) => (
              <label key={c} className="ts-options-checkbox">
                <input
                  type="checkbox"
                  checked={account.categories.includes(c)}
                  disabled={busy !== null}
                  onChange={(e) => toggleCategory(c, e.target.checked)}
                />
                {t(`sync.category.${c}`)}
              </label>
            ))}
            <p className="ts-options-hint">{t("sync.categoriesHint")}</p>
          </fieldset>
          <fieldset className="ts-options-fieldset">
            <legend>{t("sync.status")}</legend>
            <p>
              {status.state === "syncing"
                ? t("sync.status.syncing")
                : status.state === "error"
                  ? t(syncErrorKey(status.error))
                  : status.state === "conflict"
                    ? t("sync.conflict.text")
                    : account.lastSync
                      ? t("sync.status.last", { time: new Date(account.lastSync).toLocaleString() })
                      : t("sync.status.never")}
            </p>
            {status.state === "conflict" ? (
              <div className="ts-sync-buttons">
                <button disabled={busy !== null} onClick={() => void run("resolve", () => resolveConflict("local"))}>
                  {t("sync.conflict.local")}
                </button>
                <button
                  disabled={busy !== null}
                  onClick={() =>
                    void run("resolve", async () => {
                      await resolveConflict("server");
                      window.location.reload();
                    })
                  }
                >
                  {t("sync.conflict.server")}
                </button>
              </div>
            ) : (
              <button disabled={busy !== null || status.state === "syncing"} onClick={() => void run("sync", syncNow)}>
                {t("sync.syncNow")}
              </button>
            )}
            <p className="ts-options-hint">{t("sync.serverInfo", {
                server: account.server === DEFAULT_SYNC_SERVER ? t("sync.serverDefault") : account.server,
              })}</p>
          </fieldset>
          <div className="ts-sync-buttons">
            <button
              onClick={() => {
                if (!window.confirm(t("sync.logoutConfirm"))) return;
                logoutSyncAccount();
                setAccount(null);
              }}
            >
              {t("sync.logout")}
            </button>
            <button
              disabled={busy !== null}
              onClick={() => {
                if (window.confirm(t("sync.deleteConfirm"))) void run("delete", deleteSyncAccount);
              }}
            >
              {t("sync.delete")}
            </button>
          </div>
          {error && <p className="ts-vault-wrong">{error}</p>}
        </div>
      </div>
    </>
  );
}
