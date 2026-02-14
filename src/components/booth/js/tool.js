var _____WB$wombat$assign$function_____ = function (name) {
  return (
    (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) ||
    self[name]
  );
};
if (!self.__WB_pmw) {
  self.__WB_pmw = function (obj) {
    this.__WB_source = obj;
    return this;
  };
}
{
  let window = _____WB$wombat$assign$function_____("window");
  let self = _____WB$wombat$assign$function_____("self");
  let document = _____WB$wombat$assign$function_____("document");
  let location = _____WB$wombat$assign$function_____("location");
  let top = _____WB$wombat$assign$function_____("top");
  let parent = _____WB$wombat$assign$function_____("parent");
  let frames = _____WB$wombat$assign$function_____("frames");
  let opener = _____WB$wombat$assign$function_____("opener");

  ("use strict");
  function _asyncToGenerator(e) {
    return function () {
      var t = e.apply(this, arguments);
      return new Promise(function (e, n) {
        return (function o(i, a) {
          try {
            var c = t[i](a),
              r = c.value;
          } catch (e) {
            return void n(e);
          }
          if (!c.done)
            return Promise.resolve(r).then(
              function (e) {
                o("next", e);
              },
              function (e) {
                o("throw", e);
              }
            );
          e(r);
        })("next");
      });
    };
  }
  var Log = new LogClass("App"),
    Analytics = new AnalyticsClass(),
    UI = new UIClass(),
    Commerce = new ECommerce({
      domain: "configurable.myshopify.com",
      storefrontAccessToken: "REPLACE_WITH_YOUR_SHOPIFY_STOREFRONT_TOKEN",
      collection: "Z2lkOi8vc2hvcGlmeS9Db2xsZWN0aW9uLzU0MTA5NDcwNzYz",
    }),
    Assets = new AssetsClass(function (e) {
      return Commerce.loadPaletteItemData();
    }),
    Palette = new PaletteClass($(".palette-items"), Assets, UI),
    Doc = new DocClass($(".ca-tool-workarea")),
    Store = new StoreClass(),
    Cart = new CartClass(Doc),
    $logo = $("h1"),
    $btnCheckout = $("#menu #btn-checkout"),
    $btnHelp = $(".btn-show-help"),
    $btnGridSnapOn = $("#btn-gridsnap-on").hide(),
    $btnGridSnapOff = $("#btn-gridsnap-off"),
    $btnShare = $(".btn-share"),
    $btnOptions = $("#btn-options"),
    $btnZoomIn = $(".btn-zoomin"),
    $btnZoomOut = $(".btn-zoomout"),
    $btnZoomReset = $("#btn-zoomreset").hide(),
    $btnRemoveMobile = $("#btn-remove-mobile").hide(),
    $btnsZoomMobile = $("#zoom-mobile"),
    $btnRemove = $("#btn-remove"),
    $btnRemoveAll = $("#btn-more-delete-all"),
    $menuright = $("#menu-right"),
    $menuwindow = $("#menu-right-window"),
    $loading = $("#loading"),
    $initMessage = $("#initMessage"),
    $txtDimWidth = $("#dim-width"),
    $txtDimHeight = $("#dim-height"),
    $txtDimWidthIn = $("#dim-width-in"),
    $txtDimHeightIn = $("#dim-height-in"),
    $winCheckout = $("#window-checkout"),
    $btnShowPalette = $("#btn-showPalette"),
    App = {
      init: function () {
        (Palette.load().then(function (e) {
          ($loading.fadeOut(), Log.info("Palette loaded. Trying to load model"), App.loadModel());
        }),
          Palette.on(PaletteClass.EVENT_PALETTE_ITEM_CLICK, function (e, t) {
            var n = Doc.getCenterCoord(),
              o = Palette.getItem(t),
              i = ItemClass.NORMALIZE_COORDS(n.x - (20 * o.width) / 2, n.y - (20 * o.height) / 2);
            (Doc.addItem(o, i.x, i.y), e.stopPropagation());
          }));
        var e = {};
        (Palette.on(PaletteClass.EVENT_PALETTE_ITEM_START_DRAG, function (t, n) {
          var o = Doc.getCenterCoord(),
            i = document.body.clientWidth / 2,
            a = document.body.clientHeight / 2,
            c = Palette.getItem(n.itemId),
            r = ItemClass.NORMALIZE_COORDS(n.x + o.x - i, n.y + o.y - a);
          ((e.item = Doc.addItem(c, r.x, r.y)),
            (e.x = e.item.position.x),
            (e.y = e.item.position.y),
            t.stopPropagation(),
            (document.body.style.cursor = "none"));
        }),
          Palette.on(PaletteClass.EVENT_PALETTE_ITEM_END_DRAG, function (t, n) {
            ((e = {}), t.stopPropagation(), (document.body.style.cursor = "inherit"));
          }),
          Palette.on(PaletteClass.EVENT_PALETTE_ITEM_DRAGGING, function (t, n) {
            Doc.getOrigin().scale;
            (e.item
              ? ((e.x += n.x), (e.y += n.y), e.item.moveTo(e.x, e.y, !0))
              : console.error("NO ITEM"),
              t.stopPropagation());
          }),
          $menuwindow.hide().on("click", "button", function () {
            return UI.closeWindow();
          }),
          UI.on(UIClass.EVENT_WINDOW_SHOW, function (e) {
            (Log.debug("on show"), $menuright.hide(), $menuwindow.show());
          }),
          UI.on(UIClass.EVENT_WINDOW_CLOSE, function (e) {
            (Log.debug("on hide"), $menuright.show(), $menuwindow.hide());
          }),
          App.registerKeyboardEvents(),
          $btnOptions.on("click", function () {
            return UI.showWindow("options");
          }),
          $btnHelp.on("click", function () {
            return UI.showWindow("help");
          }),
          $btnShare.on("click", function () {
            var e = UI.showWindow("share");
            (e.find(".js-social-wrapper").remove(),
              e.append($("<div></div>").addClass("js-social-wrapper")),
              e.find(".ca-button").attr("disabled", !0));
            var t = function (t) {
              e.find(".ca-button").attr("disabled", !1);
              var n = (window.location.href + "").split("#")[0].split("?")[0] + "?i=" + t;
              ($("#share-url")
                .off("click")
                .click(function () {
                  (console.log("Copying to clipboard " + n),
                    copyToClipboard(n),
                    UI.showToast("Copied to clipboard", "success"),
                    UI.closeWindow(),
                    Analytics.sendEvent(AnalyticsClass.CATEGORY_SHARE__URL, "url", t));
                }),
                e
                  .find(".js-social-wrapper")
                  .hide()
                  .jsSocials({
                    shares: ["email", "twitter", "facebook"],
                    url: n,
                    text: "",
                  }),
                $("#share-whatsapp").data("wurl", "https://wa.me/?text=" + encodeURI(n)),
                console.log("Url for sharing is " + n));
            };
            App.saveModel()
              .then(t)
              .catch(function (e) {
                window.location.href.indexOf("localhost") > -1
                  ? t("test-localhost")
                  : (console.error(e), UI.showToast("Cannot create link", "error"));
              });
          }),
          $btnCheckout.on("click", function () {
            return UI.showWindow("checkout");
          }),
          $btnShowPalette.on("click", function () {
            return UI.showWindow("palette");
          }),
          UI.on(UIClass.EVENT_WINDOW_WILL_SHOW, function (e, t, n) {
            if ("checkout" == t && n) {
              var o = n.find(".cart-entries").empty();
              Cart.getEntries().forEach(function (e) {
                o.append(
                  $(
                    '<div class="flex-h flex-j-between flex-a-center">\n                        <div class="flex-1">\n                            <img src="' +
                      e.image +
                      '" />\n                        </div>\n                         <p class="flex-1 text-center"> x' +
                      e.quantity +
                      '</p>\n                         <p class="flex-1 text-right">' +
                      e.name +
                      '</p>\n                         <p class="flex-1 text-right m-15">' +
                      toLocale(e.unitPrice * e.quantity) +
                      "€</p>\n                    </div>"
                  )
                );
              });
              var i = Cart.getTotalAmount();
              (n.find("#checkout-total-amount").text(toLocale(i)),
                Log.debug("Creating checkout..."));
              var a = n
                .find(".btn-checkout")
                .attr("disabled", !0)
                .attr("href", null)
                .text("Loading...");
              App.saveModel()
                .catch(function (e) {
                  return (console.error("Cannot generate model", e), "no-model-id");
                })
                .then(function (e) {
                  Cart.getEntries();
                  UI.showToast("got entries?", "alert");
                  // Commerce.getCheckoutUrl(Cart.getEntries()).then(function(t) {
                  //     Log.debug("Checkout url ->" + t),
                  //     a.attr("href", t).attr("target", "_blank").attr("disabled", null).text("CHECKOUT").click(function(n) {
                  //         return Analytics.sendEvent(AnalyticsClass.CATEGORY_CHACKOUT__CHECKOUT, e + "--" + t, i)
                  //     })
                  // }).catch(function(e) {
                  //     UI.showToast("Error generation checkout", "alert")
                  // })
                });
            }
          }),
          $winCheckout.find(".btn-keep-creating").click(function (e) {
            return UI.closeWindow();
          }),
          // $logo.on("click", function (e) {
          //   window.location.href = "#";
          // }),
          Doc.on(DocClass.EVENT_ITEM_ADDED, function (e) {
            $initMessage.hide();
            $btnRemove.show();
          }),
          Doc.on(DocClass.EVENT_AMOUNT_CHANGED, function (e) {
            var t = Cart.getTotalAmount();
            (Log.debug("Amount changed -> " + t),
              $btnCheckout.find(".checkout-amount").text(toLocale(t)),
              t > 0
                ? Store.put(StoreClass.KEY_AMOUNT, t)
                : (Store.remove(StoreClass.KEY_AMOUNT), Store.remove(StoreClass.KEY_SERIALIZED)));
          }),
          Doc.on(DocClass.EVENT_ITEM_FOCUS, function (e, t) {
            ($btnRemove
              .find("span")
              .text(t.paletteItem.name + " " + toLocale(t.paletteItem.price) + "€"),
              UI.isMobile() &&
                $btnRemoveMobile
                  .show()
                  .find("span")
                  .text(t.paletteItem.name + " " + toLocale(t.paletteItem.price) + "€"),
              $btnsZoomMobile.hide());
          }),
          Doc.on(DocClass.EVENT_ITEM_UNFOCUS, function (e) {
            ($btnRemove.find("span").text("Remove all"),
              $btnRemoveMobile.hide(),
              UI.isMobile() && $btnsZoomMobile.show());
          }),
          Doc.on(
            DocClass.EVENT_DIMENSION_CHANGED,
            debounce(function (e) {
              var t = Doc.getRealSize();
              ($txtDimWidth.text(toLocale(t.width)),
                $txtDimHeight.text(toLocale(t.height)),
                $txtDimWidthIn.text(toLocale(0.393701 * t.width)),
                $txtDimHeightIn.text(toLocale(0.393701 * t.height)),
                Store.put(StoreClass.KEY_SERIALIZED, Doc.serialize()));
            }, 100)
          ),
          Doc.on(DocClass.EVENT_ITEM_COLLISIONS, function (e) {
            return UI.showToast("Error! No overlapping", "alert");
          }),
          $btnRemoveMobile.on("click", function () {
            Doc.getFocusedItem() && Doc.remove(Doc.getFocusedItem());
          }),
          $btnRemove.on("click", function () {
            Doc.getFocusedItem()
              ? Doc.remove(Doc.getFocusedItem())
              : UI.confirm("Remove all elements?", "Remove all", "Keep creating").then(
                  function (e) {
                    e && Doc.removeAll();
                    $btnRemove.hide();
                    $btnRemoveAll.hide();
                  }
                );
          }),
          $btnRemoveAll.on("click", function () {
            (UI.closeWindow(),
              UI.confirm("Remove all elements?", "Remove all", "Keep creating").then(function (e) {
                e && Doc.removeAll();
              }));
          }),
          $btnGridSnapOn.on("click", function (e) {
            (Doc.setSnapGrid(!0), $btnGridSnapOn.hide(), $btnGridSnapOff.show());
          }),
          $btnGridSnapOff.on("click", function (e) {
            (Doc.setSnapGrid(!1), $btnGridSnapOn.show(), $btnGridSnapOff.hide());
          }),
          $btnZoomIn.on("click", function (e) {
            return Doc.zoomIn();
          }),
          $btnZoomOut.on("click", function (e) {
            return Doc.zoomOut();
          }),
          $btnZoomReset.on("click", function (e) {
            return Doc.zoomReset();
          }),
          Doc.on(DocClass.EVENT_ZOOM_CHANGED, function (e, t) {
            1 != t ? $btnZoomReset.fadeIn() : $btnZoomReset.fadeOut();
          }),
          $("#share-facebook").click(function () {
            $(".jssocials-share-facebook a")[0].click();
          }),
          $("#share-twitter").click(function () {
            $(".jssocials-share-twitter a")[0].click();
          }),
          $("#share-email").click(function () {
            $(".jssocials-share-email a")[0].click();
          }),
          $("#share-whatsapp").click(function () {
            window.open($(this).data("wurl"));
          }),
          $(".accordion-project-title").click(function () {
            ($(this).parent().find(".accordion-content").slideToggle(),
              $(this).toggleClass("open"));
          }),
          UI.on(UIClass.EVENT_WINDOW_SHOW, function (e, t) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_POPUP__OPEN, t);
          }),
          UI.on(UIClass.EVENT_WINDOW_CLOSE, function (e, t) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_POPUP__CLOSE, t);
          }),
          $("#share-facebook").click(function () {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_SHARE__SOCIAL, "facebook");
          }),
          $("#share-twitter").click(function () {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_SHARE__SOCIAL, "twitter");
          }),
          $("#share-email").click(function () {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_SHARE__SOCIAL, "email");
          }),
          $("#share-whatsapp").click(function () {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_SHARE__SOCIAL, "whatsapp");
          }),
          $btnGridSnapOn.on("click", function (e) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__SNAPGRID, "on");
          }),
          $btnGridSnapOff.on("click", function (e) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__SNAPGRID, "off");
          }),
          $btnZoomIn.on("click", function (e) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__ZOOM_IN);
          }),
          $btnZoomOut.on("click", function (e) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__ZOOM_OUT);
          }),
          $btnZoomReset.on("click", function (e) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__ZOOM_RESTORE);
          }),
          Doc.on(DocClass.EVENT_REMOVE_ALL, function (e) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__REMOVE_ALL);
          }),
          Doc.on(DocClass.EVENT_ITEM_ADDED, function (e, t) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__ADD_ITEM);
          }),
          Doc.on(DocClass.EVENT_ITEM_REMOVED, function (e, t) {
            return Analytics.sendEvent(AnalyticsClass.CATEGORY_TOOL__REMOVE_ITEM);
          }));
      },
    };
  ((App._getDatabaseModel = (function () {
    var e = _asyncToGenerator(
      regeneratorRuntime.mark(function e(t) {
        var n;
        return regeneratorRuntime.wrap(
          function (e) {
            for (;;)
              switch ((e.prev = e.next)) {
                case 0:
                  if (!(window.location.href.indexOf("localhost") > -1)) {
                    e.next = 5;
                    break;
                  }
                  return (
                    Log.info("Local mode. Loading predefined design"),
                    e.abrupt(
                      "return",
                      "o_4_177_1@Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0VmFyaWFudC8xMDY2MzgwODg2MDIwMw==_3_-149_180@Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0VmFyaWFudC8xMDY2MzgwODg2MDIwMw==_1_-153_0@Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0VmFyaWFudC8xMDY2MzgxNDI5OTY5MQ==_1_-163_0@Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0VmFyaWFudC8xMDY2MzgxOTk2ODU1NQ==_-5_-159_90"
                    )
                  );
                case 5:
                  return (
                    Log.info("Fetching design from database"),
                    (e.next = 8),
                    Promise.resolve($.getJSON("/api/save.php?id=" + t))
                  );
                case 8:
                  return ((n = e.sent), e.abrupt("return", n.value));
                case 10:
                case "end":
                  return e.stop();
              }
          },
          e,
          void 0
        );
      })
    );
    return function (t) {
      return e.apply(this, arguments);
    };
  })()),
    (App.saveModel = function () {
      return new Promise(function (e, t) {
        $.ajax({
          url: "/api/save.php",
          async: !0,
          method: "POST",
          data: Doc.serialize(),
        })
          .done(function (t) {
            return e(t);
          })
          .fail(function (n) {
            window.location.href.indexOf("localhost") > -1
              ? e("test-localhost")
              : (console.error(n), t(n));
          });
      });
    }),
    (App._tryLoadFromUrl = _asyncToGenerator(
      regeneratorRuntime.mark(function e() {
        var t, n, o;
        return regeneratorRuntime.wrap(
          function (e) {
            for (;;)
              switch ((e.prev = e.next)) {
                case 0:
                  if (
                    ((t = document.location.hash && Doc.validateSerialize(document.location.hash)),
                    !(n = getUrlParam("i")))
                  ) {
                    e.next = 11;
                    break;
                  }
                  return ((e.next = 5), App._getDatabaseModel(n));
                case 5:
                  return (
                    (o = e.sent),
                    Doc.loadSerialized(o),
                    Analytics.sendEvent(AnalyticsClass.CATEGORY_SHARE__OPEN_URL, void 0, n),
                    e.abrupt("return", !0)
                  );
                case 11:
                  if (!t) {
                    e.next = 15;
                    break;
                  }
                  return ((t = t.replace("#", "")), Doc.loadSerialized(t), e.abrupt("return", !0));
                case 15:
                  return e.abrupt("return", !1);
                case 16:
                case "end":
                  return e.stop();
              }
          },
          e,
          void 0
        );
      })
    )),
    (App.loadModel = _asyncToGenerator(
      regeneratorRuntime.mark(function e() {
        var t;
        return regeneratorRuntime.wrap(
          function (e) {
            for (;;)
              switch ((e.prev = e.next)) {
                case 0:
                  return ((t = !1), (e.prev = 1), (e.next = 4), App._tryLoadFromUrl());
                case 4:
                  ((t = e.sent), Log.debug("Loading model from url : " + t), (e.next = 12));
                  break;
                case 8:
                  ((e.prev = 8),
                    (e.t0 = e.catch(1)),
                    Log.error("Cannot load from URL"),
                    Log.error(e.t0));
                // falls through
                case 12:
                  !t &&
                    Store.has(StoreClass.KEY_SERIALIZED) &&
                    (Log.info("Loading from local store"),
                    Doc.loadSerialized(Store.get(StoreClass.KEY_SERIALIZED)));
                // falls through
                case 13:
                case "end":
                  return e.stop();
              }
          },
          e,
          void 0,
          [[1, 8]]
        );
      })
    )),
    (App.registerKeyboardEvents = function () {
      $(document.body).on("keyup", function (e) {
        var t = e.keyCode;
        27 == t && (UI.closeWindow(), Doc.focus());
        var n = Doc.getFocusedItem();
        if (n)
          if (37 == t) n.move(-1, 0);
          else if (38 == t) n.move(0, -1);
          else if (39 == t) n.move(1, 0);
          else if (40 == t) n.move(0, 1);
          else if (46 == t || 8 == t) Doc.remove(n);
          else if (82 == t) n.rotate(1);
          else if (68 == t) {
            var o = ItemClass.NORMALIZE_COORDS(n.position.x, n.position.y + n.getHeight());
            Doc.addItem(n.paletteItem, o.x, o.y, n.rotation);
          }
      });
    }),
    App.init());
}
/*
     FILE ARCHIVED ON 10:08:01 Apr 09, 2019 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 14:32:43 May 02, 2025.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.518
  exclusion.robots: 0.029
  exclusion.robots.policy: 0.022
  esindex: 0.01
  cdx.remote: 129.012
  LoadShardBlock: 194.712 (3)
  PetaboxLoader3.datanode: 104.621 (4)
  PetaboxLoader3.resolve: 290.42 (2)
  load_resource: 287.041
*/
