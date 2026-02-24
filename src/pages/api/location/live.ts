/**
 * Live Team Locations API (Admin)
 * Returns the latest location ping per user (Admin/Staff) for dashboard map.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

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
    if (role !== "Admin") {
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
    const minutes = Math.min(60, Math.max(5, parseInt(url.searchParams.get("minutes") ?? "15", 10)));

    // Latest ping per user in the last N minutes (only Admin/Staff)
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    const { data: pings, error: pingsError } = await supabaseAdmin
      .from("locationPings")
      .select(
        `
        id,
        userId,
        lat,
        lng,
        accuracy,
        projectId,
        timeEntryId,
        createdAt
      `
      )
      .gte("createdAt", cutoff)
      .order("createdAt", { ascending: false });

    if (pingsError) {
      console.error("❌ [LOCATION-LIVE] Error fetching pings:", pingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch locations", details: pingsError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get distinct user ids from pings
    const userIds = [...new Set((pings ?? []).map((p) => p.userId))];

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ users: [], pings: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, firstName, lastName, role")
      .in("id", userIds)
      .in("role", ["Admin", "Staff"]);

    if (profilesError) {
      console.error("❌ [LOCATION-LIVE] Error fetching profiles:", profilesError);
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        {
          name: [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unknown",
          role: p.role,
        },
      ])
    );

    // Latest ping per user
    const seen = new Set<string>();
    const latestPerUser = (pings ?? []).filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });

    const users = latestPerUser.map((p) => ({
      userId: p.userId,
      name: profileMap.get(p.userId)?.name ?? "Unknown",
      role: profileMap.get(p.userId)?.role ?? null,
      lat: p.lat,
      lng: p.lng,
      accuracy: p.accuracy,
      projectId: p.projectId,
      timeEntryId: p.timeEntryId,
      lastPingAt: p.createdAt,
    }));

    return new Response(
      JSON.stringify({
        users,
        minutes,
        cutoff,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [LOCATION-LIVE] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
