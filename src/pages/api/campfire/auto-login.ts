/**
 * Campfire Auto-Login API
 * Server-side endpoint that authenticates user to Campfire and returns login URL
 * This is called client-side after successful login for Staff/Admin users
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { authenticateCampfire, shouldAutoAuthCampfire } from "../../../lib/campfire-auth";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if user is authenticated
    const authResult = await checkAuth(cookies);
    
    if (!authResult.isAuth || !authResult.currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not authenticated",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authResult.currentUser.id)
      .single();

    const userRole = profile?.role || authResult.currentUser.user_metadata?.role || "Client";

    // Only allow Staff and Admin to auto-login
    if (!shouldAutoAuthCampfire(userRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Auto-login only available for Staff and Admin",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get email and password from request body
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email and password required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify email matches logged-in user
    if (email !== authResult.currentUser.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email does not match logged-in user",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authenticate to Campfire
    const campfireResult = await authenticateCampfire(email, password);

    if (campfireResult.success) {
      return new Response(
        JSON.stringify({
          success: true,
          loginUrl: campfireResult.loginUrl || `${process.env.PUBLIC_CAMPFIRE_URL || "https://campfire-production-8c1a.up.railway.app"}/`,
          cookies: campfireResult.cookies || [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: campfireResult.error || "Campfire authentication failed",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("❌ [CAMPFIRE-AUTO-LOGIN] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

