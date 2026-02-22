# Railway Pre-Deploy Checklist – Potential Problems

Things that can cause a failed or broken deploy on Railway.

---

## 1. **Merge conflict markers in code** (build fails)

- **Risk:** Astro/config parse fails with "Merge conflict marker encountered" or esbuild "Unexpected <<".
- **Status:** Resolved in `markdowns/ai-instructions.md`. If you see similar errors, run:
  ```bash
  rg '^<<<<<<<|^=======|^>>>>>>>' --files-with-matches .
  ```
  and remove or resolve those conflicts before deploying.

---

## 2. **VAPI step in build can fail the whole build**

- **What:** `build:railway` runs `update-vapi-capco` (tsx scripts/vapi-capco-config.js), which:
  - Calls VAPI API (`ensureProcessFileTool()`, `updateAssistant()`).
  - On **any** error it runs `process.exit(1)` → **build fails**.
- **When it breaks:** VAPI down, network blocked, invalid key, or VAPI rate limit during build.
- **Mitigation:**
  - Ensure `VAPI_API_KEY` and (if you use VAPI) `RAILWAY_PUBLIC_DOMAIN` (or `WEBHOOK_DOMAIN`) are set in Railway **build** variables if the script must run.
  - Or change the script to **warn** and **not** `process.exit(1)` on failure so the build still succeeds and you fix VAPI later.

---

## 3. **RAILWAY_PROJECT_NAME vs DB company name**

- **Risk:** Wrong or empty content, nav, or branding if env and DB don’t match.
- **Check:** `RAILWAY_PROJECT_NAME` in Railway Variables matches the company name used in the DB (e.g. `globalSettings.companyName` or CMS).
- **Ref:** `markdowns/CMS_DATABASE_BREAKING_LAYOUT.md`, `markdowns/RAILWAY_GLOBAL_VARIABLES_DEPS.md`.

---

## 4. **RAILWAY_PROJECT_NAME not in Docker build (when using Docker)**

- **Risk:** Client bundle gets `process.env.RAILWAY_PROJECT_NAME` as `undefined` if you rely on it in the client.
- **Current:** Dockerfile does **not** pass `RAILWAY_PROJECT_NAME` at build time; Railway injects it at **runtime**. Server-side code is fine; client-inlined company name may be blank until you add it as a build arg or rely only on server-rendered data.

---

## 5. **File paths at runtime (process.cwd())**

- **Risk:** Code uses `process.cwd()` + `src/` or `content/` paths. On Railway, after build, `dist/` exists; `src/` and `content/` exist only if the full repo is deployed (e.g. Docker `COPY . .`).
- **Status:** Dockerfile does `COPY . .`, so `src/` and `content/` are present. If you switch to a buildpack that only keeps `dist/`, PDF/email template and content paths may break.
- **Files:** `src/lib/content.ts`, `src/pages/api/pdf/*.ts`, `src/pages/api/cms/import-markdown.ts`, etc.

---

## 6. **Required env at build time**

- **Astro build** uses (from astro.config.mjs / Vite define): `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_PROJECT_NAME`, and many others. Missing vars become `""` or `undefined` in the bundle.
- **Set in Railway:** Variables that must be correct in the built app should be configured as **build** (and usually **runtime**) variables in the Railway service.

---

## 7. **Volume for persistent content**

- **What:** App uses `/data/content/pages` for persistent page content.
- **Check:** Railway service has a volume mounted at `/data/content` (or the start script and app logic match the same path).

---

## 8. **Start command**

- **Expected:** `node dist/server/entry.mjs` (or `npm run start` which runs that).
- **Check:** Railway start command matches your `package.json` "start" and that `dist/server/entry.mjs` exists after build.

---

## Quick pre-push checks

1. `rg '^<<<<<<<|^=======|^>>>>>>>' --files-with-matches .` → no results (or only in ignored docs).
2. `RAILWAY_PROJECT_NAME` and DB company name aligned.
3. If using VAPI in build: `VAPI_API_KEY` and webhook domain set; or script changed to not `process.exit(1)` on VAPI failure.
4. Required Railway variables documented and set (see `config/railway/railway-template.json` and `markdowns/RAILWAY_GLOBAL_VARIABLES_DEPS.md`).
