import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";

/**
 * Standardized Subject GET API
 *
 * Query Parameters:
 * - projectId: Get subject for specific project
 * - search: Search subjects catalog
 * - category: Filter by category
 * - limit: Max items to return (default: 20)
 * - checkColumn: Check if subject column exists (Admin only)
 *
 * Examples:
 * - /api/proposal/subject/get?projectId=123
 * - /api/proposal/subject/get?search=fire&category=design
 * - /api/proposal/subject/get?checkColumn=true
 */

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Handle column check request (Admin/Staff only)
    const checkColumn = url.searchParams.get("checkColumn") === "true";
    if (checkColumn) {
      if (!["Admin", "Staff"].includes(currentRole || "")) {
        return createErrorResponse("Admin access required", 403);
      }

      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "projects")
        .eq("column_name", "subject")
        .single();

      if (error && error.code !== "PGRST116") {
        return createErrorResponse("Failed to check database schema", 500);
      }

      return createSuccessResponse({
        column_exists: !error && data,
        column_info: data,
        message:
          !error && data
            ? "subject column exists"
            : "subject column not found - please verify column exists",
      });
    }

    // Handle project subject request
    const projectId = url.searchParams.get("projectId");
    if (projectId) {
      // Verify project access
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, authorId, title")
        .eq("id", projectId)
        .single();

      if (projectError) {
        return createErrorResponse("Project not found", 404);
      }

      // Check permissions
      const hasAccess =
        project.authorId === currentUser.id || ["Admin", "Staff"].includes(currentRole || "");
      if (!hasAccess) {
        return createErrorResponse("Access denied", 403);
      }

      // Get proposal invoice
      const { data: proposalInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("id, subject, status")
        .eq("projectId", projectId)
        .eq("status", "proposal")
        .single();

      if (invoiceError && invoiceError.code !== "PGRST116") {
        return createErrorResponse("Failed to find proposal invoice", 500);
      }

      return createSuccessResponse({
        subject: proposalInvoice?.subject || null,
        hasProposalInvoice: !!proposalInvoice,
        invoiceId: proposalInvoice?.id || null,
      });
    }

    // Handle subjects catalog request
    const searchTerm = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

    let query = supabase
      .from("subjects")
      .select("id, title, description, category, usageCount, createdAt")
      .eq("isActive", true)
      .order("usageCount", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }

    const { data: subjects, error } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch subjects", 500);
    }

    // Get available categories
    const { data: categories } = await supabase
      .from("subjects")
      .select("category")
      .eq("isActive", true)
      .not("category", "is", null);

    const uniqueCategories = [...new Set(categories?.map((c) => c.category) || [])].sort();

    return createSuccessResponse({
      subjects: subjects || [],
      categories: uniqueCategories,
      total: subjects?.length || 0,
    });
  } catch (error) {
    console.error("❌ [SUBJECT-GET] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
