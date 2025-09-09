import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { action, statusFilter, currentRole, projectStatuses, projectItems } =
      await request.json();

    if (!action || !currentRole || !projectStatuses) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Filtering logic
    const shouldShow = (projectStatus: string) => {
      if (statusFilter === "all") {
        return true;
      }

      if (currentRole === "Client") {
        // For clients, match by client_status_name slug
        const statusInfo = projectStatuses.find((s: any) => s.status_code == projectStatus);
        if (statusInfo && statusInfo.client_status_name) {
          const projectSlug = statusInfo.client_status_name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .trim();
          return projectSlug === statusFilter;
        }
      } else {
        // For admins/staff, match by status number
        return statusFilter === projectStatus;
      }

      return false;
    };

    // Count logic for bubbles
    const getStatusCounts = (projects: any[]) => {
      const statusCounts: Record<string, number> = {};

      projects.forEach((project) => {
        const projectStatus = project.status?.toString() || "10";

        if (currentRole === "Client") {
          // For clients, count by client_status_name
          const statusInfo = projectStatuses.find((s: any) => s.status_code == projectStatus);
          if (statusInfo && statusInfo.client_status_name) {
            const clientStatusName = statusInfo.client_status_name;
            statusCounts[clientStatusName] = (statusCounts[clientStatusName] || 0) + 1;
          }
        } else {
          // For admins/staff, count by status number
          statusCounts[projectStatus] = (statusCounts[projectStatus] || 0) + 1;
        }
      });

      return statusCounts;
    };

    // Get status name for "no projects" message
    const getStatusName = (statusFilter: string) => {
      if (statusFilter === "all") {
        return "this status";
      }

      let foundStatus = null;
      if (currentRole === "Client") {
        // For clients, find by slug
        foundStatus = projectStatuses.find((status: any) => {
          if (status.client_status_name) {
            const slug = status.client_status_name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .trim();
            return slug === statusFilter;
          }
          return false;
        });
        return foundStatus?.client_status_name || statusFilter;
      } else {
        // For admins, find by status code
        foundStatus = projectStatuses.find((status: any) => status.status_code == statusFilter);
        return foundStatus?.admin_status_name || statusFilter;
      }
    };

    // Get count for specific status filter
    const getCountForFilter = (statusFilter: string, statusCounts: Record<string, number>) => {
      if (statusFilter === "all") {
        return projectItems?.length || 0;
      }

      if (currentRole === "Client") {
        // For clients, find the client_status_name that matches this slug
        const statusInfo = projectStatuses.find((s: any) => {
          if (s.client_status_name) {
            const slug = s.client_status_name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .trim();
            return slug === statusFilter;
          }
          return false;
        });
        if (statusInfo) {
          return statusCounts[statusInfo.client_status_name] || 0;
        }
      } else {
        // For admins/staff, use status number directly
        return statusCounts[statusFilter] || 0;
      }

      return 0;
    };

    let result: any = {
      success: true,
      filterLogic: {
        statusFilter,
        currentRole,
        isClient: currentRole === "Client",
      },
    };

    // Add specific data based on action
    if (action === "filter") {
      result.statusName = getStatusName(statusFilter);
    } else if (action === "count") {
      result.statusCounts = getStatusCounts(projectItems || []);
      result.getCountForFilter = getCountForFilter;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in filter-projects API:", error);
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
