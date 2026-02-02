import type { APIRoute } from "astro";
import { createErrorResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";

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

// Helper function to generate descriptive log messages
function generateUpdateLogMessage(oldData: any, newData: any): string {
  const changes: string[] = [];

  // Field labels for better readability
  const fieldLabels: Record<string, string> = {
    title: "Title",
    address: "Address",
    description: "Description",
    sqFt: "Square Footage",
    status: "Status",
    newConstruction: "New Construction",
    assignedTo: "Assigned To",
    buildingTypes: "Building Types",
    systems: "Systems",
    waterSupply: "Water Supply",
    buildingDetails: "Building Details",
  };

  // Compare fields and track changes
  for (const key in newData) {
    if (key === "log" || key === "updatedAt" || key === "createdAt") {
      continue; // Skip metadata fields
    }

    const oldValue = oldData?.[key];
    const newValue = newData[key];

    // Check if value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      const label = fieldLabels[key] || key;

      // Format the change message based on the type
      if (Array.isArray(newValue)) {
        changes.push(`${label}: ${newValue.join(", ") || "None"}`);
      } else if (typeof newValue === "boolean") {
        changes.push(`${label}: ${newValue ? "Yes" : "No"}`);
      } else if (newValue === null || newValue === undefined || newValue === "") {
        changes.push(`${label} cleared`);
      } else {
        changes.push(`${label}: ${newValue}`);
      }
    }
  }

  if (changes.length === 0) {
    return "Project was updated";
  }

  if (changes.length === 1) {
    return `Updated ${changes[0]}`;
  }

  if (changes.length <= 3) {
    return `Updated ${changes.join(", ")}`;
  }

  return `Updated ${changes.length} fields: ${changes.slice(0, 2).join(", ")}, and ${changes.length - 2} more`;
}

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  console.log("🔧 [UPDATE-PROJECT] API called with projectId:", params.id);
  try {
    const body = await request.json();
    console.log("🔧 [UPDATE-PROJECT] Request body:", body);
    const projectId = params.id;

    if (!projectId) {
      return createErrorResponse("Project ID required", 400);
    }

    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
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

    // Log the update with descriptive message
    const logMessage = generateUpdateLogMessage(currentProject, project);
    await SimpleProjectLogger.addLogEntry(parseInt(projectId), "projectUpdated", logMessage, {
      oldData: currentProject,
      newData: project,
    });

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
