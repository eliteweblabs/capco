import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Discussions GET API
 *
 * Query Parameters:
 * - id: Get specific discussion by ID
 * - projectId: Filter by project ID
 * - authorId: Filter by author ID
 * - status: Filter by status (open, closed, etc.)
 * - limit: Number of results (default: 20, max: 100)
 * - offset: Number to skip (default: 0)
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: Sort direction (asc/desc, default: desc)
 * - includeTotal: Include total count (true/false, default: false)
 *
 * Examples:
 * - /api/discussions?projectId=123&status=open
 * - /api/discussions?id=456
 * - /api/discussions?authorId=789&limit=10
 */

interface DiscussionFilters {
  id?: string;
  projectId?: string;
  authorId?: string;
  status?: string;
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

    // Parse query parameters
    const filters: DiscussionFilters = {
      id: url.searchParams.get("id") || undefined,
      projectId: url.searchParams.get("projectId") || undefined,
      authorId: url.searchParams.get("authorId") || undefined,
      status: url.searchParams.get("status") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      sortBy: url.searchParams.get("sortBy") || "createdAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
      includeTotal: url.searchParams.get("includeTotal") === "true",
    };

    console.log(`💬 [DISCUSSIONS-GET] Fetching discussions with filters:`, filters);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if requesting specific discussion
    if (filters.id) {
      const { data: discussion, error } = await supabase
        .from("discussion")
        .select("*")
        .eq("id", filters.id)
        .single();

      if (error || !discussion) {
        return new Response(JSON.stringify({ error: "Discussion not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          data: discussion,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple discussions
    let query = supabase!.from("discussion").select("*");

    // Apply filters
    if (filters.projectId) {
      query = query.eq("projectId", filters.projectId);
    }

    if (filters.authorId) {
      query = query.eq("authorId", filters.authorId);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // Apply sorting
    const ascending = filters.sortOrder === "asc";
    query = query.order(filters.sortBy, { ascending });

    // Apply pagination
    query = query.range(filters.offset || 0, filters.offset || 0 + filters.limit || 20 - 1);

    // Get total count if requested
    let totalCount = null;
    if (filters.includeTotal) {
      let countQuery = supabase!.from("discussion").select("*", { count: "exact", head: true });

      if (filters.projectId) {
        countQuery = countQuery.eq("projectId", filters.projectId);
      }
      if (filters.authorId) {
        countQuery = countQuery.eq("authorId", filters.authorId);
      }
      if (filters.status) {
        countQuery = countQuery.eq("status", filters.status);
      }

      const { count } = await countQuery;
      totalCount = count;
    }

    // Execute query
    const { data: discussions, error } = await query;

    if (error) {
      console.error("❌ [DISCUSSIONS-GET] Error fetching discussions:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch discussions",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasMore = discussions.length === filters.limit || 20;

    return new Response(
      JSON.stringify({
        success: true,
        discussions: discussions || [],
        pagination: {
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          total: totalCount,
          hasMore,
        },
        filters: {
          projectId: filters.projectId,
          authorId: filters.authorId,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS-GET] Unexpected error:", error);
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
