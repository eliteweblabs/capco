import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
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

    console.log(
      "📊 [FINANCE-OVERVIEW] Fetching data for user:",
      currentUser.id,
      "Role:",
      currentUser.role
    );

    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("status, totalAmount, id, subject, createdAt");

    if (invoiceError) {
      console.error("❌ [FINANCE-OVERVIEW] Error fetching invoice data:", invoiceError);
      return new Response(JSON.stringify({ error: "Failed to fetch invoice data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const invoices = invoiceData || [];
    console.log("📊 [FINANCE-OVERVIEW] Invoice data:", invoices.length, "invoices found");
    console.log("📊 [FINANCE-OVERVIEW] Sample invoice:", invoices[0]);

    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + (parseFloat(String(invoice.totalAmount)) || 0),
      0
    );
    const paidInvoices = invoices.filter((invoice) => invoice.status === "paid").length;
    const draftInvoices = invoices.filter((invoice) => invoice.status === "draft").length;
    const sentInvoices = invoices.filter((invoice) => invoice.status === "sent").length;
    const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue").length;

    const { data: projectRows, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, status, sqFt")
      .neq("id", 0);

    if (projectError) {
      console.error("Error fetching project data:", projectError);
      return new Response(JSON.stringify({ error: "Failed to fetch project data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectData = projectRows || [];
    const totalProjects = projectData.length;
    const activeProjects = projectData.length;
    const totalSqFt = projectData.reduce((sum, project) => sum + (project.sqFt || 0), 0);

    return new Response(
      JSON.stringify({
        totalRevenue,
        totalInvoices,
        paidInvoices,
        draftInvoices,
        sentInvoices,
        overdueInvoices,
        totalProjects,
        activeProjects,
        totalSqFt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in finance overview API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
