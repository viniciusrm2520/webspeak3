import type { ReactNode } from "react";
import { useT } from "./i18n";

export type ConnectionTabItem = {
  id: string;
  label: string;
  connected?: boolean;
  connecting?: boolean;
};

/** Up to two letters standing in for a server name on the rail. */
function railInitials(label: string): string {
  const words = label.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Server tab strip for multi-join: one tab per open connection. The "rail"
 *  variant (Standard theme on desktop) stacks them vertically as initials
 *  tiles with a button for a new connection at the bottom. */
export function ConnectionTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  variant = "strip",
  onNewConnection,
  header,
  footer,
}: {
  tabs: ConnectionTabItem[];
  activeTabId?: string | null;
  onSelectTab?: (id: string) => void;
  onCloseTab?: (id: string) => void;
  variant?: "strip" | "rail";
  onNewConnection?: () => void;
  /** Rail only: rendered above the tabs (the ☰ menu). */
  header?: ReactNode;
  /** Rail only: pinned to the bottom of the rail. */
  footer?: ReactNode;
}) {
  const t = useT();
  const rail = variant === "rail";
  const tabList = (
    <div
      className="gts-connection-tabs"
      role="tablist"
      aria-label={t("tabs.connections")}
      aria-orientation={rail ? "vertical" : undefined}
      hidden={rail && tabs.length === 0 ? true : undefined}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === (activeTabId ?? tabs[0]?.id);
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={rail ? tab.label : undefined}
            className={`gts-connection-tab${isActive ? " gts-connection-tab-active" : ""}${
              tab.connecting ? " gts-connection-tab-connecting" : ""
            }`}
            onClick={() => onSelectTab?.(tab.id)}
            tabIndex={0}
            aria-keyshortcuts={onCloseTab ? "Delete" : undefined}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              // The × below is mouse-only (a button can't sit inside a tab); Delete closes.
              if (e.key === "Delete" && onCloseTab) onCloseTab(tab.id);
              else if (e.key === "Enter" || e.key === " ")
                onSelectTab?.(tab.id);
              else return;
              e.preventDefault();
            }}
            title={tab.label}
          >
            <span className="gts-connection-tab-label" aria-hidden={rail || undefined}>
              {rail ? railInitials(tab.label) : tab.label}
            </span>
            {onCloseTab ? (
              <span
                className="gts-connection-tab-close"
                aria-hidden="true"
                title={t("tabs.disconnect")}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                ×
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
  if (!rail) return tabList;
  return (
    <nav className="gts-connection-rail" aria-label={t("tabs.connections")}>
      {header ? <div className="gts-connection-rail-header">{header}</div> : null}
      {tabList}
      {onNewConnection ? (
        <button
          className="gts-connection-rail-new"
          onClick={onNewConnection}
          title={t("menu.connections.connect")}
          aria-label={t("menu.connections.connect")}
        >
          +
        </button>
      ) : null}
      {footer ? <div className="gts-connection-rail-footer">{footer}</div> : null}
    </nav>
  );
}
