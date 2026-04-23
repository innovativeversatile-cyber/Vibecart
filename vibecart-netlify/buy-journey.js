(function () {
  function applyFashionBuyerLane() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var flow = String(params.get("flow") || "buy").toLowerCase();
      var lane = String(params.get("lane") || "").toLowerCase();
      if (flow !== "buy" || lane !== "fashion") {
        return;
      }
      var fashionTrends = "./fashion-trends.html";
      var fashionShops = "./live-market-shops.html?cat=Fashion";
      var title = document.getElementById("buyJourneyTitle");
      var label = document.getElementById("buyJourneyStepLabel");
      var topCta = document.getElementById("buyJourneyTopCta");
      var finalCta = document.getElementById("buyJourneyFinalCta");
      var step1 = document.getElementById("buyFlowStep1");
      var step3 = document.getElementById("buyFlowStep3");
      if (title) {
        title.textContent = "Buy the fashion lane";
      }
      if (label) {
        label.textContent = "Fashion buyer path · Step 1 of 3";
      }
      if (topCta) {
        topCta.href = fashionTrends;
        topCta.textContent = "Open fashion trends lane";
      }
      if (finalCta) {
        finalCta.href = fashionShops;
        finalCta.textContent = "Enter Fashion live shops";
      }
      if (step1) {
        var h2 = step1.querySelector("h2");
        var note = step1.querySelector("p.note");
        var regional = step1.querySelector("a.btn-secondary");
        if (h2) {
          h2.textContent = "1 · Start with trends";
        }
        if (note) {
          note.textContent =
            "Open the fashion-only lane with the moving hero and outfit links, then continue to live Fashion listings when you are ready.";
        }
        if (regional) {
          regional.href = fashionTrends;
          regional.textContent = "Open fashion trends lane";
        }
      }
      if (step3) {
        var note3 = step3.querySelector("p.note");
        if (note3) {
          note3.textContent =
            "You land in the Fashion tab on live market shops so the grid stays style-first — no electronics mix in this shortcut.";
        }
      }
    } catch {
      /* ignore */
    }
  }

  function applyBuyCategoryDeepLink() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var flow = String(params.get("flow") || "buy").toLowerCase();
      if (flow !== "buy") {
        return;
      }
      if (String(params.get("lane") || "").toLowerCase() === "fashion") {
        return;
      }
      var cat = String(params.get("cat") || "").trim();
      if (!cat) {
        return;
      }
      var allowed = { All: true, Electronics: true, Fashion: true, Books: true, Gaming: true };
      if (!allowed[cat]) {
        cat = "All";
      }
      var target = "./live-market-shops.html?cat=" + encodeURIComponent(cat);
      var topCta = document.getElementById("buyJourneyTopCta");
      var finalCta = document.getElementById("buyJourneyFinalCta");
      if (topCta) {
        topCta.href = target;
      }
      if (finalCta) {
        finalCta.href = target;
      }
    } catch {
      /* ignore */
    }
  }

  function applyFlowSpecificCheckout() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var flow = String(params.get("flow") || "buy").toLowerCase();
      var plan = String(params.get("plan") || "").trim();
      var title = document.getElementById("buyJourneyTitle");
      var label = document.getElementById("buyJourneyStepLabel");
      var topCta = document.getElementById("buyJourneyTopCta");
      var finalCta = document.getElementById("buyJourneyFinalCta");
      var step1 = document.getElementById("buyFlowStep1");
      var step2 = document.getElementById("buyFlowStep2");
      var step3 = document.getElementById("buyFlowStep3");

      if (flow !== "coach" && flow !== "insurance") {
        return;
      }

      if (flow === "insurance") {
        if (title) {
          title.textContent = "Insurance referrals (external providers)";
        }
        if (label) {
          label.textContent = "External provider flow";
        }
        if (step1) {
          step1.innerHTML =
            '<h2>Insurance checkout is external</h2><p class="note">VibeCart does not collect insurance customer funds. Choose a licensed provider website and complete checkout directly with that insurer.</p><p class="hero-actions"><a class="btn btn-secondary" href="./insurance.html#insurance-packages">View trusted provider websites</a><a class="btn btn-primary" href="https://www.allianz.com" target="_blank" rel="noopener noreferrer">Visit provider now</a></p>';
        }
        if (step2) {
          step2.innerHTML =
            '<h2>How your cut works</h2><p class="note">Customer pays the insurer directly. VibeCart only tracks referrals and partner commissions after confirmed conversion events.</p><p class="hero-actions"><a class="btn btn-secondary" href="./terms.html#insurance-referral-model">Legal terms</a><a class="btn btn-secondary" href="./policy.html#insurance-referral-policy">Marketplace policy</a></p>';
        }
        if (step3) {
          step3.innerHTML =
            '<h2>Next step</h2><p class="note">Continue to trusted insurer websites. Do not route insurance checkout through internal payment forms.</p><p class="hero-actions"><a id="buyJourneyFinalCta" class="btn btn-primary" href="./insurance.html#insurance-packages">Open insurance providers</a></p>';
        }
        if (topCta) {
          topCta.textContent = "Back to insurance providers";
          topCta.href = "./insurance.html#insurance-packages";
        }
        return;
      }

      if (title) {
        title.textContent = "Health coach checkout";
      }
      if (label) {
        label.textContent = "Step 1 of 3";
      }

      if (step1) {
        step1.innerHTML =
          flow === "coach"
            ? '<h2>1 · Confirm coach package</h2><p class="note">Selected package: <strong>' +
              (plan || "starter") +
              '</strong>. Fill your wellness details and continue.</p><p class="hero-actions"><a class="btn btn-secondary" href="./wellbeing.html#coach-packages">Change package</a><button type="button" class="btn btn-primary" data-flow-next>Continue</button></p>'
            : "";
      }

      if (step2) {
        step2.innerHTML =
          flow === "coach"
            ? '<h2>2 · Enter your details</h2><p class="note">Please fill this for first-time users too.</p><div class="admin-grid" style="max-width:34rem"><label for="coachCheckoutName">Full name</label><input id="coachCheckoutName" type="text" placeholder="Your full name" /><label for="coachCheckoutEmail">Email</label><input id="coachCheckoutEmail" type="email" placeholder="you@example.com" /><label for="coachCheckoutGoal">Goal summary</label><input id="coachCheckoutGoal" type="text" placeholder="e.g. Lose 4kg safely in 10 weeks" /></div><p class="hero-actions"><button type="button" class="btn btn-secondary" data-flow-prev>Back</button><button type="button" class="btn btn-primary" data-flow-next id="coachCheckoutContinue">Continue to payment</button></p>'
            : "";
      }

      if (finalCta) {
        finalCta.textContent = "Proceed to secure checkout";
        finalCta.href =
          "./checkout-details.html?flow=" +
          encodeURIComponent(flow) +
          "&plan=" +
          encodeURIComponent(plan || "starter");
      }
      if (topCta) {
        topCta.textContent = "Back to coach packages";
        topCta.href = "./wellbeing.html#coach-packages";
      }
      if (step3) {
        var p = step3.querySelector("p.note");
        if (p) {
          p.textContent =
            flow === "coach"
              ? "Final step: proceed to secure checkout and confirm your coach subscription."
              : "";
        }
      }

      var validateAndStore = function (event) {
        try {
          if (flow === "coach") {
            var n1 = document.getElementById("coachCheckoutName");
            var e1 = document.getElementById("coachCheckoutEmail");
            var g1 = document.getElementById("coachCheckoutGoal");
            if (!n1 || !e1 || !g1 || !n1.value.trim() || !e1.value.trim() || !g1.value.trim()) {
              event.preventDefault();
              event.stopPropagation();
              alert("Please fill all coach checkout details before continuing.");
              return;
            }
            sessionStorage.setItem(
              "vibecart-checkout-draft",
              JSON.stringify({ flow: flow, plan: plan || "starter", name: n1.value.trim(), email: e1.value.trim(), goal: g1.value.trim() })
            );
            return;
          }
          return;
        } catch {
          /* ignore */
        }
      };

      var step2Continue =
        flow === "coach"
          ? document.getElementById("coachCheckoutContinue")
          : null;
      if (step2Continue) {
        step2Continue.addEventListener("click", validateAndStore);
      }
    } catch {
      /* ignore */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applyFlowSpecificCheckout();
      applyFashionBuyerLane();
      applyBuyCategoryDeepLink();
    }, { once: true });
  } else {
    applyFlowSpecificCheckout();
    applyFashionBuyerLane();
    applyBuyCategoryDeepLink();
  }
})();
