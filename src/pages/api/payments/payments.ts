import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoiceId");

    if (!invoiceId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invoice ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch payments for the invoice
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("id, paymentDate, amount, paymentMethod, paymentReference, notes, createdAt")
      .eq("invoiceId", invoiceId)
      .order("paymentDate", { ascending: false });

    if (error) {
      console.error("❌ [PAYMENTS-API] Error fetching payments:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch payments",
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
        payments: payments || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [PAYMENTS-API] Exception:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { invoiceId, amount, paymentMethod, paymentReference, notes, paymentDate } = body;

    if (!invoiceId || !amount || !paymentMethod) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: invoiceId, amount, paymentMethod",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insert new payment
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        invoiceId: parseInt(invoiceId),
        amount: parseFloat(amount),
        paymentMethod,
        paymentReference: paymentReference || null,
        notes: notes || null,
        paymentDate: paymentDate || new Date().toISOString().split("T")[0],
        createdBy: (await supabaseAdmin!.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [PAYMENTS-API] Error creating payment:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create payment",
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
        payment,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [PAYMENTS-API] Exception:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
