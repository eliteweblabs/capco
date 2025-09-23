import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("=== PROJECT IMPORT API CALLED ===");

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
    console.log("CSV Headers:", headers);

    // Parse data rows
    const projects = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      // Create project object from CSV row
      const project: any = {};
      headers.forEach((header, index) => {
        project[header] = values[index];
      });

      // Validate required fields
      if (!project.email || !project.title || !project.address) {
        errors.push(`Row ${i + 1}: Missing required fields (email, title, address)`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(project.email)) {
        errors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      // Set default values
      if (!project.status) {
        project.status = 10; // Default status
      }

      if (!project.sq_ft) {
        project.sq_ft = 0;
      }

      if (!project.new_construction) {
        project.new_construction = false;
      }

      projects.push(project);
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

    // Import projects
    const importResults = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      createdProjects: [] as any[],
    };

    for (const project of projects) {
      try {
        // Find user by email
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", project.email)
          .single();

        if (userError || !userData) {
          importResults.errors.push(`${project.email}: User not found`);
          importResults.failed++;
          continue;
        }

        // Create project
        const projectData = {
          author_id: userData.id,
          title: project.title.trim(),
          address: project.address.trim(),
          status: parseInt(project.status) || 10,
          sq_ft: parseInt(project.sq_ft) || 0,
          new_construction:
            project.new_construction === "true" || project.new_construction === true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProject, error: projectError } = await supabaseAdmin
          .from("projects")
          .insert([projectData])
          .select()
          .single();

        if (projectError) {
          importResults.errors.push(
            `${project.email}: Project creation failed - ${projectError.message}`
          );
          importResults.failed++;
          continue;
        }

        importResults.success++;
        importResults.createdProjects.push({
          id: createdProject.id,
          title: project.title,
          address: project.address,
          email: project.email,
        });
      } catch (error) {
        importResults.errors.push(
          `${project.email}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        importResults.failed++;
      }
    }

    console.log("Import Results:", importResults);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Import completed. ${importResults.success} projects created, ${importResults.failed} failed.`,
        results: importResults,
        notification: {
          type: "success",
          title: "Project Import Complete",
          message: `Successfully imported ${importResults.success} projects. ${importResults.failed} failed.`,
          duration: 5000,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Project import error:", error);
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
