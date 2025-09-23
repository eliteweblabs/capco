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
}

export async function checkAuth(cookies: any): Promise<AuthResult> {
  // console.log("🔐 [AUTH] Starting authentication check...");

  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  let isAuth = false;
  let session = null;
  let currentUser: ExtendedUser | null = null;

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
            // Enhance currentUser object with profile data
            currentUser.profile = profile;

            // console.log("🔐 [AUTH] Profile successfully attached:", {
            //   userId: currentUser.id,
            //   role: profile.role,
            //   profileKeys: Object.keys(profile),
            //   fullProfile: profile,
            // });
          } else {
            console.warn("🔐 [AUTH] Failed to get currentUser profile:", {
              userId: currentUser.id,
              userEmail: currentUser.email,
              profileError: profileError,
              errorCode: profileError?.code,
              errorMessage: profileError?.message,
            });

            console.log("🔐 [AUTH] currentUser object after failed profile query:", {
              hasCurrentUser: !!currentUser,
              currentUserKeys: Object.keys(currentUser),
              hasProfile: !!currentUser.profile,
              profileValue: currentUser.profile,
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
                company_name: currentUser.email?.split("@")[0] || "Add Company Name",
              };

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
    accessToken: accessToken,
    refreshToken: refreshToken,
    supabase: supabase,
  };

  return result;
}
