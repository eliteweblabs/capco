import { replacePlaceholders } from "@/lib/placeholder-utils";
import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getApiBaseUrl } from "../../../lib/url-utils";
// Import validateEmail from ux-utils and getCarrierGateway from sms-utils
// import { FORM_FIELDS, getFormField } from "../../../lib/form-utils";
import { getCarrierGateway } from "../../../lib/sms-utils";
import { validateEmail } from "../../../lib/ux-utils";
// Removed routeUsersByNotificationPreference and sendSMSNotification imports
// All notification routing is now handled by update-delivery API

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
    // 1. Get data (handle both FormData and JSON)
    console.log("🔍 [CREATE-USER] Attempting to parse request data...");
    const contentType = request.headers.get("content-type") || "";

    let email, password, firstName, lastName, companyName, phone, smsAlerts, mobileCarrier, role;

    try {
      if (contentType.includes("application/json")) {
        // Handle JSON data
        console.log("🔍 [CREATE-USER] Parsing JSON data...");
        const jsonData = await request.json();
        email = jsonData.email;
        password = jsonData.password;
        firstName = jsonData.firstName;
        lastName = jsonData.lastName;
        companyName = jsonData.companyName;
        phone = jsonData.phone;
        smsAlerts = jsonData.smsAlerts;
        mobileCarrier = jsonData.mobileCarrier;
        role = jsonData.role || "Client";
      } else {
        // Handle FormData
        console.log("🔍 [CREATE-USER] Parsing FormData...");
        const formData = await request.formData();

        // Log raw form data for debugging
        console.log("🔍 [CREATE-USER] Raw form data entries:");
        for (const [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }

        email = formData.get("email")?.toString();
        password = formData.get("password")?.toString();
        firstName = formData.get("firstName")?.toString();
        lastName = formData.get("lastName")?.toString();
        companyName = formData.get("companyName")?.toString();
        phone = formData.get("phone")?.toString();
        smsAlerts = formData.get("smsAlerts") === "on" || formData.get("smsAlerts") === "true";
        mobileCarrier = formData.get("mobileCarrier")?.toString();
        role = formData.get("role")?.toString() || "Client";
      }
    } catch (parseError) {
      console.error("❌ [CREATE-USER] Error parsing request data:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse registration data. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Validate required fields
    console.log("🔍 [CREATE-USER] Validating required fields...");
    if (!email || !firstName || !lastName || !role) {
      console.log("❌ [CREATE-USER] Missing required fields:", {
        email: !!email,
        firstName: !!firstName,
        lastName: !!lastName,
        role: !!role,
        companyName: !!companyName,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, first name, last name, and role are required",
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

    // 5. Create user in Supabase Auth
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

    // 6. Create/update profile in database
    const profileData = {
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
    };

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profileData, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (profileError) {
      console.error("❌ [CREATE-USER] Profile creation error:", profileError);
      console.error(
        "❌ [CREATE-USER] Profile data that failed:",
        JSON.stringify(profileData, null, 2)
      );
      // Don't fail the entire request if profile creation fails
    } else {
      console.log("✅ [CREATE-USER] Profile created successfully");
    }

    // 7. Send emails (both user and admin notifications)
    const displayName = companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`;

    // Get email templates from database
    let userEmailContent = "";
    let adminEmailContent = "";

    // Get user email template
    const { data: userTemplate } = await supabaseAdmin
      .from("globalOptions")
      .select("value")
      .eq("key", role === "Client" ? "welcomeClientEmailContent" : "welcomeStaffEmailContent")
      .single();

    if (userTemplate?.value) {
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

    const emailFooterContent = `
    <b>Company Name:</b> ${displayName}<br>
    <b>Email:</b> ${email}<br>
    <b>First Name:</b> ${firstName}<br>
    <b>Last Name:</b> ${lastName}<br>
    <b>Phone:</b> ${phone || "Not provided"}<br>
    <b>SMS Alerts:</b> ${smsAlerts ? "Enabled" : "Disabled"}<br>
    <b>Mobile Carrier:</b> ${mobileCarrier || "Not provided"}<br>
    <b>Registration Date:</b> ${new Date().toLocaleDateString()}<br><br>`;
    // Add user details to email content
    userEmailContent += emailFooterContent;

    // Prepare admin notification content
    adminEmailContent += `A new user account has been created successfully:<br><br>`;
    adminEmailContent += emailFooterContent;

    // Send welcome email to the newly created user via update-delivery (centralized routing)
    console.log("📧 [CREATE-USER] Sending welcome email to user via update-delivery...");
    let apiBaseUrl;
    try {
      apiBaseUrl = getApiBaseUrl();
    } catch (error) {
      console.warn("⚠️ [CREATE-USER] SITE_URL not set, using localhost fallback");
      apiBaseUrl = "http://localhost:4321";
    }
    console.log("📧 [CREATE-USER] Using API base URL:", apiBaseUrl);
    try {
      const userEmailResponse = await fetch(`${apiBaseUrl}/api/update-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "magicLink",
          trackLinks: false,
          usersToNotify: [email], // Send to the newly created user
          emailSubject: `Welcome to CAPCo Fire Protection Systems → ${displayName}`,
          emailContent: userEmailContent,
          buttonText: "Access Your Dashboard",
          buttonLink: "/dashboard",
        }),
      });

      if (!userEmailResponse.ok) {
        const errorText = await userEmailResponse.text();
        console.error(
          "❌ [CREATE-USER] Failed to send welcome email to user:",
          userEmailResponse.status,
          errorText
        );
      } else {
        const responseData = await userEmailResponse.json();
        console.log(
          "✅ [CREATE-USER] Welcome email sent successfully via update-delivery:",
          responseData
        );
      }
    } catch (emailError) {
      console.error("❌ [CREATE-USER] Error sending welcome email:", emailError);
    }

    // Send notification to admins via update-delivery (centralized notification routing)
    console.log("📧 [CREATE-USER] Sending admin notifications via update-delivery...");
    try {
      const adminEmailResponse = await fetch(`${apiBaseUrl}/api/update-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "internal",
          rolesToNotify: ["Admin", "Staff"], // Use separate roles parameter
          emailSubject: `New User → ${displayName} → ${role}`,
          emailContent: adminEmailContent,
          buttonText: "View Users",
          buttonLink: "/admin/users",
          trackLinks: false,
        }),
      });

      if (!adminEmailResponse.ok) {
        const errorText = await adminEmailResponse.text();
        console.error(
          "❌ [CREATE-USER] Failed to send admin notifications:",
          adminEmailResponse.status,
          errorText
        );
      } else {
        const responseData = await adminEmailResponse.json();
        console.log("✅ [CREATE-USER] Admin notifications sent via update-delivery:", responseData);
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

    const response = {
      success: true,
      message: "User created successfully",
      notification: {
        type: "success",
        title: "User Created Successfully",
        message: `<b>${displayName}</b> has been created as <b>${role}</b>. Magic link sent to user.`,
        duration: 2000,
      },
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        firstName: firstName,
        lastName: lastName,
        companyName: companyName,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
