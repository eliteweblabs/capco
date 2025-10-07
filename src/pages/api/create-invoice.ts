import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { projectId, projectData } = await request.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("📡 [API] Auth check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
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

    // Create standardized description for fire protection services
    const standardDescription = `Tier I Fire Sprinkler Design and Fire Alarm Design

Tier I Fire Sprinkler Design
1. Fire Sprinkler Design
2. Hydraulic Calculations
3. Project Narrative
4. NFPA 241 Plan

Tier I Fire Alarm Design
1. Fire Alarm Design
2. Fire Alarm Narrative`;

    // Create invoice with proposal data if provided
    const invoiceData = {
      projectId: parseInt(projectId),
      status: projectData?.status || "draft",
      subject: projectData?.subject || null,
      invoiceDate: projectData?.date || new Date().toISOString().split("T")[0],
      notes: projectData?.notes || null,
      proposalNotes: projectData?.notes || null, // Add proposalNotes field
      taxRate: 0.0,
      createdBy: user.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
    };

    console.log("Creating invoice with data:", invoiceData);

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      return new Response(
        JSON.stringify({
          error: "Failed to create invoice",
          details: invoiceError.message,
          code: invoiceError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create line items from proposal data or use default
    const lineItems = projectData?.line_items || [
      {
        description: standardDescription,
        quantity: 1.0,
        unitPrice: 500.0,
        total_price: 500.0,
      },
    ];

    console.log("Creating line items:", lineItems);

    // Initialize empty catalogLineItems array
    // Line items will be added via the catalog system
    const catalogLineItems: any[] = [];

    // Update the invoice with empty catalogLineItems
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ catalogLineItems: catalogLineItems })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Error updating invoice with line items:", updateError);
      // Delete the invoice if line item update fails
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return new Response(
        JSON.stringify({
          error: "Failed to create invoice line items",
          details: updateError.message,
          code: updateError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          status: invoice.status,
        },
        message: "Invoice created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create invoice API error:", error);
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
