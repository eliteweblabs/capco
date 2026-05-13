import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { isAdminOrStaffOrSuperAdmin, normalizeUserRole } from "../../../../lib/user-utils";

/**
 * GET — list active deliverable PDF templates (metadata only).
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!isAdminOrStaffOrSuperAdmin(normalizeUserRole(currentUser.profile?.role))) {
      return createErrorResponse("Insufficient permissions", 403);
    }

    if (!supabaseAdmin) {
      return createErrorResponse("Database unavailable", 503);
    }

    const { data, error } = await supabaseAdmin
      .from("deliverableTemplates")
      .select("id, title, description, storageBucket, storagePath, isActive, sortOrder, updatedAt")
      .eq("isActive", true)
      .order("sortOrder", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      console.error("[deliverables/templates]", error);
      return createErrorResponse("Failed to load templates", 500);
    }

    return createSuccessResponse({ templates: data || [] });
  } catch (e) {
    console.error("[deliverables/templates]", e);
    return createErrorResponse("Internal server error", 500);
  }
};
