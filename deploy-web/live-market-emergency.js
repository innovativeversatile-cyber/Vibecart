(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function ensureFashionPromos() {
    var promoGrid = byId("livePromoGrid");
    var shopGrid = byId("liveMarketShopGrid");
    if (!promoGrid || !shopGrid) return;

    var critical = [
      { name: "SHEIN", promoUrl: "https://www.shein.com/campaigns/sale" },
      { name: "Zara", promoUrl: "https://www.zara.com/ww/en/sale-l1180.html" },
      { name: "H&M", promoUrl: "https://www2.hm.com/en_gb/sale.html" },
      { name: "Notino", promoUrl: "https://www.notino.com/sale/" }
    ];

    var text = (promoGrid.textContent || " ").toLowerCase() + " " + (shopGrid.textContent || " ").toLowerCase();
    critical.forEach(function (shop) {
      if (text.indexOf(shop.name.toLowerCase()) >= 0) return;
      var a = document.createElement("a");
      a.className = "promo-card";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.href = "/api/public/shop/redirect?to=" + encodeURIComponent(shop.promoUrl) + "&src=emergency-market-fallback";
      a.innerHTML = "<h3>" + shop.name + " deals</h3><p>Emergency fallback promo lane.</p>";
      promoGrid.appendChild(a);

      var card = document.createElement("article");
      card.className = "shop-bubble";
      card.innerHTML =
        "<h3>" + shop.name + "</h3>" +
        "<p>Emergency fallback listing to guarantee frequent-shop visibility.</p>" +
        "<p><a class='btn btn-primary' target='_blank' rel='noopener noreferrer' href='" + a.href + "'>Open shop</a></p>";
      shopGrid.appendChild(card);
    });
  }

  function boot() {
    ensureFashionPromos();
    window.setTimeout(ensureFashionPromos, 500);
    window.setTimeout(ensureFashionPromos, 1500);
    document.body && document.body.setAttribute("data-vc-market-emergency", "1");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
