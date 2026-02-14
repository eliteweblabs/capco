/**
 * API Endpoint: Get Project Defaults
 * Returns default settings for new projects (e.g. due date hours)
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (currentUser.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ defaultDueDateHours: 72 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data } = await supabaseAdmin
      .from("globalSettings")
      .select("value")
      .eq("key", "projectDefaultDueDateHours")
      .maybeSingle();

    const hours = data?.value ? parseInt(data.value, 10) : 72;
    const defaultDueDateHours = Math.min(240, Math.max(1, isNaN(hours) ? 72 : hours));

    return new Response(JSON.stringify({ defaultDueDateHours }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[project-defaults/get] Error:", error);
    return new Response(JSON.stringify({ defaultDueDateHours: 72 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
