import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

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
      }
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
      }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("=== CREATE STAFF API CALLED ===");
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));
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
        }
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
        }
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
        }
      );
    }

        console.log("5. Auth successful, parsing request body...");
    let body;
    let first_name, last_name, company_name, email, phone, staffRole;
    
    try {
      body = await request.json();
      console.log("6. Request body:", body);
      ({ first_name, last_name, company_name, email, phone, role: staffRole } = body);
      console.log("7. Extracted data:", { first_name, last_name, company_name, email, phone, staffRole });
    } catch (parseError) {
      console.error("Request body parsing error:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body. Please check the data format.",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    console.log("8. Validating required fields...");
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !staffRole?.trim()) {
      console.log("ERROR: Missing required fields:", {
        first_name: !!first_name?.trim(),
        last_name: !!last_name?.trim(),
        email: !!email?.trim(),
        role: !!staffRole?.trim(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "First name, last name, email, and role are required.",
          notification: {
            type: "error",
            title: "Missing Required Fields",
            message: "Please provide first name, last name, email, and role for the new user.",
            duration: 5000,
          },
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
          error: "Invalid email format.",
          notification: {
            type: "error",
            title: "Invalid Email",
            message: "Please enter a valid email address.",
            duration: 5000,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate role
    if (!["Admin", "Staff", "Client"].includes(staffRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid role. Must be 'Admin', 'Staff', or 'Client'.",
          notification: {
            type: "error",
            title: "Invalid Role",
            message: "Please select a valid role: Admin, Staff, or Client.",
            duration: 5000,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate a temporary password
    const tempPassword = generateTempPassword();

    // Create user in Supabase Auth (requires service role key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: name.trim(),
        role: staffRole,
        created_by_admin: true,
        must_change_password: true,
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
            notification: {
              type: "error",
              title: "User Already Exists",
              message: "A user with this email address already exists in the system.",
              duration: 5000,
            },
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
          notification: {
            type: "error",
            title: "User Creation Failed",
            message: "Failed to create user account. Please try again.",
            duration: 5000,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create profile in profiles table (use admin client to bypass RLS)
    const profileData = {
      id: authData.user.id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      company_name: company_name?.trim() || null,
      phone: phone?.trim() ? parseInt(phone.trim()) : null,
      role: staffRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin.from("profiles").insert([profileData]);

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
          notification: {
            type: "error",
            title: "Profile Creation Failed",
            message: "Failed to create user profile. Please try again.",
            duration: 5000,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate display name for notifications
    const displayName = company_name?.trim() || `${first_name.trim()} ${last_name.trim()}`;

    // Send email notifications to all admins and the new user
    console.log("📧 [CREATE-STAFF] Sending email notifications...");

    try {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "Admin");

      if (adminError) {
        console.error("📧 [CREATE-STAFF] Failed to fetch admin users:", adminError);
      } else {
        console.log("📧 [CREATE-STAFF] Found admin users:", adminUsers?.length || 0);

        // Prepare email content
        const displayName = company_name?.trim() || `${first_name.trim()} ${last_name.trim()}`;
        const emailContent = `A new user has been created in the system:

Name: ${displayName}
Email: ${email}
Role: ${staffRole}
Temporary Password: ${tempPassword}

The user will need to change their password upon first login.`;

        // Send email to all admins
        for (const admin of adminUsers || []) {
          try {
            const emailResponse = await fetch("http://localhost:4321/api/email-delivery", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: "new-user-creation",
                newStatus: 0, // Not a status change, but required by email API
                usersToNotify: [
                  {
                    email: admin.email,
                    first_name: admin.first_name,
                    last_name: admin.last_name,
                  },
                ],
                projectDetails: {
                  title: "New User Created",
                  address: "System Notification",
                  profiles: [
                    {
                      email: admin.email,
                      first_name: admin.first_name,
                      last_name: admin.last_name,
                    },
                  ],
                },
                email_content: emailContent,
                button_text: "", // No button for admin notifications
              }),
            });

            if (emailResponse.ok) {
              console.log(`📧 [CREATE-STAFF] Admin notification sent to ${admin.email}`);
            } else {
              console.error(
                `📧 [CREATE-STAFF] Failed to send admin notification to ${admin.email}:`,
                await emailResponse.text()
              );
            }
          } catch (emailError) {
            console.error(
              `📧 [CREATE-STAFF] Error sending admin notification to ${admin.email}:`,
              emailError
            );
          }
        }

        // Send welcome email to the new user
        const welcomeContent = `Welcome to the system!

Your account has been created successfully:

Name: ${displayName}
Email: ${email}
Role: ${staffRole}
Temporary Password: ${tempPassword}

Please log in with your email and temporary password, then change your password immediately.

You can access the system at: ${import.meta.env.SITE_URL || "http://localhost:4321"}`;

        const userEmailResponse = await fetch("http://localhost:4321/api/email-delivery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: "new-user-creation",
            newStatus: 0,
            usersToNotify: [
              {
                email: email,
                first_name: first_name.trim(),
                last_name: last_name.trim(),
              },
            ],
            projectDetails: {
              title: "Welcome to the System",
              address: "Account Creation",
              profiles: [
                {
                  email: email,
                  first_name: first_name.trim(),
                  last_name: last_name.trim(),
                },
              ],
            },
            email_content: welcomeContent,
            button_text: "Log In",
          }),
        });

        if (userEmailResponse.ok) {
          console.log(`📧 [CREATE-STAFF] Welcome email sent to ${email}`);
        } else {
          console.error(
            `📧 [CREATE-STAFF] Failed to send welcome email to ${email}:`,
            await userEmailResponse.text()
          );
        }
      }
    } catch (notificationError) {
      console.error("📧 [CREATE-STAFF] Email notification error:", notificationError);
      // Don't fail the user creation if email notifications fail
    }

    console.log(`Temporary password for ${email}: ${tempPassword}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          role: staffRole,
        },
        // TODO: Remove this in production - send via email instead
        tempPassword: tempPassword,
        // Add notification data for client-side toast
        notification: {
          type: "success",
          title: "User Created Successfully",
          message: `${displayName} has been created as ${staffRole}. Temporary password: ${tempPassword}`,
          duration: 8000, // Longer duration to show password
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create staff error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error message:", error instanceof Error ? error.message : error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        errorType: error?.constructor?.name || "Unknown",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

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
