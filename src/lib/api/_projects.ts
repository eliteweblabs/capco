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
    // Fetch punchlistComplete and punchlistCount directly from projects table
    const { data: projects, error } = await supabaseAdmin
      .from("projects")
      .select("id, punchlistComplete, punchlistCount")
      .in("id", projectIds);

    if (error) {
      console.error("🏗️ [PUNCHLIST-STATS] Database error:", error);
      return {};
    }

    // Map to stats format
    const stats: Record<number, { completed: number; total: number }> = {};

    (projects || []).forEach((project) => {
      stats[project.id] = {
        completed: project.punchlistComplete || 0,
        total: project.punchlistCount || 0,
      };
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
  userId?: string,
  options?: { includeFiles?: boolean }
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

    // Optionally fetch file counts for all projects
    let filesMap: Record<number, { count: number; files: any[] }> = {};
    if (options?.includeFiles && projectIds.length > 0) {
      try {
        const { data: filesData } = await supabaseAdmin
          .from("files")
          .select("id, fileName, fileType, fileSize, uploadedAt, projectId")
          .in("projectId", projectIds);

        // Group files by projectId
        (filesData || []).forEach((file) => {
          if (!filesMap[file.projectId]) {
            filesMap[file.projectId] = { count: 0, files: [] };
          }
          filesMap[file.projectId].count++;
          filesMap[file.projectId].files.push(file);
        });
      } catch (fileError) {
        console.warn("Could not fetch files for projects:", fileError);
      }
    }

    // Add featuredImageData, punchlist data, profile data, and file data for projects
    const projects = (allProjects || []).map((project) => {
      const projectWithData: any = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
        author: project.authorId ? profilesMap[project.authorId] : null,
        assignedTo: project.assignedToId ? profilesMap[project.assignedToId] : null,
        authorProfile: project.authorId ? profilesMap[project.authorId] : null,
        assignedToProfile: project.assignedToId ? profilesMap[project.assignedToId] : null,
      };

      // Add file data if requested
      if (options?.includeFiles) {
        const fileData = filesMap[project.id] || { count: 0, files: [] };
        projectWithData.fileCount = fileData.count;
        projectWithData.projectFiles = fileData.files;
      }

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
    const assignedToIds = [...new Set((projects || []).map((p) => p.assignedToId).filter(Boolean))];
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
    const assignedToIds = [...new Set((projects || []).map((p) => p.assignedToId).filter(Boolean))];
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
  projectId: number,
  options?: { includeFiles?: boolean; includeInvoice?: boolean }
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

    // Fetch punchlist stats
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, [project.id]);

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

    // Optionally fetch file data
    let fileCount = 0;
    let projectFiles: any[] = [];
    if (options?.includeFiles) {
      try {
        const { data: filesData } = await supabaseAdmin
          .from("files")
          .select("id, fileName, fileType, fileSize, uploadedAt")
          .eq("projectId", project.id);
        fileCount = filesData?.length || 0;
        projectFiles = filesData || [];
      } catch (fileError) {
        console.warn("Could not fetch files for project:", project.id, fileError);
      }
    }

    // Optionally fetch invoice
    let invoiceId = null;
    if (options?.includeInvoice) {
      try {
        const { data: invoices } = await supabaseAdmin
          .from("invoices")
          .select("id")
          .eq("projectId", project.id)
          .limit(1);

        if (invoices && invoices.length > 0) {
          invoiceId = invoices[0].id;
        }
      } catch (invoiceError) {
        console.warn("Could not fetch invoice for project:", project.id, invoiceError);
      }
    }

    // Build result with all data
    const result: any = {
      ...project,
      punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
      author: project.authorId ? profilesMap[project.authorId] : null,
      assignedTo: project.assignedToId ? profilesMap[project.assignedToId] : null,
      authorProfile: project.authorId ? profilesMap[project.authorId] : null,
      assignedToProfile: project.assignedToId ? profilesMap[project.assignedToId] : null,
    };

    if (options?.includeFiles) {
      result.projectFiles = projectFiles;
      result.fileCount = fileCount;
    }

    if (options?.includeInvoice && invoiceId) {
      result.invoiceId = invoiceId;
    }

    return result;
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
