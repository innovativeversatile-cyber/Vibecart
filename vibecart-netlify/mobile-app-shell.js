/* VibeCart mobile WebView shell — runs when the native app sets class `vc-mobile-app` on <html>. */
(function () {
  const AI_ID = "vc-mobile-ai";
  function detectPhoneLikeContext() {
    try {
      var ua = String((navigator && navigator.userAgent) || "").toLowerCase();
      var touch = typeof window !== "undefined" && "ontouchstart" in window;
      var width = Number((window && window.innerWidth) || 0);
      var mobileUA = /iphone|android|mobile|ipad|ipod|opera mini|iemobile/.test(ua);
      return mobileUA || (touch && width > 0 && width <= 1024);
    } catch {
      return false;
    }
  }

  function isStandaloneLikeApp() {
    try {
      var standaloneMedia = typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
      var iosStandalone = typeof navigator !== "undefined" && navigator.standalone === true;
      var ref = String((document && document.referrer) || "").toLowerCase();
      var webviewRef = ref.indexOf("android-app://") === 0;
      return standaloneMedia || iosStandalone || webviewRef;
    } catch {
      return false;
    }
  }

  function applyPhoneDocumentClasses() {
    try {
      var root = document.documentElement;
      if (detectPhoneLikeContext()) {
        root.classList.add("vc-phone");
        if (isStandaloneLikeApp() && !root.classList.contains("vc-mobile-app")) {
          root.classList.add("vc-mobile-app");
        }
      } else if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
        root.classList.add("vc-phone");
      }
      try {
        var qs = String((window.location && window.location.search) || "");
        if (/[?&]vcShell=1(?:&|$)/i.test(qs)) {
          root.classList.add("vc-phone");
        }
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore */
    }
  }

  function isVibeCartHomePath() {
    try {
      var p = String(location.pathname || "").replace(/\\/g, "/");
      return p === "/" || p === "" || /index\.html$/i.test(p);
    } catch {
      return false;
    }
  }

  function resetWowLaneVisualArtifacts() {
    if (!isVibeCartHomePath()) return;
    var b = document.body;
    if (!b) return;
    [
      "vc-warp-out",
      "vc-auto-calm",
      "vc-one-moment-flow",
      "vc-intro-blocking",
      "vc-intro-pulse-bridge",
      "vc-cine-active",
      "vc-cine-beat",
      "vc-cine-lane-buy",
      "vc-cine-lane-book",
      "vc-cine-lane-sell",
      "vc-cine-lane-fast",
      "vc-heartbeat-lock",
      "vc-lane-aura-shift",
      "vc-motion-lite"
    ].forEach(function (c) {
      b.classList.remove(c);
    });
    b.style.filter = "";
    b.style.opacity = "";
    try {
      document.documentElement.style.filter = "";
      document.documentElement.style.opacity = "";
    } catch {
      /* ignore */
    }
  }

  window.addEventListener(
    "pageshow",
    function () {
      resetWowLaneVisualArtifacts();
    },
    { passive: true }
  );

  function isDocumentHidden() {
    try {
      return typeof document !== "undefined" && document.hidden === true;
    } catch {
      return false;
    }
  }

  function startVisibilityAwareInterval(fn, ms) {
    var id = 0;
    function loop() {
      window.clearInterval(id);
      if (isDocumentHidden()) {
        return;
      }
      id = window.setInterval(function () {
        if (isDocumentHidden()) {
          window.clearInterval(id);
          return;
        }
        fn();
      }, ms);
    }
    loop();
    document.addEventListener("visibilitychange", loop, { passive: true });
    return function stop() {
      window.clearInterval(id);
    };
  }

  function readApiBase() {
    try {
      const el = document.querySelector('meta[name="vibecart-api-base"]');
      const raw = el && el.getAttribute("content");
      const s = String(raw || "").trim();
      if (s && !/^disabled$/i.test(s)) {
        return s.replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
    try {
      if (
        typeof window !== "undefined" &&
        window.location &&
        /^https?:$/i.test(String(window.location.protocol || ""))
      ) {
        return String(window.location.origin || "").replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
    return "";
  }

  const PLAYBOOKS = {
    default: {
      title: "Lane-first shopping designed for clarity",
      steps: [
        "Start from a regional lane or global market so routes, trust, and delivery story stay visible.",
        "Compare three fits, then open checkout only when tracking + seller posture look coherent.",
        "Let VibeCoach remember category and partner context so repeat visits feel instant, not repetitive."
      ],
      ctaLabel: "Open global search",
      ctaHref: "./global-search.html"
    },
    bridge: {
      title: "Cross-border route assistant",
      steps: [
        "Start with legal route cards and verify country pair before checkout.",
        "Open the Trade Base when you need route and compliance context.",
        "Keep a screenshot of delivery and customs notes before payment."
      ],
      ctaLabel: "Open trade base",
      ctaHref: "./bridge-hub.html"
    },
    shop: {
      title: "Shop with corridor clarity and confidence",
      steps: [
        "Filter by need and budget first — VibeCart rewards decisive lane picks over endless scroll fatigue.",
        "Prefer verified seller routes and compare three options before you commit; that is how trust compounds.",
        "After purchase, live tracking and order-tied messaging keep every step clear."
      ],
      ctaLabel: "Open hot picks",
      ctaHref: "./hot-picks.html"
    },
    seller: {
      title: "Seller execution assistant",
      steps: [
        "Complete photos, shipping, and policy checks before promotion spend.",
        "Use one growth lane this week and track conversion quality daily.",
        "Pin your best-performing route and replicate the listing formula."
      ],
      ctaLabel: "Open seller boost",
      ctaHref: "./seller-boost.html"
    }
  };

  function getUserDisplayName() {
    try {
      var raw = localStorage.getItem("vibecart-public-auth-user");
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.fullName) {
        var n = String(parsed.fullName).trim();
        if (n) {
          localStorage.setItem("vibecart-last-display-name", n);
          return n;
        }
      }
      if (parsed && parsed.email) {
        var localPart = String(parsed.email).split("@")[0];
        if (localPart) {
          localStorage.setItem("vibecart-last-display-name", localPart);
          return localPart;
        }
      }
      var cached = String(localStorage.getItem("vibecart-last-display-name") || "").trim();
      if (cached) return cached;
    } catch {
      /* ignore */
    }
    return "friend";
  }

  function backfillDisplayNameFromSession() {
    try {
      var token = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
      if (!token) {
        return Promise.resolve("");
      }
      var headers = { Authorization: "Bearer " + token };
      if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.authHeaders === "function") {
        headers = window.VibeCartSessionDevice.authHeaders(token);
      }
      return fetch("/api/public/auth/session", { headers: headers })
        .then(function (res) {
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function (body) {
          if (!body || !body.ok || !body.user) {
            return "";
          }
          try {
            var rotatedToken = String(body.token || "").trim();
            if (rotatedToken) {
              localStorage.setItem("vibecart-public-auth-token", rotatedToken);
            }
            localStorage.setItem("vibecart-public-auth-user", JSON.stringify(body.user));
          } catch {
            /* ignore */
          }
          var refreshed = String(body.user.fullName || body.user.email || "")
            .split("@")[0]
            .trim();
          if (refreshed) {
            try {
              localStorage.setItem("vibecart-last-display-name", refreshed);
            } catch {
              /* ignore */
            }
          }
          return refreshed;
        })
        .catch(function () {
          return "";
        });
    } catch {
      return Promise.resolve("");
    }
  }

  function hardPressVibrate() {
    try {
      if (navigator && navigator.vibrate) {
        navigator.vibrate([26, 48, 22, 52, 30]);
      }
    } catch {
      /* ignore */
    }
  }

  function brandonPageMountBlocked() {
    try {
      if (document.body && document.body.classList.contains("vc-no-brandon")) return true;
      if (document.body && document.body.classList.contains("admin-surface")) return true;
      var path = String(window.location.pathname || "").toLowerCase();
      if (
        path.indexOf("admin.html") >= 0 ||
        path.indexOf("admin-app.html") >= 0 ||
        path.indexOf("admin-messages.html") >= 0 ||
        path.indexOf("owner-access-kuda") >= 0
      ) {
        return true;
      }
      if (
        path.indexOf("checkout-details.html") >= 0 ||
        path.indexOf("payment-confirmation.html") >= 0 ||
        path.indexOf("top-class-checkout.html") >= 0
      ) {
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function ensureAiCoach() {
    applyPhoneDocumentClasses();
    if (document.getElementById(AI_ID)) {
      return;
    }
    if (brandonPageMountBlocked()) {
      return;
    }
    try {
      var rootMount = document.documentElement;
      if (!rootMount.classList.contains("vc-mobile-app") && !rootMount.classList.contains("vc-phone")) {
        rootMount.classList.add("vc-brandon-universal");
      }
    } catch {
      /* ignore */
    }
    const wrap = document.createElement("div");
    wrap.id = AI_ID;
    wrap.className = "vc-mobile-ai";
    wrap.innerHTML = `
      <button type="button" class="vc-mobile-ai__orb" aria-expanded="false" aria-controls="vc-mobile-ai-panel" title="Brandon AI guide">
        <span class="vc-mobile-ai__pulse"></span>
        <span class="vc-mobile-ai__label">B</span>
      </button>
      <p id="vc-mobile-ai-micro" class="vc-mobile-ai__micro">Tap me for your next best move.</p>
      <div id="vc-mobile-ai-panel" class="vc-mobile-ai__panel" hidden>
        <div class="vc-mobile-ai__head">
          <strong>Brandon</strong>
          <span class="vc-mobile-ai__sub">Ask anything in plain language — buying, selling, regions, orders, wellbeing. I open the right page or a real Maps / search link. Hidden on password, card, and checkout fields.</span>
        </div>
        <div id="vc-mobile-ai-actions" class="hero-actions" style="margin:.35rem 0 .6rem"></div>
        <label class="vc-mobile-ai__lab" for="vc-mobile-ai-feedback">Message Brandon (anything about VibeCart or where to shop)</label>
        <textarea id="vc-mobile-ai-feedback" class="vc-mobile-ai__ta" rows="3" maxlength="500" placeholder="Examples: track my order, Ireland electronics, open seller boost, book a haircut, Nairobi shops — short phrases work best. Never paste passwords, PINs, CVV, or OTPs."></textarea>
        <button type="button" class="btn btn-primary vc-mobile-ai__save">Send to Brandon</button>
        <p id="vc-mobile-ai-reply" class="note vc-mobile-ai__saved" hidden></p>
        <p id="vc-mobile-ai-saved" class="note vc-mobile-ai__saved" hidden>Saved locally — thank you.</p>
      </div>
    `;
    document.body.appendChild(wrap);

    const orb = wrap.querySelector(".vc-mobile-ai__orb");
    const micro = wrap.querySelector("#vc-mobile-ai-micro");
    const panel = wrap.querySelector(".vc-mobile-ai__panel");
    const ta = wrap.querySelector("#vc-mobile-ai-feedback");
    const saveBtn = wrap.querySelector(".vc-mobile-ai__save");
    const reply = wrap.querySelector("#vc-mobile-ai-reply");
    const saved = wrap.querySelector("#vc-mobile-ai-saved");
    function aiProfileKey() {
      var who = "guest";
      try {
        var raw = localStorage.getItem("vibecart-public-auth-user");
        var parsed = raw ? JSON.parse(raw) : null;
        who = parsed && (parsed.id || parsed.email) ? String(parsed.id || parsed.email) : "guest";
      } catch {
        who = "guest";
      }
      return "vibecart-brandon-profile-" + who;
    }

    function loadAiProfile() {
      try {
        var parsed = JSON.parse(localStorage.getItem(aiProfileKey()) || "{}");
        if (!parsed || typeof parsed !== "object") return { visits: 0, topIntent: "global", notes: [] };
        parsed.visits = Number(parsed.visits || 0);
        parsed.topIntent = String(parsed.topIntent || "global");
        parsed.notes = Array.isArray(parsed.notes) ? parsed.notes.slice(-20) : [];
        return parsed;
      } catch {
        return { visits: 0, topIntent: "global", notes: [] };
      }
    }

    function saveAiProfile(next) {
      try {
        localStorage.setItem(aiProfileKey(), JSON.stringify(next || {}));
      } catch {
        /* ignore */
      }
    }

    const actionsEl = wrap.querySelector("#vc-mobile-ai-actions");
    const brandonWorldwideSlot = document.createElement("div");
    brandonWorldwideSlot.id = "vcBrandonWorldwideSlot";
    brandonWorldwideSlot.className = "note";
    brandonWorldwideSlot.style.margin = "0.15rem 0 0.35rem";
    brandonWorldwideSlot.setAttribute("aria-label", "Worldwide shop search shortcuts");
    actionsEl.after(brandonWorldwideSlot);
    let startY = 0;
    var introKey = "vibecart-brandon-introduced-v1";
    var lastMicroPromptAt = 0;
    var microCycle = 0;
    var microHidden = false;
    var lastScrollY = 0;
    var lastContextLine = "";
    var forceMicroVisibleUntil = 0;
    var lastAdviceKey = "";

    function readLocal(key) {
      try {
        return String(localStorage.getItem(key) || "").trim();
      } catch {
        return "";
      }
    }

    function detectMode() {
      var path = "";
      var hash = "";
      try {
        path = String(window.location.pathname || "").toLowerCase();
        hash = String(window.location.hash || "").toLowerCase();
      } catch {
        /* ignore */
      }
      if (path.indexOf("bridge") >= 0 || hash.indexOf("bridge") >= 0) return "bridge";
      if (path.indexOf("sell") >= 0 || path.indexOf("seller") >= 0 || hash.indexOf("sell") >= 0) return "seller";
      if (path.indexOf("hot-picks") >= 0 || path.indexOf("search") >= 0 || hash.indexOf("shop") >= 0) return "shop";
      return "default";
    }

    function routeLensLabel() {
      try {
        var path = String(localStorage.getItem("vibecart-home-lite-bridge-path") || "").trim();
        if (path === "from-africa") return "Africa -> Europe";
        if (path === "from-europe") return "Europe -> Africa";
      } catch {
        /* ignore */
      }
      return "Africa <-> Europe, Dubai, Asia";
    }

    function refreshBrandonQuickActions() {
      if (!actionsEl) return;
      var mode = detectMode();
      var card = PLAYBOOKS[mode] || PLAYBOOKS.default;
        actionsEl.innerHTML =
        '<a class="btn btn-secondary" href="' + card.ctaHref + '">' + card.ctaLabel + "</a>";
      var cta = actionsEl.querySelector("a");
      if (cta) {
        cta.addEventListener("click", function () {
          hardPressVibrate();
        });
      }
    }

    refreshBrandonQuickActions();

    function setMicro(text) {
      if (!micro) return;
      var next = String(text || "").slice(0, 120);
      if (micro.textContent === next) return;
      lastContextLine = next;
      micro.textContent = next;
      lastMicroPromptAt = Date.now();
    }

    function refreshMicroVisibility() {
      if (!micro) return;
      try {
        if (document.documentElement.classList.contains("vc-brandon-universal")) {
          microHidden = false;
          micro.style.display = "block";
          return;
        }
      } catch {
        /* ignore */
      }
      var y = 0;
      try {
        y = Number(window.scrollY || window.pageYOffset || 0);
      } catch {
        y = 0;
      }
      if (Date.now() < forceMicroVisibleUntil) {
        microHidden = false;
        micro.style.display = "block";
        return;
      }
      // Hysteresis avoids flicker around threshold while user scrolls slowly.
      if (microHidden && y > 300) {
        microHidden = false;
        micro.style.display = "block";
        return;
      }
      if (!microHidden && y < 220) {
        microHidden = true;
        micro.style.display = "none";
      }
    }

    function renderActionSuggestions(items) {
      if (!actionsEl) return;
      var list = Array.isArray(items) ? items : [];
      if (!list.length) {
        refreshBrandonQuickActions();
        return;
      }
      actionsEl.innerHTML = "";
      list.slice(0, 4).forEach(function (item) {
        var href = String(item.href || "").trim();
        if (href) {
          var a = document.createElement("a");
          a.className = "btn btn-secondary";
          a.href = href;
          a.textContent = String(item.label || "Open");
          a.addEventListener("click", function () {
            hardPressVibrate();
          });
          actionsEl.appendChild(a);
          return;
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-secondary";
        btn.textContent = String(item.label || "Open");
        btn.addEventListener("click", function () {
          hardPressVibrate();
          if (item.selector) {
            var target = document.querySelector(String(item.selector));
            if (target && target.scrollIntoView) {
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        });
        actionsEl.appendChild(btn);
      });
    }

    function tipFromBank(topic, profile, y) {
      var banks = {
        general: [
          "Tip: compare seller rating and delivery window before checkout.",
          "Hint: verify final destination domain before any payment.",
          "Pro move: shortlist two options, then decide by delivery certainty."
        ],
        fashion: [
          "Style tip: check material details before focusing on price.",
          "Hint: filter by budget first to avoid over-scrolling.",
          "Pro move: confirm size/return policy in one seller message."
        ],
        seller: [
          "Seller tip: start with one niche lane and optimize conversions there.",
          "Hint: clear product titles improve trust and discovery.",
          "Pro move: include 3 concrete benefits in your first listing line."
        ],
        orders: [
          "Tracking tip: confirm courier handoff and latest ETA checkpoint.",
          "Hint: keep order ID + seller thread together in one message.",
          "Pro move: ask for timeline and fallback delivery plan."
        ],
        payment: [
          "Payment tip: confirm totals, route, and trusted checkout domain.",
          "Hint: avoid unknown redirects for payment requests.",
          "Pro move: screenshot checkout summary before paying."
        ],
        chat: [
          "Chat tip: ask price, ETA, and return terms in one message.",
          "Hint: short, specific questions get faster replies.",
          "Pro move: ask for two alternatives if stock is low."
        ]
      };
      var list = banks[topic] || banks.general;
      var intent = String((profile && profile.topIntent) || "global");
      var seed = Math.max(0, Math.floor(Number(y || 0) / 140)) + intent.length + microCycle;
      return list[seed % list.length];
    }

    function resolveAdvice(profile, y) {
      var communication = document.getElementById("communication");
      if (communication) {
        var rect = communication.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.65 && rect.bottom > 20) {
          return {
            key: "chat",
            line:
              (microCycle % 2 === 0
                ? "You are near chat. Ask route ETA and payment protection first."
                : "Tell me your goal and I can draft a seller message.") +
              " " +
              tipFromBank("chat", profile, y)
          };
        }
      }
      var checkout = document.querySelector(
        "#checkout, [id*='checkout'], [class*='checkout'], [id*='payment'], [class*='payment']"
      );
      if (checkout) {
        var cr = checkout.getBoundingClientRect();
        if (cr.top < window.innerHeight * 0.7 && cr.bottom > 20) {
          return {
            key: "payment",
            line:
              (microCycle % 2 === 0
                ? "Payment zone detected. Use only on-page fields—never paste card data or passwords into chat."
                : "For pay safety, read Security overview; I do not handle card numbers or PINs.") +
              " " +
              tipFromBank("payment", profile, y)
          };
        }
      }
      if (y < 140) {
        return {
          key: "start",
          line:
            "Tell me buy, sell, track, or health and I will map your next tap. " +
            tipFromBank("general", profile, y)
        };
      }
      if (y < 420) {
        return {
          key: "discovery",
          line:
            (microCycle % 2 === 0
              ? "Share budget plus category and I will route you fast."
              : "Ask for suggestions and I will return direct action buttons.") +
            " " +
            tipFromBank(String(profile.topIntent || "general"), profile, y)
        };
      }
      if (y > 1200) {
        return {
          key: "deep",
          line:
            (microCycle % 2 === 0
              ? "You are deep in browse mode. I can jump you to orders, deals, or health coach."
              : "Tell me exactly what you need and I will point the quickest path.") +
            " " +
            tipFromBank("general", profile, y)
        };
      }
      return {
        key: "mid",
        line: "I am adapting to your flow. " + tipFromBank(String(profile.topIntent || "general"), profile, y)
      };
    }

    var BRANDON_PAGE_RANK = [
      {
        keys: "affiliate partner referral commission dashboard clicks tracked",
        href: "./affiliate-dashboard.html",
        label: "Affiliate dashboard",
        blurb: "See tracked click-outs and affiliate activity."
      },
      {
        keys: "insurance shipment protect coverage claim",
        href: "./insurance.html",
        label: "Insurance lane",
        blurb: "Protection and shipping-risk context."
      },
      {
        keys: "reward points loyalty perks hub",
        href: "./rewards-hub.html",
        label: "Rewards hub",
        blurb: "Rewards and loyalty-style benefits."
      },
      {
        keys: "passport lane identity corridor welcome",
        href: "./lane-passport.html",
        label: "Lane passport",
        blurb: "Lane identity and corridor onboarding."
      },
      {
        keys: "bridge cross border trade corridor africa europe asia dubai",
        href: "./bridge-hub.html",
        label: "Trade bridge",
        blurb: "Cross-border trade routes and bridge tools."
      },
      {
        keys: "regional folder europe asia africa global scents shops lane",
        href: "./regional-shops.html",
        label: "Regional shops",
        blurb: "Pick a regional shop folder before the live grid."
      },
      {
        keys: "europe eu euro poland germany france",
        href: "./shops-europe.html",
        label: "Europe shops",
        blurb: "Europe-focused retailer lanes."
      },
      {
        keys: "mama africa nigeria kenya ghana zimbabwe cairo morocco",
        href: "./shops-mama-africa.html",
        label: "Mama Africa shops",
        blurb: "Africa regional shop picks."
      },
      {
        keys: "asia shopee lazada singapore japan korea",
        href: "./shops-asia.html",
        label: "Asia shops",
        blurb: "Asia regional shop lanes."
      },
      {
        keys: "scent perfume fragrance beauty aroma",
        href: "./shops-scents.html",
        label: "Scents shops",
        blurb: "Fragrance and beauty-forward retailers."
      },
      {
        keys: "world shop experience tour global",
        href: "./world-shop-experience.html",
        label: "World shop tour",
        blurb: "Guided world marketplace experience."
      },
      {
        keys: "popular trending viral market lane",
        href: "./popular-market.html",
        label: "Popular market",
        blurb: "Trending category shortcuts."
      },
      {
        keys: "service provider freelancer gig expert hub",
        href: "./service-provider-hub.html",
        label: "Service provider hub",
        blurb: "Providers, gigs, and professional services."
      },
      {
        keys: "book appointment haircut nails barber salon bakery booking deposit",
        href: "./service-provider-hub.html",
        label: "Book a service",
        blurb: "Beauty, barber, nails, hair, bakery-style prepaid bookings."
      },
      {
        keys: "jewelry jewellery watches rings gold silver gems",
        href: "./live-market-shops.html?cat=Fashion&view=global&deal=fashion",
        label: "Fashion / jewellery grid",
        blurb: "Live shop grid for style and jewellery picks."
      },
      {
        keys: "audience fit persona icp targeting",
        href: "./audience-fit.html",
        label: "Audience fit",
        blurb: "Audience and positioning fit tools."
      },
      {
        keys: "plan workspace strategy roadmap sprint",
        href: "./plan-workspace.html",
        label: "Plan workspace",
        blurb: "Planning and execution workspace."
      },
      {
        keys: "legal settings compliance policy lawyer",
        href: "./legal-settings.html",
        label: "Legal settings",
        blurb: "Legal and compliance preferences."
      },
      {
        keys: "policy refund acceptable use rules",
        href: "./policy.html",
        label: "Policy",
        blurb: "Platform policy."
      },
      {
        keys: "terms conditions agreement tos",
        href: "./terms.html",
        label: "Terms",
        blurb: "Terms of use."
      },
      {
        keys: "privacy gdpr cookie data protection",
        href: "./privacy.html",
        label: "Privacy",
        blurb: "Privacy and data handling."
      },
      {
        keys: "seller orders fulfillment dispatch",
        href: "./seller-orders.html",
        label: "Seller orders",
        blurb: "Seller-side order management."
      },
      {
        keys: "my listings inventory sku catalog",
        href: "./my-listings.html",
        label: "My listings",
        blurb: "Edit and preview your listings."
      },
      {
        keys: "buyer orders purchase history receipts",
        href: "./buyer-orders.html",
        label: "Buyer orders",
        blurb: "Buyer purchase history."
      },
      {
        keys: "top checkout premium lane",
        href: "./top-class-checkout.html",
        label: "Top-class checkout",
        blurb: "Premium checkout lane."
      },
      {
        keys: "payment confirmation receipt paid success",
        href: "./payment-confirmation.html",
        label: "Payment confirmation",
        blurb: "After-pay confirmation and next steps."
      },
      {
        keys: "coach payment recovery dispute chargeback",
        href: "./coach-payment-recovery.html",
        label: "Coach payment recovery",
        blurb: "Coach billing and recovery flows."
      },
      {
        keys: "fashion trend runway lookbook seasonal",
        href: "./fashion-trends.html",
        label: "Fashion trends",
        blurb: "Fashion discovery rail."
      },
      {
        keys: "browse categories directory departments",
        href: "./browse-categories.html",
        label: "Browse categories",
        blurb: "All category entry points."
      },
      {
        keys: "global search find lookup discover query",
        href: "./global-search.html",
        label: "Global search",
        blurb: "Search across lanes and pages."
      },
      {
        keys: "live market folder lanes popular",
        href: "./live-market.html",
        label: "Live market folders",
        blurb: "Choose popular vs full live market."
      },
      {
        keys: "owner operator staff backoffice internal tools report",
        href: "./account-hub.html",
        label: "Account hub",
        blurb: "Account tools on the public site. Owner admin is a separate signed-in area—Brandon does not open it from here."
      },
      {
        keys: "account hub profile sign login signup register wallet",
        href: "./account-hub.html",
        label: "Account hub",
        blurb: "Sign-in, profile, and account tools."
      },
      {
        keys: "passport welcome onboarding first steps",
        href: "./passport-welcome.html",
        label: "Passport welcome",
        blurb: "Welcome flow for new passports."
      },
      {
        keys: "account welcome new buyer seller",
        href: "./account-welcome.html",
        label: "Account welcome",
        blurb: "Account onboarding copy."
      },
      {
        keys: "lane welcome corridor intro",
        href: "./lane-welcome.html",
        label: "Lane welcome",
        blurb: "Lane-specific welcome."
      },
      {
        keys: "my business bookings bakery chat workspace",
        href: "./my-business.html",
        label: "My business",
        blurb: "Seller business desk and bookings."
      },
      {
        keys: "seller live preview storefront",
        href: "./seller-live-preview.html",
        label: "Seller live preview",
        blurb: "Preview how listings render."
      },
      {
        keys: "owner access kuda portal finance",
        href: "./owner-access-kuda-portal.html",
        label: "Owner finance portal",
        blurb: "Owner finance / access portal."
      }
    ];

    function matchRankedBrandonPages(ask) {
      var scored = [];
      BRANDON_PAGE_RANK.forEach(function (row) {
        var parts = String(row.keys || "")
          .toLowerCase()
          .split(/\s+/);
        var score = 0;
        parts.forEach(function (p) {
          if (p.length < 3) return;
          if (ask.indexOf(p) >= 0) score += 1;
        });
        if (score > 0) scored.push({ score: score, row: row });
      });
      scored.sort(function (a, b) {
        return b.score - a.score;
      });
      return scored;
    }

    /** Apparel / style — drives Fashion category live grid (not beauty-only or "scents" from search copy). */
    function brandonFashionLiveGridIntent(ask) {
      var a = String(ask || "").toLowerCase();
      return (
        /\b(?:fashion|outfits?|wardrobe|streetwear|runway|lookbook|apparel|garments?|clothes|clothing|footwear|sneakers?|jewelry|jewellery)\b/.test(
          a
        ) || /\bstyles?\b/.test(a)
      );
    }

    /** Beauty, fragrance, booking-style language without apparel keywords above. */
    function brandonBeautyScentsServiceIntent(ask) {
      var a = String(ask || "").toLowerCase();
      if (brandonFashionLiveGridIntent(a)) return false;
      return /\b(?:beauty|cosmetics?|makeup|perfume|fragrances?|scents?|aroma|salon|skincare|manicure|facial|spa)\b/.test(
        a
      );
    }

    function brandonFashionOrBeautyTipIntent(ask) {
      return brandonFashionLiveGridIntent(ask) || brandonBeautyScentsServiceIntent(ask);
    }

    /** Topics Brandon must never coach on — user uses official forms only. */
    function buildVcWorldwideRetailLinkDescriptors(rawQ) {
      var q = String(rawQ || "").trim();
      if (!q) {
        return [];
      }
      return [
        {
          label: "Google Maps",
          href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q),
          external: true
        },
        {
          label: "VibeCart global search",
          href: "./global-search.html?q=" + encodeURIComponent(q),
          external: false
        },
        {
          label: "DuckDuckGo",
          href: "https://duckduckgo.com/?q=" + encodeURIComponent(q + " shop OR store OR restaurant"),
          external: true
        }
      ];
    }

    function paintBrandonWorldwideSlot(rawQ) {
      var slot = wrap.querySelector("#vcBrandonWorldwideSlot");
      if (!slot) {
        return;
      }
      var q = String(rawQ || "").trim();
      slot.textContent = "";
      if (!q || brandonAskIsSensitiveCredentialsTopic(q.toLowerCase())) {
        return;
      }
      var lead = document.createElement("span");
      lead.textContent = "Real shops anywhere (opens Maps & search — we never invent store URLs): ";
      slot.appendChild(lead);
      buildVcWorldwideRetailLinkDescriptors(q).forEach(function (item, idx) {
        if (idx > 0) {
          slot.appendChild(document.createTextNode(" · "));
        }
        var a = document.createElement("a");
        a.href = item.href;
        a.textContent = item.label;
        if (item.external) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        slot.appendChild(a);
      });
    }

    function brandonAskIsSensitiveCredentialsTopic(ask) {
      var s = String(ask || "").trim().toLowerCase();
      if (!s) return false;
      if (/\b(forgot password|password reset|where (do i|to) reset|change password link)\b/.test(s)) return false;
      if (/\b(cvv|cvc|security code on back|3[- ]digit code|card number|card no\b|routing number|bank account number|sort code|iban\b|swift code|bic code|wire transfer|account number)\b/.test(s)) {
        return true;
      }
      if (/\b(atm pin|card pin|pin for)\b/.test(s)) return true;
      if (/\bpassword\b/.test(s) && /\b(give|send|paste|tell me what|reveal|hack|stolen|recover without email)\b/.test(s)) {
        return true;
      }
      if (/\b(otp|one[- ]time code|2fa secret|authenticator key)\b/.test(s)) return true;
      if (/\b(ssn|social security number|national insurance number)\b/.test(s)) return true;
      if (/\b(what is my|read my|decode my|store my)\b.*\b(card|cvv|pin|password)\b/.test(s)) return true;
      return false;
    }

    function brandonCloudAssistEnabled() {
      try {
        var raw = window.localStorage.getItem("vibecart-brandon-cloud-assist");
        // Live AI is on by default; explicit "0" becomes a local kill switch.
        if (raw == null || raw === "") return true;
        return String(raw) !== "0";
      } catch {
        // If storage is blocked, keep cloud assist on and rely on request fallbacks.
        return true;
      }
    }

    function generateBrandonResponse(text) {
      var ask = String(text || "").trim().toLowerCase();
      if (!ask) {
        return {
          reply: "Ask using a short phrase (place, goal, or page name). I will open the closest VibeCart page.",
          actions: [
            { label: "Browse all categories", href: "./browse-categories.html" },
            { label: "Global search", href: "./global-search.html" },
            { label: "Account hub", href: "./account-hub.html" }
          ]
        };
      }
      if (brandonAskIsSensitiveCredentialsTopic(ask)) {
        return {
          reply:
            "That touches sign-in secrets, cards, bank details, or one-time codes. I stop there by design: use only official VibeCart screens and your bank or wallet app. Never paste CVV, PIN, full card numbers, passwords, or OTPs into this chat.",
          actions: [
            { label: "Security overview", href: "./security-overview.html" },
            { label: "Account hub", href: "./account-hub.html" },
            { label: "Privacy", href: "./privacy.html" }
          ]
        };
      }
      if (
        /\b(hello|hi|hey|who are you|brandon|introduce|good morning|good afternoon|good evening|howdy|thanks|thank you|you there|are you there)\b/.test(
          ask
        )
      ) {
        var dn = "";
        try {
          dn = String(getUserDisplayName() || "").trim();
        } catch {
          dn = "";
        }
        var personal =
          dn && dn.toLowerCase() !== "friend"
            ? "Hey " + dn.slice(0, 48) + " — great to see you here. "
            : "Hey — great to have you here. ";
        return {
          reply:
            personal +
            "I am Brandon, VibeCart's guide: I route buyers and sellers to the right page in one or two taps (live market, regional lanes, orders, wellbeing, sell journey). Ask in plain words what you want to do next — buy, sell, track, book a service, or pick a region — and I will line up the best shortcuts. I never collect passwords or card data.",
          actions: [
            { label: "Browse categories", href: "./browse-categories.html" },
            { label: "Regional shops", href: "./regional-shops.html" },
            { label: "Account hub", href: "./account-hub.html" }
          ]
        };
      }
      if (/my business|service studio|custom service desk|salon dashboard|provider suite|mb studio/.test(ask)) {
        return {
          reply:
            "My Business includes a generative studio for custom service desks: choose Other service at the gate, then open the studio block. I route you there; the heavy layout is produced inside that wizard—not by typing secrets here.",
          actions: [
            { label: "Open studio", href: "./my-business.html#mb-service-studio" },
            { label: "My Business hub", href: "./my-business.html" }
          ]
        };
      }
      if (
        /\b(mental|wellbeing|wellness|stress|anxiety|sleep|therapy|mindfulness|burnout)\b/.test(ask) ||
        /\bhealth coach\b/.test(ask)
      ) {
        return {
          reply: "Health coach lane: use wellbeing tools for guided support, then return to shopping when you are ready.",
          actions: [
            { label: "Wellbeing coach", href: "./wellbeing.html" },
            { label: "Hot picks (light browse)", href: "./hot-picks.html" }
          ]
        };
      }
      if (/\b(coach|coaching|mentor|session|program)\b/.test(ask) && !/\b(health|mental|wellbeing|wellness)\b/.test(ask)) {
        return {
          reply: "Coach experience lane: book structured sessions and review coach-specific flows.",
          actions: [
            { label: "Coach experience", href: "./coach-experience.html" },
            { label: "Plan workspace", href: "./plan-workspace.html" }
          ]
        };
      }
      if (/\b(ireland|irish|dublin|cork|belfast|ni\b|northern ireland)\b/.test(ask)) {
        return {
          reply: "Ireland lane: open the IE live grid (region locked) or the Ireland regional card.",
          actions: [
            { label: "Ireland live shops", href: "./live-market-shops.html?cat=All&region=ie&view=global&deal=best" },
            { label: "Regional shops (IE card)", href: "./regional-shops.html" }
          ]
        };
      }
      if (/\b(electronics|laptop|phone|gadget|tech)\b/.test(ask) && !/\b(fashion|clothes)\b/.test(ask)) {
        return {
          reply: "Electronics lane: verify seller trust, then open external checkout only on the real retailer domain.",
          actions: [
            { label: "Electronics live grid", href: "./live-market-shops.html?cat=Electronics&view=global&deal=electronics" },
            { label: "Security overview", href: "./security-overview.html" }
          ]
        };
      }
      if (/\b(books|textbook|study|reading)\b/.test(ask)) {
        return {
          reply: "Books lane: compare delivery to your country before you commit.",
          actions: [
            { label: "Books live grid", href: "./live-market-shops.html?cat=Books&view=global&deal=books" },
            { label: "Browse categories", href: "./browse-categories.html" }
          ]
        };
      }
      if (/\b(gaming|console|steam|playstation|xbox)\b/.test(ask)) {
        return {
          reply: "Gaming lane: watch for region-locked keys and official store fronts.",
          actions: [
            { label: "Gaming live grid", href: "./live-market-shops.html?cat=Gaming&view=global&deal=gaming" },
            { label: "Hot picks", href: "./hot-picks.html" }
          ]
        };
      }
      if (/\b(buy|purchase|shopping|browse deals|add to cart)\b/.test(ask)) {
        return {
          reply: "Buyer lane: shortlist in Hot picks, then verify checkout safety on Security overview.",
          actions: [
            { label: "Buy journey", href: "./buy-journey.html" },
            { label: "Hot picks", href: "./hot-picks.html" },
            { label: "Live market (all shops)", href: "./live-market-shops.html?cat=All&view=global&deal=best" }
          ]
        };
      }
      if (/\b(live market|marketplace|all shops|shop grid|external shops)\b/.test(ask)) {
        return {
          reply: "Live market: pick a category tab (All shops shows every category), acknowledge the disclaimer, then tap a trusted retailer card.",
          actions: [
            { label: "Live market shops", href: "./live-market-shops.html?cat=All&view=global&deal=best" },
            { label: "Live market folders", href: "./live-market.html" }
          ]
        };
      }
      if (/\b(admin app|seller dashboard|store dashboard)\b/.test(ask)) {
        return {
          reply: "Advanced seller/admin tools live in the admin app (separate layout).",
          actions: [{ label: "Open admin app", href: "./admin-app.html" }]
        };
      }
      if (brandonBeautyScentsServiceIntent(ask)) {
        return {
          reply:
            "Beauty and scent lanes split between curated shop cards and human pros. Use scents shops for retailer picks, then service hub or My Business if you are booking a provider.",
          actions: [
            { label: "Scents & beauty shops", href: "./shops-scents.html" },
            { label: "Service providers", href: "./service-provider-hub.html" },
            { label: "My Business (bookings)", href: "./my-business.html" }
          ]
        };
      }
      if (brandonFashionLiveGridIntent(ask)) {
        return {
          reply:
            "Great choice. Start with Hot picks, then compare two listings using delivery speed and seller trust.",
          actions: [
            { label: "Hot picks", href: "./hot-picks.html" },
            { label: "Fashion live grid", href: "./live-market-shops.html?cat=Fashion&view=global&deal=fashion" }
          ]
        };
      }
      if (/sell|seller|business|mybusiness|income|hustle|listing/.test(ask)) {
        return {
          reply:
            "Seller lane activated. Start your sell journey, then I recommend boost tools and a focused niche listing.",
          actions: [
            { label: "Start selling", href: "./sell-journey.html" },
            { label: "Seller boost", href: "./seller-boost.html" },
            { label: "My business desk", href: "./my-business.html" }
          ]
        };
      }
      if (/\b(orders?|tracking|delivery|shipping|parcel|courier|rma|dispatch)\b/.test(ask)) {
        return {
          reply:
            "Open tracking first, confirm route plus status, then message seller with order ID and expected date.",
          actions: [
            { label: "Track orders", href: "./orders-tracking.html" },
            { label: "Open communication", selector: "#communication" }
          ]
        };
      }
      if (/\b(refund|dispute|escrow|payment protection|chargeback|is (this|it) (safe|legit)|avoid scam)\b/.test(ask)) {
        return {
          reply:
            "For money safety I stay high-level: verify the seller domain, use tracked shipping when it matters, and complete card entry only on official checkout pages. I will not walk through CVV, PIN, or account numbers.",
          actions: [
            { label: "Security overview", href: "./security-overview.html" },
            { label: "Buy journey", href: "./buy-journey.html" },
            { label: "Policy", href: "./policy.html" }
          ]
        };
      }
      if (/\b(checkout|how (do|to) pay|pay online|place order)\b/.test(ask)) {
        return {
          reply:
            "Use the guided buy journey, then complete payment only on the real checkout screen. I can point to flows—I do not collect or repeat payment credentials.",
          actions: [
            { label: "Buy journey", href: "./buy-journey.html" },
            { label: "Browse categories", href: "./browse-categories.html" },
            { label: "Security overview", href: "./security-overview.html" }
          ]
        };
      }
      if (/scam|fraud|phish|fake seller|trust safety/.test(ask)) {
        return {
          reply: "Trust and safety: read the security overview, then prefer tracked checkout and verified seller signals.",
          actions: [
            { label: "Security overview", href: "./security-overview.html" },
            { label: "Policy", href: "./policy.html" }
          ]
        };
      }
      if (/tip|tips|hint|hints|advise|advice|help me choose/.test(ask)) {
        var profile = loadAiProfile();
        return {
          reply: tipFromBank(String(profile.topIntent || "general"), profile, Number(window.scrollY || 0)),
          actions: [
            { label: "Hot picks", href: "./hot-picks.html" },
            { label: "Wellbeing", href: "./wellbeing.html" },
            { label: "Browse categories", href: "./browse-categories.html" }
          ]
        };
      }
      var ranked = matchRankedBrandonPages(ask);
      if (ranked.length && ranked[0].score >= 1) {
        var top = ranked[0].row;
        var actions = [{ label: top.label, href: top.href }];
        if (ranked[1]) actions.push({ label: ranked[1].row.label, href: ranked[1].row.href });
        if (ranked[2]) actions.push({ label: ranked[2].row.label, href: ranked[2].row.href });
      return {
          reply: "Closest page match: " + (top.blurb || top.label) + ". Open it below — ask again with another keyword to narrow further.",
          actions: actions.slice(0, 4)
        };
      }
      return {
        reply:
          "No strong keyword match yet. Use the hubs below to find any function, then ask me with words you see on that page (for example affiliate, insurance, passport).",
        actions: [
          { label: "Browse all categories", href: "./browse-categories.html" },
          { label: "Regional + live market", href: "./regional-shops.html" },
          { label: "Global search", href: "./global-search.html" },
          { label: "Account hub", href: "./account-hub.html" }
        ]
      };
    }

    function sanitizeBrandonLlmActions(raw) {
      var hrefOk = /^\.\/[a-z0-9._-]+\.html(\?[a-z0-9._=&%-]*)?(#[-a-z0-9._]*)?$/i;
      if (!Array.isArray(raw)) {
        return [];
      }
      var out = [];
      for (var i = 0; i < raw.length && out.length < 4; i++) {
        var a = raw[i];
        if (!a || typeof a !== "object") continue;
        var href = String(a.href || "")
          .trim()
          .replace(/\s+/g, "");
        var label = String(a.label || "Open")
          .trim()
          .slice(0, 48);
        if (!hrefOk.test(href)) continue;
        if (/^(javascript|data):/i.test(href)) continue;
        if (href.length > 220) continue;
        out.push({ label: label || "Open", href: href });
      }
      return out;
    }

    var BRANDON_FASHION_GRID_HREF_RE = /cat\s*=\s*fashion|lane\s*=\s*fashion/i;

    function finalizeBrandonLlmActionsForQuestion(question, rawActions) {
      var q = String(question || "").trim();
      var list = sanitizeBrandonLlmActions(rawActions);
      function dedupe(rows) {
        var seen = {};
        return rows.filter(function (row) {
          var h = String(row.href || "");
          if (seen[h]) return false;
          seen[h] = true;
          return true;
        });
      }
      list = dedupe(list);
      if (!brandonFashionLiveGridIntent(q)) {
        list = list.filter(function (row) {
          return !BRANDON_FASHION_GRID_HREF_RE.test(String(row.href || ""));
        });
      }
      if (!brandonFashionLiveGridIntent(q) && list.length === 1) {
        var only = String(list[0].href || "")
          .trim()
          .toLowerCase();
        if (only === "./hot-picks.html" || only.indexOf("./hot-picks.html?") === 0) {
          list = list.concat([
            { label: "Live market (all shops)", href: "./live-market-shops.html?cat=All&view=global&deal=best" },
            { label: "Global search", href: "./global-search.html" }
          ]);
          list = dedupe(list);
        }
      }
      if (!list.length) {
        return [
          { label: "Browse categories", href: "./browse-categories.html" },
          { label: "Global search", href: "./global-search.html" }
        ];
      }
      return list.slice(0, 4);
    }

    function tryBrandonLlmThenRules(text) {
      var trimmed = String(text || "").trim();
      if (brandonAskIsSensitiveCredentialsTopic(trimmed)) {
        return Promise.resolve(generateBrandonResponse(trimmed));
      }
      if (!brandonCloudAssistEnabled() || typeof window.vibecartAiGenerate !== "function") {
        return Promise.resolve(generateBrandonResponse(trimmed));
      }
      return window
        .vibecartAiGenerate("brandon_guide", {
          question: trimmed.slice(0, 500),
          pageUrl: typeof location !== "undefined" ? String(location.href || "").slice(0, 500) : "",
          path: (function () {
            try {
              return String(window.location.pathname || "").slice(0, 200);
            } catch {
              return "";
            }
          })(),
          displayName: (function () {
            try {
              return String(getUserDisplayName() || "").trim().slice(0, 80);
            } catch {
              return "";
            }
          })(),
          locale: (document.documentElement.lang || navigator.language || "en").slice(0, 12),
          recentQuestions: (function () {
            try {
              var p = loadAiProfile();
              return Array.isArray(p.notes) ? p.notes.slice(-5) : [];
            } catch {
              return [];
            }
          })(),
          diversityNonce: String(Date.now())
        })
        .then(function (res) {
          if (res && String(res.reply || "").trim()) {
            return {
              reply: String(res.reply || "").trim().slice(0, 1200),
              actions: finalizeBrandonLlmActionsForQuestion(text, res.actions)
            };
          }
          return generateBrandonResponse(text);
        })
        .catch(function () {
          return generateBrandonResponse(text);
        });
    }

    function detectInteractiveContext() {
      var profile = loadAiProfile();
      var y = 0;
      try {
        y = Number(window.scrollY || window.pageYOffset || 0);
      } catch {
        y = 0;
      }
      var advice = resolveAdvice(profile, y);
      if (advice.key === lastAdviceKey) {
        microCycle += 1;
        advice = resolveAdvice(profile, y);
      }
      lastAdviceKey = advice.key;
      return advice.line;
    }

    function isSensitiveElement(el) {
      if (!el || !el.closest) return false;
      if (el.closest("#vc-mobile-ai, .vc-mobile-ai")) return false;
      var field = el.closest("input,textarea,select");
      if (!field) return false;
      var type = String(field.getAttribute("type") || "").toLowerCase();
      var name = String(field.getAttribute("name") || "").toLowerCase();
      var id = String(field.getAttribute("id") || "").toLowerCase();
      var autocomplete = String(field.getAttribute("autocomplete") || "").toLowerCase();
      var holder = String(field.getAttribute("placeholder") || "").toLowerCase();
      var joined = name + " " + id + " " + autocomplete + " " + holder;
      if (type === "password") return true;
      if (/card|cvv|cvc|cc-number|cc-exp|iban|routing|account-number|sort-code|payment|billing|otp|mfa|secret|pin\b|ssn/.test(joined)) {
        return true;
      }
      if (type === "tel" && /card|cvv|otp|sms|verify/.test(joined)) return true;
      if (type === "number" && /cvv|cvc|card|exp|amount|security/.test(joined)) return true;
      var form = field.closest("form");
      if (form) {
        var formText = String(form.id || "") + " " + String(form.className || "");
        if (/payment|checkout|billing|card-form|owner-auth|admin-login/i.test(formText)) return true;
      }
      return false;
    }

    function setSensitiveMode(on) {
      try {
        var active = document.activeElement;
        if (active && active.closest && active.closest("#vc-mobile-ai, .vc-mobile-ai")) {
          on = false;
        }
      } catch {
        /* ignore */
      }
      wrap.classList.toggle("vc-mobile-ai--hidden", !!on);
      if (on) {
        panel?.setAttribute("hidden", "hidden");
        orb?.setAttribute("aria-expanded", "false");
      }
    }

    setMicro(detectInteractiveContext());
    refreshMicroVisibility();
    var scrollLock = false;
    window.addEventListener(
      "scroll",
      function () {
        if (scrollLock) return;
        scrollLock = true;
        window.setTimeout(function () {
          var y = 0;
          try {
            y = Number(window.scrollY || window.pageYOffset || 0);
          } catch {
            y = 0;
          }
          var delta = Math.abs(y - lastScrollY);
          lastScrollY = y;
          if (delta < 80) {
            refreshMicroVisibility();
            scrollLock = false;
            return;
          }
          microCycle += 1;
          setMicro(detectInteractiveContext());
          refreshMicroVisibility();
          scrollLock = false;
        }, 160);
      },
      { passive: true }
    );
    var lastMicroSetAt = 0;
    document.addEventListener(
      "click",
      function (ev) {
        var hit = ev.target && ev.target.closest ? ev.target.closest("a,button") : null;
        if (!hit) return;
        var now = Date.now();
        if (now - lastMicroSetAt < 900) return;
        lastMicroSetAt = now;
        var label = String(hit.textContent || "").trim().slice(0, 32);
        if (!label) return;
        var profile = loadAiProfile();
        profile.visits = Math.max(1, Number(profile.visits || 0));
        var low = label.toLowerCase();
        if (brandonFashionOrBeautyTipIntent(low)) profile.topIntent = "fashion";
        else if (/sell|hustle|business/.test(low)) profile.topIntent = "seller";
        else if (/\bhot\s*picks\b|deal|shop|market/.test(low)) profile.topIntent = "shopping";
        else if (/\b(orders?|tracking|delivery)\b/.test(low)) profile.topIntent = "orders";
        saveAiProfile(profile);
        setMicro(label + " tapped. I am with you.");
      },
      true
    );

    startVisibilityAwareInterval(function () {
      if (Date.now() < forceMicroVisibleUntil) {
        refreshMicroVisibility();
        return;
      }
      if (panel && !panel.hasAttribute("hidden")) {
        return;
      }
      if (Date.now() - lastMicroPromptAt < 7000) {
        return;
      }
      microCycle += 1;
      var contextual = detectInteractiveContext();
      setMicro(contextual + " Need help? Tap Brandon.");
      refreshMicroVisibility();
    }, 9000);
    document.addEventListener(
      "focusin",
      function (ev) {
        if (isSensitiveElement(ev.target)) {
          setSensitiveMode(true);
        }
      },
      true
    );
    document.addEventListener(
      "focusout",
      function () {
        window.setTimeout(function () {
          var active = document.activeElement;
          if (!isSensitiveElement(active)) {
            setSensitiveMode(false);
            setMicro(detectInteractiveContext());
          }
        }, 120);
      },
      true
    );

    (function introOnce() {
      try {
        var returningName = getUserDisplayName();
        if (returningName === "friend") {
          backfillDisplayNameFromSession().then(function (name) {
            if (!name) return;
            setMicro("Welcome back " + name + ". Brandon is ready to help. What are we looking for today?");
            forceMicroVisibleUntil = Date.now() + 12000;
            refreshMicroVisibility();
          });
        }
        var seenBefore = localStorage.getItem("vibecart-mobile-first-seen-v1");
        function firstPromptStillActive() {
          try {
            if (sessionStorage.getItem("vibecart-first-prompt-active-v1") === "1") return true;
            if (sessionStorage.getItem("vibecart-mobile-wow-done-v1") !== "1") return true;
          } catch {
            /* ignore */
          }
          if (document.getElementById("vcIntentBlast") || document.getElementById("vcFirst5Reveal")) return true;
          return false;
        }
        if (localStorage.getItem(introKey) === "1") {
          var delayWelcome = firstPromptStillActive();
          if (delayWelcome) {
            setMicro("Brandon is ready. Choose your lane first, then I will guide your next move.");
            var onFirstPromptDone = function () {
              var nameAfterPrompt = getUserDisplayName();
              window.setTimeout(function () {
                setMicro(
                  "Welcome back " + nameAfterPrompt + ". Brandon is ready to help. What are we looking for today?"
                );
                forceMicroVisibleUntil = Date.now() + 12000;
                refreshMicroVisibility();
              }, 180);
            };
            window.addEventListener("vibecart-first-prompt-complete", onFirstPromptDone, { once: true });
            return;
          }
          setMicro("Welcome back " + returningName + ". Brandon is ready to help. What are we looking for today?");
          forceMicroVisibleUntil = Date.now() + 12000;
          refreshMicroVisibility();
          return;
        }
        localStorage.setItem(introKey, "1");
        if (seenBefore) {
          var delayWelcomeForReturning = firstPromptStillActive();
          if (delayWelcomeForReturning) {
            setMicro("Brandon is ready. Choose your lane first, then I will guide your next move.");
            var onFirstPromptDoneReturning = function () {
              var nameAfterPromptReturning = getUserDisplayName();
              window.setTimeout(function () {
                setMicro(
                  "Welcome back " +
                    nameAfterPromptReturning +
                    ". Brandon is ready to help. What are we looking for today?"
                );
                forceMicroVisibleUntil = Date.now() + 12000;
                refreshMicroVisibility();
              }, 180);
            };
            window.addEventListener("vibecart-first-prompt-complete", onFirstPromptDoneReturning, { once: true });
            return;
          }
          setMicro("Welcome back " + returningName + ". Brandon is ready to help. What can I guide now?");
          forceMicroVisibleUntil = Date.now() + 12000;
          refreshMicroVisibility();
          return;
        }
      } catch {
        /* ignore */
      }
      setMicro("I am Brandon, your guide. I will learn your style and help you move faster.");
      forceMicroVisibleUntil = Date.now() + 9000;
      refreshMicroVisibility();
    })();

    function focusBrandonInput() {
      try {
        if (!ta) return;
        ta.removeAttribute("readonly");
        ta.removeAttribute("disabled");
        window.requestAnimationFrame(function () {
          try {
            ta.focus({ preventScroll: true });
          } catch {
            try {
              ta.focus();
            } catch {
              /* ignore */
            }
          }
        });
      } catch {
        /* ignore */
      }
    }

    orb?.addEventListener("click", () => {
      const open = panel?.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        orb.setAttribute("aria-expanded", "true");
        refreshBrandonQuickActions();
        hardPressVibrate();
        focusBrandonInput();
      } else {
        panel?.setAttribute("hidden", "hidden");
        orb.setAttribute("aria-expanded", "false");
      }
    });

    function brandonPanelInteractiveTarget(t) {
      try {
        return Boolean(t && t.closest && t.closest("textarea, input, select, button, a, label"));
      } catch {
        return false;
      }
    }
    orb?.addEventListener(
      "touchstart",
      (ev) => {
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        startY = Number(t.clientY || 0);
      },
      { passive: true }
    );
    orb?.addEventListener(
      "touchend",
      (ev) => {
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        const endY = Number(t.clientY || 0);
        if (startY - endY > 18 && panel?.hasAttribute("hidden")) {
          panel.removeAttribute("hidden");
          orb.setAttribute("aria-expanded", "true");
          refreshBrandonQuickActions();
          hardPressVibrate();
          focusBrandonInput();
        }
      },
      { passive: true }
    );
    panel?.addEventListener(
      "touchstart",
      (ev) => {
        if (brandonPanelInteractiveTarget(ev.target)) {
          return;
        }
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        startY = Number(t.clientY || 0);
      },
      { passive: true }
    );
    panel?.addEventListener(
      "touchend",
      (ev) => {
        if (brandonPanelInteractiveTarget(ev.target)) {
          return;
        }
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        const endY = Number(t.clientY || 0);
        if (endY - startY > 26) {
          panel.setAttribute("hidden", "hidden");
          orb?.setAttribute("aria-expanded", "false");
        }
      },
      { passive: true }
    );

    saveBtn?.addEventListener("click", function () {
      var text = ta && ta.value ? String(ta.value).trim() : "";
      if (!text) {
        hardPressVibrate();
        if (reply) {
          reply.textContent =
            "I am listening — type a short question (or try hello), then tap Ask Brandon. You can also use the chip buttons above.";
          reply.hidden = false;
        }
        focusBrandonInput();
        return;
      }
      hardPressVibrate();
      var textForLog = text;
      try {
        var key = "vibecart-mobile-ai-feedback-log";
        var prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push({ t: Date.now(), text: textForLog });
        localStorage.setItem(key, JSON.stringify(prev.slice(-40)));
        var profile = loadAiProfile();
        profile.notes = (profile.notes || []).concat([textForLog]).slice(-20);
        profile.visits = Number(profile.visits || 0) + 1;
        if (brandonFashionOrBeautyTipIntent(textForLog)) profile.topIntent = "fashion";
        if (/sell|seller|business|mybusiness/.test(textForLog.toLowerCase())) profile.topIntent = "seller";
        if (/\b(orders?|tracking|delivery)\b/.test(textForLog.toLowerCase())) profile.topIntent = "orders";
        saveAiProfile(profile);
      } catch {
        /* ignore */
      }

        if (reply) {
        reply.textContent = "Thinking…";
        reply.hidden = false;
      }
      if (saveBtn) {
        saveBtn.disabled = true;
      }
      tryBrandonLlmThenRules(textForLog)
        .then(function (result) {
          if (reply) {
          reply.textContent = result.reply;
          renderActionSuggestions(result.actions);
          paintBrandonWorldwideSlot(textForLog);
          reply.hidden = false;
        }
          if (ta) {
        ta.value = "";
          }
        if (saved) {
          saved.hidden = false;
            window.setTimeout(function () {
            saved.hidden = true;
          }, 2400);
        }
        })
        .catch(function () {
          if (reply) {
            var fb = generateBrandonResponse(textForLog);
            reply.textContent = fb.reply;
            renderActionSuggestions(fb.actions);
            paintBrandonWorldwideSlot(textForLog);
            reply.hidden = false;
          }
        })
        .finally(function () {
          if (saveBtn) {
            saveBtn.disabled = false;
          }
        });

      var base = readApiBase();
      if (base && textForLog.length >= 4) {
        var wid =
          typeof window !== "undefined" && window.__VC_INSTALL_ID__
            ? String(window.__VC_INSTALL_ID__).trim().slice(0, 64)
            : "";
        var payload = {
          text: textForLog,
          locale: (document.documentElement.lang || navigator.language || "").slice(0, 20),
          pageUrl: typeof location !== "undefined" ? String(location.href).slice(0, 512) : ""
        };
        if (wid.length >= 4) {
          payload.installId = wid;
        }
        fetch(base + "/api/public/mobile/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(function () {});
      }
    });
  }

  function enhanceHero() {
    const hero = document.querySelector(".hero");
    if (!hero || hero.querySelector(".vc-mobile-hero-aurora")) {
      return;
    }
    const aurora = document.createElement("div");
    aurora.className = "vc-mobile-hero-aurora";
    aurora.setAttribute("aria-hidden", "true");
    hero.insertBefore(aurora, hero.firstChild);
  }

  /**
   * Homepage (and other shells) do not load script.js, but CSS still expects
   * `main section.vc-revealed` for in-app scroll reveals. Mirror initVcMobileAppFx.
   */
  function ensureAppShopHubLink() {
    // Sticker removed by product request.
  }

  function registerNativePushIfAvailable() {
    try {
      var root = document.documentElement;
      if (!root.classList.contains("vc-mobile-app")) return;
      var pushToken = String((window && window.__VC_PUSH_TOKEN__) || "").trim();
      var installId = String((window && window.__VC_INSTALL_ID__) || "").trim().slice(0, 64);
      var platform = String((window && window.__VC_PUSH_PLATFORM__) || "").trim().toLowerCase();
      if (!pushToken || !installId) return;
      if (platform !== "android" && platform !== "ios") {
        platform = /iphone|ipad|ios/i.test(String(navigator.userAgent || "")) ? "ios" : "android";
      }
      var authToken = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
      var key = "vibecart-native-push-linked-v4";
      var sig = [installId, pushToken.slice(0, 22), platform, authToken.slice(0, 18)].join("|");
      if (localStorage.getItem(key) === sig) return;
      var headers = { "Content-Type": "application/json" };
      if (authToken) {
        headers.Authorization = "Bearer " + authToken;
      }
      if (authToken && window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
        headers = window.VibeCartSessionDevice.merge(authToken, headers);
      }
      fetch("/api/public/mobile/push/register", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          installId: installId,
          pushToken: pushToken,
          platform: platform,
          authToken: authToken || undefined
        })
      })
        .then(function (r) {
          return r.json().catch(function () {
            return {};
          });
        })
        .then(function (j) {
          if (j && j.ok) {
            localStorage.setItem(key, sig);
          }
        })
        .catch(function () {
          /* ignore push-link failures; we retry on next open */
        });
    } catch {
      /* ignore */
    }
  }

  function initMainSectionRevealForApp() {
    if (!document.documentElement.classList.contains("vc-mobile-app")) {
      return;
    }
    const main = document.querySelector("main");
    if (!main) {
      return;
    }
    main.classList.add("vc-mobile-feed");
    const nodes = Array.from(main.querySelectorAll("section"));
    /* Lane pages with forms (coach checkout): skip reveal transforms — fixed HUD + WebViews
       occasionally made taps feel dead until sections finished settling. */
    if (document.body && document.body.classList.contains("health-coach-page")) {
      nodes.forEach(function (el) {
        el.classList.add("vc-revealed");
      });
      return;
    }
    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!nodes.length) {
      return;
    }
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((el) => {
        el.classList.add("vc-revealed");
      });
      return;
    }
    const vh = window.innerHeight || 640;
    nodes.forEach((el, i) => {
      el.style.setProperty("--vc-reveal-d", `${Math.min(i, 14) * 42}ms`);
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.94) {
        el.classList.add("vc-revealed");
      }
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) {
            return;
          }
          en.target.classList.add("vc-revealed");
          io.unobserve(en.target);
        });
      },
      { root: null, rootMargin: "0px 0px -5% 0px", threshold: [0, 0.07, 0.14] }
    );
    nodes.forEach((el) => {
      if (!el.classList.contains("vc-revealed")) {
        io.observe(el);
      }
    });
  }

  function initMobileFocusMode() {
    var root = document.documentElement;
    var key = "vibecart-mobile-focus-mode-v1";
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
    function apply(on) {
      root.classList.toggle("vc-mobile-focus", !!on);
    }
    var nav = document.getElementById("mobileQuickNav");
    if (!nav || document.getElementById("vcMobileFocusToggle")) {
      apply(read());
      return;
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "vcMobileFocusToggle";
    btn.className = "vc-mobile-focus-toggle";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "Focus";
    nav.appendChild(btn);
    function paint() {
      var on = read();
      apply(on);
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Focus on" : "Focus";
    }
    btn.addEventListener("click", function () {
      var next = !read();
      write(next);
      paint();
      try {
        if (navigator && navigator.vibrate) navigator.vibrate(next ? [10, 30, 12] : 12);
      } catch {
        /* ignore */
      }
    });
    paint();
  }

  function initThumbFlowBoost() {
    var nav = document.getElementById("mobileQuickNav");
    if (!nav) return;
    var anchors = Array.from(nav.querySelectorAll("a"));
    anchors.forEach(function (a) {
      a.addEventListener("click", function () {
        try {
          if (navigator && navigator.vibrate) navigator.vibrate(10);
        } catch {
          /* ignore */
        }
      });
      try {
        var href = String(a.getAttribute("href") || "");
        if (href && window.location && window.location.pathname && href.indexOf(window.location.pathname) >= 0) {
          a.classList.add("is-active");
        }
      } catch {
        /* ignore */
      }
    });
  }

  function initTrustSnapshotCard() {
    var heroCopy = document.querySelector(".hero-copy");
    if (!heroCopy || document.getElementById("vcMobileTrustSnapshot")) return;
    var card = document.createElement("div");
    card.id = "vcMobileTrustSnapshot";
    card.className = "vc-mobile-trust-snapshot";
    card.innerHTML =
      "<strong>Live trust snapshot</strong>" +
      "<span>Verified sellers · Guarded payments · Tracked delivery</span>";
    var actions = heroCopy.querySelector(".hero-actions");
    if (actions && actions.parentNode === heroCopy) {
      heroCopy.insertBefore(card, actions);
    } else {
      heroCopy.appendChild(card);
    }
  }

  function initFirstFiveWowExperience(forceAfterCinematic) {
    var isMobileShell =
      document.documentElement.classList.contains("vc-mobile-app") ||
      document.documentElement.classList.contains("vc-phone");
    if (!isMobileShell) return;
    try {
      if (
        sessionStorage.getItem("vibecart-mobile-wow-first5-v1") === "1" &&
        sessionStorage.getItem("vibecart-mobile-wow-done-v1") !== "1"
      ) {
        sessionStorage.setItem("vibecart-mobile-wow-done-v1", "1");
      }
    } catch {
      /* ignore */
    }
    var heroCopy = document.querySelector(".hero-copy");
    if (!heroCopy) return;
    try {
      // Only block on the cinematic close event when the opener actually mounted.
      // Otherwise WOW-off / skipped opener / stale session keys would wait forever and strand first‑5 + intro UI.
      var cineActive = !forceAfterCinematic && !!document.getElementById("vcThreeSecondCinematic");
      if (cineActive) {
        var cineTimer = null;
        var ran = false;
        var runAfterCine = function () {
          if (ran) return;
          ran = true;
          if (cineTimer) window.clearTimeout(cineTimer);
          try {
            window.removeEventListener("vibecart-cinematic-done", runAfterCine);
          } catch {
            /* ignore */
          }
          try {
            initFirstFiveWowExperience(true);
          } catch {
            /* ignore */
          }
        };
        window.addEventListener("vibecart-cinematic-done", runAfterCine, { once: true });
        cineTimer = window.setTimeout(runAfterCine, 7200);
        return;
      }
    } catch {
      /* ignore */
    }
    var heroTitle = document.getElementById("heroTitle");
    var heroSubtitle = document.getElementById("heroSubtitle");
    var heroPrimary = document.getElementById("heroShopNowBtn");
    var onboardingBtn = document.getElementById("openOnboarding");

    function applyIntent(intent) {
      var t = String(intent || "buy").toLowerCase();
      var map = {
        buy: {
          title: "Deals, bakers, barbers, and beauty — trusted checkout in seconds.",
          sub: "Buyer mode on. Brandon will prioritize quick deals, safe payments, and fast routes.",
          cta: "Show me best deals now",
          href: "./live-market-shops.html?cat=All&view=global&deal=best"
        },
        sell: {
          title: "Launch your selling lane and grow faster.",
          sub: "Seller mode on. Brandon will guide listings, conversion tips, and growth tools.",
          cta: "Start selling now",
          href: "./sell-journey.html"
        },
        fast: {
          title: "Speed lane unlocked for instant wins.",
          sub: "Fast mode on. Brandon will push shortest paths to hot picks, tracking, and checkout.",
          cta: "Launch speed lane",
          href: "./hot-picks.html"
        },
        book: {
          title: "Beauty, barber, nails, and bakery — book a live offer in minutes.",
          sub: "Service booking mode. Brandon will keep you on the fastest safe path to reserve.",
          cta: "Open booking desk",
          href: "./my-business.html?flow=book"
        }
      };
      var picked = map[t] || map.buy;
      if (heroTitle) heroTitle.textContent = picked.title;
      if (heroSubtitle) heroSubtitle.textContent = picked.sub;
      if (heroPrimary) {
        heroPrimary.textContent = picked.cta;
        if (picked.href && heroPrimary.tagName === "A") {
          heroPrimary.setAttribute("href", picked.href);
        }
      }
      try {
        localStorage.setItem("vibecart-mobile-wow-intent-v1", t);
      } catch {
        /* ignore */
      }
    }

    function inferDefaultIntentFallback() {
      return "buy";
    }

    async function fetchFirst5BackendState() {
      var base = readApiBase();
      if (!base) return null;
      try {
        var tz = "";
        var locale = "";
        try {
          tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
          locale = String(navigator.language || "");
        } catch {
          tz = "";
          locale = "";
        }
        var cc = "";
        try {
          var rawUser = localStorage.getItem("vibecart-public-auth-user");
          var user = rawUser ? JSON.parse(rawUser) : null;
          cc = user && user.countryCode ? String(user.countryCode) : "";
        } catch {
          cc = "";
        }
        var qs =
          "?locale=" +
          encodeURIComponent(locale) +
          "&timezone=" +
          encodeURIComponent(tz) +
          "&countryCode=" +
          encodeURIComponent(cc);
        var response = await fetch(base + "/api/public/mobile/first5/state" + qs, { method: "GET" });
        var body = await response.json().catch(function () {
          return {};
        });
        if (!response.ok || !body || !body.ok || !body.first5) return null;
        return body.first5;
      } catch {
        return null;
      }
    }

    var storedIntent = "";
    try {
      storedIntent = String(localStorage.getItem("vibecart-mobile-wow-intent-v1") || "").trim().toLowerCase();
    } catch {
      storedIntent = "";
    }
    // Keep homepage default anchored to global live market (buy lane) unless user just picked a lane in this visit.
    var visitLaneIntent = "";
    try {
      visitLaneIntent = String(sessionStorage.getItem("vibecart-lane-picked-this-visit-v1") || "").trim().toLowerCase();
    } catch {
      visitLaneIntent = "";
    }
    var initialIntent = visitLaneIntent || (storedIntent === "sell" || storedIntent === "fast" ? storedIntent : "buy");
    applyIntent(initialIntent || inferDefaultIntentFallback());

    if (!document.getElementById("vcFirst5Proof")) {
      var proof = document.createElement("div");
      proof.id = "vcFirst5Proof";
      proof.className = "vc-first5-proof";
      proof.textContent = "Live now: 42 shoppers active · 9 deals closing · 3 sellers verified";
      heroCopy.insertBefore(proof, heroCopy.firstChild);
    }

    if (!document.getElementById("vcFirst5AiLine")) {
      var aiLine = document.createElement("p");
      aiLine.id = "vcFirst5AiLine";
      aiLine.className = "vc-first5-ai-line";
      aiLine.textContent = "Brandon insight: I can map your fastest safe route in one tap.";
      heroCopy.insertBefore(aiLine, heroCopy.firstChild);
    }

    if (!document.getElementById("vcFirst5Urgency")) {
      var urgency = document.createElement("p");
      urgency.id = "vcFirst5Urgency";
      urgency.className = "vc-first5-urgency";
      var endAt = Date.now() + 15 * 60 * 1000;
      function paintUrgency() {
        var left = Math.max(0, endAt - Date.now());
        var mm = String(Math.floor(left / 60000)).padStart(2, "0");
        var ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
        urgency.textContent = "Flash lane offer ends in " + mm + ":" + ss;
      }
      paintUrgency();
      startVisibilityAwareInterval(paintUrgency, 1000);
      var badge = document.getElementById("heroBadge");
      if (badge && badge.parentNode) {
        badge.parentNode.insertBefore(urgency, badge.nextSibling);
      } else {
        heroCopy.insertBefore(urgency, heroCopy.firstChild);
      }
    }

    fetchFirst5BackendState().then(function (state) {
      if (!state || typeof state !== "object") return;
      var fallbackIntent = inferDefaultIntentFallback();
      if (!storedIntent) {
        applyIntent(String(state.intentDefault || fallbackIntent).toLowerCase());
      }
      var aiLineEl = document.getElementById("vcFirst5AiLine");
      if (aiLineEl && state.brandon && state.brandon.insight) {
        aiLineEl.textContent = "Brandon insight: " + String(state.brandon.insight).slice(0, 140);
      }
      var proofEl = document.getElementById("vcFirst5Proof");
      if (proofEl && state.proof) {
        var active = Number(state.proof.activeShoppers || 0);
        var closing = Number(state.proof.closingDeals || 0);
        var verified = Number(state.proof.verifiedSellers || 0);
        proofEl.textContent =
          "Live now: " + active + " shoppers active · " + closing + " deals closing · " + verified + " sellers verified";
      }
      if (state.flash && state.flash.endsAt) {
        var parsed = Date.parse(String(state.flash.endsAt));
        if (Number.isFinite(parsed) && parsed > 0) {
          endAt = parsed;
        }
      }
    });

    if (!document.getElementById("vcStarterPackCard")) {
      var starter = document.createElement("div");
      starter.id = "vcStarterPackCard";
      starter.className = "vc-starter-pack";
      starter.innerHTML =
        "<strong>Your 30-second starter pack</strong>" +
        "<p>1) Choose lane  2) Verify trust  3) Move fast with Brandon</p>" +
        "<div class='hero-actions'>" +
        "<a class='btn btn-primary' href='./hot-picks.html'>Start now</a>" +
        "<a class='btn btn-secondary' href='./legal-settings.html'>Safety first</a>" +
        "</div>";
      var actions = heroCopy.querySelector(".hero-actions");
      if (actions && actions.parentNode === heroCopy) {
        heroCopy.insertBefore(starter, actions);
      } else {
        heroCopy.appendChild(starter);
      }
    }

    function showIntentBlast() {
      if (document.getElementById("vcIntentBlast")) return;
      try {
        sessionStorage.setItem("vibecart-first-prompt-active-v1", "1");
      } catch {
        /* ignore */
      }
      document.body.classList.add("vc-intro-blocking");
        if (document.getElementById("vcIntentBlast")) return;
        var splash = document.createElement("div");
        splash.id = "vcIntentBlast";
      splash.className = "vc-intent-blast vc-intent-blast--morph";
        splash.innerHTML =
          "<div class='vc-intent-blast__card'>" +
          "<p class='badge'>Welcome to your wow lane</p>" +
          "<h3>Choose your power start</h3>" +
          "<p class='note'>Browse first — account prompts appear when you reserve or check out.</p>" +
          "<div class='vc-intent-blast__grid'>" +
          "<button type='button' class='vc-intent-blast__btn' data-intent='buy'>I want to Buy</button>" +
          "<button type='button' class='vc-intent-blast__btn' data-intent='sell'>I want to Sell</button>" +
          "<button type='button' class='vc-intent-blast__btn' data-intent='book'>I want to Book</button>" +
          "<button type='button' class='vc-intent-blast__btn' data-intent='fast'>Fast Deals</button>" +
          "</div>" +
          "<button type='button' class='btn btn-secondary vc-intent-blast__skip' id='vcIntentBlastSkip'>Skip</button>" +
          "</div>";
        document.body.appendChild(splash);
      window.setTimeout(function () {
        splash.classList.add("is-active");
        splash.classList.add("vc-intent-blast--pulse-bridge");
        window.setTimeout(function () {
          splash.classList.remove("vc-intent-blast--pulse-bridge");
        }, 900);
        document.body.classList.remove("vc-intro-pulse-bridge");
      }, 20);

        function closeSplash(reason, intent) {
          if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
          document.body.classList.remove("vc-intro-pulse-bridge");
          document.body.classList.remove("vc-intro-blocking");
          try {
            sessionStorage.setItem("vibecart-first-prompt-active-v1", "0");
            sessionStorage.setItem("vibecart-mobile-wow-done-v1", "1");
            sessionStorage.setItem("vibecart-mobile-wow-first5-v1", "1");
          } catch {
            /* ignore */
          }
          try {
            window.dispatchEvent(
              new CustomEvent("vibecart-first-prompt-complete", {
                detail: { reason: String(reason || "close"), intent: String(intent || "") }
              })
            );
          } catch {
            /* ignore */
          }
        }
        splash.addEventListener("click", function (ev) {
          var btn = ev.target && ev.target.closest ? ev.target.closest("[data-intent]") : null;
          if (!btn) return;
          var intent = String(btn.getAttribute("data-intent") || "buy");
          try {
            sessionStorage.setItem("vibecart-lane-picked-this-visit-v1", intent);
          } catch {
            /* ignore */
          }
          applyIntent(intent);
          if (onboardingBtn) onboardingBtn.textContent = "Health coach";
          try {
            if (navigator && navigator.vibrate) navigator.vibrate([10, 24, 10]);
          } catch {
            /* ignore */
          }
          if (intent === "book") {
            closeSplash("intent", intent);
            warpTo("./my-business.html?flow=book");
            return;
          }
          if (intent === "buy") {
            closeSplash("intent", intent);
            warpTo("./live-market-shops.html?cat=All&view=global&deal=best");
            return;
          }
          if (intent === "sell") {
            closeSplash("intent", intent);
            warpTo("./sell-journey.html");
            return;
          }
          if (intent === "fast") {
            closeSplash("intent", intent);
            warpTo("./hot-picks.html");
            return;
          }
          closeSplash("intent", intent);
        });
        document.getElementById("vcIntentBlastSkip")?.addEventListener("click", function () {
          closeSplash("skip", "");
        });
    }

    var seenThisSession = false;
    try {
      seenThisSession = sessionStorage.getItem("vibecart-mobile-wow-done-v1") === "1";
    } catch {
      seenThisSession = false;
    }
    if (seenThisSession) return;
    var welcomeSheet = document.getElementById("vcMobileWelcomeSheet");
    if (welcomeSheet) {
      var onWelcomeDone = function () {
        window.removeEventListener("vibecart-mobile-welcome-closed", onWelcomeDone);
        showIntentBlast();
      };
      window.addEventListener("vibecart-mobile-welcome-closed", onWelcomeDone);
      return;
    }
    showIntentBlast();
  }

  function initDailyWelcomeSheet() {
    var firstSeenKey = "vibecart-mobile-first-seen-v1";
    var lastSeenKey = "vibecart-mobile-last-seen-v1";
    var introSessionKey = "vibecart-mobile-intro-session-v1";
    if (document.getElementById("vcMobileWelcomeSheet")) return;
    try {
      if (sessionStorage.getItem(introSessionKey) === "1") return;
    } catch {
      /* ignore */
    }
    var now = Date.now();
    var firstSeen = 0;
    var returning = false;
    try {
      firstSeen = Number(localStorage.getItem(firstSeenKey) || "0");
      if (!firstSeen) {
        localStorage.setItem(firstSeenKey, String(now));
        firstSeen = now;
      }
      var lastSeen = Number(localStorage.getItem(lastSeenKey) || "0");
      returning = lastSeen > 0;
      localStorage.setItem(lastSeenKey, String(now));
    } catch {
      returning = false;
    }
    try {
      sessionStorage.setItem(introSessionKey, "1");
    } catch {
      /* ignore */
    }

    var badge = "";
    var title = "Continue to your wow lane";
    var note = returning
      ? "Your trusted routes, saved rhythm, and Brandon guidance are ready. Tap to continue where you left off."
      : "You are entering a secure, captivating market story across Africa, Europe, and Asia. Tap to browse and unlock what others are only hearing about.";
    var sheet = document.createElement("div");
    sheet.id = "vcMobileWelcomeSheet";
    sheet.className = "vc-mobile-welcome-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    var badgeHtml = badge ? "<p class='badge'>" + badge + "</p>" : "";
    sheet.innerHTML =
      "<div class='vc-mobile-welcome-card vc-mobile-intro-card'>" +
      badgeHtml +
      "<h3>" + title + "</h3>" +
      "<p class='note'>" + note + "</p>" +
      "<div class='hero-actions'>" +
      "<button type='button' class='btn btn-primary vc-intro-browse-pulse' id='vcMobileWelcomeClose'>" +
      (returning ? "Continue" : "Tap to browse") +
      "</button>" +
      "</div>" +
      "</div>";
    document.body.appendChild(sheet);
    var close = document.getElementById("vcMobileWelcomeClose");
    function dismiss() {
      if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
      try {
        window.dispatchEvent(new CustomEvent("vibecart-mobile-welcome-closed", { detail: { returning: returning } }));
      } catch {
        /* ignore */
      }
    }
    close && close.addEventListener("click", dismiss);
    sheet.addEventListener("click", function (ev) {
      if (ev.target === sheet) dismiss();
    });
  }

  function initDailyStreakChip() {
    if (document.getElementById("vcMobileStreakChip")) return;
    var key = "vibecart-mobile-streak-v1";
    var lastKey = "vibecart-mobile-streak-date-v1";
    var today = new Date().toISOString().slice(0, 10);
    var streak = 1;
    try {
      streak = Math.max(1, Number(localStorage.getItem(key) || "1"));
      var last = String(localStorage.getItem(lastKey) || "");
      if (last !== today) {
        var d0 = new Date(last + "T00:00:00Z").getTime();
        var d1 = new Date(today + "T00:00:00Z").getTime();
        var days = Math.round((d1 - d0) / 86400000);
        if (days === 1) streak += 1;
        if (days > 1) streak = 1;
        localStorage.setItem(key, String(streak));
        localStorage.setItem(lastKey, today);
      }
    } catch {
      streak = 1;
    }
    var chip = document.createElement("button");
    chip.type = "button";
    chip.id = "vcMobileStreakChip";
    chip.className = "vc-mobile-streak-chip";
    chip.setAttribute("aria-label", "Daily vibe streak");
    chip.textContent = "🔥 " + streak + " day streak";
    document.body.appendChild(chip);
    chip.addEventListener("click", function () {
      try {
        if (navigator && navigator.vibrate) navigator.vibrate([8, 24, 10]);
      } catch {
        /* ignore */
      }
      chip.classList.add("is-pop");
      window.setTimeout(function () {
        chip.classList.remove("is-pop");
      }, 650);
    });
  }

  function initQuickActionSheet() {
    var nav = document.getElementById("mobileQuickNav");
    if (document.getElementById("vcQuickActionSheet")) return;
    var trigger = document.getElementById("vcQuickActionTrigger");
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.id = "vcQuickActionTrigger";
      trigger.className = "vc-quick-action-trigger";
      trigger.textContent = "Quick";
      trigger.setAttribute("aria-label", "Open quick shopping actions");
      trigger.setAttribute("title", "Quick actions: best offers, hot picks, track order");
      trigger.setAttribute("aria-expanded", "false");
      document.body.appendChild(trigger);
    }
    var sheet = document.createElement("div");
    sheet.id = "vcQuickActionSheet";
    sheet.className = "vc-quick-action-sheet";
    sheet.setAttribute("aria-hidden", "true");
    sheet.style.display = "none";
    sheet.innerHTML =
      "<div class='vc-quick-action-card'>" +
      "<p class='badge'>Quick actions</p>" +
      "<h3>One-thumb speed lane</h3>" +
      "<div class='hero-actions'>" +
      "<a class='btn btn-primary' href='./live-market-shops.html?cat=All&view=global&deal=best'>Best offers</a>" +
      "<a class='btn btn-secondary' href='./hot-picks.html'>Hot picks</a>" +
      "<a class='btn btn-secondary' href='./orders-tracking.html'>Track order</a>" +
      "<button type='button' class='btn btn-secondary' id='vcQuickActionClose'>Close</button>" +
      "</div>" +
      "</div>";
    document.body.appendChild(sheet);
    var close = document.getElementById("vcQuickActionClose");
    var openLockUntil = 0;
    var lastTriggerTouchAt = 0;
    var dragStartY = 0;
    var pressStartY = 0;
    var pressStartX = 0;
    var pressing = false;
    var navMoveAbort = false;
    function isOpen() {
      return sheet.classList.contains("is-open");
    }
    function open() {
      var now = Date.now();
      if (now < openLockUntil) return;
      if (isOpen()) return;
      sheet.style.display = "grid";
      sheet.classList.add("is-open");
      sheet.setAttribute("aria-hidden", "false");
      trigger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      try {
        if (navigator && navigator.vibrate) navigator.vibrate([12, 30, 12]);
      } catch {
        /* ignore */
      }
    }
    function hide() {
      sheet.classList.remove("is-open");
      sheet.style.display = "none";
      sheet.setAttribute("aria-hidden", "true");
      trigger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      openLockUntil = Date.now() + 420;
    }
    function forceClose(ev) {
      if (ev) {
        ev.preventDefault();
        if (typeof ev.stopImmediatePropagation === "function") {
          ev.stopImmediatePropagation();
        }
        ev.stopPropagation();
      }
      hide();
    }
    close && close.addEventListener("click", forceClose);
    close && close.addEventListener("touchend", forceClose, { passive: false });
    close && close.addEventListener("pointerup", forceClose);
    /* One toggle per physical tap: pointerup + touchend + click all fire on many WebViews;
       stacking them re-opened then closed the sheet instantly (felt dead). */
    var skipQuickSyntheticClick = false;
    function onTriggerActivate(ev) {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      if (isOpen()) {
        hide();
      } else {
        open();
      }
    }
    trigger.addEventListener("touchend", function (ev) {
      lastTriggerTouchAt = Date.now();
      skipQuickSyntheticClick = true;
      onTriggerActivate(ev);
    }, { passive: false });
    trigger.addEventListener("click", function (ev) {
      if (skipQuickSyntheticClick) {
        skipQuickSyntheticClick = false;
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      if (Date.now() - lastTriggerTouchAt < 650) {
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      onTriggerActivate(ev);
    });
    document.addEventListener("keydown", function (ev) {
      if (!ev) return;
      if (String(ev.key || "") === "Escape" && isOpen()) {
        hide();
      }
    });
    sheet.addEventListener("click", function (ev) {
      if (ev.target === sheet) hide();
    });
    function routeFromActionLink(ev) {
      var link = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!link) return;
      ev.preventDefault();
      if (typeof ev.stopImmediatePropagation === "function") {
        ev.stopImmediatePropagation();
      }
      ev.stopPropagation();
      var href = String(link.getAttribute("href") || "").trim();
      hide();
      if (!href) return;
      window.setTimeout(function () {
        window.location.assign(href);
      }, 24);
    }
    sheet.addEventListener("click", routeFromActionLink);
    sheet.addEventListener("touchend", routeFromActionLink, { passive: false });
    sheet.addEventListener("touchstart", function (ev) {
      var t = ev.changedTouches && ev.changedTouches[0];
      if (!t) return;
      dragStartY = Number(t.clientY || 0);
    }, { passive: true });
    sheet.addEventListener("touchend", function (ev) {
      var t = ev.changedTouches && ev.changedTouches[0];
      if (!t) return;
      var endY = Number(t.clientY || 0);
      if (endY - dragStartY > 44) {
        hide();
      }
    }, { passive: true });
    if (nav) {
      var timer = 0;
      nav.addEventListener("touchstart", function (ev) {
        if (isOpen()) return;
        var t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        var target = ev.target;
        if (target && target.closest && target.closest("a,button,input,textarea,select,[role='button']")) {
          return;
        }
        pressStartY = Number(t.clientY || 0);
        pressStartX = Number(t.clientX || 0);
        pressing = true;
        navMoveAbort = false;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          if (!pressing || navMoveAbort) return;
          open();
        }, 560);
      }, { passive: true });
      nav.addEventListener("touchmove", function (ev) {
        if (!pressing) return;
        var t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        var dy = Math.abs(Number(t.clientY || 0) - pressStartY);
        var dx = Math.abs(Number(t.clientX || 0) - pressStartX);
        if (dy > 12 || dx > 12) {
          navMoveAbort = true;
          window.clearTimeout(timer);
        }
      }, { passive: true });
      nav.addEventListener("touchend", function () {
        pressing = false;
        window.clearTimeout(timer);
      }, { passive: true });
      nav.addEventListener("touchcancel", function () {
        pressing = false;
        window.clearTimeout(timer);
      }, { passive: true });
      window.addEventListener("scroll", function () {
        window.clearTimeout(timer);
      }, { passive: true });
      nav.addEventListener("contextmenu", function (ev) {
        ev.preventDefault();
        open();
      });
    }
  }

  function initDealDraftComposer() {
    if (document.getElementById("vcDealDraftComposer")) return;
    var shell = document.createElement("div");
    shell.id = "vcDealDraftComposer";
    shell.className = "vc-deal-draft-composer";
    shell.innerHTML =
      "<button type='button' class='vc-deal-draft-fab' aria-expanded='false'>＋ Deal note</button>" +
      "<div class='vc-deal-draft-panel' hidden>" +
      "<p class='badge'>Deal draft</p>" +
      "<textarea id='vcDealDraftText' rows='2' maxlength='240' placeholder='Drop a quick note: what deal are you chasing?'></textarea>" +
      "<div class='hero-actions'>" +
      "<button type='button' class='btn btn-primary' id='vcDealDraftSave'>Save</button>" +
      "<button type='button' class='btn btn-secondary' id='vcDealDraftClose'>Close</button>" +
      "</div>" +
      "</div>";
    document.body.appendChild(shell);
    var fab = shell.querySelector(".vc-deal-draft-fab");
    var panel = shell.querySelector(".vc-deal-draft-panel");
    var text = shell.querySelector("#vcDealDraftText");
    var save = shell.querySelector("#vcDealDraftSave");
    var close = shell.querySelector("#vcDealDraftClose");
    function toggle(open) {
      panel.hidden = !open;
      fab.setAttribute("aria-expanded", open ? "true" : "false");
    }
    fab && fab.addEventListener("click", function () {
      toggle(panel.hidden);
    });
    close && close.addEventListener("click", function () {
      toggle(false);
    });
    save && save.addEventListener("click", function () {
      var v = String((text && text.value) || "").trim();
      if (!v) return;
      try {
        var key = "vibecart-mobile-deal-draft-v1";
        var prev = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(prev)) prev = [];
        prev.push({ t: Date.now(), note: v });
        localStorage.setItem(key, JSON.stringify(prev.slice(-60)));
      } catch {
        /* ignore */
      }
      text.value = "";
      toggle(false);
    });
  }

  function initStoryRail() {
    if (document.getElementById("vcStoryRail")) return;
    var hero = document.querySelector(".hero-copy");
    if (!hero) return;
    var rail = document.createElement("div");
    rail.id = "vcStoryRail";
    rail.className = "vc-story-rail";
    rail.innerHTML =
      "<button type='button' class='vc-story-pill' data-href='./live-market-shops.html?cat=Fashion&view=global&deal=fashion'>Drip drops</button>" +
      "<button type='button' class='vc-story-pill' data-href='./hot-picks.html'>Hot now</button>" +
      "<button type='button' class='vc-story-pill' data-href='./sell-journey.html'>Side hustle</button>" +
      "<button type='button' class='vc-story-pill' data-href='./orders-tracking.html'>Track vibe</button>";
    var actions = hero.querySelector(".hero-actions");
    if (actions && actions.parentNode === hero) {
      hero.insertBefore(rail, actions);
    } else {
      hero.appendChild(rail);
    }
    rail.addEventListener("click", function (ev) {
      var pill = ev.target && ev.target.closest ? ev.target.closest(".vc-story-pill") : null;
      if (!pill) return;
      var href = String(pill.getAttribute("data-href") || "").trim();
      if (!href) return;
      try {
        if (navigator && navigator.vibrate) navigator.vibrate([8, 22, 8]);
      } catch {
        /* ignore */
      }
      window.location.assign(href);
    });
  }

  function initSwipeSaveDeals() {
    var cards = Array.from(document.querySelectorAll(".shop-folder-card, .vc-promo-card, .shop"));
    if (!cards.length) return;
    cards.slice(0, 22).forEach(function (card, idx) {
      if (!card || card.getAttribute("data-vc-swipe-save") === "1") return;
      card.setAttribute("data-vc-swipe-save", "1");
      var startX = 0;
      var moved = false;
      card.addEventListener("touchstart", function (ev) {
        var t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        startX = Number(t.clientX || 0);
        moved = false;
      }, { passive: true });
      card.addEventListener("touchmove", function (ev) {
        var t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        var dx = Number(t.clientX || 0) - startX;
        if (Math.abs(dx) > 14) moved = true;
        if (dx > 16) {
          card.style.transform = "translateX(" + Math.min(dx, 32) + "px)";
        }
      }, { passive: true });
      card.addEventListener("touchend", function (ev) {
        var t = ev.changedTouches && ev.changedTouches[0];
        if (!t) {
          card.style.transform = "";
          return;
        }
        var dx = Number(t.clientX || 0) - startX;
        card.style.transform = "";
        if (!moved || dx < 44) return;
        var key = "vibecart-mobile-saved-deals-v1";
        var title = "";
        try {
          var h = card.querySelector("h3");
          title = String((h && h.textContent) || ("deal-" + idx)).trim();
          var prev = JSON.parse(localStorage.getItem(key) || "[]");
          if (!Array.isArray(prev)) prev = [];
          prev.push({ t: Date.now(), title: title.slice(0, 120) });
          localStorage.setItem(key, JSON.stringify(prev.slice(-80)));
        } catch {
          /* ignore */
        }
        card.classList.add("vc-saved-pop");
        window.setTimeout(function () {
          card.classList.remove("vc-saved-pop");
        }, 700);
        try {
          if (navigator && navigator.vibrate) navigator.vibrate([10, 28, 12]);
        } catch {
          /* ignore */
        }
      }, { passive: true });
    });
  }

  function initSocialPulseTicker() {
    if (document.getElementById("vcSocialPulse")) return;
    var host = document.querySelector(".hero-copy");
    if (!host) return;
    var el = document.createElement("p");
    el.id = "vcSocialPulse";
    el.className = "vc-social-pulse";
    host.appendChild(el);
    var lines = [
      "27 people checking Fashion deals right now",
      "14 sellers publishing this hour",
      "92% of recent buyers opened tracked orders first",
      "Top route now: Global -> Fashion -> Best bargains"
    ];
    var i = 0;
    function paint() {
      el.textContent = "● " + lines[i % lines.length];
      i += 1;
    }
    paint();
    startVisibilityAwareInterval(paint, 3400);
  }

  function initInboxPulse() {
    if (document.getElementById("vcMobileInboxPulse")) return;
    var key = "vibecart-public-inbox-unread-v1";
    var pill = document.createElement("button");
    pill.type = "button";
    pill.id = "vcMobileInboxPulse";
    pill.className = "vc-mobile-streak-chip";
    function paint() {
      var unread = 0;
      try {
        unread = Math.max(0, Number(localStorage.getItem(key) || "0"));
      } catch {
        unread = 0;
      }
      if (unread <= 0) {
        pill.style.display = "none";
        return;
      }
      pill.style.display = "";
      pill.textContent = "Inbox " + unread;
    }
    pill.addEventListener("click", function () {
      try {
        localStorage.setItem(key, "0");
      } catch {
        /* ignore */
      }
      paint();
      window.location.assign("./seller-messages.html");
    });
    window.addEventListener("storage", paint);
    paint();
    document.body.appendChild(pill);
  }

  function initVibeThemeSwitch() {
    var key = "vibecart-mobile-vibe-theme-v1";
    var nav = document.getElementById("mobileQuickNav");
    if (!nav || document.getElementById("vcVibeModeBtn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "vcVibeModeBtn";
    btn.className = "vc-vibe-mode-btn";
    nav.appendChild(btn);
    function read() {
      try {
        return String(localStorage.getItem(key) || "night");
      } catch {
        return "night";
      }
    }
    function write(v) {
      try {
        localStorage.setItem(key, v);
      } catch {
        /* ignore */
      }
    }
    function paint() {
      var v = read();
      document.documentElement.classList.toggle("vc-vibe-neon", v === "neon");
      btn.textContent = v === "neon" ? "Neon on" : "Neon";
      btn.classList.toggle("is-on", v === "neon");
    }
    btn.addEventListener("click", function () {
      var next = read() === "neon" ? "night" : "neon";
      write(next);
      paint();
      try {
        if (navigator && navigator.vibrate) navigator.vibrate(12);
      } catch {
        /* ignore */
      }
    });
    paint();
  }

  function initFirstFiveSecondsBar() {
    if (document.getElementById("vcFirst5Bar")) return;
    var path = "";
    try {
      path = String(window.location.pathname || "").toLowerCase();
    } catch {
      path = "";
    }
    // Keep the “first 5 seconds” lane on the homepage only. Inner shop routes already
    // have dense hero UI; a second fixed pill row reads like a glitchy overlay.
    var isHome = path === "" || path === "/" || /(^|\/)index\.html$/i.test(path);
    if (!isHome) {
      return;
    }
    var bar = document.createElement("div");
    bar.id = "vcFirst5Bar";
    bar.className = "vc-first5-bar";
    bar.innerHTML =
      "<a class='vc-first5-pill' href='./live-market-shops.html?cat=All&view=global&deal=best'>Deals in 1 tap</a>" +
      "<a class='vc-first5-pill' href='./hot-picks.html'>Hot picks</a>" +
      "<a class='vc-first5-pill' href='./my-business.html?flow=book'>I want to Book</a>" +
      "<a class='vc-first5-pill' href='./sell-journey.html'>Start hustle</a>";
    document.body.appendChild(bar);
  }

  function initMissionHud() {
    if (document.getElementById("vcMissionHud")) return;
    var key = "vibecart-mobile-mission-v1";
    var state = { step: 0 };
    try {
      state = JSON.parse(localStorage.getItem(key) || "{\"step\":0}") || { step: 0 };
    } catch {
      state = { step: 0 };
    }
    var hud = document.createElement("button");
    hud.type = "button";
    hud.id = "vcMissionHud";
    hud.className = "vc-mission-hud";
    function paint() {
      hud.textContent = "Mission " + Math.min(3, Math.max(0, Number(state.step || 0))) + "/3";
    }
    hud.addEventListener("click", function () {
      state.step = (Number(state.step || 0) + 1) % 4;
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* ignore */
      }
      paint();
      try {
        if (navigator && navigator.vibrate) navigator.vibrate([8, 16, 8]);
      } catch {
        /* ignore */
      }
    });
    paint();
    document.body.appendChild(hud);
  }

  function initFloatingActionHub() {
    if (document.getElementById("vcActionHub")) return;
    var first5 = document.getElementById("vcFirst5Bar");
    var quick = document.getElementById("vcQuickActionTrigger");
    var mission = document.getElementById("vcMissionHud");
    var deal = document.getElementById("vcDealDraftComposer");
    if (first5) first5.style.display = "none";
    if (quick) quick.style.display = "none";
    if (mission) mission.style.display = "none";
    if (deal) deal.style.display = "none";

    var wrap = document.createElement("div");
    wrap.id = "vcActionHub";
    wrap.className = "vc-action-hub";
    wrap.innerHTML =
      "<button type='button' class='vc-action-hub__fab' id='vcActionHubFab' aria-expanded='false' aria-label='Open quick action hub'>Spark</button>" +
      "<div class='vc-action-hub__panel' id='vcActionHubPanel' hidden>" +
      "<a class='vc-action-hub__item' href='./live-market-shops.html?cat=All&view=global&deal=best'>Deals in 1 tap</a>" +
      "<a class='vc-action-hub__item' href='./hot-picks.html'>Hot picks</a>" +
      "<a class='vc-action-hub__item' href='./my-business.html?flow=book'>I want to Book</a>" +
      "<a class='vc-action-hub__item' href='./sell-journey.html'>Start hustle</a>" +
      "<button type='button' class='vc-action-hub__item' id='vcActionHubQuick'>Quick panel</button>" +
      "<button type='button' class='vc-action-hub__item' id='vcActionHubDeal'>Deal note</button>" +
      "<button type='button' class='vc-action-hub__item' id='vcActionHubMission'>Mission</button>" +
      "</div>";
    document.body.appendChild(wrap);
    var fab = document.getElementById("vcActionHubFab");
    var panel = document.getElementById("vcActionHubPanel");
    function toggle(forceOpen) {
      var open = typeof forceOpen === "boolean" ? forceOpen : panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        wrap.classList.add("is-open");
        fab.setAttribute("aria-expanded", "true");
      } else {
        panel.setAttribute("hidden", "hidden");
        wrap.classList.remove("is-open");
        fab.setAttribute("aria-expanded", "false");
      }
    }
    fab.addEventListener("click", function () {
      toggle();
    });
    document.getElementById("vcActionHubQuick")?.addEventListener("click", function () {
      if (quick) quick.click();
    });
    document.getElementById("vcActionHubDeal")?.addEventListener("click", function () {
      var dealFab = deal ? deal.querySelector(".vc-deal-draft-fab") : null;
      if (dealFab) {
        deal.style.display = "";
        dealFab.click();
      }
    });
    document.getElementById("vcActionHubMission")?.addEventListener("click", function () {
      if (mission) {
        mission.style.display = "";
        mission.click();
      }
    });
    document.addEventListener(
      "click",
      function (ev) {
        if (!wrap.classList.contains("is-open")) return;
        var within = ev.target && ev.target.closest ? ev.target.closest("#vcActionHub") : null;
        if (!within) toggle(false);
      },
      true
    );
  }

  function initMotionModeToggle() {
    if (document.getElementById("vcMotionModeBtn")) return;
    var key = "vibecart-mobile-motion-v1";
    function read() {
      try {
        return String(localStorage.getItem(key) || "auto").trim().toLowerCase();
      } catch {
        return "auto";
      }
    }
    function write(v) {
      try {
        localStorage.setItem(key, v);
      } catch {
        /* ignore */
      }
    }
    function apply() {
      var mode = read();
      var rich = mode === "rich";
      document.documentElement.classList.toggle("vc-motion-rich", rich);
      document.documentElement.classList.toggle("vc-motion-stable", mode === "stable");
      document.documentElement.classList.toggle("vc-motion-auto", mode === "auto");
      if (mode === "auto") {
        btn.textContent = "Motion: Auto";
        btn.setAttribute("aria-pressed", "mixed");
      } else if (mode === "rich") {
        btn.textContent = "Motion: Rich";
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.textContent = "Motion: Stable";
        btn.setAttribute("aria-pressed", "false");
      }
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "vcMotionModeBtn";
    btn.className = "vc-motion-mode-btn";
    btn.setAttribute("aria-label", "Toggle motion stability (mobile safe)");
    btn.addEventListener("click", function () {
      var cur = read();
      var next = cur === "auto" ? "rich" : cur === "rich" ? "stable" : "auto";
      write(next);
      apply();
      try {
        if (navigator && navigator.vibrate) navigator.vibrate(10);
      } catch {
        /* ignore */
      }
    });
    document.body.appendChild(btn);
    apply();
  }

  function initFloatingControlLayout() {
    function layoutScopeKey() {
      try {
        var p = String((window.location && window.location.pathname) || "") || "root";
        return "vibecart-mobile-floating-layout-v1:" + p.replace(/[^a-z0-9/_-]+/gi, "_").slice(-120);
      } catch {
        return "vibecart-mobile-floating-layout-v1:default";
      }
    }
    function canBrandonArrange() {
      try {
        if (String((window.location && window.location.search) || "").indexOf("brandonArrange=1") >= 0) {
          localStorage.setItem("vibecart-brandon-arrange-v1", "1");
        }
      } catch {
        /* ignore */
      }
      try {
        if (localStorage.getItem("vibecart-brandon-arrange-v1") === "1") return true;
      } catch {
        /* ignore */
      }
      try {
        var raw = localStorage.getItem("vibecart-public-auth-user");
        var u = raw ? JSON.parse(raw) : null;
        var em = String((u && u.email) || "").toLowerCase();
        if (em.indexOf("brandon") >= 0) return true;
      } catch {
        /* ignore */
      }
      return false;
    }
    if (!canBrandonArrange()) {
      return;
    }
    var key = layoutScopeKey();
    var modeKey = "vibecart-mobile-floating-arrange-v1";
    if (document.getElementById("vcArrangeHud")) return;
    var root = document.documentElement;
    var movedMap = {};
    function readLayout() {
      try {
        var raw = JSON.parse(localStorage.getItem(key) || "{}");
        return raw && typeof raw === "object" ? raw : {};
      } catch {
        return {};
      }
    }
    function writeLayout(map) {
      try {
        localStorage.setItem(key, JSON.stringify(map || {}));
      } catch {
        /* ignore */
      }
    }
    function readArrange() {
      try {
        return localStorage.getItem(modeKey) === "1";
      } catch {
        return false;
      }
    }
    function writeArrange(on) {
      try {
        localStorage.setItem(modeKey, on ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
    function controlNodes() {
      return [
        { id: "vcQuickActionTrigger", node: document.getElementById("vcQuickActionTrigger") },
        { id: "vcMissionHud", node: document.getElementById("vcMissionHud") },
        { id: "vcMotionModeBtn", node: document.getElementById("vcMotionModeBtn") },
        { id: "vcMobileStreakChip", node: document.getElementById("vcMobileStreakChip") },
        { id: "vcActionHub", node: document.getElementById("vcActionHub") },
        { id: "vcDealDraftComposer", node: document.getElementById("vcDealDraftComposer") },
        { id: "vc-mobile-ai", node: document.getElementById("vc-mobile-ai") }
      ].filter(function (row) {
        return !!row.node;
      });
    }
    function clamp(v, min, max) {
      return Math.min(max, Math.max(min, v));
    }
    function applySavedLayout() {
      var map = readLayout();
      controlNodes().forEach(function (row) {
        var pos = map[row.id];
        if (!pos || !Number.isFinite(pos.left) || !Number.isFinite(pos.top)) return;
        var n = row.node;
        n.style.left = pos.left + "px";
        n.style.top = pos.top + "px";
        n.style.right = "auto";
        n.style.bottom = "auto";
      });
    }
    function paintArrangeState() {
      var on = readArrange();
      root.classList.toggle("vc-arrange-on", on);
      arrange.textContent = on ? "Arrange: On" : "Arrange";
      arrange.setAttribute("aria-pressed", on ? "true" : "false");
    }
    function saveNodePosition(row, left, top) {
      var map = readLayout();
      map[row.id] = { left: Math.round(left), top: Math.round(top) };
      writeLayout(map);
    }
    function resetLayout() {
      writeLayout({});
      controlNodes().forEach(function (row) {
        var n = row.node;
        if (!n) return;
        n.style.left = "";
        n.style.top = "";
        n.style.right = "";
        n.style.bottom = "";
      });
    }
    function bindDrag(row) {
      var n = row.node;
      if (!n || n.getAttribute("data-vc-arrange-bind") === "1") return;
      n.setAttribute("data-vc-arrange-bind", "1");
      n.classList.add("vc-arrange-target");
      n.addEventListener("pointerdown", function (ev) {
        if (!readArrange()) return;
        if (!ev || !Number.isFinite(ev.clientX) || !Number.isFinite(ev.clientY)) return;
        movedMap[row.id] = false;
        var rect = n.getBoundingClientRect();
        var dx = ev.clientX - rect.left;
        var dy = ev.clientY - rect.top;
        function onMove(mev) {
          var maxLeft = Math.max(0, window.innerWidth - rect.width);
          var maxTop = Math.max(0, window.innerHeight - rect.height);
          var left = clamp(mev.clientX - dx, 0, maxLeft);
          var top = clamp(mev.clientY - dy, 0, maxTop);
          n.style.left = left + "px";
          n.style.top = top + "px";
          n.style.right = "auto";
          n.style.bottom = "auto";
          movedMap[row.id] = true;
        }
        function onUp() {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          if (movedMap[row.id]) {
            var finalRect = n.getBoundingClientRect();
            saveNodePosition(row, finalRect.left, finalRect.top);
          }
        }
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp, { once: true });
      });
      n.addEventListener(
        "click",
        function (ev) {
          if (readArrange() && movedMap[row.id]) {
            ev.preventDefault();
            ev.stopPropagation();
            movedMap[row.id] = false;
          }
        },
        true
      );
    }
    var arrange = document.createElement("button");
    arrange.type = "button";
    arrange.id = "vcArrangeHud";
    arrange.className = "vc-arrange-hud";
    arrange.addEventListener("click", function () {
      var next = !readArrange();
      writeArrange(next);
      paintArrangeState();
      try {
        if (navigator && navigator.vibrate) navigator.vibrate(next ? [10, 24, 10] : 10);
      } catch {
        /* ignore */
      }
    });
    document.body.appendChild(arrange);
    var reset = document.createElement("button");
    reset.type = "button";
    reset.id = "vcArrangeResetHud";
    reset.className = "vc-arrange-reset-hud";
    reset.textContent = "Reset layout";
    reset.addEventListener("click", function () {
      resetLayout();
      try {
        if (navigator && navigator.vibrate) navigator.vibrate([8, 20, 8]);
      } catch {
        /* ignore */
      }
    });
    document.body.appendChild(reset);
    applySavedLayout();
    controlNodes().forEach(bindDrag);
    paintArrangeState();
  }

  function initSmartPrefetch() {
    var urls = [
      "./live-market-shops.html?cat=All&view=global&deal=best",
      "./hot-picks.html",
      "./sell-journey.html",
      "./orders-tracking.html"
    ];
    urls.forEach(function (u) {
      var id = "vc-prefetch-" + u.replace(/[^a-z0-9]/gi, "_");
      if (document.getElementById(id)) return;
      var link = document.createElement("link");
      link.id = id;
      link.rel = "prefetch";
      link.href = u;
      document.head.appendChild(link);
    });
  }

  function isLeanMobileHudTemplatePage() {
    try {
      if (document.body && document.body.getAttribute("data-vc-lean-hud") === "1") {
        return true;
      }
      if (document.body && document.body.classList.contains("health-coach-page")) {
        return true;
      }
      var p = String((typeof location !== "undefined" && location.pathname) || "").toLowerCase();
      if (p.indexOf("service-provider-hub") !== -1) return true;
      if (p.indexOf("coach-experience") !== -1) return true;
      if (p.indexOf("checkout-details") !== -1) return true;
      if (p.indexOf("top-class-checkout") !== -1) return true;
      if (p.indexOf("payment-confirmation") !== -1) return true;
      if (p.indexOf("coach-payment-recovery") !== -1) return true;
      if (p.indexOf("plan-workspace") !== -1) return true;
      if (p.indexOf("account-hub") !== -1) return true;
      if (p.indexOf("my-business") !== -1) return true;
      if (p.indexOf("legal-settings") !== -1) return true;
      if (p.indexOf("insurance") !== -1) return true;
      if (p.indexOf("orders-tracking") !== -1) return true;
      if (p.indexOf("seller-live-preview") !== -1) return true;
      if (p.indexOf("admin-app") !== -1) return true;
      if (p.indexOf("admin-messages") !== -1) return true;
      if (p.indexOf("admin.html") !== -1) return true;
      if (document.body && document.body.classList.contains("start-selling-page")) {
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function mountHeavyMobileStickers() {
    return !isLeanMobileHudTemplatePage() && !isSimpleWowModeEnabled();
  }

  function isSimpleWowModeEnabled() {
    try {
      var q = String((window.location && window.location.search) || "");
      // Allow query override for testing.
      if (/[?&]simpleWow=0(?:&|$)/i.test(q)) return false;
      if (/[?&]simpleWow=1(?:&|$)/i.test(q)) return true;
      var stored = String(localStorage.getItem("vibecart-mobile-simple-wow-v1") || "").trim();
      if (stored === "0") return false;
      if (stored === "1") return true;
      // Default: simple wow ON when the user has never chosen (sticker persists "0"/"1").
      return true;
    } catch {
      return true;
    }
  }

  function isSimpleWowLandingPage() {
    try {
      var p = String((window.location && window.location.pathname) || "").toLowerCase();
      return p === "" || p === "/" || /(^|\/)index\.html$/i.test(p);
    } catch {
      return false;
    }
  }

  function initSimpleWowEntry() {
    if (!isSimpleWowModeEnabled() || !isSimpleWowLandingPage()) return;
    if (document.getElementById("vcSimpleWowEntry")) return;
    var mount = document.querySelector("main") || document.body;
    if (!mount) return;
    var card = document.createElement("section");
    card.id = "vcSimpleWowEntry";
    card.className = "vc-simple-wow-entry";
    var displayName = "";
    var returning = false;
    try {
      var rawUser = localStorage.getItem("vibecart-public-auth-user");
      var user = rawUser ? JSON.parse(rawUser) : null;
      displayName = String((user && (user.displayName || user.fullName || user.firstName)) || "").trim();
    } catch {
      displayName = "";
    }
    try {
      returning = Number(localStorage.getItem("vibecart-mobile-last-seen-v1") || "0") > 0;
    } catch {
      returning = false;
    }
    var kicker = returning ? "Simple mode · returning" : "Simple mode · first time";
    var title = displayName
      ? "Hi " + displayName + " - your next great find starts now."
      : "Your next great find starts now.";
    var note = returning
      ? "Jump back in with one clear start. Your lane and Brandon guidance are ready."
      : "One clear start, then your lane unfolds: trusted deals, booking, or seller growth.";
    card.innerHTML =
      "<p class='vc-simple-wow-entry__kicker'>" + kicker + " · Simple mode · wow start</p>" +
      "<h2>" + title + "</h2>" +
      "<p>" + note + "</p>" +
      "<div class='vc-simple-wow-entry__actions'>" +
      "<a class='btn btn-primary' data-vc-wow-intent='buy' href='./live-market-shops.html?cat=All&view=global&deal=best'>Shop now</a>" +
      "<a class='btn btn-secondary' data-vc-wow-intent='fast' href='./hot-picks.html'>Hot picks</a>" +
      "<a class='btn btn-secondary' data-vc-wow-intent='book' href='./my-business.html?flow=book'>Book services</a>" +
      "<a class='btn btn-secondary' data-vc-wow-intent='sell' href='./sell-journey.html'>Start selling</a>" +
      "</div>" +
      "<div class='vc-simple-wow-entry__proof'>" +
      "<span>Verified trust signals</span>" +
      "<span>Fast routes by Brandon AI</span>" +
      "<span>Global + local options</span>" +
      "</div>";
    /* Ribbon + quick actions first (below global header); full hero follows inside the page group. */
    mount.insertBefore(card, mount.firstChild || null);
    card.querySelectorAll("[data-vc-wow-intent]").forEach(function (el) {
      el.addEventListener("click", function () {
        try {
          var lane = String(el.getAttribute("data-vc-wow-intent") || "buy");
          localStorage.setItem("vibecart-mobile-wow-intent-v1", lane);
          sessionStorage.setItem("vibecart-lane-picked-this-visit-v1", lane);
        } catch {
          /* ignore */
        }
      });
    });
  }

  function initSimpleWowUserSticker() {
    if (document.getElementById("vcSimpleWowSticker")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "vcSimpleWowSticker";
    btn.className = "vc-simple-wow-sticker";
    function paint() {
      var on = isSimpleWowModeEnabled();
      btn.textContent = on ? "WOW mode: ON" : "WOW mode: OFF";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "WOW mode on, tap to turn off" : "WOW mode off, tap to turn on");
      btn.classList.toggle("is-off", !on);
    }
    btn.addEventListener("click", function () {
      var next = !isSimpleWowModeEnabled();
      try {
        localStorage.setItem("vibecart-mobile-simple-wow-v1", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      paint();
      try {
        if (navigator && navigator.vibrate) navigator.vibrate(next ? [12, 28, 12] : 12);
      } catch {
        /* ignore */
      }
      // Re-apply layout style immediately and then refresh once for full shell consistency.
      document.body.classList.toggle("vc-simple-wow-on", next);
      window.setTimeout(function () {
        window.location.reload();
      }, 120);
    });
    document.body.appendChild(btn);
    paint();
  }

  function initShockHeroCinematic() {
    if (!isSimpleWowModeEnabled() || !isSimpleWowLandingPage()) return;
    var hero = document.querySelector(".hero");
    if (!hero || document.getElementById("vcShockHeroAura")) return;
    var fx = document.createElement("div");
    fx.id = "vcShockHeroAura";
    fx.className = "vc-shock-hero-aura";
    fx.innerHTML =
      "<span class='vc-shock-ring vc-shock-ring--a'></span>" +
      "<span class='vc-shock-ring vc-shock-ring--b'></span>" +
      "<span class='vc-shock-pulse'></span>" +
      "<span class='vc-shock-label'>Live cinematic lane</span>";
    hero.appendChild(fx);
    hero.classList.add("vc-shock-hero-on");
  }

  function initThreeSecondCinematicOpener() {
    if (!isSimpleWowModeEnabled() || !isSimpleWowLandingPage()) return;
    if (document.getElementById("vcThreeSecondCinematic")) return;
    try {
      var qsCine = String((window.location && window.location.search) || "");
      if (/[?&]replayCinematic=1(?:&|$)/i.test(qsCine)) {
        sessionStorage.removeItem("vibecart-mobile-wow-done-v1");
        sessionStorage.removeItem("vibecart-cinematic-done-v1");
        try {
          var uC = new URL(window.location.href);
          uC.searchParams.delete("replayCinematic");
          window.history.replaceState({}, "", uC.pathname + uC.search + uC.hash);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    try {
      if (sessionStorage.getItem("vibecart-mobile-wow-done-v1") === "1") return;
      if (sessionStorage.getItem("vibecart-cinematic-done-v1") === "1") return;
    } catch {
      /* ignore */
    }
    var wrap = document.createElement("div");
    var lane = "buy";
    try {
      lane = String(localStorage.getItem("vibecart-mobile-wow-intent-v1") || "buy").trim().toLowerCase();
    } catch {
      lane = "buy";
    }
    if (!/^(buy|book|sell|fast)$/.test(lane)) lane = "buy";
    var laneMeta = {
      buy: {
        title: "Buyer lane ignition",
        line: "Trusted picks. Faster checkout. Better discovery.",
        cta: "Enter buyer lane",
        ms: 2900,
        vibrate: [10, 20, 10]
      },
      book: {
        title: "Service lane ignition",
        line: "Beauty, barber, bakery, nails - reserve with confidence.",
        cta: "Enter service lane",
        ms: 3200,
        vibrate: [8, 14, 8, 14, 8]
      },
      sell: {
        title: "Seller lane ignition",
        line: "List sharper. Convert faster. Grow with precision.",
        cta: "Enter seller lane",
        ms: 3400,
        vibrate: [14, 26, 14]
      },
      fast: {
        title: "Speed lane ignition",
        line: "Instant routes. Live momentum. Zero hesitation.",
        cta: "Enter speed lane",
        ms: 2600,
        vibrate: [6, 10, 6, 10, 6]
      }
    };
    var chosen = laneMeta[lane] || laneMeta.buy;
    function getOrCreateCinematicAudioContext() {
      try {
        var existing = window.__vcCineAudioCtx;
        if (existing) return existing;
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        var ctx = new Ctx();
        window.__vcCineAudioCtx = ctx;
        return ctx;
      } catch {
        return null;
      }
    }
    function playCinematicTone(kind) {
      try {
        var ctx = getOrCreateCinematicAudioContext();
        if (!ctx) return;
        if (ctx.state === "suspended") {
          try {
            ctx.resume();
          } catch {
            /* ignore */
          }
        }
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(ctx.destination);
        gain2.connect(ctx.destination);
        var now = ctx.currentTime;
        var base = kind === "fast" ? 420 : kind === "sell" ? 360 : kind === "book" ? 330 : 300;
        osc.type = kind === "sell" ? "triangle" : kind === "book" ? "sine" : "sawtooth";
        osc2.type = "sine";
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.55, now + 0.18);
        osc2.frequency.setValueAtTime(base * 1.25, now);
        osc2.frequency.exponentialRampToValueAtTime(base * 1.9, now + 0.26);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        gain2.gain.setValueAtTime(0.0001, now);
        gain2.gain.exponentialRampToValueAtTime(0.03, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
        osc.start(now);
        osc2.start(now + 0.04);
        osc.stop(now + 0.44);
        osc2.stop(now + 0.5);
      } catch {
        /* ignore audio failures (autoplay/device restrictions) */
      }
    }
    var returning = false;
    try {
      returning = Number(localStorage.getItem("vibecart-mobile-last-seen-v1") || "0") > 0;
    } catch {
      returning = false;
    }
    var greeting = returning ? "Welcome back" : "Welcome";
    wrap.id = "vcThreeSecondCinematic";
    wrap.className = "vc-three-cinematic vc-three-cinematic--" + lane;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "VibeCart cinematic opener");
    wrap.innerHTML =
      "<div class='vc-three-cinematic__bg'></div>" +
      "<div class='vc-three-cinematic__rings'>" +
      "<span></span><span></span><span></span>" +
      "</div>" +
      "<div class='vc-three-cinematic__card'>" +
      "<p class='vc-three-cinematic__kicker'>" + greeting + "</p>" +
      "<h3>" + chosen.title + "</h3>" +
      "<p>" + chosen.line + " Brandon is primed for your route.</p>" +
      "<button type='button' class='btn btn-secondary vc-three-cinematic__skip' id='vcThreeCinematicSkip'>" +
      String(chosen.cta || "Enter now") +
      "</button>" +
      "</div>";
    document.body.appendChild(wrap);
    playCinematicTone(lane);
    try {
      if (navigator && navigator.vibrate && Array.isArray(chosen.vibrate)) navigator.vibrate(chosen.vibrate);
    } catch {
      /* ignore */
    }
    document.body.classList.add("vc-cine-active");
    document.body.classList.add("vc-intro-blocking");
    document.body.classList.add("vc-cine-lane-" + lane);
    var beatTimer = window.setInterval(function () {
      document.body.classList.toggle("vc-cine-beat");
    }, lane === "fast" ? 300 : lane === "sell" ? 420 : lane === "book" ? 520 : 380);
    function close() {
      if (!wrap || !wrap.parentNode) return;
      window.clearInterval(beatTimer);
      wrap.classList.add("is-leaving");
      window.setTimeout(function () {
        if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
        try {
          sessionStorage.setItem("vibecart-cinematic-done-v1", "1");
        } catch {
          /* ignore */
        }
        document.body.classList.remove("vc-cine-active");
        document.body.classList.remove("vc-cine-beat");
        // Cinematic used this to dim chrome; clear it so Brandon + page controls work again.
        // Intent blast re-adds vc-intro-blocking only when that modal actually mounts.
        document.body.classList.remove("vc-intro-blocking");
        // Keep blocking layer until wow-lane prompt mounts to avoid visual flash/jump.
        document.body.classList.remove("vc-cine-lane-buy", "vc-cine-lane-book", "vc-cine-lane-sell", "vc-cine-lane-fast");
        document.body.classList.add("vc-intro-pulse-bridge");
        window.setTimeout(function () {
          try {
            window.dispatchEvent(new CustomEvent("vibecart-cinematic-done", { detail: { lane: lane } }));
          } catch {
            /* ignore */
          }
        }, 40);
        try {
          localStorage.setItem("vibecart-mobile-cinematic-last-lane-v1", lane);
        } catch {
          /* ignore */
        }
      }, 180);
    }
    var t1 = window.setTimeout(function () {
      wrap.classList.add("is-active");
    }, 40);
    var t2 = window.setTimeout(close, Number(chosen.ms || 3000));
    var skip = document.getElementById("vcThreeCinematicSkip");
    if (skip) {
      skip.addEventListener("click", function () {
        window.clearTimeout(t2);
        close();
      });
    }
    wrap.addEventListener("click", function (ev) {
      if (ev.target === wrap) {
        window.clearTimeout(t2);
        close();
      }
    });
    window.addEventListener(
      "pagehide",
      function () {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearInterval(beatTimer);
      },
      { once: true, passive: true }
    );
  }

  function initCinematicAudioUnlock() {
    if (window.__vcCineAudioUnlockBound) return;
    window.__vcCineAudioUnlockBound = true;
    function unlock() {
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!window.__vcCineAudioCtx) {
          window.__vcCineAudioCtx = new Ctx();
        }
        if (window.__vcCineAudioCtx && window.__vcCineAudioCtx.state === "suspended") {
          window.__vcCineAudioCtx.resume();
        }
      } catch {
        /* ignore */
      }
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
      window.removeEventListener("click", unlock, true);
    }
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("touchstart", unlock, true);
    window.addEventListener("click", unlock, true);
  }

  function teardownVcScrollGateAndPrompts() {
    try {
      initPostHeroScrollPrompt();
    } catch {
      /* ignore */
    }
    try {
      document.querySelectorAll(".vc-post-hero-hidden").forEach(function (el) {
        el.classList.remove("vc-post-hero-hidden");
      });
    } catch {
      /* ignore */
    }
  }

  function initPostHeroScrollPrompt() {
    // Disabled: this prompt introduced a scroll gate that could trap touch scroll on phones.
    var existing = document.getElementById("vcPostHeroScrollPrompt");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    var rail = document.getElementById("vcCinematicConciergeRail");
    if (rail && rail.parentNode) {
      rail.parentNode.removeChild(rail);
    }
    function disableScrollGate() {
      try {
        if (window.__vcScrollGateScroll) window.removeEventListener("scroll", window.__vcScrollGateScroll, true);
        if (window.__vcScrollGateWheel) window.removeEventListener("wheel", window.__vcScrollGateWheel, { capture: true });
        if (window.__vcScrollGateTouch) window.removeEventListener("touchmove", window.__vcScrollGateTouch, { capture: true });
        if (window.__vcScrollGateKeydown) window.removeEventListener("keydown", window.__vcScrollGateKeydown, true);
        if (window.__vcScrollGateResize) window.removeEventListener("resize", window.__vcScrollGateResize, true);
      } catch {
        /* ignore */
      }
      window.__vcScrollGateScroll = null;
      window.__vcScrollGateWheel = null;
      window.__vcScrollGateTouch = null;
      window.__vcScrollGateKeydown = null;
      window.__vcScrollGateResize = null;
      window.__vcScrollGateMax = null;
      window.__vcScrollGateTouchY = null;
      window.__vcScrollGateTouchStart = null;
      window.__vcScrollGateGestureAxis = null;
      if (window.__vcScrollGateTouchStartHandler) {
        window.removeEventListener("touchstart", window.__vcScrollGateTouchStartHandler, true);
      }
      window.__vcScrollGateTouchStartHandler = null;
      if (window.__vcScrollGateTouchEndHandler) {
        window.removeEventListener("touchend", window.__vcScrollGateTouchEndHandler, true);
        window.removeEventListener("touchcancel", window.__vcScrollGateTouchEndHandler, true);
      }
      window.__vcScrollGateTouchEndHandler = null;
      try {
        var L0 = window.__vibecartLenis;
        var lh0 = window.__vcScrollGateLenisHandler;
        if (L0 && lh0 && typeof L0.off === "function") {
          L0.off("scroll", lh0);
        }
      } catch {
        /* ignore */
      }
      window.__vcScrollGateLenisHandler = null;
    }
    disableScrollGate();
    return;
    function revealFrom(node) {
      if (!node || !node.parentNode) return;
      var cur = node;
      while (cur) {
        cur.classList.remove("vc-post-hero-hidden");
        cur = cur.nextElementSibling;
      }
    }
    function hideFrom(node) {
      if (!node || !node.parentNode) return;
      var cur = node;
      while (cur) {
        cur.classList.remove("vc-post-hero-hidden");
        cur = cur.nextElementSibling;
      }
    }
    function enableScrollGate(anchor) {
      disableScrollGate();
      if (!anchor) return;
      function getDocScrollY() {
        try {
          var L = window.__vibecartLenis;
          if (L && typeof L.scroll === "number" && isFinite(L.scroll)) {
            return Number(L.scroll);
          }
        } catch {
          /* ignore */
        }
        return Number(window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0);
      }
      function setDocScrollY(top) {
        var y = Math.max(0, Number(top || 0));
        try {
          var L2 = window.__vibecartLenis;
          if (L2 && typeof L2.scrollTo === "function") {
            L2.scrollTo(y, { immediate: true });
            return;
          }
        } catch {
          /* ignore */
        }
        try {
          window.scrollTo({ top: y, left: 0, behavior: "auto" });
        } catch {
          /* ignore */
        }
      }
      function scrollGateTargetAllowsHorizontal(ev) {
        var node = ev && ev.target;
        if (!node || !node.closest) return false;
        if (
          node.closest(
            ".vc-horizontal-only, .vc-mobile-rail, .vc-mobile-rail-section, .vc-mobile-chapter-deck, .vc-bridge-truth-list, .shop-folder-landing, .shop-folder-scroll-hint, .vc-cinematic-concierge-rail, .vc-hot-ai-track, .vc-hot-ai-trend, #hotPicksAiTrendTrack, .vc-epic-track, .vc-epic-experience, #market-fit .market-pillars, .vc-live-deal-promo-rail, .vc-fashion-trends-rail, .live-market-deal-rail-wrap, #bridge-routes .vc-bridge-truth-list"
          )
        ) {
          return true;
        }
        var cur = node.nodeType === 1 ? node : node.parentElement;
        while (cur && cur !== document.body) {
          try {
            var st = window.getComputedStyle(cur);
            var ox = st.overflowX;
            if ((ox === "auto" || ox === "scroll") && cur.scrollWidth > cur.clientWidth + 2) {
              return true;
            }
          } catch {
            /* ignore */
          }
          cur = cur.parentElement;
        }
        return false;
      }
      function calcMax() {
        try {
          var rect = anchor.getBoundingClientRect();
          var top = Number(rect.top || 0) + getDocScrollY();
          return Math.max(0, Math.floor(top));
        } catch {
          return 0;
        }
      }
      function clamp() {
        var max = Number(window.__vcScrollGateMax || 0);
        var y = getDocScrollY();
        if (y > max) {
          setDocScrollY(max);
        }
      }
      window.__vcScrollGateMax = calcMax();
      window.__vcScrollGateResize = function () {
        window.__vcScrollGateMax = calcMax();
        clamp();
      };
      window.__vcScrollGateScroll = function () {
        clamp();
      };
      window.__vcScrollGateLenisHandler = function () {
        clamp();
      };
      try {
        var L3 = window.__vibecartLenis;
        if (L3 && typeof L3.on === "function" && window.__vcScrollGateLenisHandler) {
          L3.on("scroll", window.__vcScrollGateLenisHandler);
        }
      } catch {
        /* ignore */
      }
      window.__vcScrollGateWheel = function (ev) {
        if (scrollGateTargetAllowsHorizontal(ev)) return;
        if (ev && Math.abs(Number(ev.deltaX || 0)) > Math.abs(Number(ev.deltaY || 0))) return;
        var max = Number(window.__vcScrollGateMax || 0);
        var y = getDocScrollY();
        if (y >= max && ev && Number(ev.deltaY || 0) > 0) {
          ev.preventDefault();
        }
      };
      window.__vcScrollGateTouchStartHandler = function (ev) {
        window.__vcScrollGateGestureAxis = null;
        if (scrollGateTargetAllowsHorizontal(ev)) {
          window.__vcScrollGateTouchStart = null;
          return;
        }
        if (!ev || !ev.touches || !ev.touches[0]) return;
        window.__vcScrollGateTouchStart = {
          x: Number(ev.touches[0].clientX || 0),
          y: Number(ev.touches[0].clientY || 0)
        };
      };
      window.addEventListener("touchstart", window.__vcScrollGateTouchStartHandler, { capture: true, passive: true });
      window.__vcScrollGateTouchEndHandler = function () {
        window.__vcScrollGateGestureAxis = null;
        window.__vcScrollGateTouchStart = null;
        window.__vcScrollGateTouchY = null;
      };
      window.addEventListener("touchend", window.__vcScrollGateTouchEndHandler, { capture: true, passive: true });
      window.addEventListener("touchcancel", window.__vcScrollGateTouchEndHandler, { capture: true, passive: true });
      window.__vcScrollGateTouch = function (ev) {
        if (scrollGateTargetAllowsHorizontal(ev)) return;
        var st = window.__vcScrollGateTouchStart;
        if (st && ev && ev.touches && ev.touches[0]) {
          var rdx = Number(ev.touches[0].clientX || 0) - st.x;
          var rdy = Number(ev.touches[0].clientY || 0) - st.y;
          var adx = Math.abs(rdx);
          var ady = Math.abs(rdy);
          if (window.__vcScrollGateGestureAxis == null && (adx > 6 || ady > 6)) {
            window.__vcScrollGateGestureAxis = adx > ady ? "h" : "v";
          }
        }
        if (window.__vcScrollGateGestureAxis === "h") {
          return;
        }
        if (!ev || !ev.touches || !ev.touches[0]) return;
        var yNow = Number(ev.touches[0].clientY || 0);
        var yPrev = Number(window.__vcScrollGateTouchY || yNow);
        window.__vcScrollGateTouchY = yNow;
        var movingDown = yNow < yPrev;
        var max = Number(window.__vcScrollGateMax || 0);
        var y = getDocScrollY();
        if (y >= max && movingDown) {
          ev.preventDefault();
        }
      };
      window.__vcScrollGateKeydown = function (ev) {
        if (!ev) return;
        var max = Number(window.__vcScrollGateMax || 0);
        var y = getDocScrollY();
        var key = String(ev.key || "");
        var blocks = key === "ArrowDown" || key === "PageDown" || key === "End" || key === " ";
        if (blocks && y >= max) {
          ev.preventDefault();
        }
      };
      window.addEventListener("resize", window.__vcScrollGateResize, true);
      window.addEventListener("scroll", window.__vcScrollGateScroll, true);
      window.addEventListener("wheel", window.__vcScrollGateWheel, { capture: true, passive: false });
      window.addEventListener("touchmove", window.__vcScrollGateTouch, { capture: true, passive: false });
      window.addEventListener("keydown", window.__vcScrollGateKeydown, true);
      clamp();
    }
    if (rail && rail.parentNode) {
      function forcePlacePrompt() {
        try {
          if (!rail.parentNode) return;
          rail.parentNode.insertBefore(row, rail);
        } catch {
          /* ignore */
        }
      }
      forcePlacePrompt();
      window.requestAnimationFrame(function () {
        forcePlacePrompt();
        window.requestAnimationFrame(forcePlacePrompt);
      });
      var navEntries =
        window.performance && typeof performance.getEntriesByType === "function"
          ? performance.getEntriesByType("navigation")
          : [];
      var navType = navEntries && navEntries[0] ? String(navEntries[0].type || "") : "";
      if (navType === "reload" || navType === "back_forward") {
        revealFrom(rail);
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        } catch {
          /* ignore */
        }
      } else {
        hideFrom(rail);
      }
      if (trigger && panel) {
        trigger.addEventListener("click", function () {
          revealFrom(rail);
        });
      }
      return;
    }
    // Concierge rail not present -> do not show this prompt elsewhere.
  }

  function initCinematicConciergeRail() {
    if (!isSimpleWowModeEnabled() || !isSimpleWowLandingPage()) return;
    if (document.getElementById("vcCinematicConciergeRail")) return;
    var hero = document.querySelector(".hero");
    if (!hero || !hero.parentNode) return;
    var rail = document.createElement("div");
    rail.id = "vcCinematicConciergeRail";
    rail.className = "vc-cinematic-concierge-rail";
    rail.innerHTML =
      "<a href='./live-market-shops.html?cat=All&view=global&deal=best' class='btn btn-secondary'>Live market</a>" +
      "<a href='./seller-messages.html' class='btn btn-secondary'>Messages</a>" +
      "<a href='./sell-journey.html' class='btn btn-secondary'>Sell lane</a>" +
      "<a href='./wellbeing.html' class='btn btn-secondary'>Wellbeing</a>" +
      "<a href='./account-hub.html' class='btn btn-secondary'>Account</a>";
    var parent = hero.parentNode;
    var insertAfter = hero;
    try {
      var hairNode = Array.from(document.querySelectorAll("button, a, span, div, h1, h2, h3, p")).find(function (el) {
        if (!el || !el.textContent) return false;
        return /hair,\s*barber\s*&\s*baking/i.test(String(el.textContent || "").trim());
      });
      var hairBlock = null;
      if (hairNode && hairNode.closest) {
        hairBlock =
          hairNode.closest("section, article, .card, .panel, .hero-copy, .hero, main, .page-group") ||
          hairNode.parentElement ||
          null;
      }
      if (hairBlock && hairBlock.parentNode === parent) {
        insertAfter = hairBlock;
      }
    } catch {
      /* ignore */
    }
    if (insertAfter && insertAfter.nextSibling) parent.insertBefore(rail, insertAfter.nextSibling);
    else parent.appendChild(rail);
  }

  function initMindBlowingCalmFlow() {
    if (!isSimpleWowModeEnabled() || !isSimpleWowLandingPage()) return;
    document.body.classList.add("vc-one-moment-flow");
    document.body.classList.add("vc-motion-lite");
    var calmTimer = null;
    function scheduleCalm(ms) {
      if (calmTimer) window.clearTimeout(calmTimer);
      calmTimer = window.setTimeout(function () {
        document.body.classList.add("vc-auto-calm");
      }, Number(ms || 2600));
    }
    function markActive() {
      document.body.classList.remove("vc-auto-calm");
      scheduleCalm(2600);
    }
    ["touchstart", "pointerdown", "scroll", "keydown"].forEach(function (evName) {
      window.addEventListener(evName, markActive, { passive: true });
    });
    scheduleCalm(1800);
  }

  function warpTo(url) {
    if (!url) return;
    if (document.body) document.body.classList.add("vc-warp-out");
    window.setTimeout(function () {
      window.location.assign(url);
    }, 210);
  }

  function initGoosebumpsPack() {
    if (!isSimpleWowModeEnabled() || !isSimpleWowLandingPage()) return;
    if (window.__vcGoosebumpsPackBound) return;
    window.__vcGoosebumpsPackBound = true;
    var root = document.body;
    if (!root) return;
    root.classList.add("vc-goosebumps-on", "vc-bass-illusion-on");
    root.classList.add("vc-heartbeat-lock");
    window.setTimeout(function () {
      root.classList.remove("vc-heartbeat-lock");
    }, 1600);
    try {
      if (navigator && navigator.vibrate) navigator.vibrate([10, 34, 10]);
    } catch {
      /* ignore */
    }

    try {
      var heroCopy = document.querySelector(".hero-copy");
      if (heroCopy && !document.getElementById("vcNameWhisper")) {
        var rawUser = localStorage.getItem("vibecart-public-auth-user");
        var user = rawUser ? JSON.parse(rawUser) : null;
        var name = String((user && (user.firstName || user.displayName || user.fullName)) || "").trim();
        if (name) {
          var whisper = document.createElement("p");
          whisper.id = "vcNameWhisper";
          whisper.className = "vc-name-whisper";
          whisper.textContent = "Welcome back, " + name + ". Your lane is alive.";
          heroCopy.insertBefore(whisper, heroCopy.firstChild || null);
        }
      }
    } catch {
      /* ignore */
    }

    var hero = document.querySelector(".hero");
    if (hero && !document.getElementById("vcLivingHeroOrbit")) {
      var orbit = document.createElement("div");
      orbit.id = "vcLivingHeroOrbit";
      orbit.className = "vc-living-hero-orbit";
      hero.appendChild(orbit);
    }
    var startX = 0;
    if (hero) {
      hero.addEventListener("touchstart", function (ev) {
        startX = Number(ev && ev.touches && ev.touches[0] ? ev.touches[0].clientX : 0);
      }, { passive: true });
      hero.addEventListener("touchmove", function (ev) {
        var x = Number(ev && ev.touches && ev.touches[0] ? ev.touches[0].clientX : startX);
        var delta = Math.max(-1, Math.min(1, (x - startX) / 120));
        root.style.setProperty("--vc-hero-orbit-x", String(delta));
      }, { passive: true });
    }

    var cta = document.getElementById("heroShopNowBtn");
    var ctaIdleTimer = null;
    function scheduleCtaMagnet() {
      if (!cta) return;
      if (ctaIdleTimer) window.clearTimeout(ctaIdleTimer);
      cta.classList.remove("vc-magnetic-cta");
      ctaIdleTimer = window.setTimeout(function () {
        cta.classList.add("vc-magnetic-cta");
      }, 1800);
    }
    ["scroll", "touchstart", "pointerdown", "keydown"].forEach(function (evName) {
      window.addEventListener(evName, scheduleCtaMagnet, { passive: true });
    });
    scheduleCtaMagnet();

    function wakeBrandonPulse() {
      var ai = document.getElementById("vc-mobile-ai");
      if (!ai) return;
      ai.classList.add("vc-brandon-presence");
      window.setTimeout(function () {
        ai.classList.remove("vc-brandon-presence");
      }, 1200);
    }
    window.addEventListener("vibecart-cinematic-done", wakeBrandonPulse, { passive: true });
    window.addEventListener("vibecart-first-prompt-complete", function (ev) {
      var lane = String(ev && ev.detail && ev.detail.intent ? ev.detail.intent : "buy").toLowerCase();
      root.setAttribute("data-vc-lane", /^(buy|book|sell|fast)$/.test(lane) ? lane : "buy");
      root.classList.add("vc-lane-aura-shift");
      window.setTimeout(function () {
        root.classList.remove("vc-lane-aura-shift");
      }, 1800);
      wakeBrandonPulse();
    }, { passive: true });
  }

  function initBrandonGhostAssistMode() {
    var wrap = document.getElementById("vc-mobile-ai");
    if (!wrap) return;
    var orb = wrap.querySelector(".vc-mobile-ai__orb");
    var panel = wrap.querySelector(".vc-mobile-ai__panel");
    var micro = wrap.querySelector(".vc-mobile-ai__micro");
    var hesitationTimer = null;
    function setGhost(on) {
      wrap.classList.toggle("vc-mobile-ai--ghost", !!on);
      wrap.classList.toggle("vc-mobile-ai--awake", !on);
    }
    setGhost(false);
    function pokeAssist(line) {
      setGhost(false);
      if (micro && line) micro.textContent = String(line).slice(0, 120);
      if (hesitationTimer) window.clearTimeout(hesitationTimer);
      hesitationTimer = window.setTimeout(function () {
        var expanded = orb && orb.getAttribute("aria-expanded") === "true";
        if (!expanded && !panel?.matches(":not([hidden])")) {
          setGhost(true);
        }
      }, 2600);
    }
    window.addEventListener(
      "vibecart-cinematic-done",
      function () {
        pokeAssist("Brandon is live. Pick buy, sell, book, or fast and I will guide instantly.");
      },
      { passive: true }
    );
    window.addEventListener(
      "vibecart-first-prompt-complete",
      function (ev) {
        var chosen = String(ev && ev.detail && ev.detail.intent ? ev.detail.intent : "").toLowerCase();
        document.body.classList.add("vc-after-lane-selected");
        pokeAssist(
          chosen
            ? "Lane locked: " + chosen + ". Brandon is live and routing your fastest next move."
            : "Brandon is live. Tell me your goal and I will route your next best move."
        );
      },
      { passive: true }
    );
    if (orb) {
      orb.addEventListener("click", function () {
        setGhost(false);
        if (hesitationTimer) window.clearTimeout(hesitationTimer);
      });
    }
  }

  function teardownEphemeralStickerHud() {
    [
      "vcStoryRail",
      "vcSocialPulse",
      "vcMissionHud",
      "vcDealDraftComposer",
      "vcMobileStreakChip",
      "vcMobileInboxPulse",
      "vcFirst5Bar",
      "vcIntentBlast",
      "vcFirst5Reveal",
      "vcMotionModeBtn",
      "vcArrangeHud",
      "vcArrangeResetHud",
      "vcActionHub",
      "vcQuickActionTrigger",
      "vcVibeModeBtn",
      "vcSimpleWowSticker",
      "vcPostHeroScrollPrompt"
    ].forEach(function (id) {
      try {
        var n = document.getElementById(id);
        if (n && n.parentNode) {
          n.parentNode.removeChild(n);
        }
      } catch {
        /* ignore */
      }
    });
    try {
      var sheet = document.getElementById("vcQuickActionSheet");
      if (sheet && sheet.parentNode) {
        sheet.parentNode.removeChild(sheet);
      }
    } catch {
      /* ignore */
    }
  }

  function runMobileHudPack() {
    resetWowLaneVisualArtifacts();
    /* WOW home: lean opener + restored hero richness (trust snapshot, first‑5 / starter pack, name whisper, lane chrome). Heavy sticker HUD still gated by mountHeavyMobileStickers(). */
    enhanceHero();
    initCinematicAudioUnlock();
    initSimpleWowUserSticker();
    if (isSimpleWowModeEnabled()) {
      document.body.classList.add("vc-simple-wow-on");
      document.body.classList.add("vc-v3-wow");
    } else {
      document.body.classList.remove("vc-simple-wow-on");
      document.body.classList.remove("vc-v3-wow");
    }
    initSimpleWowEntry();
    initThreeSecondCinematicOpener();
    if (isSimpleWowLandingPage()) {
      try {
        document.querySelector(".brand-mark")?.classList.add("brand-mark--shell-boost");
      } catch {
        /* ignore */
      }
      initMindBlowingCalmFlow();
      initGoosebumpsPack();
      initMobileFocusMode();
      initThumbFlowBoost();
      initTrustSnapshotCard();
      initShockHeroCinematic();
      initCinematicLaneBadge();
      initFirstFiveWowExperience();
      try {
        initBrandonGhostAssistMode();
      } catch {
        /* ignore */
      }
      window.setTimeout(function () {
        try {
          initFirstFiveWowExperience(true);
        } catch {
          /* ignore */
        }
      }, 4200);
    }
    var heavy = mountHeavyMobileStickers();
    if (heavy) {
      initDailyStreakChip();
      initStoryRail();
      initSwipeSaveDeals();
      initSocialPulseTicker();
      initInboxPulse();
      initMissionHud();
      initDealDraftComposer();
      initQuickActionSheet();
      initVibeThemeSwitch();
      initFirstFiveSecondsBar();
      initMotionModeToggle();
      initSmartPrefetch();
      initFloatingActionHub();
      initFloatingControlLayout();
    }
    teardownVcScrollGateAndPrompts();
  }

  function initCinematicLaneBadge() {
    if (!isSimpleWowModeEnabled() || !isSimpleWowLandingPage()) return;
    if (document.getElementById("vcCinematicLaneBadge")) return;
    var heroCopy = document.querySelector(".hero-copy");
    if (!heroCopy) return;
    var lane = "buy";
    try {
      lane = String(localStorage.getItem("vibecart-mobile-wow-intent-v1") || "buy").trim().toLowerCase();
    } catch {
      lane = "buy";
    }
    if (!/^(buy|book|sell|fast)$/.test(lane)) lane = "buy";
    var laneLabelMap = {
      buy: "Buyer energy live",
      book: "Service energy live",
      sell: "Seller energy live",
      fast: "Speed energy live"
    };
    var badge = document.createElement("p");
    badge.id = "vcCinematicLaneBadge";
    badge.className = "vc-cinematic-lane-badge";
    badge.textContent = laneLabelMap[lane] || laneLabelMap.buy;
    heroCopy.insertBefore(badge, heroCopy.firstChild || null);
  }

  window.addEventListener(
    "pagehide",
    function (ev) {
      if (ev && ev.persisted) {
        return;
      }
      try {
        teardownEphemeralStickerHud();
      } catch {
        /* ignore */
      }
    },
    { passive: true }
  );

  function boot() {
    applyPhoneDocumentClasses();
    try {
      ensureAiCoach();
    } catch {
      /* ignore */
    }
    const root = document.documentElement;
    var isApp = root.classList.contains("vc-mobile-app");
    var isPhone = root.classList.contains("vc-phone");
    if (!isApp && !isPhone) {
      try {
        if (
          window.matchMedia &&
          window.matchMedia("(max-width: 900px)").matches &&
          isSimpleWowLandingPage()
        ) {
          root.classList.add("vc-phone");
          isPhone = true;
        }
      } catch {
        /* ignore */
      }
    }
    if (!isApp && !isPhone) {
      return;
    }
    /* Health & coach lane: skip heavy HUD (Quick / mission / streak / deal rail) so checkout + matcher stay tappable.
       Still mount Brandon + reveal sections so the coach lane matches the rest of the app shell. */
    if (document.body && document.body.classList.contains("health-coach-page")) {
      if (isApp) {
        document.body.classList.add("vc-mobile-shell");
        if (isSimpleWowModeEnabled()) {
          document.body.classList.add("vc-simple-wow-on");
          document.body.classList.add("vc-v3-wow");
        } else {
          document.body.classList.remove("vc-simple-wow-on");
          document.body.classList.remove("vc-v3-wow");
        }
        initMainSectionRevealForApp();
        ensureAppShopHubLink();
      }
      return;
    }
    /* vc-mobile-shell styles WOW entry, hero polish, etc. It must apply for vc-phone web, not only native vc-mobile-app. */
    if (isApp || isPhone) {
      document.body.classList.add("vc-mobile-shell");
      if (isSimpleWowModeEnabled()) {
        document.body.classList.add("vc-simple-wow-on");
        document.body.classList.add("vc-v3-wow");
      } else {
        document.body.classList.remove("vc-simple-wow-on");
        document.body.classList.remove("vc-v3-wow");
      }
    }
    if (isApp) {
      initMainSectionRevealForApp();
      ensureAppShopHubLink();
      window.addEventListener(
        "vibecart-live-catalog",
        (ev) => {
          const n = Number(ev && ev.detail && ev.detail.count);
          if (!Number.isFinite(n) || n <= 0) {
            return;
          }
          try {
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([12, 36, 16]);
            }
          } catch {
            /* ignore */
          }
        },
        { passive: true }
      );
    } else if (isPhone) {
      initMainSectionRevealForApp();
      ensureAppShopHubLink();
    }
    if (isApp || isPhone) {
      runMobileHudPack();
    }
    registerNativePushIfAvailable();
  }

  window.addEventListener(
    "pageshow",
    function (ev) {
      if (!ev || !ev.persisted) {
        return;
      }
      try {
        applyPhoneDocumentClasses();
        try {
          ensureAiCoach();
        } catch {
          /* ignore */
        }
        var root = document.documentElement;
        if (!root.classList.contains("vc-mobile-app") && !root.classList.contains("vc-phone")) {
          return;
        }
        if (document.body && document.body.classList.contains("health-coach-page")) {
          if (root.classList.contains("vc-mobile-app")) {
            document.body.classList.add("vc-mobile-shell");
            if (isSimpleWowModeEnabled()) {
              document.body.classList.add("vc-simple-wow-on");
              document.body.classList.add("vc-v3-wow");
            } else {
              document.body.classList.remove("vc-simple-wow-on");
              document.body.classList.remove("vc-v3-wow");
            }
            initMainSectionRevealForApp();
            ensureAppShopHubLink();
          }
          return;
        }
        var isAppBf = root.classList.contains("vc-mobile-app");
        var isPhoneBf = root.classList.contains("vc-phone");
        if (isAppBf || isPhoneBf) {
          document.body.classList.add("vc-mobile-shell");
          if (isSimpleWowModeEnabled()) {
            document.body.classList.add("vc-simple-wow-on");
            document.body.classList.add("vc-v3-wow");
          } else {
            document.body.classList.remove("vc-simple-wow-on");
            document.body.classList.remove("vc-v3-wow");
          }
        }
        if (isAppBf) {
          initMainSectionRevealForApp();
          ensureAppShopHubLink();
        } else if (isPhoneBf) {
          initMainSectionRevealForApp();
          ensureAppShopHubLink();
        }
        /* BFCache restore: strip any frozen sticker HUD so lean-route rules re-apply cleanly. */
        try {
          teardownEphemeralStickerHud();
        } catch {
          /* ignore */
        }
        runMobileHudPack();
        registerNativePushIfAvailable();
      } catch {
        /* ignore */
      }
    },
    { passive: true }
  );

  window.vibeCartBootBrandonUniversal = function () {
    try {
      applyPhoneDocumentClasses();
      ensureAiCoach();
      var root = document.documentElement;
      if (!(root.classList.contains("vc-mobile-app") || root.classList.contains("vc-phone"))) {
        return;
      }
      if (document.body && document.body.classList.contains("health-coach-page")) {
        if (root.classList.contains("vc-mobile-app")) {
          document.body.classList.add("vc-mobile-shell");
          if (isSimpleWowModeEnabled()) {
            document.body.classList.add("vc-simple-wow-on");
            document.body.classList.add("vc-v3-wow");
          } else {
            document.body.classList.remove("vc-simple-wow-on");
            document.body.classList.remove("vc-v3-wow");
          }
          initMainSectionRevealForApp();
          ensureAppShopHubLink();
        }
        return;
      }
      var isAppU = root.classList.contains("vc-mobile-app");
      var isPhoneU = root.classList.contains("vc-phone");
      if (isAppU || isPhoneU) {
        document.body.classList.add("vc-mobile-shell");
        if (isSimpleWowModeEnabled()) {
          document.body.classList.add("vc-simple-wow-on");
          document.body.classList.add("vc-v3-wow");
        } else {
          document.body.classList.remove("vc-simple-wow-on");
          document.body.classList.remove("vc-v3-wow");
        }
      }
      if (isAppU) {
        initMainSectionRevealForApp();
        ensureAppShopHubLink();
      } else if (isPhoneU) {
        initMainSectionRevealForApp();
        ensureAppShopHubLink();
      }
      runMobileHudPack();
    } catch {
      /* ignore */
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
