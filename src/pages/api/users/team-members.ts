import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Get team members (profiles with same companyName as current user).
 * Returns minimal profile data for display. Excludes current user.
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database unavailable" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const profile = currentUser.profile;
    const companyName = profile?.companyName?.trim();
    const userId = currentUser.id;

    if (!companyName) {
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: "No company name set",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, firstName, lastName, role, avatarUrl, email")
      .eq("companyName", companyName)
      .neq("id", userId)
      .order("firstName", { ascending: true });

    if (error) {
      console.error("[team-members] Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const members = (data || []).map((p) => ({
      id: p.id,
      name: [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unknown",
      role: p.role || undefined,
      avatarUrl: p.avatarUrl || null,
      email: p.email || undefined,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: members,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[team-members] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
