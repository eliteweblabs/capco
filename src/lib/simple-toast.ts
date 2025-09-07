/**
 * Simple toast display utility
 */

export interface ToastOptions {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

/**
 * Show a simple toast notification
 */
export function showToast(options: ToastOptions): void {
  console.log("🔔 [SIMPLE-TOAST] Showing:", options);

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("🔔 [SIMPLE-TOAST] Not in browser environment, skipping notification");
    return;
  }

  // Use SimpleToast if available
  if ((window as any).simpleToastManager) {
    console.log("🔔 [SIMPLE-TOAST] Using simple toast manager");
    (window as any).simpleToastManager.show(options);
    return;
  }

  // Fallback to ToastAlerts if SimpleToast unavailable
  if ((window as any).toastAlertManager) {
    console.log("🔔 [SIMPLE-TOAST] Using toast alert manager fallback");
    (window as any).toastAlertManager.show(options);
    return;
  }

  // Final fallback to console logging
  const logLevel = options.type === "error" ? "error" : "log";
  console[logLevel](`🔔 [${options.type.toUpperCase()}] ${options.title}: ${options.message}`);
}

/**
 * Show success toast
 */
export function showSuccess(title: string, message: string, duration: number = 5000): void {
  showToast({ type: "success", title, message, duration });
}

/**
 * Show error toast
 */
export function showError(title: string, message: string, duration: number = 0): void {
  showToast({ type: "error", title, message, duration });
}

/**
 * Show warning toast
 */
export function showWarning(title: string, message: string, duration: number = 5000): void {
  showToast({ type: "warning", title, message, duration });
}

/**
 * Show info toast
 */
export function showInfo(title: string, message: string, duration: number = 5000): void {
  showToast({ type: "info", title, message, duration });
}
