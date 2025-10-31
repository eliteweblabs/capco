/**
 * Utility functions for handling URLs in different environments
 */

/**
 * Ensures a URL has a protocol (http:// or https://)
 * If no protocol is present, adds https://
 * @param url - The URL string to check/fix
 * @param defaultUrl - Optional default URL if input is empty
 * @returns URL with protocol
 */
export function ensureProtocol(url?: string | null, defaultUrl: string = "http://localhost:4321"): string {
  if (!url) return defaultUrl;
  
  // Defensive check: ensure url doesn't contain SVG/XML content
  if (typeof url === "string" && (url.includes("<svg") || url.includes("<?xml") || url.includes("xmlns="))) {
    console.error("🚨 [URL-UTILS] ensureProtocol received SVG/XML content, using defaultUrl");
    return defaultUrl;
  }
  
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Get the base URL for the current environment
 * Uses RAILWAY_PUBLIC_DOMAIN environment variable, with request URL fallback for development
 */
export function getBaseUrl(request?: Request): string {
  // Check for RAILWAY_PUBLIC_DOMAIN environment variable first
  let baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || import.meta.env.RAILWAY_PUBLIC_DOMAIN;
  
  if (baseUrl) {
    // Defensive check: ensure baseUrl doesn't contain SVG/XML content
    if (typeof baseUrl === "string" && (baseUrl.includes("<svg") || baseUrl.includes("<?xml") || baseUrl.includes("xmlns="))) {
      console.error("🚨 [URL-UTILS] RAILWAY_PUBLIC_DOMAIN contains SVG/XML content, using fallback");
      baseUrl = request ? (() => {
        const url = new URL(request.url);
        return `${url.protocol}//${url.host}`;
      })() : "https://capcofire.com";
    } else {
      // Ensure baseUrl has proper protocol
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
    }
    return baseUrl;
  }

  // Fallback to request URL in development
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  // No fallbacks - throw error if RAILWAY_PUBLIC_DOMAIN is not configured
  throw new Error("RAILWAY_PUBLIC_DOMAIN environment variable is required but not set");
}

/**
 * Get the base URL for API calls
 * Uses RAILWAY_PUBLIC_DOMAIN environment variable, with request URL fallback for development
 */
export function getApiBaseUrl(request?: Request): string {
  // Check for RAILWAY_PUBLIC_DOMAIN environment variable first
  let baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || import.meta.env.RAILWAY_PUBLIC_DOMAIN;
  
  if (baseUrl) {
    // Defensive check: ensure baseUrl doesn't contain SVG/XML content
    if (typeof baseUrl === "string" && (baseUrl.includes("<svg") || baseUrl.includes("<?xml") || baseUrl.includes("xmlns="))) {
      console.error("🚨 [URL-UTILS] RAILWAY_PUBLIC_DOMAIN contains SVG/XML content, using fallback");
      baseUrl = request ? (() => {
        const url = new URL(request.url);
        return `${url.protocol}//${url.host}`;
      })() : "https://capcofire.com";
    } else {
      // Ensure baseUrl has proper protocol
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
    }
    return baseUrl;
  }

  // Fallback to request URL in development
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  // No fallbacks - throw error if RAILWAY_PUBLIC_DOMAIN is not configured
  throw new Error("RAILWAY_PUBLIC_DOMAIN environment variable is required but not set");
}

/**
 * Build a full URL from a path
 */
export function buildUrl(path: string, request?: Request): string {
  const baseUrl = getBaseUrl(request);
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Build a full API URL from a path
 */
export function buildApiUrl(path: string, request?: Request): string {
  const baseUrl = getApiBaseUrl(request);
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
