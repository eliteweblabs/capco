import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";
import { apiCache } from "../../../../lib/api-cache";

/**
 * Standardized Line Items DELETE API
 * 
 * Query Parameters:
 * - invoiceId: Invoice ID containing the line item
 * - itemId: Catalog item ID to remove
 * - id: Catalog item ID to delete (Admin only)
 * 
 * Examples:
 * - Remove from invoice: DELETE /api/proposal/lineitems/delete?invoiceId=123&itemId=456
 * - Delete catalog item: DELETE /api/proposal/lineitems/delete?id=789
 */

export const DELETE: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    const invoiceId = url.searchParams.get("invoiceId");
    const itemId = url.searchParams.get("itemId");
    const id = url.searchParams.get("id");

    // Handle removing line item from invoice
    if (invoiceId && itemId) {
      // Get current invoice
      const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("catalogLineItems")
        .eq("id", parseInt(invoiceId))
        .single();

      if (fetchError) {
        return createErrorResponse("Invoice not found", 404);
      }

      // Remove the line item
      const currentLineItems = invoice.catalogLineItems || [];
      const updatedLineItems = currentLineItems.filter(
        (item: any) => item.catalogItemId !== parseInt(itemId)
      );

      // Update invoice
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ catalogLineItems: updatedLineItems })
        .eq("id", parseInt(invoiceId));

      if (updateError) {
        return createErrorResponse("Failed to remove line item", 500);
      }

      return createSuccessResponse({
        message: "Line item removed successfully",
      });
    }

    // Handle deleting catalog item (Admin only)
    if (id) {
      if (!["Admin"].includes(currentRole || "")) {
        return createErrorResponse("Admin access required", 403);
      }

      // Check if item is used in any invoices
      const { data: invoices, error: checkError } = await supabase
        .from("invoices")
        .select("id")
        .contains("catalogLineItems", [{ catalogItemId: parseInt(id) }]);

      if (checkError) {
        return createErrorResponse("Failed to check item usage", 500);
      }

      if (invoices && invoices.length > 0) {
        return createErrorResponse(
          "Cannot delete item - it is used in existing invoices",
          400
        );
      }

      // Delete the catalog item
      const { error: deleteError } = await supabase
        .from("lineItemsCatalog")
        .delete()
        .eq("id", parseInt(id));

      if (deleteError) {
        return createErrorResponse("Failed to delete catalog item", 500);
      }

      // Clear cache
      apiCache.clear();

      return createSuccessResponse({
        message: "Catalog item deleted successfully",
      });
    }

    return createErrorResponse(
      "Invalid request - either invoiceId + itemId or id is required",
      400
    );
  } catch (error) {
    console.error("❌ [LINEITEMS-DELETE] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
