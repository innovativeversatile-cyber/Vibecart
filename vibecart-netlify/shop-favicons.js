(function () {
  var FALLBACK_ICON =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'>" +
        "<rect x='1' y='2' width='12' height='11' rx='2' fill='%23241732' stroke='%23e8a317' stroke-width='1'/>" +
        "<path d='M4 5.5h6M4 8h6M4 10.5h4' stroke='%23f5e6c6' stroke-width='1' stroke-linecap='round'/>" +
      "</svg>"
    );

  function externalOriginFromShopHref(href) {
    var h = String(href || "").trim();
    if (!h) {
      return "";
    }
    try {
      if (/^https?:\/\//i.test(h)) {
        return new URL(h).origin;
      }
      var base = typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "https://vibe-cart.com";
      var u = new URL(h, base);
      if (String(u.pathname || "").indexOf("/api/public/shop/redirect") >= 0) {
        var t = u.searchParams.get("target");
        if (t) {
          return new URL(t).origin;
        }
      }
    } catch {
      return "";
    }
    return "";
  }

  function addShopFavicons() {
    var cards = document.querySelectorAll(".shop-bubble-grid a.shop");
    cards.forEach(function (card) {
      if (card.querySelector(".shop-logo")) {
        return;
      }
      var h3 = card.querySelector("h3");
      if (!h3 || h3.querySelector(".shop-favicon")) {
        return;
      }
      var href = String(card.getAttribute("href") || "").trim();
      if (!href || href === "#") {
        return;
      }
      var origin = externalOriginFromShopHref(href);
      if (!origin) {
        return;
      }
      var img = document.createElement("img");
      img.className = "shop-favicon";
      img.width = 14;
      img.height = 14;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.src = origin + "/favicon.ico";
      img.addEventListener("error", function onError() {
        img.removeEventListener("error", onError);
        img.src = FALLBACK_ICON;
      });
      h3.prepend(img);
    });
  }

  window.vibeCartRefreshShopFavicons = addShopFavicons;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addShopFavicons, { once: true });
  } else {
    addShopFavicons();
  }
})();
