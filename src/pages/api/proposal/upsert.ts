import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
// import { stripe } from "../../../lib/stripe"; // Stripe only needed for payment processing, not proposals

// Standard description for new proposals
const STANDARD_DESCRIPTION = `Tier I Fire Sprinkler Design and Fire Alarm Design

Tier I Fire Sprinkler Design
1. Fire Sprinkler Design
2. Hydraulic Calculations
3. Project Narrative
4. NFPA 241 Plan

Tier I Fire Alarm Design
1. Fire Alarm Design
2. Fire Alarm Narrative`;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Get request data
    const body = await request.json();
    const {
      id,
      projectId,
      paymentIntentId,
      status = "draft",
      subject = null,
      invoiceDate = new Date().toISOString().split("T")[0],
      notes = null,
      proposalNotes = null,
      taxRate = 0.0,
      lineItems = null,
      templateId = "1", // Default template ID
    } = body;

    // Validate required fields
    if (!id && !projectId) {
      return createErrorResponse("Either invoice ID or project ID is required", 400);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Note: Payment processing should be handled by a separate payment API
    // This proposal API focuses on proposal/invoice creation and management

    let invoice;
    let invoiceError;

    // If projectId is provided without id, check if invoice already exists
    if (!id && projectId) {
      console.log("🔍 [PROPOSAL-UPSERT] Checking for existing invoice for project:", projectId);
      const { data: existingInvoice, error: checkError } = await supabase
        .from("invoices")
        .select("*")
        .eq("projectId", parseInt(projectId))
        .single();

      if (existingInvoice) {
        console.log("✅ [PROPOSAL-UPSERT] Found existing invoice:", existingInvoice.id);
        invoice = existingInvoice;
        invoiceError = null;
      } else {
        console.log("🆕 [PROPOSAL-UPSERT] No existing invoice found, creating new one");
        // Prepare invoice data for new invoice
        const invoiceData = {
          projectId: parseInt(projectId),
          status,
          subject,
          invoiceDate,
          notes,
          proposalNotes,
          taxRate,
          templateId,
          createdBy: currentUser.id,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        };

        const result = await supabase.from("invoices").insert(invoiceData).select().single();
        invoice = result.data;
        invoiceError = result.error;
      }
    } else if (id) {
      // Update existing invoice by id
      console.log("🔧 [PROPOSAL-UPSERT] Updating existing invoice:", id);
      const invoiceData = {
        ...(projectId && { projectId: parseInt(projectId) }),
        status,
        subject,
        invoiceDate,
        notes,
        proposalNotes,
        taxRate,
        templateId,
      };

      const result = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", id)
        .select()
        .single();
      invoice = result.data;
      invoiceError = result.error;
    }

    console.log("🔧 [PROPOSAL-UPSERT] Invoice result:", { invoice, invoiceError });

    if (invoiceError) {
      console.error("❌ [PROPOSAL-UPSERT] Database error:", invoiceError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to ${id ? "update" : "create"} invoice`,
          details: invoiceError.message,
          code: invoiceError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle line items if provided or if new invoice
    if (lineItems || !id) {
      const catalogLineItems = lineItems || [
        {
          description: STANDARD_DESCRIPTION,
          quantity: 1.0,
          unitPrice: 500.0,
          total_price: 500.0,
        },
      ];

      const { error: updateError } = await supabase
        .from("invoices")
        .update({ catalogLineItems })
        .eq("id", invoice.id);

      if (updateError) {
        console.error("❌ [PROPOSAL-UPSERT] Line items error:", updateError);
        // Rollback invoice creation if line items fail
        if (!id) {
          await supabase.from("invoices").delete().eq("id", invoice.id);
        }
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to update line items",
            details: updateError.message,
            code: updateError.code,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const responseData = {
      invoice: {
        id: invoice.id,
        status: invoice.status,
      },
      message: `Invoice ${id ? "updated" : "created"} successfully`,
    };

    console.log("✅ [PROPOSAL-UPSERT] Returning success response:", responseData);
    return createSuccessResponse(responseData);
  } catch (error) {
    console.error("❌ [PROPOSAL-UPSERT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
