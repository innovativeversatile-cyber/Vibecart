(function () {
  var AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
  var params = new URLSearchParams(window.location.search || "");
  var requested = String(params.get("cat") || "").trim();
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
        { name: "Xbox Store", url: "https://www.xbox.com/games/store", desc: "Xbox games and subscriptions." },
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
        { name: "Zara South Africa", url: "https://www.zara.com/za/", desc: "South Africa seasonal drops." }
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
        { name: "SHEIN", url: "https://www.shein.com", desc: "Youth fashion and trend picks." }
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
        { name: "Noon Fashion", url: "https://www.noon.com/uae-en/fashion", desc: "UAE fashion listings." }
      ],
      Books: [
        { name: "Amazon UAE Books", url: "https://www.amazon.ae/books-used-books-textbooks", desc: "UAE books and personal development." },
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
        { name: "Lazada Fashion", url: "https://www.lazada.sg/shop-fashion", desc: "SEA fashion listings." }
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
      Fashion: [{ name: "ASOS", url: "https://www.asos.com", desc: "Global youth fashion." }],
      Books: [{ name: "AbeBooks", url: "https://www.abebooks.com", desc: "Global books and textbooks." }],
      Gaming: [{ name: "Steam Store", url: "https://store.steampowered.com", desc: "Global gaming marketplace." }]
    }
  };
  mapByRegion.global.Electronics.push({
    name: "Brainrot Studio",
    url: "https://brainrot.mov?ref=ApLX4MJQoF",
    desc: "AI creator studio partner (external checkout)."
  });

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
      href: "https://www2.hm.com",
      title: "Minimal capsule edits"
    },
    {
      src: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=540&h=340&q=75",
      href: "https://www.shein.com",
      title: "Fast trend refresh"
    }
  ];
  if (!grid) {
    return;
  }
  function extractHost(url) {
    try {
      return String(new URL(url).hostname || "").toLowerCase();
    } catch {
      return "";
    }
  }
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
    return !!(host && trustedHosts[host]);
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
  function buildShopLink(shop, category) {
    var a = document.createElement("a");
    a.className = "shop";
    var trusted = isTrustedShopUrl(shop.url);
    var commissionEnabled = isCommissionTrackedUrl(shop.url);
    a.href =
      "/api/public/shop/redirect?shop=" +
      encodeURIComponent(shop.name) +
      "&cat=" +
      encodeURIComponent(category) +
      "&partner=" +
      encodeURIComponent(shop.name) +
      "&target=" +
      encodeURIComponent(shop.url);
    if (!trusted) {
      a.href = "#";
      a.classList.add("is-disabled");
    }
    a.setAttribute("data-aff-shop", shop.name);
    a.setAttribute("data-aff-cat", category);
    a.setAttribute("data-aff-commission", commissionEnabled ? "1" : "0");
    a.innerHTML =
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
        if (searchStatus) {
          searchStatus.textContent = "Tip: tick the marketplace disclaimer for safer buying guidance.";
        }
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
      return;
    }
    items.forEach(function (entry) {
      grid.appendChild(buildShopLink(entry.shop, entry.category));
    });
    if (searchStatus) {
      searchStatus.textContent = message || ("Showing " + items.length + " shop result(s).");
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
    if (intro) {
      intro.textContent =
        active === "All"
          ? "Live market shops across every category below. Pick a shop and continue checkout on that site."
          : "Live market shops for " + active + ". Pick any shop below and continue checkout on that shop.";
    }
    if (topCta) {
      topCta.setAttribute("href", "./live-market.html");
      topCta.textContent = "Open live market folders";
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

  function runSearch() {
    var q = String((searchInput && searchInput.value) || "").trim().toLowerCase();
    if (!q) {
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
    renderList(matches, matches.length ? ("Search '" + q + "': " + matches.length + " result(s).") : ("No shop found for '" + q + "'."));
  }

  function getAuthToken() {
    try {
      return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch {
      return "";
    }
  }

  function inferBuyerCountry() {
    try {
      var raw = localStorage.getItem("vibecart-public-auth-user");
      var user = raw ? JSON.parse(raw) : {};
      var cc = String((user && user.countryCode) || "").trim().toUpperCase();
      if (cc.length === 2) return cc;
    } catch {
      /* ignore */
    }
    try {
      var tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
      if (tz.indexOf("dublin") >= 0 || tz.indexOf("cork") >= 0 || tz.indexOf("galway") >= 0 || tz.indexOf("limerick") >= 0) {
        return "IE";
      }
      if (tz.indexOf("belfast") >= 0) {
        return "GB";
      }
    } catch {
      /* ignore */
    }
    return "ZA";
  }

  function renderLiveProducts(products) {
    if (!grid || !Array.isArray(products) || !products.length) return;
    var heading = document.createElement("div");
    heading.className = "shop";
    heading.innerHTML = "<h3>Real VibeCart live listings</h3><p>These are actual seller listings from your marketplace (with secure shipping + fee breakdown).</p>";
    grid.insertBefore(heading, grid.firstChild);
    products.slice(0, 14).forEach(function (p) {
      var card = document.createElement("a");
      card.className = "shop";
      card.href = "#";
      card.innerHTML =
        "<h3>" + String(p.title || "Listing") + "</h3>" +
        "<p>" + String(p.shopName || "Shop") + " · " + Number(p.basePrice || 0).toFixed(2) + " " + String(p.currency || "EUR") + " · stock " + Number(p.stock || 0) + "</p>";
      card.addEventListener("click", async function (event) {
        event.preventDefault();
        var shippingMethod = String(window.prompt("Choose shipping: economy / standard / express / pickup", "standard") || "standard").trim().toLowerCase();
        var buyerCountry = inferBuyerCountry();
        try {
          var quoteRes = await fetch(
            "/api/public/orders/quote?productId=" +
              encodeURIComponent(String(p.id || 0)) +
              "&quantity=1&buyerCountry=" +
              encodeURIComponent(buyerCountry) +
              "&shippingMethod=" +
              encodeURIComponent(shippingMethod)
          );
          var quoteBody = await quoteRes.json();
          if (!quoteRes.ok || !quoteBody.ok || !quoteBody.quote) {
            throw new Error(quoteBody.code || "QUOTE_FAILED");
          }
          var q = quoteBody.quote;
          var proceed = window.confirm(
            "Subtotal: " +
              Number(q.subtotal || 0).toFixed(2) +
              " " +
              q.currency +
              "\nShipping: " +
              Number(q.shippingFee || 0).toFixed(2) +
              "\nService fee: " +
              Number(q.serviceFee || 0).toFixed(2) +
              "\nTotal: " +
              Number(q.totalAmount || 0).toFixed(2) +
              "\n\nContinue order?"
          );
          if (!proceed) return;
          var token = getAuthToken();
          if (!token) {
            if (searchStatus) searchStatus.textContent = "Sign in as buyer first to complete secure checkout.";
            return;
          }
          var orderHeaders = { "Content-Type": "application/json" };
          if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
            orderHeaders = window.VibeCartSessionDevice.merge(token, orderHeaders);
          } else {
            orderHeaders.Authorization = "Bearer " + token;
          }
          var createRes = await fetch("/api/public/orders/create", {
            method: "POST",
            headers: orderHeaders,
            body: JSON.stringify({
              productId: Number(p.id || 0),
              quantity: 1,
              shippingMethod: shippingMethod,
              buyerCountry: buyerCountry
            })
          });
          var createBody = await createRes.json();
          if (!createRes.ok || !createBody.ok) throw new Error(createBody.code || "ORDER_FAILED");
          if (searchStatus) {
            searchStatus.textContent = "Order #" + Number(createBody.order.orderId || 0) + " placed. Track in Orders; escrow release is automatic after dual confirmation.";
          }
        } catch (err) {
          if (searchStatus) searchStatus.textContent = "Secure order failed: " + String((err && err.message) || "unknown");
        }
      });
      grid.insertBefore(card, heading.nextSibling);
    });
  }

  async function loadLiveProducts() {
    try {
      var res = await fetch("/api/public/products/live?limit=20");
      var body = await res.json();
      if (!res.ok || !body.ok || !Array.isArray(body.products)) return;
      renderLiveProducts(body.products);
    } catch {
      /* ignore */
    }
  }

  if (tabsWrap) {
    Array.prototype.slice.call(tabsWrap.querySelectorAll("[data-live-cat]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = String(btn.getAttribute("data-live-cat") || "").trim();
        if (!next || (next !== "All" && categories.indexOf(next) < 0)) {
          return;
        }
        cat = next;
        if (searchInput) {
          searchInput.value = "";
        }
        paintCategoryUi(cat);
        renderList(listForCategory(cat), "Showing " + cat + " shops.");
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
  renderList(listForCategory(cat), "Showing " + cat + " shops.");
  renderFashionTrends();
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
      renderList(listForCategory(cat), "Showing " + cat + " shops.");
    });
  }
  loadLiveProducts();
})();
