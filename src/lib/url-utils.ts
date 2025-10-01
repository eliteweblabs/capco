/**
 * Utility functions for handling URLs in different environments
 */

/**
 * Get the base URL for the current environment
 * Uses SITE_URL environment variable, with request URL fallback for development
 */
export function getBaseUrl(request?: Request): string {
  // Check for SITE_URL environment variable first
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  if (import.meta.env.SITE_URL) {
    return import.meta.env.SITE_URL;
  }

  // Fallback to request URL in development
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  // No fallbacks - throw error if SITE_URL is not configured
  throw new Error("SITE_URL environment variable is required but not set");
}

/**
 * Get the base URL for API calls
 * Uses SITE_URL environment variable, with request URL fallback for development
 */
export function getApiBaseUrl(request?: Request): string {
  // Check for SITE_URL environment variable first
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  if (import.meta.env.SITE_URL) {
    return import.meta.env.SITE_URL;
  }

  // Fallback to request URL in development
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  // No fallbacks - throw error if SITE_URL is not configured
  throw new Error("SITE_URL environment variable is required but not set");
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
