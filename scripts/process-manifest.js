/**
 * Manifest.json Build Processor
 *
 * This script processes the manifest.json template with global variables
 * and placeholders at build time, similar to vapi-assistant-config.js
 *
 * TEMPLATE VARIABLES:
 * - {{GLOBAL_COMPANY_NAME}} - Company name from environment
 * - {{GLOBAL_COMPANY_SLOGAN}} - Company slogan from environment
 * - {{YEAR}} - Current year from environment
 * - {{GLOBAL_COLOR_PRIMARY}} - Primary brand color
 * - {{GLOBAL_COLOR_SECONDARY}} - Secondary brand color
 * - {{SITE_URL}} - Site URL for start_url and scope
 *
 * USAGE:
 * - Run during build process: node scripts/process-manifest.js
 * - Reads from public/manifest.json.template
 * - Outputs to public/manifest.json
 * - Uses environment variables for dynamic content
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables with fallbacks
const getEnvVar = (key, fallback = "") => {
  return process.env[key] || fallback;
};

// Load global company data
const globalCompanyName = getEnvVar("GLOBAL_COMPANY_NAME", "CAPCO Design Group");
const globalCompanySlogan = getEnvVar(
  "GLOBAL_COMPANY_SLOGAN",
  "Professional Fire Protection Plan Review & Approval"
);
const year = getEnvVar("YEAR", new Date().getFullYear().toString());
const globalColorPrimary = getEnvVar("GLOBAL_COLOR_PRIMARY", "#825BDD");
const globalColorSecondary = getEnvVar("GLOBAL_COLOR_SECONDARY", "#0ea5e9");
const siteUrl = getEnvVar("SITE_URL", "http://localhost:4321");

// Template file paths
const templatePath = path.join(__dirname, "../public/manifest.json.template");
const outputPath = path.join(__dirname, "../public/manifest.json");

console.log("🔧 Processing manifest.json with global variables...");
console.log(`📁 Template: ${templatePath}`);
console.log(`📁 Output: ${outputPath}`);

try {
  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    console.log("⚠️  Template file not found, creating from current manifest.json...");

    // Read current manifest.json as template
    const currentManifest = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    // Convert to template by replacing values with placeholders
    const templateManifest = {
      ...currentManifest,
      name: "{{GLOBAL_COMPANY_NAME}}",
      description: "{{GLOBAL_COMPANY_SLOGAN}}",
      theme_color: "{{GLOBAL_COLOR_PRIMARY}}",
      background_color: "#ffffff",
      shortcuts: [
        {
          name: "New Project",
          short_name: "New",
          description: "Create a new fire protection project",
          url: "{{SITE_URL}}/dashboard#new-project",
          icons: [],
        },
      ],
    };

    // Write template file
    fs.writeFileSync(templatePath, JSON.stringify(templateManifest, null, 2));
    console.log("✅ Created manifest.json.template");
  }

  // Read template
  const templateContent = fs.readFileSync(templatePath, "utf8");

  // Replace placeholders with actual values
  let processedContent = templateContent
    .replace(/\{\{GLOBAL_COMPANY_NAME\}\}/g, globalCompanyName)
    .replace(/\{\{GLOBAL_COMPANY_SLOGAN\}\}/g, globalCompanySlogan)
    .replace(/\{\{YEAR\}\}/g, year)
    .replace(/\{\{GLOBAL_COLOR_PRIMARY\}\}/g, globalColorPrimary)
    .replace(/\{\{GLOBAL_COLOR_SECONDARY\}\}/g, globalColorSecondary);

  // Parse and validate JSON
  const manifest = JSON.parse(processedContent);

  // Write processed manifest
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

  console.log("✅ Manifest.json processed successfully!");
  console.log(`📊 Company: ${globalCompanyName}`);
  console.log(`📊 Slogan: ${globalCompanySlogan}`);
  console.log(`📊 Theme Color: ${globalColorPrimary}`);
  console.log(`📊 Site URL: ${siteUrl}`);
} catch (error) {
  console.error("❌ Error processing manifest.json:", error.message);
  process.exit(1);
}
