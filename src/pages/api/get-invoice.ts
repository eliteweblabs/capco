import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] get-invoice.ts accessed - may be unused");

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log("API: Fetching invoice with ID:", id);

    // Get invoice with project data
    if (!supabase) {
      throw new Error("Supabase client not available");
    }
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
      `
      )
      .eq("id", id)
      .single();

    // console.log("API: Invoice query result:", { invoice, invoiceError });

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
        }
      );
    }

    // Get catalog line items directly from the stored data
    const lineItems = invoice?.catalog_line_items || [];

    // Lookup client profile for name/email
    let client = null as null | { name: string | null; email: string | null };
    if (invoice?.projects?.author_id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, email")
          .eq("id", invoice.projects.author_id)
          .single();
        client = {
          name: profile?.company_name || null,
          email: profile?.email || null,
        };
      } catch (_) {
        client = null;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice,
        lineItems: lineItems || [],
        project: invoice.projects, // Extract project data for easier access
        client,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
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
      }
    );
  }
};
