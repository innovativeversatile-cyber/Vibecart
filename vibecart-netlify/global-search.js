"use strict";

(function () {
  var siteIndex = [
    { title: "Home hub", url: "./index.html", keywords: "home marketplace bridge account" },
    { title: "Global search", url: "./global-search.html", keywords: "search find everything" },
    { title: "Passport welcome", url: "./passport-welcome.html", keywords: "welcome citizen passport signup" },
    { title: "Lane passport", url: "./lane-passport.html", keywords: "passport register sign up create account login email password" },
    { title: "Service provider hub", url: "./service-provider-hub.html", keywords: "provider business booking payment deposit barber salon" },
    { title: "Fashion trends lane", url: "./fashion-trends.html", keywords: "fashion trends outfits style runway clothes shoes" },
    { title: "Live market shops", url: "./live-market-shops.html", keywords: "market shops fashion electronics books gaming affiliate" },
    { title: "World shop experience", url: "./world-shop-experience.html", keywords: "world shop experience preview lanes" },
    { title: "Popular market", url: "./popular-market.html", keywords: "popular market categories" },
    { title: "Live market folders", url: "./live-market.html", keywords: "live market folders" },
    { title: "Regional shops", url: "./regional-shops.html", keywords: "africa europe asia regional shops folders" },
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
    { title: "Checkout details", url: "./checkout-details.html", keywords: "checkout payment stripe card" },
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
    var ddg = "https://duckduckgo.com/?q=" + encodeURIComponent(query + " site:vibe-cart.com");
    var gg = "https://www.google.com/search?q=" + encodeURIComponent(query + " site:vibe-cart.com");
    if (webBtn) webBtn.href = ddg;
    if (googleBtn) googleBtn.href = gg;
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
