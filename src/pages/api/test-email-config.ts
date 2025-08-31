import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    // Check environment variables
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    const config = {
      emailProvider: emailProvider || "Not set",
      emailApiKey: emailApiKey ? `${emailApiKey.substring(0, 8)}...` : "Not set",
      fromEmail: fromEmail || "Not set",
      fromName: fromName || "Not set",
      isConfigured: !!(emailProvider && emailApiKey && fromEmail),
    };

    // Test email sending if configured
    let testResult = null;
    if (config.isConfigured) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: ["test@example.com"],
            subject: "Email Configuration Test",
            html: "<h1>Email Configuration Test</h1><p>If you receive this, your email configuration is working!</p>",
            text: "Email Configuration Test - If you receive this, your email configuration is working!",
          }),
        });

        if (response.ok) {
          const result = await response.json();
          testResult = {
            success: true,
            message: "Email sent successfully",
            result,
          };
        } else {
          const errorText = await response.text();
          testResult = {
            success: false,
            message: "Email sending failed",
            error: errorText,
            status: response.status,
          };
        }
      } catch (error) {
        testResult = {
          success: false,
          message: "Email sending error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return new Response(
      JSON.stringify({
        config,
        testResult,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to test email configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
