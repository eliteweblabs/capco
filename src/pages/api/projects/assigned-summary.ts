/**
 * Lightweight assigned projects summary for header dropdown.
 * Returns only count + id/title/address for up to 5 projects — no profiles, files, or punchlist.
 * Used by App.astro on every page for Staff/Admin.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);

    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = currentUser?.profile?.role;
    if (role !== "Admin" && role !== "Staff") {
      return new Response(JSON.stringify({ count: 0, items: [] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ count: 0, items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [itemsResult, countResult] = await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, title, address")
        .eq("assignedToId", currentUser.id)
        .neq("id", 0)
        .order("updatedAt", { ascending: false, nullsFirst: false })
        .limit(5),
      supabaseAdmin
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("assignedToId", currentUser.id)
        .neq("id", 0),
    ]);

    const count = countResult.count ?? 0;
    const rows = itemsResult.data ?? [];

    const items = rows.map((p: any) => ({
      id: p.id,
      title: p.title || p.address || "Untitled Project",
      address: p.address,
    }));


    return new Response(JSON.stringify({ count, items }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    console.error("[assigned-summary] Unexpected error:", err);
    return new Response(JSON.stringify({ count: 0, items: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
