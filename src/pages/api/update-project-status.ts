import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("Update project API received:", body);
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
      owner,
      architect,
      units,
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
            owner,
            architect,
            units,
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
            owner,
            architect,
            units,
          },
          message: `Demo: Project ${projectId} ${status !== undefined ? `status updated to ${status}` : "updated"} (Demo mode - sign in for real database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
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

    // Update project with provided fields (only core fields that definitely exist)
    const updateData: any = {};

    // Core fields that should exist in most projects tables
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (sq_ft !== undefined) updateData.sq_ft = sq_ft;
    if (new_construction !== undefined)
      updateData.new_construction = new_construction;

    // Core fields - only add if they have values to avoid database errors
    if (building !== undefined && building !== "")
      updateData.building = building;
    if (project !== undefined && project !== "") updateData.project = project;
    if (service !== undefined && service !== "") updateData.service = service;
    if (requested_docs !== undefined && requested_docs !== "")
      updateData.requested_docs = requested_docs;
    if (assigned_to_id !== undefined && assigned_to_id !== "")
      updateData.assigned_to_id = assigned_to_id;

    // Additional fields - handle gracefully in case they don't exist in the database yet
    // We'll try these but catch any column-not-found errors
    const potentialNewFields: any = {};
    if (owner !== undefined && owner !== "") potentialNewFields.owner = owner;
    if (architect !== undefined && architect !== "")
      potentialNewFields.architect = architect;
    if (units !== undefined) potentialNewFields.units = units;

    // Ensure units is persisted even if there is no dedicated column by
    // merging it into the description JSON payload.
    // If the client already sent a description, we prefer merging into it;
    // otherwise we attempt to merge into the current DB description.
    try {
      const metadata: Record<string, any> = {};
      if (typeof units !== "undefined" && units !== null && units !== "") {
        metadata.units = units;
      }
      if (Object.keys(metadata).length > 0) {
        let baseDescription: any = {};
        if (typeof updateData.description === "string" && updateData.description.trim() !== "") {
          try { baseDescription = JSON.parse(updateData.description); } catch { baseDescription = {}; }
        } else {
          // Load existing description to merge into, respecting role permissions
          let descQuery = supabase.from("projects").select("description").eq("id", projectId);
          if (!isAdminOrStaff) {
            descQuery = descQuery.eq("author_id", user.id);
          }
          const { data: existing } = await descQuery.single();
          if (existing?.description) {
            try { baseDescription = JSON.parse(existing.description); } catch { baseDescription = {}; }
          }
        }
        const merged = { ...(baseDescription || {}), ...metadata };
        updateData.description = JSON.stringify(merged);
      }
    } catch (mergeErr) {
      console.warn("Non-blocking: failed to merge units into description JSON", mergeErr);
    }

    // Always update the updated_at timestamp when any field is modified
    updateData.updated_at = new Date().toISOString();

    console.log("Attempting to update project with core data:", updateData);

    // First, try to update with core fields
    let coreUpdateQuery = supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);
    if (!isAdminOrStaff) {
      coreUpdateQuery = coreUpdateQuery.eq("author_id", user.id);
    }
    const { data: coreData, error: coreError } = await coreUpdateQuery
      .select()
      .single();

    if (coreError) {
      console.error("Supabase core update error:", coreError);
      // If no rows were affected, return a friendlier message
      if (
        coreError.code === "PGRST116" ||
        /multiple \(or no\) rows returned|0 rows/i.test(coreError.message || "")
      ) {
        return new Response(
          JSON.stringify({
            error:
              "No matching project found to update (check permissions or project ID)",
            details: coreError.message,
            code: coreError.code,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
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
        },
      );
    }

    // If core update succeeded and we have potential new fields, try to update them
    let finalData = coreData;
    if (Object.keys(potentialNewFields).length > 0) {
      console.log("Attempting to update new fields:", potentialNewFields);

      let newFieldsQuery = supabase
        .from("projects")
        .update(potentialNewFields)
        .eq("id", projectId);
      if (!isAdminOrStaff) {
        newFieldsQuery = newFieldsQuery.eq("author_id", user.id);
      }
      const { data: newFieldsData, error: newFieldsError } =
        await newFieldsQuery.select().single();

      if (newFieldsError) {
        console.warn(
          "New fields update failed (this is expected if columns don't exist yet):",
          newFieldsError,
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
