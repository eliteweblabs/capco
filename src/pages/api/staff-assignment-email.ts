import type { APIRoute } from "astro";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request }) => {
  // console.log("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] API called");

  try {
    const body = await request.json();
    const { projectId, staffId, staffName, address } = body;

    // console.log("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Request data:", {
      projectId,
      staffId,
      staffName,
      address,
    });

    // Get admin and staff emails using reusable API
    // console.log("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Fetching admin and staff emails...");
    const baseUrl = getApiBaseUrl(request);

    const adminStaffResponse = await fetch(`${baseUrl}/api/get-user-emails-by-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: ["Admin", "Staff"] }),
    });

    let adminStaffEmails = [];
    if (adminStaffResponse.ok) {
      const adminStaffData = await adminStaffResponse.json();
      adminStaffEmails = adminStaffData.emails || [];
      // console.log("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Admin/Staff emails:", adminStaffEmails);
    } else {
      console.error("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Failed to fetch admin/staff emails");
    }

    // Get the assigned staff member's email
    let staffEmail = null;
    if (staffId) {
      const staffResponse = await fetch(`${baseUrl}/api/get-user-emails-by-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [staffId] }),
      });

      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        staffEmail = staffData.emails?.[0] || null;
        // console.log("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Assigned staff email:", staffEmail);
      } else {
        console.error("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Failed to fetch assigned staff email");
      }
    }

    // Combine all emails to notify
    const allEmailsToNotify = [...adminStaffEmails];
    if (staffEmail && !adminStaffEmails.includes(staffEmail)) {
      allEmailsToNotify.push(staffEmail);
    }

    // console.log("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] All emails to notify:", allEmailsToNotify);

    // Send email using the email delivery API
    const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usersToNotify: allEmailsToNotify,
        emailType: "staff_assignment",
        emailSubject: `Project Assignment > ${address} > ${staffName}`,
        emailContent: `<b>${address}</b> has been assigned to <b>${staffName}</b>. Please review the project details and take appropriate action.`,
        buttonLink: `${baseUrl}/project/${projectId}`,
        buttonText: "View Project",
      }),
    });

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      // console.log("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Email sent successfully:", emailResult);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Staff assignment email sent successfully",
          emailsSent: allEmailsToNotify.length,
          recipients: allEmailsToNotify,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      const errorText = await emailResponse.text();
      console.error("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Failed to send email:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send staff assignment email",
          details: errorText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("🧑‍💼 [STAFF-ASSIGNMENT-EMAIL] Error:", error);
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
