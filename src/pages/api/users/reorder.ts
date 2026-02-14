/**
 * PUT /api/users/reorder
 * Updates displayOrder for profiles (Admin only)
 * Body: { orders: [{ id: string, displayOrder: number }, ...] }
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser, supabase } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders)) {
      return new Response(JSON.stringify({ error: "orders array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatePromises = orders.map(
      (item: { id: string; display_order?: number; displayOrder?: number }) => {
        const displayOrder = item.displayOrder ?? item.display_order ?? 0;
        return supabaseAdmin.from("profiles").update({ displayOrder }).eq("id", item.id);
      }
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error("❌ [USERS-REORDER] Errors:", errors);
      return new Response(
        JSON.stringify({ error: "Some profiles failed to update", details: errors }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "User order updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to reorder users";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
