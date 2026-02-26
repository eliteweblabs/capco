/**
 * Time Entries list API
 * GET ?from=ISO&to=ISO&userId=uuid&projectId=number
 * Admins see all; Staff/users see only their own. Optional filters: from, to, userId (admin only), projectId.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

function authorDisplay(p: { name?: string; firstName?: string; lastName?: string }): string {
  if (p.name && String(p.name).trim()) return String(p.name).trim();
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length ? parts.join(" ").trim() : "—";
}

export const GET: APIRoute = async ({ request, cookies }): Promise<Response> => {
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

    const role = (currentUser as any)?.profile?.role;
    const isAdmin = role === "Admin";
    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const userIdParam = url.searchParams.get("userId");
    const projectIdParam = url.searchParams.get("projectId");

    let query = supabaseAdmin
      .from("timeEntries")
      .select(
        `
        id,
        userId,
        projectId,
        startedAt,
        endedAt,
        notes,
        createdAt,
        updatedAt
      `
      )
      .order("startedAt", { ascending: false });

    if (!isAdmin) {
      query = query.eq("userId", currentUser.id);
    } else if (userIdParam) {
      query = query.eq("userId", userIdParam);
    }

    if (projectIdParam != null && projectIdParam !== "") {
      const pid = parseInt(projectIdParam, 10);
      if (Number.isFinite(pid)) query = query.eq("projectId", pid);
    }

    if (fromParam) {
      try {
        const fromDate = new Date(fromParam);
        if (!Number.isNaN(fromDate.getTime())) {
          query = query.gte("startedAt", fromDate.toISOString());
        }
      } catch (_) {}
    }
    if (toParam) {
      try {
        const toDate = new Date(toParam);
        if (!Number.isNaN(toDate.getTime())) {
          query = query.lte("startedAt", toDate.toISOString());
        }
      } catch (_) {}
    }

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      console.error("❌ [TIME-ENTRIES] Error fetching:", entriesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch time entries", details: entriesError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set((entries ?? []).map((e) => e.userId).filter(Boolean))];
    const projectIds = [
      ...new Set((entries ?? []).map((e) => e.projectId).filter((id): id is number => id != null)),
    ];

    let profileMap = new Map<string, { name: string }>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, name, firstName, lastName")
        .in("id", userIds);
      profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { name: authorDisplay(p) }])
      );
    }

    let projectMap = new Map<number, { title: string }>();
    if (projectIds.length > 0) {
      const { data: projects } = await supabaseAdmin
        .from("projects")
        .select("id, title, address")
        .in("id", projectIds);
      projectMap = new Map(
        (projects ?? []).map((p) => [p.id, { title: p.title || p.address || `Project #${p.id}` }])
      );
    }

    const list = (entries ?? []).map((e) => {
      const start = e.startedAt ? new Date(e.startedAt).getTime() : 0;
      const end = e.endedAt ? new Date(e.endedAt).getTime() : 0;
      const durationMinutes = end > start ? Math.round((end - start) / 60000) : null;
      return {
        id: e.id,
        userId: e.userId,
        author: profileMap.get(e.userId)?.name ?? "—",
        projectId: e.projectId ?? null,
        project: e.projectId != null ? projectMap.get(e.projectId)?.title ?? `#${e.projectId}` : "—",
        start: e.startedAt,
        end: e.endedAt ?? null,
        notes: e.notes ?? null,
        durationMinutes,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      };
    });

    return new Response(
      JSON.stringify({ entries: list }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [TIME-ENTRIES] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
