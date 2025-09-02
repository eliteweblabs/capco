import type { APIRoute } from "astro";
import { stripe } from "../../lib/stripe";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      console.error("Stripe is not configured. Missing STRIPE_SECRET_KEY environment variable.");
      return new Response(
        JSON.stringify({
          error: "Payment processing is not configured. Please contact support.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { invoiceId, paymentMethod, billingDetails } = await request.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get invoice details from database
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        projects!inner(id, title, address, author_id)
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate total amount in cents (Stripe expects cents)
    const amountInCents = Math.round(invoice.total_amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        invoice_id: invoiceId.toString(),
        project_id: invoice.project_id.toString(),
        project_title: invoice.projects.title,
      },
      payment_method_types: paymentMethod
        ? [paymentMethod]
        : ["card", "apple_pay", "google_pay", "link"],
      // Enable automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
      // Add customer email and billing details if provided
      receipt_email: billingDetails?.email || undefined,
      shipping: billingDetails
        ? {
            name: billingDetails.name,
            address: {
              line1: billingDetails.address?.line1,
              city: billingDetails.address?.city,
              state: billingDetails.address?.state,
              postal_code: billingDetails.address?.postal_code,
              country: billingDetails.address?.country || "US",
            },
          }
        : undefined,
    });

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInCents,
        currency: paymentIntent.currency,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create payment intent API error:", error);
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
