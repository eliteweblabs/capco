import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../../lib/auth-cookies";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { checkAuth } from "../../../lib/auth";

export const GET: APIRoute = async ({ cookies, redirect, request }) => {
  // Log logout before clearing cookies
  try {
    const { currentUser } = await checkAuth(cookies);
    if (currentUser?.email) {
      await SimpleProjectLogger.logUserLogout(
        currentUser.email,
        {
          userAgent: request.headers.get("user-agent"),
          timestamp: new Date().toISOString(),
        }
      );
      console.log("✅ [SIGNOUT] Logout event logged successfully");
    }
  } catch (logError) {
    console.error("❌ [SIGNOUT] Error logging logout event:", logError);
    // Don't fail the logout flow if logging fails
  }

  clearAuthCookies(cookies);
  return redirect("/");
};

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
