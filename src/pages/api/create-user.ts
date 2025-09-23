import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request, cookies }) => {
  // console.log("=== CREATE STAFF API CALLED ===");
  // console.log("Request headers:", Object.fromEntries(request.headers.entries()));
  try {
    // console.log("1. Starting create-user endpoint");

    // Check if Supabase is configured
    // console.log("2. Checking Supabase configuration:", !!supabase);
    if (!supabase || !supabaseAdmin) {
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

    const { currentUser } = await checkAuth(cookies);
    let body;
    let first_name,
      last_name,
      company_name,
      email,
      phone,
      staffRole,
      mobile_carrier,
      sms_alerts,
      password;

    try {
      body = await request.json();
      // console.log("6. Request body:", body);
      ({
        first_name,
        last_name,
        company_name,
        email,
        phone,
        role: staffRole,
        mobile_carrier,
        sms_alerts,
        password,
      } = body);
      // console.log("7. Extracted data:", {
      //   first_name,
      //   last_name,
      //   company_name,
      //   email,
      //   phone,
      //   staffRole,
      // });
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
    // console.log("8. Validating required fields...");
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

    // Use provided password or generate a temporary one
    const tempPassword = password?.trim() || generateTempPassword();

    // Create user in Supabase Auth (requires service role key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: false, // Auto-confirm email
      user_metadata: {
        full_name: company_name?.trim() || `${first_name.trim()} ${last_name.trim()}`,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        company_name: company_name?.trim() || null,
        phone: phone?.trim() || null,
        mobile_carrier: mobile_carrier?.trim() || null,
        sms_alerts: sms_alerts || false,
        role: staffRole,
        email: email.trim().toLowerCase(),
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

    // Wait a moment for the trigger to complete, then upsert the profile
    // The SQL trigger creates a basic profile, we upsert to handle race conditions
    await new Promise((resolve) => setTimeout(resolve, 100));

    const profileData = {
      id: authData.user.id,
      email: email.trim().toLowerCase(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      company_name: company_name?.trim() || null,
      phone: phone?.trim() || null,
      mobile_carrier: mobile_carrier?.trim() || null,
      sms_alerts: sms_alerts || false,
      role: staffRole,
      updated_at: new Date().toISOString(),
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
          code: profileError.code,
          notification: {
            type: "error",
            title: "Profile Update Failed",
            message: "Failed to update user profile. Please try again.",
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

        const adminContent = `A new user account has been created successfully:<br><br>

<b>Company Name:</b> ${displayName}<br>
<b>Email:</b> ${email}<br>
<b>First Name:</b> ${first_name}<br>
<b>Last Name:</b> ${last_name}<br>
<b>Phone:</b> ${phone || "Not provided"}<br><br>`;

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

            const adminEmail = authUser.user.email;

            // THIS IS TO THE ADMINS EMAIL
            // Send email using the email delivery API with full URL
            const baseUrl = getApiBaseUrl(request);
            const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                usersToNotify: [adminEmail], // Use resolved user email
                emailSubject: `New User → ${displayName} → ${staffRole}`,
                emailContent: adminContent,
                buttonText: "Access Your Dashboard",
                buttonLink: "/dashboard",
              }),
            });

            if (emailResponse.ok) {
              console.log(`📧 [CREATE-USER] ${user.role} notification sent to ${adminEmail}`);
            } else {
              console.error(
                `📧 [CREATE-USER] Failed to send ${user.role} notification to ${adminEmail}:`,
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

        // this is to the new user

        const welcomeContent = `Welcome to the new {{GLOBAL_COMPANY_NAME}} App!<br><br>

{{GLOBAL_COMPANY_NAME}} has a new website that allows you to submit fire protection project requests, upload documents, track the status of your projects, and download completed documents all in one place.<br><br>

Our fire protection services will be even faster and more secure with this new web application.<br><br>

Please use discussions section on projects to communicate with us, or the contact widget on the bottom right of the screen to reach us instantly.<br><br>

Your account has been created successfully:<br><br>

<b>Company Name:</b> ${displayName}<br>
<b>Email:</b> ${email}<br>
<b>First Name:</b> ${first_name}<br>
<b>Last Name:</b> ${last_name}<br>
<b>Phone:</b> ${phone || "Not provided"}<br><br>`;

        // Send welcome email using the email delivery API with full URL
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

    // Log admin user creation
    try {
      await SimpleProjectLogger.logAdminUserCreation(
        currentUser?.email || "unknown_admin",
        email,
        staffRole,
        {
          userId: authData.user.id,
          firstName: first_name.trim(),
          lastName: last_name.trim(),
          companyName: company_name?.trim() || null,
          phone: phone?.trim() || null,
          userAgent: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for") || "unknown",
        }
      );
    } catch (logError) {
      console.error("Error logging admin user creation:", logError);
    }

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
