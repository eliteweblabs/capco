import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    // SMS functionality commented out to avoid gateway bounces
    // const phone1 = formData.get("phone1") as string;
    // const carrier1 = formData.get("carrier1") as string;
    // const phone2 = formData.get("phone2") as string;
    // const carrier2 = formData.get("carrier2") as string;
    
    const message = formData.get("message") as string;
    const contactInfo = formData.get("contact_info") as string;

    console.log("📧 [EMAIL-API] Email notification request received:", {
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

    // Fixed email recipients (instead of SMS gateways)
    const emailRecipients = [
      "capco@eliteweblabs.com",
      "jk@capcofire.com"
    ];

    console.log("📧 [EMAIL-API] Sending to email recipients:", emailRecipients);

    // Get the email API key (using RESEND_API_KEY for consistency)
    const emailApiKey = import.meta.env.RESEND_API_KEY;

    if (!emailApiKey) {
      console.error("📧 [EMAIL-API] RESEND_API_KEY not found in environment");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured",
          totalSent: 0,
          totalFailed: emailRecipients.length,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create email content (no SMS length restrictions)
    const emailContent = `${message}\n\n${contactInfo ? `Contact Information:\n${contactInfo}` : ""}`;
    
    const sentEmails = [];
    const failedEmails = [];

    // Send to each email recipient
    for (const emailAddress of emailRecipients) {
      try {
        console.log(`📧 [EMAIL-API] Sending to email: ${emailAddress}`);

        const emailPayload = {
          from: `CAPCo Fire <noreply@capcofire.com>`,
          to: emailAddress,
          subject: "CAPCo Fire Protection - Project Notification",
          text: emailContent,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">CAPCo Fire Protection</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="white-space: pre-line; margin: 0;">${message}</p>
              </div>
              ${contactInfo ? `
                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
                  <h3 style="color: #6b7280; font-size: 16px;">Contact Information:</h3>
                  <p style="white-space: pre-line; color: #374151;">${contactInfo}</p>
                </div>
              ` : ''}
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated notification from CAPCo Fire Protection Systems.
              </p>
            </div>
          `
        };

        console.log("📧 [EMAIL-API] Email payload:", {
          to: emailAddress,
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
          console.error(`📧 [EMAIL-API] Failed to send to ${emailAddress}:`, response.status, errorText);
          failedEmails.push({ email: emailAddress, error: errorText });
        } else {
          const responseData = await response.json();
          console.log(`📧 [EMAIL-API] Successfully sent to ${emailAddress}:`, responseData);
          sentEmails.push(emailAddress);
        }
      } catch (error) {
        console.error(`📧 [EMAIL-API] Error sending to ${emailAddress}:`, error);
        failedEmails.push({
          email: emailAddress,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log("📧 [EMAIL-API] Email sending completed:");
    console.log("  - Sent:", sentEmails.length);
    console.log("  - Failed:", failedEmails.length);
    console.log("  - Sent emails:", sentEmails);
    console.log("  - Failed emails:", failedEmails);

    return new Response(
      JSON.stringify({
        success: sentEmails.length > 0,
        totalSent: sentEmails.length,
        totalFailed: failedEmails.length,
        sentEmails,
        failedEmails,
        message: `Sent ${sentEmails.length} emails, ${failedEmails.length} failed`,
      }),
      {
        status: sentEmails.length > 0 ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📧 [EMAIL-API] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/*
=== SMS FUNCTIONALITY DISABLED ===
The following SMS gateway functionality has been commented out due to carrier bounce issues.
To re-enable SMS, uncomment the code above and restore the phone/carrier form fields.

SMS Carriers that were supported:
- Verizon: @vtext.com (frequently bounces)
- AT&T: @txt.att.net
- T-Mobile: @tmomail.net
- Sprint: @messaging.sprintpcs.com
- And others...

For reliable SMS, consider switching to:
- Twilio ($0.0075/SMS)
- Vonage/Nexmo
- AWS SNS
- TextMagic

The current implementation sends emails to:
- capco@eliteweblabs.com
- jk@capcofire.com
*/