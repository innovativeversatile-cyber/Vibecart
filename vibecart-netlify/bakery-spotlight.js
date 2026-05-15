(function () {
  "use strict";

  var root = document.getElementById("vcBakerySpotlightRoot");
  if (!root) return;

  var stage = document.getElementById("vcBakerySpotlightVisual");
  var titleEl = document.getElementById("vcBakerySpotlightTitle");
  var lineEl = document.getElementById("vcBakerySpotlightLine");
  var ctaEl = document.getElementById("vcBakerySpotlightCta");
  var dotsEl = document.getElementById("vcBakerySpotlightDots");
  var items = [];
  var idx = 0;
  var timer = null;

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSlide() {
    if (!items.length) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    var it = items[idx] || items[0];
    if (stage) {
      stage.style.backgroundImage = it.imageUrl ? 'url("' + String(it.imageUrl).replace(/"/g, "") + '")' : "";
    }
    if (titleEl) titleEl.textContent = it.businessName || "Local bakery";
    if (lineEl) {
      lineEl.textContent =
        (it.workTitle ? it.workTitle + " · " : "") +
        (it.basePrice > 0 ? "From " + it.basePrice + " " + (it.currency || "") : "Custom cakes & delivery");
    }
    if (ctaEl) {
      ctaEl.href = it.bookUrl || "./my-business.html?flow=book&line=Bakery%20%2F%20custom%20cakes";
    }
    if (dotsEl) {
      dotsEl.innerHTML = items
        .map(function (_, i) {
          return (
            '<button type="button" class="vc-affiliate-promo-dot' +
            (i === idx ? " is-active" : "") +
            '" data-idx="' +
            i +
            '" aria-label="Slide ' +
            (i + 1) +
            '"></button>'
          );
        })
        .join("");
      dotsEl.querySelectorAll("[data-idx]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          idx = Number(btn.getAttribute("data-idx") || 0);
          renderSlide();
          restartTimer();
        });
      });
    }
  }

  function restartTimer() {
    if (timer) clearInterval(timer);
    if (items.length < 2) return;
    timer = setInterval(function () {
      idx = (idx + 1) % items.length;
      renderSlide();
    }, 7000);
  }

  fetch("/api/public/bakery/spotlight?limit=8&_=" + String(Date.now()))
    .then(function (r) {
      return r.json();
    })
    .then(function (j) {
      items = Array.isArray(j && j.spotlight) ? j.spotlight : [];
      if (!items.length) {
        root.hidden = true;
        return;
      }
      idx = 0;
      renderSlide();
      restartTimer();
    })
    .catch(function () {
      root.hidden = true;
    });
})();
