/**
 * Fetches affiliate-recommendations.json and mounts partner cards + disclosure copy.
 * Each page includes one <script defer src="...affiliate-recommendations-mount.js">.
 * Mount targets: sections with [data-vc-affiliate-auto] containing .vc-affiliate-rec__title, .vc-affiliate-rec__intro, .vc-affiliate-rec__grid.
 */
(function () {
  "use strict";

  var AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
  var JSON_URL = "./affiliate-recommendations.json?v=20260508aff2";

  function renderIntro(introEl, cfg) {
    if (!introEl) {
      return;
    }
    introEl.innerHTML = "";
    var d = (cfg && cfg.disclosure) || null;
    if (d && (d.short || d.policyPreamble)) {
      if (d.short) {
        var p1 = document.createElement("p");
        p1.className = "note vc-affiliate-rec-disclosure-short";
        p1.textContent = String(d.short).trim();
        introEl.appendChild(p1);
      }
      if (d.policyPreamble && d.policyHref && d.policyLinkLabel) {
        var p2 = document.createElement("p");
        p2.className = "note vc-affiliate-rec-disclosure-policy";
        p2.appendChild(document.createTextNode(String(d.policyPreamble).trim() + " "));
        var a = document.createElement("a");
        a.href = String(d.policyHref).trim() || "./policy.html#affiliate-disclosure";
        a.textContent = String(d.policyLinkLabel).trim();
        a.className = "vc-affiliate-rec-policy-link";
        p2.appendChild(a);
        p2.appendChild(document.createTextNode("."));
        introEl.appendChild(p2);
      }
      if (cfg.contextLine) {
        var p3 = document.createElement("p");
        p3.className = "note vc-affiliate-rec-context";
        p3.textContent = String(cfg.contextLine).trim();
        introEl.appendChild(p3);
      }
      return;
    }
    if (cfg && cfg.intro) {
      var fallback = document.createElement("p");
      fallback.className = "note";
      fallback.textContent = String(cfg.intro);
      introEl.appendChild(fallback);
    }
  }

  function paintAffiliateRecommendations(cfg, els) {
    var root = els.root;
    var grid = els.grid;
    if (!root || !grid) {
      return;
    }
    var items = (cfg && cfg.items) || [];
    if (!Array.isArray(items) || !items.length) {
      return;
    }
    if (els.title && cfg.title) {
      els.title.textContent = String(cfg.title);
    }
    renderIntro(els.intro, cfg);
    grid.innerHTML = "";
    items.forEach(function (item) {
      var href = String((item && item.href) || "").trim();
      if (!href || !/^https?:\/\//i.test(href)) {
        return;
      }
      var a = document.createElement("a");
      var isBanner = String((item && item.kind) || "").toLowerCase() === "banner";
      a.className = isBanner ? "vc-affiliate-card vc-affiliate-card--banner" : "vc-affiliate-card";
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer sponsored";
      a.setAttribute("role", "listitem");
      a.setAttribute(
        "aria-label",
        String((item && item.label) || (cfg && cfg.advertiser) || "Partner link") + " (opens in a new tab)"
      );
      if (isBanner && item.bannerImageUrl) {
        var img = document.createElement("img");
        img.className = "vc-affiliate-card__banner-img";
        img.src = String(item.bannerImageUrl).trim();
        img.alt = "";
        img.width = Number(item.bannerWidth) > 0 ? Number(item.bannerWidth) : 150;
        img.height = Number(item.bannerHeight) > 0 ? Number(item.bannerHeight) : 40;
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer-when-downgrade";
        a.appendChild(img);
        var cap = document.createElement("span");
        cap.className = "vc-affiliate-card__banner-caption";
        cap.textContent = String((item && item.label) || (cfg && cfg.advertiser) || "Partner");
        a.appendChild(cap);
      } else {
        var lab = document.createElement("span");
        lab.className = "vc-affiliate-card__label";
        lab.textContent = String((item && item.label) || "Shop");
        a.appendChild(lab);
        var desc = String((item && item.description) || "").trim();
        if (desc) {
          var d = document.createElement("span");
          d.className = "vc-affiliate-card__desc";
          d.textContent = desc;
          a.appendChild(d);
        }
      }
      a.addEventListener("click", function () {
        try {
          localStorage.setItem(
            AFFILIATE_LAST_CLICK_KEY,
            JSON.stringify({
              at: new Date().toISOString(),
              source: "affiliate-recommended",
              linkId: item.linkId != null ? String(item.linkId) : "",
              label: String((item && item.label) || ""),
              target: href
            })
          );
        } catch {
          /* ignore */
        }
      });
      grid.appendChild(a);
    });
    root.hidden = false;
  }

  function elsFromSection(root) {
    return {
      root: root,
      title: root.querySelector(".vc-affiliate-rec__title"),
      intro: root.querySelector(".vc-affiliate-rec__intro"),
      grid: root.querySelector(".vc-affiliate-rec__grid")
    };
  }

  async function loadAffiliateRecommendations(els) {
    if (!els.root || !els.grid) {
      return;
    }
    try {
      var res = await fetch(JSON_URL, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!res.ok) {
        return;
      }
      var cfg = await res.json();
      if (!cfg || !Array.isArray(cfg.items) || !cfg.items.length) {
        return;
      }
      paintAffiliateRecommendations(cfg, els);
    } catch {
      /* keep hidden */
    }
  }

  function boot() {
    var nodes = document.querySelectorAll("[data-vc-affiliate-auto]");
    if (!nodes || !nodes.length) {
      return;
    }
    nodes.forEach(function (root) {
      loadAffiliateRecommendations(elsFromSection(root));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
