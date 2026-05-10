"use strict";

/**
 * Desktop-first UX: new-tab discipline for navigation (keeps hub tab),
 * optional home hero arrival choreography, MutationObserver for late DOM.
 */
(function () {
  if (window.__vcGlobalUxBooted === true) {
    return;
  }
  window.__vcGlobalUxBooted = true;

  function thinCheckout() {
    try {
      var p = String(window.location.pathname || "").toLowerCase();
      return /checkout-details|payment-confirmation|coach-payment-recovery|top-class-checkout|admin\.html|admin-app|admin-messages|owner-access-kuda/.test(
        p
      );
    } catch {
      return false;
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }

  function mergeRel(a) {
    var r = String(a.getAttribute("rel") || "").trim();
    var parts = {};
    r.split(/\s+/).forEach(function (x) {
      if (x) parts[x] = true;
    });
    parts.noopener = true;
    parts.noreferrer = true;
    a.setAttribute("rel", Object.keys(parts).join(" "));
  }

  function shouldBoostLink(a) {
    if (a.hasAttribute("data-same-tab")) return false;
    if (a.hasAttribute("download")) return false;
    var href = String(a.getAttribute("href") || "").trim();
    if (!href || href.charAt(0) === "#") return false;
    if (/^javascript:/i.test(href)) return false;
    if (/^mailto:/i.test(href) || /^tel:/i.test(href)) return false;
    if (String(a.getAttribute("target") || "").toLowerCase() === "_self") return false;
    try {
      var u = new URL(href, window.location.href);
      if (/^https?:$/i.test(u.protocol) && u.origin !== window.location.origin) {
        return true;
      }
      if (u.origin === window.location.origin) {
        if (/^\/api\//i.test(u.pathname)) return false;
        var cur = new URL(window.location.href);
        if (u.pathname === cur.pathname && String(u.search || "") === String(cur.search || "")) {
          return false;
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  function boostAnchors(root) {
    if (thinCheckout()) return;
    var list = (root && root.querySelectorAll ? root : document).querySelectorAll("a[href]");
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (!shouldBoostLink(a)) continue;
      if (!a.getAttribute("target")) {
        a.setAttribute("target", "_blank");
      }
      mergeRel(a);
    }
  }

  function initMutationObserver() {
    if (thinCheckout() || typeof MutationObserver === "undefined") return;
    var timer = null;
    var obs = new MutationObserver(function () {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        timer = null;
        boostAnchors(document.body);
      }, 140);
    });
    try {
      obs.observe(document.body, { childList: true, subtree: true });
    } catch {
      /* ignore */
    }
  }

  function initHomeArrival() {
    var hero = document.getElementById("scene-top");
    if (!hero) return;
    var root = document.documentElement;
    if (prefersReducedMotion()) {
      root.classList.add("vc-arrival-reduced");
      return;
    }
    try {
      if (!sessionStorage.getItem("vc_arrival_session")) {
        root.classList.add("vc-arrival-first-session");
        sessionStorage.setItem("vc_arrival_session", "1");
      }
    } catch {
      /* ignore */
    }
    root.classList.add("vc-arrival-on");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add("vc-arrival-phase-b");
      });
    });
    window.setTimeout(function () {
      root.classList.add("vc-arrival-settled");
    }, 5200);
  }

  function kick() {
    boostAnchors(document);
    initMutationObserver();
    initHomeArrival();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", kick, { once: true });
  } else {
    kick();
  }
})();
