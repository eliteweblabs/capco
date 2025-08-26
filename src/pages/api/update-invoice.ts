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

    // Update or create line items
    if (lineItems && lineItems.length > 0) {
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        const totalPrice = (item.quantity || 0) * (item.unit_price || 0);

        if (item.id) {
          // Update existing line item
          const { error: updateError } = await supabase
            .from("invoice_line_items")
            .update({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: totalPrice,
              sort_order: i + 1,
            })
            .eq("id", item.id);

          if (updateError) {
            console.error("Error updating line item:", updateError);
            return new Response(
              JSON.stringify({
                error: "Failed to update line item",
                details: updateError.message,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        } else {
          // Create new line item
          const { error: createError } = await supabase.from("invoice_line_items").insert({
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: totalPrice,
            sort_order: i + 1,
          });

          if (createError) {
            console.error("Error creating line item:", createError);
            return new Response(
              JSON.stringify({
                error: "Failed to create line item",
                details: createError.message,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }
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
