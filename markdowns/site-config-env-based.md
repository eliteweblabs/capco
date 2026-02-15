# Site Config: Env-Based Loading

Site config is now loaded from environment variables first, with a single file fallback.

**Railway limits env vars to 32KB.** Full site-config is often 66KB+. Use chunked vars or a URL.

## Priority (in order)

1. **`SITE_CONFIG_URL`** – URL to fetch JSON from (no size limit)
2. **`SITE_CONFIG`** or **`SITE_CONFIG_JSON`** – Full JSON string (<32KB)
3. **`SITE_CONFIG_1`, `SITE_CONFIG_2`, ...** – Chunked JSON for large configs
4. **`/data/config.json`** – Static file (put in `public/data/config.json`, served at `/data/config.json`)
5. **`site-config.json`** – File in project root (local dev fallback)
6. Minimal defaults

## Setup

### Production (Railway) – Recommended: static file

1. Put your config at **`public/data/config.json`** (copy from `site-config.json`)
2. Commit and deploy

The file is read from disk at build/runtime (no fetch, no SITE_URL needed). No env var size limits.

### Alternative: SITE_CONFIG_URL

Host config elsewhere (S3, GitHub raw, etc.) and set:

```
SITE_CONFIG_URL=https://your-bucket.s3.amazonaws.com/site-config.json
```

### Alternative: Chunked vars (when static file isn't used)

```bash
node scripts/split-site-config-for-railway.cjs site-config.json
```

Add `SITE_CONFIG_1`, `SITE_CONFIG_2`, etc. in Railway.

### Local development

- `public/data/config.json` works in dev too (served at `/data/config.json`)
- Or put `site-config.json` in project root (gitignored)

## What changed

- **Removed**: Company slug logic, `site-config-{company-slug}.json` loading
- **Removed**: Tandem edit rule for `site-config-rothco-built.json` / `site-config-capco-design-group.json`
- **Kept**: DB values for site/branding (company name, logo, colors) are merged into the base config before env/file overrides
- **Kept**: `site-config-rothco-built.json` and `site-config-capco-design-group.json` in repo for scripts (compare-and-generate-migration, etc.) and as reference – they are no longer loaded by `content.ts`
