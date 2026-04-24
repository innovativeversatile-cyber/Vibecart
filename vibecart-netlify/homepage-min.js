"use strict";

(function () {
  function safeScrollToHash(hash) {
    if (!hash || hash.length < 2) return;
    var id = String(hash).replace(/^#/, "").trim();
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initHashLinks() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest("a[href^='#']") : null;
      if (!anchor) return;
      var href = String(anchor.getAttribute("href") || "").trim();
      if (!href || href === "#") return;
      event.preventDefault();
      safeScrollToHash(href);
    });
  }

  function initOpenShopStatus() {
    var status = document.getElementById("expressCheckoutStatus");
    if (!status) return;
    document.addEventListener("click", function (event) {
      var target = event.target;
      var link = target && target.closest ? target.closest("a.btn.btn-primary[href*='/api/public/shop/redirect']") : null;
      if (!link) return;
      status.textContent = "Opening partner shop...";
    });
  }

  function boot() {
    initHashLinks();
    initOpenShopStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

