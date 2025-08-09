import type { APIRoute } from "astro";
import { emailService, EMAIL_TEMPLATES } from "../../lib/email-service";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { to, type, variables } = body;

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Recipient email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let result;

    switch (type) {
      case "welcome":
        result = await emailService.sendTemplatedEmail(
          to,
          EMAIL_TEMPLATES.welcome,
          { appName: "CAPCo", name: variables?.name || "User", ...variables },
        );
        break;

      case "password-reset":
        result = await emailService.sendTemplatedEmail(
          to,
          EMAIL_TEMPLATES.passwordReset,
          {
            appName: "CAPCo",
            name: variables?.name || "User",
            resetLink: variables?.resetLink || "#",
            ...variables,
          },
        );
        break;

      case "notification":
        result = await emailService.sendTemplatedEmail(
          to,
          EMAIL_TEMPLATES.notification,
          {
            appName: "CAPCo",
            title: variables?.title || "Notification",
            message: variables?.message || "",
            ...variables,
          },
        );
        break;

      case "custom":
        result = await emailService.sendEmail({
          to,
          subject: variables?.subject || "No Subject",
          html: variables?.html || "<p>No content</p>",
          text: variables?.text,
        });
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid email type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          messageId: result.messageId,
          message: `Email sent successfully to ${Array.isArray(to) ? to.join(", ") : to}`,
          to: to,
          type: type,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          to: to,
          type: type,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Email API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// Example GET route to test configuration
export const GET: APIRoute = async () => {
  const verification = await emailService.verifyConnection();

  return new Response(
    JSON.stringify({
      configured: true,
      provider: "Check environment variables",
      verification: verification.success ? "OK" : verification.error,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
