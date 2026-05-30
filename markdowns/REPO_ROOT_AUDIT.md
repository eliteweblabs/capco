# Repository root audit (Capco / multi-site Astro + Supabase)

_Generated to answer “what is this file?” and keep the repo honest about deploy and SEO._

## Nixpacks vs HTML (your question)

| Path | Status |
|------|--------|
| **`nixpacks.html`** | **Does not exist** in this repository (nothing to noindex). If you saw it elsewhere (Desktop, another branch, or another project), it was not part of this tree when audited. |
| **`nixpacks.toml`** | **Was present** at repo root. It was **not** Capco/Astro config — it was a **wrong template** for a PHP “Ninja Invoice” / Laravel-style build. **Railway deploy for this app uses the `Dockerfile` (Node/Astro)**, not that PHP pipeline. The file was **removed** as misleading cruft. If you ever need Nixpacks for Node here, add a **new** `nixpacks.toml` written for this stack (or stay on Dockerfile only). |

**SEO:** Nothing in the app was “hiding Nixpacks from search engines” because there was no Nixpacks HTML page. Normal SEO is via `AppHead.astro`, `robots.txt` / sitemap patterns in `src/lib/content*.ts`, and `noindex` on **debug** pages (e.g. `src/pages/debug/auth-access.astro`).

## Root files — purpose (high level)

| Item | Role |
|------|------|
| `package.json` / `package-lock.json` | Dependencies and npm scripts. |
| `astro.config.mjs` | Astro build/dev/server config. |
| `tsconfig.json` | TypeScript. |
| `tailwind.config.cjs` / `postcss.config.mjs` | Styling pipeline. |
| `eslint.config.js` / `.eslintrc.json` | Lint (legacy + flat config coexist). |
| `prettier.config.mjs` / `.prettierignore` | Formatting. |
| `stylelint.config.js` | CSS lint. |
| `playwright.config.ts` | E2E tests (`e2e/`). |
| `policygen.json` | Legal pages generation (`build:legal-pages`). |
| `bs-config.cjs` | Browser-sync for optional `dev:sync`. |
| `Dockerfile` / `.dockerignore` | **Primary production image** (Railway). |
| `.railwayignore` | Shrinks upload context for Railway. |
| `LICENSE` | License text. |
| `certs/` | TLS material (often empty or local; many patterns gitignored). |

## Directories you will always see (normal for this codebase)

| Directory | Purpose |
|-----------|---------|
| `src/` | Application: pages, components, APIs, lib. |
| `public/` | Static assets; some entries are **generated** (see `.gitignore`: favicon, manifest). |
| `scripts/` | Build helpers, Railway init, one-off tools, CLIs. Large but intentional. |
| `sql-queriers/` | Hand-maintained SQL (migrations helpers, fixes) — **not** auto-generated dumps. |
| `supabase/` | Migrations / local Supabase config. |
| `config/` | Railway templates, env examples, non-secret config. |
| `markdowns/` | Internal runbooks and design notes (this file lives here). |
| `knowledge/` | Knowledge-base content for features that consume it. |
| `node_modules/` | Installed packages (never “your” source of truth). |
| `.astro/` | Astro cache (local). |

## Removed in this audit (why)

| File | Reason |
|------|--------|
| `nixpacks.toml` | Wrong product (PHP); deploy is Docker-based. |
| `server.py` | Unused **Flask** snippet that executed **shell commands from JSON** — unsafe if ever run or deployed. |
| `style-classes.ts` | **Not imported anywhere**; looked like a scratchpad of Tailwind snippets. |

_StudioCMS was already removed earlier (dependency + config); CMS remains your custom/admin + Supabase-backed content._

## Optional follow-ups (not done in this pass)

1. **`markdowns/`** — 100+ files: fine for internal docs; consider a short `markdowns/README.md` index if navigation is painful.
2. **`scripts/`** — Same: consider grouping or a one-page index of “scripts we still run in CI/deploy vs legacy.”
3. **Prettier/validate failures** — e.g. `src/components/common/Hero copy.astro` (bad filename / parse), `src/pages/c/[token].astro` script block: fix when you next touch validation.
4. **`public/fire-alarm-layout.html`** — Static HTML tool/page; keep if linked from product, else archive.
5. **`.env*` at root** — Never commit secrets; `.gitignore` already excludes `.env`; backups like `.env.backup` are local risk — rotate if they ever contained real keys.

## Single sentence summary

**This repo is an Astro + Supabase app deployed with Docker; root clutter was mostly legacy/wrong templates and one dangerous unused script — not a second CMS and not a Nixpacks HTML surface.**
