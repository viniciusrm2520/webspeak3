import { useEffect, useState } from "react";
import { FEEDBACK_BUBBLE_STORAGE_KEY } from "../app/shared";
import { useT } from "../i18n";

const FEEDBACK_BUBBLE_MIN_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // don't nag more than every 3 days
const FEEDBACK_BUBBLE_INITIAL_DELAY_MS = 45_000;
const FEEDBACK_BUBBLE_AUTO_HIDE_MS = 14_000;

export function FeedbackFab({ onOpen, stacked }: { onOpen: () => void; stacked: boolean }) {
  const t = useT();
  const [bubbleVisible, setBubbleVisible] = useState(false);

  useEffect(() => {
    let lastShown = 0;
    try {
      lastShown = Number(localStorage.getItem(FEEDBACK_BUBBLE_STORAGE_KEY) || 0);
    } catch {
      // localStorage unavailable - just skip the nudge
      return;
    }
    if (Date.now() - lastShown < FEEDBACK_BUBBLE_MIN_INTERVAL_MS) return;

    const showTimer = window.setTimeout(() => {
      setBubbleVisible(true);
      try {
        localStorage.setItem(FEEDBACK_BUBBLE_STORAGE_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    }, FEEDBACK_BUBBLE_INITIAL_DELAY_MS);

    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!bubbleVisible) return;
    const hideTimer = window.setTimeout(() => setBubbleVisible(false), FEEDBACK_BUBBLE_AUTO_HIDE_MS);
    return () => window.clearTimeout(hideTimer);
  }, [bubbleVisible]);

  return (
    <div className={`ts-feedback-fab-wrap${stacked ? " ts-feedback-fab-wrap-stacked" : ""}`}>
      {bubbleVisible && (
        <div className="ts-feedback-bubble" onClick={onOpen}>
          <button
            type="button"
            className="ts-feedback-bubble-close"
            onClick={(e) => {
              e.stopPropagation();
              setBubbleVisible(false);
            }}
            title={t("feedback.dialog.cancel")}
          >
            ✕
          </button>
          {t("feedback.fab.nudge")}
        </div>
      )}
      <button
        type="button"
        className="ts-feedback-fab"
        onClick={() => {
          setBubbleVisible(false);
          onOpen();
        }}
        title={t("menu.extras.feedback")}
      >
        💬
      </button>
    </div>
  );
}
