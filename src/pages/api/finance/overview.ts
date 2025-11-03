import { createClient } from "@supabase/supabase-js";
import { checkAuth } from "../../../lib/auth";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
// Use new PUBLIC_SUPABASE_PUBLISHABLE, fallback to legacy PUBLIC_SUPABASE_ANON_KEY
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET({ cookies }) {
  try {
    // Check authentication
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      "📊 [FINANCE-OVERVIEW] Fetching data for user:",
      currentUser.id,
      "Role:",
      currentUser.role
    );

    // Get invoice overview
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("status, totalAmount, id, subject, createdAt");

    if (invoiceError) {
      console.error("❌ [FINANCE-OVERVIEW] Error fetching invoice data:", invoiceError);
      return new Response(JSON.stringify({ error: "Failed to fetch invoice data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📊 [FINANCE-OVERVIEW] Invoice data:", invoiceData?.length || 0, "invoices found");
    console.log("📊 [FINANCE-OVERVIEW] Sample invoice:", invoiceData?.[0]);

    // Calculate invoice metrics
    const totalInvoices = invoiceData.length;
    const totalRevenue = invoiceData.reduce(
      (sum, invoice) => sum + (parseFloat(invoice.totalAmount) || 0),
      0
    );
    const paidInvoices = invoiceData.filter((invoice) => invoice.status === "paid").length;
    const draftInvoices = invoiceData.filter((invoice) => invoice.status === "draft").length;
    const sentInvoices = invoiceData.filter((invoice) => invoice.status === "sent").length;
    const overdueInvoices = invoiceData.filter((invoice) => invoice.status === "overdue").length;

    // Get project overview
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("status, sqFt");

    if (projectError) {
      console.error("Error fetching project data:", projectError);
      return new Response(JSON.stringify({ error: "Failed to fetch project data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate project metrics
    const totalProjects = projectData.length;
    const activeProjects = projectData.filter((project) => project.status === 1).length;
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
}
