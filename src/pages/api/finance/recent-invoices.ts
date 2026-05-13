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
      "📊 [RECENT-INVOICES] Fetching data for user:",
      currentUser.id,
      "Role:",
      currentUser.role
    );

    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select(
        `
        id,
        subject,
        status,
        totalAmount,
        createdAt,
        projectId,
        projects!inner(title)
      `
      )
      .order("createdAt", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ [RECENT-INVOICES] Error fetching recent invoices:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch recent invoices" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const list = data || [];
    console.log("📊 [RECENT-INVOICES] Recent invoices data:", list.length, "invoices found");
    console.log("📊 [RECENT-INVOICES] Sample invoice:", list[0]);

    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in recent invoices API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
