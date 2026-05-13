# Check-In: Billing Timer & Live Team Locations

## Overview

The account dropdown **Check In** button (Admin/Staff) now:

1. **Starts a billing time entry** – Check-in creates a row in `timeEntries` (optional `projectId`). Check-out sets `endedAt` on that row.
2. **Sends periodic location pings** – While checked in, the client sends lat/lng to `/api/location/ping` every 60 seconds. Stored in `locationPings`.
3. **Live dashboard for admins** – Admins can open **Team Locations** to see the latest location of each checked-in team member.

## Database

- **timeEntries** – `userId`, `projectId` (optional), `startedAt`, `endedAt` (null while active), `notes`, `createdAt`, `updatedAt`.
- **locationPings** – `userId`, `timeEntryId`, `projectId`, `lat`, `lng`, `accuracy`, `createdAt`.

Run migrations so these tables exist (see `supabase/migrations/20260224000000_time_entries_and_location_pings.sql`).

## APIs

- **POST /api/location/check-in** – Body: `action` (check_in | check_out), `lat`, `lng`, `accuracy?`, `projectId?` (for check_in), `timeEntryId?` (for check_out). Returns `timeEntryId` on check_in.
- **POST /api/location/ping** – Body: `timeEntryId`, `lat`, `lng`, `accuracy?`, `projectId?`. Call every ~60s while checked in.
- **GET /api/location/live?minutes=15** – Admin only. Returns latest ping per user in the last N minutes (for dashboard).

### Project labor rollup (reuse time entries — no duplicate JSON blob)

Staff time attached to a project is **already modeled** by `timeEntries` (`userId` + `projectId` + session start/end from check-in). Do **not** denormalize a second JSON artifact on `projects`; list and summarize via **GET `/api/time-entries`**:

- **`GET /api/time-entries`** – Query params: `projectId` (recommended), optional `from` / `to` (filters on `startedAt`), optional `aggregate=byUser`. **Access:** admins & superAdmin see everyone’s rows matching filters; **Staff** see all rows **for one project only** if they are the project **author** or **assigned** staff (`assignedToId`), otherwise **own rows only**; **clients** never see coworkers’ payroll rows for a project summary.

## UI

- **CheckInButton** – Optional prop `projectId`. When provided (e.g. on a project page), the time entry and pings are tied to that project. When omitted (e.g. in account dropdown), session is “general” (no project).
- **Team hours tab** (`/project/{id}?status=team-hours`) – Admin & Staff summary table **per project**, CSV export, driven by `/api/time-entries?projectId=…`.
- **Admin → Team Locations** – `/admin/team-locations`. List of team members with last ping time and “View on Map” (Google Maps). Refreshes every 30 seconds.

## Attaching to a project

To attach check-in to the current project when the user is on a project page, pass `projectId` into `CheckInButton`:

```astro
<CheckInButton tile projectId={projectId} />
```

The account menu **Check In** receives `project` from the shell so `CheckInButton` can pass `projectId` on project routes (when `App`/layout supplies `project`). You can extend the UX to prompt for a project when checked in globally if needed.
