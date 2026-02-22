/**
 * Theme and bootstrap globals. Must run first (before Flowbite/other scripts).
 * Sets: dark/light from localStorage or system, theme cookie, window.isDarkMode, window.currentTheme,
 * data-page-size, window.__legacySafari. Optional: __jsOrderLog, __traceLog for debug.
 */
(function () {
  if (typeof window === "undefined") return;

  (window as any).__jsOrder = 0;
  (window as any).__jsOrderLog = function (label: string) {
    (window as any).__jsOrder = ((window as any).__jsOrder || 0) + 1;
    console.log("[JS-ORDER]", (window as any).__jsOrder, label);
  };
  (window as any).__traceNum = 0;
  (window as any).__traceLog = function (m: string) {
    (window as any).__traceNum = ((window as any).__traceNum || 0) + 1;
    console.log("[TRACE " + (window as any).__traceNum + "] " + m);
  };
  window.addEventListener("error", (e) => {
    if ((window as any).__traceLog) (window as any).__traceLog("ERROR: " + (e.message || String(e)));
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = (e.reason && (e.reason.message || String(e.reason))) || "unknown";
    if ((window as any).__traceLog) (window as any).__traceLog("UNHANDLED REJECTION: " + msg);
  });

  (window as any).__jsOrderLog("App theme");
  const hasExplicitPreference = localStorage.getItem("color-theme") !== null;

  function setThemeCookie(theme: string) {
    document.cookie = "theme=" + theme + "; path=/; max-age=31536000; SameSite=Lax";
  }

  function applyTheme(mode: string) {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("color-theme", mode);
    setThemeCookie(mode);
  }

  if (hasExplicitPreference) {
    applyTheme(localStorage.getItem("color-theme") || "light");
  } else {
    applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  (window as any).isDarkMode = function () {
    if (document.documentElement.classList.contains("dark")) return true;
    const stored = localStorage.getItem("color-theme");
    if (stored !== null) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  (window as any).currentTheme = (window as any).isDarkMode() ? "dark" : "light";

  const pageSize = localStorage.getItem("page-size") || "normal";
  document.documentElement.setAttribute("data-page-size", pageSize);

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const versionMatch = ua.match(/Version\/(\d+)/);
  const major = versionMatch ? parseInt(versionMatch[1], 10) : 0;
  if (isIOS && major > 0 && major < 14) {
    (window as any).__legacySafari = true;
  }
})();
