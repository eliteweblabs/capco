import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      projectId,
      status,
      title,
      description,
      address,
      sq_ft,
      new_construction,
      building,
      project,
      service,
      requested_docs,
      assigned_to_id,
    } = body;

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
            status,
            title,
            description,
            address,
            sq_ft,
            new_construction,
            building,
            project,
            service,
            requested_docs,
            assigned_to_id,
          },
          message: `Demo: Project ${projectId} ${status !== undefined ? `status updated to ${status}` : "updated"} (No database interaction)`,
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
            status,
            title,
            description,
            address,
            sq_ft,
            new_construction,
            building,
            project,
            service,
            requested_docs,
            assigned_to_id,
          },
          message: `Demo: Project ${projectId} ${status !== undefined ? `status updated to ${status}` : "updated"} (Demo mode - sign in for real database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Update project with provided fields
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (sq_ft !== undefined) updateData.sq_ft = sq_ft;
    if (new_construction !== undefined)
      updateData.new_construction = new_construction;
    if (building !== undefined) updateData.building = building;
    if (project !== undefined) updateData.project = project;
    if (service !== undefined) updateData.service = service;
    if (requested_docs !== undefined)
      updateData.requested_docs = requested_docs;
    if (assigned_to_id !== undefined)
      updateData.assigned_to_id = assigned_to_id;

    // Always update the updated_at timestamp when any field is modified
    updateData.updated_at = new Date().toISOString();

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
