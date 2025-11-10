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
 * - phone?: string
 * - smsAlerts?: boolean (string "true"/"false" from FormData)
 * - mobileCarrier?: string
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
  phone?: string;
  smsAlerts?: boolean;
  mobileCarrier?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Handle both FormData and JSON requests
    let registerData: RegisterData;

    const contentType = request.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const body = await request.json();
      registerData = body;
    } else {
      // Handle FormData (from forms)
      const formData = await request.formData();
      const smsAlertsValue = formData.get("smsAlerts");
      const smsAlerts =
        smsAlertsValue === "on" || smsAlertsValue === "true" || smsAlertsValue === "true"
          ? true
          : false;

      registerData = {
        email: formData.get("email")?.toString() || "",
        password: formData.get("password")?.toString() || "",
        firstName: formData.get("firstName")?.toString() || "",
        lastName: formData.get("lastName")?.toString() || "",
        companyName: formData.get("companyName")?.toString() || "",
        role: formData.get("role")?.toString() || "Client",
        phone: formData.get("phone")?.toString() || undefined,
        smsAlerts: smsAlerts || undefined,
        mobileCarrier: smsAlerts
          ? formData.get("mobileCarrier")?.toString() || undefined
          : undefined,
      };
    }

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

    // If no session was created, try to sign in the user immediately
    let session = authData.session;
    if (!session) {
      console.log("🔐 [AUTH-REGISTER] No session created, attempting immediate sign-in...");
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: registerData.email.trim(),
        password: registerData.password.trim(),
      });

      if (signInError) {
        console.error("❌ [AUTH-REGISTER] Immediate sign-in failed:", signInError.message);
      } else {
        session = signInData.session;
        console.log("✅ [AUTH-REGISTER] Immediate sign-in successful");
      }
    }

    // Prepare profile data with phone and SMS settings
    const profilePayload: any = {
      id: authData.user.id,
      firstName: registerData.firstName.trim(),
      lastName: registerData.lastName.trim(),
      companyName: registerData.companyName?.trim() || "",
      email: registerData.email.trim(),
      role: registerData.role || "Client",
      phone: registerData.phone?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Handle SMS alerts and mobile carrier
    if (registerData.smsAlerts && registerData.mobileCarrier) {
      const { SMS_UTILS } = await import("../../../lib/sms-utils");
      const carrierInfo = SMS_UTILS.getCarrierInfo(registerData.mobileCarrier);
      if (carrierInfo) {
        profilePayload.mobileCarrier = `@${carrierInfo.gateway}`;
      } else if (registerData.mobileCarrier.startsWith("@")) {
        // Already a gateway domain
        profilePayload.mobileCarrier = registerData.mobileCarrier;
      } else {
        profilePayload.mobileCarrier = null;
      }
    } else {
      profilePayload.mobileCarrier = null;
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([profilePayload])
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
    if (session) {
      setAuthCookies(cookies, session.access_token, session.refresh_token);
      console.log("🔐 [AUTH-REGISTER] Auth cookies set successfully");
    } else {
      console.log("⚠️ [AUTH-REGISTER] No session available - user will need to sign in manually");
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
        session: session,
        redirect: "/project/new",
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
