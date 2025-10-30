/**
 * Utility functions for handling URLs in different environments
 */

/**
 * Get the base URL for the current environment
 * Uses RAILWAY_PUBLIC_DOMAIN environment variable, with request URL fallback for development
 */
export function getBaseUrl(request?: Request): string {
  // Check for RAILWAY_PUBLIC_DOMAIN environment variable first
  let baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || import.meta.env.RAILWAY_PUBLIC_DOMAIN;
  
  if (baseUrl) {
    // Ensure baseUrl has proper protocol
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
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
    // Ensure baseUrl has proper protocol
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
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
