#!/usr/bin/env node

import { createServer } from "http";
import { spawn } from "child_process";
import fetch from "node-fetch";

const LOCAL_PORT = 4321;
const PROXY_PORT = 4322;
const TUNNEL_SUBDOMAIN = "capco-fire-dev";

// Create proxy server that adds bypass headers
function createProxyServer() {
  const proxy = createServer((req, res) => {
    const targetUrl = `http://localhost:${LOCAL_PORT}${req.url}`;

    console.log(`🔄 Proxying: ${req.method} ${req.url}`);

    // Add bypass headers to all requests
    const headers = {
      ...req.headers,
      "bypass-tunnel-reminder": "true",
      "User-Agent": "Mozilla/5.0 (compatible; DevTunnel/1.0)",
    };

    // Remove host header to avoid conflicts
    delete headers.host;

    fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req : undefined,
    })
      .then((response) => {
        // Copy response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        res.writeHead(response.status, responseHeaders);
        response.body.pipe(res);
      })
      .catch((error) => {
        console.error("❌ Proxy error:", error);
        res.writeHead(500);
        res.end("Proxy error: " + error.message);
      });
  });

  return proxy;
}

// Start LocalTunnel pointing to our proxy
function startTunnel() {
  console.log("🚀 Starting LocalTunnel with proxy...");

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
      console.log("🔧 All requests automatically include bypass headers");
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
  console.log("🚀 Starting development server with automatic bypass...");

  // Start proxy server
  const proxy = createProxyServer();

  proxy.listen(PROXY_PORT, () => {
    console.log(`🔄 Proxy server running on port ${PROXY_PORT}`);
    console.log(`📡 Proxying requests to localhost:${LOCAL_PORT}`);

    // Start tunnel pointing to proxy
    const tunnel = startTunnel();

    // Handle cleanup
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down...");
      tunnel.kill();
      proxy.close();
      process.exit(0);
    });
  });

  // Keep process alive
  process.stdin.resume();
}

main().catch(console.error);
