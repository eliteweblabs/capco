#!/usr/bin/env node

import { spawn } from "child_process";
import { createServer } from "http";
import fetch from "node-fetch";

const TUNNEL_SUBDOMAIN = "capco-fire-dev";
const ASTRO_PORT = 4321;
const PROXY_PORT = 4322;

// Start Astro dev server
function startAstroServer() {
  console.log("🚀 Starting Astro dev server...");

  const astro = spawn("npm", ["run", "dev"], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  astro.stdout.on("data", (data) => {
    console.log("Astro:", data.toString());
  });

  astro.stderr.on("data", (data) => {
    console.log("Astro error:", data.toString());
  });

  return astro;
}

// Start proxy server that forwards to Astro
function startProxyServer() {
  console.log("🔄 Starting proxy server...");

  const proxy = createServer((req, res) => {
    const targetUrl = `http://localhost:${ASTRO_PORT}${req.url}`;

    // Add bypass headers to all requests
    const headers = {
      ...req.headers,
      "bypass-tunnel-reminder": "true",
      "User-Agent": "Mozilla/5.0 (compatible; DevTunnel/1.0)",
    };

    fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req : undefined,
    })
      .then((response) => {
        res.writeHead(response.status, response.headers.raw());
        response.body.pipe(res);
      })
      .catch((error) => {
        console.error("Proxy error:", error);
        res.writeHead(500);
        res.end("Proxy error");
      });
  });

  proxy.listen(PROXY_PORT, () => {
    console.log(`🔄 Proxy server running on port ${PROXY_PORT}`);
    console.log("💡 Proxy forwards to Astro dev server on port 4321");
  });

  return proxy;
}

// Start LocalTunnel with custom subdomain
function startTunnel() {
  console.log("🚀 Starting LocalTunnel...");

  const tunnel = spawn("lt", ["--port", PROXY_PORT.toString(), "--subdomain", TUNNEL_SUBDOMAIN], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let tunnelUrl = null;

  tunnel.stdout.on("data", (data) => {
    const output = data.toString();
    console.log("Tunnel output:", output);

    // Extract URL from output
    const urlMatch = output.match(/your url is: (https:\/\/[^\s]+)/);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      console.log(`✅ Tunnel ready: ${tunnelUrl}`);
      console.log(`🌐 Your app is available at: ${tunnelUrl}`);
    }
  });

  tunnel.stderr.on("data", (data) => {
    console.error("Tunnel error:", data.toString());
  });

  tunnel.on("close", (code) => {
    console.log(`Tunnel process exited with code ${code}`);
  });

  return tunnel;
}

// Main function
async function main() {
  console.log("🚀 Starting development server with LocalTunnel...");
  console.log("📋 Setup:");
  console.log("   1. Astro dev server → port 4321");
  console.log("   2. Proxy server → port 4322 (forwards to 4321)");
  console.log("   3. LocalTunnel → tunnels port 4322");

  // Start Astro dev server
  const astro = startAstroServer();

  // Wait a moment for Astro to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Start proxy server
  const proxy = startProxyServer();

  // Wait a moment for proxy to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Start tunnel
  const tunnel = startTunnel();

  // Handle cleanup
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    astro.kill();
    tunnel.kill();
    proxy.close();
    process.exit(0);
  });

  // Keep process alive
  process.stdin.resume();
}

main().catch(console.error);
