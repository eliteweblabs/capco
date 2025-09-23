import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser, role } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only allow Admin/Staff to run migrations
    if (!["Admin", "Staff"].includes(role || "")) {
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

    console.log("🔧 Adding subject column to invoices table...");

    // Check if column already exists
    const { data: columnCheck, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "invoices")
      .eq("column_name", "subject");

    if (checkError) {
      console.error("❌ Error checking column:", checkError);
      return new Response(
        JSON.stringify({
          error: "Failed to check column existence",
          details: checkError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (columnCheck && columnCheck.length > 0) {
      console.log("✅ Subject column already exists");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Subject column already exists in invoices table",
          alreadyExists: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add the column using raw SQL
    const addColumnSQL = `
      ALTER TABLE invoices 
      ADD COLUMN subject TEXT DEFAULT NULL;
    `;

    try {
      const { error: addError } = await supabase.rpc("exec_sql", { sql: addColumnSQL });

      if (addError) {
        console.error("❌ Error adding column:", addError);
        return new Response(
          JSON.stringify({
            error: "Failed to add subject column",
            details: addError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Subject column added successfully");

      // Add index for better performance
      const addIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_invoices_subject ON invoices(subject);
      `;

      const { error: indexError } = await supabase.rpc("exec_sql", { sql: addIndexSQL });

      if (indexError) {
        console.log("⚠️ Warning: Could not add index:", indexError.message);
      } else {
        console.log("✅ Index added successfully");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subject column added successfully to invoices table",
          alreadyExists: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ Error executing SQL:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to execute SQL migration",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ Error adding subject column:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
