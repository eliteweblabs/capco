// API endpoint to clear the global settings cache
// GET /api/cache/clear-settings
import type { APIRoute } from "astro";
import { clearSettingsCache } from "../global/global-company-data";

export const GET: APIRoute = async ({ request }) => {
  try {
    // Clear the cache
    clearSettingsCache();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Global settings cache cleared successfully",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[clear-settings-cache] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to clear cache",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
