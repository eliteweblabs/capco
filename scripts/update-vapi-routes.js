#!/usr/bin/env node

/**
 * Update VAPI Assistant with Route-Based Script
 *
 * This script updates your VAPI assistant with the new markdown-formatted
 * route-based system prompt for better call handling.
 */

import "dotenv/config";
import { updateAssistant } from "./vapi-assistant-config.js";

const ASSISTANT_ID = "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

async function updateVapiRoutes() {
  console.log("🚀 Updating VAPI Assistant with Route-Based Script...");

  if (!process.env.VAPI_API_KEY) {
    console.error("❌ VAPI_API_KEY environment variable not found");
    console.error("Please set VAPI_API_KEY in your .env file");
    process.exit(1);
  }

  try {
    await updateAssistant(ASSISTANT_ID);
    console.log("✅ VAPI Assistant updated successfully!");
    console.log("\n📋 New Features:");
    console.log("  • Markdown-formatted system prompt");
    console.log("  • Route-based call handling");
    console.log("  • Meeting/Appointment route");
    console.log("  • Website/Login route");
    console.log("  • General Support route");
    console.log("\n🎯 Test your assistant by calling or using the VAPI dashboard");
  } catch (error) {
    console.error("❌ Failed to update VAPI assistant:", error.message);
    process.exit(1);
  }
}

// Run the update
updateVapiRoutes();
