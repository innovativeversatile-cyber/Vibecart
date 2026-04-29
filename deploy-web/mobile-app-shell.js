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
      title: "Smart next moves for this screen",
      steps: [
        "Pick a category first, then compare 3 options before opening checkout.",
        "Use pinned partner memory to reduce repeat-search time.",
        "Open one trusted route at a time and confirm delivery window."
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
      title: "Shop conversion assistant",
      steps: [
        "Filter by need + budget first to remove low-fit options quickly.",
        "Use trusted partner links and compare brand-level options, not only category.",
        "After purchase, return for tracking and support updates."
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

  function ensureAiCoach() {
    if (document.getElementById(AI_ID)) {
      return;
    }
    const wrap = document.createElement("div");
    wrap.id = AI_ID;
    wrap.className = "vc-mobile-ai";
    wrap.innerHTML = `
      <button type="button" class="vc-mobile-ai__orb" aria-expanded="false" aria-controls="vc-mobile-ai-panel" title="VibeCoach tips">
        <span class="vc-mobile-ai__pulse"></span>
        <span class="vc-mobile-ai__label">AI</span>
      </button>
      <div id="vc-mobile-ai-panel" class="vc-mobile-ai__panel" hidden>
        <div class="vc-mobile-ai__head">
          <strong>VibeCoach</strong>
          <span class="vc-mobile-ai__sub">VibeAI guidance · no auto-buy</span>
        </div>
        <p id="vc-mobile-ai-tip" class="vc-mobile-ai__tip"></p>
        <div id="vc-mobile-ai-actions" class="hero-actions" style="margin:.35rem 0 .6rem"></div>
        <label class="vc-mobile-ai__lab" for="vc-mobile-ai-feedback">What should we improve next?</label>
        <textarea id="vc-mobile-ai-feedback" class="vc-mobile-ai__ta" rows="2" maxlength="400" placeholder="One sentence is enough…"></textarea>
        <button type="button" class="btn btn-primary vc-mobile-ai__save">Save to device</button>
        <p id="vc-mobile-ai-saved" class="note vc-mobile-ai__saved" hidden>Saved locally — thank you.</p>
      </div>
    `;
    document.body.appendChild(wrap);

    const orb = wrap.querySelector(".vc-mobile-ai__orb");
    const panel = wrap.querySelector(".vc-mobile-ai__panel");
    const tipEl = wrap.querySelector("#vc-mobile-ai-tip");
    const ta = wrap.querySelector("#vc-mobile-ai-feedback");
    const saveBtn = wrap.querySelector(".vc-mobile-ai__save");
    const saved = wrap.querySelector("#vc-mobile-ai-saved");
    const actionsEl = wrap.querySelector("#vc-mobile-ai-actions");
    let startY = 0;

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

    function renderAiCard() {
      var mode = detectMode();
      var card = PLAYBOOKS[mode] || PLAYBOOKS.default;
      var category = readLocal("vibecart-home-lite-category");
      var partner = readLocal("vibecart-home-lite-preferred-partner");
      var line = card.title + ". " + card.steps.join(" ") + " Route lens: " + routeLensLabel() + ".";
      if (category) {
        line += " Current category memory: " + category + ".";
      }
      if (partner) {
        line += " Preferred partner memory: " + partner + ".";
      }
      if (tipEl) {
        tipEl.textContent = line;
      }
      if (actionsEl) {
        actionsEl.innerHTML =
          '<a class="btn btn-secondary" href="' +
          card.ctaHref +
          '">' +
          card.ctaLabel +
          "</a>";
        const cta = actionsEl.querySelector("a");
        cta?.addEventListener("click", () => {
          try {
            if (navigator && navigator.vibrate) navigator.vibrate([10, 30, 12]);
          } catch {
            /* ignore */
          }
        });
      }
    }

    renderAiCard();
    setInterval(renderAiCard, 12000);

    orb?.addEventListener("click", () => {
      const open = panel?.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        orb.setAttribute("aria-expanded", "true");
        renderAiCard();
        try {
          if (navigator && navigator.vibrate) navigator.vibrate(16);
        } catch {
          /* ignore */
        }
      } else {
        panel?.setAttribute("hidden", "hidden");
        orb.setAttribute("aria-expanded", "false");
      }
    });

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
          renderAiCard();
        }
      },
      { passive: true }
    );
    panel?.addEventListener(
      "touchstart",
      (ev) => {
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        startY = Number(t.clientY || 0);
      },
      { passive: true }
    );
    panel?.addEventListener(
      "touchend",
      (ev) => {
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

    saveBtn?.addEventListener("click", () => {
      const text = (ta && ta.value) ? String(ta.value).trim() : "";
      if (!text) {
        return;
      }
      try {
        const key = "vibecart-mobile-ai-feedback-log";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push({ t: Date.now(), text });
        localStorage.setItem(key, JSON.stringify(prev.slice(-40)));
        ta.value = "";
        if (saved) {
          saved.hidden = false;
          setTimeout(() => {
            saved.hidden = true;
          }, 2400);
        }
      } catch {
        /* ignore */
      }

      const base = readApiBase();
      if (base && text.length >= 4) {
        const wid =
          typeof window !== "undefined" && window.__VC_INSTALL_ID__
            ? String(window.__VC_INSTALL_ID__).trim().slice(0, 64)
            : "";
        const payload = {
          text,
          locale: (document.documentElement.lang || navigator.language || "").slice(0, 20),
          pageUrl: typeof location !== "undefined" ? String(location.href).slice(0, 512) : ""
        };
        if (wid.length >= 4) {
          payload.installId = wid;
        }
        fetch(`${base}/api/public/mobile/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
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
    if (!document.documentElement.classList.contains("vc-mobile-app")) {
      return;
    }
    if (document.getElementById("vcAppShopHub")) {
      return;
    }
    const a = document.createElement("a");
    a.id = "vcAppShopHub";
    a.className = "vc-app-shop-hub";
    a.href = "./world-shop-experience.html";
    a.setAttribute("aria-label", "Open shop lanes and trusted retailer links");
    a.textContent = "Shop lanes";
    document.body.appendChild(a);
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
    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(main.querySelectorAll("section"));
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

  function initDailyWelcomeSheet() {
    var key = "vibecart-mobile-welcome-date-v1";
    var today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === today) return;
    } catch {
      /* ignore */
    }
    if (document.getElementById("vcMobileWelcomeSheet")) return;
    var sheet = document.createElement("div");
    sheet.id = "vcMobileWelcomeSheet";
    sheet.className = "vc-mobile-welcome-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.innerHTML =
      "<div class='vc-mobile-welcome-card'>" +
      "<p class='badge'>Welcome back</p>" +
      "<h3>Your next best move is ready</h3>" +
      "<p class='note'>Choose one quick route and get value in under 30 seconds.</p>" +
      "<div class='hero-actions'>" +
      "<a class='btn btn-primary' href='./live-market-shops.html?cat=All&view=global&deal=best'>Best deals now</a>" +
      "<a class='btn btn-secondary' href='./sell-journey.html'>Start selling</a>" +
      "<button type='button' class='btn btn-secondary' id='vcMobileWelcomeClose'>Continue browsing</button>" +
      "</div>" +
      "</div>";
    document.body.appendChild(sheet);
    var close = document.getElementById("vcMobileWelcomeClose");
    function dismiss() {
      if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
      try {
        localStorage.setItem(key, today);
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
    if (!nav || document.getElementById("vcQuickActionSheet")) return;
    var sheet = document.createElement("div");
    sheet.id = "vcQuickActionSheet";
    sheet.className = "vc-quick-action-sheet";
    sheet.hidden = true;
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
    function open() {
      sheet.hidden = false;
      try {
        if (navigator && navigator.vibrate) navigator.vibrate([12, 30, 12]);
      } catch {
        /* ignore */
      }
    }
    function hide() {
      sheet.hidden = true;
    }
    close && close.addEventListener("click", hide);
    sheet.addEventListener("click", function (ev) {
      if (ev.target === sheet) hide();
    });
    var timer = 0;
    nav.addEventListener("touchstart", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(open, 520);
    }, { passive: true });
    nav.addEventListener("touchend", function () {
      window.clearTimeout(timer);
    }, { passive: true });
    nav.addEventListener("contextmenu", function (ev) {
      ev.preventDefault();
      open();
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
    window.setInterval(paint, 3400);
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
    var bar = document.createElement("div");
    bar.id = "vcFirst5Bar";
    bar.className = "vc-first5-bar";
    bar.innerHTML =
      "<a class='vc-first5-pill' href='./live-market-shops.html?cat=All&view=global&deal=best'>Deals in 1 tap</a>" +
      "<a class='vc-first5-pill' href='./hot-picks.html'>Hot picks</a>" +
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

  function boot() {
    const root = document.documentElement;
    if (detectPhoneLikeContext()) {
      root.classList.add("vc-phone");
      if (!root.classList.contains("vc-mobile-app")) {
        root.classList.add("vc-mobile-app");
      }
    }
    const isApp = root.classList.contains("vc-mobile-app");
    const isPhone = root.classList.contains("vc-phone");
    if (!isApp && !isPhone) {
      return;
    }
    if (isApp) {
      document.body.classList.add("vc-mobile-shell");
      ensureAiCoach();
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
    }
    if (isApp || isPhone) {
      enhanceHero();
      document.querySelector(".brand-mark")?.classList.add("brand-mark--shell-boost");
      initMobileFocusMode();
      initThumbFlowBoost();
      initTrustSnapshotCard();
      initDailyWelcomeSheet();
      initDailyStreakChip();
      initQuickActionSheet();
      initStoryRail();
      initSwipeSaveDeals();
      initSocialPulseTicker();
      initVibeThemeSwitch();
      initFirstFiveSecondsBar();
      initMissionHud();
      initSmartPrefetch();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
