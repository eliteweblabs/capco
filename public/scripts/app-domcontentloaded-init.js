(function () {
  if (typeof window !== "undefined" && window.__jsOrderLog)
    window.__jsOrderLog("App DOMContentLoaded-init (inline)");
  document.addEventListener("DOMContentLoaded", async function () {
    try {
      if (typeof window.hideOnFormFocus === "function") window.hideOnFormFocus();
      var bell = document.getElementById("notification-bell");
      if (bell && typeof window.initializeNotificationCount === "function") {
        await window.initializeNotificationCount();
      }
      var ensureSidebar = window.__ensureSidebarInit;
      if (typeof ensureSidebar === "function") {
        ensureSidebar();
        setTimeout(ensureSidebar, 400);
        setTimeout(ensureSidebar, 1200);
      }
    } catch (e) {
      console.error("🔔 [APP] Error in DOMContentLoaded init:", e);
    }
  });
})();
