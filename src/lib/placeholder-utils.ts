/**
 * Simple placeholder replacement utility
 */

/**
 * Get the CAPCo logo SVG as a string
 * This function extracts the SVG content from the Logo component
 */
export function getCapcoLogoSvg(size: string, file: string = "svg"): string {
  return `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" width="155" height="26.6" version="1.1" viewBox="0 0 135 24.6">
  <defs>
    <style>
      .fill {
        fill: black;
      }
      .dark .fill {
        fill: white;
      }
    </style>
  </defs>
  <path class="fill" d="M73.4,5.2c-.6-1-1.4-1.7-2.5-2.2-1-.5-2.2-.8-3.5-.8h-8.5v20.4h4.6v-7.4h4c1.3,0,2.5-.3,3.5-.8,1-.5,1.9-1.3,2.5-2.2.6-1,.9-2.1.9-3.4s-.3-2.5-.9-3.5ZM69.3,10.3c-.3.4-.6.8-1.1,1-.5.2-1,.3-1.5.3h-3.3v-5.9h3.3c.6,0,1.1.1,1.5.3.5.2.8.6,1.1,1,.3.4.4,1,.4,1.6s-.1,1.1-.4,1.6Z" fill="#231f20"></path>
  <path class="fill" d="M115.2,8.2c-.5-1.3-1.3-2.4-2.3-3.3-1-1-2.1-1.7-3.4-2.2-1.3-.5-2.7-.8-4.2-.8s-3,.3-4.3.8c-1.3.5-2.4,1.3-3.4,2.2-1,1-1.7,2.1-2.2,3.3-.5,1.3-.8,2.7-.8,4.2s.3,2.9.8,4.1c.5,1.3,1.3,2.4,2.3,3.4,1,1,2.1,1.7,3.4,2.2,1.3.5,2.7.8,4.3.8s2.9-.3,4.2-.8c1.3-.5,2.4-1.3,3.4-2.2,1-1,1.7-2.1,2.2-3.3.5-1.3.8-2.7.8-4.1s-.3-2.9-.8-4.2ZM110.6,15.7c-.5,1-1.2,1.7-2.1,2.2-.9.5-2,.8-3.2.8s-1.7-.1-2.5-.4c-.7-.3-1.4-.7-1.9-1.3-.5-.6-1-1.2-1.2-2-.3-.8-.4-1.7-.4-2.6s.2-2.4.8-3.3c.5-1,1.2-1.7,2.1-2.2.9-.5,2-.8,3.2-.8s1.7.1,2.5.4c.7.3,1.4.7,1.9,1.3.5.6,1,1.2,1.2,2,.3.8.4,1.6.4,2.6s-.3,2.4-.8,3.3Z" fill="#231f20"></path>
  <path class="fill" d="M130.8,10.8h-.1c-2.2.8-3.7.3-5-1.7l-.4-.6c-.3-.4-.6-.8-.9-1.3-1-1.5-2.7-2.5-4.5-2.7-.7-.1-1.4,0-2,.1,1.3,2.1,2,4.6,2,7.3s-.9,5.6-2.3,7.9c2.5.5,5.7-.1,7.2-1.8,0,0-.2,0-.3,0-1.1-.2-1.8-1.2-1.8-2.2,0-1.1.6-1.7,1.8-1.8.4,0,.9,0,1.4,0h.2c1.1,0,2-.3,2.9-.9.8-.5,1.5-1.3,1.9-2.2h-.1Z" fill="#231f20"></path>
  <path class="fill" d="M89.7,18.2c-.8.3-1.7.5-2.7.5s-1.7-.1-2.4-.4c-.7-.3-1.4-.7-1.9-1.3-.5-.6-1-1.2-1.2-2-.3-.8-.4-1.6-.4-2.6s.1-1.8.4-2.6c.3-.8.7-1.5,1.2-2,.5-.6,1.2-1,1.9-1.3.7-.3,1.5-.4,2.4-.4s1.9.2,2.6.5c.7.3,1.3.7,1.8,1.3.4-1.4,1.1-2.8,1.9-4-.6-.5-1.3-.8-2.1-1.2-1.3-.5-2.7-.8-4.3-.8s-3,.3-4.2.8c-1.3.5-2.4,1.3-3.4,2.2-1,.9-1.7,2.1-2.3,3.3-.5,1.3-.8,2.7-.8,4.1s.3,2.9.8,4.1c.5,1.3,1.3,2.4,2.3,3.4,1,1,2.1,1.7,3.4,2.2,1.3.5,2.7.8,4.2.8s3.1-.3,4.4-.8c.8-.3,1.6-.8,2.3-1.3-.9-1.2-1.6-2.5-2.1-3.9-.5.6-1.2,1-1.9,1.3Z" fill="#231f20"></path>
  <path class="fill" d="M2.8,10.8h.1c2.2.8,3.7.3,5-1.7l.4-.6c.3-.4.6-.8.9-1.3,1-1.5,2.7-2.5,4.5-2.7.7-.1,1.4,0,2,.1-1.3,2.1-2,4.6-2,7.3s.9,5.6,2.3,7.9c-2.5.5-5.7-.1-7.2-1.8,0,0,.2,0,.3,0,1.1-.2,1.8-1.2,1.8-2.2,0-1.1-.6-1.7-1.8-1.8-.4,0-.9,0-1.4,0h-.2c-1.1,0-2-.3-2.9-.9-.8-.5-1.5-1.3-1.9-2.2h.1Z" fill="#231f20"></path>
  <path class="fill" d="M30.7,18.2c-.8.3-1.7.5-2.7.5s-1.7-.1-2.4-.4c-.7-.3-1.4-.7-1.9-1.3-.5-.6-1-1.2-1.2-2-.3-.8-.4-1.6-.4-2.6s.1-1.8.4-2.6c.3-.8.7-1.5,1.2-2,.5-.6,1.2-1,1.9-1.3.7-.3,1.5-.4,2.4-.4s1.9.2,2.6.5c.7.3,1.3.7,1.8,1.3.4-1.4,1.1-2.8,1.9-4-.6-.5-1.3-.8-2.1-1.2-1.3-.5-2.7-.8-4.3-.8s-3,.3-4.2.8c-1.3.5-2.4,1.3-3.4,2.2-1,.9-1.7,2.1-2.3,3.3-.5,1.3-.8,2.7-.8,4.1s.3,2.9.8,4.1c.5,1.3,1.3,2.4,2.3,3.4,1,1,2.1,1.7,3.4,2.2,1.3.5,2.7.8,4.2.8s3.1-.3,4.4-.8c.8-.3,1.6-.8,2.3-1.3-.9-1.2-1.6-2.5-2.1-3.9-.5.6-1.2,1-1.9,1.3Z" fill="#231f20"></path>
  <path class="fill" d="M55.4,12.4s0,0,0,0c0-5.6-4.5-10.1-10.1-10.1s-10.1,4.5-10.1,10.1,4.5,10.1,10.1,10.1,4-.6,5.7-1.7v1.8s4.5,0,4.5,0v-10.1s0,0,0,0ZM45.4,18.6c-3.4,0-6.2-2.8-6.2-6.2s2.8-6.2,6.2-6.2,6.2,2.8,6.2,6.2-2.8,6.2-6.2,6.2Z" fill="#231f20"></path>
</svg>`;
}

/**
 * Get the base URL from environment or current location
 */
function getBaseUrl(): string {
  // Always use the current origin URL
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback for server-side
  return "http://localhost:4321";
}

export interface PlaceholderData {
  projectAddress?: string;
  clientName?: string;
  clientEmail?: string;
  statusName?: string;
  estTime?: string;
  baseUrl?: string;
  primaryColor?: string;
  svgLogo?: string;
}

/**
 * Replace placeholders in a message string
 */
export function replacePlaceholders(
  message: string,
  data: PlaceholderData,
  addBoldTags: boolean = true
): string {
  // // console.log("🔄 [PLACEHOLDER-UTILS] Starting placeholder replacement...");
  // // console.log("🔄 [PLACEHOLDER-UTILS] Original message:", message);
  // // console.log("🔄 [PLACEHOLDER-UTILS] Placeholder data:", data);

  if (!message || !data) {
    // console.log("🔄 [PLACEHOLDER-UTILS] No message or data, returning original");
    return message;
  }

  let result = message;

  // Replace placeholders
  // Get base URL from data or environment
  const baseUrl = data.baseUrl || getBaseUrl();
  if (baseUrl) {
    // // console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{BASE_URL}} with: ${baseUrl}`);
    result = result.replace(/\{\{BASE_URL\}\}/g, baseUrl);
  } else {
    // console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No baseUrl available");
  }
  if (data.projectAddress) {
    // // console.log(
    //   `🔄 [PLACEHOLDER-UTILS] Replacing {{PROJECT_ADDRESS}} with: ${data.projectAddress}`
    // );
    result = result.replace(/\{\{\s*PROJECT_ADDRESS\s*\}\}/g, data.projectAddress);
  } else {
    // console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No projectAddress data available");
  }

  if (data.clientName) {
    // // console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{CLIENT_NAME}} with: ${data.clientName}`);
    result = result.replace(/\{\{\s*CLIENT_NAME\s*\}\}/g, data.clientName);
  } else {
    // console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No clientName data available");
  }

  if (data.clientEmail) {
    // // console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{CLIENT_EMAIL}} with: ${data.clientEmail}`);
    result = result.replace(/\{\{\s*CLIENT_EMAIL\s*\}\}/g, data.clientEmail);
    addBoldTags = false;
  } else {
    // console.log("🔄 [PLACEHOLDER-UTILS] ⚠️ No clientEmail data available");
  }

  if (data.statusName) {
    // console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{STATUS_NAME}} with: ${data.statusName}`);
    result = result.replace(/\{\{\s*STATUS_NAME\s*\}\}/g, data.statusName);
  }

  if (data.estTime) {
    // console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{EST_TIME}} with: ${data.estTime}`);
    result = result.replace(/\{\{\s*EST_TIME\s*\}\}/g, data.estTime);
  }

  if (data.primaryColor) {
    // console.log(`🔄 [PLACEHOLDER-UTILS] Replacing {{PRIMARY_COLOR}} with: ${data.primaryColor}`);
    // Ensure primary color starts with # for hexadecimal format
    let hexColor = data.primaryColor;
    if (!hexColor.startsWith("#")) {
      hexColor = "#" + hexColor;
    }
    addBoldTags = false;
    result = result.replace(/\{\{\s*PRIMARY_COLOR\s*\}\}/g, hexColor);
  }

  if (data.svgLogo) {
    // console.log(
    //   `🔄 [PLACEHOLDER-UTILS] Replacing {{SVG_LOGO}} with: ${data.svgLogo.substring(0, 50)}...`
    // );
    addBoldTags = false;
    result = result.replace(/\{\{\s*SVG_LOGO\s*\}\}/g, data.svgLogo);
  }

  // console.log("🔄 [PLACEHOLDER-UTILS] Final result:", result);
  return addBoldTags ? "<b>" + result + "</b>" : result;
}
