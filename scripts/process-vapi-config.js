#!/usr/bin/env node

/**
 * Process VAPI Assistant Configuration with Placeholder Replacement
 *
 * This script processes the vapi-assistant-config.js file through the placeholder-utils
 * system to replace {{global.*}} placeholders with actual company data at build time.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Main processing function
async function processVapiConfig() {
  console.log("🔄 [VAPI-PROCESSOR] Processing VAPI configuration with placeholders...");

  try {
    // Import the Node.js compatible placeholder-utils
    const { replacePlaceholders } = await import("./placeholder-utils-node.js");

    // Import the assistant config from the VAPI config file
    const configModule = await import("./vapi-assistant-config.js");
    const config = configModule.assistantConfig;

    console.log("📄 [VAPI-PROCESSOR] Imported assistant configuration and placeholder-utils");

    // Process each message field that might contain placeholders
    const fieldsToProcess = [
      "firstMessage",
      "endCallMessage",
      "chatFirstMessage",
      "chatPlaceholder",
    ];

    let processedCount = 0;

    for (const field of fieldsToProcess) {
      if (config[field] && typeof config[field] === "string") {
        const originalValue = config[field];
        // Use placeholder-utils.ts with no project data (only global placeholders)
        const processedValue = replacePlaceholders(originalValue, null);

        if (processedValue !== originalValue) {
          config[field] = processedValue;
          processedCount++;
          console.log(
            `✅ [VAPI-PROCESSOR] Processed ${field}: "${originalValue}" → "${processedValue}"`
          );
        } else {
          console.log(`ℹ️ [VAPI-PROCESSOR] No placeholders found in ${field}`);
        }
      }
    }

    // Process any nested objects that might contain placeholders
    if (config.assistantOverrides && config.assistantOverrides.variableValues) {
      const variableValues = config.assistantOverrides.variableValues;

      for (const [key, value] of Object.entries(variableValues)) {
        if (typeof value === "string") {
          const originalValue = value;
          // Use placeholder-utils.ts with no project data (only global placeholders)
          const processedValue = replacePlaceholders(originalValue, null);

          if (processedValue !== originalValue) {
            variableValues[key] = processedValue;
            processedCount++;
            console.log(
              `✅ [VAPI-PROCESSOR] Processed variable ${key}: "${originalValue}" → "${processedValue}"`
            );
          }
        }
      }
    }

    // Convert back to JavaScript code
    const processedConfigString = JSON.stringify(config, null, 2);

    // Create the new file content
    const newFileContent = `/**
 * Vapi.ai Assistant Configuration for Cal.com Integration
 * 
 * This file has been processed to replace placeholders with actual company data.
 * Generated at: ${new Date().toISOString()}
 * 
 * TEMPLATE VARIABLES:
 * - {{global.globalCompanyName}} - Company name (processed at build time)
 * - {{global.globalCompanySlogan}} - Company slogan (processed at build time)
 * - {{global.globalCompanyPhone}} - Company phone (processed at build time)
 * - {{global.globalCompanyEmail}} - Company email (processed at build time)
 * - {{customer.number}} - Customer phone number (set via customer.number in call request)
 * - {{now}}, {{date}}, {{time}} - Built-in VAPI variables for current date/time
 * 
 * EMAIL FUNCTIONALITY:
 * - After booking appointments, the assistant automatically sends confirmation emails
 * - Uses the existing update-delivery.ts API for consistent email formatting
 * - Emails include appointment details and helpful preparation tips
 * 
 * To use these variables, provide them when initiating a call:
 * {
 *   "assistantId": "your-assistant-id",
 *   "customer": { "number": "+1234567890" },
 *   "assistantOverrides": {
 *     "variableValues": {
 *       "company.name": "CAPCo Fire Protection",
 *       "assistant.name": "Sarah"
 *     }
 *   }
 * }
 * 
 * SETUP INSTRUCTIONS:
 * 1. Run: node scripts/create-vapi-email-tool.js
 * 2. Copy the generated Tool ID
 * 3. Replace 'email-confirmation-tool-id' in toolIds array with the actual Tool ID
 * 4. Update the assistant configuration
 */

export default ${processedConfigString};
`;

    // Export the processed config for use by other scripts
    console.log(`✅ [VAPI-PROCESSOR] Successfully processed ${processedCount} placeholders`);
    console.log(`📤 [VAPI-PROCESSOR] Processed config ready for VAPI upload`);

    // Write the processed file for reference/debugging
    const outputPath = join(__dirname, "vapi-assistant-config-processed.js");
    writeFileSync(outputPath, newFileContent, "utf8");
    console.log(`📁 [VAPI-PROCESSOR] Debug file written to: ${outputPath}`);

    // Export the processed config object for use by other scripts
    return config;
  } catch (error) {
    console.error("❌ [VAPI-PROCESSOR] Error processing VAPI configuration:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processVapiConfig();
}

export { processVapiConfig };
