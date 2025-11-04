# Certificate-Based PDF Encryption Framework

## Overview

This document outlines the framework for using Identrust certificates to programmatically encrypt PDFs, covering multi-server deployment, localhost usage, and technical implementation considerations.

---

## Certificate Usage & Portability

### Can it be used on multiple servers?

**Yes, but with important considerations:**

1. **Software-Based Certificates (Browser/OS-stored)**
   - **Portable**: Can be exported (`.p12`/`.pfx` format) and imported to other servers
   - **Security Risk**: Exporting means duplicating the private key - increases attack surface
   - **Compliance**: May violate certificate terms of use if deployed on multiple servers simultaneously
   - **Best Practice**: Export only when necessary and securely delete from original location if moving (not copying)

2. **Hardware-Based Certificates (USB Token/Smart Card)**
   - **Portable**: Device can be plugged into different servers
   - **Security Advantage**: Private key stays on hardware (non-exportable)
   - **Limitation**: Only usable on one server at a time (physical device required)
   - **Best Practice**: Most secure option but requires physical access or USB over network solution

### Can it be used on localhost?

**Yes, absolutely:**

- Localhost/development environments work the same way as production servers
- Import the certificate into your local machine's certificate store or application
- Essential for development and testing before production deployment
- Same security considerations apply (protect private key)

---

## Certificate Formats

### Common Formats

- **PKCS#12** (`.p12` or `.pfx`) - Contains both certificate and private key, password-protected
- **PEM** (`.pem`/`.crt`) - Certificate only (public key), readable text format
- **DER** (`.der`/`.cer`) - Certificate in binary format
- **Key file** (`.key`) - Private key file (often PEM format)

**For encryption, you need:**

- The certificate file (public key for recipients)
- The private key (for signing/identity verification)
- Or a PKCS#12 file containing both (most convenient)

---

## Technical Implementation Options

### Current Project Status

**⚠️ Important**: The current PDF system uses `pdf-lib` (v1.17.1), which **does NOT support certificate-based encryption**. It only supports password-based encryption.

### Options for Certificate-Based Encryption

#### Option 1: Node.js Libraries (Recommended)

These libraries support certificate-based encryption:

1. **pdfjs-dist + node-forge** (Hybrid approach)
   - Use `node-forge` to read PKCS#12 certificates
   - Use `pdfjs-dist` or `pdf-lib` for PDF manipulation
   - Custom encryption layer required

2. **pdfkit + node-forge**
   - `pdfkit` for PDF generation
   - `node-forge` for certificate handling
   - More complex but flexible

3. **External Service/API**
   - Use cloud services that handle certificate-based PDF encryption
   - Offloads complexity but adds dependency

4. **Native PDF Tools via Child Process**
   - Use command-line tools like `pdftk` or `qpdf` via Node.js child processes
   - Requires server setup but supports certificates natively

#### Option 2: Alternative Approach - Certificate for Signing, Password for Encryption

- Use certificate for **digital signatures** (proves authenticity)
- Use password-based encryption (what you currently have) for **access control**
- This is often acceptable for most use cases

---

## Architecture Framework

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Certificate Storage                    │
├─────────────────────────────────────────────────────────┤
│ Option A: PKCS#12 File (.p12/.pfx)                      │
│   - Stored in secure server location                     │
│   - Environment variable points to path                  │
│   - Encrypted at rest (filesystem encryption)            │
│                                                           │
│ Option B: Environment Variables                          │
│   - Certificate in base64 format                         │
│   - Private key in base64 format                         │
│   - Password stored separately                           │
│                                                           │
│ Option C: Cloud Secrets Manager                          │
│   - AWS Secrets Manager / Azure Key Vault                │
│   - Secure retrieval at runtime                          │
│   - No certificate files on disk                         │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Certificate Loader Module                    │
├─────────────────────────────────────────────────────────┤
│ - Loads certificate from configured source                │
│ - Parses PKCS#12 with node-forge or crypto module       │
│ - Validates certificate expiration                        │
│ - Returns certificate object for encryption               │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│           PDF Encryption Service                         │
├─────────────────────────────────────────────────────────┤
│ - Receives PDF buffer (from Puppeteer/pdf-lib)           │
│ - Loads certificate                                      │
│ - Applies certificate-based encryption                   │
│ - Returns encrypted PDF buffer                           │
└─────────────────────────────────────────────────────────┘
```

### File Structure Proposal

```
src/lib/
  ├── pdf-encryption.ts          (existing - password-based)
  ├── pdf-certificate.ts         (new - certificate-based)
  ├── certificate-loader.ts      (new - loads/parses certificates)
  └── certificate-storage.ts     (new - manages certificate access)

src/pages/api/certificates/
  ├── upload.ts                  (new - upload certificate endpoint)
  └── validate.ts                (new - validate certificate endpoint)
```

---

## Security Considerations

### Certificate Storage

1. **Never commit certificates to Git**
   - Add `.p12`, `.pfx`, `.pem`, `.key` files to `.gitignore`
   - Use environment variables or secrets management

2. **Secure Storage Options** (in order of preference):
   - ✅ Cloud secrets manager (AWS Secrets Manager, Azure Key Vault)
   - ✅ Environment variables (for small deployments)
   - ✅ Encrypted filesystem + file permissions
   - ❌ Plain files in repository
   - ❌ Hardcoded in source code

3. **Access Control**
   - Limit filesystem permissions: `chmod 600 certificate.p12` (owner read/write only)
   - Use application-level access controls
   - Log all certificate usage/access

### Certificate Usage

1. **Load certificates at runtime** (not at startup if possible)
2. **Clear memory** after use (don't keep in long-lived variables)
3. **Rotate certificates** before expiration
4. **Monitor certificate usage** for anomalies

---

## Development vs Production

### Localhost/Development

```typescript
// Development: Certificate from local file
const CERT_PATH = process.env.DEV_CERT_PATH || "./certs/identrust.p12";
const CERT_PASSWORD = process.env.CERT_PASSWORD;
```

### Production

```typescript
// Production: Certificate from secure storage
const CERT_DATA = await getSecretFromVault("identrust-certificate");
const CERT_PASSWORD = await getSecretFromVault("certificate-password");
```

---

## Multi-Server Deployment Strategies

### Strategy 1: Shared Certificate File

- Store certificate in shared secure storage (S3 with encryption, mounted volume)
- All servers access same certificate
- **Pros**: Simple, one certificate to manage
- **Cons**: Single point of failure, compliance concerns

### Strategy 2: Per-Server Certificates

- Each server has its own certificate
- Certificates linked to same Identrust account
- **Pros**: Better security isolation, compliance-friendly
- **Cons**: More certificates to manage, rotation complexity

### Strategy 3: Centralized Service

- One dedicated service handles all PDF encryption
- Other servers call this service via API
- **Pros**: Centralized control, easier certificate management
- **Cons**: Additional service to maintain, network dependency

---

## Implementation Status

✅ **Completed:**

1. Certificate loader module (`src/lib/certificate-loader.ts`)
2. PDF signing module (`src/lib/pdf-signing.ts`)
3. API endpoint for PDF signing (`src/pages/api/pdf/sign.ts`)
4. Admin page for PDF certification (`src/pages/admin/certify-pdf.astro`)

## Setup Instructions

### 1. Export Certificate from Keychain Access

1. Open **Keychain Access** on macOS
2. Select **"login"** keychain
3. Click **"My Certificates"** (or search for "IdenTrust")
4. Find your IdenTrust certificate
5. **Right-click → Export "IdenTrust"...**
6. Choose **"Personal Information Exchange (.p12)"** format
7. Save to `certs/identrust.p12` in your project root
8. Set a password when prompted (you'll need this for the app)

### 2. Set Environment Variables

Add to your `.env` file:

```bash
CERT_PATH=./certs/identrust.p12
CERT_PASSWORD=your_certificate_password_here
```

Or for production:

```bash
CERT_PATH=/secure/path/to/identrust.p12
CERT_PASSWORD=your_certificate_password_here
```

### 3. Access the Certification Page

Navigate to: `/admin/certify-pdf`

- Requires **Admin** or **Staff** role
- Upload a PDF file
- Fill in signing details (reason, location, etc.)
- Click "Certify PDF"
- Download the certified PDF

### 4. How It Works

- **Signing**: Embeds certificate metadata and digital signature into PDF
- **Authentication**: Proves document integrity and signer identity
- **Note**: This provides **signing/authentication**, not encryption
- For encryption, use the existing password-based encryption features

## Next Steps (Future Enhancements)

1. **Full Cryptographic Signing**: Integrate `node-signpdf` for complete PKCS#7 signing
2. **Visible Signatures**: Add visual signature stamps to PDFs
3. **Signature Validation**: Add endpoint to verify PDF signatures
4. **Certificate-Based Encryption**: Implement full certificate-based encryption (requires different library)

---

## Questions to Answer Before Implementation

1. **What format is your Identrust certificate?** (`.p12`, `.pfx`, separate `.pem`/`.key`?)
2. **Do you need encryption or signing or both?**
3. **How many servers need access?** (affects storage strategy)
4. **What's your deployment environment?** (Railway, AWS, local, etc.)
5. **Do recipients need to validate the certificate?** (affects certificate chain/trust)

---

## Resources

- [IdenTrust Support](https://www.identrust.com/support)
- [Node.js crypto module](https://nodejs.org/api/crypto.html) - for certificate parsing
- [node-forge documentation](https://github.com/digitalbazaar/forge) - PKCS#12 parsing
- [PKCS#12 Format](https://tools.ietf.org/html/rfc7292) - Certificate format specification
