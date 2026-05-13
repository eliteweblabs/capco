import type { SupabaseClient } from "@supabase/supabase-js";
import { getSiteConfig } from "./content";

export type BillUnbilledTimeResult =
  | {
      ok: true;
      invoiceId: number;
      aggregatedLines: number;
      timeEntriesBilled: number;
      laborSubtotal: number;
    }
  | {
      ok: false;
      code: "NO_UNBILLED" | "NO_PROJECT" | "INVOICE_ERROR" | "UPDATE_ERROR";
      message: string;
    };

/** Site config key or env BILL_UNBILLED_TIME_ON_STATUS (digits only). */
export async function getBillUnbilledTimeTriggerStatus(): Promise<number | null> {
  const envRaw =
    typeof process !== "undefined" ? process.env.BILL_UNBILLED_TIME_ON_STATUS : undefined;
  if (envRaw != null && String(envRaw).trim() !== "") {
    const n = parseInt(String(envRaw), 10);
    if (Number.isFinite(n)) return n;
  }
  try {
    const cfg = (await getSiteConfig()) as Record<string, unknown>;
    const v = cfg.billUnbilledTimeOnProjectStatus;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const p = parseInt(v, 10);
      if (Number.isFinite(p)) return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function lineItemTotal(item: Record<string, unknown>): number {
  if (item.total_price != null) return Number(item.total_price) || 0;
  const q = Number(item.quantity) || 0;
  const u = Number(item.unitPrice) || Number(item.price) || 0;
  return Math.round(q * u * 100) / 100;
}

type TimeEntryRow = {
  id: number;
  userId: string;
  projectId: number | null;
  startedAt: string;
  endedAt: string;
  hourlyRateSnapshot?: number | string | null;
};

/**
 * Append labor lines from completed, unbilled time entries to the project's invoice
 * and mark those entries billed. Idempotent per entry: once billedAt is set, skipped.
 */
export async function billUnbilledTimeForProject(
  supabaseAdmin: SupabaseClient,
  projectId: number,
  actorUserId: string
): Promise<BillUnbilledTimeResult> {
  if (!projectId || projectId === 0) {
    return { ok: false, code: "NO_PROJECT", message: "Invalid project id" };
  }

  const { data: project, error: projectErr } = await supabaseAdmin
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr || !project) {
    return { ok: false, code: "NO_PROJECT", message: projectErr?.message || "Project not found" };
  }

  const { data: entries, error: entErr } = await supabaseAdmin
    .from("timeEntries")
    .select("id, userId, projectId, startedAt, endedAt, hourlyRateSnapshot")
    .eq("projectId", projectId)
    .not("endedAt", "is", null)
    .is("billedAt", null)
    .order("startedAt", { ascending: true });

  if (entErr) {
    return { ok: false, code: "UPDATE_ERROR", message: entErr.message };
  }

  const list = (entries || []) as TimeEntryRow[];
  if (list.length === 0) {
    return {
      ok: false,
      code: "NO_UNBILLED",
      message: "No unbilled completed time for this project",
    };
  }

  const userIds = [...new Set(list.map((e) => e.userId))];
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name, firstName, lastName")
    .in("id", userIds);

  const nameByUser = new Map<string, string>();
  for (const p of profiles || []) {
    const nm =
      (p.name && String(p.name).trim()) ||
      [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    nameByUser.set(p.id, nm || "Staff");
  }

  const byUser = new Map<string, { hours: number; labor: number; entryIds: number[] }>();
  for (const e of list) {
    const start = new Date(e.startedAt).getTime();
    const end = new Date(e.endedAt).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    if (!Number.isFinite(hours) || hours <= 0) continue;
    const rateRaw = e.hourlyRateSnapshot;
    const rate =
      rateRaw != null && rateRaw !== ""
        ? typeof rateRaw === "number"
          ? rateRaw
          : Number(rateRaw)
        : 0;
    const labor = Number.isFinite(rate) && rate >= 0 ? hours * rate : 0;
    const cur = byUser.get(e.userId) ?? { hours: 0, labor: 0, entryIds: [] };
    cur.hours += hours;
    cur.labor += labor;
    cur.entryIds.push(e.id);
    byUser.set(e.userId, cur);
  }

  if (byUser.size === 0) {
    return { ok: false, code: "NO_UNBILLED", message: "No billable hours in unbilled entries" };
  }

  const invoicedAt = new Date().toISOString();
  const laborLines: Record<string, unknown>[] = [];
  for (const [uid, agg] of byUser) {
    const label = nameByUser.get(uid) || "Staff";
    const h = Math.round(agg.hours * 100) / 100;
    const laborRounded = Math.round(agg.labor * 100) / 100;
    const rate = h > 0 && laborRounded > 0 ? Math.round((laborRounded / h) * 100) / 100 : 0;
    laborLines.push({
      description: `Labor — ${label} (${h} h @ $${rate}/hr, unbilled timer)`,
      quantity: 1,
      unitPrice: laborRounded,
      total_price: laborRounded,
      source: "timeEntries",
      timeEntryIds: agg.entryIds,
    });
  }

  let { data: invoice, error: invFetchErr } = await supabaseAdmin
    .from("invoices")
    .select("id, catalogLineItems, taxRate")
    .eq("projectId", projectId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invFetchErr) {
    return { ok: false, code: "INVOICE_ERROR", message: invFetchErr.message };
  }

  if (!invoice) {
    const subtotalNew = laborLines.reduce(
      (s, row) => s + lineItemTotal(row as Record<string, unknown>),
      0
    );
    const taxR = 0;
    const taxAmountNew = Math.round(subtotalNew * taxR * 100) / 100;
    const totalAmountNew = Math.round((subtotalNew + taxAmountNew) * 100) / 100;
    const insertRow = {
      projectId,
      status: "draft" as const,
      subject: `Labor / T&M — ${project.title || `Project #${projectId}`}`,
      invoiceDate: invoicedAt.split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "Created from unbilled time entries",
      taxRate: taxR,
      subtotal: subtotalNew,
      taxAmount: taxAmountNew,
      totalAmount: totalAmountNew,
      createdBy: actorUserId,
      catalogLineItems: laborLines,
    };
    const { data: created, error: insErr } = await supabaseAdmin
      .from("invoices")
      .insert(insertRow)
      .select("id, catalogLineItems, taxRate")
      .single();
    if (insErr || !created) {
      return {
        ok: false,
        code: "INVOICE_ERROR",
        message: insErr?.message || "Failed to create invoice",
      };
    }
    invoice = created;
  } else {
    const existing = Array.isArray(invoice.catalogLineItems) ? invoice.catalogLineItems : [];
    const merged = [...existing, ...laborLines];
    const taxRate = Number(invoice.taxRate) || 0;
    const subtotal = merged.reduce(
      (s, row) => s + lineItemTotal(row as Record<string, unknown>),
      0
    );
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const { error: upErr } = await supabaseAdmin
      .from("invoices")
      .update({
        catalogLineItems: merged,
        subtotal,
        taxAmount,
        totalAmount,
        updatedAt: invoicedAt,
      })
      .eq("id", invoice.id);

    if (upErr) {
      return { ok: false, code: "INVOICE_ERROR", message: upErr.message };
    }
  }

  const invoiceId = invoice.id as number;
  const entryIds = list.map((e) => e.id);

  const { error: markErr } = await supabaseAdmin
    .from("timeEntries")
    .update({
      billedAt: invoicedAt,
      billedInvoiceId: invoiceId,
      updatedAt: invoicedAt,
    })
    .in("id", entryIds)
    .is("billedAt", null);

  if (markErr) {
    return { ok: false, code: "UPDATE_ERROR", message: markErr.message };
  }

  const laborSubtotal = laborLines.reduce(
    (s, row) => s + lineItemTotal(row as Record<string, unknown>),
    0
  );

  return {
    ok: true,
    invoiceId,
    aggregatedLines: laborLines.length,
    timeEntriesBilled: entryIds.length,
    laborSubtotal: Math.round(laborSubtotal * 100) / 100,
  };
}
