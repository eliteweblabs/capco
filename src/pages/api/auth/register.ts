import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  console.log("🔐 [REGISTER] Registration API called - delegating to create-user");

  try {
    // Forward the request to the create-user API
    const formData = await request.formData();
    const createUserResponse = await fetch(`${new URL(request.url).origin}/api/create-user`, {
      method: "POST",
      body: formData, // Forward the original form data
    });

    const result = await createUserResponse.json();

    if (createUserResponse.ok) {
      // Registration successful - return JSON response for client-side handling
      return new Response(
        JSON.stringify({
          success: true,
          message: "Registration successful",
          redirect: "/project/dashboard?success=registration_success",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Handle specific error cases
      let errorMessage = result.error || "registration_failed";

      // Check for duplicate email error
      if (result.error && result.error.includes("already been registered")) {
        errorMessage =
          "A user with this email address has already been registered. Please try logging in instead.";
      } else if (result.error && result.error.includes("User already registered")) {
        errorMessage = "This email is already registered. Please try logging in instead.";
      } else if (result.error && result.error.includes("duplicate key")) {
        errorMessage = "This email is already registered. Please try logging in instead.";
      }

      // Return JSON response for client-side handling
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          errorType: "duplicate_email",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("🔐 [REGISTER] Error delegating to create-user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Network error. Please try again.",
        errorType: "network_error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
