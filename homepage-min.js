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
    advancedPersonaChooserV1: true
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

    function toNum(v) {
      var n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }

    function parseProducts() {
      var nodes = Array.prototype.slice.call(document.querySelectorAll("#products .product"));
      return nodes.map(function (node) {
        var titleEl = node.querySelector("h3");
        var priceEl = node.querySelector(".price");
        var lineEl = node.querySelector("p:not(.price)");
        var title = titleEl ? String(titleEl.textContent || "").trim() : "Item";
        var cat = String(node.getAttribute("data-category") || "All").trim();
        var priceText = priceEl ? String(priceEl.textContent || "") : "";
        var price = toNum((priceText.match(/(\d+(\.\d+)?)/) || [])[1] || 0);
        var shipping = lineEl ? String(lineEl.textContent || "").trim() : "";
        return { title: title, category: cat, price: price, shipping: shipping };
      });
    }

    function score(item, pref) {
      var s = 0;
      if (pref.category === "All" || item.category === pref.category) s += 30;
      if (pref.budget > 0) s += Math.max(0, 30 - Math.abs(item.price - pref.budget));
      if (pref.need && item.title.toLowerCase().indexOf(pref.need.toLowerCase()) >= 0) s += 40;
      return s;
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      var pref = {
        need: String(need.value || "").trim(),
        budget: toNum(budget.value || 0),
        category: String(category.value || "All").trim() || "All"
      };
      var ranked = parseProducts()
        .map(function (p) {
          return { item: p, score: score(p, pref) };
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, 3)
        .map(function (row, idx) {
          var i = row.item;
          return (
            String(idx + 1) +
            ". " +
            i.title +
            " (" +
            i.category +
            ") · EUR " +
            Number(i.price || 0).toFixed(2) +
            (i.shipping ? " · " + i.shipping : "")
          );
        });
      out.textContent = ranked.length
        ? "Ranked matches: " + ranked.join(" | ")
        : "No local matches yet. Try broadening category or budget.";
    });
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
        row.className = "note";
        row.textContent = "• " + slot;
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
        card.innerHTML =
          "<h3>" +
          ad.title +
          "</h3><p>" +
          ad.note +
          "</p><a class=\"btn btn-secondary\" href=\"" +
          ad.href +
          "\">Open</a>";
        slots.appendChild(card);
      });
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      render();
    });
    render();
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

    saveBtn.addEventListener("click", function (event) {
      event.preventDefault();
      var store = loadStore();
      store.profile = readProfile();
      saveStore(store);
      render();
    });

    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
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
      // simple echo so thread feels alive in safe local mode
      rows.push({ who: "seller", text: "Received. We will reply soon.", at: new Date().toISOString() });
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

    function openModal() {
      idx = 0;
      render();
      modal.classList.remove("hidden");
    }

    function closeModal() {
      modal.classList.add("hidden");
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
    window.setInterval(applyRhythm, 60 * 1000);
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

  function boot() {
    try {
      initShopSearchLite();
      initHashLinks();
      initOpenShopStatus();
      initCategoryFilter();
      initCategoryCards();
      initBridgePathToggle();
      initAiAssistantLite();
      initTrackingLite();
      initBookingLite();
      initAdsLite();
      initInsuranceLite();
      initInsuranceTipsLite();
      initHealthCoachLite();
      initRewardsLite();
      initCommunicationLite();
      if (featureOn("advancedSmartTourV1")) initSmartTourLite();
      if (featureOn("advancedShockReelV1")) initShockReelLite();
      if (featureOn("advancedEpicCarouselV1")) initEpicCarouselLite();
      if (featureOn("advancedVisualRhythmV1")) initVisualRhythmLite();
      if (featureOn("advancedAtmosphereDeckV1")) initAtmosphereDeckLite();
      if (featureOn("advancedPersonaChooserV1")) initPersonaChooserLite();
    } catch {
      // Freeze mode: swallow unexpected UI script errors to keep taps/navigation alive.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

