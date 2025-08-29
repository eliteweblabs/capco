import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { to, subject, body, buttonText } = await request.json();

    // Validate input
    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: "Email, subject, and body are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current user session for magic link generation
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Authentication required to send emails" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session to get current user
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify the current user session
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get environment variables
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    if (!emailProvider || !emailApiKey || !fromEmail) {
      return new Response(
        JSON.stringify({
          error:
            "Email configuration missing. Please check EMAIL_PROVIDER, EMAIL_API_KEY, and FROM_EMAIL environment variables.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (emailProvider !== "resend") {
      return new Response(
        JSON.stringify({ error: "Only Resend provider is supported for this test endpoint" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read the email template
    const templatePath = join(process.cwd(), "src", "emails", "template.html");
    let emailTemplate = "";
    try {
      emailTemplate = readFileSync(templatePath, "utf-8");
    } catch (error) {
      console.error("Error reading email template:", error);
      return new Response(JSON.stringify({ error: "Failed to load email template" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate magic link for the recipient
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: to,
      options: {
        redirectTo: `${import.meta.env.SITE_URL || 'http://localhost:4321'}/dashboard`,
      },
    });

    if (magicLinkError) {
      console.error("Magic link generation error:", magicLinkError);
      return new Response(JSON.stringify({ error: "Failed to generate magic link" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buttonLink = magicLinkData.properties.action_link;

    // Replace template variables with provided content
    let emailHtml = emailTemplate.replace("{{CONTENT}}", body);
    emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", buttonText || "Access Your Dashboard");
    emailHtml = emailHtml.replace("{{BUTTON_LINK}}", buttonLink);

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: emailHtml,
        text: body.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);
      return new Response(
        JSON.stringify({
          error: `Failed to send email: ${result.message || "Unknown error"}`,
          details: result,
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        emailId: result.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email test error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
