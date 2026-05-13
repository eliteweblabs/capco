import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { fetchProjectById } from "../../../../lib/api/_projects";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  DELIVERABLE_SHORTCODE_ROWS,
  buildDeliverableShortcodeValues,
  normalizeShortcodeKey,
} from "../../../../lib/project-deliverables-shortcodes";
import { globalCompanyData } from "../../global/global-company-data";
import { isAdminOrStaffOrSuperAdmin, normalizeUserRole } from "../../../../lib/user-utils";

/**
 * GET ?projectId=N — preview resolved shortcode values for the Deliverables UI.
 */
export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!isAdminOrStaffOrSuperAdmin(normalizeUserRole(currentUser.profile?.role))) {
      return createErrorResponse("Insufficient permissions", 403);
    }

    const projectId = parseInt(String(url.searchParams.get("projectId") || ""), 10);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return createErrorResponse("Valid projectId is required", 400);
    }

    if (!supabaseAdmin) {
      return createErrorResponse("Database unavailable", 503);
    }

    const project = await fetchProjectById(supabaseAdmin, projectId);
    if (!project) {
      return createErrorResponse("Project not found", 404);
    }

    const company = await globalCompanyData();

    const valueMap = buildDeliverableShortcodeValues(project as Record<string, unknown>, {
      installerCompanyName: company.globalCompanyName ?? "",
      installerPhone: company.globalCompanyPhone,
      installerEmail: company.globalCompanyEmail,
      installerWebsite: company.globalCompanyWebsite,
      installerAddress: company.globalCompanyAddress,
      appOrigin: url.origin,
    });

    const rows = DELIVERABLE_SHORTCODE_ROWS.map((row) => ({
      shortcode: row.shortcode,
      pdfFieldHint: row.pdfFieldHint,
      description: row.description,
      value: valueMap[normalizeShortcodeKey(row.pdfFieldHint)] ?? "",
    }));

    return createSuccessResponse({ rows });
  } catch (e) {
    console.error("[deliverables/preview-values]", e);
    return createErrorResponse("Internal server error", 500);
  }
};
