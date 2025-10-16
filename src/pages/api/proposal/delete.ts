import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Proposal DELETE API
 * 
 * Query Parameters:
 * - id: Invoice ID to delete
 * 
 * Example:
 * - DELETE /api/proposal/delete?id=123
 */

export const DELETE: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Get invoice ID
    const id = url.searchParams.get("id");
    if (!id) {
      return createErrorResponse("Invoice ID is required", 400);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Check if invoice exists and get its status
    const { data: invoice, error: checkError } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", id)
      .single();

    if (checkError) {
      return createErrorResponse("Invoice not found", 404);
    }

    // Don't allow deleting paid invoices
    if (invoice.status === "paid") {
      return createErrorResponse("Cannot delete paid invoices", 400);
    }

    // Delete the invoice
    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return createErrorResponse("Failed to delete invoice", 500);
    }

    return createSuccessResponse({
      message: "Invoice deleted successfully",
      id,
    });
  } catch (error) {
    console.error("❌ [PROPOSAL-DELETE] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
