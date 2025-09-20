import type { User } from "@supabase/supabase-js";
import { clearAuthCookies } from "./auth-cookies";
import { supabase } from "./supabase";

export interface ExtendedUser extends User {
  profile?: any;
  company_name?: string | null;
}

export interface AuthResult {
  isAuth: boolean;
  session: any;
  currentUser: ExtendedUser | null;
  currentRole: string | null;
  profile: any;
  company_name: string | null;
}

export async function checkAuth(cookies: any): Promise<AuthResult> {
  // console.log("🔐 [AUTH] Starting authentication check...");

  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  // console.log("🔐 [AUTH] Token check:", {
  //   hasAccessToken: !!accessToken,
  //   hasRefreshToken: !!refreshToken,
  //   supabaseConfigured: !!supabase,
  //   accessTokenValue: accessToken?.value?.substring(0, 20) + "...",
  //   refreshTokenValue: refreshToken?.value?.substring(0, 20) + "...",
  // });

  let isAuth = false;
  let session = null;
  let currentUser: ExtendedUser | null = null;
  let currentRole = null;

  if (accessToken && refreshToken && supabase) {
    // console.log("🔐 [AUTH] Tokens found, attempting to set session...");

    try {
      session = await supabase.auth.setSession({
        refresh_token: refreshToken.value,
        access_token: accessToken.value,
      });

      // console.log("🔐 [AUTH] Session result:", {
      //   hasSession: !!session,
      //   hasError: !!session.error,
      //   errorMessage: session.error?.message || null,
      // });

      if (!session.error) {
        isAuth = true;
        currentUser = session.data.user as ExtendedUser;
        // console.log("🔐 [AUTH] User authenticated:", {
        //   userId: currentUser?.id,
        //   userEmail: currentUser?.email,
        //   hasUser: !!currentUser,
        // });

        // Get user profile and role
        if (currentUser && currentUser.id) {
          // console.log("🔐 [AUTH] Fetching currentUser profile for role...");

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          // console.log("🔐 [AUTH] Profile query result:", {
          //   hasProfile: !!profile,
          //   profileError: profileError?.message || null,
          //   role: profile?.role || null
          // });

          if (profile && !profileError) {
            currentRole = profile.role;
            // Enhance currentUser object with profile data
            currentUser.profile = profile;
            currentUser.company_name = profile.company_name;

            // console.log("🔐 [AUTH] currentUser role set:", role);
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
              currentRole = "Client"; // Default role
              currentUser.profile = {
                id: currentUser.id,
                role: "Client",
                company_name: null,
                name: currentUser.email?.split("@")[0] || "User",
              };
              currentUser.company_name = null;

              console.warn("🔐 [AUTH] Using default profile for user without profile record");
            }
          }
        }
      } else {
        // console.error("🔐 [AUTH] Session error, clearing invalid tokens:", session.error);
        // Clear invalid tokens
        clearAuthCookies(cookies);
      }
    } catch (error) {
      // console.error("🔐 [AUTH] Exception during authentication:", error);
      // Clear invalid tokens
      clearAuthCookies(cookies);
    }
  } else {
    // console.log("🔐 [AUTH] No tokens or Supabase not configured");
  }

  const result = {
    isAuth,
    session,
    currentUser: currentUser,
    currentRole,
    profile: currentUser?.profile || null,
    company_name: currentUser?.company_name || null,
  };
  // console.log("🔐 [AUTH] Authentication check complete:", {
  //   isAuth,
  //   hasUser: !!currentUser,
  //   currentRole,
  //   userId: currentUser?.id || null,
  // });

  return result;
}
