// ==UserScript==
// @name         LocalTunnel Auto-Bypass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically bypass LocalTunnel warning pages
// @author       You
// @match        https://*.loca.lt/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Add bypass header to all requests
  const originalFetch = window.fetch;
  window.fetch = function (url, options = {}) {
    if (url.includes("loca.lt")) {
      options.headers = options.headers || {};
      options.headers["bypass-tunnel-reminder"] = "true";
    }
    return originalFetch(url, options);
  };

  // Check if we're on the warning page
  if (document.body.textContent.includes("You are about to visit")) {
    console.log("🚀 Bypassing LocalTunnel warning page...");

    // Reload with bypass header
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
})();
