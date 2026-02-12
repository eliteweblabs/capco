/**
 * Resizable columns for project dashboard table.
 * Persists column widths to localStorage (key: project-dashboard-column-widths).
 */

const STORAGE_KEY = "project-dashboard-column-widths";
const MIN_WIDTH = 48;
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
  } catch (_) {}
  return { ...DEFAULT_WIDTHS };
}

function saveWidths(widths: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch (_) {}
}

function initResizableColumns() {
  const table = document.getElementById("project-list");
  if (!table) return;

  const thead = table.querySelector("thead tr");
  if (!thead) return;

  const headers = Array.from(thead.querySelectorAll<HTMLElement>("th[data-col-id]"));
  if (headers.length === 0) return;

  let savedWidths = loadSavedWidths();

  function applyWidth(th: HTMLElement, colId: string, widthPx: number) {
    const w = Math.max(MIN_WIDTH, widthPx);
    th.style.width = `${w}px`;
    th.style.minWidth = `${w}px`;
    th.style.maxWidth = `${w}px`;
    savedWidths[colId] = w;
  }

  // Apply saved widths
  headers.forEach((th) => {
    const colId = th.getAttribute("data-col-id");
    if (colId) {
      const w = savedWidths[colId] ?? DEFAULT_WIDTHS[colId] ?? 100;
      applyWidth(th, colId, w);
    }
  });

  // Add resize handles and drag logic
  headers.forEach((th, index) => {
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
      startW = savedWidths[colId] ?? parseInt(th.style.width || "100", 10);

      const onMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        applyWidth(th, colId, startW + delta);
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
