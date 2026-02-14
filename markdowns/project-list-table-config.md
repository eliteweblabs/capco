# Project List Table Config

Project dashboard table columns are driven by `projectListColumns` in company-specific site-config JSON (same pattern as `asideNav`).

## Location

- `site-config-{company-slug}.json`
- Top-level key: `projectListColumns`
- When present, overrides TS module config

## Column types

`delete`, `edit`, `text`, `company`, `status`, `featured`, `files`, `assigned`, `progress`, `checklist`, `elapsed`, `timeSince`, `dueDate`

## Config format

```json
{
  "projectListColumns": [
    { "id": "delete", "type": "delete", "allow": ["Admin", "Staff"], "width": 48, "icon": "trash" },
    {
      "id": "address",
      "label": "Address",
      "type": "text",
      "field": "address",
      "linkToProject": true,
      "width": 180
    }
  ]
}
```

- **allow**: Roles that can see the column (omit = all)
- **field**: Project field for text/value types
- **linkToProject**: Wrap text in project link
- **width**, **icon**, **tooltip**: Optional

## Fallback

When `projectListColumns` is missing in site-config, falls back to TS modules (`project-list-table-config-capco-design-group.ts`, etc.).
