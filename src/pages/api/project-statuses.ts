import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { filteredStatusObj } from "./process-client-status";

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
    const clientName = url.searchParams.get("clientName");
    const clientEmail = url.searchParams.get("clientEmail");

    console.log("🔍 [PROJECT-STATUSES-API] Fetching statuses for role:", currentRole);

    // Fetch all project statuses from database
    const { data: statusesData, error: statusesError } = await supabaseAdmin
      .from("project_statuses")
      .select(
        "status_code, admin_status_name, client_status_name, admin_project_action, client_project_action, client_status_tab, admin_status_tab, status_color"
      )
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
          }
        : null;

    // Process statuses for the current user's role with placeholder processing
    const roleBasedStatuses = statuses.reduce((acc: any, status: any) => {
      // Get role-filtered status object
      const processedStatus = filteredStatusObj(status, currentRole || "Client", placeholderData);

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

      return acc;
    }, {});

    // Create select options for forms (using role-appropriate names)
    const selectOptions = statuses.map((status: any) => ({
      value: status.status_code?.toString() || "",
      label: status.status_name,
    }));

    console.log(
      "✅ [PROJECT-STATUSES-API] Processed",
      statuses.length,
      "statuses for role:",
      currentRole
    );

    const response: ProjectStatusesResponse = {
      success: true,
      statuses, // Raw statuses array
      statusesMap, // Raw statuses as map
      roleBasedStatuses, // Role-processed statuses with placeholders
      selectOptions, // For form selects
      userRole: currentRole || "Client",
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
