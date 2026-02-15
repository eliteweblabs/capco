# Site Config: Env-Based Loading

Site config is now loaded from environment variables first, with a single file fallback.

## Priority (in order)

1. **`SITE_CONFIG`** or **`SITE_CONFIG_JSON`** – Full JSON string in env var
2. **`site-config.json`** – File in project root (for local dev)
3. Minimal defaults (missing nav, features, etc.)

## Setup

### Production (Railway)

Set `SITE_CONFIG` or `SITE_CONFIG_JSON` on the Railway service with the full site-config JSON:

```bash
# One-line minified JSON
railway variables set SITE_CONFIG='{"site":{...},"navigation":{...},"features":{...},...}'
```

Or copy from an existing config:

```bash
cat site-config-rothco-built.json | jq -c . | pbcopy  # paste into Railway vars
```

### Local development

- Set `SITE_CONFIG` or `SITE_CONFIG_JSON` in `.env`, or
- Put `site-config.json` in project root (gitignored)

## What changed

- **Removed**: Company slug logic, `site-config-{company-slug}.json` loading
- **Removed**: Tandem edit rule for `site-config-rothco-built.json` / `site-config-capco-design-group.json`
- **Kept**: DB values for site/branding (company name, logo, colors) are merged into the base config before env/file overrides
- **Kept**: `site-config-rothco-built.json` and `site-config-capco-design-group.json` in repo for scripts (compare-and-generate-migration, etc.) and as reference – they are no longer loaded by `content.ts`
