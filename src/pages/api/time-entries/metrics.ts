/**
 * Time Entries Metrics API (Admin)
 * Returns hours per project, hours per user per project, total hours.
 * Uses dummy data when DB has little/no data.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

function authorDisplay(p: { name?: string; firstName?: string; lastName?: string }): string {
  if (p.name && String(p.name).trim()) return String(p.name).trim();
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length ? parts.join(" ").trim() : "—";
}

/** Generate dummy metrics when DB has little data */
function generateDummyMetrics() {
  const now = new Date();
  const projects = [
    { id: 1, title: "123 Main St – Sprinkler System" },
    { id: 2, title: "456 Oak Ave – Fire Alarm" },
    { id: 3, title: "789 Elm Blvd – NFPA 25 ITM" },
    { id: 4, title: "General / No Project" },
  ];
  const users = [
    { id: "u1", name: "Jane Smith" },
    { id: "u2", name: "John Doe" },
    { id: "u3", name: "Alex Johnson" },
  ];

  const hoursPerProject = projects.map((p, i) => ({
    projectId: p.id,
    project: p.title,
    totalHours: [24.5, 18.2, 12.8, 8.1][i] ?? 10,
    entryCount: [15, 12, 8, 5][i] ?? 6,
  }));

  const hoursPerUserPerProject: Array<{ userId: string; userName: string; projectId: number; project: string; totalHours: number }> = [];
  users.forEach((u, ui) => {
    projects.forEach((p, pi) => {
      const h = [8.2, 6.1, 4.2, 2.5, 9.1, 7.0, 5.5, 3.2, 7.2, 5.1, 3.1, 2.4][ui * 4 + pi] ?? 3;
      hoursPerUserPerProject.push({
        userId: u.id,
        userName: u.name,
        projectId: p.id,
        project: p.title,
        totalHours: Math.round(h * 10) / 10,
      });
    });
  });

  const totalHours = hoursPerProject.reduce((s, p) => s + p.totalHours, 0);
  const totalEntries = hoursPerProject.reduce((s, p) => s + p.entryCount, 0);

  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyTrend.push({
      month: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      totalHours: Math.round((60 + Math.random() * 40) * 10) / 10,
      entryCount: Math.floor(20 + Math.random() * 30),
    });
  }

  return {
    totalHours,
    totalEntries,
    hoursPerProject,
    hoursPerUserPerProject,
    monthlyTrend,
    source: "dummy",
  };
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

    const role = (currentUser as any)?.profile?.role;
    if (role !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const useDummy = url.searchParams.get("dummy") === "1";

    if (useDummy) {
      const metrics = generateDummyMetrics();
      return new Response(JSON.stringify(metrics), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("timeEntries")
      .select("id, userId, projectId, startedAt, endedAt")
      .gte("startedAt", from.toISOString())
      .lte("startedAt", to.toISOString())
      .not("endedAt", "is", null);

    if (entriesError) {
      console.error("❌ [TIME-ENTRIES-METRICS] Error:", entriesError);
      const metrics = generateDummyMetrics();
      return new Response(JSON.stringify(metrics), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const list = entries ?? [];
    if (list.length < 3) {
      const metrics = generateDummyMetrics();
      return new Response(JSON.stringify(metrics), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectIds = [...new Set(list.map((e) => e.projectId).filter((id): id is number => id != null))];
    const userIds = [...new Set(list.map((e) => e.userId))];

    let profileMap = new Map<string, string>();
    let projectMap = new Map<number, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, name, firstName, lastName")
        .in("id", userIds);
      profileMap = new Map((profiles ?? []).map((p) => [p.id, authorDisplay(p)]));
    }
    if (projectIds.length > 0) {
      const { data: projects } = await supabaseAdmin
        .from("projects")
        .select("id, title, address")
        .in("id", projectIds);
      projectMap = new Map(
        (projects ?? []).map((p) => [p.id, p.title || p.address || `Project #${p.id}`])
      );
    }

    const projectHours = new Map<number, { hours: number; count: number }>();
    const userProjectHours = new Map<string, number>();

    for (const e of list) {
      const start = new Date(e.startedAt).getTime();
      const end = new Date(e.endedAt).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      const pid = e.projectId ?? 0;
      const projectLabel = pid ? (projectMap.get(pid) ?? `#${pid}`) : "General / No Project";

      if (!projectHours.has(pid)) projectHours.set(pid, { hours: 0, count: 0 });
      const ph = projectHours.get(pid)!;
      ph.hours += hours;
      ph.count += 1;

      const upKey = `${e.userId}|${pid}`;
      userProjectHours.set(upKey, (userProjectHours.get(upKey) ?? 0) + hours);
    }

    const hoursPerProject = Array.from(projectHours.entries()).map(([projectId, { hours, count }]) => ({
      projectId,
      project: projectId ? (projectMap.get(projectId) ?? `#${projectId}`) : "General / No Project",
      totalHours: Math.round(hours * 100) / 100,
      entryCount: count,
    }));

    const hoursPerUserPerProject: Array<{
      userId: string;
      userName: string;
      projectId: number;
      project: string;
      totalHours: number;
    }> = [];
    for (const [key, totalHours] of userProjectHours) {
      const [userId, pid] = key.split("|");
      const projectId = parseInt(pid, 10) || 0;
      hoursPerUserPerProject.push({
        userId,
        userName: profileMap.get(userId) ?? "—",
        projectId,
        project: projectId ? (projectMap.get(projectId) ?? `#${projectId}`) : "General / No Project",
        totalHours: Math.round(totalHours * 100) / 100,
      });
    }

    const totalHours = hoursPerProject.reduce((s, p) => s + p.totalHours, 0);
    const totalEntries = list.length;

    const monthMap = new Map<string, { hours: number; count: number }>();
    for (const e of list) {
      const d = new Date(e.startedAt);
      const month = d.toISOString().slice(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { hours: 0, count: 0 });
      const m = monthMap.get(month)!;
      const start = new Date(e.startedAt).getTime();
      const end = new Date(e.endedAt).getTime();
      m.hours += (end - start) / (1000 * 60 * 60);
      m.count += 1;
    }
    const monthlyTrend = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, { hours, count }]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        totalHours: Math.round(hours * 100) / 100,
        entryCount: count,
      }));

    return new Response(
      JSON.stringify({
        totalHours,
        totalEntries,
        hoursPerProject,
        hoursPerUserPerProject,
        monthlyTrend,
        source: "database",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [TIME-ENTRIES-METRICS] Error:", error);
    const metrics = generateDummyMetrics();
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
