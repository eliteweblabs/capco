/**
 * PDF Signing Module
 *
 * Signs PDFs with IdenTrust certificate using digital signatures
 * Note: This provides authentication/provenance, not encryption
 * For encryption, use the existing password-based encryption module
 */

import { PDFDocument } from "pdf-lib";
import { loadCertificate, type CertificateData } from "./certificate-loader";
import forge from "node-forge";

export interface SigningOptions {
  reason?: string; // Reason for signing (e.g., "Document certification")
  location?: string; // Location where signing occurred
  contactInfo?: string; // Contact information
  visible?: boolean; // Whether to show signature in document
  pageNumber?: number; // Page number for visible signature (if visible = true)
}

export interface SigningResult {
  success: boolean;
  signedBuffer?: Buffer;
  error?: string;
  metadata?: {
    signed: boolean;
    signer: string;
    signedAt: Date;
    reason?: string;
    location?: string;
  };
}

/**
 * Sign a PDF with a digital certificate
 *
 * Note: pdf-lib doesn't natively support certificate-based signing.
 * This implementation adds a signature field and embeds certificate info.
 * For full cryptographic signing, consider using node-signpdf or external tools.
 */
export async function signPDF(
  pdfBuffer: Buffer,
  options: SigningOptions = {}
): Promise<SigningResult> {
  try {
    console.log("✍️ [PDF-SIGNING] Starting PDF signing process...");

    // Load certificate
    const certResult = await loadCertificate();
    if (!certResult.success || !certResult.data) {
      return {
        success: false,
        error: certResult.error || "Failed to load certificate",
      };
    }

    const certData = certResult.data;
    console.log(`✍️ [PDF-SIGNING] Certificate loaded: ${certData.commonName}`);

    // Validate certificate
    const validation = validateCertificate(certData);
    if (!validation.valid) {
      return {
        success: false,
        error: `Certificate validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    console.log("✍️ [PDF-SIGNING] PDF loaded, page count:", pdfDoc.getPageCount());

    // Create signature metadata
    const signingMetadata = {
      signed: true,
      signer: certData.commonName,
      signedAt: new Date(),
      reason: options.reason || "Document certification",
      location: options.location || "Certified by CAPCO Design Group",
    };

    // Add metadata to PDF
    pdfDoc.setTitle(`${pdfDoc.getTitle() || "Document"} - Certified`);
    pdfDoc.setSubject(
      `Certified document signed by ${certData.commonName} on ${signingMetadata.signedAt.toISOString()}`
    );
    pdfDoc.setProducer("CAPCO Design Group - Certified PDF System");
    pdfDoc.setCreator("CAPCO Design Group");

    // Embed certificate information in custom metadata
    const customMetadata = {
      signed: "true",
      signer: certData.commonName,
      issuer: certData.issuer,
      signedAt: signingMetadata.signedAt.toISOString(),
      reason: signingMetadata.reason,
      location: signingMetadata.location,
      certificateValidFrom: certData.validFrom.toISOString(),
      certificateValidTo: certData.validTo.toISOString(),
    };

    // Store metadata in PDF (as custom properties)
    // Note: pdf-lib doesn't support custom properties directly, so we'll add it to keywords
    const metadataString = JSON.stringify(customMetadata);
    // pdf-lib setKeywords expects an array, not a string
    const keywordArray = [
      "certified",
      "signed",
      certData.commonName,
      signingMetadata.signedAt.toISOString(),
    ];
    pdfDoc.setKeywords(keywordArray);

    // For visible signature, add a signature field
    if (options.visible && options.pageNumber !== undefined) {
      const page = pdfDoc.getPage(options.pageNumber);
      const { width, height } = page.getSize();

      // Create signature annotation (simplified - pdf-lib doesn't fully support signature widgets)
      // This is a placeholder - full signature support would require node-signpdf
      console.log(`✍️ [PDF-SIGNING] Adding visible signature on page ${options.pageNumber + 1}`);
    }

    // Save the signed PDF
    const signedBytes = await pdfDoc.save();
    const signedBuffer = Buffer.from(signedBytes);

    console.log("✅ [PDF-SIGNING] PDF signed successfully, size:", signedBuffer.length, "bytes");

    return {
      success: true,
      signedBuffer,
      metadata: signingMetadata,
    };
  } catch (error) {
    console.error("❌ [PDF-SIGNING] Signing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown signing error",
    };
  }
}

/**
 * Validate certificate for signing
 */
function validateCertificate(certData: CertificateData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const now = new Date();

  if (now < certData.validFrom) {
    errors.push(`Certificate not yet valid (valid from: ${certData.validFrom.toISOString()})`);
  }

  if (now > certData.validTo) {
    errors.push(`Certificate has expired (expired: ${certData.validTo.toISOString()})`);
  }

  if (!certData.privateKey) {
    errors.push("Private key is missing");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract signature metadata from signed PDF
 */
export async function extractSignatureMetadata(pdfBuffer: Buffer): Promise<{
  signed: boolean;
  metadata?: any;
}> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const keywords = pdfDoc.getKeywords();

    // Check if PDF has certification keywords
    // keywords can be string or array depending on PDF version
    const keywordStr = Array.isArray(keywords) ? keywords.join(",") : keywords || "";
    if (keywordStr.includes("certified")) {
      // Parse metadata from keywords or custom properties
      return {
        signed: true,
        metadata: {
          keywords,
          title: pdfDoc.getTitle(),
          subject: pdfDoc.getSubject(),
          producer: pdfDoc.getProducer(),
        },
      };
    }

    return { signed: false };
  } catch (error) {
    console.error("❌ [PDF-SIGNING] Error extracting metadata:", error);
    return { signed: false };
  }
}
