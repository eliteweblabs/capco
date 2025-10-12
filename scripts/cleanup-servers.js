#!/usr/bin/env node

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function killServers() {
  console.log("🧹 Cleaning up existing servers...");

  const processes = [
    "astro dev",
    "lt --port",
    "cloudflared tunnel",
    "node server.mjs",
    "n8n start",
  ];

  for (const process of processes) {
    try {
      await execAsync(`pkill -f "${process}"`);
      console.log(`✅ Killed processes matching: ${process}`);
    } catch (error) {
      // Process not found is fine, just continue
      console.log(`ℹ️  No processes found for: ${process}`);
    }
  }

  // Also kill any processes on common ports
  const ports = [4321, 4322, 3000, 8080, 5678];

  for (const port of ports) {
    try {
      await execAsync(`lsof -ti:${port} | xargs kill -9`);
      console.log(`✅ Freed up port ${port}`);
    } catch (error) {
      // Port not in use is fine
      console.log(`ℹ️  Port ${port} is already free`);
    }
  }

  console.log("✅ Server cleanup complete");
}

killServers().catch(console.error);
