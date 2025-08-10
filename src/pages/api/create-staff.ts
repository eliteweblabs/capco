import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { checkAuth } from "../../lib/auth";
import { emailService } from "../../lib/email-service";

export const GET: APIRoute = async ({ cookies }) => {
  console.log("=== CREATE STAFF GET TEST ===");
  try {
    const { isAuth, role } = await checkAuth(cookies);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Create staff endpoint is accessible",
        auth: { isAuth, role },
        supabaseConfigured: !!supabase,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("GET test error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "GET test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("=== CREATE STAFF API CALLED ===");
  try {
    console.log("1. Starting create-staff endpoint");

    // Check if Supabase is configured
    console.log("2. Checking Supabase configuration:", !!supabase);
    if (!supabase) {
      console.log("ERROR: Supabase not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase is not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Ensure admin client is configured for user creation
    console.log("2b. Checking Supabase admin configuration:", !!supabaseAdmin);
    if (!supabaseAdmin) {
      console.log("ERROR: Supabase admin client not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Supabase admin client is not configured. Ensure SUPABASE_SERVICE_ROLE_KEY is set.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("3. Checking authentication...");
    // Check authentication and ensure user is Admin
    const { isAuth, role } = await checkAuth(cookies);
    console.log("4. Auth result:", { isAuth, role });

    if (!isAuth || role !== "Admin") {
      console.log("5. AUTH FAILED - User not authorized:", { isAuth, role });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized. Admin access required.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("5. Auth successful, parsing request body...");
    const body = await request.json();
    console.log("6. Request body:", body);
    const { name, email, phone, role: staffRole } = body;
    console.log("7. Extracted data:", { name, email, phone, staffRole });

    // Validate required fields
    console.log("8. Validating required fields...");
    if (!name?.trim() || !email?.trim() || !staffRole?.trim()) {
      console.log("ERROR: Missing required fields:", {
        name: !!name?.trim(),
        email: !!email?.trim(),
        role: !!staffRole?.trim(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Name, email, and role are required.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate role
    if (!["Admin", "Staff", "Client"].includes(staffRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid role. Must be 'Admin', 'Staff', or 'Client'.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create user in Supabase Auth without password (magic link only)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        email_confirm: false, // Don't auto-confirm, let magic link handle it
        user_metadata: {
          full_name: name.trim(),
          role: staffRole,
          created_by_admin: true,
          phone: phone?.trim() || null,
        },
      });

    if (authError) {
      console.error("Supabase auth error:", authError);

      // Handle specific error cases
      if (authError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "A user with this email already exists.",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create user account. Please try again.",
          details: authError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create profile in profiles table (use admin client to bypass RLS)
    const profileData = {
      id: authData.user.id,
      name: name.trim(),
      phone: phone?.trim() ? parseInt(phone.trim()) : null,
      role: staffRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([profileData]);

    if (profileError) {
      console.error("Profile creation error:", profileError);

      // Try to delete the auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error("Failed to cleanup auth user:", deleteError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create user profile. Please try again.",
          details: profileError.message,
          code: profileError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Send magic link invitation email
    let emailResult: { success: boolean; messageId?: string; error?: string } =
      {
        success: false,
      };
    try {
      const siteUrl = process.env.SITE_URL || "http://localhost:4321";
      const signinUrl = `${siteUrl}/signin`;
      const html = `
        <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
          <h1 style="margin: 0 0 16px; color: #111827;">Welcome to CAPCo Fire Protection</h1>
          <p style="margin: 0 0 12px; color: #374151;">Hi ${name},</p>
          <p style="margin: 0 0 12px; color: #374151;">An administrator has created a ${staffRole} account for you in the CAPCo Fire Protection system.</p>
          <p style="margin: 0 0 12px; color: #374151;">To access your account, click the button below to receive a secure magic link:</p>
          <p style="margin: 16px 0;">
            <a href="${signinUrl}" style="display:inline-block; background:#2563EB; color:#fff; text-decoration:none; padding:10px 16px; border-radius:6px; font-weight:600;">Sign in with Magic Link</a>
          </p>
          <p style="margin: 12px 0 0; color: #6B7280; font-size: 14px;">This link will be sent to your email address and will allow you to access the system securely without a password.</p>
          <p style="margin: 12px 0 0; color: #6B7280; font-size: 14px;">If you did not expect this invitation, please contact support.</p>
        </div>
      `;
      emailResult = await emailService.sendEmail({
        to: email,
        subject: "Welcome to CAPCo Fire Protection - Magic Link Access",
        html,
        text: `Hi ${name},\nAn administrator has created a ${staffRole} account for you.\nTo access your account, visit: ${signinUrl}\nYou'll receive a magic link to sign in securely.\nIf you did not expect this invitation, please contact support.`,
      });
      if (!emailResult.success) {
        console.error("Failed to send staff invitation email:", emailResult.error);
      }
    } catch (emailErr) {
      console.error("Error sending invitation email:", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully. Magic link invitation sent.",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name.trim(),
          role: staffRole,
        },
        emailSent: emailResult.success,
        messageId: emailResult.messageId,
        note: "User will receive a magic link to sign in. No password required.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Create staff error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
