/* Topic- and route-aware motion heroes: Ken Burns on photography tuned per lane (no stock video). */
(function () {
  "use strict";

  function hashString(s) {
    var str = String(s || "");
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function pickStill(list, salt) {
    if (!list || !list.length) return "";
    return list[hashString(salt) % list.length];
  }

  function readCat() {
    try {
      return String(
        new URLSearchParams(window.location.search || "").get("cat") || ""
      )
        .trim()
        .toLowerCase();
    } catch {
      return "";
    }
  }

  /**
   * One key per “place” (pathname + sometimes ?cat=). Each value is an array of
   * distinctive stills so repeats feel less generic than a single global photo.
   */
  function placeKeyFromPath() {
    var p = String((typeof location !== "undefined" && location.pathname) || "").toLowerCase();
    var cat = readCat();

    if (p.indexOf("checkout-details") >= 0) return "checkout";
    if (p.indexOf("orders-tracking") >= 0) return "orders";
    if (p.indexOf("account-hub") >= 0 || p.indexOf("account-welcome") >= 0) return "account";
    if (p.indexOf("passport-welcome") >= 0 || p.indexOf("passport") >= 0) return "passport";
    if (p.indexOf("live-market") >= 0) {
      if (cat.indexOf("scent") >= 0 || cat.indexOf("beauty") >= 0 || cat.indexOf("care") >= 0) return "live-market-scents";
      if (cat.indexOf("elect") >= 0 || cat.indexOf("gadget") >= 0) return "electronics";
      if (cat.indexOf("fashion") >= 0 || cat.indexOf("apparel") >= 0) return "fashion";
      if (cat.indexOf("food") >= 0 || cat.indexOf("baker") >= 0 || cat.indexOf("grocery") >= 0) return "live-market-food";
      return "live-market";
    }
    if (p.indexOf("world-shop") >= 0) return "world-shop";
    if (p.indexOf("hot-picks") >= 0) return "hot-picks";
    if (p.indexOf("shops-scents") >= 0 || (p.indexOf("scents") >= 0 && p.indexOf("admin") < 0)) return "scents";
    if (p.indexOf("bridge") >= 0) return "trade";
    if (p.indexOf("wellbeing") >= 0) return "wellbeing";
    if (p.indexOf("coach-experience") >= 0) return "coach";
    if (p.indexOf("health-coach") >= 0 || p.indexOf("health") >= 0) return "wellness";
    if (p.indexOf("sell-journey") >= 0 || p.indexOf("my-listings") >= 0 || p.indexOf("seller-boost") >= 0) return "seller";
    if (p.indexOf("my-business") >= 0 || p.indexOf("service-provider") >= 0) return "services";
    if (p.indexOf("electronics") >= 0 || p.indexOf("gadget") >= 0) return "electronics";
    if (p.indexOf("fashion") >= 0) return "fashion";
    if (p.indexOf("admin") >= 0) return "admin";
    return "market";
  }

  var PLACE_STILLS = {
    market: [
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1542838130-7b1fef84a4e0?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1556912167-f6f7d799adc5?auto=format&fit=crop&w=1600&q=82"
    ],
    "live-market": [
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1555529907-44ce454ec3d5?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1556740753-74c994186b35?auto=format&fit=crop&w=1600&q=82"
    ],
    "live-market-food": [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1600&q=82"
    ],
    "live-market-scents": [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1596462508899-7b3ebc3df4f0?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=82"
    ],
    "world-shop": [
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=82"
    ],
    "hot-picks": [
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=82"
    ],
    scents: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1596462508899-7b3ebc3df4f0?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1540555700478-4d289cc18a90?auto=format&fit=crop&w=1600&q=82"
    ],
    trade: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1578575437130-527eed3c628a?auto=format&fit=crop&w=1600&q=82"
    ],
    wellbeing: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=82"
    ],
    coach: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=82"
    ],
    wellness: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1600&q=82"
    ],
    seller: [
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=82"
    ],
    services: [
      "https://images.unsplash.com/photo-1560066984-138d9534a059?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1600&q=82"
    ],
    electronics: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1498049790221-79994bc8faa5?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=82"
    ],
    fashion: [
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=82"
    ],
    checkout: [
      "https://images.unsplash.com/photo-1556740753-74c994186b35?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1563013544-b01d9b6d3c58?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=82"
    ],
    orders: [
      "https://images.unsplash.com/photo-1586528267552-5a7d339cd64c?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1566576721343-d5233b3e1d35?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=82"
    ],
    account: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=82"
    ],
    passport: [
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=82"
    ],
    admin: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1504868584819-f8e8ef4f975b?auto=format&fit=crop&w=1600&q=82"
    ]
  };

  function defaultUrl() {
    var key = placeKeyFromPath();
    var list = PLACE_STILLS[key] || PLACE_STILLS.market;
    return pickStill(list, (typeof location !== "undefined" && location.pathname) || "");
  }

  function shouldAutofillMotionSrc(src) {
    var s = String(src || "").trim();
    if (!s) return true;
    if (/icon\.svg|icon-maskable/i.test(s)) return true;
    if (/hero-masterpiece|afro-euro-asia/i.test(s)) return true;
    return false;
  }

  function fillEmptyMotionPanels() {
    var key = placeKeyFromPath();
    var list = PLACE_STILLS[key] || PLACE_STILLS.market;
    var nodes = document.querySelectorAll(".vc-visual-motion img.vc-visual-motion__media");
    Array.prototype.forEach.call(nodes, function (img) {
      if (!shouldAutofillMotionSrc(img.getAttribute("src"))) return;
      var salt = (img.id || "") + "|" + ((typeof location !== "undefined" && location.pathname) || "");
      var url = pickStill(list, salt);
      if (!url) return;
      img.setAttribute("src", url);
    });
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
    if (shouldAutofillMotionSrc(big.getAttribute("src"))) {
      var pk = placeKeyFromPath();
      big.src = pickStill(PLACE_STILLS[pk] || PLACE_STILLS.market, (typeof location !== "undefined" && location.href) || "");
    }
    hero.insertBefore(shell, big);
    shell.appendChild(big);
    mark.classList.add("vc-visual-hero__mark");
  }

  function run() {
    try {
      Array.prototype.forEach.call(document.querySelectorAll(".vc-visual-hero"), wrapSecondImage);
      fillEmptyMotionPanels();
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
