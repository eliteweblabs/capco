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
 * Prioritizes localhost/development detection, then uses RAILWAY_PUBLIC_DOMAIN, then request URL
 */
export function getBaseUrl(request?: Request): string {
  // First, check if we're in development (localhost) by examining the request
  if (request) {
    try {
      const url = new URL(request.url);
      const hostname = url.hostname;
      
      // If we're on localhost, always use the request URL (even if RAILWAY_PUBLIC_DOMAIN is set)
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.")) {
        return `${url.protocol}//${url.host}`;
      }
    } catch (e) {
      console.error("🚨 [URL-UTILS] Failed to parse request URL:", e);
    }
  }

  // Check for RAILWAY_PUBLIC_DOMAIN environment variable (for production)
  let baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || import.meta.env.RAILWAY_PUBLIC_DOMAIN;
  
  if (baseUrl) {
    // Defensive check: ensure baseUrl doesn't contain placeholder patterns like ${...}
    if (typeof baseUrl === "string" && baseUrl.includes("${")) {
      console.error("🚨 [URL-UTILS] RAILWAY_PUBLIC_DOMAIN contains unresolved placeholder:", baseUrl);
      baseUrl = null; // Treat as invalid, will use fallback
    }
    
    // Defensive check: ensure baseUrl doesn't contain SVG/XML content
    if (baseUrl && typeof baseUrl === "string" && (baseUrl.includes("<svg") || baseUrl.includes("<?xml") || baseUrl.includes("xmlns="))) {
      console.error("🚨 [URL-UTILS] RAILWAY_PUBLIC_DOMAIN contains SVG/XML content, using fallback");
      baseUrl = null; // Treat as invalid, will use fallback
    }
    
    if (baseUrl) {
      // Ensure baseUrl has proper protocol
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      return baseUrl;
    }
  }

  // Fallback to request URL if available
  if (request) {
    try {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error("🚨 [URL-UTILS] Failed to parse request URL, using default");
    }
  }

  // Final fallback to production URL
  console.warn("⚠️ [URL-UTILS] RAILWAY_PUBLIC_DOMAIN not set or invalid, using default fallback");
  return "https://capcofire.com";
}

/**
 * Get the base URL for API calls
 * Prioritizes localhost/development detection, then uses RAILWAY_PUBLIC_DOMAIN, then request URL
 */
export function getApiBaseUrl(request?: Request): string {
  // First, check if we're in development (localhost) by examining the request
  if (request) {
    try {
      const url = new URL(request.url);
      const hostname = url.hostname;
      
      // If we're on localhost, always use the request URL (even if RAILWAY_PUBLIC_DOMAIN is set)
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.")) {
        return `${url.protocol}//${url.host}`;
      }
    } catch (e) {
      console.error("🚨 [URL-UTILS] Failed to parse request URL:", e);
    }
  }

  // Check for RAILWAY_PUBLIC_DOMAIN environment variable (for production)
  let baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || import.meta.env.RAILWAY_PUBLIC_DOMAIN;
  
  if (baseUrl) {
    // Defensive check: ensure baseUrl doesn't contain placeholder patterns like ${...}
    if (typeof baseUrl === "string" && baseUrl.includes("${")) {
      console.error("🚨 [URL-UTILS] RAILWAY_PUBLIC_DOMAIN contains unresolved placeholder:", baseUrl);
      baseUrl = null; // Treat as invalid, will use fallback
    }
    
    // Defensive check: ensure baseUrl doesn't contain SVG/XML content
    if (baseUrl && typeof baseUrl === "string" && (baseUrl.includes("<svg") || baseUrl.includes("<?xml") || baseUrl.includes("xmlns="))) {
      console.error("🚨 [URL-UTILS] RAILWAY_PUBLIC_DOMAIN contains SVG/XML content, using fallback");
      baseUrl = null; // Treat as invalid, will use fallback
    }
    
    if (baseUrl) {
      // Ensure baseUrl has proper protocol
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      return baseUrl;
    }
  }

  // Fallback to request URL if available
  if (request) {
    try {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error("🚨 [URL-UTILS] Failed to parse request URL, using default");
    }
  }

  // Final fallback to production URL
  console.warn("⚠️ [URL-UTILS] RAILWAY_PUBLIC_DOMAIN not set or invalid, using default fallback");
  return "https://capcofire.com";
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
