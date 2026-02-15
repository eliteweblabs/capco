/**
 * Resizable columns for AccordionDataTable.
 * Uses same formatting as project-list-resizable-columns.
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

    function applyWidth(th: HTMLElement, colId: string, widthPx: number) {
      const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, widthPx));
      th.style.width = `${w}px`;
      th.style.minWidth = `${w}px`;
      th.style.maxWidth = `${w}px`;
      savedWidths[colId] = w;
    }

    headers.forEach((th) => {
      const colId = th.getAttribute("data-col-id");
      if (colId) {
        const w = savedWidths[colId] ?? getDefaultWidth(th);
        applyWidth(th, colId, w);
      }
    });

    headers.forEach((th) => {
      const colId = th.getAttribute("data-col-id");
      if (!colId) return;

      const handle = document.createElement("div");
      handle.className =
        "project-col-resize-handle absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-primary-400/40 active:bg-primary-500/60";
      handle.setAttribute("aria-label", `Resize ${colId} column`);
      handle.title = "Drag to resize column";
      th.style.position = "relative";
      th.appendChild(handle);

      let startX = 0;
      let startW = 0;

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        startX = e.clientX;
        startW = savedWidths[colId] ?? parseInt(th.style.width || String(getDefaultWidth(th)), 10);

        const onMove = (moveEvent: MouseEvent) => {
          const delta = moveEvent.clientX - startX;
          applyWidth(th, colId, startW + delta);
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
