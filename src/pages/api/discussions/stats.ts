import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Discussions Stats API
 *
 * Returns statistics about discussions and users
 * - Total discussions
 * - Recent discussions (24h)
 * - Active users (24h)
 * - Total users
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

    console.log("📊 [DISCUSSIONS-STATS] Fetching discussion statistics");

    // Get 24 hours ago timestamp
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log("📊 [DISCUSSIONS-STATS] 24h ago timestamp:", twentyFourHoursAgo.toISOString());

    // Get total discussions count
    const { count: totalDiscussions, error: totalError } = await supabaseAdmin
      .from("discussion")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("❌ [DISCUSSIONS-STATS] Error fetching total discussions:", totalError);
    } else {
      console.log("📊 [DISCUSSIONS-STATS] Total discussions found:", totalDiscussions);
    }

    // Get recent discussions (24h)
    const { count: recentDiscussions, error: recentError } = await supabaseAdmin
      .from("discussion")
      .select("*", { count: "exact", head: true })
      .gte("createdAt", twentyFourHoursAgo.toISOString());

    if (recentError) {
      console.error("❌ [DISCUSSIONS-STATS] Error fetching recent discussions:", recentError);
    } else {
      console.log("📊 [DISCUSSIONS-STATS] Recent discussions (24h):", recentDiscussions);
    }

    // Get unique users who created discussions in the last 24h
    // Try both camelCase and snake_case column names
    let recentUsers = null;
    let usersError = null;

    // Try camelCase first
    const { data: recentUsersCamel, error: usersErrorCamel } = await supabaseAdmin
      .from("discussion")
      .select("authorId")
      .gte("createdAt", twentyFourHoursAgo.toISOString())
      .not("authorId", "is", null);

    if (usersErrorCamel) {
      console.log(
        "📊 [DISCUSSIONS-STATS] camelCase failed, trying snake_case:",
        usersErrorCamel.message
      );
      // Try snake_case
      const { data: recentUsersSnake, error: usersErrorSnake } = await supabaseAdmin
        .from("discussion")
        .select("author_id")
        .gte("created_at", twentyFourHoursAgo.toISOString())
        .not("author_id", "is", null);

      recentUsers = recentUsersSnake;
      usersError = usersErrorSnake;
    } else {
      recentUsers = recentUsersCamel;
      usersError = usersErrorCamel;
    }

    if (usersError) {
      console.error("❌ [DISCUSSIONS-STATS] Error fetching recent users:", usersError);
    } else {
      console.log("📊 [DISCUSSIONS-STATS] Recent users found:", recentUsers?.length || 0);
    }

    // Count unique active users
    const activeUsers24h = recentUsers
      ? new Set(recentUsers.map((u) => u.authorId || u.author_id)).size
      : 0;

    // Get total unique users who have created discussions
    let allUsers = null;
    let allUsersError = null;

    // Try camelCase first
    const { data: allUsersCamel, error: allUsersErrorCamel } = await supabaseAdmin
      .from("discussion")
      .select("authorId")
      .not("authorId", "is", null);

    if (allUsersErrorCamel) {
      console.log(
        "📊 [DISCUSSIONS-STATS] camelCase failed for all users, trying snake_case:",
        allUsersErrorCamel.message
      );
      // Try snake_case
      const { data: allUsersSnake, error: allUsersErrorSnake } = await supabaseAdmin
        .from("discussion")
        .select("author_id")
        .not("author_id", "is", null);

      allUsers = allUsersSnake;
      allUsersError = allUsersErrorSnake;
    } else {
      allUsers = allUsersCamel;
      allUsersError = allUsersErrorCamel;
    }

    if (allUsersError) {
      console.error("❌ [DISCUSSIONS-STATS] Error fetching all users:", allUsersError);
    }

    const totalActiveUsers = allUsers
      ? new Set(allUsers.map((u) => u.authorId || u.author_id)).size
      : 0;

    const stats = {
      total_discussions: totalDiscussions || 0,
      recent_24h: recentDiscussions || 0,
      active_users_24h: activeUsers24h,
      total_active_users: totalActiveUsers,
      // Additional helpful metrics
      discussions_today: recentDiscussions || 0,
      unique_participants: activeUsers24h,
    };

    console.log("📊 [DISCUSSIONS-STATS] Stats calculated:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS-STATS] Unexpected error:", error);
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
