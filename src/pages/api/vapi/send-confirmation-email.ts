import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { getApiBaseUrl } from "../../../lib/url-utils";

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
    const isVapiCall = request.headers.get("X-Vapi-System") === "true" || 
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

    // Send email using the existing update-delivery API
    const emailResponse = await fetch(`${baseUrl}/api/delivery/update-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usersToNotify: [email],
        method: "email",
        emailSubject: emailSubject,
        emailContent: emailContent,
        buttonText: "View Our Website",
        buttonLink: `${baseUrl}`,
        currentUser: null, // VAPI calls don't have user context
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("📧 [VAPI-CONFIRMATION-EMAIL] Failed to send email:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send confirmation email",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const emailResult = await emailResponse.json();
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
