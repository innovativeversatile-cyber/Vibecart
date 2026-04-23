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

  function fetchRemotePlanViewMode() {
    var token = getPublicAuthToken();
    if (!token) {
      return Promise.resolve("");
    }
    return fetch("/api/public/user/preferences", {
      headers: {
        Authorization: "Bearer " + token
      }
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
    fetch("/api/public/user/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
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
    if (plan === "pro") return "Coach Pro";
    if (plan === "plus") return "Coach Plus";
    if (plan === "ai-home") return "AI Home Workout";
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
      homeOnly: false
    };
    if (flow === "insurance") {
      return {
        routines: true,
        updates: true,
        meals: false,
        prep: false,
        homeOnly: false
      };
    }
    if (has("plus") || has("pro")) {
      base.meals = true;
      base.prep = true;
    }
    if (has("ai-home")) {
      base.homeOnly = true;
    }
    return base;
  }

  function buildRoutine(input, flow, ownedPlans) {
    var plans = Array.isArray(ownedPlans) ? ownedPlans : [ownedPlans];
    var caps = planCapabilities(flow, plans);
    var labels = plans.map(function (p) { return packageLabel(flow, p); });
    var lines = [];
    lines.push("Active package(s): " + labels.join(" + "));
    lines.push("Primary goal: " + (input.goal || "General wellness"));
    lines.push("Training time: " + (input.wake || "Morning"));
    lines.push("Daily routine:");
    lines.push("- 10 min mobility and breathing warm-up");
    lines.push("- 25 min focused workout adapted to " + (input.activity || "medium") + " activity level");
    lines.push("- 15 min cool-down / stretch");
    lines.push("- Evening check-in update with AI coach");
    if (caps.homeOnly) {
      lines.push("- Home-only training mode: no gym equipment required.");
      lines.push("- AI adjusts daily intensity using your previous check-ins.");
    }
    if (caps.meals) {
      lines.push("Meal guidance:");
      lines.push("- Nutrition style: " + (input.diet || "Balanced"));
      lines.push("- Meal prep: 2 prep blocks/week with shopping checklist");
      lines.push("- Recovery hydration target and protein timing included");
    } else {
      lines.push("Package scope:");
      lines.push("- Routine + updates only (meal plans unlock on Plus/Pro).");
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
    var list = [
      "Morning reminder: start your first routine block.",
      "Update request: send your daily check-in to AI coach.",
      "Progress checkpoint every 7 days with plan adjustment."
    ];
    if (flow === "coach" && (plans.indexOf("plus") >= 0 || plans.indexOf("pro") >= 0)) {
      list.push("Meal prep alert: weekly prep checklist is ready.");
      list.push("Nutrition update: AI adjusted meal portions for your goal.");
    }
    if (flow === "coach" && plans.indexOf("ai-home") >= 0) {
      list.push("Home workout ping: your no-equipment routine is ready.");
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
      }
    }).catch(function () {
      if (statusEl) {
        statusEl.textContent = "Could not enable notifications right now.";
      }
    });
  }

  function renderAutoPlan(params, profile, out, list, planStatus, ownedPlans) {
    var routine = buildRoutine(profile, params.flow, ownedPlans);
    if (out) {
      out.textContent = routine;
    }
    var notifications = buildNotifications(params.flow, ownedPlans);
    if (list) {
      list.innerHTML = "";
      notifications.forEach(function (msg) {
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
      routine: routine,
      notifications: notifications,
      profile: profile,
      updatedAt: new Date().toISOString()
    });
    try {
      localStorage.setItem("vibecart-active-plan-profile", JSON.stringify(profile));
    } catch {
      /* ignore */
    }
    if (notifications.length > 0) {
      pushNotifyNow("VibeCart Coach", notifications[0]);
    }
    if (planStatus) {
      planStatus.textContent = "AI plan is activated. All purchased package benefits are unlocked.";
    }
  }

  function saveActivePlan(payload) {
    try {
      localStorage.setItem("vibecart-active-plan", JSON.stringify(payload));
    } catch {
      /* ignore */
    }
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

    var paidPlans = readPaidPlans();
    if (params.sessionId) {
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
        paidPlans = upsertPaidPlans(paidPlans, incoming);
      });
      savePaidPlans(paidPlans);
    }
    if (!Array.isArray(paidPlans) || paidPlans.length === 0) {
      window.location.assign("./account-hub.html?plan_locked=1");
      return;
    }

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

    if (ownedPlansEl) {
      ownedPlansEl.textContent = ownedPlans
        .map(function (planCode) { return packageLabel(params.flow, planCode); })
        .join(" + ");
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

    // Auto-activate paid benefits immediately after payment return.
    var autoProfile = defaultProfileFromCheckout();
    var currentOwnedPlans = ownedPlans.slice();
    if (planViewModeEl && String(planViewModeEl.value || "merged") !== "merged") {
      currentOwnedPlans = [normalizePlan(planViewModeEl.value)];
    }
    renderAutoPlan(params, autoProfile, out, list, planStatus, currentOwnedPlans);

    if (!buildBtn) {
      return;
    }
    var goalEl = byId("planGoal");
    var dietEl = byId("planDiet");
    var activityEl = byId("planActivity");
    var wakeEl = byId("planWake");
    var notesEl = byId("planNotes");
    if (goalEl) goalEl.value = autoProfile.goal;
    if (dietEl) dietEl.value = autoProfile.diet;
    if (activityEl) activityEl.value = autoProfile.activity;
    if (wakeEl) wakeEl.value = autoProfile.wake;
    if (notesEl) notesEl.value = autoProfile.notes;

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
        }, out, list, planStatus, currentOwnedPlans);
      });
    }

    buildBtn.addEventListener("click", function () {
      var profile = {
        goal: String((goalEl && goalEl.value) || "").trim() || autoProfile.goal,
        diet: String((dietEl && dietEl.value) || "").trim() || autoProfile.diet,
        activity: String((activityEl && activityEl.value) || "medium").trim(),
        wake: String((wakeEl && wakeEl.value) || "").trim() || autoProfile.wake,
        notes: String((notesEl && notesEl.value) || "").trim()
      };
      renderAutoPlan(params, profile, out, list, planStatus, currentOwnedPlans);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
