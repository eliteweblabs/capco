import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrSuperAdmin, normalizeUserRole } from "../../../lib/user-utils";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function toNum(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/** Invoices that still represent money at risk (exclude paid/cancelled). */
function outstandingFromInvoices(
  rows: { outstandingBalance: string | number | null; status: string | null }[]
): number {
  let sum = 0;
  for (const inv of rows) {
    const st = inv.status || "";
    if (st === "paid" || st === "cancelled") continue;
    sum += toNum(inv.outstandingBalance);
  }
  return sum;
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = normalizeUserRole(currentUser.profile?.role) ?? "Client";
    const userId = currentUser.id;

    if (role === "Staff") {
      return new Response(
        JSON.stringify({
          role,
          staff: { placeholder: true, message: "Staff dashboard tools are coming soon." },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (isAdminOrSuperAdmin(role)) {
      const [
        { count: clientCount },
        { count: projectCount },
        { data: invoices },
        { data: projectStatusRows },
      ] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "Client"),
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).neq("id", 0),
        supabaseAdmin
          .from("invoices")
          .select("id, status, totalAmount, outstandingBalance, subject, projectId"),
        supabaseAdmin.from("projects").select("status").neq("id", 0),
      ]);

      /** Count of projects per workflow status code (dashboard chart / full org; not capped by project list pagination). */
      const projectStatusCounts: Record<number, number> = {};
      for (const row of projectStatusRows || []) {
        const statusCode =
          typeof row.status === "number" && Number.isFinite(row.status) ? row.status : 0;
        projectStatusCounts[statusCode] = (projectStatusCounts[statusCode] ?? 0) + 1;
      }

      const invList = invoices || [];
      const outstandingBalance = outstandingFromInvoices(invList);
      const openInvoiceStatuses = new Set(["sent", "overdue", "proposal", "draft"]);
      const openInvoiceCount = invList.filter((i) =>
        openInvoiceStatuses.has(i.status || "")
      ).length;
      const totalBilled = invList.reduce((s, i) => s + toNum(i.totalAmount), 0);

      return new Response(
        JSON.stringify({
          role,
          admin: {
            clientCount: clientCount ?? 0,
            projectCount: projectCount ?? 0,
            projectStatusCounts,
            outstandingBalance,
            outstandingBalanceFormatted: USD.format(outstandingBalance),
            openInvoiceCount,
            totalBilled,
            totalBilledFormatted: USD.format(totalBilled),
            invoiceCount: invList.length,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Client (and any non-staff, non-admin role defaults here)
    const { data: myProjects, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, address, status, createdAt")
      .eq("authorId", userId)
      .neq("id", 0)
      .order("createdAt", { ascending: false })
      .limit(80);

    if (projErr) {
      console.error("[dashboard/summary] projects:", projErr);
      return new Response(JSON.stringify({ error: "Failed to load projects" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectIds = (myProjects || []).map((p) => p.id);
    let invoiceRows: {
      id: number;
      status: string | null;
      totalAmount: string | number | null;
      outstandingBalance: string | number | null;
      subject: string | null;
      projectId: number;
    }[] = [];

    if (projectIds.length > 0) {
      const { data: inv, error: invErr } = await supabaseAdmin
        .from("invoices")
        .select("id, status, totalAmount, outstandingBalance, subject, projectId")
        .in("projectId", projectIds);

      if (invErr) {
        console.error("[dashboard/summary] invoices:", invErr);
        return new Response(JSON.stringify({ error: "Failed to load invoices" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      invoiceRows = inv || [];
    }

    const outstandingBalance = outstandingFromInvoices(invoiceRows);
    const invoiceIds = invoiceRows.map((r) => r.id);
    const invSubject = new Map(invoiceRows.map((r) => [r.id, r.subject || `Invoice #${r.id}`]));

    let recentPayments: {
      id: number;
      amount: number;
      amountFormatted: string;
      paymentDate: string | null;
      paymentMethod: string | null;
      invoiceId: number | null;
      invoiceLabel: string | null;
    }[] = [];

    if (invoiceIds.length > 0) {
      const { data: pays, error: payErr } = await supabaseAdmin
        .from("payments")
        .select("id, amount, paymentDate, paymentMethod, invoiceId")
        .in("invoiceId", invoiceIds)
        .order("paymentDate", { ascending: false })
        .limit(12);

      if (payErr) {
        console.error("[dashboard/summary] payments:", payErr);
      } else {
        recentPayments = (pays || []).map((p) => ({
          id: p.id,
          amount: toNum(p.amount),
          amountFormatted: USD.format(toNum(p.amount)),
          paymentDate: p.paymentDate ?? null,
          paymentMethod: p.paymentMethod ?? null,
          invoiceId: p.invoiceId ?? null,
          invoiceLabel: p.invoiceId != null ? (invSubject.get(p.invoiceId) ?? null) : null,
        }));
      }
    }

    return new Response(
      JSON.stringify({
        role,
        client: {
          projectCount: myProjects?.length ?? 0,
          outstandingBalance,
          outstandingBalanceFormatted: USD.format(outstandingBalance),
          recentPayments,
          projects: (myProjects || []).slice(0, 15).map((p) => ({
            id: p.id,
            title: p.title,
            address: p.address,
            status: p.status,
            createdAt: p.createdAt,
          })),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[dashboard/summary]", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
