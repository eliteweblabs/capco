import type { APIRoute } from "astro";
import { apiCache } from "../../lib/api-cache";
import { userInfoCache } from "../../lib/user-utils";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] clear-cache.ts accessed - may be unused");

export const POST: APIRoute = async ({ request }) => {
  try {
    // Clear all API cache
    apiCache.clear();

    // Clear user info cache
    userInfoCache.clearCache();

    // Get cache statistics before clearing (for logging)
    const stats = apiCache.getStats();

    console.log("🧹 [CLEAR-CACHE] Cache cleared successfully:", {
      previousCacheSize: stats.size,
      previousProfileCacheSize: stats.profileCacheSize,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cache cleared successfully",
        previousStats: {
          cacheSize: stats.size,
          profileCacheSize: stats.profileCacheSize,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🧹 [CLEAR-CACHE] Error clearing cache:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to clear cache",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Also support GET for easy browser access
export const GET: APIRoute = async () => {
  try {
    // Clear all API cache
    apiCache.clear();

    // Clear user info cache
    userInfoCache.clearCache();

    // Get cache statistics
    const stats = apiCache.getStats();

    console.log("🧹 [CLEAR-CACHE] Cache cleared via GET request");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cache cleared successfully",
        timestamp: new Date().toISOString(),
        previousStats: {
          cacheSize: stats.size,
          profileCacheSize: stats.profileCacheSize,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🧹 [CLEAR-CACHE] Error clearing cache:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to clear cache",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
