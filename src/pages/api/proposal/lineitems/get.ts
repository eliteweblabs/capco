import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";
import { apiCache } from "../../../../lib/api-cache";

/**
 * Standardized Line Items GET API
 * 
 * Query Parameters:
 * - invoiceId: Get line items for specific invoice
 * - id: Get specific catalog item
 * - ids: Get multiple catalog items (comma-separated)
 * - search: Search catalog items
 * - category: Filter by category
 * - limit: Max items to return (default: 20)
 * 
 * Examples:
 * - /api/proposal/lineitems/get?invoiceId=123
 * - /api/proposal/lineitems/get?id=456
 * - /api/proposal/lineitems/get?search=sprinkler&category=design
 */

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth } = await checkAuth(cookies);
    if (!isAuth) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Get query parameters
    const invoiceId = url.searchParams.get("invoiceId");
    const id = url.searchParams.get("id");
    const ids = url.searchParams.get("ids");
    const searchTerm = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

    // Handle invoice line items request
    if (invoiceId) {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("catalogLineItems")
        .eq("id", parseInt(invoiceId))
        .single();

      if (invoiceError) {
        return createErrorResponse("Failed to fetch invoice line items", 500);
      }

      return createSuccessResponse({
        lineItems: invoice?.catalogLineItems || [],
      });
    }

    // Check cache for catalog searches
    const cacheKey = `catalog-items-${searchTerm}-${category}-${limit}-${ids}`;
    const cached = apiCache.get(cacheKey);
    if (cached && !ids && !id) {
      return createSuccessResponse({ items: cached, cached: true });
    }

    // Build catalog query
    let query = supabase.from("lineItemsCatalog").select("*");

    // Handle specific item request
    if (id) {
      const itemId = parseInt(id);
      if (isNaN(itemId)) {
        return createErrorResponse("Invalid ID format", 400);
      }
      query = query.eq("id", itemId);
    }
    // Handle multiple items request
    else if (ids) {
      const idArray = ids
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (idArray.length === 0) {
        return createSuccessResponse({ items: [] });
      }
      query = query.in("id", idArray);
    }
    // Handle catalog search
    else {
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (category) {
        query = query.eq("category", category);
      }
      query = query.eq("isActive", true);
      query = query.limit(limit).order("name", { ascending: true });
    }

    const { data: items, error } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch catalog items", 500);
    }

    // Cache catalog search results
    if (!id && !ids) {
      apiCache.set(cacheKey, items, 10);
    }

    // Return single item or list
    if (id) {
      const item = items && items.length > 0 ? items[0] : null;
      return createSuccessResponse({ item });
    }

    return createSuccessResponse({ items: items || [] });
  } catch (error) {
    console.error("❌ [LINEITEMS-GET] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
