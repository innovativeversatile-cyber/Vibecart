(function () {
  "use strict";

  var TOKEN_KEY = "vibecart-public-auth-token";
  var USER_KEY = "vibecart-public-auth-user";
  var SHOW_REMOVED_KEY = "vcListingsShowRemoved";
  var lastRawListings = [];

  function readShowRemovedPref() {
    try {
      return sessionStorage.getItem(SHOW_REMOVED_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function writeShowRemovedPref(on) {
    try {
      if (on) sessionStorage.setItem(SHOW_REMOVED_KEY, "1");
      else sessionStorage.removeItem(SHOW_REMOVED_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function filterListingsForDisplay(items) {
    if (readShowRemovedPref()) {
      return items;
    }
    return (items || []).filter(function (it) {
      return String((it && it.status) || "").toLowerCase() !== "draft";
    });
  }

  function readAuth() {
    var token = String(localStorage.getItem(TOKEN_KEY) || "").trim();
    var user = {};
    try {
      user = JSON.parse(localStorage.getItem(USER_KEY) || "{}") || {};
    } catch (_) {
      user = {};
    }
    return { token: token, user: user };
  }

  function api(path, options) {
    var auth = readAuth();
    var base = Object.assign({}, (options && options.headers) || {});
    var headers =
      auth.token && window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(auth.token, base)
        : Object.assign({}, base, { Authorization: "Bearer " + auth.token });
    return fetch(path, Object.assign({}, options || {}, { credentials: "same-origin", headers: headers })).then(
      function (r) {
        return r
          .json()
          .catch(function () {
            return {};
          })
          .then(function (json) {
            if (!r.ok || json.ok === false) {
              var code = String((json && json.code) || "");
              var msg = String((json && (json.message || json.code)) || "HTTP_" + r.status);
              if (code === "LISTING_FORBIDDEN") {
                msg =
                  String((json && json.message) || "").trim() ||
                  "That listing is not linked to your shop. Refresh if you switched accounts, or sign in with the account that owns this shop.";
              } else if (code === "PRODUCT_HAS_ORDER_HISTORY") {
                msg =
                  String((json && json.message) || "").trim() ||
                  "This listing has order history and cannot be permanently deleted. Use Remove from marketplace to archive it.";
              } else if (code === "ROLE_FORBIDDEN") {
                msg =
                  "ROLE_FORBIDDEN — open Account hub → Active lane → choose Seller (or stay Buyer if you publish from a shop), then refresh.";
              }
              throw new Error(msg);
            }
            return json;
          });
      }
    );
  }

  function setStatus(text) {
    var node = document.getElementById("vcListingsStatus");
    if (node) node.textContent = String(text || "");
  }

  function fmtMoney(v, cur) {
    var n = Number(v || 0);
    return n.toFixed(2) + " " + String(cur || "EUR").toUpperCase();
  }

  function escapeHtml(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function absoluteListingImgUrl(u) {
    var s = String(u || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (s.indexOf("//") === 0) {
      try {
        return String(window.location && window.location.protocol ? window.location.protocol : "https:") + s;
      } catch (_) {
        return "https:" + s.slice(2);
      }
    }
    if (s.charAt(0) === "/") {
      try {
        var origin = String(window.location && window.location.origin ? window.location.origin : "").replace(/\/$/, "");
        if (origin) return origin + s;
      } catch (_) {
        /* ignore */
      }
    }
    return s;
  }

  function uploadListingPhoto(file, token) {
    var headers = { "Content-Type": (file && file.type) || "application/octet-stream" };
    headers =
      window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function"
        ? window.VibeCartSessionDevice.merge(token, headers)
        : Object.assign({}, headers, { Authorization: "Bearer " + token });
    return fetch("/api/public/seller/products/media/upload", {
      method: "POST",
      credentials: "same-origin",
      headers: headers,
      body: file
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || j.ok === false) {
          throw new Error(String((j && (j.message || j.code)) || "HTTP_" + r.status));
        }
        return j;
      });
    });
  }

  function cardForListing(item) {
    var imgs = Array.isArray(item.imageUrls) ? item.imageUrls : [];
    var primary = String(item.imageUrl || imgs[0] || "").trim();
    var st = String(item.status || "").toLowerCase();
    var statusBadge =
      st === "draft"
        ? "Removed from shop"
        : st === "suspended"
          ? "Paused"
          : st === "sold_out"
            ? "Sold out"
            : Number(item.stock || 0) < 1
              ? "Out of stock"
              : "Active";
    var wrapper = document.createElement("article");
    wrapper.className = "vc-listing-card";
    wrapper.dataset.productId = String(item.id);
    var desc = String(item.description || "");
    wrapper.innerHTML =
      '<div class="vc-listing-head">' +
      '<div><h3 style="margin:0;">' +
      escapeHtml(item.title || "Untitled listing") +
      '</h3><p class="note" style="margin:.2rem 0 0;">' +
      escapeHtml(item.categoryName || "General") +
      " · " +
      escapeHtml(statusBadge) +
      "</p></div>" +
      '<div class="note">Price: <strong>' +
      escapeHtml(fmtMoney(item.basePrice, item.currency)) +
      "</strong></div>" +
      "</div>" +
      (primary
        ? '<div class="vc-listing-photo"><img src="' +
          escapeHtml(absoluteListingImgUrl(primary)) +
          '" alt="" loading="lazy" decoding="async" style="max-width:220px;width:100%;height:auto;border-radius:10px;margin:.35rem 0" referrerpolicy="no-referrer" /></div>'
        : '<p class="note" style="margin:.25rem 0">No product photo yet — buyers see a placeholder until you add one.</p>') +
      '<p class="note" style="margin:.25rem 0 0">Photos (JPEG/PNG/WebP, up to 8)</p>' +
      '<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-product-photos style="max-width:100%" />' +
      '<p class="hero-actions" style="margin:.25rem 0 0"><button type="button" class="btn btn-secondary" data-action="uploadPhotos">Upload / replace photos</button></p>' +
      '<div class="vc-stats">' +
      '<span class="vc-stat-chip">Views: ' +
      Number((item.stats && item.stats.views) || 0) +
      "</span>" +
      '<span class="vc-stat-chip">Clicks: ' +
      Number((item.stats && item.stats.clicks) || 0) +
      "</span>" +
      '<span class="vc-stat-chip">Sold qty: ' +
      Number((item.stats && item.stats.soldQty) || 0) +
      "</span>" +
      '<span class="vc-stat-chip">Orders: ' +
      Number((item.stats && item.stats.orders) || 0) +
      "</span>" +
      '<span class="vc-stat-chip">Stock: ' +
      Number(item.stock || 0) +
      "</span>" +
      "</div>" +
      '<details class="vc-listing-edit"><summary class="note" style="cursor:pointer;font-weight:600">Edit text &amp; description</summary>' +
      '<label class="note" for="vcEdTitle-' +
      item.id +
      '">Title</label>' +
      '<input id="vcEdTitle-' +
      item.id +
      '" type="text" maxlength="180" style="width:100%;padding:.4rem;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:inherit" />' +
      '<label class="note" for="vcEdDesc-' +
      item.id +
      '">Description</label>' +
      '<textarea id="vcEdDesc-' +
      item.id +
      '" rows="4" maxlength="12000" style="width:100%;font:inherit"></textarea>' +
      '<p class="hero-actions" style="margin:0"><button type="button" class="btn btn-primary" data-action="saveText">Save text</button></p>' +
      "</details>" +
      '<div class="vc-actions">' +
      '<a class="btn btn-secondary" href="./live-market-shops.html?cat=All&view=global&deal=best">Live market</a>' +
      '<a class="btn btn-secondary" href="./seller-payments.html">How payouts work</a>' +
      '<input class="vc-inline-input" type="number" min="0" step="0.01" placeholder="Price" data-update-price />' +
      '<button type="button" class="btn btn-secondary" data-action="price">Update price</button>' +
      '<input class="vc-inline-input" type="number" min="0" step="1" placeholder="Stock" data-update-stock />' +
      '<button type="button" class="btn btn-secondary" data-action="stock">Update stock</button>' +
      '<button type="button" class="btn btn-secondary" data-action="pause">Pause</button>' +
      '<button type="button" class="btn btn-primary" data-action="relist">Relist</button>' +
      '<button type="button" class="btn btn-secondary" data-action="remove" style="border-color:rgba(255,120,120,.45)">Remove from marketplace</button>' +
      '<button type="button" class="btn btn-secondary" data-action="purge" style="border-color:rgba(255,80,80,.55)">Delete permanently</button>' +
      "</div>";
    var tIn = wrapper.querySelector("#vcEdTitle-" + item.id);
    var dIn = wrapper.querySelector("#vcEdDesc-" + item.id);
    if (tIn) tIn.value = String(item.title || "");
    if (dIn) dIn.value = desc;
    return wrapper;
  }

  function renderListings(items) {
    var root = document.getElementById("vcListingsGrid");
    if (!root) return;
    lastRawListings = Array.isArray(items) ? items.slice() : [];
    var visible = filterListingsForDisplay(lastRawListings);
    root.innerHTML = "";
    if (!visible.length) {
      if (lastRawListings.length && !readShowRemovedPref()) {
        root.innerHTML =
          '<article class="vc-listing-card"><p class="note">No active listings in view. Removed items are hidden — turn on <strong>Show removed listings</strong> below to relist or review them.</p></article>';
      } else {
        root.innerHTML =
          '<article class="vc-listing-card"><p class="note">No listings yet. Publish from the <a href="./sell-journey.html">selling checklist</a>.</p></article>';
      }
      return;
    }
    visible.forEach(function (item) {
      root.appendChild(cardForListing(item));
    });
  }

  function renderNotifications(items) {
    var root = document.getElementById("vcSellerNotifications");
    if (!root) return;
    root.innerHTML = "";
    if (!Array.isArray(items) || !items.length) {
      root.innerHTML = '<p class="note">No sale alerts yet.</p>';
      return;
    }
    items.slice(0, 20).forEach(function (n) {
      var node = document.createElement("article");
      node.className = "vc-notice-item";
      node.innerHTML =
        "<strong>" +
        escapeHtml(n.message || "Item sold") +
        "</strong><div class='note'>Order #" +
        Number(n.orderId || 0) +
        " · " +
        new Date(n.createdAt).toLocaleString() +
        "</div>";
      root.appendChild(node);
    });
  }

  function renderOrdersProgress(items) {
    var root = document.getElementById("vcOrdersProgress");
    if (!root) return;
    root.innerHTML = "";
    var active = (items || []).filter(function (o) {
      var s = String(o.status || "").toLowerCase();
      return s !== "completed" && s !== "cancelled" && s !== "refunded";
    });
    if (!active.length) {
      root.innerHTML = '<p class="note">No active orders yet.</p>';
      return;
    }
    active.slice(0, 20).forEach(function (o) {
      var prog = o.progress || {};
      var conf =
        (prog.buyerConfirmedAt ? "Buyer confirmed" : "Buyer pending") +
        " · " +
        (prog.sellerConfirmedAt ? "Seller confirmed" : "Seller pending");
      var node = document.createElement("article");
      node.className = "vc-notice-item";
      node.innerHTML =
        "<strong>Order #" +
        Number(o.orderId || 0) +
        " · " +
        escapeHtml(o.title || "Item") +
        " · " +
        escapeHtml(o.status || "pending") +
        "</strong><div class='note'>" +
        escapeHtml(conf) +
        "</div><p class='hero-actions'><button type='button' class='btn btn-secondary' data-confirm-order='" +
        Number(o.orderId || 0) +
        "'>Confirm seller side</button></p>";
      root.appendChild(node);
    });
  }

  function loadAll() {
    var auth = readAuth();
    if (!auth.token) {
      setStatus("Sign in with Lane passport to load your shop listings.");
      renderListings([]);
      renderNotifications([]);
      renderOrdersProgress([]);
      return Promise.resolve();
    }
    setStatus("Loading…");
    return Promise.all([
      api("/api/public/seller/listings"),
      api("/api/public/seller/notifications"),
      api("/api/public/orders/mine")
    ])
      .then(function (results) {
        renderListings(results[0].listings || []);
        renderNotifications(results[1].notifications || []);
        renderOrdersProgress(results[2].orders || []);
        setStatus("Updated · payouts follow each order when both sides confirm (see Seller payments).");
      })
      .catch(function (err) {
        setStatus("Could not load: " + String((err && err.message) || err));
      });
  }

  function onAction(ev) {
    var confirmBtn = ev.target && ev.target.closest && ev.target.closest("[data-confirm-order]");
    if (confirmBtn) {
      var orderId = Number(confirmBtn.getAttribute("data-confirm-order") || 0);
      if (orderId > 0) {
        setStatus("Confirming seller side…");
        api("/api/public/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderId })
        })
          .then(function (res) {
            setStatus(
              res.released
                ? "Both sides confirmed. Escrow path released where configured."
                : "Seller confirmation saved. Waiting for buyer side."
            );
            return loadAll();
          })
          .catch(function (err) {
            setStatus("Confirm failed: " + err.message);
          });
      }
      return;
    }
    var btn = ev.target && ev.target.closest && ev.target.closest("button[data-action]");
    if (!btn) return;
    var card = btn.closest("[data-product-id]");
    if (!card) return;
    var productId = Number(card.dataset.productId || 0);
    var action = String(btn.dataset.action || "");
    if (action === "remove") {
      if (!window.confirm("Remove this listing from the marketplace? It will be archived and hidden from live search.")) {
        return;
      }
      setStatus("Removing…");
      api("/api/public/seller/listings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId, remove: true })
      })
        .then(function () {
          setStatus(
            "Listing removed from the live marketplace (archived). It disappears from this list unless you enable “Show removed listings” to relist."
          );
          return loadAll();
        })
        .catch(function (err) {
          setStatus("Remove failed: " + err.message);
        });
      return;
    }
    if (action === "purge") {
      var ordN = 0;
      try {
        var chips = card.querySelectorAll(".vc-stat-chip");
        for (var ci = 0; ci < chips.length; ci++) {
          var tx = String((chips[ci] && chips[ci].textContent) || "");
          if (/^Orders:\s*/i.test(tx)) {
            ordN = Number(tx.replace(/^Orders:\s*/i, "").trim() || 0);
            break;
          }
        }
      } catch (_) {
        ordN = 0;
      }
      var warnOrders =
        ordN > 0
          ? " This listing shows " +
            ordN +
            " marketplace order(s) — permanent delete will be rejected until those records are gone from our side (use Remove from marketplace instead).\n\n"
          : "";
      if (
        !window.confirm(
          warnOrders +
            "Permanently DELETE this listing from the database? Photos and stats go with it. This cannot be undone. (Not allowed if the item ever appeared on an order.)"
        )
      ) {
        return;
      }
      setStatus("Deleting permanently…");
      api("/api/public/seller/listings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId, hardDelete: true })
      })
        .then(function () {
          setStatus("Listing permanently deleted.");
          return loadAll();
        })
        .catch(function (err) {
          setStatus("Permanent delete failed: " + err.message);
        });
      return;
    }
    if (action === "uploadPhotos") {
      var photoInput = card.querySelector("[data-product-photos]");
      var auth = readAuth();
      if (!auth.token) {
        setStatus("Sign in to upload photos.");
        return;
      }
      if (!photoInput || !photoInput.files || !photoInput.files.length) {
        setStatus("Choose one or more images first.");
        return;
      }
      setStatus("Uploading photos…");
      var tasks = [];
      var maxN = Math.min(photoInput.files.length, 8);
      for (var pi = 0; pi < maxN; pi++) {
        tasks.push(uploadListingPhoto(photoInput.files[pi], auth.token));
      }
      Promise.all(tasks)
        .then(function (results) {
          var urls = (results || []).map(function (r) {
            return String((r && r.url) || "").trim();
          }).filter(Boolean);
          if (!urls.length) {
            throw new Error("No upload URLs returned.");
          }
          return api("/api/public/seller/listings/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: productId, imageUrls: urls })
          });
        })
        .then(function () {
          setStatus("Photos saved — they appear on the live marketplace.");
          if (photoInput) photoInput.value = "";
          return loadAll();
        })
        .catch(function (err) {
          setStatus("Photo upload failed: " + String((err && err.message) || err));
        });
      return;
    }
    if (action === "saveText") {
      var titleEl = card.querySelector("[id^='vcEdTitle-']");
      var descEl = card.querySelector("[id^='vcEdDesc-']");
      var title = String((titleEl && titleEl.value) || "").trim();
      var description = String((descEl && descEl.value) || "").trim();
      if (title.length < 4) {
        setStatus("Title must be at least 4 characters.");
        return;
      }
      setStatus("Saving text…");
      api("/api/public/seller/listings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId, title: title, description: description })
      })
        .then(function () {
          setStatus("Text saved.");
          return loadAll();
        })
        .catch(function (err) {
          setStatus("Save failed: " + err.message);
        });
      return;
    }
    var body = { productId: productId };
    if (action === "pause") body.status = "paused";
    if (action === "relist") body.status = "active";
    if (action === "price") {
      var p = card.querySelector("[data-update-price]");
      body.basePrice = Number((p && p.value) || 0);
    }
    if (action === "stock") {
      var s = card.querySelector("[data-update-stock]");
      body.stock = Number((s && s.value) || 0);
      if (body.stock > 0) body.status = "active";
    }
    setStatus("Saving…");
    api("/api/public/seller/listings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(function () {
        setStatus("Saved.");
        return loadAll();
      })
      .catch(function (err) {
        setStatus("Update failed: " + err.message);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("vcListingsGrid");
    if (grid && !document.getElementById("vcListingsFilterBar")) {
      var bar = document.createElement("p");
      bar.className = "hero-actions";
      bar.id = "vcListingsFilterBar";
      bar.style.marginTop = "0.35rem";
      bar.innerHTML =
        '<label class="note" style="display:inline-flex;align-items:center;gap:.45rem;cursor:pointer;user-select:none">' +
        '<input type="checkbox" id="vcShowRemovedListings" /> Show removed listings (paused / archived — use Relist)</label>';
      if (grid.parentNode) {
        grid.parentNode.insertBefore(bar, grid);
      }
      var cb = document.getElementById("vcShowRemovedListings");
      if (cb) {
        cb.checked = readShowRemovedPref();
        cb.addEventListener("change", function () {
          writeShowRemovedPref(Boolean(cb.checked));
          renderListings(lastRawListings);
        });
      }
    }
    var refreshBtn = document.getElementById("vcListingsRefreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadAll);
    document.body.addEventListener("click", onAction);
    loadAll();
    setInterval(loadAll, 45000);
  });
})();
