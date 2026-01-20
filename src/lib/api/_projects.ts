import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch punchlist statistics for a list of projects
 */
export async function fetchPunchlistStats(
  supabaseAdmin: SupabaseClient,
  projectIds: number[]
): Promise<Record<number, { completed: number; total: number }>> {
  if (projectIds.length === 0) return {};

  try {
    const { data: punchlistData, error } = await supabaseAdmin
      .from("punchlist")
      .select("projectId, markCompleted")
      .in("projectId", projectIds);

    if (error) {
      console.error("🏗️ [PUNCHLIST-STATS] Database error:", error);
      return {};
    }

    // Group by projectId and count completed vs total
    const stats: Record<number, { completed: number; total: number }> = {};

    projectIds.forEach((projectId) => {
      stats[projectId] = { completed: 0, total: 0 };
    });

    (punchlistData || []).forEach((item) => {
      if (!stats[item.projectId]) {
        stats[item.projectId] = { completed: 0, total: 0 };
      }
      stats[item.projectId].total++;
      if (item.markCompleted) {
        stats[item.projectId].completed++;
      }
    });

    return stats;
  } catch (error) {
    console.error("🏗️ [PUNCHLIST-STATS] Error fetching punchlist stats:", error);
    return {};
  }
}

export interface Project {
  id: number;
  authorId: string;
  title: string;
  address: string;
  status: number;
  sqFt?: number;
  newConstruction: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields that might be needed
  description?: string;
  companyName?: string;
  project_type?: string;
  estimated_completion?: string;
  budget?: number;
  // Punchlist data
  punchlistItems?: {
    completed: number;
    total: number;
  };
}

export interface ProjectWithStatus extends Project {
  statusName?: string;
  statusSlug?: string;
  statusColor?: string;
}

export async function fetchProjects(
  supabaseAdmin: SupabaseClient,
  userId?: string
): Promise<Project[]> {
  try {
    const { data: allProjects, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .neq("id", 0) // Exclude system log project
      .order("updatedAt", { ascending: false });

    if (error) {
      console.error("🏗️ [DASHBOARD] Database error:", error);
      return [];
    }

    // Get project IDs for punchlist stats
    const projectIds = (allProjects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Get unique author and assigned-to IDs
    const authorIds = [...new Set((allProjects || []).map((p) => p.authorId).filter(Boolean))];
    const assignedToIds = [
      ...new Set((allProjects || []).map((p) => p.assignedToId).filter(Boolean)),
    ];
    const allProfileIds = [...new Set([...authorIds, ...assignedToIds])];

    // Fetch all relevant profiles in one query
    let profilesMap: Record<string, any> = {};
    if (allProfileIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("id", allProfileIds);

      profilesMap = (profiles || []).reduce(
        (acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );
    }

    // Add featuredImageData, punchlist data, and profile data for projects
    const projects = (allProjects || []).map((project) => {
      const projectWithData = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
        authorProfile: project.authorId ? profilesMap[project.authorId] : null,
        assignedToProfile: project.assignedToId ? profilesMap[project.assignedToId] : null,
      };

      if (project.featuredImageData) {
        return {
          ...projectWithData,
          featuredImageData: {
            publicUrl: project.featuredImageData.publicUrl,
          },
        };
      }
      return projectWithData;
    });

    return projects;
  } catch (error) {
    console.error("🏗️ [DASHBOARD] Error fetching projects:", error);
    return [];
  }
}

export async function getProjectsByAuthor(
  supabaseAdmin: SupabaseClient,
  authorId: string
): Promise<Project[]> {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("authorId", authorId) // Filter by author ID
      .neq("id", 0) // Exclude system log project
      .order("updatedAt", { ascending: false });

    if (error) {
      console.error("🏗️ [PROJECTS-API] Database error:", error);
      return [];
    }

    // Get project IDs for punchlist stats
    const projectIds = (projects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Get unique author and assigned-to IDs
    const authorIds = [...new Set((projects || []).map((p) => p.authorId).filter(Boolean))];
    const assignedToIds = [
      ...new Set((projects || []).map((p) => p.assignedToId).filter(Boolean)),
    ];
    const allProfileIds = [...new Set([...authorIds, ...assignedToIds])];

    // Fetch all relevant profiles in one query
    let profilesMap: Record<string, any> = {};
    if (allProfileIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("id", allProfileIds);

      profilesMap = (profilesData || []).reduce(
        (acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );
    }

    // Add featuredImageData, punchlist data, and profile data for projects
    const projectsWithData = (projects || []).map((project) => {
      const projectWithData = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
        authorProfile: project.authorId ? profilesMap[project.authorId] : null,
        assignedToProfile: project.assignedToId ? profilesMap[project.assignedToId] : null,
      };

      if (project.featuredImageData) {
        return {
          ...projectWithData,
          featuredImageData: {
            publicUrl: project.featuredImageData.publicUrl,
          },
        };
      }
      return projectWithData;
    });

    // console.log(
    //   `🏗️ [PROJECTS-API] Retrieved ${projectsWithData.length} projects for author ${authorId}`
    // );
    return projectsWithData;
  } catch (error) {
    console.error("🏗️ [PROJECTS-API] Error fetching projects by author:", error);
    return [];
  }
}

export async function getProjectsByAssignedToId(
  supabaseAdmin: SupabaseClient,
  assignedToId: string
): Promise<Project[]> {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("assignedToId", assignedToId) // Filter by author ID
      .neq("id", 0) // Exclude system log project
      .order("updatedAt", { ascending: false });

    if (error) {
      console.error("🏗️ [PROJECTS-API] Database error:", error);
      return [];
    }

    // Get project IDs for punchlist stats
    const projectIds = (projects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Get unique author and assigned-to IDs
    const authorIds = [...new Set((projects || []).map((p) => p.authorId).filter(Boolean))];
    const assignedToIds = [
      ...new Set((projects || []).map((p) => p.assignedToId).filter(Boolean)),
    ];
    const allProfileIds = [...new Set([...authorIds, ...assignedToIds])];

    // Fetch all relevant profiles in one query
    let profilesMap: Record<string, any> = {};
    if (allProfileIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("id", allProfileIds);

      profilesMap = (profilesData || []).reduce(
        (acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );
    }

    // Add featuredImageData, punchlist data, and profile data for projects
    const projectsWithData = (projects || []).map((project) => {
      const projectWithData = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
        authorProfile: project.authorId ? profilesMap[project.authorId] : null,
        assignedToProfile: project.assignedToId ? profilesMap[project.assignedToId] : null,
      };

      if (project.featuredImageUrl) {
        return {
          ...projectWithData,
          featuredImageData: {
            publicUrl: project.featuredImageUrl,
          },
        };
      }
      return projectWithData;
    });

    // console.log(
    //   `🏗️ [PROJECTS-API] Retrieved ${projectsWithData.length} projects for author ${assignedToId}`
    // );
    return projectsWithData;
  } catch (error) {
    console.error("🏗️ [PROJECTS-API] Error fetching projects by author:", error);
    return [];
  }
}

export async function fetchProjectsWithStatus(
  supabaseAdmin: SupabaseClient,
  userId?: string
): Promise<ProjectWithStatus[]> {
  try {
    let query = supabaseAdmin
      .from("projects")
      .select(
        `
        *,
        projectStatuses (
          id,
          name,
          slug,
          color
        )
      `
      )
      .order("createdAt", { ascending: false });

    // If userId is provided, filter by authorId
    if (userId) {
      query = query.eq("authorId", userId);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Error fetching projects with status:", error);
      throw error;
    }

    // Transform the data to include status information
    const projectsWithStatus: ProjectWithStatus[] = (projects || []).map((project) => ({
      ...project,
      statusName: project.projectStatuses?.name,
      statusSlug: project.projectStatuses?.slug,
      statusColor: project.projectStatuses?.statusColor,
    }));

    return projectsWithStatus;
  } catch (error) {
    console.error("Failed to fetch projects with status:", error);
    return [];
  }
}

export async function fetchProjectById(
  supabaseAdmin: SupabaseClient,
  projectId: number
): Promise<Project | null> {
  try {
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Error fetching project by ID:", error);
      return null;
    }

    if (!project) return null;

    // Fetch author and assignedTo profiles if they exist
    const profileIds = [project.authorId, project.assignedToId].filter(Boolean);

    let profilesMap: Record<string, any> = {};
    if (profileIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("id", profileIds);

      profilesMap = (profilesData || []).reduce(
        (acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );
    }

    // Add profile data to project
    return {
      ...project,
      authorProfile: project.authorId ? profilesMap[project.authorId] : null,
      assignedToProfile: project.assignedToId ? profilesMap[project.assignedToId] : null,
    };
  } catch (error) {
    console.error("Failed to fetch project by ID:", error);
    return null;
  }
}

// export async function deleteProject(
//   supabaseAdmin: SupabaseClient,
//   projectId: number
// ): Promise<boolean> {
//   try {
//     const { error } = await supabaseAdmin.from("projects").delete().eq("id", projectId);

//     if (error) {
//       console.error("Error deleting project:", error);
//       return false;
//     }

//     return true;
//   } catch (error) {
//     console.error("Failed to delete project:", error);
//     return false;
//   }
// }
