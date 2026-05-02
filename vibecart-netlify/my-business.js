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

  var SERVICE_DESK_META = {
    "Hair Styling": {
      title: "Hair styling · client reservation",
      lead: "You are booking only hair services. Pick a provider offer, then your date and payment preference. Your stylist is notified to accept or decline."
    },
    Barber: {
      title: "Barber · client reservation",
      lead: "Barber-only desk. Your request goes to the provider you select — no other service lines on this screen."
    },
    "Bakery / custom cakes": {
      title: "Bakery & custom cakes · client reservation",
      lead: "Cake and bakery requests only. Describe servings, flavours, and date — your baker confirms before payment where required."
    },
    Nails: {
      title: "Nails · client reservation",
      lead: "Nails-only booking flow. Choose an offer, then propose your slot."
    },
    Makeup: {
      title: "Makeup · client reservation",
      lead: "Makeup-only desk. Share occasion, look references, and timing."
    },
    "Other service": {
      title: "Service booking",
      lead: "Request a reservation for the service line you chose at the gate."
    }
  };

  var clientWizardStep = 0;
  var clientSelectedSlot = "";
  var clientPollTimer = null;
  var clientActiveBookingId = 0;

  var providerBookingsCache = [];
  var providerFocusBookingId = 0;

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
      if (!o.persona || !o.service) return null;
      if (o.persona === "client" && o.pwdHash === "__none__") {
        return o;
      }
      if (!o.pwdHash || !o.salt) return null;
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
        (persona === "provider" ? "Provider desk" : "Client booking") + " · " + service;
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
    if (beautyH && persona === "provider") {
      beautyH.textContent = "Beauty & service booking (provider preview)";
    }

    var provLine = document.getElementById("mbProviderSessionLine");
    if (provLine && persona === "provider") {
      provLine.textContent =
        "Everything below is framed for " +
        service +
        ". Connect payouts, publish work cards, and confirm bookings in line with your local rules for that trade.";
    }

    document.title = (persona === "provider" ? "Provider" : "Client") + " · " + service + " · My Business · VibeCart";

    if (persona === "client") {
      initClientServiceDesk(service);
    } else {
      clearClientPoll();
      clientActiveBookingId = 0;
    }
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
    if (raw !== "#beauty-services" && raw !== "#mb-client-service-desk") return;
    if (cfg && cfg.persona !== "client") return;
    var el =
      raw === "#mb-client-service-desk"
        ? document.getElementById("mb-client-service-desk")
        : document.getElementById("beauty-services");
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

  function clearClientPoll() {
    if (clientPollTimer) {
      clearInterval(clientPollTimer);
      clientPollTimer = null;
    }
  }

  function returnToServicePicker() {
    clearClientPoll();
    clientWizardStep = 0;
    clientSelectedSlot = "";
    clientActiveBookingId = 0;
    clearMbConfig();
    clearSessionUnlock();
    draftPersona = "client";
    draftService = "";
    document.body.classList.add("mb-boot-pending");
    var main = document.getElementById("mbMainDashboard");
    if (main) main.setAttribute("aria-hidden", "true");
    showGate();
    showServiceStep();
  }

  function initClientServiceDesk(service) {
    var meta = SERVICE_DESK_META[service] || SERVICE_DESK_META["Other service"];
    var t = document.getElementById("mbSvcDeskTitle");
    var l = document.getElementById("mbSvcDeskLead");
    if (t) t.textContent = meta.title;
    if (l) l.textContent = meta.lead;
    clientWizardStep = 0;
    clientSelectedSlot = "";
    clientActiveBookingId = 0;
    clearClientPoll();
    var wait = document.getElementById("mbClientWaitBanner");
    if (wait) {
      wait.hidden = true;
      wait.textContent = "";
    }
    var chat = document.getElementById("mbClientChatPanel");
    if (chat) chat.hidden = true;
    var hint = document.getElementById("mbClientChatHint");
    if (hint) {
      hint.textContent = "Chat opens after your provider accepts this booking.";
    }
    var slots = document.getElementById("mbCliSlots");
    if (slots) slots.innerHTML = "";
    var d = document.getElementById("mbCliDate");
    if (d) d.value = "";
    var det = document.getElementById("mbCliDetails");
    if (det) det.value = "";
    renderClientWizardStep();
    loadDiscoverForClientLine(service)
      .catch(function () {})
      .then(function () {
        tryResumeLastClientBooking();
        return api("/api/public/bakery/bookings/as-buyer").catch(function () {
          return { bookings: [] };
        });
      })
      .then(function (res) {
        renderClientMyBookings((res && res.bookings) || []);
      });
  }

  function renderClientMyBookings(bookings) {
    var root = document.getElementById("mbClientBookingsList");
    if (!root) return;
    if (!Array.isArray(bookings) || !bookings.length) {
      root.innerHTML = '<p class="note">No signed-in requests yet. Send one from the booking desk above.</p>';
      return;
    }
    root.innerHTML = bookings
      .map(function (b) {
        var st = escapeHtml(b.bookingStatus || "pending");
        var line = b.serviceLine ? escapeHtml(String(b.serviceLine)) + " · " : "";
        return (
          '<article class="vc-booking-item vc-mb-client-booking-row">' +
          "<h3>" +
          line +
          "#" +
          Number(b.id) +
          " · " +
          escapeHtml(b.workTitle || "Service") +
          '</h3><p class="note">' +
          escapeHtml(b.businessName || "") +
          " · " +
          escapeHtml(String(b.eventDate || "")) +
          " · " +
          st +
          "</p>" +
          '<p class="hero-actions">' +
          '<button type="button" class="btn btn-secondary" data-mb-resume-client-booking="' +
          Number(b.id) +
          '">Open in desk &amp; messages</button>' +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function loadClientDashboard() {
    var cfg = loadMbConfig();
    if (!cfg || cfg.persona !== "client" || !isSessionUnlocked(cfg.persona, cfg.service)) {
      return Promise.resolve();
    }
    return Promise.all([
      loadDiscoverForClientLine(cfg.service),
      api("/api/public/bakery/bookings/as-buyer").catch(function () {
        return { bookings: [] };
      })
    ]).then(function (results) {
      renderClientMyBookings(results[1].bookings || []);
      setStatus("Updated · " + cfg.service);
    });
  }

  function tryResumeLastClientBooking() {
    try {
      var lb = Number(sessionStorage.getItem("vibecart-mb-last-booking") || 0);
      if (!lb) return;
      clientActiveBookingId = lb;
      api("/api/public/bakery/bookings/detail?bookingId=" + encodeURIComponent(String(lb)))
        .then(function (res) {
          var st = String((res.booking && res.booking.bookingStatus) || "").toLowerCase();
          if (st === "confirmed") {
            var panel = document.getElementById("mbClientChatPanel");
            if (panel) panel.hidden = false;
            var hint = document.getElementById("mbClientChatHint");
            if (hint) hint.textContent = "Messages on your accepted booking are private to you and your provider.";
            loadClientChatMessages();
            clearClientPoll();
          } else if (st === "declined" || st === "cancelled") {
            sessionStorage.removeItem("vibecart-mb-last-booking");
            clientActiveBookingId = 0;
            setStatus("Your previous request was " + st + ". You can send a new reservation below.");
          } else {
            var wait = document.getElementById("mbClientWaitBanner");
            if (wait) {
              wait.hidden = false;
              wait.textContent =
                "Booking #" +
                lb +
                " is waiting for your provider to accept. We will notify you when they respond — you can still send another request below.";
            }
            startClientBookingPoll();
          }
        })
        .catch(function () {
          sessionStorage.removeItem("vibecart-mb-last-booking");
          clientActiveBookingId = 0;
        });
    } catch (_) {
      /* ignore */
    }
  }

  function loadDiscoverForClientLine(serviceLine) {
    var line = String(serviceLine || "").trim();
    return api("/api/public/bakery/services/discover?line=" + encodeURIComponent(line)).then(function (res) {
      var list = Array.isArray(res.services) ? res.services : [];
      var pick = document.getElementById("mbCliProviderSelect");
      if (pick) {
        pick.innerHTML =
          '<option value="">' +
          (list.length ? "Choose a live offer" : "No live offers yet — ask a provider to publish") +
          "</option>" +
          list
            .map(function (s) {
              return (
                '<option value="' +
                Number(s.id) +
                '">' +
                escapeHtml(s.businessName + " · " + s.workTitle + " · " + Number(s.basePrice || 0).toFixed(2) + " " + (s.currency || "USD")) +
                "</option>"
              );
            })
            .join("");
      }
      return list;
    });
  }

  function renderClientWizardStep() {
    var s1 = document.getElementById("mbClientStep1");
    var s2 = document.getElementById("mbClientStep2");
    var s3 = document.getElementById("mbClientStep3");
    var pill = document.getElementById("mbClientStepPill");
    var back = document.getElementById("mbClientBack");
    var next = document.getElementById("mbClientNext");
    var sub = document.getElementById("mbClientSubmitReserve");
    if (s1) s1.hidden = clientWizardStep !== 0;
    if (s2) s2.hidden = clientWizardStep !== 1;
    if (s3) s3.hidden = clientWizardStep !== 2;
    var labels = ["Step 1 of 3 · Your details", "Step 2 of 3 · Date & time", "Step 3 of 3 · Pay preference & request"];
    if (pill) pill.textContent = labels[clientWizardStep] || labels[0];
    if (back) back.disabled = false;
    if (next) {
      next.hidden = clientWizardStep >= 2;
      next.textContent = clientWizardStep >= 2 ? "Continue" : "Continue";
    }
    if (sub) sub.hidden = clientWizardStep < 2;
    if (clientWizardStep === 1) {
      buildClientSlotButtons();
    }
  }

  function buildClientSlotButtons() {
    var root = document.getElementById("mbCliSlots");
    if (!root) return;
    var times = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
    root.innerHTML = times
      .map(function (t) {
        return '<button type="button" class="btn btn-secondary vc-mb-slot-btn" data-mb-slot="' + t + '">' + t + "</button>";
      })
      .join("");
    root.querySelectorAll("[data-mb-slot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        root.querySelectorAll(".vc-mb-slot-btn").forEach(function (b) {
          b.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        clientSelectedSlot = String(btn.getAttribute("data-mb-slot") || "");
      });
      if (clientSelectedSlot && String(btn.getAttribute("data-mb-slot") || "") === clientSelectedSlot) {
        btn.classList.add("is-selected");
      }
    });
  }

  function getClientPaymentPref() {
    var r = document.querySelector('input[name="mbCliPay"]:checked');
    return r ? String(r.value || "pay_full") : "pay_full";
  }

  function submitClientReservation() {
    var cfg = loadMbConfig();
    var sid = Number(document.getElementById("mbCliProviderSelect") && document.getElementById("mbCliProviderSelect").value);
    var name = String(document.getElementById("mbCliCustName") && document.getElementById("mbCliCustName").value || "").trim();
    var phone = String(document.getElementById("mbCliCustPhone") && document.getElementById("mbCliCustPhone").value || "").trim();
    var date = String(document.getElementById("mbCliDate") && document.getElementById("mbCliDate").value || "").trim();
    var details = String(document.getElementById("mbCliDetails") && document.getElementById("mbCliDetails").value || "").trim();
    if (!sid) {
      setStatus("Choose a provider offer.");
      return;
    }
    if (name.length < 2) {
      setStatus("Add your name.");
      return;
    }
    if (!date) {
      setStatus("Pick a preferred date.");
      return;
    }
    if (!clientSelectedSlot) {
      setStatus("Pick a preferred time slot.");
      return;
    }
    if (details.length < 8) {
      setStatus("Add a short description of what you need (8+ characters).");
      return;
    }
    var pay = getClientPaymentPref();
    var line = cfg && cfg.service ? String(cfg.service) : "";
    var occasion = "Payment: " + pay + " · Time preference: " + clientSelectedSlot;
    var body = {
      serviceId: sid,
      customerName: name,
      customerPhone: phone,
      eventDate: date,
      occasionType: occasion,
      styleTheme: line,
      budgetAmount: 0,
      requestDetails: details,
      paymentPreference: pay,
      serviceLine: line
    };
    setStatus("Sending reservation…");
    return api("/api/public/bakery/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        clientActiveBookingId = Number(res.bookingId || 0);
        try {
          sessionStorage.setItem("vibecart-mb-last-booking", String(clientActiveBookingId));
        } catch (_) {
          /* ignore */
        }
        var wait = document.getElementById("mbClientWaitBanner");
        if (wait) {
          wait.hidden = false;
          wait.textContent =
            "Request sent. Waiting for your provider to accept — we will notify you here and by push when they respond. You can change service line in a moment.";
        }
        setStatus("Reservation sent.");
        startClientBookingPoll();
        loadClientDashboard().catch(function () {});
        window.setTimeout(function () {
          returnToServicePicker();
        }, 4200);
      })
      .catch(function (err) {
        setStatus("Could not send: " + err.message);
      });
  }

  function startClientBookingPoll() {
    clearClientPoll();
    if (!clientActiveBookingId) return;
    clientPollTimer = window.setInterval(function () {
      api("/api/public/bakery/bookings/detail?bookingId=" + encodeURIComponent(String(clientActiveBookingId)))
        .then(function (res) {
          var st = String((res.booking && res.booking.bookingStatus) || "");
          var hint = document.getElementById("mbClientChatHint");
          var panel = document.getElementById("mbClientChatPanel");
          if (st === "confirmed" && panel) {
            panel.hidden = false;
            if (hint) hint.textContent = "Your provider accepted — messages below are private to this booking.";
            loadClientChatMessages();
            clearClientPoll();
          }
        })
        .catch(function () {});
    }, 12000);
  }

  function loadClientChatMessages() {
    if (!clientActiveBookingId) return;
    api("/api/public/bakery/bookings/messages?bookingId=" + encodeURIComponent(String(clientActiveBookingId)))
      .then(function (res) {
        var list = document.getElementById("mbClientChatList");
        if (!list || !Array.isArray(res.messages)) return;
        list.innerHTML = res.messages
          .map(function (m) {
            return (
              '<p class="note vc-mb-chat-line"><strong>#' +
              Number(m.senderUserId) +
              "</strong> · " +
              escapeHtml(m.body) +
              "</p>"
            );
          })
          .join("");
      })
      .catch(function () {});
  }

  function sendClientChatMessage() {
    var inp = document.getElementById("mbClientChatInput");
    var txt = inp ? String(inp.value || "").trim() : "";
    if (!txt || !clientActiveBookingId) return;
    api("/api/public/bakery/bookings/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: clientActiveBookingId, message: txt })
    })
      .then(function () {
        if (inp) inp.value = "";
        loadClientChatMessages();
      })
      .catch(function (err) {
        setStatus(err.message || "Could not send message");
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
    var svcLab = document.getElementById("mbStepServiceLabel");
    if (svcLab) {
      svcLab.textContent = draftPersona === "provider" ? "Step 2 of 3" : "Step 2 of 2";
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
    var clientNoPwd = cfg && cfg.persona === "client" && cfg.pwdHash === "__none__";
    if (echo) {
      echo.textContent = clientNoPwd
        ? "Continue to your client booking tools for " + cfg.service + "."
        : "Enter the password for your " +
            (cfg.persona === "provider" ? "provider" : "client") +
            " dashboard · " +
            cfg.service +
            ".";
    }
    var inp = document.getElementById("mbUnlockPw");
    if (inp) inp.value = "";
    var pwRow = document.getElementById("mbUnlockPwRow");
    var quick = document.getElementById("mbUnlockQuick");
    var unlockSubmit = document.getElementById("mbUnlockSubmit");
    if (pwRow) pwRow.hidden = !!clientNoPwd;
    if (quick) quick.hidden = !clientNoPwd;
    if (unlockSubmit) unlockSubmit.hidden = !!clientNoPwd;
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
        if (draftPersona === "client") {
          var cfgClient = { persona: "client", service: draftService, pwdHash: "__none__", salt: "" };
          saveMbConfig(cfgClient);
          setSessionUnlocked(cfgClient.persona, cfgClient.service);
          revealMainAndLoad(cfgClient);
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

    document.getElementById("mbUnlockQuick") &&
      document.getElementById("mbUnlockQuick").addEventListener("click", function () {
        var cfg = loadMbConfig();
        if (!cfg || cfg.persona !== "client" || cfg.pwdHash !== "__none__") return;
        setSessionUnlocked(cfg.persona, cfg.service);
        setGateStatus("mbGateStatusUnlock", "Opening…", true);
        revealMainAndLoad(cfg);
      });

    document.getElementById("mbUnlockSubmit") &&
      document.getElementById("mbUnlockSubmit").addEventListener("click", function () {
        if (gateBusy) return;
        var cfg = loadMbConfig();
        if (!cfg) {
          showPersonaStep();
          return;
        }
        if (cfg.persona === "client" && cfg.pwdHash === "__none__") {
          setSessionUnlocked(cfg.persona, cfg.service);
          revealMainAndLoad(cfg);
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

    wireClientDesk();
    wireProviderFocusPanel();
  }

  function loadProviderFocus(bookingId) {
    providerFocusBookingId = Number(bookingId || 0);
    var root = document.getElementById("mbProvFocusRoot");
    if (!root || !providerFocusBookingId) return;
    root.removeAttribute("hidden");
    root.setAttribute("data-booking-id", String(providerFocusBookingId));
    api("/api/public/bakery/bookings/detail?bookingId=" + encodeURIComponent(String(providerFocusBookingId)))
      .then(function (res) {
        fillProviderFocusFromBooking(res.booking || {});
      })
      .catch(function (err) {
        setStatus(err.message || "Could not load booking");
        closeProviderBookingFocus();
      });
  }

  function closeProviderBookingFocus() {
    providerFocusBookingId = 0;
    var el = document.getElementById("mbProvFocusRoot");
    if (el) {
      el.setAttribute("hidden", "hidden");
      el.setAttribute("data-booking-id", "");
    }
  }

  function fillProviderFocusFromBooking(b) {
    var st = String(b.bookingStatus || "").toLowerCase();
    var title = document.getElementById("mbProvFocusTitle");
    if (title) title.textContent = "#" + Number(b.id || 0) + " · " + (b.customerName || "Customer");
    var sum = document.getElementById("mbProvFocusSummary");
    if (sum) {
      sum.textContent = [b.businessName, b.workTitle, b.eventDate, st].filter(Boolean).join(" · ");
    }
    var det = document.getElementById("mbProvFocusDetails");
    if (det) {
      var parts = [];
      if (b.customerPhone) {
        parts.push("<p><strong>Phone</strong> · " + escapeHtml(String(b.customerPhone)) + "</p>");
      }
      if (b.serviceLine) {
        parts.push("<p><strong>Service line</strong> · " + escapeHtml(String(b.serviceLine)) + "</p>");
      }
      if (b.paymentPreference) {
        parts.push("<p><strong>Payment preference</strong> · " + escapeHtml(String(b.paymentPreference)) + "</p>");
      }
      if (b.occasionType) {
        parts.push("<p><strong>Scheduling / pay notes</strong> · " + escapeHtml(String(b.occasionType)) + "</p>");
      }
      if (b.styleTheme) {
        parts.push("<p><strong>Style / theme</strong> · " + escapeHtml(String(b.styleTheme)) + "</p>");
      }
      parts.push("<p><strong>Request</strong></p><p class=\"note\">" + escapeHtml(String(b.requestDetails || "")) + "</p>");
      det.innerHTML = parts.join("");
    }
    var actions = document.getElementById("mbProvFocusActions");
    if (actions) {
      actions.querySelectorAll("[data-booking-status]").forEach(function (btn) {
        var action = String(btn.getAttribute("data-booking-status") || "");
        var show = false;
        if (st === "pending") {
          show = action === "confirmed" || action === "declined";
        } else if (st === "confirmed") {
          show = action === "completed";
        }
        btn.hidden = !show;
      });
    }
    var chatWrap = document.getElementById("mbProvFocusChatWrap");
    var chatNote = document.getElementById("mbProvFocusChatNote");
    if (chatWrap) {
      chatWrap.hidden = st !== "confirmed";
      if (chatNote) {
        chatNote.textContent =
          st === "confirmed"
            ? "Private thread with your client on this booking."
            : "Messages unlock after you accept the booking.";
      }
      if (st === "confirmed") {
        loadProvFocusMessages();
      }
    }
  }

  function loadProvFocusMessages() {
    if (!providerFocusBookingId) return;
    api("/api/public/bakery/bookings/messages?bookingId=" + encodeURIComponent(String(providerFocusBookingId)))
      .then(function (res) {
        var list = document.getElementById("mbProvChatList");
        if (!list || !Array.isArray(res.messages)) return;
        list.innerHTML = res.messages
          .map(function (m) {
            return (
              '<p class="note vc-mb-chat-line"><strong>User #' +
              Number(m.senderUserId) +
              "</strong> · " +
              escapeHtml(m.body) +
              "</p>"
            );
          })
          .join("");
      })
      .catch(function () {});
  }

  function sendProvFocusMessage() {
    var inp = document.getElementById("mbProvChatInput");
    var txt = inp ? String(inp.value || "").trim() : "";
    if (!txt || !providerFocusBookingId) return;
    api("/api/public/bakery/bookings/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: providerFocusBookingId, message: txt })
    })
      .then(function () {
        if (inp) inp.value = "";
        loadProvFocusMessages();
      })
      .catch(function (err) {
        setStatus(err.message || "Could not send message");
      });
  }

  function wireProviderFocusPanel() {
    var closeBtn = document.getElementById("mbProvFocusClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeProviderBookingFocus();
      });
    }
    var sendBtn = document.getElementById("mbProvChatSend");
    if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        sendProvFocusMessage();
      });
    }
    var chatInp = document.getElementById("mbProvChatInput");
    if (chatInp) {
      chatInp.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          sendProvFocusMessage();
        }
      });
    }
  }

  function wireClientDesk() {
    var chg = document.getElementById("mbClientChangeService");
    if (chg) {
      chg.addEventListener("click", function () {
        returnToServicePicker();
      });
    }
    var back = document.getElementById("mbClientBack");
    if (back) {
      back.addEventListener("click", function () {
        if (clientWizardStep > 0) {
          clientWizardStep -= 1;
          renderClientWizardStep();
          setStatus("");
        } else {
          returnToServicePicker();
        }
      });
    }
    var next = document.getElementById("mbClientNext");
    if (next) {
      next.addEventListener("click", function () {
        if (clientWizardStep === 0) {
          var sid = Number(
            (document.getElementById("mbCliProviderSelect") && document.getElementById("mbCliProviderSelect").value) || 0
          );
          var name = String(
            (document.getElementById("mbCliCustName") && document.getElementById("mbCliCustName").value) || ""
          ).trim();
          if (!sid) {
            setStatus("Choose a provider offer.");
            return;
          }
          if (name.length < 2) {
            setStatus("Add your name.");
            return;
          }
          clientWizardStep = 1;
          renderClientWizardStep();
          setStatus("");
          return;
        }
        if (clientWizardStep === 1) {
          var date = String(
            (document.getElementById("mbCliDate") && document.getElementById("mbCliDate").value) || ""
          ).trim();
          if (!date) {
            setStatus("Pick a preferred date.");
            return;
          }
          if (!clientSelectedSlot) {
            setStatus("Pick a preferred time slot.");
            return;
          }
          clientWizardStep = 2;
          renderClientWizardStep();
          setStatus("");
        }
      });
    }
    var sub = document.getElementById("mbClientSubmitReserve");
    if (sub) {
      sub.addEventListener("click", function () {
        submitClientReservation();
      });
    }
    var send = document.getElementById("mbClientChatSend");
    if (send) {
      send.addEventListener("click", function () {
        sendClientChatMessage();
      });
    }
    var chatInput = document.getElementById("mbClientChatInput");
    if (chatInput) {
      chatInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          sendClientChatMessage();
        }
      });
    }
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
    providerBookingsCache = Array.isArray(bookings) ? bookings : [];
    if (!providerBookingsCache.length) {
      root.innerHTML = '<p class="note">No bakery booking requests yet.</p>';
      return;
    }
    root.innerHTML = providerBookingsCache.map(function (b) {
      var phoneDigits = String(b.customerPhone || "").replace(/[^\d+]/g, "");
      var waUrl = phoneDigits
        ? "https://wa.me/" +
          encodeURIComponent(phoneDigits.replace(/^\+/, "")) +
          "?text=" +
          encodeURIComponent("Hi " + (b.customerName || "") + ", about your VibeCart booking #" + Number(b.id || 0))
        : "";
      var st = escapeHtml(b.bookingStatus || "pending");
      return (
        '<article class="vc-booking-item vc-mb-booking-row" data-booking-id="' +
        Number(b.id) +
        '">' +
        "<h3>" +
        escapeHtml(b.customerName) +
        " · " +
        escapeHtml(b.workTitle) +
        ' <span class="vc-pill">' +
        st +
        "</span></h3>" +
        '<p class="note">' +
        escapeHtml(String(b.eventDate || "")) +
        " · " +
        escapeHtml(b.businessName || "") +
        "</p>" +
        '<p class="hero-actions">' +
        (waUrl
          ? '<a class="btn btn-secondary" target="_blank" rel="noopener noreferrer" href="' +
            escapeHtml(waUrl) +
            '">WhatsApp</a>'
          : "") +
        '<button type="button" class="btn btn-primary" data-mb-focus-booking="' +
        Number(b.id) +
        '">Open &amp; act</button>' +
        "</p>" +
        "</article>"
      );
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
    if (cfg.persona === "client") {
      setStatus("");
      return loadClientDashboard().catch(function (err) {
        setStatus("Could not refresh: " + err.message);
      });
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
      if (providerFocusBookingId) {
        loadProviderFocus(providerFocusBookingId);
      }
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
    var focusOpen = e.target.closest && e.target.closest("[data-mb-focus-booking]");
    if (focusOpen) {
      var fid = Number(focusOpen.getAttribute("data-mb-focus-booking") || 0);
      if (fid) {
        loadProviderFocus(fid);
      }
      return;
    }
    var resumeClient = e.target.closest && e.target.closest("[data-mb-resume-client-booking]");
    if (resumeClient) {
      var rid = Number(resumeClient.getAttribute("data-mb-resume-client-booking") || 0);
      if (rid) {
        try {
          sessionStorage.setItem("vibecart-mb-last-booking", String(rid));
        } catch (_) {
          /* ignore */
        }
        clientActiveBookingId = rid;
        tryResumeLastClientBooking();
        var desk = document.getElementById("mb-client-service-desk");
        if (desk) {
          desk.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return;
    }
    var statusBtn = e.target.closest && e.target.closest("[data-booking-status]");
    if (statusBtn) {
      var bookingCard = statusBtn.closest("[data-booking-id]");
      var bookingId = Number((bookingCard && bookingCard.dataset && bookingCard.dataset.bookingId) || 0);
      var status = String(statusBtn.getAttribute("data-booking-status") || "");
      api("/api/public/bakery/bookings/status/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingId, status: status })
      })
        .then(loadAll)
        .then(function () {
          if (providerFocusBookingId && bookingId === providerFocusBookingId) {
            loadProviderFocus(providerFocusBookingId);
          }
        });
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
    var btnClientBookings = document.getElementById("mbClientBookingsRefresh");
    if (btnClientBookings) btnClientBookings.addEventListener("click", loadClientDashboard);
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
