/**
 * Shared schedule helpers used by /api/projects/schedule and /admin/schedule.
 *
 * Centralizes:
 *   - Date range parsing / month boundaries (UTC-based to avoid DST drift)
 *   - Inspection period → month interval mapping
 *   - Expansion of a recurring inspection into discrete occurrences inside a range
 *   - DB query + event assembly so both the API and the SSR page produce the same shape
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Period = "quarterly" | "semi_annual" | "yearly" | "biennial";

export const PERIOD_MONTHS: Record<Period, number> = {
  quarterly: 3,
  semi_annual: 6,
  yearly: 12,
  biennial: 24,
};

export const PERIOD_LABELS: Record<Period, string> = {
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  yearly: "Yearly",
  biennial: "Biennial",
};

const MAX_OCCURRENCES_PER_PROJECT = 64;

export interface ScheduleEvent {
  id: string;
  type: "due" | "inspection";
  projectId: number;
  title: string;
  address: string | null;
  status: number | null;
  statusName: string | null;
  date: string;
  isRecurring: boolean;
  inspectionPeriod: Period | null;
  occurrenceIndex?: number;
}

export interface ScheduleProjectRow {
  id: number;
  title: string | null;
  address: string | null;
  status: number | null;
  statusName: string | null;
  dueDate: string | null;
  isInspection: boolean | null;
  inspectionPeriod: string | null;
  inspectionStartDate: string | null;
  nextInspectionAt: string | null;
}

export interface ScheduleRange {
  start: Date;
  end: Date;
}

export function firstOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

export function lastOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
}

export function parseRange(url: URL | { searchParams: URLSearchParams }): ScheduleRange {
  const now = new Date();
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");
  const start = startParam ? new Date(startParam) : firstOfMonth(now);
  const end = endParam ? new Date(endParam) : lastOfMonth(now);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { start: firstOfMonth(now), end: lastOfMonth(now) };
  }
  return { start, end };
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso);
  const next = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth() + months,
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds()
    )
  );
  return next.toISOString();
}

export function expandInspectionOccurrences(
  project: ScheduleProjectRow,
  range: ScheduleRange
): ScheduleEvent[] {
  if (!project.isInspection || !project.inspectionPeriod || !project.nextInspectionAt) {
    return [];
  }
  const period = project.inspectionPeriod as Period;
  const months = PERIOD_MONTHS[period];
  if (!months) return [];

  const events: ScheduleEvent[] = [];
  let occurrenceIso = project.nextInspectionAt;
  let occurrenceMs = new Date(occurrenceIso).getTime();
  const rangeStartMs = range.start.getTime();
  const rangeEndMs = range.end.getTime();

  // Wind forward to (or just past) the range start so we don't emit historical occurrences.
  let i = 0;
  while (occurrenceMs < rangeStartMs && i < MAX_OCCURRENCES_PER_PROJECT) {
    occurrenceIso = addMonthsIso(occurrenceIso, months);
    occurrenceMs = new Date(occurrenceIso).getTime();
    i++;
  }
  while (occurrenceMs <= rangeEndMs && events.length < MAX_OCCURRENCES_PER_PROJECT) {
    events.push({
      id: `project-${project.id}-inspection-${occurrenceIso}`,
      type: "inspection",
      projectId: project.id,
      title: project.title ?? `Project #${project.id}`,
      address: project.address,
      status: project.status,
      statusName: project.statusName,
      date: occurrenceIso,
      isRecurring: true,
      inspectionPeriod: period,
      occurrenceIndex: events.length,
    });
    occurrenceIso = addMonthsIso(occurrenceIso, months);
    occurrenceMs = new Date(occurrenceIso).getTime();
  }
  return events;
}

export async function getScheduleEvents(
  dbClient: SupabaseClient,
  range: ScheduleRange
): Promise<{ events: ScheduleEvent[]; error: string | null }> {
  const startIso = range.start.toISOString();
  const endIso = range.end.toISOString();

  const { data: projects, error } = await dbClient
    .from("projects")
    .select(
      'id, title, address, status, statusName, "dueDate", "isInspection", "inspectionPeriod", "inspectionStartDate", "nextInspectionAt"'
    )
    .or(`and(dueDate.gte.${startIso},dueDate.lte.${endIso}),isInspection.eq.true`);

  if (error) {
    return { events: [], error: error.message };
  }

  const events: ScheduleEvent[] = [];
  for (const project of (projects ?? []) as ScheduleProjectRow[]) {
    if (project.dueDate) {
      const dueMs = new Date(project.dueDate).getTime();
      if (dueMs >= range.start.getTime() && dueMs <= range.end.getTime()) {
        events.push({
          id: `project-${project.id}-due`,
          type: "due",
          projectId: project.id,
          title: project.title ?? `Project #${project.id}`,
          address: project.address,
          status: project.status,
          statusName: project.statusName,
          date: project.dueDate,
          isRecurring: false,
          inspectionPeriod: null,
        });
      }
    }
    events.push(...expandInspectionOccurrences(project, range));
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  return { events, error: null };
}

/**
 * Build the [Sunday, Saturday] day matrix for a given month. Each cell is
 * keyed by `YYYY-MM-DD` (UTC) so events can be bucketed by `date.slice(0,10)`.
 * The grid always renders 6 rows so the calendar shape never jitters.
 */
export function buildMonthGrid(viewMonth: Date): {
  cells: { date: Date; key: string; inMonth: boolean; isToday: boolean }[];
  monthLabel: string;
} {
  const monthStart = firstOfMonth(viewMonth);
  const startDayOfWeek = monthStart.getUTCDay(); // 0=Sun
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - startDayOfWeek);
  const todayKey = new Date().toISOString().slice(0, 10);

  const cells: { date: Date; key: string; inMonth: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    cells.push({
      date: d,
      key,
      inMonth: d.getUTCMonth() === monthStart.getUTCMonth(),
      isToday: key === todayKey,
    });
  }

  const monthLabel = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return { cells, monthLabel };
}

export function shiftMonth(viewMonth: Date, delta: number): Date {
  return new Date(
    Date.UTC(viewMonth.getUTCFullYear(), viewMonth.getUTCMonth() + delta, 1, 0, 0, 0)
  );
}

export function monthIsoString(viewMonth: Date): string {
  // YYYY-MM, suitable as a URL query param: ?month=2026-06
  const y = viewMonth.getUTCFullYear();
  const m = String(viewMonth.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseMonthParam(value: string | null | undefined): Date {
  if (!value) return firstOfMonth(new Date());
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return firstOfMonth(new Date());
  const year = Number.parseInt(match[1], 10);
  const monthIdx = Number.parseInt(match[2], 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return firstOfMonth(new Date());
  }
  return new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0));
}
