import type { APIRoute } from "astro";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request }) => {
  console.log("🧪 [TEST-EMAIL] Simple test endpoint called");
  console.log("🧪 [TEST-EMAIL] ==========================================");
  console.log("🧪 [TEST-EMAIL] Timestamp:", new Date().toISOString());

  try {
    const body = await request.json();
    console.log("🧪 [TEST-EMAIL] Request body:", JSON.stringify(body, null, 2));

    // Get environment variables for email
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    console.log("🧪 [TEST-EMAIL] Environment variables:");
    console.log("  - EMAIL_PROVIDER:", emailProvider ? "Set" : "Missing");
    console.log("  - EMAIL_API_KEY:", emailApiKey ? "Set" : "Missing");
    console.log("  - FROM_EMAIL:", fromEmail);
    console.log("  - FROM_NAME:", fromName);

    if (!emailProvider || !emailApiKey || !fromEmail) {
      console.error("🧪 [TEST-EMAIL] Email configuration not available");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email configuration not available",
          details: {
            emailProvider: !!emailProvider,
            emailApiKey: !!emailApiKey,
            fromEmail: !!fromEmail,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Try to send a test email using the email delivery API
    const baseUrl = getApiBaseUrl(request);
    console.log("🧪 [TEST-EMAIL] Calling email delivery API...");

    const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: "test-project",
        newStatus: 999, // Test status
        usersToNotify: [
          {
            email: body.to || "test@example.com",
            first_name: "Test",
            last_name: "User",
            company_name: "Test Company",
          },
        ],
        projectDetails: {
          title: "Test Project",
          address: "123 Test St",
          est_time: "2-3 business days",
          profiles: [],
        },
        email_content: body.body || "This is a test email from the CAPCo system.",
        button_text: null,
      }),
    });

    console.log("🧪 [TEST-EMAIL] Email response status:", emailResponse.status);
    console.log("🧪 [TEST-EMAIL] Email response ok:", emailResponse.ok);

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log("🧪 [TEST-EMAIL] Email delivery result:", emailResult);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Test email sent successfully",
          result: emailResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      const errorText = await emailResponse.text();
      console.error("🧪 [TEST-EMAIL] Email delivery failed:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email delivery failed",
          details: errorText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("🧪 [TEST-EMAIL] Exception:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
