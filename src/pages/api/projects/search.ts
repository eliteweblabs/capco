import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { supabase } from "../../../lib/supabase";

/**
 * Search Projects API
 *
 * POST /api/projects/search
 *
 * Searches for projects by name, address, or client
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    if (!supabase) {
      return createErrorResponse("Supabase not initialized", 500);
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const { query, limit = 20 } = body;

    if (!query || query.trim().length === 0) {
      return createErrorResponse("Search query is required", 400);
    }

    console.log("🔍 [PROJECTS-SEARCH] Searching projects:", query);

    // Search projects with client information
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        address,
        status,
        createdAt,
        authorProfile:authorId (
          id,
          companyName,
          email,
          phone
        )
      `
      )
      .or(
        `title.ilike.%${query}%,address.ilike.%${query}%,authorProfile.companyName.ilike.%${query}%`
      )
      .limit(limit)
      .order("createdAt", { ascending: false });

    if (projectsError) {
      console.error("❌ [PROJECTS-SEARCH] Error searching projects:", projectsError);
      return createErrorResponse("Failed to search projects", 500);
    }

    console.log(`✅ [PROJECTS-SEARCH] Found ${projects?.length || 0} projects`);

    return createSuccessResponse({
      projects: projects || [],
      count: projects?.length || 0,
      query,
    });
  } catch (error) {
    console.error("❌ [PROJECTS-SEARCH] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
