# Project TODO

Items the team intends to work on. When asked "what's in the todo list" or similar, read this file and report its contents.

---

## Session handoff — recurring inspections + admin schedule (2026-05-19)

**Status:** Feature complete; awaiting deploy + post-deploy Railway check.

**iCal-style anchor model (replaces earlier multi-field thinking):**

`inspectionStartDate` is the DTSTART of the series; `inspectionPeriod` is the RRULE interval; `nextInspectionAt` is a cached pointer that mirrors the anchor. Future occurrences are derived on read by `expandInspectionOccurrences()` in `src/lib/project-schedule.ts` — change the anchor and every future chip on the calendar shifts by the same delta.

**What landed this session (uncommitted at time of writing):**

- DB migration `supabase/migrations/20260518000000_projects_recurring_inspection.sql` updated:
  - `default_next_inspection_at()` now also anchors `inspectionStartDate := now()` on first save when `isInspection=true AND inspectionStartDate IS NULL` (so a recurring project shows up on today's cell with zero admin extra steps).
  - New `sync_next_inspection_on_anchor_change()` BEFORE UPDATE trigger keeps `nextInspectionAt` synced to the anchor when an admin moves the anchor from the form or the calendar.
  - Applied via MCP to MAVSAFE, Rothco, and CAPCo Auth Supabases (all three Supabases now have the schema + both triggers).
- Form field added: `inspectionStartDate` (`First Inspection (Master Date)`, `type: date-input`, `conditional` on `isInspection=true`) in all three configs (`config-mavsafe.json`, `config-capco-design-group.json`, `config-rothco-built-llc.json`).
- `Schedule` `asideNav` entry added to `config-capco-design-group.json` and `config-rothco-built-llc.json` (MAVSAFE already had it).
- `/admin/schedule` now supports two new chip interactions on recurring chips:
  - **Click-to-edit**: pops a floating editor (native `<input type="date">`) over the chip, computes `newAnchor = oldAnchor + (newDate - currentOccurrence)`, `PUT /api/projects/upsert`, reload.
  - **Drag-to-reschedule**: HTML5 drag-and-drop with cell-level drop targets, same delta math.
- `ScheduleEvent` gained an `anchorDate` field so the client has what it needs to compute the delta without an extra fetch.

**MCP-verified end-to-end:**

- Project #16 (`Roof & Interior Repairs`, yearly) toggled on via SQL → trigger auto-anchored to today; chip rendered on the right cell.
- Click-edit moved anchor May 20 → May 25 (both columns updated by the sync trigger, time-of-day preserved).
- Drag moved May 25 → May 27.
- Navigated to `?month=2027-05` and confirmed the yearly occurrence appeared on Tue May 25, 2027 (math walks forward correctly).
- New form field renders on `/project/16` with the live anchor value.

**Pending — pick up here in the next chat:**

1. **Commit + push to GitHub.** Uncommitted now: `supabase/migrations/20260518000000_projects_recurring_inspection.sql`, `src/lib/project-schedule.ts`, `src/pages/admin/schedule.astro`, `public/data/config-mavsafe.json`, `public/data/config-capco-design-group.json`, `public/data/config-rothco-built-llc.json`, and this `markdowns/TODO.md`. (Pre-existing uncommitted work in `ProjectItem.astro`, `ProjectList.astro`, `project-list-table-config.ts`, `src/scripts/project-list-sort.ts`, `privacy.astro`, `terms.astro` is NOT mine — leave alone.)
2. **Post-deploy Railway check.** Per `.cursorrules`, ~6 minutes after the next sync to GitHub, MCP Railway to confirm capco and rothco still load. URLs in `markdowns/site-urls-for-mcp-check.md`.
3. **Future polish (no rush):**
   - Inspection chips currently use the primary color which happens to look very similar to the amber "due" chips on MAVSAFE's palette. Consider giving inspections a distinct color or icon prefix on the chip.
   - "Mark inspection complete" flow that advances `nextInspectionAt` independently of the anchor (iCal-style "this instance done, next one is +period"). Doesn't exist yet; today an inspection just keeps repeating forever.
   - Multi-day inspection windows, exceptions list (`EXDATE`), inspector assignment.

**Useful context for the next chat:**

- Transcript of this session: `[Recurring inspections + calendar handoff](d19445a0-2916-429f-918e-ee3a9f9f01af)`.
- Dev server: running in terminal 1 (`npm run dev`).
- Admin login for MCP verification: `demo-seed-admin@demo-seed.local` / `McpTest!2026` (password set via Supabase Auth Admin API this session; the `confirmation_token` NULL issue on demo-seed auth users was also fixed in passing).

---

## BannerAlertsLoader scroll/translate UX (mobile)

**Status:** Backlog  
**File:** `src/features/banner-alert/components/BannerAlertsLoader.astro`

**Issue:** During scroll on mobile, both `scrollTop` and `translateY` move content together, which feels unnatural (double movement). The release into normal content scroll also feels like you have to force it.

**Attempted fixes (reverted):**

1. Consume scroll during reveal phase: reset `scrollTop` to 0 so only `translateY` drives content until reveal is complete.
2. Carry-over handoff: when delta would push `translateY` past max, cap it and carry excess into `scrollTop` for smoother transition.

**Outcome:** Reverted; neither approach felt right. Needs a different solution (e.g. wheel/touch event handling, or alternative scroll model).
