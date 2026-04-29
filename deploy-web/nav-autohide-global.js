"use strict";

(function () {
  var nav = document.getElementById("siteTopbar") || document.querySelector(".topbar") || document.querySelector(".shops-lane-topbar");
  if (!nav) return;
  if (nav.getAttribute("data-vc-nav-autohide-bound") === "1") return;
  nav.setAttribute("data-vc-nav-autohide-bound", "1");

  var lastY = Math.max(0, Math.round(window.scrollY || 0));
  var hidden = false;
  var ticking = false;
  var pendingY = lastY;

  function prefersReducedMotion() {
    try {
      return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      return false;
    }
  }

  function getTune() {
    var width = Number(window.innerWidth || 0);
    if (width <= 520) return { enabled: true, threshold: 16, minHideStart: 56 };
    if (width <= 820) return { enabled: true, threshold: 20, minHideStart: 72 };
    if (width <= 1024) return { enabled: true, threshold: 24, minHideStart: 92 };
    return { enabled: false, threshold: 999, minHideStart: 999 };
  }

  function setHidden(next) {
    if (hidden === next) return;
    hidden = next;
    nav.classList.toggle("vc-nav-hidden", hidden);
    nav.setAttribute("data-vc-nav-state", hidden ? "hidden" : "visible");
  }

  function shouldKeepVisibleByFocus() {
    var active = document.activeElement;
    if (!active) return false;
    var tag = String(active.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || active.isContentEditable === true;
  }

  function handleScroll(y) {
    var tune = getTune();
    var delta = y - lastY;
    if (!tune.enabled || prefersReducedMotion() || shouldKeepVisibleByFocus()) {
      setHidden(false);
      lastY = y;
      return;
    }
    if (y <= tune.minHideStart) {
      setHidden(false);
      lastY = y;
      return;
    }
    if (delta > tune.threshold) {
      setHidden(true);
    } else if (delta < -tune.threshold) {
      setHidden(false);
    }
    lastY = y;
  }

  window.addEventListener(
    "scroll",
    function () {
      pendingY = Math.max(0, Math.round(window.scrollY || 0));
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        handleScroll(pendingY);
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", function () {
    var tune = getTune();
    if (!tune.enabled || prefersReducedMotion()) {
      setHidden(false);
    }
    lastY = Math.max(0, Math.round(window.scrollY || 0));
  });
})();
