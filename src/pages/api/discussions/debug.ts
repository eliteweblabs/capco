import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Debug endpoint to check discussion data
 */

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [DISCUSSIONS-DEBUG] Checking discussion data");

    // Get all discussions (limit 10 for debugging)
    const { data: allDiscussions, error: allError } = await supabaseAdmin
      .from("discussion")
      .select("*")
      .limit(10)
      .order("createdAt", { ascending: false });

    // Also try with snake_case column names
    const { data: allDiscussionsSnake, error: allErrorSnake } = await supabaseAdmin
      .from("discussion")
      .select("*")
      .limit(10)
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("❌ [DISCUSSIONS-DEBUG] Error fetching discussions (camelCase):", allError);
    }

    if (allErrorSnake) {
      console.error(
        "❌ [DISCUSSIONS-DEBUG] Error fetching discussions (snake_case):",
        allErrorSnake
      );
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("discussion")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ [DISCUSSIONS-DEBUG] Error fetching count:", countError);
    }

    // Get recent discussions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentDiscussions, error: recentError } = await supabaseAdmin
      .from("discussion")
      .select("*")
      .gte("createdAt", sevenDaysAgo.toISOString())
      .limit(5);

    if (recentError) {
      console.error("❌ [DISCUSSIONS-DEBUG] Error fetching recent discussions:", recentError);
    }

    const debugInfo = {
      success: true,
      total_count: totalCount || 0,
      recent_7_days: recentDiscussions?.length || 0,
      sample_discussions: allDiscussions || [],
      sample_discussions_snake: allDiscussionsSnake || [],
      recent_discussions: recentDiscussions || [],
      camelCase_error: allError?.message || null,
      snake_case_error: allErrorSnake?.message || null,
      timestamp: new Date().toISOString(),
    };

    console.log("🔍 [DISCUSSIONS-DEBUG] Debug info:", debugInfo);

    return new Response(JSON.stringify(debugInfo), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS-DEBUG] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
