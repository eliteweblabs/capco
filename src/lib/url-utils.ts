/**
 * Utility functions for handling URLs in different environments
 */

/**
 * Get the base URL for the current environment
 * Works for both local development and production deployments
 */
export function getBaseUrl(request?: Request): string {
  // If we have a request object, use its origin
  if (request) {
    try {
      return new URL(request.url).origin;
    } catch (error) {
      console.warn("Failed to parse request URL:", error);
    }
  }

  // Fallback to environment variables
  if (import.meta.env.SITE_URL) {
    return import.meta.env.SITE_URL;
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Always return production URL
  return "https://capcofire.com";
}

/**
 * Get the base URL for API calls
 * This should always use the current request origin when available
 */
export function getApiBaseUrl(request?: Request): string {
  if (request) {
    try {
      return new URL(request.url).origin;
    } catch (error) {
      console.warn("Failed to parse request URL for API base:", error);
    }
  }

  // For API calls, we need to be more careful about the environment
  if (import.meta.env.SITE_URL) {
    return import.meta.env.SITE_URL;
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Always return production URL
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
