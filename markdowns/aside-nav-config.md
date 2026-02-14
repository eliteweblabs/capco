# Aside Navigation Config

Aside sidebar items are driven by `asideNav` in company-specific site-config JSON files.

## Location

- `site-config-{company-slug}.json` (e.g. `site-config-capco-design-group.json`, `site-config-rothco-built.json`)
- Fallback: `site-config.json` in project root
- Top-level key: `asideNav` (or `navigation.aside`)

## Config Format

`asideNav` is an array. Each item can be:

### Built-in ID (string)

Ordered list of known IDs. Resolved by `aside-nav-config.ts`:

| ID                 | Description                                             | Roles                              |
| ------------------ | ------------------------------------------------------- | ---------------------------------- |
| `dashboard`        | Dashboard link                                          | All                                |
| `settings`         | Admin Settings                                          | Admin                              |
| `design`           | Design dropdown (Components, Placeholders)              | Admin                              |
| `content`          | CMS Content                                             | Admin                              |
| `media`            | Media                                                   | Admin                              |
| `alerts`           | Banner Alerts                                           | Admin                              |
| `testimonials`     | Testimonials                                            | Admin                              |
| `global-functions` | Global Functions                                        | Admin                              |
| `projects`         | Projects dropdown (Dashboard, New, Proposals, Settings) | All (Proposals/Settings for Admin) |
| `feature-admin`    | Dynamic admin links from site-config features           | Admin                              |
| `notifications`    | Send Notifications                                      | Admin                              |
| `feature-tools`    | Tools section (Voice Assistant, AI Agent, Tests, etc.)  | Admin                              |

### Custom link (object)

```json
{
  "label": "Custom Link",
  "href": "/custom-path",
  "icon": "link",
  "roles": ["Admin"]
}
```

### Custom dropdown (object)

```json
{
  "label": "Custom Menu",
  "icon": "folder",
  "roles": ["Admin"],
  "children": [
    { "label": "Item A", "href": "/custom/a" },
    { "label": "Item B", "href": "/custom/b" }
  ]
}
```

### Feature injection (object)

```json
{
  "insertFeatureNav": "admin",
  "sectionLabel": "Optional Header"
}
```

```json
{
  "insertFeatureNav": "tools",
  "sectionLabel": "Tools"
}
```

## Example

```json
{
  "asideNav": [
    "dashboard",
    "settings",
    "design",
    "content",
    "media",
    "alerts",
    "testimonials",
    "global-functions",
    "projects",
    "feature-admin",
    "notifications",
    "feature-tools"
  ]
}
```

Companies can reorder, omit, or add custom items. Omit a built-in ID to hide it. Add custom links/dropdowns anywhere in the list.

## Files

- `src/lib/aside-nav-config.ts` – loader and resolver
- `src/lib/content.ts` – merges `asideNav` from JSON into site config
- `src/components/ui/Aside.astro` – renders from resolved config
