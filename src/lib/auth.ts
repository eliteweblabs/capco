import type { User } from "@supabase/supabase-js";
import { clearAuthCookies } from "./auth-cookies";
import { supabase } from "./supabase";

export interface ExtendedUser extends User {
  profile?: any;
  company_name?: string | null;
  display_name?: string | null;
}

export interface AuthResult {
  isAuth: boolean;
  session: any;
  user: ExtendedUser | null;
  role: string | null;
  profile: any;
  company_name: string | null;
  display_name: string | null;
}

export async function checkAuth(cookies: any): Promise<AuthResult> {
  // console.log("🔐 [AUTH] Starting authentication check...");

  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  // console.log("🔐 [AUTH] Token check:", {
  //   hasAccessToken: !!accessToken,
  //   hasRefreshToken: !!refreshToken,
  //   supabaseConfigured: !!supabase,
  // });

  let isAuth = false;
  let session = null;
  let user: ExtendedUser | null = null;
  let role = null;

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
        user = session.data.user as ExtendedUser;
        // console.log("🔐 [AUTH] User authenticated:", {
        //   userId: user?.id,
        //   userEmail: user?.email,
        //   hasUser: !!user,
        // });

        // Get user profile and role
        if (user && user.id) {
          // console.log("🔐 [AUTH] Fetching user profile for role...");

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          // console.log("🔐 [AUTH] Profile query result:", {
          //   hasProfile: !!profile,
          //   profileError: profileError?.message || null,
          //   role: profile?.role || null
          // });

          if (profile && !profileError) {
            role = profile.role;
            // Enhance user object with profile data
            user.profile = profile;
            user.company_name = profile.company_name;
            user.display_name =
              profile.company_name ||
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Unknown User";
            // console.log("🔐 [AUTH] User role set:", role);
          } else {
            console.warn("🔐 [AUTH] Failed to get user profile:", profileError);
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
    user,
    role,
    profile: user?.profile || null,
    company_name: user?.company_name || null,
    display_name: user?.display_name || null,
  };
  // console.log("🔐 [AUTH] Authentication check complete:", {
  //   isAuth,
  //   hasUser: !!user,
  //   role,
  //   userId: user?.id || null,
  // });

  return result;
}
