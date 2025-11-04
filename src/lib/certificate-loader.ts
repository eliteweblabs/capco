/**
 * Certificate Loader Module
 *
 * Loads IdenTrust certificates from various sources:
 * - macOS Keychain (via security command)
 * - PKCS#12 file (.p12/.pfx)
 * - Environment variables (base64 encoded)
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import forge from "node-forge";

export interface CertificateData {
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.PrivateKey;
  publicKey: forge.pki.PublicKey;
  commonName: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
}

export interface CertificateLoadResult {
  success: boolean;
  data?: CertificateData;
  error?: string;
}

/**
 * Load certificate from macOS Keychain
 * Note: Keychain access for private keys is limited. Better to export as .p12
 */
async function loadFromKeychain(
  certificateName: string = "IdenTrust"
): Promise<CertificateLoadResult> {
  try {
    console.log(
      `🔐 [CERT-LOADER] Attempting to load certificate from Keychain: ${certificateName}`
    );

    // Try to find the certificate in Keychain
    let keychainCert: string;
    try {
      keychainCert = execSync(
        `security find-certificate -a -c "${certificateName}" -p 2>/dev/null`,
        { encoding: "utf-8" }
      ).trim();
    } catch (error) {
      console.warn(`⚠️ [CERT-LOADER] Certificate not found in Keychain: ${certificateName}`);
      return {
        success: false,
        error: `Certificate "${certificateName}" not found in Keychain. Please export as .p12 file from Keychain Access.`,
      };
    }

    if (!keychainCert || !keychainCert.includes("BEGIN CERTIFICATE")) {
      return {
        success: false,
        error: "Certificate data not found in Keychain",
      };
    }

    // Parse certificate
    const cert = forge.pki.certificateFromPem(keychainCert);

    // Keychain doesn't easily export private keys via command line
    // Return error directing user to export as .p12
    return {
      success: false,
      error:
        "Private key cannot be accessed from Keychain via command line.\n" +
        "Please export the certificate as .p12 from Keychain Access:\n" +
        "1. Open Keychain Access\n" +
        "2. Find your IdenTrust certificate\n" +
        "3. Right-click → Export → Save as .p12\n" +
        "4. Save to certs/identrust.p12\n" +
        "5. Set CERT_PASSWORD environment variable",
    };
  } catch (error) {
    console.error(`❌ [CERT-LOADER] Error loading from Keychain:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error loading certificate",
    };
  }
}

/**
 * Load certificate from PKCS#12 file (.p12/.pfx)
 */
async function loadFromP12File(filePath: string, password: string): Promise<CertificateLoadResult> {
  try {
    console.log(`🔐 [CERT-LOADER] Loading certificate from file: ${filePath}`);

    if (!existsSync(filePath)) {
      return {
        success: false,
        error: `Certificate file not found: ${filePath}`,
      };
    }

    const p12Buffer = readFileSync(filePath);
    // Convert Buffer to binary string for forge
    const p12Der = p12Buffer.toString("binary");

    // Parse PKCS#12
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    // Extract certificate and private key
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag]?.length === 0) {
      return {
        success: false,
        error: "No certificate found in PKCS#12 file",
      };
    }

    if (
      !keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] ||
      keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.length === 0
    ) {
      return {
        success: false,
        error: "No private key found in PKCS#12 file",
      };
    }

    const cert = certBags[forge.pki.oids.certBag][0].cert!;
    const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key!;
    const publicKey = cert.publicKey;

    const certificateData: CertificateData = {
      certificate: cert,
      privateKey,
      publicKey,
      commonName: cert.subject.getField("CN")?.value || "Unknown",
      issuer: cert.issuer.getField("CN")?.value || "Unknown",
      validFrom: cert.validity.notBefore,
      validTo: cert.validity.notAfter,
    };

    // Validate certificate expiration
    const now = new Date();
    if (now < certificateData.validFrom) {
      return {
        success: false,
        error: `Certificate not yet valid. Valid from: ${certificateData.validFrom.toISOString()}`,
      };
    }

    if (now > certificateData.validTo) {
      return {
        success: false,
        error: `Certificate has expired. Expired on: ${certificateData.validTo.toISOString()}`,
      };
    }

    console.log(`✅ [CERT-LOADER] Certificate loaded from file: ${certificateData.commonName}`);
    return { success: true, data: certificateData };
  } catch (error) {
    console.error(`❌ [CERT-LOADER] Error loading from P12 file:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error loading certificate",
    };
  }
}

/**
 * Load certificate from base64 encoded string in environment variable
 * Useful for Railway/deployment where files aren't available
 */
async function loadFromBase64(
  base64Cert: string,
  password: string
): Promise<CertificateLoadResult> {
  try {
    console.log(`🔐 [CERT-LOADER] Loading certificate from base64 environment variable...`);
    console.log(`🔐 [CERT-LOADER] Base64 length: ${base64Cert.length} characters`);
    console.log(`🔐 [CERT-LOADER] Password length: ${password ? password.length : 0} characters`);

    // Clean the base64 string (remove whitespace, newlines, etc.)
    const cleanedBase64 = base64Cert.replace(/\s+/g, "").trim();
    console.log(`🔐 [CERT-LOADER] Cleaned base64 length: ${cleanedBase64.length} characters`);

    // Decode base64 to buffer
    const certBuffer = Buffer.from(cleanedBase64, "base64");
    console.log(`🔐 [CERT-LOADER] Decoded buffer size: ${certBuffer.length} bytes`);

    // Convert Buffer to forge-compatible format
    // forge expects binary string, not binary buffer
    const certDer = certBuffer.toString("binary");

    // Parse PKCS#12
    const p12Asn1 = forge.asn1.fromDer(certDer);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    // Extract certificate and private key
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag]?.length === 0) {
      return {
        success: false,
        error: "No certificate found in PKCS#12 data",
      };
    }

    if (
      !keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] ||
      keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.length === 0
    ) {
      return {
        success: false,
        error: "No private key found in PKCS#12 data",
      };
    }

    const cert = certBags[forge.pki.oids.certBag][0].cert!;
    const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key!;
    const publicKey = cert.publicKey;

    const certificateData: CertificateData = {
      certificate: cert,
      privateKey,
      publicKey,
      commonName: cert.subject.getField("CN")?.value || "Unknown",
      issuer: cert.issuer.getField("CN")?.value || "Unknown",
      validFrom: cert.validity.notBefore,
      validTo: cert.validity.notAfter,
    };

    // Validate certificate expiration
    const now = new Date();
    if (now < certificateData.validFrom) {
      return {
        success: false,
        error: `Certificate not yet valid. Valid from: ${certificateData.validFrom.toISOString()}`,
      };
    }

    if (now > certificateData.validTo) {
      return {
        success: false,
        error: `Certificate has expired. Expired on: ${certificateData.validTo.toISOString()}`,
      };
    }

    console.log(`✅ [CERT-LOADER] Certificate loaded from base64: ${certificateData.commonName}`);
    return { success: true, data: certificateData };
  } catch (error) {
    console.error(`❌ [CERT-LOADER] Error loading from base64:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error loading certificate",
    };
  }
}

/**
 * Main function to load certificate
 * Tries multiple sources in order of preference
 */
export async function loadCertificate(): Promise<CertificateLoadResult> {
  // Try base64 encoded certificate first (best for Railway/deployment)
  const base64Cert = process.env.CERT_BASE64;
  const certPassword = process.env.CERT_PASSWORD;

  console.log(`🔐 [CERT-LOADER] Environment check:`, {
    hasCERT_BASE64: !!base64Cert,
    hasCERT_PASSWORD: !!certPassword,
    base64Length: base64Cert?.length || 0,
    base64Preview: base64Cert ? `${base64Cert.substring(0, 50)}...` : "none",
  });

  if (base64Cert && certPassword) {
    // Clean up the base64 (remove quotes, whitespace, etc. that Railway might add)
    const cleanedBase64 = base64Cert
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/\s+/g, "") // Remove all whitespace/newlines
      .trim();

    const cleanedPassword = certPassword
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .trim();

    console.log(`🔐 [CERT-LOADER] Loading certificate from base64 environment variable...`);
    console.log(`🔐 [CERT-LOADER] Cleaned base64 length: ${cleanedBase64.length}`);

    const result = await loadFromBase64(cleanedBase64, cleanedPassword);
    if (result.success) {
      return result;
    }
    console.warn(`⚠️ [CERT-LOADER] Failed to load from base64:`, result.error);
    console.warn(`⚠️ [CERT-LOADER] Trying other sources...`);
  } else {
    console.warn(`⚠️ [CERT-LOADER] CERT_BASE64 or CERT_PASSWORD not set`);
  }

  // Try environment variable path (for local development)
  const certPath = process.env.CERT_PATH || process.env.DEV_CERT_PATH;

  if (certPath && certPassword) {
    console.log(`🔐 [CERT-LOADER] Loading certificate from environment variable path: ${certPath}`);
    const result = await loadFromP12File(certPath, certPassword);
    if (result.success) {
      return result;
    }
    console.warn(`⚠️ [CERT-LOADER] Failed to load from ${certPath}, trying other sources...`);
  }

  // Try default certs directory
  const defaultCertsDir = join(process.cwd(), "certs");
  const defaultCertPath = join(defaultCertsDir, "identrust.p12");
  if (existsSync(defaultCertPath) && certPassword) {
    console.log(`🔐 [CERT-LOADER] Loading certificate from default path: ${defaultCertPath}`);
    const result = await loadFromP12File(defaultCertPath, certPassword);
    if (result.success) {
      return result;
    }
  }

  // Try Keychain (macOS only)
  if (process.platform === "darwin") {
    console.log(`🔐 [CERT-LOADER] Attempting to load from macOS Keychain...`);
    const result = await loadFromKeychain();
    if (result.success) {
      return result;
    }
  }

  return {
    success: false,
    error:
      "Certificate not found. Please either:\n" +
      "1. Set CERT_BASE64 (base64 encoded .p12) and CERT_PASSWORD environment variables (recommended for Railway)\n" +
      "2. Export certificate as .p12 from Keychain Access and save to certs/identrust.p12\n" +
      "3. Set CERT_PATH and CERT_PASSWORD environment variables\n" +
      "4. Ensure certificate is installed in macOS Keychain",
  };
}

/**
 * Validate certificate is ready for use
 */
export function validateCertificate(certData: CertificateData): {
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

  if (!certData.certificate) {
    errors.push("Certificate is missing");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
