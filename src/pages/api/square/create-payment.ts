import type { APIRoute } from "astro";
import { square } from "../../../lib/square";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!square) {
      return new Response(
        JSON.stringify({ error: "Square is not configured. Missing SQUARE_ACCESS_TOKEN." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      sourceId,
      amount,
      amountCents,
      orderId,
      idempotencyKey,
      buyerEmail,
      email,
      billingAddress,
    }: {
      sourceId: string;
      amount?: number;
      amountCents?: number;
      orderId: string;
      idempotencyKey?: string;
      buyerEmail?: string;
      email?: string;
      billingAddress?: {
        addressLine1?: string;
        locality?: string;
        administrativeDistrictLevel1?: string;
        postalCode?: string;
        country?: string;
      };
    } = body;

    const amountCentsFinal = amountCents ?? amount ?? 0;
    const idempotencyKeyFinal =
      idempotencyKey ??
      `${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`.slice(0, 45);
    const buyerEmailFinal = buyerEmail ?? email;

    if (!sourceId || !orderId) {
      return new Response(JSON.stringify({ error: "Missing required fields: sourceId, orderId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (amountCentsFinal < 50) {
      return new Response(JSON.stringify({ error: "Amount must be at least 50 cents ($0.50)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return new Response(JSON.stringify({ error: "Square location not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { result, statusCode } = await square.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: idempotencyKeyFinal.slice(0, 45),
      amountMoney: {
        amount: BigInt(amountCentsFinal),
        currency: "USD",
      },
      locationId,
      referenceId: orderId,
      buyerEmailAddress: buyerEmailFinal || undefined,
      billingAddress: billingAddress
        ? {
            addressLine1: billingAddress.addressLine1,
            locality: billingAddress.locality,
            administrativeDistrictLevel1: billingAddress.administrativeDistrictLevel1,
            postalCode: billingAddress.postalCode,
            country: billingAddress.country || "US",
          }
        : undefined,
    });

    if (statusCode !== 200 || !result.payment) {
      const errMsg =
        (result as { errors?: Array<{ detail?: string }> })?.errors?.[0]?.detail ||
        "Payment failed";
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payment = result.payment;

    if (supabaseAdmin && payment.id) {
      await supabaseAdmin
        .from("ecomOrders")
        .update({
          squarePaymentId: payment.id,
          status: payment.status === "COMPLETED" ? "paid" : "pending",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentId: payment.id,
        status: payment.status,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[SQUARE-CREATE-PAYMENT] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
