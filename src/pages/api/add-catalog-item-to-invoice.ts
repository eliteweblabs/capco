import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, user } = await checkAuth(cookies);
    if (!isAuth || !user) {
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
    const hasAccess = invoice.created_by === user.id || invoice.projects?.author_id === user.id;

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use the database function to create the line item
    const { data: lineItemId, error } = await supabase.rpc("create_line_item_from_catalog", {
      p_invoice_id: parseInt(invoice_id),
      p_catalog_item_id: parseInt(catalog_item_id),
      p_quantity: parseFloat(quantity),
      p_custom_description: custom_description || null,
    });

    if (error) {
      console.error("Error creating line item from catalog:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to add catalog item to invoice",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the created line item to return it
    const { data: createdItem, error: fetchError } = await supabase
      .from("invoice_line_items")
      .select(
        `
        *,
        line_items_catalog (
          name,
          category
        )
      `
      )
      .eq("id", lineItemId)
      .single();

    if (fetchError) {
      console.error("Error fetching created line item:", fetchError);
      // Item was created successfully, just return basic info
      return new Response(
        JSON.stringify({
          success: true,
          line_item_id: lineItemId,
          message: "Line item added successfully",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
