import { supabaseAdmin } from "../../../lib/supabase-admin";

// Cache for settings to avoid repeated DB calls
let settingsCache: Record<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get all settings from database, with caching
 */
async function getAllSettings(): Promise<Record<string, string>> {
  const now = Date.now();

  // Return cached settings if still valid
  if (settingsCache && now - cacheTimestamp < CACHE_TTL) {
    return settingsCache;
  }

  // Only try to fetch from database if supabaseAdmin is available
  if (!supabaseAdmin) {
    return {};
  }

  try {
    const { data, error } = await supabaseAdmin.from("global_settings").select("key, value");

    if (!error && data) {
      settingsCache = data.reduce(
        (acc, item) => {
          acc[item.key] = item.value || "";
          return acc;
        },
        {} as Record<string, string>
      );
      cacheTimestamp = now;
      return settingsCache;
    }
  } catch (error) {
    console.warn("[global-company-data] Failed to fetch settings:", error);
  }

  return {};
}

/**
 * Clear settings cache (call after updates)
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
}

export const globalCompanyData = async () => {
  // Try to get settings from database first
  const settings = await getAllSettings();

  // Helper function to get setting with env fallback
  const get = (key: string, envKey?: string): string => {
    const dbValue = settings[key];
    if (dbValue) return dbValue;
    if (envKey && process.env[envKey]) return process.env[envKey];
    return "";
  };

  // Get logo and icon - single SVG with CSS for theme support
  const logo = get("logo", "GLOBAL_COMPANY_LOGO_SVG") || "";
  const icon = get("icon", "GLOBAL_COMPANY_ICON_SVG") || "";

  // Website URL - ensure it has protocol
  const websiteRaw = get("website", "RAILWAY_PUBLIC_DOMAIN");
  const website = websiteRaw?.startsWith("http") ? websiteRaw : `https://${websiteRaw}`;

  // Favicon paths - consistent format with leading slash
  const faviconSvgPath = "/img/favicon.svg";
  const faviconPngPath = "/img/favicon.png";

  return {
    globalCompanyName: get("company_name", "RAILWAY_PROJECT_NAME"),
    globalCompanySlogan: get("slogan", "GLOBAL_COMPANY_SLOGAN"),
    globalCompanyAddress: get("address", "GLOBAL_COMPANY_ADDRESS"),
    globalCompanyPhone: get("phone", "VAPI_PHONE_NUMBER"),
    globalCompanyEmail: get("email", "GLOBAL_COMPANY_EMAIL"),
    globalCompanyWebsite: get("website", "RAILWAY_PUBLIC_DOMAIN"),

    // SVG markup for logo (used in UI components)
    // Single SVG with CSS in <defs> or <style> for theme support
    globalCompanyLogo: logo,

    // SVG markup for icon (used for favicons, converted to data URIs)
    // Single SVG with CSS for theme support
    globalCompanyIcon: icon,

    // Favicon file paths (used in manifest.json and link tags)
    globalCompanyFaviconSvg: faviconSvgPath,
    globalCompanyFaviconPng: faviconPngPath,

    // Theme colors
    primaryColor: get("primary_color", "GLOBAL_COLOR_PRIMARY"),
    secondaryColor: get("secondary_color", "GLOBAL_COLOR_SECONDARY"),

    // Typography
    fontFamily: get("font_family", "FONT_FAMILY") || "Outfit Variable",
    secondaryFontFamily: get("secondary_font_family", "FONT_FAMILY_FALLBACK") || "sans-serif",

    // Analytics settings
    plausibleDomain: get("plausible_domain", "PLAUSIBLE_DOMAIN") || "",
    plausibleScriptUrl: get("plausible_script_url", "PLAUSIBLE_SCRIPT_URL") || "",
    plausibleSiteId:
      get("plausible_site_id", "PLAUSIBLE_SITE_ID") ||
      get("website", "RAILWAY_PUBLIC_DOMAIN")?.replace(/^https?:\/\//, "") ||
      "",
  };
};

//
//
// RAILWAY_PROJECT_NAME="CAPCO Design Group"
// # GLOBAL_COMPANY_SLOGAN="Professional Fire Protection Plan Review & Approval"
// GLOBAL_COMPANY_SLOGAN="Powering the world's most reliable fire protection systems.."
// YEAR="2025"
