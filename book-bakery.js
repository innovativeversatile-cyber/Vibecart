(function () {
  "use strict";

  function apiBase() {
    if (window.VC_API_BASE) return String(window.VC_API_BASE).replace(/\/$/, "");
    try {
      var meta = document.querySelector('meta[name="vibecart-api-base"]');
      var fromMeta = meta && meta.getAttribute("content");
      if (fromMeta && String(fromMeta).trim() && !/^disabled$/i.test(String(fromMeta).trim())) {
        return String(fromMeta).trim().replace(/\/$/, "");
      }
    } catch (_) {
      /* ignore */
    }
    var host = window.location.hostname || "";
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8787";
    }
    if (host && /^https?:$/i.test(String(window.location.protocol || ""))) {
      return String(window.location.origin || "").replace(/\/$/, "");
    }
    return "";
  }

  function qs() {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch (_) {
      return new URLSearchParams();
    }
  }

  function setStatus(msg) {
    var el = document.getElementById("vcBookStatus");
    if (el) el.textContent = msg || "";
  }

  function initials(name) {
    var parts = String(name || "B")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "B";
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }

  function absUrl(path) {
    var s = String(path || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) {
      try {
        var u = new URL(s);
        if (u.pathname.indexOf("/api/public/bakery-media/") === 0) {
          return u.pathname + (u.search || "");
        }
      } catch (_) {
        /* ignore */
      }
      return s;
    }
    if (s.charAt(0) === "/") return s;
    var base = apiBase();
    return base ? base + "/" + s.replace(/^\//, "") : "/" + s.replace(/^\//, "");
  }

  function run() {
    var params = qs();
    var sid = Number(params.get("sid") || params.get("serviceId") || 0);
    if (!sid) {
      setStatus("Missing baker link. Ask your provider to share their booking URL again.");
      return;
    }
    setStatus("Loading…");
    var apiUrl =
      (apiBase() ? apiBase() : "") +
      "/api/public/bakery/book-landing?serviceId=" +
      encodeURIComponent(String(sid));
    fetch(apiUrl)
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error((data && data.message) || "Could not load");
          return data;
        });
      })
      .then(function (data) {
        var s = data.service || {};
        var card = document.getElementById("vcBookCard");
        var title = document.getElementById("vcBookTitle");
        var meta = document.getElementById("vcBookMeta");
        var price = document.getElementById("vcBookPrice");
        var cta = document.getElementById("vcBookCta");
        var logo = document.getElementById("vcBookLogo");
        var logoPh = document.getElementById("vcBookLogoPh");
        var biz = String(s.businessName || "Bakery").trim();
        var work = String(s.workTitle || "Custom cakes").trim();
        if (title) title.textContent = biz;
        if (meta) meta.textContent = work + (s.bakerName ? " · " + s.bakerName : "");
        document.title = "Book " + biz + " · VibeCart";
        var ogT = document.getElementById("vcBookOgTitle");
        var ogD = document.getElementById("vcBookOgDesc");
        var ogI = document.getElementById("vcBookOgImage");
        if (ogT) ogT.setAttribute("content", "Book " + biz + " on VibeCart");
        if (ogD) ogD.setAttribute("content", work);
        var logoUrl = String(s.providerLogoUrl || s.imageUrl || "").trim();
        if (logoUrl) {
          var src = absUrl(logoUrl);
          if (logo) {
            logo.src = src;
            logo.alt = biz + " logo";
            logo.hidden = false;
          }
          if (logoPh) logoPh.hidden = true;
          if (ogI) ogI.setAttribute("content", src);
        } else if (logoPh) {
          logoPh.textContent = initials(biz);
          logoPh.hidden = false;
          if (logo) logo.hidden = true;
        }
        var cur = String(s.currency || "").trim();
        var bp = Number(s.basePrice || 0);
        if (price && bp > 0) {
          price.hidden = false;
          price.textContent = cur ? "From " + bp + " " + cur : "From " + bp;
        } else if (price) {
          price.hidden = true;
        }
        if (cta && s.bookUrl) cta.setAttribute("href", s.bookUrl);
        if (card) card.hidden = false;
        setStatus("");
      })
      .catch(function (err) {
        var msg = String((err && err.message) || "");
        if (/failed to fetch|networkerror|load failed/i.test(msg)) {
          setStatus("Could not reach VibeCart. Check your connection and try again.");
        } else {
          setStatus(msg || "This booking link is not available.");
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
