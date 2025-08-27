import type { APIRoute } from "astro";
import { emailService } from "../../lib/email-service";

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const phone = formData.get("phone")?.toString();
    const carrier = formData.get("carrier")?.toString();
    const message = formData.get("message")?.toString();
    const projectId = formData.get("project_id")?.toString();
    const contactInfo = formData.get("contact_info")?.toString();

    // Validation
    if (!phone || !carrier || !message) {
      return redirect("/?error=sms_missing_fields");
    }

    // Validate phone number (should be 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return redirect("/?error=sms_invalid_phone");
    }

    // Validate carrier gateway
    const validCarriers = [
      "@txt.att.net",
      "@vtext.com",
      "@tmomail.net",
      "@messaging.sprintpcs.com",
      "@pm.sprint.com",
      "@myboostmobile.com",
      "@sms.cricketwireless.net",
      "@text.republicwireless.com",
      "@email.uscc.net",
      "@vmobl.com",
      "@mmst5.tracfone.com",
      "@mymetropcs.com",
      "@fido.ca",
      "@pcs.rogers.com",
      "@msg.telus.com",
    ];

    if (!validCarriers.includes(carrier)) {
      return redirect("/?error=sms_invalid_carrier");
    }

    // Construct email address
    const smsEmail = `${phone}${carrier}`;

    // Prepare email content
    const emailSubject = projectId
      ? `CAPCo Website Contact - ${projectId}`
      : "CAPCo Website Contact";

    // Build the message body with contact info if provided
    let emailBody = `Website Contact Message:\n\n${message.trim()}`;

    if (contactInfo && contactInfo.trim()) {
      emailBody += `\n\n---\nContact Info: ${contactInfo.trim()}`;
    }

    if (projectId && projectId.trim()) {
      emailBody += `\nProject Reference: ${projectId.trim()}`;
    }

    emailBody += `\n\nSent via CAPCo Website Contact Form`;

    // Log the attempt
    console.log("📱 [SMS] Attempting to send email-to-SMS:", {
      to: smsEmail,
      subject: emailSubject,
      body: emailBody.substring(0, 50) + "...",
      projectId: projectId || "none",
    });

    // Use your existing email service (you'll need to check what email service you have)
    // This is a placeholder - you'll need to integrate with your actual email service

    // Check if email service is configured
    const hasEmailConfig =
      process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
    
    // Log current environment for debugging
    console.log("📱 [SMS] Email config check:", {
      EMAIL_API_KEY: process.env.EMAIL_API_KEY ? "present" : "missing",
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "present" : "missing", 
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "not set",
      hasEmailConfig
    });

    if (!hasEmailConfig) {
      // Log the message for now if no email service configured
      console.log("📱 [SMS] Email service not configured. Message details:");
      console.log("📱 [SMS] To:", smsEmail);
      console.log("📱 [SMS] Subject:", emailSubject);
      console.log("📱 [SMS] Message:", emailBody);
      console.log(
        "📱 [SMS] Configure EMAIL_PROVIDER and EMAIL_API_KEY to enable actual SMS sending"
      );

      return redirect("/?message=sms_sent_success");
    }

    // Send email using your existing email service
    try {
      const result = await emailService.sendEmail({
        to: smsEmail,
        subject: emailSubject,
        text: emailBody,
        html: `<div style="font-family: sans-serif;">
          <p><strong>Website Contact Message:</strong></p>
          <p>${message.trim().replace(/\n/g, "<br>")}</p>
          ${contactInfo ? `<hr><p><strong>Contact Info:</strong> ${contactInfo.trim()}</p>` : ""}
          ${projectId ? `<p><strong>Project Reference:</strong> ${projectId.trim()}</p>` : ""}
          <hr>
          <p><em>Sent via CAPCo Website Contact Form</em></p>
        </div>`,
      });

      if (result.success) {
        console.log("📱 [SMS] Email-to-SMS sent successfully", result.messageId);
        return redirect("/?message=sms_sent_success");
      } else {
        console.error("📱 [SMS] Failed to send email-to-SMS:", result.error);
        return redirect("/?error=sms_send_failed");
      }
    } catch (emailError) {
      console.error("📱 [SMS] Email service error:", emailError);
      return redirect("/?error=sms_email_error");
    }
  } catch (error) {
    console.error("📱 [SMS] Unexpected error:", error);
    return redirect("/?error=sms_unexpected_error");
  }
};
