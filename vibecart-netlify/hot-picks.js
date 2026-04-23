(function () {
  var AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
  var grid = document.getElementById("hotPicksGrid");
  var status = document.getElementById("hotPicksStatus");
  if (!grid) {
    return;
  }

  function escapeHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function laneFromQuery() {
    try {
      var p = new URLSearchParams(window.location.search || "");
      var lane = String(p.get("lane") || "").trim();
      return lane;
    } catch {
      return "";
    }
  }

  function productCategory(p) {
    return String(p.category || p.productCategory || p.kind || "All").trim();
  }

  function pickImage(p) {
    var direct = p.imageUrl || p.image_url || p.thumbnailUrl || p.thumbnail_url;
    if (direct) {
      return direct;
    }
    var seed = String(p.id || p.productId || p.name || p.title || p.category || "vibecart-hot").replace(/[^a-z0-9]+/gi, "-");
    return "https://picsum.photos/seed/" + encodeURIComponent(seed) + "/900/600";
  }

  function safeTarget(url) {
    var raw = String(url || "").trim();
    if (!raw) return "";
    var lower = raw.toLowerCase();
    if (lower.indexOf("javascript:") === 0 || lower.indexOf("data:") === 0 || lower.indexOf("vbscript:") === 0) {
      return "";
    }
    var value = raw;
    // Accept partner feeds that send bare domains like "example.com/path".
    if (!/^https?:\/\//i.test(value) && /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(value)) {
      value = "https://" + value;
    }
    try {
      var parsed = new URL(value);
      if (!/^https?:$/i.test(parsed.protocol)) return "";
      return parsed.toString();
    } catch {
      return "";
    }
  }

  function pickTargetUrl(p) {
    var direct = safeTarget(
      p.shopUrl ||
        p.shop_url ||
        p.productUrl ||
        p.product_url ||
        p.targetUrl ||
        p.target_url ||
        p.url ||
        p.link
    );
    if (direct) {
      return direct;
    }
    var cat = productCategory(p).toLowerCase();
    var fallbackByCategory = {
      electronics: "https://www.amazon.com/s?i=electronics&tag=vibecart20-20",
      fashion: "https://www.asos.com",
      books: "https://www.abebooks.com",
      gaming: "https://store.steampowered.com",
      all: "https://brainrot.mov?ref=ApLX4MJQoF"
    };
    return safeTarget(fallbackByCategory[cat] || fallbackByCategory.all);
  }
  function isCommissionTrackedUrl(url) {
    try {
      var parsed = new URL(String(url || ""));
      if (!/^https?:$/i.test(parsed.protocol)) return false;
      var keys = ["tag", "ref", "aff", "affiliate", "affid", "subid", "clickid", "irclickid", "pub_id", "publisher_id"];
      for (var i = 0; i < keys.length; i += 1) {
        if (parsed.searchParams.get(keys[i])) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function offerHref(p) {
    var item = String(p.name || p.title || "Marketplace item");
    var cat = productCategory(p) || "All";
    var id = String(p.id || p.productId || "").trim();
    var target = pickTargetUrl(p);
    if (target) {
      return (
        "/api/public/shop/redirect?shop=" +
        encodeURIComponent(item) +
        "&cat=" +
        encodeURIComponent(cat) +
        "&partner=" +
        encodeURIComponent(item) +
        "&target=" +
        encodeURIComponent(target)
      );
    }
    return "";
  }

  function render(items) {
    grid.innerHTML = "";
    items.forEach(function (p) {
      var title = String(p.name || p.title || "Marketplace item");
      var cat = productCategory(p);
      var price = p.price != null ? String(p.price) : "";
      var currency = String(p.currency || "EUR");
      var target = pickTargetUrl(p);
      var commissionEnabled = isCommissionTrackedUrl(target);
      var href = offerHref(p);
      var ctaLabel = target ? "Open source website" : "Source unavailable";
      var html =
        '<article class="card">' +
        '<img src="' +
        escapeHtml(pickImage(p)) +
        '" alt="' +
        escapeHtml(title) +
        '" loading="lazy" />' +
        "<h3>" +
        escapeHtml(title) +
        "</h3>" +
        '<p class="note">Category: ' +
        escapeHtml(cat) +
        (price ? " · " + escapeHtml(currency + " " + price) : "") +
        "</p>" +
        '<p class="note">External checkout on assigned source site. · ' +
        (commissionEnabled ? "Commission-enabled." : "Traffic-only.") +
        "</p>" +
        '<p class="hero-actions"><a class="btn btn-primary vc-hot-offer-link' +
        (href ? "" : " is-disabled") +
        '" href="' +
        escapeHtml(href || "#") +
        '" data-aff-shop="' +
        escapeHtml(title) +
        '" data-aff-target="' +
        escapeHtml(target) +
        '" data-aff-commission="' +
        (commissionEnabled ? "1" : "0") +
        '">' +
        escapeHtml(ctaLabel) +
        "</a></p>" +
        "</article>";
      grid.insertAdjacentHTML("beforeend", html);
    });
    Array.prototype.slice.call(grid.querySelectorAll(".vc-hot-offer-link")).forEach(function (a) {
      if (a.dataset.boundAffClick === "1") return;
      a.dataset.boundAffClick = "1";
      a.addEventListener("click", function (event) {
        if (!a.getAttribute("data-aff-target")) {
          event.preventDefault();
          if (status) {
            status.textContent = "Source URL is not available for this offer yet. Try another live pick.";
          }
          return;
        }
        try {
          localStorage.setItem(
            AFFILIATE_LAST_CLICK_KEY,
            JSON.stringify({
              at: new Date().toISOString(),
              source: "hot-picks",
              shop: String(a.getAttribute("data-aff-shop") || ""),
              target: String(a.getAttribute("data-aff-target") || ""),
              commissionEligible: String(a.getAttribute("data-aff-commission") || "0") === "1"
            })
          );
        } catch {
          /* ignore */
        }
      });
    });
  }

  function normalizePayload(body) {
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.products)) return body.products;
    if (Array.isArray(body.items)) return body.items;
    if (Array.isArray(body.rows)) return body.rows;
    return [];
  }

  async function boot() {
    var lane = laneFromQuery().toLowerCase();
    try {
      var response = await fetch("/api/public/products/live");
      var body = await response.json();
      var all = normalizePayload(body);
      var filtered = all;
      if (lane) {
        filtered = all.filter(function (p) {
          return productCategory(p).toLowerCase() === lane;
        });
      }
      var top = filtered.slice(0, 12);
      if (!top.length) {
        if (status) {
          status.textContent = "No live picks available right now for this lane.";
        }
        return;
      }
      if (status) {
        status.textContent = lane
          ? "Showing live " + lane + " picks."
          : "Showing live hot picks right now.";
      }
      render(top);
    } catch {
      if (status) {
        status.textContent = "Could not load live picks right now. Please try again shortly.";
      }
    }
  }

  boot();
})();
