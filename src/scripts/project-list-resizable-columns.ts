/**
 * Resizable columns for project dashboard table.
 * Uses linked resize: dragging adjusts the current column and its neighbor so total table width stays constant.
 * Persists column widths to localStorage (key: project-dashboard-column-widths).
 */

const STORAGE_KEY = "project-dashboard-column-widths";
const MIN_WIDTH = 48;
const MAX_WIDTH = 600;
const DEFAULT_WIDTHS: Record<string, number> = {
  delete: 48,
  edit: 48,
  address: 180,
  company: 120,
  status: 100,
  featured: 80,
  files: 200,
  assigned: 100,
  progress: 100,
  checklist: 80,
  elapsed: 90,
  timeSince: 110,
  dueDate: 120,
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

function initResizableColumns() {
  const table = document.getElementById("project-list");
  if (!table) return;

  const thead = table.querySelector("thead tr");
  if (!thead) return;

  const headers = Array.from(thead.querySelectorAll<HTMLElement>("th[data-col-id]"));
  if (headers.length === 0) return;

  let savedWidths = loadSavedWidths();

  function getWidth(colId: string, th: HTMLElement): number {
    return savedWidths[colId] ?? parseInt(th.style.width || "100", 10);
  }

  function applyWidthToTh(th: HTMLElement, widthPx: number): number {
    const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, widthPx));
    th.style.width = `${w}px`;
    th.style.minWidth = `${w}px`;
    th.style.maxWidth = `${w}px`;
    return w;
  }

  // Apply saved widths
  headers.forEach((th) => {
    const colId = th.getAttribute("data-col-id");
    if (colId) {
      const w = savedWidths[colId] ?? DEFAULT_WIDTHS[colId] ?? 100;
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
        let delta = moveEvent.clientX - startX;

        if (nextTh && nextColId) {
          const maxGrow = MAX_WIDTH - startW;
          const maxShrink = startW - MIN_WIDTH;
          const maxTakeFromNext = startNextW - MIN_WIDTH;
          const maxGiveToNext = MAX_WIDTH - startNextW;
          const clampMax =
            delta >= 0
              ? Math.min(delta, maxGrow, maxTakeFromNext)
              : Math.max(delta, -maxShrink, -maxGiveToNext);
          delta = clampMax;

          savedWidths[colId] = applyWidthToTh(th, startW + delta);
          savedWidths[nextColId] = applyWidthToTh(nextTh, startNextW - delta);
        } else {
          savedWidths[colId] = applyWidthToTh(th, startW + delta);
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

document.addEventListener("DOMContentLoaded", initResizableColumns);
