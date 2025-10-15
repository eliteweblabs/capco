import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Payments GET API
 * Fetches payments with optional filtering by invoiceId, projectId, or userId
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const invoiceId = url.searchParams.get("invoiceId");
    const projectId = url.searchParams.get("projectId");
    const userId = url.searchParams.get("userId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortBy = url.searchParams.get("sortBy") || "paymentDate";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? true : false;
    const includeTotal = url.searchParams.get("includeTotal") === "true";

    // Build query
    let query = supabaseAdmin
      .from("payments")
      .select("*", { count: includeTotal ? "exact" : undefined })
      .order(sortBy, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (invoiceId) {
      query = query.eq("invoiceId", invoiceId);
    }
    if (projectId) {
      query = query.eq("projectId", projectId);
    }
    if (userId) {
      query = query.eq("createdBy", userId);
    }

    // Apply role-based filtering
    const userRole = currentUser.profile?.role;
    if (userRole === "Client") {
      // Clients can only see payments for their own projects
      query = query.eq("createdBy", currentUser.id);
    }
    // Admin and Staff can see all payments (no additional filtering)

    const { data: payments, error, count } = await query;

    if (error) {
      console.error("Error fetching payments:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch payments" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hasMore = includeTotal ? (count || 0) > offset + limit : payments.length === limit;

    return new Response(
      JSON.stringify({
        payments: payments || [],
        pagination: {
          limit,
          offset,
          total: count,
          hasMore,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in payments GET API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
