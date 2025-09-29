import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";

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

    // Determine old status - use passed data if available, otherwise fetch from database
    let finalOldStatus;
    if (oldStatus) {
      finalOldStatus = oldStatus;
    } else if (currentProject?.status !== undefined) {
      // Use passed project data (95% of cases)
      finalOldStatus = currentProject.status;
      console.log("📊 [UPDATE-STATUS] Using passed project data for old status:", finalOldStatus);
    } else {
      // Fallback to database fetch (5% of cases)
      if (!supabase!) {
        return new Response(JSON.stringify({ error: "Database connection not available" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: fetchedProject, error: fetchError } = await supabase!
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();

      if (fetchError) {
        console.error("📊 [UPDATE-STATUS] Error fetching current project:", fetchError);
        return new Response(JSON.stringify({ error: "Failed to fetch current project status" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      finalOldStatus = fetchedProject.status;
      console.log("📊 [UPDATE-STATUS] Fetched old status from database:", finalOldStatus);
    }

    console.log("📊 [UPDATE-STATUS] Updating project status directly:", {
      projectId,
      newStatus,
      oldStatus,
    });

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
        updated_at: new Date().toISOString(),
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

    // Log the status change using authenticated user
    try {
      // console.log("📊 [UPDATE-STATUS] Logging status change for user:", currentUser.id);
      await SimpleProjectLogger.addLogEntry(
        projectId,
        "status_change",
        currentUser,
        `Status changed from ${finalOldStatus} to ${newStatus}`,
        undefined,
        request.headers.get("Cookie") || ""
      ); // console.log("📊 [UPDATE-STATUS] Status change logged successfully");
    } catch (logError) {
      console.error("📊 [UPDATE-STATUS] Failed to log status change:", logError);
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

    // Fetch status data if not provided
    let statusData = currentStatusData;
    if (!statusData) {
      try {
        console.log("📊 [UPDATE-STATUS] Fetching status data for new status:", newStatus);
        const baseUrl = request.url.split("/api")[0];
        // Use POST method to pass project data in body for placeholder processing
        const statusResponse = await fetch(`${baseUrl}/api/project-statuses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            project: currentProject,
            status: newStatus,
          }),
        });

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          // Extract just the specific status data for the new status
          // Convert newStatus to number to match the statuses object keys
          const statusKey = parseInt(newStatus.toString());
          statusData = statusResult.statuses?.[statusKey] || null;
          console.log(
            "📊 [UPDATE-STATUS] Fetched status data:",
            !!statusData,
            "for status:",
            statusKey
          );
        } else {
          console.error("📊 [UPDATE-STATUS] Failed to fetch status data:", statusResponse.status);
        }
      } catch (error) {
        console.error("📊 [UPDATE-STATUS] Error fetching status data:", error);
        // Continue without status data if fetch fails
      }
    }

    // Return the same structure as get-project API
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
