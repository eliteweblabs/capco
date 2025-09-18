#!/usr/bin/env node

/**
 * Cron job script to update project elapsed_time every minute
 *
 * Usage:
 * 1. Install node-cron: npm install node-cron
 * 2. Run: node update-elapsed-time-cron.js
 *
 * Or add to your system crontab:
 * * * * * * cd /path/to/your/project && node update-elapsed-time-cron.js
 */

const cron = require("node-cron");

// Your API base URL
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4321";

async function updateElapsedTime() {
  try {
    console.log(`[${new Date().toISOString()}] Updating project elapsed times...`);

    const response = await fetch(`${API_BASE_URL}/api/update-elapsed-time`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[${new Date().toISOString()}] ✅ Success:`, result.message);
    } else {
      const error = await response.text();
      console.error(`[${new Date().toISOString()}] ❌ Error:`, error);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Network error:`, error.message);
  }
}

// Run every minute
cron.schedule("* * * * *", updateElapsedTime);

console.log("🕐 Elapsed time updater started - running every minute");
console.log(`📡 API endpoint: ${API_BASE_URL}/api/update-elapsed-time`);

// Run once immediately
updateElapsedTime();
