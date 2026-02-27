(function () {
  var DONE_ATTR = "data-typewriter-done";

  function runSimpleTypewriter(el, options) {
    var text = el.getAttribute("data-text");
    if (!text || el.hasAttribute(DONE_ATTR)) return;
    el.setAttribute(DONE_ATTR, "true");
    el.textContent = "";
    var opts = options || {};
    var speed = opts.speed != null ? opts.speed : 60;
    var doneClass = opts.doneClass || "typewriter-complete";
    var dispatchEvent = opts.dispatchEvent === true;

    function type(i) {
      if (i < text.length) {
        el.textContent += text[i];
        setTimeout(function () {
          type(i + 1);
        }, speed);
      } else {
        el.classList.add(doneClass);
        if (dispatchEvent) {
          el.dispatchEvent(new CustomEvent("typewriter-complete", { bubbles: true }));
        }
      }
    }
    type(0);
  }

  function runSimpleTypewriterOnSelector(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      runSimpleTypewriter(el);
    });
  }

  window.runSimpleTypewriter = runSimpleTypewriter;
  window.runSimpleTypewriterOnSelector = runSimpleTypewriterOnSelector;

  function initLoadingTypewriters() {
    runSimpleTypewriterOnSelector("[data-loading-typewriter]");
  }
  document.addEventListener("DOMContentLoaded", initLoadingTypewriters);
  if (document.readyState === "complete" || document.readyState === "interactive") {
    initLoadingTypewriters();
  }
})();
