// Simple Project Logging - Clean and minimal
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

export interface SimpleLogEntry {
  timestamp: string;
  action: string;
  user: string;
  message: string;
  metadata?: any;
}

// Type definitions for different log types
export type LogType =
  | "project_created"
  | "project_updated"
  | "status_change"
  | "file_uploaded"
  | "file_downloaded"
  | "comment_added"
  | "discussion_added"
  | "discussion_completed"
  | "discussion_incomplete"
  | "punchlist_added"
  | "punchlist_completed"
  | "punchlist_incomplete"
  | "email_sent"
  | "email_failed"
  | "user_login"
  | "user_registration"
  | "admin_action"
  | "system_event"
  | "error"
  | "info";

export class SimpleProjectLogger {
  /**
   * Add a log entry to a project's log column
   * @param projectId - The project ID (use 0 for system logs)
   * @param type - The type of log entry (determines icon/color)
   * @param currentUser - The current user object
   * @param message - The log message
   * @param metadata - Optional additional data
   */
  static async addLogEntry(
    projectIdOrProject: number | any,
    type: LogType,
    currentUser: any,
    message: string,
    metadata?: any,
    cookies?: string
  ): Promise<boolean> {
    try {
      // console.log("📝 [SIMPLE-LOGGER] Adding log entry:", {
      //   projectIdOrProject,
      //   type,
      //   currentUser,
      //   message,
      // });

      if (!supabase) {
        console.error("Supabase not configured");
        return false;
      }

      // Determine if we have a project ID or project object
      let projectId: number;
      let project: any = null;

      if (typeof projectIdOrProject === "number") {
        // It's a project ID
        projectId = projectIdOrProject;
      } else if (
        projectIdOrProject &&
        typeof projectIdOrProject === "object" &&
        projectIdOrProject.id
      ) {
        // It's a project object
        projectId = projectIdOrProject.id;
        project = projectIdOrProject;
      } else {
        console.error("📝 [SIMPLE-LOGGER] Invalid projectIdOrProject:", projectIdOrProject);
        return false;
      }

      // If no project object provided, fetch it using get-project API
      if (!project) {
        try {
          const response = await fetch(
            `${process.env.PUBLIC_SITE_URL || "http://localhost:4321"}/api/get-project?id=${projectId}`,
            {
              headers: cookies ? { Cookie: cookies } : {},
            }
          );
          if (response.ok) {
            const result = await response.json();
            project = result.project;
          } else {
            console.warn("📝 [SIMPLE-LOGGER] Could not fetch project data for logging");
          }
        } catch (error) {
          console.warn("📝 [SIMPLE-LOGGER] Error fetching project data:", error);
        }
      }

      // Extract user name from currentUser
      const userName = this.extractUserName(currentUser);

      // Create the log entry
      const logEntry: SimpleLogEntry = {
        timestamp: new Date().toISOString(),
        action: type,
        user: userName,
        message,
        metadata,
      };

      // Use admin client for system logs (projectId 0)
      const client = projectId === 0 ? supabaseAdmin : supabase;

      if (!client) {
        console.error("Database client not available");
        return false;
      }

      // Get current project to append to existing log
      console.log("📝 [SIMPLE-LOGGER] Fetching project log for projectId:", projectId);
      const { data: projectData, error: fetchError } = await client
        .from("projects")
        .select("log")
        .eq("id", projectId)
        .single();

      if (fetchError) {
        console.error("📝 [SIMPLE-LOGGER] Error fetching project:", fetchError);
        return false;
      }

      // console.log("📝 [SIMPLE-LOGGER] Current project log:", projectData?.log);

      // Append new entry to existing log
      const currentLog = projectData.log || [];
      const updatedLog = [...currentLog, logEntry];

      // Update the project with the new log
      // console.log("📝 [SIMPLE-LOGGER] Updating project with new log entry:", updatedLog);
      const { error: updateError } = await client
        .from("projects")
        .update({ log: updatedLog })
        .eq("id", projectId);

      if (updateError) {
        console.error("📝 [SIMPLE-LOGGER] Error updating project log:", updateError);
        return false;
      }

      console.log(`📝 [SIMPLE-LOGGER] Successfully logged ${type}: ${message} by ${userName}`);
      return true;
    } catch (error) {
      console.error("Error in addLogEntry:", error);
      return false;
    }
  }

  /**
   * Get the log for a project
   */
  static async getProjectLog(projectId: number): Promise<SimpleLogEntry[]> {
    try {
      if (!supabase) {
        console.error("Supabase not configured");
        return [];
      }

      const { data: project, error } = await supabase
        .from("projects")
        .select("log")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Error fetching project log:", error);
        return [];
      }

      return project.log || [];
    } catch (error) {
      console.error("Error in getProjectLog:", error);
      return [];
    }
  }

  /**
   * Clear the log for a project
   */
  static async clearProjectLog(projectId: number): Promise<boolean> {
    try {
      if (!supabase) {
        console.error("Supabase not configured");
        return false;
      }

      const { error } = await supabase.from("projects").update({ log: [] }).eq("id", projectId);

      if (error) {
        console.error("Error clearing project log:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in clearProjectLog:", error);
      return false;
    }
  }

  /**
   * Extract user name from currentUser object
   */
  private static extractUserName(currentUser: any): string {
    if (!currentUser) return "System";

    // Handle different user object structures
    if (typeof currentUser === "string") return currentUser;

    // Try profile.company_name first
    if (currentUser.profile?.company_name) {
      return currentUser.profile.company_name;
    }

    // Try direct company_name
    if (currentUser.company_name) {
      return currentUser.company_name;
    }

    // Try first_name + last_name
    const firstName = currentUser.profile?.first_name || currentUser.first_name;
    const lastName = currentUser.profile?.last_name || currentUser.last_name;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    // Try email
    if (currentUser.email) {
      return currentUser.email;
    }

    // Fallback
    return "Unknown User";
  }

  /**
   * Ensure the system log project exists (ID: 0)
   */
  private static async ensureSystemLogProject(): Promise<void> {
    try {
      if (!supabaseAdmin) return;

      // Check if system project exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("id", 0)
        .single();

      if (checkError && checkError.code === "PGRST116") {
        // Project doesn't exist, create it
        const { error: createError } = await supabaseAdmin.from("projects").insert([
          {
            id: 0,
            title: "System Log",
            address: "System",
            author_id: "00000000-0000-0000-0000-000000000000",
            status: 220,
            log: [],
          },
        ]);

        if (createError) {
          console.error("Error creating system log project:", createError);
        } else {
          console.log("📝 [SYSTEM] Created system log project (ID: 0)");
        }
      }
    } catch (error) {
      console.error("Error ensuring system log project:", error);
    }
  }
}
