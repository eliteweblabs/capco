import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { itemId, invoiceId } = await request.json();

    if (!itemId || !invoiceId) {
      return new Response(JSON.stringify({ error: "Line item ID and invoice ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Deleting line item:", itemId, "from invoice:", invoiceId);

    // Get current invoice
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("catalogLineItems")
      .eq("id", parseInt(invoiceId))
      .single();

    if (fetchError || !invoice) {
      console.error("Error fetching invoice:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Invoice not found",
          details: fetchError?.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Remove the line item from the array
    const currentLineItems = invoice.catalogLineItems || [];
    const updatedLineItems = currentLineItems.filter(
      (item: any) => item.catalog_item_id !== parseInt(itemId)
    );

    // Update the invoice
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ catalogLineItems: updatedLineItems })
      .eq("id", parseInt(invoiceId));

    if (updateError) {
      console.error("Error updating invoice:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete line item",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Line item deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Delete line item API error:", error);
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
