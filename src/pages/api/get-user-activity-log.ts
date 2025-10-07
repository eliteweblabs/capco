import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { SimpleProjectLogger } from "../../lib/simple-logging";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Check if user is authenticated and is Admin
    const { isAuth, currentRole } = await checkAuth(cookies);

    if (!isAuth || currentRole !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user activity log - using getProjectLog with projectId 0 for global logs
    const userActivityLog = await SimpleProjectLogger.getProjectLog(0);

    return new Response(
      JSON.stringify({
        success: true,
        log: userActivityLog,
        count: userActivityLog.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching user activity log:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
