(function () {
  function initAlertDismiss() {
    document.querySelectorAll("[data-dismiss-alert]").forEach(function (btn) {
      if (btn.getAttribute("data-alert-dismiss-inited") === "1") return;
      btn.setAttribute("data-alert-dismiss-inited", "1");
      btn.addEventListener("click", function () {
        var alertId = btn.getAttribute("data-dismiss-alert");
        var alert = alertId ? document.getElementById(alertId) : null;
        if (alert) {
          alert.style.transition = "opacity 0.3s ease";
          alert.style.opacity = "0";
          setTimeout(function () {
            alert.remove();
          }, 300);
        }
      });
    });
    document.querySelectorAll(".banner-alert").forEach(function (banner) {
      var el = banner;
      var bannerId = el.getAttribute("data-banner-id");
      var dismissBtn = el.querySelector(".banner-dismiss");
      if (!dismissBtn || dismissBtn.getAttribute("data-banner-dismiss-inited") === "1") return;
      dismissBtn.setAttribute("data-banner-dismiss-inited", "1");
      try {
        var stored = localStorage.getItem("dismissedBanners");
        var dismissed = stored ? JSON.parse(stored) : [];
        if (bannerId && dismissed.indexOf(bannerId) !== -1) {
          el.style.display = "none";
          return;
        }
      } catch (e) {
        _logger.error("Error dismissing banner:", e);
      }
      dismissBtn.addEventListener("click", function () {
        el.style.transition =
          "max-height 0.3s ease-out, opacity 0.3s ease-out, margin 0.3s ease-out";
        el.style.opacity = "0";
        el.style.maxHeight = "0";
        el.style.overflow = "hidden";
        el.style.marginTop = "0";
        el.style.marginBottom = "0";
        setTimeout(function () {
          el.style.display = "none";
        }, 300);
        if (bannerId) {
          try {
            var s = localStorage.getItem("dismissedBanners");
            var arr = s ? JSON.parse(s) : [];
            if (arr.indexOf(bannerId) === -1) arr.push(bannerId);
            localStorage.setItem("dismissedBanners", JSON.stringify(arr));
          } catch (e) {
            _logger.error("Error dismissing banner:", e);
          }
        }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAlertDismiss);
  } else {
    initAlertDismiss();
  }
  setTimeout(initAlertDismiss, 400);
})();
