import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders } from "../../lib/placeholder-utils";
import { supabaseAdmin } from "../../lib/supabase-admin";

// Function to process status objects for role-based filtering and placeholder replacement
function filteredStatusObj(statusObj: any, role: string, placeholderData?: any) {
  // console.log("🔍 [PROJECT-LIST-ITEM] Status object:", statusObj);
  let filteredStatusObj: any = {};

  // Check if statusObj is defined before accessing its properties
  if (!statusObj) {
    console.warn("⚠️ [PROJECT-LIST-ITEM] Status object is undefined");
    return {
      status_name: "Unknown Status",
      status_tab: null,
    };
  }

  // Function to generate slug from status name
  function generateStatusSlug(statusName: string): string {
    // Generate slug from status name
    const slug = statusName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    return slug;
  }

  // Use client_status_name for clients, admin_status_name for admins
  if (role === "Client" && statusObj.client_status_name) {
    filteredStatusObj.status_name = statusObj.client_status_name;
    filteredStatusObj.status_slug = generateStatusSlug(statusObj.client_status_name);
    filteredStatusObj.status_tab = statusObj.client_status_tab;
    filteredStatusObj.project_action = statusObj.client_project_action || null;
  } else if (statusObj.admin_status_name) {
    filteredStatusObj.status_name = statusObj.admin_status_name;
    filteredStatusObj.status_slug = generateStatusSlug(statusObj.admin_status_name);
    filteredStatusObj.status_tab = statusObj.admin_status_tab;
    filteredStatusObj.project_action = statusObj.admin_project_action || null;
  }

  // Always include project_action for the modal system
  let projectAction = statusObj.project_action || null;

  // Process placeholders if project_action exists and placeholder data is provided
  if (projectAction && placeholderData) {
    try {
      projectAction = replacePlaceholders(projectAction, placeholderData);
    } catch (error) {
      console.warn("Failed to process placeholders in project_action:", error);
    }
  }

  filteredStatusObj.project_action = projectAction;

  return filteredStatusObj;
}

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
    const projectId = url.searchParams.get("projectId");
    const projectAddress = url.searchParams.get("projectAddress");
    const clientName = url.searchParams.get("clientName");
    const clientEmail = url.searchParams.get("clientEmail");
    const statusCode = url.searchParams.get("status_code");

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
      acc[status.status_code] = status;
      return acc;
    }, {});

    // Prepare placeholder data if provided
    const placeholderData =
      projectId || projectAddress || clientName || clientEmail
        ? {
            projectId: projectId || "",
            projectAddress: projectAddress || "",
            clientName: clientName || "Client",
            clientEmail: clientEmail || "",
            contractUrl: projectId ? `/project/${projectId}?status=contract` : "",
            siteUrl: process.env.SITE_URL || "https://capcofire.com",
            companyName: process.env.COMPANY_NAME || "CAPCo Fire",
          }
        : null;

    // Process statuses for the current user's role with placeholder processing
    const roleBasedStatuses = statuses.reduce((acc: any, status: any) => {
      // Get role-filtered status object
      const processedStatus = filteredStatusObj(
        status,
        currentUser.role || "Client",
        placeholderData
      );

      // Create unified status object
      acc[status.status_code] = {
        // Raw database values
        status_code: status.status_code,
        admin_status_name: status.admin_status_name,
        client_status_name: status.client_status_name,
        admin_project_action: status.admin_project_action,
        client_project_action: status.client_project_action,
        admin_status_tab: status.admin_status_tab,
        client_status_tab: status.client_status_tab,
        status_color: status.status_color,

        // Role-processed values
        status_name: processedStatus.status_name,
        status_tab: processedStatus.status_tab,
        project_action: processedStatus.project_action, // Already processed with placeholders
        status_slug: processedStatus.status_slug,
      };

      console.log("🔍 [PROJECT-STATUSES-API] Processed status:", acc[status.status_code]);

      return acc;
    }, {});

    // Create select options for forms (using role-appropriate names)
    const selectOptions = statuses.map((status: any) => ({
      value: status.status_code?.toString() || "",
      label: status.status_name,
    }));

    console.log("✅ [PROJECT-STATUSES-API] Processed", statuses.length, "statuses for role:");

    const response: ProjectStatusesResponse = {
      success: true,
      statuses, // Raw statuses array
      statusesMap, // Raw statuses as map
      roleBasedStatuses, // Role-processed statuses with placeholders
      selectOptions, // For form selects
      userRole: currentUser.role || "Client",
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
