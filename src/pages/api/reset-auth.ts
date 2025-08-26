import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../lib/auth-cookies";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Clear all auth cookies
  clearAuthCookies(cookies);

  console.log("Authentication state cleared");

  // Redirect to home page
  return redirect("/");
};

export const POST: APIRoute = async ({ cookies }) => {
  // Clear all auth cookies
  clearAuthCookies(cookies);

  return new Response(
    JSON.stringify({
      success: true,
      message: "Authentication state cleared",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
