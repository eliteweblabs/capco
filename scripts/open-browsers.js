#!/usr/bin/env node

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function openBrowsers() {
  console.log("🌐 Opening browsers...");

  try {
    // Wait a bit for servers to start
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Open Astro app (local)
    console.log("📱 Opening Astro app (localhost:4321)...");
    await execAsync("open http://localhost:4321");

    // Open N8N interface (local)
    console.log("🔧 Opening N8N interface (localhost:5678)...");
    await execAsync("open http://localhost:5678");

    // Open tunneled Astro app
    console.log("🌍 Opening tunneled Astro app (capco-fire-dev.loca.lt)...");
    await execAsync("open https://capco-fire-dev.loca.lt");

    console.log("✅ All browsers opened successfully!");
  } catch (error) {
    console.error("❌ Error opening browsers:", error.message);
  }
}

openBrowsers();
