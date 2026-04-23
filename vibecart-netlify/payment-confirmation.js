(function () {
  function initPaymentConfirmation() {
    var orderLine = document.getElementById("paymentOrderLine");
    var summary = document.getElementById("paymentSummary");
    var gatewayBtn = document.getElementById("paymentGatewayBtn");
    var methodSelect = document.getElementById("paymentMethodSelect");
    var doneStatus = document.getElementById("paymentDoneStatus");
    var payload = null;
    var params = new URLSearchParams(window.location.search || "");
    try {
      payload = JSON.parse(sessionStorage.getItem("vibecart-final-payment") || "null");
    } catch (err) {
      payload = null;
    }
    var fallbackFlow = String(params.get("flow") || "coach").toLowerCase();
    var fallbackPlan = String(params.get("plan") || (fallbackFlow === "insurance" ? "student-lite" : "starter")).trim();
    if (!payload || typeof payload !== "object") {
      payload = {
        flow: fallbackFlow,
        plan: fallbackPlan,
        name: "",
        email: ""
      };
      if (summary) {
        summary.textContent = "Payment draft restored from package route.";
      }
    }
    if (orderLine) {
      orderLine.textContent = "Order code: " + String(payload.orderCode || "VC-PENDING");
    }
    if (summary) {
      summary.textContent =
        "Service: " +
        String(payload.flow || "") +
        " | Plan: " +
        String(payload.plan || "") +
        " | Name: " +
        String(payload.name || "") +
        " | Email: " +
        String(payload.email || "") +
        " | Method: " +
        String(payload.methodLabel || payload.method || "");
    }
    if (methodSelect && payload.method) {
      methodSelect.value = String(payload.method);
    }
    if (gatewayBtn) {
      gatewayBtn.addEventListener("click", function () {
        if (gatewayBtn.dataset.loading === "1") {
          return;
        }
        var method = String((methodSelect && methodSelect.value) || (payload && payload.method) || "card").trim();
        if (!method) {
          method = "card";
        }
        gatewayBtn.dataset.loading = "1";
        gatewayBtn.disabled = true;
        gatewayBtn.textContent = "Opening secure payment...";
        if (doneStatus) {
          doneStatus.textContent = "Starting secure payment...";
        }
        var target =
          "/api/public/payments/checkout/redirect?flow=" +
          encodeURIComponent((payload && payload.flow) || params.get("flow") || "service") +
          "&plan=" +
          encodeURIComponent((payload && payload.plan) || params.get("plan") || "standard") +
          "&paymentMethod=" +
          encodeURIComponent(method);
        window.location.href = target;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPaymentConfirmation, { once: true });
  } else {
    initPaymentConfirmation();
  }
})();
