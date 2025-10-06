import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] get-invoice-details.ts accessed - may be unused");

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log("🔍 [GET-INVOICE-DETAILS] Fetching invoice details for ID:", id);

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
          authorId
        )
      `
      )
      .eq("id", id)
      .single();

    if (invoiceError) {
      console.error("❌ [GET-INVOICE-DETAILS] Error fetching invoice:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch invoice", details: invoiceError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("✅ [GET-INVOICE-DETAILS] Found invoice:", invoice.id);

    return new Response(JSON.stringify({ success: true, invoice }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [GET-INVOICE-DETAILS] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
