import type { APIRoute } from "astro";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const phone = formData.get("phone") as string;
    const carrier = formData.get("carrier") as string;
    const message = formData.get("message") as string;
    const contactInfo = formData.get("contact_info") as string;

    console.log("📱 [SMS-API] SMS request received:", {
      phone: phone ? "***" + phone.slice(-4) : "none",
      carrier,
      messageLength: message?.length || 0,
      hasContactInfo: !!contactInfo,
    });

    if (!phone || !carrier || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Phone, carrier, and message are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Construct the SMS email address
    const smsEmail = `${phone}${carrier}`;

    // Format the message with context
    let emailContent = `CAPCo Website Contact:\n\n${message}`;

    if (contactInfo) {
      emailContent += `\n\nContact Info: ${contactInfo}`;
    }

    emailContent += `\n\nSent via CAPCo Website`;

    // Use the existing email delivery system
    const baseUrl = getApiBaseUrl(request);
    console.log("📱 [SMS] Using base URL for email delivery:", baseUrl);
    const emailResponse = await fetch(
      `${baseUrl}/api/email-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailType: "emergency_sms",
          custom_subject: "CAPCo Website Contact",
          email_content: emailContent,
          usersToNotify: [{ email: smsEmail }], // Send to SMS gateway
        }),
      }
    );

    const emailResult = await emailResponse.json();

    if (emailResult.success) {
      console.log("📱 [SMS-API] SMS sent successfully to:", smsEmail);
      return new Response(
        JSON.stringify({
          success: true,
          message: "SMS sent successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.error("📱 [SMS-API] Failed to send SMS:", emailResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send SMS: " + emailResult.error,
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
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
