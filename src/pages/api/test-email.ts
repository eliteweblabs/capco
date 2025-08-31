import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📧 [TEST-EMAIL] API endpoint called");
  
  try {
    const { to, subject, body, buttonText } = await request.json();
    console.log("📧 [TEST-EMAIL] Request data:", { to, subject, body: body?.substring(0, 100) + "...", buttonText });

    // Validate input
    if (!to || !subject || !body) {
      console.error("📧 [TEST-EMAIL] Missing required fields");
      return new Response(JSON.stringify({ error: "Email, subject, and body are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user from session using tokens
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      console.error("📧 [TEST-EMAIL] Not authenticated");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      console.error("📧 [TEST-EMAIL] Database connection not available");
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      console.error("📧 [TEST-EMAIL] Invalid session:", sessionError);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📧 [TEST-EMAIL] User authenticated:", session.session.user.email);

    // Check if the recipient email exists in the system
    const { data: existingUser, error: userCheckError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userCheckError) {
      console.error("📧 [TEST-EMAIL] User check error:", userCheckError);
      return new Response(JSON.stringify({ error: "Failed to verify recipient" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userExists = existingUser.users.some((user) => user.email === to);
    console.log("📧 [TEST-EMAIL] User exists check:", { to, userExists });

    if (!userExists) {
      console.error("📧 [TEST-EMAIL] User does not exist:", to);
      return new Response(
        JSON.stringify({
          error: `Email address '${to}' does not exist in the system. Magic links only work for existing users.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call the email delivery API
    console.log("📧 [TEST-EMAIL] Calling email delivery API...");
    const emailResponse = await fetch(
      `${import.meta.env.SITE_URL || "http://localhost:4321"}/api/email-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "test-project",
          newStatus: 999, // Test status
          usersToNotify: [{
            email: to,
            first_name: "Test",
            last_name: "User",
            company_name: "Test Company"
          }],
          projectDetails: {
            title: "Test Project",
            address: "Test Address",
            profiles: [{
              email: to,
              first_name: "Test",
              last_name: "User",
              company_name: "Test Company"
            }]
          },
          email_content: body,
          button_text: buttonText || "Access Your Dashboard",
        }),
      }
    );

    console.log("📧 [TEST-EMAIL] Email delivery response status:", emailResponse.status);

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log("📧 [TEST-EMAIL] Email delivery result:", emailResult);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          emailId: emailResult.sentEmails?.[0] || "unknown",
          details: emailResult,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      const errorText = await emailResponse.text();
      console.error("📧 [TEST-EMAIL] Email delivery failed:", errorText);
      
      return new Response(
        JSON.stringify({
          error: `Failed to send email: ${errorText}`,
        }),
        { status: emailResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("📧 [TEST-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
