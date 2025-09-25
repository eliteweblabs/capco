// Simple Project Logging - Just append to a JSON column
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

export interface SimpleLogEntry {
  timestamp: string;
  action: string;
  user: any;
  details: string;
  old_value?: any;
  new_value?: any;
}

// Removed global user fetch - user data is now passed as parameters to functions

export class SimpleProjectLogger {
  /**
   * Add a log entry to a project's log column
   */

  static async addLogEntry(
    projectId: number,
    action: string,
    user: any,
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
        user: user, // This should be the company name from resolveUserIdToName
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
  static async logProjectCreation(projectId: number, user: any, projectData: any) {
    const userName =
      user?.company_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      "Unknown User";

    return await this.addLogEntry(
      projectId,
      "project_created",
      userName,
      "Project was created",
      null,
      projectData
    );
  }

  static async logStatusChange(projectId: number, user: any, oldStatus: number, newStatus: number) {
    // Try to get human-readable status names
    const statusNames = await this.getStatusNames();
    const oldStatusName = statusNames[oldStatus] || `Status ${oldStatus}`;
    const newStatusName = statusNames[newStatus] || `Status ${newStatus}`;
    const userName =
      user?.company_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      "Unknown User";

    return await this.addLogEntry(
      projectId,
      "status_change",
      userName,
      `Status changed from "${oldStatusName}" to "${newStatusName}"`,
      { status: oldStatus, name: oldStatusName },
      { status: newStatus, name: newStatusName }
    );
  }

  /**
   * Get status names from the database directly
   */
  private static async getStatusNames(): Promise<Record<number, string>> {
    try {
      // Try to fetch status names directly from the database
      if (supabase) {
        const { data: statuses, error } = await supabase
          .from("project_statuses")
          .select("status_code, admin_status_name");

        if (!error && statuses) {
          const statusNames: Record<number, string> = {};
          statuses.forEach((status: any) => {
            statusNames[status.status_code] = status.admin_status_name;
          });
          return statusNames;
        }
      }
    } catch (error) {
      console.warn("Could not fetch status names from database:", error);
    }

    // Fallback to basic status names
    const fallbackStatuses: Record<number, string> = {
      10: "Specs Received",
      20: "Generating Proposal",
      30: "Proposal Shipped",
      40: "Proposal Viewed",
      50: "Proposal Signed Off",
      60: "Generating Deposit Invoice",
      70: "Deposit Invoice Shipped",
      80: "Deposit Invoice Viewed",
      90: "Deposit Invoice Paid",
      100: "Generating Submittals",
      110: "Submittals Shipped",
      120: "Submittals Viewed",
      130: "Submittals Signed Off",
      140: "Generating Final Invoice",
      150: "Final Invoice Shipped",
      160: "Final Invoice Viewed",
      170: "Final Invoice Paid",
      180: "Generating Final Deliverables",
      190: "Stamping Final Deliverables",
      200: "Final Deliverables Shipped",
      210: "Final Deliverables Viewed",
      220: "Project Complete",
    };

    return fallbackStatuses;
  }

  /**
   * Get user names for assignment logging
   */
  private static async getAssignmentNames(userIds: string[]): Promise<Record<string, string>> {
    try {
      if (supabase && userIds.length > 0) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, company_name, first_name, last_name")
          .in("id", userIds);

        if (!error && profiles) {
          const userNames: Record<string, string> = {};
          profiles.forEach((profile: any) => {
            userNames[profile.id] =
              profile.company_name ||
              `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
              "Unknown User";
          });
          return userNames;
        }
      }
    } catch (error) {
      console.warn("Could not fetch assignment names from database:", error);
    }

    return {};
  }

  static async logProjectUpdate(
    projectId: number,
    user: any,
    details: string,
    oldData?: any,
    newData?: any
  ) {
    const userName =
      user?.company_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      "Unknown User";

    return await this.addLogEntry(
      projectId,
      "project_updated",
      userName,
      details,
      oldData,
      newData
    );
  }

  /**
   * Enhanced project update logging with granular change detection
   */
  static async logProjectChanges(projectId: number, user: any, oldData: any, newData: any) {
    const userName = user?.company_name || user?.first_name || user?.last_name || "Unknown User";
    // Detect status changes
    if (oldData.status !== newData.status) {
      console.log(
        `📝 [LOGGING] Status change detected for project ${projectId}: ${oldData.status} -> ${newData.status}`
      );
      await this.logStatusChange(projectId, userName, oldData.status, newData.status);
    }

    // Detect assignment changes
    if (oldData.assigned_to_id !== newData.assigned_to_id) {
      // Try to get user names for assignments
      const assignmentNames = await this.getAssignmentNames(
        [oldData.assigned_to_id, newData.assigned_to_id].filter(Boolean)
      );

      const oldAssignment = oldData.assigned_to_id
        ? assignmentNames[oldData.assigned_to_id] || `User ${oldData.assigned_to_id}`
        : "Unassigned";
      const newAssignment = newData.assigned_to_id
        ? assignmentNames[newData.assigned_to_id] || `User ${newData.assigned_to_id}`
        : "Unassigned";

      await this.addLogEntry(
        projectId,
        "assignment_changed",
        userName,
        `Project assignment changed from ${oldAssignment} to ${newAssignment}`,
        { id: oldData.assigned_to_id, name: oldAssignment },
        { id: newData.assigned_to_id, name: newAssignment }
      );
    }

    // Detect metadata changes (basic project data)
    const metadataFields = [
      "title",
      "description",
      "address",
      "sq_ft",
      "new_construction",
      "architect",
      "units",
    ];
    const changedMetadata = metadataFields.filter((field) => oldData[field] !== newData[field]);

    if (changedMetadata.length > 0) {
      const changedFieldsList = changedMetadata.join(", ");
      await this.addLogEntry(
        projectId,
        "metadata_updated",
        userName,
        `Project metadata updated: ${changedFieldsList}`,
        oldData,
        newData
      );
    }

    // Detect project configuration changes (building, project, service, requested_docs)
    const configFields = ["building", "project", "service", "requested_docs"];
    const changedConfig = configFields.filter((field) => {
      // For arrays and objects, do a deep comparison
      const oldValue = JSON.stringify(oldData[field]);
      const newValue = JSON.stringify(newData[field]);
      return oldValue !== newValue;
    });

    if (changedConfig.length > 0) {
      const changedConfigList = changedConfig.join(", ");
      await this.addLogEntry(
        projectId,
        "configuration_updated",
        userName,
        `Project configuration updated: ${changedConfigList}`,
        oldData,
        newData
      );
    }

    return true;
  }

  static async logFileUpload(projectId: number, user: any, fileName: string) {
    const userName =
      user?.company_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      "Unknown User";

    return await this.addLogEntry(
      projectId,
      "file_uploaded",
      userName,
      `File uploaded: ${fileName}`,
      null,
      { fileName }
    );
  }

  static async logComment(projectId: number, user: any, comment: string) {
    const userName =
      user?.company_name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      "Unknown User";

    return await this.addLogEntry(projectId, "comment_added", userName, comment);
  }

  static async logDiscussionToggle(
    projectId: number,
    discussionId: number,
    isCompleted: boolean,
    currentUser: any,
    messagePreview: string
  ) {
    const action = isCompleted ? "discussion_completed" : "discussion_incomplete";

    // Extract company name from user object
    const userName =
      currentUser?.profile?.company_name ||
      `${currentUser?.profile?.first_name || ""} ${currentUser?.profile?.last_name || ""}`.trim() ||
      "Unknown User";

    const details = `Discussion ${isCompleted ? "marked as completed" : "marked as incomplete"}: ${messagePreview}`;

    return await this.addLogEntry(
      projectId,
      action,
      userName,
      details,
      { discussionId, completed: !isCompleted },
      { discussionId, completed: isCompleted }
    );
  }

  static async logPunchlistToggle(
    projectId: number,
    punchlistId: number,
    isCompleted: boolean,
    currentUser: any,
    messagePreview: string
  ) {
    const action = isCompleted ? "punchlist_completed" : "punchlist_incomplete";

    // Extract company name from user object
    const userName =
      currentUser?.profile?.company_name ||
      `${currentUser?.profile?.first_name || ""} ${currentUser?.profile?.last_name || ""}`.trim() ||
      "Unknown User";

    const details = `Punchlist item ${isCompleted ? "marked as completed" : "marked as incomplete"}: ${messagePreview}`;

    return await this.addLogEntry(
      projectId,
      action,
      userName,
      details,
      { punchlistId, completed: !isCompleted },
      { punchlistId, completed: isCompleted }
    );
  }

  // ===== USER EVENT LOGGING METHODS =====

  /**
   * Log user login events
   */
  static async logUserLogin(userEmail: string, loginMethod: string = "password", metadata?: any) {
    return await this.addUserLogEntry(
      "user_login",
      userEmail,
      `User logged in via ${loginMethod}`,
      null,
      { loginMethod, ...metadata }
    );
  }

  /**
   * Log user registration events
   */
  static async logUserRegistration(
    userEmail: string,
    registrationMethod: string = "email",
    userData?: any
  ) {
    return await this.addUserLogEntry(
      "user_registration",
      userEmail,
      `New user registered via ${registrationMethod}`,
      null,
      { registrationMethod, userData }
    );
  }

  /**
   * Log admin-created user events
   */
  static async logAdminUserCreation(
    adminEmail: string,
    newUserEmail: string,
    userRole: string,
    userData?: any
  ) {
    return await this.addUserLogEntry(
      "admin_user_creation",
      adminEmail,
      `Admin created new ${userRole} user: ${newUserEmail}`,
      null,
      { newUserEmail, userRole, userData }
    );
  }

  /**
   * Log user profile updates
   */
  static async logUserProfileUpdate(userEmail: string, oldData: any, newData: any) {
    return await this.addUserLogEntry(
      "profile_updated",
      userEmail,
      "User profile updated",
      oldData,
      newData
    );
  }

  /**
   * Log password changes
   */
  static async logPasswordChange(userEmail: string, changeType: string = "password_change") {
    return await this.addUserLogEntry(
      "password_change",
      userEmail,
      `Password ${changeType}`,
      null,
      { changeType }
    );
  }

  /**
   * Log failed login attempts
   */
  static async logFailedLogin(email: string, reason: string, metadata?: any) {
    return await this.addUserLogEntry(
      "failed_login",
      email,
      `Failed login attempt: ${reason}`,
      null,
      { reason, ...metadata }
    );
  }

  /**
   * Add a user log entry to a special "system_log" project (ID: 0)
   * This keeps all user events in the same logging system
   */
  private static async addUserLogEntry(
    action: string,
    userEmail: string,
    details: string,
    oldValue?: any,
    newValue?: any
  ): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        console.error("Supabase admin not configured");
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

      // Use a special system project (ID: 0) for user events
      // First, ensure this system project exists
      await this.ensureSystemLogProject();

      // Get current system log to append to existing log
      const { data: project, error: fetchError } = await supabaseAdmin
        .from("projects")
        .select("log")
        .eq("id", 0)
        .single();

      if (fetchError) {
        console.error("Error fetching system log project:", fetchError);
        return false;
      }

      // Append new entry to existing log
      const currentLog = project.log || [];
      const updatedLog = [...currentLog, logEntry];

      // Update the system project with the new log
      const { error: updateError } = await supabaseAdmin
        .from("projects")
        .update({ log: updatedLog })
        .eq("id", 0);

      if (updateError) {
        console.error("Error updating system log:", updateError);
        return false;
      }

      console.log(`📝 [USER-LOG] ${action}: ${details} by ${userEmail}`);
      return true;
    } catch (error) {
      console.error("Error in addUserLogEntry:", error);
      return false;
    }
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
            author_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
            status: 220, // Complete status
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

  /**
   * Get user activity log from the system project
   */
  static async getUserActivityLog(): Promise<SimpleLogEntry[]> {
    try {
      if (!supabaseAdmin) {
        console.error("Supabase admin not configured");
        return [];
      }

      const { data: project, error } = await supabaseAdmin
        .from("projects")
        .select("log")
        .eq("id", 0)
        .single();

      if (error) {
        console.error("Error fetching user activity log:", error);
        return [];
      }

      return project.log || [];
    } catch (error) {
      console.error("Error in getUserActivityLog:", error);
      return [];
    }
  }
}
