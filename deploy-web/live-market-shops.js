(function () {
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

  function inferRegionFromTimezone() {
    try {
      var tz = String((Intl.DateTimeFormat().resolvedOptions().timeZone || "")).toLowerCase();
      if (tz.indexOf("johannesburg") >= 0 || tz.indexOf("cape_town") >= 0) return "za";
      if (tz.indexOf("nairobi") >= 0) return "ke";
      if (tz.indexOf("harare") >= 0) return "zw";
      if (tz.indexOf("warsaw") >= 0 || tz.indexOf("berlin") >= 0 || tz.indexOf("london") >= 0 || tz.indexOf("paris") >= 0) return "eu";
      if (tz.indexOf("dubai") >= 0 || tz.indexOf("riyadh") >= 0) return "gulf";
      if (tz.indexOf("tokyo") >= 0 || tz.indexOf("singapore") >= 0 || tz.indexOf("seoul") >= 0 || tz.indexOf("kolkata") >= 0) return "asia";
    } catch {
      /* ignore */
    }
    return "global";
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
  var resolvedRegion = regionMode === "auto" ? inferRegionFromTimezone() : regionMode;
  var map = mapByRegion[resolvedRegion] || mapByRegion.global;
  var categories = Object.keys(map);
  var cat = categories.indexOf(requested) >= 0 ? requested : "Electronics";
  var trustedHosts = buildTrustedHostSet(mapByRegion);
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
  function buildShopLink(shop, category) {
    var a = document.createElement("a");
    a.className = "shop";
    var trusted = isTrustedShopUrl(shop.url);
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
    a.innerHTML =
      "<h3>" +
      shop.name +
      "</h3><p>" +
      shop.desc +
      (trusted ? " · External checkout on source site." : " (link unavailable)") +
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
        if (searchStatus) {
          searchStatus.textContent = "Please accept the marketplace disclaimer first.";
        }
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
    return (map[category] || []).map(function (shop) {
      return { shop: shop, category: category };
    });
  }

  function paintCategoryUi(active) {
    if (intro) {
      intro.textContent = "Live market shops for " + active + ". Pick any shop below and continue checkout on that shop.";
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

  if (tabsWrap) {
    Array.prototype.slice.call(tabsWrap.querySelectorAll("[data-live-cat]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = String(btn.getAttribute("data-live-cat") || "").trim();
        if (!next || categories.indexOf(next) < 0) {
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
})();
