"use strict";

(function () {
  if (window.__vibecartHomeLiteBooted === true) {
    return;
  }
  window.__vibecartHomeLiteBooted = true;
  var FLAG_STORE_KEY = "vibecart-home-lite-flags";
  var defaultFlags = Object.freeze({
    advancedSmartTourV1: true,
    advancedShockReelV1: true,
    advancedEpicCarouselV1: true,
    advancedVisualRhythmV1: true,
    advancedAtmosphereDeckV1: true,
    advancedPersonaChooserV1: true,
    advancedListingHealthV1: true,
    advancedBridgeFaqCopyV1: true,
    advancedDetailsMemoryV1: true,
    advancedMobileQuickNavV1: true,
    advancedSellerReadinessV1: true,
    advancedCheckoutClarityV1: true,
    advancedSellerNextActionV1: true,
    advancedPartnerPinV1: true,
    advancedBuyerQuickStartV1: true,
    advancedSellerMomentumV1: true,
    advancedPartnerRecallV1: true,
    advancedVisualJourneyV1: true,
    advancedInstallPromptV1: true,
    advancedPwaBootstrapV1: true,
    advancedCommunicationIntelV1: true,
    advancedHealthCoachIntelV1: true,
    advancedSellerGrowthIntelV1: true,
    hardPass_guidedUx_v1: true,
    hardPass_trustSignals_v1: true,
    hardPass_linkResilience_v1: true,
    hardPass_cinematicMoments_v1: true,
    hardPass_immersiveMode_v1: true,
    hardPass_offerExplain_v1: true,
    hardPass_publishPreflight_v1: true,
    hardPass_checkoutResilience_v1: true,
    hardPass_telemetry_v1: true
  });
  var flags = loadFeatureFlags();

  function loadFeatureFlags() {
    var out = {};
    Object.keys(defaultFlags).forEach(function (k) {
      out[k] = defaultFlags[k] === true;
    });
    try {
      var raw = JSON.parse(localStorage.getItem(FLAG_STORE_KEY) || "{}");
      if (raw && typeof raw === "object") {
        Object.keys(defaultFlags).forEach(function (k) {
          if (typeof raw[k] === "boolean") out[k] = raw[k];
        });
      }
    } catch {
      /* ignore */
    }
    try {
      var params = new URLSearchParams(window.location.search);
      var queryValue = String(params.get("vcflags") || "").trim();
      if (queryValue) {
        queryValue.split(",").forEach(function (entry) {
          var token = String(entry || "").trim();
          if (!token) return;
          var enabled = token.charAt(0) !== "-";
          var key = enabled ? token : token.slice(1);
          if (Object.prototype.hasOwnProperty.call(defaultFlags, key)) {
            out[key] = enabled;
          }
        });
      }
    } catch {
      /* ignore */
    }
    return out;
  }

  function featureOn(flagName) {
    return flags[flagName] === true;
  }
  function safeScrollToHash(hash) {
    if (!hash || hash.length < 2) return;
    var id = String(hash).replace(/^#/, "").trim();
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initHashLinks() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest("a[href^='#']") : null;
      if (!anchor) return;
      var href = String(anchor.getAttribute("href") || "").trim();
      if (!href || href === "#") return;
      event.preventDefault();
      safeScrollToHash(href);
    });
  }

  function initOpenShopStatus() {
    var status = document.getElementById("expressCheckoutStatus");
    if (!status) return;
    document.addEventListener("click", function (event) {
      var target = event.target;
      var link = target && target.closest ? target.closest("a.btn.btn-primary[href*='/api/public/shop/redirect']") : null;
      if (!link) return;
      status.textContent = "Opening partner shop...";
    });
  }

  function initCategoryFilter() {
    var filter = document.getElementById("categoryFilter");
    if (!filter) return;
    var products = Array.prototype.slice.call(document.querySelectorAll("#products .product[data-category]"));
    if (!products.length) return;
    var CATEGORY_KEY = "vibecart-home-lite-category";
    function applyCategory(value) {
      var chosen = String(value || "All").trim();
      products.forEach(function (item) {
        var cat = String(item.getAttribute("data-category") || "").trim();
        item.style.display = chosen === "All" || cat === chosen ? "block" : "none";
      });
      try {
        localStorage.setItem(CATEGORY_KEY, chosen);
      } catch {
        /* ignore */
      }
    }
    filter.addEventListener("change", function () {
      applyCategory(filter.value);
    });
    var initial = filter.value || "All";
    try {
      var stored = localStorage.getItem(CATEGORY_KEY);
      if (stored) {
        initial = stored;
        filter.value = stored;
      }
    } catch {
      /* ignore */
    }
    applyCategory(initial);
  }

  function initCategoryCards() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var filter = document.getElementById("categoryFilter");
    if (!cards.length || !filter) return;
    cards.forEach(function (card) {
      card.addEventListener("click", function (event) {
        var chosen = String(card.getAttribute("data-filter") || "All").trim();
        if (!chosen) return;
        event.preventDefault();
        filter.value = chosen;
        var changeEvt;
        try {
          changeEvt = new Event("change", { bubbles: true });
        } catch {
          changeEvt = document.createEvent("Event");
          changeEvt.initEvent("change", true, true);
        }
        filter.dispatchEvent(changeEvt);
        cards.forEach(function (item) {
          var on = item === card;
          item.classList.toggle("vc-cat-selected", on);
          item.setAttribute("aria-current", on ? "true" : "false");
        });
        var market = document.getElementById("market");
        if (market) {
          market.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function initAiAssistantLite() {
    var btn = document.getElementById("aiSuggest");
    var need = document.getElementById("aiNeed");
    var budget = document.getElementById("aiBudget");
    var category = document.getElementById("aiCategory");
    var out = document.getElementById("aiResult");
    if (!btn || !need || !budget || !category || !out) return;

    var smartCatalog = [
      { tag: "phone", brand: "Samsung Galaxy A55", shop: "Amazon Electronics", category: "Electronics", eur: 389, target: "https://www.amazon.com/s?k=samsung+galaxy+a55" },
      { tag: "phone", brand: "iPhone 13", shop: "Amazon Electronics", category: "Electronics", eur: 599, target: "https://www.amazon.com/s?k=iphone+13" },
      { tag: "phone", brand: "Xiaomi Redmi Note 13", shop: "Amazon Electronics", category: "Electronics", eur: 249, target: "https://www.amazon.com/s?k=redmi+note+13" },
      { tag: "laptop", brand: "Lenovo ThinkPad E14", shop: "Amazon Electronics", category: "Electronics", eur: 779, target: "https://www.amazon.com/s?k=lenovo+thinkpad+e14" },
      { tag: "laptop", brand: "ASUS Vivobook 15", shop: "Amazon Electronics", category: "Electronics", eur: 649, target: "https://www.amazon.com/s?k=asus+vivobook+15" },
      { tag: "laptop", brand: "Acer Aspire 5", shop: "Amazon Electronics", category: "Electronics", eur: 569, target: "https://www.amazon.com/s?k=acer+aspire+5" },
      { tag: "shoes", brand: "Nike Air Max", shop: "Zalando", category: "Fashion", eur: 130, target: "https://www.zalando.com/catalog/?q=nike+air+max" },
      { tag: "shoes", brand: "Adidas Ultraboost", shop: "Zalando", category: "Fashion", eur: 155, target: "https://www.zalando.com/catalog/?q=adidas+ultraboost" },
      { tag: "shoes", brand: "New Balance 574", shop: "Zalando", category: "Fashion", eur: 110, target: "https://www.zalando.com/catalog/?q=new+balance+574" },
      { tag: "book", brand: "Atomic Habits", shop: "AbeBooks", category: "Books", eur: 18, target: "https://www.abebooks.com/servlet/SearchResults?kn=atomic+habits" },
      { tag: "book", brand: "Deep Work", shop: "AbeBooks", category: "Books", eur: 16, target: "https://www.abebooks.com/servlet/SearchResults?kn=deep+work" },
      { tag: "book", brand: "The Psychology of Money", shop: "AbeBooks", category: "Books", eur: 17, target: "https://www.abebooks.com/servlet/SearchResults?kn=psychology+of+money" },
      { tag: "game", brand: "EA Sports FC 25", shop: "Steam Store", category: "Gaming", eur: 69, target: "https://store.steampowered.com/search/?term=ea+sports+fc+25" },
      { tag: "game", brand: "Forza Horizon 5", shop: "Steam Store", category: "Gaming", eur: 59, target: "https://store.steampowered.com/search/?term=forza+horizon+5" },
      { tag: "game", brand: "Helldivers 2", shop: "Steam Store", category: "Gaming", eur: 39, target: "https://store.steampowered.com/search/?term=helldivers+2" }
    ];

    function toNum(v) {
      var n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }

    function keywordFor(needText) {
      var v = String(needText || "").toLowerCase();
      if (v.indexOf("phone") >= 0 || v.indexOf("smart") >= 0 || v.indexOf("mobile") >= 0) return "phone";
      if (v.indexOf("laptop") >= 0 || v.indexOf("computer") >= 0) return "laptop";
      if (v.indexOf("shoe") >= 0 || v.indexOf("sneaker") >= 0) return "shoes";
      if (v.indexOf("book") >= 0 || v.indexOf("read") >= 0) return "book";
      if (v.indexOf("game") >= 0 || v.indexOf("gaming") >= 0) return "game";
      return "";
    }

    function scoreFor(item, pref, key) {
      var s = 0;
      if (pref.category === "All" || item.category === pref.category) s += 25;
      if (key && item.tag === key) s += 45;
      if (pref.budget > 0) {
        var delta = Math.abs(Number(item.eur || 0) - pref.budget);
        s += Math.max(0, 25 - Math.floor(delta / 25));
      } else {
        s += 10;
      }
      if (pref.need && String(item.brand || "").toLowerCase().indexOf(pref.need.toLowerCase()) >= 0) s += 20;
      return s;
    }

    function rowFor(item, pref, key) {
      var href =
        "/api/public/shop/redirect?shop=" +
        encodeURIComponent(item.shop) +
        "&cat=" +
        encodeURIComponent(item.category) +
        "&partner=" +
        encodeURIComponent(item.shop) +
        "&target=" +
        encodeURIComponent(item.target);
      var fit = rationaleFor(item, pref, key) || "balanced match";
      var pricePct = pref.budget > 0 ? Math.max(8, Math.min(100, Math.round((Number(item.eur || 0) / pref.budget) * 100))) : 56;
      return (
        "<article class=\"vc-info-card vc-ai-decision-card\">" +
        "<h3>" +
        item.brand +
        "</h3><p class=\"vc-ai-fit-line\">" +
        fit +
        "</p><p>" +
        item.category +
        " · " +
        item.shop +
        " · ~EUR " +
        String(Number(item.eur || 0).toFixed(0)) +
        "</p><div class=\"vc-ai-budget-meter\" aria-hidden=\"true\"><span style=\"width:" +
        String(pricePct) +
        "%\"></span></div><div class=\"hero-actions\"><button class=\"btn btn-secondary\" type=\"button\" data-ai-prefill=\"" +
        item.tag +
        "\">Try similar</button><a class=\"btn btn-secondary\" href=\"" +
        href +
        "\">Open option</a></div></article>"
      );
    }

    function routeLensLabel() {
      try {
        var path = String(localStorage.getItem("vibecart-home-lite-bridge-path") || "").trim();
        if (path === "from-africa") return "Route lens: Africa -> Europe";
        if (path === "from-europe") return "Route lens: Europe -> Africa";
      } catch {
        /* ignore */
      }
      return "Route lens: Africa <-> Europe, Dubai, and Asia";
    }

    function rationaleFor(item, pref, key) {
      var reasons = [];
      if (key && item.tag === key) reasons.push("exact need match");
      if (pref.category === "All" || item.category === pref.category) reasons.push("category aligned");
      if (pref.budget > 0) {
        var budgetDelta = Number(item.eur || 0) - pref.budget;
        if (budgetDelta <= 0) reasons.push("within budget");
        else reasons.push("premium stretch");
      }
      return reasons.slice(0, 3).join(" · ");
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      var pref = {
        need: String(need.value || "").trim(),
        budget: toNum(budget.value || 0),
        category: String(category.value || "All").trim() || "All"
      };
      var key = keywordFor(pref.need);
      var options = smartCatalog.filter(function (item) {
        if (pref.category !== "All" && item.category !== pref.category) return false;
        if (key && item.tag !== key) return false;
        if (pref.budget > 0 && Number(item.eur || 0) > pref.budget * 1.4) return false;
        return true;
      });
      if (!options.length) {
        options = smartCatalog.filter(function (item) {
          return pref.category === "All" || item.category === pref.category;
        });
      }
      options = options
        .map(function (item) {
          return { item: item, score: scoreFor(item, pref, key) };
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, 6)
        .map(function (row) {
          return row.item;
        });
      var top = options.length ? options[0] : null;
      var summary =
        "<p class=\"note\">VibeAI premium picks: ranked brand options with direct partner links." +
        (top
          ? " Best first pick: " +
            top.brand +
            " (" +
            rationaleFor(top, pref, key) +
            ")."
          : "") +
        " " +
        routeLensLabel() +
        "</p>";
      out.innerHTML =
        summary +
        "<div class=\"hero-actions vc-ai-quick-lanes\">" +
        "<button type=\"button\" class=\"btn btn-secondary\" data-ai-quick=\"phone\">Phones</button>" +
        "<button type=\"button\" class=\"btn btn-secondary\" data-ai-quick=\"laptop\">Laptops</button>" +
        "<button type=\"button\" class=\"btn btn-secondary\" data-ai-quick=\"shoes\">Fashion</button>" +
        "<button type=\"button\" class=\"btn btn-secondary\" data-ai-quick=\"game\">Gaming</button>" +
        "</div>" +
        options
          .map(function (item) {
            return rowFor(item, pref, key);
          })
          .join("");
    });

    out.addEventListener("click", function (event) {
      var quick = event.target && event.target.closest ? event.target.closest("[data-ai-quick]") : null;
      if (quick) {
        event.preventDefault();
        var token = String(quick.getAttribute("data-ai-quick") || "").trim();
        if (token === "phone") need.value = "phone";
        if (token === "laptop") need.value = "laptop";
        if (token === "shoes") {
          need.value = "shoes";
          category.value = "Fashion";
        }
        if (token === "game") {
          need.value = "gaming";
          category.value = "Gaming";
        }
        btn.click();
        return;
      }
      var prefill = event.target && event.target.closest ? event.target.closest("[data-ai-prefill]") : null;
      if (!prefill) return;
      event.preventDefault();
      var tag = String(prefill.getAttribute("data-ai-prefill") || "").trim();
      if (tag) {
        need.value = tag;
        btn.click();
      }
    });
  }

  function initHomepageFocusLite() {
    var hero = document.querySelector(".hero .hero-actions");
    if (!hero) return;
    var STORE_KEY = "vibecart-home-lite-focus-mode";
    var HIDE_SELECTORS = [
      "#topClassExperience",
      ".vc-world-shock",
      ".vc-epic-experience",
      ".vc-visual-splash",
      ".vc-mobile-chapter-deck",
      "#market-fit",
      "#rewards",
      "#tax-transparency",
      "#public-transparency",
      "#seller-marketing",
      "#seller-growth-ai",
      "#settings-hub"
    ];

    function readFocus() {
      try {
        var v = String(localStorage.getItem(STORE_KEY) || "focused").trim();
        return v !== "full";
      } catch {
        return true;
      }
    }

    function writeFocus(isFocused) {
      try {
        localStorage.setItem(STORE_KEY, isFocused ? "focused" : "full");
      } catch {
        /* ignore */
      }
    }

    var btn = document.getElementById("vcToggleHomeMode");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "vcToggleHomeMode";
      btn.type = "button";
      btn.className = "btn btn-secondary";
      hero.appendChild(btn);
    }

    function apply(isFocused) {
      document.body.classList.toggle("vc-focused-home", isFocused);
      HIDE_SELECTORS.forEach(function (selector) {
        Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function (node) {
          node.classList.toggle("vc-focused-hidden", isFocused);
        });
      });
      btn.textContent = isFocused ? "Open full experience" : "Back to focused home";
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      var next = !document.body.classList.contains("vc-focused-home");
      writeFocus(next);
      apply(next);
    });

    apply(readFocus());
  }

  function initTrackingLite() {
    var timeline = document.getElementById("trackingTimeline");
    var nextBtn = document.getElementById("nextTrackingStep");
    var returnBtn = document.getElementById("openReturnWindow");
    var returnInfo = document.getElementById("returnWindowInfo");
    if (!timeline || !nextBtn || !returnBtn || !returnInfo) return;

    var steps = [
      "Order received",
      "Payment verified",
      "Packed by seller",
      "Courier picked up",
      "In transit",
      "Out for delivery",
      "Delivered"
    ];
    var idx = 0;
    var returnOpen = false;

    function render() {
      timeline.innerHTML = "";
      for (var i = 0; i <= idx; i += 1) {
        var row = document.createElement("div");
        row.className = "note";
        row.textContent = "• " + steps[i];
        timeline.appendChild(row);
      }
      returnInfo.textContent = "Return/refuse window status: " + (returnOpen ? "open" : "closed");
    }

    nextBtn.addEventListener("click", function () {
      if (idx < steps.length - 1) idx += 1;
      render();
    });
    returnBtn.addEventListener("click", function () {
      returnOpen = true;
      render();
    });

    render();
  }

  function initBookingLite() {
    var service = document.getElementById("bookingServiceType");
    var date = document.getElementById("bookingDate");
    var btn = document.getElementById("showBookingSlots");
    var out = document.getElementById("bookingSlotsResult");
    if (!service || !date || !btn || !out) return;

    function sampleSlots(baseDate) {
      var d = baseDate ? new Date(baseDate + "T09:00:00") : new Date();
      var day = isNaN(d.getTime()) ? "today" : d.toLocaleDateString();
      return [
        "09:00",
        "11:30",
        "14:00",
        "16:30"
      ].map(function (t) {
        return day + " at " + t;
      });
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      var pickedService = String(service.value || "Service").trim();
      var pickedDate = String(date.value || "").trim();
      var slots = sampleSlots(pickedDate);
      out.innerHTML = "";
      var title = document.createElement("p");
      title.className = "note";
      title.textContent = "Available " + pickedService + " slots:";
      out.appendChild(title);
      slots.forEach(function (slot) {
        var row = document.createElement("div");
        row.className = "hero-actions";
        row.style.margin = "0.35rem 0";
        var link = document.createElement("a");
        link.className = "btn btn-secondary";
        link.href =
          "./service-provider-hub.html?service=" +
          encodeURIComponent(pickedService) +
          "&date=" +
          encodeURIComponent(pickedDate || "today") +
          "&slot=" +
          encodeURIComponent(slot);
        link.textContent = "Open " + slot + " options";
        row.appendChild(link);
        out.appendChild(row);
      });
    });
  }

  function initAdsLite() {
    var btn = document.getElementById("refreshAds");
    var slots = document.getElementById("adSlots");
    if (!btn || !slots) return;

    var ads = [
      { title: "Campus Headsets", note: "Student-friendly audio deals.", href: "./hot-picks.html?lane=Electronics" },
      { title: "Wireless Pro Controllers", note: "Gaming accessories, quick ship lanes.", href: "./hot-picks.html?lane=Gaming" },
      { title: "Cross-border Trade Base", note: "Starter resources for legal route planning.", href: "./bridge-hub.html" }
    ];

    function render() {
      slots.innerHTML = "";
      ads.forEach(function (ad) {
        var card = document.createElement("article");
        card.className = "vc-info-card";
        card.innerHTML = "<h3>" + ad.title + "</h3><p>" + ad.note + "</p>";
        var openBtn = document.createElement("button");
        openBtn.type = "button";
        openBtn.className = "btn btn-secondary";
        openBtn.textContent = "Open";
        openBtn.addEventListener("click", function (event) {
          event.preventDefault();
          if (!ad.href) return;
          window.location.assign(ad.href);
        });
        card.appendChild(openBtn);
        slots.appendChild(card);
      });
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      render();
    });
    render();
  }

  function initVisualJourneyLite() {
    var host = document.getElementById("vcVisualJourneyGrid");
    if (!host) return;
    var steps = [
      {
        title: "1 · Signal",
        note: "Cold open: you scan lanes fast — categories, filters, and partner memory narrow the field before doubt sets in.",
        pulse: true
      },
      {
        title: "2 · Tension",
        note: "Two good options is worse than one great one. Compare route-aware context until one path feels inevitable.",
        pulse: true
      },
      {
        title: "3 · Lock",
        note: "Verify shipping bands, policy truth, and trust notes. If anything feels off, you pause — humans still review edge cases.",
        pulse: false
      },
      {
        title: "4 · Handoff",
        note: "Open shop: checkout explodes onto the partner domain you chose — VibeCart never pretends to be the card vault.",
        pulse: true
      },
      {
        title: "5 · Aftermath",
        note: "Complete in one direction: tracking, receipts, rewards, and support stay in the same straight route from checkout to closure.",
        pulse: false
      }
    ];
    host.innerHTML = steps
      .map(function (s) {
        var cls = "vc-visual-step" + (s.pulse ? " vc-visual-step--pulse" : "");
        return (
          "<article class=\"" +
          cls +
          "\"><h3><img src=\"./icon-maskable.svg\" alt=\"step\" />" +
          s.title +
          "</h3><p>" +
          s.note +
          "</p></article>"
        );
      })
      .join("");
  }

  function initInsuranceTipsLite() {
    var tipsBtn = document.getElementById("queueInsuranceTips");
    var out = document.getElementById("wellbeingTips");
    if (!tipsBtn || !out) return;

    var tips = [
      "Compare policy terms, not just monthly price.",
      "Keep claim contact numbers saved offline.",
      "Confirm country-specific exclusions before payment.",
      "Use licensed providers only and verify renewal terms."
    ];

    tipsBtn.addEventListener("click", function (event) {
      event.preventDefault();
      out.textContent = "Well-being and protection tips: " + tips.join(" | ");
    });
  }

  function initInsuranceLite() {
    var refreshBtn = document.getElementById("refreshInsurance");
    var host = document.getElementById("insurancePlans");
    if (!refreshBtn || !host) return;

    var plans = [
      {
        name: "AXA Student Protect",
        line: "International insurer. Confirm local policy availability on AXA official channels.",
        href: "https://www.axa.com/"
      },
      {
        name: "Discovery Health Flex",
        line: "Regional health support options with country-specific eligibility checks.",
        href: "https://www.discovery.co.za/"
      },
      {
        name: "Old Mutual Starter Cover",
        line: "Life and funeral support plans. Verify underwriting terms before payment.",
        href: "https://www.oldmutual.com/"
      }
    ];

    function render() {
      host.innerHTML = "";
      plans.forEach(function (p) {
        var card = document.createElement("article");
        card.className = "vc-info-card";
        card.innerHTML =
          "<h3>" +
          p.name +
          "</h3><p>" +
          p.line +
          "</p><a class=\"btn btn-secondary\" href=\"" +
          p.href +
          "\" target=\"_blank\" rel=\"noopener noreferrer\">Open provider</a>";
        host.appendChild(card);
      });
    }

    refreshBtn.addEventListener("click", function (event) {
      event.preventDefault();
      render();
    });

    render();
  }

  function initShopSearchLite() {
    var form = document.getElementById("shopSearchForm");
    var input = document.getElementById("shopSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var q = String(input.value || "").trim();
      if (!q) return;
      window.location.assign("./global-search.html?q=" + encodeURIComponent(q));
    });
  }

  function initHealthCoachLite() {
    var saveBtn = document.getElementById("saveCoachProfile");
    var addBtn = document.getElementById("addHealthCheckin");
    var refreshBtn = document.getElementById("refreshCoachDashboard");
    var dash = document.getElementById("coachDashboard");
    if (!saveBtn || !addBtn || !refreshBtn || !dash) return;

    function readProfile() {
      return {
        focus: String((document.getElementById("coachFocus") || {}).value || "general_fitness"),
        goal: String((document.getElementById("coachGoalNotes") || {}).value || "").trim(),
        baseline: String((document.getElementById("coachBaselineWeight") || {}).value || "").trim(),
        target: String((document.getElementById("coachTargetWeight") || {}).value || "").trim(),
        activity: String((document.getElementById("coachActivityGoal") || {}).value || "").trim()
      };
    }

    function readCheckin() {
      return {
        type: String((document.getElementById("healthCheckinType") || {}).value || "wellbeing"),
        metric: String((document.getElementById("healthCheckinValue") || {}).value || "").trim(),
        notes: String((document.getElementById("healthCheckinNotes") || {}).value || "").trim(),
        at: new Date().toISOString()
      };
    }

    function loadStore() {
      try {
        return JSON.parse(localStorage.getItem("vibecart-home-lite-coach") || "{\"profile\":null,\"checkins\":[]}");
      } catch {
        return { profile: null, checkins: [] };
      }
    }

    function saveStore(store) {
      try {
        localStorage.setItem("vibecart-home-lite-coach", JSON.stringify(store));
      } catch {
        /* ignore */
      }
    }

    function render() {
      var store = loadStore();
      var profile = store.profile;
      var checkins = Array.isArray(store.checkins) ? store.checkins : [];
      var last = checkins.length ? checkins[checkins.length - 1] : null;
      dash.textContent =
        "Coach profile: " +
        (profile ? "saved (" + profile.focus + ")" : "not saved yet") +
        " | check-ins: " +
        checkins.length +
        (last ? " | latest: " + last.type + " - " + (last.metric || "no metric") : "");
    }

    function coachDisclaimerAccepted() {
      var ack = document.getElementById("coachDisclaimerAck");
      return !ack || !!ack.checked;
    }

    saveBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (!coachDisclaimerAccepted()) {
        dash.textContent = "Please accept the coach disclaimer before saving profile.";
        return;
      }
      var store = loadStore();
      store.profile = readProfile();
      saveStore(store);
      render();
    });

    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (!coachDisclaimerAccepted()) {
        dash.textContent = "Please accept the coach disclaimer before submitting check-ins.";
        return;
      }
      var store = loadStore();
      if (!Array.isArray(store.checkins)) store.checkins = [];
      store.checkins.push(readCheckin());
      if (store.checkins.length > 40) {
        store.checkins = store.checkins.slice(-40);
      }
      saveStore(store);
      render();
    });

    refreshBtn.addEventListener("click", function (event) {
      event.preventDefault();
      render();
    });

    render();
  }

  function initRewardsLite() {
    var earnBtn = document.getElementById("earnRewardPoints");
    var redeemBtn = document.getElementById("redeemReward");
    var pointsEl = document.getElementById("rewardPoints");
    var tierEl = document.getElementById("rewardTier");
    var streakEl = document.getElementById("rewardStreak");
    var barEl = document.getElementById("rewardProgressBar");
    var statusEl = document.getElementById("rewardStatus");
    if (!earnBtn || !redeemBtn || !pointsEl || !tierEl || !streakEl || !barEl || !statusEl) return;

    function load() {
      try {
        var raw = JSON.parse(localStorage.getItem("vibecart-home-lite-rewards") || "{}");
        return {
          points: Number(raw.points || 120),
          streak: Number(raw.streak || 3)
        };
      } catch {
        return { points: 120, streak: 3 };
      }
    }

    function save(state) {
      try {
        localStorage.setItem("vibecart-home-lite-rewards", JSON.stringify(state));
      } catch {
        /* ignore */
      }
    }

    function tierFor(points) {
      if (points >= 600) return "Legend";
      if (points >= 360) return "Pro";
      if (points >= 220) return "Campus Pro Saver";
      return "Starter";
    }

    function nextTierGoal(points) {
      if (points < 220) return 220;
      if (points < 360) return 360;
      if (points < 600) return 600;
      return 800;
    }

    function render(state, note) {
      var points = Math.max(0, Number(state.points || 0));
      var streak = Math.max(0, Number(state.streak || 0));
      var goal = nextTierGoal(points);
      var base = goal <= 220 ? 0 : goal <= 360 ? 220 : goal <= 600 ? 360 : 600;
      var pct = Math.max(0, Math.min(100, ((points - base) / Math.max(goal - base, 1)) * 100));

      pointsEl.textContent = String(points);
      tierEl.textContent = tierFor(points);
      streakEl.textContent = String(streak) + " weeks";
      barEl.style.width = pct.toFixed(2) + "%";
      statusEl.textContent = note || ("Keep going. " + Math.max(goal - points, 0) + " points to unlock " + tierFor(goal) + " tier.");
    }

    var state = load();
    render(state);

    earnBtn.addEventListener("click", function (event) {
      event.preventDefault();
      state.points += 20;
      state.streak += 1;
      save(state);
      render(state, "Points earned. Streak increased.");
    });

    redeemBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (state.points < 80) {
        render(state, "Not enough points to redeem yet.");
        return;
      }
      state.points -= 80;
      save(state);
      render(state, "Reward redeemed successfully.");
    });
  }

  function initCommunicationLite() {
    function routeLensForChat() {
      try {
        var path = String(localStorage.getItem("vibecart-home-lite-bridge-path") || "").trim();
        if (path === "from-africa") return "Africa -> Europe";
        if (path === "from-europe") return "Europe -> Africa";
      } catch {
        /* ignore */
      }
      return "Africa <-> Europe/Dubai/Asia";
    }

    function smartSellerReply(text, shop) {
      var t = String(text || "").toLowerCase();
      var lens = routeLensForChat();
      if (t.indexOf("price") >= 0 || t.indexOf("discount") >= 0) {
        return "VibeAI seller desk (" + shop + "): current price bands and active offers are ready now. Route focus: " + lens + ".";
      }
      if (t.indexOf("ship") >= 0 || t.indexOf("delivery") >= 0 || t.indexOf("when") >= 0) {
        return "VibeAI seller desk (" + shop + "): tracked lanes typically show 7-21 day delivery windows by route. Route focus: " + lens + ".";
      }
      if (t.indexOf("photo") >= 0 || t.indexOf("condition") >= 0 || t.indexOf("real") >= 0) {
        return "VibeAI seller desk (" + shop + "): condition proof and latest photos can be confirmed before checkout. Route focus: " + lens + ".";
      }
      return "VibeAI seller desk (" + shop + "): request received. Next update will confirm stock, shipping band, and condition. Route focus: " + lens + ".";
    }

    var input = document.getElementById("chatInput");
    var sendBtn = document.getElementById("chatSend");
    var box = document.getElementById("messagesBox");
    var shopInput = document.getElementById("chatShopInput");
    var status = document.getElementById("chatDispatchStatus");
    if (!input || !sendBtn || !box || !shopInput || !status) return;

    function keyFor(shop) {
      var safe = String(shop || "general")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 64);
      return "vibecart-home-lite-chat-" + (safe || "general");
    }

    function readThread(shop) {
      try {
        var raw = JSON.parse(localStorage.getItem(keyFor(shop)) || "[]");
        return Array.isArray(raw) ? raw : [];
      } catch {
        return [];
      }
    }

    function saveThread(shop, rows) {
      try {
        localStorage.setItem(keyFor(shop), JSON.stringify(rows.slice(-80)));
      } catch {
        /* ignore */
      }
    }

    function render(shop) {
      var rows = readThread(shop);
      box.innerHTML = "";
      rows.forEach(function (row) {
        var line = document.createElement("div");
        line.className = row.who === "seller" ? "msg msg-seller" : "msg msg-buyer";
        line.textContent = String(row.text || "");
        box.appendChild(line);
      });
      status.textContent = rows.length
        ? "Loaded private thread with " + shop + "."
        : "No private messages with " + shop + " yet.";
      box.scrollTop = box.scrollHeight;
    }

    function currentShop() {
      var s = String(shopInput.value || "").trim();
      return s || "General";
    }

    shopInput.addEventListener("change", function () {
      render(currentShop());
    });

    sendBtn.addEventListener("click", function (event) {
      event.preventDefault();
      var text = String(input.value || "").trim();
      if (!text) {
        status.textContent = "Type a message first.";
        return;
      }
      var shop = currentShop();
      var rows = readThread(shop);
      rows.push({ who: "buyer", text: text, at: new Date().toISOString() });
      rows.push({ who: "seller", text: smartSellerReply(text, shop), at: new Date().toISOString() });
      saveThread(shop, rows);
      input.value = "";
      render(shop);
    });

    render(currentShop());
  }

  function initBridgePathToggle() {
    var switchWrap = document.getElementById("bridgePathSwitch");
    var status = document.getElementById("bridgePathStatus");
    if (!switchWrap || !status) return;
    var buttons = Array.prototype.slice.call(switchWrap.querySelectorAll("[data-bridge-path]"));
    if (!buttons.length) return;
    var BRIDGE_KEY = "vibecart-home-lite-bridge-path";

    function labelFor(path) {
      return path === "from-africa" ? "From Africa to Europe" : "From Europe to Africa";
    }

    function apply(path) {
      var active = path === "from-africa" ? "from-africa" : "from-europe";
      buttons.forEach(function (btn) {
        var on = String(btn.getAttribute("data-bridge-path") || "") === active;
        btn.classList.toggle("btn-primary", on);
        btn.classList.toggle("btn-secondary", !on);
      });
      status.textContent = "Current route: " + labelFor(active) + ".";
      try {
        localStorage.setItem(BRIDGE_KEY, active);
      } catch {
        /* ignore */
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(String(btn.getAttribute("data-bridge-path") || "from-europe"));
      });
    });

    var initial = "from-europe";
    try {
      var storedPath = localStorage.getItem(BRIDGE_KEY);
      if (storedPath === "from-africa" || storedPath === "from-europe") {
        initial = storedPath;
      }
    } catch {
      /* ignore */
    }
    for (var i = 0; i < buttons.length; i += 1) {
      if (buttons[i].classList.contains("btn-primary")) {
        initial = String(buttons[i].getAttribute("data-bridge-path") || "from-europe");
        break;
      }
    }
    apply(initial);
  }

  function initSmartTourLite() {
    var openBtn = document.getElementById("openOnboarding");
    var modal = document.getElementById("onboardingModal");
    var text = document.getElementById("onboardingText");
    var nextBtn = document.getElementById("onboardingNext");
    var closeBtn = document.getElementById("onboardingClose");
    if (!openBtn || !modal || !text || !nextBtn || !closeBtn) return;

    var steps = [
      "Welcome. This quick tour helps you shop safely, save money, and use trusted sellers.",
      "Step 1: Use categories and market filters to narrow options before opening a shop.",
      "Step 2: Open shop takes you to the partner retailer for checkout, shipping, and payment.",
      "Step 3: Use tracking, rewards, and support sections to stay in control after purchase."
    ];
    var idx = 0;

    function render() {
      text.textContent = steps[idx] || steps[0];
      nextBtn.textContent = idx >= steps.length - 1 ? "Finish" : "Next";
    }

    var status = document.getElementById("expressCheckoutStatus");

    function openModal() {
      idx = 0;
      render();
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
      if (status) {
        status.textContent = "Smart Tour: quick guide for safer shopping and faster decisions.";
      }
    }

    function closeModal() {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }

    openBtn.addEventListener("click", function (event) {
      event.preventDefault();
      openModal();
    });
    nextBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (idx < steps.length - 1) {
        idx += 1;
        render();
        return;
      }
      closeModal();
    });
    closeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      closeModal();
    });
  }

  function initShockReelLite() {
    var reel = document.getElementById("vcShockReel");
    var dotsWrap = document.getElementById("vcShockDots");
    var progressBar = document.getElementById("vcShockProgressBar");
    if (!reel || !dotsWrap) return;
    var scenes = Array.prototype.slice.call(reel.querySelectorAll("[data-shock-scene]"));
    if (!scenes.length) return;

    var active = 0;
    var intervalMs = 4500;
    var timer = null;
    var dots = [];
    var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    function renderProgress(idx) {
      if (!progressBar) return;
      var total = Math.max(scenes.length, 1);
      var pct = ((idx + 1) / total) * 100;
      progressBar.style.width = pct.toFixed(2) + "%";
    }

    function render() {
      scenes.forEach(function (scene, idx) {
        var on = idx === active;
        scene.classList.toggle("is-active", on);
      });
      dots.forEach(function (dot, idx) {
        var on = idx === active;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
      renderProgress(active);
    }

    function goTo(idx) {
      active = (idx + scenes.length) % scenes.length;
      render();
    }

    function next() {
      goTo(active + 1);
    }

    function clearTimer() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    function startTimer() {
      if (reduceMotion || document.hidden) return;
      clearTimer();
      timer = window.setInterval(next, intervalMs);
    }

    dotsWrap.innerHTML = "";
    scenes.forEach(function (scene, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vc-shock-dot";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", "Shock scene " + String(idx + 1));
      btn.setAttribute("aria-selected", idx === active ? "true" : "false");
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        goTo(idx);
        startTimer();
      });
      dotsWrap.appendChild(btn);
      dots.push(btn);
    });

    reel.addEventListener("mouseenter", clearTimer);
    reel.addEventListener("mouseleave", startTimer);
    reel.addEventListener("focusin", clearTimer);
    reel.addEventListener("focusout", startTimer);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearTimer();
      else startTimer();
    });
    window.addEventListener("pagehide", clearTimer, { once: true });

    render();
    startTimer();
  }

  function initEpicCarouselLite() {
    var track = document.getElementById("vcEpicTrack");
    var dotsWrap = document.getElementById("vcEpicDots");
    if (!track || !dotsWrap) return;
    var cards = Array.prototype.slice.call(track.querySelectorAll("[data-epic-index]"));
    if (!cards.length) return;

    var active = 0;
    var intervalMs = 5200;
    var timer = null;
    var dots = [];
    var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    function render() {
      cards.forEach(function (card, idx) {
        var on = idx === active;
        card.classList.toggle("is-active", on);
      });
      dots.forEach(function (dot, idx) {
        var on = idx === active;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    function goTo(idx) {
      active = (idx + cards.length) % cards.length;
      render();
    }

    function next() {
      goTo(active + 1);
    }

    function clearTimer() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    function startTimer() {
      if (reduceMotion || document.hidden) return;
      clearTimer();
      timer = window.setInterval(next, intervalMs);
    }

    dotsWrap.innerHTML = "";
    cards.forEach(function (card, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vc-epic-dot";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", "Epic scene " + String(idx + 1));
      btn.setAttribute("aria-selected", idx === active ? "true" : "false");
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        goTo(idx);
        startTimer();
      });
      dotsWrap.appendChild(btn);
      dots.push(btn);
    });

    track.addEventListener("mouseenter", clearTimer);
    track.addEventListener("mouseleave", startTimer);
    track.addEventListener("focusin", clearTimer);
    track.addEventListener("focusout", startTimer);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearTimer();
      else startTimer();
    });
    window.addEventListener("pagehide", clearTimer, { once: true });

    render();
    startTimer();
  }

  function initVisualRhythmLite() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    var body = document.body;
    if (!body) return;
    var classes = ["vc-rhythm-dawn", "vc-rhythm-day", "vc-rhythm-evening", "vc-rhythm-night"];

    function applyRhythm() {
      var hour = new Date().getHours();
      var next = "vc-rhythm-night";
      if (hour >= 5 && hour < 11) next = "vc-rhythm-dawn";
      else if (hour >= 11 && hour < 17) next = "vc-rhythm-day";
      else if (hour >= 17 && hour < 22) next = "vc-rhythm-evening";
      classes.forEach(function (c) {
        body.classList.toggle(c, c === next);
      });
      body.setAttribute("data-vc-rhythm", next);
    }

    applyRhythm();
    var rhythmTimer = window.setInterval(applyRhythm, 60 * 1000);
    window.addEventListener(
      "pagehide",
      function () {
        window.clearInterval(rhythmTimer);
      },
      { once: true }
    );
  }

  function initAtmosphereDeckLite() {
    var chronoBtn = document.getElementById("vcChronoToggle");
    var depthBtn = document.getElementById("vcDepthToggle");
    if (!chronoBtn || !depthBtn) return;
    var body = document.body;
    if (!body) return;
    var STORE_KEY = "vibecart-home-lite-atmosphere";

    function load() {
      try {
        var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        return {
          chrono: raw.chrono !== false,
          depth: raw.depth !== false
        };
      } catch {
        return { chrono: true, depth: true };
      }
    }

    function save(state) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch {
        /* ignore */
      }
    }

    function render(state) {
      var chronoOn = state.chrono === true;
      var depthOn = state.depth === true;
      chronoBtn.textContent = "Rhythm tint: " + (chronoOn ? "on" : "off");
      depthBtn.textContent = "Hero depth tilt: " + (depthOn ? "on" : "off");
      chronoBtn.setAttribute("aria-pressed", chronoOn ? "true" : "false");
      depthBtn.setAttribute("aria-pressed", depthOn ? "true" : "false");
      body.setAttribute("data-vc-chrono-enabled", chronoOn ? "1" : "0");
      body.setAttribute("data-vc-depth-enabled", depthOn ? "1" : "0");
    }

    var state = load();
    render(state);

    chronoBtn.addEventListener("click", function (event) {
      event.preventDefault();
      state.chrono = !state.chrono;
      save(state);
      render(state);
    });

    depthBtn.addEventListener("click", function (event) {
      event.preventDefault();
      state.depth = !state.depth;
      save(state);
      render(state);
    });
  }

  function initPersonaChooserLite() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-vc-persona]"));
    var hint = document.getElementById("vcPersonaHint");
    if (!buttons.length || !hint) return;
    var STORE_KEY = "vibecart-home-lite-persona";
    var hints = {
      buyer: "Buyer lane selected. Focus mode: categories, live market, and order tracking.",
      seller: "Seller lane selected. Focus mode: listing steps, growth tools, and policy rails.",
      curious: "Browsing lane selected. Focus mode: quick tour, highlights, and category discovery."
    };

    function apply(persona) {
      var active = Object.prototype.hasOwnProperty.call(hints, persona) ? persona : "buyer";
      buttons.forEach(function (btn) {
        var me = String(btn.getAttribute("data-vc-persona") || "").trim();
        var on = me === active;
        btn.classList.toggle("btn-primary", on);
        btn.classList.toggle("btn-secondary", !on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      hint.hidden = false;
      hint.textContent = hints[active];
      try {
        localStorage.setItem(STORE_KEY, active);
      } catch {
        /* ignore */
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        apply(String(btn.getAttribute("data-vc-persona") || "buyer").trim());
      });
    });

    var initial = "buyer";
    try {
      var stored = String(localStorage.getItem(STORE_KEY) || "").trim();
      if (stored && Object.prototype.hasOwnProperty.call(hints, stored)) initial = stored;
    } catch {
      /* ignore */
    }
    apply(initial);
  }

  function initExperienceModeLite() {
    var fullBtn = document.getElementById("vcPersonaFun");
    var homeBtn = document.getElementById("vcPersonaEff");
    var status = document.getElementById("vcPersonaStatus");
    var modeSelect = document.getElementById("interactionMode");
    var marketMode = document.getElementById("marketMode");
    if (!fullBtn || !homeBtn) return;
    var STORE_KEY = "vibecart-home-lite-experience-mode";

    function apply(mode) {
      var isFull = mode === "full";
      document.body.classList.toggle("vc-layout-aura", isFull);
      document.body.classList.toggle("vc-layout-exclusive", !isFull);
      document.body.classList.toggle("vc-mode-full-experience", isFull);
      document.body.classList.toggle("vc-mode-home-focused", !isFull);
      fullBtn.classList.toggle("btn-primary", isFull);
      fullBtn.classList.toggle("btn-secondary", !isFull);
      homeBtn.classList.toggle("btn-primary", !isFull);
      homeBtn.classList.toggle("btn-secondary", isFull);
      fullBtn.setAttribute("aria-pressed", isFull ? "true" : "false");
      homeBtn.setAttribute("aria-pressed", isFull ? "false" : "true");
      if (status) {
        status.textContent = isFull
          ? "Full experience live — richer visuals and expanded context are active."
          : "Home focused live — cleaner layout and reduced visual noise are active.";
      }
      if (marketMode) {
        marketMode.textContent = isFull
          ? "Market mode: Full experience. All AI, communication, and control panels are active."
          : "Market mode: Home focused. Simplified interface with fewer blocks and faster path to shops.";
      }
      if (modeSelect) {
        modeSelect.value = isFull ? "pro" : "simple";
      }
      try {
        localStorage.setItem(STORE_KEY, isFull ? "full" : "home");
      } catch {
        /* ignore */
      }
    }

    fullBtn.addEventListener("click", function (event) {
      event.preventDefault();
      apply("full");
    });
    homeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      apply("home");
    });
    if (modeSelect) {
      modeSelect.addEventListener("change", function () {
        var val = String(modeSelect.value || "guided");
        apply(val === "pro" ? "full" : "home");
      });
    }
    var initial = "home";
    try {
      var stored = String(localStorage.getItem(STORE_KEY) || "").trim();
      if (stored === "full" || stored === "home") initial = stored;
    } catch {
      /* ignore */
    }
    apply(initial);
  }

  function initTopClassActivationLite() {
    var activateBtn = document.getElementById("activatePremiumExperience");
    var autoRenew = document.getElementById("premiumAutoRenew");
    var renewStatus = document.getElementById("premiumRenewStatus");
    var planHeadline = document.getElementById("premiumPlanHeadline");
    var planLead = document.getElementById("premiumPlanLead");
    var priceChip = document.getElementById("premiumPlanPriceChip");
    var expressStatus = document.getElementById("expressCheckoutStatus");
    var aiSuite = document.getElementById("topClassAiSuite");
    var aiSuggestBtn = document.getElementById("topClassAiSuggest");
    var aiAlertBtn = document.getElementById("topClassAiAlert");
    var aiOutput = document.getElementById("topClassAiOutput");
    if (!activateBtn) return;

    var STORE_KEY = "vibecart-top-class-membership-v1";

    function readState() {
      try {
        var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        return raw && typeof raw === "object" ? raw : {};
      } catch {
        return {};
      }
    }

    function writeState(state) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch {
        /* ignore */
      }
    }

    function applyActivatedUi(active) {
      document.body.classList.toggle("vc-top-class-active", active === true);
      if (aiSuite) {
        aiSuite.classList.toggle("hidden", active !== true);
      }
      if (!planHeadline || !planLead || !priceChip) return;
      if (active) {
        planHeadline.textContent = "Top-Class active: ultra-premium commerce lane unlocked.";
        planLead.textContent =
          "You now have concierge-first routing, elevated cinematic interface, and priority support treatment across critical flows.";
        priceChip.textContent = "Top-Class active";
        return;
      }
      planHeadline.textContent = "A completely sophisticated luxury lane.";
      planLead.textContent =
        "Unlock premium visuals, AI concierge support, priority routing, and advanced discovery signals.";
      priceChip.textContent = "EUR 39.99 / month";
    }

    function paintFlow(active) {
      if (active) {
        activateBtn.textContent = "Top-Class activated";
        activateBtn.disabled = true;
        activateBtn.setAttribute("aria-disabled", "true");
        if (renewStatus) {
          renewStatus.textContent = "Top-Class is active. Premium interface and perks are now live.";
        }
        if (expressStatus) {
          expressStatus.textContent = "Top-Class active. Concierge checkout and priority routes enabled.";
        }
        return;
      }
      activateBtn.disabled = false;
      activateBtn.removeAttribute("aria-disabled");
      activateBtn.textContent = "Activate Top-Class Experience";
      if (renewStatus) {
        renewStatus.textContent = "Activation requires payment checkout first. You will be guided through 2 secure steps.";
      }
    }

    var state = readState();
    var active = state.active === true;
    applyActivatedUi(active);
    paintFlow(active);

    if (aiSuggestBtn && aiOutput) {
      aiSuggestBtn.addEventListener("click", function () {
        if (!readState().active) {
          aiOutput.textContent = "Top-Class is required for autonomous AI tools.";
          return;
        }
        aiOutput.textContent =
          "AI suggestions: 1) prioritize verified shops with active sale lanes, 2) compare two regions before checkout, 3) set a budget cap alert before final payment.";
      });
    }
    if (aiAlertBtn && aiOutput) {
      aiAlertBtn.addEventListener("click", function () {
        if (!readState().active) {
          aiOutput.textContent = "Top-Class is required for autonomous AI tools.";
          return;
        }
        aiOutput.textContent =
          "Risk alert scan complete: no critical checkout blockers detected, but verify return policy + shipping terms on each partner page before payment.";
      });
    }

    if (autoRenew) {
      autoRenew.checked = state.autoRenew !== false;
      autoRenew.addEventListener("change", function () {
        var next = readState();
        next.autoRenew = autoRenew.checked === true;
        writeState(next);
      });
    }

    activateBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (active === true) return;
      var method = "card";
      var target =
        "./top-class-checkout.html?flow=top_class&plan=prestige&paymentMethod=" +
        encodeURIComponent(method) +
        "&autoRenew=" +
        encodeURIComponent(autoRenew && autoRenew.checked ? "1" : "0");
      window.location.assign(target);
    });
  }

  function initAutonomousDebugLite() {
    var runBtn = document.getElementById("vcRunAutoDebug");
    var out = document.getElementById("vcAutoDebugOutput");
    if (!runBtn || !out) return;
    function run() {
      var checks = [];
      function add(ok, name, detail) {
        checks.push({ ok: !!ok, name: name, detail: String(detail || "") });
      }
      add(!!document.getElementById("openOnboarding"), "Smart Tour trigger", "Start button visible");
      add(!!document.getElementById("vcPersonaFun") && !!document.getElementById("vcPersonaEff"), "Experience toggles", "Both mode buttons mounted");
      add(!!document.getElementById("interactionMode"), "Interaction selector", "Mode select mounted");
      var links = Array.prototype.slice.call(document.querySelectorAll("a[href]"));
      var bad = links.filter(function (a) {
        var href = String(a.getAttribute("href") || "").trim().toLowerCase();
        return href.indexOf("javascript:") === 0 || href === "";
      });
      add(bad.length === 0, "Unsafe links", bad.length ? String(bad.length) + " unsafe href(s)" : "No unsafe hrefs");
      var failed = checks.filter(function (c) { return !c.ok; }).length;
      var lines = ["Autonomous Debug Copilot: " + String(checks.length - failed) + "/" + String(checks.length) + " checks passed."];
      checks.forEach(function (c) {
        lines.push((c.ok ? "PASS" : "FAIL") + " - " + c.name + ": " + c.detail);
      });
      out.textContent = lines.join("\n");
    }
    runBtn.addEventListener("click", function (event) {
      event.preventDefault();
      run();
    });
  }

  function initListingHealthLite() {
    var checks = Array.prototype.slice.call(document.querySelectorAll("input[data-vc-lh-key]"));
    var bars = Array.prototype.slice.call(document.querySelectorAll(".vc-lh-bar[data-vc-lh]"));
    if (!checks.length || !bars.length) return;
    var STORE_KEY = "vibecart-home-lite-listing-health";

    function load() {
      try {
        var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        return raw && typeof raw === "object" ? raw : {};
      } catch {
        return {};
      }
    }

    function save(state) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch {
        /* ignore */
      }
    }

    function render() {
      var state = {};
      checks.forEach(function (input) {
        var key = String(input.getAttribute("data-vc-lh-key") || "").trim();
        if (!key) return;
        state[key] = input.checked === true;
      });
      bars.forEach(function (bar) {
        var key = String(bar.getAttribute("data-vc-lh") || "").trim();
        var on = state[key] === true;
        bar.classList.toggle("is-on", on);
        bar.setAttribute("aria-hidden", "true");
      });
      save(state);
    }

    var initial = load();
    checks.forEach(function (input) {
      var key = String(input.getAttribute("data-vc-lh-key") || "").trim();
      if (!key) return;
      if (initial[key] === true || initial[key] === false) {
        input.checked = initial[key] === true;
      }
      input.addEventListener("change", render);
    });

    render();
  }

  function initBridgeFaqCopyLite() {
    var list = document.querySelector(".vc-bridge-faq-list");
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll("li"));
    if (!items.length) return;
    var announce = document.createElement("p");
    announce.className = "note";
    announce.setAttribute("aria-live", "polite");
    announce.textContent = "";
    list.parentNode.appendChild(announce);

    function writeClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        try {
          var area = document.createElement("textarea");
          area.value = text;
          area.setAttribute("readonly", "readonly");
          area.style.position = "absolute";
          area.style.left = "-9999px";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          document.body.removeChild(area);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }

    items.forEach(function (li) {
      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-secondary";
      copyBtn.style.marginTop = "0.35rem";
      copyBtn.textContent = "Copy snippet";
      copyBtn.addEventListener("click", function (event) {
        event.preventDefault();
        var text = String(li.textContent || "").trim();
        if (!text) return;
        writeClipboard(text)
          .then(function () {
            announce.textContent = "Copied FAQ snippet.";
          })
          .catch(function () {
            announce.textContent = "Copy failed on this browser.";
          });
      });
      li.appendChild(copyBtn);
    });
  }

  function initDetailsMemoryLite() {
    var nodes = [];
    var sense = document.getElementById("vcSenseDeck");
    if (sense && sense.tagName === "DETAILS") nodes.push({ node: sense, key: "senseDeck" });
    var faq = document.querySelector(".vc-bridge-faq");
    if (faq && faq.tagName === "DETAILS") nodes.push({ node: faq, key: "bridgeFaq" });
    if (!nodes.length) return;

    var STORE_KEY = "vibecart-home-lite-details-memory";

    function loadState() {
      try {
        var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        return raw && typeof raw === "object" ? raw : {};
      } catch {
        return {};
      }
    }

    function saveState(next) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }

    var state = loadState();
    nodes.forEach(function (entry) {
      if (state[entry.key] === true || state[entry.key] === false) {
        entry.node.open = state[entry.key] === true;
      }
      entry.node.addEventListener("toggle", function () {
        state[entry.key] = entry.node.open === true;
        saveState(state);
      });
    });
  }

  function initMobileQuickNavLite() {
    var nav = document.getElementById("mobileQuickNav");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a[data-quick-target]"));
    if (!links.length) return;

    var targets = links
      .map(function (link) {
        var key = String(link.getAttribute("data-quick-target") || "").trim();
        var node = key ? document.getElementById(key) : null;
        return { link: link, key: key, node: node };
      })
      .filter(function (row) {
        return row.node;
      });
    if (!targets.length) return;

    function setActive(key) {
      links.forEach(function (link) {
        var on = String(link.getAttribute("data-quick-target") || "").trim() === key;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var cutoff = window.scrollY + Math.max(window.innerHeight * 0.32, 120);
        var active = targets[0].key;
        targets.forEach(function (row) {
          if (row.node.offsetTop <= cutoff) active = row.key;
        });
        setActive(active);
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  function initSellerReadinessLite() {
    var summary = document.getElementById("vcSellerReadinessSummary");
    var checks = Array.prototype.slice.call(document.querySelectorAll("input[data-vc-lh-key]"));
    if (!summary || !checks.length) return;
    var personaButtons = Array.prototype.slice.call(document.querySelectorAll("[data-vc-persona]"));
    var persona = "buyer";

    function currentPersona() {
      for (var i = 0; i < personaButtons.length; i += 1) {
        if (personaButtons[i].getAttribute("aria-pressed") === "true") {
          var value = String(personaButtons[i].getAttribute("data-vc-persona") || "").trim();
          if (value) return value;
        }
      }
      return persona;
    }

    function render() {
      var done = 0;
      checks.forEach(function (input) {
        if (input.checked === true) done += 1;
      });
      var total = checks.length;
      var activePersona = currentPersona();
      var lane = activePersona === "seller" ? "Seller lane" : "General lane";
      var readiness = done === total ? "ready to publish" : "still preparing";
      summary.textContent =
        lane + ": " + String(done) + "/" + String(total) + " listing checks complete - " + readiness + ".";
    }

    checks.forEach(function (input) {
      input.addEventListener("change", render);
    });
    personaButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        persona = String(btn.getAttribute("data-vc-persona") || "buyer").trim() || "buyer";
        render();
      });
    });

    render();
  }

  function initCheckoutClarityLite() {
    var status = document.getElementById("expressCheckoutStatus");
    var links = Array.prototype.slice.call(document.querySelectorAll("a.btn.btn-primary[href*='/api/public/shop/redirect']"));
    if (!status || !links.length) return;

    function partnerFromHref(href) {
      try {
        var parsed = new URL(href, window.location.origin);
        var partner = String(parsed.searchParams.get("partner") || parsed.searchParams.get("shop") || "").trim();
        return partner || "partner store";
      } catch {
        return "partner store";
      }
    }

    function setStatus(link, mode) {
      var partner = partnerFromHref(String(link.getAttribute("href") || ""));
      if (mode === "focus") {
        status.textContent = "Checkout for this item happens on " + partner + ".";
        return;
      }
      status.textContent = "Opening external checkout on " + partner + "...";
    }

    links.forEach(function (link) {
      if (!link.getAttribute("data-vc-checkout-note")) {
        link.setAttribute("data-vc-checkout-note", "external");
      }
      var label = String(link.getAttribute("aria-label") || "").trim();
      if (!label) {
        link.setAttribute("aria-label", "Open external partner checkout");
      }
      link.setAttribute("title", "External partner checkout");
      link.addEventListener("focus", function () {
        setStatus(link, "focus");
      });
      link.addEventListener("mouseenter", function () {
        setStatus(link, "focus");
      });
      link.addEventListener("click", function () {
        setStatus(link, "click");
      });
    });
  }

  function initSellerNextActionLite() {
    var output = document.getElementById("vcSellerNextAction");
    var checks = Array.prototype.slice.call(document.querySelectorAll("input[data-vc-lh-key]"));
    if (!output || !checks.length) return;
    var labels = {
      photos: "Add clear hero photos with condition notes.",
      shipping: "Set realistic shipping ranges per route.",
      policy: "Confirm returns/customs disclosure text."
    };

    function currentPersona() {
      var active = document.querySelector("[data-vc-persona][aria-pressed='true']");
      var value = String((active && active.getAttribute("data-vc-persona")) || "").trim();
      return value || "buyer";
    }

    function firstMissingKey() {
      for (var i = 0; i < checks.length; i += 1) {
        if (checks[i].checked !== true) {
          return String(checks[i].getAttribute("data-vc-lh-key") || "").trim();
        }
      }
      return "";
    }

    function render() {
      var missing = firstMissingKey();
      var persona = currentPersona();
      if (!missing) {
        output.textContent =
          persona === "seller"
            ? "Next action: listing health complete. Continue to seller tools below."
            : "Next action: listing health complete. Seller setup is ready.";
        return;
      }
      var prefix = persona === "seller" ? "Next seller action: " : "Seller prep tip: ";
      output.textContent = prefix + (labels[missing] || "Complete remaining listing checks.");
    }

    checks.forEach(function (input) {
      input.addEventListener("change", render);
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-vc-persona]")).forEach(function (btn) {
      btn.addEventListener("click", render);
    });

    render();
  }

  function initPartnerPinLite() {
    var status = document.getElementById("expressCheckoutStatus");
    var links = Array.prototype.slice.call(document.querySelectorAll("a.btn.btn-primary[href*='/api/public/shop/redirect']"));
    if (!status || !links.length) return;
    var STORE_KEY = "vibecart-home-lite-preferred-partner";

    function partnerFromHref(href) {
      try {
        var parsed = new URL(href, window.location.origin);
        return String(parsed.searchParams.get("partner") || parsed.searchParams.get("shop") || "").trim() || "";
      } catch {
        return "";
      }
    }

    function loadPreferred() {
      try {
        return String(localStorage.getItem(STORE_KEY) || "").trim();
      } catch {
        return "";
      }
    }

    function savePreferred(name) {
      try {
        if (!name) localStorage.removeItem(STORE_KEY);
        else localStorage.setItem(STORE_KEY, name);
      } catch {
        /* ignore */
      }
    }

    function render() {
      var preferred = loadPreferred();
      links.forEach(function (link) {
        var partner = partnerFromHref(String(link.getAttribute("href") || ""));
        var on = !!partner && partner === preferred;
        link.classList.toggle("vc-partner-preferred", on);
        link.setAttribute("aria-pressed", on ? "true" : "false");
        var pin = link.parentNode ? link.parentNode.querySelector("[data-vc-pin-for]") : null;
        if (pin) {
          pin.textContent = on ? "Preferred partner pinned" : "Pin preferred partner";
          pin.setAttribute("aria-pressed", on ? "true" : "false");
        }
      });
    }

    links.forEach(function (link) {
      var partner = partnerFromHref(String(link.getAttribute("href") || ""));
      if (!partner || !link.parentNode) return;
      if (link.parentNode.querySelector("[data-vc-pin-for]")) return;
      var pinBtn = document.createElement("button");
      pinBtn.type = "button";
      pinBtn.className = "btn btn-secondary vc-partner-pin-btn";
      pinBtn.setAttribute("data-vc-pin-for", partner);
      pinBtn.setAttribute("aria-pressed", "false");
      pinBtn.textContent = "Pin preferred partner";
      pinBtn.addEventListener("click", function (event) {
        event.preventDefault();
        var current = loadPreferred();
        var next = current === partner ? "" : partner;
        savePreferred(next);
        render();
        status.textContent = next ? "Preferred partner set to " + next + "." : "Preferred partner cleared.";
      });
      link.insertAdjacentElement("afterend", pinBtn);
    });

    render();
  }

  function initBuyerQuickStartLite() {
    var out = document.getElementById("vcBuyerQuickStart");
    var filter = document.getElementById("categoryFilter");
    if (!out || !filter) return;
    var CATEGORY_KEY = "vibecart-home-lite-category";
    var PARTNER_KEY = "vibecart-home-lite-preferred-partner";

    function readPref(key) {
      try {
        return String(localStorage.getItem(key) || "").trim();
      } catch {
        return "";
      }
    }

    function render() {
      var category = readPref(CATEGORY_KEY) || String(filter.value || "All").trim() || "All";
      var partner = readPref(PARTNER_KEY);
      var catLabel = category === "All" ? "all categories" : category;
      if (partner) {
        out.textContent = "Quick start: continue in " + catLabel + " with your pinned partner " + partner + ".";
        return;
      }
      out.textContent = "Quick start: continue browsing in " + catLabel + " and pin a preferred partner if you return often.";
    }

    filter.addEventListener("change", render);
    render();
  }

  function initSellerMomentumLite() {
    var output = document.getElementById("vcSellerNextAction");
    var checks = Array.prototype.slice.call(document.querySelectorAll("input[data-vc-lh-key]"));
    if (!output || !checks.length) return;

    function render() {
      var done = 0;
      checks.forEach(function (input) {
        if (input.checked === true) done += 1;
      });
      var total = Math.max(checks.length, 1);
      var pct = Math.round((done / total) * 100);
      var base = String(output.textContent || "").trim();
      var clean = base.replace(/\s*\| Progress: \d+%$/, "");
      output.textContent = clean + " | Progress: " + String(pct) + "%";
    }

    checks.forEach(function (input) {
      input.addEventListener("change", render);
    });
    render();
  }

  function initPartnerRecallLite() {
    var status = document.getElementById("expressCheckoutStatus");
    if (!status) return;
    var STORE_KEY = "vibecart-home-lite-preferred-partner";
    try {
      var preferred = String(localStorage.getItem(STORE_KEY) || "").trim();
      if (!preferred) return;
      status.textContent = "Welcome back. Preferred partner ready: " + preferred + ".";
    } catch {
      /* ignore */
    }
  }

  function initInstallPromptLite() {
    var btn = document.getElementById("installAppBtn");
    if (!btn) return;
    var deferredPrompt = null;
    var isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
    if (isStandalone) {
      btn.classList.add("hidden");
      return;
    }

    // Visible in the tab immediately; Chromium still may fire beforeinstallprompt later.
    btn.classList.remove("hidden");

    function ensureHint() {
      var existing = document.getElementById("installAppHint");
      if (existing) return existing;
      var p = document.createElement("p");
      p.id = "installAppHint";
      p.className = "note";
      p.setAttribute("aria-live", "polite");
      btn.parentNode.appendChild(p);
      return p;
    }

    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredPrompt = event;
      btn.classList.remove("hidden");
    });

    window.addEventListener("appinstalled", function () {
      btn.classList.add("hidden");
      var hint = ensureHint();
      hint.textContent = "Installed.";
    });

    function showManualHint() {
      var hint = ensureHint();
      var ua = String((window.navigator && window.navigator.userAgent) || "").toLowerCase();
      var isIos = ua.indexOf("iphone") >= 0 || ua.indexOf("ipad") >= 0;
      if (isIos) {
        hint.textContent = "Safari → Share → Add to Home Screen.";
        try {
          var help = document.getElementById("installPwaHelp");
          if (help) help.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
          /* ignore */
        }
      } else if (ua.indexOf("edg/") >= 0) {
        hint.textContent = "Menu (⋯) → Apps → Install this site.";
      } else {
        hint.textContent = "Menu (⋮) → Install app.";
      }
    }

    btn.addEventListener("click", function () {
      if (deferredPrompt && deferredPrompt.prompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice
          .then(function () {
            btn.classList.add("hidden");
            deferredPrompt = null;
          })
          .catch(function () {
            deferredPrompt = null;
          });
        return;
      }
      showManualHint();
    });

    var ua = String((window.navigator && window.navigator.userAgent) || "").toLowerCase();
    var isIos = ua.indexOf("iphone") >= 0 || ua.indexOf("ipad") >= 0;
    if (isIos) {
      btn.textContent = "Add to Home Screen";
      return;
    }
  }

  function initPwaBootstrapLite() {
    if (!("serviceWorker" in navigator)) return;
    // Register for installability + offline shell. Bump ?v= when service-worker.js CACHE_NAME changes.
    navigator.serviceWorker
      .register("./service-worker.js?v=20260510lean10")
      .then(function (reg) {
        try {
          if (reg && typeof reg.update === "function") reg.update();
        } catch {
          /* ignore */
        }
      })
      .catch(function () {
        /* ignore */
      });
  }

  function initHealthCoachIntelLite() {
    var dash = document.getElementById("coachDashboard");
    var refreshBtn = document.getElementById("refreshCoachDashboard");
    if (!dash || !refreshBtn) return;
    var STORE_KEY = "vibecart-home-lite-coach";

    function loadStore() {
      try {
        return JSON.parse(localStorage.getItem(STORE_KEY) || "{\"profile\":null,\"checkins\":[]}");
      } catch {
        return { profile: null, checkins: [] };
      }
    }

    function recommendationFor(profile, count) {
      if (!profile) return "VibeAI Coach: save your profile first so we can issue a precise weekly protocol.";
      var focus = String(profile.focus || "general_fitness");
      if (focus === "weight_loss") return "VibeAI Coach: 4 sessions/week + daily steps target, with calorie-aware meal rhythm.";
      if (focus === "weight_gain") return "VibeAI Coach: 3 strength sessions/week plus consistent surplus nutrition cadence.";
      if (focus === "muscle_gain") return "VibeAI Coach: progressive overload split with protein timing and sleep priority.";
      if (count < 3) return "VibeAI Coach: submit at least 3 check-ins this week to unlock trend-grade guidance.";
      return "VibeAI Coach: cadence is strong; review weekly trend signals and keep execution steady.";
    }

    function appendIntel() {
      var store = loadStore();
      var profile = store.profile || null;
      var checkins = Array.isArray(store.checkins) ? store.checkins : [];
      var rec = recommendationFor(profile, checkins.length);
      var text = String(dash.textContent || "").replace(/\s*\| VibeAI Coach:.*$/, "");
      dash.textContent = text + " | " + rec;
    }

    refreshBtn.addEventListener("click", function () {
      window.setTimeout(appendIntel, 0);
    });
    appendIntel();
  }

  function initSellerGrowthIntelLite() {
    var runBtn = document.getElementById("sgRunPlan");
    var out = document.getElementById("sgPlanOut");
    if (!runBtn || !out) return;
    var niche = document.getElementById("sgNiche");
    var region = document.getElementById("sgRegion");
    var channel = document.getElementById("sgChannel");
    var owner = document.getElementById("sgOwnerName");

    function renderSellerGrowthFallback() {
      var n = String((niche && niche.value) || "general goods").trim();
      var r = String((region && region.value) || "core region").trim();
      var c = String((channel && channel.value) || "mixed").trim();
      var o = String((owner && owner.value) || "Owner").trim();
      out.innerHTML =
        "<strong>VibeAI Growth Plan</strong>" +
        "<p>1) " +
        o +
        ": recruit 3 micro-sellers in " +
        r +
        " for " +
        n +
        " within 10 days.</p>" +
        "<p>2) Use " +
        c +
        " outreach daily and run one trust-proof content drop every 72 hours.</p>" +
        "<p>3) Convert at least 2 sellers/week into listing-health-complete status before scaling ad spend.</p>" +
        "<p class='note'>Offline template — set OPENAI_API_KEY on Railway for a live generative plan.</p>";
    }

    runBtn.addEventListener("click", function () {
      var sellerAck = document.getElementById("sellerFlowDisclaimerAck");
      if (sellerAck && !sellerAck.checked) {
        out.textContent = "Please accept the Start Selling disclaimer before generating the plan.";
        return;
      }
      var n = String((niche && niche.value) || "general goods").trim();
      var r = String((region && region.value) || "core region").trim();
      var c = String((channel && channel.value) || "mixed").trim();
      var o = String((owner && owner.value) || "Owner").trim();
      if (typeof window.vibecartAiGenerate === "function") {
        window
          .vibecartAiGenerate("seller_growth_plan", {
            niche: n,
            region: r,
            channel: c,
            ownerName: o
          })
          .then(function (res) {
            if (!out) {
              return;
            }
            if (res && Array.isArray(res.steps) && res.steps.length) {
              out.replaceChildren();
              var wrap = document.createElement("div");
              var title = document.createElement("strong");
              title.textContent = res.title || "VibeAI growth plan";
              wrap.appendChild(title);
              res.steps.forEach(function (step) {
                var p = document.createElement("p");
                p.textContent = String(step || "");
                wrap.appendChild(p);
              });
              if (res.caution) {
                var note = document.createElement("p");
                note.className = "note";
                note.textContent = String(res.caution);
                wrap.appendChild(note);
              }
              var tag = document.createElement("p");
              tag.className = "note";
              tag.textContent = "Generative AI — verify facts before outreach.";
              wrap.appendChild(tag);
              out.appendChild(wrap);
              return;
            }
            renderSellerGrowthFallback();
          })
          .catch(function () {
            renderSellerGrowthFallback();
          });
        return;
      }
      renderSellerGrowthFallback();
    });
  }

  function initRequestedSectionSwapsLite() {
    if (document.body && document.body.hasAttribute("data-vc-swaps-applied")) return;

    function swapNodes(a, b) {
      if (!a || !b || !a.parentNode || !b.parentNode || a === b) return;
      var aParent = a.parentNode;
      var bParent = b.parentNode;
      var aNext = a.nextSibling;
      var bNext = b.nextSibling;
      var aMarker = document.createComment("vc-swap-a");
      var bMarker = document.createComment("vc-swap-b");
      aParent.insertBefore(aMarker, aNext);
      bParent.insertBefore(bMarker, bNext);
      aParent.replaceChild(b, a);
      bParent.replaceChild(a, b);
      if (aMarker.parentNode) aMarker.parentNode.removeChild(aMarker);
      if (bMarker.parentNode) bMarker.parentNode.removeChild(bMarker);
    }

    var noosphere = document.querySelector(".vc-noosphere-lattice");
    var buyerAdvantages = document.getElementById("buyer-advantages");
    swapNodes(noosphere, buyerAdvantages);

    var categories = document.getElementById("categories");
    var shops = document.getElementById("shops");
    swapNodes(categories, shops);

    if (document.body) document.body.setAttribute("data-vc-swaps-applied", "1");
  }

  function initUniversalShopLogosLite() {
    var shopHostMap = {
      "amazon electronics": "amazon.com",
      "amazon": "amazon.com",
      "zalando": "zalando.com",
      "abebooks": "abebooks.com",
      "steam store": "steampowered.com",
      "europe": "zalando.com",
      "mama africa": "takealot.com",
      "asia & gulf": "shopee.sg",
      "scents": "sephora.com",
      "global brands": "amazon.com"
    };

    function hostFromLabel(label) {
      var key = String(label || "").trim().toLowerCase();
      return shopHostMap[key] || "";
    }

    function attachLogoToHeading(h3) {
      if (!h3 || h3.querySelector(".shop-favicon")) return;
      var label = String(h3.textContent || "").trim();
      var host = hostFromLabel(label);
      if (!host) return;

      var img = document.createElement("img");
      img.className = "shop-favicon";
      img.alt = label + " logo";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.src = "https://logo.clearbit.com/" + host;
      img.onerror = function () {
        img.src = "./icon.svg";
        img.onerror = null;
      };
      h3.prepend(img);
    }

    Array.prototype.forEach.call(document.querySelectorAll("#products .product h3"), attachLogoToHeading);
    Array.prototype.forEach.call(document.querySelectorAll(".shop-folder-card-title"), attachLogoToHeading);
  }

  function initHeroLeftHardPassUpgrades() {
    var conciergeLine = document.getElementById("vcHeroConciergeLine");
    var conciergeGo = document.getElementById("vcHeroConciergeGo");
    var trustPulse = document.getElementById("vcHeroTrustPulse");
    var prestigePreview = document.getElementById("vcHeroPrestigePreview");
    var prestigeLine = document.getElementById("vcHeroPrestigeLine");
    var mission = document.getElementById("vcHeroMission");
    var missionApply = document.getElementById("vcHeroMissionApply");
    var status = document.getElementById("expressCheckoutStatus");
    if (!conciergeLine && !trustPulse && !mission) return;

    function activePersona() {
      var active = document.querySelector("[data-vc-persona][aria-pressed='true']");
      return String((active && active.getAttribute("data-vc-persona")) || "buyer").trim() || "buyer";
    }

    function topClassActive() {
      try {
        var raw = JSON.parse(localStorage.getItem("vibecart-top-class-membership-v1") || "{}");
        return !!(raw && raw.active === true);
      } catch {
        return false;
      }
    }

    function paintConcierge() {
      var persona = activePersona();
      if (!conciergeLine || !conciergeGo) return;
      if (persona === "seller") {
        conciergeLine.textContent = "Seller route: tighten listing health, then launch to live market in one motion.";
        conciergeGo.href = "./sell-journey.html";
        return;
      }
      if (persona === "curious") {
        conciergeLine.textContent = "Discovery route: start with visual lanes, then compare two promo regions.";
        conciergeGo.href = "./live-market-shops.html?cat=All&view=global&deal=best";
        return;
      }
      conciergeLine.textContent = "Buyer route: open top live promotions first, then lock best-value offer.";
      conciergeGo.href = "./live-market-shops.html?cat=All&view=global&deal=best";
    }

    function paintTrustPulse() {
      if (!trustPulse) return;
      var beats = [
        "Verified route",
        "Policy check ready",
        "Safer checkout path"
      ];
      trustPulse.innerHTML = beats.map(function (b) {
        return "<span>" + b + "</span>";
      }).join("");
      var idx = 0;
      window.setInterval(function () {
        idx = (idx + 1) % beats.length;
        var nodes = trustPulse.querySelectorAll("span");
        for (var i = 0; i < nodes.length; i += 1) {
          nodes[i].classList.toggle("is-live", i === idx);
        }
      }, 2600);
    }

    function paintPrestigePreview() {
      if (!prestigePreview || !prestigeLine) return;
      if (topClassActive()) {
        prestigePreview.classList.add("hidden");
        return;
      }
      prestigePreview.classList.remove("hidden");
      prestigeLine.textContent = "Locked: concierge-first support, prestige visuals, and autonomous AI suite.";
    }

    function paintMission() {
      if (!mission) return;
      var persona = activePersona();
      if (persona === "seller") {
        mission.textContent = "Mission: complete one high-trust listing and publish before end of day.";
      } else if (persona === "curious") {
        mission.textContent = "Mission: compare 2 regions and save the best offer path.";
      } else {
        mission.textContent = "Mission: open 2 top promo shops and choose the stronger value lane.";
      }
    }

    missionApply &&
      missionApply.addEventListener("click", function () {
        var persona = activePersona();
        if (persona === "seller") {
          window.location.assign("./sell-journey.html");
          return;
        }
        window.location.assign("./live-market-shops.html?cat=All&view=global&deal=best");
      });

    document.querySelectorAll("[data-vc-persona]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        paintConcierge();
        paintMission();
      });
    });

    paintConcierge();
    paintTrustPulse();
    paintPrestigePreview();
    paintMission();
    if (status) {
      status.textContent = "Hero intelligence active: concierge route, trust pulse, prestige preview, and AI mission card.";
    }
  }

  // ============================================================
  // Hard-pass Wave 1: Guided/Express UX, trust signals, link resilience
  // ============================================================

  var HARDPASS_UX_KEY = "vibecart-hardpass-ux-mode-v1";
  var HARDPASS_GUIDED_HIDE_SELECTORS = [
    "#shop-rewards",
    "#health-coach-pro",
    "#seller-marketing",
    "#seller-growth-ai",
    "#partner-program",
    "#vc-orbit-grid",
    "#productAdvancedTools",
    "#sellerInsightsPanel"
  ];

  function readHardPassUxMode() {
    try {
      var raw = String(localStorage.getItem(HARDPASS_UX_KEY) || "").trim();
      if (raw === "guided" || raw === "express") return raw;
    } catch {
      /* ignore */
    }
    return "guided";
  }

  function writeHardPassUxMode(mode) {
    try {
      localStorage.setItem(HARDPASS_UX_KEY, String(mode));
    } catch {
      /* ignore */
    }
  }

  function applyGuidedExpressMode(mode) {
    var guided = mode !== "express";
    document.body.classList.toggle("vc-hardpass-guided", guided);
    document.body.classList.toggle("vc-hardpass-express", !guided);
    HARDPASS_GUIDED_HIDE_SELECTORS.forEach(function (sel) {
      try {
        var nodes = document.querySelectorAll(sel);
        for (var i = 0; i < nodes.length; i += 1) {
          var node = nodes[i];
          if (!node) continue;
          if (guided) {
            node.classList.add("vc-hardpass-collapsed");
          } else {
            node.classList.remove("vc-hardpass-collapsed");
          }
        }
      } catch {
        /* ignore */
      }
    });
  }

  function initHardPassGuidedExpressLite() {
    if (!featureOn("hardPass_guidedUx_v1")) return;
    var hero = document.querySelector(".hero-copy");
    if (!hero) return;
    if (document.getElementById("vcHardPassUxBar")) return;
    var bar = document.createElement("div");
    bar.id = "vcHardPassUxBar";
    bar.className = "vc-hardpass-uxbar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Choose your experience density");
    var initial = readHardPassUxMode();
    bar.innerHTML =
      "<span class='vc-hardpass-uxbar-label'>Experience density</span>" +
      "<button type='button' class='vc-hardpass-uxbar-btn' data-vc-uxmode='guided'>Guided</button>" +
      "<button type='button' class='vc-hardpass-uxbar-btn' data-vc-uxmode='express'>Express</button>" +
      "<span id='vcHardPassUxStatus' class='vc-hardpass-uxbar-status' aria-live='polite'></span>";
    var firstChild = hero.firstChild;
    if (firstChild) {
      hero.insertBefore(bar, firstChild);
    } else {
      hero.appendChild(bar);
    }
    var statusEl = document.getElementById("vcHardPassUxStatus");
    function paintMode(mode) {
      var nodes = bar.querySelectorAll("[data-vc-uxmode]");
      for (var i = 0; i < nodes.length; i += 1) {
        var btn = nodes[i];
        var active = btn.getAttribute("data-vc-uxmode") === mode;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      }
      if (statusEl) {
        statusEl.textContent = mode === "express"
          ? "Express on. All advanced lanes visible."
          : "Guided on. Advanced lanes tucked away for clarity.";
      }
    }
    bar.addEventListener("click", function (event) {
      var btn = event.target && event.target.closest ? event.target.closest("[data-vc-uxmode]") : null;
      if (!btn) return;
      event.preventDefault();
      var mode = String(btn.getAttribute("data-vc-uxmode") || "guided");
      writeHardPassUxMode(mode);
      applyGuidedExpressMode(mode);
      paintMode(mode);
    });
    applyGuidedExpressMode(initial);
    paintMode(initial);
  }

  function initHardPassTrustSignalsLite() {
    if (!featureOn("hardPass_trustSignals_v1")) return;
    if (document.getElementById("vcHardPassTrustStrip")) return;
    var hero = document.querySelector(".hero-copy");
    if (!hero) return;
    var strip = document.createElement("div");
    strip.id = "vcHardPassTrustStrip";
    strip.className = "vc-hardpass-trust-strip";
    strip.setAttribute("aria-label", "Live trust signals");
    var signals = [
      { label: "Verified sellers", value: "98%", tone: "ok" },
      { label: "Promo links healthy", value: "Live", tone: "ok" },
      { label: "Anti-fraud guard", value: "Active", tone: "ok" },
      { label: "Policy gates", value: "On", tone: "ok" }
    ];
    strip.innerHTML = signals.map(function (s) {
      return "<span class='vc-hardpass-trust-chip vc-tone-" + s.tone + "'>" +
        "<strong>" + s.value + "</strong>" +
        "<em>" + s.label + "</em>" +
      "</span>";
    }).join("");
    var anchor = hero.querySelector(".hero-actions") || hero.firstChild;
    if (anchor && anchor.parentNode === hero) {
      hero.insertBefore(strip, anchor);
    } else {
      hero.appendChild(strip);
    }
  }

  function initHardPassLinkResilienceLite() {
    if (!featureOn("hardPass_linkResilience_v1")) return;
    if (document.body.getAttribute("data-vc-hardpass-link-resilience") === "1") return;
    document.body.setAttribute("data-vc-hardpass-link-resilience", "1");
    function isExternal(anchor) {
      try {
        if (!anchor || !anchor.href) return false;
        var u = new URL(anchor.href, window.location.href);
        return u.origin !== window.location.origin;
      } catch {
        return false;
      }
    }
    function showLinkToast(message) {
      var existing = document.getElementById("vcHardPassLinkToast");
      if (existing) {
        existing.parentNode && existing.parentNode.removeChild(existing);
      }
      var toast = document.createElement("div");
      toast.id = "vcHardPassLinkToast";
      toast.className = "vc-hardpass-link-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.textContent = String(message || "Opening external page in a new tab.");
      document.body.appendChild(toast);
      window.setTimeout(function () {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 4200);
    }
    document.addEventListener("click", function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest("a[href^='http']") : null;
      if (!anchor) return;
      if (!isExternal(anchor)) return;
      if (anchor.getAttribute("data-vc-hardpass-link-bound") === "1") return;
      anchor.setAttribute("data-vc-hardpass-link-bound", "1");
      if (!anchor.target) anchor.target = "_blank";
      var rel = String(anchor.rel || "");
      if (!/noopener/.test(rel)) anchor.rel = (rel ? rel + " " : "") + "noopener noreferrer";
      try {
        var host = new URL(anchor.href).hostname.replace(/^www\./, "");
        showLinkToast("Opening " + host + " in a new tab. If it does not load, click again to retry.");
      } catch {
        showLinkToast("Opening external page in a new tab.");
      }
    }, true);
  }

  // ============================================================
  // Hard-pass Wave 2: cinematic moments + immersive mode
  // ============================================================

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;
    } catch {
      return false;
    }
  }

  /** Native WebView: reveal hero/sections immediately (mirrors full script.js luxe-instant path). */
  function initVcMobileAppHomeRevealLite() {
    try {
      if (!document.documentElement.classList.contains("vc-mobile-app")) {
        return;
      }
      document.body.classList.add("luxe-ready", "luxe-instant");
      var nodes = document.querySelectorAll(".hero, .section");
      for (var i = 0; i < nodes.length; i += 1) {
        nodes[i].classList.add("is-visible");
      }
    } catch {
      /* ignore */
    }
  }

  function vcSignalReactNativePaintReadyFromLite() {
    try {
      var RN = typeof window !== "undefined" && window.ReactNativeWebView;
      if (!RN || typeof RN.postMessage !== "function") {
        return;
      }
      if (!document.documentElement.classList.contains("vc-mobile-app")) {
        return;
      }
      if (window.__vcPaintReadySent) {
        return;
      }
      window.__vcPaintReadySent = true;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          try {
            RN.postMessage(JSON.stringify({ vcPaintReady: true }));
          } catch {
            /* ignore */
          }
        });
      });
    } catch {
      /* ignore */
    }
  }

  function initHardPassCinematicMomentsLite() {
    if (!featureOn("hardPass_cinematicMoments_v1")) return;
    if (document.documentElement.classList.contains("vc-mobile-app")) return;
    if (prefersReducedMotion()) return;
    if (document.body.getAttribute("data-vc-hardpass-cinematic") === "1") return;
    document.body.setAttribute("data-vc-hardpass-cinematic", "1");

    var heroCopy = document.querySelector(".hero-copy");
    if (heroCopy) {
      heroCopy.classList.add("vc-cinematic-enter");
      window.setTimeout(function () {
        heroCopy.classList.add("vc-cinematic-settled");
      }, 800);
    }

    function celebrate(node) {
      if (!node) return;
      node.classList.add("vc-cinematic-pulse");
      window.setTimeout(function () {
        node.classList.remove("vc-cinematic-pulse");
      }, 1200);
    }

    function bindCelebration(selector) {
      try {
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i += 1) {
          (function (node) {
            node.addEventListener("click", function () {
              celebrate(node);
            });
          })(nodes[i]);
        }
      } catch {
        /* ignore */
      }
    }
    bindCelebration("#heroShopNowBtn");
    bindCelebration("#vcHeroMissionApply");
    bindCelebration("[data-vc-persona]");
  }

  function initHardPassImmersiveModeLite() {
    if (!featureOn("hardPass_immersiveMode_v1")) return;
    if (document.getElementById("vcHardPassImmersiveBtn")) return;
    var bar = document.getElementById("vcHardPassUxBar");
    if (!bar) return;
    var btn = document.createElement("button");
    btn.id = "vcHardPassImmersiveBtn";
    btn.type = "button";
    btn.className = "vc-hardpass-uxbar-btn vc-hardpass-uxbar-btn-immersive";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "Immersive";
    bar.appendChild(btn);
    var IMM_KEY = "vibecart-hardpass-immersive-v1";
    function readImmersive() {
      try {
        return localStorage.getItem(IMM_KEY) === "1";
      } catch {
        return false;
      }
    }
    function writeImmersive(active) {
      try {
        localStorage.setItem(IMM_KEY, active ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
    function applyImmersive(active) {
      document.body.classList.toggle("vc-hardpass-immersive", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("is-active", active);
    }
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      var next = !readImmersive();
      writeImmersive(next);
      applyImmersive(next);
    });
    applyImmersive(readImmersive());
  }

  // ============================================================
  // Hard-pass Wave 3: telemetry, offer explain, checkout resilience
  // ============================================================

  var HARDPASS_TELEMETRY_KEY = "vibecart-hardpass-telemetry-v1";

  function recordTelemetry(eventName, payload) {
    if (!featureOn("hardPass_telemetry_v1")) return;
    try {
      var raw = JSON.parse(localStorage.getItem(HARDPASS_TELEMETRY_KEY) || "[]");
      if (!Array.isArray(raw)) raw = [];
      raw.push({ ts: Date.now(), event: String(eventName || ""), payload: payload || null });
      if (raw.length > 200) raw = raw.slice(-200);
      localStorage.setItem(HARDPASS_TELEMETRY_KEY, JSON.stringify(raw));
    } catch {
      /* ignore */
    }
  }

  function initHardPassTelemetryLite() {
    if (!featureOn("hardPass_telemetry_v1")) return;
    if (document.body.getAttribute("data-vc-hardpass-telemetry") === "1") return;
    document.body.setAttribute("data-vc-hardpass-telemetry", "1");
    var heroBtn = document.getElementById("heroShopNowBtn");
    if (heroBtn) {
      heroBtn.addEventListener("click", function () {
        recordTelemetry("hero_action_click", { id: "heroShopNowBtn" });
      });
    }
    var missionApply = document.getElementById("vcHeroMissionApply");
    if (missionApply) {
      missionApply.addEventListener("click", function () {
        recordTelemetry("hero_action_click", { id: "vcHeroMissionApply" });
      });
    }
    document.addEventListener("click", function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest("a.btn[href*='live-market-shops']") : null;
      if (!anchor) return;
      recordTelemetry("promo_link_open", { href: String(anchor.getAttribute("href") || "") });
    }, true);
  }

  function initHardPassOfferExplainLite() {
    if (!featureOn("hardPass_offerExplain_v1")) return;
    if (document.getElementById("vcHardPassOfferExplain")) return;
    var hero = document.querySelector(".hero-copy");
    if (!hero) return;
    var line = document.createElement("p");
    line.id = "vcHardPassOfferExplain";
    line.className = "note vc-hardpass-offer-explain";
    line.textContent = "Why these offers: ranked by region match, freshness, and verified-seller score. Check the offer page for current price.";
    var quickLanes = hero.querySelector(".hero-quick-lanes");
    if (quickLanes && quickLanes.parentNode === hero) {
      hero.insertBefore(line, quickLanes.nextSibling);
    } else {
      hero.appendChild(line);
    }
  }

  function initHardPassCheckoutResilienceLite() {
    if (!featureOn("hardPass_checkoutResilience_v1")) return;
    var topBtn = document.getElementById("activatePremiumExperience");
    if (!topBtn) return;
    if (topBtn.getAttribute("data-vc-hardpass-checkout-bound") === "1") return;
    topBtn.setAttribute("data-vc-hardpass-checkout-bound", "1");
    topBtn.addEventListener("click", function () {
      recordTelemetry("checkout_start", { surface: "homepage_top_class" });
    }, true);
  }

  function initHardPassMissionJourneyLite() {
    if (!featureOn("hardPass_cinematicMoments_v1")) return;
    var card = document.querySelector(".hero-left-card .hero-actions");
    var apply = document.getElementById("vcHeroMissionApply");
    if (!card || !apply) return;
    if (document.getElementById("vcHardPassMissionJourney")) return;
    var journey = document.createElement("div");
    journey.id = "vcHardPassMissionJourney";
    journey.className = "vc-hardpass-mission-journey";
    journey.setAttribute("aria-label", "Mission progress");
    journey.innerHTML =
      "<span class='vc-hardpass-mj-step' data-step='1'></span>" +
      "<span class='vc-hardpass-mj-step' data-step='2'></span>" +
      "<span class='vc-hardpass-mj-step' data-step='3'></span>";
    card.parentNode && card.parentNode.insertBefore(journey, card);
    var step = 0;
    apply.addEventListener("click", function () {
      step = Math.min(step + 1, 3);
      var nodes = journey.querySelectorAll(".vc-hardpass-mj-step");
      for (var i = 0; i < nodes.length; i += 1) {
        nodes[i].classList.toggle("is-done", i < step);
      }
    }, true);
  }

  function initUnbreakableCoreLoopLite() {
    var hero = document.querySelector(".hero-copy");
    if (!hero || document.getElementById("vcCoreLoopCard")) return;
    var card = document.createElement("section");
    card.id = "vcCoreLoopCard";
    card.className = "card";
    card.style.marginTop = "0.75rem";
    card.innerHTML =
      "<p class='badge'>Unbreakable core loop</p>" +
      "<h3 style='margin:.25rem 0 .4rem'>Intent -> trusted match -> protected checkout</h3>" +
      "<p class='note'>The fastest safe-buy path is now the default: pick intent, open ranked trusted shop, complete with protection context.</p>" +
      "<div class='hero-actions'>" +
      "<a class='btn btn-primary' href='./live-market-shops.html?cat=All&view=global&deal=best'>Start 60-second loop</a>" +
      "<a class='btn btn-secondary' href='./security-overview.html'>Protection overview</a>" +
      "</div>";
    hero.appendChild(card);
  }

  function initTrustMoatLite() {
    var host = document.getElementById("vcHeroTrustPulse");
    if (!host || document.getElementById("vcTrustMoatLine")) return;
    var line = document.createElement("p");
    line.id = "vcTrustMoatLine";
    line.className = "note";
    line.textContent = "Trust moat live: verified lanes, risk acknowledgement, and direct-source checkout links.";
    host.insertAdjacentElement("afterend", line);
  }

  function initWowPathLite() {
    var key = "vibecart-wow-path-v1";
    if (document.getElementById("vcWowPathBtn")) return;
    var nav = document.getElementById("mobileQuickNav");
    if (!nav) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "vcWowPathBtn";
    btn.className = "vc-vibe-mode-btn";
    function read() {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    }
    function write(on) {
      try {
        localStorage.setItem(key, on ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
    function paint() {
      var on = read();
      document.documentElement.classList.toggle("vc-wow-path-on", on);
      btn.textContent = on ? "Wow path on" : "Wow path";
      btn.classList.toggle("is-on", on);
    }
    btn.addEventListener("click", function () {
      var next = !read();
      write(next);
      paint();
    });
    nav.appendChild(btn);
    paint();
  }

  function initNavAutoHideLite() {
    var nav = document.getElementById("siteTopbar") || document.querySelector(".topbar");
    if (!nav) return;
    if (nav.getAttribute("data-vc-nav-autohide-bound") === "1") return;
    nav.setAttribute("data-vc-nav-autohide-bound", "1");
    var lastY = Math.max(0, Math.round(window.scrollY || 0));
    var hidden = false;
    var ticking = false;
    var pendingY = lastY;
    function prefersReducedMotion() {
      try {
        return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      } catch {
        return false;
      }
    }
    function getTune() {
      var width = Number(window.innerWidth || 0);
      if (width <= 520) return { enabled: true, threshold: 16, minHideStart: 56 };
      if (width <= 820) return { enabled: true, threshold: 20, minHideStart: 72 };
      if (width <= 1024) return { enabled: true, threshold: 24, minHideStart: 92 };
      return { enabled: false, threshold: 999, minHideStart: 999 };
    }
    function canAutoHide() {
      return getTune().enabled && !prefersReducedMotion();
    }
    function setHidden(next) {
      if (hidden === next) return;
      hidden = next;
      nav.classList.toggle("vc-nav-hidden", hidden);
      nav.setAttribute("data-vc-nav-state", hidden ? "hidden" : "visible");
    }
    function shouldKeepVisibleByFocus() {
      var active = document.activeElement;
      if (!active) return false;
      var tag = String(active.tagName || "").toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || active.isContentEditable === true;
    }
    function handleScroll(y) {
      var tune = getTune();
      var delta = y - lastY;
      if (!tune.enabled || prefersReducedMotion() || shouldKeepVisibleByFocus()) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (y <= tune.minHideStart) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (delta > tune.threshold) {
        setHidden(true);
      } else if (delta < -tune.threshold) {
        setHidden(false);
      }
      lastY = y;
    }
    window.addEventListener(
      "scroll",
      function () {
        pendingY = Math.max(0, Math.round(window.scrollY || 0));
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          handleScroll(pendingY);
        });
      },
      { passive: true }
    );
    window.addEventListener("resize", function () {
      if (!canAutoHide()) {
        setHidden(false);
      }
      lastY = Math.max(0, Math.round(window.scrollY || 0));
    });
  }

  function initBackToTopLite() {
    if (document.getElementById("vcBackTop")) return;
    var backTop = document.createElement("button");
    backTop.id = "vcBackTop";
    backTop.type = "button";
    backTop.className = "vc-back-top";
    backTop.setAttribute("aria-label", "Back to top");
    backTop.textContent = "↑ Top";
    document.body.appendChild(backTop);
    function paint() {
      backTop.classList.toggle("is-visible", Number(window.scrollY || 0) > 420);
    }
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", paint, { passive: true });
    paint();
  }

  function initDeadEndLinkGuardLite() {
    if (document.body.getAttribute("data-vc-deadend-guard") === "1") return;
    document.body.setAttribute("data-vc-deadend-guard", "1");
    document.addEventListener(
      "click",
      function (event) {
        var anchor = event.target && event.target.closest ? event.target.closest("a[href='#']") : null;
        if (!anchor) return;
        event.preventDefault();
        var status = document.getElementById("expressCheckoutStatus");
        if (status) {
          status.textContent = "This action is not available on this screen yet. Use a visible lane button.";
        }
      },
      true
    );
  }

  function initHardPassPublishPreflightLite() {
    if (!featureOn("hardPass_publishPreflight_v1")) return;
    var hint = document.getElementById("vcHardPassPublishHint");
    if (hint) return;
    var sellerBtn = document.querySelector("a[href$='sell-journey.html']");
    if (!sellerBtn) return;
    var note = document.createElement("p");
    note.id = "vcHardPassPublishHint";
    note.className = "note";
    note.textContent = "Sellers: a quick preflight check runs before publish to catch missing photos, price, or category.";
    var parent = sellerBtn.parentNode;
    if (parent) {
      parent.appendChild(note);
    }
  }

  function boot() {
    function safeInit(name, fn) {
      try {
        fn();
      } catch (error) {
        try {
          document.body && document.body.setAttribute("data-vc-init-last-error", String(name || "unknown"));
        } catch {
          /* ignore */
        }
      }
    }
    // Critical paths first, each isolated from unrelated failures.
    safeInit("initVcMobileAppHomeRevealLite", initVcMobileAppHomeRevealLite);
    safeInit("initSmartTourLite", initSmartTourLite);
    safeInit("initExperienceModeLite", initExperienceModeLite);
    safeInit("initTopClassActivationLite", initTopClassActivationLite);
    safeInit("initAutonomousDebugLite", initAutonomousDebugLite);
    safeInit("initPersonaChooserLite", initPersonaChooserLite);
    safeInit("initHashLinks", initHashLinks);
    safeInit("initOpenShopStatus", initOpenShopStatus);
    safeInit("initShopSearchLite", initShopSearchLite);
    safeInit("initCategoryFilter", initCategoryFilter);
    safeInit("initCategoryCards", initCategoryCards);
    safeInit("initBridgePathToggle", initBridgePathToggle);
    safeInit("initAiAssistantLite", initAiAssistantLite);
    safeInit("initTrackingLite", initTrackingLite);
    safeInit("initBookingLite", initBookingLite);
    safeInit("initAdsLite", initAdsLite);
    safeInit("initInsuranceLite", initInsuranceLite);
    safeInit("initInsuranceTipsLite", initInsuranceTipsLite);
    safeInit("initHealthCoachLite", initHealthCoachLite);
    safeInit("initRewardsLite", initRewardsLite);
    safeInit("initCommunicationLite", initCommunicationLite);
    safeInit("initHomepageFocusLite", initHomepageFocusLite);
    safeInit("initRequestedSectionSwapsLite", initRequestedSectionSwapsLite);
    if (featureOn("advancedShockReelV1")) safeInit("initShockReelLite", initShockReelLite);
    if (featureOn("advancedEpicCarouselV1")) safeInit("initEpicCarouselLite", initEpicCarouselLite);
    if (featureOn("advancedVisualRhythmV1")) safeInit("initVisualRhythmLite", initVisualRhythmLite);
    if (featureOn("advancedAtmosphereDeckV1")) safeInit("initAtmosphereDeckLite", initAtmosphereDeckLite);
    if (featureOn("advancedListingHealthV1")) safeInit("initListingHealthLite", initListingHealthLite);
    if (featureOn("advancedBridgeFaqCopyV1")) safeInit("initBridgeFaqCopyLite", initBridgeFaqCopyLite);
    if (featureOn("advancedDetailsMemoryV1")) safeInit("initDetailsMemoryLite", initDetailsMemoryLite);
    if (featureOn("advancedMobileQuickNavV1")) safeInit("initMobileQuickNavLite", initMobileQuickNavLite);
    if (featureOn("advancedSellerReadinessV1")) safeInit("initSellerReadinessLite", initSellerReadinessLite);
    if (featureOn("advancedCheckoutClarityV1")) safeInit("initCheckoutClarityLite", initCheckoutClarityLite);
    if (featureOn("advancedSellerNextActionV1")) safeInit("initSellerNextActionLite", initSellerNextActionLite);
    if (featureOn("advancedPartnerPinV1")) safeInit("initPartnerPinLite", initPartnerPinLite);
    if (featureOn("advancedBuyerQuickStartV1")) safeInit("initBuyerQuickStartLite", initBuyerQuickStartLite);
    if (featureOn("advancedSellerMomentumV1")) safeInit("initSellerMomentumLite", initSellerMomentumLite);
    if (featureOn("advancedPartnerRecallV1")) safeInit("initPartnerRecallLite", initPartnerRecallLite);
    if (featureOn("advancedVisualJourneyV1")) safeInit("initVisualJourneyLite", initVisualJourneyLite);
    if (featureOn("advancedPwaBootstrapV1")) safeInit("initPwaBootstrapLite", initPwaBootstrapLite);
    if (featureOn("advancedInstallPromptV1")) safeInit("initInstallPromptLite", initInstallPromptLite);
    if (featureOn("advancedHealthCoachIntelV1")) safeInit("initHealthCoachIntelLite", initHealthCoachIntelLite);
    if (featureOn("advancedSellerGrowthIntelV1")) safeInit("initSellerGrowthIntelLite", initSellerGrowthIntelLite);
    safeInit("initUniversalShopLogosLite", initUniversalShopLogosLite);
    safeInit("initHeroLeftHardPassUpgrades", initHeroLeftHardPassUpgrades);
    if (featureOn("hardPass_trustSignals_v1")) safeInit("initHardPassTrustSignalsLite", initHardPassTrustSignalsLite);
    if (featureOn("hardPass_guidedUx_v1")) safeInit("initHardPassGuidedExpressLite", initHardPassGuidedExpressLite);
    if (featureOn("hardPass_immersiveMode_v1")) safeInit("initHardPassImmersiveModeLite", initHardPassImmersiveModeLite);
    if (featureOn("hardPass_linkResilience_v1")) safeInit("initHardPassLinkResilienceLite", initHardPassLinkResilienceLite);
    if (featureOn("hardPass_cinematicMoments_v1")) safeInit("initHardPassCinematicMomentsLite", initHardPassCinematicMomentsLite);
    if (featureOn("hardPass_telemetry_v1")) safeInit("initHardPassTelemetryLite", initHardPassTelemetryLite);
    if (featureOn("hardPass_offerExplain_v1")) safeInit("initHardPassOfferExplainLite", initHardPassOfferExplainLite);
    if (featureOn("hardPass_checkoutResilience_v1")) safeInit("initHardPassCheckoutResilienceLite", initHardPassCheckoutResilienceLite);
    if (featureOn("hardPass_publishPreflight_v1")) safeInit("initHardPassPublishPreflightLite", initHardPassPublishPreflightLite);
    if (featureOn("hardPass_cinematicMoments_v1")) safeInit("initHardPassMissionJourneyLite", initHardPassMissionJourneyLite);
    safeInit("initUnbreakableCoreLoopLite", initUnbreakableCoreLoopLite);
    safeInit("initTrustMoatLite", initTrustMoatLite);
    safeInit("initWowPathLite", initWowPathLite);
    safeInit("initNavAutoHideLite", initNavAutoHideLite);
    safeInit("initBackToTopLite", initBackToTopLite);
    safeInit("initDeadEndLinkGuardLite", initDeadEndLinkGuardLite);
    applySellerGrowthWorkspaceDeepLinkAfterHomeInit();
    vcSignalReactNativePaintReadyFromLite();
  }

  function applySellerGrowthWorkspaceDeepLinkAfterHomeInit() {
    try {
      var raw = String(window.location.hash || "")
        .replace(/^#/, "")
        .split("&")[0]
        .trim();
      if (raw !== "seller-growth-ai") {
        return;
      }
      var el = document.getElementById("seller-growth-ai");
      if (!el) {
        return;
      }
      el.removeAttribute("hidden");
      el.classList.remove("hidden", "vc-focused-hidden", "vc-hardpass-collapsed");
      el.style.display = "";
      window.setTimeout(function () {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
          try {
            el.scrollIntoView(true);
          } catch {
            /* ignore */
          }
        }
      }, 140);
    } catch {
      /* ignore */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

