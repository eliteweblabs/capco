/**
 * Node.js compatible version of placeholder-utils.ts
 * This is a simplified version that only handles global placeholders for VAPI processing
 */

// Get the global company data (same as placeholder-utils.ts)
function globalCompanyData() {
  const globalCompanyName = "CACPO Design Group";
  const logo =
    '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" height="24" version="1.1" viewBox="0 0 336.4 61.3"><defs><style>.fill{fill:#000}.dark .fill{fill:#fff}@media (prefers-color-scheme: dark){.dark .fill{fill:#fff}, .fill{fill:#fff}}</style></defs><path class="fill" d="M184.2,12.5c-1.5-2.5-3.6-4.4-6.3-5.7-2.7-1.3-5.6-2-8.9-2h-21.7v51.8h11.6v-18.9h10.1c3.3,0,6.2-.7,8.9-2,2.7-1.3,4.8-3.2,6.3-5.7,1.5-2.5,2.3-5.4,2.3-8.8s-.8-6.4-2.3-8.8ZM173.9,25.4c-.7,1.1-1.6,2-2.8,2.5-1.1.6-2.4.8-3.9.8h-8.4v-14.9h8.4c1.4,0,2.7.3,3.9.8,1.1.6,2.1,1.4,2.8,2.5.7,1.1,1,2.5,1,4.1s-.3,2.9-1,4Z"/><path class="fill" d="M290.6,20.1c-1.3-3.3-3.3-6.1-5.8-8.5-2.5-2.4-5.4-4.3-8.7-5.6-3.3-1.3-6.9-2-10.7-2s-7.5.7-10.9,2c-3.3,1.3-6.2,3.2-8.7,5.6-2.4,2.4-4.4,5.2-5.7,8.5-1.4,3.2-2.1,6.7-2.1,10.6s.7,7.3,2.1,10.5c1.4,3.3,3.3,6.1,5.8,8.5,2.5,2.4,5.4,4.4,8.7,5.7,3.3,1.4,6.9,2.1,10.9,2.1s7.4-.7,10.7-2.1c3.3-1.4,6.1-3.3,8.6-5.7,2.4-2.4,4.4-5.3,5.7-8.5,1.4-3.3,2.1-6.8,2.1-10.5s-.7-7.3-2-10.6ZM278.9,39.2c-1.3,2.4-3.1,4.4-5.4,5.7-2.3,1.4-5,2.1-8.1,2.1s-4.4-.4-6.3-1.1c-1.9-.8-3.5-1.9-4.9-3.3-1.4-1.4-2.4-3.2-3.2-5.2-.7-2-1.1-4.2-1.1-6.7s.6-6.1,1.9-8.5c1.3-2.4,3.1-4.3,5.4-5.6,2.3-1.3,5-2,8.1-2s4.3.4,6.2,1.1c1.9.8,3.5,1.9,4.9,3.3,1.4,1.4,2.4,3.2,3.2,5.1.7,2,1.1,4.2,1.1,6.6s-.6,6.1-1.9,8.5Z"/><path class="fill" d="M330.3,26.8l-.3.2c-5.6,1.8-9.5.5-12.8-4.4l-1-1.5c-.7-1.1-1.4-2.2-2.2-3.2-2.6-3.8-6.8-6.3-11.4-6.8-1.7-.3-3.5-.1-5.2.4,3.2,5.5,5,11.8,5,18.6s-2.2,14.3-5.9,20.1c6.4,1.3,14.4-.3,18.4-4.6-.2,0-.5-.1-.7-.2-2.7-.5-4.6-2.9-4.5-5.7,0-2.8,1.5-4.3,4.7-4.7,1.1-.2,2.3-.2,3.5-.2h.4c2.7,0,5.2-.7,7.4-2.2,2.2-1.4,3.9-3.4,4.9-5.7h-.3Z"/><path class="fill" d="M225.6,45.7c-2,.8-4.3,1.2-6.9,1.2s-4.3-.4-6.2-1.1c-1.9-.8-3.5-1.9-4.8-3.3-1.4-1.4-2.4-3.2-3.2-5.1-.7-2-1.1-4.2-1.1-6.6s.4-4.5,1.1-6.5c.7-2,1.8-3.7,3.2-5.1,1.4-1.4,3-2.5,4.8-3.3,1.9-.8,3.9-1.1,6.2-1.1s4.8.4,6.7,1.2c1.8.8,3.4,1.9,4.7,3.2,1.1-3.6,2.8-7,4.9-10.1-1.6-1.2-3.4-2.2-5.3-3-3.2-1.3-6.9-2-11-2s-7.5.7-10.8,2c-3.3,1.3-6.2,3.2-8.6,5.6-2.5,2.4-4.4,5.2-5.8,8.5-1.4,3.3-2.1,6.8-2.1,10.5s.7,7.3,2.1,10.5c1.4,3.3,3.3,6.1,5.8,8.5,2.5,2.4,5.4,4.3,8.7,5.7,3.3,1.3,6.9,2,10.7,2s8-.6,11.2-1.9c2.1-.9,4.1-2,5.9-3.3-2.2-3-4-6.3-5.3-9.9-1.4,1.5-3,2.6-4.9,3.4Z"/><path class="fill" d="M4.8,26.8l.3.2c5.6,1.8,9.5.5,12.8-4.4l1-1.5c.7-1.1,1.4-2.2,2.2-3.2,2.6-3.8,6.8-6.3,11.4-6.8,1.7-.3,3.5-.1,5.2.4-3.2,5.5-5,11.8-5,18.6s2.2,14.3,5.9,20.1c-6.4,1.3-14.4-.3-18.4-4.6.2,0,.5-.1,.7-.2,2.7-.5,4.6-2.9,4.5-5.7,0-2.8-1.5-4.3-4.7-4.7-1.1-.2-2.3-.2-3.5-.2h-.4c-2.7,0-5.2-.7-7.4-2.2-2.2-1.4-3.9-3.4-4.9-5.7h.3Z"/><path class="fill" d="M75.6,45.7c-2,.8-4.3,1.2-6.9,1.2s-4.3-.4-6.2-1.1c-1.9-.8-3.5-1.9-4.8-3.3-1.4-1.4-2.4-3.2-3.2-5.1-.7-2-1.1-4.2-1.1-6.6s.4-4.5,1.1-6.5c.7-2,1.8-3.7,3.2-5.1,1.4-1.4,3-2.5,4.8-3.3,1.9-.8,3.9-1.1,6.2-1.1s4.8.4,6.7,1.2c1.8.8,3.4,1.9,4.7,3.2,1.1-3.6,2.8-7,4.9-10.1-1.6-1.2-3.4-2.2-5.3-3-3.2-1.3-6.9-2-11-2s-7.5.7-10.8,2c-3.3,1.3-6.2,3.2-8.6,5.6-2.5,2.4-4.4,5.2-5.8,8.5-1.4,3.3-2.1,6.8-2.1,10.5s.7,7.3,2.1,10.5c1.4,3.3,3.3,6.1,5.8,8.5,2.5,2.4,5.4,4.3,8.7,5.7,3.3,1.3,6.9,2,10.7,2s8-.6,11.2-1.9c2.1-.9,4.1-2,5.9-3.3-2.2-3-4-6.3-5.3-9.9-1.4,1.5-3,2.6-4.9,3.4Z"/><path class="fill" d="M138.6,30.9s0,0,0,0c0-14.2-11.5-25.7-25.7-25.7s-25.7,11.5-25.7,25.7,11.5,25.7,25.7,25.7,10.3-1.6,14.4-4.4v4.5s11.3,0,11.3,0v-25.7s0,0,0,0ZM113,46.6c-8.8,0-15.8-7.1-15.8-15.8s7.1-15.8,15.8-15.8,15.8,7.1,15.8,15.8-7.1,15.8-15.8,15.8Z"/></svg>';

  const icon =
    '<?xml version="1.0" encoding="UTF-8"?><svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 512 512"><defs><style>.fill {fill: #000;} @media (prefers-color-scheme: dark) {.fill {fill: #fff;}}</style></defs><path class="fill" d="M56.9,236.8l1.5,1c27.5,8.8,46.7,2.4,62.9-21.6l4.9-7.3c3.5-5.3,7.1-10.6,10.8-15.7,12.9-18.7,33.4-30.9,56-33.4,8.5-1.2,17-.6,25.5,1.8-15.7,26.8-24.7,58.1-24.7,91.4s10.7,70.2,29.1,98.6c-31.3,6.2-70.7-1.3-90.3-22.8,1.2-.3,2.3-.7,3.4-1,13.3-2.4,22.8-14.4,22.1-28-.5-13.7-7.3-21.2-23.1-23.1-5.4-1-11.3-1-17.2-1h-2c-13.2,0-25.6-3.4-36.3-10.8-10.6-6.7-19-16.5-24.1-28h1.5,0Z"/><path class="fill" d="M404.9,329.7c-9.6,4-20.9,5.9-33.9,5.9s-21.2-1.8-30.2-5.6c-9.2-3.7-17.1-9.2-23.7-16.2-6.7-7.1-11.9-15.5-15.5-25.2-3.6-9.7-5.4-20.6-5.4-32.6s1.8-22.2,5.4-32.1,8.7-18.2,15.5-25.2c6.7-7,14.7-12.3,23.7-16,9.2-3.7,19.2-5.6,30.2-5.6s23.5,2.1,33,6.2c9,3.9,16.6,9.2,22.9,15.8,5.6-17.9,13.8-34.6,24.2-49.7-8.1-5.7-16.7-10.6-26.2-14.5-15.7-6.5-33.7-9.7-53.9-9.7s-36.9,3.3-53,9.9c-16.1,6.6-30.2,15.8-42.3,27.6-12.2,11.7-21.6,25.7-28.2,41.7-6.7,16-10.1,33.2-10.1,51.7s3.3,35.7,10.1,51.7c6.7,16,16.2,30,28.2,42,12.2,12,26.3,21.3,42.5,27.9,16.2,6.6,33.8,9.9,52.8,9.9s39.2-3.2,55.2-9.6c10.5-4.2,20.1-9.7,28.8-16.2-11-14.7-19.8-31.2-26.1-48.8-6.7,7.2-14.7,12.8-24.1,16.7h0Z"/></svg>';

  return {
    globalCompanyName: globalCompanyName,
    globalCompanySlogan: "Professional Fire Protection Plan Review & Approval",
    globalCompanyAddress: "335 Washington St, Suite 1114, Woburn, MA 01801",
    globalCompanyPhone: "(617) 644-0014",
    globalCompanyEmail: "admin@capcofire.com",
    globalCompanyWebsite: "https://capcofire.com",
    globalCompanyLogo: logo,
    globalCompanyLogoDark: logo,
    globalCompanyLogoLight: logo,
    globalCompanyIconDark: icon,
    globalCompanyIconLight: icon,
    globalCompanyIcon: icon,
    primaryColor: process.env.GLOBAL_COLOR_PRIMARY || "#825BDD",
    secondaryColor: process.env.GLOBAL_COLOR_SECONDARY || "#0EA5E9",
  };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Replace placeholders in a message string (Node.js compatible version)
 * This follows the same logic as placeholder-utils.ts but only handles global placeholders
 */
export function replacePlaceholders(message, data = null, addBoldTags = false) {
  if (!message) {
    console.log("🔄 [PLACEHOLDER-UTILS-NODE] No message, returning original");
    return message;
  }

  let result = message;
  let placeholderApplied = false;

  // === DYNAMIC PLACEHOLDER REPLACEMENT ===
  // Find all {{placeholder}} instances and try to resolve them dynamically
  const placeholderRegex = /\{\{\s*([^}]+)\s*\}\}/g;
  const matches = [...message.matchAll(placeholderRegex)];

  for (const match of matches) {
    const fullPlaceholder = match[0]; // e.g., "{{global.globalCompanyName}}"
    const placeholderPath = match[1].trim(); // e.g., "global.globalCompanyName"

    let value = null;

    // Handle global.* placeholders
    if (placeholderPath.startsWith("global.")) {
      const path = placeholderPath.replace("global.", "");
      value = getNestedValue(globalCompanyData(), path);
    }

    // If we found a value, replace it
    if (value !== null && value !== undefined) {
      const beforeReplace = result;
      result = result.replace(fullPlaceholder, value.toString());
      if (result !== beforeReplace) {
        placeholderApplied = true;
        console.log(
          `✅ [PLACEHOLDER-UTILS-NODE] Dynamic replacement: ${fullPlaceholder} -> ${value}`
        );
      }
    }
  }

  // === LEGACY PLACEHOLDER REPLACEMENT ===
  // Replace GLOBAL_COMPANY_NAME placeholders (same as placeholder-utils.ts)
  if (globalCompanyData().globalCompanyName) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_NAME\s*\}\}/g,
      globalCompanyData().globalCompanyName
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_SLOGAN placeholders
  if (globalCompanyData().globalCompanySlogan) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_SLOGAN\s*\}\}/g,
      globalCompanyData().globalCompanySlogan
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_PHONE placeholders
  if (globalCompanyData().globalCompanyPhone) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_PHONE\s*\}\}/g,
      globalCompanyData().globalCompanyPhone
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_EMAIL placeholders
  if (globalCompanyData().globalCompanyEmail) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_EMAIL\s*\}\}/g,
      globalCompanyData().globalCompanyEmail
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_WEBSITE placeholders
  if (globalCompanyData().globalCompanyWebsite) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_WEBSITE\s*\}\}/g,
      globalCompanyData().globalCompanyWebsite
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_ADDRESS placeholders
  if (globalCompanyData().globalCompanyAddress) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_ADDRESS\s*\}\}/g,
      globalCompanyData().globalCompanyAddress
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  return result;
}
