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

export type Period =
  | "quarterly"
  | "semi_annual"
  | "yearly"
  | "2_year"
  | "3_year"
  | "4_year"
  | "5_year";

/** Legacy DB values; still expanded on calendar until migrated. */
export type LegacyPeriod = "biennial";

export type PeriodOrLegacy = Period | LegacyPeriod;

export const PERIOD_MONTHS: Record<PeriodOrLegacy, number> = {
  quarterly: 3,
  semi_annual: 6,
  yearly: 12,
  "2_year": 24,
  "3_year": 36,
  "4_year": 48,
  "5_year": 60,
  biennial: 24,
};

export const PERIOD_LABELS: Record<PeriodOrLegacy, string> = {
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  yearly: "1 Year",
  "2_year": "2 Year",
  "3_year": "3 Year",
  "4_year": "4 Year",
  "5_year": "5 Year",
  biennial: "2 Year",
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
  inspectionPeriod: PeriodOrLegacy | null;
  occurrenceIndex?: number;
  /**
   * The iCal-style DTSTART for the series. Present on inspection events so the
   * client can compute a delta when an admin drags an occurrence or edits its
   * date in place: `newAnchor = anchorDate + (newOccurrenceDate - date)`.
   */
  anchorDate?: string | null;
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

function advancePeriodIso(iso: string, period: PeriodOrLegacy): string {
  const months = PERIOD_MONTHS[period];
  if (!months) return iso;
  return addMonthsIso(iso, months);
}

export function expandInspectionOccurrences(
  project: ScheduleProjectRow,
  range: ScheduleRange
): ScheduleEvent[] {
  if (!project.isInspection || !project.inspectionPeriod || !project.nextInspectionAt) {
    return [];
  }
  const period = project.inspectionPeriod as PeriodOrLegacy;
  if (PERIOD_MONTHS[period] == null) return [];

  const events: ScheduleEvent[] = [];
  let occurrenceIso = project.nextInspectionAt;
  let occurrenceMs = new Date(occurrenceIso).getTime();
  const rangeStartMs = range.start.getTime();
  const rangeEndMs = range.end.getTime();

  // Wind forward to (or just past) the range start so we don't emit historical occurrences.
  let i = 0;
  while (occurrenceMs < rangeStartMs && i < MAX_OCCURRENCES_PER_PROJECT) {
    occurrenceIso = advancePeriodIso(occurrenceIso, period);
    occurrenceMs = new Date(occurrenceIso).getTime();
    i++;
  }
  const anchorIso = project.inspectionStartDate ?? project.nextInspectionAt;
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
      anchorDate: anchorIso,
    });
    occurrenceIso = advancePeriodIso(occurrenceIso, period);
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

/* ===========================================================================
 * Week + Day helpers (admin schedule views)
 *
 * Sunday-based week to match buildMonthGrid. All timestamps UTC for parity
 * with eventsByDay / timeByDay bucketing (`date.slice(0,10)`).
 * ======================================================================== */

export function parseDateParam(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number.parseInt(match[1], 10);
  const m = Number.parseInt(match[2], 10) - 1;
  const d = Number.parseInt(match[3], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return new Date(Date.UTC(y, m, d, 0, 0, 0));
}

export function dateIsoString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfWeek(d: Date): Date {
  const dayOfWeek = d.getUTCDay(); // 0=Sun
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  start.setUTCDate(start.getUTCDate() - dayOfWeek);
  return start;
}

export function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  return new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59)
  );
}

export function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

export function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
}

export function shiftDate(d: Date, deltaDays: number): Date {
  const out = new Date(d);
  out.setUTCDate(d.getUTCDate() + deltaDays);
  return out;
}

export function buildWeekCells(viewDate: Date): {
  cells: { date: Date; key: string; inMonth: boolean; isToday: boolean }[];
  weekLabel: string;
} {
  const start = startOfWeek(viewDate);
  const todayKey = new Date().toISOString().slice(0, 10);
  const cells: { date: Date; key: string; inMonth: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: d, key, inMonth: true, isToday: key === todayKey });
  }
  const end = cells[6].date;
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const fmt = (dt: Date, opts: Intl.DateTimeFormatOptions) =>
    dt.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  const weekLabel = sameMonth
    ? `${fmt(start, { month: "long", day: "numeric" })} – ${fmt(end, { day: "numeric", year: "numeric" })}`
    : `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, { month: "short", day: "numeric", year: "numeric" })}`;
  return { cells, weekLabel };
}

export function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ===========================================================================
 * Time-entry overlay (admin-only)
 *
 * Surfaces archival staff time on the calendar. One "bucket" per (user, UTC
 * day): summed minutes across all that user's sessions on that day, plus the
 * underlying entries so the popover can list per-project breakdown.
 *
 * Bucketing uses UTC startedAt to match the rest of the grid. Sessions that
 * span midnight are attributed to their START day (matches existing
 * /api/time-entries?aggregate=byUser behavior). Active (endedAt IS NULL)
 * entries use `now()` as the effective end for duration.
 * ======================================================================== */

export interface TimeBucketEntry {
  id: number;
  projectId: number | null;
  projectTitle: string;
  start: string;
  end: string | null;
  minutes: number | null;
  notes: string | null;
  billedAt: string | null;
}

export interface TimeBucket {
  dayKey: string;
  userId: string;
  author: string;
  totalMinutes: number;
  hasActive: boolean;
  allBilled: boolean;
  entries: TimeBucketEntry[];
}

interface TimeEntryRow {
  id: number;
  userId: string;
  projectId: number | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  billedAt: string | null;
}

interface ProfileRow {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface ProjectRow {
  id: number;
  title: string | null;
  address: string | null;
}

function utcDayKey(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function diffMinutes(startIso: string, endIso: string | null): number | null {
  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) return null;
  const effectiveEnd = endIso ? new Date(endIso).getTime() : Date.now();
  if (Number.isNaN(effectiveEnd) || effectiveEnd < startMs) return null;
  return Math.round((effectiveEnd - startMs) / 60000);
}

function profileDisplay(p: ProfileRow): string {
  if (p.name && String(p.name).trim()) return String(p.name).trim();
  const parts = [p.firstName, p.lastName].filter(Boolean) as string[];
  return parts.length ? parts.join(" ").trim() : "—";
}

export async function getTimeBuckets(
  dbClient: SupabaseClient,
  range: ScheduleRange
): Promise<{ buckets: TimeBucket[]; error: string | null }> {
  const startIso = range.start.toISOString();
  const endIso = range.end.toISOString();

  const { data: entries, error } = await dbClient
    .from("timeEntries")
    .select('id, "userId", "projectId", "startedAt", "endedAt", notes, "billedAt"')
    .or(`and(startedAt.gte.${startIso},startedAt.lte.${endIso}),endedAt.is.null`)
    .order("startedAt", { ascending: true });

  if (error) return { buckets: [], error: error.message };
  const rows = (entries ?? []) as TimeEntryRow[];
  if (rows.length === 0) return { buckets: [], error: null };

  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
  const projectIds = [
    ...new Set(rows.map((r) => r.projectId).filter((id): id is number => typeof id === "number")),
  ];

  let profileMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await dbClient
      .from("profiles")
      .select("id, name, firstName, lastName")
      .in("id", userIds);
    profileMap = new Map(
      ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, profileDisplay(p)])
    );
  }

  let projectMap = new Map<number, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await dbClient
      .from("projects")
      .select("id, title, address")
      .in("id", projectIds);
    projectMap = new Map(
      ((projects ?? []) as ProjectRow[]).map((p) => [
        p.id,
        p.title || p.address || `Project #${p.id}`,
      ])
    );
  }

  const grouped = new Map<string, TimeBucket>();
  for (const r of rows) {
    const dayKey = utcDayKey(r.startedAt);
    if (!dayKey) continue;
    const key = `${r.userId}|${dayKey}`;
    let bucket = grouped.get(key);
    if (!bucket) {
      bucket = {
        dayKey,
        userId: r.userId,
        author: profileMap.get(r.userId) ?? "—",
        totalMinutes: 0,
        hasActive: false,
        allBilled: true,
        entries: [],
      };
      grouped.set(key, bucket);
    }
    const minutes = diffMinutes(r.startedAt, r.endedAt);
    if (minutes != null) bucket.totalMinutes += minutes;
    if (!r.endedAt) bucket.hasActive = true;
    if (!r.billedAt) bucket.allBilled = false;
    bucket.entries.push({
      id: r.id,
      projectId: r.projectId,
      projectTitle:
        r.projectId != null
          ? (projectMap.get(r.projectId) ?? `Project #${r.projectId}`)
          : "(General)",
      start: r.startedAt,
      end: r.endedAt ?? null,
      minutes,
      notes: r.notes ?? null,
      billedAt: r.billedAt ?? null,
    });
  }

  for (const b of grouped.values()) {
    if (b.entries.length === 0) b.allBilled = false;
  }

  return { buckets: Array.from(grouped.values()), error: null };
}
