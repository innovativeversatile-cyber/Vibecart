(function () {
  function readNumber(key, fallback) {
    try {
      var n = Number(localStorage.getItem(key) || "");
      if (!Number.isFinite(n)) {
        return fallback;
      }
      return n;
    } catch {
      return fallback;
    }
  }

  function readReward() {
    try {
      var raw = localStorage.getItem("vibecart-reward-profile") || "{}";
      var j = JSON.parse(raw);
      return {
        points: Number(j.points) || 0,
        streakWeeks: Number(j.streakWeeks) || 0
      };
    } catch {
      return { points: 0, streakWeeks: 0 };
    }
  }

  function paint() {
    var root = document.getElementById("vcPassportBooklet");
    if (!root) {
      return;
    }
    var stamps = Math.max(0, Math.floor(readNumber("vibecart-vibe-passport", 0)));
    var reward = readReward();
    var sellers = Math.max(0, Math.floor(readNumber("vibecart-seller-onboarded-count", 0)));
    var bought = Math.max(0, Math.floor(reward.points / 28));
    var waiting = Math.max(0, Math.min(12, Math.floor(stamps / 4) + Math.floor(sellers / 2)));
    var insight = Math.min(
      99,
      Math.floor(stamps * 1.4 + reward.points / 35 + reward.streakWeeks * 3 + sellers * 2)
    );

    var elS = root.querySelector("[data-vc-pass-stamps]");
    var elB = root.querySelector("[data-vc-pass-bought]");
    var elW = root.querySelector("[data-vc-pass-waiting]");
    var elI = root.querySelector("[data-vc-pass-insight]");
    if (elS) {
      elS.textContent = String(stamps);
    }
    if (elB) {
      elB.textContent = String(bought);
    }
    if (elW) {
      elW.textContent = String(waiting);
    }
    if (elI) {
      elI.textContent = String(insight);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paint, { once: true });
  } else {
    paint();
  }
})();
