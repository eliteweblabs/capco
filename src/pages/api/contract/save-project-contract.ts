import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { saveMedia } from "../../../lib/media";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Check permissions - only Admin and Staff can save contracts
    const userRole = currentUser.profile?.role?.toLowerCase();
    console.log("🔍 [SAVE-PROJECT-CONTRACT] User role check:", {
      originalRole: currentUser.profile?.role,
      lowerCaseRole: userRole,
      isAdmin: userRole === "admin",
      isStaff: userRole === "staff",
      hasAccess: userRole === "admin" || userRole === "staff",
    });

    if (userRole !== "admin" && userRole !== "staff") {
      console.log("❌ [SAVE-PROJECT-CONTRACT] Access denied for role:", userRole);
      return createErrorResponse("Access denied - only Admin and Staff can save contracts", 403);
    }

    const body = await request.json();
    const { projectId, contractData } = body;

    if (!projectId) {
      return createErrorResponse("Project ID is required", 400);
    }

    if (!supabase) {
      return createErrorResponse("Database not configured", 500);
    }

    // Update project with contract HTML
    console.log("💾 [SAVE-PROJECT-CONTRACT] Saving contract for project:", projectId);
    console.log(
      "💾 [SAVE-PROJECT-CONTRACT] Contract HTML length:",
      contractData?.contractHtml?.length || 0
    );

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update({ contractData: { html: contractData.contractHtml } })
      .eq("id", projectId)
      .select("id, title, contractData")
      .single();

    if (error) {
      console.error("❌ [SAVE-PROJECT-CONTRACT] Database error:", error);
      console.error("❌ [SAVE-PROJECT-CONTRACT] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return createErrorResponse(`Failed to save project contract: ${error.message}`, 500);
    }

    console.log("✅ [SAVE-PROJECT-CONTRACT] Contract saved for project:", projectId);

    // Also save as a PDF document in the documents section
    try {
      console.log("📄 [SAVE-PROJECT-CONTRACT] Creating PDF document for documents section...");

      // Generate a unique document name
      const documentName = `Contract_${updatedProject.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}`;
      const fileName = `${documentName}.pdf`;

      // Convert HTML to PDF buffer
      const { convertHtmlToPdf } = await import("../pdf/upsert");
      const pdfBuffer = await convertHtmlToPdf(contractData.contractHtml);

      // Save as media document
      const mediaFile = await saveMedia({
        mediaData: pdfBuffer instanceof Buffer ? pdfBuffer.buffer : pdfBuffer,
        fileName: fileName,
        fileType: "application/pdf",
        projectId: projectId,
        targetLocation: "documents",
        title: `Contract - ${updatedProject.title}`,
        description: `Signed contract document for project: ${updatedProject.title}`,
        customVersionNumber: 1,
        currentUser: currentUser,
      });

      console.log("✅ [SAVE-PROJECT-CONTRACT] PDF document created:", mediaFile.id);

      return createSuccessResponse(
        {
          projectId: updatedProject.id,
          title: updatedProject.title,
          contractHtml: updatedProject.contractData?.html,
          hasCustomContract: !!updatedProject.contractData?.html,
          documentId: mediaFile.id,
          documentName: documentName,
          documentUrl: mediaFile.publicUrl,
        },
        "Project contract saved successfully and added to documents"
      );
    } catch (documentError) {
      console.error("⚠️ [SAVE-PROJECT-CONTRACT] Failed to create PDF document:", documentError);
      // Still return success for the contract save, but note the document creation failed
      return createSuccessResponse(
        {
          projectId: updatedProject.id,
          title: updatedProject.title,
          contractHtml: updatedProject.contractData?.html,
          hasCustomContract: !!updatedProject.contractData?.html,
          documentError: "Failed to create PDF document",
        },
        "Project contract saved successfully (PDF document creation failed)"
      );
    }
  } catch (error) {
    console.error("❌ [SAVE-PROJECT-CONTRACT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
