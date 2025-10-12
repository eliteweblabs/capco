// ==UserScript==
// @name         LocalTunnel Auto-Bypass
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Automatically bypass LocalTunnel warning pages
// @author       You
// @match        https://*.loca.lt/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // Function to bypass the warning page
  function bypassWarning() {
    console.log("🚀 LocalTunnel auto-bypass activated");

    const currentUrl = window.location.href;

    fetch(currentUrl, {
      headers: {
        "bypass-tunnel-reminder": "true",
        "User-Agent": "Mozilla/5.0 (compatible; DevTunnel/1.0)",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Bypass failed: " + response.status);
      })
      .then((html) => {
        // Replace the page content
        document.open();
        document.write(html);
        document.close();
        console.log("✅ LocalTunnel auto-bypass successful");
      })
      .catch((error) => {
        console.error("❌ LocalTunnel auto-bypass failed:", error);
      });
  }

  // Check if we're on a LocalTunnel warning page
  function isWarningPage() {
    return (
      document.title.includes("localtunnel") ||
      document.title.includes("You are about to visit") ||
      document.body.textContent.includes("bypass-tunnel-reminder") ||
      document.body.textContent.includes("tunnel password") ||
      document.body.textContent.includes("localtunnel")
    );
  }

  // Run bypass immediately if on warning page
  if (isWarningPage()) {
    bypassWarning();
  }

  // Also listen for DOM changes in case the page loads dynamically
  const observer = new MutationObserver((mutations) => {
    if (isWarningPage()) {
      bypassWarning();
      observer.disconnect(); // Stop observing once we've bypassed
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Clean up observer after 10 seconds
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
})();
