import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentRole } = await checkAuth(cookies);

    // Only allow admin/staff to check database schema
    if (!isAuth || !["Admin", "Staff"].includes(currentRole || "Client")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Try to query the column information
      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "projects")
        .eq("column_name", "subject")
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        throw error;
      }

      const columnExists = !error && data;

      return new Response(
        JSON.stringify({
          success: true,
          column_exists: columnExists,
          column_info: data,
          message: columnExists
            ? "subject column exists"
            : "subject column not found - please verify column exists",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (dbError: any) {
      console.error("Database schema check error:", dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check database schema",
          details: dbError.message,
          migration_needed: true,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Check proposal subject column error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
