"use strict";

(function () {
  function readProductId() {
    try {
      var p = new URLSearchParams(window.location.search || "");
      var n = Number(String(p.get("productId") || "").trim());
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch {
      return 0;
    }
  }

  function absoluteMediaUrl(u) {
    var raw = String(u || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.indexOf("//") === 0) {
      try {
        return String(window.location && window.location.protocol ? window.location.protocol : "https:") + raw;
      } catch {
        return "https:" + raw.slice(2);
      }
    }
    if (raw.charAt(0) === "/") {
      try {
        var origin = String(window.location && window.location.origin ? window.location.origin : "").replace(/\/$/, "");
        if (origin) return origin + raw;
      } catch {
        /* ignore */
      }
    }
    return raw;
  }

  function getBearer() {
    try {
      return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch {
      return "";
    }
  }

  function buyerCountryDefault() {
    try {
      var raw = localStorage.getItem("vibecart-public-auth-user");
      var u = raw ? JSON.parse(raw) : null;
      var cc = String((u && u.countryCode) || "").trim().toUpperCase();
      if (cc.length === 2) return cc;
    } catch {
      /* ignore */
    }
    return "IE";
  }

  var pid = readProductId();
  var root = document.getElementById("mbRoot");
  var statusEl = document.getElementById("mbStatus");
  if (!root) return;

  if (!pid) {
    root.innerHTML = "<p class=\"note\">Missing productId in the URL.</p>";
    return;
  }

  async function boot() {
    root.innerHTML = "<p class=\"note\">Loading listing…</p>";
    try {
      var res = await fetch("/api/public/products/by-id?productId=" + encodeURIComponent(String(pid)), {
        headers: { Accept: "application/json" }
      });
      var body = await res.json();
      if (!res.ok || !body.ok || !body.product) {
        root.innerHTML =
          "<p class=\"note\">This listing is not available (sold out or unpublished).</p>" +
          '<p class="hero-actions"><a class="btn btn-secondary" href="./live-market-shops.html">Live marketplace</a></p>';
        return;
      }
      var pr = body.product;
      var imgUrl =
        absoluteMediaUrl(pr.imageUrl) ||
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=720&h=450&q=78";
      var price =
        String(pr.basePrice != null ? pr.basePrice : "") + " " + String(pr.currency || "EUR");
      root.innerHTML =
        '<article class="vc-marketplace-buy-card">' +
        '<img class="vc-marketplace-buy-card__img" src="' +
        imgUrl.replace(/"/g, "") +
        '" alt="" width="720" height="450" loading="eager" decoding="async" />' +
        "<h2>" +
        String(pr.title || "Listing").replace(/</g, "&lt;") +
        "</h2>" +
        '<p class="note">' +
        "Shop: " +
        String(pr.shopName || "Seller").replace(/</g, "&lt;") +
        " · " +
        price.replace(/</g, "&lt;") +
        "</p>" +
        '<p class="note">Origin: ' +
        String(pr.originCountry || "—").replace(/</g, "&lt;") +
        "</p>" +
        '<div class="admin-grid" style="max-width:22rem;margin-top:0.75rem">' +
        '<label for="mbQty">Quantity</label>' +
        '<input id="mbQty" type="number" min="1" max="10" value="1" />' +
        '<label for="mbCountry">Ship-to country (ISO)</label>' +
        '<input id="mbCountry" type="text" maxlength="2" value="' +
        buyerCountryDefault().replace(/"/g, "") +
        '" />' +
        "</div>" +
        '<p class="hero-actions" style="margin-top:1rem">' +
        '<button type="button" class="btn btn-primary" id="mbBuyBtn">Place order</button>' +
        '<a class="btn btn-secondary" href="./hot-picks.html?productId=' +
        encodeURIComponent(String(pid)) +
        '">Listing page</a>' +
        "</p>" +
        "</article>";

      document.getElementById("mbBuyBtn").addEventListener("click", async function () {
        var tok = getBearer();
        if (!tok) {
          if (statusEl) {
            statusEl.textContent =
              "Sign in with a buyer account (Account hub), then return here — or open Hot picks after signing in.";
          }
          return;
        }
        var qty = Math.max(1, Math.min(10, Number(document.getElementById("mbQty").value || 1)));
        var cc = String(document.getElementById("mbCountry").value || "")
          .trim()
          .toUpperCase()
          .slice(0, 2);
        if (cc.length !== 2) {
          if (statusEl) statusEl.textContent = "Enter a two-letter ship-to country code (e.g. IE, ZA, NG).";
          return;
        }
        if (statusEl) statusEl.textContent = "Creating order…";
        try {
          var res2 = await fetch("/api/public/orders/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: "Bearer " + tok
            },
            body: JSON.stringify({
              productId: Number(pr.id),
              quantity: qty,
              buyerCountry: cc,
              shippingMethod: "standard"
            })
          });
          var b2 = await res2.json();
          if (!res2.ok || !b2.ok || !b2.order) {
            if (statusEl) {
              statusEl.textContent =
                "Could not create order: " + String((b2 && b2.code) || res2.status || "error") + ". Use a buyer account.";
            }
            return;
          }
          var oid = Number(b2.order.orderId || 0);
          if (statusEl) {
            statusEl.innerHTML =
              "Order #" +
              oid +
              " created (pending). " +
              '<a href="./orders-tracking.html">Open orders tracking</a> · ' +
              "<strong>Complete payment</strong> when your checkout email arrives or from tracking.";
          }
        } catch {
          if (statusEl) statusEl.textContent = "Network error creating order.";
        }
      });
    } catch {
      root.innerHTML = "<p class=\"note\">Could not load this listing.</p>";
    }
  }

  boot();
})();
