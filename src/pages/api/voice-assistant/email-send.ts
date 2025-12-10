import type { APIRoute } from "astro";

/**
 * Send Email API for Voice Assistant
 * Allows the voice assistant to send emails via Resend
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const { to, subject, body, html } = await request.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: to, subject, and body are required" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL || "noreply@capcofire.com";
    const fromName = import.meta.env.FROM_NAME || "CAPCo";

    if (!emailApiKey) {
      console.error("📧 [VOICE-ASSISTANT-EMAIL] EMAIL_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email service not configured" 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare email payload
    const emailPayload: any = {
      from: `${fromName} <${fromEmail}>`,
      to: to,
      subject: subject,
      text: body,
      track_links: true,
      track_opens: true,
    };

    // Add HTML if provided
    if (html) {
      emailPayload.html = html;
    }

    console.log("📧 [VOICE-ASSISTANT-EMAIL] Sending email:", {
      to,
      subject,
      hasHtml: !!html,
    });

    // Send via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("📧 [VOICE-ASSISTANT-EMAIL] Resend error:", errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send email",
          details: errorText 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("📧 [VOICE-ASSISTANT-EMAIL] Email sent successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent successfully to ${to}`,
        emailId: result.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("📧 [VOICE-ASSISTANT-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

