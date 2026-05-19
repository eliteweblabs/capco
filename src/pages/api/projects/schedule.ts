/**
 * GET /api/projects/schedule
 *
 * Returns calendar events for the admin schedule view at /admin/schedule.
 *
 * Query params:
 *   start  ISO date (defaults to first day of current month)
 *   end    ISO date (defaults to last day of current month)
 *
 * Auth: Admin / Staff / superAdmin only. Clients are rejected.
 *
 * Event shape and date math live in src/lib/project-schedule.ts so the SSR
 * page consumes the exact same logic without an HTTP round-trip.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrStaffOrSuperAdmin } from "../../../lib/user-utils";
import { getScheduleEvents, parseRange } from "../../../lib/project-schedule";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser, session } = await checkAuth(cookies);
    if (!session || !currentUser) {
      return jsonError("Authentication required", 401);
    }
    if (!isAdminOrStaffOrSuperAdmin(currentUser.profile?.role)) {
      return jsonError("Access denied", 403);
    }

    const url = new URL(request.url);
    const range = parseRange(url);

    const dbClient = supabaseAdmin ?? supabase;
    if (!dbClient) {
      return jsonError("Database connection not available", 500);
    }

    const { events, error } = await getScheduleEvents(dbClient, range);
    if (error) {
      console.error("[/api/projects/schedule] Query failed:", error);
      return jsonError(error, 500);
    }

    return new Response(
      JSON.stringify({
        success: true,
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        count: events.length,
        events,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[/api/projects/schedule] Unhandled error:", err);
    return jsonError(err instanceof Error ? err.message : "Unknown error", 500);
  }
};
