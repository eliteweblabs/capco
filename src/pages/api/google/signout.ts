import type { APIRoute } from "astro";
import { clearGoogleAuth } from "../../lib/google-auth";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Clear all Google auth cookies
  clearGoogleAuth(cookies);

  console.log("🔐 [GOOGLE-SIGNOUT] User signed out, cookies cleared");

  // Redirect to sign-in page
  return redirect("/google-signin");
};
