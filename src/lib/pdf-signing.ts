/**
 * PDF Signing Module
 *
 * Signs PDFs with IdenTrust certificate using cryptographic digital signatures
 * Uses @signpdf/signpdf for PKCS#7 signature embedding
 * For encryption, use the existing password-based encryption module
 */

import { PDFDocument } from "pdf-lib";
import { loadCertificate, type CertificateData } from "./certificate-loader";
import forge from "node-forge";
import { SignPdf } from "@signpdf/signpdf";
import { Signer } from "@signpdf/utils";
import { plainAddPlaceholder } from "@signpdf/placeholder-plain";

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
 * Create a custom signer for @signpdf using forge certificate and private key
 * Extends the Signer class from @signpdf/utils
 */
class ForgeSigner extends Signer {
  private certData: CertificateData;

  constructor(certData: CertificateData) {
    super();
    this.certData = certData;
  }

  async sign(data: Buffer): Promise<Buffer> {
    // Create PKCS#7 signature using forge
    // Note: The authenticatedAttributes order is critical for correct signature validation
    // See: https://ec.europa.eu/digital-building-blocks/DSS/webapp-demo/validation
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(data.toString("binary"));
    
    // Add certificate
    p7.addCertificate(this.certData.certificate);
    
    // Add signer with correct attribute order:
    // 1. contentType (required)
    // 2. signingTime (required)
    // 3. messageDigest (auto-populated, no value needed)
    p7.addSigner({
      key: this.certData.privateKey,
      certificate: this.certData.certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data,
        },
        {
          type: forge.pki.oids.signingTime,
          value: new Date(),
        },
        {
          type: forge.pki.oids.messageDigest,
          // value will be auto-populated at signing time
        },
      ],
    });
    
    // Sign in detached mode (required for PDF signatures)
    p7.sign({ detached: true });
    
    // Convert to DER format (binary)
    const derBuffer = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");
    
    return derBuffer;
  }
}

/**
 * Create a signer instance
 */
function createForgeSigner(certData: CertificateData): ForgeSigner {
  return new ForgeSigner(certData);
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

    // Create signature metadata
    const signingMetadata = {
      signed: true,
      signer: certData.commonName,
      signedAt: new Date(),
      reason: options.reason || "Document certification",
      location: options.location || "Certified by CAPCO Design Group",
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

    console.log("✍️ [PDF-SIGNING] Creating signer from certificate...");
    
    // Step 2: Create custom signer using forge certificate
    const signer = createForgeSigner(certData);

    console.log("✍️ [PDF-SIGNING] Creating PKCS#7 signature...");
    
    // Step 3: Sign the PDF with cryptographic signature
    const signPdfInstance = new SignPdf();
    const signedPdfBuffer = await signPdfInstance.sign(pdfWithPlaceholder, signer);

    console.log("✅ [PDF-SIGNING] PDF cryptographically signed successfully, size:", signedPdfBuffer.length, "bytes");
    
    // Verify signature was embedded by checking for signature dictionary
    const pdfString = signedPdfBuffer.toString("binary");
    const hasSignature = pdfString.includes("/Type/Sig") || pdfString.includes("/ByteRange");
    console.log(`🔍 [PDF-SIGNING] Signature verification: ${hasSignature ? "✅ Signature dictionary found" : "⚠️ Signature dictionary not found"}`);
    
    if (!hasSignature) {
      console.warn("⚠️ [PDF-SIGNING] Warning: Signature dictionary not detected in PDF. PDF may not be properly signed.");
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
