(function () {
  "use strict";

  var TOKEN_KEY = "vibecart-public-auth-token";
  var MB_CFG_KEY = "vibecart-mb-dashboard-v2";
  var MB_SESS_KEY = "vibecart-mb-unlock-sess-v2";
  /** Provider desk uses VibeCart seller session instead of a device-only password. */
  var MB_VC_PROVIDER_MARKER = "__vc__";
  /** Citizen desk: browse, book, and manage offers without choosing only client or provider. */
  var MB_CITIZEN_MARKER = "__citizen__";

  function isClientLikePersona(persona) {
    return persona === "client" || persona === "citizen";
  }

  function isProviderDeskConfig(cfg) {
    return cfg && (cfg.persona === "provider" || cfg.persona === "citizen");
  }

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
      title: "Custom service line · client reservation",
      lead: "You picked a custom line. Publish a work card for that niche so it appears in client search for this line."
    }
  };

  var clientWizardStep = 0;
  var clientSelectedSlot = "";
  var clientPollTimer = null;
  var clientActiveBookingId = 0;

  var providerBookingsCache = [];
  var mbLastProviderServices = [];
  var providerFocusBookingId = 0;
  var mbSessionUserId = 0;
  var mbClientChatWs = null;
  var mbProvChatWs = null;
  var mbProviderDeskWs = null;
  var providerDeskPollTimer = null;
  var mbLastPendingBookingCount = -1;
  var pendingProviderDeepLinkBookingId = 0;

  var draftPersona = "";
  var draftService = "";
  var gateBusy = false;
  /** Work-card gallery { kind: "image"|"video", url } for save + client preview */
  var mbWorkGallery = [];
  var mbDiscoverServiceById = {};
  var mbSlotChipTimes = [];

  function getToken() {
    return String(localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function setStatus(text) {
    var t = String(text || "");
    var node = document.getElementById("bizStatus");
    if (node) node.textContent = t;
    var cliDesk = document.getElementById("mbClientDeskStatus");
    if (cliDesk) cliDesk.textContent = t;
    var signHint = document.getElementById("mbClientSigninHint");
    if (signHint && t) signHint.textContent = t;
    if (!t) return;
    if (!node && !cliDesk && !signHint) {
      try {
        window.alert(t);
      } catch (_) {
        /* ignore */
      }
    }
  }

  /** Restore slot from visible selection if the in-memory value was cleared (e.g. async slot reload). */
  function syncClientSelectedSlotFromDom() {
    if (clientSelectedSlot) return clientSelectedSlot;
    var sel = document.querySelector("#mbCliSlots .vc-mb-slot-btn.is-selected");
    if (!sel) return "";
    clientSelectedSlot = String(sel.getAttribute("data-mb-slot") || "").trim();
    return clientSelectedSlot;
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function mbWebPushShowDebugOpsNote() {
    try {
      if (/[?&]debug=1(?:&|$)/.test(String(location.search || ""))) return true;
      var h = String(location.hostname || "");
      return h === "localhost" || h === "127.0.0.1" || /\.localhost$/.test(h);
    } catch (_) {
      return false;
    }
  }

  function wireMbWebPushControls() {
    var btn = document.getElementById("mbWebPushBtn");
    var note = document.getElementById("mbWebPushNote");
    if (!btn || btn.getAttribute("data-mb-wired") === "1") return;
    btn.setAttribute("data-mb-wired", "1");
    var PUSH_ONCE_KEY = "vibecart-webpush-enabled-v1";
    try {
      if (localStorage.getItem(PUSH_ONCE_KEY) === "1") {
        btn.disabled = true;
        btn.textContent = "Phone alerts enabled";
        if (note) note.textContent = "Already enabled on this device.";
      }
    } catch (_) {
      /* ignore */
    }
    var vapidPublicKey = null;
    function setNote(t) {
      if (note) note.textContent = String(t || "");
    }
    var configPromise = fetch("/api/public/web-push/config")
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (j && j.ok && j.publicKey) vapidPublicKey = String(j.publicKey);
        return j;
      })
      .catch(function () {
        return null;
      });
    btn.addEventListener("click", function () {
      var token = getToken();
      if (!token) {
        setNote("Sign in first, then try again.");
        return;
      }
      setNote("Checking…");
      configPromise.then(function () {
        if (!vapidPublicKey) {
          if (mbWebPushShowDebugOpsNote()) {
            setNote(
              "Web Push is off until the API has VAPID keys. On Railway (Node service), set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY from `npx web-push generate-vapid-keys`, redeploy the API, then hard-refresh this page."
            );
          } else {
            setNote(
              "Booking alerts are not available on this site yet. You can still use the dashboard here; try again after an update."
            );
          }
          return;
        }
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          setNote("Use Chrome on Android, or add VibeCart to your Home Screen on iPhone for notifications.");
          return;
        }
        setNote("Working…");
        navigator.serviceWorker
          .register("./service-worker.js?v=20260510lean15")
          .then(function (reg) {
            return reg.pushManager.getSubscription().then(function (existing) {
              if (existing) return existing;
              return reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
              });
            });
          })
          .then(function (sub) {
            var headers = { "Content-Type": "application/json", Authorization: "Bearer " + token };
            if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
              headers = window.VibeCartSessionDevice.merge(token, headers);
            }
            return fetch("/api/public/account/web-push/register", {
              method: "POST",
              headers: headers,
              body: JSON.stringify({ subscription: sub.toJSON() })
            }).then(function (r) {
              return r.json().then(function (j) {
                return { ok: r.ok, j: j };
              });
            });
          })
          .then(function (x) {
            if (x && x.ok && x.j && x.j.ok) {
              try {
                localStorage.setItem(PUSH_ONCE_KEY, "1");
              } catch (_) {
                /* ignore */
              }
              btn.disabled = true;
              btn.textContent = "Phone alerts enabled";
              setNote("Booking alerts enabled for this browser. Allow notifications in phone settings if prompted.");
            } else {
              setNote((x && x.j && (x.j.message || x.j.code)) || "Could not save subscription.");
            }
          })
          .catch(function (err) {
            setNote((err && err.message) || "Permission denied or blocked.");
          });
      });
    });
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

  function refreshMbSessionUser() {
    if (!getToken()) {
      mbSessionUserId = 0;
      return Promise.resolve(null);
    }
    return api("/api/public/auth/session")
      .then(function (res) {
        mbSessionUserId = res.user && res.user.id ? Number(res.user.id) : 0;
        if (res.token) {
          try {
            localStorage.setItem(TOKEN_KEY, res.token);
          } catch (_) {
            /* ignore */
          }
        }
        try {
          ensureProviderPushAutoLink();
        } catch (_) {
          /* ignore push auto-link failures */
        }
        return res;
      })
      .catch(function () {
        mbSessionUserId = 0;
        return null;
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
      if (o.persona === "citizen" && o.pwdHash === MB_CITIZEN_MARKER && o.salt === MB_CITIZEN_MARKER) {
        return o;
      }
      if (o.persona === "provider" && o.pwdHash === MB_VC_PROVIDER_MARKER) {
        return o;
      }
      if (!o.pwdHash || !o.salt) return null;
      return o;
    } catch (_) {
      return null;
    }
  }

  function isSellerSessionPayload(res) {
    var role = String((res && res.user && res.user.role) || "").toLowerCase();
    return role === "seller" || role === "service_provider";
  }

  function serviceRowMatchesLine(s, lineLower) {
    if (!lineLower) return true;
    var st = String((s && s.styleTheme) || "").trim().toLowerCase();
    var head = st.split("·")[0].trim();
    return head === lineLower || st.indexOf(lineLower) === 0;
  }

  function filterServicesForLine(services, line) {
    var needle = String(line || "").trim().toLowerCase();
    if (!needle) return Array.isArray(services) ? services.slice() : [];
    return (Array.isArray(services) ? services : []).filter(function (s) {
      return serviceRowMatchesLine(s, needle);
    });
  }

  function filterBookingsForLine(bookings, line, servicesForLine) {
    var needle = String(line || "").trim().toLowerCase();
    var idSet = {};
    (servicesForLine || []).forEach(function (s) {
      idSet[Number(s.id)] = true;
    });
    return (Array.isArray(bookings) ? bookings : []).filter(function (b) {
      if (idSet[Number(b.serviceId)]) return true;
      if (!needle) return true;
      return serviceRowMatchesLine({ styleTheme: b.styleTheme }, needle);
    });
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
    ["mbStepPersona", "mbStepService", "mbStepVcAuth", "mbStepUnlock"].forEach(function (id) {
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

  var mbProviderPushAutoAttempted = false;
  function ensureProviderPushAutoLink() {
    if (mbProviderPushAutoAttempted) return;
    var cfg = loadMbConfig();
    if (!cfg || String(cfg.persona || "") !== "provider") return;
    var token = getToken();
    if (!token) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    mbProviderPushAutoAttempted = true;
    fetch("/api/public/web-push/config")
      .then(function (r) {
        return r.json().catch(function () {
          return {};
        });
      })
      .then(function (j) {
        var publicKey = String((j && j.publicKey) || "").trim();
        if (!publicKey) return null;
        return navigator.serviceWorker.register("./service-worker.js?v=20260510lean15").then(function (reg) {
          return reg.pushManager.getSubscription().then(function (existing) {
            if (existing) return existing;
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
          });
        });
      })
      .then(function (sub) {
        if (!sub) return;
        var headers = { "Content-Type": "application/json", Authorization: "Bearer " + token };
        if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
          headers = window.VibeCartSessionDevice.merge(token, headers);
        }
        return fetch("/api/public/account/web-push/register", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ subscription: sub.toJSON() })
        });
      })
      .catch(function () {
        /* keep dashboard resilient if push subscription fails */
      });
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
    document.body.classList.remove("mb-mode-client", "mb-mode-provider", "mb-mode-citizen", "mb-citizen-seller-surface");
    if (persona === "provider") {
      document.body.classList.add("mb-mode-provider");
    } else if (persona === "citizen") {
      document.body.classList.add("mb-mode-citizen");
    } else {
      document.body.classList.add("mb-mode-client");
    }

    var discC = document.getElementById("mbDisclaimerClient");
    var discP = document.getElementById("mbDisclaimerProvider");
    if (discC) {
      discC.hidden = persona === "provider";
    }
    if (discP) {
      discP.hidden = persona === "client";
    }

    var pill = document.getElementById("mbSessionPill");
    if (pill) {
      var pillRole =
        persona === "provider" ? "Provider desk" : persona === "citizen" ? "Citizen desk" : "Client booking";
      pill.textContent = pillRole + " · " + service;
    }

    var tpl = document.getElementById("mbTopProviderTemplate");
    if (tpl) {
      tpl.setAttribute("href", "./service-provider-hub.html?service=" + encodeURIComponent(service));
      if (persona === "provider") {
        tpl.hidden = false;
      } else if (persona === "citizen") {
        tpl.hidden = true;
      } else {
        tpl.hidden = true;
      }
    }

    applyServiceSelects(service);

    var beautySec = document.getElementById("beauty-services");
    if (beautySec) {
      beautySec.hidden = persona === "client";
    }
    var beautyTitle = document.getElementById("mbBeautySectionTitle");
    var beautyLead = document.getElementById("mbBeautySectionLead");
    if ((persona === "provider" || persona === "citizen") && beautyTitle) {
      beautyTitle.textContent = "Slots · " + service;
    }
    if ((persona === "provider" || persona === "citizen") && beautyLead) {
      beautyLead.textContent =
        "Preview published times for " + service + ". Add a matching work card below if nothing appears for your dates.";
    }

    var provLine = document.getElementById("mbProviderSessionLine");
    if (provLine && (persona === "provider" || persona === "citizen")) {
      provLine.textContent =
        "Dashboard lists are filtered to " + service + ". Save payout settings once; publish work cards to go live.";
    }
    var portHead = document.getElementById("mbPortfolioHead");
    var portLead = document.getElementById("mbPortfolioLead");
    if ((persona === "provider" || persona === "citizen") && portHead) {
      portHead.textContent = "Service portfolio · " + service;
    }
    if ((persona === "provider" || persona === "citizen") && portLead) {
      portLead.textContent =
        "Create or edit offers tagged for this line. Use Pause / Relist on a card to control whether clients can book it.";
    }

    document.title =
      (persona === "provider" ? "Provider" : persona === "citizen" ? "Citizen" : "Client") +
      " · " +
      service +
      " · My Business · VibeCart";

    var pushRow = document.getElementById("mbWebPushRow");
    if (pushRow) {
      pushRow.hidden = !getToken();
    }

    var signHint = document.getElementById("mbClientSigninHint");
    if (signHint && persona === "citizen") {
      signHint.textContent =
        "Sign in to book, message providers, or publish offers. Buyer-only accounts still use the booking desk; seller tools appear when your account has the seller role.";
    } else if (signHint && persona === "client") {
      signHint.textContent =
        "Reservations require a signed-in VibeCart account so we can notify you, show your requests below, and unlock chat after acceptance.";
    }

    if (persona === "client") {
      clearProviderDeskPoll();
      disconnectMbProviderDeskWs();
      initClientServiceDesk(service);
    } else if (persona === "citizen") {
      initClientServiceDesk(service);
      refreshMbSessionUser()
        .then(function () {
          return api("/api/public/auth/session");
        })
        .then(function (res) {
          var tpl2 = document.getElementById("mbTopProviderTemplate");
          if (isSellerSessionPayload(res)) {
            document.body.classList.add("mb-citizen-seller-surface");
            if (tpl2) tpl2.hidden = false;
            connectMbProviderDeskWs();
          } else {
            document.body.classList.remove("mb-citizen-seller-surface");
            if (tpl2) tpl2.hidden = true;
            disconnectMbProviderDeskWs();
            clearProviderDeskPoll();
          }
        })
        .catch(function () {
          document.body.classList.remove("mb-citizen-seller-surface");
          var tpl2 = document.getElementById("mbTopProviderTemplate");
          if (tpl2) tpl2.hidden = true;
          disconnectMbProviderDeskWs();
          clearProviderDeskPoll();
        });
    } else {
      clearClientPoll();
      disconnectMbClientChatWs();
      clientActiveBookingId = 0;
      connectMbProviderDeskWs();
    }
  }

  function checkMbBookingPaidFromUrl() {
    try {
      var u = new URL(location.href);
      var paidId = u.searchParams.get("booking_paid");
      var cancelled = u.searchParams.get("booking_pay_cancel");
      if (paidId) {
        u.searchParams.delete("booking_paid");
        u.searchParams.delete("session_id");
        setStatus("Payment recorded for booking #" + paidId + ". Thank you.");
        try {
          sessionStorage.setItem("vibecart-mb-last-booking", String(paidId));
        } catch (_) {
          /* ignore */
        }
      }
      if (cancelled) {
        u.searchParams.delete("booking_pay_cancel");
        setStatus("Checkout cancelled — you can try again when ready.");
      }
      if (paidId || cancelled) {
        var qs = u.searchParams.toString();
        history.replaceState({}, "", u.pathname + (qs ? "?" + qs : "") + u.hash);
      }
    } catch (_) {
      /* ignore */
    }
  }

  function parseProviderBookingIdFromUrl() {
    try {
      var u = new URL(location.href);
      var fromSearch = Number(u.searchParams.get("mbBookingId") || u.searchParams.get("bookingId") || 0);
      if (fromSearch > 0) return fromSearch;
      var rawHash = String(u.hash || "");
      var qIndex = rawHash.indexOf("?");
      if (qIndex >= 0) {
        var qs = rawHash.slice(qIndex + 1);
        var hp = new URLSearchParams(qs);
        var fromHash = Number(hp.get("mbBookingId") || hp.get("bookingId") || 0);
        if (fromHash > 0) return fromHash;
      }
    } catch (_) {
      /* ignore */
    }
    return 0;
  }

  function openProviderBookingFromDeepLinkIfAny(cfg) {
    if (!cfg || !isProviderDeskConfig(cfg)) return;
    if (providerFocusBookingId > 0) return;
    if (pendingProviderDeepLinkBookingId > 0) {
      loadProviderFocus(pendingProviderDeepLinkBookingId);
      setStatus("Opened booking #" + pendingProviderDeepLinkBookingId + " from notification.");
      pendingProviderDeepLinkBookingId = 0;
    }
  }

  function revealMainAndLoad(cfg) {
    checkMbBookingPaidFromUrl();
    pendingProviderDeepLinkBookingId = parseProviderBookingIdFromUrl();
    hideGate();
    document.body.classList.remove("mb-boot-pending");
    var mainEl = document.getElementById("mbMainDashboard");
    if (mainEl) mainEl.removeAttribute("aria-hidden");
    applyDashboard(cfg);
    scrollToBeautyHashIfAllowed(cfg);
    refreshMbSessionUser()
      .then(function () {
        return loadAll();
      })
      .then(function () {
        openProviderBookingFromDeepLinkIfAny(cfg);
      });
  }

  function scrollToBeautyHashIfAllowed(cfg) {
    var raw = String(location.hash || "").replace(/\/$/, "");
    if (raw !== "#beauty-services" && raw !== "#mb-client-service-desk") return;
    if (cfg && !isClientLikePersona(cfg.persona)) return;
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
    clearProviderDeskPoll();
    disconnectMbProviderDeskWs();
    disconnectMbClientChatWs();
    clientWizardStep = 0;
    clientSelectedSlot = "";
    clientActiveBookingId = 0;
    var prevCfg = loadMbConfig();
    var prevPersona = prevCfg && prevCfg.persona ? String(prevCfg.persona) : "client";
    clearMbConfig();
    clearSessionUnlock();
    draftPersona =
      prevPersona === "provider" ? "provider" : prevPersona === "citizen" ? "citizen" : "client";
    draftService = "";
    document.body.classList.add("mb-boot-pending");
    var main = document.getElementById("mbMainDashboard");
    if (main) main.setAttribute("aria-hidden", "true");
    showGate();
    showServiceStep();
  }

  function initClientServiceDesk(service) {
    disconnectMbClientChatWs();
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
    var payWrap = document.getElementById("mbClientPayWrap");
    if (payWrap) payWrap.hidden = true;
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
    if (!cfg || !isClientLikePersona(cfg.persona)) {
      setStatus("Open the client desk from the gate to refresh your bookings.");
      return Promise.resolve();
    }
    if (!isSessionUnlocked(cfg.persona, cfg.service)) {
      setStatus("Unlock this service desk first, then tap Refresh list again.");
      return Promise.resolve();
    }
    return Promise.all([
      loadDiscoverForClientLine(cfg.service).catch(function () {
        return [];
      }),
      api("/api/public/bakery/bookings/as-buyer?_=" + String(Date.now())).catch(function () {
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
            connectMbClientChatWs(lb);
            maybeShowClientPayRow(res.booking || {});
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
      mbDiscoverServiceById = {};
      list.forEach(function (s) {
        if (s && s.id) mbDiscoverServiceById[Number(s.id)] = s;
      });
      var pick = document.getElementById("mbCliProviderSelect");
      if (pick) {
        pick.innerHTML =
          '<option value="">' +
          (list.length ? "Choose a provider service" : "No provider services yet — ask provider to publish slots") +
          "</option>" +
          list
            .map(function (s) {
              return (
                '<option value="' +
                Number(s.id) +
                '">' +
                escapeHtml(s.businessName + " · " + s.workTitle) +
                "</option>"
              );
            })
            .join("");
        try {
          var qs = new URLSearchParams(window.location.search || "");
          var preferredId = Number(qs.get("providerServiceId") || 0);
          if (preferredId && list.some(function (s) { return Number(s.id) === preferredId; })) {
            pick.value = String(preferredId);
          }
        } catch (_) {
          /* ignore */
        }
      }
      updateMbCliProviderPreview();
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
      loadClientSlotsForCurrentStep();
    }
  }

  function buildClientSlotButtonsFromArray(times) {
    var root = document.getElementById("mbCliSlots");
    if (!root) return;
    var list = Array.isArray(times) ? times.filter(Boolean) : [];
    if (!list.length) {
      root.innerHTML =
        '<p class="note" data-mb-no-slots>No published times for this day yet. Pick another date or ask your provider to publish slots for this offer.</p>';
      clientSelectedSlot = "";
      return;
    }
    root.innerHTML = list
      .map(function (t) {
        return '<button type="button" class="btn btn-secondary vc-mb-slot-btn" data-mb-slot="' + escapeHtml(t) + '">' + escapeHtml(t) + "</button>";
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

  function loadClientSlotsForCurrentStep() {
    var root = document.getElementById("mbCliSlots");
    var sid = Number((document.getElementById("mbCliProviderSelect") && document.getElementById("mbCliProviderSelect").value) || 0);
    var date = String((document.getElementById("mbCliDate") && document.getElementById("mbCliDate").value) || "").trim();
    if (!root) return;
    if (!sid || !date) {
      root.innerHTML = '<p class="note">Select a provider and date to load published times.</p>';
      clientSelectedSlot = "";
      return;
    }
    root.innerHTML = '<p class="note">Loading published times…</p>';
    api(
      "/api/public/bakery/schedule/slots?serviceId=" +
        encodeURIComponent(String(sid)) +
        "&date=" +
        encodeURIComponent(date) +
        "&_=" +
        String(Date.now())
    )
      .then(function (res) {
        var slots = Array.isArray(res.slots) ? res.slots : [];
        buildClientSlotButtonsFromArray(slots);
      })
      .catch(function () {
        root.innerHTML = '<p class="note">Could not load times. Try again or pick another date.</p>';
        clientSelectedSlot = "";
      });
  }

  function disconnectMbClientChatWs() {
    if (mbClientChatWs) {
      try {
        mbClientChatWs.close();
      } catch (_) {
        /* ignore */
      }
      mbClientChatWs = null;
    }
  }

  function disconnectMbProvChatWs() {
    if (mbProvChatWs) {
      try {
        mbProvChatWs.close();
      } catch (_) {
        /* ignore */
      }
      mbProvChatWs = null;
    }
  }

  function clearProviderDeskPoll() {
    if (providerDeskPollTimer) {
      clearInterval(providerDeskPollTimer);
      providerDeskPollTimer = null;
    }
  }

  function disconnectMbProviderDeskWs() {
    if (mbProviderDeskWs) {
      try {
        mbProviderDeskWs.close();
      } catch (_) {
        /* ignore */
      }
      mbProviderDeskWs = null;
    }
  }

  function startProviderDeskPollFallback() {
    clearProviderDeskPoll();
    mbLastPendingBookingCount = -1;
    providerDeskPollTimer = window.setInterval(function () {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      if (!getToken()) return;
      var cfg = loadMbConfig();
      if (!cfg || !isProviderDeskConfig(cfg) || !isSessionUnlocked(cfg.persona, cfg.service)) return;
      api("/api/public/bakery/bookings/mine")
        .then(function (res) {
          var bookings = Array.isArray(res.bookings) ? res.bookings : [];
          var pending = bookings.filter(function (b) {
            return String(b.bookingStatus || "").toLowerCase() === "pending";
          }).length;
          if (mbLastPendingBookingCount >= 0 && pending > mbLastPendingBookingCount) {
            setStatus("New booking request — refreshing.");
            loadAll();
          }
          mbLastPendingBookingCount = pending;
        })
        .catch(function () {});
    }, 22000);
  }

  function connectMbProviderDeskWs() {
    disconnectMbProviderDeskWs();
    clearProviderDeskPoll();
    if (!getToken()) return;
    var cfg = loadMbConfig();
    if (!cfg || !isProviderDeskConfig(cfg) || !isSessionUnlocked(cfg.persona, cfg.service)) return;
    var proto = location.protocol === "https:" ? "wss" : "ws";
    var url = proto + "://" + location.host + "/ws/bakery-provider-desk?token=" + encodeURIComponent(getToken());
    var ws;
    try {
      ws = new WebSocket(url);
    } catch (_) {
      startProviderDeskPollFallback();
      return;
    }
    mbProviderDeskWs = ws;
    ws.onopen = function () {
      clearProviderDeskPoll();
      mbLastPendingBookingCount = -1;
    };
    ws.onmessage = function (ev) {
      try {
        var d = JSON.parse(String(ev.data || "{}"));
        if (d && d.type === "bakery_provider_desk" && d.reason === "booking_new") {
          var tPref = d.preferredTime ? " · " + String(d.preferredTime) : "";
          setStatus("New booking request" + tPref + " — refreshing.");
          loadAll();
          try {
            if (typeof Notification !== "undefined" && document.hidden && Notification.permission === "granted") {
              new Notification("VibeCart", {
                body: "New booking request" + (d.preferredTime ? " at " + String(d.preferredTime) : "") + "."
              });
            }
          } catch (_) {
            /* ignore */
          }
        }
      } catch (_) {
        /* ignore */
      }
    };
    ws.onclose = function () {
      mbProviderDeskWs = null;
      startProviderDeskPollFallback();
    };
    ws.onerror = function () {
      try {
        ws.close();
      } catch (_) {
        /* ignore */
      }
    };
  }

  function connectMbClientChatWs(bookingId) {
    disconnectMbClientChatWs();
    var token = getToken();
    var bid = Number(bookingId || 0);
    if (!token || !bid) return;
    var proto = location.protocol === "https:" ? "wss" : "ws";
    var url =
      proto +
      "://" +
      location.host +
      "/ws/bakery-booking-chat?token=" +
      encodeURIComponent(token) +
      "&bookingId=" +
      encodeURIComponent(String(bid));
    try {
      mbClientChatWs = new WebSocket(url);
      mbClientChatWs.onmessage = function (ev) {
        try {
          var msg = JSON.parse(String(ev.data || "{}"));
          if (msg.type === "bakery_chat_refresh" && Number(msg.bookingId) === Number(clientActiveBookingId)) {
            loadClientChatMessages();
            api("/api/public/bakery/bookings/detail?bookingId=" + encodeURIComponent(String(clientActiveBookingId)))
              .then(function (res) {
                maybeShowClientPayRow(res.booking || {});
              })
              .catch(function () {});
          }
        } catch (_) {
          /* ignore */
        }
      };
      mbClientChatWs.onerror = function () {
        /* ignore */
      };
    } catch (_) {
      mbClientChatWs = null;
    }
  }

  function connectMbProvChatWs(bookingId) {
    disconnectMbProvChatWs();
    var token = getToken();
    var bid = Number(bookingId || 0);
    if (!token || !bid) return;
    var proto = location.protocol === "https:" ? "wss" : "ws";
    var url =
      proto +
      "://" +
      location.host +
      "/ws/bakery-booking-chat?token=" +
      encodeURIComponent(token) +
      "&bookingId=" +
      encodeURIComponent(String(bid));
    try {
      mbProvChatWs = new WebSocket(url);
      mbProvChatWs.onmessage = function (ev) {
        try {
          var msg = JSON.parse(String(ev.data || "{}"));
          if (msg.type === "bakery_chat_refresh" && Number(msg.bookingId) === Number(providerFocusBookingId)) {
            loadProvFocusMessages();
          }
        } catch (_) {
          /* ignore */
        }
      };
      mbProvChatWs.onerror = function () {
        /* ignore */
      };
    } catch (_) {
      mbProvChatWs = null;
    }
  }

  function maybeShowClientPayRow(booking) {
    var wrap = document.getElementById("mbClientPayWrap");
    if (!wrap || !booking) return;
    var st = String(booking.bookingStatus || "").toLowerCase();
    var paid = String(booking.stripePaymentStatus || "").toLowerCase() === "paid";
    if (st !== "confirmed" || paid) {
      wrap.hidden = true;
      return;
    }
    api("/api/public/payments/config")
      .then(function (cfg) {
        if (!cfg || !cfg.stripePublishableKey) {
          wrap.hidden = true;
          return;
        }
        wrap.hidden = false;
      })
      .catch(function () {
        wrap.hidden = true;
      });
  }

  function startBookingStripeCheckout(payMode) {
    if (!clientActiveBookingId) return;
    api("/api/public/bakery/bookings/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: clientActiveBookingId, payMode: payMode || "deposit" })
    })
      .then(function (res) {
        if (res.url) {
          window.location.href = res.url;
        }
      })
      .catch(function (err) {
        setStatus(err.message || "Could not start checkout");
      });
  }

  function getClientPaymentPref() {
    var r = document.querySelector('input[name="mbCliPay"]:checked');
    return r ? String(r.value || "pay_full") : "pay_full";
  }

  function submitClientReservation() {
    try {
      document.body.classList.remove("mb-boot-pending");
      hideGate();
    } catch (_) {
      /* ignore */
    }
    setStatus("Send clicked. Validating...");
    if (!getToken()) {
      setStatus("Sign in with your VibeCart account (Account / passport) to send a reservation.");
      return Promise.resolve();
    }
    var cfg = loadMbConfig();
    var sid = Number(document.getElementById("mbCliProviderSelect") && document.getElementById("mbCliProviderSelect").value);
    var name = String(document.getElementById("mbCliCustName") && document.getElementById("mbCliCustName").value || "").trim();
    var phone = String(document.getElementById("mbCliCustPhone") && document.getElementById("mbCliCustPhone").value || "").trim();
    var date = String(document.getElementById("mbCliDate") && document.getElementById("mbCliDate").value || "").trim();
    var details = String(document.getElementById("mbCliDetails") && document.getElementById("mbCliDetails").value || "").trim();
    var slotPref = syncClientSelectedSlotFromDom();
    if (!sid) {
      setStatus("Choose a provider service.");
      return Promise.resolve();
    }
    if (name.length < 2) {
      setStatus("Add your name.");
      return Promise.resolve();
    }
    if (!date) {
      setStatus("Pick a preferred date.");
      return Promise.resolve();
    }
    if (!slotPref) {
      slotPref = "flexible";
    }
    if (details.length < 8) {
      setStatus("Add a short description of what you need (8+ characters).");
      return Promise.resolve();
    }
    var pay = getClientPaymentPref();
    var line = cfg && cfg.service ? String(cfg.service) : "";
    var occasion = "Payment: " + pay + " · Time preference: " + slotPref;
    var body = {
      serviceId: sid,
      customerName: name,
      customerPhone: phone,
      eventDate: date,
      preferredSlot: slotPref,
      occasionType: occasion,
      styleTheme: line,
      budgetAmount: 0,
      requestDetails: details,
      paymentPreference: pay,
      serviceLine: line
    };
    setStatus("Validated. Checking session...");
    return refreshMbSessionUser().then(function () {
      if (!mbSessionUserId) {
        setStatus("Sign in with your VibeCart account to send a reservation.");
        return;
      }
      setStatus("Session OK. Posting reservation...");
      return api(
        "/api/public/bakery/schedule/slots?serviceId=" +
          encodeURIComponent(String(sid)) +
          "&date=" +
          encodeURIComponent(date) +
          "&_=" +
          String(Date.now())
      )
        .then(function (slotRes) {
          var live = Array.isArray(slotRes && slotRes.slots) ? slotRes.slots : [];
          if (slotPref !== "flexible" && live.indexOf(slotPref) < 0) {
            throw new Error("That time is no longer available. Pick another slot and try again.");
          }
          return api("/api/public/bakery/bookings/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
        });
    })
      .then(function (res) {
        if (!res || !res.bookingId) {
          setStatus("Could not send: no booking confirmation from the server. Try again.");
          return;
        }
        clientActiveBookingId = Number(res.bookingId || 0);
        try {
          sessionStorage.setItem("vibecart-mb-last-booking", String(clientActiveBookingId));
        } catch (_) {
          /* ignore */
        }
        var wait = document.getElementById("mbClientWaitBanner");
        if (wait) {
          var pushHint =
            res && res.providerPush === "no_device_tokens"
              ? " Provider phone alerts are not enabled yet, but the request is visible on the provider desk now."
              : "";
          wait.hidden = false;
          wait.textContent =
            "Request sent. Waiting for your provider to accept — we will notify you here and by push when they respond." +
            pushHint;
        }
        setStatus("Reservation sent.");
        startClientBookingPoll();
        loadClientDashboard().catch(function () {});
      })
      .catch(function (err) {
        setStatus("Could not send: " + err.message);
      });
  }

  function startClientBookingPoll() {
    clearClientPoll();
    if (!clientActiveBookingId) return;
    clientPollTimer = window.setInterval(function () {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      api("/api/public/bakery/bookings/detail?bookingId=" + encodeURIComponent(String(clientActiveBookingId)))
        .then(function (res) {
          var st = String((res.booking && res.booking.bookingStatus) || "");
          var hint = document.getElementById("mbClientChatHint");
          var panel = document.getElementById("mbClientChatPanel");
          if (st === "confirmed" && panel) {
            panel.hidden = false;
            if (hint) hint.textContent = "Your provider accepted — messages below are private to this booking.";
            loadClientChatMessages();
            connectMbClientChatWs(clientActiveBookingId);
            maybeShowClientPayRow(res.booking || {});
            clearClientPoll();
            if (clientWizardStep === 1) {
              loadClientSlotsForCurrentStep();
            }
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
            var who = escapeHtml(m.senderLabel || "Participant");
            return '<p class="note vc-mb-chat-line"><strong>' + who + "</strong> · " + escapeHtml(m.body) + "</p>";
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
      echo.textContent =
        draftPersona === "provider"
          ? "Service provider"
          : draftPersona === "citizen"
          ? "Citizen"
          : "Client";
    }
    var svcLab = document.getElementById("mbStepServiceLabel");
    if (svcLab) {
      svcLab.textContent = "Step 2 of 2";
    }
    buildServiceGrid();
    setGateStatus("mbGateStatusService", "", false);
  }

  function showVcAuthStep() {
    hideAllSteps();
    var s = document.getElementById("mbStepVcAuth");
    if (s) s.hidden = false;
    var a = document.getElementById("mbVcOpenAccount");
    if (a) {
      try {
        a.setAttribute("href", "./lane-passport.html?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
      } catch (_) {
        a.setAttribute("href", "./lane-passport.html");
      }
    }
    setGateStatus("mbGateStatusVc", "", false);
  }

  function showUnlockStep(cfg) {
    hideAllSteps();
    var s = document.getElementById("mbStepUnlock");
    if (s) s.hidden = false;
    var echo = document.getElementById("mbUnlockEcho");
    var clientNoPwd = cfg && cfg.persona === "client" && cfg.pwdHash === "__none__";
    var citizenNoPwd = cfg && cfg.persona === "citizen" && cfg.pwdHash === MB_CITIZEN_MARKER;
    var vcProvider = cfg && cfg.persona === "provider" && cfg.pwdHash === MB_VC_PROVIDER_MARKER;
    var skipPwdUnlock = !!clientNoPwd || !!citizenNoPwd;
    if (echo) {
      if (clientNoPwd) {
        echo.textContent = getToken()
          ? "You're signed in — tap Continue once to open your client desk for " + cfg.service + "."
          : "Continue to your client booking tools for " + cfg.service + ".";
      } else if (citizenNoPwd) {
        echo.textContent = getToken()
          ? "You're signed in — tap Continue once to open your citizen desk for " + cfg.service + "."
          : "Continue to browse, book, or manage offers for " + cfg.service + ".";
      } else if (vcProvider) {
        echo.textContent = getToken()
          ? "You're signed in — tap Continue to confirm your seller account for " + cfg.service + "."
          : "Provider desk · " + cfg.service + " · confirm your signed-in seller account.";
      } else {
        echo.textContent =
          "Enter the password for your " +
          (cfg.persona === "provider" ? "provider" : cfg.persona === "citizen" ? "citizen" : "client") +
          " dashboard · " +
          cfg.service +
          ".";
      }
    }
    var inp = document.getElementById("mbUnlockPw");
    if (inp) inp.value = "";
    var pwRow = document.getElementById("mbUnlockPwRow");
    var unlockSubmit = document.getElementById("mbUnlockSubmit");
    if (pwRow) pwRow.hidden = !!skipPwdUnlock;
    if (unlockSubmit) unlockSubmit.hidden = false;
    if (unlockSubmit) {
      unlockSubmit.textContent = vcProvider ? "Unlock provider dashboard" : "Enter dashboard";
    }
    setGateStatus("mbGateStatusUnlock", "", false);
  }

  function tryAutoUnlockForReturningUser(cfg) {
    if (!cfg || !getToken()) return Promise.resolve(false);
    return refreshMbSessionUser()
      .then(function () {
        return api("/api/public/auth/session");
      })
      .then(function (res) {
        if (!res || !res.user) return false;
        if (cfg.persona === "client" && cfg.pwdHash === "__none__") {
          setSessionUnlocked(cfg.persona, cfg.service);
          return true;
        }
        if (cfg.persona === "citizen" && cfg.pwdHash === MB_CITIZEN_MARKER) {
          setSessionUnlocked(cfg.persona, cfg.service);
          return true;
        }
        if (cfg.persona === "provider") {
          return false;
        }
        return false;
      })
      .catch(function () {
        return false;
      });
  }

  function bootGate() {
    var cfg = loadMbConfig();
    if (cfg && cfg.persona === "provider") {
      clearSessionUnlock();
    }

    var qs = null;
    var flow = "";
    var forcedLine = "";
    try {
      qs = new URLSearchParams(window.location.search || "");
      flow = String(qs.get("flow") || "").trim().toLowerCase();
      forcedLine = String(qs.get("line") || qs.get("service") || "").trim();
    } catch (e) {
      flow = "";
      forcedLine = "";
    }

    /* "I want to book" must never drop into provider unlock.
       Open client booking flow with service-line chooser directly. */
    if (flow === "book") {
      var cfgBook = {
        persona: "client",
        service: forcedLine || "Hair Styling",
        pwdHash: "__none__",
        salt: ""
      };
      saveMbConfig(cfgBook);
      setSessionUnlocked(cfgBook.persona, cfgBook.service);
      document.body.classList.remove("mb-boot-pending");
      hideGate();
      applyDashboard(cfgBook);
      refreshMbSessionUser().then(function () {
        loadAll();
      });
      return;
    }

    /* Opening "My Business" should start from role selection,
       not a leftover password prompt from previous sessions. */
    if (!flow) {
      clearSessionUnlock();
      document.body.classList.add("mb-boot-pending");
      showGate();
      draftPersona = "";
      draftService = "";
      showPersonaStep();
      return;
    }

    if (cfg && isSessionUnlocked(cfg.persona, cfg.service)) {
      document.body.classList.remove("mb-boot-pending");
      hideGate();
      applyDashboard(cfg);
      refreshMbSessionUser().then(function () {
        loadAll();
      });
      requestAnimationFrame(function () { scrollToBeautyHashIfAllowed(cfg); });
      return;
    }

    if (cfg && getToken()) {
      tryAutoUnlockForReturningUser(cfg).then(function (ok) {
        if (ok) {
          document.body.classList.remove("mb-boot-pending");
          hideGate();
          applyDashboard(cfg);
          refreshMbSessionUser().then(function () {
            loadAll();
          });
          requestAnimationFrame(function () { scrollToBeautyHashIfAllowed(cfg); });
          return;
        }
        document.body.classList.add("mb-boot-pending");
        showGate();
        showUnlockStep(cfg);
      });
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

  function stripLegacyPublishedSlotsSection() {
    return;
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
    document.getElementById("mbPickCitizen") &&
      document.getElementById("mbPickCitizen").addEventListener("click", function () {
        draftPersona = "citizen";
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
        if (draftPersona === "citizen") {
          var cfgCit = {
            persona: "citizen",
            service: draftService,
            pwdHash: MB_CITIZEN_MARKER,
            salt: MB_CITIZEN_MARKER
          };
          saveMbConfig(cfgCit);
          setSessionUnlocked(cfgCit.persona, cfgCit.service);
          revealMainAndLoad(cfgCit);
          return;
        }
        showVcAuthStep();
      });
    document.getElementById("mbBackFromVcAuth") &&
      document.getElementById("mbBackFromVcAuth").addEventListener("click", function () {
        showServiceStep();
      });

    document.getElementById("mbVcContinueSignedIn") &&
      document.getElementById("mbVcContinueSignedIn").addEventListener("click", function () {
        if (gateBusy) return;
        gateBusy = true;
        setGateStatus("mbGateStatusVc", "Checking your account…", false);
        refreshMbSessionUser()
          .then(function () {
            return api("/api/public/auth/session");
          })
          .then(function (res) {
            gateBusy = false;
            if (!getToken()) {
              setGateStatus("mbGateStatusVc", "Sign in first (Create or sign in), then tap Continue again.", false);
              return;
            }
            if (!isSellerSessionPayload(res)) {
              setGateStatus(
                "mbGateStatusVc",
                "This desk needs a seller account. Register or sign in as seller / service provider, not buyer-only.",
                false
              );
              return;
            }
            var cfg = {
              persona: "provider",
              service: draftService,
              pwdHash: MB_VC_PROVIDER_MARKER,
              salt: MB_VC_PROVIDER_MARKER
            };
            saveMbConfig(cfg);
            clearSessionUnlock();
            setGateStatus("mbGateStatusVc", "Set dashboard password to continue…", true);
            showUnlockStep(cfg);
          })
          .catch(function () {
            gateBusy = false;
            setGateStatus("mbGateStatusVc", "Could not verify session. Sign in from Account, then try again.", false);
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
        if (cfg.persona === "client" && cfg.pwdHash === "__none__") {
          setSessionUnlocked(cfg.persona, cfg.service);
          revealMainAndLoad(cfg);
          return;
        }
        if (cfg.persona === "citizen" && cfg.pwdHash === MB_CITIZEN_MARKER) {
          setSessionUnlocked(cfg.persona, cfg.service);
          setGateStatus("mbGateStatusUnlock", "Welcome back.", true);
          revealMainAndLoad(cfg);
          return;
        }
        if (cfg.persona === "provider" && cfg.pwdHash === MB_VC_PROVIDER_MARKER) {
          var providerPwInput = document.getElementById("mbUnlockPw");
          var providerPw = providerPwInput ? String(providerPwInput.value || "").trim() : "";
          if (!providerPw) {
            setGateStatus("mbGateStatusUnlock", "Enter your provider dashboard password to continue.", false);
            return;
          }
          gateBusy = true;
          setGateStatus("mbGateStatusUnlock", "Checking your account…", false);
          refreshMbSessionUser()
            .then(function () {
              return api("/api/public/auth/session");
            })
            .then(function (res) {
              gateBusy = false;
              if (!getToken()) {
                setGateStatus("mbGateStatusUnlock", "Sign in with your seller account, then continue.", false);
                return;
              }
              if (!isSellerSessionPayload(res)) {
                setGateStatus("mbGateStatusUnlock", "Seller role required for this desk.", false);
                return;
              }
              var newSalt = cfg.salt === MB_VC_PROVIDER_MARKER ? String(Date.now()) : String(cfg.salt || Date.now());
              return hashPassword(providerPw, newSalt)
                .then(function (hex) {
                  saveMbConfig({
                    persona: "provider",
                    service: cfg.service,
                    pwdHash: hex,
                    salt: newSalt
                  });
                  setSessionUnlocked(cfg.persona, cfg.service);
                  setGateStatus("mbGateStatusUnlock", "Welcome back.", true);
                  revealMainAndLoad(loadMbConfig() || cfg);
                });
            })
            .catch(function () {
              gateBusy = false;
              setGateStatus("mbGateStatusUnlock", "Session check failed. Sign in again.", false);
            });
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
    disconnectMbProvChatWs();
    providerFocusBookingId = 0;
    var el = document.getElementById("mbProvFocusRoot");
    if (el) {
      el.setAttribute("hidden", "hidden");
      el.setAttribute("data-booking-id", "");
    }
  }

  function fillProviderFocusFromBooking(b) {
    var st = String(b.bookingStatus || "").toLowerCase();
    var prefTime = String(b.preferredTime || b.requestedStartTime || "").trim();
    if (!prefTime && b.occasionType) {
      var pm = String(b.occasionType).match(/Time preference:\s*(\d{1,2}:\d{2})/i);
      if (pm) prefTime = pm[1];
    }
    var title = document.getElementById("mbProvFocusTitle");
    if (title) title.textContent = "#" + Number(b.id || 0) + " · " + (b.customerName || "Customer");
    var sum = document.getElementById("mbProvFocusSummary");
    if (sum) {
      sum.textContent = [b.businessName, b.workTitle, b.eventDate, prefTime ? "Time " + prefTime : "", st]
        .filter(Boolean)
        .join(" · ");
    }
    var closedBanner = document.getElementById("mbProvFocusClosedBanner");
    if (closedBanner) {
      if (st === "declined") {
        closedBanner.hidden = false;
        closedBanner.textContent = "This request was declined — no further status changes.";
      } else if (st === "completed") {
        closedBanner.hidden = false;
        closedBanner.textContent = "This booking is complete — read-only.";
      } else {
        closedBanner.hidden = true;
        closedBanner.textContent = "";
      }
    }
    var det = document.getElementById("mbProvFocusDetails");
    if (det) {
      var parts = [];
      if (prefTime) {
        parts.push("<p><strong>Client time</strong> · " + escapeHtml(prefTime) + "</p>");
      }
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
        connectMbProvChatWs(b.id);
      } else {
        disconnectMbProvChatWs();
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
            var who = escapeHtml(m.senderLabel || "Participant");
            return '<p class="note vc-mb-chat-line"><strong>' + who + "</strong> · " + escapeHtml(m.body) + "</p>";
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
            setStatus("Choose a provider service.");
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
          if (!syncClientSelectedSlotFromDom()) {
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
      sub.addEventListener("click", function (ev) {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        submitClientReservation();
      }, true);
      sub.addEventListener("touchend", function (ev) {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        submitClientReservation();
      }, { capture: true, passive: false });
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
    var cliDate = document.getElementById("mbCliDate");
    if (cliDate) {
      cliDate.addEventListener("change", function () {
        if (clientWizardStep === 1) {
          loadClientSlotsForCurrentStep();
        }
      });
    }
    var cliPick = document.getElementById("mbCliProviderSelect");
    if (cliPick) {
      cliPick.addEventListener("change", function () {
        if (clientWizardStep === 1) {
          loadClientSlotsForCurrentStep();
        }
      });
    }
    var payDep = document.getElementById("mbClientPayDeposit");
    if (payDep) {
      payDep.addEventListener("click", function () {
        startBookingStripeCheckout("deposit");
      });
    }
    var payFull = document.getElementById("mbClientPayFull");
    if (payFull) {
      payFull.addEventListener("click", function () {
        startBookingStripeCheckout("full");
      });
    }
    bindMbClientImageLightboxEvents();
    var cliPick = document.getElementById("mbCliProviderSelect");
    if (cliPick) {
      cliPick.addEventListener("change", function () {
        updateMbCliProviderPreview();
      });
    }
    var provPick = document.getElementById("mbProvSlotService");
    if (provPick) {
      provPick.addEventListener("change", function () {
        var hid = document.getElementById("bakeryEditServiceId");
        if (hid) hid.value = String(provPick.value || "");
        loadProvScheduleSlotsFromServer();
      });
    }
    var provDate = document.getElementById("mbProvSlotDate");
    if (provDate) {
      provDate.addEventListener("change", function () {
        loadProvScheduleSlotsFromServer();
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

  function isAllowedPublicMediaUrl(u) {
    var s = String(u || "").trim();
    if (!s) return false;
    if (/^https?:\/\//i.test(s)) return true;
    return /^\/api\/public\/bakery-media\/[a-f0-9]{32}$/i.test(s);
  }

  function uploadBakeryMediaFile(file) {
    var token = getToken();
    if (!token) return Promise.reject(new Error("Sign in to upload media."));
    var headers = { "Content-Type": file.type || "application/octet-stream" };
    headers =
      window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(token, headers)
        : Object.assign({}, headers, { Authorization: "Bearer " + token });
    return fetch("/api/public/bakery/services/media/upload", { method: "POST", headers: headers, body: file }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || j.ok === false) {
          throw new Error(String((j && (j.message || j.code)) || "HTTP_" + r.status));
        }
        return j;
      });
    });
  }

  function refreshMbWorkGalleryUi() {
    var root = document.getElementById("bakeryGalleryEditor");
    if (!root) return;
    if (!mbWorkGallery.length) {
      root.innerHTML = '<p class="note" style="margin:0">No gallery items yet — upload or add a link.</p>';
      return;
    }
    root.innerHTML = mbWorkGallery
      .map(function (item, idx) {
        var u = escapeHtml(item.url);
        var k = String(item.kind || "image") === "video" ? "video" : "image";
        var inner =
          k === "video"
            ? '<video src="' + u + '" muted playsinline controls preload="metadata"></video>'
            : '<img src="' + u + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />';
        return (
          '<div class="vc-mb-gallery-tile">' +
          inner +
          '<button type="button" class="btn btn-secondary vc-mb-gallery-remove" data-mb-gallery-remove="' +
          idx +
          '">Remove</button></div>'
        );
      })
      .join("");
  }

  function clearMbWorkForm() {
    var hid = document.getElementById("bakeryEditServiceId");
    if (hid) hid.value = "0";
    [
      "bakeryBusinessName",
      "bakeryWorkTitle",
      "bakeryStyleTheme",
      "bakeryBasePrice",
      "bakeryCurrency",
      "bakeryImageUrl",
      "bakeryRequirements",
      "bakeryExternalMediaUrl"
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    var sdm = document.getElementById("bakerySlotDurationMinutes");
    if (sdm) sdm.value = "60";
    mbWorkGallery = [];
    refreshMbWorkGalleryUi();
    setStatus("Form cleared — add a new work card.");
  }

  function populateWorkCardFromService(s) {
    if (!s) return;
    var hid = document.getElementById("bakeryEditServiceId");
    if (hid) hid.value = String(Number(s.id) || 0);
    var bn = document.getElementById("bakeryBusinessName");
    if (bn) bn.value = s.businessName || "";
    var wt = document.getElementById("bakeryWorkTitle");
    if (wt) wt.value = s.workTitle || "";
    var th = document.getElementById("bakeryStyleTheme");
    if (th) {
      var st = String(s.styleTheme || "");
      var parts = st.split("·");
      th.value = parts.length > 1 ? parts.slice(1).join("·").trim() : "";
    }
    var bp = document.getElementById("bakeryBasePrice");
    if (bp) bp.value = s.basePrice != null ? String(s.basePrice) : "";
    var cur = document.getElementById("bakeryCurrency");
    if (cur) cur.value = s.currency || "USD";
    var img = document.getElementById("bakeryImageUrl");
    if (img) img.value = s.imageUrl || "";
    var req = document.getElementById("bakeryRequirements");
    if (req) req.value = s.requirementsText || "";
    var slotMin = document.getElementById("bakerySlotDurationMinutes");
    if (slotMin) {
      var dur = Number(s.slotDurationMinutes);
      slotMin.value = String(Number.isFinite(dur) && dur > 0 ? dur : 60);
    }
    mbWorkGallery = [];
    if (Array.isArray(s.gallery) && s.gallery.length) {
      s.gallery.forEach(function (g) {
        if (g && g.url && isAllowedPublicMediaUrl(g.url)) {
          mbWorkGallery.push({ kind: g.kind === "video" ? "video" : "image", url: String(g.url).trim() });
        }
      });
    } else if (s.imageUrl && isAllowedPublicMediaUrl(s.imageUrl)) {
      mbWorkGallery.push({ kind: "image", url: String(s.imageUrl).trim() });
    }
    refreshMbWorkGalleryUi();
    var cat = document.getElementById("bakeryServiceCategory");
    if (cat && s.styleTheme) {
      var head = String(s.styleTheme).split("·")[0].trim();
      var opts = Array.prototype.slice.call(cat.options || []);
      var i;
      for (i = 0; i < opts.length; i++) {
        if (String(opts[i].value).trim() === head) {
          cat.selectedIndex = i;
          break;
        }
      }
    }
    setStatus("Loaded work card into the form — adjust and save.");
    var sec = document.getElementById("mbPortfolioHead");
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderServiceCardMediaHtml(s) {
    var items = [];
    if (Array.isArray(s.gallery) && s.gallery.length) {
      items = s.gallery.slice(0, 8);
    } else if (s.imageUrl) {
      items = [{ kind: "image", url: s.imageUrl }];
    }
    if (!items.length) return "";
    return (
      '<div class="vc-mb-gallery-editor" style="margin-top:0.45rem">' +
      items
        .map(function (it) {
          if (!it || !it.url || !isAllowedPublicMediaUrl(it.url)) return "";
          var u = escapeHtml(String(it.url).trim());
          if (String(it.kind || "image") === "video") {
            return '<div class="vc-mb-gallery-tile"><video src="' + u + '" muted playsinline controls preload="metadata"></video></div>';
          }
          return '<div class="vc-mb-gallery-tile"><img src="' + u + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></div>';
        })
        .join("") +
      "</div>"
    );
  }

  function updateMbCliProviderPreview() {
    var pick = document.getElementById("mbCliProviderSelect");
    var root = document.getElementById("mbCliProviderMediaPreview");
    if (!root) return;
    // Requested: remove UI offers/preview block from provider offer area.
    root.innerHTML = "";
    root.hidden = false;
    root.hidden = true;
    if (pick) pick.setAttribute("data-offer-ui-hidden", "1");
  }

  function openMbClientImageLightbox(src) {
    var safeSrc = String(src || "").trim();
    if (!safeSrc) return;
    var dlg = document.getElementById("mbClientImageLightbox");
    var img = document.getElementById("mbClientImageLightboxImg");
    if (!dlg || !img) {
      try {
        window.open(safeSrc, "_blank", "noopener");
      } catch (_) {
        /* ignore */
      }
      return;
    }
    img.setAttribute("src", safeSrc);
    if (typeof dlg.showModal === "function") {
      try {
        if (!dlg.open) dlg.showModal();
        return;
      } catch (_) {
        /* fall through to new tab fallback */
      }
    }
    try {
      window.open(safeSrc, "_blank", "noopener");
    } catch (_) {
      /* ignore */
    }
  }

  function bindMbClientImageLightboxEvents() {
    var dlg = document.getElementById("mbClientImageLightbox");
    var closeBtn = document.getElementById("mbClientImageLightboxClose");
    if (!dlg) return;
    dlg.addEventListener("click", function (ev) {
      if (ev.target === dlg && typeof dlg.close === "function") dlg.close();
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        if (typeof dlg.close === "function") dlg.close();
      });
    }
  }

  function readBakeryForm() {
    var cfg = loadMbConfig() || {};
    var line = String(cfg.service || "Hair Styling").trim();
    var theme = String(document.getElementById("bakeryStyleTheme").value || "").trim();
    var styleTheme = theme ? line + " · " + theme : line;
    var editId = document.getElementById("bakeryEditServiceId");
    var durEl = document.getElementById("bakerySlotDurationMinutes");
    var rawDur = durEl ? Number(durEl.value) : 60;
    var workTitleEl = document.getElementById("bakeryWorkTitle");
    var workTitleRaw = workTitleEl ? String(workTitleEl.value || "").trim() : "";
    var workTitle = workTitleRaw || (theme ? theme : line);
    if (workTitleEl && !workTitleEl.value) {
      workTitleEl.value = workTitle;
    }
    return {
      serviceId: Number((editId && editId.value) || 0) || 0,
      businessName: document.getElementById("bakeryBusinessName").value,
      workTitle: workTitle,
      styleTheme: styleTheme,
      basePrice: Number(document.getElementById("bakeryBasePrice").value || 0),
      currency: document.getElementById("bakeryCurrency").value || "USD",
      imageUrl: document.getElementById("bakeryImageUrl").value,
      requirementsText: document.getElementById("bakeryRequirements").value,
      slotDurationMinutes: Number.isFinite(rawDur) ? rawDur : 60
    };
  }

  function renderProvSlotServiceSelect(services) {
    var sel = document.getElementById("mbProvSlotService");
    if (!sel) return;
    var list = Array.isArray(services) ? services : [];
    if (!list.length) {
      sel.innerHTML = '<option value="">Save a work card first</option>';
      return;
    }
    var prev = Number((sel && sel.value) || 0);
    var editId = Number((document.getElementById("bakeryEditServiceId") || {}).value || 0);
    var cfg = loadMbConfig() || {};
    var line = String(cfg.service || "").trim();
    var preferred = 0;
    var lineTitle = String(line || "Service").trim() + " Availability (Main Card)";
    var i;
    for (i = 0; i < list.length; i++) {
      var wt = String((list[i] && list[i].workTitle) || "").trim();
      if (wt === lineTitle) {
        preferred = Number(list[i].id) || 0;
        break;
      }
    }
    sel.innerHTML =
      '<option value="">Choose a saved work card…</option>' +
      list
        .map(function (s) {
          return (
            '<option value="' +
            Number(s.id) +
            '">' +
            escapeHtml(String(s.workTitle || "Offer") + " · " + String(s.businessName || "")) +
            "</option>"
          );
        })
        .join("");
    var ids = {};
    list.forEach(function (s) {
      ids[Number(s.id) || 0] = true;
    });
    var chosen = prev && ids[prev] ? prev : editId && ids[editId] ? editId : preferred && ids[preferred] ? preferred : Number(list[0].id) || 0;
    if (chosen) {
      sel.value = String(chosen);
      var hid = document.getElementById("bakeryEditServiceId");
      if (hid) hid.value = String(chosen);
    }
  }

  function pickServiceIdForProviderLine(services, line) {
    var needle = String(line || "").trim().toLowerCase();
    if (!needle || !Array.isArray(services)) return 0;
    var i;
    for (i = 0; i < services.length; i++) {
      var st = String(services[i].styleTheme || "").trim().toLowerCase();
      var head = st.split("·")[0].trim();
      if (head === needle || st.indexOf(needle) === 0) {
        return Number(services[i].id) || 0;
      }
    }
    return Number(services[0].id) || 0;
  }

  function normalizeHHMM(raw) {
    var m = String(raw || "")
      .trim()
      .match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return "";
    var h = Number(m[1]);
    var min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return "";
    var hs = h < 10 ? "0" + h : String(h);
    var ms = min < 10 ? "0" + min : String(min);
    return hs + ":" + ms;
  }

  function hhmmToMinutes(s) {
    var n = normalizeHHMM(s);
    if (!n) return NaN;
    var p = n.split(":");
    return Number(p[0]) * 60 + Number(p[1]);
  }

  function minutesToHHMM(t) {
    var h = Math.floor(t / 60);
    var m = t % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function parseSlotTimesRaw(raw) {
    return String(raw || "")
      .trim()
      .split(/[\s,;]+/)
      .map(function (x) {
        return normalizeHHMM(x);
      })
      .filter(Boolean);
  }

  function sortUniqueTimes(list) {
    var map = {};
    (Array.isArray(list) ? list : []).forEach(function (t) {
      var n = normalizeHHMM(t);
      if (n) map[n] = true;
    });
    return Object.keys(map).sort(function (a, b) {
      return hhmmToMinutes(a) - hhmmToMinutes(b);
    });
  }

  function syncSlotTimesInputFromChips() {
    var timesEl = document.getElementById("mbProvSlotTimes");
    if (timesEl) {
      timesEl.value = mbSlotChipTimes.join(", ");
    }
  }

  function renderSlotChips() {
    var root = document.getElementById("mbProvSlotChips");
    if (!root) return;
    if (!mbSlotChipTimes.length) {
      root.innerHTML = "<span class='note'>No times added yet.</span>";
      syncSlotTimesInputFromChips();
      return;
    }
    root.innerHTML = mbSlotChipTimes
      .map(function (t, i) {
        return (
          "<button type='button' class='btn btn-secondary' data-slot-chip-remove='" +
          i +
          "'>" +
          escapeHtml(t) +
          " ✕</button>"
        );
      })
      .join("");
    syncSlotTimesInputFromChips();
  }

  function addSlotChipTime(raw) {
    var t = normalizeHHMM(raw);
    if (!t) {
      setStatus("Use valid time HH:MM.");
      return;
    }
    mbSlotChipTimes = sortUniqueTimes(mbSlotChipTimes.concat([t]));
    renderSlotChips();
  }

  function setSlotChipTimes(list) {
    mbSlotChipTimes = sortUniqueTimes(list);
    renderSlotChips();
  }

  function generateSlotsFromWindow(dayStart, dayEnd, durationMin) {
    var a = hhmmToMinutes(dayStart);
    var b = hhmmToMinutes(dayEnd);
    if (!(Number.isFinite(a) && Number.isFinite(b)) || durationMin < 5) return [];
    if (b <= a) return [];
    var out = [];
    var step = Math.round(durationMin);
    for (var t = a; t + step <= b; t += step) {
      out.push(minutesToHHMM(t));
    }
    return out;
  }

  function getProvSlotPick(requireTimesText) {
    var dateEl = document.getElementById("mbProvSlotDate");
    var timesEl = document.getElementById("mbProvSlotTimes");
    var sel = document.getElementById("mbProvSlotService");
    var sid = Number((sel && sel.value) || 0);
    if (!sid) sid = Number((document.getElementById("bakeryEditServiceId") || {}).value || 0);
    if (!sid && Array.isArray(mbLastProviderServices) && mbLastProviderServices.length) {
      sid = Number(mbLastProviderServices[0].id) || 0;
    }
    var slotDate = String((dateEl && dateEl.value) || "").trim().slice(0, 10);
    if (!sid || !slotDate) {
      setStatus("Save a service card first, then choose a date.");
      return null;
    }
    var raw = String((timesEl && timesEl.value) || "").trim();
    var slotTimes = sortUniqueTimes((mbSlotChipTimes || []).concat(parseSlotTimesRaw(raw)));
    if (requireTimesText && !slotTimes.length) {
      setStatus("Add at least one valid time (24h, e.g. 09:00, 14:30).");
      return null;
    }
    return { sid: sid, slotDate: slotDate, timesEl: timesEl, slotTimes: slotTimes };
  }

  function loadProvScheduleSlotsFromServer() {
    if (!getToken()) {
      setStatus("Sign in with your seller account.");
      return Promise.resolve();
    }
    var pick = getProvSlotPick(false);
    if (!pick) return Promise.resolve();
    return api(
      "/api/public/bakery/schedule/slots?serviceId=" +
        encodeURIComponent(String(pick.sid)) +
        "&date=" +
        encodeURIComponent(pick.slotDate)
    )
      .then(function (res) {
        var slots = Array.isArray(res.slots) ? res.slots : [];
        setSlotChipTimes(slots);
        setStatus(slots.length ? "Loaded " + slots.length + " slot(s)." : "No slots for that day yet.");
      })
      .catch(function (err) {
        setStatus(err.message || "Could not load slots");
      });
  }

  function cancelProvScheduleSlotsForDate() {
    if (!getToken()) {
      setStatus("Sign in with your seller account.");
      return Promise.resolve();
    }
    var pick = getProvSlotPick(false);
    if (!pick) return Promise.resolve();
    return api("/api/public/bakery/schedule/slots/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: pick.sid, slotDate: pick.slotDate, slotTimes: [] })
    })
      .then(function () {
        setStatus("Cancelled all slots for " + pick.slotDate + ".");
        setSlotChipTimes([]);
        return loadAll();
      })
      .catch(function (err) {
        setStatus(err.message || "Could not cancel slots");
      });
  }

  function appendProvScheduleSlots() {
    if (!getToken()) {
      setStatus("Sign in with your seller account.");
      return Promise.resolve();
    }
    var pick = getProvSlotPick(true);
    if (!pick) return Promise.resolve();
    return api("/api/public/bakery/schedule/slots/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: pick.sid, slotDate: pick.slotDate, slotTimes: pick.slotTimes })
    })
      .then(function (res) {
        setStatus("Added " + Number(res.inserted || 0) + " slot(s); other times on that day were kept.");
        return loadAll();
      })
      .catch(function (err) {
        setStatus(err.message || "Could not append slots");
      });
  }

  function removeProvScheduleSlots() {
    if (!getToken()) {
      setStatus("Sign in with your seller account.");
      return Promise.resolve();
    }
    var sel = document.getElementById("mbProvSlotService");
    var dateEl = document.getElementById("mbProvSlotDate");
    var rmEl = document.getElementById("mbProvSlotRemoveTimes");
    var sid = Number((sel && sel.value) || 0);
    var slotDate = String((dateEl && dateEl.value) || "").trim().slice(0, 10);
    var slotTimes = parseSlotTimesRaw(rmEl ? rmEl.value : "");
    if (!sid || !slotDate || !slotTimes.length) {
      setStatus("Choose work card, date, and times to remove (comma-separated).");
      return Promise.resolve();
    }
    return api("/api/public/bakery/schedule/slots/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: sid, slotDate: slotDate, slotTimes: slotTimes })
    })
      .then(function (res) {
        setStatus("Removed " + Number(res.removed || 0) + " slot(s).");
        if (rmEl) rmEl.value = "";
        return loadAll();
      })
      .catch(function (err) {
        setStatus(err.message || "Could not remove slots");
      });
  }

  function fillProvSlotTimesFromDayWindow() {
    var startEl = document.getElementById("mbProvSlotDayStart");
    var endEl = document.getElementById("mbProvSlotDayEnd");
    var durEl = document.getElementById("bakerySlotDurationMinutes");
    var timesEl = document.getElementById("mbProvSlotTimes");
    var ds = normalizeHHMM(startEl && startEl.value);
    var de = normalizeHHMM(endEl && endEl.value);
    var dur = durEl ? Number(durEl.value) : 60;
    if (!ds || !de) {
      setStatus("Enter day window as HH:MM (e.g. 09:00 and 17:00).");
      return;
    }
    if (!Number.isFinite(dur) || dur < 15) {
      setStatus("Set each appointment length to at least 15 minutes on the work card form.");
      return;
    }
    var slots = generateSlotsFromWindow(ds, de, dur);
    if (!slots.length) {
      setStatus("No slots fit in that window with this appointment length.");
      return;
    }
    if (timesEl) timesEl.value = slots.join(", ");
    setStatus("Filled " + slots.length + " start times. Use Append or Replace entire day when ready.");
  }

  function ensureProviderSlotDateDefault() {
    var dateEl = document.getElementById("mbProvSlotDate");
    if (!dateEl || String(dateEl.value || "").trim()) return;
    var now = new Date();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    dateEl.value = String(now.getFullYear()) + "-" + m + "-" + d;
  }

  function saveProvScheduleSlots() {
    if (!getToken()) {
      setStatus("Sign in with your seller account to publish slots.");
      return Promise.resolve();
    }
    setStatus("Publishing slots…");
    var dateEl = document.getElementById("mbProvSlotDate");
    var timesEl = document.getElementById("mbProvSlotTimes");
    var slotDate = String((dateEl && dateEl.value) || "").trim().slice(0, 10);
    var slotTimes = sortUniqueTimes(
      (mbSlotChipTimes || []).concat(parseSlotTimesRaw(timesEl ? timesEl.value : ""))
    );
    if (!slotDate || !slotTimes.length) {
      setStatus("Choose date and add at least one time.");
      return Promise.resolve();
    }
    function lineNow() {
      var cfgNow = loadMbConfig() || {};
      return String(cfgNow.service || "Hair Styling").trim() || "Hair Styling";
    }
    function mainCardTitle(line) {
      return String(line || "Service").trim() + " Availability (Main Card)";
    }
    function matchesLineService(line, svc) {
      var needle = String(line || "").trim().toLowerCase();
      var style = String((svc && svc.styleTheme) || "").trim().toLowerCase();
      var head = style.split("·")[0].trim();
      if (needle && (head === needle || style.indexOf(needle) === 0)) return true;
      var wt = String((svc && svc.workTitle) || "").trim().toLowerCase();
      return wt === mainCardTitle(line).toLowerCase();
    }
    function ensureActive(sid) {
      return api("/api/public/bakery/services/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: Number(sid) || 0, isActive: true })
      });
    }
    function getOrCreatePersistentCard() {
      var hid = document.getElementById("bakeryEditServiceId");
      var forced = Number((hid && hid.value) || 0);
      var line = lineNow();
      if (forced) {
        return ensureActive(forced).then(function () {
          return forced;
        });
      }
      return api("/api/public/bakery/services/mine")
        .then(function (res) {
          var arr = Array.isArray(res && res.services) ? res.services : [];
          var pick = null;
          var i;
          for (i = 0; i < arr.length; i++) {
            if (matchesLineService(line, arr[i])) {
              pick = arr[i];
              break;
            }
          }
          if (pick && Number(pick.id || 0) > 0) {
            var sid = Number(pick.id) || 0;
            if (hid) hid.value = String(sid);
            var targetTitle = mainCardTitle(line);
            var upkeep = Promise.resolve();
            if (String(pick.workTitle || "").trim() !== targetTitle) {
              upkeep = api("/api/public/bakery/services/upsert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  serviceId: sid,
                  businessName: String(pick.businessName || "Provider"),
                  workTitle: targetTitle,
                  styleTheme: String(pick.styleTheme || (line + " · Availability board")),
                  basePrice: Number(pick.basePrice || 0) || 0,
                  currency: String(pick.currency || "USD"),
                  imageUrl: String(pick.imageUrl || ""),
                  requirementsText:
                    String(pick.requirementsText || "").trim() ||
                    "Main availability card for this service line.",
                  slotDurationMinutes: Number(pick.slotDurationMinutes || 60) || 60
                })
              }).catch(function () {
                return { ok: false };
              });
            }
            return upkeep.then(function () {
              return ensureActive(sid).then(function () {
                return sid;
              });
            });
          }
          var frm = readBakeryForm();
          return api("/api/public/bakery/services/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessName: String(frm.businessName || "Provider"),
              workTitle: mainCardTitle(line),
              styleTheme: line + " · Availability board",
              basePrice: Number(frm.basePrice || 0) || 0,
              currency: String(frm.currency || "USD"),
              imageUrl: String(frm.imageUrl || ""),
              requirementsText: String(frm.requirementsText || "").trim() || "Main availability card for this service line.",
              slotDurationMinutes: Number(frm.slotDurationMinutes || 60) || 60
            })
          }).then(function (created) {
            var sidNew = Number((created && created.serviceId) || 0);
            if (!sidNew) throw new Error("NO_SAVED_CARD");
            if (hid) hid.value = String(sidNew);
            return ensureActive(sidNew).then(function () {
              return sidNew;
            });
          });
        });
    }
    function doPublish(serviceId) {
      return api("/api/public/bakery/schedule/slots/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: serviceId, slotDate: slotDate, slotTimes: slotTimes })
      })
        .then(function (res) {
          setStatus("Saved " + Number(res.inserted || 0) + " slot(s) for " + slotDate + ".");
          return loadAll();
        })
        .catch(function (err) {
          var m = String((err && err.message) || err || "");
          if (m === "ROLE_FORBIDDEN" || m.indexOf("ROLE_FORBIDDEN") >= 0) {
            setStatus("Publishing slots requires a signed-in provider account. Open Account hub and use seller or service-provider access.");
          } else if (m.indexOf("SERVICE_FORBIDDEN") >= 0 || m.indexOf("INVALID_SESSION") >= 0) {
            setStatus(
              "Could not publish slots for this card. Refresh the dashboard, select your work card, or sign in again from Account hub."
            );
          } else {
            setStatus(m || "Could not save slots");
          }
        });
    }
    return getOrCreatePersistentCard()
      .then(function (sidReady) {
        return doPublish(Number(sidReady) || 0);
      })
      .catch(function (err) {
        setStatus(String((err && err.message) || err || "Could not prepare availability card."));
      });
  }

  function fetchPrivacyExportBlob() {
    var base = {};
    var token = getToken();
    var headers =
      token && window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(token, base)
        : Object.assign({}, base, token ? { Authorization: "Bearer " + token } : {});
    return fetch("/api/public/user/privacy/export", { headers: headers }).then(function (r) {
      return r.json().then(function (json) {
        if (!r.ok || json.ok === false) {
          throw new Error(String((json && (json.message || json.code)) || "HTTP_" + r.status));
        }
        return json;
      });
    });
  }

  function renderServices(services) {
    var root = document.getElementById("bakeryWorkList");
    if (!root) return;
    if (!Array.isArray(services) || !services.length) {
      root.innerHTML = '<p class="note">No work cards for this service line yet. Add one above and save.</p>';
      return;
    }
    root.innerHTML = services.map(function (s) {
      var mediaBlock = renderServiceCardMediaHtml(s);
      var thumbFallback =
        !mediaBlock && s.imageUrl
          ? '<div class="vc-work-thumb"><img src="' +
            escapeHtml(s.imageUrl) +
            '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></div>'
          : mediaBlock
            ? '<div class="vc-work-thumb" style="max-height:none;height:auto">' + mediaBlock + "</div>"
            : "";
      return (
        '<article class="vc-work-item" data-service-id="' +
        Number(s.id) +
        '">' +
        "<h3>" +
        escapeHtml(s.workTitle) +
        "</h3>" +
        '<p class="note">' +
        escapeHtml(s.businessName) +
        " · " +
        escapeHtml(s.styleTheme || "No style yet") +
        "</p>" +
        '<p class="note">Price: ' +
        Number(s.basePrice || 0).toFixed(2) +
        " " +
        escapeHtml(s.currency || "USD") +
        "</p>" +
        '<p class="note">Requirements: ' +
        escapeHtml(s.requirementsText || "None") +
        "</p>" +
        thumbFallback +
        '<p class="hero-actions">' +
        '<button type="button" class="btn btn-secondary" data-mb-edit-service="' +
        Number(s.id) +
        '">Edit in form</button> ' +
        '<button class="btn btn-secondary" data-toggle="' +
        (s.isActive ? "0" : "1") +
        '">' +
        (s.isActive ? "Pause listing" : "Relist") +
        "</button> " +
        '<button type="button" class="btn btn-secondary" data-mb-delete-service="' +
        Number(s.id) +
        '">Delete card</button>' +
        "</p>" +
        "</article>"
      );
    }).join("");
  }

  function renderBookings(bookings) {
    var root = document.getElementById("bakeryBookingList");
    if (!root) return;
    providerBookingsCache = (Array.isArray(bookings) ? bookings : []).filter(function (b) {
      var st = String((b && b.bookingStatus) || "").toLowerCase();
      return st === "pending" || st === "confirmed";
    });
    if (!providerBookingsCache.length) {
      root.innerHTML = '<p class="note">No booking requests for this service line yet.</p>';
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
      var stRaw = String(b.bookingStatus || "pending").toLowerCase();
      var prefTime = String(b.preferredTime || b.requestedStartTime || "").trim();
      if (!prefTime && b.occasionType) {
        var om = String(b.occasionType).match(/Time preference:\s*(\d{1,2}:\d{2})/i);
        if (om) prefTime = om[1];
      }
      var timeLine = prefTime ? " · " + escapeHtml(prefTime) : "";
      var actionsHtml = "";
      if (stRaw === "pending") {
        actionsHtml =
          '<button type="button" class="btn btn-primary" data-booking-status="confirmed">Accept</button>' +
          '<button type="button" class="btn btn-secondary" data-booking-status="declined">Decline</button>';
      } else if (stRaw === "confirmed") {
        actionsHtml = '<button type="button" class="btn btn-primary" data-booking-status="completed">Complete</button>';
      }
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
        timeLine +
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
        '">Open</button>' +
        actionsHtml +
        "</p>" +
        "</article>"
      );
    }).join("");
  }

  function fetchProviderSlotDateCounts(services) {
    var list = Array.isArray(services) ? services.filter(function (s) { return Number(s.id) > 0; }) : [];
    if (!list.length) return Promise.resolve({});
    var month = new Date().toISOString().slice(0, 7);
    return Promise.all(
      list.map(function (s) {
        return api(
          "/api/public/bakery/schedule/slots?serviceId=" +
            encodeURIComponent(String(Number(s.id))) +
            "&month=" +
            encodeURIComponent(month)
        ).catch(function () {
          return {};
        });
      })
    ).then(function (results) {
      var counts = {};
      results.forEach(function (res) {
        if (Array.isArray(res && res.availableDates)) {
          res.availableDates.forEach(function (d) {
            var dateKey = String((d && d.date) || "").slice(0, 10);
            var c = Number((d && d.slots) || 0) || 0;
            if (dateKey && c > 0) counts[dateKey] = (counts[dateKey] || 0) + c;
          });
          return;
        }
        var bucket = res && (res.availableByDate || res.byDate || res.days || res.summary || {});
        if (!bucket || typeof bucket !== "object") return;
        Object.keys(bucket).forEach(function (dateKey) {
          var val = bucket[dateKey];
          var c = 0;
          if (typeof val === "number") c = Number(val) || 0;
          else if (Array.isArray(val)) c = val.length;
          else if (val && typeof val === "object") c = Number(val.count || val.slots || 0) || 0;
          if (c > 0) counts[dateKey] = (counts[dateKey] || 0) + c;
        });
      });
      return counts;
    });
  }

  function normalizeMbEventDateKey(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (!s || s === "No date") return s || "No date";
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return s;
  }

  function mbCalendarHasClosedBookings(bookingsForDate) {
    if (!Array.isArray(bookingsForDate)) return false;
    return bookingsForDate.some(function (b) {
      var st = String((b && b.bookingStatus) || "").toLowerCase();
      return st === "declined" || st === "completed" || st === "cancelled";
    });
  }

  function renderCalendar(bookings, slotDateCounts) {
    var root = document.getElementById("bakeryCalendarView");
    if (!root) return;
    root.innerHTML = "";
    var byDate = {};
    (Array.isArray(bookings) ? bookings : []).forEach(function (b) {
      var raw = b.eventDate == null ? "" : String(b.eventDate);
      var key = raw ? normalizeMbEventDateKey(raw) : "No date";
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(b);
    });
    var slotMap = slotDateCounts && typeof slotDateCounts === "object" ? slotDateCounts : {};
    var allKeys = {};
    Object.keys(byDate).forEach(function (k) { allKeys[k] = true; });
    Object.keys(slotMap).forEach(function (k) { allKeys[normalizeMbEventDateKey(k)] = true; });
    var dates = Object.keys(allKeys).filter(Boolean).sort();
    if (!dates.length) {
      root.innerHTML = '<p class="note">No slot dates or bookings yet.</p>';
      return;
    }
    dates.forEach(function (date) {
      var card = document.createElement("article");
      card.className = "vc-booking-item";
      var normDate = normalizeMbEventDateKey(date);
      var slotCount = Number(slotMap[normDate] || slotMap[date] || 0);
      if (slotCount > 0) {
        card.style.borderColor = "rgba(46, 204, 113, 0.75)";
        card.style.boxShadow = "0 0 0 1px rgba(46, 204, 113, 0.35) inset";
      }
      var rows = byDate[date] || byDate[normDate] || [];
      var purgeBtn = "";
      if (mbCalendarHasClosedBookings(rows) && /^\d{4}-\d{2}-\d{2}$/.test(normDate)) {
        purgeBtn =
          '<button type="button" class="btn btn-secondary" style="margin-left:0.35rem;font-size:0.85em;padding:0.2rem 0.55rem" data-mb-purge-calendar-date="' +
          escapeHtml(normDate) +
          '">Clear closed</button>';
      }
      card.innerHTML =
        "<h3 style=\"display:flex;flex-wrap:wrap;align-items:center;gap:0.25rem\">" +
        "<span>" +
        escapeHtml(normDate) +
        "</span>" +
        (slotCount > 0 ? " <span class='vc-pill' style='background:rgba(46,204,113,.18)'>" + slotCount + " slot(s)</span>" : "") +
        purgeBtn +
        "</h3>" +
        (rows
          .map(function (b) {
            return (
              "<p class='note'>" +
              escapeHtml(b.customerName || "Customer") +
              " · " +
              escapeHtml(b.workTitle || "Service") +
              " · " +
              escapeHtml(b.bookingStatus || "pending") +
              "</p>"
            );
          })
          .join("") || "<p class='note'>No bookings yet for this date.</p>");
      root.appendChild(card);
    });
  }

  function loadAll() {
    var cfg = loadMbConfig();
    if (!cfg || !isSessionUnlocked(cfg.persona, cfg.service)) {
      return Promise.resolve();
    }
    if (cfg.persona === "client") {
      setStatus("");
      return loadClientDashboard().catch(function (err) {
        setStatus("Could not refresh: " + err.message);
      });
    }
    if (cfg.persona === "citizen") {
      setStatus("");
      var lineCit = String(cfg.service || "").trim();
      return Promise.all([
        loadDiscoverForClientLine(lineCit),
        api("/api/public/bakery/bookings/as-buyer").catch(function () {
          return { bookings: [] };
        }),
        api("/api/public/seller/listings").catch(function () {
          return { listings: [] };
        }),
        api("/api/public/bakery/services/mine").catch(function () {
          return { services: [] };
        }),
        api("/api/public/bakery/bookings/mine").catch(function () {
          return { bookings: [] };
        })
      ])
        .then(function (results) {
          renderClientMyBookings(results[1].bookings || []);
          var svcAll = Array.isArray(results[3].services) ? results[3].services : [];
          var bookAll = Array.isArray(results[4].bookings) ? results[4].bookings : [];
          var svcFiltered = filterServicesForLine(svcAll, lineCit);
          var bookFiltered = filterBookingsForLine(bookAll, lineCit, svcFiltered);
          mbLastProviderServices = svcFiltered;
          renderKpis(results[2].listings || [], svcFiltered, bookFiltered);
          renderServices(svcFiltered);
          renderProvSlotServiceSelect(mbLastProviderServices);
          ensureProviderSlotDateDefault();
          renderBookings(bookFiltered);
          return fetchProviderSlotDateCounts(svcFiltered).then(function (slotCounts) {
            renderCalendar(bookFiltered, slotCounts);
            return loadProvScheduleSlotsFromServer().catch(function () {});
          }).then(function () {
            if (providerFocusBookingId) {
              loadProviderFocus(providerFocusBookingId);
            }
            setStatus("Citizen desk updated · " + lineCit);
          });
        })
        .catch(function (err) {
          setStatus("Could not refresh: " + err.message);
        });
    }
    setStatus("Loading My Business…");
    var line = String(cfg.service || "").trim();
    return Promise.all([
      api("/api/public/seller/listings").catch(function () { return { listings: [] }; }),
      api("/api/public/bakery/services/mine").catch(function () { return { services: [] }; }),
      api("/api/public/bakery/bookings/mine").catch(function () { return { bookings: [] }; })
    ]).then(function (results) {
      var svcAll = Array.isArray(results[1].services) ? results[1].services : [];
      var bookAll = Array.isArray(results[2].bookings) ? results[2].bookings : [];
      var svcFiltered = filterServicesForLine(svcAll, line);
      var bookFiltered = filterBookingsForLine(bookAll, line, svcFiltered);
      mbLastProviderServices = svcFiltered;
      renderKpis(results[0].listings || [], svcFiltered, bookFiltered);
      renderServices(svcFiltered);
      renderProvSlotServiceSelect(mbLastProviderServices);
      ensureProviderSlotDateDefault();
      renderBookings(bookFiltered);
      return fetchProviderSlotDateCounts(svcFiltered).then(function (slotCounts) {
        renderCalendar(bookFiltered, slotCounts);
        return loadProvScheduleSlotsFromServer().catch(function () {});
      }).then(function () {
        if (providerFocusBookingId) {
          loadProviderFocus(providerFocusBookingId);
        }
        setStatus("Dashboard updated");
      });
    }).catch(function (err) {
      setStatus("Could not load dashboard: " + err.message);
    });
  }

  function saveBakeryService() {
    if (!getToken()) {
      setStatus("Sign in with your seller account to save a work card.");
      return Promise.resolve();
    }
    var body = readBakeryForm();
    body.gallery = mbWorkGallery.filter(function (x) {
      return x && x.url && isAllowedPublicMediaUrl(x.url);
    });
    if (body.serviceId === 0) {
      delete body.serviceId;
    }
    return api("/api/public/bakery/services/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      setStatus("Work card saved.");
      var hid = document.getElementById("bakeryEditServiceId");
      var savedId = Number((res && res.serviceId) || body.serviceId || 0);
      if (hid && res && res.serviceId) {
        hid.value = String(Number(res.serviceId) || 0);
      }
      return loadAll().then(function () {
        return savedId;
      });
    }).catch(function (err) {
      var msg = String(err.message || "");
      if (msg.indexOf("ROLE_FORBIDDEN") >= 0 || msg.indexOf("403") >= 0) {
        setStatus("Save failed: use a seller VibeCart account (not buyer-only).");
      } else {
        setStatus("Save failed: " + msg);
      }
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
    var rmGal = e.target.closest && e.target.closest("[data-mb-gallery-remove]");
    if (rmGal) {
      var ix = Number(rmGal.getAttribute("data-mb-gallery-remove") || -1);
      if (ix >= 0 && ix < mbWorkGallery.length) {
        mbWorkGallery.splice(ix, 1);
        refreshMbWorkGalleryUi();
      }
      return;
    }
    var editSvc = e.target.closest && e.target.closest("[data-mb-edit-service]");
    if (editSvc) {
      var sid = Number(editSvc.getAttribute("data-mb-edit-service") || 0);
      var found = (mbLastProviderServices || []).filter(function (x) {
        return Number(x.id) === sid;
      })[0];
      if (found) populateWorkCardFromService(found);
      else setStatus("Could not load that card — refresh the dashboard.");
      return;
    }
    var delSvc = e.target.closest && e.target.closest("[data-mb-delete-service]");
    if (delSvc) {
      var delId = Number(delSvc.getAttribute("data-mb-delete-service") || 0);
      if (!delId) return;
      if (!getToken()) {
        setStatus("Sign in with your seller account to delete a work card.");
        return;
      }
      if (
        !window.confirm(
          "Delete this work card permanently? All published slots and every booking request (including chat history) linked to this card will be removed. This cannot be undone."
        )
      ) {
        return;
      }
      setStatus("Deleting work card…");
      api("/api/public/bakery/services/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: delId })
      })
        .then(function () {
          var hid = document.getElementById("bakeryEditServiceId");
          if (hid && Number(hid.value || 0) === delId) {
            clearMbWorkForm();
          }
          setStatus("Work card removed.");
          return loadAll();
        })
        .catch(function (err) {
          setStatus(err.message || "Delete failed.");
        });
      return;
    }
    var toggle = e.target.closest && e.target.closest("[data-toggle]");
    if (toggle) {
      var serviceCard = toggle.closest("[data-service-id]");
      var serviceId = Number(serviceCard && serviceCard.dataset.serviceId || 0);
      var active = String(toggle.getAttribute("data-toggle") || "") === "1";
      api("/api/public/bakery/services/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: serviceId, isActive: active })
      })
        .then(loadAll)
        .catch(function (err) {
          setStatus(err.message || "Could not update listing — sign in as seller.");
        });
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
    var purgeCal = e.target.closest && e.target.closest("[data-mb-purge-calendar-date]");
    if (purgeCal) {
      var dk = String(purgeCal.getAttribute("data-mb-purge-calendar-date") || "").trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dk)) return;
      if (
        !window.confirm(
          "Permanently remove declined, completed, and cancelled rows for " + dk + " from this calendar? Active requests stay."
        )
      ) {
        return;
      }
      var cfgPurge = loadMbConfig();
      setStatus("Clearing calendar…");
      api("/api/public/bakery/bookings/purge-calendar-closed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDate: dk,
          serviceLine: cfgPurge && cfgPurge.service ? String(cfgPurge.service).trim() : ""
        })
      })
        .then(function (res) {
          setStatus("Removed " + Number((res && res.removed) || 0) + " closed booking(s) for " + dk + ".");
          return loadAll();
        })
        .catch(function (err) {
          setStatus(err.message || "Could not clear that date.");
        });
      return;
    }
    var statusBtn = e.target.closest && e.target.closest("[data-booking-status]");
    if (statusBtn) {
      var bookingCard = statusBtn.closest("[data-booking-id]");
      var bookingId = Number((bookingCard && bookingCard.dataset && bookingCard.dataset.bookingId) || 0);
      if (!bookingId) {
        var focusRoot = document.getElementById("mbProvFocusRoot");
        bookingId = Number(
          (focusRoot && focusRoot.dataset && focusRoot.dataset.bookingId) || providerFocusBookingId || 0
        );
      }
      var status = String(statusBtn.getAttribute("data-booking-status") || "");
      if (!bookingId) {
        setStatus("Could not determine booking id. Refresh and try again.");
        return;
      }
      var payload = { bookingId: bookingId, status: status };
      if (status === "confirmed") {
        var rawDur = window.prompt("Accepted. Enter booking duration in minutes (e.g. 60):", "60");
        var dur = Number(rawDur || 0);
        if (Number.isFinite(dur) && dur >= 15 && dur <= 480) {
          payload.durationMinutes = Math.round(dur);
        }
      }
      api("/api/public/bakery/bookings/status/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(loadAll)
        .then(function () {
          if (providerFocusBookingId && bookingId === providerFocusBookingId) {
            loadProviderFocus(providerFocusBookingId);
          }
        })
        .catch(function (err) {
          setStatus(err.message || "Status update failed");
        });
      return;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      document.body.classList.remove(
        "vc-warp-out",
        "vc-intro-blocking",
        "vc-auto-calm",
        "vc-heartbeat-lock",
        "vc-lane-aura-shift"
      );
      document.body.style.filter = "";
      document.body.style.opacity = "";
      document.documentElement.style.filter = "";
      document.documentElement.style.opacity = "";
    } catch (_) {
      /* ignore visual reset issues */
    }
    stripLegacyPublishedSlotsSection();
    wireGateUi();
    wireMbWebPushControls();
    bootGate();

    // Hard-bind slot publish/cancel so taps always respond.
    document.addEventListener(
      "click",
      function (ev) {
        var t = ev && ev.target ? ev.target : null;
        if (!t || !t.closest) return;
        var sendReqBtn = t.closest("#mbClientSubmitReserve");
        if (sendReqBtn) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
            submitClientReservation();
          } catch (_) {
            setStatus("Could not send reservation. Refresh and try again.");
          }
          return;
        }
        var saveBtn = t.closest("#mbProvSlotSave");
        if (saveBtn) {
          try {
            saveProvScheduleSlots();
          } catch (_) {
            setStatus("Publish slots failed to start. Refresh and try again.");
          }
          return;
        }
        var cancelBtn = t.closest("#mbProvSlotCancel");
        if (cancelBtn) {
          try {
            cancelProvScheduleSlotsForDate();
          } catch (_) {
            setStatus("Cancel slots failed to start. Refresh and try again.");
          }
        }
      },
      true
    );

    window.addEventListener("pageshow", function () {
      var cfg = loadMbConfig();
      if (cfg && isSessionUnlocked(cfg.persona, cfg.service)) {
        scrollToBeautyHashIfAllowed(cfg);
      }
    });

    var btnRefresh = document.getElementById("bizRefreshBtn");
    var btnSaveBakery = document.getElementById("bakerySaveBtn");
    var btnSavePublishBakery = document.getElementById("bakerySavePublishBtn");
    var btnPayout = document.getElementById("savePayoutAccountBtn");
    if (btnRefresh) btnRefresh.addEventListener("click", loadAll);
    var btnClientBookings = document.getElementById("mbClientBookingsRefresh");
    if (btnClientBookings) btnClientBookings.addEventListener("click", loadClientDashboard);
    var calPurgeAll = document.getElementById("mbCalendarPurgeAllClosed");
    if (calPurgeAll) {
      calPurgeAll.addEventListener("click", function () {
        var cfgCal = loadMbConfig();
        if (!cfgCal || !getToken()) {
          setStatus("Sign in and open your provider desk first.");
          return;
        }
        if (
          !window.confirm(
            "Permanently remove all declined, completed, and cancelled bookings from this calendar for your current service line? Pending and accepted bookings stay."
          )
        ) {
          return;
        }
        setStatus("Clearing closed bookings…");
        api("/api/public/bakery/bookings/purge-calendar-closed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceLine: String(cfgCal.service || "").trim() })
        })
          .then(function (res) {
            setStatus("Removed " + Number((res && res.removed) || 0) + " closed booking(s).");
            return loadAll();
          })
          .catch(function (err) {
            setStatus(err.message || "Could not clear calendar.");
          });
      });
    }
    if (btnSaveBakery) btnSaveBakery.addEventListener("click", saveBakeryService);
    if (btnSavePublishBakery) {
      btnSavePublishBakery.addEventListener("click", function () {
        saveBakeryService().then(function (savedId) {
          var sid = Number(savedId || (document.getElementById("bakeryEditServiceId") || {}).value || 0);
          if (!sid) {
            setStatus("Work card saved. Open/edit card once, then publish.");
            return;
          }
          return api("/api/public/bakery/services/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceId: sid, isActive: true })
          })
            .then(function () {
              setStatus("Saved and published.");
              return loadAll();
            })
            .catch(function (err) {
              setStatus(err.message || "Saved but publish failed");
            });
        });
      });
    }
    if (btnPayout) btnPayout.addEventListener("click", savePayoutAccount);

    refreshMbWorkGalleryUi();
    var bakeryMediaPick = document.getElementById("bakeryMediaPick");
    if (bakeryMediaPick) {
      bakeryMediaPick.addEventListener("change", function () {
        var files = bakeryMediaPick.files;
        if (!files || !files.length) return;
        if (mbWorkGallery.length >= 12) {
          setStatus("Gallery is full (12 items). Remove one to add more.");
          bakeryMediaPick.value = "";
          return;
        }
        setStatus("Uploading…");
        var i = 0;
        function next() {
          if (i >= files.length || mbWorkGallery.length >= 12) {
            bakeryMediaPick.value = "";
            setStatus("Upload finished.");
            refreshMbWorkGalleryUi();
            return;
          }
          var f = files[i];
          i += 1;
          uploadBakeryMediaFile(f)
            .then(function (res) {
              var kind = res.kind === "video" ? "video" : "image";
              if (res.url) mbWorkGallery.push({ kind: kind, url: res.url });
              next();
            })
            .catch(function (err) {
              setStatus(err.message || "Upload failed");
              next();
            });
        }
        next();
      });
    }
    var bakeryClear = document.getElementById("bakeryClearWorkForm");
    if (bakeryClear) bakeryClear.addEventListener("click", clearMbWorkForm);
    var bakeryExtAdd = document.getElementById("bakeryExternalMediaAdd");
    if (bakeryExtAdd) {
      bakeryExtAdd.addEventListener("click", function () {
        var u = String((document.getElementById("bakeryExternalMediaUrl") || {}).value || "").trim();
        var kd = document.getElementById("bakeryExternalMediaKind");
        var kind = kd && String(kd.value) === "video" ? "video" : "image";
        if (!u || !isAllowedPublicMediaUrl(u)) {
          setStatus("Enter a valid https image or video URL.");
          return;
        }
        if (mbWorkGallery.length >= 12) {
          setStatus("Gallery is full (12 items).");
          return;
        }
        mbWorkGallery.push({ kind: kind, url: u });
        refreshMbWorkGalleryUi();
        setStatus("Added linked media.");
      });
    }
    var bakeryAddUrl = document.getElementById("bakeryAddMediaUrl");
    if (bakeryAddUrl) {
      bakeryAddUrl.addEventListener("click", function () {
        var u = window.prompt("Paste a public https URL to an image or .mp4 video:", "https://");
        if (!u || !isAllowedPublicMediaUrl(u.trim())) {
          setStatus("Invalid URL.");
          return;
        }
        if (mbWorkGallery.length >= 12) {
          setStatus("Gallery is full (12 items).");
          return;
        }
        var isVid = /\.(mp4|webm)(\?|$)/i.test(u) || /video/i.test(u);
        mbWorkGallery.push({ kind: isVid ? "video" : "image", url: u.trim() });
        refreshMbWorkGalleryUi();
      });
    }
    document.body.addEventListener("click", onClick);
    var beautySlotsBtn = document.getElementById("beautyShowBookingSlots");
    var beautySvc = document.getElementById("beautyBookingServiceType");
    var beautyDate = document.getElementById("beautyBookingDate");
    var beautyOut = document.getElementById("beautyBookingSlotsResult");
    var beautyPrepay = document.getElementById("beautyBookingPrepayRouteBtn");
    if (beautySlotsBtn && beautySvc && beautyDate && beautyOut) {
      beautySlotsBtn.addEventListener("click", function () {
        var date = String(beautyDate.value || "").trim().slice(0, 10);
        var line = String(beautySvc.value || "").trim();
        if (!date) {
          setStatus("Pick a date to load slots.");
          return;
        }
        var sid = pickServiceIdForProviderLine(mbLastProviderServices, line);
        if (!sid) {
          beautyOut.innerHTML =
            '<p class="note">No saved work card matches <strong>' +
            escapeHtml(line) +
            "</strong>. Add one under <em>Service portfolio</em> (same service line), save, then try again.</p>";
          return;
        }
        api("/api/public/bakery/schedule/slots?serviceId=" + encodeURIComponent(String(sid)) + "&date=" + encodeURIComponent(date))
          .then(function (res) {
            var slots = Array.isArray(res.slots) ? res.slots : [];
            var href =
              "./checkout-details.html?flow=service_booking&service=" +
              encodeURIComponent(line) +
              "&date=" +
              encodeURIComponent(date);
            beautyOut.innerHTML =
              "<p><strong>" +
              escapeHtml(line) +
              "</strong> · " +
              escapeHtml(date) +
              "</p><p class=\"note\">" +
              (slots.length
                ? "Your published slots: " + escapeHtml(slots.join(", "))
                : "No slots published for that day yet — add times under <em>Published time slots</em> before clients can book.") +
              '</p><p class="hero-actions"><a class="btn btn-primary" href="' +
              href +
              '">Prepay / reserve (checkout)</a></p>';
            if (beautyPrepay) {
              beautyPrepay.setAttribute("href", href);
            }
          })
          .catch(function (err) {
            beautyOut.innerHTML = '<p class="note">' + escapeHtml(err.message || "Could not load slots") + "</p>";
          });
      });
    }
    var mbProvSlotSave = document.getElementById("mbProvSlotSave");
    if (mbProvSlotSave) {
      mbProvSlotSave.addEventListener("click", function () {
        saveProvScheduleSlots();
      });
    }
    var mbProvSlotCancel = document.getElementById("mbProvSlotCancel");
    if (mbProvSlotCancel) {
      mbProvSlotCancel.addEventListener("click", function () {
        cancelProvScheduleSlotsForDate();
      });
    }
    var mbProvSlotAddTime = document.getElementById("mbProvSlotAddTime");
    var mbProvSlotTimeInput = document.getElementById("mbProvSlotTimeInput");
    if (mbProvSlotAddTime && mbProvSlotTimeInput) {
      mbProvSlotAddTime.addEventListener("click", function () {
        addSlotChipTime(String(mbProvSlotTimeInput.value || ""));
        mbProvSlotTimeInput.value = "";
      });
      mbProvSlotTimeInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          addSlotChipTime(String(mbProvSlotTimeInput.value || ""));
          mbProvSlotTimeInput.value = "";
        }
      });
    }
    var mbProvSlotTimes = document.getElementById("mbProvSlotTimes");
    if (mbProvSlotTimes) {
      mbProvSlotTimes.addEventListener("blur", function () {
        var parsed = parseSlotTimesRaw(mbProvSlotTimes.value);
        if (parsed.length) setSlotChipTimes(parsed);
      });
    }
    var mbProvSlotPresets = document.getElementById("mbProvSlotPresets");
    if (mbProvSlotPresets) {
      mbProvSlotPresets.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("[data-slot-preset]") : null;
        if (!btn) return;
        addSlotChipTime(String(btn.getAttribute("data-slot-preset") || ""));
      });
    }
    var mbProvSlotChips = document.getElementById("mbProvSlotChips");
    if (mbProvSlotChips) {
      mbProvSlotChips.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("[data-slot-chip-remove]") : null;
        if (!btn) return;
        var ix = Number(btn.getAttribute("data-slot-chip-remove") || -1);
        if (ix < 0 || ix >= mbSlotChipTimes.length) return;
        mbSlotChipTimes.splice(ix, 1);
        renderSlotChips();
      });
    }
    renderSlotChips();
    var mbPublishCurrentCard = document.getElementById("mbPublishCurrentCard");
    if (mbPublishCurrentCard) {
      mbPublishCurrentCard.addEventListener("click", function () {
        var editId = Number((document.getElementById("bakeryEditServiceId") || {}).value || 0);
        if (!editId) {
          setStatus("Open an existing work card first, then publish it.");
          return;
        }
        api("/api/public/bakery/services/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: editId, isActive: true })
        })
          .then(function () {
            setStatus("Current work card published.");
            return loadAll();
          })
          .catch(function (err) {
            setStatus(err.message || "Could not publish current card");
          });
      });
    }
    var mbProviderClearRequests = document.getElementById("mbProviderClearRequests");
    if (mbProviderClearRequests) {
      mbProviderClearRequests.addEventListener("click", function () {
        if (!getToken()) {
          setStatus("Sign in with your seller account.");
          return;
        }
        api("/api/public/bakery/bookings/clear-mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceLine: String((loadMbConfig() || {}).service || "").trim() })
        })
          .then(function (res) {
            setStatus("Cleared " + Number((res && res.cleared) || 0) + " request(s).");
            providerFocusBookingId = 0;
            closeProviderBookingFocus();
            return loadAll();
          })
          .catch(function (err) {
            setStatus(err.message || "Could not clear requests");
          });
      });
    }
    var mbAiGenBtn = document.getElementById("mbAiGenerateBtn");
    var mbAiReq = document.getElementById("mbAiRequirements");
    var mbAiOut = document.getElementById("mbAiSectionsOut");
    if (mbAiGenBtn && mbAiReq && mbAiOut) {
      mbAiGenBtn.addEventListener("click", function () {
        var cfgNow = loadMbConfig() || { service: "Hair Styling" };
        var requirements = String(mbAiReq.value || "").trim();
        if (requirements.length < 10) {
          requirements = "Create provider dashboard sections for bookings, retention, service operations, and growth.";
        }
        function render(sections, source) {
          mbAiOut.innerHTML =
            "<p class='note'>AI sections (" +
            escapeHtml(source) +
            "):</p><ul>" +
            (sections || [])
              .map(function (s) {
                return "<li><strong>" + escapeHtml(s.title || "Section") + ":</strong> " + escapeHtml(s.intent || "") + "</li>";
              })
              .join("") +
            "</ul>";
        }
        if (typeof window.vibecartAiGenerate === "function") {
          window
            .vibecartAiGenerate("provider_dashboard_sections", {
              requirements: requirements,
              mode: "autonomous",
              service: String(cfgNow.service || "Hair Styling")
            })
            .then(function (res) {
              var sections = Array.isArray(res && res.sections) ? res.sections.slice(0, 8) : [];
              if (!sections.length) {
                sections = [
                  { title: "VIP Queue", intent: "Prioritize high-value clients." },
                  { title: "No-Show Recovery", intent: "Auto fill empty slots quickly." },
                  { title: "Retention Engine", intent: "Trigger repeat-booking nudges." }
                ];
              }
              render(sections, "AI");
              setStatus("AI provider sections generated.");
            })
            .catch(function () {
              render(
                [
                  { title: "VIP Queue", intent: "Prioritize high-value clients." },
                  { title: "No-Show Recovery", intent: "Auto fill empty slots quickly." },
                  { title: "Retention Engine", intent: "Trigger repeat-booking nudges." }
                ],
                "fallback"
              );
            });
          return;
        }
        render(
          [
            { title: "VIP Queue", intent: "Prioritize high-value clients." },
            { title: "No-Show Recovery", intent: "Auto fill empty slots quickly." },
            { title: "Retention Engine", intent: "Trigger repeat-booking nudges." }
          ],
          "fallback"
        );
      });
    }
    document.addEventListener("click", function (ev) {
      var tplBtn = ev.target && ev.target.closest ? ev.target.closest("[data-ai-template]") : null;
      if (!tplBtn || !mbAiReq) return;
      var kind = String(tplBtn.getAttribute("data-ai-template") || "");
      var templates = {
        retention: "Build retention flow: 7-day check-in, 21-day reminder, rebooking incentives, loyalty trigger.",
        no_show: "Build no-show recovery flow: auto reminder, standby list fill, reactivation outreach, fee policy handling.",
        vip: "Build VIP experience flow: priority queue, premium slot windows, concierge follow-up, personalized offers.",
        growth: "Build growth + upsell flow: package bundles, cross-sell services, monthly targets, conversion nudges."
      };
      if (templates[kind]) {
        mbAiReq.value = templates[kind];
      }
    });
    var mbPrivacyExport = document.getElementById("mbPrivacyExport");
    if (mbPrivacyExport) {
      mbPrivacyExport.addEventListener("click", function () {
        if (!getToken()) {
          setStatus("Sign in to export.");
          return;
        }
        fetchPrivacyExportBlob()
          .then(function (data) {
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "vibecart-privacy-export.json";
            a.click();
            URL.revokeObjectURL(a.href);
            setStatus("Privacy export downloaded.");
          })
          .catch(function (err) {
            setStatus(err.message || "Export failed");
          });
      });
    }
    var mbPrivacyDel = document.getElementById("mbPrivacyDeleteRequest");
    if (mbPrivacyDel) {
      mbPrivacyDel.addEventListener("click", function () {
        if (!getToken()) {
          setStatus("Sign in to submit a request.");
          return;
        }
        api("/api/public/user/privacy/delete-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: "Requested from My Business dashboard" })
        })
          .then(function () {
            setStatus("Deletion request recorded. Our team will process it under the privacy policy.");
          })
          .catch(function (err) {
            setStatus(err.message || "Request failed");
          });
      });
    }
  });

  window.addEventListener(
    "pageshow",
    function () {
      try {
        document.body.classList.remove(
          "vc-warp-out",
          "vc-intro-blocking",
          "vc-auto-calm",
          "vc-heartbeat-lock",
          "vc-lane-aura-shift"
        );
        document.body.style.filter = "";
        document.body.style.opacity = "";
        document.documentElement.style.filter = "";
        document.documentElement.style.opacity = "";
      } catch (_) {
        /* ignore visual reset issues */
      }
    },
    { passive: true }
  );
})();
