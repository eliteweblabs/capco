/**
 * Centralized notification handler for update-status API responses
 * Handles role-based notification selection without fallbacks
 */

interface NotificationData {
  admin?: {
    type: string;
    title: string;
    message: string;
    duration?: number;
    redirect?: any;
  };
  client?: {
    type: string;
    title: string;
    message: string;
    duration?: number;
    redirect?: any;
  };
}

interface UpdateStatusResponse {
  success: boolean;
  notificationData?: NotificationData;
  error?: string;
}

/**
 * Shows the appropriate notification based on user role
 * @param response - The response from update-status API
 * @param currentRole - The current user's role ("Admin", "Staff", or "Client")
 * @param context - Optional context for logging (e.g., "PROPOSAL-MANAGER")
 */
export function handleUpdateStatusNotification(
  response: UpdateStatusResponse,
  currentRole: string,
  context?: string
): void {
  if (!response.success) {
    console.error(`❌ [${context || "NOTIFICATION"}] API call failed:`, response.error);
    return;
  }

  if (!response.notificationData || !(window as any).showModal) {
    console.warn(
      `⚠️ [${context || "NOTIFICATION"}] No notification data or showModal function available`
    );
    return;
  }

  // Determine user role
  const isAdminOrStaff = currentRole === "Admin" || currentRole === "Staff";
  const notification = isAdminOrStaff
    ? response.notificationData.admin
    : response.notificationData.client;

  if (notification) {
    console.log(
      `🔔 [${context || "NOTIFICATION"}] Showing ${isAdminOrStaff ? "admin" : "client"} notification:`,
      {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        redirect: notification.redirect,
      }
    );

    if (!notification.title || !notification.message) {
      console.warn(`⚠️ [${context || "NOTIFICATION"}] No title or message found in notification`);
      return;
    }

    (window as any).showModal(
      notification.type,
      notification.title,
      notification.message,
      notification.duration,
      notification.redirect
    );
  } else {
    console.warn(
      `⚠️ [${context || "NOTIFICATION"}] No ${isAdminOrStaff ? "admin" : "client"} notification found in response`
    );
  }
}

/**
 * Async wrapper for update-status API calls with automatic notification handling
 * @param projectId - The project ID
 * @param status - The new status
 * @param currentRole - The current user's role
 * @param options - Additional options for the API call
 * @param context - Optional context for logging
 */
export async function updateStatusWithNotification(
  projectId: string | number,
  status: number,
  currentRole: string,
  options: {
    oldStatus?: number;
    currentUserId?: string;
    [key: string]: any;
  } = {},
  context?: string
): Promise<UpdateStatusResponse> {
  try {
    const response = await fetch("/api/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        projectId,
        status,
        ...options,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update project status");
    }

    // Automatically handle the notification
    handleUpdateStatusNotification(data, currentRole, context);

    return data;
  } catch (error) {
    console.error(`❌ [${context || "UPDATE-STATUS"}] Error:`, error);
    throw error;
  }
}
