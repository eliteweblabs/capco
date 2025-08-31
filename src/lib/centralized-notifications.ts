/**
 * Centralized Notification System
 *
 * This system replaces the global services notification system and provides
 * a unified way to show notifications across the application.
 *
 * Features:
 * - Toast notifications with role-based messaging
 * - Database-driven message content
 * - Placeholder replacement
 * - Fallback support for legacy notifications
 */

export interface NotificationOptions {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  id?: string;
}

export interface ToastMessageData {
  projectTitle?: string;
  clientEmail?: string;
  clientName?: string;
  projectAddress?: string;
  statusName?: string;
  estTime?: string;
  [key: string]: any;
}

/**
 * Show a notification using the centralized system
 * This replaces globalServices.showNotification
 */
export function showNotification(options: NotificationOptions): void {
  console.log("🔔 [CENTRALIZED] Showing notification:", options);

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("🔔 [CENTRALIZED] Not in browser environment, skipping notification");
    return;
  }

  // Try to use the toast alert manager directly
  if ((window as any).toastAlertManager) {
    console.log("🔔 [CENTRALIZED] Using toast alert manager");
    (window as any).toastAlertManager.show(options);
    return;
  }

  // Fallback to global services if available
  if ((window as any).globalServices?.showNotification) {
    console.log("🔔 [CENTRALIZED] Using global services fallback");
    (window as any).globalServices.showNotification(options);
    return;
  }

  // Final fallback to console logging
  const logLevel = options.type === "error" ? "error" : "log";
  console[logLevel](`🔔 [${options.type.toUpperCase()}] ${options.title}: ${options.message}`);
}

/**
 * Show a success notification
 */
export function showSuccess(title: string, message: string, duration: number = 5000): void {
  showNotification({
    type: "success",
    title,
    message,
    duration,
  });
}

/**
 * Show an error notification
 */
export function showError(title: string, message: string, duration: number = 0): void {
  showNotification({
    type: "error",
    title,
    message,
    duration, // Keep error messages until manually dismissed
  });
}

/**
 * Show a warning notification
 */
export function showWarning(title: string, message: string, duration: number = 5000): void {
  showNotification({
    type: "warning",
    title,
    message,
    duration,
  });
}

/**
 * Show an info notification
 */
export function showInfo(title: string, message: string, duration: number = 5000): void {
  showNotification({
    type: "info",
    title,
    message,
    duration,
  });
}

/**
 * Replace placeholders in toast messages with actual data
 * @param message - The message template with placeholders
 * @param data - The data to replace placeholders with
 * @returns The message with placeholders replaced
 */
export function replaceToastPlaceholders(message: string, data: ToastMessageData): string {
  if (!message) return "";

  let result = message;

  // Replace common placeholders
  const placeholders = {
    "{{PROJECT_TITLE}}": data.projectTitle || "Project",
    "{{CLIENT_EMAIL}}": data.clientEmail || "Client",
    "{{CLIENT_NAME}}": data.clientName || "Client",
    "{{PROJECT_ADDRESS}}": data.projectAddress || "N/A",
    "{{STATUS_NAME}}": data.statusName || "Status Update",
    "{{EST_TIME}}": data.estTime || "2-3 business days", // From status configuration
  };

  // Replace each placeholder
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder, "g"), value);
  });

  // Replace any custom placeholders from data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key.toUpperCase()}}}`;
    if (result.includes(placeholder)) {
      result = result.replace(new RegExp(placeholder, "g"), value?.toString() || "");
    }
  });

  return result;
}

/**
 * Get appropriate toast message based on user role and status
 * @param statusConfig - Status configuration from database
 * @param userRole - Current user's role
 * @param data - Data for placeholder replacement
 * @returns The appropriate toast message
 */
export function getToastMessage(
  statusConfig: { toast_admin?: string; toast_client?: string },
  userRole: string,
  data: ToastMessageData
): string {
  let message = "";

  // Determine which message to use based on role
  if (userRole === "Admin" || userRole === "Staff") {
    message = statusConfig.toast_admin || "";
  } else {
    message = statusConfig.toast_client || "";
  }

  // Replace placeholders
  return replaceToastPlaceholders(message, data);
}

/**
 * Prepare toast message data from project and user information
 * @param project - Project data
 * @param user - User data
 * @param statusName - Status name
 * @returns Formatted data for toast message placeholders
 */
export function prepareToastData(
  project: any,
  user: any,
  statusName?: string,
  estTime?: string
): ToastMessageData {
  return {
    projectTitle: project?.title || "Project",
    clientEmail: project?.profiles?.[0]?.email || user?.email || "Client",
    clientName:
      project?.profiles?.[0]?.first_name && project?.profiles?.[0]?.last_name
        ? `${project.profiles[0].first_name} ${project.profiles[0].last_name}`
        : project?.profiles?.[0]?.company_name || "Client",
    projectAddress: project?.address || "N/A",
    statusName: statusName || "Status Update",
    estTime: estTime || "2-3 business days",
  };
}

/**
 * Show a toast notification based on status configuration
 * @param statusConfig - Status configuration from database
 * @param userRole - Current user's role
 * @param data - Data for placeholder replacement
 * @param title - Notification title
 * @param duration - Notification duration
 */
export function showStatusToast(
  statusConfig: { toast_admin?: string; toast_client?: string },
  userRole: string,
  data: ToastMessageData,
  title: string = "Status Updated",
  duration: number = 5000
): void {
  const message = getToastMessage(statusConfig, userRole, data);

  if (message) {
    showSuccess(title, message, duration);
  }
}

// Export for backward compatibility
export const showToast = showNotification;
