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

    const { projectId, invoiceId, paymentType, paymentMethod, billingDetails } =
      await request.json();

    // Support both old invoice-based and new project-based payments
    const id = projectId || invoiceId;
    const isProjectPayment = !!projectId;

    if (!id) {
      return new Response(JSON.stringify({ error: "Project ID or Invoice ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let invoice, invoiceError, project;

    if (isProjectPayment) {
      // For project-based payments, get project details and create/find invoice
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, address, author_id")
        .eq("id", id)
        .single();

      if (projectError || !projectData) {
        console.error("Error fetching project:", projectError);
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      project = projectData;

      // Create a simple invoice object for payment processing
      invoice = {
        id: `project_${id}_${paymentType || "deposit"}`,
        project_id: id,
        total_amount: 500.0, // Default amount - you can calculate this based on your logic
        projects: project,
      };
    } else {
      // Original invoice-based payment
      const { data: invoiceData, error: invoiceErr } = await supabase
        .from("invoices")
        .select(
          `
          *,
          projects!inner(id, title, address, author_id)
        `
        )
        .eq("id", id)
        .single();

      if (invoiceErr || !invoiceData) {
        console.error("Error fetching invoice:", invoiceErr);
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      invoice = invoiceData;
      invoiceError = invoiceErr;
    }

    // Calculate total amount in cents (Stripe expects cents)
    const amountInCents = Math.round(invoice.total_amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        invoice_id: invoice.id.toString(),
        project_id: invoice.project_id.toString(),
        project_title: invoice.projects.title,
        payment_type: paymentType || "deposit",
        is_project_payment: isProjectPayment.toString(),
      },
      // Enable automatic payment methods (this will include card, apple_pay, google_pay, link automatically)
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
