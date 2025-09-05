import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { invoiceId, lineItems, notes } = await request.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Updating invoice:", { invoiceId, lineItems, notes });

    // Update invoice notes
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({ notes })
      .eq("id", invoiceId);

    if (invoiceError) {
      console.error("Error updating invoice:", invoiceError);
      return new Response(
        JSON.stringify({
          error: "Failed to update invoice",
          details: invoiceError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update catalog item IDs
    if (lineItems && lineItems.length > 0) {
      const catalogItemIds = lineItems
        .map((item: any) => item.catalog_item_id || item.id)
        .filter((id: any) => id && !isNaN(parseInt(id)))
        .map((id: any) => parseInt(id));

      const { error: lineItemsError } = await supabase
        .from("invoices")
        .update({ catalog_item_ids: catalogItemIds })
        .eq("id", invoiceId);

      if (lineItemsError) {
        console.error("Error updating line items:", lineItemsError);
        return new Response(
          JSON.stringify({
            error: "Failed to update line items",
            details: lineItemsError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invoice updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update invoice API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
