import type { User } from "@supabase/supabase-js";
import { clearAuthCookies, setAuthCookies } from "./auth-cookies";
import { supabase } from "./supabase";
import { isBackendPage } from "../pages/api/utils/backend-page-check";
import { getValidSuperAdminFromCookie } from "./superadmin";

export interface ExtendedUser extends User {
  profile?: any;
}

export interface AuthResult {
  isAuth: boolean;
  session: any;
  currentUser: ExtendedUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  supabase: any;
  currentRole: string | null;
}

// Cache for preventing concurrent session refreshes
let sessionRefreshPromise: Promise<any> | null = null;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 5000; // Minimum 5 seconds between refresh attempts

export async function checkAuth(cookies: any): Promise<AuthResult> {
  // console.log("🔐 [AUTH] Starting authentication check...");

  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  // Debug logging for localhost OAuth issues
  if (typeof window === "undefined") {
    // Server-side only
    // console.log("🔐 [AUTH] Cookie check:", {
    //   hasAccessToken: !!accessToken,
    //   hasRefreshToken: !!refreshToken,
    //   accessTokenValue: accessToken?.value ? `${accessToken.value.substring(0, 20)}...` : "missing",
    //   refreshTokenValue: refreshToken?.value
    //     ? `${refreshToken.value.substring(0, 20)}...`
    //     : "missing",
    // });
  }

  // Check for custom session cookies first
  const customSessionToken = cookies.get("custom-session-token");
  const customUserEmail = cookies.get("custom-user-email");
  const customUserId = cookies.get("custom-user-id");

  // console.log("🔐 [AUTH] Checking for custom session cookies:", {
  //   hasToken: !!customSessionToken,
  //   hasEmail: !!customUserEmail,
  //   hasUserId: !!customUserId,
  // });

  if (customSessionToken && customUserEmail && customUserId) {
    // console.log("🔐 [AUTH] Custom session found, creating custom user object");
    // console.log("🔐 [AUTH] Custom session details:", {
    //   hasToken: !!customSessionToken,
    //   hasEmail: !!customUserEmail,
    //   hasUserId: !!customUserId,
    //   tokenValue: customSessionToken?.value,
    //   emailValue: customUserEmail?.value,
    //   userIdValue: customUserId?.value,
    // });

    // Create a custom user object for the custom session
    const customUser: ExtendedUser = {
      id: customUserId.value,
      email: customUserEmail.value,
      user_metadata: {
        email: customUserEmail.value,
        role: "Client", // Default role, could be enhanced
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        role: "Client", // Add profile.role for App.astro compatibility
      },
    };

    const role = getValidSuperAdminFromCookie(cookies, customUser.id)
      ? "SuperAdmin"
      : "Client";
    return {
      isAuth: true,
      session: { user: customUser },
      currentUser: { ...customUser, profile: { ...customUser.profile, role } },
      accessToken: customSessionToken.value,
      refreshToken: customSessionToken.value,
      supabase: null,
      currentRole: role,
    };
  }

  // console.log("🔐 [AUTH] Tokens:", {
  //   hasAccessToken: !!accessToken,
  //   hasRefreshToken: !!refreshToken,
  //   accessTokenValue: accessToken?.value,
  //   refreshTokenValue: refreshToken?.value
  // });

  let isAuth = false;
  let session = null;
  let currentUser: ExtendedUser | null = null;
  let currentRole: string | null = null;

  if (accessToken && refreshToken && supabase) {
    // console.log("🔐 [AUTH] Tokens found, attempting to set session...");

    try {
      // Prevent concurrent refresh attempts - reuse existing promise if within interval
      const now = Date.now();
      if (sessionRefreshPromise && now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
        // console.log("🔐 [AUTH] Reusing existing session refresh promise...");
        session = await sessionRefreshPromise;
      } else {
        // Create new session refresh
        lastRefreshTime = now;

        // Add timeout handling for Supabase connection issues
        sessionRefreshPromise = supabase.auth.setSession({
          refresh_token: refreshToken.value,
          access_token: accessToken.value,
        });

        // Set a 10-second timeout for the session request
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 10000)
        );

        session = (await Promise.race([sessionRefreshPromise, timeoutPromise])) as any;

        // Clear the promise after completion
        sessionRefreshPromise = null;
      }

      if (!session.error) {
        isAuth = true;
        currentUser = session.data.user as ExtendedUser;

        // Update cookies if tokens were refreshed
        if (session.data?.session?.access_token && session.data?.session?.refresh_token) {
          const newAccessToken = session.data.session.access_token;
          const newRefreshToken = session.data.session.refresh_token;

          // Only update if tokens actually changed
          if (newAccessToken !== accessToken.value || newRefreshToken !== refreshToken.value) {
            // console.log("🔐 [AUTH] Tokens refreshed, updating cookies...");
            setAuthCookies(cookies, newAccessToken, newRefreshToken);
          }
        }

        // Get user profile and role
        if (currentUser && currentUser.id) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (profile && !profileError) {
            // Enhance currentUser object with profile data
            currentUser.profile = profile;
            currentRole = profile.role;
          }
          if (!currentRole) {
            console.warn("🔐 [AUTH] Failed to get currentUser profile:", {
              userId: currentUser.id,
              userEmail: currentUser.email,
              profileError: profileError,
              errorCode: profileError?.code,
              errorMessage: profileError?.message,
            });
            // If profile doesn't exist, we should create one or handle gracefully
            if (profileError?.code === "PGRST116") {
              console.error(
                "🔐 [AUTH] User exists in auth but not in profiles table. User ID:",
                currentUser.id
              );

              // Set default role for users without profiles
              currentUser.profile = {
                id: currentUser.id,
                role: "Client",
                companyName: currentUser.email?.split("@")[0] || "Add Company Name",
              };
              currentRole = "Client";

              console.warn("🔐 [AUTH] Using default profile for user without profile record");
            }
          }
          if (currentUser && getValidSuperAdminFromCookie(cookies, currentUser.id)) {
            currentRole = "SuperAdmin";
            if (currentUser.profile) currentUser.profile.role = "SuperAdmin";
          }
        }
      } else {
        // Handle specific error cases
        const errorMessage = session.error?.message || "";

        // "Invalid Refresh Token: Already Used" means the token was already consumed
        // This can happen with concurrent requests - don't clear cookies, just return unauthenticated
        if (
          errorMessage.includes("Invalid Refresh Token") ||
          errorMessage.includes("Already Used")
        ) {
          // Expected when multiple tabs/requests refresh at once; no log to avoid server log noise
          // Don't clear cookies - they might be valid for another request
          return {
            isAuth: false,
            session: null,
            currentUser: null,
            accessToken: accessToken?.value || null,
            refreshToken: refreshToken?.value || null,
            supabase,
            currentRole: null,
          };
        }

        console.error("🔐 [AUTH] Session error, clearing invalid tokens:", session.error);
        // Clear invalid tokens
        clearAuthCookies(cookies);
      }
    } catch (error) {
      console.error("🔐 [AUTH] Exception during authentication:", error);

      // Clear the refresh promise on error
      sessionRefreshPromise = null;

      // Handle connection timeout specifically
      if (error instanceof Error && error.message === "Connection timeout") {
        console.warn("🔐 [AUTH] Supabase connection timeout - database may be experiencing issues");
        // Don't clear cookies on timeout, just return unauthenticated state
        return {
          isAuth: false,
          session: null,
          currentUser: null,
          accessToken: accessToken?.value || null,
          refreshToken: refreshToken?.value || null,
          supabase,
          currentRole: null,
        };
      }

      // Clear invalid tokens for other errors
      clearAuthCookies(cookies);
    }
  } else {
    // Only log if we're on a protected route where auth is expected
    isBackendPage(typeof window !== "undefined" ? window.location.pathname : "")
      ? console.log("🔐 [AUTH] No authentication tokens found")
      : null;
  }

  const result = {
    isAuth,
    session,
    currentUser,
    accessToken,
    refreshToken,
    supabase,
    currentRole,
  };

  return result;
}
