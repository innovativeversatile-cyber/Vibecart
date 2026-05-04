"use strict";

(function () {
  /**
   * Trusted third-party entry points for real-world shops (no invented merchant URLs).
   * Opens Google Maps, OpenStreetMap search, DuckDuckGo, or Google web search with the user query.
   */
  function worldwideRetailLinkRows(rawQuery) {
    var q = String(rawQuery || "").trim();
    if (!q) {
      return [];
    }
    return [
      {
        label: "Open in Google Maps",
        href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q)
      },
      {
        label: "Search OpenStreetMap",
        href: "https://www.openstreetmap.org/search?query=" + encodeURIComponent(q)
      },
      {
        label: "DuckDuckGo (shops & stores)",
        href: "https://duckduckgo.com/?q=" + encodeURIComponent(q + " shop OR store OR restaurant")
      },
      {
        label: "Google (shops & stores)",
        href: "https://www.google.com/search?q=" + encodeURIComponent(q + " shop store")
      }
    ];
  }

  function renderWorldwideShopLinks(container, rawQuery) {
    if (!container) {
      return;
    }
    container.innerHTML = "";
    var q = String(rawQuery || "").trim();
    if (!q) {
      return;
    }
    var head = document.createElement("p");
    head.className = "note";
    head.style.marginTop = "0.65rem";
    head.innerHTML =
      "<strong>Shops anywhere on the map &amp; web.</strong> These buttons open established map and search sites — VibeCart does not fabricate store links.";
    container.appendChild(head);
    var box = document.createElement("div");
    box.className = "hero-actions";
    box.style.flexWrap = "wrap";
    box.style.marginTop = "0.45rem";
    worldwideRetailLinkRows(q).forEach(function (row) {
      var a = document.createElement("a");
      a.className = "btn btn-secondary";
      a.href = row.href;
      a.textContent = row.label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      box.appendChild(a);
    });
    container.appendChild(box);
    var siteOnly = document.createElement("p");
    siteOnly.className = "note";
    siteOnly.style.marginTop = "0.55rem";
    var ddgVc = "https://duckduckgo.com/?q=" + encodeURIComponent(q + " site:vibe-cart.com");
    var gVc = "https://www.google.com/search?q=" + encodeURIComponent(q + " site:vibe-cart.com");
    siteOnly.innerHTML =
      "Search only this site: <a href=\"" +
      ddgVc +
      "\" target=\"_blank\" rel=\"noopener noreferrer\">DuckDuckGo</a> · <a href=\"" +
      gVc +
      "\" target=\"_blank\" rel=\"noopener noreferrer\">Google</a>";
    container.appendChild(siteOnly);
  }

  var siteIndex = [
    { title: "Home hub", url: "./index.html", keywords: "home marketplace bridge account" },
    { title: "Global search", url: "./global-search.html", keywords: "search find everything" },
    { title: "Passport welcome", url: "./passport-welcome.html", keywords: "welcome citizen passport signup" },
    { title: "Lane passport", url: "./lane-passport.html", keywords: "passport register sign up create account login email password" },
    { title: "My Business — beauty & services", url: "./my-business.html", keywords: "my business my hustle beauty service booking hair barber nails makeup bakery baker portfolio my-business beauty-services" },
    { title: "Service provider hub", url: "./service-provider-hub.html", keywords: "provider business booking payment deposit barber salon bakery hairdresser hair nails makeup" },
    { title: "Fashion trends lane", url: "./fashion-trends.html", keywords: "fashion trends outfits style runway clothes shoes" },
    { title: "Live market shops", url: "./live-market-shops.html", keywords: "market shops fashion electronics books gaming affiliate ireland dublin belfast northern ireland ROI" },
    { title: "World shop experience", url: "./world-shop-experience.html", keywords: "world shop experience preview lanes" },
    { title: "Popular market", url: "./popular-market.html", keywords: "popular market categories" },
    { title: "Live market folders", url: "./live-market.html", keywords: "live market folders" },
    { title: "Regional shops", url: "./regional-shops.html", keywords: "africa europe asia ireland regional shops folders" },
    {
      title: "Ireland — live shops (ROI & NI)",
      url: "./live-market-shops.html?cat=All&region=ie",
      keywords: "ireland southern ireland republic dublin cork galway limerick northern ireland belfast country IE register shops"
    },
    { title: "Europe shops", url: "./shops-europe.html", keywords: "fashion europe beauty allegro zara hm poland uk ireland" },
    { title: "Asia shops", url: "./shops-asia.html", keywords: "asia shopee shein fashion electronics" },
    { title: "Global shops", url: "./shops-global.html", keywords: "global amazon asos worldwide" },
    { title: "Mama Africa shops", url: "./shops-mama-africa.html", keywords: "africa takealot jumia nigeria kenya zimbabwe" },
    { title: "Scents and beauty", url: "./shops-scents.html", keywords: "perfume fragrance beauty cosmetics sephora cult" },
    { title: "Wellbeing coach", url: "./wellbeing.html", keywords: "wellbeing fitness ai coach health goals" },
    { title: "Insurance", url: "./insurance.html", keywords: "insurance plans coverage health funeral life student" },
    { title: "Account hub", url: "./account-hub.html", keywords: "account bookings profile passport login register" },
    { title: "Trade bridge hub", url: "./bridge-hub.html", keywords: "bridge trade africa europe asia communication route" },
    { title: "Browse categories", url: "./browse-categories.html", keywords: "categories browse lanes" },
    { title: "Hot picks", url: "./hot-picks.html", keywords: "hot picks live offers trending now" },
    { title: "Rewards hub", url: "./rewards-hub.html", keywords: "rewards points loyalty" },
    { title: "Orders tracking", url: "./orders-tracking.html", keywords: "orders tracking delivery shipment" },
    { title: "Buyer Orders", url: "./buyer-orders.html", keywords: "buyer orders confirm received escrow release" },
    { title: "Seller Orders", url: "./seller-orders.html", keywords: "seller orders payout disputes confirm order" },
    { title: "Coach subscription checkout", url: "./checkout-details.html?flow=coach&plan=starter", keywords: "coach checkout subscription payment" },
    { title: "Payment confirmation", url: "./payment-confirmation.html", keywords: "payment confirmation receipt" },
    { title: "Buy journey", url: "./buy-journey.html?flow=buy&lane=fashion", keywords: "buy journey checkout steps fashion buyer" },
    { title: "Sell journey", url: "./sell-journey.html", keywords: "sell journey seller onboarding" },
    { title: "Seller boost", url: "./seller-boost.html", keywords: "seller boost ai marketing growth" },
    { title: "Plan workspace", url: "./plan-workspace.html", keywords: "plan workspace business ai routines" },
    { title: "Legal settings", url: "./legal-settings.html", keywords: "legal settings privacy terms language" },
    { title: "Security overview", url: "./security-overview.html", keywords: "security fraud audit safety" },
    { title: "Insurance audience fit", url: "./audience-fit.html", keywords: "audience insurance fit" },
    { title: "Lane welcome", url: "./lane-welcome.html", keywords: "lane welcome onboarding" },
    { title: "Affiliate dashboard", url: "./affiliate-dashboard.html", keywords: "affiliate referrals owner dashboard" },
    { title: "Policy", url: "./policy.html", keywords: "policy rules marketplace" },
    { title: "Terms", url: "./terms.html", keywords: "terms conditions legal" },
    { title: "Privacy", url: "./privacy.html", keywords: "privacy data protection" }
  ];

  var form = document.getElementById("globalSearchForm");
  var input = document.getElementById("globalSearchInput");
  var status = document.getElementById("globalSearchStatus");
  var results = document.getElementById("globalSearchSiteResults");
  var worldwideEl = document.getElementById("globalWorldwideShopLinks");
  var webBtn = document.getElementById("globalWebSearchBtn");
  var googleBtn = document.getElementById("globalGoogleSearchBtn");

  function readQueryFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return String(params.get("q") || "").trim();
    } catch {
      return "";
    }
  }

  function paint(query) {
    if (!results || !status) {
      return;
    }
    var q = String(query || "").trim().toLowerCase();
    if (!q) {
      results.innerHTML = "<div class='msg msg-buyer'>Enter a keyword to search website and web.</div>";
      status.textContent = "";
      if (worldwideEl) {
        worldwideEl.innerHTML = "";
      }
      return;
    }
    var matches = siteIndex.filter(function (item) {
      var hay = (item.title + " " + item.keywords + " " + item.url).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    status.textContent = matches.length
      ? matches.length + " VibeCart results found."
      : "No direct site match. Use web search buttons below.";
    results.innerHTML = "";
    matches.forEach(function (item) {
      var row = document.createElement("a");
      row.className = "msg msg-seller";
      row.href = item.url;
      row.textContent = item.title + " | " + item.url;
      results.appendChild(row);
    });
    renderWorldwideShopLinks(worldwideEl, String(query || "").trim());
    var ddgWorld = "https://duckduckgo.com/?q=" + encodeURIComponent(String(query || "").trim() + " shop OR store");
    var ggWorld = "https://www.google.com/search?q=" + encodeURIComponent(String(query || "").trim() + " shop store");
    if (webBtn) {
      webBtn.href = ddgWorld;
      webBtn.textContent = "DuckDuckGo (worldwide shops)";
    }
    if (googleBtn) {
      googleBtn.href = ggWorld;
      googleBtn.textContent = "Google (worldwide shops)";
    }
  }

  if (form && input) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = String(input.value || "").trim();
      var next = "./global-search.html?q=" + encodeURIComponent(query);
      window.history.replaceState(null, "", next);
      paint(query);
    });
  }

  var initial = readQueryFromUrl();
  if (input) input.value = initial;
  paint(initial);
})();
