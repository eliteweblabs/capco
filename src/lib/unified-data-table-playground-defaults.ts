/** Default JSON for /admin/design/data-table-playground — all optional features on. */

export const UNIFIED_DATA_TABLE_PLAYGROUND_DEFAULT_JSON = `{
  "id": "unified-playground",
  "title": "Unified data table (playground)",
  "description": "Edit this JSON to change columns and rows. Features: sort, resize (drag header edges), row reorder (drag handle), expand row, select checkboxes, actions column.",
  "getRowIdKey": "id",
  "getReorderIdKey": "id",
  "emptyMessage": "No rows (add items to \\"data\\" in JSON).",
  "reorderCallbackName": "playgroundDemoReorder",
  "features": {
    "expandable": true,
    "showDragHandle": true,
    "showSelectColumn": true,
    "showActionsColumn": true,
    "resizable": true,
    "actionsColumnSticky": true,
    "detailAsJson": true
  },
  "columns": [
    {
      "id": "slug",
      "accessorKey": "slug",
      "header": "Slug",
      "enableSorting": true,
      "meta": { "icon": "link", "tooltip": "URL path", "width": 22 }
    },
    {
      "id": "title",
      "accessorKey": "title",
      "header": "Title",
      "enableSorting": true,
      "meta": { "icon": "edit", "tooltip": "Page title", "width": 38 }
    },
    {
      "id": "template",
      "accessorKey": "template",
      "header": "Template",
      "enableSorting": true,
      "meta": { "tooltip": "Layout key", "width": 22 }
    }
  ],
  "data": [
    {
      "id": "1",
      "slug": "about",
      "title": "About Us",
      "template": "fullwidth"
    },
    {
      "id": "2",
      "slug": "contact",
      "title": "Contact",
      "template": "fullform"
    },
    {
      "id": "3",
      "slug": "services",
      "title": "Our Services",
      "template": "fullwidth"
    },
    {
      "id": "4",
      "slug": "faq",
      "title": "FAQ",
      "template": "default"
    }
  ]
}`;
