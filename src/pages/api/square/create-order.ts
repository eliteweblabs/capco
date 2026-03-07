import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Create an ecom order from cart items, return orderId for checkout.
 * POST /api/square/create-order
 * Body: { cartId, email, shippingAddress?, billingAddress? }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { cartId, email, shippingAddress, billingAddress } = body;

    if (!cartId || !email) {
      return new Response(JSON.stringify({ error: "cartId and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: cart, error: cartErr } = await supabaseAdmin
      .from("ecomCarts")
      .select("id, userId")
      .eq("id", cartId)
      .single();

    if (cartErr || !cart) {
      return new Response(JSON.stringify({ error: "Cart not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabaseAdmin
      .from("ecomCartItems")
      .select(
        `
        id,
        productId,
        variantId,
        quantity,
        ecomProducts(id, title, priceCents, imageUrl)
      `
      )
      .eq("cartId", cartId);

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let totalCents = 0;
    const orderItems: Array<{
      productId: number;
      productTitle: string;
      variantTitle: string | null;
      priceCents: number;
      quantity: number;
      imageUrl: string | null;
    }> = [];

    for (const item of items) {
      const product = Array.isArray(item.ecomProducts) ? item.ecomProducts[0] : item.ecomProducts;
      const priceCents = product?.priceCents ?? 0;
      const qty = item.quantity ?? 1;
      totalCents += priceCents * qty;
      orderItems.push({
        productId: item.productId,
        productTitle: product?.title ?? "Product",
        variantTitle: null,
        priceCents,
        quantity: qty,
        imageUrl: product?.imageUrl ?? null,
      });
    }

    if (totalCents <= 0) {
      return new Response(JSON.stringify({ error: "Invalid cart total" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { data: order, error: orderErr } = await supabaseAdmin!
      .from("ecomOrders")
      .insert({
        orderNumber,
        userId: cart.userId,
        email,
        status: "pending",
        totalCents,
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("[SQUARE-CREATE-ORDER] Insert error:", orderErr);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orderItemsRows = orderItems.map((oi) => ({
      orderId: order.id,
      productId: oi.productId,
      productTitle: oi.productTitle,
      variantTitle: oi.variantTitle,
      priceCents: oi.priceCents,
      quantity: oi.quantity,
      imageUrl: oi.imageUrl,
    }));

    await supabaseAdmin!.from("ecomOrderItems").insert(orderItemsRows);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber,
        totalCents,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[SQUARE-CREATE-ORDER] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
