import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, redirect }) => {
  console.log("🔐 [REGISTER] Registration API called");

  // Check if Supabase is configured
  if (!supabase || !supabaseAdmin) {
    console.error("🔐 [REGISTER] Supabase not configured");
    return new Response("Supabase is not configured", { status: 500 });
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("first_name")?.toString();
  const lastName = formData.get("last_name")?.toString();
  const companyName = formData.get("company_name")?.toString();
  const phone = formData.get("phone")?.toString();

  console.log("🔐 [REGISTER] Form data:", {
    email,
    firstName,
    lastName,
    companyName,
    hasPassword: !!password,
  });

  if (!email || !password || !firstName || !lastName || !companyName) {
    return new Response("Email, password, first name, last name, and company name are required", {
      status: 400,
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response("Invalid email format", { status: 400 });
  }

  // Validate password strength
  if (password.length < 6) {
    return new Response("Password must be at least 6 characters long", {
      status: 400,
    });
  }

  console.log("🔐 [REGISTER] Attempting Supabase auth.signUp for:", email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: import.meta.env.DEV
        ? "http://localhost:4321/api/auth/verify"
        : "https://de.capcofire.com/api/auth/verify",
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        company_name: companyName,
        phone: phone || null,
      },
    },
  });

  console.log("🔐 [REGISTER] Supabase signUp result:", {
    success: !!data.user,
    userId: data.user?.id,
    needsConfirmation: !data.user?.email_confirmed_at,
    error: error?.message,
  });

  if (error) {
    console.error("Registration error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
    });

    // Check if it's a duplicate email error
    const isDuplicateEmail =
      error.message?.includes("already registered") ||
      error.message?.includes("already exists") ||
      error.message?.includes("already been registered");

    return new Response(
      JSON.stringify({
        success: false,
        error: isDuplicateEmail
          ? "A user with this email address has already been registered"
          : "Failed to create user account. Please try again.",
        details: error.message,
      }),
      {
        status: isDuplicateEmail ? 409 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Create profile in the profiles table if user was created successfully
  if (data.user) {
    console.log("Attempting to create profile for user:", data.user.id);

    // Use admin client to bypass RLS policies during registration
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: data.user.id,
      company_name: companyName,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role: "Client",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      console.error("Profile error details:", {
        message: profileError.message,
        code: profileError.code,
        hint: profileError.hint,
        details: profileError.details,
      });
      // Don't fail the registration if profile creation fails
      // The user can still log in and we can create the profile later
    } else {
      console.log("Profile created successfully for user:", data.user.id);
    }
  }

  console.log("User registration successful:", !!data.user);

  // Sign in the user immediately after registration
  if (data.user) {
    console.log("🔐 [REGISTER] Signing in user after registration:", data.user.email);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("🔐 [REGISTER] Sign-in error after registration:", signInError);
      // Don't fail the registration, but log the error
    } else {
      console.log("🔐 [REGISTER] User signed in successfully after registration");
    }
  }

  // Return success response
  return new Response(
    JSON.stringify({
      success: true,
      message: "User registration successful",
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            needsConfirmation: !data.user.email_confirmed_at,
          }
        : null,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
