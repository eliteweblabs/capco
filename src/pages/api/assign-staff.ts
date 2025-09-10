import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("📧 [ASSIGN-STAFF] API received:", body);

    const { projectId, assigned_to_id, assigned_to_name } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      // For demo purposes, simulate a successful assignment when database is not configured
      return new Response(
        JSON.stringify({
          success: true,
          message: `Demo: Project ${projectId} assigned to ${assigned_to_name || "Unassigned"} (No database interaction)`,
          notificationData: {
            type: "success",
            title: "Staff Assigned",
            message: `Project assigned to ${assigned_to_name || "Unassigned"}`,
            duration: 3000,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the project with the new staff assignment
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .update({
        assigned_to_id: assigned_to_id || null,
        updated_at: new Date().toISOString(),
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

    console.log("📧 [ASSIGN-STAFF] Project updated successfully:", projectData);

    // If a staff member was assigned (not unassigned), send email notification
    if (assigned_to_id && assigned_to_name) {
      try {
        // Get project details for email
        const { data: projectDetails, error: projectDetailsError } = await supabase
          .from("projects")
          .select("id, title, address, author_id")
          .eq("id", projectId)
          .single();

        if (projectDetailsError) {
          console.error("📧 [ASSIGN-STAFF] Error fetching project details:", projectDetailsError);
        } else {
          // Get admin emails only
          console.log("📧 [ASSIGN-STAFF] Fetching admin emails...");
          const baseUrl = getApiBaseUrl(request);

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

          // Get the assigned staff member's email directly from database
          let staffEmail = null;
          const { data: staffData, error: staffError } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", assigned_to_id)
            .single();

          if (staffError) {
            console.error("📧 [ASSIGN-STAFF] Error fetching assigned staff email:", staffError);
          } else {
            staffEmail = staffData?.email || null;
            console.log("📧 [ASSIGN-STAFF] Assigned staff email:", staffEmail);
          }

          // Send email to assigned staff member
          if (staffEmail) {
            console.log("📧 [ASSIGN-STAFF] Sending staff email to:", staffEmail);
            const staffEmailData = {
              usersToNotify: [staffEmail],
              emailSubject: `New Project Assignment → ${projectDetails.address}`,
              emailContent: `You have been assigned to a new project: <b>${projectDetails.address}</b>. Please review the project details and begin work as needed.`,
              buttonLink: `${baseUrl}/project/${projectId}`,
              buttonText: "View Project",
            };
            console.log("📧 [ASSIGN-STAFF] Staff email data:", staffEmailData);

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
            console.log("📧 [ASSIGN-STAFF] Sending admin email to:", adminEmails);
            const adminEmailData = {
              usersToNotify: adminEmails,
              emailSubject: `Project Assigned → ${projectDetails.address} → ${assigned_to_name}`,
              emailContent: `Project <b>${projectDetails.address}</b> has been assigned to <b>${assigned_to_name}</b>. Please monitor progress and provide support as needed.`,
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
              console.log("📧 [ASSIGN-STAFF] Admin email sent successfully:", adminEmailResult);
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Project assigned to ${assigned_to_name || "Unassigned"}`,
        project: projectData,
        notificationData: {
          type: "success",
          title: "Staff Assigned",
          message: `Project assigned to ${assigned_to_name || "Unassigned"}`,
          duration: 3000,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
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
