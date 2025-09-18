import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Check if Supabase is configured
  if (!supabase) {
    return new Response("Supabase is not configured", { status: 500 });
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const provider = formData.get("provider")?.toString();

  if (provider) {
    // Use the current request URL to determine the base URL
    const currentUrl = new URL(request.url);
    const redirectUrl = `${currentUrl.origin}/api/auth/callback`;
    console.log("🔐 [AUTH] OAuth redirect URL:", redirectUrl);
    console.log("🔐 [AUTH] Current request origin:", currentUrl.origin);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      // Log failed OAuth login attempt
      try {
        await SimpleProjectLogger.logFailedLogin(
          email || "unknown",
          `OAuth ${provider} failed: ${error.message}`,
          { provider, error: error.message }
        );
      } catch (logError) {
        console.error("Error logging failed OAuth login:", logError);
      }

      return new Response(error.message, { status: 500 });
    }

    // Log OAuth login initiation (we'll log success in the callback)
    try {
      await SimpleProjectLogger.logUserLogin(email || "oauth_user", `oauth_${provider}`, {
        provider,
        initiated: true,
      });
    } catch (logError) {
      console.error("Error logging OAuth login initiation:", logError);
    }

    return redirect(data.url);
  }

  if (!email || !password) {
    return redirect("/login?error=invalid_credentials");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Log failed login attempt
    try {
      await SimpleProjectLogger.logFailedLogin(email, `Password login failed: ${error.message}`, {
        error: error.message,
      });
    } catch (logError) {
      console.error("Error logging failed login:", logError);
    }

    // Redirect to login page with error parameter
    return redirect("/login?error=invalid_credentials");
  }

  // Profile will be automatically created by database trigger

  // Log successful login
  try {
    await SimpleProjectLogger.logUserLogin(data.user.email || email, "password", {
      userId: data.user.id,
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });
  } catch (logError) {
    console.error("Error logging successful login:", logError);
  }

  const { access_token, refresh_token } = data.session;

  // Use shared utility for consistent cookie handling
  setAuthCookies(cookies, access_token, refresh_token);

  return redirect("/dashboard");
};
