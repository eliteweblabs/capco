import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [CHECK-EMAIL-LOGS] Checking email logs in database");

  try {
    // Check if we can connect to the database
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, title, log")
      .limit(5);

    if (error) {
      console.error("🔍 [CHECK-EMAIL-LOGS] Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection failed",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [CHECK-EMAIL-LOGS] Found projects:", projects?.length || 0);

    // Check for email-related logs
    const emailLogs = [];
    if (projects) {
      for (const project of projects) {
        if (project.log && Array.isArray(project.log)) {
          const emailEntries = project.log.filter(
            (entry: any) =>
              entry.action === "emailSent" ||
              entry.action === "emailFailed" ||
              entry.action === "allNotificationsSent"
          );

          if (emailEntries.length > 0) {
            emailLogs.push({
              projectId: project.id,
              projectTitle: project.title,
              emailLogs: emailEntries,
            });
          }
        }
      }
    }

    console.log("🔍 [CHECK-EMAIL-LOGS] Email logs found:", emailLogs.length);

    return new Response(
      JSON.stringify({
        success: true,
        totalProjects: projects?.length || 0,
        projectsWithEmailLogs: emailLogs.length,
        emailLogs: emailLogs,
        message: `Found ${emailLogs.length} projects with email logs`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔍 [CHECK-EMAIL-LOGS] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
