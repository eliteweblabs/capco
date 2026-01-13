import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Global Activity Feed API
 *
 * Query Parameters:
 * - limit: Number of results (default: 20, max: 100)
 * - offset: Number to skip (default: 0)
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: Sort direction (asc/desc, default: desc)
 * - includeTotal: Include total count (true/false, default: false)
 *
 * Examples:
 * - /api/global/activity-feed?limit=10&offset=0
 * - /api/global/activity-feed?sortBy=updatedAt&sortOrder=asc
 */

interface ActivityFilters {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  includeTotal?: boolean;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const filters: ActivityFilters = {
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      sortBy: url.searchParams.get("sortBy") || "createdAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
      includeTotal: url.searchParams.get("includeTotal") === "true",
    };

    console.log(`📡 [GLOBAL-ACTIVITY] Fetching activity feed with filters:`, filters);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get total count if requested
    let totalCount = null;
    if (filters.includeTotal) {
      const { count } = await supabase!
        .from("projects")
        .select("*", { count: "exact", head: true });
      totalCount = count;
    }

    // Build query for activity feed
    let query = supabase!.from("projects").select(`
      id,
      title,
      address,
      status,
      createdAt,
      updatedAt,
      authorId,
      assignedToId,
      authorProfile:profiles!authorId(id, firstName, lastName, companyName),
      assignedToProfile:profiles!assignedToId(id, firstName, lastName, companyName)
    `);

    // Apply sorting
    const ascending = filters.sortOrder === "asc";
    query = query.order(filters.sortBy, { ascending });

    // Apply pagination
    query = query.range(filters.offset || 0, filters.offset || 0 + filters.limit || 20 - 1);

    // Execute query
    const { data: activities, error } = await query;

    if (error) {
      console.error("❌ [GLOBAL-ACTIVITY] Error fetching activity feed:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch activity feed",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasMore = activities.length === filters.limit || 20;

    return new Response(
      JSON.stringify({
        data: activities || [],
        pagination: {
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          total: totalCount,
          hasMore,
        },
        filters: {
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [GLOBAL-ACTIVITY] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
