import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseAdmin) {
      console.error("❌ [CHECK-EMAIL] Supabase admin client not initialized");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if email exists in profiles table
    const { data: existingProfile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      console.error("❌ [CHECK-EMAIL] Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const isAvailable = !existingProfile;

    return new Response(
      JSON.stringify({
        success: true,
        available: isAvailable,
        email: email.toLowerCase(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [CHECK-EMAIL] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
