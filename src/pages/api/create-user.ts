import { replacePlaceholders } from "@/lib/placeholder-utils";
import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";
// Import validateEmail from ux-utils and getCarrierGateway from sms-utils
import { createDatabaseObject } from "../../lib/database-field-mapper";
import { FORM_FIELDS, getFormField } from "../../lib/form-utils";
import { getCarrierGateway } from "../../lib/sms-utils";
import { validateEmail } from "../../lib/ux-utils";

/**
 * Generates a secure password with mixed case, numbers, and special characters
 * @returns A secure password string
 */
function generateSecurePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*";

  let password = "";

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters (total length 12)
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("=== CREATE USER API CALLED ===");
  console.log("🔍 [CREATE-USER] Request headers:", Object.fromEntries(request.headers.entries()));
  console.log("🔍 [CREATE-USER] Request content-type:", request.headers.get("content-type"));

  // Check if Supabase is configured
  if (!supabase || !supabaseAdmin) {
    console.error("🔐 [CREATE-USER] ERROR: Supabase not configured");
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

  try {
    // 1. Get form data
    console.log("🔍 [CREATE-USER] Attempting to parse form data...");
    const formData = await request.formData();
    console.log("🔍 [CREATE-USER] Form data parsed successfully");

    const email = getFormField(formData, FORM_FIELDS.email);
    const password = getFormField(formData, FORM_FIELDS.password);
    const firstName = getFormField(formData, FORM_FIELDS.firstName);
    const lastName = getFormField(formData, FORM_FIELDS.lastName);
    const companyName = getFormField(formData, FORM_FIELDS.companyName);
    const phone = getFormField(formData, FORM_FIELDS.phone);
    const smsAlerts = getFormField(formData, FORM_FIELDS.smsAlerts, false);
    const mobileCarrier = getFormField(formData, FORM_FIELDS.mobileCarrier);
    const role = getFormField(formData, FORM_FIELDS.role) || "Client";

    console.log("🔍 [CREATE-USER] Extracted fields:", {
      email: email ? "***@***" : null,
      password: password ? "***" : null,
      firstName,
      lastName,
      companyName,
      phone,
      smsAlerts,
      mobileCarrier,
      role,
    });

    // 2. Validate required fields
    console.log("🔍 [CREATE-USER] Validating required fields...");
    if (!email || !firstName || !lastName || !companyName) {
      console.log("❌ [CREATE-USER] Missing required fields:", {
        email: !!email,
        firstName: !!firstName,
        lastName: !!lastName,
        companyName: !!companyName,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, first name, last name, and company name are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    let finalPassword = "";
    // Generate password if not provided (for staff creation)
    if (!password) {
      finalPassword = generateSecurePassword();
      console.log("🔍 [CREATE-USER] Generated secure password for staff creation");
    } else {
      finalPassword = password;
    }

    console.log("✅ [CREATE-USER] All required fields present");

    // 3. Validate email format
    console.log("🔍 [CREATE-USER] Validating email format...");
    const emailError = validateEmail(email);
    if (emailError) {
      console.log("❌ [CREATE-USER] Email validation failed:", emailError);
      return new Response(JSON.stringify({ success: false, error: emailError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("✅ [CREATE-USER] Email format valid");

    // 4. Validate role
    console.log("🔍 [CREATE-USER] Validating role...");
    if (!["Admin", "Staff", "Client"].includes(role)) {
      console.log("❌ [CREATE-USER] Invalid role:", role);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid role. Must be 'Admin', 'Staff', or 'Client'.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("✅ [CREATE-USER] Role valid:", role);

    // 5. Create user in Supabase Auth
    console.log("🔐 [CREATE-USER] Creating user in Supabase Auth...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: finalPassword.trim(),
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName?.trim() || null,
        phone: phone?.trim() || null,
        mobileCarrier: smsAlerts ? getCarrierGateway(mobileCarrier || null) : null,
        smsAlerts: smsAlerts,
      },
    });

    if (authError) {
      console.error("❌ [CREATE-USER] Auth creation error:", authError);

      // Handle specific error cases
      let errorMessage = authError.message || "Failed to create user account";
      let statusCode = 500;

      // Check for duplicate email errors
      if (
        authError.message &&
        (authError.message.includes("User already registered") ||
          authError.message.includes("already been registered") ||
          authError.message.includes("duplicate key") ||
          authError.message.includes("already exists"))
      ) {
        errorMessage =
          "A user with this email address has already been registered. Please try logging in instead.";
        statusCode = 409; // Conflict status code
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      console.error("❌ [CREATE-USER] No user data returned from auth creation");
      return new Response(
        JSON.stringify({
          success: false,
          error: "User creation failed - no user data returned",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("✅ [CREATE-USER] User created in Supabase Auth:", authData.user.id);

    // 6. Create/update profile in database
    console.log("💾 [CREATE-USER] Creating profile in database...");
    const profileData = createDatabaseObject({
      id: authData.user.id,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName?.trim() || null,
      phone: phone?.trim() || null,
      smsAlerts: smsAlerts,
      mobileCarrier: smsAlerts ? getCarrierGateway(mobileCarrier || null) : null,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log("💾 [CREATE-USER] Profile data prepared:", {
      id: profileData.id,
      email: profileData.email,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      role: profileData.role,
    });

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profileData, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (profileError) {
      console.error("❌ [CREATE-USER] Profile creation error:", profileError);
      // Don't fail the entire request if profile creation fails
    } else {
      console.log("✅ [CREATE-USER] Profile created successfully");
    }

    // 7. Send emails (both user and admin notifications)
    console.log("📧 [CREATE-USER] Preparing email notifications...");
    const displayName = companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`;
    console.log("📧 [CREATE-USER] Display name:", displayName);

    // Get email templates from database
    let userEmailContent = "";
    let adminEmailContent = "";

    // Get user email template
    console.log("📧 [CREATE-USER] Fetching email template for role:", role);
    const { data: userTemplate } = await supabase
      .from("globalOptions")
      .select("value")
      .eq("key", role === "Client" ? "welcomeClientEmailContent" : "welcomeStaffEmailContent")
      .single();

    if (userTemplate?.value) {
      console.log("📧 [CREATE-USER] Email template found, processing placeholders...");
      userEmailContent = replacePlaceholders(userTemplate.value, {
        project: {
          id: 0,
          address: "",
          title: "",
          authorProfile: {
            companyName: displayName,
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone || "Not provided",
          },
        },
      });
    } else {
      console.log("⚠️ [CREATE-USER] No email template found, using default content");
    }

    // Add user details to email content
    userEmailContent += `
      <b>SMS Alerts:</b> ${smsAlerts ? "Enabled" : "Disabled"}<br>
      <b>Mobile Carrier:</b> ${mobileCarrier || "Not provided"}<br>
      <b>Registration Date:</b> ${new Date().toLocaleDateString()}<br><br>`;

    // Prepare admin notification content
    adminEmailContent = `A new user account has been created successfully:<br><br>
      <b>Company Name:</b> ${displayName}<br>
      <b>Email:</b> ${email}<br>
      <b>First Name:</b> ${firstName}<br>
      <b>Last Name:</b> ${lastName}<br>
      <b>Phone:</b> ${phone || "Not provided"}<br>
      <b>SMS Alerts:</b> ${smsAlerts ? "Enabled" : "Disabled"}<br>
      <b>Mobile Carrier:</b> ${mobileCarrier || "Not provided"}<br>
      <b>Registration Date:</b> ${new Date().toLocaleDateString()}<br><br>`;

    // Send welcome email to user
    console.log("📧 [CREATE-USER] Sending welcome email to user...");
    try {
      const userEmailResponse = await fetch(`${getApiBaseUrl()}/api/email-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailType: "magicLink",
          trackLinks: false,
          usersToNotify: [email],
          emailSubject: `Welcome to CAPCo Fire Protection Systems → ${displayName}`,
          emailContent: userEmailContent,
          buttonText: "Access Your Dashboard",
          buttonLink: "/dashboard",
        }),
      });

      if (!userEmailResponse.ok) {
        console.error("❌ [CREATE-USER] Failed to send welcome email to user");
      } else {
        console.log("✅ [CREATE-USER] Welcome email sent successfully");
      }
    } catch (emailError) {
      console.error("❌ [CREATE-USER] Error sending welcome email:", emailError);
    }

    // Send notification email to admins
    console.log("📧 [CREATE-USER] Sending admin notifications...");
    try {
      const adminResponse = await fetch(`${getApiBaseUrl()}/api/get-user-emails-by-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: ["Admin", "Staff"] }),
      });

      const adminUsers = await adminResponse.json();
      console.log("📧 [CREATE-USER] Found admin users:", adminUsers.emails?.length || 0);

      if (adminUsers.emails && adminUsers.emails.length > 0) {
        // Send notification to all admin emails
        console.log("📧 [CREATE-USER] Sending notification to admin emails:", adminUsers.emails);
        await fetch(`${getApiBaseUrl()}/api/email-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailType: "notification",
            usersToNotify: adminUsers.emails,
            emailSubject: `New User → ${displayName} → ${role}`,
            emailContent: adminEmailContent,
            buttonText: "View Users",
            buttonLink: "/admin/users",
          }),
        });
        console.log("✅ [CREATE-USER] Admin notifications sent");
      }
    } catch (adminError) {
      console.error("❌ [CREATE-USER] Error sending admin notifications:", adminError);
    }

    // 8. Log the user creation
    console.log("📝 [CREATE-USER] Logging user creation...");
    try {
      await SimpleProjectLogger.addLogEntry(
        0, // System log
        "userRegistration",
        "New user created",
        {
          userId: authData.user.id,
          firstName,
          lastName,
          companyName,
          role,
          phone: phone || null,
          smsAlerts,
          mobileCarrier: mobileCarrier || null,
        }
      );
      console.log("✅ [CREATE-USER] User creation logged successfully");
    } catch (logError) {
      console.error("❌ [CREATE-USER] Error logging user creation:", logError);
    }

    // 9. Return success response
    console.log("🎉 [CREATE-USER] User creation completed successfully!");
    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        // Add notification data for client-side modal
        notification: {
          type: "success",
          title: "User Created Successfully",
          message: `<b>${displayName}</b> has been created as <b>${role}</b>. They will receive a magic link to access their account.`,
          duration: 5000,
        },

        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: role,
          firstName: firstName,
          lastName: lastName,
          companyName: companyName,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [CREATE-USER] Create user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
