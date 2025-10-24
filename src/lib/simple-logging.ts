// Simple Project Logging - Clean and minimal
import { checkAuth } from "./auth";
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

// Extend globalThis to include currentUser
declare global {
  var currentUser: any;
}

export interface SimpleLogEntry {
  timestamp: string;
  action: string;
  user: string;
  message: string;
  metadata?: any;
}

// Type definitions for different log types
export type LogType =
  | "projectCreated"
  | "projectUpdated"
  | "statusChange"
  | "fileUploaded"
  | "fileDownloaded"
  | "commentAdded"
  | "assignmentChanged"
  | "discussionAdded"
  | "discussionCompleted"
  | "discussionIncomplete"
  | "punchlistAdded"
  | "punchlistCompleted"
  | "punchlistIncomplete"
  | "proposalSent"
  | "emailSent"
  | "emailFailed"
  | "browserNotificationSent"
  | "internalNotificationSent"
  | "smsNotificationSent"
  | "allNotificationsSent"
  | "userLogin"
  | "userLogout"
  | "userRegistration"
  | "adminAction"
  | "systemEvent"
  | "error"
  | "info";

export class SimpleProjectLogger {
  /**
   * Get the appropriate database client for the project
   */
  private static getClient(projectId: number) {
    return projectId === 0 ? supabaseAdmin : supabase;
  }

  /**
   * Check if database client is available and return it
   */
  private static checkClient(client: any): any {
    if (!client) {
      console.error("Database client not available");
      return null;
    }
    return client;
  }

  /**
   * Add a log entry to a project's log column
   * @param projectId - The project ID (use 0 for system logs)
   * @param type - The type of log entry (determines icon/color)
   * @param message - The log message
   * @param metadata - Optional additional data
   */
  static async addLogEntry(
    projectIdOrProject: number | any,
    type: LogType,
    message: string,
    metadata?: any,
    cookies?: any
  ): Promise<boolean> {
    try {
      // console.log("📝 [SIMPLE-LOGGER] Adding log entry:", {
      //   projectIdOrProject,
      //   type,
      //   currentUser,
      //   message,
      // });

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

      // If no project object provided, create a system project for logging
      if (!project) {
        console.log(
          "📝 [SIMPLE-LOGGER] No project object provided, creating system project for logging"
        );
        project = {
          id: projectId || 0,
          title: "System",
          address: "System Activities",
          description: "System project for logging global activities",
        };
        console.log("📝 [SIMPLE-LOGGER] Using system project for logging:", project);
      }
      // Always try to get current user - authenticate at the last minute
      let currentUser = null;

      // First, try to get user from metadata if provided
      if (metadata?.currentUser) {
        currentUser = metadata.currentUser;
      }
      // Try to extract user info from other metadata fields
      else if (metadata?.changedBy || metadata?.userId) {
        currentUser = {
          email: metadata.changedBy || metadata.userId,
          id: metadata.userId,
        };
      }
      // Try cookies if provided
      else if (cookies) {
        try {
          const authResult = await checkAuth(cookies);
          currentUser = authResult.currentUser;
        } catch (error) {
          console.warn("📝 [SIMPLE-LOGGER] Could not authenticate user for logging:", error);
        }
      }
      // Last resort: try to get user from global context if available
      else {
        try {
          // Check if we have a global current user set by middleware
          if (typeof globalThis !== "undefined" && globalThis.currentUser) {
            currentUser = globalThis.currentUser;
          }
        } catch (error) {
          // Silently fail - this is expected if not in request context
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

      // Get appropriate client
      const client = this.checkClient(this.getClient(projectId));
      if (!client) {
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
      const client = this.checkClient(this.getClient(projectId));
      if (!client) {
        return [];
      }

      const { data: project, error } = await client
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
      const client = this.checkClient(this.getClient(projectId));
      if (!client) {
        return false;
      }

      const { error } = await client.from("projects").update({ log: [] }).eq("id", projectId);

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

    // Try profile.companyName first
    if (currentUser.profile?.companyName) {
      return currentUser.profile.companyName;
    }

    // Try direct companyName
    if (currentUser.companyName) {
      return currentUser.companyName;
    }

    // Try firstName + lastName
    const firstName = currentUser.profile?.firstName || currentUser.firstName;
    const lastName = currentUser.profile?.lastName || currentUser.lastName;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    // Try just firstName if available
    if (firstName) {
      return firstName;
    }

    // Try email
    if (currentUser.email) {
      return currentUser.email;
    }

    // Try user ID as last resort
    if (currentUser.id) {
      return `User ${currentUser.id}`;
    }

    // Fallback
    return "Unknown User";
  }

  /**
   * Log user login event
   * @param userEmail - The user's email address
   * @param loginMethod - How they logged in (email, google, magiclink, etc.)
   * @param metadata - Additional login data
   */
  static async logUserLogin(
    userEmail: string,
    loginMethod: string = "email",
    metadata?: any
  ): Promise<boolean> {
    try {
      console.log("📝 [SIMPLE-LOGGER] Logging user login:", {
        userEmail,
        loginMethod,
        metadata,
      });

      const logEntry: SimpleLogEntry = {
        timestamp: new Date().toISOString(),
        action: "userLogin",
        user: userEmail,
        message: `User logged in via ${loginMethod}`,
        metadata: {
          loginMethod,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      };

      // Get admin client for global logs
      const client = this.checkClient(this.getClient(0));
      if (!client) {
        return false;
      }

      // Get current global log
      const { data: globalLogData, error: fetchError } = await client
        .from("projects")
        .select("log")
        .eq("id", 0)
        .single();

      if (fetchError) {
        console.error("📝 [SIMPLE-LOGGER] Error fetching global log:", fetchError);
        return false;
      }

      // Append new entry to global log
      const currentLog = globalLogData?.log || [];
      const updatedLog = [...currentLog, logEntry];

      // Update global log
      const { error: updateError } = await client
        .from("projects")
        .update({ log: updatedLog })
        .eq("id", 0);

      if (updateError) {
        console.error("📝 [SIMPLE-LOGGER] Error updating global log:", updateError);
        return false;
      }

      console.log("✅ [SIMPLE-LOGGER] User login logged successfully");
      return true;
    } catch (error) {
      console.error("📝 [SIMPLE-LOGGER] Error logging user login:", error);
      return false;
    }
  }

  /**
   * Log user logout event
   * @param userEmail - The user's email address
   * @param metadata - Additional logout data
   */
  static async logUserLogout(userEmail: string, metadata?: any): Promise<boolean> {
    try {
      console.log("📝 [SIMPLE-LOGGER] Logging user logout:", {
        userEmail,
        metadata,
      });

      const logEntry: SimpleLogEntry = {
        timestamp: new Date().toISOString(),
        action: "userLogout",
        user: userEmail,
        message: `User logged out`,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      };

      // Get admin client for global logs
      const client = this.checkClient(this.getClient(0));
      if (!client) {
        return false;
      }

      // Get current global log
      const { data: globalLogData, error: fetchError } = await client
        .from("projects")
        .select("log")
        .eq("id", 0)
        .single();

      if (fetchError) {
        console.error("📝 [SIMPLE-LOGGER] Error fetching global log:", fetchError);
        return false;
      }

      // Append new entry to global log
      const currentLog = globalLogData?.log || [];
      const updatedLog = [...currentLog, logEntry];

      // Update global log
      const { error: updateError } = await client
        .from("projects")
        .update({ log: updatedLog })
        .eq("id", 0);

      if (updateError) {
        console.error("📝 [SIMPLE-LOGGER] Error updating global log:", updateError);
        return false;
      }

      console.log("✅ [SIMPLE-LOGGER] User logout logged successfully");
      return true;
    } catch (error) {
      console.error("📝 [SIMPLE-LOGGER] Error logging user logout:", error);
      return false;
    }
  }
}
