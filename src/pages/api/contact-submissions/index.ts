import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { checkAuth } from "../../../lib/auth";

/**
 * Contact Submissions API
 * GET: List contact form submissions (Admin only)
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
    .from("contactSubmissions")
    .select("*")
    .order("submittedAt", { ascending: false });

  if (error) {
    console.error("[CONTACT-SUBMISSIONS] List error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ submissions: data || [] }), {
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

  const { error } = await supabaseAdmin
    .from("contactSubmissions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[CONTACT-SUBMISSIONS] Delete error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
