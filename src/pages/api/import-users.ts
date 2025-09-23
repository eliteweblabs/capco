import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  // // // console.log("=== USER IMPORT API CALLED ===");

  try {
    // Check authentication and ensure user is Admin
    const { isAuth, currentRole } = await checkAuth(cookies);

    if (!isAuth || currentRole !== "Admin") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized. Admin access required.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if Supabase is configured
    if (!supabase || !supabaseAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase is not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = await request.formData();
    const csvFile = formData.get("csvFile") as File;

    if (!csvFile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "CSV file is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse CSV content
    const csvContent = await csvFile.text();
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "CSV file must have at least a header row and one data row",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse header row
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    // // // console.log("CSV Headers:", headers);

    // Parse data rows
    const users = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      // Create user object from CSV row
      const user: any = {};
      headers.forEach((header, index) => {
        user[header] = values[index];
      });

      // Validate required fields
      if (!user.email || !user.first_name || !user.last_name) {
        errors.push(`Row ${i + 1}: Missing required fields (email, first_name, last_name)`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        errors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      // Set default role if not provided
      if (!user.role) {
        user.role = "Client";
      }

      // Validate role
      if (!["Admin", "Staff", "Client"].includes(user.role)) {
        errors.push(`Row ${i + 1}: Invalid role. Must be Admin, Staff, or Client`);
        continue;
      }

      users.push(user);
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation errors found",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Import users using the create-user endpoint
    const importResults = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      createdUsers: [] as any[],
    };

    for (const user of users) {
      try {
        // Use the existing create-user endpoint
        const createUserResponse = await fetch(`${new URL(request.url).origin}/api/create-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            first_name: user.first_name.trim(),
            last_name: user.last_name.trim(),
            company_name: user.company_name?.trim() || null,
            email: user.email.trim().toLowerCase(),
            phone: user.phone?.trim() || null,
            role: user.role,
          }),
        });

        const createUserResult = await createUserResponse.json();

        if (createUserResult.success) {
          importResults.success++;
          importResults.createdUsers.push({
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
          });
        } else {
          importResults.errors.push(`${user.email}: ${createUserResult.error}`);
          importResults.failed++;
        }
      } catch (error) {
        importResults.errors.push(
          `${user.email}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        importResults.failed++;
      }
    }

    // // // console.log("Import Results:", importResults);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Import completed. ${importResults.success} users created, ${importResults.failed} failed.`,
        results: importResults,
        notification: {
          type: "success",
          title: "User Import Complete",
          message: `Successfully imported ${importResults.success} users. ${importResults.failed} failed.`,
          duration: 5000,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("User import error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error during import",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
