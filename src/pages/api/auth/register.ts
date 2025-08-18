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

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
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
