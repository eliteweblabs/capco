import { PDFDocument } from "pdf-lib";

/**
 * PDF Encryption Library
 *
 * Provides password-based encryption for PDFs using pdf-lib
 * Supports AES-256 encryption with granular permission controls
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

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    console.log("🔐 [PDF-ENCRYPTION] PDF loaded, applying encryption...");

    // Apply encryption
    await pdfDoc.encrypt({
      userPassword: options.userPassword,
      ownerPassword: options.ownerPassword,
      permissions: options.permissions,
    });

    console.log("🔐 [PDF-ENCRYPTION] Encryption applied successfully");

    // Save the encrypted PDF
    const encryptedBytes = await pdfDoc.save();
    const encryptedBuffer = Buffer.from(encryptedBytes);

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
