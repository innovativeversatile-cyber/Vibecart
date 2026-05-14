(function () {
  "use strict";

  var AUTO_MS = 5200;
  var AFFILIATE_URL = "./affiliate-recommendations.json?v=20260514sh3";
  var SKECHERS_URL = "./skechers-affiliate.json?v=20260514sh3";
  var FALLBACK_HERO =
    "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1400&h=900&q=80";

  var REGION_LABELS = {
    eu: "Europe",
    ie: "Ireland & UK",
    za: "South Africa",
    ke: "Kenya",
    gulf: "Gulf",
    asia: "Asia Pacific",
    global: "Worldwide"
  };

  var HERO_BY_KEY = {
    "allegro-home": "https://images.unsplash.com/photo-1556740748-877f367bfd7f?auto=format&fit=crop&w=1400&h=900&q=80",
    "allegro-electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&h=900&q=80",
    "allegro-fashion": "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&h=900&q=80",
    "allegro-beauty": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&h=900&q=80",
    "aliexpress-homepage": "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1400&h=900&q=80",
    "phone-electronics": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&h=900&q=80",
    "home-furniture": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&h=900&q=80",
    "better-choice-banner": "https://images.unsplash.com/photo-1472851294608-062f824d39cc?auto=format&fit=crop&w=1400&h=900&q=80",
    "summer-ready-us": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&h=900&q=80",
    "mothers-day-northern": "https://images.unsplash.com/photo-1522335780783-f51121c2e48d?auto=format&fit=crop&w=1400&h=900&q=80",
    "clearance-banner": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&h=900&q=80",
    "local-shipping-banner": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&h=900&q=80",
    "allegro-banner": "https://images.unsplash.com/photo-1556740748-877f367bfd7f?auto=format&fit=crop&w=1400&h=900&q=80",
    "uno-glide-air-gliders-pnk": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&h=900&q=80",
    "uno-ctl-airloom-ofwt": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1400&h=900&q=80",
    "bobs-sport-squad-chaos-ofwt": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1400&h=900&q=80",
    "contour-foam-sweet-embrace-lav": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1400&h=900&q=80",
    coach: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1400&h=900&q=80"
  };

  var AFFILIATE_SLIDE_KEYS = [
    "clearance-banner",
    "phone-electronics",
    "aliexpress-homepage",
    "allegro-fashion",
    "summer-ready-us",
    "local-shipping-banner"
  ];

  var REGION_RETAILERS = {
    eu: [
      { shop: "SHEIN EU", tag: "Up to 70% off", title: "Trend fashion — EU delivery", desc: "Fast fashion drops with seasonal clearance.", href: "https://eu.shein.com", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "Allegro", tag: "Marketplace deals", title: "Poland's mega marketplace", desc: "Electronics, fashion, beauty — millions of offers.", href: "https://www.tkqlhce.com/click-101733745-16981057", img: "https://images.unsplash.com/photo-1556740748-877f367bfd7f?auto=format&fit=crop&w=1400&h=900&q=80", sponsored: true },
      { shop: "Zalando", tag: "Style sale", title: "EU fashion & lifestyle", desc: "Designer labels to streetwear.", href: "https://www.zalando.com", img: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&h=900&q=80" }
    ],
    ie: [
      { shop: "ASOS", tag: "Student picks", title: "Delivers across the island", desc: "Youth fashion with next-day options where offered.", href: "https://www.asos.com", img: "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "Brown Thomas", tag: "Luxury lane", title: "Ireland luxury fashion", desc: "Beauty, gifts, and designer edits.", href: "https://www.brownthomas.com", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "Currys IE", tag: "Tech promos", title: "Electronics & gaming", desc: "Laptops, consoles, and home tech bundles.", href: "https://www.currys.ie", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&h=900&q=80" }
    ],
    za: [
      { shop: "Takealot", tag: "Daily deals", title: "South Africa's everything store", desc: "Tech, books, fashion — flash sales daily.", href: "https://www.takealot.com", img: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "SHEIN", tag: "Trend alert", title: "Fast fashion to ZA", desc: "Global drops with delivery where checkout allows.", href: "https://www.shein.com", img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "Superbalist", tag: "Youth style", title: "SA streetwear & sneakers", desc: "Curated youth fashion with seasonal promos.", href: "https://www.superbalist.com", img: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&h=900&q=80" }
    ],
    ke: [
      { shop: "Jumia Kenya", tag: "Mobile-first", title: "Kenya marketplace deals", desc: "Electronics, fashion, and home essentials.", href: "https://www.jumia.co.ke", img: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "Kilimall", tag: "Flash sale", title: "Kenya online bargains", desc: "Youth fashion and gadgets with frequent promos.", href: "https://www.kilimall.co.ke", img: "https://images.unsplash.com/photo-1472851294608-062f824d39cc?auto=format&fit=crop&w=1400&h=900&q=80" }
    ],
    gulf: [
      { shop: "Noon", tag: "Gulf mega-sale", title: "UAE & GCC marketplace", desc: "Electronics, fashion, and home — regional shipping.", href: "https://www.noon.com", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "SHEIN", tag: "Modest & trend", title: "Gulf-friendly fashion", desc: "Trend pieces with Gulf delivery options.", href: "https://www.shein.com", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&h=900&q=80" }
    ],
    asia: [
      { shop: "AliExpress", tag: "Global bargains", title: "Cross-border mega deals", desc: "Clearance up to 90% off.", href: "https://www.tkqlhce.com/click-101733745-17242061", img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1400&h=900&q=80", sponsored: true },
      { shop: "Rakuten", tag: "Japan picks", title: "Asia Pacific marketplace", desc: "Electronics, books, and lifestyle from Japan.", href: "https://www.rakuten.co.jp", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&h=900&q=80" }
    ],
    global: [
      { shop: "AliExpress", tag: "Clearance 90%", title: "Worldwide bargain vault", desc: "Partner-tracked deals across every category.", href: "https://www.anrdoezrs.net/click-101733745-17242131", img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1400&h=900&q=80", sponsored: true },
      { shop: "Amazon", tag: "Prime picks", title: "Global marketplace", desc: "Electronics, books, and everyday essentials.", href: "https://www.amazon.com", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "SHEIN", tag: "Trend wave", title: "Fast fashion worldwide", desc: "Seasonal drops with rotating promo codes.", href: "https://www.shein.com", img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&h=900&q=80" }
    ]
  };

  var COACH_SLIDE = {
    key: "coach",
    shop: "VibeCart Coach",
    tag: "On VibeCart",
    title: "Health & fitness coach",
    desc: "Workouts + meals — checkout here.",
    href: "./wellbeing.html",
    img: HERO_BY_KEY.coach,
    internal: true
  };

  function isMobileCompact() {
    try {
      var root = document.documentElement;
      if (root && (root.classList.contains("vc-mobile-app") || root.classList.contains("vc-phone"))) {
        return true;
      }
      return window.innerWidth > 0 && window.innerWidth <= 720;
    } catch (e) {
      return false;
    }
  }

  function clipText(value, max) {
    var t = String(value || "").trim();
    if (!t || t.length <= max) return t;
    return t.slice(0, Math.max(1, max - 1)).trim() + "…";
  }

  function detectRegion() {
    try {
      var stored = String(localStorage.getItem("vibecart-shop-region-v1") || "").trim().toLowerCase();
      if (stored && REGION_LABELS[stored]) return stored;
    } catch (e) { /* ignore */ }
    var lang = "";
    try { lang = String(navigator.language || navigator.userLanguage || "en").toLowerCase(); } catch (e2) { lang = "en"; }
    if (/^en-ie|^ga-ie/.test(lang)) return "ie";
    if (/^en-gb|^cy-gb/.test(lang)) return "ie";
    if (/^pl|^sk|^cs|^de|^fr|^it|^es|^nl|^pt|^ro|^hu|^bg/.test(lang)) return "eu";
    if (/^en-za|^af-za/.test(lang)) return "za";
    if (/^en-ke|^sw-ke/.test(lang)) return "ke";
    if (/^ar-|^fa-/.test(lang)) return "gulf";
    if (/^ja|^ko|^zh|^th|^vi|^id|^ms|^hi/.test(lang)) return "asia";
    try {
      var tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
      if (/Dublin|London|Belfast/.test(tz)) return "ie";
      if (/Warsaw|Prague|Berlin|Paris|Rome|Madrid|Amsterdam|Brussels|Vienna|Stockholm|Helsinki|Athens|Bucharest|Budapest/.test(tz)) return "eu";
      if (/Johannesburg|Cape_Town/.test(tz)) return "za";
      if (/Nairobi/.test(tz)) return "ke";
      if (/Dubai|Riyadh|Qatar|Kuwait|Bahrain|Muscat/.test(tz)) return "gulf";
      if (/Tokyo|Seoul|Shanghai|Hong_Kong|Singapore|Bangkok|Jakarta|Kolkata|Mumbai/.test(tz)) return "asia";
    } catch (e3) { /* ignore */ }
    return "global";
  }

  function fetchJson(url) {
    return fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function resolveHero(slide) {
    var key = String((slide && slide.key) || "").trim();
    if (key && HERO_BY_KEY[key]) return HERO_BY_KEY[key];
    var img = String((slide && slide.img) || "").trim();
    if (img && /^https:\/\/images\.unsplash\.com\//i.test(img)) return img;
    if (img && /^\.\//.test(img)) {
      if (key && HERO_BY_KEY[key]) return HERO_BY_KEY[key];
      return FALLBACK_HERO;
    }
    if (img && /^https?:\/\//i.test(img) && !/ftjcfx|tqlkg|lduhtrp|awltovhc/i.test(img)) {
      return img;
    }
    var shop = String((slide && slide.shop) || "").toLowerCase();
    if (/shein/.test(shop)) return "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&h=900&q=80";
    if (/allegro/.test(shop)) return HERO_BY_KEY["allegro-home"];
    if (/aliexpress/.test(shop)) return HERO_BY_KEY["aliexpress-homepage"];
    if (/skechers/.test(shop)) return HERO_BY_KEY["uno-glide-air-gliders-pnk"];
    if (/coach/.test(shop)) return HERO_BY_KEY.coach;
    return FALLBACK_HERO;
  }

  function normalizeSlide(slide) {
    if (!slide) return null;
    var out = {
      key: slide.key || "",
      shop: slide.shop || "",
      tag: slide.tag || "Deal",
      title: slide.title || "",
      desc: slide.desc || "",
      href: slide.href || "#",
      img: resolveHero(slide),
      sponsored: Boolean(slide.sponsored),
      internal: Boolean(slide.internal)
    };
    return out;
  }

  function affiliateItemByKey(items, key) {
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].key || "") === key) return items[i];
    }
    return null;
  }

  function affiliateToSlide(item, advertiser) {
    if (!item) return null;
    var href = String(item.href || "").trim();
    if (!/^https?:\/\//i.test(href)) return null;
    var shop = advertiser || "Partner";
    if (/allegro/i.test(item.label || "")) shop = "Allegro";
    if (/aliexpress/i.test(item.label || "") || /aliexpress/i.test(advertiser || "")) shop = "AliExpress";
    return normalizeSlide({
      key: String(item.key || ""),
      shop: shop,
      tag: String(item.kind || "").toLowerCase() === "banner" ? "Partner promo" : "Affiliate pick",
      title: String(item.label || "Partner offer"),
      desc: String(item.description || "Opens on the retailer site in a new tab."),
      href: href,
      img: HERO_BY_KEY[item.key] || item.bannerImageUrl || item.productImageUrl || "",
      sponsored: true
    });
  }

  function skechersToSlide(item) {
    if (!item || !item.href) return null;
    return normalizeSlide({
      key: String(item.key || ""),
      shop: "SKECHERS",
      tag: String(item.badge || "Partner"),
      title: String(item.label || "Skechers pick"),
      desc: String(item.tagline || "Official Skechers Poland partner link."),
      href: String(item.href),
      img: HERO_BY_KEY[item.key] || item.imageUrl || "",
      sponsored: true
    });
  }

  function buildSlides(region, affiliateCfg, skechersCfg) {
    var slides = [];
    var retailers = REGION_RETAILERS[region] || REGION_RETAILERS.global;
    retailers.forEach(function (r) {
      var s = normalizeSlide(r);
      if (s) slides.push(s);
    });

    var skItems = (skechersCfg && skechersCfg.items) || [];
    skItems.forEach(function (item) {
      var sk = skechersToSlide(item);
      if (sk) slides.push(sk);
    });

    var affItems = (affiliateCfg && affiliateCfg.items) || [];
    var advertiser = (affiliateCfg && affiliateCfg.advertiser) || "";
    AFFILIATE_SLIDE_KEYS.forEach(function (key) {
      var item = affiliateItemByKey(affItems, key);
      var aff = affiliateToSlide(item, advertiser);
      if (aff) slides.push(aff);
    });

    slides.push(normalizeSlide(COACH_SLIDE));

    var seen = {};
    return slides.filter(function (sl) {
      if (!sl || !sl.img) return false;
      var dedupeKey = sl.href + "|" + sl.title;
      if (seen[dedupeKey]) return false;
      seen[dedupeKey] = true;
      return true;
    });
  }

  function preloadImages(slides) {
    var urls = slides.map(function (s) { return s.img; });
    return Promise.all(
      urls.map(function (url) {
        return new Promise(function (resolve) {
          var im = new Image();
          im.onload = function () { resolve(url); };
          im.onerror = function () { resolve(FALLBACK_HERO); };
          im.src = url;
        });
      })
    );
  }

  function paintTicker(track, slides) {
    if (!track) return;
    var names = slides.map(function (s) { return s.shop; });
    var uniq = [];
    names.forEach(function (n) { if (uniq.indexOf(n) < 0) uniq.push(n); });
    track.innerHTML = uniq.concat(uniq).map(function (n) {
      return '<span class="vc-shop-now-ticker__item">' + n + "</span>";
    }).join("");
  }

  function ensureSlideImg(stage) {
    var img = stage.querySelector(".vc-shop-now-slide__img");
    if (!img) {
      img = document.createElement("img");
      img.className = "vc-shop-now-slide__img";
      img.alt = "";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer-when-downgrade";
      stage.appendChild(img);
    }
    return img;
  }

  function disclaimerAccepted() {
    var ack = document.getElementById("vcShopNowDisclaimerAck");
    return !ack || ack.checked;
  }

  function showDisclaimerHint(msg) {
    var hint = document.getElementById("vcShopNowDisclaimerHint");
    if (!hint) return;
    hint.textContent = String(msg || "Tick the affiliate disclaimer to open partner links.");
    hint.hidden = false;
    try {
      var gate = document.getElementById("vcShopNowDisclaimerAck");
      if (gate && gate.scrollIntoView) {
        gate.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (e) { /* ignore */ }
  }

  function isNativeWebView() {
    try {
      return !!(window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function");
    } catch (e) {
      return false;
    }
  }

  function isExternalHttpUrl(href) {
    var url = String(href || "").trim();
    if (!/^https?:\/\//i.test(url)) return false;
    try {
      return new URL(url).origin !== window.location.origin;
    } catch (e) {
      return true;
    }
  }

  function openSlideUrl(href, slide, event) {
    var url = String(href || "").trim();
    if (!url || url === "#") {
      if (event) event.preventDefault();
      return;
    }
    if (slide && slide.sponsored && !disclaimerAccepted()) {
      if (event) event.preventDefault();
      showDisclaimerHint("Tick the affiliate disclaimer before opening partner shop links.");
      return;
    }
    if (slide && slide.internal) {
      return;
    }
    if (!isExternalHttpUrl(url)) {
      return;
    }
    if (event) event.preventDefault();
    if (isNativeWebView()) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ vcOpenUrl: url, src: "vc" }));
      return;
    }
    var opened = null;
    try {
      opened = window.open(url, "_blank", "noopener,noreferrer");
    } catch (e2) {
      opened = null;
    }
    if (!opened) {
      window.location.assign(url);
    }
  }

  function boot() {
    var root = document.getElementById("vcShopNowEpic");
    if (!root) return;

    var region = detectRegion();
    var regionEl = document.getElementById("vcShopNowRegion");
    if (regionEl) regionEl.textContent = REGION_LABELS[region] || REGION_LABELS.global;

    var compact = isMobileCompact();
    if (compact) {
      root.classList.add("vc-shop-now-epic--compact");
      var descBoot = document.getElementById("vcShopNowDesc");
      if (descBoot) descBoot.textContent = "Loading deals near you…";
    }

    var stageA = document.getElementById("vcShopNowSlideA");
    var stageB = document.getElementById("vcShopNowSlideB");
    var titleEl = document.getElementById("vcShopNowTitle");
    var tagEl = document.getElementById("vcShopNowTag");
    var shopEl = document.getElementById("vcShopNowShop");
    var descEl = document.getElementById("vcShopNowDesc");
    var ctaEl = document.getElementById("vcShopNowCta");
    var dotsEl = document.getElementById("vcShopNowDots");
    var progressEl = document.getElementById("vcShopNowProgress");
    var tickerEl = document.getElementById("vcShopNowTicker");
    var countEl = document.getElementById("vcShopNowCount");
    var disclaimerAck = document.getElementById("vcShopNowDisclaimerAck");

    if (!stageA || !stageB || !titleEl || !ctaEl) return;

    if (ctaEl && !ctaEl.dataset.vcGateBound) {
      ctaEl.dataset.vcGateBound = "1";
      ctaEl.addEventListener("click", function (e) {
        openSlideUrl(ctaEl.href, ctaEl._vcActiveSlide, e);
      });
    }

    if (disclaimerAck) {
      disclaimerAck.addEventListener("change", function () {
        var hint = document.getElementById("vcShopNowDisclaimerHint");
        if (hint && disclaimerAck.checked) hint.hidden = true;
      });
    }

    Promise.all([fetchJson(AFFILIATE_URL), fetchJson(SKECHERS_URL)]).then(function (res) {
      var slides = buildSlides(region, res[0], res[1]);
      if (!slides.length) {
        root.classList.add("vc-shop-now-epic--empty");
        return;
      }

      return preloadImages(slides).then(function () {
        paintTicker(tickerEl, slides);
        if (countEl) countEl.textContent = String(slides.length);
        if (compact && countEl && countEl.parentElement) {
          countEl.parentElement.hidden = true;
        }

        var active = 0;
        var frontIsA = true;
        var timer = null;
        var holdUntil = 0;

        function applyToStage(stage, slide) {
          var img = ensureSlideImg(stage);
          var url = resolveHero(slide);
          img.onerror = function () {
            img.onerror = null;
            img.src = FALLBACK_HERO;
          };
          img.src = url;
          stage.setAttribute("data-shop", slide.shop || "");
        }

        function paintMeta(slide) {
          var tight = compact || isMobileCompact();
          if (shopEl) shopEl.textContent = slide.shop || "";
          if (tagEl) tagEl.textContent = tight ? clipText(slide.tag || "Deal", 16) : (slide.tag || "Deal");
          titleEl.textContent = tight ? clipText(slide.title || "", 38) : (slide.title || "");
          if (descEl) {
            var d = String(slide.desc || "");
            descEl.textContent = tight ? clipText(d, 48) : d;
          }
          ctaEl.href = slide.href || "#";
          ctaEl._vcActiveSlide = slide;
          if (slide.internal) {
            ctaEl.removeAttribute("target");
            ctaEl.removeAttribute("rel");
          } else if (isExternalHttpUrl(slide.href)) {
            ctaEl.target = "_blank";
            ctaEl.rel = "noopener noreferrer" + (slide.sponsored ? " sponsored" : "");
          } else {
            ctaEl.removeAttribute("target");
            ctaEl.removeAttribute("rel");
          }
          ctaEl.textContent = slide.internal
            ? (tight ? "Coach →" : "Explore on VibeCart →")
            : (tight ? "Open deal →" : "Shop this deal →");
        }

        function paintDots(idx) {
          if (!dotsEl) return;
          dotsEl.innerHTML = "";
          slides.forEach(function (_, i) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "vc-shop-now-dot" + (i === idx ? " is-active" : "");
            b.setAttribute("aria-label", "Offer slide " + (i + 1));
            b.addEventListener("click", function () {
              holdUntil = Date.now() + AUTO_MS * 2;
              goTo(i);
            });
            dotsEl.appendChild(b);
          });
        }

        function restartProgress() {
          if (!progressEl) return;
          progressEl.classList.remove("vc-shop-now-progress--run");
          void progressEl.offsetWidth;
          progressEl.classList.add("vc-shop-now-progress--run");
        }

        function goTo(i) {
          var next = (i + slides.length) % slides.length;
          var slide = slides[next];
          var incoming = frontIsA ? stageB : stageA;
          var outgoing = frontIsA ? stageA : stageB;
          applyToStage(incoming, slide);
          incoming.classList.add("is-visible");
          outgoing.classList.remove("is-visible");
          frontIsA = !frontIsA;
          active = next;
          paintMeta(slide);
          paintDots(active);
          restartProgress();
        }

        applyToStage(stageA, slides[0]);
        applyToStage(stageB, slides[Math.min(1, slides.length - 1)]);
        stageA.classList.add("is-visible");
        paintMeta(slides[0]);
        paintDots(0);
        restartProgress();
        root.hidden = false;
        root.classList.add("vc-shop-now-epic--ready");

        function tick() {
          if (Date.now() < holdUntil) return;
          goTo(active + 1);
        }

        timer = window.setInterval(tick, AUTO_MS);

        root.addEventListener("mouseenter", function () {
          if (timer) { window.clearInterval(timer); timer = null; }
          if (progressEl) progressEl.classList.remove("vc-shop-now-progress--run");
        });
        root.addEventListener("mouseleave", function () {
          if (!timer) {
            restartProgress();
            timer = window.setInterval(tick, AUTO_MS);
          }
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
