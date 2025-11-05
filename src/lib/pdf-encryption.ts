import { PDFDocument } from "pdf-lib";
// Temporarily disabled muhammara - may have native dependency issues on Railway
// import muhammara from "muhammara";

/**
 * PDF Encryption Library
 *
 * Provides password-based encryption for PDFs using muhammara
 * Supports AES-256 encryption with granular permission controls
 * Note: pdf-lib doesn't support encryption, so we use muhammara for encryption
 */

export interface EncryptionOptions {
  enabled: boolean;
  userPassword?: string;
  ownerPassword?: string;
  permissions: {
    printing: "lowResolution" | "highResolution" | false;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
    fillingForms: boolean;
    contentAccessibility: boolean;
    documentAssembly: boolean;
  };
}

export interface EncryptionResult {
  success: boolean;
  encryptedBuffer?: Buffer;
  error?: string;
  metadata?: {
    encrypted: boolean;
    permissions: EncryptionOptions["permissions"];
    hasUserPassword: boolean;
    hasOwnerPassword: boolean;
  };
}

/**
 * Default encryption options for secure documents
 */
export const DEFAULT_ENCRYPTION_OPTIONS: EncryptionOptions = {
  enabled: true,
  permissions: {
    printing: "highResolution",
    modifying: false,
    copying: false,
    annotating: true,
    fillingForms: true,
    contentAccessibility: false,
    documentAssembly: false,
  },
};

/**
 * High security encryption options (restrictive)
 */
export const HIGH_SECURITY_ENCRYPTION_OPTIONS: EncryptionOptions = {
  enabled: true,
  permissions: {
    printing: "lowResolution",
    modifying: false,
    copying: false,
    annotating: false,
    fillingForms: false,
    contentAccessibility: false,
    documentAssembly: false,
  },
};

/**
 * Low security encryption options (permissive)
 */
export const LOW_SECURITY_ENCRYPTION_OPTIONS: EncryptionOptions = {
  enabled: true,
  permissions: {
    printing: "highResolution",
    modifying: true,
    copying: true,
    annotating: true,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: true,
  },
};

/**
 * Encrypt a PDF buffer with the specified options
 *
 * @param pdfBuffer - The PDF buffer to encrypt
 * @param options - Encryption configuration
 * @returns Promise<EncryptionResult>
 */
export async function encryptPDF(
  pdfBuffer: Buffer,
  options: EncryptionOptions
): Promise<EncryptionResult> {
  try {
    console.log("🔐 [PDF-ENCRYPTION] Starting PDF encryption...");

    if (!options.enabled) {
      console.log("🔐 [PDF-ENCRYPTION] Encryption disabled, returning original buffer");
      return {
        success: true,
        encryptedBuffer: pdfBuffer,
        metadata: {
          encrypted: false,
          permissions: options.permissions,
          hasUserPassword: false,
          hasOwnerPassword: false,
        },
      };
    }

    // Validate passwords if provided
    if (options.userPassword && options.userPassword.length < 6) {
      throw new Error("User password must be at least 6 characters long");
    }

    if (options.ownerPassword && options.ownerPassword.length < 6) {
      throw new Error("Owner password must be at least 6 characters long");
    }

    console.log("🔐 [PDF-ENCRYPTION] Applying encryption using muhammara...");

    // Convert permissions to protection flag
    // PDF protection flags: https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf
    let userProtectionFlag = 0;
    if (!options.permissions.printing) userProtectionFlag |= 0x04; // No printing
    if (!options.permissions.modifying) userProtectionFlag |= 0x08; // No modifying
    if (!options.permissions.copying) userProtectionFlag |= 0x10; // No copying
    if (!options.permissions.annotating) userProtectionFlag |= 0x20; // No annotating
    if (!options.permissions.fillingForms) userProtectionFlag |= 0x100; // No form filling
    if (!options.permissions.contentAccessibility) userProtectionFlag |= 0x200; // No content extraction
    if (!options.permissions.documentAssembly) userProtectionFlag |= 0x400; // No document assembly

    // Use muhammara to encrypt the PDF
    // Note: muhammara operations are synchronous and can be CPU-intensive
    // We wrap it in a promise to avoid blocking, but it still runs synchronously
    // TEMPORARILY DISABLED: muhammara has native dependencies that may not build on Railway
    // Returning error until we find a better encryption solution
    throw new Error(
      "PDF encryption is temporarily unavailable. " +
      "Muhammara library has compatibility issues. " +
      "Please disable encryption for now, or use signing only."
    );
    
    /* DISABLED CODE - Muhammara encryption
    console.log("🔐 [PDF-ENCRYPTION] Starting muhammara encryption (PDF size:", pdfBuffer.length, "bytes)...");
    
    const encryptedBuffer = await new Promise<Buffer>((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("PDF encryption timed out after 60 seconds"));
      }, 60000); // 60 second timeout

      try {
        const { PDFRStreamForBuffer, PDFWStreamForBuffer, recrypt } = muhammara;
        
        console.log("🔐 [PDF-ENCRYPTION] Creating streams...");
        const input = new PDFRStreamForBuffer(pdfBuffer);
        const output = new PDFWStreamForBuffer();

        console.log("🔐 [PDF-ENCRYPTION] Calling recrypt (this may take a moment for large PDFs)...");
        
        // recrypt is synchronous, so we need to wrap it
        // Use setImmediate to allow other operations to continue
        setImmediate(() => {
          try {
            recrypt(input, output, {
              userPassword: options.userPassword || "",
              ownerPassword: options.ownerPassword || options.userPassword || "",
              userProtectionFlag: userProtectionFlag,
            });

            clearTimeout(timeout);
            console.log("🔐 [PDF-ENCRYPTION] Recrypt completed, accessing buffer...");
            
            // Access the buffer
            const buffer = output.buffer;
            console.log("🔐 [PDF-ENCRYPTION] Buffer retrieved, size:", buffer.length, "bytes");
            
            if (!buffer || buffer.length === 0) {
              reject(new Error("Encrypted PDF buffer is empty"));
              return;
            }
            
            resolve(buffer);
          } catch (recryptError) {
            clearTimeout(timeout);
            console.error("❌ [PDF-ENCRYPTION] Recrypt error:", recryptError);
            reject(recryptError);
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error("❌ [PDF-ENCRYPTION] Muhammara setup error:", error);
        reject(error);
      }
    });
    */
    
    // Placeholder - this code won't execute due to throw above
    const encryptedBuffer = pdfBuffer;

    console.log("🔐 [PDF-ENCRYPTION] Encryption applied successfully");

    console.log("🔐 [PDF-ENCRYPTION] Encrypted PDF saved, size:", encryptedBuffer.length, "bytes");

    return {
      success: true,
      encryptedBuffer,
      metadata: {
        encrypted: true,
        permissions: options.permissions,
        hasUserPassword: !!options.userPassword,
        hasOwnerPassword: !!options.ownerPassword,
      },
    };
  } catch (error) {
    console.error("❌ [PDF-ENCRYPTION] Encryption failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown encryption error",
    };
  }
}

/**
 * Generate a secure random password
 *
 * @param length - Password length (default: 12)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}

/**
 * Validate encryption options
 *
 * @param options - Encryption options to validate
 * @returns Validation result
 */
export function validateEncryptionOptions(options: EncryptionOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.enabled) {
    if (options.userPassword && options.userPassword.length < 6) {
      errors.push("User password must be at least 6 characters long");
    }

    if (options.ownerPassword && options.ownerPassword.length < 6) {
      errors.push("Owner password must be at least 6 characters long");
    }

    if (!options.userPassword && !options.ownerPassword) {
      errors.push(
        "At least one password (user or owner) must be provided when encryption is enabled"
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get encryption preset by name
 *
 * @param presetName - Name of the preset ('default', 'high', 'low')
 * @returns Encryption options
 */
export function getEncryptionPreset(presetName: string): EncryptionOptions {
  switch (presetName.toLowerCase()) {
    case "high":
    case "high-security":
      return HIGH_SECURITY_ENCRYPTION_OPTIONS;
    case "low":
    case "low-security":
      return LOW_SECURITY_ENCRYPTION_OPTIONS;
    case "default":
    default:
      return DEFAULT_ENCRYPTION_OPTIONS;
  }
}

/**
 * Create encryption options from form data
 *
 * @param formData - Form data containing encryption settings
 * @returns Encryption options
 */
export function createEncryptionOptionsFromForm(formData: FormData): EncryptionOptions {
  const enabled = formData.get("encryption-enabled") === "true";
  const userPassword = formData.get("user-password") as string;
  const ownerPassword = formData.get("owner-password") as string;
  const preset = formData.get("encryption-preset") as string;

  // Start with preset if provided
  const options = preset ? getEncryptionPreset(preset) : DEFAULT_ENCRYPTION_OPTIONS;

  // Override with form values
  return {
    enabled,
    userPassword: userPassword || undefined,
    ownerPassword: ownerPassword || undefined,
    permissions: {
      printing: formData.get("allow-printing") === "true" ? "highResolution" : false,
      modifying: formData.get("allow-modifying") === "true",
      copying: formData.get("allow-copying") === "true",
      annotating: formData.get("allow-annotating") === "true",
      fillingForms: formData.get("allow-filling-forms") === "true",
      contentAccessibility: formData.get("allow-content-accessibility") === "true",
      documentAssembly: formData.get("allow-document-assembly") === "true",
    },
  };
}
