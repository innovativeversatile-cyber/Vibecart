/* Health coach package matcher — runs after site-chrome so taps and output are reliable. */
(function () {
  var lastRun = 0;

  function clearOut(el) {
    if (!el) return;
    if (el.replaceChildren) {
      el.replaceChildren();
    } else {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }
  }

  function planLabel(id) {
    var map = {
      starter: "Starter Coach",
      "ai-home": "AI Home Workout",
      plus: "Coach Plus",
      pro: "Coach Pro"
    };
    return map[id] || "Starter Coach";
  }

  function pickPlan(goalType, speedType, dailyHours, haveWeights, delta) {
    var plan = "starter";
    var reasons = [];

    if (dailyHours >= 1.75 || speedType === "aggressive") {
      plan = "pro";
      reasons.push("High training capacity or aggressive pace fits deeper analytics and daily programming.");
    } else if (dailyHours >= 1.25 || speedType === "moderate") {
      plan = "plus";
      reasons.push("Moderate pace or solid daily time supports wearable sync and richer routines.");
    }

    if (plan === "starter" && haveWeights && delta >= 16) {
      plan = "pro";
      reasons.push("Large weight-change target benefits structured progression and closer tracking.");
    } else if (plan === "starter" && haveWeights && delta >= 9) {
      plan = "plus";
      reasons.push("Meaningful weight gap suggests more than a light weekly check-in.");
    } else if (plan === "plus" && haveWeights && delta >= 16) {
      plan = "pro";
      reasons.push("Very large weight gap warrants the deepest analytics tier.");
    }

    if (plan === "starter" && (goalType === "muscle_gain" || goalType === "weight_gain")) {
      plan = "ai-home";
      reasons.push("Strength or size goals align with daily home programming blocks.");
    }

    if (plan === "starter" && goalType === "weight_loss" && haveWeights && delta >= 6) {
      plan = "plus";
      reasons.push("Weight-loss focus with a measurable gap benefits structured daily prompts.");
    }

    if (plan === "starter" && goalType === "general_fitness" && dailyHours >= 1) {
      plan = "plus";
      reasons.push("General fitness with an hour or more per day can use richer routine variety.");
    }

    if (!reasons.length) {
      reasons.push("Your answers point to a lighter plan; you can upgrade anytime after checkout.");
    }
    if (reasons.length > 2) {
      reasons = reasons.slice(0, 2);
    }
    return { plan: plan, reasons: reasons };
  }

  function renderMatch(out, recommendedPlan, summaryLine, reasons, sourceTag) {
    clearOut(out);
    out.removeAttribute("data-placeholder");

    var wrap = document.createElement("div");
    wrap.className = "coach-match-result";

    var title = document.createElement("p");
    title.className = "coach-match-result__title";
    var tStrong = document.createElement("strong");
    tStrong.textContent = "Suggested plan:";
    title.appendChild(tStrong);
    title.appendChild(document.createTextNode(" " + planLabel(recommendedPlan) + " "));
    var tag = document.createElement("span");
    tag.className = "coach-match-result__tag";
    tag.textContent = sourceTag || "offline rules";
    title.appendChild(tag);

    var sum = document.createElement("p");
    sum.className = "note";
    sum.textContent = summaryLine;

    var ul = document.createElement("ul");
    ul.className = "coach-match-result__why";
    reasons.forEach(function (r) {
      var li = document.createElement("li");
      li.textContent = r;
      ul.appendChild(li);
    });

    var legal = document.createElement("p");
    legal.className = "note coach-match-result__legal";
    legal.textContent =
      "This picker routes you to a subscription tier from your inputs — not medical advice. For paid checkout, tick the disclaimer above when required.";

    var actions = document.createElement("p");
    actions.className = "hero-actions";
    actions.style.marginTop = "0.65rem";

    var preview = document.createElement("a");
    preview.className = "btn btn-secondary";
    preview.href = "./coach-experience.html?flow=coach&plan=" + encodeURIComponent(recommendedPlan);
    preview.textContent = "Preview package";

    var checkout = document.createElement("a");
    checkout.className = "btn btn-primary";
    checkout.href = "./checkout-details.html?flow=coach&plan=" + encodeURIComponent(recommendedPlan);
    checkout.textContent = "Go to checkout";

    actions.appendChild(preview);
    actions.appendChild(checkout);

    wrap.appendChild(title);
    wrap.appendChild(sum);
    wrap.appendChild(ul);
    wrap.appendChild(legal);
    wrap.appendChild(actions);
    out.appendChild(wrap);

    try {
      out.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch {
      /* ignore */
    }
  }

  function runMatch() {
    var now = Date.now();
    if (now - lastRun < 280) {
      return;
    }
    lastRun = now;

    var goal = document.getElementById("coachGoalType");
    var currentWeight = document.getElementById("coachCurrentWeight");
    var targetWeight = document.getElementById("coachTargetWeight");
    var speed = document.getElementById("coachGoalSpeed");
    var hours = document.getElementById("coachHoursDaily");
    var out = document.getElementById("coachMatchOut");
    if (!goal || !currentWeight || !targetWeight || !speed || !hours || !out) {
      return;
    }

    var goalType = String(goal.value || "general_fitness");
    var cw = Number(currentWeight.value || 0);
    var tw = Number(targetWeight.value || 0);
    var speedType = String(speed.value || "steady");
    var dailyHours = Number(hours.value || 0.5);
    var haveWeights = cw >= 30 && tw >= 30;
    var delta = haveWeights ? Math.abs(tw - cw) : 0;

    var picked = pickPlan(goalType, speedType, dailyHours, haveWeights, delta);
    var recommendedPlan = picked.plan;
    var reasons = picked.reasons;

    var summaryLine = haveWeights
      ? "Inputs: " +
        goalType.replace(/_/g, " ") +
        ", gap " +
        delta.toFixed(1) +
        " kg, pace " +
        speedType +
        ", about " +
        dailyHours +
        " h/day available."
      : "Inputs: " +
        goalType.replace(/_/g, " ") +
        ", pace " +
        speedType +
        ", about " +
        dailyHours +
        " h/day. Add both weights (kg) for a sharper tier match.";

    function applyLocal() {
      try {
        renderMatch(out, recommendedPlan, summaryLine, reasons, "offline rules");
      } catch (err) {
        out.textContent = "Could not render the result in this browser. Try refreshing the page.";
      }
    }

    if (typeof window.vibecartAiGenerate === "function") {
      window
        .vibecartAiGenerate("coach_matcher", {
          goalType: goalType,
          currentWeightKg: cw,
          targetWeightKg: tw,
          goalSpeed: speedType,
          hoursDaily: dailyHours
        })
        .then(function (ai) {
          if (ai && ai.planId) {
            var rs = Array.isArray(ai.reasons) ? ai.reasons.map(String).filter(Boolean) : [];
            if (rs.length < 2) {
              rs = reasons.slice();
            }
            renderMatch(out, String(ai.planId), String(ai.summary || summaryLine), rs.slice(0, 2), "generative AI");
            return;
          }
          applyLocal();
        })
        .catch(function () {
          applyLocal();
        });
      return;
    }
    applyLocal();
  }

  function bind() {
    var btn = document.getElementById("coachMatchBtn");
    var out = document.getElementById("coachMatchOut");
    if (!btn || !out) {
      return;
    }
    out.classList.add("coach-match-out");

    window.__vcCoachMatch = runMatch;

    var lastTouchRun = 0;
    btn.addEventListener(
      "touchend",
      function (e) {
        if (e) {
          e.preventDefault();
        }
        lastTouchRun = Date.now();
        runMatch();
      },
      { passive: false }
    );
    btn.addEventListener("click", function (e) {
      if (Date.now() - lastTouchRun < 450) {
        if (e) {
          e.preventDefault();
        }
        return;
      }
      if (e) {
        e.preventDefault();
      }
      runMatch();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
