#!/usr/bin/env node

import { spawn } from "child_process";
import { createServer } from "http";
import fetch from "node-fetch";

const TUNNEL_SUBDOMAIN = "capco-fire-dev";
const LOCAL_PORT = 4321;

// Start LocalTunnel with custom subdomain
function startTunnel() {
  console.log("🚀 Starting LocalTunnel...");

  const tunnel = spawn("lt", ["--port", "4322", "--subdomain", TUNNEL_SUBDOMAIN], {
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

      // Test the tunnel with bypass header
      testTunnel(tunnelUrl);
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

// Test tunnel with bypass header
async function testTunnel(url) {
  try {
    console.log("🔍 Testing tunnel with bypass header...");

    const response = await fetch(url, {
      headers: {
        "bypass-tunnel-reminder": "true",
        "User-Agent": "Mozilla/5.0 (compatible; DevTunnel/1.0)",
      },
    });

    if (response.ok) {
      console.log("✅ Tunnel working with bypass header");
      console.log(`🌐 Your app is available at: ${url}`);
      console.log("💡 Use the bypass bookmarklet or ModHeader extension to avoid warning pages");
    } else {
      console.log("⚠️  Tunnel test failed:", response.status);
    }
  } catch (error) {
    console.error("❌ Tunnel test error:", error.message);
  }
}

// Start proxy server to add bypass headers automatically
function startProxyServer() {
  const proxy = createServer((req, res) => {
    const targetUrl = `http://localhost:${LOCAL_PORT}${req.url}`;

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

  proxy.listen(4322, () => {
    console.log("🔄 Proxy server running on port 4322");
    console.log("💡 Use this proxy to automatically bypass LocalTunnel warnings");
  });

  return proxy;
}

// Main function
async function main() {
  console.log("🚀 Starting development server with LocalTunnel...");

  // Start proxy server
  const proxy = startProxyServer();

  // Start tunnel
  const tunnel = startTunnel();

  // Handle cleanup
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    tunnel.kill();
    proxy.close();
    process.exit(0);
  });

  // Keep process alive
  process.stdin.resume();
}

main().catch(console.error);
