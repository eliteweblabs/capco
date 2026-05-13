import type { APIRoute } from "astro";
import { createErrorResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { fetchProjectById } from "../../../../lib/api/_projects";
import { fillDeliverablePdf } from "../../../../lib/fill-deliverable-pdf";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { globalCompanyData } from "../../global/global-company-data";
import { isAdminOrStaffOrSuperAdmin, normalizeUserRole } from "../../../../lib/user-utils";

interface Body {
  projectId?: unknown;
  templateId?: unknown;
  flatten?: unknown;
}

/**
 * POST JSON { projectId: number, templateId: uuid, flatten?: boolean } — fills AcroForm fields and streams PDF bytes.
 */
export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!isAdminOrStaffOrSuperAdmin(normalizeUserRole(currentUser.profile?.role))) {
      return createErrorResponse("Insufficient permissions", 403);
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return createErrorResponse("JSON body required", 400);
    }

    const projectId = parseInt(String(body.projectId ?? ""), 10);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return createErrorResponse("Valid projectId is required", 400);
    }

    const templateId = String(body.templateId ?? "").trim();
    if (!templateId) {
      return createErrorResponse("templateId is required", 400);
    }

    const flatten = body.flatten !== false;

    if (!supabaseAdmin) {
      return createErrorResponse("Database unavailable", 503);
    }

    const project = await fetchProjectById(supabaseAdmin, projectId);
    if (!project) {
      return createErrorResponse("Project not found", 404);
    }

    const { data: template, error: tErr } = await supabaseAdmin
      .from("deliverableTemplates")
      .select("id, title, storageBucket, storagePath, isActive")
      .eq("id", templateId)
      .eq("isActive", true)
      .maybeSingle();

    if (tErr || !template) {
      return createErrorResponse("Template not found or inactive", 404);
    }

    const bucket = String(template.storageBucket || "deliverable-templates").trim();
    const path = String(template.storagePath || "").trim();
    if (!path) {
      return createErrorResponse("Template has no storage path", 400);
    }

    const dl = await supabaseAdmin.storage.from(bucket).download(path);
    if (dl.error || !dl.data) {
      console.error("[deliverables/generate] Storage download:", dl.error);
      return createErrorResponse("Could not download template PDF from storage", 502);
    }

    const rawBuf = await dl.data.arrayBuffer();
    const company = await globalCompanyData();

    const result = await fillDeliverablePdf({
      templateBytes: rawBuf,
      project: project as Record<string, unknown>,
      flatten,
      extras: {
        installerCompanyName: company.globalCompanyName ?? "",
        installerPhone: company.globalCompanyPhone,
        installerEmail: company.globalCompanyEmail,
        installerWebsite: company.globalCompanyWebsite,
        installerAddress: company.globalCompanyAddress,
        appOrigin: url.origin,
      },
    });

    const hdrWarnings = result.warnings.filter(Boolean).join(" | ");

    const safeBase = String(template.title ?? "deliverable")
      .replace(/[^a-z0-9-_]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 72);
    const filename = `${safeBase || "deliverable"}-project-${projectId}.pdf`;

    return new Response(result.pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        ...(hdrWarnings ? { "X-Deliverable-Warnings": hdrWarnings.slice(0, 2000) } : {}),
        "X-Deliverable-Fields-Filled": String(result.fieldsFilled),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[deliverables/generate]", e);
    return createErrorResponse("Internal server error", 500);
  }
};
