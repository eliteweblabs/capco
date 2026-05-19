/**
 * Client-side column sorting for the project list table (#project-list).
 *
 * Each <th data-sortable="true"> exposes:
 *   - data-sort-key   : column id (e.g. "address")
 *   - data-sort-type  : "text" | "number" | "date" | "boolean"
 *   - data-sort-index : column index within the row (0-based)
 *
 * Each <td>/<th scope="row"> exposes:
 *   - data-sort-value : pre-computed comparable value
 *
 * Click behavior: clicking a new column starts ascending; clicking the active
 * column toggles asc <-> desc. There is no "return to none" state once a
 * column is active. The "none" state exists only on initial page load.
 * Active sort is mirrored to aria-sort, persisted to sessionStorage, and
 * triggers a re-pagination so the existing pager stays in sync.
 */

type SortDirection = "asc" | "desc";
type SortType = "text" | "number" | "date" | "boolean";

interface SortState {
  key: string;
  index: number;
  type: SortType;
  direction: SortDirection;
}

const STORAGE_KEY = "project-list-sort";
const TABLE_ID = "project-list";
const TBODY_ID = "project-list-tbody";

function getTable(): HTMLTableElement | null {
  return document.getElementById(TABLE_ID) as HTMLTableElement | null;
}

function getTbody(): HTMLTableSectionElement | null {
  return document.getElementById(TBODY_ID) as HTMLTableSectionElement | null;
}

function getSortableHeaders(): HTMLTableCellElement[] {
  const table = getTable();
  if (!table) return [];
  return Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th[data-sortable="true"]'));
}

/**
 * Lock column widths once on first paint so sort/pagination/row removal can't
 * make `table-auto` re-measure based on whichever rows are currently visible.
 * Snapshots the rendered <th> widths into a <colgroup> and switches the table
 * to `table-layout: fixed`.
 */
function freezeColumnWidths(): void {
  const table = getTable();
  if (!table) return;
  if (table.dataset.widthsFrozen === "1") return;
  const headerRow = table.tHead?.rows[0];
  if (!headerRow || headerRow.cells.length === 0) return;

  // Bail if the table isn't laid out yet (zero-width). Caller will retry.
  const totalWidth = headerRow.getBoundingClientRect().width;
  if (totalWidth <= 0) return;

  const colgroup = document.createElement("colgroup");
  colgroup.dataset.frozenColgroup = "1";
  for (const th of Array.from(headerRow.cells)) {
    const col = document.createElement("col");
    const w = th.getBoundingClientRect().width;
    if (w > 0) col.style.width = `${w}px`;
    colgroup.appendChild(col);
  }
  table.insertBefore(colgroup, table.firstChild);
  table.style.tableLayout = "fixed";
  table.dataset.widthsFrozen = "1";
}

function scheduleFreezeColumnWidths(): void {
  const table = getTable();
  if (!table) return;
  // Try synchronously first so we measure while ALL rows are still visible
  // (i.e. before pagination hides rows beyond page 1). If layout hasn't
  // happened yet (e.g. hidden tab → zero width), retry after the next paint.
  freezeColumnWidths();
  if (table.dataset.widthsFrozen === "1") return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      freezeColumnWidths();
      if (table.dataset.widthsFrozen !== "1") {
        setTimeout(freezeColumnWidths, 200);
      }
    });
  });
}

function readSortValue(row: HTMLTableRowElement, columnIndex: number): string {
  const cell = row.cells[columnIndex] as HTMLTableCellElement | undefined;
  if (!cell) return "";
  // dataset.sortValue is the canonical source; fall back to text content.
  const ds = cell.dataset.sortValue;
  if (ds !== undefined && ds !== null) return ds;
  return (cell.textContent || "").trim();
}

function compareValues(a: string, b: string, type: SortType): number {
  if (type === "text") {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  }
  // number, date, boolean — all numeric under the hood.
  const an = Number(a);
  const bn = Number(b);
  const aBad = !Number.isFinite(an);
  const bBad = !Number.isFinite(bn);
  if (aBad && bBad) return 0;
  if (aBad) return 1; // push NaN/empties to the bottom regardless of direction
  if (bBad) return -1;
  return an - bn;
}

function sortRows(
  rows: HTMLTableRowElement[],
  index: number,
  type: SortType,
  direction: SortDirection
): HTMLTableRowElement[] {
  const factor = direction === "asc" ? 1 : -1;
  // Stable sort with original index as tiebreaker.
  const decorated = rows.map((row, i) => ({ row, i, value: readSortValue(row, index) }));
  decorated.sort((a, b) => {
    const cmp = compareValues(a.value, b.value, type);
    if (cmp !== 0) return cmp * factor;
    return a.i - b.i;
  });
  return decorated.map((d) => d.row);
}

function captureOriginalOrder(tbody: HTMLTableSectionElement): void {
  const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr[data-project-id]"));
  rows.forEach((row, i) => {
    if (!row.dataset.originalIndex) {
      row.dataset.originalIndex = String(i);
    }
  });
}

function restoreOriginalOrder(tbody: HTMLTableSectionElement): void {
  const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr[data-project-id]"));
  const sorted = rows
    .map((row) => ({ row, i: Number(row.dataset.originalIndex ?? 0) }))
    .sort((a, b) => a.i - b.i);
  for (const { row } of sorted) tbody.appendChild(row);
}

function applySortToDom(state: SortState | null): void {
  const tbody = getTbody();
  if (!tbody) return;

  captureOriginalOrder(tbody);

  if (!state) {
    restoreOriginalOrder(tbody);
  } else {
    const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr[data-project-id]"));
    const sorted = sortRows(rows, state.index, state.type, state.direction);
    for (const row of sorted) tbody.appendChild(row);
  }

  updateHeaderIndicators(state);
  // Sort changed -> reset to page 1 and re-apply pagination.
  resetUrlPage();
  window.dispatchEvent(new CustomEvent("project-list:apply-pagination"));
}

function updateHeaderIndicators(state: SortState | null): void {
  for (const th of getSortableHeaders()) {
    const key = th.dataset.sortKey;
    if (state && key === state.key) {
      th.setAttribute("aria-sort", state.direction === "asc" ? "ascending" : "descending");
    } else {
      th.setAttribute("aria-sort", "none");
    }
  }
}

function resetUrlPage(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.has("page")) {
    url.searchParams.delete("page");
    window.history.replaceState({}, "", url.toString());
  }
}

function persistState(state: SortState | null): void {
  try {
    if (!state) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ key: state.key, direction: state.direction })
      );
    }
  } catch {
    /* sessionStorage unavailable; ignore */
  }
}

function readPersistedState(): { key: string; direction: "asc" | "desc" } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.key === "string" &&
      (parsed.direction === "asc" || parsed.direction === "desc")
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function resolveStateFromHeader(
  th: HTMLTableCellElement,
  direction: SortDirection
): SortState | null {
  const key = th.dataset.sortKey;
  const indexAttr = th.dataset.sortIndex;
  const typeAttr = (th.dataset.sortType || "text") as SortType;
  if (!key || indexAttr === undefined) return null;
  const index = Number(indexAttr);
  if (!Number.isFinite(index)) return null;
  const allowed: SortType[] = ["text", "number", "date", "boolean"];
  const type: SortType = allowed.includes(typeAttr) ? typeAttr : "text";
  return { key, index, type, direction };
}

let currentState: SortState | null = null;

/**
 * Standard sort cycle: clicking a fresh column starts ascending; clicking the
 * already-active column toggles asc <-> desc. There's no return-to-none state
 * once a column is active — switching to a different column moves the active
 * sort there. The "none" state only exists on initial page load (or until any
 * column is first clicked).
 */
function handleHeaderActivate(th: HTMLTableCellElement): void {
  const key = th.dataset.sortKey;
  if (!key) return;
  const isActive = currentState?.key === key;
  const next: SortDirection = isActive
    ? currentState!.direction === "asc"
      ? "desc"
      : "asc"
    : "asc";

  currentState = resolveStateFromHeader(th, next);
  applySortToDom(currentState);
  persistState(currentState);
}

function bindHeaders(): void {
  for (const th of getSortableHeaders()) {
    if (th.dataset.sortBound === "1") continue;
    th.dataset.sortBound = "1";
    const button = th.querySelector<HTMLButtonElement>("button.project-list-sort-btn");
    const trigger = button ?? th;
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      handleHeaderActivate(th);
    });
    if (!button) {
      // <th>-level keyboard fallback (when there's no inner button for some reason).
      th.setAttribute("tabindex", "0");
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleHeaderActivate(th);
        }
      });
    }
  }
}

function restorePersistedSort(): void {
  const persisted = readPersistedState();
  if (!persisted) return;
  const headers = getSortableHeaders();
  const th = headers.find((h) => h.dataset.sortKey === persisted.key);
  if (!th) return;
  const state = resolveStateFromHeader(th, persisted.direction);
  if (!state) return;
  currentState = state;
  applySortToDom(currentState);
}

declare global {
  interface Window {
    initProjectListSort?: () => void;
  }
}

export function initProjectListSort(): void {
  if (!getTable() || !getTbody()) return;
  bindHeaders();
  scheduleFreezeColumnWidths();
  restorePersistedSort();
  window.initProjectListSort = initProjectListSort;
}
