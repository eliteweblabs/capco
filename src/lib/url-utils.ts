/**
 * Utility functions for handling URLs in different environments
 */

/**
 * Get the base URL for the current environment
 * Works for both local development and production deployments
 */
export function getBaseUrl(request?: Request): string {
  // PRIORITIZE environment variables over request URL to fix magic link localhost issue
  
  // Log environment for debugging
  console.log("🌐 [URL-UTILS] Environment debug:");
  console.log("🌐 [URL-UTILS] NODE_ENV:", process.env.NODE_ENV);
  console.log("🌐 [URL-UTILS] import.meta.env.PROD:", import.meta.env.PROD);
  console.log("🌐 [URL-UTILS] process.env.SITE_URL:", process.env.SITE_URL);
  console.log("🌐 [URL-UTILS] import.meta.env.SITE_URL:", import.meta.env.SITE_URL);
  
  // First check for explicit SITE_URL environment variable (most reliable for production)
  if (process.env.SITE_URL) {
    console.log("🌐 [URL-UTILS] ✅ Using process.env.SITE_URL:", process.env.SITE_URL);
    return process.env.SITE_URL;
  }
  
  if (import.meta.env.SITE_URL) {
    console.log("🌐 [URL-UTILS] ✅ Using import.meta.env.SITE_URL:", import.meta.env.SITE_URL);
    return import.meta.env.SITE_URL;
  }

  if (process.env.BASE_URL) {
    console.log("🌐 [URL-UTILS] ✅ Using process.env.BASE_URL:", process.env.BASE_URL);
    return process.env.BASE_URL;
  }

  // NEVER return localhost in production - this was the bug!
  const isProduction = process.env.NODE_ENV === "production" || import.meta.env.PROD;
  
  if (isProduction) {
    console.error("🚨 [URL-UTILS] CRITICAL: No SITE_URL set in production! Using fallback.");
    console.log("🌐 [URL-UTILS] ⚠️ Using production fallback: https://capcofire.com");
    return "https://capcofire.com";
  }

  // Development-only logic
  if (request) {
    try {
      const requestOrigin = new URL(request.url).origin;
      console.log("🌐 [URL-UTILS] Using request origin (dev only):", requestOrigin);
      return requestOrigin;
    } catch (error) {
      console.warn("Failed to parse request URL:", error);
    }
  }

  // Development fallback
  console.log("🌐 [URL-UTILS] Using development fallback: http://localhost:4321");
  return "http://localhost:4321";
}

/**
 * Get the base URL for API calls
 * This should always use the current request origin when available
 */
export function getApiBaseUrl(request?: Request): string {
  // PRIORITIZE environment variables over request URL for consistency
  
  // First check for explicit SITE_URL environment variable
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  
  if (import.meta.env.SITE_URL) {
    return import.meta.env.SITE_URL;
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Only use request URL if no environment variables are set (development only)
  if (request && !import.meta.env.PROD) {
    try {
      return new URL(request.url).origin;
    } catch (error) {
      console.warn("Failed to parse request URL for API base:", error);
    }
  }

  // Development fallback
  if (!import.meta.env.PROD) {
    return "http://localhost:4321";
  }

  // Production fallback
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
