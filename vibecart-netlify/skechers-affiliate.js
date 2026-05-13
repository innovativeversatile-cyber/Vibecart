(function () {
  "use strict";

  var JSON_URL = "./skechers-affiliate.json?v=20260513sk1";
  var AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
  var AUTO_MS = 5500;

  function trackClick(item) {
    try {
      localStorage.setItem(
        AFFILIATE_LAST_CLICK_KEY,
        JSON.stringify({
          at: new Date().toISOString(),
          source: "skechers-affiliate",
          linkId: "16958906",
          label: String((item && item.label) || "Skechers"),
          target: String((item && item.href) || "")
        })
      );
    } catch {
      /* ignore */
    }
  }

  function renderDisclosure(root, cfg) {
    var el = document.getElementById("vcSkechersDisclosure");
    if (!el || !cfg || !cfg.disclosure) {
      return;
    }
    var d = cfg.disclosure;
    el.innerHTML = "";
    if (d.short) {
      var p1 = document.createElement("p");
      p1.className = "note";
      p1.textContent = String(d.short);
      el.appendChild(p1);
    }
    if (d.policyPreamble && d.policyHref && d.policyLinkLabel) {
      var p2 = document.createElement("p");
      p2.className = "note";
      p2.appendChild(document.createTextNode(String(d.policyPreamble) + " "));
      var a = document.createElement("a");
      a.href = d.policyHref;
      a.textContent = d.policyLinkLabel;
      p2.appendChild(a);
      p2.appendChild(document.createTextNode("."));
      el.appendChild(p2);
    }
    if (cfg.contextLine) {
      var p3 = document.createElement("p");
      p3.className = "note";
      p3.textContent = String(cfg.contextLine);
      el.appendChild(p3);
    }
  }

  function paintHero(slides, idx) {
    var visual = document.getElementById("vcSkechersHeroVisual");
    var title = document.getElementById("vcSkechersHeroTitle");
    var line = document.getElementById("vcSkechersHeroLine");
    var badge = document.getElementById("vcSkechersHeroBadge");
    var cta = document.getElementById("vcSkechersHeroCta");
    var dots = document.getElementById("vcSkechersHeroDots");
    if (!visual || !slides.length) {
      return null;
    }
    var active = (idx + slides.length) % slides.length;
    var s = slides[active];
    visual.style.backgroundImage = "url('" + String(s.imageUrl).replace(/'/g, "%27") + "')";
    if (title) {
      title.textContent = s.label;
    }
    if (line) {
      line.textContent = (s.tagline || "") + (s.color ? " · " + s.color : "");
    }
    if (badge) {
      badge.textContent = s.badge || "SKECHERS";
    }
    if (cta) {
      cta.href = s.href;
      cta.onclick = function () {
        trackClick(s);
      };
    }
    if (dots) {
      dots.innerHTML = "";
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "vc-fashion-hero-dot" + (i === active ? " is-active" : "");
        b.setAttribute("aria-label", "Show product " + (i + 1));
        b.addEventListener("click", function () {
          if (typeof window.__vcSkechersGo === "function") {
            window.__vcSkechersGo(i, true);
          }
        });
        dots.appendChild(b);
      });
    }
    return active;
  }

  function renderGrid(items) {
    var grid = document.getElementById("vcSkechersProductGrid");
    if (!grid) {
      return;
    }
    grid.innerHTML = "";
    items.forEach(function (item, index) {
      var card = document.createElement("article");
      card.className = "vc-skechers-product-card";
      card.innerHTML =
        '<span class="vc-skechers-product-card__index">' +
        String(index + 1) +
        "</span>" +
        '<img src="' +
        item.imageUrl +
        '" alt="' +
        item.label.replace(/"/g, "&quot;") +
        '" loading="lazy" decoding="async" />' +
        '<div class="vc-skechers-product-card__body">' +
        '<p class="vc-skechers-product-card__badge">' +
        (item.badge || "SKECHERS") +
        "</p>" +
        "<h3>" +
        item.label +
        "</h3>" +
        '<p class="note">' +
        (item.tagline || "") +
        "</p>" +
        '<p class="vc-skechers-product-card__sku">' +
        (item.sku || "") +
        " · " +
        (item.color || "") +
        "</p>" +
        '<a class="btn btn-primary" href="' +
        item.href +
        '" target="_blank" rel="noopener noreferrer sponsored">Shop on Skechers.pl</a>' +
        "</div>";
      var buy = card.querySelector("a");
      if (buy) {
        buy.addEventListener("click", function () {
          trackClick(item);
        });
      }
      grid.appendChild(card);
    });
  }

  function initHero(slides) {
    var active = 0;
    var timer = null;
    function go(next, manual) {
      active = paintHero(slides, next);
      if (manual && timer) {
        window.clearInterval(timer);
        timer = window.setInterval(function () {
          go(active + 1, false);
        }, AUTO_MS);
      }
    }
    window.__vcSkechersGo = go;
    go(0, false);
    timer = window.setInterval(function () {
      go(active + 1, false);
    }, AUTO_MS);
  }

  async function boot() {
    try {
      var res = await fetch(JSON_URL, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) {
        return;
      }
      var cfg = await res.json();
      var items = (cfg && cfg.items) || [];
      if (!items.length) {
        return;
      }
      renderDisclosure(document.body, cfg);
      renderGrid(items);
      initHero(items);
      var promo = document.getElementById("vcSkechersPromoBadge");
      if (promo && cfg.promoBadge) {
        promo.textContent = cfg.promoBadge;
      }
    } catch {
      /* ignore */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
