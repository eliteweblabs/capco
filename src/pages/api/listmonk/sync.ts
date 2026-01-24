/**
 * Sync Supabase Profiles to Listmonk Subscribers
 * This endpoint syncs your existing user base to Listmonk
 */
import type { APIRoute } from "astro";
import { listmonk } from "../../../lib/listmonk";
import { checkAuth } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication - Admin only
    const { currentUser, session, supabase } = await checkAuth(cookies);
    if (!session || !currentUser || currentUser?.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { mode = "bulk", profileId } = body;

    if (mode === "single" && profileId) {
      // Sync single profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, name, role, phone")
        .eq("id", profileId)
        .single();

      if (error || !profile) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await listmonk.sync.profile(profile);

      return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Bulk sync all profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, name, role, phone")
        .not("email", "is", null);

      if (error || !profiles) {
        return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await listmonk.sync.bulkProfiles(profiles);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error syncing profiles:", error);
    return new Response(JSON.stringify({ error: "Failed to sync profiles" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
