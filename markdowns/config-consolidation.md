# Config Consolidation (One File Per Company)

All company config is now in a single JSON file per company in the project root:

- `site-config-capco-design-group.json` – Capco (CAPCo Design Group)
- `site-config-rothco-built.json` – Rothco (Rothco Built)

## Structure (per file)

Each site-config includes:

- `asideNav`, `navigation`, `features`, `registerForm`, `loginForm`, etc.
- `statuses` – project workflow status definitions (from former `config/data/statuses.json`)
- `schemaTables` – database table list (for schema comparison scripts)
- `schemaColumns` – database column definitions (for schema scripts)

## Gitignore

Both `site-config-capco-design-group.json` and `site-config-rothco-built.json` are gitignored. Deployments use `SITE_CONFIG_JSON` env or local files.

## Removed

- `config/data/` – deleted
- Duplicate `site-config-capco-design-group.json` (was in config/data)
- `capco-tables.json`, `capco-columns.json`, `rothco-schema-tables.json`, `rothco-schema-columns.json`, `statuses.json` – merged into site-config

## Schema scripts

- `scripts/compare-and-generate-migration.cjs` – reads from site-config
- `scripts/sync-rothco-to-capco-schema.js` – reads from site-config by default
- `scripts/generate-create-tables.cjs` – reads `schemaColumns` from Capco site-config
- `scripts/import-capco-columns.js` – writes `schemaColumns` into Capco site-config
- `scripts/parse-rothco-schema.js` – writes `schemaColumns` into Rothco site-config (usage: `node scripts/parse-rothco-schema.js <raw-export.json>`)
