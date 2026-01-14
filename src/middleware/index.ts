// this where the auth is handled and redirects
//
import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { clearAuthCookies, setAuthCookies } from "../lib/auth-cookies";
import { setupConsoleInterceptor } from "../lib/console-interceptor";
import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabase-admin";

// Setup console interceptor for server-side (disables console.log in production)
try {
  setupConsoleInterceptor();
} catch (error) {
  // Don't let console interceptor break the entire site
  console.error("[---MIDDLEWARE] Error setting up console interceptor:", error);
}

const protectedRoutes = ["/dashboard(|/)", "/project/**"];
const devBypassRoutes = ["/analytics", "/dashboard"];
const redirectRoutes = ["/signin(|/)", "/register(|/)"];
const protectedAPIRoutes = [
  "/api/projects/new",
  "/api/projects/upsert",
  "/api/projects/**",
  "/api/projects/delete",
  "/api/payments/**",
  "/api/payments/get",
  "/api/payments/upsert",
  "/api/payments/delete",
  "/api/upload",
];
const authCallbackRoutes = ["/api/auth/callback(|/)", "/api/auth/verify"];

export const onRequest = defineMiddleware(
  async ({ locals, url, cookies, redirect, request }, next) => {
    // Force HTTPS redirect in production (Railway handles SSL termination)
    if (import.meta.env.PROD || process.env.NODE_ENV === "production") {
      const protocol = request.headers.get("x-forwarded-proto") || url.protocol;
      const host = url.host;

      // If request is HTTP, redirect to HTTPS (Railway provides SSL)
      if (protocol === "http:" || (!protocol && !url.href.startsWith("https://"))) {
        const httpsUrl = `https://${host}${url.pathname}${url.search}`;
        return redirect(httpsUrl, 301); // Permanent redirect
      }
    }

    // Skip middleware if Supabase is not configured
    if (!supabase) {
      return next();
    }

    // Handle Cloudflare cookie domain issues
    if (
      url.pathname.includes(".png") ||
      url.pathname.includes(".jpg") ||
      url.pathname.includes(".jpeg") ||
      url.pathname.includes(".gif")
    ) {
      // Skip middleware for image requests to avoid cookie issues
      return next();
    }

    // Skip middleware for auth callback routes to avoid interference with PKCE flow
    if (micromatch.isMatch(url.pathname, authCallbackRoutes)) {
      return next();
    }

    // Skip middleware for dev bypass routes (development only)
    if (micromatch.isMatch(url.pathname, devBypassRoutes)) {
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
          return redirect("/auth/login");
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
        return redirect("/auth/login");
      }

      // Get user role from profile (profile created automatically by trigger)
      if (data.user) {
        let { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        // If profile doesn't exist, create it automatically using admin client (bypasses RLS)
        if (profileError && profileError.code === "PGRST116") {
          console.log(
            "🔐 [MIDDLEWARE] User profile not found, creating missing profile for user:",
            data.user.id
          );

          const metadata = data.user.user_metadata || {};
          
          // Extract firstName (handle Google OAuth: given_name)
          const firstName = 
            metadata.firstName || 
            metadata.first_name || 
            metadata.given_name ||  // Google OAuth
            "";
          
          // Extract lastName (handle Google OAuth: family_name)
          const lastName = 
            metadata.lastName || 
            metadata.last_name || 
            metadata.family_name ||  // Google OAuth
            "";
          
          // Extract companyName (handle Google OAuth: name = full name)
          const companyName =
            metadata.companyName ||
            metadata.company_name ||
            metadata.name ||  // Google OAuth full name
            metadata.full_name ||
            data.user.email?.split("@")[0] ||
            "Unknown Company";
          
          // Extract avatarUrl (handle Google OAuth: picture)
          const avatarUrl =
            metadata.avatarUrl ||
            metadata.avatar_url ||
            metadata.picture ||  // Google OAuth
            null;

          // Use admin client to bypass RLS policies
          const { error: createProfileError } = await supabaseAdmin.from("profiles").insert({
            id: data.user.id,
            email: data.user.email,
            companyName: companyName,
            role: "Client", // Default role for missing profiles
            firstName: firstName,
            lastName: lastName,
            avatarUrl: avatarUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          if (createProfileError) {
            console.error("🔐 [MIDDLEWARE] Error creating missing profile:", createProfileError);
            // Continue with default role if profile creation fails
            profile = { role: "Client" };
          } else {
            console.log("🔐 [MIDDLEWARE] Missing profile created successfully for:", data.user.email);
            profile = { role: "Client" };
          }
        }

        locals.user = data.user;
        locals.email = data.user.email;
        locals.role = profile?.role || "Client";

        // Set current user in global context for logger access
        globalThis.currentUser = data.user;
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
      const { data: sessionData, error } = await supabase.auth.setSession({
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

      // Set current user in global context for logger access
      if (sessionData?.user) {
        globalThis.currentUser = sessionData.user;
      }
    }

    return next();
  }
);
