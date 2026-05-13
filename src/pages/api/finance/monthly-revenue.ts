import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { isFeatureEnabled } from "../../../lib/features";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrSuperAdmin, normalizeUserRole } from "../../../lib/user-utils";

export const GET: APIRoute = async ({ cookies }) => {
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

    if (!(await isFeatureEnabled("invoicing"))) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { count, error: countError } = await supabaseAdmin
      .from("invoices")
      .select("id", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting invoices for monthly revenue:", countError);
      return new Response(JSON.stringify({ error: "Failed to fetch monthly revenue data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!count) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cutoffDate = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("invoiceDate, createdAt, totalAmount")
      .or(`invoiceDate.gte.${cutoffDate},createdAt.gte.${cutoffDate}`);

    if (error) {
      console.error("Error fetching monthly revenue data:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch monthly revenue data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rows = data || [];
    const cutoffMs = new Date(cutoffDate + "T00:00:00.000Z").getTime();

    const monthlyTotals = rows.reduce(
      (
        acc: Record<string, { month: string; monthly_revenue: number; invoice_count: number }>,
        invoice: {
          invoiceDate: string | null;
          createdAt: string | null;
          totalAmount: string | number | null;
        }
      ) => {
        const raw = invoice.invoiceDate ?? invoice.createdAt;
        if (!raw) return acc;
        const t = new Date(raw).getTime();
        if (!Number.isFinite(t) || t < cutoffMs) return acc;

        const month = new Date(raw).toISOString().slice(0, 7) + "-01";
        if (!acc[month]) {
          acc[month] = { month, monthly_revenue: 0, invoice_count: 0 };
        }
        acc[month].monthly_revenue += parseFloat(String(invoice.totalAmount)) || 0;
        acc[month].invoice_count += 1;
        return acc;
      },
      {}
    );

    const filled: Array<{ month: string; monthly_revenue: number; invoice_count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = d.toISOString().slice(0, 7) + "-01";
      filled.push(monthlyTotals[key] ?? { month: key, monthly_revenue: 0, invoice_count: 0 });
    }

    return new Response(JSON.stringify(filled), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in monthly revenue API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
