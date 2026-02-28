# Data Table NPM Research — Icon, Tooltip, Sortable, Drag, Accordion

Research for enhancing AccordionDataTable (th: icon, tooltip, sortable; drag handle; expandable rows) with an existing npm package.

## Options Compared

| Package | Sortable | Expandable | Drag | Icons/Tooltips | Vanilla JS | Notes |
|---------|----------|------------|------|----------------|------------|-------|
| **@tanstack/table-core** | ✅ | ✅ | ⚙️ (row model) | DIY (headless) | ✅ | Headless; we render HTML |
| **simple-datatables** | ✅ | ❌ | ✅ col reorder | ❌ | ✅ | No expandable rows |
| **AG Grid Community** | ✅ | ❌ (Enterprise) | ✅ | Custom cells | ✅ | Master-detail is paid |
| **table-dragger** | ❌ | ❌ | ✅ row/col | N/A | ✅ | Drag-only; combine with others |
| **table-sort-js** | ✅ | ❌ | ❌ | N/A | ✅ | Sort-only, ~2KB |

## Recommendation: TanStack Table

**Why TanStack Table (@tanstack/table-core):**

- **Headless** — We keep Astro, Tailwind, SimpleIcon, Tooltip. No UI lock-in.
- **Vanilla JS** — Official vanilla examples; no React required.
- **Sorting** — Built-in column sorting with `getSortedRowModel()`.
- **Expanding** — Built-in `getExpandedRowModel()` for accordion/detail rows.
- **Column defs** — `meta` for icon, tooltip, sortable; we wire them in our th/td.
- **Drag** — Row reorder via `rowDrag` or combine with `table-dragger` / SortableJS.
- **Widely used** — 3.7M+ weekly downloads, active maintenance.

**What we’d add ourselves:**
- th icon, tooltip — from our SimpleIcon + Tooltip in column `meta`.
- Drag handle — extra column or `table-dragger` on tbody.
- Sticky columns — existing CSS (sticky-left/right).

## Alternative: simple-datatables

If we **don’t** need expandable rows and mainly want sort + filter + pagination:

- `simple-datatables` is lightweight and has sort, filter, pagination, column visibility.
- No accordion; we’d keep our own expand logic or drop it.

## Alternative: AG Grid Community

- Full grid: sort, filter, custom cell renderers, virtualization.
- Master-detail (expandable rows) is **Enterprise (paid)**.
- Heavier bundle; may clash with our existing table markup.

## Migration Done (2026-02)

1. **Installed:** `@tanstack/table-core`
2. **Created:** `TanStackDataTable.astro` + `tanstack-data-table-init.ts`
3. **Features:** Sortable columns, icon/tooltip in headers (column meta), expandable rows, drag handle column
4. **No overwrites:** AccordionDataTable, ProjectList, DashboardProjectAccordionTable unchanged
5. **Demo:** `/admin/design/data-table-accordion` iteration 8

## References

- TanStack Table vanilla: https://tanstack.com/table/latest/docs/framework/vanilla/examples/useTable
- simple-datatables: https://fiduswriter.github.io/simple-datatables/
- table-dragger: https://www.npmjs.com/package/table-dragger
