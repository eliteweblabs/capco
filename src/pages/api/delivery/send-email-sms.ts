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
    const globalCompanyName = import.meta.env.GLOBAL_COMPANY_NAME || "Edit Company Name Here";
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL || "noreply@capcofire.com";
    const fromName = import.meta.env.FROM_NAME || "CAPCo";
    const sentSms = [];
    const failedSms = [];
    const smsRecipients = [];
    let smsContent = "";

    // const isSmsGateway =
    // userEmail.includes("@vtext.com") ||
    // userEmail.includes("@txt.att.net") ||
    // userEmail.includes("@messaging.sprintpcs.com") ||
    // userEmail.includes("@tmomail.net") ||
    // userEmail.includes("@smsmyboostmobile.com") ||
    // userEmail.includes("@sms.cricketwireless.net");

    // else {
    //   // Remove button section entirely
    //   // emailHtml = emailHtml.replace(
    //   //   /<!-- Call to Action Button -->[\s\S]*?<!-- \/Call to Action Button -->/g,
    //   //   ""
    //   // );
    //   emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "");
    //   emailHtml = emailHtml.replace("{{BUTTON_LINK}}", "");
    // }

    // isSmsGateway
    //         ? {
    //             from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, // Consistent verified sender
    //             to: userEmail,
    //             subject: "", // Empty subject for SMS gateways
    //             text: emailContent.substring(0, 160), // Limit to 160 characters for SMS
    //             headers: {
    //               "X-SMS-Gateway": "true",
    //               "Content-Type": "text/plain; charset=UTF-8",
    //             },
    //           }
    //         :

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

    let subject = `${globalCompanyName} → New Web Msg`;
    if (contactInfo) {
      subject += `  → ${contactInfo}`;
    }

    smsContent += `: ${message}`;

    // Ensure content is not too long for SMS (most carriers have 160-320 character limits)
    if (smsContent.length > 250) {
      console.warn("📱 [SMS-API] Content is long for SMS:", smsContent.length, "characters");
      // Truncate if too long
      smsContent = smsContent.substring(0, 250) + "...";
    }

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

    // Send to each SMS gateway
    for (const smsEmail of smsRecipients) {
      try {
        console.log(`📱 [SMS-API] Sending to SMS gateway: ${smsEmail}`);

        const emailPayload = {
          from: `${fromName} <${fromEmail}>`,
          to: smsEmail,
          subject: subject,
          text: smsContent, // Plain text only for SMS gateways
        };

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
          failedSms.push({ email: smsEmail, error: errorText });
        } else {
          const responseData = await response.json();
          console.log(`📱 [SMS-API] Successfully sent to ${smsEmail}:`, responseData);
          sentSms.push(smsEmail);
        }
      } catch (error) {
        console.error(`📱 [SMS-API] Error sending to ${smsEmail}:`, error);
        failedSms.push({
          email: smsEmail,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (sentSms.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Message sent successfully to CAPCo Fire, Someone will respond to you shortly.`,
          totalSent: sentSms.length,
          totalFailed: failedSms.length,
          sentSms: sentSms,
          failedSms: failedSms,
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
          totalFailed: failedSms.length,
          sentSms: [],
          failedSms: failedSms,
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
