/**
 * Client-side notification handler
 * Call this after successful status updates
 */

// import { getStatusData } from "./get-project-status-data";
// import { processStatusData } from "./process-status-data";
// // import { handleClientEmailDelivery } from "./email-delivery";
// // import { handleAdminEmailDelivery } from "./email-delivery-admin";
// // import { showAdminToastNotification } from "./toast-admin";
// // import { showClientToastNotification } from "./toast-client";

// export interface NotificationResult {
//   success: boolean;
//   message: string;
//   error?: string;
// }

// /**
//  * Handle all notifications after a status update
//  * @param projectId - The project ID
//  * @param newStatus - The new status code
//  * @param userRole - The role of the user who made the update ("Admin" or "Client")
//  */
// export async function handleStatusUpdateNotifications(
//   projectId: number,
//   newStatus: number,
//   userRole: string
// ): Promise<NotificationResult> {
//   console.log("🔔 [CLIENT-NOTIFICATIONS] Starting notification chain...");
//   console.log("🔔 [CLIENT-NOTIFICATIONS] Parameters:", { projectId, newStatus, userRole });

//   try {
//     // Step 1: Get all status data
//     console.log("🔔 [CLIENT-NOTIFICATIONS] Step 1: Getting status data...");
//     const statusData = await getStatusData(projectId, newStatus);

//     if (!statusData) {
//       console.error("🔔 [CLIENT-NOTIFICATIONS] ❌ Failed to get status data");
//       return { success: false, message: "Failed to get status data" };
//     }

//     // Step 2: Process data for the current user (who made the update)
//     console.log("🔔 [CLIENT-NOTIFICATIONS] Step 2: Processing data for user role:", userRole);
//     const processedData = processStatusData(statusData, userRole);
//     console.log("🔔 [CLIENT-NOTIFICATIONS] Processed data notify emails:", processedData.notifyEmails);

//     // Step 3: Always send client email (project author)
//     console.log("🔔 [CLIENT-NOTIFICATIONS] Step 3: Sending client email...");
//     const clientProcessedData = processStatusData(statusData, "client");
//     const clientEmailResult = await handleClientEmailDelivery(clientProcessedData);
//     console.log("🔔 [CLIENT-NOTIFICATIONS] Client email sent to:", clientEmailResult.recipient);

//     // Step 4: Show appropriate toast based on who made the update
//     console.log("🔔 [CLIENT-NOTIFICATIONS] Step 4: Showing toast notification...");
//     if (userRole === "Admin") {
//       console.log("🔔 [CLIENT-NOTIFICATIONS] Admin made the update - showing admin toast");
//       showAdminToastNotification(processedData, {
//         success: true,
//         message: "Client email sent",
//         recipients: [clientEmailResult.recipient],
//       });
//     } else {
//       console.log("🔔 [CLIENT-NOTIFICATIONS] Client made the update - showing client toast");
//       showClientToastNotification(processedData, clientEmailResult);
//     }

//     // Step 5: Send admin emails if there are notify emails
//     console.log("🔔 [CLIENT-NOTIFICATIONS] Step 5: Checking admin emails...");
//     if (processedData.notifyEmails.length > 0) {
//       console.log(
//         "🔔 [CLIENT-NOTIFICATIONS] ✅ Found admin emails to notify:",
//         processedData.notifyEmails
//       );
//       const adminEmailResult = await handleAdminEmailDelivery(processedData);
//       console.log("🔔 [CLIENT-NOTIFICATIONS] Admin emails sent to:", adminEmailResult.recipients);
//     } else {
//       console.log("🔔 [CLIENT-NOTIFICATIONS] ❌ No admin emails to notify");
//     }

//     console.log("🔔 [CLIENT-NOTIFICATIONS] ✅ Notification chain completed successfully");
//     return {
//       success: true,
//       message: processedData.toastMessage,
//     };
//   } catch (error) {
//     console.error("🔔 [CLIENT-NOTIFICATIONS] ❌ Error in notification chain:", error);
//     return {
//       success: false,
//       message: "Notification failed",
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }
