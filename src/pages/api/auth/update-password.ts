import type { APIRoute } from "astro";
import { getCurrentSession } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";

/**
 * Update the current user's password (recovery flow).
 * Requires session cookies to be set (user lands from reset link, client syncs session to cookies).
 *
 * POST Body (form or JSON):
 * - password: string
 * - passwordConfirm: string (must match password)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    let password: string;
    let passwordConfirm: string;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      password = body.password?.toString()?.trim() || "";
      passwordConfirm = body.passwordConfirm?.toString()?.trim() || "";
    } else {
      const formData = await request.formData();
      password = formData.get("password")?.toString()?.trim() || "";
      passwordConfirm = formData.get("passwordConfirm")?.toString()?.trim() || "";
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Password must be at least 6 characters",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password !== passwordConfirm) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Passwords do not match",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = await getCurrentSession(cookies);
    if (!session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired reset link. Please request a new password reset.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabase) {
      return new Response(JSON.stringify({ success: false, error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("❌ [AUTH-UPDATE-PASSWORD] Update failed:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ [AUTH-UPDATE-PASSWORD] Password updated for user:", session.user?.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated. You can now sign in with your new password.",
        redirect: "/auth/login",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ [AUTH-UPDATE-PASSWORD] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
