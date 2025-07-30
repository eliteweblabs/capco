// this where the auth is handled and redirects
//
import { defineMiddleware } from "astro:middleware";
import { supabase } from "../lib/supabase";
import { setAuthCookies, clearAuthCookies } from "../lib/auth-cookies";
import micromatch from "micromatch";

const protectedRoutes = ["/dashboard(|/)"];
const redirectRoutes = ["/signin(|/)", "/register(|/)"];
const proptectedAPIRoutes = ["/api/guestbook(|/)"];
const authCallbackRoutes = ["/api/auth/callback(|/)"];

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

      locals.email = data.user?.email!;

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

    if (micromatch.isMatch(url.pathname, proptectedAPIRoutes)) {
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
