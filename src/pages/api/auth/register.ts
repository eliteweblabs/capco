import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  console.log("🔐 [REGISTER] Registration API called - delegating to create-user");

  try {
    // Get the form data
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    
    // Log registration attempt
    console.log(`🔐 [REGISTER] Attempting registration for email: ${email ? email.replace(/@.*$/, '@***') : 'unknown'}`);

    // Forward the request to the create-user API
    const apiUrl = new URL('/api/create-user', request.url).href;
    console.log("🔐 [REGISTER] Forwarding to create-user API:", apiUrl);
    
    const createUserResponse = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      headers: {
        // Forward original headers
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Log the response status
    console.log(`🔐 [REGISTER] Create user response status: ${createUserResponse.status}`);

    let result;
    try {
      result = await createUserResponse.json();
      console.log("🔐 [REGISTER] Create user response parsed successfully");
    } catch (parseError) {
      console.error("🔐 [REGISTER] Failed to parse create-user response:", parseError);
      throw new Error("Invalid response from create-user endpoint");
    }

    if (createUserResponse.ok && result.success) {
      // Log successful user creation
      console.log("🔐 [REGISTER] User created successfully, attempting sign in");

      // Log the successful registration
      await SimpleProjectLogger.addLogEntry(
        0,
        "userRegistration",
        "User registration successful",
        { email: email?.replace(/@.*$/, '@***') }
      );

      // Sign in the user after successful registration
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.get("email")?.toString() || "",
        password: formData.get("password")?.toString() || "",
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
        sessionId: signInData?.session?.id,
        accessToken: signInData?.session?.access_token ? "present" : "missing",
        refreshToken: signInData?.session?.refresh_token ? "present" : "missing"
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
    } else {
      // Handle specific error cases
      let errorMessage = result.error || "Registration failed";
      let errorType = "registration_error";

      // Check for duplicate email error
      if (
        result.error &&
        (result.error.includes("already been registered") ||
         result.error.includes("User already registered") ||
         result.error.includes("duplicate key"))
      ) {
        errorMessage = "This email is already registered. Please try logging in instead.";
        errorType = "duplicate_email";
      }

      // Log the error
      console.error(`🔐 [REGISTER] Registration failed: ${errorMessage}`);
      await SimpleProjectLogger.addLogEntry(
        0,
        "userRegistrationError",
        "User registration failed",
        { 
          error: errorMessage,
          email: email?.replace(/@.*$/, '@***')
        }
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          errorType: errorType,
        }),
        {
          status: errorType === "duplicate_email" ? 409 : 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // Log the error
    console.error("🔐 [REGISTER] Critical error during registration:", error);
    await SimpleProjectLogger.addLogEntry(
      0,
      "userRegistrationError",
      "Critical registration error",
      { error: error instanceof Error ? error.message : "Unknown error" }
    );

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
