// Mobile-friendly toast notification utility
// Can be used throughout the application for consistent notifications

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  dismissible?: boolean;
  position?: "top" | "bottom";
  maxWidth?: string;
}

export function showToast(message: string, options: ToastOptions = {}) {
  const {
    type = "info",
    duration = 4000,
    dismissible = true,
    position = "top",
    maxWidth = "max-w-sm",
  } = options;

  const toast = document.createElement("div");

  // Mobile-first responsive positioning
  const positionClasses = position === "top" ? "top-4 left-4 right-4" : "bottom-4 left-4 right-4";

  const desktopPositionClasses =
    position === "top" ? "sm:top-4 sm:right-4 sm:left-auto" : "sm:bottom-4 sm:right-4 sm:left-auto";

  toast.className = `fixed z-50 transition-all duration-300 rounded-lg text-white shadow-lg
    ${positionClasses} mx-auto ${maxWidth}
    ${desktopPositionClasses} sm:mx-0 sm:max-w-none sm:w-auto
    px-4 py-3 text-sm font-medium
    ${getToastColor(type)}
    ${dismissible ? "cursor-pointer" : ""}`;

  // Add icon and content
  const icon = getToastIcon(type);
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="flex-shrink-0 text-lg font-bold">${icon}</span>
      <span class="flex-1">${message}</span>
      ${dismissible ? '<span class="flex-shrink-0 text-xs opacity-75 ml-2">tap to dismiss</span>' : ""}
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  });

  // Auto-dismiss
  const dismissToast = () => {
    toast.style.opacity = "0";
    toast.style.transform = position === "top" ? "translateY(-10px)" : "translateY(10px)";
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  };

  if (duration > 0) {
    setTimeout(dismissToast, duration);
  }

  // Allow manual dismiss by tapping (if enabled)
  if (dismissible) {
    toast.addEventListener("click", dismissToast);
  }

  return dismissToast; // Return function to manually dismiss if needed
}

function getToastColor(type: ToastType): string {
  switch (type) {
    case "success":
      return "bg-green-600 hover:bg-green-700";
    case "error":
      return "bg-red-600 hover:bg-red-700";
    case "warning":
      return "bg-yellow-600 hover:bg-yellow-700";
    case "info":
    default:
      return "bg-blue-600 hover:bg-blue-700";
  }
}

function getToastIcon(type: ToastType): string {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✕";
    case "warning":
      return "⚠";
    case "info":
    default:
      return "ℹ";
  }
}

// Convenience functions for common toast types
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, "type">) =>
    showToast(message, { ...options, type: "success" }),

  error: (message: string, options?: Omit<ToastOptions, "type">) =>
    showToast(message, { ...options, type: "error" }),

  warning: (message: string, options?: Omit<ToastOptions, "type">) =>
    showToast(message, { ...options, type: "warning" }),

  info: (message: string, options?: Omit<ToastOptions, "type">) =>
    showToast(message, { ...options, type: "info" }),
};

// Global toast queue management (prevents overlapping toasts)
class ToastQueue {
  private queue: Array<{ message: string; options: ToastOptions }> = [];
  private isShowing = false;

  add(message: string, options: ToastOptions = {}) {
    this.queue.push({ message, options });
    this.processQueue();
  }

  private async processQueue() {
    if (this.isShowing || this.queue.length === 0) return;

    this.isShowing = true;
    const { message, options } = this.queue.shift()!;

    const dismiss = showToast(message, options);

    // Wait for toast duration + animation time
    const duration = options.duration || 4000;
    await new Promise((resolve) => setTimeout(resolve, duration + 300));

    this.isShowing = false;
    this.processQueue();
  }
}

export const toastQueue = new ToastQueue();

// Make toast utilities available globally (for use in script tags)
declare global {
  interface Window {
    showToast: typeof showToast;
    toast: typeof toast;
  }
}

if (typeof window !== "undefined") {
  window.showToast = showToast;
  window.toast = toast;
}
