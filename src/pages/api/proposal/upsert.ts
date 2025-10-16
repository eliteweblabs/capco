import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { stripe } from "../../../lib/stripe";

/**
 * Standardized Proposal UPSERT API
 * 
 * POST Body:
 * - id?: number (if updating existing invoice)
 * - projectId: number
 * - status?: "draft" | "proposal" | "paid"
 * - subject?: string
 * - invoiceDate?: string
 * - notes?: string
 * - proposalNotes?: string
 * - taxRate?: number
 * - lineItems?: Array<{ description: string, quantity: number, unitPrice: number }>
 * - paymentIntentId?: string (for confirming payment)
 * 
 * Examples:
 * - Create: POST /api/proposal/upsert { projectId: 123 }
 * - Update: POST /api/proposal/upsert { id: 456, status: "paid" }
 * - Confirm Payment: POST /api/proposal/upsert { id: 789, paymentIntentId: "pi_..." }
 */

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
    } = body;

    // Validate required fields
    if (!id && !projectId) {
      return createErrorResponse("Either invoice ID or project ID is required", 400);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Handle payment confirmation
    if (id && paymentIntentId) {
      if (!stripe) {
        return createErrorResponse("Stripe not configured", 500);
      }

      // Verify payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return createErrorResponse("Payment not successful", 400);
      }

      // Update invoice status to paid
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paidAt: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return createErrorResponse("Failed to update invoice status", 500);
      }

      return createSuccessResponse({
        message: "Payment confirmed and invoice updated",
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      });
    }

    // Prepare invoice data
    const invoiceData = {
      ...(projectId && { projectId: parseInt(projectId) }),
      status,
      subject,
      invoiceDate,
      notes,
      proposalNotes,
      taxRate,
      ...(id ? {} : { createdBy: currentUser.id }),
      ...(id ? {} : { dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] }),
    };

    // Create or update invoice
    const { data: invoice, error: invoiceError } = await (id
      ? supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", id)
          .select()
          .single()
      : supabase
          .from("invoices")
          .insert(invoiceData)
          .select()
          .single()
    );

    if (invoiceError) {
      return createErrorResponse(
        `Failed to ${id ? "update" : "create"} invoice`,
        500,
        invoiceError
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
        // Rollback invoice creation if line items fail
        if (!id) {
          await supabase.from("invoices").delete().eq("id", invoice.id);
        }
        return createErrorResponse("Failed to update line items", 500);
      }
    }

    return createSuccessResponse({
      invoice: {
        id: invoice.id,
        status: invoice.status,
      },
      message: `Invoice ${id ? "updated" : "created"} successfully`,
    });
  } catch (error) {
    console.error("❌ [PROPOSAL-UPSERT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
