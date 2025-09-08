import type { APIRoute } from "astro";
import { getApiBaseUrl } from "../../lib/url-utils";

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
    let emailContent = `CAPCo Contact`;

    if (contactInfo) {
      emailContent += ` from ${contactInfo}`;
    }

    emailContent += `:\n\n${message}\n\nCAPCo Website`;

    // Debug: Log the full email content being sent
    console.log("📱 [SMS-API] Full email content being sent:");
    console.log("📱 [SMS-API] Content length:", emailContent.length);
    console.log(
      "📱 [SMS-API] Content preview:",
      emailContent.substring(0, 200) + (emailContent.length > 200 ? "..." : "")
    );

    // Use the existing email delivery system
    const baseUrl = getApiBaseUrl(request);
    console.log("📱 [SMS] Using base URL for email delivery:", baseUrl);
    console.log("📱 [SMS] Sending to recipients:", smsRecipients);

    const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailType: "emergency_sms",
        emailSubject: "CAPCo Website Contact",
        emailContent: emailContent,
        usersToNotify: smsRecipients.map((email) => ({ email })), // Send to all SMS gateways
      }),
    });

    const emailResult = await emailResponse.json();

    if (emailResult.success) {
      console.log("📱 [SMS-API] SMS sent successfully to:", smsRecipients);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Message sent successfully to CAPCo Fire, Someone will respond to you shortly.`,
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
