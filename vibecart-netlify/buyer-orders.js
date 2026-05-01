(function () {
  "use strict";

  function getToken() {
    return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
  }

  function setStatus(text) {
    var node = document.getElementById("buyerOrdersStatus");
    if (node) node.textContent = String(text || "");
  }

  function api(path, options) {
    var token = getToken();
    var base = Object.assign({}, (options && options.headers) || {});
    var headers =
      token && window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(token, base)
        : Object.assign({}, base, { Authorization: "Bearer " + token });
    return fetch(path, Object.assign({}, options || {}, { headers: headers })).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (json) {
        if (!r.ok || json.ok === false) throw new Error(String((json && (json.code || json.message)) || ("HTTP_" + r.status)));
        return json;
      });
    });
  }

  function esc(v) {
    return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderOrders(orders) {
    var root = document.getElementById("buyerOrdersList");
    if (!root) return;
    root.innerHTML = "";
    if (!Array.isArray(orders) || !orders.length) {
      root.innerHTML = '<article class="vc-order-card"><p class="note">No orders found yet.</p></article>';
      return;
    }
    orders.forEach(function (o) {
      var card = document.createElement("article");
      card.className = "vc-order-card";
      card.dataset.orderId = String(o.orderId || 0);
      var p = o.progress || {};
      var buyerDone = !!p.buyerConfirmedAt;
      var sellerDone = !!p.sellerConfirmedAt;
      card.innerHTML =
        "<h3>Order #" + Number(o.orderId || 0) + " · " + esc(o.title || "Item") + "</h3>" +
        "<p class='note'>Status: " + esc(o.status || "pending") + " · Qty: " + Number(o.quantity || 1) + " · Total: " + Number(o.totalAmount || 0).toFixed(2) + " " + esc(o.currency || "EUR") + "</p>" +
        "<p class='note'>Buyer: " + (buyerDone ? "confirmed" : "pending") + " · Seller: " + (sellerDone ? "confirmed" : "pending") + "</p>" +
        "<div class='vc-order-assist note'>AI mediator: " + (buyerDone && sellerDone ? "both confirmed, release process done/processing." : "waiting for both sides to confirm for automatic release.") + "</div>" +
        "<p class='hero-actions'>" +
        '<button class="btn btn-primary" data-confirm-order="' + Number(o.orderId || 0) + '"' + (buyerDone ? " disabled" : "") + ">" + (buyerDone ? "Buyer confirmed" : "Confirm received") + "</button>" +
        "</p>";
      root.appendChild(card);
    });
  }

  function loadOrders() {
    if (!getToken()) {
      setStatus("Please sign in first.");
      renderOrders([]);
      return Promise.resolve();
    }
    setStatus("Loading orders...");
    return api("/api/public/orders/mine").then(function (res) {
      var orders = (res.orders || []).filter(function (o) { return Number(o.quantity || 0) > 0; });
      renderOrders(orders);
      setStatus("Updated");
    }).catch(function (err) {
      setStatus("Could not load orders: " + err.message);
    });
  }

  function onClick(e) {
    var btn = e.target && e.target.closest && e.target.closest("[data-confirm-order]");
    if (!btn) return;
    var orderId = Number(btn.getAttribute("data-confirm-order") || 0);
    if (!orderId) return;
    setStatus("Saving confirmation...");
    api("/api/public/orders/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: orderId })
    }).then(function (res) {
      setStatus(res.released ? "Both sides confirmed. Escrow released automatically." : "Buyer confirmation saved. Waiting for seller confirmation.");
      return loadOrders();
    }).catch(function (err) {
      setStatus("Confirm failed: " + err.message);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var refreshBtn = document.getElementById("buyerOrdersRefreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadOrders);
    document.body.addEventListener("click", onClick);
    loadOrders();
    setInterval(loadOrders, 30000);
  });
})();
