/**
 * API endpoint for cache status (for admin UI indicator)
 * GET /api/cache/status
 */
import type { APIRoute } from "astro";
import { getSettingsCacheInfo } from "../global/global-company-data";

export const GET: APIRoute = async () => {
  const info = getSettingsCacheInfo();
  const expiresInMs = info.cached ? Math.max(0, info.expiresAt - Date.now()) : 0;
  return new Response(
    JSON.stringify({
      cached: info.cached,
      expiresInMs,
      expiresInSec: Math.ceil(expiresInMs / 1000),
      ttlSec: Math.ceil(info.ttlMs / 1000),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
