/**
 * Certificate Test Script
 * 
 * Tests the IdenTrust certificate to verify:
 * - Certificate loads correctly
 * - Certificate is valid (not expired)
 * - Certificate chain is complete
 * - Can create a test signature
 */

import { config } from "dotenv";
import { loadCertificate } from "../src/lib/certificate-loader";
import { P12Signer } from "@signpdf/signer-p12";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import forge from "node-forge";

// Load environment variables
config();

async function testCertificate() {
  console.log("🔍 [CERT-TEST] Starting certificate validation test...\n");

  // Test 1: Load certificate
  console.log("📋 Test 1: Loading certificate...");
  const certResult = await loadCertificate();
  
  if (!certResult.success || !certResult.data) {
    console.error("❌ FAILED: Could not load certificate");
    console.error("   Error:", certResult.error);
    process.exit(1);
  }

  const certData = certResult.data;
  console.log("✅ Certificate loaded successfully");
  console.log(`   Common Name: ${certData.commonName}`);
  console.log(`   Issuer: ${certData.issuer}`);
  console.log(`   Valid From: ${certData.validFrom.toISOString()}`);
  console.log(`   Valid To: ${certData.validTo.toISOString()}\n`);

  // Test 2: Check expiration
  console.log("📋 Test 2: Checking certificate expiration...");
  const now = new Date();
  if (now < certData.validFrom) {
    console.error(`❌ FAILED: Certificate not yet valid (valid from: ${certData.validFrom.toISOString()})`);
    process.exit(1);
  }
  if (now > certData.validTo) {
    console.error(`❌ FAILED: Certificate has expired (expired: ${certData.validTo.toISOString()})`);
    process.exit(1);
  }
  const daysUntilExpiry = Math.floor((certData.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  console.log(`✅ Certificate is valid`);
  console.log(`   Days until expiry: ${daysUntilExpiry}\n`);

  // Test 3: Check certificate chain
  console.log("📋 Test 3: Checking certificate chain...");
  const cert = certData.certificate;
  console.log(`   Subject: ${cert.subject.toString()}`);
  console.log(`   Issuer: ${cert.issuer.toString()}`);
  
  // Check if certificate is self-signed
  const isSelfSigned = cert.subject.getField("CN")?.value === cert.issuer.getField("CN")?.value;
  if (isSelfSigned) {
    console.warn("⚠️  WARNING: Certificate appears to be self-signed");
    console.warn("   This may cause validation issues in Adobe Reader");
  } else {
    console.log("✅ Certificate is issued by a CA (not self-signed)");
  }

  // Check certificate chain in P12 file
  console.log("\n📋 Test 3b: Checking certificate chain in P12 file...");
  const p12Data = getP12BufferAndPassword();
  if (p12Data) {
    try {
      const p12Asn1 = forge.asn1.fromDer(p12Data.p12Buffer.toString("binary"));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, p12Data.password);
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certificates = certBags[forge.pki.oids.certBag] || [];
      
      console.log(`   Certificates in P12 file: ${certificates.length}`);
      
      if (certificates.length === 1) {
        console.warn("⚠️  WARNING: Only one certificate found in P12 file");
        console.warn("   Missing intermediate CA certificates may cause validation issues");
        console.warn("   Adobe Reader needs the full certificate chain to validate properly");
        console.warn("   Solution: Re-export the certificate from Keychain with 'Include all certificates'");
      } else {
        console.log("✅ Multiple certificates found (full chain may be present)");
        certificates.forEach((bag, index) => {
          const cert = bag.cert;
          if (cert) {
            const cn = cert.subject.getField("CN")?.value || "Unknown";
            const issuer = cert.issuer.getField("CN")?.value || "Unknown";
            console.log(`   Certificate ${index + 1}: ${cn} (Issued by: ${issuer})`);
          }
        });
      }
    } catch (error) {
      console.warn("⚠️  Could not analyze P12 certificate chain:", error);
    }
  }
  console.log();

  // Test 4: Get P12 buffer and test P12Signer
  console.log("📋 Test 4: Testing P12Signer initialization...");
  if (!p12Data) {
    console.error("❌ FAILED: Could not load P12 buffer");
    console.error("   Please ensure CERT_BASE64/CERT_PASSWORD or CERT_PATH/CERT_PASSWORD are set");
    process.exit(1);
  }

  try {
    const signer = new P12Signer(p12Data.p12Buffer, {
      passphrase: p12Data.password,
    });
    console.log("✅ P12Signer initialized successfully");
    console.log(`   Certificate in signer: ${signer.cert ? "Present" : "Missing"}\n`);
  } catch (error) {
    console.error("❌ FAILED: Could not initialize P12Signer");
    console.error("   Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Test 5: Test signature creation
  console.log("📋 Test 5: Testing signature creation...");
  try {
    const testData = Buffer.from("test data for signature");
    const signer = new P12Signer(p12Data.p12Buffer, {
      passphrase: p12Data.password,
    });
    const signature = await signer.sign(testData);
    console.log("✅ Signature created successfully");
    console.log(`   Signature length: ${signature.length} bytes\n`);
  } catch (error) {
    console.error("❌ FAILED: Could not create signature");
    console.error("   Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Test 6: Certificate details
  console.log("📋 Test 6: Certificate details...");
  console.log(`   Serial Number: ${cert.serialNumber}`);
  console.log(`   Public Key Algorithm: ${cert.publicKey.n ? "RSA" : "Unknown"}`);
  if (cert.publicKey.n) {
    console.log(`   Key Size: ${cert.publicKey.n.bitLength()} bits`);
  }
  console.log(`   Signature Algorithm: ${cert.signatureOid}`);
  console.log();

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ ALL TESTS PASSED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📝 Summary:");
  console.log(`   Certificate: ${certData.commonName}`);
  console.log(`   Status: Valid (expires in ${daysUntilExpiry} days)`);
  console.log(`   Can sign: Yes`);
  console.log(`   P12Signer: Working`);
  console.log("\n💡 If Adobe Reader still shows 'invalid', it may be a trust issue.");
  console.log("   Try adding the certificate to Adobe's trusted identities.");
}

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
      console.error("❌ Failed to decode base64 certificate:", error);
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
      console.error("❌ Failed to read certificate file:", error);
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
      console.error("❌ Failed to read default certificate:", error);
      return null;
    }
  }

  return null;
}

// Run the test
testCertificate().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

