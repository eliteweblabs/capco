import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectStatus {
  status_code: number;
  admin_status_name: string;
  project_action: string;
  client_status_name: string;
  client_status_tab: string;
  admin_status_tab: string;
  admin_status_slug: string;
  client_status_slug: string;
}

export interface ProjectStatusesResponse {
  statuses: ProjectStatus[];
  statusesMap: Record<number, ProjectStatus>;
}

export async function fetchProjectStatuses(
  supabaseAdmin: SupabaseClient
): Promise<ProjectStatusesResponse> {
  try {
    const { data: statusesData, error: statusesError } = await supabaseAdmin
      .from("project_statuses")
      .select(
        "status_code, admin_status_name, project_action, client_status_name, client_status_tab, admin_status_tab, admin_status_slug, client_status_slug"
      )
      .neq("status_code", 0)
      .order("status_code");

    if (statusesError) {
      console.error("Error fetching project statuses:", statusesError);
      throw statusesError;
    }

    const statuses = statusesData || [];

    // Create a map for quick lookup
    const statusesMap = statuses.reduce(
      (acc, status) => {
        acc[status.status_code] = status;
        return acc;
      },
      {} as Record<number, ProjectStatus>
    );

    return {
      statuses,
      statusesMap,
    };
  } catch (error) {
    console.error("Failed to fetch project statuses:", error);
    return {
      statuses: [],
      statusesMap: {},
    };
  }
}

export function processProjectStatuses(
  statuses: ProjectStatus[],
  userRole: string
): Record<string, any> {
  const role = userRole || "Client";
  // console.log("🔍 [DASHBOARD] Processing statuses for role:", role);
  // console.log("🔍 [DASHBOARD] Statuses object keys:", Object.keys(statuses));

  const statusesObject = statuses.reduce((acc: any, status: any) => {
    acc[status.status_code] = status;
    return acc;
  }, {});

  return Object.keys(statusesObject).reduce((acc: any, statusCode: string) => {
    const statusObj = statusesObject[statusCode];
    // console.log(
    //   "🔍 [DASHBOARD] Processing status",
    //   statusCode,
    //   "for role",
    //   role,
    //   "statusObj:",
    //   statusObj
    // );

    // Use client_status_name for clients, admin_status_name for admins
    if (role === "Client" && statusObj.client_status_name) {
      acc[statusCode] = {
        ...statusObj,
        status_name: statusObj.client_status_name,
        status_tab: statusObj.client_status_tab,
        status_slug: statusObj.client_status_slug,
      };
    } else if (statusObj.admin_status_name) {
      acc[statusCode] = {
        ...statusObj,
        status_name: statusObj.admin_status_name,
        status_tab: statusObj.admin_status_tab,
        status_slug: statusObj.admin_status_slug,
      };
    } else {
      // Fallback if no role-specific name exists
      acc[statusCode] = {
        ...statusObj,
        status_name: statusObj.admin_status_name || "Unknown Status",
        status_tab: statusObj.admin_status_tab || null,
        status_slug: statusObj.admin_status_slug || null,
      };
    }

    return acc;
  }, {});
}

export function getStatusBySlug(
  statuses: ProjectStatus[],
  slug: string
): ProjectStatus | undefined {
  return statuses.find((status) => status.slug === slug);
}

export function getStatusById(statuses: ProjectStatus[], id: number): ProjectStatus | undefined {
  return statuses.find((status) => status.id === id);
}

export function getNextStatus(
  statuses: ProjectStatus[],
  currentStatusId: number
): ProjectStatus | undefined {
  const currentIndex = statuses.findIndex((status) => status.id === currentStatusId);
  if (currentIndex === -1 || currentIndex >= statuses.length - 1) {
    return undefined;
  }
  return statuses[currentIndex + 1];
}

export function getPreviousStatus(
  statuses: ProjectStatus[],
  currentStatusId: number
): ProjectStatus | undefined {
  const currentIndex = statuses.findIndex((status) => status.id === currentStatusId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return statuses[currentIndex - 1];
}
