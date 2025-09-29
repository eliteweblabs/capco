import type { APIRoute } from "astro";
import { createErrorResponse, getCurrentUser } from "../../../lib/api-optimization";

// Simple interface for project updates
interface ProjectUpdateFormData {
  [key: string]: any;
}

// Simple utility functions
const sanitizeFormData = (data: ProjectUpdateFormData) => data;
const validateProjectUpdate = (data: ProjectUpdateFormData) => [];
const mapFormDataToProject = (data: ProjectUpdateFormData) => data;

import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  console.log("🔧 [UPDATE-PROJECT] API called with projectId:", params.id);
  try {
    const body = await request.json();
    console.log("🔧 [UPDATE-PROJECT] Request body:", body);
    const projectId = params.id;

    if (!projectId) {
      return createErrorResponse("Project ID required", 400);
    }

    // Get current user (optimized to use provided user if available)
    const { currentUser } = await getCurrentUser(cookies, body);
    if (!currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    const userRole = currentUser.profile?.role?.toLowerCase();

    // Check permissions - only Admin and Staff can update projects
    if (userRole !== "admin" && userRole !== "staff") {
      return createErrorResponse("Access denied", 403);
    }

    // Get current project data for logging
    const { data: currentProject, error: fetchError } = await supabase!
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !currentProject) {
      return createErrorResponse("Project not found", 404);
    }

    // Sanitize and validate form data
    const sanitizedData = sanitizeFormData(body as ProjectUpdateFormData);
    const validationErrors = validateProjectUpdate(sanitizedData);

    if (validationErrors.length > 0) {
      return createErrorResponse(`Validation failed: ${validationErrors.join(", ")}`, 400);
    }

    // Map form data directly to database fields (no manual mapping!)
    const updateData = mapFormDataToProject(sanitizedData);
    console.log("🔧 [UPDATE-PROJECT] Mapped update data:", updateData);

    // Update the project
    const { data: project, error: updateError } = await supabase!
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating project:", updateError);
      return createErrorResponse("Failed to update project", 500);
    }

    // Log the update
    await SimpleProjectLogger.addLogEntry(
      parseInt(projectId),
      "project_updated",
      currentUser,
      "Project was updated",
      { oldData: currentProject, newData: project }
    );

    return new Response(
      JSON.stringify({
        success: true,
        project: project,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [UPDATE-PROJECT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
