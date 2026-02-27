if (window.__jsOrderLog) window.__jsOrderLog("AOS init (inline)");
window.addEventListener("DOMContentLoaded", function () {
  var path = window.location.pathname;
  if (path.startsWith("/admin") || path.startsWith("/project")) return;
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      offset: 120,
      delay: 50,
    });
  }
});
