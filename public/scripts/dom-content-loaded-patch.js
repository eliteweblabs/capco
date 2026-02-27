(function () {
  function runIfAlreadyLoaded(type, listener) {
    if (document.readyState !== "loading") {
      setTimeout(function () {
        if (typeof listener === "function") listener();
        else if (listener && typeof listener.handleEvent === "function")
          listener.handleEvent({ type: type });
      }, 0);
      return true;
    }
    return false;
  }
  var docNative = document.addEventListener.bind(document);
  document.addEventListener = function (type, listener, options) {
    if ((type === "DOMContentLoaded" || type === "load") && runIfAlreadyLoaded(type, listener))
      return;
    docNative(type, listener, options);
  };
  var winNative = window.addEventListener.bind(window);
  window.addEventListener = function (type, listener, options) {
    if ((type === "DOMContentLoaded" || type === "load") && runIfAlreadyLoaded(type, listener))
      return;
    winNative(type, listener, options);
  };
})();
