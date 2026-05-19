# Project TODO

Items the team intends to work on. When asked "what's in the todo list" or similar, read this file and report its contents.

---

## Session handoff — recurring inspections + admin schedule (2026-05-18)

**Status:** In-progress (MAVSAFE landed; rollout + verification pending)

**What just shipped (commits `b5c9c3e3` and `b9e382fd` on `main`):**

- `feat(projects)`: recurring inspections on the project form (toggle + period + first/next inspection dates) and a new Admin/Staff-only calendar at `/admin/schedule`. MAVSAFE only so far.
  - DB migration: `supabase/migrations/20260518000000_projects_recurring_inspection.sql` (4 columns on `projects`, CHECK constraint, default trigger, partial index).
  - Form fields added to `public/data/config-mavsafe.json` under `projectForm.steps[0].fields` (uses the `conditional` field-visibility pattern).
  - `Schedule` entry added to MAVSAFE `asideNav`.
  - Shared calendar logic: `src/lib/project-schedule.ts` (consumed by both `src/pages/api/projects/schedule.ts` and `src/pages/admin/schedule.astro`).
- `refactor(forms)`: removed the dead legacy "unified form elements" rendering path from `ProjectForm.astro`. `src/lib/form-config.ts` deleted; `src/lib/project-form-config.ts` slimmed to ~50 lines of types. ProjectForm now renders a visible red alert if a site is missing `projectForm` in its config.

**Pending — pick up here in the next chat:**

1. **MCP browser verification of the create flow.** I never ran it for these changes. Goal: load `/project/new?mcp=1` on the running dev server, fill the form, toggle the recurring inspection on, pick a period + date, submit, and confirm the row hits the DB with the new columns populated. Then load `/project/<id>?mcp=1` and verify the existing-project form renders without the address input and with the recurring fields showing/hiding correctly as the toggle is flipped. See `.cursor/rules/mcp-form-verification.mdc`.
2. **Roll out to `config-capco-design-group.json` and `config-rothco-built.json`** (and any other site configs) once MAVSAFE is verified. Same `projectForm` field additions + same `asideNav` entry. Migration applies to all sites automatically since they share the schema pattern.
3. **`newConstruction` checkbox stickiness bug.** Same root cause as the `isInspection` bug I fixed: unchecked HTML checkboxes don't appear in `FormData`, so the backend never receives `false` and the old value sticks. I only patched `isInspection` in `ProjectForm.astro`'s `handleFormSubmit`. The same explicit-normalization fix should be applied to `newConstruction` (and audited for any other boolean toggle in the project form).
4. **Post-deploy Railway check.** Per `.cursorrules`, ~6 minutes after the next sync to GitHub, MCP Railway to confirm capco / rothco / luxemeds still load. URLs in `markdowns/site-urls-for-mcp-check.md`.

**Useful context for the next chat:**

- Transcript of this session: `[Recurring inspections + admin schedule](fe66a5a3-2237-48bb-bbc5-dcf4d85509b6)`.
- Dev server: currently running in terminal 1 (`npm run dev`).
- Working tree has unrelated uncommitted changes in `ProjectItem.astro`, `ProjectList.astro`, `project-list-table-config.ts`, `src/scripts/project-list-sort.ts`, `privacy.astro`, `terms.astro` — none of those are mine; they were already in the working tree at session start.

---

## BannerAlertsLoader scroll/translate UX (mobile)

**Status:** Backlog  
**File:** `src/features/banner-alert/components/BannerAlertsLoader.astro`

**Issue:** During scroll on mobile, both `scrollTop` and `translateY` move content together, which feels unnatural (double movement). The release into normal content scroll also feels like you have to force it.

**Attempted fixes (reverted):**
1. Consume scroll during reveal phase: reset `scrollTop` to 0 so only `translateY` drives content until reveal is complete.
2. Carry-over handoff: when delta would push `translateY` past max, cap it and carry excess into `scrollTop` for smoother transition.

**Outcome:** Reverted; neither approach felt right. Needs a different solution (e.g. wheel/touch event handling, or alternative scroll model).
