/**
 * Location Trail API (Admin)
 * Returns ordered location pings for a single user so the admin map can draw a trail
 * (polyline + ping dots) of where they've been.
 *
 * Query params:
 *   - userId       (required) UUID of the team member.
 *   - timeEntryId  (optional) If present, returns pings only for that specific check-in session.
 *   - from / to    (optional) ISO timestamps for an explicit range.
 *   - hours        (optional) Lookback window when neither timeEntryId nor from/to are given. Default 24, capped at 720 (30d).
 *   - limit        (optional) Max rows returned. Default 2000, capped at 5000.
 *
 * Response: { pings: Array<{ id, lat, lng, accuracy, projectId, timeEntryId, createdAt }> }
 * Pings are ordered by createdAt ascending so the client can draw them as a line.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrSuperAdmin } from "../../../lib/user-utils";

const MAX_HOURS = 24 * 30;
const DEFAULT_HOURS = 24;
const MAX_LIMIT = 5000;
const DEFAULT_LIMIT = 2000;
const MIN_LIMIT = 50;

function clampInt(raw: string | null, def: number, min: number, max: number): number {
  const parsed = parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return def;
  return Math.min(max, Math.max(min, parsed));
}

export const GET: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = (currentUser as any)?.profile?.role;
    if (!isAdminOrSuperAdmin(role)) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const timeEntryIdRaw = url.searchParams.get("timeEntryId");
    const timeEntryId = timeEntryIdRaw ? parseInt(timeEntryIdRaw, 10) : null;
    const hours = clampInt(url.searchParams.get("hours"), DEFAULT_HOURS, 1, MAX_HOURS);
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");
    const limit = clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT);

    let query = supabaseAdmin
      .from("locationPings")
      .select("id, lat, lng, accuracy, projectId, timeEntryId, createdAt")
      .eq("userId", userId)
      .order("createdAt", { ascending: true })
      .limit(limit);

    if (timeEntryId !== null && Number.isFinite(timeEntryId)) {
      query = query.eq("timeEntryId", timeEntryId);
    } else if (fromRaw || toRaw) {
      if (fromRaw) query = query.gte("createdAt", fromRaw);
      if (toRaw) query = query.lte("createdAt", toRaw);
    } else {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      query = query.gte("createdAt", cutoff);
    }

    const { data: pings, error } = await query;
    if (error) {
      console.error("❌ [LOCATION-TRAIL] Error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch trail", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        pings: pings ?? [],
        userId,
        timeEntryId: timeEntryId ?? null,
        hours,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [LOCATION-TRAIL] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
