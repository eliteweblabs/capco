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
    // Store original action (placeholder replacement will be done later)
    filteredStatusObj.status_action = statusObj.client_status_action || null;
  } else if (statusObj.admin_status_name) {
    filteredStatusObj.status_name = statusObj.admin_status_name;
    filteredStatusObj.status_slug = generateStatusSlug(statusObj.admin_status_name);
    filteredStatusObj.status_tab = statusObj.admin_status_tab;
    // Store original action (placeholder replacement will be done later)
    filteredStatusObj.status_action = statusObj.admin_status_action || null;
  }

  // Store original final_status_action (placeholder replacement will be done later)
  filteredStatusObj.final_status_action = statusObj.final_status_action || null;

  return filteredStatusObj;
}

export interface UnifiedProjectStatus {
  status_code: number;
  admin_status_name: string;
  client_status_name: string;
  admin_status_action: string | null;
  client_status_action: string | null;
  final_status_action?: string | null;
  admin_status_tab: string;
  client_status_tab: string;
  status_color: string;
  // Role-based processed values
  status_name: string;
  status_tab: string;
  status_action: string | null;
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

    // Prepare placeholder data from URL parameters
    let placeholderData: any = null;

    if (projectId || projectAddress || clientName || clientEmail) {
      placeholderData = {
        projectId: projectId || "",
        projectAddress: projectAddress || "",
        clientName: clientName || "Client",
        clientEmail: clientEmail || "",
        contractUrl: projectId ? `/project/${projectId}?status=contract` : "",
        siteUrl: process.env.SITE_URL || "https://capcofire.com",
        companyName: process.env.GLOBAL_COMPANY_NAME || "CAPCo Fire",
        globalCompanySlogan: process.env.GLOBAL_COMPANY_SLOGAN || "CAPCo Fire",
        year: new Date().getFullYear().toString(),
      };
    }

    console.log("🔍 [PROJECT-STATUSES-API] Final placeholder data:", {
      projectId: placeholderData?.projectId,
      projectAddress: placeholderData?.projectAddress,
      clientName: placeholderData?.clientName,
      clientEmail: placeholderData?.clientEmail,
    });

    // Process statuses for the current user's role (without placeholder processing)
    const roleBasedStatuses = statuses.reduce((acc: any, status: any) => {
      // Get role-filtered status object (without placeholder processing)
      const processedStatus = filteredStatusObj(
        status,
        currentUser?.profile?.role || "Client",
        null // No placeholder data yet
      );

      // Create unified status object
      acc[status.status_code] = {
        // Raw database values
        status_code: status.status_code,
        admin_status_name: status.admin_status_name,
        client_status_name: status.client_status_name,
        admin_status_action: status.admin_status_action,
        client_status_action: status.client_status_action,
        final_status_action: status.final_status_action,
        admin_status_tab: status.admin_status_tab,
        client_status_tab: status.client_status_tab,
        status_color: status.status_color,
        est_time: status.est_time,

        // Role-processed values
        status_name: processedStatus.status_name,
        status_tab: processedStatus.status_tab,
        status_action: processedStatus.status_action, // Will be processed with placeholders below
        status_slug: processedStatus.status_slug,
      };

      return acc;
    }, {});

    // Apply placeholder replacement once to all statuses if placeholder data exists
    if (placeholderData) {
      Object.values(roleBasedStatuses).forEach((status: any) => {
        if (status.status_action) {
          status.status_action = replacePlaceholders(status.status_action, placeholderData);
        }
        if (status.final_status_action) {
          status.final_status_action = replacePlaceholders(
            status.final_status_action,
            placeholderData
          );
        }
      });

      console.log("🔍 [PROJECT-STATUSES-API] Applied placeholder replacement to all statuses");
    }

    // Create select options for forms (using role-appropriate names)
    const selectOptions = statuses.map((status: any) => ({
      value: status.status_code?.toString() || "",
      label: status.status_name,
    }));

    // console.log("✅ [PROJECT-STATUSES-API] Processed", statuses.length, "statuses for role:");

    const response: ProjectStatusesResponse = {
      success: true,
      statuses, // Raw statuses array
      statusesMap, // Raw statuses as map
      roleBasedStatuses, // Role-processed statuses with placeholders
      selectOptions, // For form selects
      userRole: currentUser?.profile?.role || "Client",
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

    // Get project data from request body
    const requestBody = await request.json();
    const { project, authorProfile } = requestBody;

    console.log("🔍 [PROJECT-STATUSES-API] POST - Request body received:", {
      hasProject: !!project,
      hasAuthorProfile: !!authorProfile,
      projectKeys: project ? Object.keys(project) : [],
      authorProfileKeys: authorProfile ? Object.keys(authorProfile) : [],
    });

    if (project) {
      console.log("🔍 [PROJECT-STATUSES-API] POST - Project data:", {
        id: project.id,
        address: project.address,
        profileData: project.profileData,
        hasProfileData: !!project.profileData,
      });

      if (project.profileData) {
        console.log("🔍 [PROJECT-STATUSES-API] POST - Profile data:", {
          company_name: project.profileData.company_name,
          first_name: project.profileData.first_name,
          last_name: project.profileData.last_name,
          email: project.profileData.email,
          profileDataKeys: Object.keys(project.profileData),
        });
      }
    }

    if (authorProfile) {
      console.log("🔍 [PROJECT-STATUSES-API] POST - Author profile:", {
        company_name: authorProfile.company_name,
        first_name: authorProfile.first_name,
        last_name: authorProfile.last_name,
        email: authorProfile.email,
      });
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

    // Prepare placeholder data from project data
    let placeholderData: any = null;

    if (project) {
      console.log("🔍 [PROJECT-STATUSES-API] POST - Extracting client name from authorProfile:", {
        company_name: authorProfile?.company_name,
        first_name: authorProfile?.profile?.first_name,
        last_name: authorProfile?.profile?.last_name,
        fullName:
          `${authorProfile?.profile?.first_name || ""} ${authorProfile?.profile?.last_name || ""}`.trim(),
      });

      const clientName =
        authorProfile?.company_name ||
        `${authorProfile?.profile?.first_name || ""} ${authorProfile?.profile?.last_name || ""}`.trim() ||
        "Client";

      console.log("🔍 [PROJECT-STATUSES-API] POST - Final client name:", clientName);

      placeholderData = {
        projectId: project.id?.toString() || "",
        projectAddress: project.address || "",
        clientName: clientName,
        clientEmail: authorProfile?.email || "",
        contractUrl: project.id ? `/project/${project.id}?status=contract` : "",
        siteUrl: process.env.SITE_URL || "https://capcofire.com",
        companyName: process.env.GLOBAL_COMPANY_NAME || "CAPCo Fire",
        globalCompanySlogan: process.env.GLOBAL_COMPANY_SLOGAN || "CAPCo Fire",
        year: new Date().getFullYear().toString(),
      };
    }

    console.log("🔍 [PROJECT-STATUSES-API] POST - Final placeholder data:", {
      projectId: placeholderData?.projectId,
      projectAddress: placeholderData?.projectAddress,
      clientName: placeholderData?.clientName,
      clientEmail: placeholderData?.clientEmail,
      hasProject: !!project,
      hasAuthorProfile: !!authorProfile,
    });

    // Process statuses for the current user's role (without placeholder processing)
    const roleBasedStatuses = statuses.reduce((acc: any, status: any) => {
      // Get role-filtered status object (without placeholder processing)
      const processedStatus = filteredStatusObj(
        status,
        currentUser?.profile?.role || "Client",
        null // No placeholder data yet
      );

      // Create unified status object
      acc[status.status_code] = {
        // Raw database values
        status_code: status.status_code,
        admin_status_name: status.admin_status_name,
        client_status_name: status.client_status_name,
        admin_status_action: status.admin_status_action,
        client_status_action: status.client_status_action,
        final_status_action: status.final_status_action,
        admin_status_tab: status.admin_status_tab,
        client_status_tab: status.client_status_tab,
        status_color: status.status_color,
        est_time: status.est_time,

        // Role-processed values
        status_name: processedStatus.status_name,
        status_tab: processedStatus.status_tab,
        status_action: processedStatus.status_action, // Will be processed with placeholders below
        status_slug: processedStatus.status_slug,
      };

      return acc;
    }, {});

    // Apply placeholder replacement once to all statuses if placeholder data exists
    if (placeholderData) {
      Object.values(roleBasedStatuses).forEach((status: any) => {
        if (status.status_action) {
          status.status_action = replacePlaceholders(status.status_action, placeholderData);
        }
        if (status.final_status_action) {
          status.final_status_action = replacePlaceholders(
            status.final_status_action,
            placeholderData
          );
        }
      });

      console.log(
        "🔍 [PROJECT-STATUSES-API] POST - Applied placeholder replacement to all statuses"
      );
    }

    // Create select options for forms (using role-appropriate names)
    const selectOptions = statuses.map((status: any) => ({
      value: status.status_code?.toString() || "",
      label: status.status_name,
    }));

    const response: ProjectStatusesResponse = {
      success: true,
      statuses: statuses,
      roleBasedStatuses: roleBasedStatuses,
      statusesMap: statusesMap,
      selectOptions: selectOptions,
      userRole: currentUser?.profile?.role || "Client",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [PROJECT-STATUSES-API] POST Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
