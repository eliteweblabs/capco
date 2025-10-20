import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * Create Stripe Invoice API
 *
 * POST /api/stripe/create-invoice
 *
 * Creates an invoice in Stripe from project data
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const { projectId, clientData, lineItems } = body;

    if (!projectId) {
      return createErrorResponse("Project ID is required", 400);
    }

    console.log("📄 [STRIPE-INVOICE] Creating invoice for project:", projectId);

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        authorProfile:authorId (
          id,
          companyName,
          email,
          phone
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return createErrorResponse("Project not found", 404);
    }

    // Create or get Stripe customer
    let customer;
    try {
      // Try to find existing customer
      const customers = await stripe.customers.list({
        email: project.authorProfile?.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: project.authorProfile?.email,
          name: project.authorProfile?.companyName || "Client",
          phone: project.authorProfile?.phone,
          metadata: {
            projectId: projectId,
            source: "capco-fire-protection",
          },
        });
      }
    } catch (error) {
      console.error("❌ [STRIPE-INVOICE] Error creating customer:", error);
      return createErrorResponse("Failed to create customer", 500);
    }

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 30,
      metadata: {
        projectId: projectId,
        source: "capco-fire-protection",
      },
    });

    // Add line items
    const defaultLineItems = [
      {
        description: "Fire Protection System Design and Planning",
        quantity: 1,
        unit_amount: 250000, // $2500.00 in cents
      },
      {
        description: "Fire Sprinkler System Installation",
        quantity: 1,
        unit_amount: 500000, // $5000.00 in cents
      },
      {
        description: "Fire Alarm System Installation",
        quantity: 1,
        unit_amount: 300000, // $3000.00 in cents
      },
      {
        description: "System Testing and Commissioning",
        quantity: 1,
        unit_amount: 150000, // $1500.00 in cents
      },
    ];

    const itemsToAdd = lineItems || defaultLineItems;

    for (const item of itemsToAdd) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_amount: item.unit_amount,
      });
    }

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Store invoice reference in our database
    const { data: invoiceRecord, error: recordError } = await supabase
      .from("stripe_invoice_references")
      .insert({
        projectId: parseInt(projectId),
        stripeInvoiceId: finalizedInvoice.id,
        status: "draft",
        createdBy: currentUser.id,
        invoiceData: {
          customerId: customer.id,
          amount: finalizedInvoice.amount_due,
          currency: finalizedInvoice.currency,
        },
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url,
      })
      .select()
      .single();

    if (recordError) {
      console.error("❌ [STRIPE-INVOICE] Error storing invoice reference:", recordError);
      // Don't fail the request, just log the error
    }

    console.log("✅ [STRIPE-INVOICE] Invoice created successfully:", finalizedInvoice.id);

    return createSuccessResponse({
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      status: "draft",
      message: "Invoice created successfully in Stripe",
    });
  } catch (error) {
    console.error("❌ [STRIPE-INVOICE] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
