import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

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

    const { invoice_id, catalog_item_id, quantity = 1, custom_description } = await request.json();

    if (!invoice_id || !catalog_item_id) {
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
        created_by,
        projects (
          id,
          author_id
        )
      `
      )
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this invoice
    const hasAccess =
      invoice.created_by === currentUser.id || invoice.projects?.[0]?.author_id === currentUser.id;

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the catalog item details
    const { data: catalogItem, error: catalogError } = await supabase
      .from("line_items_catalog")
      .select("*")
      .eq("id", parseInt(catalog_item_id))
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

    // Get current invoice to update its catalog_item_ids
    const { data: currentInvoice, error: invoiceFetchError } = await supabase
      .from("invoices")
      .select("catalog_item_ids")
      .eq("id", parseInt(invoice_id))
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

    // Update invoice with new catalog item ID
    const currentCatalogIds = currentInvoice.catalog_item_ids || [];
    const updatedCatalogIds = [...currentCatalogIds, parseInt(catalog_item_id)];

    const { error: updateError } = await supabase
      .from("invoices")
      .update({ catalog_item_ids: updatedCatalogIds })
      .eq("id", parseInt(invoice_id));

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
      description: custom_description || catalogItem.description,
      unit_price: catalogItem.unit_price,
      category: catalogItem.category,
    };

    return new Response(
      JSON.stringify({
        success: true,
        line_item: createdItem,
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
