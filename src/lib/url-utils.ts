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
export function ensureProtocol(
  url?: string | null,
  defaultUrl: string = "http://localhost:4321"
): string {
  if (!url) return defaultUrl;

  // Defensive check: ensure url doesn't contain SVG/XML content
  if (
    typeof url === "string" &&
    (url.includes("<svg") || url.includes("<?xml") || url.includes("xmlns="))
  ) {
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
 * Prioritizes request URL first, then database, then hardcoded fallback
 */
export function getBaseUrl(request?: Request): string {
  // First priority: Use request URL if available (works for all environments)
  if (request) {
    try {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error("🚨 [URL-UTILS] Failed to parse request URL:", e);
    }
  }

  // Second priority: Check database (will be handled by caller if needed)
  // This function doesn't have access to database, so we skip this here

  // Final fallback to localhost for development
  console.warn("⚠️ [URL-UTILS] No request URL available, using localhost fallback");
  return "http://localhost:4321";
}

/**
 * Get the base URL for API calls
 * Prioritizes request URL first, then database, then hardcoded fallback
 */
export function getApiBaseUrl(request?: Request): string {
  // First priority: Use request URL if available (works for all environments)
  if (request) {
    try {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error("🚨 [URL-UTILS] Failed to parse request URL:", e);
    }
  }

  // Second priority: Check database (will be handled by caller if needed)
  // This function doesn't have access to database, so we skip this here

  // Final fallback to localhost for development
  console.warn("⚠️ [URL-UTILS] No request URL available, using localhost fallback");
  return "http://localhost:4321";
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
