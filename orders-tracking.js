(function () {
  "use strict";

  var listEl = document.getElementById("ordersTrackingList");
  var statusEl = document.getElementById("ordersTrackingStatus");
  var detailEl = document.getElementById("ordersTrackingDetail");
  var trackInput = document.getElementById("ordersTrackingIdInput");
  var trackBtn = document.getElementById("ordersTrackingLoadBtn");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = String(msg || "");
  }

  function readToken() {
    try {
      return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch {
      return "";
    }
  }

  function mergeAuthHeaders(token, headers) {
    var h = headers || {};
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
      return window.VibeCartSessionDevice.merge(token, h);
    }
    h.Authorization = "Bearer " + token;
    return h;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderDetail(data) {
    if (!detailEl) return;
    if (!data || !data.ok || !data.order) {
      detailEl.innerHTML = "<p class=\"note\">No details.</p>";
      return;
    }
    var o = data.order;
    var ship = data.shipment || null;
    var updates = Array.isArray(data.updates) ? data.updates : [];
    var lines =
      "<p><strong>Order #" +
      esc(o.orderId) +
      "</strong> · " +
      esc(o.status) +
      " · " +
      esc(o.totalAmount) +
      " " +
      esc(o.currency) +
      "</p>";
    if (ship && ship.trackingNumber) {
      lines +=
        "<p class=\"note\">Courier: " +
        esc(ship.courier) +
        " · tracking # <strong>" +
        esc(ship.trackingNumber) +
        "</strong> · " +
        esc(ship.status) +
        "</p>";
    } else {
      lines += "<p class=\"note\">No carrier tracking number on file yet for this order.</p>";
    }
    if (updates.length) {
      lines += "<ul class=\"note\" style=\"margin:0.5rem 0 0 1.1rem\">";
      updates.slice(0, 12).forEach(function (u) {
        lines +=
          "<li>" +
          esc(u.createdAt) +
          " — " +
          esc(u.statusCode) +
          ": " +
          esc(u.statusMessage) +
          "</li>";
      });
      lines += "</ul>";
    }
    detailEl.innerHTML = lines;
  }

  async function loadOrderTrack(orderId) {
    var token = readToken();
    if (!token) {
      setStatus("Sign in via Lane passport to load order tracking.");
      return;
    }
    setStatus("Loading order #" + orderId + "…");
    try {
      var res = await fetch("/api/public/orders/track?orderId=" + encodeURIComponent(String(orderId)), {
        credentials: "include",
        headers: mergeAuthHeaders(token, { Accept: "application/json" })
      });
      var body = await res.json().catch(function () {
        return {};
      });
      if (!res.ok || !body.ok) {
        setStatus(String((body && body.code) || "Could not load this order."));
        if (detailEl) detailEl.innerHTML = "";
        return;
      }
      setStatus("Order #" + orderId + " loaded.");
      renderDetail(body);
    } catch {
      setStatus("Network error loading order.");
    }
  }

  async function loadMine() {
    var token = readToken();
    if (!listEl) return;
    if (!token) {
      listEl.innerHTML =
        "<p class=\"note\">Sign in on <a href=\"./lane-passport.html\">Lane passport</a> to see your VibeCart orders here.</p>";
      setStatus("");
      return;
    }
    setStatus("Loading your orders…");
    try {
      var res = await fetch("/api/public/orders/mine", {
        credentials: "include",
        headers: mergeAuthHeaders(token, { Accept: "application/json" })
      });
      var body = await res.json().catch(function () {
        return {};
      });
      if (!res.ok || !body.ok || !Array.isArray(body.orders)) {
        setStatus(String((body && body.code) || "Could not load orders."));
        return;
      }
      var rows = body.orders;
      if (!rows.length) {
        listEl.innerHTML = "<p class=\"note\">No orders yet. When you buy or sell on VibeCart, they appear here.</p>";
        setStatus("");
        return;
      }
      listEl.innerHTML = rows
        .map(function (r) {
          return (
            "<li><button type=\"button\" class=\"btn btn-secondary vc-ot-open\" data-order-id=\"" +
            esc(r.orderId) +
            "\">#" +
            esc(r.orderId) +
            "</button> · " +
            esc(r.status) +
            " · " +
            esc(r.totalAmount) +
            " " +
            esc(r.currency) +
            " · " +
            esc(r.title || "Item") +
            "</li>"
          );
        })
        .join("");
      Array.prototype.slice.call(listEl.querySelectorAll(".vc-ot-open")).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = Number(btn.getAttribute("data-order-id") || 0);
          if (trackInput) trackInput.value = String(id);
          loadOrderTrack(id);
        });
      });
      setStatus("Showing " + rows.length + " recent order(s). Tap an order # for tracking detail.");
    } catch {
      setStatus("Network error.");
    }
  }

  if (trackBtn) {
    trackBtn.addEventListener("click", function () {
      var id = Number((trackInput && trackInput.value) || 0);
      if (!id) {
        setStatus("Enter a numeric order id.");
        return;
      }
      loadOrderTrack(id);
    });
  }

  loadMine();
})();
