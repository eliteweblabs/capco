import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { checkAuth } from "../../../lib/auth";

/**
 * Reviews API
 * GET: List review submissions (Admin only)
 * PATCH: Update status (Admin only)
 * DELETE: Remove submission (Admin only)
 */

async function requireAdmin(cookies: Astro.Cookies) {
  const { currentUser } = await checkAuth(cookies);
  if (!currentUser) return null;
  const { data: profile } = await supabaseAdmin
    ?.from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (profile?.role !== "Admin" && profile?.role !== "Staff") return null;
  return currentUser;
}

export const GET: APIRoute = async ({ cookies }) => {
  const user = await requireAdmin(cookies);
  if (!user || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabaseAdmin
    .from("reviewSubmissions")
    .select("*")
    .order("submittedAt", { ascending: false });

  if (error) {
    console.error("[REVIEWS] List error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ reviews: data || [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  const user = await requireAdmin(cookies);
  if (!user || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabaseAdmin
    .from("reviewSubmissions")
    .update({ status: status || "approved" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  const user = await requireAdmin(cookies);
  if (!user || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error } = await supabaseAdmin.from("reviewSubmissions").delete().eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
