// Simple Project Logging - Just append to a JSON column
import { supabase } from "./supabase";

export interface SimpleLogEntry {
  timestamp: string;
  action: string;
  user: string;
  details: string;
  old_value?: any;
  new_value?: any;
}

export class SimpleProjectLogger {
  /**
   * Add a log entry to a project's log column
   */
  static async addLogEntry(
    projectId: number,
    action: string,
    userEmail: string,
    details: string,
    oldValue?: any,
    newValue?: any
  ): Promise<boolean> {
    try {
      if (!supabase) {
        console.error("Supabase not configured");
        return false;
      }

      // Create the log entry
      const logEntry: SimpleLogEntry = {
        timestamp: new Date().toISOString(),
        action,
        user: userEmail,
        details,
        old_value: oldValue,
        new_value: newValue,
      };

      // Get current project to append to existing log
      const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("log")
        .eq("id", projectId)
        .single();

      if (fetchError) {
        console.error("Error fetching project:", fetchError);
        return false;
      }

      // Append new entry to existing log
      const currentLog = project.log || [];
      const updatedLog = [...currentLog, logEntry];

      // Update the project with the new log
      const { error: updateError } = await supabase
        .from("projects")
        .update({ log: updatedLog })
        .eq("id", projectId);

      if (updateError) {
        console.error("Error updating project log:", updateError);
        return false;
      }

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
   * Clear the log for a project (optional)
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
   * Convenience methods for common actions
   */
  static async logProjectCreation(projectId: number, userEmail: string, projectData: any) {
    return await this.addLogEntry(
      projectId,
      "project_created",
      userEmail,
      "Project was created",
      null,
      projectData
    );
  }

  static async logStatusChange(
    projectId: number,
    userEmail: string,
    oldStatus: number,
    newStatus: number
  ) {
    return await this.addLogEntry(
      projectId,
      "status_change",
      userEmail,
      `Status changed from ${oldStatus} to ${newStatus}`,
      oldStatus,
      newStatus
    );
  }

  static async logProjectUpdate(
    projectId: number,
    userEmail: string,
    details: string,
    oldData?: any,
    newData?: any
  ) {
    return await this.addLogEntry(
      projectId,
      "project_updated",
      userEmail,
      details,
      oldData,
      newData
    );
  }

  static async logFileUpload(projectId: number, userEmail: string, fileName: string) {
    return await this.addLogEntry(
      projectId,
      "file_uploaded",
      userEmail,
      `File uploaded: ${fileName}`,
      null,
      { fileName }
    );
  }

  static async logComment(projectId: number, userEmail: string, comment: string) {
    return await this.addLogEntry(projectId, "comment_added", userEmail, comment);
  }
}
