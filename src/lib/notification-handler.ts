/**
 * Centralized notification handler for update-status API responses
 * Handles role-based notification selection with placeholder processing
 */

import { replacePlaceholders, type PlaceholderData } from "./placeholder-utils";

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
  project?: any;
  statusConfig?: any;
  clientProfile?: any;
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

  // Generate placeholder data for message processing
  let processedNotificationData = response.notificationData;

  if (response.project && response.statusConfig && response.clientProfile) {
    console.log(`🔄 [${context || "NOTIFICATION"}] Processing placeholders for notifications`);

    try {
      // Use the same PlaceholderData format that works in email-delivery
      const placeholderData: PlaceholderData = {
        projectAddress: response.project.address || "No Address Provided",
        clientName:
          response.clientProfile.company_name ||
          `${response.clientProfile.first_name || ""} ${response.clientProfile.last_name || ""}`.trim() ||
          "Unknown Client",
        clientEmail: response.clientProfile.email || "No Email Provided",
        statusName: response.statusConfig.admin_status_name || "Unknown Status",
        estTime: response.statusConfig.est_time || "TBD",
        baseUrl: window.location.origin,
        primaryColor: "#825bdd",
        svgLogo: `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" width="100" version="1.1" viewBox="0 0 400 143.7" class="h-auto"> <defs> <style>
        .fill {
          fill: black;
        }
      </style> </defs> <g> <path class="fill" d="M0 0h400v143.7H0z"/> <text x="200" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">CAPCo</text> </g> </svg>`,
      };

      console.log(`🔄 [${context || "NOTIFICATION"}] Placeholder data created:`, placeholderData);

      // Process admin notification message using the working replacePlaceholders function
      if (response.notificationData.admin?.message) {
        const processedAdminMessage = replacePlaceholders(
          response.notificationData.admin.message,
          placeholderData,
          false // no bold tags for notifications
        );
        processedNotificationData = {
          ...processedNotificationData,
          admin: {
            ...processedNotificationData.admin!,
            message: processedAdminMessage,
          },
        };
      }

      // Process client notification message using the working replacePlaceholders function
      if (response.notificationData.client?.message) {
        const processedClientMessage = replacePlaceholders(
          response.notificationData.client.message,
          placeholderData,
          false // no bold tags for notifications
        );
        processedNotificationData = {
          ...processedNotificationData,
          client: {
            ...processedNotificationData.client!,
            message: processedClientMessage,
          },
        };
      }

      console.log(
        `✅ [${context || "NOTIFICATION"}] Placeholders processed successfully using working replacePlaceholders function`
      );
    } catch (error) {
      console.error(`❌ [${context || "NOTIFICATION"}] Error processing placeholders:`, error);
      // Continue with unprocessed messages if placeholder processing fails
    }
  }

  // Determine user role
  const isAdminOrStaff = currentRole === "Admin" || currentRole === "Staff";
  const notification = isAdminOrStaff
    ? processedNotificationData.admin
    : processedNotificationData.client;

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
