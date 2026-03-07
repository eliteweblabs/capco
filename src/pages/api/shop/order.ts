import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * GET /api/shop/order?orderId=uuid
 * Returns order details for checkout/pay page (totalCents, orderNumber, status)
 */
export const GET: APIRoute = async ({ url }) => {
  const orderId = url.searchParams.get("orderId");
  if (!orderId) {
    return new Response(JSON.stringify({ error: "orderId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: order, error } = await supabaseAdmin
    .from("ecomOrders")
    .select("id, orderNumber, totalCents, status")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (order.status !== "pending") {
    return new Response(JSON.stringify({ error: "Order already processed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
