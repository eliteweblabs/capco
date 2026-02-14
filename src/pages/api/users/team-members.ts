import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Get team members (profiles with teamMember = true).
 * Returns minimal profile data for display.
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth } = await checkAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Database unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, firstName, lastName, role, avatarUrl, email")
      .eq("teamMember", true)
      .order("firstName", { ascending: true });

    if (error) {
      console.error("[team-members] Error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
