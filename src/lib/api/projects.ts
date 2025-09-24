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
      .select("project_id, mark_completed")
      .in("project_id", projectIds);

    if (error) {
      console.error("🏗️ [PUNCHLIST-STATS] Database error:", error);
      return {};
    }

    // Group by project_id and count completed vs total
    const stats: Record<number, { completed: number; total: number }> = {};

    projectIds.forEach((projectId) => {
      stats[projectId] = { completed: 0, total: 0 };
    });

    (punchlistData || []).forEach((item) => {
      if (!stats[item.project_id]) {
        stats[item.project_id] = { completed: 0, total: 0 };
      }
      stats[item.project_id].total++;
      if (item.mark_completed) {
        stats[item.project_id].completed++;
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
  author_id: string;
  title: string;
  address: string;
  status: number;
  sq_ft?: number;
  new_construction: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields that might be needed
  description?: string;
  client_name?: string;
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
  status_name?: string;
  status_slug?: string;
  status_color?: string;
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
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("🏗️ [DASHBOARD] Database error:", error);
      return [];
    }

    // Get project IDs for punchlist stats
    const projectIds = (allProjects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Add featured_image_data and punchlist data for projects
    const projects = (allProjects || []).map((project) => {
      const projectWithData = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
      };

      if (project.featured_image_data) {
        return {
          ...projectWithData,
          featured_image_data: {
            public_url: project.featured_image_data.public_url,
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
      .eq("author_id", authorId) // Filter by author ID
      .neq("id", 0) // Exclude system log project
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("🏗️ [PROJECTS-API] Database error:", error);
      return [];
    }

    // Get project IDs for punchlist stats
    const projectIds = (projects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Add featured_image_data and punchlist data for projects
    const projectsWithData = (projects || []).map((project) => {
      const projectWithData = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
      };

      if (project.featured_image_data) {
        return {
          ...projectWithData,
          featured_image_data: {
            public_url: project.featured_image_data.public_url,
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
      .eq("assigned_to_id", assignedToId) // Filter by author ID
      .neq("id", 0) // Exclude system log project
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("🏗️ [PROJECTS-API] Database error:", error);
      return [];
    }

    // Get project IDs for punchlist stats
    const projectIds = (projects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Add featured_image_data and punchlist data for projects
    const projectsWithData = (projects || []).map((project) => {
      const projectWithData = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
      };

      if (project.featured_image_url) {
        return {
          ...projectWithData,
          featured_image_data: {
            public_url: project.featured_image_url,
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
        project_statuses (
          id,
          name,
          slug,
          color
        )
      `
      )
      .order("created_at", { ascending: false });

    // If userId is provided, filter by author_id
    if (userId) {
      query = query.eq("author_id", userId);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Error fetching projects with status:", error);
      throw error;
    }

    // Transform the data to include status information
    const projectsWithStatus: ProjectWithStatus[] = (projects || []).map((project) => ({
      ...project,
      status_name: project.project_statuses?.name,
      status_slug: project.project_statuses?.slug,
      status_color: project.project_statuses?.status_color,
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

    return project;
  } catch (error) {
    console.error("Failed to fetch project by ID:", error);
    return null;
  }
}

export async function createProject(
  supabaseAdmin: SupabaseClient,
  projectData: Partial<Project>
): Promise<Project | null> {
  try {
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return null;
    }

    return project;
  } catch (error) {
    console.error("Failed to create project:", error);
    return null;
  }
}

export async function updateProject(
  supabaseAdmin: SupabaseClient,
  projectId: number,
  updates: Partial<Project>
): Promise<Project | null> {
  try {
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return null;
    }

    return project;
  } catch (error) {
    console.error("Failed to update project:", error);
    return null;
  }
}

export async function deleteProject(
  supabaseAdmin: SupabaseClient,
  projectId: number
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete project:", error);
    return false;
  }
}

export function groupProjectsByStatus(
  projects: ProjectWithStatus[]
): Record<string, ProjectWithStatus[]> {
  return projects.reduce(
    (acc, project) => {
      const statusSlug = project.status_slug || "unknown";
      if (!acc[statusSlug]) {
        acc[statusSlug] = [];
      }
      acc[statusSlug].push(project);
      return acc;
    },
    {} as Record<string, ProjectWithStatus[]>
  );
}

export function getProjectStats(projects: Project[]): {
  total: number;
  byStatus: Record<number, number>;
  recent: number;
} {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: projects.length,
    byStatus: {} as Record<number, number>,
    recent: 0,
  };

  projects.forEach((project) => {
    // Count by status
    stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;

    // Count recent projects
    const projectDate = new Date(project.created_at);
    if (projectDate >= thirtyDaysAgo) {
      stats.recent++;
    }
  });

  return stats;
}
