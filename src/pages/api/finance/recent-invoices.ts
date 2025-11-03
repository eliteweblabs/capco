import { createClient } from "@supabase/supabase-js";
import { checkAuth } from "../../../lib/auth";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
// Use PUBLIC_SUPABASE_PUBLISHABLE
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE;
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
      "📊 [RECENT-INVOICES] Fetching data for user:",
      currentUser.id,
      "Role:",
      currentUser.role
    );

    // Get recent invoices with project information
    const { data, error } = await supabase
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

    console.log("📊 [RECENT-INVOICES] Recent invoices data:", data?.length || 0, "invoices found");
    console.log("📊 [RECENT-INVOICES] Sample invoice:", data?.[0]);

    return new Response(JSON.stringify(data), {
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
}
