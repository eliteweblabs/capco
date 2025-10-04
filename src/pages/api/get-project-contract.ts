import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-optimization";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders } from "../../lib/placeholder-utils";

export const POST: APIRoute = async ({ url, cookies, request }) => {
  try {
    // Get current user
    console.log("🔍 [GET-PROJECT-CONTRACT] Checking authentication...");
    const { currentUser, isAuth } = await checkAuth(cookies);
    const body = await request.json();
    const { projectData } = body;
    if (!isAuth || !currentUser) {
      console.log("❌ [GET-PROJECT-CONTRACT] Authentication required");
      return createErrorResponse("Authentication required", 401);
    }

    // if (!supabase) {
    //   return createErrorResponse("Database not configured", 500);
    // }

    // // Use the existing get-project API as single source of truth
    // console.log("🔍 [GET-PROJECT-CONTRACT] Fetching project data for placeholders:", projectId);

    // try {
    //   const baseUrl = new URL(url).origin;
    //   const apiUrl = `${baseUrl}/api/get-project?id=${projectId}`;

    //   console.log("🏗️ [PROJECT] Fetching project from API:", apiUrl);
    //   const response = await fetch(apiUrl, {
    //     method: "GET",
    //     headers: {
    //       Cookie: cookies.toString(),
    //     },
    //   });

    //   console.log("🏗️ [PROJECT] Response status:", response.status);

    //   if (response.ok) {
    //     const data = await response.json();
    //     if (data.success) {
    //       projectData = data.project; // Use the project field from the API response
    //     } else {
    //       console.error("🏗️ [PROJECT] API returned error:", data.error);
    //       return createErrorResponse("Failed to fetch project", 500);
    //     }
    //   } else {
    //     console.error("🏗️ [PROJECT] Error fetching project:", response.status, response.statusText);
    //     return createErrorResponse("Failed to fetch project", 500);
    //   }
    // } catch (error) {
    //   console.error("🏗️ [PROJECT] Error fetching project:", error);
    //   return createErrorResponse("Failed to fetch project", 500);
    // }

    // const { data: project, error } = await supabase
    //   .from("projects")
    //   .select("id, title, contract_html")
    //   .eq("id", projectId)
    //   .single();

    // if (error) {
    //   console.error("❌ [GET-PROJECT-CONTRACT] Database error:", error);
    //   return createErrorResponse("Failed to fetch project contract", 500);
    // }

    // if (!project) {
    //   console.log("❌ [GET-PROJECT-CONTRACT] Project not found:", projectId);
    //   return createErrorResponse("Project not found", 404);
    // }

    const contractHtml = replacePlaceholders(projectData.contract_html, { project: projectData });

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
