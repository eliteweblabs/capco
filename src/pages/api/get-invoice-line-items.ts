import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoiceId");

    if (!invoiceId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invoice ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // // // console.log("🔍 [GET-INVOICE-LINE-ITEMS] Fetching line items for invoice ID:", invoiceId);

    if (!supabase) {
      console.error("❌ [GET-INVOICE-LINE-ITEMS] Database not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get catalog line items from the invoice's catalog_line_items JSONB field
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("catalog_line_items")
      .eq("id", parseInt(invoiceId))
      .single();

    if (invoiceError) {
      console.error("❌ [GET-INVOICE-LINE-ITEMS] Invoice error:", invoiceError);
      return new Response(
        JSON.stringify({
          success: false,
          error: invoiceError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use the stored catalog line items directly (no need to fetch from catalog)
    const lineItems = invoice?.catalog_line_items || [];

    // // // console.log("🔍 [GET-INVOICE-LINE-ITEMS] Query result:", { lineItems });

    // // // console.log("✅ [GET-INVOICE-LINE-ITEMS] Found line items:", lineItems?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        lineItems: lineItems || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [GET-INVOICE-LINE-ITEMS] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
