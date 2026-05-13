if (window.__jsOrderLog) window.__jsOrderLog("AOS init (inline)");
window.addEventListener("DOMContentLoaded", function () {
  var path = window.location.pathname;
  if (path.startsWith("/admin") || path.startsWith("/project")) return;
  // Delay AOS.init until after the staged page intro finishes (icon → header → footer → main)
  // so hero/above-fold elements animate when visible.
  var fallbackDelayMs = 2800;
  var aosInited = false;
  function doInit() {
    if (aosInited || typeof AOS === "undefined") return;
    aosInited = true;
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      offset: 120,
      delay: 50,
    });
  }
  window.addEventListener("cms-preloader-hidden", function () {
    doInit();
  }, { once: true });
  setTimeout(function () {
    doInit();
  }, fallbackDelayMs);
});
