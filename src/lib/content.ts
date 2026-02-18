/**
 * Content Management System
 *
 * Reads content from markdown files and site-config.json
 * Allows each deployment to have custom content without changing code
 *
 * This system bridges environment-based config and a future full CMS
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { supabaseAdmin } from "./supabase-admin";

// Cache for performance (TTL: 2 min in production; dev skips cache for live updates)
const cache = new Map<string, any>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let siteConfigCacheTimestamp = 0;

/** Clear site config cache (call when global settings are updated) */
export function clearSiteConfigCache(): void {
  cache.delete("site-config");
  siteConfigCacheTimestamp = 0;
}

/**
 * Site Configuration Interface
 */
export interface SiteConfig {
  site: {
    name: string;
    slogan: string;
    description: string;
    url: string;
    email: string;
    phone: string;
    address: string;
    year: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontFallback: string;
    logoSvg?: string;
    iconSvg?: string;
  };
  navigation: {
    main: Array<{
      label: string;
      href: string;
      icon?: string;
    }>;
    footer?: Array<{
      label: string;
      href: string;
    }>;
    /** Aside sidebar nav. From SITE_CONFIG or site-config.json. See aside-nav-config.ts */
    aside?: (string | Record<string, unknown>)[];
  };
  features: {
    [key: string]:
      | boolean
      | {
          enabled: boolean;
          navigation?: {
            label: string;
            href: string;
            icon?: string;
            roles?: string[];
            position?: number;
            section?: string;
          };
        };
  };
  pages?: {
    [pageSlug: string]: any;
  };
  integrations?: {
    [key: string]: any;
  };
}

/**
 * Page Content Interface
 */
export interface PageContent {
  title: string;
  description?: string;
  hero?: {
    title: string;
    subtitle?: string;
    cta?: {
      text: string;
      href: string;
    };
  };
  [key: string]: any; // Allow custom fields
  content: string; // The markdown content
}

/**
 * Merge JSON config into base config (handles navigation, features, projectListColumns, etc.)
 */
function mergeJsonConfig(
  config: SiteConfig & Record<string, any>,
  jsonConfig: Record<string, any>
): void {
  if (jsonConfig.navigation) {
    config.navigation = { ...config.navigation, ...jsonConfig.navigation };
  }
  if (jsonConfig.features) {
    config.features = jsonConfig.features;
  }
  if (jsonConfig.asideNav) {
    (config.navigation as any).aside = jsonConfig.asideNav;
  } else if (jsonConfig.navigation?.aside) {
    (config.navigation as any).aside = jsonConfig.navigation.aside;
  }
  if (Array.isArray(jsonConfig.projectListColumns)) {
    config.projectListColumns = jsonConfig.projectListColumns;
  }
  if (jsonConfig.projectForm) config.projectForm = jsonConfig.projectForm;
  if (jsonConfig.registerForm) config.registerForm = jsonConfig.registerForm;
  if (jsonConfig.loginForm) config.loginForm = jsonConfig.loginForm;
  if (jsonConfig.mepForm) config.mepForm = jsonConfig.mepForm;
  if (jsonConfig.contactForm) config.contactForm = jsonConfig.contactForm;
  if (Array.isArray(jsonConfig.userForm)) config.userForm = jsonConfig.userForm;
  if (jsonConfig.statuses) config.statuses = jsonConfig.statuses;
  if (jsonConfig.formButtonDefaults) config.formButtonDefaults = jsonConfig.formButtonDefaults;
  if (jsonConfig.site) config.site = { ...config.site, ...jsonConfig.site };
  if (jsonConfig.branding) config.branding = { ...config.branding, ...jsonConfig.branding };
}

/**
 * Get site configuration
 * Priority: SITE_CONFIG or SITE_CONFIG_JSON env var > site-config.json file > minimal defaults
 * DB values still provide runtime overrides for site/branding when not in env config
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const cacheKey = "site-config";
  const now = Date.now();

  // Skip cache in development for live updates
  if (process.env.NODE_ENV !== "development" && cache.has(cacheKey)) {
    if (now - siteConfigCacheTimestamp < CACHE_TTL_MS) {
      return cache.get(cacheKey);
    }
    cache.delete(cacheKey);
  }

  // Get company data from database for site/branding defaults
  let companyData;
  try {
    const { globalCompanyData } = await import("../pages/api/global/global-company-data");
    companyData = await globalCompanyData();
  } catch (error) {
    console.warn(
      "[CONTENT] Failed to load company data from database, using env fallbacks:",
      error
    );
    companyData = null;
  }

  // Start with defaults from database, then environment variables
  const config: SiteConfig & Record<string, any> = {
    site: {
      name:
        companyData?.globalCompanyName ||
        process.env.RAILWAY_PROJECT_NAME ||
        "Fire Protection Services",
      slogan: companyData?.globalCompanySlogan || "Professional Services",
      description: companyData?.globalCompanySlogan || "Fire protection system review and approval",
      url: companyData?.globalCompanyWebsite || "http://localhost:4321",
      email:
        companyData?.globalCompanyEmail || process.env.GLOBAL_COMPANY_EMAIL || "admin@example.com",
      phone: companyData?.globalCompanyPhone || process.env.GLOBAL_COMPANY_PHONE || "+15551234567",
      address:
        companyData?.globalCompanyAddress || process.env.GLOBAL_COMPANY_ADDRESS || "123 Main St",
      year: process.env.YEAR || new Date().getFullYear().toString(),
    },
    branding: {
      primaryColor: companyData?.primaryColor || process.env.GLOBAL_COLOR_PRIMARY || "#825BDD",
      secondaryColor:
        companyData?.secondaryColor || process.env.GLOBAL_COLOR_SECONDARY || "#0ea5e9",
      fontFamily: companyData?.fontFamily || process.env.FONT_FAMILY || "Outfit Variable",
      fontFallback:
        companyData?.secondaryFontFamily || process.env.FONT_FAMILY_FALLBACK || "sans-serif",
      logoSvg: companyData?.globalCompanyLogo || process.env.GLOBAL_COMPANY_LOGO_SVG,
      iconSvg: companyData?.globalCompanyIcon || process.env.GLOBAL_COMPANY_ICON_SVG,
    },
    navigation: {
      main: [
        { label: "Home", href: "/", icon: "home" },
        { label: "Projects", href: "/projects", icon: "folder" },
        { label: "Contact", href: "/contact", icon: "envelope" },
      ],
    },
    features: {
      voiceAssistant: true,
      blog: false,
      pricing: false,
    },
  };

  // 1. Priority: env-based config (Railway limits vars to 32KB, so we support multiple methods)
  let envConfigJson: string | null = null;

  // 1a. SITE_CONFIG_URL - fetch from URL (no size limit)
  const configUrl = process.env.SITE_CONFIG_URL;
  if (configUrl) {
    try {
      const res = await fetch(configUrl);
      if (res.ok) envConfigJson = await res.text();
      else console.warn("⚠️ [CONTENT] SITE_CONFIG_URL fetch failed:", res.status);
    } catch (error) {
      console.warn("⚠️ [CONTENT] Error fetching SITE_CONFIG_URL:", error);
    }
  }

  // 1b. SITE_CONFIG or SITE_CONFIG_JSON (single var, <32KB on Railway)
  if (!envConfigJson) {
    envConfigJson = process.env.SITE_CONFIG || process.env.SITE_CONFIG_JSON || null;
  }

  // 1c. SITE_CONFIG_1, SITE_CONFIG_2, ... (chunked for Railway's 32KB limit)
  if (!envConfigJson) {
    const chunks: string[] = [];
    for (let i = 1; ; i++) {
      const chunk = process.env[`SITE_CONFIG_${i}`];
      if (!chunk) break;
      chunks.push(chunk);
    }
    if (chunks.length > 0) envConfigJson = chunks.join("");
  }

  // 1d. public/data/config.json (copied to dist/client/data/config.json at build)
  if (!envConfigJson) {
    const paths = [
      join(process.cwd(), "public", "data", "config.json"),
      join(process.cwd(), "dist", "client", "data", "config.json"),
    ];
    for (const p of paths) {
      if (existsSync(p)) {
        try {
          envConfigJson = readFileSync(p, "utf-8");
          break;
        } catch {
          /* ignore */
        }
      }
    }
  }

  if (envConfigJson) {
    try {
      const jsonConfig = JSON.parse(envConfigJson);
      mergeJsonConfig(config, jsonConfig);
    } catch (error) {
      console.warn("⚠️ [CONTENT] Error parsing site config:", error);
    }
  } else {
    // 3. Fallback: site-config.json file (for local dev)
    const configPath = join(process.cwd(), "site-config.json");
    if (existsSync(configPath)) {
      try {
        const fileContent = readFileSync(configPath, "utf-8");
        const jsonConfig = JSON.parse(fileContent);
        mergeJsonConfig(config, jsonConfig);
      } catch (error) {
        console.warn("⚠️ [CONTENT] Error reading site-config.json, using defaults:", error);
      }
    } else {
      console.warn(
        "⚠️ [CONTENT] No SITE_CONFIG env var and no site-config.json. Using minimal defaults."
      );
    }
  }

  cache.set(cacheKey, config);
  siteConfigCacheTimestamp = now;
  return config;
}

/**
 * Get default page content (fallback when markdown file doesn't exist)
 */
async function getDefaultPageContent(slug: string): Promise<PageContent | null> {
  // Get company data from database
  let companyData;
  try {
    const { globalCompanyData } = await import("../pages/api/global/global-company-data");
    companyData = await globalCompanyData();
  } catch (error) {
    console.warn("[CONTENT] Failed to load company data for default page content:", error);
    companyData = null;
  }

  const defaults: Record<string, PageContent> = {
    home: {
      title: "",
      // companyData?.globalCompanyName ||
      // process.env.RAILWAY_PROJECT_NAME ||
      // "Fire Protection Services",
      description:
        companyData?.globalCompanySlogan || "Professional fire protection plan review and approval",
      template: "fullwidth",
      content: "",
    },
    contact: {
      title: "Contact Us",
      description: "Get in touch with our fire protection experts",
      content: "# Contact Us\n\nGet in touch with our team.",
    },
    privacy: {
      title: "Privacy Policy",
      description: "Our privacy policy and data protection practices",
      content: "# Privacy Policy\n\nPrivacy policy content...",
    },
    terms: {
      title: "Terms of Service",
      description: "Terms and conditions for using our services",
      content: "# Terms of Service\n\nTerms and conditions...",
    },
    "404": {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist",
      content: "# 404 - Page Not Found\n\nThe page you're looking for doesn't exist.",
    },
  };

  return defaults[slug] || null;
}

/**
 * Get page content from environment variables, files, or defaults (in that order)
 * Priority: Env Vars > Files > Defaults
 *
 * Environment variable format:
 * - PAGE_{SLUG}_CONTENT - Markdown content
 * - PAGE_{SLUG}_TITLE - Page title
 * - PAGE_{SLUG}_DESCRIPTION - Page description
 * - PAGE_{SLUG}_JSON - Full JSON object (overrides individual vars)
 */
export async function getPageContent(slug: string): Promise<PageContent | null> {
  const cacheKey = `page-${slug}`;
  const slugUpper = slug.toUpperCase().replace(/-/g, "_");

  // Skip cache in development for live updates
  if (process.env.NODE_ENV !== "development" && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Skip DB and all lookups for bot/scanner probes (wp-config.php, wp-admin, etc.) to avoid
  // hitting Supabase on every probe and logging Cloudflare/block pages as "database errors"
  if (isLikelyBotProbe(slug)) {
    return null;
  }

  // 0. Try database first (CMS - highest priority for per-deployment customization)
  if (supabaseAdmin) {
    try {
      const clientId = process.env.RAILWAY_PROJECT_NAME || null;

      // Normalize slug: "/" and "home" are equivalent for the home page
      const normalizedSlug = slug === "home" || slug === "/" ? ["home", "/"] : [slug];

      let query = supabaseAdmin
        .from("cmsPages")
        .select("*")
        .in("slug", normalizedSlug)
        .eq("isActive", true);

      // Filter by clientId: show global (null) or matching clientId
      if (clientId) {
        query = query.or(`clientId.is.null,clientId.eq.${clientId}`);
      }
      // If no clientId set, show all pages (no filter)

      const { data: dbPage, error } = await query
        .order("clientId", { ascending: false }) // Client-specific takes priority
        .limit(1)
        .maybeSingle();

      if (!error && dbPage) {
        // Normalize template to layout mode: default | fullwidth | minimal | centered | fullscreen
        let normalizedTemplate = (dbPage.template || "default").toLowerCase().trim();
        const templateMap: Record<string, string> = {
          "full width": "fullwidth",
          "full screen": "fullscreen",
          "fullscreen scroll": "fullscreen",
          center: "centered",
        };
        normalizedTemplate = templateMap[normalizedTemplate] ?? normalizedTemplate;

        const pageContent: PageContent = {
          title: dbPage.title || slug,
          description: dbPage.description || "",
          template: normalizedTemplate,
          content: dbPage.content || "",
          ...(dbPage.frontmatter || {}),
        };
        cache.set(cacheKey, pageContent);
        // console.log(`✅ [CONTENT] Loaded ${slug} from database (CMS)`, {
        //   contentLength: dbPage.content?.length,
        // });
        return pageContent;
      } else if (error) {
        const msg = typeof error?.message === "string" ? error.message : String(error);
        const isCloudflareBlock =
          msg.includes("<!DOCTYPE") ||
          msg.includes("cf-wrapper") ||
          msg.includes("Cloudflare") ||
          msg.includes("you have been blocked");
        if (isCloudflareBlock) {
          console.error(
            `❌ [CONTENT] Database unreachable for ${slug} (likely Cloudflare/network block from this host). Check Supabase access from Railway.`
          );
        } else {
          console.error(`❌ [CONTENT] Database error for ${slug}:`, error);
        }
      } else {
        console.log(`ℹ️ [CONTENT] No database page found for ${slug}`);
      }
    } catch (error) {
      const msg =
        typeof (error as any)?.message === "string" ? (error as any).message : String(error);
      const isCloudflareBlock =
        msg.includes("<!DOCTYPE") ||
        msg.includes("cf-wrapper") ||
        msg.includes("Cloudflare") ||
        msg.includes("you have been blocked");
      if (isCloudflareBlock) {
        console.warn(
          `⚠️ [CONTENT] Database unreachable for ${slug} (likely Cloudflare/network block from this host). Check Supabase access from Railway.`
        );
      } else {
        console.warn(`⚠️ [CONTENT] Error loading ${slug} from database:`, error);
      }
    }
  }

  // 1. Try environment variable override (allows per-deployment customization)
  const envJson = process.env[`PAGE_${slugUpper}_JSON`];
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson);
      const pageContent: PageContent = {
        title: parsed.title || slug,
        description: parsed.description || "",
        template: parsed.template || "default",
        content: parsed.content || "",
        ...parsed,
      };
      cache.set(cacheKey, pageContent);
      // console.log(`✅ [CONTENT] Loaded ${slug} from environment variable (JSON)`);
      return pageContent;
    } catch (error) {
      console.warn(`⚠️ [CONTENT] Error parsing PAGE_${slugUpper}_JSON:`, error);
    }
  }

  // 2. Try individual environment variables
  const envContent = process.env[`PAGE_${slugUpper}_CONTENT`];
  if (envContent) {
    const pageContent: PageContent = {
      title: process.env[`PAGE_${slugUpper}_TITLE`] || slug,
      description: process.env[`PAGE_${slugUpper}_DESCRIPTION`] || "",
      template: (process.env[`PAGE_${slugUpper}_TEMPLATE`] as any) || "default",
      content: envContent,
    };
    cache.set(cacheKey, pageContent);
    // console.log(`✅ [CONTENT] Loaded ${slug} from environment variables`);
    return pageContent;
  }

  // 2. Try persistent volume (survives deployments) - Check this BEFORE git files
  const volumePath = "/data/content/pages";
  const volumeContentPath = join(volumePath, `${slug}.md`);
  if (existsSync(volumePath) && existsSync(volumeContentPath)) {
    try {
      const fileContent = readFileSync(volumeContentPath, "utf-8");
      const { data, content } = matter(fileContent);
      const pageContent: PageContent = {
        ...data,
        content,
        title: data.title || "Untitled Page",
      };
      cache.set(cacheKey, pageContent);
      // console.log(`✅ [CONTENT] Loaded ${slug} from persistent volume`);
      return pageContent;
    } catch (error) {
      console.warn(`⚠️ [CONTENT] Error reading from volume:`, error);
    }
  }

  // 3. Try markdown file (from git - defaults)
  const contentPath = join(process.cwd(), "content", "pages", `${slug}.md`);
  if (existsSync(contentPath)) {
    try {
      const fileContent = readFileSync(contentPath, "utf-8");
      const { data, content } = matter(fileContent);

      const pageContent: PageContent = {
        ...data,
        content,
        title: data.title || "Untitled Page",
      };

      cache.set(cacheKey, pageContent);
      // console.log(`✅ [CONTENT] Loaded ${slug} from file`);
      return pageContent;
    } catch (error) {
      console.warn(`⚠️ [CONTENT] Error reading ${slug}.md:`, error);
    }
  }

  // 3. Fallback to default content
  const defaultContent = await getDefaultPageContent(slug);
  if (defaultContent) {
    // console.log(`ℹ️ [CONTENT] Using default content for: ${slug}`);
    cache.set(cacheKey, defaultContent);
    return defaultContent;
  }

  // Return null if no content found (will trigger 404)
  // Skip logging for obvious bot/scanner probes to avoid log noise (wp-*, .php, favicon, etc.)
  if (!isLikelyBotProbe(slug)) {
    console.warn(`⚠️ [CONTENT] No content found for page: ${slug}`);
  }
  return null;
}

/**
 * Heuristic: treat as bot/scanner probe so we don't log 404s for WordPress/PHP exploit scans,
 * common static assets, and CMS exploit paths. Still returns 404; this only suppresses the warning log.
 */
function isLikelyBotProbe(slug: string): boolean {
  const s = slug.toLowerCase();
  if (!s || s.length > 120) return true;
  if (s.endsWith(".php") || s.includes(".php")) return true;
  if (s === "favicon.ico" || s.endsWith("/favicon.ico")) return true;
  if (s.startsWith("wp-") || s.includes("/wp-")) return true;
  if (
    s.includes("wp-admin") ||
    s.includes("wp-includes") ||
    s.includes("wp-content") ||
    s.includes("wp-trackback")
  )
    return true;
  // Apple touch icons, robots, .well-known
  if (
    s === "apple-touch-icon.png" ||
    s === "apple-touch-icon-precomposed.png" ||
    s === "robots.txt" ||
    s === ".well-known" ||
    s.startsWith(".well-known/")
  )
    return true;
  // .git/config and similar exposed paths
  if (s.startsWith(".git/") || s === ".git/config" || s.includes("/.git/")) return true;
  // Common CMS exploit paths (Drupal, OpenCart, etc.)
  if (
    s.startsWith("sites/default/files") ||
    s.startsWith("admin/controller/extension") ||
    s === "uploads" ||
    s === "images" ||
    s === "files" ||
    s.endsWith("/uploads") ||
    s.endsWith("/images") ||
    s.endsWith("/files")
  )
    return true;
  // Mobile/alternative path variants
  if (s === "m/bookings" || s.startsWith("m/")) return true;
  if (
    /^(install|admin|config|wp-conflg|manager|login|xmlrpc|readme|license)\.php$/i.test(
      s.split("/").pop() || ""
    )
  )
    return true;
  if (/^\d{1,4}\.php$/.test(s.split("/").pop() || "")) return true; // e.g. 403.php, 404.php
  return false;
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  const config = await getSiteConfig();
  const feature = config.features[featureKey];
  if (typeof feature === "boolean") {
    return feature;
  }
  if (feature && typeof feature === "object" && "enabled" in feature) {
    return feature.enabled;
  }
  return false;
}

/**
 * Get navigation items
 */
export async function getNavigation(type: "main" | "footer" = "main") {
  const config = await getSiteConfig();
  return config.navigation[type] || [];
}

/**
 * Replace ${VAR_NAME} placeholders with environment variables
 */
function replaceEnvVars(obj: any): any {
  if (typeof obj === "string") {
    // Replace ${VAR_NAME} with process.env.VAR_NAME
    return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceEnvVars(item));
  }

  if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceEnvVars(value);
    }
    return result;
  }

  return obj;
}

/**
 * Clear cache (useful for development)
 */
export function clearContentCache() {
  cache.clear();
}

/**
 * Get all available pages
 */
export async function getAvailablePages(): Promise<string[]> {
  const config = await getSiteConfig();
  const pages = config.pages ? Object.keys(config.pages) : [];

  // Also check content directory
  const contentDir = join(process.cwd(), "content", "pages");
  if (existsSync(contentDir)) {
    const fs = require("fs");
    const files = fs.readdirSync(contentDir);
    const markdownPages = files
      .filter((f: string) => f.endsWith(".md"))
      .map((f: string) => f.replace(".md", ""));

    // Merge and deduplicate
    return [...new Set([...pages, ...markdownPages])];
  }

  return pages;
}
