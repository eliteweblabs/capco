import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("📧 [ASSIGN-STAFF] API received:", body);

    const { projectId, assignedToId, currentUser } = body;

    console.log("📧 [ASSIGN-STAFF] Project ID:", projectId);
    console.log("📧 [ASSIGN-STAFF] Assigned to ID:", assignedToId);

    // Get the assigned staff member's email, name, and company directly from database
    let staffEmail = null;
    let staffName = null;
    if (assignedToId && supabase) {
      console.log("📧 [ASSIGN-STAFF] Fetching staff data for ID:", assignedToId);
      const { data: staffData, error: staffError } = await supabase
        .from("profiles")
        .select("email, companyName")
        .eq("id", assignedToId)
        .single();

      if (staffError) {
        console.error("📧 [ASSIGN-STAFF] Error fetching assigned staff data:", staffError);
      } else {
        staffEmail = staffData?.email || null;
        staffName = staffData?.companyName || null;
        console.log("📧 [ASSIGN-STAFF] Staff data found:", { staffEmail, staffName });
      }
    } else {
      console.log("📧 [ASSIGN-STAFF] No assignedToId or supabase not available");
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    // Update the project with the new staff assignment
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .update({
        assignedToId: assignedToId || null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (projectError) {
      console.error("📧 [ASSIGN-STAFF] Database error:", projectError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update project assignment",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("📧 [ASSIGN-STAFF] Project updated successfully:", projectData);

    // If a staff member was assigned (not unassigned), send email notification
    if (assignedToId) {
      try {
        // Get project details for email
        const { data: projectDetails, error: projectDetailsError } = await supabase
          .from("projects")
          .select("id, title, address, authorId")
          .eq("id", projectId)
          .single();

        if (projectDetailsError) {
          console.error("📧 [ASSIGN-STAFF] Error fetching project details:", projectDetailsError);
        } else {
          // Get admin emails only
          console.log("📧 [ASSIGN-STAFF] Fetching admin emails...");
          const baseUrl = getApiBaseUrl(request);

          try {
            // console.log("📊 [ASSIGN-STAFF] Logging assignment change for user:", currentUser.id);
            await SimpleProjectLogger.addLogEntry(
              projectId,
              "assignment_changed",
              `Project Assigned → ${projectDetails.address} → ${staffName}`,
              undefined,
              request.headers.get("Cookie") || ""
            ); // console.log("📊 [ASSIGN-STAFF] Assignment change logged successfully");
          } catch (logError) {
            console.error("📊 [ASSIGN-STAFF] Failed to log assignment change:", logError);
            // Don't fail the entire request if logging fails
          }

          const adminResponse = await fetch(`${baseUrl}/api/get-user-emails-by-role`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roles: ["Admin"] }),
          });

          let adminEmails = [];
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            adminEmails = adminData.emails || [];
            console.log("📧 [ASSIGN-STAFF] Admin emails:", adminEmails);
          } else {
            console.error("📧 [ASSIGN-STAFF] Failed to fetch admin emails");
          }

          // Send email to assigned staff member
          if (staffEmail) {
            // console.log("📧 [ASSIGN-STAFF] Sending staff email to:", staffEmail);
            const staffEmailData = {
              usersToNotify: [staffEmail],
              emailSubject: `New Project Assignment → ${projectDetails.address}`,
              emailContent: `You have been assigned to a new project: <b>${projectDetails.address}</b>. Please review the project details and begin work as needed.`,
              buttonLink: `${baseUrl}/project/${projectId}`,
              buttonText: "View Project",
            };
            // console.log("📧 [ASSIGN-STAFF] Staff email data:", staffEmailData);

            const staffEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(staffEmailData),
            });

            if (staffEmailResponse.ok) {
              const staffEmailResult = await staffEmailResponse.json();
              console.log("📧 [ASSIGN-STAFF] Staff email sent successfully:", staffEmailResult);
            } else {
              const errorText = await staffEmailResponse.text();
              console.error("📧 [ASSIGN-STAFF] Failed to send staff email:", errorText);
            }
          } else {
            console.log("📧 [ASSIGN-STAFF] No staff email to send - staffEmail is null");
          }

          // Send email to admins
          if (adminEmails.length > 0) {
            // console.log("📧 [ASSIGN-STAFF] Sending admin email to:", adminEmails);
            const adminEmailData = {
              usersToNotify: adminEmails,
              emailSubject: `Project Assigned → ${projectDetails.address} → ${staffName}`,
              emailContent: `Project <b>${projectDetails.address}</b> has been assigned to <b>${staffName}</b>. Please monitor progress and provide support as needed.`,
              buttonLink: `${baseUrl}/project/${projectId}`,
              buttonText: "View Project",
            };
            console.log("📧 [ASSIGN-STAFF] Admin email data:", adminEmailData);

            const adminEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(adminEmailData),
            });

            if (adminEmailResponse.ok) {
              const adminEmailResult = await adminEmailResponse.json();
              // console.log("📧 [ASSIGN-STAFF] Admin email sent successfully:", adminEmailResult);
            } else {
              const errorText = await adminEmailResponse.text();
              console.error("📧 [ASSIGN-STAFF] Failed to send admin email:", errorText);
            }
          } else {
            console.log("📧 [ASSIGN-STAFF] No admin emails to send - adminEmails array is empty");
          }
        }
      } catch (emailError) {
        console.error("📧 [ASSIGN-STAFF] Error sending email notification:", emailError);
        // Don't fail the assignment if email fails
      }
    }
    const baseUrl = getApiBaseUrl(request);

    return new Response(
      JSON.stringify({
        success: true,
        modalData: {
          type: "success",
          title: "Staff Assigned",
          message: `Project assigned to ${staffName || "Unassigned"}`,
          duration: 1500,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("📧 [ASSIGN-STAFF] Unexpected error:", error);
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
