/* Public page-view beacon → POST /api/public/analytics/visit (same-origin or meta vibecart-api-base). */
(function () {
  try {
    if (typeof window === "undefined" || window.__vcAnalyticsVisitBeacon === "1") {
      return;
    }

    function apiOrigin() {
      try {
        var el = document.querySelector('meta[name="vibecart-api-base"]');
        var raw = el && el.getAttribute("content");
        var s = String(raw || "").trim();
        if (s && !/^disabled$/i.test(s)) {
          return s.replace(/\/$/, "");
        }
      } catch (e) {
        /* ignore */
      }
      try {
        if (window.location && /^https?:$/i.test(String(window.location.protocol || ""))) {
          return String(window.location.origin || "").replace(/\/$/, "");
        }
      } catch (e2) {
        /* ignore */
      }
      return "";
    }

    function visitUrl() {
      var o = apiOrigin();
      if (!o) {
        return "";
      }
      return o + "/api/public/analytics/visit";
    }

    function jsonBody() {
      return JSON.stringify({
        path: String(window.location.pathname || "/") + String(window.location.search || ""),
        referrer: String(document.referrer || "").slice(0, 512)
      });
    }

    function dedupeKey() {
      return "vc_av1:" + String(window.location.href || "").slice(0, 220);
    }

    function shouldSkip() {
      try {
        var k = dedupeKey();
        var now = Date.now();
        var prev = sessionStorage.getItem(k);
        if (prev && now - Number(prev) < 4000) {
          return true;
        }
        sessionStorage.setItem(k, String(now));
      } catch (e) {
        /* ignore */
      }
      return false;
    }

    function send() {
      if (shouldSkip()) {
        return;
      }
      var url = visitUrl();
      if (!url) {
        return;
      }
      window.__vcAnalyticsVisitBeacon = "1";
      var body = jsonBody();
      try {
        if (navigator.sendBeacon) {
          var blob = new Blob([body], { type: "application/json" });
          if (navigator.sendBeacon(url, blob)) {
            return;
          }
        }
      } catch (e) {
        /* fall through to fetch */
      }
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
        credentials: "omit"
      }).catch(function () {});
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", send, { once: true });
    } else {
      send();
    }
  } catch (e) {
    /* ignore */
  }
})();
