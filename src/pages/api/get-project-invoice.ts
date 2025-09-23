import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
// // // console.log("🚧 [DEAD-STOP-2024-12-19] get-project-invoice.ts accessed - may be unused");

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
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

    // // // console.log("🔍 [GET-PROJECT-INVOICE] Looking for invoice for project:", projectId);

    // Get invoice by project ID
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
          author_id
        )
      `
      )
      .eq("project_id", projectId)
      .eq("status", "proposal")
      .single();

    if (invoiceError) {
      if (invoiceError.code === "PGRST116") {
        // No rows found - this is expected for new projects
        // // // console.log("ℹ️ [GET-PROJECT-INVOICE] No existing invoice found for project:", projectId);
        return new Response(JSON.stringify({ success: true, invoice: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        console.error("❌ [GET-PROJECT-INVOICE] Error fetching invoice:", invoiceError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch invoice", details: invoiceError.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // // // console.log("✅ [GET-PROJECT-INVOICE] Found existing invoice:", invoice.id);

    return new Response(JSON.stringify({ success: true, invoice }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [GET-PROJECT-INVOICE] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
