import { useState } from "react";
import type { CustomTheme } from "../app/prefs";
import { type AudioSettings, OPTIONS_SECTIONS } from "../app/shared";
import { useT } from "../i18n";
import { useBackdropDismiss } from "../lib/a11y";
import { AnwendungPanel } from "./AnwendungPanel";
import { AufnahmePanel } from "./AufnahmePanel";
import { ChatPanel } from "./ChatPanel";
import { DesignPanel } from "./DesignPanel";
import { DownloadsPanel } from "./DownloadsPanel";
import { HotkeysPanel } from "./HotkeysPanel";
import { KontoPanel } from "./KontoPanel";
import { MeldungenPanel } from "./MeldungenPanel";
import { NachrichtenPanel } from "./NachrichtenPanel";
import { SecurityPanel } from "./SecurityPanel";
import { SoundsPanel } from "./SoundsPanel";
import { WhisperPanel } from "./WhisperPanel";
import { WiedergabePanel } from "./WiedergabePanel";

export function OptionsDialog({
  section,
  onSectionChange,
  onClose,
  audio,
  designSelection,
  onDesignSelectionChange,
  customThemes,
  onSaveCustomTheme,
  onDeleteCustomTheme,
  idePixelFont,
  onIdePixelFontChange,
  showServerBanner,
  onShowServerBannerChange,
  chatImages,
  onChatImagesChange,
  onOpenWhisperLists,
  onOpenIdentities,
  onClearCache,
  onOpenFavorites,
  onApplyPackToFavorites,
}: {
  section: string;
  onSectionChange: (id: string) => void;
  onClose: () => void;
  audio: AudioSettings;
  designSelection: string;
  onDesignSelectionChange: (next: string) => void;
  customThemes: CustomTheme[];
  onSaveCustomTheme: (theme: CustomTheme) => void;
  onDeleteCustomTheme: (id: string) => void;
  idePixelFont: boolean;
  onIdePixelFontChange: (on: boolean) => void;
  showServerBanner: boolean;
  onShowServerBannerChange: (on: boolean) => void;
  chatImages: boolean;
  onChatImagesChange: (on: boolean) => void;
  onOpenWhisperLists: () => void;
  onOpenIdentities: () => void;
  onClearCache: () => void;
  onOpenFavorites: () => void;
  onApplyPackToFavorites: () => void;
}) {
  const t = useT();
  const active = OPTIONS_SECTIONS.find((s) => s.id === section) ?? OPTIONS_SECTIONS[0];
  const backdrop = useBackdropDismiss(onClose);
  // Mobile only (CSS): list of sections first, tapping one shows just that page.
  const [mobileDetail, setMobileDetail] = useState(false);
  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div
        className={`ts-dialog ts-options-dialog ts-options-dialog-nav${mobileDetail ? " ts-options-detail" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ts-dialog-titlebar">
          <button className="ts-options-back" onClick={() => setMobileDetail(false)}>
            <span aria-hidden="true">‹</span> {t(`options.section.${active.id}`)}
          </button>
          <span className="ts-options-title">{t("options.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-options-body">
          <div className="ts-options-sidebar">
            {OPTIONS_SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`ts-options-sidebar-item${s.id === active.id ? " ts-options-sidebar-item-active" : ""}`}
                onClick={() => {
                  onSectionChange(s.id);
                  setMobileDetail(true);
                }}
              >
                <span className="ts-options-sidebar-icon">{s.icon}</span>
                <span>{t(`options.section.${s.id}`)}</span>
              </button>
            ))}
          </div>
          <div className="ts-options-content">
            {active.id === "anwendung" ? (
              <AnwendungPanel
                showServerBanner={showServerBanner}
                onShowServerBannerChange={onShowServerBannerChange}
                chatImages={chatImages}
                onChatImagesChange={onChatImagesChange}
              />
            ) : active.id === "wiedergabe" ? (
              <WiedergabePanel audio={audio} />
            ) : active.id === "aufnahme" ? (
              <AufnahmePanel audio={audio} />
            ) : active.id === "hotkeys" ? (
              <HotkeysPanel audio={audio} />
            ) : active.id === "sounds" ? (
              <SoundsPanel />
            ) : active.id === "design" ? (
              <DesignPanel
                designSelection={designSelection}
                onSelectionChange={onDesignSelectionChange}
                customThemes={customThemes}
                onSaveCustomTheme={onSaveCustomTheme}
                onDeleteCustomTheme={onDeleteCustomTheme}
                idePixelFont={idePixelFont}
                onIdePixelFontChange={onIdePixelFontChange}
              />
            ) : active.id === "nachrichten" ? (
              <NachrichtenPanel />
            ) : active.id === "whispern" ? (
              <WhisperPanel onOpenWhisperLists={onOpenWhisperLists} />
            ) : active.id === "downloads" ? (
              <DownloadsPanel />
            ) : active.id === "chat" ? (
              <ChatPanel />
            ) : active.id === "sicherheit" ? (
              <SecurityPanel onOpenIdentities={onOpenIdentities} onClearCache={onClearCache} />
            ) : active.id === "konto" ? (
              <KontoPanel />
            ) : active.id === "meldungen" ? (
              <MeldungenPanel onOpenFavorites={onOpenFavorites} onApplyPackToFavorites={onApplyPackToFavorites} />
            ) : (
              <>
                <h3>{t(`options.section.${active.id}`)}</h3>
                <p className="ts-options-placeholder">{t("options.notImplemented")}</p>
              </>
            )}
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("options.ok")}</button>
            <button onClick={onClose}>{t("options.cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
