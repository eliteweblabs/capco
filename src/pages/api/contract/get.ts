import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { replacePlaceholders } from "../../../lib/placeholder-utils";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Get project ID from query params
    const projectId = url.searchParams.get("id");
    if (!projectId) {
      return createErrorResponse("Project ID is required", 400);
    }

    // Import supabase client
    const { supabase } = await import("../../../lib/supabase");
    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, contractData")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return createErrorResponse("Project not found", 404);
    }

    // Replace placeholders in contract HTML
    const contractHtml = await replacePlaceholders(project.contractData?.html, {
      project: project as any,
    });

    return createSuccessResponse(
      {
        projectId: project.id,
        title: project.title,
        contractHtml: contractHtml,
        hasCustomContract: !!project.contractData?.html,
      },
      "Project contract retrieved successfully"
    );
  } catch (error) {
    console.error("❌ [GET-PROJECT-CONTRACT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
