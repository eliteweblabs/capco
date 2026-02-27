/**
 * Resizable columns for AccordionDataTable.
 * Uses linked resize: dragging adjusts the current column and its neighbor so total table width stays constant.
 * Widths are stored and applied as percentages (data-col-default-width = %).
 * Persists per table to localStorage (key: accordion-table-column-widths-{tableId}).
 */

const MIN_PCT = 5;
const MAX_PCT = 60;

function getStorageKey(tableId: string): string {
  return `accordion-table-column-widths-${tableId}`;
}

/** Load saved widths (percentages). */
function loadSavedWidths(tableId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(getStorageKey(tableId));
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      return { ...parsed };
    }
  } catch {
    /* ignore parse errors */
  }
  return {};
}

/** Parse width from th style (e.g. "25%" -> 25). */
function parseWidthPct(th: HTMLElement): number {
  const w = th.style.width || "";
  const num = parseFloat(w);
  return Number.isFinite(num) ? num : 0;
}

function saveWidths(tableId: string, widths: Record<string, number>) {
  try {
    localStorage.setItem(getStorageKey(tableId), JSON.stringify(widths));
  } catch {
    /* ignore */
  }
}

function initResizableColumns() {
  const tables = document.querySelectorAll<HTMLElement>("table[data-accordion-resizable]");
  tables.forEach((table) => {
    const tableId = table.getAttribute("data-table-id") || table.id || "";
    if (!tableId) return;

    const thead = table.querySelector("thead tr");
    if (!thead) return;

    // Remove existing resize handles so re-init (e.g. after clear cache) does not duplicate
    thead.querySelectorAll<HTMLElement>(".project-col-resize-handle").forEach((h) => h.remove());

    const headers = Array.from(thead.querySelectorAll<HTMLElement>("th[data-col-id]"));
    if (headers.length === 0) return;

    let savedWidths = loadSavedWidths(tableId);

    function getDefaultWidth(th: HTMLElement): number {
      const def = th.getAttribute("data-col-default-width");
      return def ? parseFloat(def) : 16;
    }

    function getWidth(colId: string, th: HTMLElement): number {
      const fromSaved = savedWidths[colId];
      if (fromSaved != null) return fromSaved;
      const fromStyle = parseWidthPct(th);
      return fromStyle > 0 ? fromStyle : getDefaultWidth(th);
    }

    function applyWidthToTh(th: HTMLElement, widthPct: number): number {
      const w = Math.max(MIN_PCT, Math.min(MAX_PCT, widthPct));
      th.style.width = `${w}%`;
      th.style.minWidth = `${w}%`;
      th.style.maxWidth = `${w}%`;
      return w;
    }

    const tableWidth = () => table.getBoundingClientRect().width || 1;

    headers.forEach((th) => {
      const colId = th.getAttribute("data-col-id");
      if (colId) {
        const w = savedWidths[colId] ?? getDefaultWidth(th);
        savedWidths[colId] = applyWidthToTh(th, w);
      }
    });

    // Give any header without data-col-id (e.g. Actions) a share of remaining width so it lays out inside the table
    const ACTIONS_MIN_PCT = 10;
    const allTh = Array.from(thead.querySelectorAll<HTMLElement>("th"));
    const totalDataPct = headers.reduce(
      (sum, th) => sum + (parseFloat(th.style.width || "0") || 0),
      0
    );
    const remainingPct = Math.max(ACTIONS_MIN_PCT, 100 - totalDataPct);
    allTh.forEach((th) => {
      if (!th.getAttribute("data-col-id")) {
        const w = Math.min(MAX_PCT, remainingPct);
        th.style.width = `${w}%`;
        th.style.minWidth = `${w}%`;
        th.style.maxWidth = `${w}%`;
      }
    });

    headers.forEach((th, index) => {
      const colId = th.getAttribute("data-col-id");
      if (!colId) return;

      const nextTh = headers[index + 1] as HTMLElement | undefined;
      const nextColId = nextTh?.getAttribute("data-col-id");

      const handle = document.createElement("div");
      handle.className =
        "project-col-resize-handle absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-primary-400/40 active:bg-primary-500/60";
      handle.setAttribute("aria-label", `Resize ${colId} column`);
      handle.title = "Drag to resize column";
      th.style.position = "relative";
      th.appendChild(handle);

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startW = getWidth(colId, th);
        const startNextW = nextTh && nextColId ? getWidth(nextColId, nextTh) : 0;

        const onMove = (moveEvent: MouseEvent) => {
          const deltaPx = moveEvent.clientX - startX;
          const tw = tableWidth();
          const deltaPct = (deltaPx / tw) * 100;

          if (nextTh && nextColId) {
            let delta = deltaPct;
            const maxGrow = MAX_PCT - startW;
            const maxShrink = startW - MIN_PCT;
            const maxTakeFromNext = startNextW - MIN_PCT;
            const maxGiveToNext = MAX_PCT - startNextW;
            const clampMax =
              delta >= 0
                ? Math.min(delta, maxGrow, maxTakeFromNext)
                : Math.max(delta, -maxShrink, -maxGiveToNext);
            delta = clampMax;

            const currFinal = startW + delta;
            const nextFinal = startNextW - delta;
            savedWidths[colId] = applyWidthToTh(th, currFinal);
            savedWidths[nextColId] = applyWidthToTh(nextTh, nextFinal);
          } else {
            const w = Math.max(MIN_PCT, Math.min(MAX_PCT, startW + deltaPct));
            savedWidths[colId] = applyWidthToTh(th, w);
          }
          saveWidths(tableId, { ...savedWidths });
        };

        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        };

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    });
  });
}

function clearCachedColumnWidths(tableId: string) {
  try {
    localStorage.removeItem(getStorageKey(tableId));
  } catch {
    /* ignore */
  }
  initResizableColumns();
}

declare global {
  interface Window {
    clearAccordionTableColumnWidths?: (tableId: string) => void;
  }
}
if (typeof window !== "undefined") {
  window.clearAccordionTableColumnWidths = clearCachedColumnWidths;
}

function run() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResizableColumns);
  } else {
    initResizableColumns();
  }
}
run();
document.addEventListener("astro:after-swap", initResizableColumns);

// Single delegated listener for "Reset column widths" buttons (avoids duplicate handlers on SPA nav)
document.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest?.("button.clear-accordion-column-widths");
  if (!btn) return;
  const tableId = btn.getAttribute("data-table-id");
  if (tableId) clearCachedColumnWidths(tableId);
});
