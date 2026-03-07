/**
 * Products API - List active ecom products
 */
import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async () => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: products, error } = await supabaseAdmin
      .from("ecomProducts")
      .select("id, slug, title, description, priceCents, compareAtPriceCents, imageUrl, images")
      .eq("status", "active")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("[SHOP-PRODUCTS] Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ products: products || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[SHOP-PRODUCTS] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
