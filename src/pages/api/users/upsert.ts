import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { getApiBaseUrl } from "../../../lib/url-utils";
import { getCarrierGateway } from "../../../lib/sms-utils";
import { validateEmail } from "../../../lib/ux-utils";
import { replacePlaceholders } from "@/lib/placeholder-utils";

/**
 * Standardized Users UPSERT API
 *
 * Handles both creating new users and updating existing ones
 *
 * POST Body:
 * - id?: string (if updating existing user)
 * - firstName: string
 * - lastName: string
 * - companyName?: string
 * - email: string
 * - role: "Admin" | "Staff" | "Client"
 * - phone?: string
 *
 * Examples:
 * - Create: POST /api/users/upsert { firstName, lastName, email, role }
 * - Update: POST /api/users/upsert { id, firstName, lastName, email, role }
 */

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

interface UserData {
  id?: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  role: "Admin" | "Staff" | "Client";
  phone?: string;
  smsAlerts?: boolean;
  mobileCarrier?: string;
  password?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body first to check if this is a setup scenario
    let body;
    try {
      const bodyText = await request.text();
      console.log("📡 [USERS-UPSERT] Raw request body:", bodyText);

      if (!bodyText || bodyText.trim() === "") {
        return new Response(
          JSON.stringify({
            error: "Empty request body",
            details: "Request body is required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("❌ [USERS-UPSERT] JSON parse error:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate that body is an object
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body format",
          details: "Request body must be a JSON object",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userData: UserData = body;

    // Validate required fields
    if (!userData.firstName?.trim() || !userData.lastName?.trim() || !userData.email?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "firstName, lastName, and email are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!["Admin", "Staff", "Client"].includes(userData.role)) {
      return new Response(
        JSON.stringify({
          error: "Invalid role",
          details: "Role must be Admin, Staff, or Client",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check authentication and permissions
    const { isAuth, currentUser } = await checkAuth(cookies);
    
    // Check if any admin users exist
    const { count: adminCount } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "Admin");
    
    const hasAdmins = (adminCount || 0) > 0;
    
    // Check if request is from setup page (allow unauthenticated admin creation from setup page)
    const referer = request.headers.get("referer") || "";
    const isFromSetupPage = referer.includes("/setup");
    
    // Allow unauthenticated requests if:
    // 1. Creating Admin role AND no admins exist (initial setup), OR
    // 2. Creating Admin role AND request is from setup page (additional admin creation)
    const isSetupScenario = !userData.id && userData.role === "Admin" && (!hasAdmins || isFromSetupPage);
    
    if (!isAuth || !currentUser) {
      if (!isSetupScenario) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      // Allow unauthenticated admin creation during setup or from setup page
      console.log("📡 [USERS-UPSERT] Allowing unauthenticated admin creation (setup scenario)");
    } else {
      // Check if authenticated user has permission to create/update users
      const userRole = currentUser.profile?.role;
      if (userRole !== "Admin" && userRole !== "Staff") {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    console.log(`📡 [USERS-UPSERT] ${userData.id ? "Updating" : "Creating"} user:`, userData.email);

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user with this email already exists (for new users)
    if (!userData.id) {
      const { data: existingUser } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .eq("email", userData.email.trim())
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({
            error: "User already exists",
            details: `A user with email ${userData.email} already exists`,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Prepare user data
    const userPayload = {
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      companyName: userData.companyName?.trim() || "",
      email: userData.email.trim(),
      role: userData.role,
      phone: userData.phone?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    let result;
    let isUpdate = false;
    let authData;

    if (userData.id) {
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(userPayload)
        .eq("id", userData.id)
        .select()
        .single();

      if (error) {
        console.error("❌ [USERS-UPSERT] Error updating user:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to update user",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
      isUpdate = true;
    } else {
      // Create new user in Supabase Auth
      const finalPassword = userData.password || generateSecurePassword();

      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email.trim().toLowerCase(),
        password: finalPassword.trim(),
        email_confirm: true,
        user_metadata: {
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          companyName: userData.companyName?.trim() || null,
          phone: userData.phone?.trim() || null,
          mobileCarrier: userData.smsAlerts
            ? getCarrierGateway(userData.mobileCarrier || null)
            : null,
          smsAlerts: userData.smsAlerts,
        },
      });

      if (authError) {
        console.error("❌ [USERS-UPSERT] Auth creation error:", authError);
        return new Response(
          JSON.stringify({
            error: authError.message || "Failed to create user account",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!newAuthData.user) {
        console.error("❌ [USERS-UPSERT] No user data returned from auth creation");
        return new Response(
          JSON.stringify({
            error: "User creation failed - no user data returned",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      authData = newAuthData;

      // Create profile in database
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .insert([
          {
            ...userPayload,
            id: authData.user.id,
            createdAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ [USERS-UPSERT] Error creating user:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to create user",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;

      // Send welcome email and notifications for new users
      const displayName =
        userData.companyName?.trim() || `${userData.firstName.trim()} ${userData.lastName.trim()}`;

      // Get email templates from database
      const { data: userTemplate } = await supabaseAdmin
        .from("globalOptions")
        .select("value")
        .eq(
          "key",
          userData.role === "Client" ? "welcomeClientEmailContent" : "welcomeStaffEmailContent"
        )
        .single();

      let userEmailContent = "";
      if (userTemplate?.value) {
        userEmailContent = await replacePlaceholders(userTemplate.value, {
          project: {
            id: 0,
            address: "",
            title: "",
            authorProfile: {
              companyName: displayName,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone || "Not provided",
            },
          },
        });
      } else {
        // Fallback welcome message if template doesn't exist
        userEmailContent = `
          <h2>Welcome to ${import.meta.env.RAILWAY_PROJECT_NAME || "the platform"}!</h2>
          <p>Your account has been created successfully. You can now access your dashboard using the link below.</p>
        `;
      }

      const emailFooterContent = `
      <br><hr><br>
      <b>Account Details:</b><br>
      <b>Company Name:</b> ${displayName}<br>
      <b>Email:</b> ${userData.email}<br>
      <b>First Name:</b> ${userData.firstName}<br>
      <b>Last Name:</b> ${userData.lastName}<br>
      <b>Phone:</b> ${userData.phone || "Not provided"}<br>
      <b>SMS Alerts:</b> ${userData.smsAlerts ? "Enabled" : "Disabled"}<br>
      <b>Mobile Carrier:</b> ${userData.mobileCarrier || "Not provided"}<br>
      <b>Registration Date:</b> ${new Date().toLocaleDateString()}<br><br>`;

      userEmailContent += emailFooterContent;

      // Send welcome email to the new user
      let apiBaseUrl;
      try {
        apiBaseUrl = getApiBaseUrl();
      } catch (error) {
        console.warn("⚠️ [USERS-UPSERT] RAILWAY_PUBLIC_DOMAIN not set, using localhost fallback");
        apiBaseUrl = "http://localhost:4321";
      }

      try {
        const emailPayload = {
          method: "magicLink",
          trackLinks: false,
          usersToNotify: [userData.email.trim().toLowerCase()],
          emailSubject: `Welcome to ${import.meta.env.RAILWAY_PROJECT_NAME || "the platform"} → ${displayName}`,
          emailContent: userEmailContent,
          buttonText: "Access Your Dashboard",
          buttonLink: "/dashboard",
        };

        console.log("📧 [USERS-UPSERT] Sending welcome email with payload:", {
          method: emailPayload.method,
          usersToNotify: emailPayload.usersToNotify,
          emailSubject: emailPayload.emailSubject,
          hasContent: !!emailPayload.emailContent,
        });

        const userEmailResponse = await fetch(`${apiBaseUrl}/api/delivery/update-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailPayload),
        });

        const emailResult = await userEmailResponse.json();
        
        if (!userEmailResponse.ok) {
          console.error("❌ [USERS-UPSERT] Failed to send welcome email:", {
            status: userEmailResponse.status,
            error: emailResult.error,
            details: emailResult.details,
          });
        } else {
          console.log("✅ [USERS-UPSERT] Welcome email sent successfully:", {
            sentEmails: emailResult.sentEmails,
            totalSent: emailResult.totalSent,
          });
        }
      } catch (emailError) {
        console.error("❌ [USERS-UPSERT] Error sending welcome email:", emailError);
      }

      // Send notification to admins
      const adminEmailContent = `A new user account has been created successfully:<br><br>${emailFooterContent}`;

      try {
        const adminEmailPayload = {
          method: "internal",
          rolesToNotify: ["Admin", "Staff"],
          emailSubject: `New User → ${displayName} → ${userData.role}`,
          emailContent: adminEmailContent,
          buttonText: "View Users",
          buttonLink: "/admin/users",
          trackLinks: false,
        };

        console.log("📧 [USERS-UPSERT] Sending admin notification with payload:", {
          method: adminEmailPayload.method,
          rolesToNotify: adminEmailPayload.rolesToNotify,
          emailSubject: adminEmailPayload.emailSubject,
        });

        const adminEmailResponse = await fetch(`${apiBaseUrl}/api/delivery/update-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adminEmailPayload),
        });

        const adminEmailResult = await adminEmailResponse.json();
        
        if (!adminEmailResponse.ok) {
          console.error("❌ [USERS-UPSERT] Failed to send admin notifications:", {
            status: adminEmailResponse.status,
            error: adminEmailResult.error,
            details: adminEmailResult.details,
          });
        } else {
          console.log("✅ [USERS-UPSERT] Admin notifications sent successfully:", {
            message: adminEmailResult.message,
            totalSent: adminEmailResult.totalSent,
          });
        }
      } catch (adminError) {
        console.error("❌ [USERS-UPSERT] Error sending admin notifications:", adminError);
      }

      // Log the user creation to system (projectId 0)
      try {
        console.log("📝 [USERS-UPSERT] Logging user creation to system:", {
          userId: authData.user.id,
          email: userData.email,
          role: userData.role,
        });

        await SimpleProjectLogger.addLogEntry(
          0, // System project ID
          "userRegistration",
          `New user created: ${userData.firstName} ${userData.lastName} (${userData.email})`,
          {
            userId: authData.user.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            companyName: userData.companyName,
            email: userData.email,
            role: userData.role,
            phone: userData.phone || null,
            smsAlerts: userData.smsAlerts || false,
            mobileCarrier: userData.mobileCarrier || null,
            createdBy: currentUser?.email || "System",
          },
          cookies
        );

        console.log("✅ [USERS-UPSERT] User creation logged to system successfully");
      } catch (logError) {
        console.error("❌ [USERS-UPSERT] Error logging user creation:", logError);
        // Don't fail the entire operation if logging fails
      }
    }

    console.log(
      `✅ [USERS-UPSERT] User ${isUpdate ? "updated" : "created"} successfully:`,
      result.id
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `User ${isUpdate ? "updated" : "created"} successfully`,
        notification: {
          type: "success",
          title: `User ${isUpdate ? "Updated" : "Created"} Successfully`,
          message: `<b>${result.companyName || `${result.firstName} ${result.lastName}`}</b> has been ${isUpdate ? "updated" : "created"} as <b>${result.role}</b>.${!isUpdate ? " Magic link sent to user." : ""}`,
          duration: 2000,
        },
      }),
      { status: isUpdate ? 200 : 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [USERS-UPSERT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
