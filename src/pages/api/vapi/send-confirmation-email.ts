import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { getApiBaseUrl } from "../../../lib/url-utils";
// import {supabase} from "../../../lib/supabase";
// import {SimpleProjectLogger} from "../../../lib/simple-logging";

interface ConfirmationEmailRequest {
  name: string;
  email: string;
  appointmentDetails: {
    time?: string;
    date?: string;
    duration?: string;
    location?: string;
    meetingType?: string;
  };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Skip authentication check for VAPI tool calls
    // VAPI tools don't have user session context
    const isVapiCall =
      request.headers.get("X-Vapi-System") === "true" ||
      request.headers.get("User-Agent")?.includes("Vapi") ||
      request.url.includes("/api/vapi/");

    if (!isVapiCall) {
      // Only check authentication for non-VAPI calls
      const { isAuth, currentUser } = await checkAuth(cookies);
      if (!isAuth || !currentUser) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const body: ConfirmationEmailRequest = await request.json();
    const { name, email, appointmentDetails } = body;

    console.log(`📧 [VAPI-CONFIRMATION-EMAIL] Sending confirmation email to:`, {
      name,
      email,
      appointmentDetails,
    });

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const baseUrl = getApiBaseUrl(request);

    // Create email content
    const emailSubject = `Appointment Confirmation - ${appointmentDetails.date || "Your Scheduled Meeting"}`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Confirmation</h2>
        
        <p>Dear ${name},</p>
        
        <p>Thank you for scheduling your appointment with CAPCo Fire Protection. Here are the details:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Appointment Details</h3>
          ${appointmentDetails.date ? `<p><strong>Date:</strong> ${appointmentDetails.date}</p>` : ""}
          ${appointmentDetails.time ? `<p><strong>Time:</strong> ${appointmentDetails.time}</p>` : ""}
          ${appointmentDetails.duration ? `<p><strong>Duration:</strong> ${appointmentDetails.duration}</p>` : ""}
          ${appointmentDetails.location ? `<p><strong>Location:</strong> ${appointmentDetails.location}</p>` : ""}
          ${appointmentDetails.meetingType ? `<p><strong>Meeting Type:</strong> ${appointmentDetails.meetingType}</p>` : ""}
        </div>
        
        <p><strong>Important:</strong> If you can gather your project documents in advance, that will help to expedite our services.</p>
        
        <p>If you need to reschedule or have any questions, please don't hesitate to contact us.</p>
        
        <p>We look forward to meeting with you!</p>
        
        <p>Best regards,<br>
        CAPCo Fire Protection Team</p>
      </div>
    `;

    // Get company data from database for fallback values
    let defaultFromName = "Company";
    let defaultFromEmail = "noreply@example.com";
    try {
      const { globalCompanyData } = await import("../global/global-company-data");
      const companyData = await globalCompanyData();
      defaultFromName = companyData.globalCompanyName || "Company";
      const websiteDomain =
        companyData.globalCompanyWebsite?.replace(/^https?:\/\//, "") || "example.com";
      defaultFromEmail = `noreply@${websiteDomain}`;
    } catch (error) {
      console.warn("📧 [VAPI-CONFIRMATION-EMAIL] Failed to load company data, using defaults");
    }

    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL || defaultFromEmail;
    const fromName = import.meta.env.FROM_NAME || defaultFromName;

    if (!emailApiKey) {
      console.error("📧 [VAPI-CONFIRMATION-EMAIL] EMAIL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = {
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: emailSubject,
      html: emailContent,
      text: emailContent
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      track_links: true,
      track_opens: true,
    };

    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${emailApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!emailResp.ok) {
      const errTxt = await emailResp.text();
      console.error("📧 [VAPI-CONFIRMATION-EMAIL] Resend error:", errTxt);
      return new Response(JSON.stringify({ success: false, error: "Email provider error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailResult = await emailResp.json();
    console.log("📧 [VAPI-CONFIRMATION-EMAIL] Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Confirmation email sent to ${email}`,
        emailResult: emailResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📧 [VAPI-CONFIRMATION-EMAIL] Error:", error);
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
