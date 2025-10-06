import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";

// Simple email validation
// Import validateEmail from ux-utils (server-side API routes need explicit import)
import { validateEmail } from "../../lib/ux-utils";

// Generate a secure temporary password
function generateTempPassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  // Ensure at least one character from each type
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Add 8 more random characters
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser } = await checkAuth(cookies);
    if (!currentUser || currentUser.profile?.role !== "Admin") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized. Admin access required.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, companyName, phone, role, smsAlerts } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !role?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "First name, last name, email, and role are required.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: emailError,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate role
    if (!["Admin", "Staff", "Client"].includes(role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid role. Must be 'Admin', 'Staff', or 'Client'.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      emailConfirm: false, // Auto-confirm email
      user_metadata: {
        full_name: companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName?.trim() || null,
        phone: phone?.trim() || null,
        smsAlerts: smsAlerts || false,
        role: role,
        email: email.trim().toLowerCase(),
        created_by_admin: true,
        must_change_password: true,
      },
    });

    if (authError) {
      console.error("Supabase auth error:", authError);

      if (authError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "A user with this email already exists.",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
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
        }
      );
    }

    // Wait for trigger to complete, then upsert the profile
    await new Promise((resolve) => setTimeout(resolve, 100));

    const profileData = {
      id: authData.user.id,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName?.trim() || null,
      phone: phone?.trim() || null,
      smsAlerts: smsAlerts || false,
      role: role,
      updatedAt: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profileData, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

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
          error: "Failed to update user profile. Please try again.",
          details: profileError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send magic link email using our simple email system
    const baseUrl = getApiBaseUrl(request);
    const displayName = companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`;

    console.log("🔗 [CREATE-USER-SIMPLE] Base URLLLL:", baseUrl);

    // Send magic link email directly using Supabase
    console.log("🔗 [CREATE-USER-SIMPLE] Sending magic link email via Supabase...");
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${baseUrl}/api/auth/callback`,
      },
    });

    if (magicLinkError) {
      console.error("Magic link generation error:", magicLinkError);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "User created but failed to generate magic link. Please contact the user directly.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔗 [CREATE-USER-SIMPLE] Magic link email sent successfully via Supabase");
    console.log("🔗 [CREATE-USER-SIMPLE] Base URL used:", baseUrl);

    const emailContent = `Welcome to ${process.env.GLOBAL_companyName || "CAPCo"}!

Your account has been created successfully.

Account Details:
- Name: ${displayName}
- Email: ${email}
- Role: ${role}
- Company: ${companyName || "Not provided"}
- Phone: ${phone || "Not provided"}

To access your account, click the magic link below:
${magicLinkUrl}

This link will log you in automatically. If you have any questions, please contact us.

Best regards,
The ${process.env.GLOBAL_companyName || "CAPCo"} Team`;

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${import.meta.env.FROM_NAME || "CAPCo"} <${import.meta.env.FROM_EMAIL || "noreply@capcofire.com"}>`,
        to: [email.trim().toLowerCase()],
        subject: `Welcome to ${process.env.GLOBAL_companyName || "CAPCo"} - Your Account is Ready`,
        text: emailContent,
        // Disable tracking for magic links
        track_links: false,
        track_opens: false,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email sending error:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "User created but failed to send welcome email. Magic link: " + fixedMagicLinkUrl,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Temporary password for ${email}: ${tempPassword}`);
    console.log(`Magic link sent to ${email}: ${magicLinkUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${displayName} has been created as ${role}. A magic link has been sent to their email.`,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: displayName,
          role: role,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
