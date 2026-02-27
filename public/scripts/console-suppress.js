(function () {
  var v = document.documentElement.getAttribute("data-suppress-console-noise") === "1";
  if (v) {
    (function () {
      const ow = console.warn,
        oe = console.error,
        ol = console.log;
      const skip = function (s) {
        return (
          !s ||
          s.includes("_cf_bm") ||
          s.includes("__cf_bm") ||
          (s.includes("Cookie") && s.includes("rejected")) ||
          s.includes("invalid domain") ||
          s.includes("NS_BINDING_ABORTED") ||
          s.includes("Avatar failed to load") ||
          s.includes("rate limit")
        );
      };
      console.warn = function () {
        if (skip([].join.call(arguments, " "))) return;
        ow.apply(console, arguments);
      };
      console.error = function () {
        if (skip([].join.call(arguments, " "))) return;
        oe.apply(console, arguments);
      };
      console.log = function () {
        var s = [].join.call(arguments, " ");
        if (
          s &&
          (s.includes("NS_BINDING_ABORTED") ||
            s.includes("net::ERR_") ||
            s.includes("_cf_bm") ||
            s.includes("__cf_bm"))
        )
          return;
        ol.apply(console, arguments);
      };
    })();
  }
})();
