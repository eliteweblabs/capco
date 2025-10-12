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
              }

              // Check if this is HTML and inject bypass script
              const contentType = response.headers.get("content-type") || "";
              if (contentType.includes("text/html") && responseBody.includes("<!DOCTYPE html>")) {
                console.log("🔧 [N8N-PROXY] Injecting auto-bypass script into HTML response");

                const bypassScript = `
<script>
(function() {
  // Check for URL parameter bypass
  const urlParams = new URLSearchParams(window.location.search);
  const bypassParam = urlParams.get('bypass') || urlParams.get('dev') || urlParams.get('skip');
  
  if (bypassParam) {
    console.log('🚀 URL parameter bypass detected for N8N, auto-bypassing...');
    // Immediately bypass without waiting for page detection
    fetch(window.location.href, {
      method: 'GET',
      headers: {
        'bypass-tunnel-reminder': 'true',
        'User-Agent': 'Mozilla/5.0 (compatible; DevTunnel/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      credentials: 'include',
      cache: 'no-cache'
    })
    .then(response => {
      if (response.ok) {
        return response.text();
      }
      throw new Error('Response not ok: ' + response.status);
    })
    .then(html => {
      document.open();
      document.write(html);
      document.close();
      console.log('✅ N8N URL parameter bypass successful');
    })
    .catch(err => {
      console.error('❌ N8N URL parameter bypass failed:', err);
    });
    return;
  }
  
  // Auto-bypass LocalTunnel warning page
  function detectWarningPage() {
    return document.title.includes('localtunnel') || 
           document.body.textContent.includes('bypass-tunnel-reminder') ||
           document.body.textContent.includes('tunnel password') ||
           document.body.textContent.includes('To bypass this page') ||
           document.body.textContent.includes('You are about to visit') ||
           document.querySelector('body').innerHTML.includes('bypass-tunnel-reminder') ||
           document.querySelector('body').innerHTML.includes('loca.lt');
  }
  
  function bypassWarning() {
    console.log('🚀 Auto-bypassing LocalTunnel warning for N8N...');
    
    fetch(window.location.href, {
      method: 'GET',
      headers: {
        'bypass-tunnel-reminder': 'true',
        'User-Agent': 'Mozilla/5.0 (compatible; DevTunnel/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      credentials: 'include',
      cache: 'no-cache'
    })
    .then(response => {
      if (response.ok) {
        return response.text();
      }
      throw new Error('Response not ok: ' + response.status);
    })
    .then(html => {
      document.open();
      document.write(html);
      document.close();
      console.log('✅ N8N Auto-bypass successful');
    })
    .catch(err => {
      console.error('❌ N8N Auto-bypass failed:', err);
    });
  }
  
  // Check immediately and on DOM ready
  if (detectWarningPage()) {
    bypassWarning();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (detectWarningPage()) {
        bypassWarning();
      }
    });
  }
  
  setTimeout(() => {
    if (detectWarningPage()) {
      bypassWarning();
    }
  }, 500);
})();
</script>`;

                const modifiedHtml = responseBody.replace("</head>", `${bypassScript}</head>`);
                res.end(modifiedHtml);
              } else {
                console.log(
                  `🔄 [N8N-PROXY] N8N response body:`,
                  responseBody.substring(0, 200) + "..."
                );
                res.end(responseBody);
              }
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
