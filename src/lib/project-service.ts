// Project Service - Database operations for projects
import { supabase } from "./supabase";
import { globalServices } from "./global-services";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "in-progress" | "review" | "completed" | "archived";
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: Project["status"];
  metadata?: Record<string, any>;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: Project["status"];
  metadata?: Record<string, any>;
}

export class ProjectService {
  async createProject(data: CreateProjectData): Promise<Project> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const user = await globalServices.getCurrentUser();
    const projectData = {
      ...data,
      status: data.status || "draft",
      created_by: user?.id,
      updated_by: user?.id,
    };

    const { data: project, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    globalServices.emit("project:created", project);
    return project;
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const user = await globalServices.getCurrentUser();
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    };

    const { data: project, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    globalServices.emit("project:updated", project);
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Project not found
      }
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return data;
  }

  async getProjects(filters?: {
    status?: Project["status"];
    created_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    let query = supabase.from("projects").select("*");

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.created_by) {
      query = query.eq("created_by", filters.created_by);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );
    }

    query = query.order("updated_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get projects: ${error.message}`);
    }

    return data || [];
  }

  async deleteProject(id: string): Promise<void> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    globalServices.emit("project:deleted", { id });
  }

  async updateProjectMetadata(
    id: string,
    metadata: Record<string, any>,
  ): Promise<Project> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const user = await globalServices.getCurrentUser();

    const { data: project, error } = await supabase
      .from("projects")
      .update({
        metadata,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project metadata: ${error.message}`);
    }

    globalServices.emit("project:metadata-updated", { id, metadata, project });
    return project;
  }

  async addProjectFile(
    projectId: string,
    fileData: {
      name: string;
      url: string;
      size: number;
      type: string;
    },
  ): Promise<any> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const user = await globalServices.getCurrentUser();
    const fileRecord = {
      ...fileData,
      project_id: projectId,
      uploaded_by: user?.id,
    };

    const { data, error } = await supabase
      .from("project_files")
      .insert([fileRecord])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add project file: ${error.message}`);
    }

    globalServices.emit("project:file-added", { projectId, file: data });
    return data;
  }

  async getProjectFiles(projectId: string): Promise<any[]> {
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const { data, error } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get project files: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const projectService = new ProjectService();

// Export convenience functions
export const createProject = (data: CreateProjectData) =>
  projectService.createProject(data);
export const updateProject = (id: string, data: UpdateProjectData) =>
  projectService.updateProject(id, data);
export const getProject = (id: string) => projectService.getProject(id);
export const getProjects = (
  filters?: Parameters<typeof projectService.getProjects>[0],
) => projectService.getProjects(filters);
export const deleteProject = (id: string) => projectService.deleteProject(id);
export const updateProjectMetadata = (
  id: string,
  metadata: Record<string, any>,
) => projectService.updateProjectMetadata(id, metadata);
