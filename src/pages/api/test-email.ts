import type { APIRoute } from "astro";
import { emailService } from "../../lib/email-service";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return new Response(JSON.stringify({ error: "Email address required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send test email
    const result = await emailService.sendEmail({
      to,
      subject: "Test Email from CAPCo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎉 Email Service Test</h2>
          <p>Congratulations! Your Resend email service is working correctly.</p>
          <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <strong>Test Details:</strong><br>
            Provider: Resend<br>
            Sent at: ${new Date().toLocaleString()}<br>
            From: CAPCo Email Service
          </p>
          <p>You can now send emails from your application!</p>
        </div>
      `,
      text: "Test email from CAPCo - Your Resend email service is working correctly!",
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Test email error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    `
    <html>
      <head><title>Test Email Service</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h2>🧪 Test Email Service</h2>
        <form id="emailForm">
          <div style="margin-bottom: 15px;">
            <label for="email" style="display: block; margin-bottom: 5px;">Email Address:</label>
            <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <button type="submit" style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
            Send Test Email
          </button>
        </form>
        <div id="result" style="margin-top: 20px;"></div>
        
        <script>
          document.getElementById('emailForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const result = document.getElementById('result');
            
            result.innerHTML = '<p style="color: #666;">Sending email...</p>';
            
            try {
              const response = await fetch('/api/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: email })
              });
              
              const data = await response.json();
              
              if (data.success) {
                result.innerHTML = '<p style="color: green;">✅ Email sent successfully!</p>';
              } else {
                result.innerHTML = '<p style="color: red;">❌ Error: ' + data.error + '</p>';
              }
            } catch (error) {
              result.innerHTML = '<p style="color: red;">❌ Network error: ' + error.message + '</p>';
            }
          });
        </script>
      </body>
    </html>
  `,
    {
      headers: { "Content-Type": "text/html" },
    },
  );
};
