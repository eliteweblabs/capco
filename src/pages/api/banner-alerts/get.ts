import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Banner Alerts GET API
 *
 * GET /api/banner-alerts/get
 * Query params:
 * - active: boolean (default: true) - Only return active banners
 * - all: boolean - Return all banners (admin only)
 *
 * Returns active banner alerts that should be displayed
 */
export const GET: APIRoute = async ({ request }): Promise<Response> => {
  try {
    if (!supabaseAdmin) {
      console.error("Supabase admin client not initialized");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "true";
    const activeOnly = url.searchParams.get("active") !== "false";

    let query = supabaseAdmin.from("bannerAlerts").select("*");

    if (!showAll && activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq("isactive", true)
        .or(`startdate.is.null,startdate.lte.${now}`)
        .or(`enddate.is.null,enddate.gte.${now}`);
    }

    query = query.order("createdat", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("❌ [BANNER-ALERTS] Error fetching banner alerts:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch banner alerts" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        banners: data || [],
        count: data?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [BANNER-ALERTS] Error in get API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
