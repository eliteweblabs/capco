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
    [key: string]: boolean;
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
 * Reads from environment variables for site info, merges with JSON for structure
 */
export function getSiteConfig(): SiteConfig {
  const cacheKey = "site-config";

  // Skip cache in development for live updates
  if (process.env.NODE_ENV !== "development" && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const configPath = join(process.cwd(), "site-config.json");

  // Start with defaults from environment variables
  const config: SiteConfig = {
    site: {
      name: process.env.RAILWAY_PROJECT_NAME || "Fire Protection Services",
      slogan: process.env.GLOBAL_COMPANY_SLOGAN || "Professional Services",
      description:
        process.env.GLOBAL_COMPANY_SLOGAN || "Fire protection system review and approval",
      url: process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:4321",
      email: process.env.GLOBAL_COMPANY_EMAIL || "admin@example.com",
      phone: process.env.GLOBAL_COMPANY_PHONE || "+15551234567",
      address: process.env.GLOBAL_COMPANY_ADDRESS || "123 Main St",
      year: process.env.YEAR || new Date().getFullYear().toString(),
    },
    branding: {
      primaryColor: process.env.GLOBAL_COLOR_PRIMARY || "#825BDD",
      secondaryColor: process.env.GLOBAL_COLOR_SECONDARY || "#0ea5e9",
      fontFamily: process.env.FONT_FAMILY || "Outfit Variable",
      fontFallback: process.env.FONT_FAMILY_FALLBACK || "sans-serif",
      logoSvg: process.env.GLOBAL_COMPANY_LOGO_SVG,
      iconSvg: process.env.GLOBAL_COMPANY_ICON_SVG,
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
 * Get page content from markdown file
 */
export async function getPageContent(slug: string): Promise<PageContent | null> {
  const cacheKey = `page-${slug}`;

  // Skip cache in development for live updates
  if (process.env.NODE_ENV !== "development" && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const contentPath = join(process.cwd(), "content", "pages", `${slug}.md`);

  // Try to read markdown file
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
      return pageContent;
    } catch (error) {
      console.warn(`⚠️ [CONTENT] Error reading ${slug}.md:`, error);
    }
  }

  // Return null if page doesn't exist (will trigger 404)
  console.warn(`⚠️ [CONTENT] No content found for page: ${slug}`);
  return null;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureKey: string): boolean {
  const config = getSiteConfig();
  return config.features[featureKey] ?? false;
}

/**
 * Get navigation items
 */
export function getNavigation(type: "main" | "footer" = "main") {
  const config = getSiteConfig();
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
