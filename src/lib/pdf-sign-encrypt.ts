/**
 * Combined PDF Signing and Encryption Module
 *
 * Signs PDFs with IdenTrust certificate AND encrypts with password
 * Provides both authentication (signing) and access control (encryption)
 */

import { signPDF, type SigningOptions } from "./pdf-signing";
import { encryptPDF, type EncryptionOptions } from "./pdf-encryption";

export interface SignAndEncryptOptions {
  signing: SigningOptions;
  encryption: EncryptionOptions;
}

export interface SignAndEncryptResult {
  success: boolean;
  signedAndEncryptedBuffer?: Buffer;
  error?: string;
  metadata?: {
    signed: boolean;
    encrypted: boolean;
    signer?: string;
    signedAt?: Date;
    hasUserPassword: boolean;
    hasOwnerPassword: boolean;
    permissions?: EncryptionOptions["permissions"];
  };
}

/**
 * Sign and encrypt a PDF in one operation
 *
 * @param pdfBuffer - The PDF buffer to sign and encrypt
 * @param options - Combined signing and encryption options
 * @returns Promise<SignAndEncryptResult>
 */
export async function signAndEncryptPDF(
  pdfBuffer: Buffer,
  options: SignAndEncryptOptions
): Promise<SignAndEncryptResult> {
  try {
    console.log("🔐✍️ [PDF-SIGN-ENCRYPT] Starting combined sign and encrypt process...");

    // Step 1: Sign the PDF first
    console.log("✍️ [PDF-SIGN-ENCRYPT] Step 1: Signing PDF...");
    const signingResult = await signPDF(pdfBuffer, options.signing);

    if (!signingResult.success || !signingResult.signedBuffer) {
      return {
        success: false,
        error: `PDF signing failed: ${signingResult.error || "Unknown error"}`,
      };
    }

    console.log("✅ [PDF-SIGN-ENCRYPT] PDF signed successfully");

    // Step 2: Encrypt the signed PDF
    if (!options.encryption.enabled) {
      console.log("⚠️ [PDF-SIGN-ENCRYPT] Encryption disabled, returning signed PDF only");
      return {
        success: true,
        signedAndEncryptedBuffer: signingResult.signedBuffer,
        metadata: {
          signed: true,
          encrypted: false,
          signer: signingResult.metadata?.signer,
          signedAt: signingResult.metadata?.signedAt,
          hasUserPassword: false,
          hasOwnerPassword: false,
        },
      };
    }

    console.log("🔐 [PDF-SIGN-ENCRYPT] Step 2: Encrypting signed PDF...");
    const encryptionResult = await encryptPDF(signingResult.signedBuffer, options.encryption);

    if (!encryptionResult.success || !encryptionResult.encryptedBuffer) {
      // Encryption failed, but signing succeeded - fall back to signing-only
      console.warn("⚠️ [PDF-SIGN-ENCRYPT] Encryption failed, falling back to signing-only:", encryptionResult.error);
      return {
        success: true,
        signedAndEncryptedBuffer: signingResult.signedBuffer,
        error: `Encryption unavailable: ${encryptionResult.error || "Unknown error"}. PDF was signed successfully but not encrypted.`,
        metadata: {
          signed: true,
          encrypted: false,
          signer: signingResult.metadata?.signer,
          signedAt: signingResult.metadata?.signedAt,
          hasUserPassword: false,
          hasOwnerPassword: false,
        },
      };
    }

    console.log("✅ [PDF-SIGN-ENCRYPT] PDF encrypted successfully");
    console.log("✅ [PDF-SIGN-ENCRYPT] Combined sign and encrypt completed successfully");

    return {
      success: true,
      signedAndEncryptedBuffer: encryptionResult.encryptedBuffer,
      metadata: {
        signed: true,
        encrypted: true,
        signer: signingResult.metadata?.signer,
        signedAt: signingResult.metadata?.signedAt,
        hasUserPassword: !!options.encryption.userPassword,
        hasOwnerPassword: !!options.encryption.ownerPassword,
        permissions: options.encryption.permissions,
      },
    };
  } catch (error) {
    console.error("❌ [PDF-SIGN-ENCRYPT] Combined operation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Create combined options from form data
 */
export function createSignAndEncryptOptionsFromForm(formData: FormData): SignAndEncryptOptions {
  // Signing options
  const signing: SigningOptions = {
    reason: (formData.get("reason") as string) || "Document certification",
    location: (formData.get("location") as string) || "Certified by CAPCO Design Group",
    contactInfo: (formData.get("contactInfo") as string) || "",
    visible: formData.get("visible") === "true",
    pageNumber: formData.get("pageNumber")
      ? parseInt(formData.get("pageNumber") as string, 10) - 1
      : undefined,
  };

  // Encryption options
  const encryptionEnabled = formData.get("encryption-enabled") === "true";
  const userPassword = (formData.get("user-password") as string) || undefined;
  const ownerPassword = (formData.get("owner-password") as string) || undefined;
  const preset = (formData.get("encryption-preset") as string) || "default";

  const encryption: EncryptionOptions = {
    enabled: encryptionEnabled,
    userPassword,
    ownerPassword,
    permissions: {
      printing:
        formData.get("allow-printing") === "true"
          ? (formData.get("printing-quality") as "lowResolution" | "highResolution") ||
            "highResolution"
          : false,
      modifying: formData.get("allow-modifying") === "true",
      copying: formData.get("allow-copying") === "true",
      annotating: formData.get("allow-annotating") === "true",
      fillingForms: formData.get("allow-filling-forms") === "true",
      contentAccessibility: formData.get("allow-content-accessibility") === "true",
      documentAssembly: formData.get("allow-document-assembly") === "true",
    },
  };

  return {
    signing,
    encryption,
  };
}
