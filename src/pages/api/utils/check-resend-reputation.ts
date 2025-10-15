import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  try {
    const resendApiKey = import.meta.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check domain status
    const domainResponse = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
    });

    const domains = await domainResponse.json();

    // Check recent bounces and complaints
    const webhooksResponse = await fetch("https://api.resend.com/webhooks", {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
    });

    const webhooks = await webhooksResponse.json();

    // Get account info
    const accountResponse = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
    });

    return new Response(
      JSON.stringify({
        domains,
        webhooks,
        message: "Check your Resend dashboard for detailed reputation metrics",
        recommendations: [
          "Look for your capcofire.com domain status",
          "Check if domain is 'Verified' and not 'Blocked'",
          "Review bounce rates in your dashboard",
          "Look for any suppression list entries",
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking Resend reputation:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check reputation",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
