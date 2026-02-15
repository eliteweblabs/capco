/**
 * Page size plugin: user preference for normal vs larger page elements (accessibility / mobile).
 * Persisted in localStorage; applied as html[data-page-size="normal"] | "large".
 * CSS in global.css: html[data-page-size="large"] { font-size: 112.5%; }
 */

export const PAGE_SIZE_KEY = "page-size";
export type PageSize = "normal" | "large";

export function getPageSize(): PageSize {
  if (typeof document === "undefined") return "normal";
  const value = document.documentElement.getAttribute("data-page-size");
  return (value === "large" ? "large" : "normal") as PageSize;
}

export function setPageSize(value: PageSize): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-page-size", value);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(PAGE_SIZE_KEY, value);
  }
}

/** Apply saved preference to the document (call as early as possible to avoid FOUC). */
export function initPageSize(): void {
  if (typeof document === "undefined" || typeof localStorage === "undefined") return;
  const value = (localStorage.getItem(PAGE_SIZE_KEY) || "normal") as PageSize;
  document.documentElement.setAttribute("data-page-size", value);
}

export function togglePageSize(): PageSize {
  const current = getPageSize();
  const next: PageSize = current === "large" ? "normal" : "large";
  setPageSize(next);
  return next;
}

export interface PageSizeToggleIds {
  labelId?: string;
  buttonId?: string;
  iconInId?: string;
  iconOutId?: string;
}

const DEFAULT_IDS: PageSizeToggleIds = {
  labelId: "page-size-toggle-label",
  buttonId: "page-size-toggle",
  iconInId: "page-size-icon-in",
  iconOutId: "page-size-icon-out",
};

/** Update toggle button label, icon, and aria-pressed to match current page size. */
export function updatePageSizeToggleUI(ids: PageSizeToggleIds = {}): void {
  const { labelId, buttonId, iconInId, iconOutId } = { ...DEFAULT_IDS, ...ids };
  const isLarge = getPageSize() === "large";
  const label = labelId ? document.getElementById(labelId) : null;
  const btn = buttonId ? document.getElementById(buttonId) : null;
  const iconIn = iconInId ? document.getElementById(iconInId) : null;
  const iconOut = iconOutId ? document.getElementById(iconOutId) : null;
  if (label) label.textContent = isLarge ? "Normal page elements" : "Larger page elements";
  if (btn) btn.setAttribute("aria-pressed", String(isLarge));
  if (iconIn) (iconIn as HTMLElement).style.display = isLarge ? "none" : "";
  if (iconOut) (iconOut as HTMLElement).style.display = isLarge ? "block" : "none";
}

/** Wire the toggle button: click handler + initial UI state. */
export function initPageSizeToggle(ids: PageSizeToggleIds = {}): void {
  const { buttonId } = { ...DEFAULT_IDS, ...ids };
  const btn = buttonId ? document.getElementById(buttonId) : null;
  if (!btn) return;
  updatePageSizeToggleUI(ids);
  btn.addEventListener("click", () => {
    togglePageSize();
    updatePageSizeToggleUI(ids);
  });
}
