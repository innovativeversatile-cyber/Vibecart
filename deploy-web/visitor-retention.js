/* Keeps visitors oriented: end-of-page next steps, optional "continue live market" from last session, link intent capture. */
(function () {
  "use strict";

  var STORAGE_LAST = "vc-retention-live-market";
  var STORAGE_TS = "vc-retention-live-market-ts";
  var MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  var hooksBound = false;

  function thinFlowPage() {
    var p = String(window.location.pathname || "").toLowerCase();
    return /checkout-details|payment-confirmation|coach-payment-recovery|top-class-checkout|admin\.html|admin-app|admin-messages|owner-access-kuda/.test(
      p
    );
  }

  function isShopsLane() {
    return document.body && document.body.classList.contains("shops-lane-page");
  }

  function isHomeLayout() {
    return (
      document.body &&
      (document.body.classList.contains("vc-layout-exclusive") ||
        document.body.classList.contains("vc-premium-unified"))
    );
  }

  function shouldRun() {
    if (!document.body) return false;
    if (thinFlowPage()) return false;
    return isShopsLane() || isHomeLayout();
  }

  function escAttr(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function recordLiveMarketContext() {
    var p = String(window.location.pathname || "").toLowerCase();
    if (p.indexOf("live-market-shops") === -1) return;
    try {
      var u = new URL(window.location.href);
      var cat = (u.searchParams.get("cat") || "All").slice(0, 48);
      var qs = u.search || "";
      if (!qs) qs = "?cat=All&view=global&deal=best";
      var href = "./live-market-shops.html" + qs;
      var label = cat === "All" ? "All shops" : cat;
      window.sessionStorage.setItem(STORAGE_LAST, JSON.stringify({ href: href, label: label }));
      window.sessionStorage.setItem(STORAGE_TS, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  function readContinue() {
    try {
      var t = Number(window.sessionStorage.getItem(STORAGE_TS) || 0);
      if (!t || Date.now() - t > MAX_AGE_MS) return null;
      var raw = window.sessionStorage.getItem(STORAGE_LAST);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.href) return null;
      return { href: String(o.href), label: String(o.label || "Live market").slice(0, 48) };
    } catch {
      return null;
    }
  }

  function getMainEl() {
    return document.querySelector("main.shops-lane-main") || document.querySelector("main");
  }

  function mountStayBlock() {
    if (document.getElementById("vcStayOnVibeCart")) return;
    var main = getMainEl();
    if (!main) return;
    var cont = readContinue();
    var continueHtml = "";
    if (cont) {
      continueHtml =
        '<p class="hero-actions vc-stay-next__continue" style="margin-top:0.65rem">' +
        '<a class="btn btn-primary" href="' +
        escAttr(cont.href) +
        '">Continue: ' +
        escAttr(cont.label) +
        "</a></p>";
    }
    var sec = document.createElement("section");
    sec.id = "vcStayOnVibeCart";
    /* After </main>: avoids lane main stacking/overflow and mobile per-section transforms hiding the block. */
    sec.className = "section alt vc-stay-next vc-stay-next--after-main";
    sec.setAttribute("aria-labelledby", "vcStayNextTitle");
    sec.innerHTML =
      '<h2 id="vcStayNextTitle" class="shops-lane-title" style="font-size:1.05rem">Where to next on VibeCart</h2>' +
      '<p class="note vc-retention-tip">Keep this tab as HQ — internal VibeCart links and partner shops open in new tabs so you can return here for orders, search, and account.</p>' +
      '<div class="hero-actions vc-stay-next__actions" style="flex-wrap:wrap;gap:0.45rem;margin-top:0.5rem">' +
      '<a class="btn btn-primary" href="./live-market-shops.html?cat=All&amp;view=global&amp;deal=best">Live market</a>' +
      '<a class="btn btn-secondary" href="./global-search.html">Search</a>' +
      '<a class="btn btn-secondary" href="./orders-tracking.html">Orders</a>' +
      '<a class="btn btn-secondary" href="./browse-categories.html">Categories</a>' +
      '<a class="btn btn-secondary" href="./account-hub.html">Account</a>' +
      "</div>" +
      continueHtml;
    try {
      main.insertAdjacentElement("afterend", sec);
    } catch {
      main.appendChild(sec);
    }
    try {
      document.body.classList.add("vc-retention-on");
    } catch {
      /* ignore */
    }
  }

  function bindLiveMarketLinkClicksOnce() {
    if (hooksBound) return;
    hooksBound = true;
    document.addEventListener(
      "click",
      function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
        if (!a) return;
        var h = String(a.getAttribute("href") || "");
        if (h.indexOf("live-market-shops") === -1) return;
        try {
          var abs = new URL(h, window.location.href);
          var cat = abs.searchParams.get("cat") || "All";
          var qs = abs.search || "?cat=All&view=global&deal=best";
          var href = "./live-market-shops.html" + qs;
          window.sessionStorage.setItem(
            STORAGE_LAST,
            JSON.stringify({ href: href, label: cat === "All" ? "All shops" : cat.slice(0, 48) })
          );
          window.sessionStorage.setItem(STORAGE_TS, String(Date.now()));
        } catch {
          /* ignore */
        }
      },
      true
    );
  }

  function maybeIntroTip() {
    if (!isShopsLane()) return;
    var main = getMainEl();
    if (!main || main.querySelector(".vc-retention-inline-tip")) return;
    if (main.querySelectorAll("p.note").length > 2) return;
    var intro = main.querySelector(".shops-lane-intro");
    var h1 = main.querySelector("h1.shops-lane-title");
    var anchor = intro || h1;
    if (!anchor) return;
    var tip = document.createElement("p");
    tip.className = "note vc-retention-inline-tip";
    tip.textContent =
      "Tip: use Where to next at the bottom for live market, search, and orders so you keep this tab open.";
    anchor.insertAdjacentElement("afterend", tip);
  }

  function run() {
    if (!shouldRun()) return;
    recordLiveMarketContext();
    bindLiveMarketLinkClicksOnce();
    maybeIntroTip();
    mountStayBlock();
  }

  function kick() {
    run();
    window.requestAnimationFrame(function () {
      run();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", kick, { once: true });
  } else {
    kick();
  }
  window.addEventListener("load", run, { once: true });
})();

(function scheduleVcGlobalUx() {
  if (typeof window === "undefined" || window.__vcGlobalUxScheduled === "1") {
    return;
  }
  window.__vcGlobalUxScheduled = "1";
  function thinFlow() {
    try {
      var p = String(window.location.pathname || "").toLowerCase();
      return /checkout-details|payment-confirmation|coach-payment-recovery|top-class-checkout|admin\.html|admin-app|admin-messages|owner-access-kuda/.test(
        p
      );
    } catch {
      return false;
    }
  }
  function inject() {
    if (thinFlow()) return;
    if (document.querySelector('script[src*="vc-global-ux.js"]')) return;
    var s = document.createElement("script");
    s.src = "./vc-global-ux.js?v=20260510ux1";
    s.defer = true;
    (document.head || document.documentElement).appendChild(s);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  } else {
    inject();
  }
})();
