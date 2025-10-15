import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Auth LOGIN API
 *
 * POST Body:
 * - email: string
 * - password: string
 *
 * Example:
 * - POST /api/auth/login { "email": "user@example.com", "password": "password123" }
 */

export const POST: APIRoute = async ({ request }) => {
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
      console.error("❌ [AUTH-LOGIN] Authentication failed:", error.message);
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
