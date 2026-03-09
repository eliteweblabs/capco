/**
 * Generates clone-site-and-db.env with source ref + password from server env.
 * Admin/superAdmin only. Source password from SUPABASE_DB_PASSWORD.
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

export const POST: APIRoute = async ({ request, cookies }) => {
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
  const sourceDbPassword =
    import.meta.env.SUPABASE_DB_PASSWORD ||
    (typeof process !== "undefined" ? process.env.SUPABASE_DB_PASSWORD : "") ||
    import.meta.env.SUPABASE_DATABASE_PASSWORD ||
    (typeof process !== "undefined" ? process.env.SUPABASE_DATABASE_PASSWORD : "") ||
    "";

  const sourceRef = extractSupabaseRef(supabaseUrl);

  if (!sourceRef || !sourceDbPassword) {
    return new Response(
      JSON.stringify({
        error:
          "Source config missing. Set SUPABASE_DB_PASSWORD (and PUBLIC_SUPABASE_URL) in your deployment env.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: {
    destRef?: string;
    destPass?: string;
    destAnon?: string;
    destService?: string;
    siteName?: string;
    siteUrl?: string;
    useDocker?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const destRef = (body.destRef ?? "").trim();
  const destPass = (body.destPass ?? "").trim();
  const destAnon = (body.destAnon ?? "").trim();
  const destService = (body.destService ?? "").trim();
  const siteName = (body.siteName ?? "").trim() || "New Client Site";
  const siteUrl = (body.siteUrl ?? "").trim();
  const useDocker = body.useDocker ? "1" : "0";

  if (!destRef || !destPass || !destAnon || !destService) {
    return new Response(
      JSON.stringify({
        error: "Fill in all new Supabase fields: ref, password, anon key, service key.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const lines = [
    "# Clone Site + DB – generated from /admin/clone-deploy",
    "# Copy to scripts/clone-site-and-db.env",
    "",
    "SOURCE_SUPABASE_REF=" + sourceRef,
    "SOURCE_SUPABASE_DB_PASSWORD=" + sourceDbPassword,
    "",
    "DEST_SUPABASE_REF=" + destRef,
    "DEST_SUPABASE_DB_PASSWORD=" + destPass,
    "DEST_SUPABASE_ANON_KEY=" + destAnon,
    "DEST_SUPABASE_SERVICE_ROLE_KEY=" + destService,
    "",
    "DEST_RAILWAY_PROJECT_NAME=" + siteName,
    siteUrl ? "DEST_RAILWAY_DOMAIN=" + siteUrl : "# DEST_RAILWAY_DOMAIN=",
    "",
    "USE_DOCKER_FOR_PG_DUMP=" + useDocker,
  ];
  const content = lines.join("\n");

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": 'attachment; filename="clone-site-and-db.env"',
    },
  });
};
