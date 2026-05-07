(function () {
  var AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
  var BRIDGE_REF_SESSION_KEY = "vibecart-bridge-ref-v1";

  function captureBridgeRefFromUrl() {
    try {
      var sp = new URLSearchParams(window.location.search || "");
      var r = String(sp.get("ref") || "").trim().slice(0, 80);
      if (r) sessionStorage.setItem(BRIDGE_REF_SESSION_KEY, r);
    } catch {
      /* ignore */
    }
  }

  function bridgeRefForLinks() {
    try {
      var sp = new URLSearchParams(window.location.search || "");
      var r = String(sp.get("ref") || "").trim().slice(0, 80);
      if (r) return r;
    } catch {
      /* ignore */
    }
    try {
      return String(sessionStorage.getItem(BRIDGE_REF_SESSION_KEY) || "").trim().slice(0, 80);
    } catch {
      return "";
    }
  }

  captureBridgeRefFromUrl();
  var params = new URLSearchParams(window.location.search || "");
  var requested = String(params.get("cat") || "").trim();
  var topCta = document.getElementById("openFullMarketplaceTop");
  var grid = document.getElementById("liveMarketShopGrid");
  var vcGrid = document.getElementById("liveMarketVcGrid");
  var vcStatus = document.getElementById("liveMarketVcStatus");
  var vcTitle = document.getElementById("liveMarketVcTitle");
  var vcLead = document.getElementById("liveMarketVcLead");
  var dealContextRailWrap = document.getElementById("dealContextRailWrap");
  var dealContextRailLabel = document.getElementById("dealContextRailLabel");
  var dealContextRail = document.getElementById("dealContextRail");
  var gateNote = document.getElementById("liveMarketDisclaimerGateNote");
  var intro = document.getElementById("liveMarketShopsIntro");
  var searchInput = document.getElementById("liveMarketShopSearch");
  var searchBtn = document.getElementById("liveMarketShopSearchBtn");
  var resetBtn = document.getElementById("liveMarketShopResetBtn");
  var searchStatus = document.getElementById("liveMarketShopSearchStatus");
  var worldwideHint = document.getElementById("liveMarketWorldwideHint");
  var tabsWrap = document.getElementById("liveMarketCategoryTabs");
  var regionSelect = document.getElementById("liveMarketRegionSelect");
  var disclaimerAck = document.getElementById("liveMarketDisclaimerAck");
  var fashionAssist = document.getElementById("liveMarketFashionAssist");
  var fashionAdviceBtn = document.getElementById("fashionAdviceBtn");
  var fashionShopNowBtn = document.getElementById("fashionShopNowBtn");
  var fashionAdviceOutput = document.getElementById("fashionAdviceOutput");
  var fashionTrendsRail = document.getElementById("fashionTrendsRail");
  var REGION_KEY = "vibecart-market-region";
  var mapByRegion = {
    eu: {
      Electronics: [
        { name: "Amazon Germany", url: "https://www.amazon.de", desc: "EU electronics and creator gear." },
        { name: "MediaMarkt", url: "https://www.mediamarkt.de", desc: "Electronics in Germany and EU." },
        { name: "Currys", url: "https://www.currys.co.uk", desc: "UK electronics and accessories." },
        { name: "RTV Euro AGD", url: "https://www.euro.com.pl", desc: "Poland electronics marketplace." }
      ],
      Fashion: [
        { name: "Zalando", url: "https://www.zalando.com", desc: "EU fashion and lifestyle." },
        { name: "Primark", url: "https://www.primark.com", desc: "High-street fashion — choose your country on site." },
        { name: "Zara", url: "https://www.zara.com", desc: "Inditex flagship — pick your market at checkout." },
        { name: "SHEIN EU", url: "https://eu.shein.com", desc: "EU storefront for SHEIN." },
        { name: "Notino", url: "https://www.notino.com", desc: "Beauty, fragrance, and skincare." },
        { name: "Reserved", url: "https://www.reserved.com", desc: "Central EU fashion brand." },
        { name: "About You", url: "https://www.aboutyou.com", desc: "Germany-based style platform." },
        { name: "Allegro Fashion", url: "https://allegro.pl", desc: "Poland fashion sellers." }
      ],
      Books: [
        { name: "Empik", url: "https://www.empik.com", desc: "Books and study resources in Poland." },
        { name: "Fnac", url: "https://www.fnac.com", desc: "France books and media." },
        { name: "Bol Books", url: "https://www.bol.com", desc: "Benelux books and learning content." },
        { name: "Allegro Books", url: "https://allegro.pl", desc: "Regional book listings in Poland." }
      ],
      Gaming: [
        { name: "Steam Store", url: "https://store.steampowered.com", desc: "EU gaming demand and bundles." },
        { name: "PlayStation Store", url: "https://store.playstation.com", desc: "Console titles and add-ons." },
        { name: "Xbox", url: "https://www.xbox.com", desc: "Xbox games and subscriptions." },
        { name: "GOG", url: "https://www.gog.com", desc: "Poland-based DRM-free games." }
      ]
    },
    ie: {
      Electronics: [
        { name: "Amazon Ireland", url: "https://www.amazon.ie", desc: "Republic of Ireland — electronics, tech, and home." },
        { name: "Currys Ireland", url: "https://www.currys.ie", desc: "IE — laptops, TVs, appliances, and accessories." },
        { name: "DID Electrical", url: "https://www.did.ie", desc: "Ireland — electrical and tech retail." },
        { name: "Harvey Norman Ireland", url: "https://www.harveynorman.ie", desc: "IE — computers, gaming, and home tech." },
        { name: "Argos Ireland", url: "https://www.argos.ie", desc: "IE — click-and-collect tech and home." },
        { name: "Currys UK (NI)", url: "https://www.currys.co.uk", desc: "Northern Ireland / UK — electronics (many NI shoppers use UK routes)." }
      ],
      Fashion: [
        { name: "Brown Thomas", url: "https://www.brownthomas.com", desc: "Ireland — luxury fashion, beauty, and gifts." },
        { name: "Dunnes Stores", url: "https://www.dunnesstores.com", desc: "All-island favourite — fashion, home, and groceries online." },
        { name: "Primark Ireland", url: "https://www.primark.com/en-ie", desc: "IE — high-street fashion and basics." },
        { name: "Littlewoods Ireland", url: "https://www.littlewoodsireland.ie", desc: "IE — fashion, home, and pay-spread options." },
        { name: "ASOS", url: "https://www.asos.com", desc: "Delivers to Ireland and Northern Ireland — global youth fashion." },
        { name: "Zalando", url: "https://www.zalando.ie", desc: "IE storefront — EU fashion marketplace." }
      ],
      Books: [
        { name: "Eason", url: "https://www.easons.com", desc: "Ireland — books, study, and gifts (ROI + NI delivery where offered)." },
        { name: "Kennys Bookshop", url: "https://www.kennys.ie", desc: "Galway — independent books and world shipping." },
        { name: "Dubray Books", url: "https://www.dubraybooks.ie", desc: "Ireland — curated reads and gifts." },
        { name: "O'Mahony's Books", url: "https://www.omahonys.ie", desc: "Ireland — academic and general books." },
        { name: "Waterstones", url: "https://www.waterstones.com", desc: "UK — many titles ship to Northern Ireland and Ireland; check checkout." }
      ],
      Gaming: [
        { name: "Smyths Toys Ireland", url: "https://www.smythstoys.com/ie", desc: "IE — consoles, games, and toys." },
        { name: "GameStop Ireland", url: "https://www.gamestop.ie", desc: "IE — games, merch, and pre-orders." },
        { name: "Steam Store", url: "https://store.steampowered.com", desc: "PC games — works everywhere on the island." },
        { name: "Currys Gaming IE", url: "https://www.currys.ie/gaming", desc: "IE — consoles, accessories, and PC gaming." }
      ]
    },
    za: {
      Electronics: [
        { name: "Takealot Tech", url: "https://www.takealot.com", desc: "South Africa tech and accessories." },
        { name: "Incredible Connection", url: "https://www.incredible.co.za", desc: "South Africa computing and electronics." },
        { name: "Game South Africa", url: "https://www.game.co.za", desc: "Electronics and appliances in South Africa." }
      ],
      Fashion: [
        { name: "Superbalist", url: "https://www.superbalist.com", desc: "South Africa youth fashion." },
        { name: "H&M South Africa", url: "https://www.hm.com/za", desc: "South Africa fashion storefront." },
        { name: "Zara South Africa", url: "https://www.zara.com/za/", desc: "South Africa seasonal drops." },
        { name: "SHEIN", url: "https://www.shein.com", desc: "Global fast fashion — delivers to ZA where offered." },
        { name: "Primark", url: "https://www.primark.com", desc: "Browse online — Primark ships from UK/EU where available." }
      ],
      Books: [
        { name: "Takealot Books", url: "https://www.takealot.com", desc: "South Africa books and study sets." },
        { name: "Exclusive Books", url: "https://www.exclusivebooks.co.za", desc: "South Africa books and education." }
      ],
      Gaming: [
        { name: "BT Games", url: "https://www.btgames.co.za", desc: "South Africa games and consoles." },
        { name: "Game South Africa", url: "https://www.game.co.za", desc: "Gaming accessories and deals." }
      ]
    },
    ke: {
      Electronics: [
        { name: "Jumia Kenya", url: "https://www.jumia.co.ke", desc: "Kenya electronics and mobile-first deals." },
        { name: "Kilimall Kenya", url: "https://www.kilimall.co.ke", desc: "Kenya online electronics marketplace." }
      ],
      Fashion: [
        { name: "Jumia Fashion KE", url: "https://www.jumia.co.ke", desc: "Kenya fashion listings." },
        { name: "Kilimall Fashion KE", url: "https://www.kilimall.co.ke", desc: "Kenya youth fashion options." }
      ],
      Books: [
        { name: "Nuria Kenya", url: "https://nuriakenya.com", desc: "Kenya books and educational resources." },
        { name: "Text Book Centre", url: "https://textbookcentre.com", desc: "Kenya books and school materials." }
      ],
      Gaming: [
        { name: "Jumia Gaming KE", url: "https://www.jumia.co.ke", desc: "Kenya gaming accessories." },
        { name: "Kilimall Gaming KE", url: "https://www.kilimall.co.ke", desc: "Kenya gaming product listings." }
      ]
    },
    zw: {
      Electronics: [
        { name: "Amazon Electronics", url: "https://www.amazon.com/electronics", desc: "Global electronics with broad shipping options." },
        { name: "AliExpress Electronics", url: "https://www.aliexpress.com/category/44/consumer-electronics.html", desc: "Global electronics marketplace." }
      ],
      Fashion: [
        { name: "Zara", url: "https://www.zara.com", desc: "Global seasonal fashion drops." },
        { name: "SHEIN", url: "https://www.shein.com", desc: "Youth fashion and trend picks." },
        { name: "Notino", url: "https://www.notino.com", desc: "Beauty and fragrance — check shipping to your country." },
        { name: "Primark", url: "https://www.primark.com", desc: "Value fashion hub — ships where offered." }
      ],
      Books: [
        { name: "Amazon Books", url: "https://www.amazon.com/books-used-books-textbooks", desc: "Books and study resources." },
        { name: "AbeBooks", url: "https://www.abebooks.com", desc: "Global books and textbooks." }
      ],
      Gaming: [
        { name: "Steam Store", url: "https://store.steampowered.com", desc: "PC gaming storefront." },
        { name: "PlayStation Store", url: "https://store.playstation.com", desc: "Console titles and add-ons." }
      ]
    },
    gulf: {
      Electronics: [
        { name: "Noon Tech", url: "https://www.noon.com", desc: "Gulf electronics and gadget demand." },
        { name: "Sharaf DG UAE", url: "https://uae.sharafdg.com", desc: "UAE electronics store." },
        { name: "Amazon UAE Electronics", url: "https://www.amazon.ae", desc: "UAE online electronics catalog." }
      ],
      Fashion: [
        { name: "Namshi", url: "https://en-ae.namshi.com", desc: "Gulf fashion and lifestyle." },
        { name: "Noon Fashion", url: "https://www.noon.com/uae-en/fashion", desc: "UAE fashion listings." },
        { name: "SHEIN", url: "https://www.shein.com", desc: "Delivers to many Gulf addresses — check checkout." },
        { name: "Primark", url: "https://www.primark.com", desc: "Order where international delivery is offered." }
      ],
      Books: [
        { name: "Amazon UAE Books", url: "https://www.amazon.ae", desc: "UAE books and personal development." },
        { name: "Kinokuniya UAE", url: "https://uae.kinokuniya.com", desc: "Books and manga in UAE." }
      ],
      Gaming: [
        { name: "Virgin Megastore UAE", url: "https://www.virginmegastore.ae", desc: "Gaming and entertainment in UAE." },
        { name: "Noon Gaming", url: "https://www.noon.com/uae-en/electronics-and-mobiles/video-games", desc: "Gulf gaming listings." }
      ]
    },
    asia: {
      Electronics: [
        { name: "Shopee", url: "https://shopee.sg", desc: "Asia mobile electronics demand." },
        { name: "Lazada", url: "https://www.lazada.sg", desc: "Southeast Asia electronics marketplace." },
        { name: "Rakuten", url: "https://www.rakuten.co.jp", desc: "Japan online marketplace." }
      ],
      Fashion: [
        { name: "SHEIN", url: "https://www.shein.com", desc: "Asia-driven fast fashion trends." },
        { name: "Lazada Fashion", url: "https://www.lazada.sg/shop-fashion", desc: "SEA fashion listings." },
        { name: "Uniqlo", url: "https://www.uniqlo.com", desc: "Regional storefronts across Asia." },
        { name: "Primark", url: "https://www.primark.com", desc: "EU/US shipping where offered from online hub." }
      ],
      Books: [
        { name: "Rakuten Books", url: "https://books.rakuten.co.jp", desc: "Japan books and manga." },
        { name: "Dangdang", url: "https://www.dangdang.com", desc: "China books and media." }
      ],
      Gaming: [
        { name: "Steam Store", url: "https://store.steampowered.com", desc: "Asia regional gaming demand." },
        { name: "PlayStation Asia", url: "https://store.playstation.com/en-sg/pages/latest", desc: "Asia console games and add-ons." }
      ]
    },
    global: {
      Electronics: [{ name: "Amazon Electronics", url: "https://www.amazon.com/s?i=electronics&tag=vibecart20-20", desc: "Global electronics marketplace." }],
      Fashion: [
        { name: "ASOS", url: "https://www.asos.com", desc: "Global youth fashion." },
        { name: "SHEIN", url: "https://www.shein.com", desc: "Trend-led fashion worldwide." },
        { name: "Zara", url: "https://www.zara.com", desc: "Seasonal fashion — pick your region on site." },
        { name: "Primark", url: "https://www.primark.com", desc: "High-street value — UK, US, EU online where available." },
        { name: "Notino", url: "https://www.notino.com", desc: "Beauty and fragrance (strong EU delivery)." }
      ],
      Books: [{ name: "AbeBooks", url: "https://www.abebooks.com", desc: "Global books and textbooks." }],
      Gaming: [{ name: "Steam Store", url: "https://store.steampowered.com", desc: "Global gaming marketplace." }]
    }
  };
  function inferRegionFromTimezone() {
    try {
      var tz = String((Intl.DateTimeFormat().resolvedOptions().timeZone || "")).toLowerCase();
      if (tz.indexOf("johannesburg") >= 0 || tz.indexOf("cape_town") >= 0) return "za";
      if (tz.indexOf("nairobi") >= 0) return "ke";
      if (tz.indexOf("harare") >= 0) return "zw";
      if (
        tz.indexOf("dublin") >= 0 ||
        tz.indexOf("cork") >= 0 ||
        tz.indexOf("galway") >= 0 ||
        tz.indexOf("limerick") >= 0 ||
        tz.indexOf("belfast") >= 0
      ) {
        return "ie";
      }
      if (tz.indexOf("warsaw") >= 0 || tz.indexOf("berlin") >= 0 || tz.indexOf("london") >= 0 || tz.indexOf("paris") >= 0) return "eu";
      if (tz.indexOf("dubai") >= 0 || tz.indexOf("riyadh") >= 0) return "gulf";
      if (tz.indexOf("tokyo") >= 0 || tz.indexOf("singapore") >= 0 || tz.indexOf("seoul") >= 0 || tz.indexOf("kolkata") >= 0) return "asia";
    } catch {
      /* ignore */
    }
    return "global";
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
      case "IE":
        return "ie";
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

  try {
    var regionParam = String(params.get("region") || "").trim().toLowerCase();
    if (regionParam && mapByRegion[regionParam]) {
      writeRegionMode(regionParam);
    }
  } catch {
    /* ignore */
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
  var cat =
    requested === "All"
      ? "All"
      : categories.indexOf(requested) >= 0
        ? requested
        : "Electronics";
  var dealTone = String(params.get("deal") || "").trim().toLowerCase();
  if (dealTone === "fashion" && cat === "All") {
    cat = "Fashion";
  }
  if (dealTone === "electronics" && cat === "All") {
    cat = "Electronics";
  }
  if (dealTone === "books" && cat === "All") {
    cat = "Books";
  }
  if (dealTone === "gaming" && cat === "All") {
    cat = "Gaming";
  }
  function categoryIdForVcFetch() {
    if (dealTone === "electronics") return 1;
    if (dealTone === "fashion") return 2;
    if (dealTone === "books") return 3;
    if (dealTone === "gaming") return 4;
    if (dealTone === "best") return 0;
    var byCat = { Electronics: 1, Fashion: 2, Books: 3, Gaming: 4 };
    return cat !== "All" ? byCat[cat] || 0 : 0;
  }
  function syncDisclaimerShell() {
    var pending = Boolean(disclaimerAck && !disclaimerAck.checked);
    try {
      document.body.classList.toggle("live-market-external-pending", pending);
    } catch {
      /* ignore */
    }
    if (gateNote) {
      gateNote.hidden = !pending;
      gateNote.textContent = pending
        ? "External retailer tiles are locked until you tick the disclaimer and (optionally) read the policy link. Curated external listings above stay open."
        : "";
    }
  }
  var trustedHosts = buildTrustedHostSet(mapByRegion);
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
  var fashionTrends = [
    {
      src: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.zalando.com",
      title: "EU street layers"
    },
    {
      src: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.asos.com",
      title: "Everyday smart casual"
    },
    {
      src: "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.hm.com",
      title: "Minimal capsule edits"
    },
    {
      src: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.shein.com",
      title: "Fast trend refresh"
    }
  ];
  var electronicsDealRail = [
    {
      src: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.amazon.com/deals?ref_=nav_cs_gb",
      title: "Electronics deals hub"
    },
    {
      src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.currys.co.uk",
      title: "Currys tech offers"
    },
    {
      src: "https://images.unsplash.com/photo-1527443224154-c4a3942d3daf?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.mediamarkt.de",
      title: "MediaMarkt EU"
    },
    {
      src: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.bestbuy.com",
      title: "Best Buy US"
    }
  ];
  var booksDealRail = [
    {
      src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.amazon.com/s?k=study+books",
      title: "Study picks"
    },
    {
      src: "https://images.unsplash.com/photo-1524995997946-a1c02491cba8?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.abebooks.com",
      title: "AbeBooks textbooks"
    },
    {
      src: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.waterstones.com",
      title: "Waterstones new"
    },
    {
      src: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.fnac.com/livres",
      title: "Fnac books FR"
    }
  ];
  var gamingDealRail = [
    {
      src: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://store.steampowered.com/specials",
      title: "Steam specials"
    },
    {
      src: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.xbox.com/promotions/sales/sales-and-specials",
      title: "Xbox deals"
    },
    {
      src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://store.playstation.com",
      title: "PlayStation store"
    },
    {
      src: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.nintendo.com/store/sales-and-deals/",
      title: "Nintendo deals"
    }
  ];
  /** Real storefronts — deals / promo entry pages (not VibeCart demo inventory). */
  var bestBargainsDealRail = [
    {
      src: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.amazon.com/deals",
      title: "Amazon",
      badge: "Deals hub",
      subtitle: "Lightning deals & category coupons"
    },
    {
      src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.ebay.com/deals",
      title: "eBay",
      badge: "Promotions",
      subtitle: "Daily deals & event pricing"
    },
    {
      src: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.takealot.com",
      title: "Takealot",
      badge: "ZA tech & home",
      subtitle: "Flash offers by campaign"
    },
    {
      src: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.jumia.com.ng",
      title: "Jumia",
      badge: "Africa retail",
      subtitle: "Seasonal promos per country"
    },
    {
      src: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.argos.co.uk",
      title: "Argos",
      badge: "UK catalogue",
      subtitle: "Multi-buy & clearance"
    },
    {
      src: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.newegg.com",
      title: "Newegg",
      badge: "PC & tech",
      subtitle: "Shell shocker & combos"
    },
    {
      src: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.zalando.com",
      title: "Zalando",
      badge: "Fashion sale",
      subtitle: "Outlet & seasonal rows"
    },
    {
      src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.abebooks.com",
      title: "AbeBooks",
      badge: "Books",
      subtitle: "Used & textbooks"
    }
  ];
  if (!grid) {
    return;
  }

  (function injectBridgeRefBanner() {
    var br = bridgeRefForLinks();
    if (!br || !searchStatus || !searchStatus.parentNode) return;
    if (document.getElementById("liveMarketBridgeRefBanner")) return;
    var note = document.createElement("p");
    note.id = "liveMarketBridgeRefBanner";
    note.className = "note";
    note.style.cssText =
      "margin:0.35rem 0 0.75rem;padding:0.55rem 0.75rem;border-radius:10px;border:1px solid rgba(61,158,120,0.35);background:rgba(61,158,120,0.12)";
    note.appendChild(document.createTextNode("Bridge visit · ref "));
    var strong = document.createElement("strong");
    strong.textContent = br;
    note.appendChild(strong);
    note.appendChild(
      document.createTextNode(" — outbound shop taps use the tracked redirect with your ref.")
    );
    searchStatus.parentNode.insertBefore(note, searchStatus.nextSibling);
  })();
  function shopOutboundRedirectHref(displayName, cat, targetHttpsUrl) {
    var shop = String(displayName || "Partner shop").trim().slice(0, 120);
    var c = String(cat || "All").trim().slice(0, 80);
    var target = String(targetHttpsUrl || "").trim();
    if (!target) return "#";
    var base =
      "/api/public/shop/redirect?shop=" +
      encodeURIComponent(shop) +
      "&cat=" +
      encodeURIComponent(c) +
      "&partner=" +
      encodeURIComponent(shop) +
      "&target=" +
      encodeURIComponent(target);
    try {
      var ref = bridgeRefForLinks();
      if (ref) {
        base += "&ref=" + encodeURIComponent(ref);
      }
    } catch {
      /* ignore */
    }
    return base;
  }
  function extractHost(url) {
    try {
      return String(new URL(url).hostname || "").toLowerCase();
    } catch {
      return "";
    }
  }
  var BLOCKED_HOSTS = {
    "mediamarkt.de": true,
    "currys.co.uk": true,
    "eu.shein.com": true,
    "allegro.pl": true,
    "fnac.com": true,
    "currys.ie": true,
    "littlewoodsireland.ie": true,
    "easons.com": true,
    "waterstones.com": true,
    "smythstoys.com": true,
    "gamestop.ie": true,
    "superbalist.com": true,
    "jumia.co.ke": true,
    "nuriakenya.com": true,
    "textbookcentre.com": true,
    "noon.com": true,
    "sharafdg.com": true,
    "namshi.com": true,
    "kinokuniya.com": true,
    "rakuten.co.jp": true,
    "hm.com": true,
    "bestbuy.com": true,
    "vestiairecollective.com": true,
    "mrporter.com": true
  };
  function buildTrustedHostSet(allMaps) {
    var set = {};
    Object.keys(allMaps || {}).forEach(function (regionKey) {
      var regionMap = allMaps[regionKey] || {};
      Object.keys(regionMap).forEach(function (category) {
        (regionMap[category] || []).forEach(function (entry) {
          var host = extractHost(entry.url);
          if (host) {
            set[host] = true;
          }
        });
      });
    });
    return set;
  }
  function isTrustedShopUrl(url) {
    var host = extractHost(url);
    if (!host) return false;
    if (BLOCKED_HOSTS[host]) return false;
    var blockedKeys = Object.keys(BLOCKED_HOSTS);
    for (var b = 0; b < blockedKeys.length; b += 1) {
      if (host === blockedKeys[b] || host.endsWith("." + blockedKeys[b])) return false;
    }
    if (trustedHosts[host]) return true;
    var keys = Object.keys(trustedHosts);
    for (var i = 0; i < keys.length; i += 1) {
      var k = keys[i];
      if (!k) continue;
      if (host === k || host.endsWith("." + k)) return true;
    }
    return false;
  }
  function isCommissionTrackedUrl(url) {
    try {
      var parsed = new URL(String(url || ""));
      if (!/^https?:$/i.test(parsed.protocol)) return false;
      var keys = ["tag", "ref", "aff", "affiliate", "affid", "subid", "clickid", "irclickid", "pub_id", "publisher_id"];
      for (var i = 0; i < keys.length; i += 1) {
        if (parsed.searchParams.get(keys[i])) return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  function shopLogoSrc(shopUrl) {
    var host = extractHost(String(shopUrl || "").trim());
    if (!host) {
      return "";
    }
    return "https://www.google.com/s2/favicons?sz=64&domain=" + encodeURIComponent(host);
  }

  function buildShopLink(shop, category) {
    var a = document.createElement("a");
    a.className = "shop";
    var trusted = isTrustedShopUrl(shop.url);
    var commissionEnabled = isCommissionTrackedUrl(shop.url);
    if (trusted) {
      var targetUrl = String(shop.url || "").trim();
      a.href = shopOutboundRedirectHref(shop.name, category, targetUrl);
    } else {
      a.href = "#";
      a.classList.add("is-disabled");
    }
    a.setAttribute("data-aff-shop", shop.name);
    a.setAttribute("data-aff-cat", category);
    a.setAttribute("data-aff-commission", commissionEnabled ? "1" : "0");
    var logoHtml = "";
    if (trusted) {
      var ls = shopLogoSrc(shop.url);
      if (ls) {
        logoHtml =
          '<img class="shop-logo" width="28" height="28" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="' +
          ls +
          '" />';
      }
    }
    a.innerHTML =
      logoHtml +
      "<h3>" +
      shop.name +
      "</h3><p>" +
      shop.desc +
      (trusted
        ? " · External checkout on source site. · " + (commissionEnabled ? "Commission-enabled." : "Traffic-only.")
        : " (link unavailable)") +
      "</p>";
    a.addEventListener("click", function (event) {
      if (!trusted) {
        event.preventDefault();
        if (searchStatus) {
          searchStatus.textContent = "This listing is temporarily disabled until the shop link is verified.";
        }
        return;
      }
      if (disclaimerAck && !disclaimerAck.checked) {
        event.preventDefault();
        event.stopPropagation();
        if (searchStatus) {
          searchStatus.textContent =
            "Tick the marketplace disclaimer (and read the policy link if you need the full legal text) before opening external retailers.";
        }
        syncDisclaimerShell();
        return;
      }
      try {
        localStorage.setItem(
          AFFILIATE_LAST_CLICK_KEY,
          JSON.stringify({
            at: new Date().toISOString(),
            source: "live-market-shops",
            shop: String(shop.name || ""),
            target: String(shop.url || ""),
            commissionEligible: commissionEnabled
          })
        );
      } catch {
        /* ignore */
      }
    });
    return a;
  }

  function renderList(items, message) {
    grid.innerHTML = "";
    if (!items.length) {
      if (searchStatus) {
        searchStatus.textContent = message || "No shops found for that search.";
      }
      if (typeof window.vibeCartRefreshShopFavicons === "function") {
        window.vibeCartRefreshShopFavicons();
      }
      return;
    }
    items.forEach(function (entry) {
      grid.appendChild(buildShopLink(entry.shop, entry.category));
    });
    if (searchStatus) {
      searchStatus.textContent = message || ("Showing " + items.length + " shop result(s).");
    }
    if (typeof window.vibeCartRefreshShopFavicons === "function") {
      window.vibeCartRefreshShopFavicons();
    }
  }

  function listForCategory(category) {
    if (category === "All") {
      var combined = [];
      categories.forEach(function (categoryName) {
        (map[categoryName] || []).forEach(function (shop) {
          combined.push({ shop: shop, category: categoryName });
        });
      });
      return combined;
    }
    return (map[category] || []).map(function (shop) {
      return { shop: shop, category: category };
    });
  }

  function paintCategoryUi(active) {
    var mainTitle = document.querySelector("main.shops-lane-main > .shops-lane-title");
    if (mainTitle) {
      if (dealTone === "best") {
        mainTitle.textContent = "Best bargains · retailer promos + VibeCart listings";
      } else if (dealTone === "fashion") {
        mainTitle.textContent = "Fashion deals · VibeCart + flagship fashion";
      } else if (dealTone === "electronics") {
        mainTitle.textContent = "Electronics offers · VibeCart + tech storefronts";
      } else if (dealTone === "books") {
        mainTitle.textContent = "Books & study · VibeCart + bookstore partners";
      } else if (dealTone === "gaming") {
        mainTitle.textContent = "Gaming · VibeCart + game stores";
      } else {
        mainTitle.textContent = "Global live market shops";
      }
    }
    if (vcTitle && vcLead) {
      if (dealTone === "best") {
        vcTitle.textContent = "VibeCart seller listings";
        vcLead.textContent =
          "Photos reflect seller uploads when provided — tap any tile for VibeCart checkout (buyer sign-in required).";
      } else if (dealTone === "fashion") {
        vcTitle.textContent = "Fashion lane on VibeCart";
        vcLead.textContent = "External fashion listings — opens Hot Picks with source-website checkout.";
      } else if (dealTone === "electronics") {
        vcTitle.textContent = "Electronics on VibeCart";
        vcLead.textContent = "Phones, laptops, and accessories from verified external shops.";
      } else if (dealTone === "books") {
        vcTitle.textContent = "Books & study on VibeCart";
        vcLead.textContent = "Textbooks and reads from VibeCart sellers — then curated bookstore portals.";
      } else if (dealTone === "gaming") {
        vcTitle.textContent = "Gaming on VibeCart";
        vcLead.textContent = "Games and gear from VibeCart inventory.";
      } else {
        vcTitle.textContent = "Curated external listings";
        vcLead.textContent =
          "Curated external inventory — opens Hot Picks with source-website checkout. External shops require the disclaimer.";
      }
    }
    if (intro) {
      var base =
        active === "All"
          ? "Promotional rails swipe sideways; seller listings open checkout. Regional storefront tiles use tracked redirects after you accept the disclaimer."
          : "VibeCart listings match your lane; storefront tiles focus on " + active + ".";
      if (dealTone === "best") {
        intro.textContent = base + " Best-bargains lane highlights low-price VibeCart stock first.";
      } else if (dealTone === "fashion") {
        intro.textContent = base + " Fashion lane adds a visual rail of inspiration plus real fashion retailers.";
      } else if (dealTone === "electronics") {
        intro.textContent = base + " Electronics lane adds deal-focused storefront shortcuts with imagery.";
      } else if (dealTone === "books") {
        intro.textContent = base + " Books lane highlights study-friendly portals.";
      } else if (dealTone === "gaming") {
        intro.textContent = base + " Gaming lane highlights keys, consoles, and trusted game storefronts.";
      } else {
        intro.textContent = base;
      }
    }
    if (topCta) {
      try {
        if (String(window.location.pathname || "").toLowerCase().indexOf("live-market-shops") >= 0) {
          topCta.setAttribute("href", "#liveMarketExternalWrap");
          topCta.textContent = "Jump to external shop grid";
        } else {
          topCta.setAttribute("href", "./live-market-shops.html?cat=All&view=global&deal=best");
          topCta.textContent = "Open full live marketplace";
        }
      } catch (_) {
        topCta.setAttribute("href", "./live-market-shops.html?cat=All&view=global&deal=best");
        topCta.textContent = "Open full live marketplace";
      }
    }
    if (tabsWrap) {
      Array.prototype.slice.call(tabsWrap.querySelectorAll("[data-live-cat]")).forEach(function (btn) {
        var isActive = String(btn.getAttribute("data-live-cat") || "") === active;
        btn.classList.toggle("btn-primary", isActive);
        btn.classList.toggle("btn-secondary", !isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }
    if (regionSelect) {
      regionSelect.value = regionMode;
    }
    if (fashionAssist) {
      fashionAssist.classList.toggle("hidden", active !== "Fashion");
    }
  }
  function renderFashionTrends() {
    if (!fashionTrendsRail) {
      return;
    }
    fashionTrendsRail.innerHTML = "";
    fashionTrends.forEach(function (trend) {
      var card = document.createElement("a");
      card.className = "vc-fashion-trend-link";
      card.href = trend.href;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.innerHTML = '<img loading="lazy" src="' + trend.src + '" alt="' + trend.title + '" /><span>' + trend.title + "</span>";
      fashionTrendsRail.appendChild(card);
    });
  }
  function randomFashionAdvice() {
    var tones = [
      "Start with one hero piece, then keep two neutral layers for balance.",
      "For cross-border buys, prioritize fit notes and fabric blend over only photos.",
      "Pick one accent color and repeat it in shoes or bag for a cleaner look.",
      "Use lightweight layers for day and add one structured top layer at night."
    ];
    var regionHints = {
      eu: "EU lanes: minimalist cuts and quality basics convert best.",
      ie: "Ireland lanes: mix high-street (.ie) with reliable UK/NI delivery routes where shoppers already buy.",
      za: "South Africa lanes: bold color accents and practical fabrics move faster.",
      ke: "Kenya lanes: breathable street-smart styles perform well across day wear.",
      zw: "Zimbabwe lanes: flexible basics plus one standout item keeps value high.",
      gulf: "Gulf lanes: smart casual and premium accessories trend strongly.",
      asia: "Asia lanes: fast-rotation trend pieces plus essentials work best.",
      global: "Global lane: combine timeless basics with one fresh trend piece."
    };
    var line = tones[Math.floor(Math.random() * tones.length)];
    var hint = regionHints[resolvedRegion] || regionHints.global;
    return line + " " + hint;
  }

  function renderDealContextRail() {
    if (!dealContextRail || !dealContextRailWrap || !dealContextRailLabel) {
      return;
    }
    dealContextRail.innerHTML = "";
    var pack = null;
    if (dealTone === "best") {
      pack = {
        label:
          "Sales, discounts & promotions — swipe sideways. Each card opens a real store (tick the disclaimer first).",
        items: bestBargainsDealRail
      };
    } else if (dealTone === "fashion" || cat === "Fashion") {
      pack = { label: "Fashion inspiration + storefront shortcuts (disclaimer applies)", items: fashionTrends };
    } else if (dealTone === "electronics" || cat === "Electronics") {
      pack = { label: "Electronics deal shelf — storefront entry points (disclaimer applies)", items: electronicsDealRail };
    } else if (dealTone === "books" || cat === "Books") {
      pack = { label: "Books & study portals (disclaimer applies)", items: booksDealRail };
    } else if (dealTone === "gaming" || cat === "Gaming") {
      pack = { label: "Gaming deal shelf — official storefronts (disclaimer applies)", items: gamingDealRail };
    }
    if (!pack || !pack.items || !pack.items.length) {
      dealContextRailWrap.hidden = true;
      dealContextRailWrap.style.display = "none";
      return;
    }
    dealContextRailLabel.textContent = pack.label;
    var promoCat =
      dealTone === "best"
        ? "Best bargains"
        : cat !== "All"
          ? cat
          : "Marketplace";
    pack.items.forEach(function (trend) {
      var card = document.createElement("a");
      card.className = "vc-fashion-trend-link vc-live-deal-promo-card";
      card.href = shopOutboundRedirectHref(trend.title, promoCat, trend.href);
      card.setAttribute("data-vc-external-target", String(trend.href || ""));
      var badge = trend.badge
        ? '<span class="vc-live-deal-promo-badge">' + String(trend.badge).replace(/</g, "&lt;") + "</span>"
        : "";
      var sub = trend.subtitle
        ? '<span class="vc-live-deal-promo-sub">' + String(trend.subtitle).replace(/</g, "&lt;") + "</span>"
        : "";
      card.innerHTML =
        badge +
        '<img loading="lazy" src="' +
        String(trend.src || "").replace(/"/g, "") +
        '" alt="" />' +
        '<span class="vc-live-deal-promo-title">' +
        String(trend.title || "").replace(/</g, "&lt;") +
        "</span>" +
        sub;
      dealContextRail.appendChild(card);
    });
    dealContextRailWrap.hidden = false;
    dealContextRailWrap.style.display = "";
  }

  function absoluteMediaUrl(u) {
    var raw = String(u || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.indexOf("//") === 0) {
      try {
        return String(window.location && window.location.protocol ? window.location.protocol : "https:") + raw;
      } catch {
        return "https:" + raw.slice(2);
      }
    }
    if (raw.charAt(0) === "/") {
      try {
        var origin = String(window.location && window.location.origin ? window.location.origin : "").replace(/\/$/, "");
        if (origin) return origin + raw;
      } catch {
        /* ignore */
      }
    }
    return raw;
  }

  function placeholderImageForListing(categoryName) {
    var c = String(categoryName || "").toLowerCase();
    if (c.indexOf("book") >= 0) {
      return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=480&h=300&q=75";
    }
    if (c.indexOf("fashion") >= 0) {
      return "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=480&h=300&q=75";
    }
    if (c.indexOf("game") >= 0) {
      return "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=480&h=300&q=75";
    }
    return "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=480&h=300&q=75";
  }

  function appendVcProductCard(p) {
    if (!vcGrid) return;
    var a = document.createElement("a");
    a.className = "shop vc-live-vc-product";
    a.href = "./marketplace-buy.html?productId=" + encodeURIComponent(String(p.id));
    var imgSrc = absoluteMediaUrl(String(p.imageUrl || "").trim()) || placeholderImageForListing(p.categoryName || "");
    if (imgSrc) {
      var img = document.createElement("img");
      img.className = "vc-live-vc-product__media";
      img.src = imgSrc;
      img.alt = "";
      img.width = 480;
      img.height = 300;
      img.loading = "lazy";
      img.decoding = "async";
      a.appendChild(img);
    }
    var h3 = document.createElement("h3");
    h3.textContent = p.title || "Listing";
    var para = document.createElement("p");
    para.className = "vc-live-vc-product__meta";
    para.textContent =
      String(p.shopName || "Shop") +
      " · " +
      String(p.basePrice != null ? p.basePrice : "") +
      " " +
      String(p.currency || "");
    a.appendChild(h3);
    a.appendChild(para);
    vcGrid.appendChild(a);
  }

  async function loadVcProducts() {
    if (!vcGrid) {
      return;
    }
    var cid = categoryIdForVcFetch();
    if (vcStatus) {
      vcStatus.textContent = "Loading VibeCart listings…";
    }
    vcGrid.innerHTML = "";
    try {
      var u = "/api/public/products/live?limit=48" + (cid ? "&categoryId=" + cid : "");
      var res = await fetch(u, { headers: { Accept: "application/json" } });
      var text = await res.text();
      var body = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
      if (!res.ok || !body.ok || !Array.isArray(body.products)) {
        if (vcStatus) {
          vcStatus.textContent =
            "Could not load VibeCart listings (" +
            String((body && body.code) || res.status) +
            "). External shops still work after the disclaimer.";
        }
        return;
      }
      var products = body.products.slice();
      if (dealTone === "best") {
        products.sort(function (a, b) {
          return Number(a.basePrice || 0) - Number(b.basePrice || 0);
        });
      }
      products.forEach(appendVcProductCard);
      if (vcStatus) {
        vcStatus.textContent = products.length
          ? "Showing " + products.length + " seller listing(s). Tap a tile → marketplace checkout."
          : "No active VibeCart listings for this filter yet.";
      }
    } catch {
      if (vcStatus) {
        vcStatus.textContent = "Network error loading VibeCart listings.";
      }
    }
  }

  function paintWorldwideHint(rawQuery, hasLocalMatches) {
    if (!worldwideHint) {
      return;
    }
    worldwideHint.textContent = "";
    worldwideHint.hidden = true;
    var q = String(rawQuery || "").trim();
    if (!q) {
      return;
    }
    worldwideHint.hidden = false;
    worldwideHint.appendChild(
      document.createTextNode(hasLocalMatches ? "Also find real shops worldwide: " : "Search real shops worldwide: ")
    );
    var a = document.createElement("a");
    a.href = "./global-search.html?q=" + encodeURIComponent(q);
    a.textContent = "Open global search (Maps + web)";
    worldwideHint.appendChild(a);
    worldwideHint.appendChild(document.createTextNode(" · "));
    var m = document.createElement("a");
    m.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
    m.textContent = "Google Maps";
    m.target = "_blank";
    m.rel = "noopener noreferrer";
    worldwideHint.appendChild(m);
  }

  function runSearch() {
    var raw = String((searchInput && searchInput.value) || "").trim();
    var q = raw.toLowerCase();
    if (!q) {
      if (worldwideHint) {
        worldwideHint.textContent = "";
        worldwideHint.hidden = true;
      }
      renderList(listForCategory(cat), "Showing " + cat + " shops.");
      return;
    }
    var all = [];
    categories.forEach(function (category) {
      (map[category] || []).forEach(function (shop) {
        all.push({ shop: shop, category: category });
      });
    });
    var matches = all.filter(function (entry) {
      var hay = (entry.shop.name + " " + entry.shop.desc + " " + entry.category).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    renderList(
      matches,
      matches.length ? ("Search '" + q + "': " + matches.length + " result(s).") : ("No shop found for '" + q + "' in this VibeCart grid.")
    );
    paintWorldwideHint(raw, matches.length > 0);
  }

  if (tabsWrap) {
    Array.prototype.slice.call(tabsWrap.querySelectorAll("[data-live-cat]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = String(btn.getAttribute("data-live-cat") || "").trim();
        if (!next || (next !== "All" && categories.indexOf(next) < 0)) {
          return;
        }
        cat = next;
        var dealByCat = { Electronics: "electronics", Fashion: "fashion", Books: "books", Gaming: "gaming" };
        var spLive = new URLSearchParams(window.location.search || "");
        if (cat === "All") {
          dealTone = String(spLive.get("deal") || "").trim().toLowerCase();
        } else {
          dealTone = dealByCat[cat] || dealTone;
        }
        if (searchInput) {
          searchInput.value = "";
        }
        if (worldwideHint) {
          worldwideHint.textContent = "";
          worldwideHint.hidden = true;
        }
        paintCategoryUi(cat);
        renderList(listForCategory(cat), "Showing " + cat + " shops.");
        renderDealContextRail();
        loadVcProducts();
        try {
          var url = new URL(window.location.href);
          url.searchParams.set("cat", cat);
          if (dealTone) {
            url.searchParams.set("deal", dealTone);
          } else {
            url.searchParams.delete("deal");
          }
          var br = bridgeRefForLinks();
          if (br) url.searchParams.set("ref", br);
          history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
        } catch {
          /* ignore */
        }
      });
    });
  }

  paintCategoryUi(cat);
  renderRegionResolutionHint();
  renderList(listForCategory(cat), "Showing " + cat + " shops.");
  renderFashionTrends();
  renderDealContextRail();
  if (disclaimerAck) {
    disclaimerAck.addEventListener("change", syncDisclaimerShell);
  }
  syncDisclaimerShell();
  if (dealContextRailWrap) {
    dealContextRailWrap.addEventListener(
      "click",
      function (ev) {
        var a = ev.target && ev.target.closest && ev.target.closest("a.vc-fashion-trend-link");
        if (!a) return;
        if (disclaimerAck && !disclaimerAck.checked) {
          ev.preventDefault();
          if (searchStatus) {
            searchStatus.textContent =
              "Tick the marketplace disclaimer before opening the featured storefront links.";
          }
          syncDisclaimerShell();
        }
      },
      true
    );
  }
  loadVcProducts();
  if (fashionAdviceBtn) {
    fashionAdviceBtn.addEventListener("click", function () {
      if (fashionAdviceOutput) {
        fashionAdviceOutput.textContent = randomFashionAdvice();
      }
    });
  }
  if (fashionShopNowBtn) {
    fashionShopNowBtn.addEventListener("click", function () {
      cat = "Fashion";
      paintCategoryUi(cat);
      renderList(listForCategory(cat), "Showing Fashion shops.");
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  if (regionSelect) {
    regionSelect.value = regionMode;
    regionSelect.addEventListener("change", function () {
      var next = String(regionSelect.value || "auto").trim().toLowerCase();
      writeRegionMode(next);
      window.location.reload();
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", runSearch);
  }
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
      if (searchInput) {
        searchInput.value = "";
      }
      if (worldwideHint) {
        worldwideHint.textContent = "";
        worldwideHint.hidden = true;
      }
      renderList(listForCategory(cat), "Showing " + cat + " shops.");
    });
  }
})();
