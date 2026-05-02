(function () {
  "use strict";

  var TOKEN_KEY = "vibecart-public-auth-token";

  function getToken() {
    return String(localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function setStatus(text) {
    var node = document.getElementById("bizStatus");
    if (node) node.textContent = String(text || "");
  }

  function api(path, options) {
    var base = Object.assign({}, (options && options.headers) || {});
    var token = getToken();
    var headers =
      token && window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(token, base)
        : Object.assign({}, base, token ? { Authorization: "Bearer " + token } : {});
    return fetch(path, Object.assign({}, options || {}, { headers: headers })).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (json) {
        if (!r.ok || json.ok === false) throw new Error(String((json && (json.message || json.code)) || ("HTTP_" + r.status)));
        return json;
      });
    });
  }

  function escapeHtml(v) {
    return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderKpis(listings, services, bookings) {
    var node = document.getElementById("bizKpis");
    if (!node) return;
    var activeListings = (listings || []).filter(function (x) { return String(x.status || "") === "active"; }).length;
    var activeBakery = (services || []).filter(function (x) { return !!x.isActive; }).length;
    var pendingBookings = (bookings || []).filter(function (x) { return String(x.bookingStatus || "") === "pending"; }).length;
    node.innerHTML =
      '<article class="vc-biz-card"><span class="vc-pill">Listings</span><h3>' + Number((listings || []).length) + '</h3><p class="note">Active: ' + activeListings + "</p></article>" +
      '<article class="vc-biz-card"><span class="vc-pill">Service work cards</span><h3>' + Number((services || []).length) + '</h3><p class="note">Active cards: ' + activeBakery + "</p></article>" +
      '<article class="vc-biz-card"><span class="vc-pill">Booking requests</span><h3>' + Number((bookings || []).length) + '</h3><p class="note">Pending: ' + pendingBookings + "</p></article>";
  }

  function readBakeryForm() {
    var catEl = document.getElementById("bakeryServiceCategory");
    var line = catEl ? String(catEl.value || "").trim() : "Bakery / custom cakes";
    var theme = String(document.getElementById("bakeryStyleTheme").value || "").trim();
    var styleTheme = theme ? line + " · " + theme : line;
    return {
      businessName: document.getElementById("bakeryBusinessName").value,
      workTitle: document.getElementById("bakeryWorkTitle").value,
      styleTheme: styleTheme,
      basePrice: Number(document.getElementById("bakeryBasePrice").value || 0),
      currency: document.getElementById("bakeryCurrency").value || "USD",
      imageUrl: document.getElementById("bakeryImageUrl").value,
      requirementsText: document.getElementById("bakeryRequirements").value
    };
  }

  function renderServices(services) {
    var root = document.getElementById("bakeryWorkList");
    if (!root) return;
    if (!Array.isArray(services) || !services.length) {
      root.innerHTML = '<p class="note">No bakery work cards yet. Add one above.</p>';
      return;
    }
    root.innerHTML = services.map(function (s) {
      return '<article class="vc-work-item" data-service-id="' + Number(s.id) + '">' +
        "<h3>" + escapeHtml(s.workTitle) + "</h3>" +
        '<p class="note">' + escapeHtml(s.businessName) + " · " + escapeHtml(s.styleTheme || "No style yet") + "</p>" +
        '<p class="note">Price: ' + Number(s.basePrice || 0).toFixed(2) + " " + escapeHtml(s.currency || "USD") + "</p>" +
        '<p class="note">Requirements: ' + escapeHtml(s.requirementsText || "None") + "</p>" +
        (s.imageUrl
          ? '<div class="vc-work-thumb"><img src="' +
            escapeHtml(s.imageUrl) +
            '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></div>'
          : "") +
        '<p class="hero-actions">' +
        '<button class="btn btn-secondary" data-toggle="' + (s.isActive ? "0" : "1") + '">' + (s.isActive ? "Pause listing" : "Relist") + "</button>" +
        "</p>" +
      "</article>";
    }).join("");
  }

  function renderBookings(bookings) {
    var root = document.getElementById("bakeryBookingList");
    if (!root) return;
    if (!Array.isArray(bookings) || !bookings.length) {
      root.innerHTML = '<p class="note">No bakery booking requests yet.</p>';
      return;
    }
    root.innerHTML = bookings.map(function (b) {
      var phoneDigits = String(b.customerPhone || "").replace(/[^\d+]/g, "");
      var waUrl = phoneDigits ? ("https://wa.me/" + encodeURIComponent(phoneDigits.replace(/^\+/, "")) + "?text=" + encodeURIComponent("Hi " + (b.customerName || "") + ", about your VibeCart bakery booking #" + Number(b.id || 0))) : "";
      return '<article class="vc-booking-item" data-booking-id="' + Number(b.id) + '">' +
        "<h3>" + escapeHtml(b.customerName) + " · " + escapeHtml(b.workTitle) + "</h3>" +
        '<p class="note">Date: ' + escapeHtml(String(b.eventDate || "")) + " · Occasion: " + escapeHtml(b.occasionType || "General") + "</p>" +
        '<p class="note">Style/theme: ' + escapeHtml(b.styleTheme || "Not specified") + "</p>" +
        '<p class="note">Request: ' + escapeHtml(b.requestDetails || "") + "</p>" +
        '<p class="note">Budget: ' + (b.budgetAmount == null ? "Not set" : Number(b.budgetAmount).toFixed(2)) + "</p>" +
        '<p class="hero-actions">' +
        (waUrl ? ('<a class="btn btn-secondary" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(waUrl) + '">WhatsApp customer</a>') : "") +
        '<button class="btn btn-secondary" data-booking-status="confirmed">Confirm</button>' +
        '<button class="btn btn-secondary" data-booking-status="declined">Decline</button>' +
        '<button class="btn btn-primary" data-booking-status="completed">Complete</button>' +
        "</p>" +
      "</article>";
    }).join("");
  }

  function renderCalendar(bookings) {
    var root = document.getElementById("bakeryCalendarView");
    if (!root) return;
    root.innerHTML = "";
    if (!Array.isArray(bookings) || !bookings.length) {
      root.innerHTML = '<p class="note">No bookings on calendar yet.</p>';
      return;
    }
    var byDate = {};
    bookings.forEach(function (b) {
      var key = String(b.eventDate || "No date");
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(b);
    });
    Object.keys(byDate).sort().forEach(function (date) {
      var card = document.createElement("article");
      card.className = "vc-booking-item";
      card.innerHTML = "<h3>" + escapeHtml(date) + "</h3>" + byDate[date].map(function (b) {
        return "<p class='note'>" + escapeHtml(b.customerName || "Customer") + " · " + escapeHtml(b.workTitle || "Service") + " · " + escapeHtml(b.bookingStatus || "pending") + "</p>";
      }).join("");
      root.appendChild(card);
    });
  }

  function renderMediatorOrders(orders) {
    var root = document.getElementById("orderMediatorList");
    if (!root) return;
    root.innerHTML = "";
    if (!Array.isArray(orders) || !orders.length) {
      root.innerHTML = '<p class="note">No orders yet.</p>';
      return;
    }
    orders.slice(0, 30).forEach(function (o) {
      var p = o.progress || {};
      var node = document.createElement("article");
      node.className = "vc-booking-item";
      node.innerHTML =
        "<h3>Order #" + Number(o.orderId || 0) + " · " + escapeHtml(o.title || "Item") + "</h3>" +
        "<p class='note'>Status: " + escapeHtml(o.status || "pending") + " · Buyer: " + (p.buyerConfirmedAt ? "confirmed" : "pending") + " · Seller: " + (p.sellerConfirmedAt ? "confirmed" : "pending") + "</p>" +
        "<p class='hero-actions'><button type='button' class='btn btn-primary' data-order-confirm='" + Number(o.orderId || 0) + "'>Confirm my side</button></p>";
      root.appendChild(node);
    });
  }

  function loadDiscover(q) {
    return api("/api/public/bakery/services/discover?q=" + encodeURIComponent(String(q || ""))).then(function (res) {
      var pick = document.getElementById("bookingService");
      if (!pick) return [];
      var list = Array.isArray(res.services) ? res.services : [];
      pick.innerHTML = list.map(function (s) {
        var label = s.businessName + " · " + s.workTitle + " · " + Number(s.basePrice || 0).toFixed(2) + " " + (s.currency || "USD");
        return '<option value="' + Number(s.id) + '">' + escapeHtml(label) + "</option>";
      }).join("");
      return list;
    });
  }

  function loadAll() {
    setStatus("Loading My Business…");
    return Promise.all([
      api("/api/public/seller/listings").catch(function () { return { listings: [] }; }),
      api("/api/public/bakery/services/mine").catch(function () { return { services: [] }; }),
      api("/api/public/bakery/bookings/mine").catch(function () { return { bookings: [] }; }),
      api("/api/public/orders/mine").catch(function () { return { orders: [] }; }),
      loadDiscover("")
    ]).then(function (results) {
      renderKpis(results[0].listings || [], results[1].services || [], results[2].bookings || []);
      renderServices(results[1].services || []);
      renderBookings(results[2].bookings || []);
      renderCalendar(results[2].bookings || []);
      renderMediatorOrders(results[3].orders || []);
      setStatus("Dashboard updated");
    }).catch(function (err) {
      setStatus("Could not load dashboard: " + err.message);
    });
  }

  function saveBakeryService() {
    var body = readBakeryForm();
    return api("/api/public/bakery/services/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function () {
      setStatus("Bakery work card saved");
      return loadAll();
    }).catch(function (err) {
      setStatus("Save failed: " + err.message);
    });
  }

  function submitBooking() {
    var serviceId = Number(document.getElementById("bookingService").value || 0);
    var body = {
      serviceId: serviceId,
      customerName: document.getElementById("bookingCustomerName").value,
      customerPhone: document.getElementById("bookingPhone").value,
      eventDate: document.getElementById("bookingDate").value,
      occasionType: document.getElementById("bookingOccasion").value,
      styleTheme: document.getElementById("bookingStyleTheme").value,
      budgetAmount: Number(document.getElementById("bookingBudget").value || 0),
      requestDetails: document.getElementById("bookingDetails").value
    };
    return api("/api/public/bakery/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function () {
      setStatus("Booking request sent to baker");
      return loadAll();
    }).catch(function (err) {
      setStatus("Booking failed: " + err.message);
    });
  }

  function savePayoutAccount() {
    var stripeAccountId = String((document.getElementById("sellerStripeAccountId") || {}).value || "").trim();
    return api("/api/public/seller/payout-account/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeAccountId: stripeAccountId })
    }).then(function () {
      setStatus("Payout account saved. Auto-release will transfer after dual confirmation.");
    }).catch(function (err) {
      setStatus("Payout setup failed: " + err.message);
    });
  }

  function onClick(e) {
    var toggle = e.target.closest && e.target.closest("[data-toggle]");
    if (toggle) {
      var serviceCard = toggle.closest("[data-service-id]");
      var serviceId = Number(serviceCard && serviceCard.dataset.serviceId || 0);
      var active = String(toggle.getAttribute("data-toggle") || "") === "1";
      api("/api/public/bakery/services/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: serviceId, isActive: active })
      }).then(loadAll);
      return;
    }
    var statusBtn = e.target.closest && e.target.closest("[data-booking-status]");
    if (statusBtn) {
      var bookingCard = statusBtn.closest("[data-booking-id]");
      var bookingId = Number(bookingCard && bookingCard.dataset.bookingId || 0);
      var status = String(statusBtn.getAttribute("data-booking-status") || "");
      api("/api/public/bakery/bookings/status/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingId, status: status })
      }).then(loadAll);
      return;
    }
    var orderConfirmBtn = e.target.closest && e.target.closest("[data-order-confirm]");
    if (orderConfirmBtn) {
      var orderId = Number(orderConfirmBtn.getAttribute("data-order-confirm") || 0);
      if (!orderId) return;
      api("/api/public/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId })
      }).then(function (res) {
        setStatus(res.released ? "Both sides confirmed. Escrow released automatically." : "Your confirmation saved. Waiting for the other side.");
        return loadAll();
      }).catch(function (err) {
        setStatus("Order confirmation failed: " + err.message);
      });
    }
  }

  function scrollToBeautyHash() {
    var raw = String(location.hash || "").replace(/\/$/, "");
    if (raw !== "#beauty-services") {
      return;
    }
    var el = document.getElementById("beauty-services");
    if (!el) {
      return;
    }
    requestAnimationFrame(function () {
      el.scrollIntoView({ behavior: "auto", block: "start" });
      try {
        el.focus({ preventScroll: true });
      } catch (_) {
        /* ignore */
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    scrollToBeautyHash();
    window.addEventListener("pageshow", scrollToBeautyHash);
    var btnRefresh = document.getElementById("bizRefreshBtn");
    var btnSaveBakery = document.getElementById("bakerySaveBtn");
    var btnDiscover = document.getElementById("discoverBtn");
    var btnBooking = document.getElementById("bookingSubmitBtn");
    var btnPayout = document.getElementById("savePayoutAccountBtn");
    if (btnRefresh) btnRefresh.addEventListener("click", loadAll);
    if (btnSaveBakery) btnSaveBakery.addEventListener("click", saveBakeryService);
    if (btnDiscover) btnDiscover.addEventListener("click", function () {
      var q = document.getElementById("discoverQuery").value;
      loadDiscover(q).then(function () { setStatus("Bakery styles updated"); });
    });
    if (btnBooking) btnBooking.addEventListener("click", submitBooking);
    if (btnPayout) btnPayout.addEventListener("click", savePayoutAccount);
    document.body.addEventListener("click", onClick);
    var beautySlotsBtn = document.getElementById("beautyShowBookingSlots");
    var beautySvc = document.getElementById("beautyBookingServiceType");
    var beautyDate = document.getElementById("beautyBookingDate");
    var beautyOut = document.getElementById("beautyBookingSlotsResult");
    var beautyPrepay = document.getElementById("beautyBookingPrepayRouteBtn");
    if (beautySlotsBtn && beautySvc && beautyDate && beautyOut) {
      beautySlotsBtn.addEventListener("click", function () {
        var date = beautyDate.value || "selected date";
        var service = beautySvc.value || "Service";
        var sampleSlots = ["09:00", "11:00", "13:30", "16:00"];
        var href =
          "./checkout-details.html?flow=service_booking&service=" +
          encodeURIComponent(service) +
          "&date=" +
          encodeURIComponent(date);
        beautyOut.innerHTML =
          service +
          " slots on " +
          date +
          ": " +
          sampleSlots.join(", ") +
          '. Payment is required before the date is locked.<br/><a class="btn btn-primary" href="' +
          href +
          '">Pay deposit and reserve date</a>';
        if (beautyPrepay) {
          beautyPrepay.setAttribute("href", href);
        }
      });
    }
    loadAll();
  });
})();
