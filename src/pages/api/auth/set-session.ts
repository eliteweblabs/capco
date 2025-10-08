import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return new Response(JSON.stringify({ error: "Missing tokens" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set the auth cookies
    setAuthCookies(cookies, access_token, refresh_token);

    console.log("✅ [SET-SESSION] Session cookies set successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [SET-SESSION] Error setting session:", error);
    return new Response(JSON.stringify({ error: "Failed to set session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
