import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { invoiceId, catalogItemId, quantity = 1, customDescription } = await request.json();

    if (!invoiceId || !catalogItemId) {
      return new Response(
        JSON.stringify({ error: "Invoice ID and catalog item ID are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        id,
        createdBy,
        projects (
          id,
          authorId
        )
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this invoice
    const hasAccess =
      invoice.createdBy === currentUser.id || invoice.projects?.[0]?.authorId === currentUser.id;

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the catalog item details
    const { data: catalogItem, error: catalogError } = await supabase
      .from("lineItemsCatalog")
      .select("*")
      .eq("id", parseInt(catalogItemId))
      .single();

    if (catalogError || !catalogItem) {
      console.error("❌ [ADD-CATALOG-ITEM] Error fetching catalog item:", catalogError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Catalog item not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get current invoice to update its catalogLineItems
    const { data: currentInvoice, error: invoiceFetchError } = await supabase
      .from("invoices")
      .select("catalogLineItems")
      .eq("id", parseInt(invoiceId))
      .single();

    if (invoiceFetchError || !currentInvoice) {
      console.error("❌ [ADD-CATALOG-ITEM] Error fetching invoice:", invoiceFetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invoice not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add new catalog item to the line items array
    const currentLineItems = currentInvoice.catalogLineItems || [];
    const newLineItem = {
      catalogItemId: parseInt(catalogItemId),
      quantity: 1,
      unitPrice: catalogItem.unitPrice || 0,
      description: catalogItem.name || "",
      details: catalogItem.description || "",
    };
    const updatedLineItems = [...currentLineItems, newLineItem];

    const { error: updateError } = await supabase
      .from("invoices")
      .update({ catalogLineItems: updatedLineItems })
      .eq("id", parseInt(invoiceId));

    if (updateError) {
      console.error("❌ [ADD-CATALOG-ITEM] Error updating invoice:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to add line item to invoice",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const createdItem = {
      id: catalogItem.id,
      name: catalogItem.name,
      description: customDescription || catalogItem.description,
      unitPrice: catalogItem.unitPrice,
      category: catalogItem.category,
    };

    return new Response(
      JSON.stringify({
        success: true,
        lineItem: createdItem,
        message: "Line item added successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Add catalog item to invoice error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
