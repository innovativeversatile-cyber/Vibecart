/* Loads vibecart-ai-client + mobile-app-shell and boots Brandon on any public page. */
(function (global) {
  "use strict";

  var SHELL = "./mobile-app-shell.js?v=20260513brandon2";
  var CLIENT = "./vibecart-ai-client.js?v=20260513brandon2";

  function skipBrandonPage() {
    if (!document.body) return true;
    if (document.body.classList.contains("vc-no-brandon")) return true;
    if (document.body.classList.contains("admin-surface")) return true;
    var p = String((global.location && global.location.pathname) || "").toLowerCase();
    if (p.indexOf("admin-app") >= 0 || p.indexOf("admin.html") >= 0 || p.indexOf("admin-messages") >= 0) {
      return true;
    }
    if (p.indexOf("owner-access-kuda") >= 0) return true;
    if (
      p.indexOf("checkout-details") >= 0 ||
      p.indexOf("payment-confirmation") >= 0 ||
      p.indexOf("top-class-checkout") >= 0
    ) {
      return true;
    }
    return false;
  }

  function loadScript(src, onload) {
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    if (onload) s.onload = onload;
    (document.body || document.head || document.documentElement).appendChild(s);
  }

  function hasScript(fragment) {
    return Boolean(document.querySelector('script[src*="' + fragment + '"]'));
  }

  function bootBrandon() {
    if (typeof global.vibeCartBootBrandonUniversal === "function") {
      global.vibeCartBootBrandonUniversal();
    }
  }

  function waitFor(fn, maxTries, cb) {
    var n = 0;
    (function tick() {
      n += 1;
      if (fn()) {
        cb(true);
        return;
      }
      if (n >= maxTries) {
        cb(false);
        return;
      }
      global.setTimeout(tick, 100);
    })();
  }

  function ensureShell(cb) {
    if (document.getElementById("vc-mobile-ai") || typeof global.vibeCartBootBrandonUniversal === "function") {
      cb();
      return;
    }
    if (hasScript("mobile-app-shell")) {
      waitFor(function () {
        return typeof global.vibeCartBootBrandonUniversal === "function" || document.getElementById("vc-mobile-ai");
      }, 80, cb);
      return;
    }
    loadScript(SHELL, cb);
  }

  function ensureClient(cb) {
    if (typeof global.vibecartAiGenerate === "function") {
      cb(true);
      return;
    }
    if (hasScript("vibecart-ai-client")) {
      waitFor(function () {
        return typeof global.vibecartAiGenerate === "function";
      }, 80, cb);
      return;
    }
    loadScript(CLIENT, function () {
      waitFor(function () {
        return typeof global.vibecartAiGenerate === "function";
      }, 80, cb);
    });
  }

  function vcBootstrapBrandon() {
    if (skipBrandonPage()) return;
    ensureClient(function () {
      ensureShell(bootBrandon);
    });
  }

  global.vcBootstrapBrandon = vcBootstrapBrandon;

  if (global.__vcBrandonUniversalScheduled !== "1") {
    global.__vcBrandonUniversalScheduled = "1";
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", vcBootstrapBrandon, { once: true });
    } else {
      vcBootstrapBrandon();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
