(function () {
  var PUBLIC_AUTH_TOKEN_KEY = "vibecart-public-auth-token";

  function byId(id) {
    return document.getElementById(id);
  }

  function readPlanViewMode() {
    try {
      return String(localStorage.getItem("vibecart-plan-view-mode") || "").trim().toLowerCase();
    } catch {
      return "";
    }
  }

  function savePlanViewMode(mode) {
    try {
      localStorage.setItem("vibecart-plan-view-mode", String(mode || "merged").trim().toLowerCase());
    } catch {
      /* ignore */
    }
    pushRemotePlanViewMode(mode);
  }

  function getPublicAuthToken() {
    try {
      return String(localStorage.getItem(PUBLIC_AUTH_TOKEN_KEY) || "").trim();
    } catch {
      return "";
    }
  }

  function recoverTokenFromServerSession() {
    var existingToken = getPublicAuthToken();
    var headers = undefined;
    if (existingToken) {
      headers =
        window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.authHeaders === "function"
          ? window.VibeCartSessionDevice.authHeaders(existingToken)
          : { Authorization: "Bearer " + existingToken };
    }
    return fetch("/api/public/auth/session", { credentials: "same-origin", headers: headers })
      .then(function (res) {
        return res.json().catch(function () {
          return {};
        });
      })
      .then(function (body) {
        if (!body || !body.ok || !body.user || !body.token) {
          return "";
        }
        var t = String(body.token || "").trim();
        if (!t) {
          return "";
        }
        try {
          localStorage.setItem(PUBLIC_AUTH_TOKEN_KEY, t);
          localStorage.setItem("vibecart-public-auth-user", JSON.stringify(body.user));
        } catch {
          /* ignore */
        }
        return t;
      })
      .catch(function () {
        return "";
      });
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    var raw = atob(base64);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) {
      arr[i] = raw.charCodeAt(i);
    }
    return arr;
  }

  function postJsonAuth(path, token, bodyObj) {
    var h = { "Content-Type": "application/json", Authorization: "Bearer " + token };
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
      h = window.VibeCartSessionDevice.merge(token, { "Content-Type": "application/json" });
    }
    return fetch(path, {
      method: "POST",
      headers: h,
      body: JSON.stringify(bodyObj || {})
    });
  }

  function registerBrowserWebPushSubscription(token, statusEl) {
    if (!token || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return Promise.resolve(false);
    }
    function set(msg) {
      if (statusEl) {
        statusEl.textContent = String(msg || "");
      }
    }
    return fetch("/api/public/web-push/config")
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (!j || !j.ok || !j.publicKey) {
          return false;
        }
        return navigator.serviceWorker.register("./service-worker.js?v=20260508force1").then(function (reg) {
          return reg.pushManager.getSubscription().then(function (existing) {
            if (existing) {
              return existing;
            }
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(String(j.publicKey))
            });
          });
        });
      })
      .then(function (sub) {
        if (!sub || sub === false) {
          return false;
        }
        return postJsonAuth("/api/public/account/web-push/register", token, { subscription: sub.toJSON() }).then(function (r) {
          return r.json().then(function (body) {
            return { ok: r.ok, body: body };
          });
        });
      })
      .then(function (x) {
        if (x && x.ok && x.body && x.body.ok) {
          set("Signed in: this device is registered for coach alerts on your phone.");
          return true;
        }
        return false;
      })
      .catch(function () {
        return false;
      });
  }

  function sendCoachEncouragePush(token, title, message) {
    if (!token || !message) {
      return;
    }
    postJsonAuth("/api/public/account/coach-workspace/encourage-push", token, {
      title: title || "Your coach is with you",
      message: String(message).slice(0, 500)
    }).catch(function () {});
  }

  function fetchRemotePlanViewMode() {
    var token = getPublicAuthToken();
    if (!token) {
      return Promise.resolve("");
    }
    var gh = { Authorization: "Bearer " + token };
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.authHeaders === "function") {
      gh = window.VibeCartSessionDevice.authHeaders(token);
    }
    return fetch("/api/public/user/preferences", {
      headers: gh
    })
      .then(function (res) {
        if (!res.ok) {
          return null;
        }
        return res.json().catch(function () { return null; });
      })
      .then(function (body) {
        if (!body || !body.ok || !body.preferences) {
          return "";
        }
        return String(body.preferences.planViewMode || "").trim().toLowerCase();
      })
      .catch(function () {
        return "";
      });
  }

  function pushRemotePlanViewMode(mode) {
    var token = getPublicAuthToken();
    if (!token) {
      return;
    }
    var ph = { "Content-Type": "application/json", Authorization: "Bearer " + token };
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
      ph = window.VibeCartSessionDevice.merge(token, { "Content-Type": "application/json" });
    }
    fetch("/api/public/user/preferences", {
      method: "POST",
      headers: ph,
      body: JSON.stringify({
        preferences: {
          planViewMode: String(mode || "merged").trim().toLowerCase()
        }
      })
    }).catch(function () {
      /* ignore */
    });
  }

  function readParams() {
    var params = new URLSearchParams(window.location.search || "");
    return {
      flow: String(params.get("flow") || "coach").toLowerCase(),
      plan: String(params.get("plan") || "starter").toLowerCase(),
      addonPlan: String(params.get("addonPlan") || "").toLowerCase(),
      provider: String(params.get("provider") || "card").toLowerCase(),
      sessionId: String(params.get("session_id") || "").trim()
    };
  }

  function normalizePlan(plan) {
    var p = String(plan || "").toLowerCase();
    if (p === "pro" || p === "plus" || p === "ai-home" || p === "starter") {
      return p;
    }
    return "starter";
  }

  function packageLabel(flow, plan) {
    if (flow === "insurance") {
      if (plan === "shield-pro") return "Health Shield Pro";
      if (plan === "family-protect") return "Family Protect";
      return "Student Lite";
    }
    if (plan === "pro") return "Coach Pro Elite";
    if (plan === "plus") return "Coach Plus Gym";
    if (plan === "ai-home") return "AI Home + Meals";
    return "Starter Coach";
  }

  function planCapabilities(flow, ownedPlans) {
    var plans = Array.isArray(ownedPlans) ? ownedPlans.map(normalizePlan) : [normalizePlan(ownedPlans)];
    var has = function (id) {
      return plans.indexOf(id) >= 0;
    };
    var base = {
      routines: true,
      updates: true,
      meals: false,
      prep: false,
      homeOnly: false,
      gymMode: false,
      advancedPeriodization: false,
      aiAutonomy: true,
      extraCheckins: false
    };
    if (flow === "insurance") {
      return {
        routines: true,
        updates: true,
        meals: false,
        prep: false,
        homeOnly: false,
        gymMode: false,
        advancedPeriodization: false,
        aiAutonomy: false,
        extraCheckins: false
      };
    }
    if (has("ai-home") || has("plus") || has("pro")) {
      base.meals = true;
      base.prep = true;
    }
    if (has("ai-home")) {
      base.homeOnly = true;
    }
    if (has("plus") || has("pro")) {
      base.gymMode = true;
      base.extraCheckins = true;
    }
    if (has("pro")) {
      base.advancedPeriodization = true;
    }
    return base;
  }

  function workoutDayTemplate(day, focus, warmup, blockA, blockB, cardio, cooldown) {
    return [
      day + " - " + focus,
      "  Warm-up (8-12 min): " + warmup,
      "  Block A: " + blockA,
      "  Block B: " + blockB,
      "  Cardio (12-20 min): " + cardio,
      "  Cool-down (8-10 min): " + cooldown
    ];
  }

  function buildWeeklySplit(caps) {
    var plan = [];
    if (caps.homeOnly) {
      plan = plan.concat(
        workoutDayTemplate(
          "Day 1",
          "Lower body + core (home)",
          "marching in place, hip circles, ankle mobility",
          "Goblet/bodyweight squat 4x12, reverse lunge 3x10/leg",
          "Glute bridge 4x15, plank shoulder taps 3x16",
          "Brisk walk or step-ups intervals",
          "hamstring stretch, calf stretch, box breathing"
        ),
        workoutDayTemplate(
          "Day 2",
          "Upper push + posture (home)",
          "band pull-aparts, wall slides, arm circles",
          "Incline push-up 4x10, pike push-up 3x8",
          "Chair dips 3x12, dead bug 3x12/side",
          "Low-impact HIIT 30/30 x 12 rounds",
          "chest opener, triceps stretch, thoracic rotations"
        ),
        workoutDayTemplate(
          "Day 3",
          "Conditioning + mobility",
          "joint mobility flow, light skipping",
          "Circuit 4 rounds: squat thrust x12, mountain climbers x30s",
          "Single-leg RDL 3x10/leg, side plank 3x30s/side",
          "Zone 2 cardio 20 min",
          "long mobility flow + diaphragmatic breathing"
        ),
        workoutDayTemplate(
          "Day 4",
          "Lower strength endurance",
          "glute activation + adductor rockbacks",
          "Split squat 4x10/leg, tempo squat 3x12",
          "Calf raise 4x20, hollow hold 3x30s",
          "Bike/walk intervals 1:1 x 16 min",
          "quad/hip-flexor stretches + recovery breathing"
        ),
        workoutDayTemplate(
          "Day 5",
          "Upper pull + core stability",
          "band rows activation, scap circles",
          "Resistance-band row 4x12, rear-delt fly 3x15",
          "Biceps curl 3x12, suitcase carry 4x30m",
          "Shadow boxing intervals 10-15 min",
          "lat stretch, neck release, child pose"
        ),
        ["Day 6 - Active recovery walk + light stretching (25-45 min)"],
        ["Day 7 - Rest, hydration, sleep target, and weekly check-in"]
      );
      return plan;
    }
    plan = plan.concat(
      workoutDayTemplate(
        "Day 1",
        "Gym push (chest/shoulders/triceps)",
        "5 min incline walk + shoulder prep",
        "Bench press 4x6-8, incline DB press 3x8-10",
        "Shoulder press 4x8, cable fly 3x12, triceps pushdown 3x12",
        "Incline treadmill 15 min zone 2",
        "pec stretch, shoulder stretch, breath down-regulation"
      ),
      workoutDayTemplate(
        "Day 2",
        "Gym lower (quads/glutes/core)",
        "bike 6 min + hip mobility",
        "Back squat 4x6-8, Romanian deadlift 4x8",
        "Leg press 3x12, walking lunge 3x12/leg, plank 3x45s",
        "Rower intervals 45/75 x 8",
        "hamstring, hip-flexor, glute stretches"
      ),
      workoutDayTemplate(
        "Day 3",
        "Cardio + mobility reset",
        "light jump rope + dynamic mobility",
        "Zone 2 cardio 30-40 min",
        "Core: dead bug 3x12/side, pallof press 3x12/side",
        "Optional finisher bike 8 min",
        "full-body stretch and foam rolling"
      ),
      workoutDayTemplate(
        "Day 4",
        "Gym pull (back/biceps)",
        "lat activation + thoracic mobility",
        "Deadlift or trap-bar deadlift 4x5",
        "Lat pulldown 4x10, seated row 3x12, biceps curl 3x12",
        "SkiErg intervals 12 min",
        "lat stretch, forearm release, breathing"
      ),
      workoutDayTemplate(
        "Day 5",
        "Full-body hypertrophy + conditioning",
        "dynamic warm-up + activation circuits",
        "DB thruster 4x10, split squat 3x10/leg",
        "Cable row 3x12, push-up 3xAMRAP, farmer carry 4x30m",
        "Assault bike 10-15 min",
        "recovery stretch flow + box breathing"
      ),
      ["Day 6 - Optional light cardio + mobility (30-40 min)"],
      ["Day 7 - Rest, readiness score check, weekly report + progression"]
    );
    return plan;
  }

  function buildRoutine(input, flow, ownedPlans) {
    var plans = Array.isArray(ownedPlans) ? ownedPlans : [ownedPlans];
    var caps = planCapabilities(flow, plans);
    var labels = plans.map(function (p) { return packageLabel(flow, p); });
    var lines = [];
    var weekly = buildWeeklySplit(caps);
    lines.push("Active package(s): " + labels.join(" + "));
    lines.push("Goal focus: " + (input.goal || "General wellness"));
    lines.push("Training window: " + (input.wake || "Morning"));
    lines.push("Current activity level: " + (input.activity || "medium"));
    lines.push("");
    lines.push("Coach autonomy engine:");
    lines.push("- AI runs weekly planning, daily session drafting, and end-of-day adaptation from check-ins.");
    lines.push("- AI tracks intensity, recovery, mood, soreness, and completion before generating next day.");
    lines.push("- AI auto-generates motivational nudges and sends reminders on your training schedule.");
    lines.push("");
    lines.push("7-day real workout blueprint:");
    weekly.forEach(function (line) {
      if (Array.isArray(line)) {
        line.forEach(function (nested) { lines.push(nested); });
        return;
      }
      lines.push(line);
    });
    lines.push("");
    if (caps.meals) {
      lines.push("Meal and prep system (enabled):");
      lines.push("- Nutrition style: " + (input.diet || "Balanced"));
      lines.push("- Daily structure: breakfast, lunch, dinner, and one optional snack.");
      lines.push("- Weekly prep: 2 prep blocks (Sun/Wed), shopping list, batch-cook guidance.");
      lines.push("- Macros and portions are tuned by AI from weekly check-ins and target pace.");
      lines.push("- Hydration, protein timing, and post-workout recovery meals are included.");
    } else {
      lines.push("Nutrition scope:");
      lines.push("- This package excludes meal plans by design.");
      lines.push("- Upgrade from package 2+ to unlock complete meal prep and diet planning.");
    }
    lines.push("");
    lines.push("Check-ins and progression:");
    lines.push("- Daily check-in: workout complete, effort score (1-10), soreness, mood, and sleep.");
    lines.push("- Weekly check-in: scale trend, body measurements, and adherence review.");
    if (caps.extraCheckins) {
      lines.push("- Mid-week coach intervention is active for faster correction and accountability.");
    }
    if (caps.advancedPeriodization) {
      lines.push("- Pro periodization enabled: volume/intensity waves with deload recommendations.");
    }
    if (flow === "insurance") {
      lines.push("Insurance support:");
      lines.push("- Preventive routine reminders and wellness compliance updates.");
    }
    if (input.notes) {
      lines.push("Care notes to respect: " + input.notes);
    }
    return lines.join("\n");
  }

  function buildNotifications(flow, ownedPlans) {
    var plans = Array.isArray(ownedPlans) ? ownedPlans : [ownedPlans];
    var caps = planCapabilities(flow, plans);
    var list = [
      "06:30 - Warm-up alert: mobility + breathing starts in 15 minutes.",
      "Post-workout - Log sets/reps completed so AI can tune tomorrow's intensity.",
      "20:30 - Daily check-in: soreness, mood, sleep target, and encouragement message.",
      "Sunday - Weekly review: progression, body-target split changes, and next plan draft."
    ];
    if (flow === "coach" && caps.meals) {
      list.push("Meal prep alert: your shopping list and prep flow are ready.");
      list.push("Nutrition update: AI adjusted portions and calories from check-in data.");
    }
    if (flow === "coach" && caps.homeOnly) {
      list.push("Home session alert: no-equipment routine with clear reps/sets is ready.");
    }
    if (flow === "coach" && caps.gymMode) {
      list.push("Gym lane alert: today's equipment-based split and rest timers are loaded.");
    }
    if (flow === "coach" && caps.extraCheckins) {
      list.push("Mid-week intervention: coach AI detected drift and updated your next 3 sessions.");
    }
    if (flow === "coach" && caps.advancedPeriodization) {
      list.push("Pro alert: periodization cycle updated (load progression + deload guidance).");
    }
    if (flow === "insurance") {
      list.push("Coverage update: keep routine logs for insurer wellness benefits.");
    }
    return list;
  }

  function defaultProfileFromCheckout() {
    var fallback = {
      goal: "General fitness and consistency",
      diet: "Balanced",
      activity: "medium",
      wake: "Morning",
      notes: ""
    };
    try {
      var raw = localStorage.getItem("vibecart-active-plan-profile");
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          return {
            goal: String(saved.goal || fallback.goal),
            diet: String(saved.diet || fallback.diet),
            activity: String(saved.activity || fallback.activity),
            wake: String(saved.wake || fallback.wake),
            notes: String(saved.notes || fallback.notes)
          };
        }
      }
    } catch {
      /* ignore */
    }
    try {
      var checkoutRaw = sessionStorage.getItem("vibecart-final-payment");
      if (checkoutRaw) {
        var checkout = JSON.parse(checkoutRaw);
        var baseGoal = checkout && checkout.flow === "insurance"
          ? "Preventive wellness and consistency"
          : "Daily home training consistency";
        return {
          goal: baseGoal,
          diet: "Balanced",
          activity: "medium",
          wake: "Morning",
          notes: String((checkout && checkout.address) || "")
        };
      }
    } catch {
      /* ignore */
    }
    return fallback;
  }

  function readPaidPlans() {
    try {
      var rawList = JSON.parse(localStorage.getItem("vibecart-paid-plans") || "[]");
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.filter(function (x) { return x && x.sessionId; });
      }
      var legacy = JSON.parse(localStorage.getItem("vibecart-paid-plan") || "null");
      return legacy && legacy.sessionId ? [legacy] : [];
    } catch {
      return [];
    }
  }

  function savePaidPlans(list) {
    try {
      localStorage.setItem("vibecart-paid-plans", JSON.stringify(list || []));
      if (Array.isArray(list) && list[0]) {
        localStorage.setItem("vibecart-paid-plan", JSON.stringify(list[0]));
      }
    } catch {
      /* ignore */
    }
  }

  function upsertPaidPlans(existing, incoming) {
    var list = Array.isArray(existing) ? existing.slice() : [];
    var key = [incoming.flow, incoming.plan, incoming.sessionId].join(":");
    var index = list.findIndex(function (row) {
      return [row.flow, row.plan, row.sessionId].join(":") === key;
    });
    if (index >= 0) {
      list[index] = incoming;
    } else {
      list.unshift(incoming);
    }
    return list;
  }

  function pushNotifyNow(title, body) {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg || !reg.active) {
        return;
      }
      reg.active.postMessage({
        type: "SHOW_NOTIFICATION",
        title: String(title || "VibeCart update"),
        body: String(body || "You have a new coach update."),
        url: "./plan-workspace.html"
      });
    }).catch(function () {
      /* ignore */
    });
  }

  function ensurePushPermission(statusEl) {
    if (!("Notification" in window)) {
      if (statusEl) {
        statusEl.textContent = "Push is not supported on this device/browser.";
      }
      return;
    }
    if (Notification.permission === "granted") {
      if (statusEl) {
        statusEl.textContent = "Phone notifications are enabled for plan updates.";
      }
      registerBrowserWebPushSubscription(getPublicAuthToken(), statusEl);
      return;
    }
    Notification.requestPermission().then(function (perm) {
      if (statusEl) {
        statusEl.textContent =
          perm === "granted"
            ? "Phone notifications enabled. You will get coach reminders in the notification bar."
            : "Notification permission denied. Enable it in browser settings for phone alerts.";
      }
      if (perm === "granted") {
        pushNotifyNow("VibeCart Coach", "Notifications are now enabled.");
        registerBrowserWebPushSubscription(getPublicAuthToken(), statusEl);
      }
    }).catch(function () {
      if (statusEl) {
        statusEl.textContent = "Could not enable notifications right now.";
      }
    });
  }

  function checkinStorageKey(params) {
    var sid = String((params && params.sessionId) || (params && params.plan) || "default").trim();
    return "vibecart-coach-checkins:" + sid;
  }

  function readCoachCheckins(params) {
    try {
      var raw = localStorage.getItem(checkinStorageKey(params));
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCoachCheckins(params, rows) {
    try {
      localStorage.setItem(checkinStorageKey(params), JSON.stringify(Array.isArray(rows) ? rows.slice(-40) : []));
    } catch {
      /* ignore */
    }
  }

  function summarizeRecentCheckins(rows) {
    var list = Array.isArray(rows) ? rows.slice(-7) : [];
    if (!list.length) {
      return { adherence: "unknown", avgEffort: 0, avgSleep: "unknown", trend: "No check-ins yet" };
    }
    var done = 0;
    var effortTotal = 0;
    var effortN = 0;
    var poorSleep = 0;
    list.forEach(function (row) {
      var completed = String(row && row.completed || "").toLowerCase();
      if (completed === "yes" || completed === "partial") {
        done += 1;
      }
      var ef = Number(row && row.effort || 0);
      if (Number.isFinite(ef) && ef > 0) {
        effortTotal += ef;
        effortN += 1;
      }
      if (String(row && row.sleep || "").toLowerCase() === "poor") {
        poorSleep += 1;
      }
    });
    var adherenceRatio = done / Math.max(1, list.length);
    return {
      adherence: adherenceRatio >= 0.8 ? "high" : adherenceRatio >= 0.5 ? "medium" : "low",
      avgEffort: effortN ? Number((effortTotal / effortN).toFixed(1)) : 0,
      avgSleep: poorSleep >= 3 ? "poor" : poorSleep >= 1 ? "mixed" : "good",
      trend:
        "Last " +
        list.length +
        " check-ins: adherence " +
        Math.round(adherenceRatio * 100) +
        "%, avg effort " +
        (effortN ? Number((effortTotal / effortN).toFixed(1)) : "n/a") +
        ", sleep " +
        (poorSleep >= 3 ? "struggling" : poorSleep >= 1 ? "mixed" : "stable")
    };
  }

  /* Package dashboard clips + exercise library: each URL is a distinct Mixkit clip matched to the movement name
     (replaces mislabeled files under ./media/coach-demos/). See https://mixkit.co/license/ for usage terms. */
  var COACH_ILLUSTRATIVE_MEDIA = {
    mobility: "https://assets.mixkit.co/videos/48563/48563-720.mp4",
    cardio: "https://assets.mixkit.co/videos/726/726-720.mp4",
    gym: "https://assets.mixkit.co/active_storage/video_items/100543/1725384976/100543-video-720.mp4",
    warmup: "https://assets.mixkit.co/videos/739/739-720.mp4"
  };
  function coachVideoPrimaryUrl(primaryUrl) {
    var u = String(primaryUrl || "").trim();
    return u || COACH_ILLUSTRATIVE_MEDIA.gym;
  }

  /* Per-exercise video audit (Mixkit slug vs clip): bodyweight-squat·21273 man squats at home; goblet-squat·752 squats holding ball;
     reverse-lunge·52101 lunges gym; romanian-deadlift·47890 barbell deadlift gym; push-up·731 push-ups; bench-press·100543 bench press;
     shoulder-press·100533 shoulder press machine (label matches); seated-row·100550 rowing machine erg (label matches); lat-pulldown·100549 lat pulldown;
     glute-bridge·4592 stability ball on floor; plank·36813 plank; dead-bug·13861 lying yoga (closest free supine control clip—no dedicated dead-bug stock);
     mountain-climber·726 mountain climber; jumping-jacks·23197 jumping calisthenics (not strict jacks—closest match); incline-walk·100525 treadmill;
     dynamic-stretch-flow·48563 leg stretching. */
  var EXERCISE_LIBRARY = [
    {
      id: "bodyweight-squat",
      label: "Bodyweight Squat",
      category: "lower-body",
      video: "https://assets.mixkit.co/videos/21273/21273-720.mp4",
      setup: "Feet shoulder-width, toes slightly out, core braced, chest tall.",
      execution: ["Push hips back first.", "Bend knees and lower until thighs are near parallel.", "Drive through mid-foot to stand tall."],
      repForm: ["Knees track over toes.", "Spine stays neutral; avoid rounding.", "Control down for 2 seconds, stand with intent."],
      mistakes: ["Knees collapsing inward.", "Heels lifting off floor.", "Dropping chest too far forward."]
    },
    {
      id: "goblet-squat",
      label: "Goblet Squat",
      category: "lower-body",
      video: "https://assets.mixkit.co/videos/752/752-720.mp4",
      setup: "Hold dumbbell close to chest, elbows down, stance shoulder-width.",
      execution: ["Inhale and brace.", "Sit down between hips keeping torso upright.", "Press floor away and exhale at top."],
      repForm: ["Keep dumbbell close to sternum.", "Full foot contact throughout rep.", "Hips and shoulders rise together."],
      mistakes: ["Letting weight drift forward.", "Rushing bottom position.", "Locking knees hard at top."]
    },
    {
      id: "reverse-lunge",
      label: "Reverse Lunge",
      category: "lower-body",
      video: "https://assets.mixkit.co/videos/52101/52101-720.mp4",
      setup: "Stand tall, feet hip-width, core tight, eyes forward.",
      execution: ["Step one leg backward.", "Lower both knees under control.", "Drive front heel to return to standing."],
      repForm: ["Front knee stays stacked over mid-foot.", "Torso remains vertical.", "Move smoothly with balanced tempo."],
      mistakes: ["Overstriding backward.", "Front heel lifting.", "Leaning torso excessively forward."]
    },
    {
      id: "romanian-deadlift",
      label: "Romanian Deadlift",
      category: "posterior-chain",
      video: "https://assets.mixkit.co/videos/47890/47890-720.mp4",
      setup: "Soft knees, weight close to thighs, lats engaged, spine neutral.",
      execution: ["Hinge hips back while sliding weight down thighs.", "Pause when hamstrings are loaded.", "Drive hips forward to stand."],
      repForm: ["Bar/dumbbells stay close to body.", "Neck stays neutral.", "Hinge from hips, not lower back."],
      mistakes: ["Turning hinge into squat.", "Rounding lower back.", "Shrugging shoulders upward."]
    },
    {
      id: "push-up",
      label: "Push-up",
      category: "upper-body",
      video: "https://assets.mixkit.co/videos/731/731-720.mp4",
      setup: "Hands slightly wider than shoulders, body in straight line, glutes tight.",
      execution: ["Lower chest toward floor with elbows at 30-45 degrees.", "Touch depth consistently.", "Press back to full lockout."],
      repForm: ["Ribs down, no sagging hips.", "Neck neutral.", "Control descent and explosive press."],
      mistakes: ["Flaring elbows too wide.", "Partial range reps.", "Hips dropping or piking."]
    },
    {
      id: "bench-press",
      label: "Bench Press",
      category: "upper-body",
      video: "https://assets.mixkit.co/active_storage/video_items/100543/1725384976/100543-video-720.mp4",
      setup: "Feet planted, shoulder blades retracted, grip even, wrists stacked.",
      execution: ["Unrack with straight wrists.", "Lower bar to mid-chest under control.", "Press bar up and slightly back."],
      repForm: ["Forearms vertical at bottom.", "Light arch in upper back only.", "Bar path consistent each rep."],
      mistakes: ["Bouncing bar off chest.", "Loose shoulder position.", "Overextending wrists."]
    },
    {
      id: "shoulder-press",
      label: "Machine shoulder press",
      category: "upper-body",
      video: "https://assets.mixkit.co/active_storage/video_items/100533/1725384049/100533-video-720.mp4",
      setup: "Seat height set so handles line up near shoulder level; core and glutes engaged.",
      execution: ["Press handles overhead in a controlled arc.", "Stop short of lockout if your machine cues it.", "Lower until upper arms are roughly parallel to the floor."],
      repForm: ["Avoid excessive lower-back arch off the pad.", "Keep head neutral on the headrest.", "Move through the machine’s range without bouncing."],
      mistakes: ["Shrugging into each rep.", "Locking aggressively at the top.", "Losing contact with the back pad."]
    },
    {
      id: "seated-row",
      label: "Rowing machine (erg)",
      category: "upper-body",
      video: "https://assets.mixkit.co/active_storage/video_items/100550/1725385839/100550-video-720.mp4",
      setup: "Strap snug over the ball of the foot; damper at a moderate setting while learning.",
      execution: ["Drive with legs, then hinge slightly and finish with arms.", "Return by extending arms, rocking forward, then bending knees.", "Keep strokes smooth and rhythmic."],
      repForm: ["Straight handle path; avoid sky-high hands at the finish.", "Relax shoulders between strokes.", "Breathe steadily with the rhythm."],
      mistakes: ["Pulling early with arms before the leg drive.", "Rounding hard over the stroke.", "Rushing the recovery."]
    },
    {
      id: "lat-pulldown",
      label: "Lat Pulldown",
      category: "upper-body",
      video: "https://assets.mixkit.co/active_storage/video_items/100549/1725385782/100549-video-720.mp4",
      setup: "Set thigh pad secure, chest up, slight lean back.",
      execution: ["Pull bar to upper chest.", "Pause with elbows down and back.", "Control bar up to full stretch."],
      repForm: ["Keep shoulders away from ears.", "No momentum swinging.", "Full stretch at top each rep."],
      mistakes: ["Pulling bar behind neck.", "Leaning too far back.", "Rushing the eccentric phase."]
    },
    {
      id: "glute-bridge",
      label: "Glute Bridge",
      category: "posterior-chain",
      video: "https://assets.mixkit.co/videos/4592/4592-720.mp4",
      setup: "Lie on back, knees bent, feet flat under knees, core braced.",
      execution: ["Drive through heels and lift hips.", "Squeeze glutes at top for one second.", "Lower with control."],
      repForm: ["Ribs down, pelvis neutral.", "No over-arching lower back.", "Keep knees tracking forward."],
      mistakes: ["Pushing from toes.", "Hyperextending spine.", "Losing glute squeeze at top."]
    },
    {
      id: "plank",
      label: "Forearm Plank",
      category: "core",
      video: "https://assets.mixkit.co/videos/36813/36813-720.mp4",
      setup: "Elbows under shoulders, feet hip-width, straight line head-to-heel.",
      execution: ["Brace abs and glutes.", "Breathe steadily without losing position.", "Hold prescribed time."],
      repForm: ["Neutral pelvis and spine.", "Push floor away with forearms.", "Maintain tension on every second."],
      mistakes: ["Hips sagging.", "Hips too high.", "Holding breath throughout set."]
    },
    {
      id: "dead-bug",
      label: "Dead Bug",
      category: "core",
      video: "https://assets.mixkit.co/videos/13861/13861-720.mp4",
      setup: "Lie on back, arms up, knees at 90 degrees, ribs down.",
      execution: ["Extend opposite arm and leg slowly.", "Keep lower back gently pressed down.", "Return and alternate sides."],
      repForm: ["Move slow and controlled.", "No rib flare.", "Exhale on extension for better brace."],
      mistakes: ["Moving too fast.", "Arching lower back.", "Losing limb control."]
    },
    {
      id: "mountain-climber",
      label: "Mountain Climber",
      category: "cardio",
      video: "https://assets.mixkit.co/videos/726/726-720.mp4",
      setup: "High plank position, shoulders stacked over wrists.",
      execution: ["Drive one knee toward chest.", "Alternate legs rhythmically.", "Maintain strong plank line."],
      repForm: ["Keep hips level.", "Land feet softly.", "Keep shoulders stable over hands."],
      mistakes: ["Bouncing hips high.", "Short knee drive.", "Collapsing upper back."]
    },
    {
      id: "jumping-jacks",
      label: "Jumping Jacks",
      category: "cardio",
      video: "https://assets.mixkit.co/videos/23197/23197-720.mp4",
      setup: "Stand tall, arms by sides, core lightly engaged.",
      execution: ["Jump feet out as arms rise overhead.", "Jump feet in as arms return down.", "Keep steady breathing rhythm."],
      repForm: ["Land softly on balls of feet.", "Maintain upright posture.", "Use full arm range."],
      mistakes: ["Hard noisy landings.", "Shallow arm movement.", "Holding breath."]
    },
    {
      id: "incline-walk",
      label: "Treadmill walk or jog",
      category: "cardio",
      video: "https://assets.mixkit.co/active_storage/video_items/100525/1725383255/100525-video-720.mp4",
      setup: "Set incline and speed to a sustainable zone (walk or light jog).",
      execution: ["Walk with long controlled steps.", "Maintain nasal or controlled mouth breathing.", "Sustain target duration."],
      repForm: ["Keep chest up and shoulders relaxed.", "Avoid leaning heavily on rails.", "Consistent pace over spikes."],
      mistakes: ["Hanging on handrails.", "Too high speed causing poor mechanics.", "Overstriding."]
    },
    {
      id: "dynamic-stretch-flow",
      label: "Dynamic Stretch Flow",
      category: "mobility",
      video: "https://assets.mixkit.co/videos/48563/48563-720.mp4",
      setup: "Start standing with relaxed breathing and controlled tempo.",
      execution: ["Move through hips, hamstrings, thoracic spine, and ankles.", "Use smooth transitions between stretches.", "Complete both sides evenly."],
      repForm: ["Never force painful range.", "Control breath with each movement.", "Keep motions deliberate and fluid."],
      mistakes: ["Bouncing aggressively.", "Skipping tight areas.", "Moving too fast to control form."]
    }
  ];
  function renderExerciseLibrary(categoryEl, exerciseEl, detailEl) {
    if (!categoryEl || !exerciseEl || !detailEl) {
      return function () {};
    }
    var categories = ["all"];
    EXERCISE_LIBRARY.forEach(function (x) {
      if (categories.indexOf(x.category) < 0) {
        categories.push(x.category);
      }
    });
    categoryEl.innerHTML = categories
      .map(function (cat) {
        var label = cat === "all" ? "All categories" : cat.replace(/-/g, " ");
        return "<option value=\"" + cat + "\">" + label + "</option>";
      })
      .join("");

    function paintExerciseDetail(exerciseId) {
      var item = EXERCISE_LIBRARY.find(function (x) {
        return x.id === exerciseId;
      });
      if (!item) {
        detailEl.innerHTML = "<p class=\"note\">Exercise not found.</p>";
        return;
      }
      function listHtml(title, rows) {
        var list = (Array.isArray(rows) ? rows : [])
          .map(function (row) {
            return "<li>" + String(row || "") + "</li>";
          })
          .join("");
        return "<h4 style=\"margin:0.55rem 0 0.35rem;\">" + title + "</h4><ul class=\"buyer-adv-list\" style=\"margin:0;\">" + list + "</ul>";
      }
      detailEl.innerHTML =
        "<p class=\"note\" style=\"margin:0;\"><strong>" + item.label + "</strong> · " + item.category.replace(/-/g, " ") + "</p>" +
        "<video controls playsinline webkit-playsinline preload=\"metadata\" src=\"" +
        coachVideoPrimaryUrl(item.video) +
        "\" style=\"width:100%;border-radius:0.7rem;display:block;max-height:280px;object-fit:cover;margin-top:0.55rem;\"></video>" +
        "<h4 style=\"margin:0.55rem 0 0.35rem;\">Setup</h4><p class=\"note\" style=\"margin:0;\">" + item.setup + "</p>" +
        listHtml("Execution steps", item.execution) +
        listHtml("Rep form cues", item.repForm) +
        listHtml("Common mistakes to avoid", item.mistakes);
      window.requestAnimationFrame(function () {
        var vid = detailEl.querySelector("video");
        if (vid && typeof vid.load === "function") {
          try {
            vid.load();
          } catch (e) {
            /* ignore */
          }
        }
      });
    }

    function refreshExerciseOptions(preferredId) {
      var selectedCategory = String(categoryEl.value || "all");
      var options = EXERCISE_LIBRARY.filter(function (x) {
        return selectedCategory === "all" || x.category === selectedCategory;
      });
      exerciseEl.innerHTML = options
        .map(function (x) {
          return "<option value=\"" + x.id + "\">" + x.label + "</option>";
        })
        .join("");
      var pick = String(preferredId || "").trim();
      var targetId = "";
      if (pick && options.some(function (o) { return o.id === pick; })) {
        targetId = pick;
      } else if (options[0]) {
        targetId = options[0].id;
      }
      if (targetId) {
        exerciseEl.value = targetId;
        paintExerciseDetail(targetId);
      } else {
        detailEl.innerHTML = "<p class=\"note\">No exercise loaded for this category.</p>";
      }
    }

    function commitExerciseSelection(exerciseId) {
      var id = String(exerciseId || "").trim();
      if (!id) {
        return;
      }
      var item = EXERCISE_LIBRARY.find(function (x) {
        return x.id === id;
      });
      if (!item) {
        return;
      }
      if (String(categoryEl.value || "all") !== String(item.category || "")) {
        categoryEl.value = String(item.category || "all");
        refreshExerciseOptions(item.id);
      } else {
        exerciseEl.value = item.id;
        paintExerciseDetail(item.id);
      }
    }

    categoryEl.addEventListener("change", function () {
      refreshExerciseOptions();
    });
    exerciseEl.addEventListener("change", function () {
      paintExerciseDetail(String(exerciseEl.value || ""));
    });
    refreshExerciseOptions();
    return commitExerciseSelection;
  }

  /** Avoid false positives (e.g. "row" inside "grow") when matching routine text to exercises. */
  function exerciseAliasNeedleMatches(haystackLower, needle) {
    var hay = String(haystackLower || "");
    var n = String(needle || "").trim().toLowerCase();
    if (!n || !hay) return false;
    if (n.length <= 3) {
      try {
        var esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp("(^|[^a-z0-9])" + esc + "([^a-z0-9]|$)", "i").test(hay);
      } catch (e) {
        return hay.indexOf(n) >= 0;
      }
    }
    return hay.indexOf(n) >= 0;
  }

  var EXERCISE_ALIASES = {
    "bodyweight-squat": ["squat", "bodyweight squat"],
    "goblet-squat": ["goblet squat"],
    "reverse-lunge": ["reverse lunge", "walking lunge", "split squat", "forward lunge", "lunge"],
    "romanian-deadlift": ["romanian deadlift", "rdl", "stiff leg", "trap-bar deadlift", "deadlift"],
    "push-up": ["push-up", "push up", "pushup", "incline push-up", "pike push-up"],
    "bench-press": ["bench press", "incline db press", "incline press"],
    "shoulder-press": ["machine shoulder press", "shoulder press machine", "shoulder press", "overhead press"],
    "seated-row": ["rowing machine", "indoor row", "erg", "rower", "500m row", "row machine"],
    "lat-pulldown": ["lat pulldown", "lat pull-down", "pulldown", "pull-down"],
    "glute-bridge": ["glute bridge", "hip bridge"],
    "plank": ["plank", "side plank"],
    "dead-bug": ["dead bug"],
    "mountain-climber": ["mountain climber", "mountain climbers"],
    "jumping-jacks": ["jumping jack", "jumping jacks", "jumping exercise", "star jump"],
    "incline-walk": ["incline walk", "treadmill walk", "treadmill jog", "treadmill", "zone 2 cardio", "zone 2"],
    "dynamic-stretch-flow": ["dynamic stretch", "mobility flow", "stretch", "cool-down", "cooldown"]
  };

  function detectExercisesFromRoutineText(routineText) {
    var text = String(routineText || "").toLowerCase();
    var ids = [];
    Object.keys(EXERCISE_ALIASES).forEach(function (id) {
      var aliases = EXERCISE_ALIASES[id] || [];
      var hit = aliases.some(function (needle) {
        return exerciseAliasNeedleMatches(text, needle);
      });
      if (hit) {
        ids.push(id);
      }
    });
    return ids;
  }

  function detectExercisesInLine(line) {
    var text = String(line || "").toLowerCase();
    var ids = [];
    Object.keys(EXERCISE_ALIASES).forEach(function (id) {
      var aliases = EXERCISE_ALIASES[id] || [];
      var hit = aliases.some(function (needle) {
        return exerciseAliasNeedleMatches(text, needle);
      });
      if (hit && ids.indexOf(id) < 0) {
        ids.push(id);
      }
    });
    return ids;
  }

  function detectExercisesByDay(routineText) {
    var lines = String(routineText || "").split(/\r?\n/);
    var groups = [];
    var current = null;
    lines.forEach(function (rawLine) {
      var line = String(rawLine || "").trim();
      if (!line) {
        return;
      }
      if (/^day\s*\d+\b/i.test(line)) {
        current = { day: line, ids: [] };
        groups.push(current);
        return;
      }
      if (!current) {
        return;
      }
      var found = detectExercisesInLine(line);
      found.forEach(function (id) {
        if (current.ids.indexOf(id) < 0) {
          current.ids.push(id);
        }
      });
    });
    return groups.filter(function (g) { return Array.isArray(g.ids) && g.ids.length > 0; }).slice(0, 7);
  }

  function renderRoutineExerciseLinks(containerEl, routineText, onPickExercise) {
    if (!containerEl) {
      return;
    }
    var ids = detectExercisesFromRoutineText(routineText);
    var dayGroups = detectExercisesByDay(routineText);
    if (!ids.length) {
      containerEl.innerHTML = "";
      return;
    }
    var items = ids
      .map(function (id) {
        var item = EXERCISE_LIBRARY.find(function (x) { return x.id === id; });
        if (!item) {
          return "";
        }
        return (
          "<button type=\"button\" class=\"btn btn-secondary\" data-exercise-id=\"" +
          item.id +
          "\" style=\"padding:0.38rem 0.7rem;font-size:0.78rem\">" +
          item.label +
          "</button>"
        );
      })
      .filter(Boolean);
    var groupedHtml = "";
    if (dayGroups.length) {
      groupedHtml =
        "<div style=\"width:100%\">" +
        dayGroups
          .map(function (g) {
            var buttons = g.ids
              .map(function (id) {
                var item = EXERCISE_LIBRARY.find(function (x) { return x.id === id; });
                if (!item) return "";
                return (
                  "<button type=\"button\" class=\"btn btn-secondary\" data-exercise-id=\"" +
                  item.id +
                  "\" style=\"padding:0.32rem 0.62rem;font-size:0.74rem;margin:0 0.28rem 0.28rem 0;\">" +
                  item.label +
                  "</button>"
                );
              })
              .filter(Boolean)
              .join("");
            return (
              "<article class=\"section alt\" style=\"padding:0.55rem;margin:0.38rem 0;\">" +
              "<p class=\"note\" style=\"margin:0 0 0.25rem;\"><strong>" + g.day + "</strong> · watch form for today's exercises</p>" +
              buttons +
              "</article>"
            );
          })
          .join("") +
        "</div>";
    }
    containerEl.innerHTML =
      "<p class=\"note\" style=\"margin:0 0 0.2rem;width:100%;\">Quick form shortcuts from this routine:</p>" +
      (groupedHtml || items.join(""));
    if (typeof onPickExercise === "function") {
      Array.prototype.slice.call(containerEl.querySelectorAll("button[data-exercise-id]")).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = String(btn.getAttribute("data-exercise-id") || "").trim();
          if (id) {
            onPickExercise(id);
          }
        });
      });
    }
  }

  function formatStructuredWeekPlan(ai) {
    var week = Array.isArray(ai && ai.weekPlan) ? ai.weekPlan : [];
    if (!week.length) {
      return "";
    }
    var lines = ["", "AI structured weekly schedule:"];
    week.slice(0, 7).forEach(function (day, index) {
      var dayLabel = String((day && day.day) || ("Day " + (index + 1))).trim();
      var focus = String((day && day.focus) || "Training focus").trim();
      lines.push(dayLabel + " - " + focus);
      lines.push("  Warm-up: " + String((day && day.warmup) || "Mobility + activation").trim());
      lines.push("  Main: " + String((day && day.main) || "Primary strength block").trim());
      lines.push("  Cardio: " + String((day && day.cardio) || "Zone 2 or intervals").trim());
      lines.push("  Cool-down: " + String((day && day.cooldown) || "Stretch + breathing").trim());
    });
    return lines.join("\n");
  }

  function renderAutoPlan(params, profile, out, list, planStatus, ownedPlans, automationCtx) {
    var routine = buildRoutine(profile, params.flow, ownedPlans);
    var notifications = buildNotifications(params.flow, ownedPlans);
    var checkins = readCoachCheckins(params);
    var checkinSummary = summarizeRecentCheckins(checkins);

    function escHtml(v) {
      return String(v == null ? "" : v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderRoutineCompact(routineText) {
      var raw = String(routineText || "");
      var lines = raw.split(/\r?\n/).map(function (line) { return String(line || "").trim(); }).filter(Boolean);
      var weekly = lines.filter(function (line) { return /^Day\s+\d+/i.test(line); }).slice(0, 7);
      var highlights = lines.filter(function (line) {
        return (
          /^- /.test(line) &&
          (line.toLowerCase().indexOf("meal") >= 0 ||
            line.toLowerCase().indexOf("check-in") >= 0 ||
            line.toLowerCase().indexOf("warm-up") >= 0 ||
            line.toLowerCase().indexOf("cardio") >= 0)
        );
      }).slice(0, 4);
      var topSummary = weekly.length
        ? "This week: " + weekly[0] + " · " + weekly[Math.min(2, weekly.length - 1)] + " · " + weekly[weekly.length - 1]
        : "Your package plan is active. Open details for the full weekly breakdown.";
      var weeklyHtml = weekly.length
        ? "<ul class=\"buyer-adv-list\" style=\"margin:0.35rem 0 0;\">" +
          weekly.map(function (line) { return "<li>" + escHtml(line) + "</li>"; }).join("") +
          "</ul>"
        : "";
      var highlightsHtml = highlights.length
        ? "<h4 style=\"margin:0.55rem 0 0.2rem;\">Key focus</h4><ul class=\"buyer-adv-list\" style=\"margin:0;\">" +
          highlights.map(function (line) { return "<li>" + escHtml(line.replace(/^-+\s*/, "")) + "</li>"; }).join("") +
          "</ul>"
        : "";
      return (
        "<article class=\"section alt\" style=\"padding:0.72rem;\">" +
        "<p class=\"note\" style=\"margin:0;\"><strong>Weekly snapshot</strong></p>" +
        "<p class=\"note\" style=\"margin:0.3rem 0 0.45rem;\">" + escHtml(topSummary) + "</p>" +
        "<details>" +
        "<summary style=\"cursor:pointer;font-weight:600;\">Open full weekly plan</summary>" +
        weeklyHtml +
        highlightsHtml +
        "<pre style=\"white-space:pre-wrap;margin:0.55rem 0 0;font:inherit;line-height:1.42;\">" + escHtml(raw) + "</pre>" +
        "</details>" +
        "</article>"
      );
    }

    function commitPlan(r, n, sourceTag) {
      if (out) {
        out.innerHTML = renderRoutineCompact(r);
      }
      if (list) {
        list.innerHTML = "";
        n.forEach(function (msg) {
          var li = document.createElement("li");
          li.textContent = msg;
          list.appendChild(li);
        });
      }
      saveActivePlan({
        flow: params.flow,
        plan: params.plan,
        addonPlan: params.addonPlan || "",
        ownedPlans: ownedPlans,
        provider: params.provider,
        sessionId: params.sessionId,
        routine: r,
        notifications: n,
        profile: profile,
        updatedAt: new Date().toISOString(),
        contentSource: sourceTag || "template"
      });
      try {
        localStorage.setItem("vibecart-active-plan-profile", JSON.stringify(profile));
      } catch {
        /* ignore */
      }
      if (planStatus) {
        planStatus.textContent =
          sourceTag === "generative"
            ? "Live AI autopilot loaded. Plan adapts from your check-ins and package capabilities."
            : "AI plan is activated. All purchased package benefits are unlocked.";
      }
      if (automationCtx && automationCtx.checkinStatusEl) {
        automationCtx.checkinStatusEl.textContent = checkinSummary.trend;
      }
      if (automationCtx && automationCtx.routineExerciseLinksEl) {
        renderRoutineExerciseLinks(
          automationCtx.routineExerciseLinksEl,
          r,
          typeof automationCtx.onPickExercise === "function" ? automationCtx.onPickExercise : null
        );
      }
    }

    commitPlan(routine, notifications, "template");

    var canCallAi =
      params.flow === "coach" &&
      typeof window.vibecartAiGenerate === "function" &&
      Array.isArray(ownedPlans) &&
      ownedPlans.length > 0;

    function pushFirstLine(lines) {
      if (lines && lines.length > 0) {
        pushNotifyNow("VibeCart Coach", lines[0]);
      }
    }

    if (!canCallAi) {
      pushFirstLine(notifications);
      return;
    }

    window
      .vibecartAiGenerate("coach_workspace_plan", {
        flow: params.flow,
        ownedPlans: ownedPlans,
        profile: {
          goal: profile.goal || "",
          diet: profile.diet || "",
          activity: profile.activity || "",
          wake: profile.wake || "",
          notes: profile.notes || ""
        },
        recentCheckins: checkins.slice(-12),
        checkinSummary: checkinSummary
      })
      .then(function (ai) {
        if (!ai) {
          pushFirstLine(notifications);
          return;
        }
        var r = String(ai.routine || "").trim();
        var n = Array.isArray(ai.notifications)
          ? ai.notifications
              .map(function (x) {
                return String(x || "").trim();
              })
              .filter(Boolean)
          : [];
        var structuredRoutine = formatStructuredWeekPlan(ai);
        if (structuredRoutine) {
          r = r + "\n" + structuredRoutine;
        }
        var adaptation = String(ai.adaptationNote || "").trim();
        if (adaptation) {
          r += "\n\nAutopilot adaptation:\n- " + adaptation;
        }
        var mealPlan = ai.mealPlan && typeof ai.mealPlan === "object" ? ai.mealPlan : null;
        if (mealPlan && mealPlan.enabled) {
          var mealLines = Array.isArray(mealPlan.dailyTemplate) ? mealPlan.dailyTemplate.filter(Boolean).slice(0, 6) : [];
          var prepLines = Array.isArray(mealPlan.prepBlocks) ? mealPlan.prepBlocks.filter(Boolean).slice(0, 4) : [];
          if (mealLines.length || prepLines.length) {
            r += "\n\nMeal autopilot:";
            mealLines.forEach(function (line) {
              r += "\n- " + String(line).trim();
            });
            prepLines.forEach(function (line) {
              r += "\n- Prep: " + String(line).trim();
            });
          }
        }
        if (r.length < 60 || n.length < 5) {
          pushFirstLine(notifications);
          return;
        }
        commitPlan(r, n, "generative");
        if (planStatus) {
          var modelName = String(ai.model || "").trim();
          if (modelName) {
            planStatus.textContent = "Live AI autopilot active (" + modelName + "). Plan updates from your check-ins.";
          }
        }
        pushFirstLine(n);
        var tok = getPublicAuthToken();
        if (tok && n[0]) {
          sendCoachEncouragePush(tok, "Your live coach plan is ready — you've got this", n[0]);
        }
      })
      .catch(function () {
        pushFirstLine(notifications);
      });
  }

  function saveActivePlan(payload) {
    try {
      localStorage.setItem("vibecart-active-plan", JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }

  function readDisplayName() {
    try {
      var raw = localStorage.getItem("vibecart-public-auth-user");
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.fullName) {
        return String(parsed.fullName).trim();
      }
      if (parsed && parsed.email) {
        return String(parsed.email).split("@")[0];
      }
    } catch {
      /* ignore */
    }
    return "there";
  }

  function packageBlueprint(planCode) {
    var p = normalizePlan(planCode);
    if (p === "ai-home") {
      return {
        name: "AI Home + Meals",
        level: "Level 2",
        promise: "Home-first coaching with complete meal structure and prep automation.",
        chips: ["No equipment", "Meal plan active", "Daily adaptive plan"],
        focusDays: ["Mon: Lower + core", "Tue: Upper push", "Wed: Cardio + mobility", "Thu: Lower endurance", "Fri: Upper pull", "Sat: Active recovery", "Sun: Rest + review"],
        media: [
          { kind: "image", title: "Home workout form", src: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80" },
          { kind: "image", title: "Meal prep layout", src: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80" },
          { kind: "video", title: "Short mobility warm-up", src: COACH_ILLUSTRATIVE_MEDIA.mobility }
        ],
        blocks: [
          { title: "Today in 3 blocks", body: "Warm-up 10 min, home strength 30-40 min, cardio 15 min, cool-down 10 min." },
          { title: "Meal autopilot", body: "Breakfast-lunch-dinner template + prep checklists (Sun/Wed) and shopping flow." },
          { title: "Coach pressure points", body: "Missed session rescue, soreness-safe alternatives, and motivation nudges." }
        ]
      };
    }
    if (p === "plus") {
      return {
        name: "Coach Plus Gym",
        level: "Level 3",
        promise: "Gym-equipment programming with meal prep and stronger progression control.",
        chips: ["Gym split", "Meal plan active", "Mid-week intervention"],
        focusDays: ["Mon: Push strength", "Tue: Lower strength", "Wed: Conditioning", "Thu: Pull strength", "Fri: Full-body hypertrophy", "Sat: Optional cardio", "Sun: Recovery"],
        media: [
          { kind: "image", title: "Gym strength day", src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80" },
          { kind: "image", title: "Cardio conditioning", src: "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=1200&q=80" },
          { kind: "video", title: "Short cardio finisher", src: COACH_ILLUSTRATIVE_MEDIA.cardio }
        ],
        blocks: [
          { title: "Today in 3 blocks", body: "Warm-up 8-12 min, gym lifts with sets/reps/rest, conditioning finisher, stretch." },
          { title: "Performance meals", body: "Portion and macro-focused meal plan updated from effort/sleep/soreness trends." },
          { title: "Accountability lane", body: "Daily check-ins + mid-week AI correction if adherence drops." }
        ]
      };
    }
    if (p === "pro") {
      return {
        name: "Coach Pro Elite",
        level: "Level 4",
        promise: "Full-stack coaching with advanced periodization, analytics, and high-touch interventions.",
        chips: ["Advanced periodization", "Gym + meal mastery", "Elite accountability"],
        focusDays: ["Mon: Heavy push", "Tue: Heavy lower", "Wed: Recovery + zone 2", "Thu: Heavy pull", "Fri: Dynamic full-body", "Sat: Skill/cardio", "Sun: Readiness + deload check"],
        media: [
          { kind: "image", title: "Elite lifting block", src: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80" },
          { kind: "image", title: "Recovery and stretch", src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80" },
          { kind: "video", title: "Short stretch cooldown", src: COACH_ILLUSTRATIVE_MEDIA.mobility }
        ],
        blocks: [
          { title: "Today in 3 blocks", body: "Dynamic warm-up, periodized lift targets, cardio dosage, and deep cool-down protocol." },
          { title: "Elite fuel engine", body: "Adaptive nutrition templates, prep blocks, and recovery meal timing automation." },
          { title: "Performance analytics", body: "Fatigue trend tracking, readiness score, and automatic load/deload recommendations." }
        ]
      };
    }
    return {
      name: "Starter Coach",
      level: "Level 1",
      promise: "Simple, powerful workout coaching to build consistency first.",
      chips: ["Workout only", "No meal plan", "Daily motivation"],
      focusDays: ["Mon: Lower + core", "Tue: Upper push", "Wed: Cardio + stretch", "Thu: Lower strength", "Fri: Upper pull", "Sat: Mobility walk", "Sun: Rest + check-in"],
      media: [
        { kind: "image", title: "Starter movement guide", src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80" },
        { kind: "image", title: "Cardio basics", src: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1200&q=80" },
        { kind: "video", title: "Short warm-up routine", src: COACH_ILLUSTRATIVE_MEDIA.warmup }
      ],
      blocks: [
        { title: "Today in 3 blocks", body: "Warm-up 10 min, focused workout 25-35 min, cardio/cool-down 15-20 min." },
        { title: "Scope clarity", body: "No meal planning in this package. Upgrade from package 2 for nutrition automation." },
        { title: "Consistency engine", body: "Daily reminder + quick check-in + encouragement to keep momentum." }
      ]
    };
  }

  function renderPlanVisuals(flow, ownedPlans, checkinSummary) {
    var wrap = byId("planVisuals");
    if (!wrap) return;
    var plans = Array.isArray(ownedPlans) ? ownedPlans.slice() : [ownedPlans];
    if (flow !== "coach") {
      wrap.innerHTML =
        "<article class=\"section alt\" style=\"padding:0.9rem\">" +
        "<h3>Wellness compliance lane</h3>" +
        "<p class=\"note\">Insurance wellness dashboard for your paid package.</p>" +
        "</article>";
      return;
    }
    var trend = (checkinSummary && checkinSummary.trend) || "No recent check-ins yet. Submit one to activate adaptation scoring.";
    var cards = plans.map(function (planCode) {
      var spec = packageBlueprint(planCode);
      var chipsHtml = (spec.chips || [])
        .map(function (chip) {
          return "<span style=\"display:inline-block;padding:0.22rem 0.55rem;border-radius:999px;border:1px solid rgba(255,255,255,0.2);font-size:0.76rem;margin:0 0.3rem 0.3rem 0;\">" + chip + "</span>";
        })
        .join("");
      var dayHtml = (spec.focusDays || [])
        .map(function (line) {
          return "<li>" + line + "</li>";
        })
        .join("");
      var mediaHtml = (spec.media || [])
        .map(function (item) {
          if (String(item.kind || "") === "video") {
        return (
              "<article style=\"margin:0.45rem 0;\">" +
              "<p class=\"note\" style=\"margin:0 0 0.3rem;\"><strong>" + String(item.title || "Coach clip") + "</strong></p>" +
              "<video controls playsinline webkit-playsinline preload=\"metadata\" src=\"" +
              coachVideoPrimaryUrl(item.src) +
              "\" style=\"width:100%;border-radius:0.7rem;display:block;max-height:220px;object-fit:cover;\"></video>" +
              "</article>"
            );
          }
          return (
            "<article style=\"margin:0.45rem 0;\">" +
            "<img src=\"" + String(item.src || "") + "\" alt=\"" + String(item.title || "Coach illustration") + "\" style=\"width:100%;border-radius:0.7rem;display:block;max-height:220px;object-fit:cover;\"/>" +
            "<p class=\"note\" style=\"margin:0.25rem 0 0;\"><strong>" + String(item.title || "Coach illustration") + "</strong></p>" +
          "</article>"
        );
      })
      .join("");
      var blockHtml = (spec.blocks || [])
        .map(function (block) {
          return (
            "<article class=\"section alt\" style=\"padding:0.65rem;margin:0.45rem 0;\">" +
            "<h4 style=\"margin:0 0 0.35rem;\">" + block.title + "</h4>" +
            "<p class=\"note\" style=\"margin:0;\">" + block.body + "</p>" +
            "</article>"
          );
        })
        .join("");
      return (
        "<article class=\"section alt\" style=\"padding:0.9rem;\">" +
        "<p class=\"note\" style=\"margin:0 0 0.25rem;letter-spacing:0.04em;text-transform:uppercase;\">" + spec.level + "</p>" +
        "<h3 style=\"margin:0 0 0.4rem;\">" + spec.name + "</h3>" +
        "<p class=\"note\" style=\"margin:0 0 0.55rem;\">" + spec.promise + "</p>" +
        "<div>" + chipsHtml + "</div>" +
        blockHtml +
        "<h4 style=\"margin:0.5rem 0 0.35rem;\">Weekly body-focus split</h4>" +
        "<ul class=\"buyer-adv-list\" style=\"margin:0;\">" + dayHtml + "</ul>" +
        "<h4 style=\"margin:0.65rem 0 0.35rem;\">Illustrative media</h4>" +
        mediaHtml +
        "</article>"
      );
    });
    wrap.innerHTML =
      "<article class=\"section alt\" style=\"padding:0.9rem;background:rgba(255,255,255,0.04);\">" +
      "<h3 style=\"margin:0 0 0.35rem;\">Autopilot trend snapshot</h3>" +
      "<p class=\"note\" style=\"margin:0;\">" + trend + "</p>" +
      "</article>" +
      cards.join("");
    window.requestAnimationFrame(function () {
      Array.prototype.slice.call(wrap.querySelectorAll("video")).forEach(function (vid) {
        if (vid && typeof vid.load === "function") {
          try {
            vid.load();
          } catch (e) {
            /* ignore */
          }
        }
      });
    });
  }

  function mergeUrlParamsIntoPaidPlans(params, paidPlans) {
    var plans = Array.isArray(paidPlans) ? paidPlans.slice() : [];
    if (!params.sessionId) {
      return plans;
    }
    var incomingPlans = [normalizePlan(params.plan)];
    if (params.flow === "coach" && params.addonPlan) {
      var addon = normalizePlan(params.addonPlan);
      if (incomingPlans.indexOf(addon) < 0) {
        incomingPlans.push(addon);
      }
    }
    incomingPlans.forEach(function (planCode) {
      var incoming = {
        flow: params.flow,
        plan: planCode,
        provider: params.provider,
        sessionId: params.sessionId,
        activatedAt: new Date().toISOString()
      };
      plans = upsertPaidPlans(plans, incoming);
    });
    savePaidPlans(plans);
    return readPaidPlans();
  }

  function hydrateCoachFulfillmentFromServer() {
    var token = getPublicAuthToken();
    function ingestCoachSessions(body, st) {
      try {
        window.__vibecartCoachRenewalState = body && body.renewal ? body.renewal : null;
      } catch {
        /* ignore */
      }
      try {
        window.__vibecartCoachHydrateLast = {
          at: Date.now(),
          httpStatus: st,
          bodyOk: Boolean(body && body.ok),
          code: body && body.code ? String(body.code) : "",
          sessionCount: Array.isArray(body && body.sessions) ? body.sessions.length : -1
        };
      } catch {
        /* ignore */
      }
      if (!body || !body.ok || !Array.isArray(body.sessions) || !body.sessions.length) {
        return false;
      }
      var merged = readPaidPlans();
      body.sessions.forEach(function (row) {
        if (!row || !row.sessionId) {
          return;
        }
        var ic = [normalizePlan(row.plan || "starter")];
        if (row.addonPlan) {
          var ad = normalizePlan(row.addonPlan);
          if (ad && ic.indexOf(ad) < 0) {
            ic.push(ad);
          }
        }
        ic.forEach(function (planCode) {
          merged = upsertPaidPlans(merged, {
            flow: "coach",
            plan: planCode,
            provider: row.provider || "card",
            sessionId: String(row.sessionId).trim(),
            activatedAt: new Date().toISOString()
          });
        });
      });
      savePaidPlans(merged);
      return readPaidPlans().length > 0;
    }
    function runFetchWithQueryToken(tok) {
      if (!tok) {
        return Promise.resolve(false);
      }
      return fetch(
        "/api/public/payments/coach-checkout-sessions?authToken=" + encodeURIComponent(String(tok)),
        { credentials: "same-origin", headers: { Accept: "application/json" } }
      )
        .then(function (r) {
          var st = r.status;
          return r
            .json()
            .catch(function () {
              return {};
            })
            .then(function (body) {
              return ingestCoachSessions(body, st);
            });
        })
        .catch(function () {
          return false;
        });
    }
    function runFetch(tok) {
      var headers =
        window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
          ? window.VibeCartSessionDevice.merge(tok, { Accept: "application/json" })
          : { Authorization: "Bearer " + tok, Accept: "application/json" };
      return fetch("/api/public/payments/coach-checkout-sessions", { credentials: "same-origin", headers: headers })
      .then(function (r) {
        var st = r.status;
        return r
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            return { st: st, body: body };
          });
      })
      .then(function (x) {
        var ok = ingestCoachSessions(x.body, x.st);
        if (ok || !tok) {
          return ok;
        }
        // iOS app/webview sessions can have strict device-binding mismatch on header flow.
        // Query-token fallback intentionally skips binding for recovery-only hydration.
        return runFetchWithQueryToken(tok);
      })
      .catch(function () {
        try {
          window.__vibecartCoachHydrateLast = {
            at: Date.now(),
            httpStatus: 0,
            bodyOk: false,
            code: "network_error",
            sessionCount: -1
          };
        } catch {
          /* ignore */
        }
        return false;
      });
    }
    if (token) {
      return runFetch(token);
    }
    return recoverTokenFromServerSession().then(function (tok) {
      if (!tok) {
        return false;
      }
      return runFetch(tok);
    });
  }

  function autoRecoverCheckoutSessionFromUrl(params) {
    if (!params || !params.sessionId || String(params.flow || "").toLowerCase() !== "coach") {
      return Promise.resolve(false);
    }
    var sid = String(params.sessionId || "").trim();
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sid)) {
      return Promise.resolve(false);
    }
    var token = getPublicAuthToken();
    var headers = { Accept: "application/json" };
    if (token) {
      headers =
        window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.authHeaders === "function"
          ? window.VibeCartSessionDevice.authHeaders(token)
          : { Authorization: "Bearer " + token };
      headers.Accept = "application/json";
    }
    return fetch("/api/public/payments/checkout/recover?session_id=" + encodeURIComponent(sid), {
      method: "GET",
      credentials: "same-origin",
      headers: headers
    })
      .then(function (r) {
        return r.json().catch(function () {
          return {};
        });
      })
      .then(function (body) {
        return Boolean(body && body.ok);
      })
      .catch(function () {
        return false;
      });
  }

  function runWorkspaceInit(
    params,
    title,
    status,
    meta,
    buildBtn,
    out,
    list,
    planStatus,
    ownedPlansEl,
    enablePushBtn,
    planViewModeEl,
    paidPlans
  ) {
    var renewalLockWrap = byId("workspaceRenewalLock");
    var renewalLockText = byId("workspaceRenewalLockText");
    var renewNowBtn = byId("renewNowBtn");
    var current = paidPlans[0];
    if (!params.sessionId && !params.plan) {
      params.plan = current.plan;
      params.flow = current.flow;
      params.provider = current.provider || "card";
      params.sessionId = current.sessionId || "";
    }
    if (!params.sessionId) {
      params.sessionId = current.sessionId || "";
    }
    var ownedCoachPlans = paidPlans
      .filter(function (row) {
        return String(row.flow || "").toLowerCase() === "coach";
      })
      .map(function (row) {
        return normalizePlan(row.plan);
      })
      .filter(function (plan, idx, arr) {
        return arr.indexOf(plan) === idx;
      });
    var ownedPlans = params.flow === "coach"
      ? (ownedCoachPlans.length ? ownedCoachPlans : [normalizePlan(params.plan)])
      : [normalizePlan(params.plan)];
    var routineExerciseLinksEl = byId("routineExerciseLinks");
    var exerciseCategoryEl = byId("exerciseCategorySelect");
    var exerciseEl = byId("exerciseSelect");
    var exerciseDetailEl = byId("exerciseFormDetail");
    var commitExerciseSelection = renderExerciseLibrary(exerciseCategoryEl, exerciseEl, exerciseDetailEl);

    if (ownedPlansEl) {
      ownedPlansEl.textContent = ownedPlans
        .map(function (planCode) { return packageLabel(params.flow, planCode); })
        .join(" + ");
    }
    var renewal = null;
    try {
      renewal = window.__vibecartCoachRenewalState || null;
    } catch {
      renewal = null;
    }
    var renewalLocked = Boolean(renewal && renewal.locked && params.flow === "coach");
    if (renewalLockWrap) {
      renewalLockWrap.hidden = !renewalLocked;
    }
    if (renewalLocked) {
      var renewPlan = normalizePlan((renewal && renewal.subscriptionPlan) || ownedPlans[0] || params.plan || "starter");
      var renewUrl =
        "/api/public/payments/checkout/redirect?flow=coach&plan=" +
        encodeURIComponent(renewPlan) +
        "&paymentMethod=card&autoRenew=1";
      if (renewalLockText) {
        renewalLockText.textContent =
          "Your last renewal payment did not go through. Renew " +
          packageLabel("coach", renewPlan) +
          " now to unlock your dashboard and continue your plan.";
      }
      if (status) {
        status.textContent = "Dashboard locked pending renewal payment.";
      }
      if (meta) {
        meta.textContent = "Renewal status: payment failed. Access will return immediately after successful renewal.";
      }
      if (planStatus) {
        planStatus.textContent = "Renew now to continue routines, meal guidance, and coach notifications.";
      }
      if (out) {
        out.textContent =
          "Your package is temporarily locked because renewal did not complete. Tap Renew now to restore access.";
      }
      if (list) {
        list.innerHTML = "";
        var li = document.createElement("li");
        li.textContent = "Renewal required. Your AI notifications will resume after successful payment.";
        list.appendChild(li);
      }
      if (buildBtn) {
        buildBtn.disabled = true;
      }
      if (renewNowBtn && !renewNowBtn.dataset.bound) {
        renewNowBtn.dataset.bound = "1";
        renewNowBtn.addEventListener("click", function () {
          window.location.assign(renewUrl);
        });
      }
      return;
    }

    if (planViewModeEl) {
      planViewModeEl.innerHTML = "";
      var mergedOption = document.createElement("option");
      mergedOption.value = "merged";
      mergedOption.textContent = "Merged benefits (all owned)";
      planViewModeEl.appendChild(mergedOption);
      ownedPlans.forEach(function (planCode) {
        var option = document.createElement("option");
        option.value = planCode;
        option.textContent = packageLabel(params.flow, planCode);
        planViewModeEl.appendChild(option);
      });
      var storedViewMode = readPlanViewMode();
      var canUseStored = Array.prototype.slice.call(planViewModeEl.options || []).some(function (opt) {
        return String(opt.value || "") === storedViewMode;
      });
      if (canUseStored) {
        planViewModeEl.value = storedViewMode;
      }
      fetchRemotePlanViewMode().then(function (remoteMode) {
        if (!remoteMode) {
          return;
        }
        var canUseRemote = Array.prototype.slice.call(planViewModeEl.options || []).some(function (opt) {
          return String(opt.value || "") === remoteMode;
        });
        if (!canUseRemote) {
          return;
        }
        if (planViewModeEl.value !== remoteMode) {
          planViewModeEl.value = remoteMode;
          try {
            planViewModeEl.dispatchEvent(new Event("change"));
          } catch {
            /* ignore */
          }
        }
      });
    }

    if (enablePushBtn) {
      enablePushBtn.addEventListener("click", function () {
        ensurePushPermission(planStatus);
      });
    }

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      if (planStatus) {
        planStatus.textContent = "Phone notifications are enabled for coach updates.";
      }
      registerBrowserWebPushSubscription(getPublicAuthToken(), null);
    }

    if (params.sessionId && params.flow === "coach" && ownedPlans.length > 1) {
      if (status) {
        status.textContent =
          "Payment confirmed. Bundle active: " +
          ownedPlans.map(function (x) { return packageLabel("coach", x); }).join(" + ") +
          ".";
      }
    }

    if (title) {
      title.textContent = params.flow === "insurance" ? "Your insurance wellness workspace" : "Your health coach workspace";
    }
    if (status && !(params.sessionId && params.flow === "coach" && ownedPlans.length > 1)) {
      status.textContent = "Payment confirmed. " + packageLabel(params.flow, params.plan) + " is active and ready.";
    }
    if (meta) {
      meta.textContent =
        "Payment method: " +
        (params.provider || "card") +
        (params.sessionId ? " | Session ID: " + params.sessionId : " | Session ID pending");
    }

    var autoProfile = defaultProfileFromCheckout();
    var currentOwnedPlans = ownedPlans.slice();
    if (planViewModeEl && String(planViewModeEl.value || "merged") !== "merged") {
      currentOwnedPlans = [normalizePlan(planViewModeEl.value)];
    }
    renderPlanVisuals(params.flow, currentOwnedPlans, summarizeRecentCheckins(readCoachCheckins(params)));

    var onboardingWrap = byId("workspaceOnboarding");
    var onboardingTitle = byId("onboardingTitle");
    var onboardingLead = byId("onboardingLead");
    var onboardingStatus = byId("onboardingStatus");
    var stepStart = byId("onboardingStepStart");
    var stepGoal = byId("onboardingStepGoal");
    var startNowBtn = byId("onboardingStartNowBtn");
    var startTomorrowBtn = byId("onboardingStartTomorrowBtn");
    var goalLoseBtn = byId("onboardingGoalLoseBtn");
    var goalGainBtn = byId("onboardingGoalGainBtn");
    var onboardingKey = "vibecart-onboarding-complete:" + String(params.sessionId || params.plan || "default");

    function applyProfileAndRender(profile) {
      renderAutoPlan(params, profile, out, list, planStatus, currentOwnedPlans, {
        routineExerciseLinksEl: routineExerciseLinksEl,
        onPickExercise: function (exerciseId) {
          commitExerciseSelection(exerciseId);
          try {
            if (exerciseDetailEl && exerciseDetailEl.scrollIntoView) {
              exerciseDetailEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          } catch {
            /* ignore */
          }
        }
      });
      renderPlanVisuals(params.flow, currentOwnedPlans, summarizeRecentCheckins(readCoachCheckins(params)));
      try {
        localStorage.setItem(onboardingKey, "1");
      } catch {
        /* ignore */
      }
      if (onboardingWrap) onboardingWrap.hidden = true;
      var tok = getPublicAuthToken();
      if (tok && Array.isArray(currentOwnedPlans) && currentOwnedPlans.length) {
        sendCoachEncouragePush(
          tok,
          "You are in. Your " + packageLabel(params.flow, currentOwnedPlans[0]) + " package is active.",
          "Keep going — your plan auto-adapts with every check-in."
        );
        window.setTimeout(function () {
          sendCoachEncouragePush(tok, "Quick check-in", "Small daily progress beats perfect weeks. You are doing well.");
        }, 45000);
      }
    }

    var onboardingDone = false;
    try {
      onboardingDone = localStorage.getItem(onboardingKey) === "1";
    } catch {
      onboardingDone = false;
    }
    if (onboardingWrap && !onboardingDone) {
      onboardingWrap.hidden = false;
      if (onboardingTitle) onboardingTitle.textContent = "Welcome " + readDisplayName() + " - your package is live";
      if (onboardingLead) {
        onboardingLead.textContent =
          "Beautiful work. Let us configure your first adaptive routine and notifications in two quick choices.";
      }
      var startPref = "now";
      if (stepGoal) stepGoal.hidden = true;
      function chooseStart(pref) {
        startPref = pref;
        if (stepStart) stepStart.hidden = true;
        if (stepGoal) stepGoal.hidden = false;
        if (onboardingStatus) onboardingStatus.textContent = "Great. Final step: choose your primary direction.";
      }
      startNowBtn && startNowBtn.addEventListener("click", function () { chooseStart("now"); });
      startTomorrowBtn && startTomorrowBtn.addEventListener("click", function () { chooseStart("tomorrow"); });
      function finalizeGoal(direction) {
        var p = {
          goal:
            direction === "lose"
              ? "Fat loss with healthy energy and consistency"
              : "Lean muscle gain and strength progression",
          diet: direction === "lose" ? "High-protein balanced cut" : "High-protein balanced gain",
          activity: autoProfile.activity || "medium",
          wake: startPref === "tomorrow" ? "Morning (start tomorrow)" : "Start now",
          notes: autoProfile.notes || ""
        };
        if (onboardingStatus) onboardingStatus.textContent = "Generating your intelligent package plan...";
        applyProfileAndRender(p);
      }
      goalLoseBtn && goalLoseBtn.addEventListener("click", function () { finalizeGoal("lose"); });
      goalGainBtn && goalGainBtn.addEventListener("click", function () { finalizeGoal("gain"); });
    } else {
      applyProfileAndRender(autoProfile);
    }

    if (!buildBtn) {
      return;
    }
    var goalEl = byId("planGoal");
    var dietEl = byId("planDiet");
    var activityEl = byId("planActivity");
    var wakeEl = byId("planWake");
    var notesEl = byId("planNotes");
    var checkinCompletedEl = byId("checkinCompleted");
    var checkinEffortEl = byId("checkinEffort");
    var checkinSorenessEl = byId("checkinSoreness");
    var checkinSleepEl = byId("checkinSleep");
    var checkinMoodEl = byId("checkinMood");
    var submitCheckinBtn = byId("submitCheckinBtn");
    var replanNowBtn = byId("replanNowBtn");
    var checkinStatusEl = byId("checkinStatus");
    if (goalEl) goalEl.value = autoProfile.goal;
    if (dietEl) dietEl.value = autoProfile.diet;
    if (activityEl) activityEl.value = autoProfile.activity;
    if (wakeEl) wakeEl.value = autoProfile.wake;
    if (notesEl) notesEl.value = autoProfile.notes;

    function pickExerciseInLibrary(exerciseId) {
      commitExerciseSelection(exerciseId);
      try {
        if (exerciseDetailEl && exerciseDetailEl.scrollIntoView) {
          exerciseDetailEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch {
        /* ignore */
      }
    }

    if (planViewModeEl) {
      planViewModeEl.addEventListener("change", function () {
        var selected = String((planViewModeEl && planViewModeEl.value) || "merged");
        savePlanViewMode(selected);
        if (selected === "merged") {
          currentOwnedPlans = ownedPlans.slice();
        } else {
          currentOwnedPlans = [normalizePlan(selected)];
        }
        renderAutoPlan(params, {
          goal: String((goalEl && goalEl.value) || "").trim() || autoProfile.goal,
          diet: String((dietEl && dietEl.value) || "").trim() || autoProfile.diet,
          activity: String((activityEl && activityEl.value) || "medium").trim(),
          wake: String((wakeEl && wakeEl.value) || "").trim() || autoProfile.wake,
          notes: String((notesEl && notesEl.value) || "").trim()
        }, out, list, planStatus, currentOwnedPlans, {
          checkinStatusEl: checkinStatusEl,
          routineExerciseLinksEl: routineExerciseLinksEl,
          onPickExercise: pickExerciseInLibrary
        });
        renderPlanVisuals(params.flow, currentOwnedPlans, summarizeRecentCheckins(readCoachCheckins(params)));
      });
    }

    function profileFromInputs() {
      return {
        goal: String((goalEl && goalEl.value) || "").trim() || autoProfile.goal,
        diet: String((dietEl && dietEl.value) || "").trim() || autoProfile.diet,
        activity: String((activityEl && activityEl.value) || "medium").trim(),
        wake: String((wakeEl && wakeEl.value) || "").trim() || autoProfile.wake,
        notes: String((notesEl && notesEl.value) || "").trim()
      };
    }

    function regenerateLivePlan(reasonText) {
      if (checkinStatusEl && reasonText) {
        checkinStatusEl.textContent = reasonText;
      }
      renderAutoPlan(params, profileFromInputs(), out, list, planStatus, currentOwnedPlans, {
        checkinStatusEl: checkinStatusEl,
        routineExerciseLinksEl: routineExerciseLinksEl,
        onPickExercise: pickExerciseInLibrary
      });
      renderPlanVisuals(params.flow, currentOwnedPlans, summarizeRecentCheckins(readCoachCheckins(params)));
    }

    if (submitCheckinBtn && !submitCheckinBtn.dataset.bound) {
      submitCheckinBtn.dataset.bound = "1";
      submitCheckinBtn.addEventListener("click", function () {
        var history = readCoachCheckins(params);
        history.push({
          at: new Date().toISOString(),
          completed: String((checkinCompletedEl && checkinCompletedEl.value) || "yes"),
          effort: Number((checkinEffortEl && checkinEffortEl.value) || 0),
          soreness: String((checkinSorenessEl && checkinSorenessEl.value) || "medium"),
          sleep: String((checkinSleepEl && checkinSleepEl.value) || "ok"),
          mood: String((checkinMoodEl && checkinMoodEl.value) || "neutral")
        });
        saveCoachCheckins(params, history);
        regenerateLivePlan("Check-in saved. AI is auto-adjusting your next sessions...");
      });
    }

    if (replanNowBtn && !replanNowBtn.dataset.bound) {
      replanNowBtn.dataset.bound = "1";
      replanNowBtn.addEventListener("click", function () {
        regenerateLivePlan("Running live AI replan for your current package...");
      });
    }

    buildBtn.addEventListener("click", function () {
      var profile = profileFromInputs();
      renderAutoPlan(params, profile, out, list, planStatus, currentOwnedPlans, {
        checkinStatusEl: checkinStatusEl,
        routineExerciseLinksEl: routineExerciseLinksEl,
        onPickExercise: pickExerciseInLibrary
      });
      renderPlanVisuals(params.flow, currentOwnedPlans, summarizeRecentCheckins(readCoachCheckins(params)));
    });

    window.setInterval(function () {
      if (document.hidden) {
        return;
      }
      regenerateLivePlan("Live autopilot refresh: syncing your package plan with latest check-ins...");
    }, 4 * 60 * 60 * 1000);
  }

  function init() {
    var params = readParams();
    var title = byId("workspaceTitle");
    var status = byId("workspaceStatus");
    var meta = byId("workspaceMeta");
    var buildBtn = byId("buildPlanBtn");
    var out = byId("planOutput");
    var list = byId("planNotifications");
    var planStatus = byId("planBuildStatus");
    var ownedPlansEl = byId("workspaceOwnedPlans");
    var enablePushBtn = byId("enablePushBtn");
    var planViewModeEl = byId("planViewMode");
    function go(listArg) {
      runWorkspaceInit(
        params,
        title,
        status,
        meta,
        buildBtn,
        out,
        list,
        planStatus,
        ownedPlansEl,
        enablePushBtn,
        planViewModeEl,
        listArg
      );
    }
    function finishFromStoredPlans() {
      var merged = mergeUrlParamsIntoPaidPlans(params, readPaidPlans());
      if (!merged.length) {
        var tok = getPublicAuthToken();
        var w = null;
        try {
          w = window.__vibecartCoachHydrateLast;
        } catch {
          w = null;
        }
        if (tok && w) {
          if (Number(w.httpStatus || 0) >= 400 || w.bodyOk === false) {
            if (status) {
              status.textContent =
                "We could not load your purchases from the server. Try signing out and signing in again on this browser.";
            }
            if (meta) {
              meta.textContent =
                "HTTP " +
                String(w.httpStatus || "?") +
                (w.code ? " · " + w.code : "") +
                " · If this persists, open Account hub or contact support.";
            }
            return;
          }
          if (Number(w.httpStatus || 0) === 200 && w.bodyOk && Number(w.sessionCount || 0) === 0) {
            if (status) {
              status.textContent =
                "No coach purchase is linked to this signed-in account yet. If you already paid, wait a moment and refresh, or use Account hub.";
            }
            if (meta) {
              meta.textContent =
                "Ask support to run a one-line Stripe fulfillment sync, or confirm you are signed in with the same email you used at checkout.";
            }
            return;
          }
        }
        if (status) {
          status.textContent =
            "We could not confirm an active package on this device yet. You are not blocked: use the actions below to recover instantly.";
        }
        if (meta) {
          meta.innerHTML =
            "Open <a href=\"./account-hub.html?plan_locked=1\">Account hub</a>, " +
            "or <a href=\"./coach-payment-recovery.html\">Restore coach access</a> if you already paid.";
        }
        var outEl = byId("planOutput");
        if (outEl) {
          outEl.textContent =
            "No active plan is linked in this browser yet. Use Account hub or Restore coach access — no second charge.";
        }
        return;
      }
      go(merged);
    }
    autoRecoverCheckoutSessionFromUrl(params).finally(function () {
      hydrateCoachFulfillmentFromServer().finally(function () {
        mergeUrlParamsIntoPaidPlans(params, readPaidPlans());
        finishFromStoredPlans();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
