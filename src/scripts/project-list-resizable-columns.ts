/**
 * Resizable columns for project dashboard table.
 * Uses linked resize: dragging adjusts the current column and its neighbor so total table width stays constant.
 * Widths are stored and applied as percentages (data-col-default-width / config width = %).
 * Persists column widths to localStorage (key: project-dashboard-column-widths).
 */

const STORAGE_KEY = "project-dashboard-column-widths";
const MIN_PCT = 5;
const MAX_PCT = 50;
const DEFAULT_WIDTHS: Record<string, number> = {
  delete: 3,
  edit: 3,
  address: 16,
  company: 9,
  status: 7,
  featured: 5,
  files: 14,
  assigned: 7,
  progress: 7,
  checklist: 5,
  elapsed: 5,
  timeSince: 7,
  dueDate: 11,
};

function loadSavedWidths(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      return { ...DEFAULT_WIDTHS, ...parsed };
    }
  } catch {
    /* ignore parse errors */
  }
  return { ...DEFAULT_WIDTHS };
}

function saveWidths(widths: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch {
    /* ignore */
  }
}

function parseWidthPct(th: HTMLElement): number {
  const w = th.style.width || "";
  const num = parseFloat(w);
  return Number.isFinite(num) ? num : 0;
}

function initResizableColumns() {
  const table = document.getElementById("project-list");
  if (!table) return;

  const headerRow =
    Array.from(table.querySelectorAll<HTMLElement>("thead tr")).find((tr) =>
      tr.querySelector("th[data-col-id]")
    ) ?? table.querySelector("thead tr");
  if (!headerRow) return;

  // Remove existing resize handles so re-init (e.g. after clear cache) does not duplicate
  headerRow.querySelectorAll<HTMLElement>(".project-col-resize-handle").forEach((h) => h.remove());

  const headers = Array.from(headerRow.querySelectorAll<HTMLElement>("th[data-col-id]"));
  if (headers.length === 0) return;

  let savedWidths = loadSavedWidths();

  function getWidth(colId: string, th: HTMLElement): number {
    const fromSaved = savedWidths[colId];
    if (fromSaved != null) return fromSaved;
    const fromAttr = th.getAttribute("data-col-default-width");
    const def = fromAttr ? parseFloat(fromAttr) : 10;
    const fromStyle = parseWidthPct(th);
    return fromStyle > 0 ? fromStyle : def;
  }

  function applyWidthToTh(th: HTMLElement, widthPct: number): number {
    const w = Math.max(MIN_PCT, Math.min(MAX_PCT, widthPct));
    th.style.width = `${w}%`;
    th.style.minWidth = `${w}%`;
    th.style.maxWidth = `${w}%`;
    return w;
  }

  const tableWidth = () => table.getBoundingClientRect().width || 1;

  // Apply saved widths
  headers.forEach((th) => {
    const colId = th.getAttribute("data-col-id");
    if (colId) {
      const w = savedWidths[colId] ?? (parseFloat(th.getAttribute("data-col-default-width") || "0") || (DEFAULT_WIDTHS[colId] ?? 10));
      savedWidths[colId] = applyWidthToTh(th, w);
    }
  });

  // Add resize handles and drag logic (linked resize with neighbor)
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

          savedWidths[colId] = applyWidthToTh(th, startW + delta);
          savedWidths[nextColId] = applyWidthToTh(nextTh, startNextW - delta);
        } else {
          const w = Math.max(MIN_PCT, Math.min(MAX_PCT, startW + deltaPct));
          savedWidths[colId] = applyWidthToTh(th, w);
        }
        saveWidths({ ...savedWidths });
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
}

function clearCachedColumnWidths() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  initResizableColumns();
}

declare global {
  interface Window {
    clearProjectListColumnWidths?: () => void;
  }
}
if (typeof window !== "undefined") {
  window.clearProjectListColumnWidths = clearCachedColumnWidths;
}

document.addEventListener("DOMContentLoaded", initResizableColumns);
