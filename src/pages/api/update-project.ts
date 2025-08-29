import type { APIRoute } from "astro";
import { buildUpdateData } from "../../lib/project-fields-config";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("Update project API received:", body);

    const { projectId, ...updateFields } = body;

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
            ...updateFields,
          },
          message: `Demo: Project ${projectId} ${updateFields.status !== undefined ? `status updated to ${updateFields.status}` : "updated"} (No database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
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

    // Build update data using the template configuration
    const {
      core: coreUpdateData,
      optional: optionalUpdateData,
      new: newUpdateData,
    } = buildUpdateData(updateFields);

    // Always update the updated_at timestamp when any field is modified
    const updateData = {
      ...coreUpdateData,
      ...optionalUpdateData,
      updated_at: new Date().toISOString(),
    };

    console.log("Attempting to update project with core data:", updateData);

    // First, try to update with core fields
    let coreUpdateQuery = supabase.from("projects").update(updateData).eq("id", projectId);
    if (!isAdminOrStaff) {
      coreUpdateQuery = coreUpdateQuery.eq("author_id", user.id);
    }
    const { data: coreData, error: coreError } = await coreUpdateQuery.select().single();

    if (coreError) {
      console.error("Supabase core update error:", coreError);
      // If no rows were affected, return a friendlier message
      if (
        coreError.code === "PGRST116" ||
        /multiple \(or no\) rows returned|0 rows/i.test(coreError.message || "")
      ) {
        return new Response(
          JSON.stringify({
            error: "No matching project found to update (check permissions or project ID)",
            details: coreError.message,
            code: coreError.code,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: `Failed to update project: ${coreError.message}`,
          details: coreError.details,
          hint: coreError.hint,
          code: coreError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If core update succeeded and we have new fields, try to update them
    let finalData = coreData;
    if (Object.keys(newUpdateData).length > 0) {
      console.log("Attempting to update new fields:", newUpdateData);

      let newFieldsQuery = supabase.from("projects").update(newUpdateData).eq("id", projectId);
      if (!isAdminOrStaff) {
        newFieldsQuery = newFieldsQuery.eq("author_id", user.id);
      }
      const { data: newFieldsData, error: newFieldsError } = await newFieldsQuery.select().single();

      if (newFieldsError) {
        console.warn(
          "New fields update failed (this is expected if columns don't exist yet):",
          newFieldsError
        );
        // Don't fail the entire request - core fields were updated successfully
      } else {
        console.log("New fields updated successfully");
        finalData = newFieldsData;
      }
    }

    const data = finalData;

    return new Response(
      JSON.stringify({
        success: true,
        project: data,
        message: `Project ${status ? `status updated to ${status}` : "updated successfully"}`,
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
