/**
 * TanStack Data Table init — renders table with sorting, icon/tooltip in headers, optional expand/drag.
 * Does NOT replace AccordionDataTable or ProjectList; use alongside.
 */
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/table-core";
import { getIcon } from "../lib/simple-icons";

export interface TanStackColumnMeta {
  icon?: string;
  tooltip?: string;
  sticky?: "left" | "right";
  width?: number;
}

export interface TanStackColumnConfig<T = unknown> {
  id: string;
  accessorKey?: keyof T & string;
  header: string;
  enableSorting?: boolean;
  meta?: TanStackColumnMeta;
}

export interface TanStackTableConfig<T = unknown> {
  id: string;
  columns: TanStackColumnConfig<T>[];
  data: T[];
  /** Key path for row id (e.g. "id") — used when getRowId fn cannot be serialized */
  getRowIdKey?: keyof T & string;
  emptyMessage?: string;
  expandable?: boolean;
  showDragHandle?: boolean;
}

const DEFAULT_CLASSES = {
  tableClasses: "w-full max-w-full table-fixed divide-gray-200 text-center text-sm dark:divide-gray-700",
  theadClasses: "sticky top-0 z-10 text-uppercase color-background select-none text-xs font-semibold uppercase tracking-wide",
  thClasses: "color-border-primary border-r border-gray-200 px-4 py-3 font-semibold dark:border-gray-700",
  tbodyClasses: "divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900",
  tdClasses: "px-4 py-2 text-sm text-gray-900 dark:text-white",
  emptyCellClasses: "px-4 py-8 text-sm text-gray-500 dark:text-gray-400",
  triggerRowClasses: "select-none border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700",
  detailTdClasses: "bg-gray-50 p-0 dark:bg-gray-800/50",
  slotMinHeightClasses: "min-h-[120px]",
  dragThClasses: "w-10 px-2 py-3 color-border-primary border-r",
  dragTdClasses: "w-10 px-2 py-3 align-middle text-gray-400 dark:text-gray-500",
  stickyLeft: "sticky left-0 z-[1] bg-white dark:bg-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]",
  stickyRight: "sticky right-0 z-[1] bg-white dark:bg-gray-900 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.3)]",
};

function renderIcon(name: string, size = 16): string {
  try {
    return getIcon(name, { size, className: "inline-block" });
  } catch {
    return "";
  }
}

export function initTanStackDataTable<T extends Record<string, unknown>>(
  container: HTMLElement,
  config: TanStackTableConfig<T>
) {
  const {
    id,
    columns: configColumns,
    data,
    getRowIdKey,
    emptyMessage = "No rows.",
    expandable = false,
    showDragHandle = false,
  } = config;

  const getRowId = getRowIdKey
    ? (row: T) => String((row as Record<string, unknown>)[getRowIdKey as string] ?? "")
    : undefined;

  const expanded = new Set<string>();

  let tableState: { sorting: { id: string; desc: boolean }[] } = { sorting: [] };

  const columnDefs = configColumns.map((c) => ({
    id: c.id,
    accessorKey: c.accessorKey,
    header: c.header,
    enableSorting: c.enableSorting ?? true,
    meta: c.meta,
  }));

  const table = createTable({
    data,
    columns: columnDefs.map((c) => ({
      id: c.id,
      accessorKey: c.accessorKey as string | undefined,
      header: c.header,
      enableSorting: c.enableSorting,
      meta: c.meta,
      cell: ({ getValue }) => {
        const v = getValue();
        return v != null ? String(v) : "—";
      },
    })),
    getRowId: getRowId ? (row) => getRowId(row as T) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: tableState,
    onStateChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState) : updater;
      tableState = next;
      table.setOptions((prev) => ({ ...prev, state: tableState }));
      render();
    },
    renderFallbackValue: "—",
  });

  function render() {
    const tableEl = document.createElement("table");
    tableEl.id = `${id}-table`;
    tableEl.className = DEFAULT_CLASSES.tableClasses;
    tableEl.setAttribute("data-tanstack-table-id", id);

    const thead = document.createElement("thead");
    thead.className = DEFAULT_CLASSES.theadClasses;
    const headerRow = document.createElement("tr");
    if (showDragHandle) {
      const th = document.createElement("th");
      th.className = DEFAULT_CLASSES.dragThClasses;
      th.setAttribute("aria-label", "Drag");
      th.innerHTML = renderIcon("grip-dots", 20) || "⋮⋮";
      headerRow.appendChild(th);
    }
    table.getHeaderGroups().forEach((hg) => {
      hg.headers.forEach((header) => {
        const th = document.createElement("th");
        th.className = DEFAULT_CLASSES.thClasses;
        const meta = (header.column.columnDef as { meta?: TanStackColumnMeta }).meta;
        if (meta?.sticky === "left") th.classList.add(...DEFAULT_CLASSES.stickyLeft.split(" "));
        if (meta?.sticky === "right") th.classList.add(...DEFAULT_CLASSES.stickyRight.split(" "));
        if (meta?.width) th.style.width = `${meta.width}%`;
        th.scope = "col";
        th.setAttribute("data-col-id", header.column.id);
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
          parts.push(`<span class="inline-block align-middle mr-1">${renderIcon(meta.icon, 14)}</span>`);
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
      th.className = "w-8 px-2";
      th.setAttribute("aria-label", "Expand");
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    tableEl.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.id = `${id}-tbody`;
    tbody.className = DEFAULT_CLASSES.tbodyClasses;

    const rowModel = table.getRowModel();
    if (rowModel.rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = configColumns.length + (showDragHandle ? 1 : 0) + (expandable ? 1 : 0);
      td.className = DEFAULT_CLASSES.emptyCellClasses;
      td.textContent = emptyMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rowModel.rows.forEach((row) => {
        const rowId = row.id;
        const tr = document.createElement("tr");
        tr.className = DEFAULT_CLASSES.triggerRowClasses;
        tr.dataset.rowId = rowId;
        tr.dataset.slot = rowId;
        if (expandable) {
          tr.style.cursor = "pointer";
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
        }
        if (showDragHandle) {
          const td = document.createElement("td");
          td.className = DEFAULT_CLASSES.dragTdClasses;
          td.innerHTML = renderIcon("grip-dots", 20) || "⋮⋮";
          td.setAttribute("data-skip-expand", "");
          tr.appendChild(td);
        }
        row.getVisibleCells().forEach((cell) => {
          const td = document.createElement("td");
          td.className = DEFAULT_CLASSES.tdClasses;
          const meta = (cell.column.columnDef as { meta?: TanStackColumnMeta }).meta;
          if (meta?.sticky === "left") td.classList.add(...DEFAULT_CLASSES.stickyLeft.split(" "));
          if (meta?.sticky === "right") td.classList.add(...DEFAULT_CLASSES.stickyRight.split(" "));
          const val = cell.getValue();
          td.textContent = val != null ? String(val) : "—";
          tr.appendChild(td);
        });
        if (expandable) {
          const td = document.createElement("td");
          td.className = "w-8 px-2";
          td.innerHTML = expanded.has(rowId)
            ? renderIcon("chevron-up", 16) || "−"
            : renderIcon("chevron-down", 16) || "+";
          tr.appendChild(td);
        }
        tbody.appendChild(tr);

        if (expandable && expanded.has(rowId)) {
          const detailTr = document.createElement("tr");
          detailTr.className = "accordion-detail border-b border-gray-200 dark:border-gray-700";
          detailTr.dataset.slot = rowId;
          const td = document.createElement("td");
          td.colSpan = configColumns.length + (showDragHandle ? 1 : 0) + 1;
          td.className = DEFAULT_CLASSES.detailTdClasses;
          const slot = document.createElement("div");
          slot.id = `tanstack-slot-${id}-${rowId}`;
          slot.className = `accordion-slot ${DEFAULT_CLASSES.slotMinHeightClasses}`;
          slot.textContent = "Detail slot";
          td.appendChild(slot);
          detailTr.appendChild(td);
          tbody.appendChild(detailTr);
        }
      });
    }

    tableEl.appendChild(tbody);
    container.innerHTML = "";
    container.appendChild(tableEl);
  }

  render();
}

function initAll() {
  document.querySelectorAll<HTMLElement>("[data-tanstack-table-init]").forEach((el) => {
    const raw = el.getAttribute("data-tanstack-config");
    if (!raw) return;
    try {
      const config = JSON.parse(raw) as TanStackTableConfig;
      initTanStackDataTable(el, config);
    } catch (err) {
      console.error("[TanStackDataTable] Failed to init:", err);
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
  document.addEventListener("astro:page-load", initAll);
}
