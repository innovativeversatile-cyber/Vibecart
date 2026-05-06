(function () {
  "use strict";

  function token() {
    return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
  }
  function status(text) {
    var el = document.getElementById("sellerOrdersStatus");
    if (el) el.textContent = String(text || "");
  }
  function esc(v) {
    return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function api(path, options) {
    var t = token();
    var base = Object.assign({}, (options && options.headers) || {});
    var headers =
      t && window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(t, base)
        : Object.assign({}, base, { Authorization: "Bearer " + t });
    return fetch(path, Object.assign({}, options || {}, { headers: headers })).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (json) {
        if (!r.ok || json.ok === false) throw new Error(String((json && (json.code || json.message)) || ("HTTP_" + r.status)));
        return json;
      });
    });
  }

  function render(list) {
    var root = document.getElementById("sellerOrdersList");
    if (!root) return;
    root.innerHTML = "";
    if (!Array.isArray(list) || !list.length) {
      root.innerHTML = '<article class="vc-seller-order-card"><p class="note">No seller orders yet.</p></article>';
      return;
    }
    list.forEach(function (o) {
      var p = o.progress || {};
      var card = document.createElement("article");
      card.className = "vc-seller-order-card";
      card.innerHTML =
        "<h3>Order #" + Number(o.orderId || 0) + " · " + esc(o.title || "Item") + "</h3>" +
        "<p class='note'>Status: " + esc(o.status || "pending") + " · Total: " + Number(o.totalAmount || 0).toFixed(2) + " " + esc(o.currency || "EUR") + "</p>" +
        "<p class='note'>Buyer confirm: " + (p.buyerConfirmedAt ? "yes" : "pending") + " · Seller confirm: " + (p.sellerConfirmedAt ? "yes" : "pending") + "</p>" +
        "<p class='note'>Payout: " + esc(p.payoutStatus || "pending") + " · Seller gets: " + (p.sellerPayoutAmount == null ? "-" : Number(p.sellerPayoutAmount).toFixed(2)) + " · Fee: " + (p.serviceFeeAmount == null ? "-" : Number(p.serviceFeeAmount).toFixed(2)) + "</p>" +
        "<p class='note'>AI mediator: " + esc(p.assistantSummary || "Monitoring this order.") + "</p>" +
        "<p class='hero-actions'>" +
        '<button type="button" class="btn btn-secondary" data-confirm="' + Number(o.orderId || 0) + '"' + (p.sellerConfirmedAt ? " disabled" : "") + ">" + (p.sellerConfirmedAt ? "Seller confirmed" : "Confirm seller side") + "</button>" +
        '<button type="button" class="btn btn-secondary" data-dispute="' + Number(o.orderId || 0) + '">Open dispute</button>' +
        "</p>";
      root.appendChild(card);
    });
  }

  function load() {
    if (!token()) {
      status("Sign in as seller first.");
      render([]);
      return Promise.resolve();
    }
    status("Loading orders...");
    return api("/api/public/orders/mine").then(function (res) {
      render(res.orders || []);
      status("Updated");
    }).catch(function (err) {
      status("Load failed: " + err.message);
    });
  }

  function onClick(e) {
    var confirmBtn = e.target && e.target.closest && e.target.closest("[data-confirm]");
    if (confirmBtn) {
      var oid = Number(confirmBtn.getAttribute("data-confirm") || 0);
      if (!oid) return;
      status("Saving confirmation...");
      api("/api/public/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid })
      }).then(function (res) {
        status(res.released ? "Both sides confirmed. Escrow released automatically." : "Seller confirmation saved.");
        return load();
      }).catch(function (err) {
        status("Confirm failed: " + err.message);
      });
      return;
    }
    var disputeBtn = e.target && e.target.closest && e.target.closest("[data-dispute]");
    if (disputeBtn) {
      var orderId = Number(disputeBtn.getAttribute("data-dispute") || 0);
      if (!orderId) return;
      var reason = window.prompt("Brief reason for dispute:", "Issue with delivery/quality");
      if (!reason) return;
      status("Opening dispute...");
      api("/api/public/orders/dispute/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId, reason: reason })
      }).then(function () {
        status("Dispute opened and mediator updated.");
        return load();
      }).catch(function (err) {
        status("Dispute failed: " + err.message);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var refresh = document.getElementById("sellerOrdersRefreshBtn");
    if (refresh) refresh.addEventListener("click", load);
    document.body.addEventListener("click", onClick);
    load();
    setInterval(load, 30000);
  });
})();
