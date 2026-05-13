/**
 * JSON-driven unified data table for /admin/design/data-table-playground.
 * Combines TanStack sorting with Accordion-style drag reorder, resizable columns,
 * expandable detail rows, select column, and actions column.
 */
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  type TableState,
} from "@tanstack/table-core";
import { getIcon } from "../lib/simple-icons";
import { initAccordionDataTableResizableColumns } from "./accordion-data-table-resizable-columns";

export interface PlaygroundColumnMeta {
  icon?: string;
  tooltip?: string;
  sticky?: "left" | "right";
  width?: number;
}

export interface PlaygroundColumnDef {
  id: string;
  accessorKey?: string;
  header: string;
  enableSorting?: boolean;
  meta?: PlaygroundColumnMeta;
}

export interface PlaygroundFeatures {
  expandable?: boolean;
  showDragHandle?: boolean;
  showSelectColumn?: boolean;
  showActionsColumn?: boolean;
  resizable?: boolean;
  /** When true, actions <th> uses sticky-right styling */
  actionsColumnSticky?: boolean;
  /** When true, expanded row shows JSON of the row */
  detailAsJson?: boolean;
}

export interface UnifiedPlaygroundConfig {
  id: string;
  title?: string;
  description?: string;
  columns: PlaygroundColumnDef[];
  data: Record<string, unknown>[];
  getRowIdKey?: string;
  getReorderIdKey?: string;
  emptyMessage?: string;
  features?: PlaygroundFeatures;
  /** window[name] — (order: { id: string; displayOrder: number }[]) => void | Promise<void> */
  reorderCallbackName?: string;
}

const CARD =
  "overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900 unified-playground-data-table";
const HEADER_BAR =
  "font-secondary flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700";
const TITLE = "font-secondary text-lg font-semibold text-gray-900 dark:text-white";
const DESC = "font-secondary mt-1 text-sm text-gray-500 dark:text-gray-400";
const WRAPPER = "font-secondary w-full text-center no-scrollbar overflow-x-auto";
const TABLE =
  "font-secondary w-full max-w-full table-fixed divide-gray-200 text-center text-sm dark:divide-gray-700";
const THEAD =
  "font-secondary sticky top-0 z-10 text-uppercase color-background select-none text-xs font-semibold uppercase tracking-wide";
const TH =
  "font-secondary color-border-primary border-r border-gray-200 px-4 py-3 font-semibold dark:border-gray-700 relative";
const TH_ACTIONS =
  "font-secondary color-background color-border-primary border-l border-r border-gray-200 px-4 py-3 font-semibold dark:border-gray-700 w-24 min-w-24";
const TBODY = "divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900";
const TD = "font-secondary px-4 py-2 text-sm text-gray-900 dark:text-white";
const TD_ACTIONS =
  "font-secondary whitespace-nowrap border-l border-gray-200 px-4 py-2 text-sm dark:border-gray-700 dark:text-white";
const TRIGGER_ROW =
  "select-none border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700";
const EMPTY_CELL = "font-secondary px-4 py-8 text-sm text-gray-500 dark:text-gray-400";
const DETAIL_TD = "bg-gray-50 p-0 dark:bg-gray-800/50";
const SLOT_MIN = "min-h-[120px]";
const DRAG_TH = "w-10 px-2 py-3 color-border-primary border-r border-gray-200 dark:border-gray-700";
const DRAG_TD =
  "w-10 px-2 py-3 align-middle text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-gray-700";
const SELECT_TH =
  "font-secondary color-background color-border-primary border-r border-gray-200 px-2 py-3 font-semibold dark:border-gray-700 w-12 min-w-[3rem]";
const SELECT_TD =
  "font-secondary border-r border-gray-200 px-2 py-2 text-sm dark:border-gray-700 w-12 min-w-[3rem]";
const STICKY_L =
  "sticky left-0 z-[1] bg-white dark:bg-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]";
const STICKY_R =
  "sticky right-0 z-[1] bg-white dark:bg-gray-900 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.3)]";
const CLEAR_BTN =
  "font-secondary shrink-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 clear-accordion-column-widths";

function renderSvgIcon(name: string, size = 16): string {
  try {
    return getIcon(name, { size, className: "inline-block" });
  } catch {
    return "";
  }
}

function stripHtmlToText(html: string): string {
  if (html == null || typeof html !== "string") return html != null ? String(html) : "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim() || html.replace(/<[^>]*>/g, "").trim();
}

function parseConfig(
  raw: string
): { ok: true; config: UnifiedPlaygroundConfig } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object")
      return { ok: false, error: "Root must be an object." };
    const c = parsed as Record<string, unknown>;
    const id = c.id;
    if (typeof id !== "string" || !id.trim())
      return { ok: false, error: '"id" must be a non-empty string.' };
    if (!Array.isArray(c.columns)) return { ok: false, error: '"columns" must be an array.' };
    if (!Array.isArray(c.data)) return { ok: false, error: '"data" must be an array.' };
    for (const col of c.columns as unknown[]) {
      if (!col || typeof col !== "object")
        return { ok: false, error: "Each column must be an object." };
      const co = col as Record<string, unknown>;
      if (typeof co.id !== "string" || typeof co.header !== "string")
        return { ok: false, error: 'Each column needs string "id" and "header".' };
    }
    return { ok: true, config: parsed as UnifiedPlaygroundConfig };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : String(e),
    };
  }
}

export function mountUnifiedDataTablePlayground(
  root: HTMLElement,
  jsonText: string,
  onParsed?: (config: UnifiedPlaygroundConfig | null, error: string | null) => void
): void {
  const parsed = parseConfig(jsonText);
  if (parsed.ok === false) {
    root.innerHTML = "";
    onParsed?.(null, parsed.error);
    return;
  }
  onParsed?.(parsed.config, null);
  renderUnifiedTable(root, parsed.config);
}

function renderUnifiedTable(root: HTMLElement, config: UnifiedPlaygroundConfig): void {
  const feat = config.features ?? {};
  const expandable = feat.expandable === true;
  const showDrag = feat.showDragHandle === true;
  const showSelect = feat.showSelectColumn === true;
  const showActions = feat.showActionsColumn === true;
  const resizable = feat.resizable === true;
  const actionsSticky = feat.actionsColumnSticky === true;
  const detailAsJson = feat.detailAsJson !== false;

  const id = config.id;
  let workingData: Record<string, unknown>[] = [...(config.data as Record<string, unknown>[])];
  const emptyMessage = config.emptyMessage ?? "No rows.";
  const getRowIdKey = config.getRowIdKey;
  const getReorderIdKey = config.getReorderIdKey ?? getRowIdKey;
  const reorderCallbackName = config.reorderCallbackName;

  const validColumns = config.columns.filter(
    (c) => c && typeof c.id === "string" && typeof c.header === "string"
  );
  if (validColumns.length === 0) {
    root.innerHTML = `<div class="${CARD}"><p class="${EMPTY_CELL}">${emptyMessage}</p></div>`;
    return;
  }

  const getRowId = getRowIdKey
    ? (row: Record<string, unknown>) => String(row[getRowIdKey] ?? "")
    : undefined;

  const expanded = new Set<string>();
  const selected: Set<string> = new Set();

  let tableState: Partial<TableState> = { sorting: [], columnPinning: { left: [], right: [] } };

  const columnDefs = validColumns.map((c) => ({
    id: c.id,
    accessorKey: c.accessorKey ?? c.id,
    header: c.header,
    enableSorting: c.enableSorting ?? true,
    meta: c.meta,
  }));

  const table = createTable({
    data: workingData,
    columns: columnDefs.map((c) => ({
      id: c.id,
      accessorKey: c.accessorKey,
      header: c.header,
      enableSorting: c.enableSorting,
      meta: c.meta,
      cell: ({ getValue }) => {
        const v = getValue();
        return v != null ? String(v) : "—";
      },
    })),
    getRowId: getRowId
      ? (row: { original: unknown }) => getRowId(row.original as Record<string, unknown>)
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: tableState,
    onStateChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState as TableState) : updater;
      tableState = { ...tableState, ...next };
      table.setOptions((prev) => ({ ...prev, state: tableState }));
      render();
    },
    renderFallbackValue: "—",
  });

  const colSpan =
    (showDrag ? 1 : 0) +
    (showSelect ? 1 : 0) +
    validColumns.length +
    (expandable ? 1 : 0) +
    (showActions ? 1 : 0);

  function render(): void {
    const card = document.createElement("div");
    card.className = CARD;

    if (config.title || config.description || resizable) {
      const bar = document.createElement("div");
      bar.className = HEADER_BAR;
      const text = document.createElement("div");
      text.className = "min-w-0 flex-1";
      if (config.title) {
        const h = document.createElement("h2");
        h.className = TITLE;
        h.textContent = config.title;
        text.appendChild(h);
      }
      if (config.description) {
        const p = document.createElement("p");
        p.className = DESC;
        p.textContent = config.description;
        text.appendChild(p);
      }
      bar.appendChild(text);
      if (resizable) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = CLEAR_BTN;
        btn.setAttribute("data-table-id", id);
        btn.title = "Reset column widths to defaults";
        btn.textContent = "Reset column widths";
        bar.appendChild(btn);
      }
      card.appendChild(bar);
    }

    const wrap = document.createElement("div");
    wrap.className = WRAPPER;

    const tableEl = document.createElement("table");
    tableEl.id = `${id}-table`;
    tableEl.className = TABLE;
    if (resizable) {
      tableEl.setAttribute("data-accordion-resizable", "true");
      tableEl.setAttribute("data-table-id", id);
    }

    const thead = document.createElement("thead");
    thead.className = THEAD;
    const headerRow = document.createElement("tr");

    if (showDrag) {
      const th = document.createElement("th");
      th.className = DRAG_TH;
      th.setAttribute("data-col-drag", "");
      th.setAttribute("aria-label", "Drag to reorder rows");
      th.innerHTML = renderSvgIcon("grip-dots", 20) || "⋮";
      headerRow.appendChild(th);
    }

    if (showSelect) {
      const th = document.createElement("th");
      th.className = `${SELECT_TH} ${STICKY_L}`;
      th.scope = "col";
      const allIds = table
        .getRowModel()
        .rows.map((r) => r.id)
        .filter(Boolean);
      const allSelected = allIds.length > 0 && allIds.every((rid) => selected.has(rid));
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className =
        "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700";
      cb.title = "Select all";
      cb.checked = allSelected;
      cb.addEventListener("click", (e) => e.stopPropagation());
      cb.addEventListener("change", () => {
        const ids = table
          .getRowModel()
          .rows.map((r) => r.id)
          .filter(Boolean);
        const every = ids.length > 0 && ids.every((rid) => selected.has(rid));
        if (every) ids.forEach((rid) => selected.delete(rid));
        else ids.forEach((rid) => selected.add(rid));
        render();
      });
      th.appendChild(cb);
      headerRow.appendChild(th);
    }

    table.getHeaderGroups().forEach((hg) => {
      hg.headers.forEach((header) => {
        const th = document.createElement("th");
        th.className = TH;
        const meta = (header.column.columnDef as { meta?: PlaygroundColumnMeta }).meta;
        if (meta?.sticky === "left") th.classList.add(...STICKY_L.split(" "));
        if (meta?.sticky === "right") th.classList.add(...STICKY_R.split(" "));
        const w = meta?.width ?? 16;
        th.style.width = `${w}%`;
        th.style.minWidth = `${w}%`;
        th.scope = "col";
        th.setAttribute("data-col-id", header.column.id);
        th.setAttribute("data-col-default-width", String(w));

        const sortable = header.column.getCanSort?.();
        if (sortable) {
          th.style.cursor = "pointer";
          th.title = meta?.tooltip || `Sort by ${header.column.columnDef.header}`;
          const handler = header.column.getToggleSortingHandler?.();
          if (handler) th.addEventListener("click", handler as (e: Event) => void);
        } else if (meta?.tooltip) {
          th.title = meta.tooltip;
        }

        const parts: string[] = [];
        if (meta?.icon) {
          parts.push(
            `<span class="mr-1 inline-block align-middle">${renderSvgIcon(meta.icon, 14)}</span>`
          );
        }
        parts.push(String(header.column.columnDef.header));
        const sortDir = header.column.getIsSorted?.();
        if (sortDir === "asc") parts.push('<span class="ml-1 text-primary-600">↑</span>');
        if (sortDir === "desc") parts.push('<span class="ml-1 text-primary-600">↓</span>');
        th.innerHTML = parts.join("");
        headerRow.appendChild(th);
      });
    });

    if (expandable) {
      const th = document.createElement("th");
      th.className = `${TH} w-8 px-2`;
      th.setAttribute("aria-label", "Expand");
      headerRow.appendChild(th);
    }

    if (showActions) {
      const th = document.createElement("th");
      th.className = actionsSticky ? `${TH_ACTIONS} ${STICKY_R}` : TH_ACTIONS;
      th.setAttribute("data-col-actions", "");
      th.scope = "col";
      th.textContent = "Actions";
      headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    tableEl.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.id = `${id}-tbody`;
    tbody.className = TBODY;

    const rowModel = table.getRowModel();
    if (rowModel.rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = Math.max(1, colSpan);
      td.className = EMPTY_CELL;
      td.textContent = emptyMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rowModel.rows.forEach((row) => {
        const rowId = row.id;
        const rawOriginal = row.original as Record<string, unknown>;
        const reorderId = getReorderIdKey ? String(rawOriginal[getReorderIdKey] ?? rowId) : rowId;

        const tr = document.createElement("tr");
        tr.className = TRIGGER_ROW + (expandable ? " cursor-pointer" : "");
        tr.dataset.rowId = rowId;
        tr.dataset.slot = rowId;
        if (reorderCallbackName && showDrag) tr.dataset.reorderId = reorderId;
        if (expandable) {
          tr.setAttribute("role", "button");
          tr.setAttribute("tabindex", "0");
          tr.setAttribute("aria-expanded", String(expanded.has(rowId)));
          tr.addEventListener("click", (e) => {
            if ((e.target as HTMLElement).closest("[data-skip-expand]")) return;
            if (expanded.has(rowId)) expanded.delete(rowId);
            else expanded.add(rowId);
            tr.setAttribute("aria-expanded", String(expanded.has(rowId)));
            render();
          });
          tr.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            if ((e.target as HTMLElement).closest("[data-skip-expand]")) return;
            e.preventDefault();
            if (expanded.has(rowId)) expanded.delete(rowId);
            else expanded.add(rowId);
            render();
          });
        }

        if (showDrag) {
          const td = document.createElement("td");
          td.className = `${DRAG_TD} accordion-drag-handle`;
          td.setAttribute("data-skip-expand", "");
          td.innerHTML = renderSvgIcon("grip-dots", 20) || "⋮";
          if (reorderCallbackName) {
            td.draggable = true;
            td.classList.add("cursor-grab");
          }
          tr.appendChild(td);
        }

        if (showSelect) {
          const td = document.createElement("td");
          td.className = `${SELECT_TD} ${STICKY_L}`;
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.className =
            "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700";
          cb.checked = selected.has(rowId);
          cb.setAttribute("aria-label", `Select row ${rowId}`);
          cb.addEventListener("click", (e) => e.stopPropagation());
          cb.addEventListener("change", () => {
            if (selected.has(rowId)) selected.delete(rowId);
            else selected.add(rowId);
            render();
          });
          td.appendChild(cb);
          tr.appendChild(td);
        }

        row.getVisibleCells().forEach((cell) => {
          const td = document.createElement("td");
          td.className = TD;
          const meta = (cell.column.columnDef as { meta?: PlaygroundColumnMeta }).meta;
          if (meta?.sticky === "left") td.classList.add(...STICKY_L.split(" "));
          if (meta?.sticky === "right") td.classList.add(...STICKY_R.split(" "));
          const val = cell.getValue();
          const text = val != null ? String(val) : "—";
          td.textContent = text === "—" ? "—" : stripHtmlToText(text);
          tr.appendChild(td);
        });

        if (expandable) {
          const td = document.createElement("td");
          td.className = "w-8 px-2";
          td.innerHTML = expanded.has(rowId)
            ? renderSvgIcon("chevron-up", 16) || "−"
            : renderSvgIcon("chevron-down", 16) || "+";
          tr.appendChild(td);
        }

        if (showActions) {
          const td = document.createElement("td");
          td.className = actionsSticky ? `${TD_ACTIONS} ${STICKY_R}` : TD_ACTIONS;
          td.setAttribute("data-skip-expand", "");
          const editBtn = document.createElement("button");
          editBtn.type = "button";
          editBtn.className =
            "mr-1 rounded px-2 py-1 text-xs text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700";
          editBtn.textContent = "Edit";
          editBtn.title = "Demo action (playground only)";
          const delBtn = document.createElement("button");
          delBtn.type = "button";
          delBtn.className =
            "rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20";
          delBtn.textContent = "Del";
          delBtn.title = "Demo action (playground only)";
          td.appendChild(editBtn);
          td.appendChild(delBtn);
          tr.appendChild(td);
        }

        tbody.appendChild(tr);

        if (expandable && expanded.has(rowId)) {
          const detailTr = document.createElement("tr");
          detailTr.className =
            "accordion-detail border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30";
          detailTr.dataset.slot = rowId;
          const td = document.createElement("td");
          td.colSpan = colSpan;
          td.className = DETAIL_TD;
          const inner = document.createElement("div");
          inner.className = `p-4 ${SLOT_MIN}`;
          if (detailAsJson) {
            const pre = document.createElement("pre");
            pre.className =
              "max-h-48 overflow-auto rounded border border-gray-200 bg-white p-3 text-left text-xs dark:border-gray-600 dark:bg-gray-900";
            pre.textContent = JSON.stringify(rawOriginal, null, 2);
            inner.appendChild(pre);
          } else {
            inner.textContent = "Detail slot (set features.detailAsJson true for JSON).";
          }
          td.appendChild(inner);
          detailTr.appendChild(td);
          tbody.appendChild(detailTr);
        }
      });
    }

    tableEl.appendChild(tbody);
    wrap.appendChild(tableEl);
    card.appendChild(wrap);

    root.replaceChildren(card);

    if (showDrag) {
      const reorderKey = getReorderIdKey || getRowIdKey;
      const reorderCb =
        reorderCallbackName && typeof window !== "undefined"
          ? ((window as unknown as Record<string, unknown>)[reorderCallbackName] as
              | ((order: { id: string | null; displayOrder: number }[]) => void | Promise<void>)
              | undefined)
          : undefined;
      setupReorderHandlers(
        tbody,
        typeof reorderCb === "function" ? reorderCb : undefined,
        reorderKey
          ? (orderedIds: string[]) => {
              const byId = new Map(workingData.map((row) => [String(row[reorderKey!] ?? ""), row]));
              const next: Record<string, unknown>[] = [];
              const seen = new Set<string>();
              for (const rid of orderedIds) {
                const r = byId.get(rid);
                if (r) {
                  next.push(r);
                  seen.add(rid);
                }
              }
              for (const row of workingData) {
                const rid = String(row[reorderKey] ?? "");
                if (rid && !seen.has(rid)) next.push(row);
              }
              workingData = next;
              table.setOptions((prev) => ({ ...prev, data: workingData }));
              render();
            }
          : undefined
      );
    }

    if (resizable) {
      requestAnimationFrame(() => {
        initAccordionDataTableResizableColumns();
      });
    }
  }

  render();
}

function setupReorderHandlers(
  tbodyEl: HTMLTableSectionElement,
  cb: ((order: { id: string | null; displayOrder: number }[]) => void | Promise<void>) | undefined,
  onOrderSynced?: (orderedIds: string[]) => void
): void {
  if (typeof cb !== "function" && !onOrderSynced) return;

  const getDataRows = () =>
    Array.from(
      tbodyEl.querySelectorAll<HTMLTableRowElement>("tr[data-reorder-id]:not(.accordion-detail)")
    );

  let draggedRow: HTMLTableRowElement | null = null;
  let draggedDetail: HTMLTableRowElement | null = null;

  getDataRows().forEach((row) => {
    const dragCell = row.querySelector<HTMLTableCellElement>("td.accordion-drag-handle");
    const next = row.nextElementSibling;
    const isDetailRow =
      next?.classList.contains("accordion-detail") || next?.hasAttribute("data-slot");
    const detailRow =
      isDetailRow && next?.classList.contains("accordion-detail")
        ? (next as HTMLTableRowElement)
        : null;

    if (dragCell) {
      dragCell.addEventListener("dragstart", (e) => {
        draggedRow = row;
        draggedDetail = detailRow;
        row.classList.add("opacity-50", "cursor-grabbing");
        dragCell.classList.add("cursor-grabbing");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", row.dataset.reorderId ?? "");
        }
      });
    }

    row.addEventListener("dragend", () => {
      if (draggedRow) {
        draggedRow.classList.remove("opacity-50", "cursor-grabbing");
        draggedRow.querySelector("td.accordion-drag-handle")?.classList.remove("cursor-grabbing");
      }
      getDataRows().forEach((r) => r.classList.remove("border-t-2", "border-primary-500"));
      draggedRow = null;
      draggedDetail = null;
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      if (draggedRow && row !== draggedRow) row.classList.add("border-t-2", "border-primary-500");
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("border-t-2", "border-primary-500");
    });

    row.addEventListener("drop", async (e) => {
      e.preventDefault();
      row.classList.remove("border-t-2", "border-primary-500");
      if (!draggedRow || draggedRow === row) return;
      const targetIdx = getDataRows().indexOf(row);
      if (targetIdx < 0) return;
      const draggedIdx = getDataRows().indexOf(draggedRow);
      if (draggedIdx === targetIdx) return;

      if (draggedDetail) tbodyEl.insertBefore(draggedDetail, row);
      tbodyEl.insertBefore(draggedRow, draggedDetail || row);

      const order = getDataRows()
        .map((r, i) => ({ id: r.dataset.reorderId ?? null, displayOrder: i }))
        .filter((o) => o.id);
      try {
        if (typeof cb === "function") await cb(order);
      } catch (err) {
        console.error("[UnifiedPlayground] Reorder failed:", err);
      }
      const newIds = getDataRows()
        .map((r) => r.dataset.reorderId)
        .filter((x): x is string => Boolean(x));
      onOrderSynced?.(newIds);
      draggedRow = null;
      draggedDetail = null;
    });
  });
}

export { parseConfig };
