# Fix: eliteweblabs/automated deploy build failure

## What’s failing

- **backend:build** fails with:
  - `Cannot find module '../generated/prisma/client'` (TS2307)
  - `Property 'workflowStep' / 'workflow' does not exist on type 'PrismaService'` (TS2339)
  - Parameter `step` implicitly has an `any` type (TS7006)

The Prisma client is never generated before `npm run build`, so the generated types and client don’t exist when the backend is built.

## Fix (choose one)

### Option A: Fix in the automated repo (recommended)

In your clone/fork of **eliteweblabs/automated**:

1. **Generate Prisma before build**

   In the **root** `package.json`, add a `prebuild` script so Prisma runs before Nx build:

   ```json
   "scripts": {
     "prebuild": "npm run prisma:generate",
     "build": "nx run-many --target=build",
     ...
   }
   ```

   If you deploy with **SQLite** (no `DATABASE_URL` or non-Postgres URL), use:

   ```json
   "prebuild": "npm run prisma:generate:sqlite"
   ```

   Then keep your deploy build command as:

   ```bash
   npm run build
   ```

2. **Commit and push** so your deploy (e.g. Railway) runs the same `npm run build` and gets the generated client.

### Option B: Fix only in the deploy platform

Without changing the repo, set the **build command** in your deploy config to:

- **PostgreSQL (or default schema):**
  ```bash
  npm run prisma:generate && npm run build
  ```
- **SQLite:**
  ```bash
  npm run prisma:generate:sqlite && npm run build
  ```

## Notes

- The repo’s `start:backend` only runs `prisma:generate:sqlite` when `DATABASE_URL` is not Postgres; the main **build** does not run any Prisma generate, which is why deploy fails.
- After the client is generated, the `workflow` / `workflowStep` and module-not-found errors should go away. If `step` still errors, add an explicit type (e.g. from the generated Prisma client) in `apps/backend/src/app/workflow/workflow.service.ts` around the `.map((step) => ...)` call.

## Summary

Run **`npm run prisma:generate`** (or `prisma:generate:sqlite` for SQLite) **before** `npm run build`—either via a `prebuild` script in the automated repo or in the deploy build command.

---

# Production deploy: “Won’t load” / ugly logs

## What’s going wrong

1. **Wrong start command** — Deploy is running `npm start`, which runs `nx run-many --targets=dev,serve`. That is the **development** workflow (Next.js dev server, watch mode, Nx daemon). It is not meant for production and causes:
   - Next.js dev server exiting, Nx plugin timeouts (10 min), “Resource temporarily unavailable” (thread limits), and the app not serving correctly.

2. **Backend Prisma at runtime** — Backend is resolving `libs/prisma/generated/prisma-sqlite/client`. If you use **SQLite** in production, the **build** must run `prisma:generate:sqlite` so that path exists. If you use **Postgres**, set `DATABASE_URL` and use `prisma:generate`; the backend may still need the SQLite client at build time depending on how `prisma.service.ts` is written (generate both if the build imports both).

3. **NODE_ENV** — Set `NODE_ENV=production` in the deploy environment so Next.js and Node run in production mode.

4. **cua-agent** — “Could not find /app/cua-agent/main.js” happens because the **serve** target expects a built output in a specific path; that’s part of the dev workflow. In production you should not be running the dev/serve targets.

## Fix: Use production build + production start

The repo is designed to run in production via **Docker** (separate backend and frontend containers). On Railway (or similar) you can either use those Dockerfiles or replicate the same build/start.

### Option A: Use the repo’s Dockerfiles (recommended)

Use **two services** in Railway (or one service per Dockerfile):

| Service   | Dockerfile                  | Build context | Start (built-in in image)     |
|----------|-----------------------------|---------------|--------------------------------|
| Backend  | `apps/backend/Dockerfile`   | Repo root     | `node dist/apps/backend/main.js` |
| Frontend | `apps/frontend/Dockerfile`  | Repo root     | `npx nx start frontend --configuration=production` |

- Backend: set env e.g. `DATABASE_URL` (and `DB_PROVIDER=sqlite` if you want SQLite). The backend Dockerfile already runs `prisma:generate` and, when `DB_PROVIDER=sqlite`, `prisma:generate:sqlite`.
- Frontend: set `NEXT_PUBLIC_API_URL` (or equivalent) to your backend URL.
- Do **not** set the build/start command to `npm start` or `npm run build` + `npm start` when using Docker; the Dockerfile defines CMD.

### Option B: Deploy without Docker (e.g. Nixpacks / Node buildpack)

Use **two services** (backend + frontend).

**Shared**

- Set **NODE_ENV=production** in the deploy environment.

**Backend service**

- **Build:**  
  `npm run prisma:generate:sqlite && npm run build`  
  (or `npm run prisma:generate && npm run build` if you use Postgres and the backend doesn’t require the SQLite client at build time.)
- **Start:**  
  `node dist/apps/backend/main.js`  
  (run from repo root; webpack outputs to `dist/apps/backend/main.js`.)

**Frontend service**

- **Build:**  
  Same as backend (or frontend-only if your platform supports it):  
  `npm run prisma:generate:sqlite && npm run build`  
  (Prisma is needed if the frontend build pulls in backend/lib code; otherwise you can try `npx nx build frontend --configuration=production` only.)
- **Start:**  
  `npx nx start frontend --configuration=production`  
  or, from repo root, `cd apps/frontend && npx next start`.

**Critical:** Do **not** use `npm start` as the start command. That runs the dev workflow and causes the “won’t load” and ugly logs.

### Option C: Single service (not recommended)

You would need to run both backend and frontend in one process (e.g. start backend in the background and then `npx nx start frontend --configuration=production`). That’s fragile (port binding, process management). Prefer two services (Option A or B).

## Prisma SQLite vs Postgres

- If the backend **build** fails with “Can’t resolve ... prisma-sqlite/client”, the build step must run **`prisma:generate:sqlite`** so `libs/prisma/generated/prisma-sqlite/client` exists.
- If you use **Postgres** in production, set `DATABASE_URL` and run **`prisma:generate`** in the build. If the backend still imports the SQLite client at build time, run both:
  `npm run prisma:generate && npm run prisma:generate:sqlite && npm run build`.

## Summary

- **Do not use `npm start` in production** — use the production start commands above.
- **Build:** Include the correct Prisma generate step (`prisma:generate` and/or `prisma:generate:sqlite`) before `npm run build`.
- **Start:** Backend = `node dist/apps/backend/main.js`; Frontend = `npx nx start frontend --configuration=production` (or `next start` in `apps/frontend`).
- **Two services** (backend + frontend) match the repo’s design and avoid Nx dev / thread/timeout issues.
