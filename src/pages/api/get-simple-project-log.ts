import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const projectId = parseInt(url.searchParams.get("projectId") || "0");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authentication check (basic - you might want to add more)
    const accessToken = cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the log
    const log = await SimpleProjectLogger.getProjectLog(projectId);

    return new Response(
      JSON.stringify({
        success: true,
        log,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-simple-project-log:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
