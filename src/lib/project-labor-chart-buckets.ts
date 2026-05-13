export type LaborGranularity = "day" | "week" | "month";

export interface LaborChartEntry {
  start?: string | null;
  durationMinutes?: number | null;
  author?: string | null;
  userId?: string | null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC Monday (date-only) for the calendar week containing `d`. */
export function utcMondayOfInstant(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const dow = d.getUTCDay(); // 0 Sun … 6 Sat
  const delta = dow === 0 ? -6 : 1 - dow;
  return new Date(Date.UTC(y, m, day + delta));
}

export function bucketKey(startIso: string, g: LaborGranularity): string | null {
  const d = new Date(startIso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (g === "day") return `${y}-${pad2(mo)}-${pad2(day)}`;
  if (g === "month") return `${y}-${pad2(mo)}`;
  const mon = utcMondayOfInstant(d);
  return `${mon.getUTCFullYear()}-${pad2(mon.getUTCMonth() + 1)}-${pad2(mon.getUTCDate())}`;
}

export interface StackedDataset {
  label: string;
  /** Hours per label index (same length as labels) */
  data: number[];
}

export interface LaborAggregation {
  labels: string[];
  /** Sum hours per bucket */
  totalsHours: number[];
  stackedByPerson: StackedDataset[];
  grandTotalHours: number;
  intervalCount: number;
}

/** Completed intervals only (positive duration). Hours rounded to 2 decimals per bucket bin. */
export function aggregateLaborForCharts(
  entries: LaborChartEntry[],
  g: LaborGranularity
): LaborAggregation {
  /** bucket -> total minutes */
  const bucketMinutes = new Map<string, number>();
  /** bucket -> personKey -> minutes */
  const bucketPersonMinutes = new Map<string, Map<string, number>>();
  const personLabels = new Map<string, string>();

  let intervalCount = 0;

  for (const e of entries) {
    const mins = e.durationMinutes;
    if (mins == null || mins <= 0 || !e.start) continue;
    const b = bucketKey(String(e.start), g);
    if (!b) continue;
    intervalCount++;
    bucketMinutes.set(b, (bucketMinutes.get(b) ?? 0) + mins);

    const pKey = e.userId || e.author || "unknown";
    const display = (e.author && String(e.author).trim()) || String(pKey).slice(0, 8) || "—";
    personLabels.set(pKey, display);

    let inner = bucketPersonMinutes.get(b);
    if (!inner) {
      inner = new Map();
      bucketPersonMinutes.set(b, inner);
    }
    inner.set(pKey, (inner.get(pKey) ?? 0) + mins);
  }

  const labels = [...bucketMinutes.keys()].sort((a, b) => a.localeCompare(b));

  const totalsHours = labels.map((lb) =>
    Math.round(((bucketMinutes.get(lb) ?? 0) / 60) * 100) / 100
  );

  const personKeys = [...personLabels.keys()].sort((a, b) =>
    (personLabels.get(a) || a).localeCompare(personLabels.get(b) || b)
  );

  const stackedByPerson: StackedDataset[] = personKeys.map((pk) => ({
    label: personLabels.get(pk) || pk,
    data: labels.map((lb) => {
      const m = bucketPersonMinutes.get(lb)?.get(pk) ?? 0;
      return Math.round((m / 60) * 100) / 100;
    }),
  }));

  const grandTotalMinutes = [...bucketMinutes.values()].reduce((a, b) => a + b, 0);
  const grandTotalHours = Math.round((grandTotalMinutes / 60) * 100) / 100;

  return {
    labels,
    totalsHours,
    stackedByPerson,
    grandTotalHours,
    intervalCount,
  };
}
