(function () {
  function initTopClassCheckout() {
    var emailEl = document.getElementById("topClassEmail");
    var nameEl = document.getElementById("topClassName");
    var methodEl = document.getElementById("topClassMethod");
    var startBtn = document.getElementById("topClassStartPay");
    var activateBtn = document.getElementById("topClassActivateNow");
    var statusEl = document.getElementById("topClassCheckoutStatus");
    if (!startBtn || !activateBtn || !statusEl) return;

    var params = new URLSearchParams(window.location.search || "");
    var paid = String(params.get("paid") || "").trim() === "1";
    var sessionId = String(params.get("session_id") || "").trim();
    var cancelled = String(params.get("cancelled") || "").trim() === "1";

    if (cancelled) {
      statusEl.textContent = "Checkout was cancelled. You can retry securely.";
    }

    if (paid) {
      startBtn.hidden = true;
      activateBtn.hidden = false;
      statusEl.textContent = "Payment confirmed. Complete step 2 to activate Top-Class now.";
      activateBtn.addEventListener("click", function () {
        var payload = {
          active: true,
          autoRenew: true,
          activatedAt: new Date().toISOString(),
          stripeSessionId: sessionId || ""
        };
        try {
          localStorage.setItem("vibecart-top-class-membership-v1", JSON.stringify(payload));
          localStorage.setItem("vibecart-top-class-paid-v1", "1");
        } catch {
          /* ignore */
        }
        window.location.assign("./index.html?top_class=active#topClassExperience");
      });
      return;
    }

    activateBtn.hidden = true;
    startBtn.hidden = false;
    statusEl.textContent = "Step 1: continue to secure checkout to pay and unlock Top-Class.";
    startBtn.addEventListener("click", async function () {
      var method = String((methodEl && methodEl.value) || "card").trim() || "card";
      var email = String((emailEl && emailEl.value) || "").trim();
      var name = String((nameEl && nameEl.value) || "").trim();
      if (!email || email.indexOf("@") < 1) {
        statusEl.textContent = "Enter a valid email before checkout.";
        return;
      }
      startBtn.disabled = true;
      statusEl.textContent = "Opening secure checkout...";
      try {
        var response = await fetch("/api/public/payments/checkout/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flow: "top_class",
            plan: "prestige",
            paymentMethod: method,
            customerEmail: email,
            customerName: name
          })
        });
        var payload = await response.json().catch(function () { return {}; });
        if (!response.ok || !payload.ok || !payload.redirectUrl) {
          statusEl.textContent = "Checkout is temporarily unavailable. Please retry in a moment.";
          startBtn.disabled = false;
          return;
        }
        window.location.assign(String(payload.redirectUrl));
      } catch {
        statusEl.textContent = "Could not open checkout right now. Please retry.";
        startBtn.disabled = false;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTopClassCheckout, { once: true });
  } else {
    initTopClassCheckout();
  }
})();
