/**
 * Theme and bootstrap globals. Must run first (before Flowbite/other scripts).
 * Sets: dark/light from localStorage or system, theme cookie, window.isDarkMode, window.currentTheme,
 * data-page-size, window.__legacySafari. Optional: __jsOrderLog, __traceLog for debug.
 */
(function () {
  if (typeof window === "undefined") return;

  const SEQ_TOKEN = "__SEQ__";
  const originalConsoleLog = console.log.bind(console);
  const seqOnlyLogs = localStorage.getItem("seqOnlyLogs") !== "0";

  (window as any).__seqNum = 0;
  (window as any).__seqLog = function () {
    (window as any).__seqNum = ((window as any).__seqNum || 0) + 1;
    console.log(SEQ_TOKEN, (window as any).__seqNum);
  };

  if (seqOnlyLogs) {
    console.log = (...args: any[]) => {
      if (args[0] === SEQ_TOKEN) {
        originalConsoleLog(args[1]);
      }
    };
  }

  (window as any).__jsOrderLog = function (_label: string) {
    if ((window as any).__seqLog) (window as any).__seqLog();
  };
  (window as any).__traceLog = function (_m: string) {
    if ((window as any).__seqLog) (window as any).__seqLog();
  };
  window.addEventListener("error", (e) => {
    if ((window as any).__traceLog)
      (window as any).__traceLog("ERROR: " + (e.message || String(e)));
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
