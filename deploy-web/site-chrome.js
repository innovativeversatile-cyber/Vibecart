"use strict";

(function () {
  function ensurePwaHeadLinks() {
    try {
      var head = document.head;
      if (!head) return;
      function ensureLink(rel, href, sizes, type) {
        var selector = 'link[rel="' + rel + '"]' + (sizes ? '[sizes="' + sizes + '"]' : "");
        var el = head.querySelector(selector);
        if (!el) {
          el = document.createElement("link");
          el.setAttribute("rel", rel);
          if (sizes) el.setAttribute("sizes", sizes);
          if (type) el.setAttribute("type", type);
          head.appendChild(el);
        }
        if (!el.getAttribute("href")) {
          el.setAttribute("href", href);
        }
      }
      ensureLink("manifest", "/manifest.json");
      ensureLink("apple-touch-icon", "/icon-180.png", "180x180");
      ensureLink("apple-touch-icon-precomposed", "/icon-180.png");
      ensureLink("icon", "/icon-192.png", "192x192", "image/png");
      ensureLink("icon", "/icon-512.png", "512x512", "image/png");
    } catch {
      /* ignore */
    }
  }
  ensurePwaHeadLinks();

  var LUXE_MODE_KEY = "vibecart-luxe-mode-v1";
  var LUXE_SCORE_KEY = "vibecart-luxe-score-v1";
  var LUXE_VISIT_KEY = "vibecart-luxe-visited-v1";
  var LUXE_SCENE_KEY = "vibecart-luxe-scene-v1";
  var LUXE_MOTION_KEY = "vibecart-luxe-motion-v1";
  if (document.getElementById("vcSiteChromeBar")) {
    return;
  }
  if (document.getElementById("shopSearchForm")) {
    return;
  }
  var header = document.querySelector("header.shops-lane-topbar");
  if (!header) {
    return;
  }

  function prefersReducedMotion() {
    try {
      return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      return false;
    }
  }

  function getLuxeMode() {
    try {
      return localStorage.getItem(LUXE_MODE_KEY) !== "0";
    } catch {
      return true;
    }
  }

  function setLuxeMode(on) {
    try {
      localStorage.setItem(LUXE_MODE_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function getMotionMode() {
    try {
      var raw = String(localStorage.getItem(LUXE_MOTION_KEY) || "full").toLowerCase();
      if (raw === "calm" || raw === "still") {
        return raw;
      }
      return "full";
    } catch {
      return "full";
    }
  }

  function setMotionMode(mode) {
    try {
      localStorage.setItem(LUXE_MOTION_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  function applyMotionMode(mode) {
    document.body.classList.remove("vc-motion-full", "vc-motion-calm", "vc-motion-still");
    document.body.classList.add("vc-motion-" + mode);
  }

  var wrap = document.createElement("div");
  wrap.id = "vcSiteChromeBar";
  wrap.className = "vc-site-chrome-bar";
  wrap.setAttribute("role", "toolbar");
  wrap.setAttribute("aria-label", "Inbox shortcuts and display preferences");

  var msgLink = document.createElement("a");
  msgLink.className = "btn btn-secondary vc-site-chrome-inbox-sum";
  msgLink.href = "./seller-messages.html";
  msgLink.textContent = "✉ Messages";
  msgLink.setAttribute("aria-label", "Open buyer-seller messages");

  var inbox = document.createElement("details");
  inbox.className = "vc-site-chrome-inbox";
  var inboxSum = document.createElement("summary");
  inboxSum.className = "btn btn-secondary vc-site-chrome-inbox-more";
  inboxSum.textContent = "More";
  var inboxPanel = document.createElement("div");
  inboxPanel.className = "vc-site-chrome-inbox-panel";
  inboxPanel.setAttribute("role", "menu");
  [
    ["./seller-messages.html", "Messages hub (chat)"],
    ["./account-hub.html", "Account hub"],
    ["./buyer-orders.html", "Buyer orders"],
    ["./seller-orders.html", "Seller orders"],
    ["./my-listings.html", "My listings"],
    ["./orders-tracking.html", "Orders & tracking"],
    ["./plan-workspace.html", "Plan workspace · coach & routines"]
  ].forEach(function (pair) {
    var a = document.createElement("a");
    a.className = "btn btn-secondary vc-site-chrome-inbox-link";
    a.href = pair[0];
    a.textContent = pair[1];
    a.setAttribute("role", "menuitem");
    inboxPanel.appendChild(a);
  });
  inbox.appendChild(inboxSum);
  inbox.appendChild(inboxPanel);

  var luxeBtn = document.createElement("button");
  luxeBtn.type = "button";
  luxeBtn.className = "btn btn-secondary vc-site-chrome-luxe";
  luxeBtn.setAttribute("aria-pressed", "true");
  luxeBtn.textContent = "Luxury mode";

  wrap.appendChild(msgLink);
  wrap.appendChild(inbox);
  wrap.appendChild(luxeBtn);
  header.appendChild(wrap);

  function initLaneScrollRestore() {
    var path = String(window.location.pathname || "").replace(/\\/g, "/");
    var base = path.split("/").pop() || path;
    var isHome =
      base === "" ||
      base === "/" ||
      /^index\.html$/i.test(base);
    var key = "vibecart-scroll-y:" + String(window.location.pathname || "/");
    var navFlag = "vibecart-restore-next";
    try {
      var navEntries = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation") : [];
      var navType = navEntries && navEntries[0] ? String(navEntries[0].type || "") : "";
      /** Only restore on real back/forward — not reload; never jump the marketplace home to a deep scroll. */
      var shouldRestore = navType === "back_forward" && !isHome;
      if (shouldRestore) {
        var raw = sessionStorage.getItem(key);
        var y = Number(raw || "0");
        if (Number.isFinite(y) && y > 0) {
          window.setTimeout(function () {
            window.scrollTo({ top: y, left: 0, behavior: "auto" });
          }, 0);
        }
      }
      sessionStorage.removeItem(navFlag);
    } catch {
      /* ignore */
    }

    window.addEventListener(
      "scroll",
      function () {
        try {
          sessionStorage.setItem(key, String(Math.max(0, Math.round(window.scrollY || 0))));
        } catch {
          /* ignore */
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "click",
      function (event) {
        var target = event.target;
        var anchor = target && target.closest ? target.closest("a[href]") : null;
        if (!anchor) {
          return;
        }
        var href = String(anchor.getAttribute("href") || "").trim();
        if (!href || href[0] === "#" || /^javascript:/i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)) {
          return;
        }
        try {
          sessionStorage.setItem(key, String(Math.max(0, Math.round(window.scrollY || 0))));
          sessionStorage.setItem(navFlag, "1");
        } catch {
          /* ignore */
        }
      },
      true
    );
  }

  function initTopbarAutoHide() {
    if (!header) return;
    if (header.getAttribute("data-vc-nav-autohide-bound") === "1") return;
    header.setAttribute("data-vc-nav-autohide-bound", "1");
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
      header.classList.toggle("vc-nav-hidden", hidden);
      header.setAttribute("data-vc-nav-state", hidden ? "hidden" : "visible");
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

  function initBackToTop() {
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

  function initDeadEndLinkGuard() {
    if (document.body.getAttribute("data-vc-deadend-guard") === "1") return;
    document.body.setAttribute("data-vc-deadend-guard", "1");
    document.addEventListener(
      "click",
      function (event) {
        var anchor = event.target && event.target.closest ? event.target.closest("a[href='#']") : null;
        if (!anchor) return;
        event.preventDefault();
        var hint = anchor.getAttribute("data-vc-href-hint");
        if (hint) {
          try {
            window.location.assign(String(hint));
          } catch {
            /* ignore */
          }
        }
      },
      true
    );
  }

  function initUnstuckGuard() {
    if (!document.body || document.body.getAttribute("data-vc-unstuck-guard") === "1") return;
    document.body.setAttribute("data-vc-unstuck-guard", "1");
    function findBusyButton(form) {
      if (!form || !form.querySelector) return null;
      return form.querySelector("button[disabled], input[type='submit'][disabled]");
    }
    function releaseIfStuck(form, startedAt) {
      var btn = findBusyButton(form);
      if (!btn) return;
      var age = Date.now() - startedAt;
      if (age < 12000) return;
      btn.disabled = false;
      if (!form.querySelector(".vc-unstuck-note")) {
        var note = document.createElement("p");
        note.className = "note vc-unstuck-note";
        note.textContent = "This action took too long. Please try again, or use Account hub if payment/sign-in did not continue.";
        form.appendChild(note);
      }
    }
    document.addEventListener(
      "submit",
      function (event) {
        var form = event.target;
        if (!form || !form.tagName || String(form.tagName).toLowerCase() !== "form") return;
        var startedAt = Date.now();
        window.setTimeout(function () {
          releaseIfStuck(form, startedAt);
        }, 12500);
      },
      true
    );
    window.addEventListener("offline", function () {
      if (document.getElementById("vcOfflineSticky")) return;
      var bar = document.createElement("div");
      bar.id = "vcOfflineSticky";
      bar.style.cssText =
        "position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;padding:10px 12px;border-radius:10px;background:#1f2937;color:#fff;font-size:13px";
      bar.textContent =
        "You appear offline. Actions may pause. Reconnect and retry; your account and recovery links remain available.";
      document.body.appendChild(bar);
    });
    window.addEventListener("online", function () {
      var bar = document.getElementById("vcOfflineSticky");
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    });
  }

  function initRecoveryToastAndFetchGuard() {
    if (typeof window === "undefined" || window.__vcRecoveryToastBound === "1") return;
    window.__vcRecoveryToastBound = "1";
    var toast = document.createElement("div");
    toast.id = "vcRecoveryToast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:62px;z-index:100000;padding:10px 12px;border-radius:12px;background:#111827;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.35);display:none";
    var msg = document.createElement("div");
    msg.id = "vcRecoveryToastMsg";
    msg.style.cssText = "font-size:13px;line-height:1.35;margin-bottom:8px";
    var actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
    var retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "btn btn-secondary";
    retryBtn.textContent = "Retry";
    var hubBtn = document.createElement("a");
    hubBtn.className = "btn btn-secondary";
    hubBtn.href = "./account-hub.html";
    hubBtn.textContent = "Account hub";
    var restoreBtn = document.createElement("a");
    restoreBtn.className = "btn btn-secondary";
    restoreBtn.href = "./coach-payment-recovery.html";
    restoreBtn.textContent = "Restore access";
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn btn-secondary";
    closeBtn.textContent = "Close";
    actions.appendChild(retryBtn);
    actions.appendChild(hubBtn);
    actions.appendChild(restoreBtn);
    actions.appendChild(closeBtn);
    toast.appendChild(msg);
    toast.appendChild(actions);
    document.body.appendChild(toast);
    var retryFn = null;
    function hideToast() {
      toast.style.display = "none";
      retryFn = null;
    }
    function showToast(message, onRetry) {
      msg.textContent = String(message || "Action failed. You can retry or open account recovery.");
      toast.style.display = "block";
      retryFn = typeof onRetry === "function" ? onRetry : null;
    }
    function postClientEvent(eventType, severity, message, payload) {
      try {
        origFetch("/api/public/telemetry/client-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: String(eventType || "client_event"),
            severity: String(severity || "info"),
            message: String(message || "").slice(0, 500),
            pagePath: String((window.location && window.location.pathname) || "").slice(0, 255),
            payload: payload || {}
          })
        }).catch(function () {});
      } catch {
        /* ignore */
      }
    }
    retryBtn.addEventListener("click", function () {
      if (retryFn) {
        var fn = retryFn;
        hideToast();
        fn();
        return;
      }
      window.location.reload();
    });
    closeBtn.addEventListener("click", hideToast);
    window.addEventListener("vc:recovery-toast", function (event) {
      var detail = (event && event.detail) || {};
      showToast(detail.message || "Action did not complete.", detail.onRetry || null);
    });

    if (window.__vcFetchGuardBound === "1") return;
    window.__vcFetchGuardBound = "1";
    var origFetch = window.fetch;
    if (typeof origFetch !== "function") return;
    window.fetch = function (input, init) {
      var reqUrl = typeof input === "string" ? input : input && input.url ? String(input.url) : "";
      var isApi = /\/api\//i.test(reqUrl);
      if (!isApi) {
        return origFetch(input, init);
      }
      var method = String((init && init.method) || "GET").toUpperCase();
      var timeoutMs = method === "GET" ? 20000 : 25000;
      var doFetch = function () {
        var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        var timer = null;
        var nextInit = Object.assign({}, init || {});
        if (controller && !nextInit.signal) {
          nextInit.signal = controller.signal;
        }
        if (controller) {
          timer = window.setTimeout(function () {
            try {
              controller.abort();
            } catch {
              /* ignore */
            }
          }, timeoutMs);
        }
        return origFetch(input, nextInit)
          .then(function (res) {
            if (timer) window.clearTimeout(timer);
            if (!res || !res.ok) {
              postClientEvent("api_non_ok", "warn", "API response not ok", {
                status: res ? Number(res.status || 0) : 0,
                url: reqUrl
              });
              /* 4xx responses usually carry { code, message } for the page to show — avoid scary global toast. */
              var st = res ? Number(res.status || 0) : 0;
              if (st >= 500 || st === 0) {
                showToast(
                  "Request did not complete successfully. Retry now or open Account hub.",
                  function () {
                    doFetch().catch(function () {});
                  }
                );
              }
            }
            return res;
          })
          .catch(function (err) {
            if (timer) window.clearTimeout(timer);
            postClientEvent(
              String(err && err.name) === "AbortError" ? "api_timeout" : "api_network_error",
              "error",
              String((err && err.message) || "Request failed"),
              { url: reqUrl, method: method }
            );
            showToast(
              String(err && err.name) === "AbortError"
                ? "Request timed out. Check your network and retry."
                : "Network issue detected. Retry now or open recovery.",
              function () {
                doFetch().catch(function () {});
              }
            );
            throw err;
          });
      };
      return doFetch();
    };
  }

  function applyLuxeClasses(on) {
    document.body.classList.toggle("vc-luxe-on", !!on);
    document.body.classList.toggle("vc-luxe-off", !on);
    luxeBtn.setAttribute("aria-pressed", on ? "true" : "false");
    luxeBtn.textContent = on ? "Luxury mode" : "Calm mode";
  }

  function bootLuxeMode() {
    var on = getLuxeMode();
    var motion = getMotionMode();
    applyLuxeClasses(on);
    applyMotionMode(motion);
  }

  luxeBtn.addEventListener("click", function () {
    var next = !document.body.classList.contains("vc-luxe-on");
    setLuxeMode(next);
    applyLuxeClasses(next);
  });

  document.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
      return;
    }
    if (event.shiftKey && (event.key === "L" || event.key === "l")) {
      event.preventDefault();
      luxeBtn.click();
    }
  });

  function initRevealEffects() {
    if (!("IntersectionObserver" in window)) {
      return;
    }
    /* Coach / wellbeing: bottom sections often never satisfy the IO rootMargin; they stay at
       opacity ~0 from .vc-luxe-reveal and taps never reach "Generate recommendation". */
    if (document.body && document.body.classList.contains("health-coach-page")) {
      return;
    }
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll(
        "main section, main > .vc-biz-card, main > .vc-biz-hero, .hero-card, .card, .shop-folder-card, .pill-card, .settings-card, .command-card"
      )
    );
    if (!nodes.length) {
      return;
    }
    nodes.forEach(function (node, idx) {
      if (!node.classList.contains("vc-luxe-reveal")) {
        node.classList.add("vc-luxe-reveal");
        node.style.setProperty("--vc-reveal-delay", Math.min(idx * 28, 380) + "ms");
      }
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("vc-luxe-reveal-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach(function (node) {
      io.observe(node);
    });
  }

  function initPointerAmbience() {
    if (prefersReducedMotion() || getMotionMode() === "still") {
      return;
    }
    var sparkLayer = document.createElement("div");
    sparkLayer.className = "vc-luxe-spark-layer";
    sparkLayer.setAttribute("aria-hidden", "true");
    document.body.appendChild(sparkLayer);

    var lastSpark = 0;
    document.addEventListener(
      "pointermove",
      function (event) {
        var x = Number(event.clientX || 0);
        var y = Number(event.clientY || 0);
        var xPct = Math.max(0, Math.min(100, (x / Math.max(window.innerWidth, 1)) * 100));
        var yPct = Math.max(0, Math.min(100, (y / Math.max(window.innerHeight, 1)) * 100));
        document.documentElement.style.setProperty("--vc-cx", xPct.toFixed(2) + "%");
        document.documentElement.style.setProperty("--vc-cy", yPct.toFixed(2) + "%");

        if (!document.body.classList.contains("vc-luxe-on") || getMotionMode() !== "full") {
          return;
        }
        var now = Date.now();
        if (now - lastSpark < 88) {
          return;
        }
        lastSpark = now;
        var spark = document.createElement("span");
        spark.className = "vc-luxe-spark";
        spark.style.left = x + "px";
        spark.style.top = y + "px";
        spark.style.setProperty("--drift-x", Math.round((Math.random() - 0.5) * 44) + "px");
        spark.style.setProperty("--drift-y", String(-22 - Math.round(Math.random() * 42)) + "px");
        sparkLayer.appendChild(spark);
        window.setTimeout(function () {
          if (spark && spark.parentNode) {
            spark.parentNode.removeChild(spark);
          }
        }, 1200);
      },
      { passive: true }
    );
  }

  function initMagneticDepth() {
    if (prefersReducedMotion() || getMotionMode() === "still") {
      return;
    }
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll(".btn, .card, .shop-folder-card, .hero-card, .settings-card, .command-card")
    );
    if (!candidates.length) {
      return;
    }
    candidates.forEach(function (el) {
      if (el.dataset.vcMagneticBound === "1") {
        return;
      }
      el.dataset.vcMagneticBound = "1";
      el.addEventListener("pointermove", function (event) {
        if (!document.body.classList.contains("vc-luxe-on") || getMotionMode() === "still") {
          return;
        }
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }
        var relX = (event.clientX - rect.left) / rect.width;
        var relY = (event.clientY - rect.top) / rect.height;
        var tx = (relX - 0.5) * 8;
        var ty = (relY - 0.5) * 8;
        el.style.setProperty("--vc-tilt-x", tx.toFixed(2) + "px");
        el.style.setProperty("--vc-tilt-y", ty.toFixed(2) + "px");
        el.style.setProperty("--vc-sheen-x", (relX * 100).toFixed(2) + "%");
        el.style.setProperty("--vc-sheen-y", (relY * 100).toFixed(2) + "%");
        el.classList.add("vc-magnetic-live");
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("vc-magnetic-live");
        el.style.removeProperty("--vc-tilt-x");
        el.style.removeProperty("--vc-tilt-y");
      });
      el.addEventListener("focusin", function () {
        el.classList.add("vc-focus-rich");
      });
      el.addEventListener("focusout", function () {
        el.classList.remove("vc-focus-rich");
      });
    });
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }

  function initSceneDirector() {
    function autoSceneByTime() {
      var hour = new Date().getHours();
      var scene = "night";
      if (hour >= 5 && hour < 11) {
        scene = "dawn";
      } else if (hour >= 11 && hour < 17) {
        scene = "day";
      } else if (hour >= 17 && hour < 21) {
        scene = "dusk";
      }
      return scene;
    }
    function getSceneMode() {
      try {
        var raw = String(localStorage.getItem(LUXE_SCENE_KEY) || "auto").toLowerCase();
        if (raw === "auto" || raw === "dawn" || raw === "day" || raw === "dusk" || raw === "night") {
          return raw;
        }
      } catch {
        /* ignore */
      }
      return "auto";
    }
    function applyScene(mode) {
      var resolved = mode === "auto" ? autoSceneByTime() : mode;
      document.body.classList.remove("vc-scene-dawn", "vc-scene-day", "vc-scene-dusk", "vc-scene-night");
      document.body.classList.add("vc-scene-" + resolved);
      return resolved;
    }
    applyScene(getSceneMode());
    return {
      getMode: getSceneMode,
      setMode: function (mode) {
        try {
          localStorage.setItem(LUXE_SCENE_KEY, mode);
        } catch {
          /* ignore */
        }
        return applyScene(mode);
      }
    };
  }

  function initExperienceConsole(sceneDirector) {
    var shell = document.createElement("div");
    shell.className = "vc-experience-shell";

    var openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn btn-secondary vc-experience-open";
    openBtn.textContent = "Experience";
    openBtn.setAttribute("aria-expanded", "false");

    var panel = document.createElement("div");
    panel.className = "vc-experience-panel hidden";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Experience Console");
    panel.innerHTML =
      "<h3>Experience Console</h3>" +
      "<p class='note'>Tune your world instantly.</p>" +
      "<label>Scene mood</label>" +
      "<select id='vcExpScene'><option value='auto'>Auto</option><option value='dawn'>Dawn</option><option value='day'>Day</option><option value='dusk'>Dusk</option><option value='night'>Night</option></select>" +
      "<label>Motion style</label>" +
      "<select id='vcExpMotion'><option value='full'>Full cinematic</option><option value='calm'>Calm</option><option value='still'>Still</option></select>" +
      "<div class='vc-welcome-actions'>" +
      "<a class='btn btn-secondary' href='./index.html'>Home</a>" +
      "<a class='btn btn-secondary' href='./regional-shops.html'>Shops</a>" +
      "<a class='btn btn-secondary' href='./account-hub.html'>Account</a>" +
      "<button type='button' class='btn btn-secondary' id='vcExpSurprise'>Surprise me</button>" +
      "</div>";

    shell.appendChild(openBtn);
    shell.appendChild(panel);
    document.body.appendChild(shell);

    var sceneSelect = panel.querySelector("#vcExpScene");
    var motionSelect = panel.querySelector("#vcExpMotion");
    var surpriseBtn = panel.querySelector("#vcExpSurprise");
    if (sceneSelect) {
      sceneSelect.value = sceneDirector.getMode();
      sceneSelect.addEventListener("change", function () {
        sceneDirector.setMode(String(sceneSelect.value || "auto"));
      });
    }
    if (motionSelect) {
      motionSelect.value = getMotionMode();
      motionSelect.addEventListener("change", function () {
        var mode = String(motionSelect.value || "full");
        setMotionMode(mode);
        applyMotionMode(mode);
      });
    }
    if (surpriseBtn) {
      surpriseBtn.addEventListener("click", function () {
        document.body.classList.add("vc-luxe-surprise");
        window.setTimeout(function () {
          document.body.classList.remove("vc-luxe-surprise");
        }, 1800);
      });
    }
    openBtn.addEventListener("click", function () {
      var opening = panel.classList.contains("hidden");
      panel.classList.toggle("hidden", !opening);
      openBtn.setAttribute("aria-expanded", opening ? "true" : "false");
    });
  }

  function initLuxeScore() {
    var badge = document.createElement("div");
    badge.className = "vc-luxe-score";
    badge.setAttribute("aria-live", "polite");
    badge.setAttribute("title", "Your VibeCart luxury journey score");
    document.body.appendChild(badge);

    var score = Number(localStorage.getItem(LUXE_SCORE_KEY) || "0");
    var visits = readJson(LUXE_VISIT_KEY, {});
    var path = String(window.location.pathname || "index.html").toLowerCase();
    if (!visits[path]) {
      visits[path] = 1;
      score += 7;
      writeJson(LUXE_VISIT_KEY, visits);
    }
    function writeScore() {
      try {
        localStorage.setItem(LUXE_SCORE_KEY, String(score));
      } catch {
        /* ignore */
      }
      var tier = "Explorer";
      if (score >= 280) {
        tier = "Legend";
      } else if (score >= 180) {
        tier = "Elite";
      } else if (score >= 90) {
        tier = "Signature";
      }
      badge.textContent = "Luxe Score " + score + " · " + tier;
    }
    writeScore();

    var gain = function (amount) {
      score += amount;
      writeScore();
    };
    document.addEventListener("click", function (event) {
      var t = event.target;
      var interactive = t && t.closest ? t.closest(".btn, a, .card, .shop-folder-card") : null;
      if (interactive) {
        gain(1);
      }
    });
    window.setInterval(function () {
      if (document.body.classList.contains("vc-luxe-on")) {
        gain(1);
      }
    }, 45000);
  }

  bootLuxeMode();
  initLaneScrollRestore();
  initTopbarAutoHide();
  initBackToTop();
  initDeadEndLinkGuard();
  initUnstuckGuard();
  initRecoveryToastAndFetchGuard();
  var sceneDirector = initSceneDirector();
  initRevealEffects();
  initPointerAmbience();
  initMagneticDepth();
  var coachLane = document.body && document.body.classList.contains("health-coach-page");
  if (!coachLane) {
    initLuxeScore();
    initExperienceConsole(sceneDirector);
  }
})();

(function scheduleBrandonUniversal() {
  if (typeof window === "undefined" || window.__vcBrandonUniversalScheduled === "1") {
    return;
  }
  window.__vcBrandonUniversalScheduled = "1";
  var SHELL = "./mobile-app-shell.js?v=20260507brandonfix2";
  var CLIENT = "./vibecart-ai-client.js?v=20260430genai1";
  function skip() {
    if (!document.body) return true;
    if (document.body.classList.contains("vc-no-brandon")) return true;
    var p = String((typeof location !== "undefined" && location.pathname) || "").toLowerCase();
    if (p.indexOf("admin-app") >= 0) return true;
    return false;
  }
  function inject() {
    if (document.getElementById("vc-mobile-ai")) return;
    if (document.querySelector('script[src*="mobile-app-shell"]')) return;
    if (skip()) return;
    function loadScript(src, onload) {
      var s = document.createElement("script");
      s.src = src;
      s.defer = true;
      if (onload) s.onload = onload;
      (document.body || document.head).appendChild(s);
    }
    function bootBrandon() {
      if (typeof window.vibeCartBootBrandonUniversal === "function") {
        window.vibeCartBootBrandonUniversal();
      }
    }
    if (typeof window.vibecartAiGenerate === "function") {
      loadScript(SHELL, bootBrandon);
    } else {
      loadScript(CLIENT, function () {
        loadScript(SHELL, bootBrandon);
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  } else {
    inject();
  }
})();

(function scheduleVcVisualMotion() {
  if (typeof window === "undefined" || window.__vcVisualMotionScheduled === "1") {
    return;
  }
  window.__vcVisualMotionScheduled = "1";
  var src = "./vc-visual-motion.js?v=20260502bundlehero2";
  function inject() {
    if (window.__vcVisualMotionLoaded === "1") {
      return;
    }
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = function () {
      window.__vcVisualMotionLoaded = "1";
    };
    (document.head || document.documentElement).appendChild(s);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  } else {
    inject();
  }
})();

(function scheduleVcAnalyticsVisit() {
  if (typeof window === "undefined" || window.__vcAnalyticsVisitScheduled === "1") {
    return;
  }
  window.__vcAnalyticsVisitScheduled = "1";
  var src = "./analytics-visit.js?v=20260501visit1";
  function inject() {
    if (window.__vcAnalyticsVisitLoaded === "1") {
      return;
    }
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = function () {
      window.__vcAnalyticsVisitLoaded = "1";
    };
    (document.head || document.documentElement).appendChild(s);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  } else {
    inject();
  }
})();
