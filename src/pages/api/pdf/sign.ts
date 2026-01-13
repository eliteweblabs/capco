import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { supabase } from "../../../lib/supabase";
import { signPDF, type SigningOptions } from "../../../lib/pdf-signing";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { globalCompanyData } from "../global/global-company-data";

/**
 * Sign PDF API
 *
 * POST /api/pdf/sign
 *
 * Signs an uploaded PDF with the IdenTrust certificate
 * Requires: Admin or Staff role
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse("Authentication required", 401);
    }

    // Check user role (Admin or Staff only)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "Client";
    if (userRole !== "Admin" && userRole !== "Staff") {
      return createErrorResponse("Only Admin and Staff can sign PDFs", 403);
    }

    // Get company name from database for default location
    const companyData = await globalCompanyData();
    const defaultLocation = `Certified by ${companyData.globalCompanyName || "Company"}`;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reason = (formData.get("reason") as string) || "Document certification";
    const location = (formData.get("location") as string) || defaultLocation;
    const contactInfo = (formData.get("contactInfo") as string) || "";
    const visible = formData.get("visible") === "true";
    const pageNumberStr = formData.get("pageNumber") as string;
    const pageNumber = pageNumberStr ? parseInt(pageNumberStr, 10) - 1 : undefined; // Convert to 0-based

    if (!file) {
      return createErrorResponse("PDF file is required", 400);
    }

    if (file.type !== "application/pdf") {
      return createErrorResponse("File must be a PDF", 400);
    }

    console.log("✍️ [PDF-SIGN] Signing PDF:", {
      fileName: file.name,
      fileSize: file.size,
      reason,
      location,
      user: user.id,
    });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Sign the PDF
    const signingOptions: SigningOptions = {
      reason,
      location,
      contactInfo,
      visible,
      pageNumber,
    };

    const signingResult = await signPDF(pdfBuffer, signingOptions);

    if (!signingResult.success || !signingResult.signedBuffer) {
      console.error("❌ [PDF-SIGN] Signing failed:", signingResult.error);
      return createErrorResponse(
        `PDF signing failed: ${signingResult.error || "Unknown error"}`,
        500
      );
    }

    console.log("✅ [PDF-SIGN] PDF signed successfully");

    // Save signed PDF to storage
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.pdf$/i, "");
    const fileName = `${originalName}_signed_${timestamp}.pdf`;
    const filePath = `pdfs/signed/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(filePath, signingResult.signedBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [PDF-SIGN] Error uploading signed PDF:", uploadError);
      return createErrorResponse("Failed to save signed PDF", 500);
    }

    // Get signed URL for download
    const { data: urlData, error: urlError } = await supabase.storage
      .from("project-media")
      .createSignedUrl(filePath, 3600);

    if (urlError) {
      console.error("❌ [PDF-SIGN] Error creating signed URL:", urlError);
    }

    return createSuccessResponse({
      success: true,
      fileName,
      filePath,
      downloadUrl: urlData?.signedUrl || null,
      metadata: signingResult.metadata,
      message: "PDF signed successfully",
    });
  } catch (error) {
    console.error("❌ [PDF-SIGN] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
      500
    );
  }
};
