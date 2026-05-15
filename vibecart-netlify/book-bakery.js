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

  function normalizeMediaPath(url) {
    var s = String(url || "").trim();
    if (!s) return "";
    if (/^\/api\//i.test(s)) return s;
    if (/^https?:\/\//i.test(s)) {
      try {
        var u = new URL(s);
        if (u.pathname.indexOf("/api/public/bakery-media/") === 0) {
          return u.pathname + (u.search || "");
        }
      } catch (_) {
        /* ignore */
      }
    }
    return s;
  }

  function mediaUrlForDisplay(url) {
    var norm = normalizeMediaPath(url);
    if (!norm) return "";
    if (/^https?:\/\//i.test(norm)) return norm;
    try {
      return new URL(norm, location.origin).href;
    } catch (_) {
      return norm.charAt(0) === "/" ? norm : "/" + norm;
    }
  }

  function resolveBrandLogo(s) {
    var logo = normalizeMediaPath(String(s.providerLogoUrl || s.imageUrl || "").trim());
    if (logo) return logo;
    if (Array.isArray(s.gallery)) {
      var i;
      for (i = 0; i < s.gallery.length; i++) {
        var g = s.gallery[i];
        if (g && g.kind === "image" && g.url) {
          var gu = normalizeMediaPath(g.url);
          if (gu) return gu;
        }
      }
    }
    return "";
  }

  function applyPageBackdrop(logoPath) {
    var backdrop = document.getElementById("vcBookBackdrop");
    if (!backdrop) return;
    if (logoPath) {
      var bg = mediaUrlForDisplay(logoPath).replace(/"/g, "%22");
      backdrop.style.backgroundImage = 'url("' + bg + '")';
    } else {
      backdrop.style.backgroundImage = "";
    }
  }

  function renderMediaTile(it) {
    if (!it || !it.url) return "";
    var src = mediaUrlForDisplay(it.url).replace(/"/g, "&quot;");
    if (!src) return "";
    if (String(it.kind || "image") === "video") {
      return (
        '<div class="vc-book-gallery-tile"><video src="' +
        src +
        '" muted playsinline controls preload="metadata"></video></div>'
      );
    }
    return '<div class="vc-book-gallery-tile"><img src="' + src + '" alt="" loading="lazy" decoding="async" /></div>';
  }

  function renderGallery(s) {
    var root = document.getElementById("vcBookGallery");
    if (!root) return;
    var items = Array.isArray(s.gallery) ? s.gallery : [];
    if (!items.length && s.imageUrl) {
      items = [{ kind: "image", url: s.imageUrl }];
    }
    items = items.filter(function (it) {
      return it && it.url;
    });
    if (!items.length) {
      root.innerHTML = "";
      root.hidden = true;
      return;
    }
    var preview = items.slice(0, 2);
    var rest = items.slice(2);
    var html = '<div class="vc-book-gallery-preview">' + preview.map(renderMediaTile).join("") + "</div>";
    if (rest.length) {
      var label = rest.length === 1 ? "View 1 more" : "View " + rest.length + " more";
      html +=
        '<details class="vc-book-gallery-more"><summary>' +
        label +
        "</summary><div class=\"vc-book-gallery-rest\">" +
        rest.map(renderMediaTile).join("") +
        "</div></details>";
    }
    root.innerHTML = html;
    root.hidden = false;
  }

  function run() {
    var params = qs();
    var sid = Number(params.get("sid") || params.get("serviceId") || 0);
    var guestNote = document.getElementById("vcBookGuestNote");
    if (guestNote) guestNote.hidden = false;
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
        var req = document.getElementById("vcBookRequirements");
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
        var brandPath = resolveBrandLogo(s);
        applyPageBackdrop(brandPath);
        if (brandPath) {
          var src = mediaUrlForDisplay(brandPath);
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
        var reqText = String(s.requirementsText || "").trim();
        if (req && reqText) {
          req.hidden = false;
          req.textContent = reqText;
        } else if (req) {
          req.hidden = true;
        }
        renderGallery(s);
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
