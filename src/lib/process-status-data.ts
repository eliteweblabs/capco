/**
 * Process status data - Step 2 in the chain
 */

import { preparePlaceholderData } from "./database-utils";
import type { StatusData } from "./get-project-status-data";
import { replacePlaceholders } from "./placeholder-utils";

export interface ProcessedStatusData {
  project: any;
  profile: any;
  statusConfig: any;
  projectId: number;
  newStatus: number;
  toastMessage: string;
  userRole: string;
  notifyEmails: string[];
}

/**
 * Process status data and prepare toast message
 */
export function processStatusData(
  statusData: StatusData,
  userRole: string = "admin"
): ProcessedStatusData {
  console.log("⚙️ [PROCESS-STATUS-DATA] ==========================================");
  console.log(`⚙️ [PROCESS-STATUS-DATA] Starting data processing for user role: ${userRole}`);
  console.log("⚙️ [PROCESS-STATUS-DATA] ==========================================");

  // Prepare placeholder data
  console.log("⚙️ [PROCESS-STATUS-DATA] Step 1: Preparing placeholder data...");
  const placeholderData = preparePlaceholderData(
    statusData.project,
    statusData.profile,
    "Status Update",
    "2-3 business days"
  );
  console.log("⚙️ [PROCESS-STATUS-DATA] ✅ Placeholder data prepared:", placeholderData);

  // Get the appropriate toast message based on user role
  console.log(`⚙️ [PROCESS-STATUS-DATA] Step 2: Getting toast message for ${userRole}...`);
  console.log("⚙️ [PROCESS-STATUS-DATA] Status config:", statusData.statusConfig);
  console.log(`⚙️ [PROCESS-STATUS-DATA] Admin message: "${statusData.statusConfig.toast_admin}"`);
  console.log(`⚙️ [PROCESS-STATUS-DATA] Client message: "${statusData.statusConfig.toast_client}"`);

  const rawMessage =
    userRole === "Admin"
      ? statusData.statusConfig.toast_admin
      : statusData.statusConfig.toast_client;
  console.log(`⚙️ [PROCESS-STATUS-DATA] Raw message for ${userRole}:`, rawMessage);
  console.log(
    `⚙️ [PROCESS-STATUS-DATA] Message selection logic: userRole="${userRole}" === "admin" ? ${userRole === "admin"}`
  );

  // Replace placeholders in the message
  console.log("⚙️ [PROCESS-STATUS-DATA] Step 3: Replacing placeholders...");
  const toastMessage = replacePlaceholders(rawMessage || "", placeholderData);
  console.log("⚙️ [PROCESS-STATUS-DATA] ✅ Final toast message:", toastMessage);

  // Parse notify emails
  console.log("⚙️ [PROCESS-STATUS-DATA] Step 4: Parsing notify emails...");
  const notifyValue = statusData.statusConfig.notify;
  console.log(
    "⚙️ [PROCESS-STATUS-DATA] Raw notify value:",
    notifyValue,
    "Type:",
    typeof notifyValue
  );

  const notifyEmails =
    notifyValue && typeof notifyValue === "string"
      ? notifyValue.split(",").map((email: string) => email.trim())
      : [];
  console.log(
    `⚙️ [PROCESS-STATUS-DATA] ✅ Notify emails parsed: [${notifyEmails.join(", ")}] (${notifyEmails.length} emails)`
  );

  const result = {
    ...statusData,
    toastMessage,
    userRole,
    notifyEmails,
  };

  console.log("⚙️ [PROCESS-STATUS-DATA] ==========================================");
  console.log("⚙️ [PROCESS-STATUS-DATA] ✅ Data processing completed!");
  console.log("⚙️ [PROCESS-STATUS-DATA] ==========================================");

  return result;
}
