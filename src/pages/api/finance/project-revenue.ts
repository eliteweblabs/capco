import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrSuperAdmin, normalizeUserRole } from "../../../lib/user-utils";

/** Top projects by time logged (rolling window), for /admin/finance. */
export const GET: APIRoute = async ({ cookies, request }) => {
  try {
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = normalizeUserRole(currentUser.profile?.role);
    if (!isAdminOrSuperAdmin(role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("timeEntries")
      .select("projectId, startedAt, endedAt")
      .gte("startedAt", from.toISOString())
      .lte("startedAt", to.toISOString())
      .not("endedAt", "is", null);

    if (entriesError) {
      console.error("Error fetching time entries for hours-by-project:", entriesError);
      return new Response(JSON.stringify({ error: "Failed to load time entries" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const list = entries ?? [];
    const hoursByProject = new Map<number, { hours: number; entryCount: number }>();

    for (const e of list) {
      const pid = e.projectId;
      if (pid == null || pid === 0) continue;

      const start = new Date(e.startedAt).getTime();
      const end = new Date(e.endedAt).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      if (!Number.isFinite(hours) || hours < 0) continue;

      const cur = hoursByProject.get(pid) ?? { hours: 0, entryCount: 0 };
      cur.hours += hours;
      cur.entryCount += 1;
      hoursByProject.set(pid, cur);
    }

    const projectIds = [...hoursByProject.keys()];
    if (projectIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: projects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("id, title, sqFt")
      .in("id", projectIds)
      .neq("id", 0);

    if (projectsError) {
      console.error("Error fetching projects for hours-by-project:", projectsError);
      return new Response(JSON.stringify({ error: "Failed to load projects" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

    const rows = projectIds
      .map((id) => {
        const agg = hoursByProject.get(id)!;
        const p = projectMap.get(id);
        return {
          id,
          title: p?.title || `Project #${id}`,
          sqFt: p?.sqFt ?? 0,
          totalHours: Math.round(agg.hours * 100) / 100,
          entryCount: agg.entryCount,
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in project-revenue (hours) API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
