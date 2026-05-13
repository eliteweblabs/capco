/**
 * Time Entries list API
 *
 * GET ?from=&to=&userId=&projectId=&aggregate=
 * - With projectId: Admin/superAdmin see all staff sessions on that project; Staff assigned or
 *   project author also see aggregate; otherwise only own sessions ( Clients: own only).
 * - aggregate=byUser: adds rollup per user plus minutes per UTC calendar date (startedAt date).
 *
 * Rows come from existing check-in / check-out billing (`timeEntries`).
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { canViewAggregateProjectLabor } from "../../../lib/project-labor-access";

function authorDisplay(p: { name?: string; firstName?: string; lastName?: string }): string {
  if (p.name && String(p.name).trim()) return String(p.name).trim();
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length ? parts.join(" ").trim() : "—";
}

function slugFromStartedAtIso(iso: string | null | undefined): string {
  if (!iso) return "unknown-date";
  return iso.includes("T") ? iso.slice(0, 10) : iso.slice(0, 10);
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
    const isAdmin = role === "Admin" || role === "superAdmin";
    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const userIdParam = url.searchParams.get("userId");
    const projectIdParam = url.searchParams.get("projectId");
    const aggregateParam = url.searchParams.get("aggregate");

    const parsedProject =
      projectIdParam != null && projectIdParam !== ""
        ? parseInt(projectIdParam, 10)
        : NaN;
    const hasProjectFilter = Number.isFinite(parsedProject);

    let seeAllEntriesGloballyOrOnProject = isAdmin;

    if (hasProjectFilter && !seeAllEntriesGloballyOrOnProject) {
      seeAllEntriesGloballyOrOnProject = await canViewAggregateProjectLabor(
        supabaseAdmin,
        parsedProject,
        currentUser.id,
        role
      );
    }

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
        hourlyRateSnapshot,
        createdAt,
        updatedAt
      `
      )
      .order("startedAt", { ascending: false });

    if (!seeAllEntriesGloballyOrOnProject) {
      query = query.eq("userId", currentUser.id);
    } else if (isAdmin && userIdParam) {
      query = query.eq("userId", userIdParam);
    }

    if (hasProjectFilter) {
      query = query.eq("projectId", parsedProject);
    }

    if (fromParam) {
      try {
        const fromDate = new Date(fromParam);
        if (!Number.isNaN(fromDate.getTime())) {
          query = query.gte("startedAt", fromDate.toISOString());
        }
      } catch (_) {
        // ignore invalid date
      }
    }
    if (toParam) {
      try {
        const toDate = new Date(toParam);
        if (!Number.isNaN(toDate.getTime())) {
          query = query.lte("startedAt", toDate.toISOString());
        }
      } catch (_) {
        // ignore invalid date
      }
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
        .select("id, firstName, lastName")
        .in("id", userIds);
      profileMap = new Map((profiles ?? []).map((p) => [p.id, { name: authorDisplay(p) }]));
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
      const durationHours =
        durationMinutes != null ? Math.round((durationMinutes / 60) * 100) / 100 : null;
      const snapRaw = (e as { hourlyRateSnapshot?: unknown }).hourlyRateSnapshot;
      let hourlyRateSnapshot: number | null = null;
      if (snapRaw != null && snapRaw !== "") {
        const sn = typeof snapRaw === "number" ? snapRaw : Number(snapRaw);
        if (Number.isFinite(sn) && sn >= 0) hourlyRateSnapshot = Math.round(sn * 100) / 100;
      }
      const laborUsd =
        durationHours != null && hourlyRateSnapshot != null
          ? Math.round(durationHours * hourlyRateSnapshot * 100) / 100
          : null;
      return {
        id: e.id,
        userId: e.userId,
        author: profileMap.get(e.userId)?.name ?? "—",
        projectId: e.projectId ?? null,
        project:
          e.projectId != null ? (projectMap.get(e.projectId)?.title ?? `#${e.projectId}`) : "—",
        start: e.startedAt,
        end: e.endedAt ?? null,
        notes: e.notes ?? null,
        durationMinutes,
        durationHours,
        hourlyRateSnapshot,
        laborUsd,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      };
    });

    let byUser: Array<{
      userId: string;
      author: string;
      totalMinutes: number;
      /** Sum of durationHours × hourlyRateSnapshot when both known */
      totalLaborUsd: number;
      /** ISO date yyyy-mm-dd from startedAt for session start (UTC) */
      byDate: Record<string, number>;
      byDateLaborUsd: Record<string, number>;
    }> | null = null;

    if (aggregateParam === "byUser") {
      const map = new Map<
        string,
        {
          userId: string;
          author: string;
          totalMinutes: number;
          totalLaborUsd: number;
          byDate: Record<string, number>;
          byDateLaborUsd: Record<string, number>;
        }
      >();
      for (const row of list) {
        let agg = map.get(row.userId);
        if (!agg) {
          agg = {
            userId: row.userId,
            author: row.author,
            totalMinutes: 0,
            totalLaborUsd: 0,
            byDate: {},
            byDateLaborUsd: {},
          };
          map.set(row.userId, agg);
        }
        const dk = slugFromStartedAtIso(row.start);
        if (row.durationMinutes != null) {
          agg.totalMinutes += row.durationMinutes;
          agg.byDate[dk] = (agg.byDate[dk] ?? 0) + row.durationMinutes;
        }
        if (row.durationHours != null && row.hourlyRateSnapshot != null) {
          const line = Math.round(row.durationHours * row.hourlyRateSnapshot * 100) / 100;
          agg.totalLaborUsd += line;
          agg.byDateLaborUsd[dk] = (agg.byDateLaborUsd[dk] ?? 0) + line;
        }
      }
      byUser = Array.from(map.values())
        .map((row) => ({
          ...row,
          totalLaborUsd: Math.round(row.totalLaborUsd * 100) / 100,
        }))
        .sort((a, b) => a.author.localeCompare(b.author));
    }

    const body: Record<string, unknown> = { entries: list };
    if (byUser !== null) body.byUser = byUser;

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [TIME-ENTRIES] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
