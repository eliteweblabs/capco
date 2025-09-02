import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, user, role } = await checkAuth(cookies);
    if (!isAuth || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { projectId, subject } = await request.json();

    if (!projectId || subject === undefined) {
      return new Response(JSON.stringify({ error: "Project ID and subject are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate subject length
    if (subject.length > 200) {
      return new Response(JSON.stringify({ error: "Subject must be 200 characters or less" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // First, verify the project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, author_id, title")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions - user must own the project or be admin/staff
    const hasAccess = project.author_id === user.id || ["Admin", "Staff"].includes(role);

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if proposal_subject column exists, if not, create it
    let updatedProject;
    let updateError;

    try {
      // Try to update with subject column
      const result = await supabase
        .from("projects")
        .update({
          subject: subject.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select("id, subject, title")
        .single();

      updatedProject = result.data;
      updateError = result.error;
    } catch (error: any) {
      // If column doesn't exist, provide helpful error message
      if (error.message?.includes("subject") || error.code === "42703") {
        console.error(
          "Subject column not found. Please check if the subject column exists in the projects table."
        );
        return new Response(
          JSON.stringify({
            error: "Database column 'subject' not found",
            details: "Please ensure the 'subject' column exists in the projects table",
            migration_required: true,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    if (updateError) {
      console.error("Error updating proposal subject:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update proposal subject",
          details: updateError.message,
          code: updateError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject,
        message: "Proposal subject updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update proposal subject error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
