import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const prerender = false;

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ cookies, url }) => {
  const { isAuth, currentUser } = await checkAuth(cookies);
  if (!isAuth || !currentUser) return json({ error: "Authentication required" }, 401);
  if (!supabaseAdmin) return json({ error: "Database unavailable" }, 500);

  const projectIdRaw = url.searchParams.get("projectId");
  const projectId = projectIdRaw ? parseInt(projectIdRaw, 10) : null;

  let query = supabaseAdmin
    .from("drawingLibraryItems")
    .select("*")
    .eq("authorId", currentUser.id)
    .order("priority", { ascending: true });

  if (projectId != null && !Number.isNaN(projectId)) {
    query = query.eq("projectId", projectId);
  } else {
    query = query.is("projectId", null);
  }

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, items: data || [] });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const { isAuth, currentUser } = await checkAuth(cookies);
  if (!isAuth || !currentUser) return json({ error: "Authentication required" }, 401);
  if (!supabaseAdmin) return json({ error: "Database unavailable" }, 500);

  const body = await request.json().catch(() => ({}));
  const projectId = body.projectId != null ? parseInt(String(body.projectId), 10) : null;
  const name = String(body.name || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const selectionShape = String(body.selectionShape || "square");
  const price = Number.isFinite(Number(body.price)) ? Number(body.price) : 0;
  const priority = Number.isFinite(Number(body.priority)) ? Number(body.priority) : 1;
  const dependencies = Array.isArray(body.dependencies) ? body.dependencies : [];

  if (!name || !imageUrl) {
    return json({ error: "name and imageUrl are required" }, 400);
  }

  const payload = {
    projectId: projectId != null && !Number.isNaN(projectId) ? projectId : null,
    authorId: currentUser.id,
    name,
    imageUrl,
    selectionShape: selectionShape === "circle" ? "circle" : "square",
    price,
    priority,
    dependencies,
  };

  const { data, error } = await supabaseAdmin
    .from("drawingLibraryItems")
    .insert([payload])
    .select()
    .single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, item: data }, 201);
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  const { isAuth, currentUser } = await checkAuth(cookies);
  if (!isAuth || !currentUser) return json({ error: "Authentication required" }, 401);
  if (!supabaseAdmin) return json({ error: "Database unavailable" }, 500);

  const body = await request.json().catch(() => ({}));
  const id = parseInt(String(body.id || ""), 10);
  if (!id || Number.isNaN(id)) return json({ error: "Valid id is required" }, 400);

  const updatePayload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.name != null) updatePayload.name = String(body.name);
  if (body.imageUrl != null) updatePayload.imageUrl = String(body.imageUrl);
  if (body.selectionShape != null)
    updatePayload.selectionShape = body.selectionShape === "circle" ? "circle" : "square";
  if (body.price != null) updatePayload.price = Number(body.price) || 0;
  if (body.priority != null) updatePayload.priority = Number(body.priority) || 1;
  if (Array.isArray(body.dependencies)) updatePayload.dependencies = body.dependencies;

  const { data, error } = await supabaseAdmin
    .from("drawingLibraryItems")
    .update(updatePayload)
    .eq("id", id)
    .eq("authorId", currentUser.id)
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ success: true, item: data });
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  const { isAuth, currentUser } = await checkAuth(cookies);
  if (!isAuth || !currentUser) return json({ error: "Authentication required" }, 401);
  if (!supabaseAdmin) return json({ error: "Database unavailable" }, 500);

  const body = await request.json().catch(() => ({}));
  const id = parseInt(String(body.id || ""), 10);
  if (!id || Number.isNaN(id)) return json({ error: "Valid id is required" }, 400);

  const { error } = await supabaseAdmin
    .from("drawingLibraryItems")
    .delete()
    .eq("id", id)
    .eq("authorId", currentUser.id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
};
