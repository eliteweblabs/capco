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
  actions?: Array<{ label: string; action: () => void }>;
  redirect?: {
    url: string;
    delay?: number; // Delay in seconds before redirect (default: 0)
    showCountdown?: boolean; // Show countdown in message (default: true)
  };
}

export interface ToastMessageData {
  projectTitle?: string;
  clientEmail?: string;
  clientName?: string;
  projectAddress?: string;
  statusName?: string;
  estTime?: string;
  countdown?: number; // Duration in seconds for countdown
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

  // Process redirect if specified
  let processedOptions = { ...options };
  if (options.redirect) {
    const delay = options.redirect.delay || 0;
    const showCountdown = options.redirect.showCountdown !== false; // Default to true

    if (showCountdown && delay > 0) {
      // Add countdown to message
      processedOptions.message = options.message.replace(
        /{{COUNTDOWN}}/g,
        `<span class="countdown-timer" data-duration="${delay}">${delay}</span>`
      );
      console.log("🔔 [CENTRALIZED] Countdown replacement:", {
        original: options.message,
        replaced: processedOptions.message,
        delay: delay,
        hasCountdownPlaceholder: options.message.includes("{{COUNTDOWN}}"),
        placeholderCount: (options.message.match(/{{COUNTDOWN}}/g) || []).length,
      });
    }

    // Schedule redirect
    if (delay > 0) {
      setTimeout(() => {
        console.log("🔔 [CENTRALIZED] Redirecting to:", options.redirect!.url);
        window.location.href = options.redirect!.url;
      }, delay * 1000);
    } else {
      // Immediate redirect
      console.log("🔔 [CENTRALIZED] Immediate redirect to:", options.redirect.url);
      window.location.href = options.redirect.url;
      return; // Don't show notification for immediate redirects
    }
  }

  // Use ToastAlerts for notifications with action buttons
  if (processedOptions.actions && processedOptions.actions.length > 0) {
    if ((window as any).toastAlertManager) {
      console.log("🔔 [CENTRALIZED] Using toast alert manager for actions");
      (window as any).toastAlertManager.show(processedOptions);
      // Initialize countdown timers after notification is shown
      setTimeout(() => initializeCountdownTimers(), 100);
      return;
    }
  }

  // Use SimpleToast for simple notifications
  if ((window as any).simpleToastManager) {
    console.log("🔔 [CENTRALIZED] Using simple toast manager");
    (window as any).simpleToastManager.show(processedOptions);
    // Initialize countdown timers after notification is shown
    setTimeout(() => initializeCountdownTimers(), 100);
    return;
  }

  // Fallback to ToastAlerts if SimpleToast unavailable
  if ((window as any).toastAlertManager) {
    console.log("🔔 [CENTRALIZED] Using toast alert manager fallback");
    (window as any).toastAlertManager.show(processedOptions);
    // Initialize countdown timers after notification is shown
    setTimeout(() => initializeCountdownTimers(), 100);
    return;
  }

  // Final fallback to console logging
  const logLevel = processedOptions.type === "error" ? "error" : "log";
  console[logLevel](
    `🔔 [${processedOptions.type.toUpperCase()}] ${processedOptions.title}: ${processedOptions.message}`
  );
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
    "{{PROJECT_TITLE}}": `<strong>${data.projectTitle || "Project"}</strong>`,
    "{{CLIENT_EMAIL}}": `<strong>${data.clientEmail || "Client"}</strong>`,
    "{{CLIENT_NAME}}": `<strong>${data.clientName || "Client"}</strong>`,
    "{{PROJECT_ADDRESS}}": `<strong>${data.projectAddress || "N/A"}</strong>`,
    "{{STATUS_NAME}}": `<strong>${data.statusName || "Status Update"}</strong>`,
    "{{EST_TIME}}": `<strong>${data.estTime || "2-3 business days"}</strong>`, // From status configuration
    "{{COUNTDOWN}}": data.countdown
      ? `<span class="countdown-timer" data-duration="${data.countdown}">${data.countdown}</span>`
      : "",
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

/**
 * Initialize countdown timers for all countdown elements in the DOM
 * This should be called after toast messages are displayed
 */
export function initializeCountdownTimers(): void {
  const countdownElements = document.querySelectorAll(".countdown-timer");

  countdownElements.forEach((element) => {
    const duration = parseInt(element.getAttribute("data-duration") || "0");
    if (duration > 0) {
      startCountdown(element as HTMLElement, duration);
    }
  });
}

/**
 * Start a countdown timer for a specific element
 * @param element - The HTML element to update
 * @param duration - Duration in seconds
 */
function startCountdown(element: HTMLElement, duration: number): void {
  let remaining = duration;

  const updateCountdown = () => {
    element.textContent = remaining.toString();

    if (remaining <= 0) {
      // Countdown finished
      element.textContent = "0";
      return;
    }

    remaining--;
    setTimeout(updateCountdown, 1000);
  };

  // Start the countdown
  updateCountdown();
}
