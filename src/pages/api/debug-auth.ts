import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";

export const GET: APIRoute = async ({ cookies, request }) => {
  console.log("🔍 [DEBUG-AUTH] Starting authentication debug...");

  try {
    // Check authentication
    const authResult = await checkAuth(cookies);

    console.log("🔍 [DEBUG-AUTH] Authentication result:", {
      isAuth: authResult.isAuth,
      hasUser: !!authResult.currentUser,
      hasSession: !!authResult.session,
      hasAccessToken: !!authResult.accessToken,
      hasRefreshToken: !!authResult.refreshToken,
      currentRole: authResult.currentRole,
      userId: authResult.currentUser?.id,
      userEmail: authResult.currentUser?.email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          isAuth: authResult.isAuth,
          hasUser: !!authResult.currentUser,
          hasSession: !!authResult.session,
          hasAccessToken: !!authResult.accessToken,
          hasRefreshToken: !!authResult.refreshToken,
          currentRole: authResult.currentRole,
          userId: authResult.currentUser?.id,
          userEmail: authResult.currentUser?.email,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔍 [DEBUG-AUTH] Error during authentication debug:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
