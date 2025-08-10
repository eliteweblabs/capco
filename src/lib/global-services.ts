// Global Services - Centralized API and utility functions
import { emailService } from "./email-service";
import { supabase } from "./supabase";

// Project Status Codes (for backward compatibility)
export const PROJECT_STATUS = {
  SPECS_RECEIVED: 10,
  GENERATING_PROPOSAL: 20,
  PROPOSAL_SHIPPED: 30,
  PROPOSAL_VIEWED: 40,
  PROPOSAL_SIGNED_OFF: 50,
  GENERATING_DEPOSIT_INVOICE: 60,
  DEPOSIT_INVOICE_SHIPPED: 70,
  DEPOSIT_INVOICE_VIEWED: 80,
  DEPOSIT_INVOICE_PAID: 90,
  GENERATING_SUBMITTALS: 100,
  SUBMITTALS_SHIPPED: 110,
  SUBMITTALS_VIEWED: 120,
  SUBMITTALS_SIGNED_OFF: 130,
  GENERATING_FINAL_INVOICE: 140,
  FINAL_INVOICE_SHIPPED: 150,
  FINAL_INVOICE_VIEWED: 160,
  FINAL_INVOICE_PAID: 170,
  GENERATING_FINAL_DELIVERABLES: 180,
  STAMPING_FINAL_DELIVERABLES: 190,
  FINAL_DELIVERABLES_SHIPPED: 200,
  FINAL_DELIVERABLES_VIEWED: 210,
  PROJECT_COMPLETE: 220,
} as const;

export type ProjectStatusCode =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

// Dynamic status labels from database
let PROJECT_STATUS_LABELS: Record<number, string> = {};
let PROJECT_STATUS_DATA: Record<
  number,
  {
    status_name: string;
    email_content: string;
    est_time: string;
    notify: string[];
  }
> = {};

// Function to load status data from database
export async function loadProjectStatuses() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("project_statuses")
        .select("status_code, status_name, email_content, est_time, notify")
        .order("status_code");

      if (error) throw error;

      const statuses = (data || []).reduce(
        (acc, s: any) => {
          acc[s.status_code] = {
            status_name: s.status_name,
            email_content: s.email_content,
            est_time: s.est_time,
            notify: s.notify || ["admin"],
          } as any;
          return acc;
        },
        {} as Record<
          number,
          {
            status_name: string;
            email_content: string;
            est_time: string;
            notify: string[];
          }
        >,
      );

      PROJECT_STATUS_DATA = statuses;
      PROJECT_STATUS_LABELS = Object.entries(statuses).reduce(
        (acc, [code, data]) => {
          acc[parseInt(code)] = (data as any).status_name;
          return acc;
        },
        {} as Record<number, string>,
      );

      return statuses;
    }
  } catch (error) {
    console.error("Failed to load project statuses:", error);
  }

  // Fallback to static labels if database fails
  PROJECT_STATUS_LABELS = {
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

  return PROJECT_STATUS_LABELS;
}

// Export the dynamic labels
export { PROJECT_STATUS_LABELS, PROJECT_STATUS_DATA };

// Function to get status data for a specific status code
export function getStatusData(statusCode: number) {
  return (
    PROJECT_STATUS_DATA[statusCode] || {
      status_name: PROJECT_STATUS_LABELS[statusCode] || "Unknown Status",
      email_content: "Your project status has been updated.",
      est_time: "TBD",
      notify: ["admin"],
    }
  );
}

// Function to check if a status should trigger client emails
export function shouldEmailClient(statusCode: number): boolean {
  const statusData = getStatusData(statusCode);
  return statusData.notify.includes("client");
}

// Function to check if a status should trigger staff emails
export function shouldEmailStaff(statusCode: number): boolean {
  const statusData = getStatusData(statusCode);
  return statusData.notify.includes("staff");
}

// Timing information for status stages
export const PROJECT_STATUS_TIMING: Record<
  ProjectStatusCode,
  { default?: string; expedited?: string }
> = {
  [PROJECT_STATUS.SPECS_RECEIVED]: {},
  [PROJECT_STATUS.GENERATING_PROPOSAL]: {
    default: "24hrs",
    expedited: "12hrs",
  },
  [PROJECT_STATUS.PROPOSAL_SHIPPED]: {},
  [PROJECT_STATUS.PROPOSAL_VIEWED]: {},
  [PROJECT_STATUS.PROPOSAL_SIGNED_OFF]: {},
  [PROJECT_STATUS.GENERATING_DEPOSIT_INVOICE]: {
    default: "2hrs",
    expedited: "1hrs",
  },
  [PROJECT_STATUS.DEPOSIT_INVOICE_SHIPPED]: {},
  [PROJECT_STATUS.DEPOSIT_INVOICE_VIEWED]: {},
  [PROJECT_STATUS.DEPOSIT_INVOICE_PAID]: {},
  [PROJECT_STATUS.GENERATING_SUBMITTALS]: {
    default: "24hrs",
    expedited: "12hrs",
  },
  [PROJECT_STATUS.SUBMITTALS_SHIPPED]: {},
  [PROJECT_STATUS.SUBMITTALS_VIEWED]: {},
  [PROJECT_STATUS.SUBMITTALS_SIGNED_OFF]: {},
  [PROJECT_STATUS.GENERATING_FINAL_INVOICE]: {
    default: "2hrs",
    expedited: "1hrs",
  },
  [PROJECT_STATUS.FINAL_INVOICE_SHIPPED]: {},
  [PROJECT_STATUS.FINAL_INVOICE_VIEWED]: {},
  [PROJECT_STATUS.FINAL_INVOICE_PAID]: {},
  [PROJECT_STATUS.GENERATING_FINAL_DELIVERABLES]: {
    default: "24hrs",
    expedited: "12hrs",
  },
  [PROJECT_STATUS.STAMPING_FINAL_DELIVERABLES]: {
    default: "12hrs",
    expedited: "6hrs",
  },
  [PROJECT_STATUS.FINAL_DELIVERABLES_SHIPPED]: {},
  [PROJECT_STATUS.FINAL_DELIVERABLES_VIEWED]: {},
  [PROJECT_STATUS.PROJECT_COMPLETE]: {},
};

export interface ProjectStatusUpdate {
  projectId: string;
  status?: ProjectStatusCode;
  title?: string;
  description?: string;
  address?: string;
  sq_ft?: number;
  new_construction?: boolean;
  building?: any; // JSONB
  project?: any; // JSONB
  service?: any; // JSONB
  requested_docs?: any; // JSONB
  assigned_to_id?: string;
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

  // Utility functions for status management
  getStatusLabel(status: ProjectStatusCode): string {
    return PROJECT_STATUS_LABELS[status] || `Status ${status}`;
  }

  getStatusTiming(status: ProjectStatusCode): {
    default?: string;
    expedited?: string;
  } {
    return PROJECT_STATUS_TIMING[status] || {};
  }

  getNextStatus(currentStatus: ProjectStatusCode): ProjectStatusCode | null {
    const statusSequence = Object.values(PROJECT_STATUS).sort((a, b) => a - b);
    const currentIndex = statusSequence.indexOf(currentStatus);
    return currentIndex >= 0 && currentIndex < statusSequence.length - 1
      ? statusSequence[currentIndex + 1]
      : null;
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
          message:
            result.message ||
            `Email sent successfully to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`,
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      this.emit("email:error", { ...options, error: (error as Error).message });
      this.showNotification({
        type: "error",
        title: "Email Failed",
        message: (error as Error).message || "Failed to send email",
        duration: 0, // Errors stay until manually dismissed
      });
      throw error;
    }
  }

  // React Email Functions
  async sendReactEmail(options: {
    to: string | string[];
    type: "welcome" | "project-notification" | "test";
    [key: string]: any; // For additional props like name, projectTitle, etc.
  }) {
    try {
      this.emit("email:sending", { to: options.to, type: options.type });

      const response = await fetch("/api/send-react-email", {
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
          message:
            result.message ||
            `Email sent successfully to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`,
        });
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      this.emit("email:error", { ...options, error: (error as Error).message });
      this.showNotification({
        type: "error",
        title: "Email Failed",
        message: (error as Error).message || "Failed to send React email",
        duration: 0, // Errors stay until manually dismissed
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
        message: response.message || "Project updated successfully",
      });

      return response;
    } catch (error) {
      this.emit("project:status-error", {
        ...update,
        error: (error as Error).message,
      });
      this.showNotification({
        type: "error",
        title: "Update Failed",
        message: (error as Error).message || "Failed to update project status",
        duration: 0, // Errors stay until manually dismissed
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
        message: (error as Error).message || "Failed to create test project",
        duration: 0, // Errors stay until manually dismissed
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
      this.emit("project:status-error", {
        projectId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Project Management Functions
  async getUserProjects() {
    try {
      const response = await this.makeApiCall("/api/get-user-projects", {
        method: "GET",
      });

      // Extract the projects array from the response
      const projects = response.projects || [];
      this.emit("projects:fetched", { projects });
      return projects;
    } catch (error) {
      this.emit("projects:fetch-error", { error: (error as Error).message });
      this.showNotification({
        type: "error",
        title: "Failed to Load Projects",
        message: (error as Error).message,
        duration: 0, // Errors stay until manually dismissed
      });
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
        error: (error as Error).message,
        projectId,
      });
      this.showNotification({
        type: "error",
        title: "Upload Failed",
        message: (error as Error).message || "Failed to upload files",
        duration: 0, // Errors stay until manually dismissed
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
        error: (error as Error).message,
        options,
      });
      this.emit("api:error", { endpoint, error: (error as Error).message });
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

// React Email convenience function
export const sendReactEmail = (
  options: Parameters<typeof globalServices.sendReactEmail>[0],
) => globalServices.sendReactEmail(options);

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

// Utility function to format time difference since last update
export function formatTimeSinceUpdate(
  updatedAt: string | null | undefined,
): string {
  if (!updatedAt) return "Unknown";

  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now.getTime() - updated.getTime();

  // Convert to different time units
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));

  // Return formatted string based on time difference
  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes === 0) {
      return `${diffHours}h`;
    }
    return `${diffHours}h, ${remainingMinutes}m`;
  } else if (diffDays < 7) {
    const remainingHours = diffHours % 24;
    if (remainingHours === 0) {
      return `${diffDays}d`;
    }
    return `${diffDays}d, ${remainingHours}h`;
  } else if (diffWeeks < 4) {
    const remainingDays = diffDays % 7;
    if (remainingDays === 0) {
      return `${diffWeeks}w`;
    }
    return `${diffWeeks}w, ${remainingDays}d`;
  } else if (diffMonths < 12) {
    const remainingWeeks = Math.floor((diffDays % 30) / 7);
    if (remainingWeeks === 0) {
      return `${diffMonths}mo`;
    }
    return `${diffMonths}mo, ${remainingWeeks}w`;
  } else {
    const remainingMonths = diffMonths % 12;
    if (remainingMonths === 0) {
      return `${diffYears}y`;
    }
    return `${diffYears}y, ${remainingMonths}mo`;
  }
}
