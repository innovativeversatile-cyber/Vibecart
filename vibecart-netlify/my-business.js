(function () {
  "use strict";

  var TOKEN_KEY = "vibecart-public-auth-token";
  var MB_CFG_KEY = "vibecart-mb-dashboard-v2";
  var MB_SESS_KEY = "vibecart-mb-unlock-sess-v2";

  var SERVICES = [
    { value: "Hair Styling", label: "Hair / hairdresser" },
    { value: "Barber", label: "Barber" },
    { value: "Bakery / custom cakes", label: "Bakery / cakes" },
    { value: "Nails", label: "Nails" },
    { value: "Makeup", label: "Makeup" },
    { value: "Other service", label: "Other service" }
  ];

  var draftPersona = "";
  var draftService = "";
  var gateBusy = false;

  function getToken() {
    return String(localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function setStatus(text) {
    var node = document.getElementById("bizStatus");
    if (node) node.textContent = String(text || "");
  }

  function api(path, options) {
    var base = Object.assign({}, (options && options.headers) || {});
    var token = getToken();
    var headers =
      token && window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(token, base)
        : Object.assign({}, base, token ? { Authorization: "Bearer " + token } : {});
    return fetch(path, Object.assign({}, options || {}, { headers: headers })).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (json) {
        if (!r.ok || json.ok === false) throw new Error(String((json && (json.message || json.code)) || ("HTTP_" + r.status)));
        return json;
      });
    });
  }

  function escapeHtml(v) {
    return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function loadMbConfig() {
    try {
      var raw = localStorage.getItem(MB_CFG_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return null;
      if (!o.persona || !o.service || !o.pwdHash || !o.salt) return null;
      return o;
    } catch (_) {
      return null;
    }
  }

  function saveMbConfig(cfg) {
    localStorage.setItem(MB_CFG_KEY, JSON.stringify(cfg));
  }

  function clearMbConfig() {
    localStorage.removeItem(MB_CFG_KEY);
  }

  function isSessionUnlocked(persona, service) {
    try {
      var raw = sessionStorage.getItem(MB_SESS_KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      return !!(o && o.p === persona && o.s === service);
    } catch (_) {
      return false;
    }
  }

  function setSessionUnlocked(persona, service) {
    sessionStorage.setItem(MB_SESS_KEY, JSON.stringify({ p: persona, s: service }));
  }

  function clearSessionUnlock() {
    sessionStorage.removeItem(MB_SESS_KEY);
  }

  function randomSalt() {
    try {
      var a = new Uint8Array(16);
      crypto.getRandomValues(a);
      return Array.from(a, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    } catch (_) {
      return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
    }
  }

  function hashPasswordFallback(password, salt) {
    var s = String(salt) + "|" + String(password);
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return "fb_" + (h >>> 0).toString(16) + "_" + s.length.toString(16);
  }

  function hashPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.resolve(hashPasswordFallback(password, salt));
    }
    var enc = new TextEncoder();
    return crypto.subtle.digest("SHA-256", enc.encode(String(salt) + "|" + String(password))).then(function (buf) {
      return Array.from(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }

  function setGateStatus(id, text, ok) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(text || "");
    el.classList.toggle("is-ok", !!ok);
  }

  function hideAllSteps() {
    ["mbStepPersona", "mbStepService", "mbStepPassword", "mbStepUnlock"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.hidden = true;
    });
  }

  function showGate() {
    var root = document.getElementById("mbGateRoot");
    if (root) root.removeAttribute("hidden");
  }

  function hideGate() {
    var root = document.getElementById("mbGateRoot");
    if (root) root.setAttribute("hidden", "hidden");
  }

  function applyServiceSelects(service) {
    var beauty = document.getElementById("beautyBookingServiceType");
    var bakery = document.getElementById("bakeryServiceCategory");
    var opts = SERVICES.map(function (s) { return s.value; });
    if (beauty && opts.indexOf(service) >= 0) beauty.value = service;
    if (bakery && opts.indexOf(service) >= 0) bakery.value = service;
  }

  function applyDashboard(cfg) {
    var persona = String(cfg.persona || "");
    var service = String(cfg.service || "");
    document.body.classList.remove("mb-mode-client", "mb-mode-provider");
    document.body.classList.add(persona === "provider" ? "mb-mode-provider" : "mb-mode-client");

    var discC = document.getElementById("mbDisclaimerClient");
    var discP = document.getElementById("mbDisclaimerProvider");
    if (discC) {
      discC.hidden = persona !== "client";
    }
    if (discP) {
      discP.hidden = persona !== "provider";
    }

    var pill = document.getElementById("mbSessionPill");
    if (pill) {
      pill.textContent =
        (persona === "provider" ? "Provider desk" : "Client hub") + " · " + service;
    }

    var welcome = document.getElementById("mbClientWelcomeLine");
    if (welcome && persona === "client") {
      welcome.textContent =
        "Your session is scoped to " +
        service +
        ". Book slots above, then send a detailed request so providers can quote accurately.";
    }

    var tpl = document.getElementById("mbTopProviderTemplate");
    if (tpl) {
      tpl.hidden = persona === "client";
      if (persona === "provider") {
        tpl.setAttribute("href", "./service-provider-hub.html?service=" + encodeURIComponent(service));
      }
    }

    applyServiceSelects(service);

    var beautyH = document.querySelector("#beauty-services h2");
    if (beautyH && persona === "client") {
      beautyH.textContent = "Beauty & service booking · " + service;
    }
    if (beautyH && persona === "provider") {
      beautyH.textContent = "Beauty & service booking";
    }

    var provLine = document.getElementById("mbProviderSessionLine");
    if (provLine && persona === "provider") {
      provLine.textContent =
        "Everything below is framed for " +
        service +
        ". Connect payouts, publish work cards, and confirm bookings in line with your local rules for that trade.";
    }

    document.title = (persona === "provider" ? "Provider" : "Client") + " · " + service + " · My Business · VibeCart";
  }

  function revealMainAndLoad(cfg) {
    hideGate();
    document.body.classList.remove("mb-boot-pending");
    var mainEl = document.getElementById("mbMainDashboard");
    if (mainEl) mainEl.removeAttribute("aria-hidden");
    applyDashboard(cfg);
    scrollToBeautyHashIfAllowed(cfg);
    loadAll();
  }

  function scrollToBeautyHashIfAllowed(cfg) {
    var raw = String(location.hash || "").replace(/\/$/, "");
    if (raw !== "#beauty-services") return;
    if (cfg && cfg.persona !== "client") return;
    var el = document.getElementById("beauty-services");
    if (!el) return;
    requestAnimationFrame(function () {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        el.focus({ preventScroll: true });
      } catch (_) {
        /* ignore */
      }
    });
  }

  function buildServiceGrid() {
    var grid = document.getElementById("mbServiceGrid");
    var cont = document.getElementById("mbContinueService");
    if (!grid) return;
    grid.innerHTML = SERVICES.map(function (s) {
      return (
        '<button type="button" class="vc-mb-svc-btn" data-mb-svc="' +
        escapeHtml(s.value) +
        '">' +
        escapeHtml(s.label) +
        "</button>"
      );
    }).join("");
    grid.querySelectorAll("[data-mb-svc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        grid.querySelectorAll(".vc-mb-svc-btn").forEach(function (b) { b.classList.remove("is-selected"); });
        btn.classList.add("is-selected");
        draftService = String(btn.getAttribute("data-mb-svc") || "");
        if (cont) cont.disabled = !draftService;
        setGateStatus("mbGateStatusService", "", false);
      });
    });
    if (cont) cont.disabled = true;
  }

  function showPersonaStep() {
    hideAllSteps();
    var s = document.getElementById("mbStepPersona");
    if (s) s.hidden = false;
    draftPersona = "";
    draftService = "";
    setGateStatus("mbGateStatusPersona", "", false);
  }

  function showServiceStep() {
    hideAllSteps();
    var s = document.getElementById("mbStepService");
    if (s) s.hidden = false;
    var echo = document.getElementById("mbPersonaEcho");
    if (echo) {
      echo.textContent = draftPersona === "provider" ? "Service provider" : "Client";
    }
    buildServiceGrid();
    setGateStatus("mbGateStatusService", "", false);
  }

  function showPasswordStep() {
    hideAllSteps();
    var s = document.getElementById("mbStepPassword");
    if (s) s.hidden = false;
    var a = document.getElementById("mbNewPw");
    var b = document.getElementById("mbNewPw2");
    if (a) a.value = "";
    if (b) b.value = "";
    setGateStatus("mbGateStatusPwd", "", false);
  }

  function showUnlockStep(cfg) {
    hideAllSteps();
    var s = document.getElementById("mbStepUnlock");
    if (s) s.hidden = false;
    var echo = document.getElementById("mbUnlockEcho");
    if (echo) {
      echo.textContent =
        "Enter the password for your " +
        (cfg.persona === "provider" ? "provider" : "client") +
        " dashboard · " +
        cfg.service +
        ".";
    }
    var inp = document.getElementById("mbUnlockPw");
    if (inp) inp.value = "";
    setGateStatus("mbGateStatusUnlock", "", false);
  }

  function bootGate() {
    var cfg = loadMbConfig();

    if (cfg && isSessionUnlocked(cfg.persona, cfg.service)) {
      document.body.classList.remove("mb-boot-pending");
      hideGate();
      applyDashboard(cfg);
      loadAll();
      requestAnimationFrame(function () { scrollToBeautyHashIfAllowed(cfg); });
      return;
    }

    document.body.classList.add("mb-boot-pending");
    if (cfg) {
      showGate();
      showUnlockStep(cfg);
      return;
    }

    draftPersona = "";
    draftService = "";
    showGate();
    showPersonaStep();
  }

  function wireGateUi() {
    document.getElementById("mbPickClient") &&
      document.getElementById("mbPickClient").addEventListener("click", function () {
        draftPersona = "client";
        showServiceStep();
      });
    document.getElementById("mbPickProvider") &&
      document.getElementById("mbPickProvider").addEventListener("click", function () {
        draftPersona = "provider";
        showServiceStep();
      });

    document.getElementById("mbBackToPersona") &&
      document.getElementById("mbBackToPersona").addEventListener("click", function () {
        showPersonaStep();
      });
    document.getElementById("mbContinueService") &&
      document.getElementById("mbContinueService").addEventListener("click", function () {
        if (!draftService) {
          setGateStatus("mbGateStatusService", "Pick a service line to continue.", false);
          return;
        }
        showPasswordStep();
      });
    document.getElementById("mbBackToService") &&
      document.getElementById("mbBackToService").addEventListener("click", function () {
        showServiceStep();
      });

    document.getElementById("mbSavePassword") &&
      document.getElementById("mbSavePassword").addEventListener("click", function () {
        if (gateBusy) return;
        var p1 = document.getElementById("mbNewPw");
        var p2 = document.getElementById("mbNewPw2");
        var a = p1 ? String(p1.value || "") : "";
        var b = p2 ? String(p2.value || "") : "";
        if (a.length < 8) {
          setGateStatus("mbGateStatusPwd", "Use at least 8 characters.", false);
          return;
        }
        if (a !== b) {
          setGateStatus("mbGateStatusPwd", "Passwords do not match.", false);
          return;
        }
        gateBusy = true;
        var salt = randomSalt();
        hashPassword(a, salt).then(function (hex) {
          var cfg = { persona: draftPersona, service: draftService, pwdHash: hex, salt: salt };
          saveMbConfig(cfg);
          setSessionUnlocked(cfg.persona, cfg.service);
          gateBusy = false;
          setGateStatus("mbGateStatusPwd", "Saved. Opening dashboard…", true);
          revealMainAndLoad(cfg);
        }).catch(function () {
          gateBusy = false;
          setGateStatus("mbGateStatusPwd", "Could not save password on this device.", false);
        });
      });

    document.getElementById("mbUnlockSubmit") &&
      document.getElementById("mbUnlockSubmit").addEventListener("click", function () {
        if (gateBusy) return;
        var cfg = loadMbConfig();
        if (!cfg) {
          showPersonaStep();
          return;
        }
        var inp = document.getElementById("mbUnlockPw");
        var pw = inp ? String(inp.value || "") : "";
        if (!pw) {
          setGateStatus("mbGateStatusUnlock", "Enter your dashboard password.", false);
          return;
        }
        gateBusy = true;
        hashPassword(pw, cfg.salt).then(function (hex) {
          gateBusy = false;
          if (hex !== cfg.pwdHash) {
            setGateStatus("mbGateStatusUnlock", "That password does not match.", false);
            return;
          }
          setSessionUnlocked(cfg.persona, cfg.service);
          setGateStatus("mbGateStatusUnlock", "Welcome back.", true);
          revealMainAndLoad(cfg);
        }).catch(function () {
          gateBusy = false;
          setGateStatus("mbGateStatusUnlock", "Could not verify on this device.", false);
        });
      });

    var unlockPw = document.getElementById("mbUnlockPw");
    if (unlockPw) {
      unlockPw.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          var btn = document.getElementById("mbUnlockSubmit");
          if (btn) btn.click();
        }
      });
    }
    var pw2 = document.getElementById("mbNewPw2");
    if (pw2) {
      pw2.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          var btn = document.getElementById("mbSavePassword");
          if (btn) btn.click();
        }
      });
    }

    document.getElementById("mbResetProfile") &&
      document.getElementById("mbResetProfile").addEventListener("click", function () {
        clearMbConfig();
        clearSessionUnlock();
        draftPersona = "";
        draftService = "";
        showPersonaStep();
        setGateStatus("mbGateStatusUnlock", "Choose a new role and service.", true);
      });

    document.getElementById("mbLockAgain") &&
      document.getElementById("mbLockAgain").addEventListener("click", function () {
        var cfg = loadMbConfig();
        if (!cfg) return;
        clearSessionUnlock();
        setStatus("");
        document.body.classList.add("mb-boot-pending");
        var main = document.getElementById("mbMainDashboard");
        if (main) main.setAttribute("aria-hidden", "true");
        showGate();
        showUnlockStep(cfg);
      });
  }

  function renderKpis(listings, services, bookings) {
    var node = document.getElementById("bizKpis");
    if (!node) return;
    var activeListings = (listings || []).filter(function (x) { return String(x.status || "") === "active"; }).length;
    var activeBakery = (services || []).filter(function (x) { return !!x.isActive; }).length;
    var pendingBookings = (bookings || []).filter(function (x) { return String(x.bookingStatus || "") === "pending"; }).length;
    node.innerHTML =
      '<article class="vc-biz-card"><span class="vc-pill">Listings</span><h3>' + Number((listings || []).length) + '</h3><p class="note">Active: ' + activeListings + "</p></article>" +
      '<article class="vc-biz-card"><span class="vc-pill">Service work cards</span><h3>' + Number((services || []).length) + '</h3><p class="note">Active cards: ' + activeBakery + "</p></article>" +
      '<article class="vc-biz-card"><span class="vc-pill">Booking requests</span><h3>' + Number((bookings || []).length) + '</h3><p class="note">Pending: ' + pendingBookings + "</p></article>";
  }

  function readBakeryForm() {
    var catEl = document.getElementById("bakeryServiceCategory");
    var line = catEl ? String(catEl.value || "").trim() : "Bakery / custom cakes";
    var theme = String(document.getElementById("bakeryStyleTheme").value || "").trim();
    var styleTheme = theme ? line + " · " + theme : line;
    return {
      businessName: document.getElementById("bakeryBusinessName").value,
      workTitle: document.getElementById("bakeryWorkTitle").value,
      styleTheme: styleTheme,
      basePrice: Number(document.getElementById("bakeryBasePrice").value || 0),
      currency: document.getElementById("bakeryCurrency").value || "USD",
      imageUrl: document.getElementById("bakeryImageUrl").value,
      requirementsText: document.getElementById("bakeryRequirements").value
    };
  }

  function renderServices(services) {
    var root = document.getElementById("bakeryWorkList");
    if (!root) return;
    if (!Array.isArray(services) || !services.length) {
      root.innerHTML = '<p class="note">No bakery work cards yet. Add one above.</p>';
      return;
    }
    root.innerHTML = services.map(function (s) {
      return '<article class="vc-work-item" data-service-id="' + Number(s.id) + '">' +
        "<h3>" + escapeHtml(s.workTitle) + "</h3>" +
        '<p class="note">' + escapeHtml(s.businessName) + " · " + escapeHtml(s.styleTheme || "No style yet") + "</p>" +
        '<p class="note">Price: ' + Number(s.basePrice || 0).toFixed(2) + " " + escapeHtml(s.currency || "USD") + "</p>" +
        '<p class="note">Requirements: ' + escapeHtml(s.requirementsText || "None") + "</p>" +
        (s.imageUrl
          ? '<div class="vc-work-thumb"><img src="' +
            escapeHtml(s.imageUrl) +
            '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></div>'
          : "") +
        '<p class="hero-actions">' +
        '<button class="btn btn-secondary" data-toggle="' + (s.isActive ? "0" : "1") + '">' + (s.isActive ? "Pause listing" : "Relist") + "</button>" +
        "</p>" +
      "</article>";
    }).join("");
  }

  function renderBookings(bookings) {
    var root = document.getElementById("bakeryBookingList");
    if (!root) return;
    if (!Array.isArray(bookings) || !bookings.length) {
      root.innerHTML = '<p class="note">No bakery booking requests yet.</p>';
      return;
    }
    root.innerHTML = bookings.map(function (b) {
      var phoneDigits = String(b.customerPhone || "").replace(/[^\d+]/g, "");
      var waUrl = phoneDigits ? ("https://wa.me/" + encodeURIComponent(phoneDigits.replace(/^\+/, "")) + "?text=" + encodeURIComponent("Hi " + (b.customerName || "") + ", about your VibeCart bakery booking #" + Number(b.id || 0))) : "";
      return '<article class="vc-booking-item" data-booking-id="' + Number(b.id) + '">' +
        "<h3>" + escapeHtml(b.customerName) + " · " + escapeHtml(b.workTitle) + "</h3>" +
        '<p class="note">Date: ' + escapeHtml(String(b.eventDate || "")) + " · Occasion: " + escapeHtml(b.occasionType || "General") + "</p>" +
        '<p class="note">Style/theme: ' + escapeHtml(b.styleTheme || "Not specified") + "</p>" +
        '<p class="note">Request: ' + escapeHtml(b.requestDetails || "") + "</p>" +
        '<p class="note">Budget: ' + (b.budgetAmount == null ? "Not set" : Number(b.budgetAmount).toFixed(2)) + "</p>" +
        '<p class="hero-actions">' +
        (waUrl ? ('<a class="btn btn-secondary" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(waUrl) + '">WhatsApp customer</a>') : "") +
        '<button class="btn btn-secondary" data-booking-status="confirmed">Confirm</button>' +
        '<button class="btn btn-secondary" data-booking-status="declined">Decline</button>' +
        '<button class="btn btn-primary" data-booking-status="completed">Complete</button>' +
        "</p>" +
      "</article>";
    }).join("");
  }

  function renderCalendar(bookings) {
    var root = document.getElementById("bakeryCalendarView");
    if (!root) return;
    root.innerHTML = "";
    if (!Array.isArray(bookings) || !bookings.length) {
      root.innerHTML = '<p class="note">No bookings on calendar yet.</p>';
      return;
    }
    var byDate = {};
    bookings.forEach(function (b) {
      var key = String(b.eventDate || "No date");
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(b);
    });
    Object.keys(byDate).sort().forEach(function (date) {
      var card = document.createElement("article");
      card.className = "vc-booking-item";
      card.innerHTML = "<h3>" + escapeHtml(date) + "</h3>" + byDate[date].map(function (b) {
        return "<p class='note'>" + escapeHtml(b.customerName || "Customer") + " · " + escapeHtml(b.workTitle || "Service") + " · " + escapeHtml(b.bookingStatus || "pending") + "</p>";
      }).join("");
      root.appendChild(card);
    });
  }

  function renderMediatorOrders(orders) {
    var root = document.getElementById("orderMediatorList");
    if (!root) return;
    root.innerHTML = "";
    if (!Array.isArray(orders) || !orders.length) {
      root.innerHTML = '<p class="note">No orders yet.</p>';
      return;
    }
    orders.slice(0, 30).forEach(function (o) {
      var p = o.progress || {};
      var node = document.createElement("article");
      node.className = "vc-booking-item";
      node.innerHTML =
        "<h3>Order #" + Number(o.orderId || 0) + " · " + escapeHtml(o.title || "Item") + "</h3>" +
        "<p class='note'>Status: " + escapeHtml(o.status || "pending") + " · Buyer: " + (p.buyerConfirmedAt ? "confirmed" : "pending") + " · Seller: " + (p.sellerConfirmedAt ? "confirmed" : "pending") + "</p>" +
        "<p class='hero-actions'><button type='button' class='btn btn-primary' data-order-confirm='" + Number(o.orderId || 0) + "'>Confirm my side</button></p>";
      root.appendChild(node);
    });
  }

  function loadDiscover(q) {
    return api("/api/public/bakery/services/discover?q=" + encodeURIComponent(String(q || ""))).then(function (res) {
      var pick = document.getElementById("bookingService");
      if (!pick) return [];
      var list = Array.isArray(res.services) ? res.services : [];
      pick.innerHTML = list.map(function (s) {
        var label = s.businessName + " · " + s.workTitle + " · " + Number(s.basePrice || 0).toFixed(2) + " " + (s.currency || "USD");
        return '<option value="' + Number(s.id) + '">' + escapeHtml(label) + "</option>";
      }).join("");
      return list;
    });
  }

  function loadAll() {
    var cfg = loadMbConfig();
    if (!cfg || !isSessionUnlocked(cfg.persona, cfg.service)) {
      return;
    }
    setStatus("Loading My Business…");
    return Promise.all([
      api("/api/public/seller/listings").catch(function () { return { listings: [] }; }),
      api("/api/public/bakery/services/mine").catch(function () { return { services: [] }; }),
      api("/api/public/bakery/bookings/mine").catch(function () { return { bookings: [] }; }),
      api("/api/public/orders/mine").catch(function () { return { orders: [] }; }),
      loadDiscover("")
    ]).then(function (results) {
      renderKpis(results[0].listings || [], results[1].services || [], results[2].bookings || []);
      renderServices(results[1].services || []);
      renderBookings(results[2].bookings || []);
      renderCalendar(results[2].bookings || []);
      renderMediatorOrders(results[3].orders || []);
      setStatus("Dashboard updated");
    }).catch(function (err) {
      setStatus("Could not load dashboard: " + err.message);
    });
  }

  function saveBakeryService() {
    var body = readBakeryForm();
    return api("/api/public/bakery/services/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function () {
      setStatus("Bakery work card saved");
      return loadAll();
    }).catch(function (err) {
      setStatus("Save failed: " + err.message);
    });
  }

  function submitBooking() {
    var serviceId = Number(document.getElementById("bookingService").value || 0);
    var body = {
      serviceId: serviceId,
      customerName: document.getElementById("bookingCustomerName").value,
      customerPhone: document.getElementById("bookingPhone").value,
      eventDate: document.getElementById("bookingDate").value,
      occasionType: document.getElementById("bookingOccasion").value,
      styleTheme: document.getElementById("bookingStyleTheme").value,
      budgetAmount: Number(document.getElementById("bookingBudget").value || 0),
      requestDetails: document.getElementById("bookingDetails").value
    };
    return api("/api/public/bakery/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function () {
      setStatus("Booking request sent to baker");
      return loadAll();
    }).catch(function (err) {
      setStatus("Booking failed: " + err.message);
    });
  }

  function savePayoutAccount() {
    var stripeAccountId = String((document.getElementById("sellerStripeAccountId") || {}).value || "").trim();
    return api("/api/public/seller/payout-account/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeAccountId: stripeAccountId })
    }).then(function () {
      setStatus("Payout account saved. Auto-release will transfer after dual confirmation.");
    }).catch(function (err) {
      setStatus("Payout setup failed: " + err.message);
    });
  }

  function onClick(e) {
    var toggle = e.target.closest && e.target.closest("[data-toggle]");
    if (toggle) {
      var serviceCard = toggle.closest("[data-service-id]");
      var serviceId = Number(serviceCard && serviceCard.dataset.serviceId || 0);
      var active = String(toggle.getAttribute("data-toggle") || "") === "1";
      api("/api/public/bakery/services/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: serviceId, isActive: active })
      }).then(loadAll);
      return;
    }
    var statusBtn = e.target.closest && e.target.closest("[data-booking-status]");
    if (statusBtn) {
      var bookingCard = statusBtn.closest("[data-booking-id]");
      var bookingId = Number(bookingCard && bookingCard.dataset.bookingId || 0);
      var status = String(statusBtn.getAttribute("data-booking-status") || "");
      api("/api/public/bakery/bookings/status/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingId, status: status })
      }).then(loadAll);
      return;
    }
    var orderConfirmBtn = e.target.closest && e.target.closest("[data-order-confirm]");
    if (orderConfirmBtn) {
      var orderId = Number(orderConfirmBtn.getAttribute("data-order-confirm") || 0);
      if (!orderId) return;
      api("/api/public/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId })
      }).then(function (res) {
        setStatus(res.released ? "Both sides confirmed. Escrow released automatically." : "Your confirmation saved. Waiting for the other side.");
        return loadAll();
      }).catch(function (err) {
        setStatus("Order confirmation failed: " + err.message);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireGateUi();
    bootGate();

    window.addEventListener("pageshow", function () {
      var cfg = loadMbConfig();
      if (cfg && isSessionUnlocked(cfg.persona, cfg.service)) {
        scrollToBeautyHashIfAllowed(cfg);
      }
    });

    var btnRefresh = document.getElementById("bizRefreshBtn");
    var btnSaveBakery = document.getElementById("bakerySaveBtn");
    var btnDiscover = document.getElementById("discoverBtn");
    var btnBooking = document.getElementById("bookingSubmitBtn");
    var btnPayout = document.getElementById("savePayoutAccountBtn");
    if (btnRefresh) btnRefresh.addEventListener("click", loadAll);
    if (btnSaveBakery) btnSaveBakery.addEventListener("click", saveBakeryService);
    if (btnDiscover) btnDiscover.addEventListener("click", function () {
      var q = document.getElementById("discoverQuery").value;
      loadDiscover(q).then(function () { setStatus("Bakery styles updated"); });
    });
    if (btnBooking) btnBooking.addEventListener("click", submitBooking);
    if (btnPayout) btnPayout.addEventListener("click", savePayoutAccount);
    document.body.addEventListener("click", onClick);
    var beautySlotsBtn = document.getElementById("beautyShowBookingSlots");
    var beautySvc = document.getElementById("beautyBookingServiceType");
    var beautyDate = document.getElementById("beautyBookingDate");
    var beautyOut = document.getElementById("beautyBookingSlotsResult");
    var beautyPrepay = document.getElementById("beautyBookingPrepayRouteBtn");
    if (beautySlotsBtn && beautySvc && beautyDate && beautyOut) {
      beautySlotsBtn.addEventListener("click", function () {
        var date = beautyDate.value || "selected date";
        var service = beautySvc.value || "Service";
        var sampleSlots = ["09:00", "11:00", "13:30", "16:00"];
        var href =
          "./checkout-details.html?flow=service_booking&service=" +
          encodeURIComponent(service) +
          "&date=" +
          encodeURIComponent(date);
        beautyOut.innerHTML =
          service +
          " slots on " +
          date +
          ": " +
          sampleSlots.join(", ") +
          '. Payment is required before the date is locked.<br/><a class="btn btn-primary" href="' +
          href +
          '">Pay deposit and reserve date</a>';
        if (beautyPrepay) {
          beautyPrepay.setAttribute("href", href);
        }
      });
    }
  });
})();
