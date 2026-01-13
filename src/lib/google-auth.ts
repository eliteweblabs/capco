import type { AstroCookies } from "astro";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: GoogleUser;
  accessToken?: string;
}

export function checkGoogleAuth(cookies: AstroCookies): AuthResult {
  const accessToken = cookies.get("google_access_token")?.value;
  const userDataCookie = cookies.get("google_user_data")?.value;

  if (!accessToken || !userDataCookie) {
    return { isAuthenticated: false };
  }

  try {
    const userData: GoogleUser = JSON.parse(userDataCookie);
    return {
      isAuthenticated: true,
      user: userData,
      accessToken: accessToken,
    };
  } catch (error) {
    console.error("Error parsing user data from cookie:", error);
    return { isAuthenticated: false };
  }
}

export function clearGoogleAuth(cookies: AstroCookies): void {
  cookies.delete("google_access_token");
  cookies.delete("google_refresh_token");
  cookies.delete("google_user_data");
}
