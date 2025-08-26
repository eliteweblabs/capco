import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    // Test if invoices table exists
    const { data: invoicesTest, error: invoicesError } = await supabase
      .from("invoices")
      .select("id")
      .limit(1);

    // Test if invoice_line_items table exists
    const { data: lineItemsTest, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select("id")
      .limit(1);

    return new Response(
      JSON.stringify({
        success: true,
        invoices_table: {
          exists: !invoicesError,
          error: invoicesError?.message || null,
        },
        line_items_table: {
          exists: !lineItemsError,
          error: lineItemsError?.message || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test invoice tables error:", error);
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
