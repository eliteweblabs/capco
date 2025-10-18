import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Proposal GET API
 *
 * Query Parameters:
 * - id: Get specific invoice by ID
 * - projectId: Get invoice by project ID
 * - status: Filter by status (e.g., "proposal")
 * - includeProject: Include project data (default: true)
 * - includeClient: Include client profile data (default: true)
 * - includeLineItems: Include line items (default: true)
 *
 * Examples:
 * - /api/proposal/get?id=123
 * - /api/proposal/get?projectId=456&status=proposal
 */

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Get query parameters
    const id = url.searchParams.get("id");
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const includeProject = url.searchParams.get("includeProject") !== "false";
    const includeClient = url.searchParams.get("includeClient") !== "false";
    const includeLineItems = url.searchParams.get("includeLineItems") !== "false";

    // Validate parameters
    if (!id && !projectId) {
      return createErrorResponse("Either invoice ID or project ID is required", 400);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Build base query
    let query = supabase.from("invoices").select(`
      *${
        includeProject
          ? `,
      projects (
        id,
        title,
        address,
        description,
        sqFt,
        status,
        authorId
      )`
          : ""
      }
    `);

    // Apply filters
    if (id) {
      query = query.eq("id", id);
    }
    if (projectId) {
      query = query.eq("projectId", projectId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Get invoice(s)
    const { data: invoices, error: invoiceError } = await (id || projectId
      ? query.single()
      : query);

    if (invoiceError) {
      // Handle "no rows found" case
      if (invoiceError.code === "PGRST116") {
        return createSuccessResponse({ invoice: null }, "No invoice found");
      }
      return createErrorResponse("Failed to fetch invoice", 500);
    }

    // For single invoice queries
    if (id || projectId) {
      const invoice = invoices;
      if (!invoice) {
        return createErrorResponse("Invoice not found", 404);
      }

      // Get line items if requested
      const lineItems = includeLineItems ? (invoice as any)?.lineItems || [] : [];

      // Get client profile if requested
      let client = null;
      if (includeClient && (invoice as any)?.project?.authorId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("companyName, email")
          .eq("id", (invoice as any)?.project?.authorId)
          .single();

        if (profile) {
          client = {
            name: profile.companyName || null,
            email: profile.email || null,
          };
        }
      }

      return createSuccessResponse({
        invoice,
        lineItems,
        project: includeProject ? (invoice as any)?.project : undefined,
        client: includeClient ? client : undefined,
      });
    }

    // For multiple invoices
    return createSuccessResponse({
      invoices: invoices as any,
      count: (invoices as any)?.length || 0,
    });
  } catch (error) {
    console.error("❌ [PROPOSAL-GET] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
