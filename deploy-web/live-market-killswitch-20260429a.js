(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function bindSmartTour() {
    var openBtn = byId("openOnboarding");
    var modal = byId("onboardingModal");
    var text = byId("onboardingText");
    var nextBtn = byId("onboardingNext");
    var closeBtn = byId("onboardingClose");
    if (!openBtn || !modal || !text || !nextBtn || !closeBtn) return;
    if (openBtn.getAttribute("data-vc-market-tour") === "1") return;
    openBtn.setAttribute("data-vc-market-tour", "1");
    var steps = [
      "Welcome. This quick tour helps you find top live promotions fast.",
      "Step 1: Select your market region first to see local and cross-border offers.",
      "Step 2: Use Fashion/Electronics tabs, then open trusted promo lanes.",
      "Step 3: Compare at least 2 shops before checkout for best value."
    ];
    var idx = 0;
    function render() {
      text.textContent = steps[idx] || steps[0];
      nextBtn.textContent = idx >= steps.length - 1 ? "Finish" : "Next";
    }
    function openModal() {
      idx = 0;
      render();
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    }
    function closeModal() {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }
    openBtn.addEventListener("click", function (event) {
      event.preventDefault();
      openModal();
    }, true);
    nextBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (idx < steps.length - 1) {
        idx += 1;
        render();
      } else {
        closeModal();
      }
    }, true);
    closeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      closeModal();
    }, true);
  }

  function ensureFashionPromos() {
    var promoGrid = byId("livePromoGrid");
    var shopGrid = byId("liveMarketShopGrid");
    if (!promoGrid || !shopGrid) return;

    var critical = [
      { name: "SHEIN", promoUrl: "https://www.shein.com/" },
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
      a.href = "/api/public/shop/redirect?to=" + encodeURIComponent(shop.promoUrl) + "&src=killswitch-market-fallback";
      a.innerHTML = "<h3>" + shop.name + " deals</h3><p>Kill-switch fallback promo lane.</p>";
      promoGrid.appendChild(a);

      var card = document.createElement("article");
      card.className = "shop-bubble";
      card.innerHTML =
        "<h3>" + shop.name + "</h3>" +
        "<p>Kill-switch fallback listing to guarantee frequent-shop visibility.</p>" +
        "<p><a class='btn btn-primary' target='_blank' rel='noopener noreferrer' href='" + a.href + "'>Open shop</a></p>";
      shopGrid.appendChild(card);
    });
  }

  function bindHardPassMarketCinematic() {
    if (document.body.getAttribute("data-vc-hardpass-market-cinematic") === "1") return;
    document.body.setAttribute("data-vc-hardpass-market-cinematic", "1");
    var prefersReduced = false;
    try {
      prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;
    } catch (e) { prefersReduced = false; }
    if (prefersReduced) return;
    document.addEventListener("click", function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest("a.promo-card, .shop") : null;
      if (!anchor) return;
      anchor.classList.add("vc-cinematic-pulse");
      window.setTimeout(function () {
        anchor.classList.remove("vc-cinematic-pulse");
      }, 700);
    }, true);
  }

  function bindHardPassMarketLinkSafety() {
    if (document.body.getAttribute("data-vc-hardpass-market-link") === "1") return;
    document.body.setAttribute("data-vc-hardpass-market-link", "1");
    document.addEventListener("click", function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest("a[href^='http']") : null;
      if (!anchor || !anchor.href) return;
      try {
        var u = new URL(anchor.href, window.location.href);
        if (u.origin === window.location.origin) return;
      } catch (e) { return; }
      if (!anchor.target) anchor.target = "_blank";
      var rel = String(anchor.rel || "");
      if (!/noopener/.test(rel)) anchor.rel = (rel ? rel + " " : "") + "noopener noreferrer";
    }, true);
  }

  function boot() {
    bindSmartTour();
    ensureFashionPromos();
    window.setTimeout(ensureFashionPromos, 500);
    window.setTimeout(ensureFashionPromos, 1500);
    bindHardPassMarketCinematic();
    bindHardPassMarketLinkSafety();
    document.body && document.body.setAttribute("data-vc-market-emergency", "killswitch-20260429a");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
