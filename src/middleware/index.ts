// this where the auth is handled and redirects
//
import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { clearAuthCookies, setAuthCookies } from "../lib/auth-cookies";
import { setupConsoleInterceptor } from "../lib/console-interceptor";
import { supabase } from "../lib/supabase";

// Setup console interceptor for server-side (disables console.log in production)
setupConsoleInterceptor();

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

export const onRequest = defineMiddleware(async ({ locals, url, cookies, redirect }, next) => {
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

    // Check for custom session cookies (magic link authentication)
    const customSessionToken = cookies.get("custom-session-token");
    const customUserEmail = cookies.get("custom-user-email");
    const customUserId = cookies.get("custom-user-id");

    if (!accessToken || !refreshToken) {
      // If no standard tokens, check for custom session cookies
      if (!customSessionToken || !customUserEmail || !customUserId) {
        return redirect("/login");
      }
      // Custom session found, skip Supabase session validation
      return next();
    }

    const { data, error } = await supabase.auth.setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (error) {
      clearAuthCookies(cookies);
      return redirect("/login");
    }

    // Get user role from profile (profile created automatically by trigger)
    if (data.user) {
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      // If profile doesn't exist, create it automatically
      if (profileError && profileError.code === "PGRST116") {
        console.log(
          "🔐 [MIDDLEWARE] User profile not found, creating missing profile for user:",
          data.user.id
        );

        const firstName = data.user.user_metadata?.firstName || "";
        const lastName = data.user.user_metadata?.lastName || "";
        const companyName =
          data.user.user_metadata?.companyName ||
          data.user.email?.split("@")[0] ||
          "Unknown Company";

        const { error: createProfileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          companyName: companyName,
          role: "Client", // Default role for missing profiles
          firstName: firstName,
          lastName: lastName,
          avatarUrl: data.user.user_metadata?.avatarUrl || data.user.user_metadata?.picture || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (createProfileError) {
          console.error("🔐 [MIDDLEWARE] Error creating missing profile:", createProfileError);
          // Continue with default role if profile creation fails
          profile = { role: "Client" };
        } else {
          console.log("🔐 [MIDDLEWARE] Missing profile created successfully");
          profile = { role: "Client" };
        }
      }

      locals.user = data.user;
      locals.email = data.user.email;
      locals.role = profile?.role || "Client";
    }

    // Use shared utility for consistent cookie handling
    setAuthCookies(cookies, data.session!.access_token, data.session!.refresh_token);
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
        { status: 401 }
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
        { status: 401 }
      );
    }
  }

  return next();
});
