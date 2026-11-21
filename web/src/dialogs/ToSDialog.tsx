import { useT } from "../i18n";

// Mandatory (first visit, own-hosted instance): backdrop-click does nothing,
// only "Accept" closes it. Reopened from the menu afterwards: an ordinary
// dismissable dialog, since acceptance already happened.
export function ToSDialog({ mandatory, onAccept, onClose }: { mandatory: boolean; onAccept: () => void; onClose: () => void }) {
  const t = useT();
  return (
    <div className="ts-dialog-backdrop" onClick={mandatory ? undefined : onClose}>
      <div className="ts-dialog ts-tos-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("tos.title")}</span>
        </div>
        <div className="ts-dialog-body">
          <ol className="ts-tos-rules">
            <li>{t("tos.rule1")}</li>
            <li>{t("tos.rule2")}</li>
            <li>{t("tos.rule3")}</li>
            <li>
              {t("tos.rule4Pre")}
              <a href="https://webspeak3.de/datenschutz.html" target="_blank" rel="noreferrer">
                {t("tos.privacyLinkText")}
              </a>
              {t("tos.rule4Post")}
            </li>
            <li>
              {t("tos.rule5Pre")}
              <a href="https://webspeak3.de/impressum.html" target="_blank" rel="noreferrer">
                {t("tos.legalLinkText")}
              </a>
              {t("tos.rule5Post")}
            </li>
            <li>{t("tos.rule6")}</li>
          </ol>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            {mandatory ? (
              <button type="button" onClick={onAccept}>
                {t("tos.accept")}
              </button>
            ) : (
              <button type="button" onClick={onClose}>
                {t("tos.close")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
