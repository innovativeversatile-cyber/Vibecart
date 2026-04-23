(function () {
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
    return (
      p.imageUrl ||
      p.image_url ||
      p.thumbnailUrl ||
      p.thumbnail_url ||
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&h=600&q=75"
    );
  }

  function checkoutHref(p) {
    var item = String(p.name || p.title || "Marketplace item");
    var cat = productCategory(p) || "All";
    var id = String(p.id || p.productId || "").trim();
    var href =
      "./checkout-details.html?flow=buy&plan=market&item=" +
      encodeURIComponent(item) +
      "&cat=" +
      encodeURIComponent(cat);
    if (id) {
      href += "&productId=" + encodeURIComponent(id);
    }
    return href;
  }

  function render(items) {
    grid.innerHTML = "";
    items.forEach(function (p) {
      var title = String(p.name || p.title || "Marketplace item");
      var cat = productCategory(p);
      var price = p.price != null ? String(p.price) : "";
      var currency = String(p.currency || "EUR");
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
        '<p class="hero-actions"><a class="btn btn-primary" href="' +
        escapeHtml(checkoutHref(p)) +
        '">View offer</a></p>' +
        "</article>";
      grid.insertAdjacentHTML("beforeend", html);
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
