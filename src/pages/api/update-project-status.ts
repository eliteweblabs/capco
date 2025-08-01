import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, status, metadata } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      // For demo purposes, simulate a successful update when database is not configured
      return new Response(
        JSON.stringify({
          success: true,
          project: {
            id: projectId,
            metadata: { status, ...metadata },
            updated_at: new Date().toISOString(),
          },
          message: `Demo: Project ${projectId} status ${status ? `updated to ${status}` : "updated"} (No database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      // For demo purposes, simulate a successful update when not authenticated
      return new Response(
        JSON.stringify({
          success: true,
          project: {
            id: projectId,
            metadata: { status, ...metadata },
            updated_at: new Date().toISOString(),
          },
          message: `Demo: Project ${projectId} status ${status ? `updated to ${status}` : "updated"} (Demo mode - sign in for real database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Update project metadata with status information
    const updateData: any = {};

    if (metadata) {
      updateData.metadata = metadata;
    }

    // If status is provided, add it to metadata
    if (status) {
      updateData.metadata = {
        ...updateData.metadata,
        status: status,
        lastStatusUpdate: new Date().toISOString(),
        updatedBy: user.id,
      };
    }

    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .eq("author_id", user.id) // Ensure user owns the project
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: `Failed to update project: ${error.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: data,
        message: `Project ${status ? `status updated to ${status}` : "updated successfully"}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Project update API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
