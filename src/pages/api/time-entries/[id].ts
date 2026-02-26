/**
 * Time Entry update API
 * PATCH body: { notes?: string, startedAt?: string, endedAt?: string }
 * User can update own; Admin can update any.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const PATCH: APIRoute = async ({ params, request, cookies }): Promise<Response> => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = params.id;
    const entryId = id != null ? parseInt(id, 10) : NaN;
    if (!Number.isFinite(entryId)) {
      return new Response(JSON.stringify({ error: "Invalid time entry id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { notes, startedAt, endedAt } = body;

    const role = (currentUser as any)?.profile?.role;
    const isAdmin = role === "Admin";

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("timeEntries")
      .select("id, userId")
      .eq("id", entryId)
      .single();

    if (fetchError || !existing) {
      return new Response(JSON.stringify({ error: "Time entry not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isAdmin && existing.userId !== currentUser.id) {
      return new Response(JSON.stringify({ error: "Not allowed to update this time entry" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatePayload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (notes !== undefined) updatePayload.notes = notes == null || String(notes).trim() === "" ? null : String(notes).trim();
    if (startedAt !== undefined) {
      const d = new Date(startedAt);
      if (!Number.isNaN(d.getTime())) updatePayload.startedAt = d.toISOString();
    }
    if (endedAt !== undefined) {
      const d = new Date(endedAt);
      if (!Number.isNaN(d.getTime())) updatePayload.endedAt = d.toISOString();
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("timeEntries")
      .update(updatePayload)
      .eq("id", entryId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ [TIME-ENTRIES-PATCH] Error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update time entry", details: updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ entry: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [TIME-ENTRIES-PATCH] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
