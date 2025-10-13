import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  console.log("🔐 [REGISTER] Registration API called - delegating to create-user");

  try {
    // Get the form data
    const formData = await request.formData();

    // Instead of forwarding to create-user API, handle registration directly here
    console.log("🔐 [REGISTER] Handling registration directly");

    // Extract form data
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const companyName = formData.get("companyName")?.toString();
    const phone = formData.get("phone")?.toString();
    const smsAlerts = formData.get("smsAlerts") === "on" || formData.get("smsAlerts") === "true";
    const mobileCarrier = formData.get("mobileCarrier")?.toString();
    const role = formData.get("role")?.toString() || "Client";

    // Log registration attempt
    console.log(
      `🔐 [REGISTER] Attempting registration for email: ${email ? email.replace(/@.*$/, "@***") : "unknown"}`
    );

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, password, first name, last name, and company name are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create user in Supabase Auth
    if (!supabase) {
      return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: {
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyName: companyName?.trim() || null,
          phone: phone?.trim() || null,
          mobileCarrier: smsAlerts ? mobileCarrier : null,
          smsAlerts: smsAlerts,
          role: role,
        },
      },
    });

    if (authError) {
      console.error("🔐 [REGISTER] Auth signup error:", authError);

      let errorMessage = authError.message || "Failed to create user account";
      let statusCode = 500;

      // Check for duplicate email errors
      if (
        authError.message &&
        (authError.message.includes("User already registered") ||
          authError.message.includes("already been registered") ||
          authError.message.includes("duplicate key") ||
          authError.message.includes("already exists"))
      ) {
        errorMessage =
          "A user with this email address has already been registered. Please try logging in instead.";
        statusCode = 409;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      console.error("🔐 [REGISTER] No user data returned from auth signup");
      return new Response(
        JSON.stringify({
          success: false,
          error: "User creation failed - no user data returned",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create profile in database
    const profileData = {
      id: authData.user.id,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName?.trim() || null,
      phone: phone?.trim() || null,
      smsAlerts: smsAlerts,
      mobileCarrier: smsAlerts ? mobileCarrier : null,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error: profileError } = await supabase!.from("profiles").upsert(profileData, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (profileError) {
      console.error("🔐 [REGISTER] Profile creation error:", profileError);
      // Don't fail the entire request if profile creation fails
    }

    const result = {
      success: true,
      message: "User created successfully",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        firstName: firstName,
        lastName: lastName,
        companyName: companyName,
      },
    };

    // Log the successful registration
    await SimpleProjectLogger.addLogEntry(0, "userRegistration", "User registration successful", {
      email: email?.replace(/@.*$/, "@***"),
    });

    // Sign in the user after successful registration
    const { data: signInData, error: signInError } = await supabase!.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (signInError) {
      console.error("🔐 [REGISTER] Failed to sign in after registration:", signInError);
      // Return success but indicate auth needs to be completed
      return new Response(
        JSON.stringify({
          success: true,
          message: "Account created but sign-in required",
          redirect: "/login?message=registration_complete",
          user: result.user,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Set the session cookie using the signInData
    console.log("🔐 [REGISTER] Sign in successful, session data:", {
      hasSession: !!signInData?.session,
      sessionId: signInData?.session?.user?.id,
      accessToken: signInData?.session?.access_token ? "present" : "missing",
      refreshToken: signInData?.session?.refresh_token ? "present" : "missing",
    });

    if (signInData?.session) {
      const session = signInData.session;
      cookies.set("sb-access-token", session.access_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      cookies.set("sb-refresh-token", session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }

    // Registration and sign-in successful
    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration and sign-in successful",
        redirect: "/project/dashboard?success=registration_success",
        user: result.user,
        session: signInData?.session,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log the error
    console.error("🔐 [REGISTER] Critical error during registration:", error);
    await SimpleProjectLogger.addLogEntry(0, "userRegistration", "Critical registration error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred. Please try again.",
        errorType: "critical_error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
