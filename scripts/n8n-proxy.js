#!/usr/bin/env node

import { createServer } from "http";
import { spawn } from "child_process";

const N8N_PORT = 5678;
const PROXY_PORT = 5679;
const TUNNEL_SUBDOMAIN = "capco-fire-n8n";

// Create proxy server for N8N
function createN8NProxy() {
  const proxy = createServer((req, res) => {
    const targetUrl = `http://localhost:${N8N_PORT}${req.url}`;

    console.log(`🔄 [N8N-PROXY] Proxying: ${req.method} ${req.url}`);

    // Forward request to N8N
    const fetchOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        "accept-encoding": "identity", // Disable compression
        connection: "close",
      },
    };

    // Add body for non-GET/HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = req;
      fetchOptions.duplex = "half";
    }

    fetch(targetUrl, fetchOptions)
      .then(async (response) => {
        console.log(`🔄 [N8N-PROXY] N8N response status: ${response.status}`);
        console.log(
          `🔄 [N8N-PROXY] N8N response headers:`,
          Object.fromEntries(response.headers.entries())
        );

        // Copy response headers and disable compression
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Remove compression headers that cause issues
        delete responseHeaders["content-encoding"];
        delete responseHeaders["transfer-encoding"];
        responseHeaders["content-encoding"] = "identity";

        res.writeHead(response.status, responseHeaders);

        // Handle response body properly
        if (response.body) {
          const reader = response.body.getReader();
          let responseBody = "";
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                responseBody += Buffer.from(value).toString();
                res.write(value);
              }
              console.log(`🔄 [N8N-PROXY] N8N response body:`, responseBody);
              res.end();
            } catch (err) {
              console.error("❌ [N8N-PROXY] Stream error:", err);
              res.end();
            }
          };
          pump();
        } else {
          console.log(`🔄 [N8N-PROXY] No response body from N8N`);
          res.end();
        }
      })
      .catch((error) => {
        console.error("❌ [N8N-PROXY] Proxy error:", error);
        res.writeHead(500);
        res.end("Proxy error: " + error.message);
      });
  });

  return proxy;
}

// Start LocalTunnel for N8N
function startN8NTunnel() {
  console.log("🚀 Starting N8N tunnel...");

  const tunnel = spawn("lt", ["--port", PROXY_PORT.toString(), "--subdomain", TUNNEL_SUBDOMAIN], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let tunnelUrl = null;

  tunnel.stdout.on("data", (data) => {
    const output = data.toString();
    console.log("N8N Tunnel output:", output);

    // Extract URL from output
    const urlMatch = output.match(/your url is: (https:\/\/[^\s]+)/);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      console.log(`✅ N8N Tunnel ready: ${tunnelUrl}`);
    }
  });

  tunnel.stderr.on("data", (data) => {
    console.error("N8N Tunnel error:", data.toString());
  });

  tunnel.on("close", (code) => {
    console.log(`N8N Tunnel process exited with code ${code}`);
  });

  return tunnel;
}

// Main function
async function main() {
  console.log("🚀 Starting N8N proxy and tunnel...");

  // Start N8N proxy server
  const proxy = createN8NProxy();

  proxy.listen(PROXY_PORT, () => {
    console.log(`🔄 N8N Proxy server running on port ${PROXY_PORT}`);
    console.log(`📡 Proxying requests to localhost:${N8N_PORT}`);

    // Start tunnel pointing to proxy
    const tunnel = startN8NTunnel();

    // Handle cleanup
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down N8N proxy...");
      tunnel.kill();
      proxy.close();
      process.exit(0);
    });
  });

  // Keep process alive
  process.stdin.resume();
}

main().catch(console.error);
