/* Emergency safe mode for homepage interaction stability.
   Keeps essential browsing usable and blocks any automatic section jumps. */
(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function bootSafeMode() {
    var PUBLIC_AUTH_TOKEN_KEY = "vibecart-public-auth-token";
    var PUBLIC_AUTH_USER_KEY = "vibecart-public-auth-user";

    function forceHomepageLanguageText(lang) {
      var L = String(lang || "en").toLowerCase();
      if (L === "en" || L === "other") return;
      var map = {
        sn: {
          hero: "VibeCart musika wemiganhu une vatengesi vakasimbiswa, checkout inokurumidza, uye kutenga kuri nyore.",
          p1: "Kune vadzidzi nevatengi vechidiki",
          p2: "Kune mhuri nevatengi vakura",
          p3: "Kune vatengesi nevapi vemasevhisi",
          byText: {
            "Sponsored Brands and Ads": "Sponsored Brands neAds",
            "What do you need?": "Uri kuda chii?",
            "Your max budget (EUR)": "Bhajeti yako yepamusoro (EUR)",
            "Preferred category": "Category yaunoda",
            "Order Tracking and Delivery Updates": "Kutevera maodha neDelivery Updates",
            "Beauty and Service Booking Platform": "Beauty neService Booking Platform",
            "Student Insurance and Well-Being Support": "Student Insurance neWell-Being Support",
            "Tax and Payout Transparency": "Kujeka kweMutero neKubhadhara",
            "Lane passport": "Pasipoti yenzira",
            "Signing up as": "Kusaina se",
            "Account controls": "Kutonga kweAkaunti",
            "Shop experience": "Chiitiko cheShop",
            "Popular Categories": "Mapoka anonyanya kufarirwa",
            "Regional shop folders": "Mafolda ezvitoro zvematunhu"
          }
        },
        nd: {
          hero: "IVibeCart yimakethe yokuwela imingcele enabathengisi abaqinisekisiweyo, checkout esheshayo, lokuthenga okulula.",
          p1: "Kwabafundi labathengi abatsha",
          p2: "Kwemuli labathengi abavuthiweyo",
          p3: "Kwabathengisi labanikezeli bezinsiza",
          byText: {
            "Sponsored Brands and Ads": "AmaBrand axhasiweyo lama-Ads",
            "What do you need?": "Udinga ini?",
            "Your max budget (EUR)": "Ibhajethi yakho ephezulu (EUR)",
            "Preferred category": "Isigaba osithandayo",
            "Order Tracking and Delivery Updates": "Ukulandelela ama-oda leDelivery Updates",
            "Beauty and Service Booking Platform": "Beauty leService Booking Platform",
            "Student Insurance and Well-Being Support": "Student Insurance leWell-Being Support",
            "Tax and Payout Transparency": "Ukucaca kweTax lePayout",
            "Lane passport": "Ipasipoti yendlela",
            "Signing up as": "Ukubhalisa njenge",
            "Account controls": "Ukulawula iAkhawunti",
            "Shop experience": "Isipiliyoni seShop",
            "Popular Categories": "Izigaba ezithandwayo",
            "Regional shop folders": "Amafolda ezitolo zendawo"
          }
        },
        xh: {
          hero: "IVibeCart yimarike ewela imida enabathengisi abaqinisekisiweyo, checkout ekhawulezayo, nokuthenga okulula.",
          p1: "Kubafundi nabathengi abatsha",
          p2: "Kwiintsapho nabathengi abavuthiweyo",
          p3: "Kubathengisi nababoneleli ngeenkonzo",
          byText: {
            "Sponsored Brands and Ads": "Iibrendi ezixhasiweyo neAds",
            "What do you need?": "Ufuna ntoni?",
            "Your max budget (EUR)": "Uhlahlo-lwabiwo lwakho oluphezulu (EUR)",
            "Preferred category": "Udidi oluthandayo",
            "Order Tracking and Delivery Updates": "Ukulandelela ii-oda neDelivery Updates",
            "Beauty and Service Booking Platform": "Beauty neService Booking Platform",
            "Student Insurance and Well-Being Support": "Student Insurance neWell-Being Support",
            "Tax and Payout Transparency": "Ukucaca kweTax nePayout",
            "Lane passport": "Ipasipoti yendlela",
            "Signing up as": "Ukubhalisa njenge",
            "Account controls": "Ulawulo lweAkhawunti",
            "Shop experience": "Amava eShop",
            "Popular Categories": "Iindidi ezithandwayo",
            "Regional shop folders": "Iifolda zeevenkile zommandla"
          }
        },
        zu: {
          hero: "IVibeCart yimakethe yokuwela imingcele enabathengisi abaqinisekisiwe, checkout esheshayo, nokuthenga okulula.",
          p1: "Kwabafundi nabathengi abasebasha",
          p2: "Kwemindeni nabathengi abavuthiwe",
          p3: "Kwabathengisi nabahlinzeki bezinsiza",
          byText: {
            "Sponsored Brands and Ads": "AmaBrand axhasiwe nama-Ads",
            "What do you need?": "Udinga ini?",
            "Your max budget (EUR)": "Ibhajethi yakho ephezulu (EUR)",
            "Preferred category": "Isigaba osithandayo",
            "Order Tracking and Delivery Updates": "Ukulandelela ama-oda neDelivery Updates",
            "Beauty and Service Booking Platform": "Beauty neService Booking Platform",
            "Student Insurance and Well-Being Support": "Student Insurance neWell-Being Support",
            "Tax and Payout Transparency": "Ukucaca kweTax nePayout",
            "Lane passport": "Ipasipoti yendlela",
            "Signing up as": "Ukubhalisa njenge",
            "Account controls": "Ukulawula iAkhawunti",
            "Shop experience": "Isipiliyoni seShop",
            "Popular Categories": "Izigaba ezidumile",
            "Regional shop folders": "Amafolda ezitolo zesifunda"
          }
        }
      };
      var pack = map[L];
      if (!pack) return;
      var set = function (selector, value) {
        var el = document.querySelector(selector);
        if (el && value) el.textContent = value;
      };
      set("[data-i18n='hero.regionHeadline']", pack.hero);
      set("[data-i18n='marketFit.p1h']", pack.p1);
      set("[data-i18n='marketFit.p2h']", pack.p2);
      set("[data-i18n='marketFit.p3h']", pack.p3);
      if (pack.byText) {
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        var node = walker.nextNode();
        while (node) {
          var raw = String(node.nodeValue || "");
          var trimmed = raw.trim();
          if (trimmed && pack.byText[trimmed]) {
            node.nodeValue = raw.replace(trimmed, pack.byText[trimmed]);
          }
          node = walker.nextNode();
        }
      }
    }

    function getStoredAuthUser() {
      try {
        var token = String(localStorage.getItem(PUBLIC_AUTH_TOKEN_KEY) || "").trim();
        var rawUser = localStorage.getItem(PUBLIC_AUTH_USER_KEY);
        var user = rawUser ? JSON.parse(rawUser) : null;
        return { token: token, user: user };
      } catch {
        return { token: "", user: null };
      }
    }

    function syncI18nPlaceholders(i18n, lang) {
      document.querySelectorAll("[data-i18n-placeholder]").forEach(function (input) {
        var key = String(input.getAttribute("data-i18n-placeholder") || "").trim();
        if (!key) {
          return;
        }
        var val = i18n.t(lang, key);
        if (val) {
          input.setAttribute("placeholder", val);
        }
      });
    }

    // Keep language switching active in safe mode.
    var i18n = window.VibeCartI18n;
    var siteLanguage = document.getElementById("siteLanguage");
    function shieldLanguageControl(selectEl) {
      if (!selectEl) return;
      var wrap = selectEl.closest ? selectEl.closest(".topbar-lang") : null;
      var halt = function (event) {
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
      };
      ["pointerdown", "touchstart", "mousedown", "mouseup", "click"].forEach(function (type) {
        selectEl.addEventListener(type, halt, true);
        if (wrap) {
          wrap.addEventListener(type, halt, true);
        }
      });
    }
    shieldLanguageControl(siteLanguage);
    (function shieldTopbarSearch() {
      var form = document.getElementById("shopSearchForm");
      if (!form) return;
      var input = document.getElementById("shopSearchInput");
      var btn = form.querySelector ? form.querySelector("button[type='submit']") : null;
      var controls = [form, input, btn].filter(Boolean);
      var halt = function (event) {
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
      };
      ["pointerdown", "touchstart", "mousedown", "mouseup", "click"].forEach(function (type) {
        controls.forEach(function (el) {
          el.addEventListener(type, halt, true);
        });
      });
      form.addEventListener(
        "submit",
        function (event) {
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
        },
        true
      );
    })();
    if (i18n) {
      var stored = i18n.getStored() || "en";
      if (siteLanguage) {
        var hasStored = Array.prototype.slice
          .call(siteLanguage.options || [])
          .some(function (o) {
            return o.value === stored;
          });
        siteLanguage.value = hasStored ? stored : "en";
        siteLanguage.addEventListener("change", function () {
          var next = String(siteLanguage.value || "en");
          i18n.setStored(next);
          i18n.apply(next);
          forceHomepageLanguageText(next);
          syncI18nPlaceholders(i18n, next);
        });
      }
      i18n.apply(stored);
      forceHomepageLanguageText(stored);
      syncI18nPlaceholders(i18n, stored);
    }

    try {
      // Remove bridge hash if injected externally.
      if (window.location.hash === "#bridge-routes") {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } catch {
      /* ignore */
    }

    // Hard-block suspicious bridge navigations unless explicitly allowed.
    document.addEventListener(
      "click",
      function (event) {
        var target = event.target;
        var anchor = target && target.closest ? target.closest("a[href]") : null;
        if (!anchor) {
          return;
        }
        var href = String(anchor.getAttribute("href") || "");
        var explicit = anchor.hasAttribute("data-allow-bridge-nav");
        var isBridge =
          href === "#bridge-routes" ||
          href === "./index.html#bridge-routes" ||
          /\/index\.html#bridge-routes$/.test(href) ||
          href.indexOf("bridge-hub.html") >= 0;
        if (isBridge && !explicit) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
        }
      },
      true
    );

    // Route top search to global search (site + web).
    var form = document.getElementById("shopSearchForm");
    var input = document.getElementById("shopSearchInput");
    var status = document.getElementById("shopSearchStatus");
    if (form && input) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var q = String(input.value || "").trim();
        if (!q) {
          if (status) status.textContent = "Enter what you want to find.";
          return;
        }
        go("./global-search.html?q=" + encodeURIComponent(q));
        if (status) {
          status.textContent = "Searching everything...";
        }
      });
    }

    function go(url) {
      try {
        window.location.assign(url);
      } catch {
        window.location.href = url;
      }
    }

    function bindGo(id, url) {
      var el = document.getElementById(id);
      if (!el) {
        return;
      }
      el.addEventListener("click", function () {
        go(url);
      });
    }

    function initSafeAccountPassport() {
      var panelCreate = document.getElementById("vcAuthPanelCreate");
      var panelLogin = document.getElementById("vcAuthPanelLogin");
      var linkToLogin = document.getElementById("vcAuthLinkToLogin");
      var linkToCreate = document.getElementById("vcAuthLinkToCreate");
      var roleInput = document.getElementById("vcAuthRole");
      var roleLabel = document.getElementById("vcAuthRoleLabel");
      var buyerRoleBtn = document.getElementById("vcAuthRoleBuyer");
      var sellerRoleBtn = document.getElementById("vcAuthRoleSeller");
      var sellerNote = document.getElementById("vcAuthSellerNote");
      var journeyInput = document.getElementById("vcAuthJourney");
      var journeyPassportBtn = document.getElementById("vcAuthJourneyPassport");
      var journeyAccountBtn = document.getElementById("vcAuthJourneyAccount");
      var journeyHint = document.getElementById("vcAuthJourneyHint");
      var createSubmitLabel = document.getElementById("vcAuthSubmitCreate");

      if (!panelCreate || !panelLogin) {
        return;
      }

      function showCreate() {
        panelCreate.classList.remove("hidden");
        panelLogin.classList.add("hidden");
        panelLogin.setAttribute("hidden", "hidden");
      }

      function showLogin() {
        panelLogin.classList.remove("hidden");
        panelCreate.classList.add("hidden");
        panelLogin.removeAttribute("hidden");
      }

      function refreshRoleUi() {
        var seller = String((roleInput && roleInput.value) || "buyer") === "seller";
        if (roleLabel) {
          roleLabel.textContent = seller ? "Seller" : "Buyer";
        }
        if (buyerRoleBtn) {
          buyerRoleBtn.classList.toggle("is-active", !seller);
        }
        if (sellerRoleBtn) {
          sellerRoleBtn.classList.toggle("is-active", seller);
        }
        if (sellerNote) {
          sellerNote.classList.toggle("hidden", !seller);
        }
      }

      function refreshJourneyUi() {
        var journey = String((journeyInput && journeyInput.value) || "passport").toLowerCase() === "account" ? "account" : "passport";
        if (journeyPassportBtn) {
          journeyPassportBtn.classList.toggle("is-active", journey === "passport");
        }
        if (journeyAccountBtn) {
          journeyAccountBtn.classList.toggle("is-active", journey === "account");
        }
        if (createSubmitLabel) {
          createSubmitLabel.textContent = journey === "passport" ? "Create passport" : "Create account";
        }
        if (journeyHint) {
          journeyHint.textContent =
            journey === "passport"
              ? "Flow: Create passport -> Enter details -> Congratulations, welcome to the VibeCart family with your VibeCart passport."
              : "Flow: Create account -> Enter details -> Congratulations, welcome to the VibeCart community.";
        }
      }

      if (linkToLogin) {
        linkToLogin.addEventListener("click", function (event) {
          event.preventDefault();
          showLogin();
        });
      }
      if (linkToCreate) {
        linkToCreate.addEventListener("click", function (event) {
          event.preventDefault();
          showCreate();
        });
      }
      if (buyerRoleBtn) {
        buyerRoleBtn.addEventListener("click", function () {
          if (roleInput) {
            roleInput.value = "buyer";
          }
          refreshRoleUi();
        });
      }
      if (sellerRoleBtn) {
        sellerRoleBtn.addEventListener("click", function () {
          if (roleInput) {
            roleInput.value = "seller";
          }
          refreshRoleUi();
        });
      }
      if (journeyPassportBtn) {
        journeyPassportBtn.addEventListener("click", function () {
          if (journeyInput) {
            journeyInput.value = "passport";
          }
          refreshJourneyUi();
        });
      }
      if (journeyAccountBtn) {
        journeyAccountBtn.addEventListener("click", function () {
          if (journeyInput) {
            journeyInput.value = "account";
          }
          refreshJourneyUi();
        });
      }
      if (roleInput && !roleInput.value) {
        roleInput.value = "buyer";
      }
      if (journeyInput && !journeyInput.value) {
        journeyInput.value = "passport";
      }
      refreshRoleUi();
      refreshJourneyUi();
    }

    function initSafeHeroRouting() {
      var chipHint = document.getElementById("heroChipHint");
      Array.prototype.slice.call(document.querySelectorAll(".hero-chip[data-hero-chip]")).forEach(function (chip) {
        chip.addEventListener("click", function () {
          var targetSelector = String(chip.getAttribute("data-hero-chip-target") || "").trim();
          var target = targetSelector ? document.querySelector(targetSelector) : null;
          if (chipHint) {
            chipHint.textContent = target ? "Jumping to section..." : "Section is unavailable right now.";
          }
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
      Array.prototype.slice.call(document.querySelectorAll(".hero-trust-row span")).forEach(function (pill, idx) {
        pill.style.cursor = "default";
        pill.removeAttribute("role");
        pill.removeAttribute("tabindex");
      });
    }

    function initMarketDeepLink() {
      var params = new URLSearchParams(window.location.search || "");
      var cat = String(params.get("cat") || "").trim();
      var flow = String(params.get("flow") || "").trim().toLowerCase();
      var allowed = { All: true, Electronics: true, Fashion: true, Books: true, Gaming: true };
      var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
      cards.forEach(function (card) {
        var name = String(card.getAttribute("data-filter") || "All").trim();
        var selected = !!cat && allowed[cat] && name === cat;
        card.classList.toggle("vc-cat-selected", selected);
        card.setAttribute("aria-current", selected ? "true" : "false");
      });
      if (cat && allowed[cat]) {
        var categoryFilter = document.getElementById("categoryFilter");
        if (categoryFilter) {
          categoryFilter.value = cat;
        }
        Array.prototype.slice.call(document.querySelectorAll(".product[data-category]")).forEach(function (item) {
          var kind = String(item.getAttribute("data-category") || "");
          item.style.display = cat === "All" || kind === cat ? "block" : "none";
        });
      }
      var hash = (window.location.hash || "").replace(/^#/, "").split("&")[0];
      var explicitMarketJump = String(params.get("instant") || "").trim() === "1";
      if (hash === "market" && explicitMarketJump && (cat || flow === "buy" || flow === "browse")) {
        window.setTimeout(function () {
          var market = document.getElementById("market");
          if (market) {
            market.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 420);
      }
    }

    function initSafeMarketFiltering() {
      var filter = document.getElementById("categoryFilter");
      var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
      var products = Array.prototype.slice.call(document.querySelectorAll(".product[data-category]"));
      var status = document.getElementById("expressCheckoutStatus");
      var allowed = { All: true, Electronics: true, Fashion: true, Books: true, Gaming: true };

      function applyCategory(cat) {
        var chosen = allowed[cat] ? cat : "All";
        products.forEach(function (item) {
          var kind = String(item.getAttribute("data-category") || "").trim();
          item.style.display = chosen === "All" || kind === chosen ? "block" : "none";
        });
        if (filter) {
          filter.value = chosen;
        }
        cards.forEach(function (card) {
          var name = String(card.getAttribute("data-filter") || "All").trim();
          var on = name === chosen;
          card.classList.toggle("vc-cat-selected", on);
          card.setAttribute("aria-current", on ? "true" : "false");
        });
        if (status) {
          status.textContent = chosen === "All" ? "Showing all live listings." : "Showing " + chosen + " live listings.";
        }
      }

      if (filter) {
        filter.addEventListener("change", function () {
          applyCategory(String(filter.value || "All").trim());
        });
      }

      cards.forEach(function (card) {
        card.addEventListener("click", function (event) {
          var name = String(card.getAttribute("data-filter") || "All").trim();
          if (!allowed[name]) {
            return;
          }
          // Safe mode should not hijack link routing; keep category highlight only.
          applyCategory(name);
        });
      });

      try {
        var params = new URLSearchParams(window.location.search || "");
        var cat = String(params.get("cat") || "").trim();
        applyCategory(cat || "All");
      } catch {
        applyCategory("All");
      }
    }

    function initRegionalYouthMarketCards() {
      var REGION_KEY = "vibecart-market-region";
      var regionSelect = document.getElementById("marketRegionSelect");

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
          var raw = String(localStorage.getItem(REGION_KEY) || "auto").trim().toLowerCase();
          return raw || "auto";
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

      function regionKey() {
        var mode = readRegionMode();
        if (mode && mode !== "auto") {
          return mode;
        }
        return inferRegionFromTimezone();
      }

      var marketByRegion = {
        eu: {
          Electronics: { name: "Amazon Germany", url: "https://www.amazon.de", badge: "Trending in EU", line: "Phones, creator gear, and campus tech deals." },
          Fashion: { name: "Zalando", url: "https://www.zalando.com", badge: "Trending in EU", line: "Streetwear, sneakers, and seasonal drops." },
          Books: { name: "Empik", url: "https://www.empik.com", badge: "Trending in EU", line: "Textbooks, manga, and study essentials." },
          Gaming: { name: "Steam Store", url: "https://store.steampowered.com", badge: "Trending in EU", line: "PC games, bundles, and esports picks." }
        },
        za: {
          Electronics: { name: "Takealot Tech", url: "https://www.takealot.com", badge: "Top in South Africa", line: "Phones, smart devices, and accessories." },
          Fashion: { name: "Superbalist", url: "https://www.superbalist.com", badge: "Top in South Africa", line: "Gen Z fashion, beauty, and lifestyle picks." },
          Books: { name: "Takealot Books", url: "https://www.takealot.com", badge: "Top in South Africa", line: "Campus books and learning resources." },
          Gaming: { name: "Game South Africa", url: "https://www.game.co.za", badge: "Top in South Africa", line: "Consoles, controllers, and gaming accessories." }
        },
        ke: {
          Electronics: { name: "Jumia Kenya", url: "https://www.jumia.co.ke", badge: "Top in Kenya", line: "Mobile-first electronics and accessories." },
          Fashion: { name: "Jumia Fashion KE", url: "https://www.jumia.co.ke", badge: "Top in Kenya", line: "Affordable style and trendwear." },
          Books: { name: "Nuria Kenya", url: "https://nuriakenya.com", badge: "Top in Kenya", line: "Books and educational supplies." },
          Gaming: { name: "Jumia Gaming KE", url: "https://www.jumia.co.ke", badge: "Top in Kenya", line: "Gaming gear and digital lifestyle products." }
        },
        zw: {
          Electronics: { name: "Techzim Market", url: "https://www.techzim.co.zw", badge: "Top in Zimbabwe", line: "Tech news + device deals used by local youth." },
          Fashion: { name: "Zim Fashion Connect", url: "https://www.facebook.com/marketplace/harare", badge: "Top in Zimbabwe", line: "Popular apparel picks around Harare markets." },
          Books: { name: "Books of Zimbabwe", url: "https://books.co.zw", badge: "Top in Zimbabwe", line: "School and university study materials." },
          Gaming: { name: "Zim Gaming Community", url: "https://www.facebook.com/groups/zimgaming", badge: "Top in Zimbabwe", line: "Controllers, consoles, and local gaming listings." }
        },
        gulf: {
          Electronics: { name: "Noon Tech", url: "https://www.noon.com", badge: "Top in Gulf", line: "Phones, tablets, and creator setups." },
          Fashion: { name: "Namshi", url: "https://en-ae.namshi.com", badge: "Top in Gulf", line: "Streetwear and lifestyle fashion." },
          Books: { name: "Amazon UAE Books", url: "https://www.amazon.ae/books-used-books-textbooks", badge: "Top in Gulf", line: "Books and personal development reads." },
          Gaming: { name: "Virgin Megastore UAE", url: "https://www.virginmegastore.ae", badge: "Top in Gulf", line: "Gaming, gadgets, and entertainment." }
        },
        asia: {
          Electronics: { name: "Shopee", url: "https://shopee.sg", badge: "Top in Asia", line: "Mobile gadgets and low-cost accessories." },
          Fashion: { name: "SHEIN", url: "https://www.shein.com", badge: "Top in Asia", line: "Fast-moving Gen Z fashion trends." },
          Books: { name: "Rakuten Books", url: "https://books.rakuten.co.jp", badge: "Top in Asia", line: "Study books, manga, and language packs." },
          Gaming: { name: "Steam Store", url: "https://store.steampowered.com", badge: "Top in Asia", line: "Regional game sales and PC esports picks." }
        },
        global: {
          Electronics: { name: "Amazon Electronics", url: "https://www.amazon.com/s?i=electronics&tag=vibecart20-20", badge: "Global youth pick", line: "Phones, gadgets, and creator accessories." },
          Fashion: { name: "ASOS", url: "https://www.asos.com", badge: "Global youth pick", line: "Gen Z fashion and accessories." },
          Books: { name: "AbeBooks", url: "https://www.abebooks.com", badge: "Global youth pick", line: "New, used, and university textbook finds." },
          Gaming: { name: "Steam Store", url: "https://store.steampowered.com", badge: "Global youth pick", line: "PC gaming and creator community titles." }
        }
      };

      var selected = marketByRegion[regionKey()] || marketByRegion.global;
      ["Electronics", "Fashion", "Books", "Gaming"].forEach(function (category) {
        var card = document.querySelector(".product[data-category='" + category + "']");
        var data = selected[category];
        if (!card || !data) return;
        var h3 = card.querySelector("h3");
        var price = card.querySelector(".price");
        var desc = card.querySelector("p:not(.price):not(.vc-photo-promise)");
        var btn = card.querySelector(".buy-now-btn");
        if (h3) {
          h3.textContent = data.name;
          try {
            var origin = new URL(data.url).origin;
            var img = document.createElement("img");
            img.className = "shop-favicon";
            img.width = 14;
            img.height = 14;
            img.alt = "";
            img.src = origin + "/favicon.ico";
            img.referrerPolicy = "no-referrer";
            img.addEventListener("error", function () { img.remove(); });
            h3.prepend(img);
          } catch {
            /* ignore */
          }
        }
        if (price) price.textContent = data.badge;
        if (desc) desc.textContent = data.line;
        if (btn) {
          btn.textContent = "Open shop";
          btn.setAttribute("data-title", data.name);
          btn.setAttribute("data-shop-name", data.name);
          btn.setAttribute("data-shop-url", data.url);
        }
      });

      if (regionSelect) {
        var mode = readRegionMode();
        regionSelect.value = mode;
        regionSelect.addEventListener("change", function () {
          var next = String(regionSelect.value || "auto").trim().toLowerCase();
          writeRegionMode(next);
          window.location.reload();
        });
      }
    }

    function initRoleAndAccountVisibility() {
      var auth = getStoredAuthUser();
      var isLoggedIn = Boolean(auth.token && auth.user);
      var role = String((auth.user && auth.user.role) || "buyer").toLowerCase();
      var privateInboxTop = document.getElementById("vcPrivateInboxTop");
      var communicationSection = document.getElementById("communication");
      var privateHint = document.getElementById("chatPrivateHint");
      var memberAura = document.getElementById("vcMemberAura");
      var guestAura = document.getElementById("vcGuestAura");
      var memberAuraTitle = document.getElementById("vcMemberAuraTitle");
      var memberAuraChip = document.getElementById("vcMemberAuraChip");

      var sellerSections = ["seller-marketing", "seller-growth-ai", "seller-ai-toolkit"];
      sellerSections.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var show = isLoggedIn && role === "seller";
        el.hidden = !show;
        el.classList.toggle("hidden", !show);
        el.style.display = show ? "" : "none";
      });

      var healthSection = document.getElementById("health-coach");
      if (healthSection) {
        healthSection.style.display = isLoggedIn ? "" : "none";
      }
      Array.prototype.slice.call(document.querySelectorAll("a[href=\"./wellbeing.html\"], .vc-mobile-chip[href=\"./wellbeing.html\"]")).forEach(function (a) {
        a.style.display = isLoggedIn ? "" : "none";
      });

      if (privateInboxTop) {
        privateInboxTop.classList.remove("hidden");
        privateInboxTop.textContent = isLoggedIn ? "✉ Inbox" : "✉ Inbox (sign in)";
      }
      if (communicationSection) {
        communicationSection.style.display = "";
      }
      if (privateHint) {
        privateHint.textContent = isLoggedIn
          ? "Private inbox: only you and the selected shop can see this thread."
          : "Sign in to open private buyer-seller messaging.";
      }
      if (memberAura) {
        memberAura.classList.toggle("hidden", !isLoggedIn);
      }
      if (guestAura) {
        guestAura.classList.toggle("hidden", isLoggedIn);
      }
      if (memberAuraTitle && isLoggedIn) {
        var name = String((auth.user && (auth.user.fullName || auth.user.email)) || "Traveler");
        memberAuraTitle.textContent = "Welcome, " + name + ". Your VibeCart passport is active.";
      }
      if (memberAuraChip && isLoggedIn) {
        memberAuraChip.textContent = "VibeCart Passport Holder · Active";
      }
    }

    function initCommunicationHub() {
      var input = document.getElementById("chatInput");
      var sendBtn = document.getElementById("chatSend");
      var messagesBox = document.getElementById("messagesBox");
      var shopInput = document.getElementById("chatShopInput");
      var shopSuggestions = document.getElementById("chatShopSuggestions");
      var status = document.getElementById("chatDispatchStatus");
      if (!input || !sendBtn || !messagesBox) {
        return;
      }

      var auth = getStoredAuthUser();
      var userKey = auth && auth.user ? String(auth.user.id || auth.user.email || "guest") : "guest";

      function threadKey(shop) {
        var safeShop = String(shop || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return "vibecart-thread-" + userKey + "-" + safeShop;
      }

      function readShopHistory() {
        try {
          var raw = JSON.parse(localStorage.getItem("vibecart-chat-shops-" + userKey) || "[]");
          if (!Array.isArray(raw)) return [];
          return raw.filter(function (x) { return typeof x === "string" && x.trim(); }).slice(0, 20);
        } catch {
          return [];
        }
      }

      function writeShopHistory(name) {
        var shop = String(name || "").trim();
        if (!shop) return;
        var next = readShopHistory().filter(function (x) { return x.toLowerCase() !== shop.toLowerCase(); });
        next.unshift(shop);
        localStorage.setItem("vibecart-chat-shops-" + userKey, JSON.stringify(next.slice(0, 20)));
      }

      function readThread(shop) {
        try {
          var raw = JSON.parse(localStorage.getItem(threadKey(shop)) || "[]");
          return Array.isArray(raw) ? raw : [];
        } catch {
          return [];
        }
      }

      function writeThread(shop, items) {
        localStorage.setItem(threadKey(shop), JSON.stringify(items || []));
      }

      function paintShopSuggestions() {
        if (!shopSuggestions) return;
        shopSuggestions.innerHTML = "";
        readShopHistory().forEach(function (name) {
          var opt = document.createElement("option");
          opt.value = name;
          shopSuggestions.appendChild(opt);
        });
      }

      paintShopSuggestions();
      try {
        var lastShop = JSON.parse(localStorage.getItem("vibecart-last-shop-context") || "null");
        if (lastShop && lastShop.shop && shopInput) {
          shopInput.value = String(lastShop.shop);
        }
      } catch {
        /* ignore */
      }

      function appendMessage(text, klass) {
        var p = document.createElement("p");
        p.className = "msg " + (klass || "");
        p.textContent = text;
        messagesBox.appendChild(p);
      }

      sendBtn.addEventListener("click", function () {
        var text = String(input.value || "").trim();
        if (!text) {
          return;
        }
        var shop = String((shopInput && shopInput.value) || "").trim();
        if (!shop) {
          if (status) status.textContent = "Type the shop name first.";
          return;
        }
        writeShopHistory(shop);
        paintShopSuggestions();
        var thread = readThread(shop);
        var outgoing = "You -> " + shop + ": " + text;
        appendMessage(outgoing, "msg-buyer");
        thread.push({ who: "buyer", text: outgoing, at: new Date().toISOString() });
        input.value = "";
        if (shopInput) {
          shopInput.value = shop;
        }
        localStorage.setItem("vibecart-last-shop-message", JSON.stringify({ shop: shop, text: text, at: new Date().toISOString() }));
        if (status) {
          status.textContent = "Message sent to " + shop + ". Waiting for seller reply...";
        }
        window.setTimeout(function () {
          var reply = shop + " -> You: Thanks, we received your message and will update shipping details shortly.";
          appendMessage(reply, "msg-seller");
          thread.push({ who: "seller", text: reply, at: new Date().toISOString() });
          writeThread(shop, thread.slice(-100));
          if (status) {
            status.textContent = "New reply from " + shop + ".";
          }
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification("New shop reply", { body: shop + " replied in Communication Hub." });
            } catch {
              /* ignore */
            }
          }
        }, 700);
      });

      if (shopInput) {
        shopInput.addEventListener("change", function () {
          var shop = String(shopInput.value || "").trim();
          if (!shop) return;
          var thread = readThread(shop);
          messagesBox.innerHTML = "";
          thread.forEach(function (entry) {
            appendMessage(String(entry.text || ""), entry.who === "seller" ? "msg-seller" : "msg-buyer");
          });
          if (status) {
            status.textContent = thread.length ? "Loaded private thread with " + shop + "." : "No private messages with " + shop + " yet.";
          }
        });
      }
    }

    // Restore forward progression for key journey buttons.
    var serviceType = document.getElementById("bookingServiceType");
    var bookingDate = document.getElementById("bookingDate");
    var showBookingSlots = document.getElementById("showBookingSlots");
    if (showBookingSlots) {
      showBookingSlots.addEventListener("click", function () {
        var service = serviceType ? String(serviceType.value || "Service") : "Service";
        var date = bookingDate ? String(bookingDate.value || "") : "";
        go("./account-hub.html?service=" + encodeURIComponent(service) + "&date=" + encodeURIComponent(date) + "#bookings");
      });
    }
    bindGo("refreshInsurance", "./insurance.html");
    bindGo("queueInsuranceTips", "./insurance.html");
    bindGo("nextTrackingStep", "./orders-tracking.html");
    bindGo("openReturnWindow", "./orders-tracking.html");
    /* #aiSuggest: script.js runs on-page ranking — do not bindGo here or every tap also navigates away. */
    bindGo("sgRunPlan", "./seller-boost.html");
    bindGo("refreshAds", "./policy.html");
    bindGo("earnRewardPoints", "./rewards-hub.html");
    bindGo("redeemReward", "./rewards-hub.html");
    initSafeAccountPassport();
    initSafeHeroRouting();
    initMarketDeepLink();
    initSafeMarketFiltering();
    initRegionalYouthMarketCards();
    initRoleAndAccountVisibility();
    initCommunicationHub();

    // Buy buttons should move to buyer flow instead of being inert.
    Array.prototype.slice.call(document.querySelectorAll(".buy-now-btn")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var title = String(btn.getAttribute("data-title") || "item");
        var cat = "All";
        var directShopUrl = String(btn.getAttribute("data-shop-url") || "").trim();
        var directShopName = String(btn.getAttribute("data-shop-name") || title).trim();
        var status = document.getElementById("expressCheckoutStatus");
        try {
          var card = btn.closest ? btn.closest(".product") : null;
          var heading = card ? card.querySelector("h3") : null;
          var shipLine = card ? card.querySelector("p:not(.price)") : null;
          cat = card ? String(card.getAttribute("data-category") || "All").trim() : "All";
          var shopName = heading ? String(heading.textContent || "").trim() : title;
          var shipFrom = shipLine ? String(shipLine.textContent || "").trim() : "";
          localStorage.setItem(
            "vibecart-last-shop-context",
            JSON.stringify({
              shop: shopName,
              shipFrom: shipFrom,
              item: title,
              at: new Date().toISOString()
            })
          );
        } catch {
          /* ignore */
        }
        if (directShopUrl) {
          var redirectUrl =
            "/api/public/shop/redirect?shop=" +
            encodeURIComponent(directShopName) +
            "&cat=" +
            encodeURIComponent(cat) +
            "&partner=" +
            encodeURIComponent(directShopName) +
            "&target=" +
            encodeURIComponent(directShopUrl);
          go(redirectUrl);
          return;
        }
        if (status) {
          status.textContent = "This offer has no external destination configured yet.";
        }
      });
    });

    // Failsafe: if other layers/scripts intercept taps, force Open shop buttons to still work.
    document.addEventListener(
      "click",
      function (event) {
        var target = event.target;
        var btn = target && target.closest ? target.closest(".buy-now-btn") : null;
        if (!btn) {
          return;
        }
        var directShopUrl = String(btn.getAttribute("data-shop-url") || "").trim();
        if (!directShopUrl) {
          return;
        }
        var title = String(btn.getAttribute("data-title") || "item");
        var directShopName = String(btn.getAttribute("data-shop-name") || title).trim();
        var cat = "All";
        try {
          var card = btn.closest ? btn.closest(".product") : null;
          cat = card ? String(card.getAttribute("data-category") || "All").trim() : "All";
        } catch {
          cat = "All";
        }
        var redirectUrl =
          "/api/public/shop/redirect?shop=" +
          encodeURIComponent(directShopName) +
          "&cat=" +
          encodeURIComponent(cat) +
          "&partner=" +
          encodeURIComponent(directShopName) +
          "&target=" +
          encodeURIComponent(directShopUrl);
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        go(redirectUrl);
      },
      true
    );
  });
})();
