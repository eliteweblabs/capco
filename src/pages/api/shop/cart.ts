/**
 * Cart API - Get, add, update, remove cart items
 * Uses session/cookie-based cart (ecomCarts, ecomCartItems)
 */
import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

function cartResponse(cart: unknown[], cartId: string | null, status = 200) {
  return new Response(JSON.stringify({ cart, cartId }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const cartId = cookies.get("shop_cart_id")?.value;
    if (!cartId) {
      return cartResponse([], null);
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: items, error } = await supabaseAdmin
      .from("ecomCartItems")
      .select(
        `
        id,
        quantity,
        productId,
        variantId,
        ecomProducts(id, title, slug, imageUrl, priceCents)
      `
      )
      .eq("cartId", cartId);

    if (error) {
      console.error("[SHOP-CART] Get error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cart = (items || []).map((row: any) => {
      const product = Array.isArray(row.ecomProducts) ? row.ecomProducts[0] : row.ecomProducts;
      return {
        id: row.id,
        quantity: row.quantity,
        productId: row.productId,
        variantId: row.variantId,
        product: product
          ? {
              id: product.id,
              title: product.title,
              slug: product.slug,
              imageUrl: product.imageUrl,
              priceCents: product.priceCents,
            }
          : null,
      };
    });

    return cartResponse(cart, cartId);
  } catch (err) {
    console.error("[SHOP-CART] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { action, productId, variantId, quantity = 1, cartId: existingCartId } = body;

    if (!productId) {
      return new Response(JSON.stringify({ error: "productId required" }), {
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

    let cartId = existingCartId || cookies.get("shop_cart_id")?.value;

    if (!cartId) {
      const { data: newCart, error: cartErr } = await supabaseAdmin
        .from("ecomCarts")
        .insert({})
        .select("id")
        .single();
      if (cartErr || !newCart) {
        console.error("[SHOP-CART] Create cart error:", cartErr);
        return new Response(JSON.stringify({ error: "Failed to create cart" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      cartId = newCart.id;
      cookies.set("shop_cart_id", String(cartId), { path: "/", maxAge: 60 * 60 * 24 * 30 });
    }

    if (action === "add" || action === "update") {
      const eq = supabaseAdmin
        .from("ecomCartItems")
        .select("id, quantity")
        .eq("cartId", cartId)
        .eq("productId", productId);
      const withVariant = variantId ? eq.eq("variantId", variantId) : eq.is("variantId", null);
      const { data: existing } = await withVariant.single();

      if (existing) {
        const newQty = action === "add" ? existing.quantity + quantity : Math.max(1, quantity);
        await supabaseAdmin
          .from("ecomCartItems")
          .update({ quantity: newQty })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("ecomCartItems").insert({
          cartId,
          productId,
          variantId: variantId || null,
          quantity: Math.max(1, quantity),
        });
      }
    } else if (action === "remove") {
      const base = supabaseAdmin
        .from("ecomCartItems")
        .delete()
        .eq("cartId", cartId)
        .eq("productId", productId);
      if (variantId) {
        await base.eq("variantId", variantId);
      } else {
        await base.is("variantId", null);
      }
    }

    const { data: items } = await supabaseAdmin
      .from("ecomCartItems")
      .select(
        `
        id,
        quantity,
        productId,
        variantId,
        ecomProducts(id, title, slug, imageUrl, priceCents)
      `
      )
      .eq("cartId", cartId);

    const cart = (items || []).map((row: any) => {
      const product = Array.isArray(row.ecomProducts) ? row.ecomProducts[0] : row.ecomProducts;
      return {
        id: row.id,
        quantity: row.quantity,
        productId: row.productId,
        variantId: row.variantId,
        product: product
          ? {
              id: product.id,
              title: product.title,
              slug: product.slug,
              imageUrl: product.imageUrl,
              priceCents: product.priceCents,
            }
          : null,
      };
    });

    return new Response(JSON.stringify({ success: true, cart, cartId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[SHOP-CART] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
