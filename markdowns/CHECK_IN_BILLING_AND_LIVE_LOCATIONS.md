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

## UI

- **CheckInButton** – Optional prop `projectId`. When provided (e.g. on a project page), the time entry and pings are tied to that project. When omitted (e.g. in account dropdown), session is “general” (no project).
- **Admin → Team Locations** – `/admin/team-locations`. List of team members with last ping time and “View on Map” (Google Maps). Refreshes every 30 seconds.

## Attaching to a project

To attach check-in to the current project when the user is on a project page, pass `projectId` into `CheckInButton`:

```astro
<CheckInButton tile projectId={projectId} />
```

The account dropdown and drawer currently do not pass `projectId` (general check-in). You can extend the dropdown to let the user pick a project before checking in if needed.
