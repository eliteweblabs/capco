import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseAdmin) {
      console.error("Supabase admin client not available");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send password reset email using Supabase Auth
    // This will only send an email if the user exists, and will fail silently if they don't
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.SITE_URL || 'http://localhost:4321'}/reset-password`,
    });

    // Always return success to prevent email enumeration attacks
    // Supabase will only send an email if the user exists, but won't reveal this information
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
