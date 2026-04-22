"use strict";

(function () {
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

  function isLoggedIn() {
    try {
      var token = localStorage.getItem("vibecart-public-auth-token");
      var user = localStorage.getItem("vibecart-public-auth-user");
      return Boolean(String(token || "").trim() && String(user || "").trim());
    } catch {
      return false;
    }
  }

  var wrap = document.createElement("div");
  wrap.id = "vcSiteChromeBar";
  wrap.className = "vc-site-chrome-bar";
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", "Site search and inbox");

  var form = document.createElement("form");
  form.className = "vc-site-chrome-search";
  form.setAttribute("role", "search");
  form.setAttribute("aria-label", "Search VibeCart and web");

  var inp = document.createElement("input");
  inp.type = "search";
  inp.className = "shop-search-input";
  inp.placeholder = "Search site + web…";
  inp.setAttribute("maxlength", "120");
  inp.setAttribute("autocomplete", "off");

  var btn = document.createElement("button");
  btn.type = "submit";
  btn.className = "btn btn-secondary";
  btn.textContent = "Find";

  form.appendChild(inp);
  form.appendChild(btn);

  var inbox = document.createElement("a");
  inbox.className = "btn btn-secondary vc-site-chrome-inbox";
  inbox.href = "./index.html#communication";
  inbox.textContent = isLoggedIn() ? "✉ Inbox" : "✉ Inbox (sign in)";

  var luxeBtn = document.createElement("button");
  luxeBtn.type = "button";
  luxeBtn.className = "btn btn-secondary vc-site-chrome-luxe";
  luxeBtn.setAttribute("aria-pressed", "true");
  luxeBtn.textContent = "Luxury mode";

  wrap.appendChild(form);
  wrap.appendChild(inbox);
  wrap.appendChild(luxeBtn);
  header.appendChild(wrap);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var q = String(inp.value || "").trim();
    if (!q) {
      return;
    }
    window.location.assign("./global-search.html?q=" + encodeURIComponent(q));
  });

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
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll("main section, .hero-card, .card, .shop-folder-card, .pill-card, .settings-card, .command-card")
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
  var sceneDirector = initSceneDirector();
  initRevealEffects();
  initPointerAmbience();
  initMagneticDepth();
  initLuxeScore();
  initExperienceConsole(sceneDirector);
})();
