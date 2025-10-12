// ==UserScript==
// @name         LocalTunnel Bypass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically bypass LocalTunnel warning pages
// @author       You
// @match        https://*.loca.lt/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Check if we're on a LocalTunnel warning page
  if (
    document.title.includes("localtunnel") ||
    document.body.textContent.includes("bypass-tunnel-reminder") ||
    document.body.textContent.includes("localtunnel")
  ) {
    console.log("🚀 LocalTunnel bypass activated");

    // Get the current URL and fetch with bypass header
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
        console.log("✅ LocalTunnel bypass successful");
      })
      .catch((error) => {
        console.error("❌ LocalTunnel bypass failed:", error);
      });
  }
})();
