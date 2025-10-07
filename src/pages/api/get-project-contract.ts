import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-optimization";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders } from "../../lib/placeholder-utils";

export const POST: APIRoute = async ({ url, cookies, request }) => {
  try {
    // Get current user
    // console.log("🔍 [GET-PROJECT-CONTRACT] Checking authentication...");
    const { currentUser, isAuth } = await checkAuth(cookies);
    const body = await request.json();
    const { projectData } = body;
    if (!isAuth || !currentUser) {
      // console.log("❌ [GET-PROJECT-CONTRACT] Authentication required");
      return createErrorResponse("Authentication required", 401);
    }

    const contractHtml = await replacePlaceholders(projectData.contract_html, { project: projectData });

    return createSuccessResponse(
      {
        projectId: projectData.id,
        title: projectData.title,
        contractHtml: contractHtml,
        hasCustomContract: !!projectData.contract_html,
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
