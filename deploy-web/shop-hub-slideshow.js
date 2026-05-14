(function () {
  "use strict";

  var AUTO_MS = 5200;
  var AFFILIATE_URL = "./affiliate-recommendations.json?v=20260514sh1";
  var SKECHERS_URL = "./skechers-affiliate.json?v=20260514sh1";

  var REGION_LABELS = {
    eu: "Europe",
    ie: "Ireland & UK",
    za: "South Africa",
    ke: "Kenya",
    gulf: "Gulf",
    asia: "Asia Pacific",
    global: "Worldwide"
  };

  var REGION_RETAILERS = {
    eu: [
      { shop: "SHEIN EU", tag: "Up to 70% off", title: "Trend fashion — EU delivery", desc: "Fast fashion drops with seasonal clearance.", href: "https://eu.shein.com", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "Allegro", tag: "Marketplace deals", title: "Poland's mega marketplace", desc: "Electronics, fashion, beauty — millions of offers.", href: "https://www.tkqlhce.com/click-101733745-16981057", img: "https://www.ftjcfx.com/image-101733745-15893693" },
      { shop: "Zalando", tag: "Style sale", title: "EU fashion & lifestyle", desc: "Designer labels to streetwear — filter by your size.", href: "https://www.zalando.com", img: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&h=900&q=80" }
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
      { shop: "AliExpress", tag: "Global bargains", title: "Cross-border mega deals", desc: "Electronics, fashion, home — clearance up to 90% off.", href: "https://www.tkqlhce.com/click-101733745-17242061", img: "https://www.tqlkg.com/image-101733745-17242121" },
      { shop: "Rakuten", tag: "Japan picks", title: "Asia Pacific marketplace", desc: "Electronics, books, and lifestyle from Japan.", href: "https://www.rakuten.co.jp", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&h=900&q=80" }
    ],
    global: [
      { shop: "AliExpress", tag: "Clearance 90%", title: "Worldwide bargain vault", desc: "Partner-tracked deals across every category.", href: "https://www.anrdoezrs.net/click-101733745-17242131", img: "https://www.lduhtrp.net/image-101733745-17242131" },
      { shop: "Amazon", tag: "Prime picks", title: "Global marketplace", desc: "Electronics, books, and everyday essentials.", href: "https://www.amazon.com", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&h=900&q=80" },
      { shop: "SHEIN", tag: "Trend wave", title: "Fast fashion worldwide", desc: "Seasonal drops with rotating promo codes.", href: "https://www.shein.com", img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&h=900&q=80" }
    ]
  };

  var COACH_SLIDE = {
    shop: "VibeCart Coach",
    tag: "On VibeCart",
    title: "Health & fitness coach",
    desc: "Workouts + meals — checkout here.",
    href: "./wellbeing.html",
    img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1400&h=900&q=80",
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

  function affiliateToSlide(item, advertiser) {
    var img = String(item.bannerImageUrl || item.productImageUrl || "").trim();
    if (!img) return null;
    var href = String(item.href || "").trim();
    if (!/^https?:\/\//i.test(href)) return null;
    var shop = advertiser || "Partner";
    if (/allegro/i.test(item.label || "")) shop = "Allegro";
    if (/aliexpress/i.test(item.label || "") || /aliexpress/i.test(advertiser || "")) shop = "AliExpress";
    return {
      shop: shop,
      tag: item.kind === "banner" ? "Partner promo" : "Affiliate pick",
      title: String(item.label || "Partner offer"),
      desc: String(item.description || "Opens on the retailer site in a new tab."),
      href: href,
      img: img,
      sponsored: true
    };
  }

  function skechersToSlide(item) {
    if (!item || !item.imageUrl || !item.href) return null;
    return {
      shop: "SKECHERS",
      tag: String(item.badge || "Partner"),
      title: String(item.label || "Skechers pick"),
      desc: String(item.tagline || "Official Skechers Poland partner link."),
      href: String(item.href),
      img: String(item.imageUrl),
      sponsored: true
    };
  }

  function buildSlides(region, affiliateCfg, skechersCfg) {
    var slides = [];
    var retailers = REGION_RETAILERS[region] || REGION_RETAILERS.global;
    retailers.forEach(function (r) { slides.push(r); });

    var affItems = (affiliateCfg && affiliateCfg.items) || [];
    var advertiser = (affiliateCfg && affiliateCfg.advertiser) || "";
    affItems.forEach(function (item) {
      if (String(item.kind || "").toLowerCase() === "banner") {
        var s = affiliateToSlide(item, advertiser);
        if (s) slides.push(s);
      }
    });
    affItems.forEach(function (item) {
      if (String(item.kind || "").toLowerCase() !== "banner") {
        var s2 = affiliateToSlide(item, advertiser);
        if (s2) slides.push(s2);
      }
    });

    var skItems = (skechersCfg && skechersCfg.items) || [];
    skItems.forEach(function (item) {
      var sk = skechersToSlide(item);
      if (sk) slides.push(sk);
    });

    slides.push(COACH_SLIDE);

    var seen = {};
    return slides.filter(function (sl) {
      var key = sl.href + "|" + sl.title;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function paintTicker(track, slides) {
    if (!track) return;
    var names = slides.map(function (s) { return s.shop; });
    var uniq = [];
    names.forEach(function (n) { if (uniq.indexOf(n) < 0) uniq.push(n); });
    var html = uniq.concat(uniq).map(function (n) {
      return '<span class="vc-shop-now-ticker__item">' + n + "</span>";
    }).join("");
    track.innerHTML = html;
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

    if (!stageA || !stageB || !titleEl || !ctaEl) return;

    Promise.all([fetchJson(AFFILIATE_URL), fetchJson(SKECHERS_URL)]).then(function (res) {
      var slides = buildSlides(region, res[0], res[1]);
      if (!slides.length) {
        root.classList.add("vc-shop-now-epic--empty");
        return;
      }

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
        stage.style.backgroundImage = "url('" + String(slide.img).replace(/'/g, "%27") + "')";
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
        if (slide.internal) {
          ctaEl.removeAttribute("target");
          ctaEl.removeAttribute("rel");
        } else {
          ctaEl.target = "_blank";
          ctaEl.rel = "noopener noreferrer" + (slide.sponsored ? " sponsored" : "");
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
