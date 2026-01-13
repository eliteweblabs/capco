import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { supabase } from "../../../lib/supabase";
import { signAndEncryptPDF, createSignAndEncryptOptionsFromForm } from "../../../lib/pdf-sign-encrypt";

/**
 * Sign and Encrypt PDF API
 *
 * POST /api/pdf/sign-encrypt
 *
 * Signs an uploaded PDF with IdenTrust certificate AND encrypts it with password
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
      return createErrorResponse("Only Admin and Staff can sign and encrypt PDFs", 403);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return createErrorResponse("PDF file is required", 400);
    }

    if (file.type !== "application/pdf") {
      return createErrorResponse("File must be a PDF", 400);
    }

    // Create combined options from form data
    const options = await createSignAndEncryptOptionsFromForm(formData);

    console.log("🔐✍️ [PDF-SIGN-ENCRYPT] Processing PDF:", {
      fileName: file.name,
      fileSize: file.size,
      willSign: true,
      willEncrypt: options.encryption.enabled,
      user: user.id,
    });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Sign and encrypt the PDF
    const result = await signAndEncryptPDF(pdfBuffer, options);

    if (!result.success || !result.signedAndEncryptedBuffer) {
      console.error("❌ [PDF-SIGN-ENCRYPT] Operation failed:", result.error);
      return createErrorResponse(
        `PDF signing/encryption failed: ${result.error || "Unknown error"}`,
        500
      );
    }

    // Check if encryption failed but signing succeeded
    const encryptionFailed = result.error && result.error.includes("Encryption unavailable");
    if (encryptionFailed) {
      console.warn("⚠️ [PDF-SIGN-ENCRYPT] Encryption failed, but signing succeeded:", result.error);
    }

    console.log("✅ [PDF-SIGN-ENCRYPT] PDF signed and encrypted successfully");

    // Save PDF to storage
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.pdf$/i, "");
    const suffix = result.metadata?.encrypted ? "signed_encrypted" : "signed";
    const fileName = `${originalName}_${suffix}_${timestamp}.pdf`;
    const filePath = `pdfs/signed/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(filePath, result.signedAndEncryptedBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [PDF-SIGN-ENCRYPT] Error uploading PDF:", uploadError);
      return createErrorResponse("Failed to save PDF", 500);
    }

    // Get signed URL for download
    const { data: urlData, error: urlError } = await supabase.storage
      .from("project-media")
      .createSignedUrl(filePath, 3600);

    if (urlError) {
      console.error("❌ [PDF-SIGN-ENCRYPT] Error creating signed URL:", urlError);
    }

    const message = encryptionFailed
      ? `PDF signed successfully. Warning: ${result.error}`
      : `PDF ${result.metadata?.encrypted ? "signed and encrypted" : "signed"} successfully`;

    return createSuccessResponse({
      success: true,
      fileName,
      filePath,
      downloadUrl: urlData?.signedUrl || null,
      metadata: result.metadata,
      message,
      warning: encryptionFailed ? result.error : undefined,
    });
  } catch (error) {
    console.error("❌ [PDF-SIGN-ENCRYPT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
      500
    );
  }
};

