import type { AstroCookies } from "astro";

export function setAuthCookies(cookies: AstroCookies, accessToken: string, refreshToken: string) {
  // Determine if we're in development or production
  const isDev = !import.meta.env.PROD;

  console.log("🍪 [AUTH-COOKIES] Setting auth cookies:", {
    isDev,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length,
    refreshTokenLength: refreshToken?.length,
  });

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
