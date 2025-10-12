#!/usr/bin/env node

import { createServer } from "http";
import { spawn } from "child_process";
import fetch from "node-fetch";

const LOCAL_PORT = 4321;
const PROXY_PORT = 4322;
const TUNNEL_SUBDOMAIN = "capco-fire-dev";

// Create proxy server that automatically injects bypass script
function createProxyServer() {
  const proxy = createServer((req, res) => {
    const targetUrl = `http://localhost:${LOCAL_PORT}${req.url}`;

    console.log(`🔄 Proxying: ${req.method} ${req.url}`);

    // Add bypass headers to all requests
    const headers = {
      ...req.headers,
      "bypass-tunnel-reminder": "true",
      "User-Agent": "Mozilla/5.0 (compatible; DevTunnel/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    };

    // Remove host header to avoid conflicts
    delete headers.host;

    fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req : undefined,
    })
      .then(async (response) => {
        // If this is an HTML response, inject bypass script
        if (response.headers.get("content-type")?.includes("text/html")) {
          const html = await response.text();

          // Inject automatic bypass script with multiple strategies
          const bypassScript = `
<script>
(function() {
  // Check for URL parameter bypass
  const urlParams = new URLSearchParams(window.location.search);
  const bypassParam = urlParams.get('bypass') || urlParams.get('dev') || urlParams.get('skip');
  
  if (bypassParam) {
    console.log('🚀 URL parameter bypass detected, auto-bypassing...');
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
      console.log('✅ URL parameter bypass successful');
    })
    .catch(err => {
      console.error('❌ URL parameter bypass failed:', err);
    });
    return;
  }
  
  // Auto-bypass LocalTunnel warning page with multiple strategies
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
    console.log('🚀 Auto-bypassing LocalTunnel warning...');
    
    // Strategy 1: Direct fetch with headers
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
      // Replace the entire page content
      document.open();
      document.write(html);
      document.close();
      console.log('✅ Auto-bypass successful');
    })
    .catch(err => {
      console.error('❌ Auto-bypass failed:', err);
      // Strategy 2: Try with different headers
      setTimeout(() => {
        fetch(window.location.href, {
          headers: {
            'bypass-tunnel-reminder': '1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        })
        .then(r => r.text())
        .then(h => {
          document.open();
          document.write(h);
          document.close();
        })
        .catch(e => console.error('❌ Second bypass attempt failed:', e));
      }, 1000);
    });
  }
  
  // Check immediately and on DOM ready
  if (detectWarningPage()) {
    bypassWarning();
  }
  
  // Also check after DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (detectWarningPage()) {
        bypassWarning();
      }
    });
  }
  
  // Final check after a short delay
  setTimeout(() => {
    if (detectWarningPage()) {
      bypassWarning();
    }
  }, 500);
  
  // Additional check for the specific warning page
  if (document.body.textContent.includes('You are about to visit')) {
    console.log('🚀 Detected LocalTunnel warning page, bypassing...');
    bypassWarning();
  }
})();
</script>`;

          const modifiedHtml = html.replace("</head>", `${bypassScript}</head>`);

          // Copy response headers
          const responseHeaders = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          res.writeHead(response.status, responseHeaders);
          res.end(modifiedHtml);
        } else {
          // For non-HTML responses, just pass through
          const responseHeaders = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          res.writeHead(response.status, responseHeaders);
          response.body.pipe(res);
        }
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
  console.log("🚀 Starting LocalTunnel with auto-bypass...");

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
      console.log("🔧 Auto-bypass script injected into all pages");
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
  console.log("🚀 Starting development server with auto-bypass...");

  // Start proxy server
  const proxy = createProxyServer();

  proxy.listen(PROXY_PORT, () => {
    console.log(`🔄 Proxy server running on port ${PROXY_PORT}`);
    console.log(`📡 Proxying requests to localhost:${LOCAL_PORT}`);
    console.log(`🔧 Auto-bypass script will be injected into HTML pages`);

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
