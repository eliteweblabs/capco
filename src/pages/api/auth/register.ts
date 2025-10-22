import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { setAuthCookies } from "../../../lib/auth-cookies";

/**
 * Standardized Auth REGISTER API
 *
 * POST Body:
 * - email: string
 * - password: string
 * - firstName: string
 * - lastName: string
 * - companyName?: string
 * - role?: string (default: "Client")
 *
 * Example:
 * - POST /api/auth/register { "email": "user@example.com", "password": "password123", "firstName": "John", "lastName": "Doe" }
 */

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const registerData: RegisterData = body;

    // Validate required fields
    if (!registerData.email?.trim() || !registerData.password?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "Email and password are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!registerData.firstName?.trim() || !registerData.lastName?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "First name and last name are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔐 [AUTH-REGISTER] Attempting registration for:`, registerData.email);

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: registerData.email.trim(),
      password: registerData.password.trim(),
    });

    if (authError) {
      console.error("❌ [AUTH-REGISTER] Registration failed:", authError.message);
      return new Response(
        JSON.stringify({
          error: "Registration failed",
          details: authError.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          error: "Registration failed",
          details: "No user returned from registration",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          firstName: registerData.firstName.trim(),
          lastName: registerData.lastName.trim(),
          companyName: registerData.companyName?.trim() || "",
          email: registerData.email.trim(),
          role: registerData.role || "Client",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error("❌ [AUTH-REGISTER] Profile creation failed:", profileError.message);
      // Note: User account was created but profile failed - this needs manual cleanup
      return new Response(
        JSON.stringify({
          error: "Profile creation failed",
          details: "User account created but profile setup failed. Please contact support.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [AUTH-REGISTER] User registered successfully:`, authData.user.id);

    // Set auth cookies if session exists
    if (authData.session) {
      setAuthCookies(cookies, authData.session.access_token, authData.session.refresh_token);
      console.log("🔐 [AUTH-REGISTER] Auth cookies set successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          companyName: profileData.companyName,
          role: profileData.role,
        },
        session: authData.session,
        redirect: "/project/dashboard",
        message: "Registration successful",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [AUTH-REGISTER] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
