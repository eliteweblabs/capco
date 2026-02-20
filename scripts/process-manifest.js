/**
 * Manifest.json Build Processor
 *
 * This script processes the manifest.json template with global variables
 * from the CMS database (globalSettings table) at build time.
 *
 * Load .env so PUBLIC_SUPABASE_URL and SUPABASE_SECRET are available.
 */
import "dotenv/config";

/**
 * DATA SOURCES (in priority order):
 * 1. CMS Database (globalSettings table via globalCompanyData)
 * 2. Environment variables (fallback)
 * 3. Site-config JSON files (for PWA shortcuts)
 *
 * TEMPLATE VARIABLES:
 * - {{RAILWAY_PROJECT_NAME}} - Company name from CMS/environment
 * - {{GLOBAL_COMPANY_SLOGAN}} - Company slogan from CMS/environment
 * - {{YEAR}} - Current year from environment
 * - {{GLOBAL_COLOR_PRIMARY}} - Primary brand color from CMS/environment
 * - {{GLOBAL_COLOR_SECONDARY}} - Secondary brand color from CMS/environment
 * - {{RAILWAY_PUBLIC_DOMAIN}} - Site URL for start_url and scope
 *
 * USAGE:
 * - Run during build process: node scripts/process-manifest.js
 * - Reads from public/manifest.json.template
 * - Outputs to public/manifest.json
 * - Uses CMS database for dynamic content with env fallbacks
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateFaviconPng } from "./generate-favicon-png.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Slugify company name for file lookups
 */
function slugifyCompanyName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Load company data from CMS database
 */
async function loadCompanyData() {
  try {
    // We can't import .ts files directly in Node.js, so we'll access the database directly
    // This uses the same logic as globalCompanyData() but without the TypeScript dependency
    
    // Check if we have the necessary env vars for Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn("⚠️  Supabase credentials not found, using environment variables only");
      return null;
    }

    // Dynamically import Supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all global settings
    const { data, error } = await supabase.from("globalSettings").select("key, value");

    if (error) {
      console.warn("⚠️  Failed to fetch from database:", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️  No global settings found in database");
      return null;
    }

    // Convert array to key-value object
    const settings = data.reduce((acc, item) => {
      acc[item.key] = item.value || "";
      return acc;
    }, {});

    // Helper to get setting with env fallback (try camelCase and snake_case for DB compatibility)
    const get = (key, envKey, altKey) => {
      const dbValue = settings[key] || (altKey && settings[altKey]);
      if (dbValue) return dbValue;
      if (envKey && process.env[envKey]) return process.env[envKey];
      return "";
    };

    // Return data in same format as globalCompanyData()
    return {
      globalCompanyName: get("companyName", "RAILWAY_PROJECT_NAME", "company_name") || "Company Name Not Set",
      globalCompanySlogan: get("slogan"),
      globalCompanyIcon: get("icon", "GLOBAL_COMPANY_ICON_SVG", "icon"),
      globalCompanyAddress: get("address", "GLOBAL_COMPANY_ADDRESS"),
      globalCompanyPhone: get("phone", "VAPI_PHONE_NUMBER"),
      globalCompanyEmail: get("email", "GLOBAL_COMPANY_EMAIL"),
      globalCompanyWebsite: get("website"),
      primaryColor: get("primaryColor", "GLOBAL_COLOR_PRIMARY") || get("primary_color", "GLOBAL_COLOR_PRIMARY"),
      secondaryColor: get("secondaryColor", "GLOBAL_COLOR_SECONDARY") || get("secondary_color", "GLOBAL_COLOR_SECONDARY"),
      fontFamily: get("font_family", "FONT_FAMILY") || "Outfit Variable",
      secondaryFontFamily: get("secondary_font_family", "FONT_FAMILY_FALLBACK") || "sans-serif",
    };
  } catch (error) {
    console.warn("⚠️  Failed to load company data from CMS database:", error.message);
    return null;
  }
}

/**
 * Load site config for PWA shortcuts (optional)
 */
function loadSiteConfig(companyName) {
  const companySlug = slugifyCompanyName(companyName);
  let configPath = path.join(process.cwd(), `site-config-${companySlug}.json`);

  // Fallback to generic site-config.json
  if (!fs.existsSync(configPath)) {
    configPath = path.join(process.cwd(), "site-config.json");
  }

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.warn("⚠️  Failed to load site-config.json:", error.message);
    }
  }
  return null;
}

/**
 * Main processing function
 */
async function processManifest() {
  // Load company data from CMS database
  const companyData = await loadCompanyData();

  // Get environment variables with fallbacks (used when CMS data unavailable)
  const getEnvVar = (key, fallback = "") => process.env[key] || fallback;

  // Load global company data from CMS first, then env vars
  const globalCompanyName =
    companyData?.globalCompanyName || getEnvVar("RAILWAY_PROJECT_NAME", "Company Name Not Set");
  const globalCompanySlogan =
    companyData?.globalCompanySlogan ||
    getEnvVar("GLOBAL_COMPANY_SLOGAN", "Professional Fire Protection Plan Review & Approval");
  const year = getEnvVar("YEAR", new Date().getFullYear().toString());
  const globalColorPrimary =
    companyData?.primaryColor || getEnvVar("GLOBAL_COLOR_PRIMARY", "#825BDD");
  const globalColorSecondary =
    companyData?.secondaryColor || getEnvVar("GLOBAL_COLOR_SECONDARY", "#0ea5e9");
  const siteUrl =
    companyData?.globalCompanyWebsite ||
    getEnvVar("RAILWAY_PUBLIC_DOMAIN", "http://localhost:4321");

  // Derive short name for PWA (12 chars or less; use first meaningful word(s))
  const shortName = (() => {
    const words = globalCompanyName.trim().split(/\s+/);
    if (words[0] && words[0].length >= 4) return words[0];
    return words.slice(0, 2).join(" ").slice(0, 12) || globalCompanyName.slice(0, 12) || "App";
  })();

  // Load site config for PWA shortcuts (optional)
  const siteConfig = loadSiteConfig(globalCompanyName);

  // Overwrite favicon.svg from DB icon when available (prepare-favicons runs first with content/default)
  const globalCompanyIcon = companyData?.globalCompanyIcon || "";
  if (globalCompanyIcon && (globalCompanyIcon.includes("<svg") || globalCompanyIcon.includes("<?xml"))) {
    const faviconPath = path.join(__dirname, "../public/favicon.svg");
    fs.writeFileSync(faviconPath, globalCompanyIcon, "utf-8");
    await generateFaviconPng();
    console.log("📊 Favicon: written from CMS icon, png regenerated");
  }

  // Template file paths
  const templatePath = path.join(__dirname, "../public/manifest.json.template");
  const outputPath = path.join(__dirname, "../public/manifest.json");

  console.log("🔧 Processing manifest.json with CMS data...");
  console.log(`📊 Company: ${globalCompanyName}`);
  console.log(`📊 Slogan: ${globalCompanySlogan}`);
  console.log(`📊 Theme Color: ${globalColorPrimary}`);
  console.log(`📊 Site URL: ${siteUrl}`);

  try {
    // Check if template exists, create default if missing
    if (!fs.existsSync(templatePath)) {
      console.log("⚠️  Template file not found, creating default...");

      const defaultTemplate = {
        name: "{{RAILWAY_PROJECT_NAME}}",
        short_name: "{{RAILWAY_PROJECT_NAME}}",
        description: "{{GLOBAL_COMPANY_SLOGAN}}",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "{{GLOBAL_COLOR_PRIMARY}}",
        orientation: "portrait-primary",
        scope: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
        categories: ["business", "productivity"],
        screenshots: [],
        shortcuts: [],
        prefer_related_applications: false,
        lang: "en",
        dir: "ltr",
      };

      fs.writeFileSync(templatePath, JSON.stringify(defaultTemplate, null, 2));
      console.log("✅ Created manifest.json.template");
    }

    // Read template
    const templateContent = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders with actual values
    let processedContent = templateContent
      .replace(/\{\{RAILWAY_PROJECT_NAME\}\}/g, globalCompanyName)
      .replace(/\{\{SHORT_NAME\}\}/g, shortName)
      .replace(/\{\{GLOBAL_COMPANY_SLOGAN\}\}/g, globalCompanySlogan)
      .replace(/\{\{YEAR\}\}/g, year)
      .replace(/\{\{GLOBAL_COLOR_PRIMARY\}\}/g, globalColorPrimary)
      .replace(/\{\{GLOBAL_COLOR_SECONDARY\}\}/g, globalColorSecondary)
      .replace(/\{\{RAILWAY_PUBLIC_DOMAIN\}\}/g, siteUrl);

    // Parse and validate JSON
    const manifest = JSON.parse(processedContent);

    // Add PWA shortcuts from site-config if available
    if (siteConfig?.pwa?.shortcuts && Array.isArray(siteConfig.pwa.shortcuts)) {
      manifest.shortcuts = siteConfig.pwa.shortcuts;
      console.log(`✅ Added ${siteConfig.pwa.shortcuts.length} PWA shortcuts from site-config`);
    } else {
      // Use default shortcuts if none configured
      manifest.shortcuts = [
        {
          name: "New Project",
          short_name: "New",
          description: "Create a new fire protection project",
          url: "/project/new",
          icons: [],
        },
      ];
    }

    // Write processed manifest
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    console.log("✅ Manifest.json processed successfully!");
  } catch (error) {
    console.error("❌ Error processing manifest.json:", error.message);
    process.exit(1);
  }
}

// Run the async function
processManifest().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
