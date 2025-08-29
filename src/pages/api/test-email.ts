import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { to, subject, body } = await request.json();

    // Validate input
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Email, subject, and body are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    if (!emailProvider || !emailApiKey || !fromEmail) {
      return new Response(
        JSON.stringify({ 
          error: "Email configuration missing. Please check EMAIL_PROVIDER, EMAIL_API_KEY, and FROM_EMAIL environment variables." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (emailProvider !== 'resend') {
      return new Response(
        JSON.stringify({ error: "Only Resend provider is supported for this test endpoint" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(
        JSON.stringify({ 
          error: `Failed to send email: ${result.message || 'Unknown error'}`,
          details: result 
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email sent successfully",
        emailId: result.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Email test error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
