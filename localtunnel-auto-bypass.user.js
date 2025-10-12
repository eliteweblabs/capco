// ==UserScript==
// @name         LocalTunnel Auto-Bypass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically bypass LocalTunnel warning pages
// @author       You
// @match        https://*.loca.lt/*
// @match        https://*.loca.lt/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function detectWarningPage() {
    return (
      document.title.includes("localtunnel") ||
      document.body.textContent.includes("bypass-tunnel-reminder") ||
      document.body.textContent.includes("tunnel password") ||
      document.body.textContent.includes("To bypass this page") ||
      document.querySelector("body").innerHTML.includes("bypass-tunnel-reminder")
    );
  }

  function bypassWarning() {
    console.log("🚀 Tampermonkey: Auto-bypassing LocalTunnel warning...");

    // Strategy 1: Direct fetch with headers
    fetch(window.location.href, {
      method: "GET",
      headers: {
        "bypass-tunnel-reminder": "true",
        "User-Agent": "Mozilla/5.0 (compatible; DevTunnel/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      credentials: "include",
      cache: "no-cache",
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Response not ok: " + response.status);
      })
      .then((html) => {
        // Replace the entire page content
        document.open();
        document.write(html);
        document.close();
        console.log("✅ Tampermonkey: Auto-bypass successful");
      })
      .catch((err) => {
        console.error("❌ Tampermonkey: Auto-bypass failed:", err);
        // Strategy 2: Try with different headers
        setTimeout(() => {
          fetch(window.location.href, {
            headers: {
              "bypass-tunnel-reminder": "1",
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
          })
            .then((r) => r.text())
            .then((h) => {
              document.open();
              document.write(h);
              document.close();
            })
            .catch((e) => console.error("❌ Tampermonkey: Second bypass attempt failed:", e));
        }, 1000);
      });
  }

  // Check immediately
  if (detectWarningPage()) {
    bypassWarning();
  }

  // Also check after DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
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
})();
