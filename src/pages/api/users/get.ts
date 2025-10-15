import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Users GET API
 *
 * Query Parameters:
 * - id: Get specific user by ID
 * - role: Filter by role (Admin, Staff, Client)
 * - search: Search across firstName, lastName, companyName, email
 * - limit: Number of results (default: 20, max: 100)
 * - offset: Number to skip (default: 0)
 * - sortBy: Sort field (default: companyName)
 * - sortOrder: Sort direction (asc/desc, default: asc)
 * - includeTotal: Include total count (true/false, default: false)
 *
 * Examples:
 * - /api/users?role=Client&search=company&limit=10
 * - /api/users?id=123
 * - /api/users?role=Admin&sortBy=firstName&sortOrder=asc
 */

interface UserFilters {
  id?: string;
  role?: string;
  search?: string;
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
    const filters: UserFilters = {
      id: url.searchParams.get("id") || undefined,
      role: url.searchParams.get("role") || "Client",
      search: url.searchParams.get("search") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      sortBy: url.searchParams.get("sortBy") || "companyName",
      sortOrder: url.searchParams.get("sortOrder") || "asc",
      includeTotal: url.searchParams.get("includeTotal") === "true",
    };

    console.log(`📡 [USERS-GET] Fetching users with filters:`, filters);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if requesting specific user
    if (filters.id) {
      const { data: user, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", filters.id)
        .single();

      if (error || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          data: user,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple users
    let query = supabase!.from("profiles").select("*");

    // Apply filters
    if (filters.role) {
      // Handle multiple roles (comma-separated)
      if (filters.role.includes(",")) {
        const roles = filters.role.split(",").map(r => r.trim());
        query = query.in("role", roles);
      } else {
        query = query.eq("role", filters.role);
      }
    }

    if (filters.search) {
      query = query.or(
        `firstName.ilike.%${filters.search}%,lastName.ilike.%${filters.search}%,companyName.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    // Apply sorting
    const ascending = filters.sortOrder === "asc";
    query = query.order(filters.sortBy, { ascending });

    // Apply pagination
    query = query.range(filters.offset || 0, filters.offset || 0 + filters.limit || 20 - 1);

    // Get total count if requested
    let totalCount = null;
    if (filters.includeTotal) {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", filters.role || "Client");
      totalCount = count;
    }

    // Execute query
    const { data: users, error } = await query;

    if (error) {
      console.error("❌ [USERS-GET] Error fetching users:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch users",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasMore = users.length === filters.limit || 20;

    return new Response(
      JSON.stringify({
        data: users || [],
        pagination: {
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          total: totalCount,
          hasMore,
        },
        filters: {
          role: filters.role,
          search: filters.search,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [USERS-GET] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
