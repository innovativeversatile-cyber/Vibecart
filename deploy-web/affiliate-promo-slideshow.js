(function () {
  "use strict";

  var JSON_URL = "./skechers-affiliate.json?v=20260513sk1";
  var AUTO_MS = 6000;

  function boot() {
    var root = document.getElementById("vcAffiliatePromoRoot");
    if (!root) {
      return;
    }
    fetch(JSON_URL, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (cfg) {
        var items = (cfg && cfg.items) || [];
        if (!items.length) {
          return;
        }
        var visual = document.getElementById("vcAffiliatePromoVisual");
        var title = document.getElementById("vcAffiliatePromoTitle");
        var line = document.getElementById("vcAffiliatePromoLine");
        var cta = document.getElementById("vcAffiliatePromoCta");
        var lane = document.getElementById("vcAffiliatePromoLane");
        var dots = document.getElementById("vcAffiliatePromoDots");
        if (!visual || !title || !cta) {
          return;
        }
        if (lane) {
          lane.href = "./skechers-affiliate.html";
        }
        var active = 0;
        function paint(i) {
          active = (i + items.length) % items.length;
          var s = items[active];
          visual.style.backgroundImage = "url('" + String(s.imageUrl).replace(/'/g, "%27") + "')";
          title.textContent = s.label;
          if (line) {
            line.textContent = (s.tagline || "") + " · " + (s.color || "");
          }
          cta.href = s.href;
          if (dots) {
            dots.innerHTML = "";
            items.forEach(function (_, idx) {
              var b = document.createElement("button");
              b.type = "button";
              b.className = "vc-affiliate-promo-dot" + (idx === active ? " is-active" : "");
              b.setAttribute("aria-label", "Promo slide " + (idx + 1));
              b.addEventListener("click", function () {
                paint(idx);
              });
              dots.appendChild(b);
            });
          }
        }
        paint(0);
        root.hidden = false;
        window.setInterval(function () {
          paint(active + 1);
        }, AUTO_MS);
      })
      .catch(function () {
        /* keep hidden */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
