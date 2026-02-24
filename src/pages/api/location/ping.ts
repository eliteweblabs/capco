/**
 * Location Ping API
 * Called periodically by the client while checked in. Stores lat/lng for live dashboard and billing session.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface PingRequest {
  timeEntryId: number;
  lat: number;
  lng: number;
  accuracy?: number;
  projectId?: number | null;
}

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = (currentUser as any)?.profile?.role;
    if (role !== "Admin" && role !== "Staff") {
      return new Response(JSON.stringify({ error: "Admin or Staff role required" }), {
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

    const body: PingRequest = await request.json();
    const { timeEntryId, lat, lng, accuracy, projectId } = body;

    if (
      typeof timeEntryId !== "number" ||
      typeof lat !== "number" ||
      typeof lng !== "number"
    ) {
      return new Response(
        JSON.stringify({ error: "timeEntryId, lat, and lng are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify this time entry belongs to the current user and is still active
    const { data: entry, error: entryError } = await supabaseAdmin
      .from("timeEntries")
      .select("id, projectId")
      .eq("id", timeEntryId)
      .eq("userId", currentUser.id)
      .is("endedAt", null)
      .single();

    if (entryError || !entry) {
      return new Response(
        JSON.stringify({ error: "Invalid or ended time entry" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await supabaseAdmin.from("locationPings").insert({
      userId: currentUser.id,
      timeEntryId: entry.id,
      projectId: projectId ?? entry.projectId ?? null,
      lat,
      lng,
      accuracy: accuracy ?? null,
    });

    if (insertError) {
      console.error("❌ [LOCATION-PING] Error inserting ping:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record location", details: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [LOCATION-PING] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
