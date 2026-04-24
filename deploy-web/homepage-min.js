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

  function initCategoryFilter() {
    var filter = document.getElementById("categoryFilter");
    if (!filter) return;
    var products = Array.prototype.slice.call(document.querySelectorAll("#products .product[data-category]"));
    if (!products.length) return;
    function applyCategory(value) {
      var chosen = String(value || "All").trim();
      products.forEach(function (item) {
        var cat = String(item.getAttribute("data-category") || "").trim();
        item.style.display = chosen === "All" || cat === chosen ? "block" : "none";
      });
    }
    filter.addEventListener("change", function () {
      applyCategory(filter.value);
    });
    applyCategory(filter.value || "All");
  }

  function initCategoryCards() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var filter = document.getElementById("categoryFilter");
    if (!cards.length || !filter) return;
    cards.forEach(function (card) {
      card.addEventListener("click", function (event) {
        var chosen = String(card.getAttribute("data-filter") || "All").trim();
        if (!chosen) return;
        event.preventDefault();
        filter.value = chosen;
        var changeEvt;
        try {
          changeEvt = new Event("change", { bubbles: true });
        } catch {
          changeEvt = document.createEvent("Event");
          changeEvt.initEvent("change", true, true);
        }
        filter.dispatchEvent(changeEvt);
        cards.forEach(function (item) {
          var on = item === card;
          item.classList.toggle("vc-cat-selected", on);
          item.setAttribute("aria-current", on ? "true" : "false");
        });
        var market = document.getElementById("market");
        if (market) {
          market.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function initBridgePathToggle() {
    var switchWrap = document.getElementById("bridgePathSwitch");
    var status = document.getElementById("bridgePathStatus");
    if (!switchWrap || !status) return;
    var buttons = Array.prototype.slice.call(switchWrap.querySelectorAll("[data-bridge-path]"));
    if (!buttons.length) return;

    function labelFor(path) {
      return path === "from-africa" ? "From Africa to Europe" : "From Europe to Africa";
    }

    function apply(path) {
      var active = path === "from-africa" ? "from-africa" : "from-europe";
      buttons.forEach(function (btn) {
        var on = String(btn.getAttribute("data-bridge-path") || "") === active;
        btn.classList.toggle("btn-primary", on);
        btn.classList.toggle("btn-secondary", !on);
      });
      status.textContent = "Current route: " + labelFor(active) + ".";
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(String(btn.getAttribute("data-bridge-path") || "from-europe"));
      });
    });

    var initial = "from-europe";
    for (var i = 0; i < buttons.length; i += 1) {
      if (buttons[i].classList.contains("btn-primary")) {
        initial = String(buttons[i].getAttribute("data-bridge-path") || "from-europe");
        break;
      }
    }
    apply(initial);
  }

  function boot() {
    initHashLinks();
    initOpenShopStatus();
    initCategoryFilter();
    initCategoryCards();
    initBridgePathToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

