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

    // Filtering logic - now handles slugs directly
    const shouldShow = (projectStatusSlug: string) => {
      if (statusFilter === "all") {
        return true;
      }
      // Direct slug comparison since we're now passing slugs
      return projectStatusSlug === statusFilter;
    };

    // Count logic for bubbles - now uses slugs
    const getStatusCounts = (projects: any[]) => {
      const statusCounts: Record<string, number> = {};

      projects.forEach((project) => {
        const projectStatus = project.status?.toString() || "10";
        const statusInfo = projectStatuses.find((s: any) => s.statusCode == projectStatus);

        if (statusInfo) {
          let statusName = "";

          // Use clientStatusName for clients, adminStatusName for admins
          if (currentRole === "Client" && statusInfo.clientStatusName) {
            statusName = statusInfo.clientStatusName;
          } else {
            statusName = statusInfo.adminStatusName || statusInfo.statusName || "";
          }

          // Generate slug from status name
          const slug = statusName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .trim();

          statusCounts[slug] = (statusCounts[slug] || 0) + 1;
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
          if (status.clientStatusName) {
            const slug = status.clientStatusName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .trim();
            return slug === statusFilter;
          }
          return false;
        });
        return foundStatus?.clientStatusName || statusFilter;
      } else {
        // For admins, find by status code
        foundStatus = projectStatuses.find((status: any) => status.statusCode == statusFilter);
        return foundStatus?.adminStatusName || statusFilter;
      }
    };

    // Get count for specific status filter
    const getCountForFilter = (statusFilter: string, statusCounts: Record<string, number>) => {
      if (statusFilter === "all") {
        return projectItems?.length || 0;
      }

      if (currentRole === "Client") {
        // For clients, find the clientStatusName that matches this slug
        const statusInfo = projectStatuses.find((s: any) => {
          if (s.clientStatusName) {
            const slug = s.clientStatusName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .trim();
            return slug === statusFilter;
          }
          return false;
        });
        if (statusInfo) {
          return statusCounts[statusInfo.clientStatusName] || 0;
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
