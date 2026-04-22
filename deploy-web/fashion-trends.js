(function () {
  var REGION_KEY = "vibecart-market-region";

  var fashionStoresByRegion = {
    eu: [
      { name: "Zalando", url: "https://www.zalando.com", desc: "EU sneakers, streetwear, and seasonal edits." },
      { name: "ASOS", url: "https://www.asos.com", desc: "Global youth fashion with fast trend turnover." },
      { name: "Reserved", url: "https://www.reserved.com", desc: "Central EU everyday and runway-adjacent looks." },
      { name: "About You", url: "https://www.aboutyou.com", desc: "Personalised style feed and influencer collabs." }
    ],
    za: [
      { name: "Superbalist", url: "https://www.superbalist.com", desc: "South Africa campus and street style." },
      { name: "H&M South Africa", url: "https://www.hm.com/za", desc: "Basics, collabs, and conscious drops." },
      { name: "Zara South Africa", url: "https://www.zara.com/za/", desc: "Editorial silhouettes and trend capsules." }
    ],
    ke: [
      { name: "Jumia Fashion KE", url: "https://www.jumia.co.ke/mlp-fashion/", desc: "Kenya fashion marketplace lane." },
      { name: "Kilimall Fashion KE", url: "https://www.kilimall.co.ke/listing/women-s-clothing", desc: "Budget-friendly trend picks." }
    ],
    zw: [
      { name: "Zara", url: "https://www.zara.com", desc: "Global seasonal fashion drops." },
      { name: "SHEIN Trend", url: "https://www.shein.com/RecommendSelection/Recommend", desc: "Micro-trend try-ons and bundles." }
    ],
    gulf: [
      { name: "Namshi", url: "https://en-ae.namshi.com", desc: "Gulf streetwear and modest fashion edits." },
      { name: "Noon Fashion", url: "https://www.noon.com/uae-en/fashion", desc: "UAE multi-brand fashion hub." }
    ],
    asia: [
      { name: "Zalora", url: "https://www.zalora.com", desc: "SEA fashion marketplace." },
      { name: "Uniqlo", url: "https://www.uniqlo.com", desc: "Clean essentials and designer collabs." }
    ]
  };

  var heroSlides = [
    {
      title: "Night-out shine",
      line: "Sequins, satin, and city lights — build a full look in one lane.",
      href: "https://www.asos.com/women/dresses/cat/?cid=8799",
      bg: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1400&h=780&q=80"
    },
    {
      title: "Quiet luxury commute",
      line: "Tailored layers that still feel relaxed on campus or remote days.",
      href: "https://www.zalando.com/womens-clothing-jackets/",
      bg: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&h=780&q=80"
    },
    {
      title: "Sneaker rotation",
      line: "Track drops, resale heat, and everyday beaters in one scroll.",
      href: "https://www.zalando.com/men-shoes-sneakers/",
      bg: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&h=780&q=80"
    },
    {
      title: "Coastal weekend",
      line: "Linen, light knits, and sun-faded palettes for travel weekends.",
      href: "https://www2.hm.com/en_us/women/shop-by-feature/81110-more-sustainable-fashion.html",
      bg: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&h=780&q=80"
    }
  ];

  var microTrends = [
    { label: "Cargo + utility", href: "https://www.asos.com/men/trousers-chinos/cargo-trousers/cat/?cid=5288", img: "https://images.unsplash.com/photo-1504198453319-5ce3b932acc6?auto=format&fit=crop&w=640&h=400&q=75" },
    { label: "Denim rebuild", href: "https://www.zalando.com/womens-clothing-jeans/", img: "https://images.unsplash.com/photo-1541093309-4d297dca630c?auto=format&fit=crop&w=640&h=400&q=75" },
    { label: "Matcha athleisure", href: "https://www2.hm.com/en_us/sportswear/shop-by-product/sports-tights.html", img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=640&h=400&q=75" },
    { label: "Statement outerwear", href: "https://www.zara.com/woman/outerwear-l1184.html", img: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=640&h=400&q=75" },
    { label: "Minimal office", href: "https://www.uniqlo.com/us/en/women/bottoms", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=640&h=400&q=75" },
    { label: "Festival neon", href: "https://www.shein.com/party-clothing-sc-017172951.html", img: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=640&h=400&q=75" }
  ];

  function inferRegionFromTimezone() {
    try {
      var tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
      if (tz.indexOf("johannesburg") >= 0 || tz.indexOf("cape_town") >= 0) return "za";
      if (tz.indexOf("nairobi") >= 0) return "ke";
      if (tz.indexOf("harare") >= 0) return "zw";
      if (tz.indexOf("dubai") >= 0 || tz.indexOf("riyadh") >= 0) return "gulf";
      if (tz.indexOf("tokyo") >= 0 || tz.indexOf("singapore") >= 0 || tz.indexOf("seoul") >= 0 || tz.indexOf("kolkata") >= 0)
        return "asia";
      if (
        tz.indexOf("warsaw") >= 0 ||
        tz.indexOf("berlin") >= 0 ||
        tz.indexOf("london") >= 0 ||
        tz.indexOf("paris") >= 0 ||
        tz.indexOf("amsterdam") >= 0
      )
        return "eu";
    } catch {
      /* ignore */
    }
    return "eu";
  }

  function readRegionMode() {
    try {
      var raw = String(localStorage.getItem(REGION_KEY) || "auto").trim().toLowerCase();
      return raw || "auto";
    } catch {
      return "auto";
    }
  }

  function effectiveRegion(selectValue) {
    var v = String(selectValue || "auto").trim().toLowerCase();
    if (v && v !== "auto") {
      return v;
    }
    var stored = readRegionMode();
    if (stored && stored !== "auto") {
      return stored;
    }
    return inferRegionFromTimezone();
  }

  function renderStores(region, grid) {
    if (!grid) {
      return;
    }
    var list = fashionStoresByRegion[region] || fashionStoresByRegion.eu;
    grid.innerHTML = "";
    list.forEach(function (shop) {
      var a = document.createElement("a");
      a.className = "shop";
      a.href = shop.url;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.innerHTML = "<h3>" + shop.name + "</h3><p>" + shop.desc + "</p>";
      grid.appendChild(a);
    });
  }

  function renderMicro(grid) {
    if (!grid) {
      return;
    }
    grid.innerHTML = "";
    microTrends.forEach(function (t) {
      var a = document.createElement("a");
      a.className = "vc-fashion-micro-card";
      a.href = t.href;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.innerHTML =
        '<img src="' +
        t.img +
        '" alt="" width="320" height="200" loading="lazy" decoding="async" />' +
        "<span>" +
        t.label +
        "</span>";
      grid.appendChild(a);
    });
  }

  function initHero() {
    var visual = document.getElementById("vcFashionHeroVisual");
    var title = document.getElementById("vcFashionHeroTitle");
    var line = document.getElementById("vcFashionHeroLine");
    var cta = document.getElementById("vcFashionHeroCta");
    var dots = document.getElementById("vcFashionHeroDots");
    if (!visual || !title || !line || !cta || !dots) {
      return;
    }
    var active = 0;
    var timer = null;

    function paint(idx) {
      active = (idx + heroSlides.length) % heroSlides.length;
      var s = heroSlides[active];
      title.textContent = s.title;
      line.textContent = s.line;
      cta.href = s.href;
      visual.style.backgroundImage = "url('" + s.bg + "')";
      dots.innerHTML = "";
      heroSlides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "vc-fashion-hero-dot" + (i === active ? " is-active" : "");
        b.setAttribute("aria-label", "Scene " + (i + 1));
        b.addEventListener("click", function () {
          go(i, true);
        });
        dots.appendChild(b);
      });
    }

    function go(next, manual) {
      paint(next);
      if (manual && timer) {
        window.clearInterval(timer);
        timer = window.setInterval(function () {
          go(active + 1, false);
        }, 5200);
      }
    }

    paint(0);
    timer = window.setInterval(function () {
      go(active + 1, false);
    }, 5200);
  }

  function init() {
    var grid = document.getElementById("vcFashionStoreGrid");
    var micro = document.getElementById("vcFashionMicroGrid");
    var sel = document.getElementById("vcFashionRegionSelect");
    function apply() {
      var r = effectiveRegion(sel ? sel.value : "auto");
      renderStores(r, grid);
      try {
        localStorage.setItem(REGION_KEY, r);
      } catch {
        /* ignore */
      }
    }
    if (sel) {
      try {
        var saved = readRegionMode();
        if (saved && saved !== "auto") {
          sel.value = saved;
        }
      } catch {
        /* ignore */
      }
      sel.addEventListener("change", apply);
    }
    apply();
    renderMicro(micro);
    initHero();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
