/**
 * Simple placeholder replacement utility
 */

export interface PlaceholderData {
  projectAddress?: string;
  clientName?: string;
  clientEmail?: string;
  statusName?: string;
  estTime?: string;
}

/**
 * Replace placeholders in a message string
 */
export function replacePlaceholders(message: string, data: PlaceholderData): string {
  console.log("🔄 [PLACEHOLDER-UTILS] Starting placeholder replacement...");
  console.log("🔄 [PLACEHOLDER-UTILS] Original message:", message);
  console.log("🔄 [PLACEHOLDER-UTILS] Placeholder data:", data);

  if (!message || !data) {
    console.log("🔄 [PLACEHOLDER-UTILS] No message or data, returning original");
    return message;
  }

  let result = message;

  // Replace placeholders
  if (data.projectAddress) {
    console.log(
      `🔄 [PLACEHOLDER-UTILS] Replacing {{PROJECT_ADDRESS}} with: ${data.projectAddress}`
    );
    result = result.replace(/\{\{PROJECT_ADDRESS\}\}/g, data.projectAddress);
  } else {
    console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No projectAddress data available");
  }

  if (data.clientName) {
    console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{CLIENT_NAME}} with: ${data.clientName}`);
    result = result.replace(/\{\{CLIENT_NAME\}\}/g, data.clientName);
  } else {
    console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No clientName data available");
  }

  if (data.clientEmail) {
    console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{CLIENT_EMAIL}} with: ${data.clientEmail}`);
    result = result.replace(/\{\{CLIENT_EMAIL\}\}/g, data.clientEmail);
  } else {
    console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No clientEmail data available");
  }

  if (data.statusName) {
    console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{STATUS_NAME}} with: ${data.statusName}`);
    result = result.replace(/\{\{STATUS_NAME\}\}/g, data.statusName);
  }

  if (data.estTime) {
    console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{EST_TIME}} with: ${data.estTime}`);
    result = result.replace(/\{\{EST_TIME\}\}/g, data.estTime);
  }

  console.log("🔄 [PLACEHOLDER-UTILS] Final result:", result);
  return result;
}
