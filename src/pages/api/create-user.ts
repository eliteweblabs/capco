import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";

export const GET: APIRoute = async ({ cookies }) => {
  console.log("=== CREATE STAFF GET TEST ===");
  try {
    const { isAuth, currentRole } = await checkAuth(cookies);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Create staff endpoint is accessible",
        auth: { isAuth, role: currentRole },
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
    console.log("1. Starting create-user endpoint");

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
    const { isAuth, currentRole } = await checkAuth(cookies);
    console.log("4. Auth result:", { isAuth, role: currentRole });

    if (!isAuth || currentRole !== "Admin") {
      console.log("5. AUTH FAILED - User not authorized:", { isAuth, role: currentRole });
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
      console.log("7. Extracted data:", {
        first_name,
        last_name,
        company_name,
        email,
        phone,
        staffRole,
      });
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
        full_name: company_name?.trim() || `${first_name.trim()} ${last_name.trim()}`,
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
      phone: phone?.trim() || null,
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

    // Send email notifications to all admin and staff users, plus the new user
    console.log("📧 [CREATE-USER] Sending email notifications...");

    // Define base URL for email API calls
    const baseUrl = getApiBaseUrl(request);

    try {
      // Get all admin and staff users
      const { data: adminAndStaffUsers, error: userError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("role", ["Admin", "Staff"]);

      if (userError) {
        console.error("📧 [CREATE-USER] Failed to fetch admin and staff users:", userError);
      } else {
        console.log(
          "📧 [CREATE-USER] Found admin and staff users:",
          adminAndStaffUsers?.length || 0
        );

        // Prepare email content with proper name formatting
        const displayName = company_name?.trim() || `${first_name.trim()} ${last_name.trim()}`;
        const emailContent = `A new user has been created in the system:<br>

Name: ${displayName}
Email: ${email}
Role: ${staffRole}<br>

The user will receive a magic link to access their account.`;

        // Send email to all admin and staff users (excluding the newly created user)
        const filteredAdminStaff = (adminAndStaffUsers || []).filter((user) => {
          // Filter out the newly created user
          return user.id !== authData.user.id;
        });

        for (const user of filteredAdminStaff) {
          try {
            // Get user's email using admin client
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
              user.id
            );

            if (authError || !authUser?.user?.email) {
              console.log(`📧 [CREATE-USER] No email found for ${user.role} ${user.id}, skipping`);
              continue;
            }

            const userEmail = authUser.user.email;

            // Send email using the email delivery API with full URL
            const baseUrl = getApiBaseUrl(request);
            const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: "new-user-creation",
                emailType: "registration",
                newStatus: 0,
                usersToNotify: [
                  {
                    email: userEmail,
                    first_name: user.first_name,
                    last_name: user.last_name,
                  },
                ],

                email_content: emailContent,
                button_text: "",
                custom_subject: `New User ${displayName} Created As ${staffRole}`,
              }),
            });

            if (emailResponse.ok) {
              console.log(`📧 [CREATE-USER] ${user.role} notification sent to ${userEmail}`);
            } else {
              console.error(
                `📧 [CREATE-USER] Failed to send ${user.role} notification to ${userEmail}:`,
                await emailResponse.text()
              );
            }
          } catch (emailError) {
            console.error(
              `📧 [CREATE-USER] Error sending ${user.role} notification to ${user.id}:`,
              emailError
            );
          }
        }

        // Send welcome email to the new user
        const welcomeContent = `Welcome to the CAPCo App!<br>

Your account has been created successfully:<br>

Name: ${displayName}
Email: ${email}<br>

Click the button below to access your account and set up your password.`;

        // Send welcome email using the email delivery API with full URL
        // For new users, we want to ensure they get a magic link, so we include them in profiles
        const userEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: [email], // Array of email strings
            emailSubject: `Welcome to CAPCo Fire Protection → ${displayName}`,
            emailContent: welcomeContent,
            buttonText: "Access Your Account",
            buttonLink: "/dashboard",
          }),
        });

        if (userEmailResponse.ok) {
          console.log(`📧 [CREATE-USER] Welcome email sent to ${email}`);
        } else {
          console.error(
            `📧 [CREATE-USER] Failed to send welcome email to ${email}:`,
            await userEmailResponse.text()
          );
        }
      }
    } catch (notificationError) {
      console.error("📧 [CREATE-USER] Email notification error:", notificationError);
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
        // Add notification data for client-side modal
        notification: {
          type: "success",
          title: "User Created Successfully",
          message: `${displayName} has been created as ${staffRole}. They will receive a magic link to access their account.`,
          duration: 5000,
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
