/**
 * Active Time Entry API (Admin/Staff)
 * Returns the current user's active time entry (endedAt is null), if any.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ cookies }): Promise<Response> => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = (currentUser as any)?.profile?.role;
    if (role !== "Admin" && role !== "Staff") {
      return new Response(JSON.stringify({ entry: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ entry: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: entry, error } = await supabaseAdmin
      .from("timeEntries")
      .select("id, userId, projectId, startedAt, notes")
      .eq("userId", currentUser.id)
      .is("endedAt", null)
      .order("startedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ [TIME-ENTRIES-ACTIVE] Error:", error);
      return new Response(JSON.stringify({ entry: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let projectTitle: string | null = null;
    if (entry?.projectId) {
      const { data: proj } = await supabaseAdmin
        .from("projects")
        .select("title, address")
        .eq("id", entry.projectId)
        .single();
      projectTitle = proj?.title || proj?.address || `Project #${entry.projectId}`;
    }

    return new Response(
      JSON.stringify({
        entry: entry
          ? {
              id: entry.id,
              projectId: entry.projectId,
              projectTitle,
              startedAt: entry.startedAt,
              notes: entry.notes ?? null,
            }
          : null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [TIME-ENTRIES-ACTIVE] Error:", error);
    return new Response(JSON.stringify({ entry: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
