import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";
import { apiCache } from "../../../../lib/api-cache";

/**
 * Standardized Line Items UPSERT API
 * 
 * POST Body:
 * For updating invoice line items:
 * - invoiceId: number
 * - lineItems: Array<{ catalogItemId: number, quantity: number, unitPrice: number }>
 * - subject?: string
 * - notes?: string
 * 
 * For adding catalog item to invoice:
 * - invoiceId: number
 * - catalogItemId: number
 * - quantity?: number
 * - customDescription?: string
 * 
 * For creating/updating catalog item:
 * - id?: number (if updating)
 * - name: string
 * - description: string
 * - unitPrice: number
 * - category?: string
 * - isActive?: boolean
 * 
 * Examples:
 * - Update invoice items: POST /api/proposal/lineitems/upsert { invoiceId: 123, lineItems: [...] }
 * - Add catalog item: POST /api/proposal/lineitems/upsert { invoiceId: 123, catalogItemId: 456 }
 * - Create catalog item: POST /api/proposal/lineitems/upsert { name: "Item", description: "...", unitPrice: 100 }
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    const body = await request.json();
    const {
      // Invoice line items fields
      invoiceId,
      lineItems,
      subject,
      notes,
      // Catalog item fields
      catalogItemId,
      quantity = 1,
      customDescription,
      // New catalog item fields
      id,
      name,
      description,
      unitPrice,
      category,
      isActive,
    } = body;

    // Handle updating invoice line items
    if (invoiceId && lineItems) {
      // Process line items data
      const lineItemsData = lineItems.map((item: any) => ({
        catalogItemId: item.catalogItemId || item.id,
        quantity: item.quantity || 1,
        unitPrice: item.price || item.unitPrice || 0,
        name: item.name || "",
        description: item.description || "",
      }));

      // Update invoice
      const updateData: any = { catalogLineItems: lineItemsData };
      if (subject) updateData.subject = subject;
      if (notes !== undefined) updateData.proposalNotes = notes;

      const { error: updateError } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", parseInt(invoiceId));

      if (updateError) {
        return createErrorResponse("Failed to update line items", 500);
      }

      return createSuccessResponse({
        message: "Line items updated successfully",
        invoiceId,
      });
    }

    // Handle adding catalog item to invoice
    if (invoiceId && catalogItemId) {
      // Get catalog item details
      const { data: catalogItem, error: catalogError } = await supabase
        .from("lineItemsCatalog")
        .select("*")
        .eq("id", parseInt(catalogItemId))
        .single();

      if (catalogError || !catalogItem) {
        return createErrorResponse("Catalog item not found", 404);
      }

      // Get current invoice line items
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("catalogLineItems")
        .eq("id", parseInt(invoiceId))
        .single();

      if (invoiceError) {
        return createErrorResponse("Failed to fetch invoice", 500);
      }

      // Add new line item
      const currentLineItems = invoice?.catalogLineItems || [];
      const newLineItem = {
        catalogItemId: parseInt(catalogItemId),
        quantity,
        unitPrice: catalogItem.unitPrice || 0,
        description: catalogItem.name || "",
        details: customDescription || catalogItem.description || "",
      };

      const { error: updateError } = await supabase
        .from("invoices")
        .update({ catalogLineItems: [...currentLineItems, newLineItem] })
        .eq("id", parseInt(invoiceId));

      if (updateError) {
        return createErrorResponse("Failed to add line item", 500);
      }

      return createSuccessResponse({
        message: "Line item added successfully",
        lineItem: {
          id: catalogItem.id,
          name: catalogItem.name,
          description: customDescription || catalogItem.description,
          unitPrice: catalogItem.unitPrice,
          category: catalogItem.category,
        },
      });
    }

    // Handle creating/updating catalog item (Admin/Staff only)
    if (name && description && unitPrice !== undefined) {
      if (!["Admin", "Staff"].includes(currentRole || "")) {
        return createErrorResponse("Admin/Staff access required", 403);
      }

      const catalogData = {
        name: name.trim(),
        description: description.trim(),
        unitPrice: parseFloat(unitPrice.toString()),
        category: category?.trim() || null,
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(id ? {} : { createdBy: currentUser.id }),
      };

      const { data: item, error } = await (id
        ? supabase
            .from("lineItemsCatalog")
            .update(catalogData)
            .eq("id", id)
            .select()
            .single()
        : supabase
            .from("lineItemsCatalog")
            .insert(catalogData)
            .select()
            .single()
      );

      if (error) {
        return createErrorResponse(
          `Failed to ${id ? "update" : "create"} catalog item`,
          500
        );
      }

      // Clear cache
      apiCache.clear();

      return createSuccessResponse({
        message: `Catalog item ${id ? "updated" : "created"} successfully`,
        item,
      });
    }

    return createErrorResponse("Invalid request - missing required fields", 400);
  } catch (error) {
    console.error("❌ [LINEITEMS-UPSERT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
