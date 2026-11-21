import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useT } from "../i18n";

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const VERSION_CHECK_INTERVAL_MS = 30 * 60 * 1000;
/** Floor between two version.json fetches, so tab-switching doesn't poll. */
const VERSION_CHECK_MIN_GAP_MS = 5 * 60 * 1000;
const UPDATE_TOAST_SNOOZE_MS = 30 * 60 * 1000;

/** What the server actually has right now. Deliberately routed around the
 *  service worker: version.json is not in Workbox's globPatterns, so it is
 *  never precached, and the cache-busting query plus `no-store` keeps any
 *  intermediate cache out of the answer too. */
async function fetchServerBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const id = (data as { buildId?: unknown }).buildId;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

/** Throw away the worker and everything it cached, then reload from the
 *  network. Only for a client that is provably stale but isn't being handed
 *  an update — see `stranded` below. */
async function resetServiceWorkerAndReload() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  } catch {
    // Reloading without the cleanup is still better than staying stale.
  }
  window.location.reload();
}

export function UpdatePrompt() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  /** An update is waiting to be applied, whether or not the toast is showing. */
  const pending = useRef(false);
  /** Set when the server is on a different build than we are *and* no new
   *  service worker turned up to deliver it. Then the worker is wedged and a
   *  plain reload would just serve the same cached shell again, so the button
   *  has to clear it out instead. */
  const stranded = useRef(false);
  const snoozeTimer = useRef<number | null>(null);
  const lastVersionCheck = useRef(0);

  const announce = (isStranded: boolean) => {
    if (isStranded) stranded.current = true;
    pending.current = true;
    // While snoozed the timer owns the toast; don't pop it back up early.
    if (snoozeTimer.current === null) setVisible(true);
  };

  const snooze = () => {
    setVisible(false);
    // Never a permanent dismissal: a client that misses the prompt for good is
    // exactly how clients ended up stranded on a bundle the server no longer
    // even serves.
    snoozeTimer.current = window.setTimeout(() => {
      snoozeTimer.current = null;
      if (pending.current) setVisible(true);
    }, UPDATE_TOAST_SNOOZE_MS);
  };

  useRegisterSW({
    onNeedReload() {
      // autoUpdate: the new worker has already taken over, we only choose the
      // moment to reload — mid-call is the user's decision, not ours.
      announce(false);
    },
    onRegisteredSW(_url, registration) {
      // Poll for a new service worker in the background — otherwise an app
      // left open for hours/days only checks for updates on next full load.
      if (!registration) return;
      window.setInterval(() => {
        registration.update().catch(() => {});
      }, SW_UPDATE_CHECK_INTERVAL_MS);
    },
  });

  useEffect(() => {
    const checkVersion = async () => {
      const now = Date.now();
      if (now - lastVersionCheck.current < VERSION_CHECK_MIN_GAP_MS) return;
      lastVersionCheck.current = now;

      const serverBuildId = await fetchServerBuildId();
      if (!serverBuildId || serverBuildId === __BUILD_ID__) return;

      // We are demonstrably behind. Give the service worker the first shot at
      // fixing it; only if it produces no new worker at all is it wedged.
      let registration: ServiceWorkerRegistration | undefined;
      try {
        registration = await navigator.serviceWorker?.getRegistration();
        await registration?.update();
      } catch {
        // An update check that throws is itself a sign of a wedged worker.
      }
      announce(!registration?.installing && !registration?.waiting);
    };

    void checkVersion();
    const interval = window.setInterval(() => void checkVersion(), VERSION_CHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkVersion();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="ts-update-toast">
      <span>{t("pwa.updateAvailable")}</span>
      <button
        type="button"
        onClick={() => {
          if (stranded.current) void resetServiceWorkerAndReload();
          else window.location.reload();
        }}
      >
        {t("pwa.reload")}
      </button>
      <button type="button" className="ts-update-toast-dismiss" onClick={snooze}>
        ✕
      </button>
    </div>
  );
}
