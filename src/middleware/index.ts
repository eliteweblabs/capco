// this where the auth is handled and redirects
//
import { defineMiddleware } from "astro:middleware";
import { supabase } from "../lib/supabase";
import { setAuthCookies, clearAuthCookies } from "../lib/auth-cookies";
import { ensureUserProfile } from "../lib/auth-utils";
import micromatch from "micromatch";

const protectedRoutes = ["/dashboard(|/)", "/project/**"];
const redirectRoutes = ["/signin(|/)", "/register(|/)"];
const protectedAPIRoutes = [
  "/api/guestbook(|/)",
  "/api/create-project",
  "/api/update-project/**",
  "/api/delete-project",
  "/api/upload",
];
const authCallbackRoutes = ["/api/auth/callback(|/)", "/api/auth/verify"];

export const onRequest = defineMiddleware(
  async ({ locals, url, cookies, redirect }, next) => {
    // Skip middleware if Supabase is not configured
    if (!supabase) {
      return next();
    }

    // Skip middleware for auth callback routes to avoid interference with PKCE flow
    if (micromatch.isMatch(url.pathname, authCallbackRoutes)) {
      return next();
    }

    if (micromatch.isMatch(url.pathname, protectedRoutes)) {
      const accessToken = cookies.get("sb-access-token");
      const refreshToken = cookies.get("sb-refresh-token");

      if (!accessToken || !refreshToken) {
        return redirect("/");
      }

      const { data, error } = await supabase.auth.setSession({
        refresh_token: refreshToken.value,
        access_token: accessToken.value,
      });

      if (error) {
        clearAuthCookies(cookies);
        return redirect("/");
      }

      // Ensure user has a profile
      if (data.user) {
        await ensureUserProfile(data.user);

        // Get user role from profile and set in locals
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        locals.user = data.user;
        locals.email = data.user.email;
        locals.role = profile?.role || "Client";
      }

      // Use shared utility for consistent cookie handling
      setAuthCookies(
        cookies,
        data.session!.access_token,
        data.session!.refresh_token,
      );
    }

    if (micromatch.isMatch(url.pathname, redirectRoutes)) {
      const accessToken = cookies.get("sb-access-token");
      const refreshToken = cookies.get("sb-refresh-token");

      if (accessToken && refreshToken) {
        return redirect("/");
      }
    }

    if (micromatch.isMatch(url.pathname, protectedAPIRoutes)) {
      const accessToken = cookies.get("sb-access-token");
      const refreshToken = cookies.get("sb-refresh-token");

      // Check for tokens
      if (!accessToken || !refreshToken) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
          }),
          { status: 401 },
        );
      }

      // Verify the tokens
      const { error } = await supabase.auth.setSession({
        access_token: accessToken.value,
        refresh_token: refreshToken.value,
      });

      if (error) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
          }),
          { status: 401 },
        );
      }
    }

    return next();
  },
);
