/**
 * Checked-In Users API (Admin)
 * Returns users with active time entries (endedAt is null) + latest location/address from locationPings.
 * Used for navbar indicator: icons with tooltip (duration, address).
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results?.length > 0) {
    const addr = data.results[0].formatted_address || "";
    return addr.replace(/, USA$/i, "").trim() || null;
  }
  return null;
}

function authorDisplay(p: { name?: string; firstName?: string; lastName?: string }): string {
  if (p.name && String(p.name).trim()) return String(p.name).trim();
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length ? parts.join(" ").trim() : "—";
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const GET: APIRoute = async ({ cookies }): Promise<Response> => {
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
      return new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("timeEntries")
      .select("id, userId, projectId, startedAt")
      .is("endedAt", null)
      .order("startedAt", { ascending: false });

    if (entriesError || !entries?.length) {
      return new Response(
        JSON.stringify({ users: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set(entries.map((e) => e.userId))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, name, firstName, lastName")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, authorDisplay(p)])
    );

    const timeEntryIds = entries.map((e) => e.id);
    const { data: pings } = await supabaseAdmin
      .from("locationPings")
      .select("timeEntryId, userId, lat, lng, createdAt")
      .in("timeEntryId", timeEntryIds)
      .order("createdAt", { ascending: false });

    const latestPingByEntry = new Map<number, { lat: number; lng: number; createdAt: string }>();
    for (const p of pings ?? []) {
      if (p.timeEntryId && !latestPingByEntry.has(p.timeEntryId)) {
        latestPingByEntry.set(p.timeEntryId, {
          lat: p.lat,
          lng: p.lng,
          createdAt: p.createdAt,
        });
      }
    }

    const now = Date.now();
    const users = await Promise.all(
      entries.map(async (e) => {
        const durationMs = now - new Date(e.startedAt).getTime();
        const ping = latestPingByEntry.get(e.id);
        const address = ping ? await reverseGeocode(ping.lat, ping.lng) : null;
        return {
          userId: e.userId,
          name: profileMap.get(e.userId) ?? "—",
          projectId: e.projectId ?? null,
          startedAt: e.startedAt,
          durationFormatted: formatDuration(durationMs),
          durationMinutes: Math.floor(durationMs / 60000),
          address: address ?? null,
          location: ping ? `${ping.lat.toFixed(4)}, ${ping.lng.toFixed(4)}` : null,
          lastPingAt: ping?.createdAt ?? null,
        };
      })
    );

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [TIME-ENTRIES-CHECKED-IN] Error:", error);
    return new Response(
      JSON.stringify({ users: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};
