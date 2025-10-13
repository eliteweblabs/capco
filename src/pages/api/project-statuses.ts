import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders } from "../../lib/placeholder-utils";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";

export interface ProjectStatusesResponse {
  success: boolean;
  statuses: Record<
    number,
    {
      admin: any;
      client: any;
      current: any;
    }
  >;
  selectOptions: Array<{ value: string; label: string }>; // For form selects
}

// Helper function to get status data by code and role
export function getStatusData(
  statuses: Record<number, any>,
  statusCode: number,
  role: "admin" | "client" | "current" = "current"
) {
  return statuses[statusCode]?.[role] || null;
}

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const { currentUser } = await checkAuth(cookies);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get optional parameters for placeholder processing
    const projectParam = url.searchParams.get("project");
    const projectIdParam = url.searchParams.get("projectId");
    const statusCode = url.searchParams.get("status");

    let project: any = null;

    // Handle project data - either full project object or just project ID
    if (projectParam) {
      try {
        project = JSON.parse(decodeURIComponent(projectParam));
      } catch (error) {
        console.error("🔍 [PROJECT-STATUSES-API] Error parsing project object:", error);
        project = null;
      }
    } else if (projectIdParam) {
      try {
        const projectId = parseInt(projectIdParam);
        // console.log("🔍 [PROJECT-STATUSES-API] Fetching project data for ID:", projectId);

        // Fetch project data using get-project API
        const projectResponse = await fetch(`${getApiBaseUrl()}/api/get-project?id=${projectId}`, {
          headers: {
            Cookie: request.headers.get("Cookie") || "",
          },
        });
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          project = projectData.project || projectData;
        } else {
          console.error(
            "🔍 [PROJECT-STATUSES-API] Failed to fetch project data:",
            projectResponse.status
          );
        }
      } catch (error) {
        console.error("🔍 [PROJECT-STATUSES-API] Error fetching project data:", error);
      }
    }

    let statusesData: any;
    let statusesError: any;

    // If statusCode is provided, return specific status data
    if (statusCode) {
      const result = await supabaseAdmin
        .from("projectStatuses")
        .select("*")
        .eq("statusCode", statusCode)
        .single();

      statusesData = result.data;
      statusesError = result.error;

      if (statusesError) {
        console.error("❌ [PROJECT-STATUSES-API] Status not found:", statusesError);
        return new Response(JSON.stringify({ error: "Status not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Convert single object to array for consistent processing
      statusesData = [statusesData];
    } else {
      // Fetch all project statuses from database
      const result = await supabaseAdmin
        .from("projectStatuses")
        .select("*")
        .neq("statusCode", 0)
        .order("statusCode");

      statusesData = result.data;
      statusesError = result.error;

      if (statusesError) {
        console.error("❌ [PROJECT-STATUSES-API] Database error:", statusesError);
        return new Response(JSON.stringify({ error: "Failed to fetch statuses" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    let placeholderData: any = null;
    if (project) {
      placeholderData = {
        project: project,
      };
    }

    // Apply placeholder replacement to all string properties in statuses

    if (placeholderData) {
      statusesData.forEach((status: any) => {
        // Loop through all properties of the status object
        Object.keys(status).forEach((key) => {
          const value = status[key];
          placeholderData.project.estTime = statusesData.find(
            (s: any) => s.statusCode === status.statusCode
          )?.estTime;
          // Only process string values
          if (typeof value === "string" && value.trim()) {
            status[key] = replacePlaceholders(value, placeholderData);
            // console.log("🔍 [PROJECT-STATUSES-API] Key:", key, "Value:", status[key]);
          }
        });
      });

      console.log("🔍 [PROJECT-STATUSES-API] Applied placeholder replacement to all statuses");
    }

    // All simplified statuses structure: statuses[statusCode].{admin, client, current}
    const simplifiedStatuses: Record<number, { admin: any; client: any; current: any }> = {};

    // Debug: Log the current user's role
    console.log("🔍 [PROJECT-STATUSES-API] Current user role:", currentUser?.profile?.role);
    const isAdminOrStaff =
      currentUser?.profile?.role === "Admin" || currentUser?.profile?.role === "Staff";
    console.log("🔍 [PROJECT-STATUSES-API] Is admin or staff:", isAdminOrStaff);

    // Get admin and staff emails using reusable API
    const adminStaffResponse = await fetch(`${getApiBaseUrl()}/api/get-user-emails-by-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: ["Admin", "Staff"] }),
    });

    // console.log("🔍 [PROJECT-STATUSES-API] Admin/Staff response:", adminStaffResponse);

    let adminStaffEmails: any[] = [];
    let adminStaffUsers: any[] = [];
    if (adminStaffResponse.ok) {
      const adminStaffData = await adminStaffResponse.json();
      // console.log("📊 [PROJECT-STATUSES-API] Admin/Staff data:", adminStaffData);
      adminStaffEmails = adminStaffData.emails || [];
      adminStaffUsers = adminStaffData.staffUsers || [];
      // console.log("📊 [PROJECT-STATUSES-API] Admin/Staff emails:", adminStaffEmails);
      // console.log("📊 [PROJECT-STATUSES-API] Admin/Staff users:", adminStaffUsers);
    } else {
      console.error("📊 [UPDATE-STATUS] Failed to fetch admin/staff emails");
    }

    statusesData.forEach((status: any) => {
      const statusCode = status.statusCode;
      if (statusCode) {
        const usersToNotify = adminStaffUsers
          .filter((user: any) => status.emailToRoles?.includes(user.role))
          .map((user: any) => user.email)
          .filter((email: string) => email); // Remove any undefined emails

        simplifiedStatuses[statusCode] = {
          admin: {
            email: {
              usersToNotify: usersToNotify,
              emailToRoles: status.emailToRoles,
              emailSubject: status.adminEmailSubject,
              emailContent: status.adminEmailContent,
              method: "internal",
              buttonText: status.buttonText,
              buttonLink: status.buttonLink,
              skipTracking: true,
            },
            statusName: status.adminStatusName,
            statusAction: status.adminStatusAction,
            statusColor: status.statusColor,
            statusSlug: status.statusSlug,
            statusTab: status.adminStatusTab,
            // modal: {
            //   type: "info",
            //   persist: false,
            //   message: status.modalAdmin,
            //   title: "Project Updated",
            //   redirect: {
            //     url: status.modalAutoRedirectAdmin,
            //     showCountdown: true,
            //   },
            // },
          },
          client: {
            email: {
              usersToNotify: [project?.authorProfile?.email],
              emailSubject: status.clientEmailSubject,
              emailContent: status.clientEmailContent,
              method: "magicLink",
              buttonText: status.buttonText,
              buttonLink: status.buttonLink,
              skipTracking: true,
            },
            statusName: status.clientStatusName,
            statusAction: status.clientStatusAction,
            statusColor: status.statusColor,
            statusSlug: status.statusSlug,
            statusTab: status.clientStatusTab,
            // modal: {
            //   type: "info",
            //   persist: false,
            //   message: status.modalClient,
            //   duration: 3000,
            //   title: "ClientProject Updated",
            //   redirect: {
            //     url: status.modalAutoRedirectClient,
            //     showCountdown: true,
            //   },
            // },
          },
          current: {
            email: {
              usersToNotify: isAdminOrStaff ? usersToNotify : [project?.authorProfile?.email],
              emailSubject: isAdminOrStaff ? status.adminEmailSubject : status.clientEmailSubject,
              emailContent: isAdminOrStaff ? status.adminEmailContent : status.clientEmailContent,
              method: isAdminOrStaff ? `internal` : "magicLink",
              buttonText: status.buttonText,
              buttonLink: status.buttonLink,
              skipTracking: isAdminOrStaff ? false : true,
            },

            statusName: isAdminOrStaff ? status.adminStatusName : status.clientStatusName,
            statusAction: isAdminOrStaff ? status.adminStatusAction : status.clientStatusAction,
            statusColor: status.statusColor,
            statusSlug: status.statusSlug,
            statusTab: isAdminOrStaff ? status.adminStatusTab : status.clientStatusTab,
            modal: {
              type: "info",
              persist: false, // false = close existing modals, true = keep existing modals
              message: isAdminOrStaff ? status.modalAdmin : status.modalClient,
              duration: 3000,
              title: "Project Updated",
              redirect: {
                url: isAdminOrStaff
                  ? status.modalAutoRedirectAdmin
                  : status.modalAutoRedirectClient,
                showCountdown: true, // Show countdown in message
              },
            },
          },
        };
      }
    });

    // Create select options for forms (using already-processed current values)
    const selectOptions = Object.entries(simplifiedStatuses).map(([statusCode, statusData]) => ({
      value: statusCode,
      label:
        statusData.current.statusName.replace(/<[^>]*>/g, "") +
        " / " +
        (statusesData.find((s: any) => s.statusCode === parseInt(statusCode))?.estTime === null
          ? "No Est. Time Value"
          : statusesData
              .find((s: any) => s.statusCode === parseInt(statusCode))
              ?.estTime.replace(/<[^>]*>/g, "")),
    }));

    const response: ProjectStatusesResponse = {
      success: true,
      statuses: simplifiedStatuses,
      selectOptions,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [PROJECT-STATUSES-API] Unexpected error:", error);
    return new Response(
      JSON.stringify({
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

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("🔍 [PROJECT-STATUSES-API] POST method called!");
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get project data from request body
    const requestBody = await request.json();
    const { project, projectId } = requestBody;

    let projectData: any = null;

    // Handle project data - either full project object or just project ID
    if (project && typeof project === "object" && project.id) {
      projectData = project;
    } else if (projectId) {
      try {
        const parsedProjectId = parseInt(projectId);

        // Fetch project data using get-project API
        const projectResponse = await fetch(
          `${getApiBaseUrl()}/api/get-project?id=${parsedProjectId}`
        );
        if (projectResponse.ok) {
          const responseData = await projectResponse.json();
          projectData = responseData.project || responseData;
        } else {
          console.error(
            "🔍 [PROJECT-STATUSES-API] Failed to fetch project data:",
            projectResponse.status
          );
        }
      } catch (error) {
        console.error("🔍 [PROJECT-STATUSES-API] Error fetching project data:", error);
      }
    }

    // Authentication will be handled at the single point of truth (logging function)
    // No need to pass currentUser around - it will be determined where needed

    // Fetch all project statuses from database
    const { data: statusesData, error: statusesError } = await supabaseAdmin
      .from("projectStatuses")
      .select("*")
      .neq("statusCode", 0)
      .order("statusCode");

    if (statusesError) {
      console.error("❌ [PROJECT-STATUSES-API] Database error:", statusesError);
      return new Response(JSON.stringify({ error: "Failed to fetch statuses" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare placeholder data from request body
    let placeholderData: any = null;
    if (projectData) {
      placeholderData = {
        project: projectData,
      };
    }

    // Apply placeholder replacement to all string properties in statuses
    if (placeholderData) {
      statusesData.forEach((status: any) => {
        // Loop through all properties of the status object
        Object.keys(status).forEach((key) => {
          const value = status[key];

          placeholderData.project.estTime = statusesData.find(
            (s: any) => s.statusCode === status.statusCode
          )?.estTime;
          // Only process string values
          if (typeof value === "string" && value.trim()) {
            status[key] = replacePlaceholders(value, placeholderData);
          }
        });
      });
    }

    // Get admin and staff emails using reusable API (same as GET route)
    const adminStaffResponse = await fetch(`${getApiBaseUrl()}/api/get-user-emails-by-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: ["Admin", "Staff"] }),
    });

    let adminStaffEmails: any[] = [];
    let adminStaffUsers: any[] = [];
    if (adminStaffResponse.ok) {
      const adminStaffData = await adminStaffResponse.json();
      adminStaffEmails = adminStaffData.emails || [];
      adminStaffUsers = adminStaffData.staffUsers || [];
    } else {
      console.error("📊 [PROJECT-STATUSES-API] Failed to fetch admin/staff emails");
    }

    // All simplified statuses structure: statuses[statusCode].{admin, client, current}
    const simplifiedStatuses: Record<number, { admin: any; client: any; current: any }> = {};

    statusesData.forEach((status: any) => {
      const statusCode = status.statusCode;
      if (statusCode) {
        const usersToNotify = adminStaffUsers
          .filter((user: any) => status.emailToRoles?.includes(user.role))
          .map((user: any) => user.email)
          .filter((email: string) => email); // Remove any undefined emails

        simplifiedStatuses[statusCode] = {
          admin: {
            email: {
              usersToNotify: usersToNotify,
              emailToRoles: status.emailToRoles,
              emailSubject: status.adminEmailSubject,
              emailContent: status.adminEmailContent,
              method: "internal",
              buttonText: status.buttonText,
              buttonLink: status.buttonLink,
              skipTracking: true,
            },
            statusName: status.adminStatusName,
            statusAction: status.adminStatusAction,
            statusColor: status.statusColor,
            statusSlug: status.statusSlug,
            statusTab: status.adminStatusTab,
            // modal: {
            //   type: "info",
            //   persist: false,
            //   message: status.modalAdmin,
            //   title: "Project Updated",
            //   redirect: {
            //     url: status.modalAutoRedirectAdmin,
            //     showCountdown: true,
            //   },
            //   showCountdown: true,
            //   duration: 3000,
            //   estTime: status.estTime,
            // },
          },
          client: {
            email: {
              usersToNotify: [projectData?.authorProfile?.email],
              emailSubject: status.clientEmailSubject,
              emailContent: status.clientEmailContent,
              method: "magicLink",
              buttonText: status.buttonText,
              buttonLink: status.buttonLink,
              skipTracking: true,
            },
            statusName: status.clientStatusName,
            statusAction: status.clientStatusAction,
            statusColor: status.statusColor,
            statusSlug: status.statusSlug,
            statusTab: status.clientStatusTab,
            // modal: {
            //   type: "info",
            //   persist: false,
            //   message: status.modalClient,
            //   title: "ClientProject Updated",
            //   redirect: {
            //     url: status.modalAutoRedirectClient,
            //     showCountdown: true,
            //   },
            //   showCountdown: true,
            //   duration: 3000,
            //   estTime: status.estTime,
            // },
          },
          current: {
            email: {
              usersToNotify: isAdminOrStaff ? usersToNotify : [projectData?.authorProfile?.email],
              emailSubject: isAdminOrStaff ? status.adminEmailSubject : status.clientEmailSubject,
              emailContent: isAdminOrStaff ? status.adminEmailContent : status.clientEmailContent,
              method: isAdminOrStaff ? `internal` : "magicLink",
              buttonText: status.buttonText,
              buttonLink: status.buttonLink,
              skipTracking: isAdminOrStaff ? false : true,
            },
            statusName: isAdminOrStaff ? status.adminStatusName : status.clientStatusName,
            statusAction: isAdminOrStaff ? status.adminStatusAction : status.clientStatusAction,
            statusColor: status.statusColor,
            statusSlug: status.statusSlug,
            statusTab: isAdminOrStaff ? status.adminStatusTab : status.clientStatusTab,
            modal: {
              type: "info",
              persist: false, // false = close existing modals, true = keep existing modals
              message: isAdminOrStaff ? status.modalAdmin : status.modalClient,
              title: "Project Updated",
              redirect: {
                url: isAdminOrStaff
                  ? status.modalAutoRedirectAdmin
                  : status.modalAutoRedirectClient,
                showCountdown: true, // Show countdown in message
              },
              duration: 3000,
              estTime: status.estTime,
            },
          },
        };
      }
    });

    // Create select options for forms (using already-processed current values)
    const selectOptions = Object.entries(simplifiedStatuses).map(([statusCode, statusData]) => ({
      value: statusCode,
      label:
        statusData.current.statusName.replace(/<[^>]*>/g, "") +
        " / " +
        (statusesData.find((s: any) => s.statusCode === parseInt(statusCode))?.estTime === null
          ? "No Est. Time Value"
          : statusesData
              .find((s: any) => s.statusCode === parseInt(statusCode))
              ?.estTime.replace(/<[^>]*>/g, "")),
    }));

    const response: ProjectStatusesResponse = {
      success: true,
      statuses: simplifiedStatuses,
      selectOptions,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [PROJECT-STATUSES-API] POST Error:", error);
    return new Response(
      JSON.stringify({
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
