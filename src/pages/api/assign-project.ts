import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, assignedToId } = await request.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!supabase) {
      // Demo mode - simulate successful assignment
      return new Response(
        JSON.stringify({
          success: true,
          message: `Demo: Project ${projectId} assigned to ${assignedToId || "unassigned"} (no database interaction)`,
          projectId,
          assignedToId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user to verify permissions
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role;

    // Only admins can assign projects
    if (userRole !== "Admin") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Only admins can assign projects",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // If assignedToId is provided, verify the staff member exists
    if (assignedToId) {
      const { data: staffMember } = await supabase
        .from("profiles")
        .select("id, name, role")
        .eq("id", assignedToId)
        .eq("role", "Staff")
        .single();

      if (!staffMember) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid staff member ID or staff member not found",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Update the project assignment
    const { data, error } = await supabase
      .from("projects")
      .update({
        assigned_to_id: assignedToId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select("id, assigned_to_id")
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update project assignment",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get the assigned staff member's name for the response
    let assignedStaffName = "Unassigned";
    if (assignedToId) {
      const { data: staffMember } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", assignedToId)
        .single();

      assignedStaffName = staffMember?.name || "Unknown Staff";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Project ${projectId} successfully assigned to ${assignedStaffName}`,
        data: {
          projectId: data.id,
          assignedToId: data.assigned_to_id,
          assignedToName: assignedStaffName,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Unexpected error in assign-project:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: (error as Error)?.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
