import type { APIRoute } from "astro";
import { sendSmsViaEmail, sendProjectStatusSms, validatePhoneNumber } from "../../lib/sms-utils";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  // console.log("📱 [SEND-SMS] SMS API called");

  try {
    if (!supabase) {
      console.error("📱 [SEND-SMS] Supabase not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the current user session
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Set session to get current user
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    });

    if (sessionError || !sessionData.session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid session",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const currentUser = sessionData.session.user;
    const userRole = currentUser.user_metadata?.role || "Client";

    // Only allow Admin/Staff to send SMS
    if (userRole !== "Admin" && userRole !== "Staff") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Admin/Staff access required",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { 
      phoneNumber, 
      carrier, 
      message, 
      projectId, 
      projectTitle, 
      newStatus, 
      projectAddress 
    } = body;

    // Validate required fields
    if (!phoneNumber || !carrier || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: phoneNumber, carrier, message",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: phoneValidation.error,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send SMS
    let result;
    if (projectId && projectTitle && newStatus) {
      // Send project status SMS
      result = await sendProjectStatusSms(
        phoneValidation.cleaned!,
        carrier,
        projectTitle,
        newStatus,
        projectAddress
      );
    } else {
      // Send custom SMS
      result = await sendSmsViaEmail({
        to: phoneValidation.cleaned!,
        carrier,
        message,
        subject: "CAPCo Fire Protection"
      });
    }

    if (result.success) {
      // console.log("📱 [SEND-SMS] SMS sent successfully:", result.emailAddress);
      
      // Log SMS activity to database (optional)
      try {
        await supabase.from("activity_log").insert({
          user_id: currentUser.id,
          action: "sms_sent",
          details: {
            phone_number: phoneValidation.cleaned,
            carrier,
            message_length: message.length,
            email_address: result.emailAddress
          },
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error("📱 [SEND-SMS] Failed to log SMS activity:", logError);
        // Don't fail the request if logging fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "SMS sent successfully",
          emailAddress: result.emailAddress,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.error("📱 [SEND-SMS] Failed to send SMS:", result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || "Failed to send SMS",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    console.error("📱 [SEND-SMS] Unexpected error:", error);
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