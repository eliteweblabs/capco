import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { SimpleProjectLogger } from "../../lib/simple-logging";

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
  try {
    // Get current user from authentication
    const body = await request.json();
    const { currentProject, newStatus, currentStatusData } = body;
    const projectId = currentProject.id;
    const oldStatus = currentProject.status;
    const authorProfile = currentProject.authorProfile;
    const assignedToProfile = currentProject.assignedToProfile;
    const { currentUser } = await checkAuth(cookies);

    // Debug logging for parameter validation
    if (!projectId || newStatus === undefined) {
      console.log("📊 [UPDATE-STATUS] Validation failed:", {
        projectId,
        newStatus,
        projectIdCheck: !projectId,
      });
      console.error("📊 [UPDATE-STATUS] Validation failed:", {
        projectId,
        newStatus,
        projectIdCheck: !projectId,
      });
      return new Response(
        JSON.stringify({
          error: "Project ID and new status are required",
          received: { projectId, newStatus },
          validation: {
            projectIdMissing: !projectId,
            newStatusMissing: newStatus === undefined,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the project status directly in the database
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("📊 [UPDATE-STATUS] Database update failed:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update project status" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Attach the author profile to the project object
    if (updatedProject && authorProfile) {
      (updatedProject as any).authorProfile = authorProfile;
    }

    // Attach the assigned to profile to the project object
    if (updatedProject && assignedToProfile) {
      (updatedProject as any).assignedToProfile = assignedToProfile;
    }

    // Log the status change to project activity
    try {
      console.log("📝 [UPDATE-STATUS] Logging status change:", {
        projectId,
        oldStatus,
        newStatus,
        user: currentUser?.email || "Unknown",
      });

      await SimpleProjectLogger.addLogEntry(
        projectId,
        "statusChange",
        `Status changed from ${oldStatus} to ${newStatus}`,
        {
          oldStatus,
          newStatus,
          changedBy: currentUser?.email || "Unknown",
          timestamp: new Date().toISOString(),
        }
      );

      console.log("✅ [UPDATE-STATUS] Status change logged successfully");
    } catch (logError) {
      console.error("❌ [UPDATE-STATUS] Error logging status change:", logError);
      // Don't fail the entire request if logging fails
    }

    // Simple validation
    if (!projectId || newStatus === undefined) {
      console.error("📊 [UPDATE-STATUS] Validation failed:", {
        projectId,
        newStatus,
        projectIdCheck: !projectId,
      });
      return new Response(
        JSON.stringify({
          error: "Project ID and new status are required",
          received: { projectId, newStatus },
          validation: {
            projectIdMissing: !projectId,
            newStatusMissing: newStatus === undefined,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let statusData = currentStatusData;

    // Only fetch from API if statusData not provided
    if (!statusData) {
      const baseUrl = request.url.split("/api")[0];
      const statusResponse = await fetch(`${baseUrl}/api/project-statuses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("Cookie") || "",
        },
        body: JSON.stringify({
          project: currentProject,
        }),
      });

      console.log("📊 [UPDATE-STATUS] Status response:", {
        ok: statusResponse.ok,
        status: statusResponse.status,
        statusText: statusResponse.statusText,
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();

        console.log("📊 [UPDATE-STATUS] Status result:", {
          hasStatuses: !!statusResult?.statuses,
          statusCount: statusResult?.statuses ? Object.keys(statusResult.statuses).length : 0,
          hasSelectOptions: !!statusResult?.selectOptions,
          fullResult: statusResult,
        });

        // Extract the specific status data from the statuses object
        // JavaScript object keys are strings, so convert newStatus to string
        const statusKey = String(newStatus);
        statusData = statusResult.statuses?.[statusKey];

        console.log("📊 [UPDATE-STATUS] Extracted statusData for status", newStatus, ":", {
          statusData: statusData,
        });
      } else {
        console.error("📊 [UPDATE-STATUS] Failed to fetch status data:", statusResponse.status);
      }
    } else {
      console.log("📊 [UPDATE-STATUS] Using provided statusData, skipping database query");
    }

    console.log("📊 [UPDATE-STATUS] Final status data before return:", {
      hasStatusData: !!statusData,
      statusData: statusData,
    });
    // Return the same structure as get-project API for status updates
    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject,
        statusData: statusData,
        currentUser: currentUser,
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
    console.error("📊 [UPDATE-STATUS] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
