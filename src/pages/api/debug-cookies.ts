import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies }) => {
  // Get all cookies
  const allCookies: Record<string, string> = {};

  // Common cookie names to check
  const cookieNames = [
    "google_access_token",
    "google_user_data",
    "google_refresh_token",
    "sb-access-token",
    "sb-refresh-token",
    "supabase-auth-token",
    "auth-token",
    "access_token",
    "refresh_token",
  ];

  // Check for each cookie
  cookieNames.forEach((name) => {
    const cookie = cookies.get(name);
    if (cookie) {
      allCookies[name] = cookie.value.substring(0, 50) + (cookie.value.length > 50 ? "..." : "");
    }
  });

  // Get all available cookies (this might not work in all environments)
  const availableCookies = Object.keys(allCookies);

  return new Response(
    JSON.stringify(
      {
        message: "Cookie Debug Information",
        availableCookies: availableCookies,
        cookieValues: allCookies,
        totalCookiesFound: availableCookies.length,
        instructions: {
          step1: "Check if you have 'google_access_token' cookie",
          step2: "If not, you need to sign in through the standalone Google OAuth flow",
          step3: "Visit /api/google/signin to start the Google OAuth process",
          step4: "This will set the required cookies for the contacts API",
        },
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
