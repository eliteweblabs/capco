import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    // console.log("Update project API received:", body);

    const { projectId, ...updateFields } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
            ...updateFields,
          },
          message: `Demo: Project ${projectId} ${updateFields.status !== undefined ? `status updated to ${updateFields.status}` : "updated"} (Demo mode - sign in for real database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch profile to determine role (Admin/Staff can update any project)
    let isAdminOrStaff = false;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdminOrStaff = profile?.role === "Admin" || profile?.role === "Staff";
    } catch (_) {
      // Default to non-admin if role lookup fails
      isAdminOrStaff = false;
    }

    // Simple validation - remove undefined values and empty strings
    const cleanUpdateFields = Object.fromEntries(
      Object.entries(updateFields).filter(([key, value]) => value !== undefined && value !== "")
    );

    // Always update the updated_at timestamp when any field is modified
    const updateData = {
      ...cleanUpdateFields,
      updated_at: new Date().toISOString(),
    };

    // console.log("Attempting to update project with data:", updateData);

    // Single update query for all fields
    let updateQuery = supabase.from("projects").update(updateData).eq("id", projectId);
    if (!isAdminOrStaff) {
      updateQuery = updateQuery.eq("author_id", user.id);
    }
    const { data: updatedData, error: updateError } = await updateQuery.select().single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      // If no rows were affected, return a friendlier message
      if (
        updateError.code === "PGRST116" ||
        /multiple \(or no\) rows returned|0 rows/i.test(updateError.message || "")
      ) {
        return new Response(
          JSON.stringify({
            error: "No matching project found to update (check permissions or project ID)",
            details: updateError.message,
            code: updateError.code,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: `Failed to update project: ${updateError.message}`,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = updatedData;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        project: data,
        message: "Project updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
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
      }
    );
  }
};
