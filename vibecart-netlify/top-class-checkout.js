(function () {
  function recordTelemetry(eventName, payload) {
    try {
      var raw = JSON.parse(localStorage.getItem("vibecart-hardpass-telemetry-v1") || "[]");
      if (!Array.isArray(raw)) raw = [];
      raw.push({ ts: Date.now(), event: String(eventName || ""), payload: payload || null });
      if (raw.length > 200) raw = raw.slice(-200);
      localStorage.setItem("vibecart-hardpass-telemetry-v1", JSON.stringify(raw));
    } catch (e) { /* ignore */ }
  }

  function fetchWithTimeout(url, opts, timeoutMs) {
    opts = opts || {};
    timeoutMs = timeoutMs || 12000;
    return new Promise(function (resolve, reject) {
      var didFinish = false;
      var timer = window.setTimeout(function () {
        if (didFinish) return;
        didFinish = true;
        reject(new Error("timeout"));
      }, timeoutMs);
      fetch(url, opts).then(function (response) {
        if (didFinish) return;
        didFinish = true;
        window.clearTimeout(timer);
        resolve(response);
      }).catch(function (error) {
        if (didFinish) return;
        didFinish = true;
        window.clearTimeout(timer);
        reject(error);
      });
    });
  }

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
      recordTelemetry("checkout_return", { result: "paid" });
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
        recordTelemetry("activation_success", { surface: "top_class" });
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
      recordTelemetry("checkout_start", { surface: "top_class_page", method: method });
      try {
        var response = await fetchWithTimeout("/api/public/payments/checkout/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flow: "top_class",
            plan: "prestige",
            paymentMethod: method,
            customerEmail: email,
            customerName: name
          })
        }, 12000);
        var payload = await response.json().catch(function () { return {}; });
        if (!response.ok || !payload.ok || !payload.redirectUrl) {
          statusEl.textContent = "Checkout is temporarily unavailable. Please retry in a moment, or change payment method.";
          startBtn.disabled = false;
          recordTelemetry("checkout_start_failed", { status: response.status, reason: payload && payload.error });
          return;
        }
        var redirectUrl = String(payload.redirectUrl);
        window.location.assign(redirectUrl);
        window.setTimeout(function () {
          startBtn.disabled = false;
          statusEl.innerHTML = 'If checkout did not open, continue here: <a href="' + redirectUrl + '">open secure checkout</a>.';
        }, 4200);
      } catch (error) {
        var reason = error && error.message === "timeout" ? "timeout" : "network";
        statusEl.textContent = reason === "timeout"
          ? "Checkout is taking too long to start. Please retry."
          : "Could not open checkout right now. Please retry.";
        startBtn.disabled = false;
        recordTelemetry("checkout_start_failed", { reason: reason });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTopClassCheckout, { once: true });
  } else {
    initTopClassCheckout();
  }
})();
