import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Auth LOGIN API
 *
 * JSON API for programmatic login (no redirects)
 * For form-based login with redirects, use /api/auth/signin
 *
 * POST Body:
 * - email: string
 * - password: string
 *
 * Example:
 * - POST /api/auth/login { "email": "user@example.com", "password": "password123" }
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email?.trim() || !password?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "Email and password are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔐 [AUTH-LOGIN] Attempting login for:`, email);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      // Log failed login attempt
      try {
        await SimpleProjectLogger.addLogEntry(
          0, // System log
          "error",
          `Password login failed: ${error.message} | ${email || "unknown"}`,
          { error: error.message, email: email || "unknown" }
        );
      } catch (logError) {
        console.error("Error logging failed login:", logError);
      }

      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          details: error.message,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.user || !data.session) {
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          details: "No user or session returned",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log successful login
    try {
      await SimpleProjectLogger.addLogEntry(
        0, // System log
        "userLogin",
        `User logged in via password ${data.user.email || email}`,
        {
          userId: data.user.id,
          userAgent: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for") || "unknown",
          email: data.user.email || email,
        }
      );
    } catch (logError) {
      console.error("Error logging successful login:", logError);
    }

    // Set auth cookies
    const { access_token, refresh_token } = data.session;
    setAuthCookies(cookies, access_token, refresh_token);

    // Auto-authenticate to Campfire for Staff and Admin users
    let campfireAuthSuccess = false;
    try {
      const { shouldAutoAuthCampfire, authenticateCampfire } = await import("../../../lib/campfire-auth");
      
      // Get user profile to check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const userRole = profile?.role || data.user.user_metadata?.role || "Client";
      
      if (shouldAutoAuthCampfire(userRole)) {
        console.log(`🔐 [AUTH-LOGIN] User is ${userRole}, attempting Campfire auto-authentication...`);
        
        // Try to authenticate to Campfire using the same password
        const campfireResult = await authenticateCampfire(email, password);
        
        if (campfireResult.success && campfireResult.cookies) {
          // Set Campfire session cookies
          campfireResult.cookies.forEach((cookieString) => {
            const [nameValue] = cookieString.split(";");
            const [name, value] = nameValue.split("=");
            
            if (name && value) {
              cookies.set(name.trim(), value.trim(), {
                path: "/",
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 7 days
              });
            }
          });
          
          campfireAuthSuccess = true;
          console.log(`✅ [AUTH-LOGIN] Campfire auto-authentication successful for ${userRole} user`);
        } else {
          console.warn(`⚠️ [AUTH-LOGIN] Campfire auto-authentication failed: ${campfireResult.error || "Unknown error"}`);
        }
      }
    } catch (campfireError) {
      console.error(`❌ [AUTH-LOGIN] Error during Campfire auto-authentication:`, campfireError);
      // Don't fail the main login if Campfire auth fails
    }

    console.log(`✅ [AUTH-LOGIN] User authenticated successfully:`, data.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
        campfireAuth: campfireAuthSuccess,
        message: "Login successful",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [AUTH-LOGIN] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
