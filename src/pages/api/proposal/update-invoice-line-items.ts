import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { invoiceId, lineItems, subject, notes } = await request.json();

    console.log("📝 [API] Received request:", { invoiceId, lineItems, subject, notes });

    if (!invoiceId || !lineItems) {
      return new Response(JSON.stringify({ error: "Invoice ID and line items are required" }), {
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

    // Ensure invoiceId is an integer
    const invoiceIdInt = parseInt(invoiceId);
    if (isNaN(invoiceIdInt)) {
      return new Response(JSON.stringify({ error: "Invalid invoice ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Using invoice ID:", invoiceIdInt);

    // Store complete line item data as JSONB array to preserve pricing
    const lineItemsData = lineItems.map((item: any) => ({
      catalogItemId: item.catalogItemId || item.id,
      quantity: item.quantity || 1,
      unitPrice: item.price || item.unitPrice || 0,
      name: item.name || "",
      description: item.description || "",
    }));

    console.log("📝 [API] Line items received:", lineItems);
    console.log("📝 [API] Processed line items data:", lineItemsData);

    // Update invoice with complete catalog line items data and subject
    console.log(
      "📝 [API] Updating invoice",
      invoiceIdInt,
      "with catalogLineItems:",
      lineItemsData,
      "and subject:",
      subject
    );

    const updateData: any = { catalogLineItems: lineItemsData };
    if (subject) {
      updateData.subject = subject;
    }
    if (notes !== undefined) {
      updateData.proposalNotes = notes;
    }

    console.log("📝 [API] About to update invoice with data:", JSON.stringify(updateData, null, 2));

    const { error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceIdInt);

    if (updateError) {
      console.error("❌ [API] Error updating line items:", updateError);
      console.error("❌ [API] Update data that failed:", updateData);
      console.error("❌ [API] Invoice ID:", invoiceIdInt);
      return new Response(
        JSON.stringify({
          error: "Failed to save line items",
          details: updateError.message,
          updateData: updateData,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ [API] Successfully updated line items for invoice:", invoiceIdInt);

    // Verify the update by reading back the data
    const { data: updatedInvoice, error: verifyError } = await supabase
      .from("invoices")
      .select("catalogLineItems, subject")
      .eq("id", invoiceIdInt)
      .single();

    if (verifyError) {
      console.error("❌ [API] Error verifying update:", verifyError);
    } else {
      console.log(
        "✅ [API] Verified update - catalogLineItems:",
        updatedInvoice.catalogLineItems,
        "subject:",
        updatedInvoice.subject
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Line items updated successfully",
        invoiceId: invoiceIdInt,
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
