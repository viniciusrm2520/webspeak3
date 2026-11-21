import { DONATE_URL } from "../app/config";
import { useT } from "../i18n";

export function DonateFab() {
  const t = useT();
  if (!DONATE_URL) return null;
  return (
    <a
      className="ts-donate-fab"
      href={DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={t("donate.title")}
    >
      <span className="ts-donate-fab-icon" aria-hidden="true">☕</span>
      {t("donate.label")}
    </a>
  );
}
