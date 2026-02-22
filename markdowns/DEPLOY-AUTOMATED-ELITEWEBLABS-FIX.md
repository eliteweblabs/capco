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
