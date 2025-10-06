import type { APIRoute } from "astro";
import { stripe } from "../../lib/stripe";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { paymentIntentId, invoiceId } = await request.json();

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

    // Set up authenticated session from cookies (for RLS)
    if (!supabase) {
      console.error("Supabase not configured");
      return new Response(JSON.stringify({ error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Verify session was set
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("✅ [CONFIRM-PAYMENT] Authenticated user:", user?.id);
    } else {
      console.warn("⚠️ [CONFIRM-PAYMENT] No auth cookies found");
    }

    // Retrieve the payment intent to confirm it was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update invoice status to paid
      console.log("💳 [CONFIRM-PAYMENT] Updating invoice:", { invoiceId, status: "paid" });

      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paidAt: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (updateError) {
        console.error("❌ [CONFIRM-PAYMENT] Error updating invoice status:", {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          invoiceId,
        });
        return new Response(
          JSON.stringify({
            error: "Failed to update invoice status",
            details: updateError.message,
            code: updateError.code,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get project ID from invoice to potentially update project status
      const { data: invoice } = await supabase
        .from("invoices")
        .select("projectId")
        .eq("id", invoiceId)
        .single();

      if (invoice?.projectId) {
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
