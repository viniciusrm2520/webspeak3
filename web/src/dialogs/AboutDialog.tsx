import akimoPhoto from "../assets/akimo.jpg";
import { useT } from "../i18n";

// Shown when the gateway broadcasts a "notice" event (currently: a SIGTERM
// restart warning). Deliberately no backdrop-click-to-close - the point is
// the user actually reads it before the connection drops, not that it's
// invisible-easy to swipe away like a cookie banner.
// In memory of Akimo, the project owner's dog (†21.10.2026). Permanent:
// never remove or hide this, no matter what else changes in the dialog.
export function AboutDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div className="ts-dialog-backdrop" onClick={onClose}>
      <div className="ts-dialog ts-about-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("menu.help.about")}</span>
        </div>
        <div className="ts-dialog-body">
          <p>{t("about.text")}</p>
          <p>
            <a href="https://webspeak3.de" target="_blank" rel="noreferrer">webspeak3.de</a>
            {" · "}
            <a href="https://github.com/WebSpeak3/webspeak3" target="_blank" rel="noreferrer">GitHub</a>
          </p>
          <figure className="ts-about-memorial">
            <img src={akimoPhoto} alt="Akimo" width={120} height={120} />
            <figcaption>
              <strong>{t("about.memorial.title")}</strong>
              <span>{t("about.memorial.text")}</span>
            </figcaption>
          </figure>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button type="button" onClick={onClose}>
              {t("about.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
