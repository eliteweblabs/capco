/**
 * PDF Signing Module
 *
 * Signs PDFs with IdenTrust certificate using cryptographic digital signatures
 * Uses @signpdf/signpdf for PKCS#7 signature embedding
 * For encryption, use the existing password-based encryption module
 */

import { PDFDocument } from "pdf-lib";
import { loadCertificate, type CertificateData } from "./certificate-loader";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import { plainAddPlaceholder } from "@signpdf/placeholder-plain";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { globalCompanyData } from "../pages/api/global/global-company-data";

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
 * Get P12 buffer and password for P12Signer
 * Returns the raw P12 buffer and password from environment or file
 */
function getP12BufferAndPassword(): { p12Buffer: Buffer; password: string } | null {
  // Try base64 first (for Railway/deployment)
  const base64Cert = process.env.CERT_BASE64;
  const certPassword = process.env.CERT_PASSWORD;

  if (base64Cert && certPassword) {
    const cleanedBase64 = base64Cert
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, "")
      .trim();
    const cleanedPassword = certPassword.replace(/^["']|["']$/g, "").trim();

    try {
      const p12Buffer = Buffer.from(cleanedBase64, "base64");
      return { p12Buffer, password: cleanedPassword };
    } catch (error) {
      console.error("❌ [PDF-SIGNING] Failed to decode base64 certificate:", error);
      return null;
    }
  }

  // Try file path (for local development)
  const certPath = process.env.CERT_PATH || process.env.DEV_CERT_PATH;
  if (certPath && certPassword && existsSync(certPath)) {
    try {
      const p12Buffer = readFileSync(certPath);
      const cleanedPassword = certPassword.replace(/^["']|["']$/g, "").trim();
      return { p12Buffer, password: cleanedPassword };
    } catch (error) {
      console.error("❌ [PDF-SIGNING] Failed to read certificate file:", error);
      return null;
    }
  }

  // Try default certs directory
  const defaultCertsDir = join(process.cwd(), "certs");
  const defaultCertPath = join(defaultCertsDir, "identrust.p12");
  if (existsSync(defaultCertPath) && certPassword) {
    try {
      const p12Buffer = readFileSync(defaultCertPath);
      const cleanedPassword = certPassword.replace(/^["']|["']$/g, "").trim();
      return { p12Buffer, password: cleanedPassword };
    } catch (error) {
      console.error("❌ [PDF-SIGNING] Failed to read default certificate:", error);
      return null;
    }
  }

  return null;
}

/**
 * Sign a PDF with a digital certificate using cryptographic PKCS#7 signature
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

    // Get company name from database for default location
    const companyData = await globalCompanyData();
    const defaultLocation = `Certified by ${companyData.globalCompanyName || "Company"}`;

    // Create signature metadata
    const signingMetadata = {
      signed: true,
      signer: certData.commonName,
      signedAt: new Date(),
      reason: options.reason || "Document certification",
      location: options.location || defaultLocation,
    };

    console.log("✍️ [PDF-SIGNING] Adding placeholder for signature...");

    // Step 1: Add placeholder for signature FIRST (on original PDF)
    // This must be done before any pdf-lib modifications to avoid breaking PDF structure
    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: signingMetadata.reason,
      contactInfo: options.contactInfo || "",
      name: certData.commonName,
      location: signingMetadata.location,
    });

    console.log("✍️ [PDF-SIGNING] Creating signer from P12 certificate...");

    // Step 2: Use P12Signer directly (proven implementation from @signpdf)
    // This ensures proper certificate chain handling and signature format
    const p12Data = getP12BufferAndPassword();
    if (!p12Data) {
      return {
        success: false,
        error:
          "Failed to load P12 certificate buffer. Please ensure CERT_BASE64/CERT_PASSWORD or CERT_PATH/CERT_PASSWORD are set.",
      };
    }

    const signer = new P12Signer(p12Data.p12Buffer, {
      passphrase: p12Data.password,
    });

    console.log("✍️ [PDF-SIGNING] Creating PKCS#7 signature...");

    // Step 3: Sign the PDF with cryptographic signature
    const signPdfInstance = new SignPdf();
    const signedPdfBuffer = await signPdfInstance.sign(pdfWithPlaceholder, signer);

    console.log(
      "✅ [PDF-SIGNING] PDF cryptographically signed successfully, size:",
      signedPdfBuffer.length,
      "bytes"
    );

    // Verify signature was embedded by checking for signature dictionary
    const pdfString = signedPdfBuffer.toString("binary");
    const hasSignature = pdfString.includes("/Type/Sig") || pdfString.includes("/ByteRange");
    console.log(
      `🔍 [PDF-SIGNING] Signature verification: ${hasSignature ? "✅ Signature dictionary found" : "⚠️ Signature dictionary not found"}`
    );

    if (!hasSignature) {
      console.warn(
        "⚠️ [PDF-SIGNING] Warning: Signature dictionary not detected in PDF. PDF may not be properly signed."
      );
    }

    return {
      success: true,
      signedBuffer: signedPdfBuffer,
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
