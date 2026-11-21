import { useState } from "react";
import { FEEDBACK_URL } from "../app/config";
import { FEEDBACK_BUBBLE_STORAGE_KEY } from "../app/shared";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";

type FeedbackCategory = "bug" | "idea" | "other" | "report";

/** Best-effort "Chrome 141 · Windows" from the UA, prefilled into bug reports
 *  so users don't have to know it themselves - they can still correct it. */
function detectBrowserAndOs(): string {
  const ua = navigator.userAgent;
  const pick = (re: RegExp, name: string) => {
    const m = re.exec(ua);
    return m ? `${name} ${m[1]}` : null;
  };
  const browser =
    pick(/Edg\/(\d+)/, "Edge") ??
    pick(/OPR\/(\d+)/, "Opera") ??
    pick(/Firefox\/(\d+)/, "Firefox") ??
    pick(/Chrome\/(\d+)/, "Chrome") ??
    pick(/Version\/([\d.]+).*Safari/, "Safari") ??
    "?";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "?";
  return `${browser} · ${os}`;
}

export function FeedbackDialog({ onClose, audioState }: { onClose: () => void; audioState: string }) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  // Bug-only extras, appended to the message so neither the gateway nor the
  // private storage needs a schema change.
  const [environment, setEnvironment] = useState(detectBrowserAndOs);
  const [bugServer, setBugServer] = useState("");
  const [steps, setSteps] = useState("");
  const diagnostics = [
    `Page: ${window.location.host}`,
    `User agent: ${navigator.userAgent}`,
    `Language: ${navigator.language}`,
    `Audio: ${audioState}`,
    `Output device switching: ${"setSinkId" in HTMLMediaElement.prototype ? "yes" : "no"}`,
  ].join("\n");
  const [email, setEmail] = useState("");
  // Bugs always get filed as a GitHub issue - the checkbox is forced on and
  // locked while "bug" is selected (see the select's onChange below), so the
  // initial value has to agree with the initial category.
  const [publishAsIssue, setPublishAsIssue] = useState(true);
  // Honeypot: real users never see or fill this (hidden via CSS, no label,
  // excluded from tab order); bots that blindly fill every field do. Kept
  // in sync with the gateway's "website" field name.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [issueUrl, setIssueUrl] = useState<string | undefined>(undefined);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message:
            category === "bug"
              ? [
                  trimmed,
                  "",
                  "---",
                  `**Browser / OS:** ${environment.trim() || "?"}`,
                  ...(steps.trim() ? [`**Steps:** ${steps.trim()}`] : []),
                  "",
                  diagnostics,
                ].join("\n")
              : trimmed,
          email: email.trim() || undefined,
          server: category === "bug" ? bugServer.trim() || undefined : undefined,
          publishAsIssue,
          website,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { ok?: boolean; githubIssueUrl?: string };
      setIssueUrl(json.githubIssueUrl);
      setStatus("sent");
      // Someone who just sent feedback doesn't need the nudge bubble asking
      // them to do exactly that again for a while - push its cooldown out
      // from this moment rather than leaving it on whatever schedule it was
      // already on.
      try {
        localStorage.setItem(FEEDBACK_BUBBLE_STORAGE_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-feedback-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("feedback.dialog.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-dialog-body">
          {status === "sent" ? (
            <p className="ts-feedback-success">
              {issueUrl ? (
                <>
                  {t("feedback.dialog.successWithIssue")}{" "}
                  <a href={issueUrl} target="_blank" rel="noreferrer">
                    {issueUrl}
                  </a>
                </>
              ) : (
                t("feedback.dialog.success")
              )}
            </p>
          ) : (
            <>
              <p className="ts-feedback-intro">{t("feedback.dialog.intro")}</p>
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="ts-feedback-honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <label className="ts-dialog-field">
                {t("feedback.dialog.category")}
                <select
                  value={category}
                  onChange={(e) => {
                    const next = e.target.value as FeedbackCategory;
                    setCategory(next);
                    if (next === "bug") setPublishAsIssue(true);
                    // Reports (e.g. ToS violations) never become a public
                    // GitHub issue - they may name another user's server.
                    else if (next === "report") setPublishAsIssue(false);
                  }}
                >
                  <option value="bug">{t("feedback.dialog.category.bug")}</option>
                  <option value="idea">{t("feedback.dialog.category.idea")}</option>
                  <option value="report">{t("feedback.dialog.category.report")}</option>
                  <option value="other">{t("feedback.dialog.category.other")}</option>
                </select>
              </label>
              <label className="ts-dialog-field">
                {t("feedback.dialog.message")}
                <textarea
                  autoFocus
                  rows={5}
                  value={message}
                  placeholder={t("feedback.dialog.messagePlaceholder")}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              {category === "bug" && (
                <>
                  <label className="ts-dialog-field">
                    {t("feedback.dialog.bug.environment")}
                    <input type="text" value={environment} onChange={(e) => setEnvironment(e.target.value)} />
                  </label>
                  <label className="ts-dialog-field">
                    {t("feedback.dialog.bug.server")}
                    <input type="text" value={bugServer} onChange={(e) => setBugServer(e.target.value)} />
                  </label>
                  <label className="ts-dialog-field">
                    {t("feedback.dialog.bug.steps")}
                    <textarea
                      rows={3}
                      value={steps}
                      placeholder={t("feedback.dialog.bug.stepsPlaceholder")}
                      onChange={(e) => setSteps(e.target.value)}
                    />
                  </label>
                  <details className="ts-feedback-hint">
                    <summary>{t("feedback.dialog.bug.diagnostics")}</summary>
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{diagnostics}</pre>
                  </details>
                </>
              )}
              <label className="ts-dialog-field">
                {t("feedback.dialog.email")}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              {category === "report" ? (
                <p className="ts-feedback-hint">{t("feedback.dialog.reportHint")}</p>
              ) : (
                <>
                  <label className="ts-feedback-checkbox-field">
                    <input
                      type="checkbox"
                      checked={publishAsIssue}
                      disabled={category === "bug"}
                      onChange={(e) => setPublishAsIssue(e.target.checked)}
                    />
                    {t("feedback.dialog.publishAsIssue")}
                  </label>
                  <p className="ts-feedback-hint">
                    {t(category === "bug" ? "feedback.dialog.publishAsIssueHintBug" : "feedback.dialog.publishAsIssueHint")}
                  </p>
                </>
              )}
              {status === "error" && <p className="ts-feedback-error">{t("feedback.dialog.error")}</p>}
            </>
          )}
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            {status !== "sent" && (
              <button onClick={() => void handleSend()} disabled={!message.trim() || status === "sending"}>
                {status === "sending" ? t("feedback.dialog.sending") : t("feedback.dialog.send")}
              </button>
            )}
            <button onClick={onClose}>{status === "sent" ? t("dialog.close") : t("feedback.dialog.cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
