import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { projectId, lineItems } = await request.json();

    if (!projectId || !lineItems) {
      return new Response(JSON.stringify({ error: "Project ID and line items are required" }), {
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

    // Find the most recent proposal invoice for this project
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id")
      .eq("project_id", parseInt(projectId))
      .eq("status", "proposal")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error finding proposal invoice:", invoiceError);
      return new Response(JSON.stringify({ error: "Proposal invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Found proposal invoice:", invoice.id);

    // Extract catalog item IDs from line items
    const catalogItemIds = lineItems
      .map((item: any) => item.catalog_item_id || item.id)
      .filter((id: any) => id && !isNaN(parseInt(id)))
      .map((id: any) => parseInt(id));

    // Update invoice with catalog item IDs
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ catalog_item_ids: catalogItemIds })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Error updating line items:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save line items" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Successfully updated line items for invoice:", invoice.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Line items updated successfully",
        invoiceId: invoice.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update invoice line items API error:", error);
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
