import { supabaseAdmin } from "../../../lib/supabase-admin";
import { clearSiteConfigCache } from "../../../lib/content";

// Cache for settings to avoid repeated DB calls
let settingsCache: Record<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/** Cache info for UI indicator (cached, expiresAt, ageMs) */
export function getSettingsCacheInfo(): {
  cached: boolean;
  expiresAt: number;
  ageMs: number;
  ttlMs: number;
} {
  const now = Date.now();
  const cached = settingsCache !== null && cacheTimestamp > 0;
  const ageMs = cached ? now - cacheTimestamp : 0;
  const expiresAt = cached ? cacheTimestamp + CACHE_TTL : 0;
  return {
    cached,
    expiresAt,
    ageMs,
    ttlMs: CACHE_TTL,
  };
}

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
    const { data, error } = await supabaseAdmin.from("globalSettings").select("key, value");

    if (!error && data && data.length > 0) {
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
    // Do not cache empty or failed response so next request retries and can get DB colors
    if (error) {
      console.warn("[global-company-data] DB fetch error, not caching:", error.message);
    }
  } catch (error) {
    console.warn("[global-company-data] Failed to fetch settings:", error);
  }

  return {};
}

/**
 * Clear settings cache (call after updates).
 * Also clears site config cache so getSiteConfig picks up fresh company data.
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
  clearSiteConfigCache();
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

  // Website URL - DB first, then RAILWAY_PUBLIC_DOMAIN / PUBLIC_URL (no manual admin entry needed)
  const websiteRaw = get("website");
  let website = websiteRaw?.startsWith("http")
    ? websiteRaw
    : websiteRaw
      ? `https://${websiteRaw}`
      : "";
  if (!website) {
    const rail = process.env.RAILWAY_PUBLIC_DOMAIN;
    const pub = process.env.PUBLIC_URL;
    website = pub || (rail ? (rail.startsWith("http") ? rail : `https://${rail}`) : "");
  }

  // Favicon paths - used by manifest/link tags; per-site via static files or optional DB URL
  const faviconSvgPath = "/img/favicon.svg";
  const faviconPngPath = "/img/favicon.png";
  const faviconPngUrl = get("faviconPngUrl") || ""; // Optional: full URL or path to PNG (for /api/favicon.png)

  return {
    globalCompanyName: get("companyName", "RAILWAY_PROJECT_NAME") || "Company Name Not Set",
    globalCompanySlogan: get("slogan"), // Database only, no env fallback
    globalCompanyAddress: get("address", "GLOBAL_COMPANY_ADDRESS"),
    globalCompanyPhone: get("phone", "VAPI_PHONE_NUMBER"),
    globalCompanyEmail: get("email", "GLOBAL_COMPANY_EMAIL"),
    globalCompanyWebsite: website,

    // SVG markup for logo (used in UI components)
    // Single SVG with CSS in <defs> or <style> for theme support
    globalCompanyLogo: logo,

    // Logo CSS classes (for styling the logo wrapper)
    logoClasses: get("logoClasses") || "",

    // SVG markup for icon (used for favicons, converted to data URIs)
    // Single SVG with CSS for theme support
    globalCompanyIcon: icon,

    // Favicon file paths (used in manifest.json and link tags)
    globalCompanyFaviconSvg: faviconSvgPath,
    globalCompanyFaviconPng: faviconPngPath,
    faviconPngUrl,

    // Theme colors
    primaryColor: get("primaryColor", "GLOBAL_COLOR_PRIMARY"),
    secondaryColor: get("secondaryColor", "GLOBAL_COLOR_SECONDARY"),
    backgroundColor: get("backgroundColor") || "#ffffff",
    backgroundColorDark: get("backgroundColorDark") || "#0a0a0a",

    // Typography
    fontFamily: get("fontFamily", "FONT_FAMILY") || "Outfit Variable",
    secondaryFontFamily: get("secondaryFontFamily", "FONT_FAMILY_FALLBACK") || "sans-serif",

    // Analytics settings
    plausibleTrackingScript: get("plausibleTrackingScript", "PLAUSIBLE_TRACKING_SCRIPT") || "",
    plausibleSiteId: get("plausibleSiteId", "PLAUSIBLE_SITE_ID") || "",
    plausibleDomain: get("plausibleDomain", "PLAUSIBLE_DOMAIN") || "",

    // OG Image for social sharing (URL path like /images/og-image.png)
    ogImage: get("ogImage", "OG_IMAGE") || "",

    // Social Networks (stored as JSON array of {url: string, label?: string})
    socialNetworks: parseSocialNetworks(get("socialNetworks")),

    // Custom CSS (allows per-client CSS overrides and customization)
    customCss: get("customCss") || "",

    // Custom Footer HTML (injected into footer)
    customFooterHtml: get("customFooterHtml") || "",

    // Optional hosted logo URL for email (Gmail does not support data: or SVG; use PNG URL here or put file at /img/email-logo.png)
    emailLogoUrl: get("emailLogoUrl") || "",

    // Virtual assistant name (contact form, voice, etc.)
    virtualAssistantName: get("virtualAssistantName") || "",
  };
};

/**
 * Parse social networks from JSON string
 */
function parseSocialNetworks(value: string): Array<{ url: string; label?: string }> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => item && typeof item.url === "string" && item.url.trim() !== ""
      );
    }
  } catch (e) {
    console.warn("[global-company-data] Failed to parse social_networks:", e);
  }
  return [];
}

//
//
// RAILWAY_PROJECT_NAME="CAPCO Design Group"
// # GLOBAL_COMPANY_SLOGAN="Professional Fire Protection Plan Review & Approval"
// GLOBAL_COMPANY_SLOGAN="Powering the world's most reliable fire protection systems.."
// YEAR="2025"
