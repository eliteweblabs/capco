import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, projectData } = await request.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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

    // Create invoice
    console.log("Creating invoice with data:", {
      project_id: parseInt(projectId),
      status: "draft",
      tax_rate: 0.0,
      created_by: user.id,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        project_id: parseInt(projectId),
        status: "draft",
        tax_rate: 0.0,
        created_by: user.id,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
      })
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

    // Create initial line item with standardized description
    console.log("Creating line item with data:", {
      invoice_id: invoice.id,
      description: standardDescription,
      quantity: 1.0,
      unit_price: 500.0,
      total_price: 500.0,
      sort_order: 1,
    });

    const { error: lineItemError } = await supabase.from("invoice_line_items").insert({
      invoice_id: invoice.id,
      description: standardDescription,
      quantity: 1.0,
      unit_price: 500.0, // Default price for initial line item
      total_price: 500.0,
      sort_order: 1,
    });

    if (lineItemError) {
      console.error("Error creating line item:", lineItemError);
      // Delete the invoice if line item creation fails
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return new Response(
        JSON.stringify({
          error: "Failed to create invoice line item",
          details: lineItemError.message,
          code: lineItemError.code,
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
          invoice_number: invoice.invoice_number,
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
