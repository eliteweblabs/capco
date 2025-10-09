import type { User } from "@supabase/supabase-js";
import { clearAuthCookies } from "./auth-cookies";
import { supabase } from "./supabase";

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

export async function checkAuth(cookies: any): Promise<AuthResult> {
  // console.log("🔐 [AUTH] Starting authentication check...");

  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

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
      // Add timeout handling for Supabase connection issues
      const sessionPromise = supabase.auth.setSession({
        refresh_token: refreshToken.value,
        access_token: accessToken.value,
      });

      // Set a 10-second timeout for the session request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 10000)
      );

      session = (await Promise.race([sessionPromise, timeoutPromise])) as any;

      if (!session.error) {
        isAuth = true;
        currentUser = session.data.user as ExtendedUser;

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
          } else {
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
        }
      } else {
        console.error("🔐 [AUTH] Session error, clearing invalid tokens:", session.error);
        // Clear invalid tokens
        clearAuthCookies(cookies);
      }
    } catch (error) {
      console.error("🔐 [AUTH] Exception during authentication:", error);

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
    const publicPages = ["/", "/login", "/register", "/forgot-password"];
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    if (!publicPages.includes(currentPath)) {
      console.log("🔐 [AUTH] No authentication tokens found");
    }
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
