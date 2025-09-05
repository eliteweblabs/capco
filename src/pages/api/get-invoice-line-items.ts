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

    console.log("🔍 [GET-INVOICE-LINE-ITEMS] Fetching line items for invoice ID:", invoiceId);

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

    // Get line items for the invoice
    const { data: lineItems, error } = await supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", parseInt(invoiceId))
      .order("sort_order", { ascending: true });

    console.log("🔍 [GET-INVOICE-LINE-ITEMS] Query result:", { lineItems, error });

    if (error) {
      console.error("❌ [GET-INVOICE-LINE-ITEMS] Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ [GET-INVOICE-LINE-ITEMS] Found line items:", lineItems?.length || 0);

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
