import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { getCarrierInfo } from "../../../lib/sms-carriers";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

// Helper function to get gateway domain from carrier key
function getCarrierGateway(carrierKey: string | null): string | null {
  if (!carrierKey) return null;
  const carrier = getCarrierInfo(carrierKey);
  return carrier?.gateway || null;
}

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  console.log("🔐 [REGISTER] Registration API called");

  // Check if Supabase is configured
  if (!supabase || !supabaseAdmin) {
    console.error("🔐 [REGISTER] Supabase not configured");
    return new Response("Supabase is not configured", { status: 500 });
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("first_name")?.toString();
  const lastName = formData.get("last_name")?.toString();
  const companyName = formData.get("company_name")?.toString();
  const phone = formData.get("phone")?.toString();
  const smsAlerts = formData.get("sms_alerts") === "on"; // Checkbox returns "on" when checked
  const mobileCarrier = formData.get("mobile_carrier")?.toString();

  console.log("🔐 [REGISTER] Form data:", {
    email,
    firstName,
    lastName,
    companyName,
    phone,
    smsAlerts,
    mobileCarrier,
    hasPassword: !!password,
  });

  if (!email || !password || !firstName || !lastName || !companyName) {
    return new Response("Email, password, first name, last name, and company name are required", {
      status: 400,
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response("Invalid email format", { status: 400 });
  }

  // Validate password strength
  if (password.length < 6) {
    return new Response("Password must be at least 6 characters long", {
      status: 400,
    });
  }

  console.log("🔐 [REGISTER] Attempting Supabase auth.signUp for:", email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: import.meta.env.DEV
        ? "http://localhost:4321/api/auth/verify"
        : "https://capcofire.com/api/auth/verify",
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        company_name: companyName,
        phone: phone || null,
        sms_alerts: smsAlerts,
        mobile_carrier: smsAlerts ? getCarrierGateway(mobileCarrier || null) : null,
      },
    },
  });

  console.log("🔐 [REGISTER] Supabase signUp result:", {
    success: !!data.user,
    userId: data.user?.id,
    needsConfirmation: !data.user?.email_confirmed_at,
    error: error?.message,
  });

  if (error) {
    console.error("Registration error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
    });

    // Check if it's a duplicate email error
    const isDuplicateEmail =
      error.message?.includes("already registered") ||
      error.message?.includes("already exists") ||
      error.message?.includes("already been registered");

    return new Response(
      JSON.stringify({
        success: false,
        error: isDuplicateEmail
          ? "A user with this email address has already been registered"
          : "Failed to create user account. Please try again.",
        details: error.message,
      }),
      {
        status: isDuplicateEmail ? 409 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Track email sending status for notifications
  let emailStatus = {
    welcomeEmailSent: false,
    adminEmailsSent: 0,
    emailErrors: [] as string[],
  };

  // Create profile in the profiles table if user was created successfully
  if (data.user) {
    console.log("Attempting to create profile for user:", data.user.id);
    console.log("🔐 [REGISTER] Profile data being inserted:", {
      id: data.user.id,
      company_name: companyName,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      sms_alerts: smsAlerts,
      mobile_carrier: smsAlerts ? getCarrierGateway(mobileCarrier || null) : null,
      role: "Client",
    });

    // Use admin client to bypass RLS policies during registration
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: data.user.id,
      company_name: companyName,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      sms_alerts: smsAlerts,
      mobile_carrier: smsAlerts ? getCarrierGateway(mobileCarrier || null) : null,
      role: "Client",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      console.error("Profile error details:", {
        message: profileError.message,
        code: profileError.code,
        hint: profileError.hint,
        details: profileError.details,
      });
      // Don't fail the registration if profile creation fails
      // The user can still log in and we can create the profile later
    } else {
      console.log("Profile created successfully for user:", data.user.id);
    }

    // Send welcome email to the new user
    const displayName = companyName || `${firstName} ${lastName}`;
    const welcomeContent = `<p>Welcome to CAPCo Fire Protection! Your account has been created successfully:<br></p>

<b>Company Name:</b> ${displayName}<br>
<b>Email:</b> ${email}<br>
<b>First Name:</b> ${firstName}<br>
<b>Last Name:</b> ${lastName}<br>
<b>Phone:</b> ${phone || "Not provided"}<br>
<b>SMS Alerts:</b> ${smsAlerts ? "Enabled" : "Disabled"}<br>
<b>Mobile Carrier:</b> ${mobileCarrier || "Not provided"}<br>
        <b>Registration Date:</b> ${new Date().toLocaleDateString()}<br><br>

<p>You're now signed in and ready to start creating projects. Click the button below to access your dashboard.</p><br><br>`;

    // Get the base URL for the email API call
    const baseUrl = import.meta.env.DEV ? "http://localhost:4321" : "https://capcofire.com";

    try {
      // Send welcome email using the email delivery API
      const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usersToNotify: [email], // Array of email strings
          emailSubject: `Welcome to CAPCo Fire Protection > ${displayName}`,
          emailContent: welcomeContent,
          buttonText: "Access Your Dashboard",
          buttonLink: "/dashboard",
        }),
      });

      if (emailResponse.ok) {
        console.log("📧 [REGISTER] Welcome email sent successfully to:", email);
        emailStatus.welcomeEmailSent = true;
      } else {
        const errorText = await emailResponse.text();
        console.error("📧 [REGISTER] Failed to send welcome email to:", email, errorText);
        emailStatus.emailErrors.push(`Welcome email failed: ${errorText}`);
      }
    } catch (emailError) {
      console.error("📧 [REGISTER] Error sending welcome email:", emailError);
      emailStatus.emailErrors.push(
        `Welcome email error: ${emailError instanceof Error ? emailError.message : String(emailError)}`
      );
      // Don't fail registration if email sending fails
    }

    // Send notification email to all admin users about the new registration
    try {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "Admin");

      if (adminError) {
        console.error("📧 [REGISTER] Failed to fetch admin users:", adminError);
      } else {
        console.log("📧 [REGISTER] Found admin users:", adminUsers?.length || 0);

        // Prepare admin notification email content
        const adminEmailContent = `<p>New Account Created:<br></p>

        <b>Company Name:</b> ${displayName}<br>
        <b>Email:</b> ${email}<br>
        <b>First Name:</b> ${firstName}<br>
        <b>Last Name:</b> ${lastName}<br>
        <b>Phone:</b> ${phone || "Not provided"}<br>
        <b>SMS Alerts:</b> ${smsAlerts ? "Enabled" : "Disabled"}<br>
        <b>Mobile Carrier:</b> ${mobileCarrier || "Not provided"}<br>
        <b>Registration Date:</b> ${new Date().toLocaleDateString()}<br><br>`;

        // Send notification to all admin users
        for (const admin of adminUsers || []) {
          try {
            // Get admin's email using admin client
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
              admin.id
            );

            if (authError || !authUser?.user?.email) {
              console.log(`📧 [REGISTER] No email found for admin ${admin.id}, skipping`);
              continue;
            }

            const adminEmail = authUser.user.email;

            // Send notification email to admin
            const adminEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                usersToNotify: [adminEmail], // Array of email strings
                emailSubject: `New User Registration on CAPCo Fire Protection > ${displayName}`,
                emailContent: adminEmailContent,
                buttonText: "Access Your Dashboard",
                buttonLink: "/dashboard",
              }),
            });

            if (adminEmailResponse.ok) {
              console.log(`📧 [REGISTER] Admin notification sent to: ${adminEmail}`);
              emailStatus.adminEmailsSent++;
            } else {
              const adminErrorText = await adminEmailResponse.text();
              console.error(
                `📧 [REGISTER] Failed to send admin notification to: ${adminEmail}`,
                adminErrorText
              );
              emailStatus.emailErrors.push(
                `Admin notification to ${adminEmail} failed: ${adminErrorText}`
              );
            }
          } catch (adminEmailError) {
            console.error(
              `📧 [REGISTER] Error sending admin notification to ${admin.id}:`,
              adminEmailError
            );
            emailStatus.emailErrors.push(
              `Admin notification error: ${adminEmailError instanceof Error ? adminEmailError.message : String(adminEmailError)}`
            );
          }
        }
      }
    } catch (adminNotificationError) {
      console.error("📧 [REGISTER] Error sending admin notifications:", adminNotificationError);
      // Don't fail registration if admin notification fails
    }
  }

  console.log("User registration successful:", !!data.user);

  // Sign in the user immediately after registration
  if (data.user) {
    console.log("🔐 [REGISTER] Signing in user after registration:", data.user.email);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("🔐 [REGISTER] Sign-in error after registration:", signInError);
      // Don't fail the registration, but log the error
    } else {
      console.log("🔐 [REGISTER] User signed in successfully after registration");

      // Set auth cookies to maintain the session
      if (signInData.session) {
        const { access_token, refresh_token } = signInData.session;
        setAuthCookies(cookies, access_token, refresh_token);
        console.log("🔐 [REGISTER] Auth cookies set successfully");
      }
    }
  }

  // Return success response with email status for toast notifications
  return new Response(
    JSON.stringify({
      success: true,
      message: "User registration successful",
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            needsConfirmation: !data.user.email_confirmed_at,
          }
        : null,
      emailStatus: emailStatus,
      notification: {
        type: "success",
        title: "Account Created!",
        message: `Welcome! ${emailStatus.welcomeEmailSent ? "Check your email for welcome instructions." : "You're now signed in and ready to create projects."}`,
        duration: 2000,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
