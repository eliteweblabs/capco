/**
 * Admin project dashboard (/project/dashboard): Chart.js pies and bars for organization overview.
 * Data is passed via `#dashboard-admin-overview-data` JSON (see Dashboard.astro).
 */
import Chart from "chart.js/auto";

export type DashboardAdminOverviewChartsPayload = {
  statusLabels: string[];
  statusCounts: number[];
  statusColors: string[];
  opsLabels: string[];
  opsCounts: number[];
  outstandingFormatted: string;
  totalBilledFormatted: string;
  hasProjects: boolean;
};

const JSON_SCRIPT_ID = "dashboard-admin-overview-data";

function axisTickColor(): string {
  return document.documentElement.classList.contains("dark") ? "#cbd5e1" : "#374151";
}

function gridLineColor(): string {
  return document.documentElement.classList.contains("dark") ? "#374151" : "#e5e7eb";
}

function parsePayload(): DashboardAdminOverviewChartsPayload | null {
  const el = document.getElementById(JSON_SCRIPT_ID);
  /** JSON lives in `#dashboard-admin-overview-data` `<template>` (see DashboardAdminOverviewChartsEmbed.astro). */
  const raw =
    el instanceof HTMLTemplateElement
      ? el.innerHTML.trim()
      : typeof el?.textContent === "string"
        ? el.textContent.trim()
        : "";
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DashboardAdminOverviewChartsPayload;
  } catch {
    return null;
  }
}

/** Hydrate canvases `#dashboard-admin-status-chart` and `#dashboard-admin-volume-chart`. Safe to repeat (destroys existing Chart instances first). */
export function mountDashboardAdminOverviewCharts(): void {
  const adminChartsPayload = parsePayload();
  if (!adminChartsPayload) return;

  const tc = axisTickColor();
  const gc = gridLineColor();

  const statusCanvas = document.getElementById("dashboard-admin-status-chart");
  if (
    adminChartsPayload.hasProjects &&
    statusCanvas instanceof HTMLCanvasElement &&
    adminChartsPayload.statusCounts.length > 0
  ) {
    const scExisting = Chart.getChart(statusCanvas);
    if (scExisting) scExisting.destroy();
    new Chart(statusCanvas, {
      type: "doughnut",
      data: {
        labels: adminChartsPayload.statusLabels,
        datasets: [
          {
            data: adminChartsPayload.statusCounts,
            backgroundColor: adminChartsPayload.statusColors,
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: tc,
              boxWidth: 12,
              padding: 10,
            },
          },
        },
      },
    });
  }

  const volumeCanvas = document.getElementById("dashboard-admin-volume-chart");
  if (!(volumeCanvas instanceof HTMLCanvasElement)) return;

  const vcExisting = Chart.getChart(volumeCanvas);
  if (vcExisting) vcExisting.destroy();
  new Chart(volumeCanvas, {
    type: "bar",
    data: {
      labels: adminChartsPayload.opsLabels,
      datasets: [
        {
          label: "Count",
          data: adminChartsPayload.opsCounts,
          backgroundColor: [
            "rgba(59, 130, 246, 0.72)",
            "rgba(34, 197, 94, 0.72)",
            "rgba(245, 158, 11, 0.78)",
            "rgba(148, 163, 184, 0.75)",
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: tc, maxRotation: 24, minRotation: 0 },
          grid: { color: gc },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: tc,
            callback: function (tickValue: string | number) {
              const n = typeof tickValue === "number" ? tickValue : parseFloat(String(tickValue));
              return Number.isFinite(n) ? Math.round(n) : tickValue;
            },
          },
          grid: { color: gc },
        },
      },
    },
  });
}
