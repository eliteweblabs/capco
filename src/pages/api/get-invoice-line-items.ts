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

    // Get catalog item IDs from the invoice's catalog_item_ids JSONB field
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("catalog_item_ids")
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

    const catalogItemIds = invoice?.catalog_item_ids || [];

    // Fetch the actual catalog items
    let lineItems: any[] = [];
    if (catalogItemIds.length > 0) {
      const { data: catalogItems, error: catalogError } = await supabase
        .from("line_items_catalog")
        .select("*")
        .in("id", catalogItemIds);

      if (catalogError) {
        console.error("❌ [GET-INVOICE-LINE-ITEMS] Catalog error:", catalogError);
        return new Response(
          JSON.stringify({
            success: false,
            error: catalogError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      lineItems = catalogItems || [];
    }

    console.log("🔍 [GET-INVOICE-LINE-ITEMS] Query result:", { lineItems });

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
