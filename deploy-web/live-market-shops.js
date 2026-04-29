(function () {
  var params = new URLSearchParams(window.location.search || "");
  var requested = String(params.get("cat") || "").trim();
  var viewMode = String(params.get("view") || "").trim().toLowerCase();
  var dealMode = String(params.get("deal") || "").trim().toLowerCase();
  var topCta = document.getElementById("openFullMarketplaceTop");
  var grid = document.getElementById("liveMarketShopGrid");
  var intro = document.getElementById("liveMarketShopsIntro");
  var searchInput = document.getElementById("liveMarketShopSearch");
  var searchBtn = document.getElementById("liveMarketShopSearchBtn");
  var resetBtn = document.getElementById("liveMarketShopResetBtn");
  var searchStatus = document.getElementById("liveMarketShopSearchStatus");
  var tabsWrap = document.getElementById("liveMarketCategoryTabs");
  var regionSelect = document.getElementById("liveMarketRegionSelect");
  var disclaimerAck = document.getElementById("liveMarketDisclaimerAck");
  var fashionAssist = document.getElementById("liveMarketFashionAssist");
  var fashionAdviceBtn = document.getElementById("fashionAdviceBtn");
  var fashionShopNowBtn = document.getElementById("fashionShopNowBtn");
  var fashionAdviceOutput = document.getElementById("fashionAdviceOutput");
  var fashionTrendsRail = document.getElementById("fashionTrendsRail");
  var promoGrid = document.getElementById("livePromoGrid");
  var promoLead = document.getElementById("livePromoFeedLead");
  var promoSlider = document.getElementById("livePromoSlider");
  var promoPrevBtn = document.getElementById("livePromoPrevBtn");
  var promoNextBtn = document.getElementById("livePromoNextBtn");
  var REGION_KEY = "vibecart-market-region";

  if (!grid) return;

  var mapByRegion = {
    africa: {
      Electronics: [
        { name: "Jumia (Africa)", url: "https://www.jumia.com", promoUrl: "https://www.jumia.com/deals/", desc: "Pan-African marketplace with cross-border deal lanes." },
        { name: "Takealot", url: "https://www.takealot.com", promoUrl: "https://www.takealot.com/all?_sb=1&_r=1&_si=ec4d6f4ec6a4b1b82f7d1e4a8f9e5a6a&qsearch=deals", desc: "South Africa electronics and home tech." },
        { name: "Kilimall", url: "https://www.kilimall.co.ke", promoUrl: "https://www.kilimall.co.ke/new/flashSale", desc: "East Africa mobile-first e-commerce platform." }
      ],
      Fashion: [
        { name: "Superbalist", url: "https://www.superbalist.com", promoUrl: "https://superbalist.com/sale", desc: "South Africa fashion and lifestyle." },
        { name: "Jumia Fashion", url: "https://www.jumia.com/fashion", promoUrl: "https://www.jumia.com/fashion-by-jumia/", desc: "Fashion shops across African market lanes." },
        { name: "Konga Fashion", url: "https://www.konga.com", promoUrl: "https://www.konga.com/sale", desc: "Nigeria fashion and marketplace deals." }
      ],
      Books: [
        { name: "Exclusive Books", url: "https://www.exclusivebooks.co.za", promoUrl: "https://www.exclusivebooks.co.za/collections/deals", desc: "South Africa books and educational material." },
        { name: "Text Book Centre", url: "https://textbookcentre.com", promoUrl: "https://textbookcentre.com/promotions", desc: "Kenya book and school supply platform." },
        { name: "Jumia Books", url: "https://www.jumia.com.ng/books-movies-and-music/", promoUrl: "https://www.jumia.com.ng/books-movies-and-music/", desc: "Books category offers in major African lanes." }
      ],
      Gaming: [
        { name: "BT Games", url: "https://www.btgames.co.za", promoUrl: "https://www.btgames.co.za/specials", desc: "South Africa gaming and console store." },
        { name: "Incredible Connection Gaming", url: "https://www.incredible.co.za/gaming", promoUrl: "https://www.incredible.co.za/deals", desc: "Gaming accessories and bundles." }
      ]
    },
    za: {
      Electronics: [
        { name: "Takealot", url: "https://www.takealot.com", promoUrl: "https://www.takealot.com/all?_sb=1&_r=1&_si=ec4d6f4ec6a4b1b82f7d1e4a8f9e5a6a&qsearch=deals", desc: "South Africa electronics marketplace." },
        { name: "Incredible Connection", url: "https://www.incredible.co.za", promoUrl: "https://www.incredible.co.za/deals", desc: "South Africa computing and electronics." }
      ],
      Fashion: [
        { name: "Superbalist", url: "https://www.superbalist.com", promoUrl: "https://superbalist.com/sale", desc: "South Africa fashion marketplace." },
        { name: "Bash", url: "https://bash.com", promoUrl: "https://bash.com/sale", desc: "South Africa online fashion destination." }
      ],
      Books: [{ name: "Exclusive Books", url: "https://www.exclusivebooks.co.za", promoUrl: "https://www.exclusivebooks.co.za/collections/deals", desc: "Books and educational materials." }],
      Gaming: [{ name: "BT Games", url: "https://www.btgames.co.za", promoUrl: "https://www.btgames.co.za/specials", desc: "Gaming and console deals." }]
    },
    ke: {
      Electronics: [
        { name: "Jumia Kenya", url: "https://www.jumia.co.ke", promoUrl: "https://www.jumia.co.ke/deals/", desc: "Kenya electronics and home marketplace." },
        { name: "Kilimall Kenya", url: "https://www.kilimall.co.ke", promoUrl: "https://www.kilimall.co.ke/new/flashSale", desc: "Kenya marketplace with flash deals." }
      ],
      Fashion: [{ name: "Jumia Fashion KE", url: "https://www.jumia.co.ke/fashion", promoUrl: "https://www.jumia.co.ke/fashion-by-jumia/", desc: "Kenya fashion marketplace deals." }],
      Books: [{ name: "Text Book Centre", url: "https://textbookcentre.com", promoUrl: "https://textbookcentre.com/promotions", desc: "Books and school supply deals." }],
      Gaming: [{ name: "Jumia Gaming KE", url: "https://www.jumia.co.ke/video-games/", promoUrl: "https://www.jumia.co.ke/deals/", desc: "Gaming accessories in Kenya lanes." }]
    },
    ng: {
      Electronics: [
        { name: "Jumia Nigeria", url: "https://www.jumia.com.ng", promoUrl: "https://www.jumia.com.ng/deals/", desc: "Nigeria electronics and household goods." },
        { name: "Konga", url: "https://www.konga.com", promoUrl: "https://www.konga.com/sale", desc: "Nigeria online marketplace." }
      ],
      Fashion: [{ name: "Jumia Fashion NG", url: "https://www.jumia.com.ng/fashion", promoUrl: "https://www.jumia.com.ng/fashion-by-jumia/", desc: "Nigeria fashion offers." }],
      Books: [{ name: "Jumia Books NG", url: "https://www.jumia.com.ng/books-movies-and-music/", promoUrl: "https://www.jumia.com.ng/deals/", desc: "Books and study category promotions." }],
      Gaming: [{ name: "Konga Gaming", url: "https://www.konga.com", promoUrl: "https://www.konga.com/sale", desc: "Gaming categories on Nigeria market lanes." }]
    },
    gh: {
      Electronics: [{ name: "Jumia Ghana", url: "https://www.jumia.com.gh", promoUrl: "https://www.jumia.com.gh/deals/", desc: "Ghana electronics and marketplace deals." }],
      Fashion: [{ name: "Jumia Fashion GH", url: "https://www.jumia.com.gh/fashion", promoUrl: "https://www.jumia.com.gh/fashion-by-jumia/", desc: "Ghana fashion lane offers." }],
      Books: [{ name: "Jumia Books GH", url: "https://www.jumia.com.gh/books/", promoUrl: "https://www.jumia.com.gh/deals/", desc: "Books and learning items in Ghana lanes." }],
      Gaming: [{ name: "Jumia Gaming GH", url: "https://www.jumia.com.gh/video-games/", promoUrl: "https://www.jumia.com.gh/deals/", desc: "Gaming category deals in Ghana." }]
    },
    eg: {
      Electronics: [
        { name: "Jumia Egypt", url: "https://www.jumia.com.eg", promoUrl: "https://www.jumia.com.eg/deals/", desc: "Egypt electronics and household marketplace." },
        { name: "Noon Egypt", url: "https://www.noon.com/egypt-en/", promoUrl: "https://www.noon.com/egypt-en/deals/", desc: "Egypt e-commerce promotions and offers." }
      ],
      Fashion: [{ name: "Noon Fashion Egypt", url: "https://www.noon.com/egypt-en/fashion/", promoUrl: "https://www.noon.com/egypt-en/fashion/women/sale/", desc: "Fashion promotions in Egypt lanes." }],
      Books: [{ name: "Noon Books Egypt", url: "https://www.noon.com/egypt-en/books/", promoUrl: "https://www.noon.com/egypt-en/books/", desc: "Books and educational material in Egypt." }],
      Gaming: [{ name: "Noon Gaming Egypt", url: "https://www.noon.com/egypt-en/electronics-and-mobiles/video-games/", promoUrl: "https://www.noon.com/egypt-en/electronics-and-mobiles/video-games/", desc: "Gaming products and bundles." }]
    },
    ma: {
      Electronics: [{ name: "Jumia Morocco", url: "https://www.jumia.ma", promoUrl: "https://www.jumia.ma/deals/", desc: "Morocco electronics and marketplace offers." }],
      Fashion: [{ name: "Jumia Fashion MA", url: "https://www.jumia.ma/fashion", promoUrl: "https://www.jumia.ma/fashion-by-jumia/", desc: "Morocco fashion deal lanes." }],
      Books: [{ name: "Jumia Books MA", url: "https://www.jumia.ma/books/", promoUrl: "https://www.jumia.ma/deals/", desc: "Morocco books and study lanes." }],
      Gaming: [{ name: "Jumia Gaming MA", url: "https://www.jumia.ma/video-games/", promoUrl: "https://www.jumia.ma/deals/", desc: "Gaming deals in Morocco market." }]
    },
    zw: {
      Electronics: [{ name: "Amazon Electronics", url: "https://www.amazon.com/electronics", promoUrl: "https://www.amazon.com/gp/goldbox", desc: "Global electronics with Zimbabwe-compatible delivery lanes." }],
      Fashion: [{ name: "SHEIN", url: "https://www.shein.com", promoUrl: "https://www.shein.com/campaigns/sale", desc: "Global fashion promotions." }],
      Books: [{ name: "AbeBooks", url: "https://www.abebooks.com", promoUrl: "https://www.abebooks.com/books/bestsellers/", desc: "Books and textbooks across global routes." }],
      Gaming: [{ name: "Steam Store", url: "https://store.steampowered.com", promoUrl: "https://store.steampowered.com/specials/", desc: "PC gaming storefront." }]
    },
    eu: {
      Electronics: [
        { name: "Amazon Germany", url: "https://www.amazon.de", promoUrl: "https://www.amazon.de/gp/goldbox", desc: "EU electronics and creator gear." },
        { name: "MediaMarkt", url: "https://www.mediamarkt.de", promoUrl: "https://www.mediamarkt.de/de/category/deals-478.html", desc: "Electronics in Germany and EU." }
      ],
      Fashion: [
        { name: "Zalando", url: "https://www.zalando.com", promoUrl: "https://www.zalando.com/sale/", desc: "EU fashion and lifestyle." },
        { name: "ASOS", url: "https://www.asos.com", promoUrl: "https://www.asos.com/women/sale/cat/", desc: "EU youth fashion." },
        { name: "Zara", url: "https://www.zara.com", promoUrl: "https://www.zara.com/ww/en/sale-l1180.html", desc: "Global Zara sale lane for EU shoppers." },
        { name: "H&M", url: "https://www2.hm.com", promoUrl: "https://www2.hm.com/en_eur/sale.html", desc: "H&M seasonal promotions in EU lanes." },
        { name: "SHEIN", url: "https://www.shein.com", promoUrl: "https://www.shein.com/campaigns/sale", desc: "Fast-fashion flash campaigns." }
      ],
      Books: [
        { name: "Empik", url: "https://www.empik.com", promoUrl: "https://www.empik.com/promocje", desc: "Books and study resources in Poland." },
        { name: "Notino", url: "https://www.notino.com", promoUrl: "https://www.notino.com/sale/", desc: "Beauty and fragrance discounts popular across EU markets." }
      ],
      Gaming: [{ name: "Steam Store", url: "https://store.steampowered.com", promoUrl: "https://store.steampowered.com/specials/", desc: "EU gaming demand and bundles." }]
    },
    gulf: {
      Electronics: [{ name: "Noon", url: "https://www.noon.com", promoUrl: "https://www.noon.com/uae-en/deals/", desc: "Gulf electronics and gadget demand." }],
      Fashion: [{ name: "Namshi", url: "https://en-ae.namshi.com", promoUrl: "https://en-ae.namshi.com/women-sale/", desc: "Gulf fashion and lifestyle." }],
      Books: [{ name: "Amazon UAE Books", url: "https://www.amazon.ae/books-used-books-textbooks", promoUrl: "https://www.amazon.ae/gp/goldbox", desc: "UAE books and personal development." }],
      Gaming: [{ name: "Virgin Megastore UAE", url: "https://www.virginmegastore.ae", promoUrl: "https://www.virginmegastore.ae/en/gaming/c/n0403", desc: "Gaming and entertainment in UAE." }]
    },
    asia: {
      Electronics: [
        { name: "Shopee", url: "https://shopee.sg", promoUrl: "https://shopee.sg/m/flash-deals", desc: "Asia mobile electronics demand." },
        { name: "Lazada", url: "https://www.lazada.sg", promoUrl: "https://www.lazada.sg/shop-electronics/", desc: "Southeast Asia electronics marketplace." }
      ],
      Fashion: [
        { name: "SHEIN", url: "https://www.shein.com", promoUrl: "https://www.shein.com/campaigns/sale", desc: "Asia-driven fast fashion trends." },
        { name: "Zara", url: "https://www.zara.com", promoUrl: "https://www.zara.com/ww/en/sale-l1180.html", desc: "Zara global sale lane for Asia shoppers." },
        { name: "H&M", url: "https://www2.hm.com", promoUrl: "https://www2.hm.com/en_asia/sale.html", desc: "H&M markdown lane in Asia routes." }
      ],
      Books: [{ name: "Rakuten Books", url: "https://books.rakuten.co.jp", promoUrl: "https://books.rakuten.co.jp/event/book/", desc: "Japan books and manga." }],
      Gaming: [{ name: "Steam Store", url: "https://store.steampowered.com", promoUrl: "https://store.steampowered.com/specials/", desc: "Asia regional gaming demand." }]
    },
    global: {
      Electronics: [{ name: "Amazon Electronics", url: "https://www.amazon.com/s?i=electronics", promoUrl: "https://www.amazon.com/gp/goldbox", desc: "Global electronics marketplace." }],
      Fashion: [
        { name: "ASOS", url: "https://www.asos.com", promoUrl: "https://www.asos.com/women/sale/cat/", desc: "Global youth fashion." },
        { name: "SHEIN", url: "https://www.shein.com", promoUrl: "https://www.shein.com/campaigns/sale", desc: "Global fashion promotions and coupons." },
        { name: "Zara", url: "https://www.zara.com", promoUrl: "https://www.zara.com/ww/en/sale-l1180.html", desc: "Global Zara sale lane." },
        { name: "H&M", url: "https://www2.hm.com", promoUrl: "https://www2.hm.com/en_gb/sale.html", desc: "H&M global markdown lane." }
      ],
      Books: [
        { name: "AbeBooks", url: "https://www.abebooks.com", promoUrl: "https://www.abebooks.com/books/bestsellers/", desc: "Global books and textbooks." },
        { name: "Notino", url: "https://www.notino.com", promoUrl: "https://www.notino.com/sale/", desc: "Global beauty and fragrance sale lane." }
      ],
      Gaming: [{ name: "Steam Store", url: "https://store.steampowered.com", promoUrl: "https://store.steampowered.com/specials/", desc: "Global gaming marketplace." }]
    }
  };

  function inferRegionFromTimezone() {
    try {
      var tz = String((Intl.DateTimeFormat().resolvedOptions().timeZone || "")).toLowerCase();
      if (tz.indexOf("johannesburg") >= 0 || tz.indexOf("cape_town") >= 0) return "za";
      if (tz.indexOf("nairobi") >= 0) return "ke";
      if (tz.indexOf("lagos") >= 0) return "ng";
      if (tz.indexOf("accra") >= 0) return "gh";
      if (tz.indexOf("cairo") >= 0) return "eg";
      if (tz.indexOf("casablanca") >= 0) return "ma";
      if (tz.indexOf("harare") >= 0) return "zw";
      if (tz.indexOf("warsaw") >= 0 || tz.indexOf("berlin") >= 0 || tz.indexOf("london") >= 0 || tz.indexOf("paris") >= 0) return "eu";
      if (tz.indexOf("dubai") >= 0 || tz.indexOf("riyadh") >= 0) return "gulf";
      if (tz.indexOf("tokyo") >= 0 || tz.indexOf("singapore") >= 0 || tz.indexOf("seoul") >= 0 || tz.indexOf("kolkata") >= 0) return "asia";
    } catch {
      /* ignore */
    }
    return "africa";
  }

  function getStoredAuthUser() {
    try {
      var PUBLIC_AUTH_TOKEN_KEY = "vibecart-public-auth-token";
      var PUBLIC_AUTH_USER_KEY = "vibecart-public-auth-user";
      var token = String(localStorage.getItem(PUBLIC_AUTH_TOKEN_KEY) || "").trim();
      var rawUser = localStorage.getItem(PUBLIC_AUTH_USER_KEY);
      var user = rawUser ? JSON.parse(rawUser) : null;
      return { token: token, user: user };
    } catch {
      return { token: "", user: null };
    }
  }

  function inferCountryCode() {
    try {
      var auth = getStoredAuthUser();
      var fromAuth = String((auth && auth.user && auth.user.countryCode) || "").trim().toUpperCase();
      if (fromAuth.length === 2) return fromAuth;
    } catch {
      /* ignore */
    }
    try {
      var lang = String((navigator.language || (Array.isArray(navigator.languages) && navigator.languages[0]) || "")).toUpperCase();
      var m = lang.match(/-([A-Z]{2})$/);
      if (m && m[1]) return m[1];
    } catch {
      /* ignore */
    }
    try {
      var tz = String((Intl.DateTimeFormat().resolvedOptions().timeZone || "")).toLowerCase();
      if (tz.indexOf("johannesburg") >= 0 || tz.indexOf("cape_town") >= 0) return "ZA";
      if (tz.indexOf("nairobi") >= 0) return "KE";
      if (tz.indexOf("lagos") >= 0) return "NG";
      if (tz.indexOf("accra") >= 0) return "GH";
      if (tz.indexOf("cairo") >= 0) return "EG";
      if (tz.indexOf("casablanca") >= 0) return "MA";
      if (tz.indexOf("harare") >= 0) return "ZW";
      if (tz.indexOf("warsaw") >= 0) return "PL";
      if (tz.indexOf("berlin") >= 0) return "DE";
      if (tz.indexOf("london") >= 0) return "GB";
      if (tz.indexOf("paris") >= 0) return "FR";
      if (tz.indexOf("dubai") >= 0) return "AE";
      if (tz.indexOf("riyadh") >= 0) return "SA";
      if (tz.indexOf("tokyo") >= 0) return "JP";
      if (tz.indexOf("singapore") >= 0) return "SG";
      if (tz.indexOf("seoul") >= 0) return "KR";
      if (tz.indexOf("kolkata") >= 0) return "IN";
    } catch {
      /* ignore */
    }
    return "";
  }

  function inferRegionFromCountryCode(countryCode) {
    var cc = String(countryCode || "").trim().toUpperCase();
    if (!cc || cc.length !== 2) return "";

    switch (cc) {
      case "ZA":
        return "za";
      case "KE":
        return "ke";
      case "NG":
        return "ng";
      case "GH":
        return "gh";
      case "ZW":
        return "zw";
      case "EG":
        return "eg";
      case "MA":
        return "ma";
      // Gulf
      case "AE":
      case "SA":
      case "KW":
      case "QA":
      case "BH":
      case "OM":
        return "gulf";
      // Asia
      case "SG":
      case "JP":
      case "KR":
      case "HK":
      case "IN":
      case "MY":
      case "ID":
      case "PH":
      case "TH":
      case "VN":
      case "CN":
        return "asia";
    }

    // EU/UK-ish approximation used by the existing shop promo pools.
    var EU_CODES = ["PL", "DE", "FR", "GB", "IE", "NL", "ES", "SE", "NO", "DK", "IT", "AT", "CH", "BE", "LU", "CZ", "HU", "RO", "BG", "HR", "GR"];
    if (EU_CODES.indexOf(cc) >= 0) return "eu";
    return "";
  }

  function readRegionMode() {
    try {
      return String(localStorage.getItem(REGION_KEY) || "auto").trim().toLowerCase() || "auto";
    } catch {
      return "auto";
    }
  }
  function writeRegionMode(mode) {
    try {
      localStorage.setItem(REGION_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  var regionMode = readRegionMode();
  var inferredCountryCode = inferCountryCode();
  var countryMappedRegion = inferRegionFromCountryCode(inferredCountryCode);
  var resolvedRegion = regionMode === "auto"
    ? (countryMappedRegion || inferRegionFromTimezone() || "global")
    : regionMode;
  var regionResolveSource = regionMode === "auto"
    ? (countryMappedRegion ? "country" : "timezone")
    : "manual";
  var map = mapByRegion[resolvedRegion] || mapByRegion.global;
  var categories = Object.keys(map);
  var cat = requested === "All" ? "All" : categories.indexOf(requested) >= 0 ? requested : "Electronics";
  if (dealMode === "fashion") cat = "Fashion";
  if (dealMode === "electronics") cat = "Electronics";
  if (dealMode === "books") cat = "Books";

  function renderRegionResolutionHint() {
    if (!regionSelect) return;
    var host = document.getElementById("liveMarketRegionHint");
    if (!host) {
      host = document.createElement("p");
      host.id = "liveMarketRegionHint";
      host.className = "note";
      regionSelect.insertAdjacentElement("afterend", host);
    }
    var sourceLabel =
      regionResolveSource === "manual"
        ? "manual selection"
        : regionResolveSource === "country"
          ? "country detection"
          : "timezone fallback";
    var countryLabel = inferredCountryCode ? (" · country " + inferredCountryCode) : "";
    host.textContent =
      "Region auto-resolution: " +
      String(resolvedRegion || "global").toUpperCase() +
      " (" +
      sourceLabel +
      countryLabel +
      "). Change the Market region selector to override.";
  }

  function extractHost(url) {
    try {
      return String(new URL(url).hostname || "").toLowerCase();
    } catch {
      return "";
    }
  }

  function isTrustedShopUrl(url) {
    try {
      var parsed = new URL(String(url || ""));
      return /^https?:$/i.test(parsed.protocol);
    } catch {
      return false;
    }
  }

  function scoreEntry(entry) {
    var name = String(entry.shop.name || "").toLowerCase();
    var trust = /jumia|takealot|amazon|asos|zalando|steam|noon|lazada|shopee|konga|superbalist|empik/.test(name) ? 5 : 3;
    var speed = /deals|sale|flash|goldbox|specials/.test(String(entry.shop.promoUrl || "").toLowerCase()) ? 4 : 2;
    return { trust: trust, speed: speed, total: trust * 3 + speed * 2 };
  }

  function rankEntries(items) {
    return items.slice().sort(function (a, b) {
      var sa = scoreEntry(a);
      var sb = scoreEntry(b);
      if (sb.total !== sa.total) return sb.total - sa.total;
      return String(a.shop.name || "").localeCompare(String(b.shop.name || ""));
    });
  }

  function buildShopLink(shop, category) {
    var a = document.createElement("a");
    a.className = "shop";
    var trusted = isTrustedShopUrl(shop.url);
    a.href = trusted ? String(shop.url || "#") : "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (!trusted) a.classList.add("is-disabled");

    var logo = document.createElement("img");
    logo.className = "shop-logo";
    logo.alt = shop.name + " logo";
    logo.loading = "lazy";
    logo.decoding = "async";
    var host = extractHost(shop.url);
    var initials = String(shop.name || "VC")
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (part) { return String(part).charAt(0).toUpperCase(); })
      .join("") || "VC";
    var placeholderSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='100%' height='100%' rx='16' fill='%23111b37'/><text x='50%' y='56%' text-anchor='middle' font-size='34' font-family='Arial,sans-serif' fill='%23f9b233'>" +
          initials +
          "</text></svg>"
      );
    logo.src = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host || "vibe-cart.com") + "&sz=128";
    logo.onerror = function () {
      logo.src = placeholderSvg;
      logo.onerror = null;
    };

    var title = document.createElement("h3");
    title.textContent = shop.name;
    var body = document.createElement("p");
    body.textContent = shop.desc + " · Opens official shop directly.";
    var meta = document.createElement("p");
    meta.className = "shop-meta-badges";
    meta.textContent = "Trusted lane · " + category;

    a.appendChild(logo);
    a.appendChild(title);
    a.appendChild(body);
    a.appendChild(meta);
    a.addEventListener("click", function (event) {
      if (!trusted) {
        event.preventDefault();
        if (searchStatus) searchStatus.textContent = "This listing link is unavailable.";
        return;
      }
      var targetUrl = String(shop.url || "").trim();
      var redirectedHref =
        "/api/public/shop/redirect?shop=" +
        encodeURIComponent(String(shop.name || "Shop")) +
        "&cat=" +
        encodeURIComponent(String(category || "All")) +
        "&partner=" +
        encodeURIComponent(String(shop.name || "Shop")) +
        "&target=" +
        encodeURIComponent(targetUrl);
      a.href = redirectedHref;
      if (disclaimerAck && !disclaimerAck.checked) {
        if (searchStatus) searchStatus.textContent = "Tip: tick the marketplace disclaimer for safer buying guidance.";
      }
    });
    return a;
  }

  function updatePromoButtons() {
    if (!promoSlider || !promoPrevBtn || !promoNextBtn) return;
    var atStart = promoSlider.scrollLeft <= 0;
    var atEnd = promoSlider.scrollLeft + promoSlider.clientWidth >= promoSlider.scrollWidth - 4;
    promoPrevBtn.disabled = atStart;
    promoNextBtn.disabled = atEnd;
  }

  function renderPromoFeed(items, activeCategory) {
    if (!promoGrid) return;
    var promoImages = {
      Fashion: [
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&h=560&q=78",
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&h=560&q=78"
      ],
      Electronics: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&h=560&q=78",
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&h=560&q=78"
      ],
      Books: [
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&h=560&q=78",
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&h=560&q=78"
      ],
      Gaming: [
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&h=560&q=78",
        "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&h=560&q=78"
      ]
    };
    var promos = items.slice(0, 8).map(function (entry, idx) {
      var categoryImages = promoImages[entry.category] || promoImages[activeCategory] || promoImages.Gaming;
      var hint =
        /goldbox|deals|sale|special/i.test(String(entry.shop.promoUrl || ""))
          ? "Up to 50% off"
          : "Featured promotion";
      return {
        shop: entry.shop.name,
        category: entry.category,
        shopUrl: entry.shop.url,
        promoUrl: entry.shop.promoUrl || entry.shop.url,
        discountHint: hint,
        image: categoryImages[idx % categoryImages.length]
      };
    });
    promoGrid.innerHTML = "";
    promos.forEach(function (promo) {
      var card = document.createElement("article");
      card.className = "vc-promo-card";
      var promoTarget = String(promo.promoUrl || promo.shopUrl || "").trim();
      var promoHref =
        "/api/public/shop/redirect?shop=" +
        encodeURIComponent(String(promo.shop || "Shop")) +
        "&cat=" +
        encodeURIComponent(String(promo.category || "All")) +
        "&partner=" +
        encodeURIComponent(String(promo.shop || "Shop")) +
        "&target=" +
        encodeURIComponent(promoTarget);
      card.innerHTML =
        "<img src='" + promo.image + "' alt='" + promo.shop + " promotion image' loading='lazy' />" +
        "<div class='vc-promo-card-copy'>" +
        "<p class='vc-promo-kicker'>Live promo lane · " + promo.category + "</p>" +
        "<h3>" + promo.shop + " deals</h3>" +
        "<p class='vc-promo-kicker'>" + promo.discountHint + "</p>" +
        "<p>Direct link to the active promotion/deals section.</p>" +
        "<a class='btn btn-secondary' target='_blank' rel='noopener noreferrer' href='" + promoHref + "'>Open live promotion page</a>" +
        "</div>";
      promoGrid.appendChild(card);
    });
    if (promoSlider) {
      promoSlider.scrollLeft = 0;
      updatePromoButtons();
    }
    if (promoLead) {
      promoLead.textContent = "Direct official promo sections for " + activeCategory + ". No fake generated discounts.";
    }
  }

  function listForCategory(category) {
    if (category === "All") {
      var all = [];
      categories.forEach(function (c) {
        (map[c] || []).forEach(function (shop) {
          all.push({ shop: shop, category: c });
        });
      });
      return all;
    }
    return (map[category] || []).map(function (shop) {
      return { shop: shop, category: category };
    });
  }

  function listAcrossWorld(category) {
    var merged = [];
    Object.keys(mapByRegion).forEach(function (regionKey) {
      var regionMap = mapByRegion[regionKey] || {};
      if (category === "All") {
        Object.keys(regionMap).forEach(function (catKey) {
          (regionMap[catKey] || []).forEach(function (shop) {
            merged.push({ shop: shop, category: catKey });
          });
        });
      } else {
        (regionMap[category] || []).forEach(function (shop) {
          merged.push({ shop: shop, category: category });
        });
      }
    });
    var seen = {};
    return merged.filter(function (entry) {
      var key = String(entry.shop.name || "") + "::" + String(entry.shop.url || "");
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function currentListFor(category) {
    var raw = viewMode === "global" ? listAcrossWorld(category) : listForCategory(category);
    return rankEntries(raw);
  }

  function paintCategoryUi(active) {
    if (intro) {
      intro.textContent =
        "Live market shops for " + active + (viewMode === "global" ? " across world lanes." : ".") + " Real shops only.";
    }
    if (topCta) {
      topCta.setAttribute("href", "./live-market-shops.html?cat=All&view=global");
      topCta.textContent = "Open global live marketplace";
    }
    if (tabsWrap) {
      Array.prototype.slice.call(tabsWrap.querySelectorAll("[data-live-cat]")).forEach(function (btn) {
        var isActive = String(btn.getAttribute("data-live-cat") || "") === active;
        btn.classList.toggle("btn-primary", isActive);
        btn.classList.toggle("btn-secondary", !isActive);
      });
    }
    if (regionSelect) regionSelect.value = regionMode;
    if (fashionAssist) {
      fashionAssist.classList.toggle("hidden", active !== "Fashion");
    }
  }

  function renderList(items, message) {
    grid.innerHTML = "";
    if (!items.length) {
      if (searchStatus) searchStatus.textContent = message || "No shops found for that search.";
      renderPromoFeed([], cat);
      return;
    }
    items.forEach(function (entry) {
      grid.appendChild(buildShopLink(entry.shop, entry.category));
    });
    renderPromoFeed(items, cat);
    if (searchStatus) searchStatus.textContent = message || ("Showing " + items.length + " shop result(s).");
  }

  function runSearch() {
    var q = String((searchInput && searchInput.value) || "").trim().toLowerCase();
    if (!q) {
      renderList(currentListFor(cat), "Showing " + cat + " shops" + (viewMode === "global" ? " from global lanes." : "."));
      return;
    }
    var all = currentListFor("All");
    var matches = all.filter(function (entry) {
      var hay = (entry.shop.name + " " + entry.shop.desc + " " + entry.category).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    renderList(matches, matches.length ? ("Search '" + q + "': " + matches.length + " result(s).") : ("No shop found for '" + q + "'."));
  }

  if (tabsWrap) {
    Array.prototype.slice.call(tabsWrap.querySelectorAll("[data-live-cat]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = String(btn.getAttribute("data-live-cat") || "").trim();
        if (!next || (next !== "All" && categories.indexOf(next) < 0)) return;
        cat = next;
        if (searchInput) searchInput.value = "";
        paintCategoryUi(cat);
        renderList(currentListFor(cat), "Showing " + cat + " shops" + (viewMode === "global" ? " from global lanes." : "."));
        try {
          var url = new URL(window.location.href);
          url.searchParams.set("cat", cat);
          history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
        } catch {
          /* ignore */
        }
      });
    });
  }

  paintCategoryUi(cat);
  renderRegionResolutionHint();
  renderList(currentListFor(cat), "Showing " + cat + " shops" + (viewMode === "global" ? " from global lanes." : "."));

  if (regionSelect) {
    regionSelect.value = regionMode;
    regionSelect.addEventListener("change", function () {
      var next = String(regionSelect.value || "auto").trim().toLowerCase();
      writeRegionMode(next);
      window.location.reload();
    });
  }
  if (searchBtn) searchBtn.addEventListener("click", runSearch);
  if (searchInput) {
    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        runSearch();
      }
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      renderList(currentListFor(cat), "Showing " + cat + " shops" + (viewMode === "global" ? " from global lanes." : "."));
    });
  }
  if (promoPrevBtn && promoSlider) {
    promoPrevBtn.addEventListener("click", function () {
      promoSlider.scrollBy({ left: -280, behavior: "smooth" });
      setTimeout(updatePromoButtons, 240);
    });
  }
  if (promoNextBtn && promoSlider) {
    promoNextBtn.addEventListener("click", function () {
      promoSlider.scrollBy({ left: 280, behavior: "smooth" });
      setTimeout(updatePromoButtons, 240);
    });
    promoSlider.addEventListener("scroll", updatePromoButtons, { passive: true });
  }
  if (fashionAdviceBtn) {
    fashionAdviceBtn.addEventListener("click", function () {
      if (fashionAdviceOutput) {
        fashionAdviceOutput.textContent = "For cross-border fashion value: check sale lane, shipping policy, return terms, and size chart before checkout.";
      }
    });
  }
  if (fashionShopNowBtn) {
    fashionShopNowBtn.addEventListener("click", function () {
      cat = "Fashion";
      paintCategoryUi(cat);
      renderList(currentListFor(cat), "Showing Fashion shops" + (viewMode === "global" ? " from global lanes." : "."));
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  if (fashionTrendsRail) {
    fashionTrendsRail.innerHTML =
      "<a class='vc-fashion-trend-link' target='_blank' rel='noopener noreferrer' href='https://superbalist.com/sale'><img loading='lazy' src='https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=540&h=340&q=75' alt='African fashion deals' /><span>African fashion deals</span></a>" +
      "<a class='vc-fashion-trend-link' target='_blank' rel='noopener noreferrer' href='https://www.zalando.com/sale/'><img loading='lazy' src='https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=540&h=340&q=75' alt='EU sale lane' /><span>EU sale lane</span></a>";
  }
})();
