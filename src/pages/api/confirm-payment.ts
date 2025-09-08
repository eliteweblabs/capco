import type { APIRoute } from "astro";
import { stripe } from "../../lib/stripe";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { paymentIntentId, invoiceId, projectId, projectStatus, authorProfile } =
      await request.json();

    if (!paymentIntentId || !invoiceId) {
      return new Response(
        JSON.stringify({
          error: "Payment Intent ID and Invoice ID are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!stripe) {
      console.error("Stripe not configured");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Retrieve the payment intent to confirm it was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update invoice status to paid
      if (!supabase) {
        console.error("Supabase not configured");
        return new Response(JSON.stringify({ error: "Supabase not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (updateError) {
        console.error("Error updating invoice status:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update invoice status" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get project ID from invoice to potentially update project status
      const { data: invoice } = await supabase
        .from("invoices")
        .select("project_id")
        .eq("id", invoiceId)
        .single();

      if (invoice?.project_id) {
        // Update project status based on invoice type
        // You can customize this logic based on your workflow
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment confirmed and invoice updated",
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: "Payment not successful",
          status: paymentIntent.status,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Confirm payment API error:", error);
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
