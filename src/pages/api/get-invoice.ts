import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("API: Fetching invoice with ID:", id);

    // Get invoice with project data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        projects (
          id,
          title,
          address,
          description,
          sq_ft,
          status,
          author_id
        )
      `,
      )
      .eq("id", id)
      .single();

    console.log("API: Invoice query result:", { invoice, invoiceError });

    if (invoiceError) {
      return new Response(
        JSON.stringify({
          error: "Invoice not found",
          details: invoiceError.message,
          code: invoiceError.code,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order", { ascending: true });

    console.log("API: Line items query result:", { lineItems, lineItemsError });

    return new Response(
      JSON.stringify({
        success: true,
        invoice,
        lineItems: lineItems || [],
        project: invoice.projects, // Extract project data for easier access
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get invoice API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
