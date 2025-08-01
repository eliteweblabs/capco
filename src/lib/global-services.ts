// Global Services - Centralized API and utility functions
import { emailService } from "./email-service";
import { supabase } from "./supabase";

export interface ProjectStatusUpdate {
  projectId: string;
  status: "draft" | "in-progress" | "review" | "completed" | "archived";
  metadata?: Record<string, any>;
  updatedBy?: string;
}

export interface NotificationOptions {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface GlobalServiceEvent {
  type: string;
  data: any;
  source?: string;
}

export class GlobalServices {
  private static instance: GlobalServices;
  private eventTarget: EventTarget;

  constructor() {
    this.eventTarget = new EventTarget();
  }

  static getInstance(): GlobalServices {
    if (!GlobalServices.instance) {
      GlobalServices.instance = new GlobalServices();
    }
    return GlobalServices.instance;
  }

  // Event Management
  emit(type: string, data: any, source?: string) {
    const event = new CustomEvent("global-service", {
      detail: { type, data, source } as GlobalServiceEvent,
    });
    this.eventTarget.dispatchEvent(event);

    // Also dispatch to window for cross-component access
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(`global:${type}`, { detail: data }));
    }
  }

  on(type: string, callback: (data: any) => void) {
    const handler = (event: CustomEvent<GlobalServiceEvent>) => {
      if (event.detail.type === type) {
        callback(event.detail.data);
      }
    };
    this.eventTarget.addEventListener(
      "global-service",
      handler as EventListener,
    );
    return () =>
      this.eventTarget.removeEventListener(
        "global-service",
        handler as EventListener,
      );
  }

  // Email Functions
  async sendEmail(options: {
    to: string | string[];
    type: "welcome" | "password-reset" | "notification" | "custom";
    variables?: Record<string, string>;
    subject?: string;
    html?: string;
    text?: string;
  }) {
    try {
      this.emit("email:sending", { to: options.to, type: options.type });

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (result.success) {
        this.emit("email:sent", { ...options, messageId: result.messageId });
        this.showNotification({
          type: "success",
          title: "Email Sent",
          message: `Email sent successfully to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`,
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      this.emit("email:error", { ...options, error: error.message });
      this.showNotification({
        type: "error",
        title: "Email Failed",
        message: error.message || "Failed to send email",
      });
      throw error;
    }
  }

  // Project Status Functions
  async updateProjectStatus(update: ProjectStatusUpdate) {
    try {
      this.emit("project:status-updating", update);

      const response = await this.makeApiCall("/api/update-project-status", {
        method: "POST",
        body: JSON.stringify(update),
      });

      this.emit("project:status-updated", { ...update, data: response });
      this.showNotification({
        type: "success",
        title: "Project Updated",
        message:
          response.message || `Project status changed to ${update.status}`,
      });

      return response;
    } catch (error) {
      this.emit("project:status-error", { ...update, error: error.message });
      this.showNotification({
        type: "error",
        title: "Update Failed",
        message: error.message || "Failed to update project status",
      });
      throw error;
    }
  }

  // Create test project for demo purposes
  async createTestProject() {
    try {
      console.log("Creating test project...");
      const response = await this.makeApiCall("/api/create-test-project", {
        method: "POST",
        body: JSON.stringify({}),
      });

      console.log("Test project created successfully:", response);
      this.showNotification({
        type: "success",
        title: "Test Project Created",
        message: response.message || "Test project created successfully",
      });

      return response.project;
    } catch (error) {
      console.error("Failed to create test project:", error);
      this.showNotification({
        type: "error",
        title: "Failed to Create Project",
        message: error.message || "Failed to create test project",
      });
      throw error;
    }
  }

  async getProjectStatus(projectId: string) {
    try {
      if (!supabase) {
        throw new Error("Database not configured");
      }

      const { data, error } = await supabase
        .from("projects")
        .select("status, metadata, updated_at, updated_by")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.emit("project:status-error", { projectId, error: error.message });
      throw error;
    }
  }

  // File Upload Functions
  async uploadFiles(files: FileList | File[], projectId?: string) {
    try {
      this.emit("files:uploading", { files: Array.from(files), projectId });

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      if (projectId) {
        formData.append("projectId", projectId);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        this.emit("files:uploaded", {
          files: Array.from(files),
          result,
          projectId,
        });
        this.showNotification({
          type: "success",
          title: "Files Uploaded",
          message: `Successfully uploaded ${files.length} file(s)`,
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      this.emit("files:error", {
        files: Array.from(files),
        error: error.message,
        projectId,
      });
      this.showNotification({
        type: "error",
        title: "Upload Failed",
        message: error.message || "Failed to upload files",
      });
      throw error;
    }
  }

  // Notification System
  showNotification(options: NotificationOptions) {
    this.emit("notification:show", options);
  }

  hideNotification(id?: string) {
    this.emit("notification:hide", { id });
  }

  // Utility Functions
  async makeApiCall(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Try to get the error details from the response
        let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch {
          // If we can't parse JSON, just use the basic error
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("API call error:", {
        endpoint,
        error: error.message,
        options,
      });
      this.emit("api:error", { endpoint, error: error.message });
      throw error;
    }
  }

  // Auth helpers
  async getCurrentUser() {
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (!error) {
      this.emit("auth:signout", {});
    }
    return { error };
  }
}

// Export singleton instance
export const globalServices = GlobalServices.getInstance();

// Export convenience functions
export const sendEmail = (
  options: Parameters<typeof globalServices.sendEmail>[0],
) => globalServices.sendEmail(options);

export const updateProjectStatus = (update: ProjectStatusUpdate) =>
  globalServices.updateProjectStatus(update);

export const showNotification = (options: NotificationOptions) =>
  globalServices.showNotification(options);

export const uploadFiles = (files: FileList | File[], projectId?: string) =>
  globalServices.uploadFiles(files, projectId);

export const createTestProject = () => globalServices.createTestProject();

// Hook for listening to global events
export const useGlobalEvents = () => ({
  on: globalServices.on.bind(globalServices),
  emit: globalServices.emit.bind(globalServices),
});

// Event types for TypeScript
export type GlobalEventType =
  | "email:sending"
  | "email:sent"
  | "email:error"
  | "project:status-updating"
  | "project:status-updated"
  | "project:status-error"
  | "files:uploading"
  | "files:uploaded"
  | "files:error"
  | "notification:show"
  | "notification:hide"
  | "auth:signout"
  | "api:error";
