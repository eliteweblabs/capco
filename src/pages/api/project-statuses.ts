import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders } from "../../lib/placeholder-utils";
import { supabaseAdmin } from "../../lib/supabase-admin";

// Function to process status objects for role-based filtering and placeholder replacement
// function filteredStatusObj(statusObj: any, role: string, placeholderData?: any) {
//   // console.log("🔍 [PROJECT-LIST-ITEM] Status object:", statusObj);
//   let filteredStatusObj: any = {};

//   // Check if statusObj is defined before accessing its properties
//   if (!statusObj) {
//     console.warn("⚠️ [PROJECT-LIST-ITEM] Status object is undefined");
//     return {
//       status_name: "Unknown Status",
//       status_tab: null,
//     };
//   }

//   console.log("🔍 [PROJECT-LIST-ITEM] Status object:", statusObj);
//   // Function to generate slug from status name
function generateStatusSlug(statusName: string): string {
  // Generate slug from status name
  const slug = statusName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();

  return slug;
}

//   // Use client_status_name for clients, admin_status_name for admins
//   if (role === "Client" && statusObj.client_status_name) {
//     filteredStatusObj.status_name = statusObj.client_status_name;
//     filteredStatusObj.status_slug = generateStatusSlug(statusObj.client_status_name);
//     filteredStatusObj.status_tab = statusObj.client_status_tab;
//     filteredStatusObj.project_action = statusObj.client_project_action || null;
//   } else if (statusObj.admin_status_name) {
//     filteredStatusObj.status_name = statusObj.admin_status_name;
//     filteredStatusObj.status_slug = generateStatusSlug(statusObj.admin_status_name);
//     filteredStatusObj.status_tab = statusObj.admin_status_tab;
//     filteredStatusObj.project_action = statusObj.admin_project_action || null;
//   }

//   // Always include project_action for the modal system
//   let projectAction = statusObj.project_action || null;

//   // Process placeholders if project_action exists and placeholder data is provided
//   if (projectAction && placeholderData) {
//     try {
//       projectAction = replacePlaceholders(projectAction, placeholderData);
//     } catch (error) {
//       console.warn("Failed to process placeholders in project_action:", error);
//     }
//   }

//   filteredStatusObj.project_action = projectAction;

//   return filteredStatusObj;
// }

export interface UnifiedProjectStatus {
  status_code: number;
  admin_status_name: string;
  client_status_name: string;
  admin_project_action: string | null;
  client_project_action: string | null;
  admin_status_tab: string;
  client_status_tab: string;
  status_color: string;
  // Role-based processed values
  status_name: string;
  status_tab: string;
  project_action: string | null;
  status_slug: string;
}

export interface ProjectStatusesResponse {
  success: boolean;
  statuses: any[]; // Raw statuses from database
  statusesMap: Record<number, any>; // Raw statuses as map
  roleBasedStatuses: Record<number, UnifiedProjectStatus>; // Role-processed statuses
  selectOptions: Array<{ value: string; label: string }>; // For form selects
  userRole: string;
}

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Check authentication and get user role
    const { currentUser, currentRole } = await checkAuth(cookies);
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
    const projectId = url.searchParams.get("projectId");
    const projectAddress = url.searchParams.get("projectAddress");
    const statusCode = url.searchParams.get("status_code");

    console.log("🔍 [PROJECT-STATUSES-API] Fetching statuses for role:", currentRole);

    // If projectId is provided, fetch project and author data for placeholder processing
    let projectData = null;
    let projectAuthor = null;
    let clientName = "Client";
    let clientEmail = "";

    if (projectId) {
      try {
        // Fetch project data
        const { data: project, error: projectError } = await supabaseAdmin
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (project && !projectError) {
          projectData = project;

          // Fetch author data if project has an author
          if (project.author_id) {
            const { data: authorProfile, error: authorError } = await supabaseAdmin
              .from("profiles")
              .select("*")
              .eq("id", project.author_id)
              .single();

            if (authorProfile && !authorError) {
              projectAuthor = authorProfile;

              // Construct client name and email from author data
              if (authorProfile.company_name) {
                clientName = authorProfile.company_name;
              } else if (authorProfile.first_name || authorProfile.last_name) {
                const firstName = authorProfile.first_name || "";
                const lastName = authorProfile.last_name || "";
                clientName = `${firstName} ${lastName}`.trim();
              }
              clientEmail = authorProfile.email || "";
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch project/author data for placeholders:", error);
      }
    }

    // If status_code is provided, return specific status data
    if (statusCode) {
      const { data: statusData, error: statusError } = await supabaseAdmin
        .from("project_statuses")
        .select("*")
        .eq("status_code", statusCode)
        .single();

      if (statusError) {
        console.error("❌ [PROJECT-STATUSES-API] Status not found:", statusError);
        return new Response(JSON.stringify({ error: "Status not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          statusConfig: statusData,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch all project statuses from database
    const { data: statusesData, error: statusesError } = await supabaseAdmin
      .from("project_statuses")
      .select("*")
      .neq("status_code", 0)
      .order("status_code");

    if (statusesError) {
      console.error("❌ [PROJECT-STATUSES-API] Database error:", statusesError);
      return new Response(JSON.stringify({ error: "Failed to fetch statuses" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const statuses = statusesData || [];

    // Create raw statuses map for lookup
    const statusesMap = statuses.reduce((acc: any, status: any) => {
      console.log("🔍 [PROJECT-STATUSES-API] Status:", status);
      acc[status.status_code] = status;
      return acc;
    }, {});

    // Prepare placeholder data if provided
    const placeholderData =
      projectId || projectAddress || clientName || clientEmail
        ? {
            projectId: projectId || "",
            projectAddress: projectAddress || projectData?.address || "",
            clientName: clientName,
            clientEmail: clientEmail,
            contractUrl: projectId ? `/project/${projectId}?status=contract` : "",
            siteUrl: process.env.SITE_URL || "https://capcofire.com",
          }
        : null;

    // Process statuses for the current user's role with placeholder processing
    // const roleBasedStatuses = statuses.reduce((acc: any, status: any) => {
    //   // Get role-filtered status object
    //   // const processedStatus = filteredStatusObj(status, currentRole || "Client", placeholderData);

    //   if (currentRole === "Client") {
    //     // Create unified status object
    //     acc[status.status_code] = {
    //       // Raw database values
    //       status_code: status.status_code,
    //       admin_status_name: status.admin_status_name,
    //       client_status_name: status.client_status_name,
    //       admin_project_action: status.admin_project_action,
    //       client_project_action: status.client_project_action,
    //       admin_status_tab: status.admin_status_tab,
    //       client_status_tab: status.client_status_tab,
    //       status_color: status.status_color,

    //       project_action: status.client_project_action, // Already processed with placeholders
    //     };
    //   } else if (currentRole === "Admin" || currentRole === "Staff") {
    //     console.log("🔍 [PROJECT-STATUSES-API] Processed status:", acc[status.status_code]);
    //   }
    // return statusesMap;
    // }, {});

    // Create select options for forms (using role-appropriate names)
    // const selectOptions = statuses.map((status: any) => ({
    //   value: status.status_code?.toString() || "",
    //   label: status.status_name,
    // }));

    // console.log(
    //   "✅ [PROJECT-STATUSES-API] Processed",
    //   statuses.length,
    //   "statuses for role:",
    //   currentRole
    // );

    // const response: ProjectStatusesResponse = {
    //   success: true,
    //   statuses, // Raw statuses array
    //   statusesMap, // Raw statuses as map
    //   roleBasedStatuses, // Role-processed statuses with placeholders
    //   selectOptions, // For form selects
    //   userRole: currentRole || "Client",
    // };

    // Process all statuses through placeholder-utils
    const roleBasedStatuses = statuses.reduce((acc: any, status: any) => {
      // Get role-appropriate data (all fields)
      const baseStatus =
        currentRole === "Client"
          ? {
              project_action: status.client_project_action,
              status_name: status.client_status_name,
              status_tab: status.client_status_tab,
              status_slug: status.client_status_slug,
              email_subject: status.client_email_subject,
              email_message: status.client_email_message,
              notification_message: status.client_notification_message,
              button_text: status.client_button_text,
              button_link: status.client_button_link,
              modal: {
                auto_redirect: status.modal_auto_redirect_client,
                message: status.modal_client,
              },
            }
          : {
              project_action: status.admin_project_action,
              status_name: status.admin_status_name,
              status_tab: status.admin_status_tab,
              status_slug: status.admin_status_slug,
              email_subject: status.admin_email_subject,
              email_message: status.admin_email_message,
              notification_message: status.admin_notification_message,
              button_text: status.admin_button_text,
              button_link: status.admin_button_link,
              modal: {
                auto_redirect: status.modal_auto_redirect_admin,
                message: status.modal_admin,
              },
            };

      // Process through placeholder-utils if we have placeholder data
      let processedStatus = { ...baseStatus };
      if (placeholderData) {
        try {
          Object.keys(baseStatus).forEach((key: string) => {
            if (baseStatus[key as keyof typeof baseStatus]) {
              processedStatus[key as keyof typeof processedStatus] = replacePlaceholders(
                baseStatus[key as keyof typeof baseStatus],
                placeholderData
              );
            }
          });
        } catch (error) {
          console.warn("Failed to process placeholders for status:", error);
        }
      }

      acc[status.status_code] = {
        ...status,
        project_action: processedStatus.project_action,
        status_name: processedStatus.status_name,
        status_tab: processedStatus.status_tab,
        status_slug: generateStatusSlug(processedStatus.status_name),
        status_color: status.status_color,
        email_subject: processedStatus.email_subject,
        email_message: processedStatus.email_message,
        notification_message: processedStatus.notification_message,
        button_text: processedStatus.button_text,
        button_link: processedStatus.button_link,
        value: status.status_code?.toString() || "",
        label: processedStatus.status_name,
      };

      return acc;
    }, {});

    //     console.log("🔍 [PROJECT-STATUSES-API] roleBasedStatuses map:", roleBasedStatuses);

    // Create current status object if projectId is provided
    let currentStatus = null;
    if (projectId && projectData) {
      const currentStatusData = roleBasedStatuses[projectData.status] || {};
      currentStatus = {
        status_tab: currentStatusData.status_tab || null,
        status_slug: currentStatusData.status_slug || null,
        status_name: currentStatusData.status_name || null,
        status_int: projectData.status || 0,
        status_color: currentStatusData.status_color || "gray",
        project_action: currentStatusData.project_action || null,
        // Include all other status data
        ...currentStatusData,
      };
    }

    // Create select options for form components
    const selectOptions = Object.values(roleBasedStatuses).map((status: any) => ({
      value: status.status_code?.toString() || "",
      label: status.status_name || "",
    }));

    // Return the complete formatted array with all processing done
    return new Response(
      JSON.stringify({
        success: true,
        roleBasedStatuses: roleBasedStatuses,
        // Also return as array for convenience
        statusesArray: Object.values(roleBasedStatuses),
        // Return select options for form components
        selectOptions: selectOptions,
        // Return current status object if projectId provided
        currentStatus: currentStatus,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
