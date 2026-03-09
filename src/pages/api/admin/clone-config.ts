/**
 * Returns current deployment config for clone-deploy (source = this site).
 * Admin/superAdmin only.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { isAdminOrSuperAdmin } from "../../../lib/user-utils";

export const prerender = false;

function extractSupabaseRef(url: string): string {
  if (!url) return "";
  const m = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/);
  return m ? m[1] : "";
}

export const GET: APIRoute = async ({ cookies }) => {
  const { currentUser, session, currentRole } = await checkAuth(cookies);
  if (!currentUser || !session || !isAdminOrSuperAdmin(currentRole)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl =
    import.meta.env.PUBLIC_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env.PUBLIC_SUPABASE_URL : "") ||
    "";
  const railwayProject =
    import.meta.env.RAILWAY_PROJECT_NAME ||
    (typeof process !== "undefined" ? process.env.RAILWAY_PROJECT_NAME : "") ||
    "";
  const railwayDomain =
    import.meta.env.RAILWAY_PUBLIC_DOMAIN ||
    (typeof process !== "undefined" ? process.env.RAILWAY_PUBLIC_DOMAIN : "") ||
    "";

  const sourceSupabaseRef = extractSupabaseRef(supabaseUrl);

  return new Response(
    JSON.stringify({
      sourceSupabaseRef,
      sourceSupabaseUrl: supabaseUrl,
      sourceRailwayProject: railwayProject,
      sourceRailwayDomain: railwayDomain,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
