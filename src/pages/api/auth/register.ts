import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
  // Check if Supabase is configured
  if (!supabase) {
    return new Response("Supabase is not configured", { status: 500 });
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("first_name")?.toString();
  const lastName = formData.get("last_name")?.toString();
  const displayName = formData.get("display_name")?.toString();
  const phone = formData.get("phone")?.toString();

  if (!email || !password || !firstName || !lastName || !displayName) {
    return new Response("Email, password, first name, last name, and display name are required", {
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
        display_name: displayName,
        phone: phone || null,
      },
    },
  });

  if (error) {
    console.error("Registration error:", error);
    return new Response(error.message, { status: 500 });
  }

  console.log("User registration successful:", !!data.user);

  // Redirect to home with success message
  return redirect("/?message=registration_success");
};
