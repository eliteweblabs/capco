#!/usr/bin/env node

import { spawn } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 [STARTUP] Starting CAPCo services...");

// Start chat server
const chatServer = spawn("node", ["chat-server.mjs"], {
  stdio: "inherit",
  cwd: __dirname,
});

// Start main Astro app
const astroApp = spawn("node", ["./dist/server/entry.mjs"], {
  stdio: "inherit",
  cwd: __dirname,
});

// Handle process termination
process.on("SIGTERM", () => {
  console.log("🔔 [STARTUP] SIGTERM received, shutting down services...");
  chatServer.kill("SIGTERM");
  astroApp.kill("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🔔 [STARTUP] SIGINT received, shutting down services...");
  chatServer.kill("SIGINT");
  astroApp.kill("SIGINT");
  process.exit(0);
});

// Handle child process errors
chatServer.on("error", (error) => {
  console.error("❌ [STARTUP] Chat server error:", error);
});

astroApp.on("error", (error) => {
  console.error("❌ [STARTUP] Astro app error:", error);
});

// Handle child process exit
chatServer.on("exit", (code) => {
  console.log(`🔔 [STARTUP] Chat server exited with code ${code}`);
  if (code !== 0) {
    console.error("❌ [STARTUP] Chat server failed, shutting down...");
    process.exit(1);
  }
});

astroApp.on("exit", (code) => {
  console.log(`🔔 [STARTUP] Astro app exited with code ${code}`);
  if (code !== 0) {
    console.error("❌ [STARTUP] Astro app failed, shutting down...");
    process.exit(1);
  }
});

console.log("✅ [STARTUP] Both services started successfully");
