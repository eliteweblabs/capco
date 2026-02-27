/**
 * Live Team Locations API (Admin)
 * Returns the latest location ping per user (Admin/Staff) with address, duration, on-site flag.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

function cleanAddress(address: string | undefined): string {
  if (!address) return "";
  return address.replace(/, USA$/i, "").trim();
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results?.length > 0) {
    return cleanAddress(data.results[0].formatted_address);
  }
  return null;
}

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mightBeOnSite(pingAddress: string, projectAddress: string | null): boolean {
  if (!projectAddress || !pingAddress) return false;
  const a = normalizeForCompare(pingAddress);
  const b = normalizeForCompare(projectAddress);
  if (a.length < 10 || b.length < 10) return false;
  return a.includes(b.slice(0, 20)) || b.includes(a.slice(0, 20));
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

    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    const { data: pings, error: pingsError } = await supabaseAdmin
      .from("locationPings")
      .select("id, userId, lat, lng, accuracy, projectId, timeEntryId, createdAt")
      .gte("createdAt", cutoff)
      .order("createdAt", { ascending: false });

    if (pingsError) {
      console.error("❌ [LOCATION-LIVE] Error fetching pings:", pingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch locations", details: pingsError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set((pings ?? []).map((p) => p.userId))];
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ users: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, firstName, lastName, role")
      .in("id", userIds)
      .in("role", ["Admin", "Staff"]);

    if (profilesError) console.error("❌ [LOCATION-LIVE] Error fetching profiles:", profilesError);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        { name: [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unknown", role: p.role },
      ])
    );

    const timeEntryIds = [...new Set((pings ?? []).map((p) => p.timeEntryId).filter((id): id is number => id != null))];
    let timeEntryMap = new Map<number, { startedAt: string; projectId: number | null }>();
    if (timeEntryIds.length > 0) {
      const { data: entries } = await supabaseAdmin
        .from("timeEntries")
        .select("id, startedAt, projectId")
        .in("id", timeEntryIds)
        .is("endedAt", null);
      timeEntryMap = new Map((entries ?? []).map((e) => [e.id, { startedAt: e.startedAt, projectId: e.projectId ?? null }]));
    }

    const projectIds = [...new Set((pings ?? []).map((p) => p.projectId).filter((id): id is number => id != null))];
    let projectMap = new Map<number, { title: string; address: string | null }>();
    if (projectIds.length > 0) {
      const { data: projects } = await supabaseAdmin
        .from("projects")
        .select("id, title, address")
        .in("id", projectIds);
      projectMap = new Map(
        (projects ?? []).map((p) => [p.id, { title: p.title || p.address || `Project #${p.id}`, address: p.address ?? null }])
      );
    }

    const seen = new Set<string>();
    const latestPerUser = (pings ?? []).filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });

    const users = await Promise.all(
      latestPerUser.map(async (p) => {
        const address = await reverseGeocode(p.lat, p.lng);
        const te = p.timeEntryId ? timeEntryMap.get(p.timeEntryId) : null;
        const startedAt = te?.startedAt ?? null;
        const projectId = p.projectId ?? te?.projectId ?? null;
        const proj = projectId ? projectMap.get(projectId) : null;
        const projectTitle = proj?.title ?? (projectId ? `Project #${projectId}` : null);
        const projectAddress = proj?.address ?? null;
        const onSite = address && projectAddress ? mightBeOnSite(address, projectAddress) : false;
        const now = Date.now();
        const durationMs = startedAt ? now - new Date(startedAt).getTime() : 0;
        const durationMinutes = durationMs > 0 ? Math.floor(durationMs / 60000) : null;

        return {
          userId: p.userId,
          name: profileMap.get(p.userId)?.name ?? "Unknown",
          role: profileMap.get(p.userId)?.role ?? null,
          lat: p.lat,
          lng: p.lng,
          accuracy: p.accuracy,
          projectId,
          projectTitle,
          projectAddress,
          timeEntryId: p.timeEntryId,
          lastPingAt: p.createdAt,
          address: address || null,
          startedAt,
          durationMinutes,
          onSite,
        };
      })
    );

    return new Response(
      JSON.stringify({ users, minutes, cutoff }),
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
