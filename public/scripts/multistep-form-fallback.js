(function () {
  function loadFormFallback() {
    if (
      !document.querySelector("form[data-form-config]") ||
      window.__multistepFormFallbackLoaded
    )
      return;
    window.__multistepFormFallbackLoaded = true;
    if (window.__jsOrderLog) window.__jsOrderLog("MultiStepForm fallback loader (inline)");
    function injectFormScript() {
      var s = document.createElement("script");
      s.src = "/scripts/init-multistep-form.js";
      s.async = false;
      document.body.appendChild(s);
    }
    function injectTypewriter() {
      var tw = document.createElement("script");
      tw.src = "/scripts/typewriter.js";
      tw.async = true;
      document.body.appendChild(tw);
    }
    injectFormScript();
    injectTypewriter();
    if (!window.__PUBLIC_SUPABASE_URL__ || !window.__PUBLIC_SUPABASE_PUBLISHABLE__) {
      fetch("/api/env/supabase-public")
        .then(function (r) {
          return r.ok ? r.json() : {};
        })
        .then(function (d) {
          if (d && typeof d.url === "string") window.__PUBLIC_SUPABASE_URL__ = d.url;
          if (d && typeof d.key === "string")
            window.__PUBLIC_SUPABASE_PUBLISHABLE__ = d.key;
        })
        .catch(function () {});
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadFormFallback);
  } else {
    loadFormFallback();
  }
})();
