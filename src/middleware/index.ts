// this where the auth is handled and redirects
//
import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { clearAuthCookies, setAuthCookies } from "../lib/auth-cookies";
import { supabase } from "../lib/supabase";

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

    if (!accessToken || !refreshToken) {
      return redirect("/login");
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
        // console.log(
        //   "🔐 [MIDDLEWARE] User profile not found, creating missing profile for user:",
        //   data.user.id
        // );

        const firstName = data.user.user_metadata?.first_name || "";
        const lastName = data.user.user_metadata?.last_name || "";
        const companyName =
          data.user.user_metadata?.company_name ||
          data.user.email?.split("@")[0] ||
          "Unknown Company";

        const { error: createProfileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          company_name: companyName,
          role: "Client", // Default role for missing profiles
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (createProfileError) {
          console.error("🔐 [MIDDLEWARE] Error creating missing profile:", createProfileError);
          // Continue with default role if profile creation fails
          profile = { role: "Client" };
        } else {
          // console.log("🔐 [MIDDLEWARE] Missing profile created successfully");
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
