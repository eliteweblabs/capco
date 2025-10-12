// LocalTunnel Auto-Bypass Browser Extension
// Install this as a userscript in Tampermonkey or as a browser extension

(function () {
  "use strict";

  // Function to add bypass header to all requests
  function addBypassHeader() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function (url, options = {}) {
      if (url.includes("loca.lt")) {
        options.headers = options.headers || {};
        options.headers["bypass-tunnel-reminder"] = "true";
      }
      return originalFetch(url, options);
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      if (url.includes("loca.lt")) {
        this.setRequestHeader("bypass-tunnel-reminder", "true");
      }
      return originalXHROpen.call(this, method, url, ...args);
    };
  }

  // Function to detect and bypass warning page
  function bypassWarningPage() {
    if (
      document.body.textContent.includes("You are about to visit") ||
      document.body.textContent.includes("tunnel password") ||
      document.title.includes("localtunnel")
    ) {
      console.log("🚀 Detected LocalTunnel warning page, bypassing...");

      // Try to bypass by reloading with header
      fetch(window.location.href, {
        headers: {
          "bypass-tunnel-reminder": "true",
        },
      })
        .then((response) => response.text())
        .then((html) => {
          if (!html.includes("You are about to visit")) {
            document.open();
            document.write(html);
            document.close();
            console.log("✅ Bypass successful");
          }
        })
        .catch((err) => console.error("❌ Bypass failed:", err));
    }
  }

  // Initialize
  addBypassHeader();

  // Check immediately
  bypassWarningPage();

  // Check after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bypassWarningPage);
  }

  // Check after a delay
  setTimeout(bypassWarningPage, 1000);

  // Monitor for navigation changes
  window.addEventListener("popstate", bypassWarningPage);
})();
