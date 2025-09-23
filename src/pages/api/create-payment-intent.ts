import type { APIRoute } from "astro";
import { stripe } from "../../lib/stripe";
import { supabase } from "../../lib/supabase";

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};

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
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    const { projectId, invoiceId, paymentType, paymentMethod, billingDetails, amount } =
      await request.json();

    // console.log("🔍 [CREATE-PAYMENT-INTENT] Received request:", {
      projectId,
      invoiceId,
      paymentType,
      paymentMethod,
      hasBillingDetails: !!billingDetails,
      amount,
    });

    // Support both old invoice-based and new project-based payments
    // const id = invoiceId;
    // const isProjectPayment = !!projectId;

    // console.log("🔍 [CREATE-PAYMENT-INTENT] Debug values:", {
      projectId,
      invoiceId,
      paymentType,
      paymentMethod,
      billingDetails,
    });

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Project ID or Invoice ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    let invoice, invoiceError, project;

    if (invoiceId) {
      if (!supabase) {
        console.error(
          "Supabase is not configured. Missing SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
        );
        return new Response(
          JSON.stringify({
            error: "Payment processing is not configured. Please contact support.",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Credentials": "true",
            },
          }
        );
      }
      // For project-based payments, get project details and create/find invoice
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, address, author_id")
        .eq("id", projectId)
        .single();

      if (projectError || !projectData) {
        console.error("Error fetching project:", projectError);
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
          },
        });
      }

      project = projectData;

      // Create a simple invoice object for payment processing
      invoice = {
        id: `project_${invoiceId}_${paymentType || "deposit"}`,
        project_id: invoiceId,
        total_amount: 500.0, // Default amount - you can calculate this based on your logic
        projects: project,
      };

      // console.log("🔍 [CREATE-PAYMENT-INTENT] Created project invoice object:", {
        invoiceId: invoice.id,
        projectId: invoice.project_id,
        totalAmount: invoice.total_amount,
        paymentType,
      });
    } else {
      // Original invoice-based payment
      if (!supabase) {
        console.error(
          "Supabase is not configured. Missing SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
        );
        return new Response(
          JSON.stringify({
            error: "Payment processing is not configured. Please contact support.",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Credentials": "true",
            },
          }
        );
      }
      const { data: invoiceData, error: invoiceErr } = await supabase
        .from("invoices")
        .select(
          `
          *,
          projects!inner(id, title, address, author_id)
        `
        )
        .eq("id", invoiceId)
        .single();

      if (invoiceErr || !invoiceData) {
        console.error("Error fetching invoice:", invoiceErr);
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
          },
        });
      }

      invoice = invoiceData;
      invoiceError = invoiceErr;
    }

    // Use the amount passed from the frontmatter calculation (already in cents)
    // const totalAmount = amount || invoice.total_amount || 0;
    const amountInCents = Math.round(amount);

    // Validate amount is a valid positive integer
    // if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
    //   console.error("🚫 [CREATE-PAYMENT-INTENT] Invalid amount calculated:", {
    //     paymentFormAmount: amount,
    //     invoiceTotalAmount: invoice.total_amount,
    //     finalTotalAmount: totalAmount,
    //     amountInCents,
    //     lineItemsCount: invoice.catalog_line_items?.length || 0,
    //     isInteger: Number.isInteger(amountInCents),
    //     isPositive: amountInCents > 0,
    //   });
    //   return new Response(JSON.stringify({ error: "Invalid amount calculated" }), {
    //     status: 400,
    //     headers: {
    //       "Content-Type": "application/json",
    //       "Access-Control-Allow-Origin": "*",
    //       "Access-Control-Allow-Credentials": "true",
    //     },
    //   });
    // }

    // console.log("🔍 [CREATE-PAYMENT-INTENT] Amount calculation:", {
    //   paymentFormAmount: amount,
    //   invoiceTotalAmount: invoice.total_amount,
    //   finalTotalAmount: totalAmount,
    //   amountInCents,
    //   invoiceId: invoice.id,
    //   projectId: invoice.project_id,
    //   isProjectPayment,
    //   paymentType,
    //   lineItemsCount: invoice.catalog_line_items?.length || 0,
    // });

    // Check if amount is too low
    if (amountInCents < 50) {
      // Stripe minimum is usually 50 cents ($0.50)
      console.error("🚫 [CREATE-PAYMENT-INTENT] Amount too low for Stripe:", {
        amountInCents,
        invoiceTotalAmount: invoice.total_amount,
        minimumRequired: 50,
      });
    }

    // Create payment intent
    // console.log("🔍 [CREATE-PAYMENT-INTENT] About to call Stripe with:", {
      amount: amountInCents,
      currency: "usd",
      amountType: typeof amountInCents,
      amountIsInteger: Number.isInteger(amountInCents),
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        invoice_id: invoice.id.toString(),
        project_id: project?.id.toString(),
        project_title: project?.address,
        payment_type: paymentType || "deposit",
        // is_project_payment: isProjectPayment.toString(),
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
};
