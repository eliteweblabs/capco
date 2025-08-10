import { supabase } from "./supabase";
import { clearAuthCookies } from "./auth-cookies";

export interface AuthResult {
  isAuth: boolean;
  session: any;
  user: any;
  role: string | null;
  magicLink?: boolean;
}

export async function checkAuth(cookies: any, url?: URL): Promise<AuthResult> {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  let isAuth = false;
  let session = null;
  let user = null;
  let role = null;
  let magicLink = false;

  // Check for magic link token in URL
  if (url) {
    const token = url.searchParams.get("token");
    magicLink = token === "magic";
  }

  if (accessToken && refreshToken && supabase) {
    try {
      session = await supabase.auth.setSession({
        refresh_token: refreshToken.value,
        access_token: accessToken.value,
      });

      if (!session.error) {
        isAuth = true;
        user = session.data.user;

        // Get user profile and role
        if (user && user.id) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile && !profileError) {
            role = profile.role;
          }
        }
      } else {
        // Clear invalid tokens
        clearAuthCookies(cookies);
      }
    } catch (error) {
      // Clear invalid tokens
      clearAuthCookies(cookies);
    }
  }

  return { isAuth, session, user, role, magicLink };
}
