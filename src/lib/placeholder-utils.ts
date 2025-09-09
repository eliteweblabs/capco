/**
 * Simple placeholder replacement utility
 */

/**
 * Get the base URL from environment or current location
 */
function getBaseUrl(): string {
  // Try to get from Astro environment variables first
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (import.meta.env.SITE_URL) {
      return import.meta.env.SITE_URL;
    }
    if (import.meta.env.PUBLIC_SITE_URL) {
      return import.meta.env.PUBLIC_SITE_URL;
    }
  }

  // Fallback to current location if in browser
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Default fallback
  return "https://yourwebsite.com";
}

export interface PlaceholderData {
  projectAddress?: string;
  clientName?: string;
  clientEmail?: string;
  statusName?: string;
  estTime?: string;
  baseUrl?: string;
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
  // Get base URL from data or environment
  const baseUrl = data.baseUrl || getBaseUrl();
  if (baseUrl) {
    console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{BASE_URL}} with: ${baseUrl}`);
    result = result.replace(/\{\{BASE_URL\}\}/g, baseUrl);
  } else {
    console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No baseUrl available");
  }
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
  return "<b>" + result + "</b>";
}
