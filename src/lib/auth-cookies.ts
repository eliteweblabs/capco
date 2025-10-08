import type { AstroCookies } from "astro";

export function setAuthCookies(cookies: AstroCookies, accessToken: string, refreshToken: string) {
  // Determine if we're in development or production
  const isDev = !import.meta.env.PROD;

  // Set access token cookie
  cookies.set("sb-access-token", accessToken, {
    path: "/",
    secure: !isDev, // Only secure in production
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Set refresh token cookie
  cookies.set("sb-refresh-token", refreshToken, {
    path: "/",
    secure: !isDev, // Only secure in production
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // console.log("🍪 [AUTH-COOKIES] Auth cookies set successfully");
}

export function clearAuthCookies(cookies: AstroCookies) {
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });
}

export async function getCurrentSession(cookies: AstroCookies) {
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;
  
  if (!accessToken || !refreshToken) {
    return null;
  }
  
  try {
    // Import supabase dynamically to avoid circular dependencies
    const { supabase } = await import("./supabase");
    
    if (!supabase) {
      return null;
    }
    
    // Set the session in the supabase client
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    if (error || !data.session) {
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error("❌ [AUTH-COOKIES] Error getting current session:", error);
    return null;
  }
}
