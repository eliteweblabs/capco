/**
 * Resizable columns for AccordionDataTable.
 * Uses linked resize: dragging adjusts the current column and its neighbor so total table width stays constant.
 * Prevents crushing columns (min width) and overflow (no net growth).
 * Persists per table to localStorage (key: accordion-table-column-widths-{tableId}).
 */

const MIN_WIDTH = 48;
const MAX_WIDTH = 600;

function getStorageKey(tableId: string): string {
  return `accordion-table-column-widths-${tableId}`;
}

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

    const headers = Array.from(thead.querySelectorAll<HTMLElement>("th[data-col-id]"));
    if (headers.length === 0) return;

    let savedWidths = loadSavedWidths(tableId);

    function getDefaultWidth(th: HTMLElement): number {
      const def = th.getAttribute("data-col-default-width");
      return def ? parseInt(def, 10) : 100;
    }

    function getWidth(colId: string, th: HTMLElement): number {
      return savedWidths[colId] ?? (parseInt(th.style.width || String(getDefaultWidth(th)), 10) || getDefaultWidth(th));
    }

    function applyWidthToTh(th: HTMLElement, widthPx: number) {
      const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, widthPx));
      th.style.width = `${w}px`;
      th.style.minWidth = `${w}px`;
      th.style.maxWidth = `${w}px`;
      return w;
    }

    headers.forEach((th) => {
      const colId = th.getAttribute("data-col-id");
      if (colId) {
        const w = savedWidths[colId] ?? getDefaultWidth(th);
        savedWidths[colId] = applyWidthToTh(th, w);
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
          let delta = moveEvent.clientX - startX;

          if (nextTh && nextColId) {
            // Linked resize: current grows by delta, neighbor shrinks. Clamp so neither goes out of bounds.
            const maxGrow = MAX_WIDTH - startW;
            const maxShrink = startW - MIN_WIDTH;
            const maxTakeFromNext = startNextW - MIN_WIDTH;
            const maxGiveToNext = MAX_WIDTH - startNextW;
            const clampMax = delta >= 0 ? Math.min(delta, maxGrow, maxTakeFromNext) : Math.max(delta, -maxShrink, -maxGiveToNext);
            delta = clampMax;

            const currFinal = startW + delta;
            const nextFinal = startNextW - delta;
            savedWidths[colId] = applyWidthToTh(th, currFinal);
            savedWidths[nextColId] = applyWidthToTh(nextTh, nextFinal);
          } else {
            const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startW + delta));
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

function run() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResizableColumns);
  } else {
    initResizableColumns();
  }
}
run();
document.addEventListener("astro:after-swap", initResizableColumns);
