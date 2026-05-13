import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { billUnbilledTimeForProject } from "../../../lib/bill-unbilled-time";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrSuperAdmin, normalizeUserRole } from "../../../lib/user-utils";

/**
 * POST { projectId: number }
 * Rolls completed, unbilled time entries for the project onto the latest invoice (or creates one),
 * appends labor lines to catalogLineItems, sets timeEntries.billedAt / billedInvoiceId.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!isAdminOrSuperAdmin(normalizeUserRole(currentUser.profile?.role))) {
      return createErrorResponse("Admin access required", 403);
    }

    if (!supabaseAdmin) {
      return createErrorResponse("Database unavailable", 503);
    }

    const body = await request.json();
    const projectId = parseInt(String(body.projectId ?? ""), 10);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return createErrorResponse("Valid positive projectId is required", 400);
    }

    const result = await billUnbilledTimeForProject(supabaseAdmin, projectId, currentUser.id);

    if (!result.ok) {
      if (result.code === "NO_UNBILLED") {
        return createSuccessResponse({
          billed: false,
          reason: result.code,
          message: result.message,
        });
      }
      return createErrorResponse(
        result.message,
        result.code === "NO_PROJECT" ? 404 : 400,
        undefined,
        result.code
      );
    }

    return createSuccessResponse({
      billed: true,
      invoiceId: result.invoiceId,
      aggregatedLines: result.aggregatedLines,
      timeEntriesBilled: result.timeEntriesBilled,
      laborSubtotal: result.laborSubtotal,
    });
  } catch (e) {
    console.error("[bill-unbilled-time API]", e);
    return createErrorResponse("Internal server error", 500);
  }
};
