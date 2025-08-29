import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user exists in the system
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error checking user existence:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to check user existence" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if email exists in the user list
    const userExists = user.users.some(user => user.email === email);
    
    if (!userExists) {
      // For security reasons, don't reveal if the email exists or not
      // Just return success to prevent email enumeration attacks
      return new Response(
        JSON.stringify({ 
          message: "If an account with that email exists, you will receive a password reset link shortly." 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send password reset email using Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.SITE_URL || 'http://localhost:4321'}/reset-password`,
    });

    if (resetError) {
      console.error("Error sending password reset email:", resetError);
      return new Response(
        JSON.stringify({ error: "Failed to send password reset email" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "If an account with that email exists, you will receive a password reset link shortly." 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Forgot password error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
