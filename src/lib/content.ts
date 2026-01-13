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

// Cache for performance
const cache = new Map<string, any>();

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
 * Get site configuration
 * Reads from database first, then environment variables as fallback, merges with JSON for structure
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const cacheKey = "site-config";

  // Skip cache in development for live updates
  if (process.env.NODE_ENV !== "development" && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const configPath = join(process.cwd(), "site-config.json");

  // Get company data from database
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
  const config: SiteConfig = {
    site: {
      name:
        companyData?.globalCompanyName ||
        process.env.RAILWAY_PROJECT_NAME ||
        "Fire Protection Services",
      slogan:
        companyData?.globalCompanySlogan ||
        "Professional Services",
      description:
        companyData?.globalCompanySlogan ||
        "Fire protection system review and approval",
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

  // Try to read and merge with site-config.json (for navigation and features)
  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, "utf-8");
      const jsonConfig = JSON.parse(fileContent);

      // Merge navigation and features from JSON file
      if (jsonConfig.navigation) {
        config.navigation = jsonConfig.navigation;
      }
      if (jsonConfig.features) {
        config.features = jsonConfig.features;
      }

      console.log("✅ [CONTENT] Loaded site-config.json (navigation & features)");
    } catch (error) {
      console.warn("⚠️ [CONTENT] Error reading site-config.json, using defaults:", error);
    }
  }

  cache.set(cacheKey, config);
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
      title:
        companyData?.globalCompanyName ||
        process.env.RAILWAY_PROJECT_NAME ||
        "Fire Protection Services",
      description:
        companyData?.globalCompanySlogan ||
        "Professional fire protection plan review and approval",
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

  // 0. Try database first (CMS - highest priority for per-deployment customization)
  if (supabaseAdmin) {
    try {
      const clientId = process.env.RAILWAY_PROJECT_NAME || null;
      const { data: dbPage, error } = await supabaseAdmin
        .from("cms_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .or(`client_id.is.null,client_id.eq.${clientId}`)
        .order("client_id", { ascending: false }) // Client-specific takes priority
        .limit(1)
        .maybeSingle();

      if (!error && dbPage) {
        const pageContent: PageContent = {
          title: dbPage.title || slug,
          description: dbPage.description || "",
          template: dbPage.template || "default",
          content: dbPage.content || "",
          ...(dbPage.frontmatter || {}),
        };
        cache.set(cacheKey, pageContent);
        console.log(`✅ [CONTENT] Loaded ${slug} from database (CMS)`);
        return pageContent;
      }
    } catch (error) {
      console.warn(`⚠️ [CONTENT] Error loading ${slug} from database:`, error);
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
      console.log(`✅ [CONTENT] Loaded ${slug} from environment variable (JSON)`);
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
    console.log(`✅ [CONTENT] Loaded ${slug} from environment variables`);
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
      console.log(`✅ [CONTENT] Loaded ${slug} from persistent volume`);
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
      console.log(`✅ [CONTENT] Loaded ${slug} from file`);
      return pageContent;
    } catch (error) {
      console.warn(`⚠️ [CONTENT] Error reading ${slug}.md:`, error);
    }
  }

  // 3. Fallback to default content
  const defaultContent = await getDefaultPageContent(slug);
  if (defaultContent) {
    console.log(`ℹ️ [CONTENT] Using default content for: ${slug}`);
    cache.set(cacheKey, defaultContent);
    return defaultContent;
  }

  // Return null if no content found (will trigger 404)
  console.warn(`⚠️ [CONTENT] No content found for page: ${slug}`);
  return null;
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
export function getAvailablePages(): string[] {
  const config = getSiteConfig();
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
