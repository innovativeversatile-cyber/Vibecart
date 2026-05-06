(function () {
  var SELLER_ONBOARDED_KEY = "vibecart-seller-onboarded-count";

  function getSellerOnboardedCount() {
    var raw = Number(localStorage.getItem(SELLER_ONBOARDED_KEY) || "0");
    if (!Number.isFinite(raw)) return 0;
    return Math.max(0, Math.min(10, Math.floor(raw)));
  }

  function setSellerOnboardedCount(next) {
    try {
      localStorage.setItem(
        SELLER_ONBOARDED_KEY,
        String(Math.max(0, Math.min(10, Math.floor(next))))
      );
    } catch {
      /* ignore */
    }
    renderSellerGrowthProgress();
  }

  function renderSellerGrowthProgress() {
    var sgCount = document.getElementById("sgCount");
    var sgMilestone = document.getElementById("sgMilestone");
    if (sgCount) {
      sgCount.textContent = String(getSellerOnboardedCount());
    }
    if (sgMilestone) {
      var c = getSellerOnboardedCount();
      if (c >= 10) {
        sgMilestone.textContent =
          "10/10 reached. Next: turn AI focus to buyer traffic, first orders, and featured shop pages.";
      } else if (c >= 7) {
        sgMilestone.textContent =
          c +
          "/10: verify payout details, tighten listing quality, and line up two backup sellers so momentum does not stall.";
      } else if (c >= 4) {
        sgMilestone.textContent =
          c +
          "/10: increase outreach volume, ask each seller for one warm intro, and pilot a small referral reward.";
      } else {
        sgMilestone.textContent =
          c +
          "/10: daily outbound plus one live touchpoint (table, room, or call) each week until you pass four verified sellers.";
      }
    }
  }

  function initSellerGrowthIntel() {
    var runBtn = document.getElementById("sgRunPlan");
    var out = document.getElementById("sgPlanOut");
    if (!runBtn || !out) return;
    var niche = document.getElementById("sgNiche");
    var region = document.getElementById("sgRegion");
    var channel = document.getElementById("sgChannel");
    var owner = document.getElementById("sgOwnerName");

    function renderSellerGrowthFallback() {
      var n = String((niche && niche.value) || "general goods").trim();
      var r = String((region && region.value) || "core region").trim();
      var c = String((channel && channel.value) || "mixed").trim();
      var o = String((owner && owner.value) || "Owner").trim();
      out.innerHTML =
        "<strong>VibeAI Growth Plan</strong>" +
        "<p>1) " +
        o +
        ": recruit 3 micro-sellers in " +
        r +
        " for " +
        n +
        " within 10 days.</p>" +
        "<p>2) Use " +
        c +
        " outreach daily and run one trust-proof content drop every 72 hours.</p>" +
        "<p>3) Convert at least 2 sellers/week into listing-health-complete status before scaling ad spend.</p>" +
        "<p class='note'>Offline template — live AI needs OPENAI_API_KEY on the API host.</p>";
    }

    function withTimeout(promise, ms) {
      return new Promise(function (resolve, reject) {
        var t = window.setTimeout(function () {
          reject(new Error("timeout"));
        }, Number(ms || 14000));
        promise.then(
          function (v) {
            window.clearTimeout(t);
            resolve(v);
          },
          function (e) {
            window.clearTimeout(t);
            reject(e);
          }
        );
      });
    }

    runBtn.addEventListener("click", function () {
      var sellerAck = document.getElementById("sellerFlowDisclaimerAck");
      if (sellerAck && !sellerAck.checked) {
        out.textContent = "Please accept the disclaimer before generating the plan.";
        return;
      }
      var n = String((niche && niche.value) || "general goods").trim();
      var r = String((region && region.value) || "core region").trim();
      var c = String((channel && channel.value) || "mixed").trim();
      var o = String((owner && owner.value) || "Owner").trim();
      out.textContent = "Generating plan…";
      if (typeof window.vibecartAiGenerate === "function") {
        withTimeout(
          window.vibecartAiGenerate("seller_growth_plan", {
            niche: n,
            region: r,
            channel: c,
            ownerName: o
          }),
          14000
        )
          .then(function (res) {
            if (!out) return;
            if (res && Array.isArray(res.steps) && res.steps.length) {
              out.replaceChildren();
              var wrap = document.createElement("div");
              var title = document.createElement("strong");
              title.textContent = res.title || "VibeAI growth plan";
              wrap.appendChild(title);
              res.steps.forEach(function (step) {
                var p = document.createElement("p");
                p.textContent = String(step || "");
                wrap.appendChild(p);
              });
              if (res.caution) {
                var note = document.createElement("p");
                note.className = "note";
                note.textContent = String(res.caution);
                wrap.appendChild(note);
              }
              var tag = document.createElement("p");
              tag.className = "note";
              tag.textContent = "Generative AI — verify facts before outreach.";
              wrap.appendChild(tag);
              out.appendChild(wrap);
              return;
            }
            renderSellerGrowthFallback();
          })
          .catch(function () {
            renderSellerGrowthFallback();
          });
        return;
      }
      renderSellerGrowthFallback();
    });
  }

  var sgDec = document.getElementById("sgDec");
  var sgInc = document.getElementById("sgInc");
  if (sgDec) {
    sgDec.addEventListener("click", function () {
      setSellerOnboardedCount(getSellerOnboardedCount() - 1);
    });
  }
  if (sgInc) {
    sgInc.addEventListener("click", function () {
      setSellerOnboardedCount(getSellerOnboardedCount() + 1);
    });
  }

  renderSellerGrowthProgress();
  initSellerGrowthIntel();
})();
