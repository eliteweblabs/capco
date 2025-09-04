import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📊 [UPDATE-STATUS] API route called!");
  console.log("📊 [UPDATE-STATUS] ==========================================");
  console.log("📊 [UPDATE-STATUS] Timestamp:", new Date().toISOString());
  console.log("📊 [UPDATE-STATUS] Request method:", request.method);
  console.log("📊 [UPDATE-STATUS] Request URL:", request.url);
  console.log("📊 [UPDATE-STATUS] Has cookies:", !!cookies);
  console.log("📊 [UPDATE-STATUS] Has access token:", !!cookies.get("sb-access-token")?.value);
  console.log("📊 [UPDATE-STATUS] Has refresh token:", !!cookies.get("sb-refresh-token")?.value);

  // Also log to a file for debugging
  const fs = await import("fs");
  const logEntry = `[${new Date().toISOString()}] UPDATE-STATUS API called\n`;
  fs.appendFileSync("/tmp/astro-debug.log", logEntry);

  // Log more details to a separate file
  const detailedLogEntry = `[${new Date().toISOString()}] UPDATE-STATUS API called with cookies: ${!!cookies}, access token: ${!!cookies.get("sb-access-token")?.value}, refresh token: ${!!cookies.get("sb-refresh-token")?.value}\n`;
  fs.appendFileSync("/tmp/astro-detailed.log", detailedLogEntry);

  try {
    const body = await request.json();
    console.log("📊 [UPDATE-STATUS] Received request body:", JSON.stringify(body, null, 2));

    const { projectId, status: newStatus } = body;
    console.log("📊 [UPDATE-STATUS] Extracted parameters:", { projectId, newStatus });

    if (!projectId || newStatus === undefined) {
      console.log("📊 [UPDATE-STATUS] Missing required parameters:", { projectId, newStatus });
      return new Response(JSON.stringify({ error: "Project ID and new status are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      console.log("📊 [UPDATE-STATUS] Supabase client not available");
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user from session using tokens
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("📊 [UPDATE-STATUS] Authentication check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
    });

    if (!accessToken || !refreshToken) {
      console.log("📊 [UPDATE-STATUS] Missing authentication tokens");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    console.log("📊 [UPDATE-STATUS] Setting up session...");
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      console.log("📊 [UPDATE-STATUS] Session error:", sessionError);
      console.log("📊 [UPDATE-STATUS] Session data:", session);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📊 [UPDATE-STATUS] User authenticated successfully:", {
      userId: session.session.user.id,
      userEmail: session.session.user.email,
    });

    // Update project status
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("📊 [UPDATE-STATUS] Database error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📊 [UPDATE-STATUS] Project status updated successfully:", {
      projectId,
      oldStatus: updatedProject.status,
      newStatus,
    });

    // Log the status change activity
    try {
      console.log("📊 [UPDATE-STATUS] Logging status change activity...");
      await SimpleProjectLogger.logStatusChange(
        projectId,
        session.session.user.email || "unknown",
        updatedProject.status,
        newStatus
      );
      console.log("📊 [UPDATE-STATUS] Status change activity logged successfully");
    } catch (logError) {
      console.error("📊 [UPDATE-STATUS] Error logging status change activity:", logError);
      // Don't fail the request if logging fails
    }

    // Get status configuration and send notifications
    const { data: statusConfig, error: statusError } = await supabase
      .from("project_statuses")
      .select("status_name, toast_admin, toast_client, est_time")
      .eq("status_code", newStatus)
      .single();

    // Send email notifications for status change
    let notificationMessage = "Status updated successfully";
    console.log("📊 [UPDATE-STATUS] Sending email notifications...");

    try {
      // Use the current request origin instead of environment variable
      const baseUrl = new URL(request.url).origin;
      console.log("📊 [UPDATE-STATUS] Base URL for email delivery:", baseUrl);
      console.log("📊 [UPDATE-STATUS] Full email delivery URL:", `${baseUrl}/api/email-delivery`);

      const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          newStatus,
          emailType: "update_status",
          usersToNotify: [
            { role: "Admin" },
            { role: "Staff" },
            { id: updatedProject.author_id }, // Project owner
          ],
        }),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log("📧 [UPDATE-STATUS] Email notifications sent successfully:", emailResult);
      } else {
        const errorText = await emailResponse.text();
        console.error("📧 [UPDATE-STATUS] Failed to send email notifications:", errorText);
      }
    } catch (emailError) {
      console.error("📊 [UPDATE-STATUS] Error sending email notifications:", emailError);
      // Don't fail the request if email notifications fail
    }

    // Get toast message for UI feedback
    console.log("📊 [UPDATE-STATUS] Getting toast message configuration...");
    console.log("📊 [UPDATE-STATUS] Notification parameters:", {
      projectId,
      newStatus,
      hasUpdatedProject: !!updatedProject,
      projectTitle: updatedProject?.title,
      projectAddress: updatedProject?.address,
    });

    // Get toast message configuration
    try {
      // Log email notification activity
      try {
        console.log("📊 [UPDATE-STATUS] Logging email notification activity...");
        await SimpleProjectLogger.addLogEntry(
          projectId,
          "EMAIL_NOTIFICATION",
          session.session.user.email || "unknown",
          `Status change notification sent for status: ${statusConfig?.status_name || newStatus}`,
          null,
          newStatus
        );
        console.log("📊 [UPDATE-STATUS] Email notification activity logged successfully");
      } catch (emailLogError) {
        console.error(
          "📊 [UPDATE-STATUS] Error logging email notification activity:",
          emailLogError
        );
        // Don't fail the request if logging fails
      }

      // Use status config for message if available
      if (statusConfig) {
        console.log("📊 [UPDATE-STATUS] Status config found:", {
          toast_admin: statusConfig.toast_admin,
          toast_client: statusConfig.toast_client,
          est_time: statusConfig.est_time,
        });

        // Get user role from the current session instead of headers
        const accessToken = cookies.get("sb-access-token")?.value;
        const refreshToken = cookies.get("sb-refresh-token")?.value;

        let userRole = "Client"; // Default

        if (accessToken && refreshToken) {
          const { data: session } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (session.session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.session.user.id)
              .single();

            userRole = profile?.role || "Client";
          }
        }

        console.log("📊 [UPDATE-STATUS] User role determined:", userRole);

        let toastMessage = "";
        if (userRole === "Admin" || userRole === "Staff") {
          toastMessage = statusConfig.toast_admin || "";
        } else {
          toastMessage = statusConfig.toast_client || "";
        }

        console.log("📊 [UPDATE-STATUS] Selected toast message:", toastMessage);

        if (toastMessage) {
          // Get the actual client email from the project author
          let clientEmail = "Client"; // Default fallback

          if (updatedProject.author_id) {
            const { data: userData } = await supabaseAdmin!.auth.admin.getUserById(
              updatedProject.author_id
            );
            if (userData?.user?.email) {
              clientEmail = userData.user.email;
            }
          }

          // Replace placeholders
          toastMessage = toastMessage
            .replace(/{{PROJECT_TITLE}}/g, updatedProject.title || "Project")
            .replace(/{{CLIENT_EMAIL}}/g, clientEmail)
            .replace(/{{EST_TIME}}/g, statusConfig.est_time || "2-3 business days");
          notificationMessage = toastMessage;
          console.log("📊 [UPDATE-STATUS] Final notification message:", notificationMessage);
        } else {
          console.log("📊 [UPDATE-STATUS] No toast message found for role:", userRole);
        }
      } else {
        console.log("📊 [UPDATE-STATUS] No status config found for status:", newStatus);
      }
    } catch (emailError) {
      console.error("📊 [UPDATE-STATUS] Error sending status change notifications:", emailError);
      console.error(
        "📊 [UPDATE-STATUS] Error details:",
        emailError instanceof Error ? emailError.stack : "No stack trace"
      );
      // Don't fail the request if email notifications fail
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject,
        message: notificationMessage,
        statusConfig: statusConfig
          ? {
              name: statusConfig.status_name,
              toast_admin: statusConfig.toast_admin,
              toast_client: statusConfig.toast_client,
              est_time: statusConfig.est_time,
            }
          : null,
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
    console.error("📊 [UPDATE-STATUS] Catch block error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
