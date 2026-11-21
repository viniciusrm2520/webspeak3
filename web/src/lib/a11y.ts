import { useEffect, useRef } from "react";

export const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Props for a modal dialog's backdrop. Dismisses on Escape or a genuine
 *  backdrop click (not a text-selection drag that starts inside the dialog
 *  and releases over the backdrop). Moves focus in on open unless an
 *  autoFocus field already took it, keeps Tab inside, and hands focus back to
 *  whatever had it before on close. */
export function useBackdropDismiss(onDismiss: () => void) {
  const mouseDownOnBackdrop = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    if (el && !el.contains(document.activeElement)) el.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => previous?.focus?.();
  }, []);
  return {
    ref,
    role: "dialog",
    "aria-modal": true,
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onDismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
      mouseDownOnBackdrop.current = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onDismiss();
    },
  };
}

/** Callback ref for a dropdown menu: focus its first item when it opens.
 *  Module-level so React calls it once per mount, not on every render. */
export function focusFirstItem(el: HTMLElement | null) {
  el?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
}

/** onKeyDown for dropdown and context menus: Up/Down/Home/End move between
 *  items, and Escape puts focus back on the button that opened the menu
 *  before the window-level Escape listener closes it. */
export function handleMenuKeyDown(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key === "Escape") {
    e.currentTarget.parentElement?.querySelector<HTMLElement>(":scope > button[aria-expanded]")?.focus();
    return;
  }
  // Arrows belong to sliders, text fields and selects (the volume slider).
  if ((e.target as HTMLElement).matches("input:not([type=checkbox]), select, textarea")) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const i = items.indexOf(document.activeElement as HTMLElement);
  const next =
    e.key === "ArrowDown" ? items[(i + 1) % items.length]
    : e.key === "ArrowUp" ? items[(i - 1 + items.length) % items.length]
    : e.key === "Home" ? items[0]
    : e.key === "End" ? items[items.length - 1]
    : undefined;
  if (!next) return;
  e.preventDefault();
  next.focus();
}

/** onKeyDown for the tree panel (server row + channel tree): Up/Down/Home/End
 *  walk the visible rows, Left goes to the parent row and Right into an open
 *  channel. A channel row handles Left/Right itself first when it can
 *  collapse or expand, and marks the event as handled. */
export function handleTreeKeyDown(e: React.KeyboardEvent<HTMLElement>) {
  const row = e.target as HTMLElement;
  if (e.defaultPrevented || !row.classList.contains("ts-row")) return;
  const rows = [...e.currentTarget.querySelectorAll<HTMLElement>(".ts-row[tabindex]")];
  const i = rows.indexOf(row);
  const next =
    e.key === "ArrowDown" ? rows[i + 1]
    : e.key === "ArrowUp" ? rows[i - 1]
    : e.key === "Home" ? rows[0]
    : e.key === "End" ? rows[rows.length - 1]
    : e.key === "ArrowLeft" ? (row.closest("ul")?.closest("li")?.querySelector<HTMLElement>(":scope > .ts-row") ?? rows[0])
    : e.key === "ArrowRight" ? row.closest("li")?.querySelector<HTMLElement>(":scope > ul .ts-row")
    : undefined;
  if (next === undefined && !["ArrowDown", "ArrowUp", "ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  next?.focus();
}
