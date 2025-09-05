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

    // Delete existing line items
    const { error: deleteError } = await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", invoice.id);

    if (deleteError) {
      console.error("Error deleting existing line items:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete existing line items" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert new line items
    const lineItemInserts = lineItems.map((item: any, index: number) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity || 1,
      unit_price: item.price || item.unit_price || 0,
      total_price: (item.quantity || 1) * (item.price || item.unit_price || 0),
      sort_order: index + 1,
    }));

    const { error: insertError } = await supabase
      .from("invoice_line_items")
      .insert(lineItemInserts);

    if (insertError) {
      console.error("Error inserting new line items:", insertError);
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
