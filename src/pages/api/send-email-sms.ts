import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const phone1 = formData.get("phone1") as string;
    const carrier1 = formData.get("carrier1") as string;
    const phone2 = formData.get("phone2") as string;
    const carrier2 = formData.get("carrier2") as string;
    const message = formData.get("message") as string;
    const contactInfo = formData.get("contact_info") as string;

    console.log("📱 [SMS-API] SMS request received:", {
      phone1: phone1 ? "***" + phone1.slice(-4) : "none",
      carrier1,
      phone2: phone2 ? "***" + phone2.slice(-4) : "none",
      carrier2,
      messageLength: message?.length || 0,
      hasContactInfo: !!contactInfo,
    });

    if (!message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Message is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build list of SMS recipients
    const smsRecipients = [];

    if (phone1 && carrier1) {
      smsRecipients.push(`${phone1}${carrier1}`);
    }

    if (phone2 && carrier2) {
      smsRecipients.push(`${phone2}${carrier2}`);
    }

    if (smsRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "At least one phone number and carrier are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Format the message with context - put contact info first to avoid truncation
    // Keep it simple for SMS gateways
    let emailContent = `CAPCo Contact`;

    if (contactInfo) {
      emailContent += ` from ${contactInfo}`;
    }

    emailContent += `: ${message}`;

    // Ensure content is not too long for SMS (most carriers have 160-320 character limits)
    if (emailContent.length > 300) {
      console.warn("📱 [SMS-API] Content is long for SMS:", emailContent.length, "characters");
      // Truncate if too long
      emailContent = emailContent.substring(0, 300) + "...";
    }

    // Debug: Log the full email content being sent
    console.log("📱 [SMS-API] Full email content being sent:");
    console.log("📱 [SMS-API] Content length:", emailContent.length);
    console.log(
      "📱 [SMS-API] Content preview:",
      emailContent.substring(0, 200) + (emailContent.length > 200 ? "..." : "")
    );

    // Send SMS directly via Resend API (no email delivery system)
    console.log("📱 [SMS-API] Sending SMS directly via Resend API to:", smsRecipients);

    // Get email configuration from environment
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL || "noreply@capcofire.com";
    const fromName = import.meta.env.FROM_NAME || "CAPCo";

    if (!emailApiKey) {
      console.error("📱 [SMS-API] EMAIL_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured",
          totalSent: 0,
          totalFailed: smsRecipients.length,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const sentEmails = [];
    const failedEmails = [];

    // Send to each SMS gateway
    for (const smsEmail of smsRecipients) {
      try {
        console.log(`📱 [SMS-API] Sending to SMS gateway: ${smsEmail}`);

        const emailPayload = {
          from: `CAPCo Fire <noreply@capcofire.com>`, // Use consistent, verified sender
          to: smsEmail,
          subject: "", // Empty subject for SMS gateways (reduces spam triggers)
          text: emailContent.substring(0, 160), // Limit to SMS length (160 chars)
          // Add SMS-specific headers
          headers: {
            "X-SMS-Gateway": "true",
            "Content-Type": "text/plain; charset=UTF-8",
          },
        };

        console.log("📱 [SMS-API] SMS payload:", {
          to: smsEmail,
          subject: emailPayload.subject,
          contentLength: emailContent.length,
        });

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
          console.error(`📱 [SMS-API] Failed to send to ${smsEmail}:`, response.status, errorText);
          failedEmails.push({ email: smsEmail, error: errorText });
        } else {
          const responseData = await response.json();
          console.log(`📱 [SMS-API] Successfully sent to ${smsEmail}:`, responseData);
          sentEmails.push(smsEmail);
        }
      } catch (error) {
        console.error(`📱 [SMS-API] Error sending to ${smsEmail}:`, error);
        failedEmails.push({
          email: smsEmail,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log("📱 [SMS-API] SMS sending completed:");
    console.log("  - Sent:", sentEmails.length);
    console.log("  - Failed:", failedEmails.length);
    console.log("  - Sent emails:", sentEmails);
    console.log("  - Failed emails:", failedEmails);

    if (sentEmails.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Message sent successfully to CAPCo Fire, Someone will respond to you shortly.`,
          totalSent: sentEmails.length,
          totalFailed: failedEmails.length,
          sentEmails: sentEmails,
          failedEmails: failedEmails,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send SMS to any recipients",
          totalSent: 0,
          totalFailed: failedEmails.length,
          sentEmails: [],
          failedEmails: failedEmails,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("📱 [SMS-API] SMS API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        totalSent: 0,
        totalFailed: 0,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
