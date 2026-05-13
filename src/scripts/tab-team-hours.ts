/**
 * Project tab: team hours / billing labor — table, CSV export, Chart.js overview.
 * Mounted via data attributes on `[data-tab-team-hours-root]` (see TabTeamHours.astro).
 */
import Chart from "chart.js/auto";
import type { LaborGranularity } from "../lib/project-labor-chart-buckets";
import { aggregateLaborForCharts } from "../lib/project-labor-chart-buckets";

type ChartInstance = InstanceType<typeof Chart>;

interface WindowTeamHours {
  initializeBilling?: () => Promise<void>;
  initializeTeamHours?: () => Promise<void>;
}

const mountedTabRoots = new WeakSet<HTMLElement>();

function setupTabTeamHours(container: HTMLElement): void {
  if (mountedTabRoots.has(container)) return;
  mountedTabRoots.add(container);

  const pid = Number(container.dataset.projectId);
  const prefix = container.dataset.idPrefix || "";
  const variant = container.dataset.variant || "staff";
  if (!Number.isFinite(pid) || pid <= 0 || !prefix) return;

  let cache: { entries: any[]; byUser: any[] } = { entries: [], byUser: [] };
  let granularity: LaborGranularity = "week";
  let chartTotal: ChartInstance | null = null;
  let chartStacked: ChartInstance | null = null;

  function csvEscape(v: unknown) {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function fmtwhen(iso: string | null | undefined) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function fmtHours(mins: number | null | undefined) {
    if (mins == null) return "—";
    return (Math.round((mins / 60) * 100) / 100).toFixed(2);
  }

  function fmtRateUsdPerHr(row: any) {
    if (row.hourlyRateSnapshot == null || row.hourlyRateSnapshot === "") return "—";
    const n =
      typeof row.hourlyRateSnapshot === "number"
        ? row.hourlyRateSnapshot
        : Number(row.hourlyRateSnapshot);
    if (!Number.isFinite(n) || n < 0) return "—";
    return "$" + n.toFixed(2) + "/hr";
  }

  function fmtLaborUsd(row: any) {
    if (row.laborUsd == null || row.laborUsd === "") return "—";
    const n = typeof row.laborUsd === "number" ? row.laborUsd : Number(row.laborUsd);
    if (!Number.isFinite(n)) return "—";
    return "$" + n.toFixed(2);
  }

  function buildQuery() {
    const q = new URLSearchParams();
    q.set("projectId", String(pid));
    q.set("aggregate", "byUser");
    const fromEl = document.getElementById(prefix + "-from");
    const toEl = document.getElementById(prefix + "-to");
    if (fromEl && (fromEl as HTMLInputElement).value)
      q.set("from", (fromEl as HTMLInputElement).value + "T00:00:00.000Z");
    if (toEl && (toEl as HTMLInputElement).value)
      q.set("to", (toEl as HTMLInputElement).value + "T23:59:59.999Z");
    return q.toString();
  }

  function chartTheme() {
    const dark = document.documentElement.classList.contains("dark");
    return {
      axis: dark ? "#9ca3af" : "#64748b",
      grid: dark ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.25)",
    };
  }

  function hslStroke(i: number, n: number, alpha: number): string {
    const hue = Math.round((360 / Math.max(n, 1)) * i) % 360;
    return `hsla(${hue}, 62%, 52%, ${alpha})`;
  }

  function destroyCharts() {
    chartTotal?.destroy();
    chartStacked?.destroy();
    chartTotal = chartStacked = null;
  }

  function updateCharts() {
    const kpis = document.getElementById(prefix + "-chart-kpis");
    const emptyEl = document.getElementById(prefix + "-charts-empty");
    const canvWrap = document.getElementById(prefix + "-charts-canvases");
    const ct = document.getElementById(prefix + "-chart-total") as HTMLCanvasElement | null;
    const cp = document.getElementById(prefix + "-chart-by-person") as HTMLCanvasElement | null;
    destroyCharts();
    if (!kpis || !emptyEl || !canvWrap || !ct || !cp) return;

    const agg = aggregateLaborForCharts(cache.entries, granularity);

    kpis.innerHTML = "";
    const totalSpan = document.createElement("span");
    totalSpan.className = "tabular-nums font-semibold text-gray-900 dark:text-gray-100";
    totalSpan.textContent = `Total hours: ${agg.grandTotalHours.toFixed(2)} h`;
    kpis.appendChild(totalSpan);

    const intSpan = document.createElement("span");
    intSpan.textContent = `Intervals counted: ${agg.intervalCount}`;
    kpis.appendChild(intSpan);

    const bucketHint = document.createElement("span");
    bucketHint.className = "text-gray-600 dark:text-gray-400";
    bucketHint.textContent =
      granularity === "day"
        ? "Buckets: calendar day (UTC)"
        : granularity === "week"
          ? "Buckets: week from Monday (UTC)"
          : "Buckets: calendar month (UTC)";
    kpis.appendChild(bucketHint);

    if (agg.labels.length === 0 || agg.intervalCount === 0) {
      emptyEl.classList.remove("hidden");
      canvWrap.classList.add("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    canvWrap.classList.remove("hidden");

    const { axis, grid } = chartTheme();

    chartTotal = new Chart(ct, {
      type: "bar",
      data: {
        labels: agg.labels,
        datasets: [
          {
            label: "Hours",
            data: agg.totalsHours,
            backgroundColor: "rgba(37, 99, 235, 0.55)",
            borderColor: "rgb(37, 99, 235)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${Number(ctx.raw ?? 0).toFixed(2)} h`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: axis, maxRotation: 45, minRotation: 0 },
            grid: { color: grid },
          },
          y: {
            ticks: { color: axis },
            grid: { color: grid },
            beginAtZero: true,
            title: { display: true, text: "Hours", color: axis },
          },
        },
      },
    });

    const nDs = Math.max(agg.stackedByPerson.length, 1);
    chartStacked = new Chart(cp, {
      type: "bar",
      data: {
        labels: agg.labels,
        datasets: agg.stackedByPerson.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: hslStroke(i, nDs, 0.72),
          borderColor: hslStroke(i, nDs, 1),
          borderWidth: 1,
          stack: "hours",
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: axis, boxWidth: 10, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label ?? ""}: ${Number(ctx.raw ?? 0).toFixed(2)} h`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: axis, maxRotation: 45 },
            grid: { color: grid },
          },
          y: {
            stacked: true,
            ticks: { color: axis },
            grid: { color: grid },
            beginAtZero: true,
            title: { display: true, text: "Hours", color: axis },
          },
        },
      },
    });
  }

  function bindGranularityButtons() {
    const inactive =
      "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";
    const active =
      "rounded-lg border border-primary-600 bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 dark:border-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600";

    function paint() {
      (["day", "week", "month"] as const).forEach((g) => {
        const btn = document.getElementById(`${prefix}-gran-${g}`);
        if (btn) btn.className = granularity === g ? active : inactive;
      });
    }

    (["day", "week", "month"] as const).forEach((g) => {
      document.getElementById(`${prefix}-gran-${g}`)?.addEventListener("click", () => {
        granularity = g;
        paint();
        updateCharts();
      });
    });
    paint();
  }

  async function loadData() {
    const statusEl = document.getElementById(prefix + "-status");
    const tbody = document.getElementById(prefix + "-tbody");
    const summaryEl = document.getElementById(prefix + "-summary");
    if (!tbody || !summaryEl) return;
    if (statusEl) statusEl.textContent = "Loading…";
    tbody.innerHTML = "";
    summaryEl.innerHTML = "";
    try {
      const res = await fetch("/api/time-entries?" + buildQuery(), { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; entries?: any[]; byUser?: any[] };
      if (!res.ok) throw new Error(data.error || "Failed to load labor");
      cache.entries = data.entries || [];
      cache.byUser = data.byUser || [];
      statusEl.textContent =
        cache.entries.length === 0
          ? "No check-in intervals for this project in the selected range."
          : "";

      const frag = document.createDocumentFragment();
      for (const row of cache.entries) {
        const tr = document.createElement("tr");
        const td0 = document.createElement("td");
        td0.className = "px-3 py-2";
        td0.textContent = row.author || "—";
        const td1 = document.createElement("td");
        td1.className = "px-3 py-2 whitespace-nowrap";
        td1.textContent = fmtwhen(row.start);
        const td2 = document.createElement("td");
        td2.className = "px-3 py-2 whitespace-nowrap";
        td2.textContent = fmtwhen(row.end);
        const td3 = document.createElement("td");
        td3.className = "px-3 py-2 text-right tabular-nums";
        td3.textContent = fmtHours(row.durationMinutes);
        const tdRate = document.createElement("td");
        tdRate.className = "px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300";
        tdRate.textContent = fmtRateUsdPerHr(row);
        const tdLabor = document.createElement("td");
        tdLabor.className = "px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300";
        tdLabor.textContent = fmtLaborUsd(row);
        const td4 = document.createElement("td");
        td4.className = "max-w-xs truncate px-3 py-2 text-gray-600 dark:text-gray-300";
        td4.textContent = row.notes || "";
        tr.append(td0, td1, td2, td3, tdRate, tdLabor, td4);
        frag.appendChild(tr);
      }
      tbody.appendChild(frag);

      for (const u of cache.byUser) {
        const card = document.createElement("div");
        card.className =
          "rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50";
        const title = document.createElement("div");
        title.className = "mb-2 font-semibold";
        title.textContent = u.author || "—";

        const sub = document.createElement("p");
        sub.className = "mb-2 text-xs text-gray-600 dark:text-gray-400";
        let laborPart = "";
        if ((u.totalLaborUsd ?? 0) > 0) {
          laborPart =
            " • Labor: $" + Number(u.totalLaborUsd).toFixed(2) + " (rate at check-in)";
        } else if ((u.totalMinutes ?? 0) > 0) {
          laborPart =
            " • Labor: — (missing rate snapshot on intervals; current profile rate is not used)";
        }
        sub.textContent =
          "Total: " + fmtHours(u.totalMinutes) + " h • Date keys UTC from interval start" + laborPart;

        const details = document.createElement("div");
        details.className = "max-h-40 overflow-y-auto";
        const dates = Object.keys(u.byDate || {}).sort();

        if (dates.length === 0) {
          const p = document.createElement("p");
          p.className = "text-gray-600 dark:text-gray-400";
          p.textContent = "No completed intervals (checkout sets duration).";
          details.appendChild(p);
        } else {
          for (const d of dates) {
            const rowEl = document.createElement("div");
            rowEl.className =
              "flex justify-between gap-4 border-b border-gray-200 py-1 last:border-0 dark:border-gray-600";
            const dSpan = document.createElement("span");
            dSpan.textContent = d;
            const hSpan = document.createElement("span");
            hSpan.className = "tabular-nums";
            const mins = u.byDate[d];
            const laborLine =
              u.byDateLaborUsd && u.byDateLaborUsd[d] != null
                ? " · $" + Number(u.byDateLaborUsd[d]).toFixed(2)
                : "";
            hSpan.textContent = fmtHours(mins) + " h" + laborLine;
            rowEl.append(dSpan, hSpan);
            details.appendChild(rowEl);
          }
        }

        card.append(title, sub, details);
        summaryEl.appendChild(card);
      }

      updateCharts();
    } catch (e: unknown) {
      destroyCharts();
      const msg = e instanceof Error ? e.message : "Unable to load time data.";
      if (statusEl) statusEl.textContent = "Error: " + msg;
    }
  }

  function exportCsv() {
    const rows = cache.entries || [];
    const cols = [
      "author",
      "userId",
      "start",
      "end",
      "hours",
      "hourlyRateSnapshotUsdPerHr",
      "laborUsd",
      "notes",
    ];
    let csv = cols.join(",") + "\n";
    for (const r of rows) {
      const snap =
        r.hourlyRateSnapshot != null && r.hourlyRateSnapshot !== ""
          ? String(r.hourlyRateSnapshot)
          : "";
      const labor = r.laborUsd != null && r.laborUsd !== "" ? String(r.laborUsd) : "";
      const line = [
        csvEscape(r.author),
        csvEscape(r.userId),
        csvEscape(r.start),
        csvEscape(r.end),
        csvEscape(fmtHours(r.durationMinutes)),
        csvEscape(snap),
        csvEscape(labor),
        csvEscape(r.notes || ""),
      ].join(",");
      csv += line + "\n";
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const tag = variant === "billing" ? "billing-labor" : "team-labor";
    a.download = "project-" + pid + "-" + tag + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const init = async () => {
    await loadData();
  };

  const w = window as unknown as WindowTeamHours;
  if (variant === "billing") {
    w.initializeBilling = init;
  } else {
    w.initializeTeamHours = init;
  }

  bindGranularityButtons();
  document.getElementById(prefix + "-refresh")?.addEventListener("click", () => loadData());
  document.getElementById(prefix + "-export")?.addEventListener("click", () => exportCsv());
}

/** Call once per page (or after swaps) to bind all team-hours / billing tab roots. */
export function mountTabTeamHoursRoots(): void {
  document.querySelectorAll("[data-tab-team-hours-root]").forEach((node) => {
    if (node instanceof HTMLElement) setupTabTeamHours(node);
  });
}
