import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Handle both form data and JSON requests
    let message: string;
    let contactInfo: string;

    const contentType = request.headers.get("content-type");
    console.log("📧 [EMAIL-API] Request content-type:", contentType);

    if (contentType?.includes("application/json")) {
      // Handle JSON request
      const jsonData = await request.json();
      message = jsonData.message;
      contactInfo = jsonData.contact_info || jsonData.contactInfo;
    } else {
      // Handle form data request
      const formData = await request.formData();
      message = formData.get("message") as string;
      contactInfo = formData.get("contact_info") as string;
    }

    // SMS functionality commented out to avoid gateway bounces
    // const phone1 = formData.get("phone1") as string;
    // const carrier1 = formData.get("carrier1") as string;
    // const phone2 = formData.get("phone2") as string;
    // const carrier2 = formData.get("carrier2") as string;

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

    // console.log("📧 [EMAIL-API] Sending to email recipients:", emailRecipients);

    // // Get the email API key (using RESEND_API_KEY for consistency)
    // const emailApiKey = import.meta.env.RESEND_API_KEY;

    // if (!emailApiKey) {
    //   console.error("📧 [EMAIL-API] RESEND_API_KEY not found in environment");
    //   return new Response(
    //     JSON.stringify({
    //       success: false,
    //       error: "Email service not configured",
    //       totalSent: 0,
    //       totalFailed: emailRecipients.length,
    //     }),
    //     {
    //       status: 500,
    //       headers: { "Content-Type": "application/json" },
    //     }
    //   );
    // }

    //

    // Fixed email recipients (instead of SMS gateways)
    const emailRecipients = ["capco@eliteweblabs.com", "jk@capcofire.com"];

    const response = await fetch(
      `${process.env.NODE_ENV === "development" ? "http://localhost:4321" : "https://your-domain.com"}/api/email-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usersToNotify: ["jk@capcofire.com", "capco@eliteweblabs.com"],
          emailSubject: `New Message from ${contactInfo || "Contact Form"}`,
          emailContent: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📧 [EMAIL-API] Failed to send email:`, response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send email",
          totalSent: 0,
          totalFailed: 1,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      const responseData = await response.json();
      console.log(`📧 [EMAIL-API] Successfully sent email:`, responseData);
      return new Response(
        JSON.stringify({
          success: true,
          totalSent: 1,
          totalFailed: 0,
          message: "Email sent successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // return new Response(
    //   JSON.stringify({
    //     success: sentEmails.length > 0,
    //     totalSent: sentEmails.length,
    //     totalFailed: failedEmails.length,
    //     sentEmails,
    //     failedEmails,
    //     message: `Sent ${sentEmails.length} emails, ${failedEmails.length} failed`,
    //   }),
    //   {
    //     status: sentEmails.length > 0 ? 200 : 500,
    //     headers: { "Content-Type": "application/json" },
    //   }
    // );
  } catch (error) {
    console.error("📧 [EMAIL-API] Unexpected error:", error);

    // Log additional details for debugging
    if (error instanceof Error) {
      console.error("📧 [EMAIL-API] Error name:", error.name);
      console.error("📧 [EMAIL-API] Error message:", error.message);
      console.error("📧 [EMAIL-API] Error stack:", error.stack);
    }

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
