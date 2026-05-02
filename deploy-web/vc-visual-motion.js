/* Topic-aware motion heroes: subtle Ken Burns on photography (no stock video dependency). */
(function () {
  "use strict";

  var TOPIC_MEDIA = {
    market:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=82",
    trade:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=82",
    scents:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=82",
    wellness:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1600&q=82",
    seller:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=82",
    services:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=82",
    electronics:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=82",
    fashion:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=82"
  };

  function topicFromPath() {
    var p = String((typeof location !== "undefined" && location.pathname) || "").toLowerCase();
    if (p.indexOf("shops-scents") >= 0 || p.indexOf("scents") >= 0) return "scents";
    if (p.indexOf("bridge") >= 0) return "trade";
    if (p.indexOf("wellbeing") >= 0 || p.indexOf("coach-experience") >= 0 || p.indexOf("health") >= 0) return "wellness";
    if (p.indexOf("sell-journey") >= 0 || p.indexOf("seller-boost") >= 0 || p.indexOf("my-listings") >= 0) return "seller";
    if (p.indexOf("my-business") >= 0 || p.indexOf("service-provider") >= 0) return "services";
    if (p.indexOf("electronics") >= 0 || p.indexOf("gadget") >= 0) return "electronics";
    if (p.indexOf("fashion") >= 0 || p.indexOf("hot-picks") >= 0) return "fashion";
    return "market";
  }

  function defaultUrl() {
    return TOPIC_MEDIA[topicFromPath()] || TOPIC_MEDIA.market;
  }

  function wrapSecondImage(hero) {
    if (!hero || hero.getAttribute("data-vc-motion-bound") === "1") return;
    if (hero.querySelector(".vc-visual-motion") || hero.querySelector(".vc-signal-cinema")) return;
    var children = Array.prototype.slice.call(hero.children || []);
    var imgs = children.filter(function (n) {
      return n && n.tagName === "IMG";
    });
    if (imgs.length < 2) return;
    var mark = imgs[0];
    var big = imgs[1];
    var w = Number(big.getAttribute("width") || 0);
    if (w && w <= 96) return;
    hero.setAttribute("data-vc-motion-bound", "1");
    var shell = document.createElement("div");
    shell.className = "vc-visual-motion";
    var label = String(big.getAttribute("alt") || "Scene preview").trim() || "Scene preview";
    shell.setAttribute("role", "img");
    shell.setAttribute("aria-label", label);
    big.classList.add("vc-visual-motion__media");
    big.removeAttribute("width");
    big.removeAttribute("height");
    big.style.width = "";
    big.style.height = "";
    if (!String(big.getAttribute("src") || "").trim() || String(big.getAttribute("src") || "").indexOf("icon") >= 0) {
      big.src = defaultUrl();
    }
    hero.insertBefore(shell, big);
    shell.appendChild(big);
    mark.classList.add("vc-visual-hero__mark");
  }

  function run() {
    try {
      Array.prototype.forEach.call(document.querySelectorAll(".vc-visual-hero"), wrapSecondImage);
    } catch {
      /* ignore */
    }
  }

  function schedule() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }
  }
  schedule();
  window.addEventListener(
    "pageshow",
    function () {
      window.setTimeout(run, 0);
    },
    { passive: true }
  );
})();
