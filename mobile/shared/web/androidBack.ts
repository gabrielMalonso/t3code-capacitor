import { useEffect, useEffectEvent } from "react";

export const ANDROID_BACK_EVENT = "t3code:android-back";

// Registration order follows opening order, independent of subsequent React renders.
const panels = new Set<() => void>();

export function useAndroidBackPanel(open: boolean, close: () => void) {
  const closePanel = useEffectEvent(close);
  useEffect(() => {
    if (!open) return;
    const handler = () => closePanel();
    panels.add(handler);
    return () => {
      panels.delete(handler);
    };
  }, [open]);
}

export function closeAndroidBackPanel(): boolean {
  const close = Array.from(panels).at(-1);
  if (!close) return false;
  close();
  return true;
}

const overlaySelector = [
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[data-slot="popover-popup"]',
].join(",");

function overlayLayer(element: HTMLElement): number {
  let layer = 0;
  for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
    const zIndex = Number.parseInt(getComputedStyle(parent).zIndex, 10);
    if (Number.isFinite(zIndex)) layer = Math.max(layer, zIndex);
  }
  return layer;
}

/** Reuses each popup's Escape behavior, including cancellation and nested menus. */
export function dismissAndroidBackOverlay(): boolean {
  const overlays = Array.from(document.querySelectorAll<HTMLElement>(overlaySelector)).filter(
    (element) =>
      (element.hasAttribute("data-open") || element.hasAttribute("data-ending-style")) &&
      !element.closest('[inert], [aria-hidden="true"], [hidden]') &&
      element.getClientRects().length > 0,
  );
  const popup = overlays.sort((a, b) => overlayLayer(a) - overlayLayer(b)).at(-1);
  if (!popup) return false;

  // A closing popup still covers the UI. A second Back must not navigate through it.
  if (popup.hasAttribute("data-open")) {
    popup.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
  }
  // Even when dismissal is vetoed (for example, while saving), stay in the app.
  return true;
}
