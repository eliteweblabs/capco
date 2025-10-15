/**
 * Global notification count loader
 * Ensures notification count is loaded immediately on page load
 */

export interface NotificationCountResponse {
  success: boolean;
  unreadCount: number;
  error?: string;
}

/**
 * Load notification count immediately on page load
 * This ensures the count bubble appears as soon as possible
 */
export async function loadNotificationCount(): Promise<number> {
  try {
    console.log("🔔 [NOTIFICATION-COUNT] Loading notification count...");

    const response = await fetch("/api/notifications/get?limit=1", {
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("🔔 [NOTIFICATION-COUNT] Failed to fetch notifications:", response.status);
      return 0;
    }

    const data: NotificationCountResponse = await response.json();

    if (data.success) {
      console.log("🔔 [NOTIFICATION-COUNT] Loaded count:", data.unreadCount);
      return data.unreadCount || 0;
    } else {
      console.warn("🔔 [NOTIFICATION-COUNT] API returned error:", data.error);
      return 0;
    }
  } catch (error) {
    console.error("🔔 [NOTIFICATION-COUNT] Error loading notification count:", error);
    return 0;
  }
}

/**
 * Update the notification bell count bubble
 * This can be called from anywhere to update the count
 */
export function updateNotificationBellCount(count: number): void {
  console.log("🔔 [NOTIFICATION-COUNT] Updating bell count:", count);

  const bell = document.getElementById("notification-bell");
  if (!bell) {
    console.warn("🔔 [NOTIFICATION-COUNT] Notification bell not found");
    return;
  }

  // Use the global count bubble utility if available
  if ((window as any).updateCountBubble && (window as any).COUNT_BUBBLE_PRESETS) {
    (window as any).updateCountBubble(
      bell,
      count,
      (window as any).COUNT_BUBBLE_PRESETS.notification
    );
  } else {
    // Fallback: manually create/update count bubble
    let countBubble = bell.querySelector(".count-bubble") as HTMLSpanElement;

    if (count > 0) {
      if (!countBubble) {
        countBubble = document.createElement("span");
        countBubble.className =
          "count-bubble absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-600 animate-pulse";
        bell.appendChild(countBubble);
      }

      countBubble.textContent = count > 99 ? "99+" : count.toString();
      countBubble.style.display = "flex";
      bell.setAttribute("data-count", count.toString());
    } else {
      if (countBubble) {
        countBubble.style.display = "none";
        bell.removeAttribute("data-count");
      }
    }
  }
}

/**
 * Initialize notification count on page load
 * This should be called as early as possible in the page lifecycle
 */
export async function initializeNotificationCount(): Promise<void> {
  console.log("🔔 [NOTIFICATION-COUNT] Initializing notification count...");

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
      const count = await loadNotificationCount();
      updateNotificationBellCount(count);
    });
  } else {
    // DOM is already ready
    const count = await loadNotificationCount();
    updateNotificationBellCount(count);
  }
}

/**
 * Global function to refresh notification count
 * Can be called from anywhere in the application
 */
export async function refreshNotificationCount(): Promise<void> {
  console.log("🔔 [NOTIFICATION-COUNT] Refreshing notification count...");
  const count = await loadNotificationCount();
  updateNotificationBellCount(count);
}

// Make functions globally available
if (typeof window !== "undefined") {
  (window as any).loadNotificationCount = loadNotificationCount;
  (window as any).updateNotificationBellCount = updateNotificationBellCount;
  (window as any).initializeNotificationCount = initializeNotificationCount;
  (window as any).refreshNotificationCount = refreshNotificationCount;
}
