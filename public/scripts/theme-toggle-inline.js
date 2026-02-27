(function () {
  function initThemeToggle() {
    var themeToggle = document.getElementById("theme-toggle");
    var darkIcon = document.getElementById("theme-toggle-dark-icon");
    var lightIcon = document.getElementById("theme-toggle-light-icon");
    if (
      !themeToggle ||
      !darkIcon ||
      !lightIcon ||
      themeToggle.getAttribute("data-theme-toggle-inited") === "1"
    )
      return;
    themeToggle.setAttribute("data-theme-toggle-inited", "1");
    function syncIcons(isDark) {
      if (isDark) {
        darkIcon.classList.add("hidden");
        lightIcon.classList.remove("hidden");
      } else {
        darkIcon.classList.remove("hidden");
        lightIcon.classList.add("hidden");
      }
    }
    syncIcons(document.documentElement.classList.contains("dark"));
    themeToggle.addEventListener("click", function () {
      var isDark = document.documentElement.classList.contains("dark");
      var newTheme = isDark ? "light" : "dark";
      if (isDark) {
        document.documentElement.classList.remove("dark");
        try {
          localStorage.setItem("color-theme", "light");
        } catch {
          /* ignore */
        }
      } else {
        document.documentElement.classList.add("dark");
        try {
          localStorage.setItem("color-theme", "dark");
        } catch {
          /* ignore */
        }
      }
      syncIcons(!isDark);
      document.cookie =
        "theme=" + newTheme + "; path=/; max-age=31536000; SameSite=Lax";
      if (typeof window.currentTheme !== "undefined") window.currentTheme = newTheme;
      if (typeof window.updateThemeSync === "function") window.updateThemeSync();
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle);
  } else {
    initThemeToggle();
  }
  setTimeout(initThemeToggle, 200);
})();
