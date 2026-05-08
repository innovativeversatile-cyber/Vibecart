(function () {
  var AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
  var BRIDGE_REF_SESSION_KEY = "vibecart-bridge-ref-v1";

  function captureBridgeRefFromUrl() {
    try {
      var sp = new URLSearchParams(window.location.search || "");
      var r = String(sp.get("ref") || "").trim().slice(0, 80);
      if (r) sessionStorage.setItem(BRIDGE_REF_SESSION_KEY, r);
    } catch {
      /* ignore */
    }
  }

  function bridgeRefForLinks() {
    try {
      var sp = new URLSearchParams(window.location.search || "");
      var r = String(sp.get("ref") || "").trim().slice(0, 80);
      if (r) return r;
    } catch {
      /* ignore */
    }
    try {
      return String(sessionStorage.getItem(BRIDGE_REF_SESSION_KEY) || "").trim().slice(0, 80);
    } catch {
      return "";
    }
  }

  captureBridgeRefFromUrl();
  var TREND_REFRESH_MS = 12 * 60 * 1000;
  var CAROUSEL_STEP_MS = 5200;
  var FALLBACK_SLIDES = [
    {
      title: "Streetwear heat",
      caption: "Oversized sets, varsity layers, and neutral sneakers — still moving fast this season.",
      tags: ["streetwear", "hoodie", "sneakers"],
      ctaLabel: "ASOS trending",
      ctaUrl: "https://www.asos.com"
    },
    {
      title: "Luxury resale momentum",
      caption: "Verified pre-owned designer bags and accessories with sharper price discovery.",
      tags: ["handbag", "luxury", "fashion"],
      ctaLabel: "Vestiaire Collective",
      ctaUrl: "https://www.vestiairecollective.com"
    },
    {
      title: "Sport fashion crossover",
      caption: "Performance sneakers and athleisure sets blending gym tech with everyday fits.",
      tags: ["sneakers", "sportswear", "athleisure"],
      ctaLabel: "Nike new",
      ctaUrl: "https://www.nike.com"
    },
    {
      title: "Beauty meets outfit",
      caption: "Fragrance and skincare pairings shoppers bundle with statement outerwear.",
      tags: ["beauty", "makeup", "fashion"],
      ctaLabel: "Sephora new",
      ctaUrl: "https://www.sephora.com"
    },
    {
      title: "Denim + tailoring mix",
      caption: "Wide-leg denim with sharp blazers — a high-signal office-to-street formula.",
      tags: ["denim", "blazer", "streetwear"],
      ctaLabel: "Zalando inspo",
      ctaUrl: "https://www.zalando.co.uk"
    },
    {
      title: "Minimal luxe layers",
      caption: "Quiet luxury palettes: cashmere, tonal knits, and sculptural jewelry accents.",
      tags: ["knitwear", "jewelry", "fashion"],
      ctaLabel: "MR PORTER",
      ctaUrl: "https://www.mrporter.com"
    }
  ];

  var grid = document.getElementById("hotPicksGrid");
  var status = document.getElementById("hotPicksStatus");
  if (!grid) {
    return;
  }

  var trendTrack = document.getElementById("hotPicksAiTrendTrack");
  var trendStatus = document.getElementById("hotPicksAiTrendStatus");
  var trendStamp = document.getElementById("hotPicksAiTrendStamp");
  var carouselTimer = null;
  var carouselIndex = 0;
  var carouselUserHoldUntil = 0;
  var trendTrackVisible = true;
  var BLOCKED_HOSTS = {
    "mediamarkt.de": true,
    "currys.co.uk": true,
    "eu.shein.com": true,
    "fnac.com": true,
    "currys.ie": true,
    "littlewoodsireland.ie": true,
    "easons.com": true,
    "waterstones.com": true,
    "smythstoys.com": true,
    "gamestop.ie": true,
    "superbalist.com": true,
    "jumia.co.ke": true,
    "nuriakenya.com": true,
    "textbookcentre.com": true,
    "noon.com": true,
    "sharafdg.com": true,
    "namshi.com": true,
    "kinokuniya.com": true,
    "rakuten.co.jp": true,
    "hm.com": true,
    "bestbuy.com": true,
    "vestiairecollective.com": true,
    "mrporter.com": true
  };

  function escapeHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pageLocale() {
    try {
      if (window.VibeCartPageI18n && typeof window.VibeCartPageI18n.getLang === "function") {
        return String(window.VibeCartPageI18n.getLang() || "en").slice(0, 12);
      }
    } catch {
      /* ignore */
    }
    return "en";
  }

  function trendPlaceholderImageUrl(tags, idx) {
    var pool = [
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&h=1200&q=78",
      "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&h=1200&q=78",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&h=1200&q=78",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&h=1200&q=78",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&h=1200&q=78",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&h=1200&q=78"
    ];
    var i = Number(idx || 0);
    i = Number.isFinite(i) ? i : 0;
    return pool[((i % pool.length) + pool.length) % pool.length];
  }

  function formatHotPicksDateTime(value) {
    try {
      var d;
      if (value instanceof Date) {
        d = value;
      } else if (typeof value === "number" && Number.isFinite(value)) {
        d = new Date(value);
      } else {
        var s = String(value == null ? "" : value).trim();
        if (!s) return "—";
        if (/^\d+$/.test(s)) {
          d = new Date(Number(s));
        } else {
          d = new Date(s);
        }
      }
      if (Number.isNaN(d.getTime())) return String(value);
      return new Intl.DateTimeFormat(pageLocale(), {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(d);
    } catch {
      return String(value == null ? "—" : value);
    }
  }

  function formatAiTrendStampLabel(label) {
    var raw = String(label == null ? "" : label).trim();
    if (!raw) return formatHotPicksDateTime(Date.now());
    var parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return formatHotPicksDateTime(parsed);
    return raw;
  }

  function callHotTrendsAi() {
    var hint = String(Date.now());
    var input = {
      locale: pageLocale(),
      monthHint: new Date().toISOString().slice(0, 7),
      refreshHint: hint
    };
    if (typeof window.vibecartAiGenerate === "function") {
      return window.vibecartAiGenerate("hot_picks_trends", input);
    }
    return Promise.reject(new Error("no_ai_client"));
  }

  function renderTrendSlides(slides) {
    if (!trendTrack) {
      return;
    }
    var list = Array.isArray(slides) && slides.length ? slides : FALLBACK_SLIDES;
    trendTrack.innerHTML = list
      .map(function (slide, idx) {
        var title = String(slide.title || "Trend").trim();
        var caption = String(slide.caption || slide.trend || "").trim();
        var tags = Array.isArray(slide.tags) ? slide.tags : [];
        var img = trendPlaceholderImageUrl(tags, idx);
        var cta = safeTarget(slide.ctaUrl || slide.shopUrl || "");
        var ctaLabel = String(slide.ctaLabel || slide.shopLabel || "Shop").trim() || "Shop";
        var ctaHtml = cta
          ? '<a class="btn btn-primary" href="' +
            escapeHtml(cta) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(ctaLabel) +
            "</a>"
          : '<span class="btn btn-secondary is-disabled">Link unavailable</span>';
        return (
          '<article class="vc-hot-ai-slide" role="listitem">' +
          '<img src="' +
          escapeHtml(img) +
          '" alt="' +
          escapeHtml(title) +
          '" loading="lazy" />' +
          '<div class="vc-hot-ai-slide__overlay">' +
          "<h3>" +
          escapeHtml(title) +
          "</h3>" +
          "<p>" +
          escapeHtml(caption) +
          "</p>" +
          '<div class="vc-hot-ai-slide__actions">' +
          ctaHtml +
          "</div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
    restartCarousel();
  }

  function restartCarousel() {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  }

  function holdCarouselFor(ms) {
    var n = Number(ms);
    if (!Number.isFinite(n) || n <= 0) {
      n = 6000;
    }
    carouselUserHoldUntil = Date.now() + n;
  }

  function wireCarouselAntiHijack() {
    if (!trendTrack) {
      return;
    }
    trendTrack.addEventListener("mouseenter", function () {
      holdCarouselFor(8000);
    });
    trendTrack.addEventListener("touchstart", function () {
      holdCarouselFor(9000);
    }, { passive: true });
    trendTrack.addEventListener("pointerdown", function () {
      holdCarouselFor(9000);
    }, { passive: true });
    trendTrack.addEventListener("wheel", function () {
      holdCarouselFor(8000);
    }, { passive: true });
    trendTrack.addEventListener("scroll", function () {
      holdCarouselFor(5000);
    }, { passive: true });
    if (typeof window.IntersectionObserver === "function") {
      var observer = new IntersectionObserver(function (entries) {
        var e = entries && entries[0];
        trendTrackVisible = !!(e && e.isIntersecting && e.intersectionRatio >= 0.45);
      }, { threshold: [0, 0.45, 0.75, 1] });
      observer.observe(trendTrack);
    }
  }

  async function refreshTrendEngine() {
    if (!trendTrack) {
      return;
    }
    if (trendStatus) {
      trendStatus.textContent = "Trend engine: contacting generative AI…";
    }
    try {
      var payload = await callHotTrendsAi();
      var slides = payload && Array.isArray(payload.slides) ? payload.slides : [];
      if (!slides.length) {
        throw new Error("empty_slides");
      }
      renderTrendSlides(slides);
      if (trendStamp) {
        trendStamp.textContent = formatAiTrendStampLabel(payload.generatedLabel || new Date().toISOString());
      }
      if (trendStatus) {
        trendStatus.textContent =
          "Trend engine: live refresh from OpenAI (" +
          String((payload && payload.model) || "model") +
          "). Images rotate from tag-driven photo search; next auto-refresh in ~12 min.";
      }
    } catch (error) {
      renderTrendSlides(FALLBACK_SLIDES);
      if (trendStamp) {
        trendStamp.textContent = formatHotPicksDateTime(Date.now()) + " · fallback deck";
      }
      if (trendStatus) {
        trendStatus.textContent =
          "Trend engine: AI unavailable (" +
          String((error && error.message) || error || "error") +
          "). Showing cached-style fallback slides; will retry on the next timer.";
      }
    }
  }

  function scheduleTrendEngine() {
    wireCarouselAntiHijack();
    refreshTrendEngine().catch(function () {});
    window.setInterval(function () {
      refreshTrendEngine().catch(function () {});
    }, TREND_REFRESH_MS);
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

  function readFocusProductId() {
    try {
      var p = new URLSearchParams(window.location.search || "");
      var raw = String(p.get("productId") || "").trim();
      var n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch {
      return 0;
    }
  }

  function hotPicksListingHref(productId) {
    try {
      var u = new URL("./hot-picks.html", window.location.href);
      u.searchParams.set("productId", String(productId));
      var ref = bridgeRefForLinks();
      if (ref) u.searchParams.set("ref", ref);
      return u.pathname + "?" + u.searchParams.toString();
    } catch {
      return "./hot-picks.html?productId=" + encodeURIComponent(String(productId));
    }
  }

  function inferCountryCode() {
    try {
      var rawUser = localStorage.getItem("vibecart-public-auth-user");
      var user = rawUser ? JSON.parse(rawUser) : null;
      var fromAuth = String((user && user.countryCode) || "").trim().toUpperCase();
      if (fromAuth.length === 2) return fromAuth;
    } catch {
      /* ignore */
    }
    try {
      var lang = String((navigator.language || (Array.isArray(navigator.languages) && navigator.languages[0]) || "")).toUpperCase();
      var m = lang.match(/-([A-Z]{2})$/);
      if (m && m[1]) return m[1];
    } catch {
      /* ignore */
    }
    return "";
  }

  function productCategory(p) {
    return String(p.category || p.categoryName || p.productCategory || p.kind || "All").trim();
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

  function pickImage(p) {
    var direct = p.imageUrl || p.image_url || p.thumbnailUrl || p.thumbnail_url;
    if (direct) {
      return absoluteMediaUrl(direct);
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
    if (!/^https?:\/\//i.test(value) && /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(value)) {
      value = "https://" + value;
    }
    try {
      var parsed = new URL(value);
      if (!/^https?:$/i.test(parsed.protocol)) return "";
      var host = String(parsed.hostname || "").toLowerCase();
      if (!host) return "";
      if (BLOCKED_HOSTS[host]) return "";
      var keys = Object.keys(BLOCKED_HOSTS);
      for (var i = 0; i < keys.length; i += 1) {
        if (host === keys[i] || host.endsWith("." + keys[i])) return "";
      }
      return parsed.toString();
    } catch {
      return "";
    }
  }

  function isExternalTarget(url) {
    var safe = safeTarget(url);
    if (!safe) return false;
    try {
      var parsed = new URL(safe);
      var host = String(parsed.host || "").toLowerCase();
      var here = String(window.location.host || "").toLowerCase();
      return Boolean(host && here && host !== here);
    } catch {
      return false;
    }
  }

  function pickExplicitOutboundUrl(p) {
    return safeTarget(
      p.shopUrl ||
        p.shop_url ||
        p.productUrl ||
        p.product_url ||
        p.targetUrl ||
        p.target_url ||
        p.url ||
        p.link
    );
  }

  function isDbMarketplaceListing(p) {
    var idNum = Number(p.id || p.productId || 0);
    if (!Number.isFinite(idNum) || idNum <= 0) return false;
    return !pickExplicitOutboundUrl(p);
  }

  function pickTargetUrl(p) {
    var direct = pickExplicitOutboundUrl(p);
    if (direct && isExternalTarget(direct)) {
      return direct;
    }
    return "";
  }

  function isLoggedIn() {
    try {
      var token = localStorage.getItem("vibecart-public-auth-token");
      var user = localStorage.getItem("vibecart-public-auth-user");
      return Boolean(String(token || "").trim() && String(user || "").trim());
    } catch {
      return false;
    }
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
    var target = pickTargetUrl(p);
    var pid = Number(p.id || p.productId || 0);
    if (target) {
      var ref = bridgeRefForLinks();
      var base =
        "/api/public/shop/redirect?shop=" +
        encodeURIComponent(item) +
        "&cat=" +
        encodeURIComponent(cat) +
        "&partner=" +
        encodeURIComponent(item) +
        "&target=" +
        encodeURIComponent(target);
      if (pid > 0) {
        base += "&productId=" + encodeURIComponent(String(pid));
      }
      return ref ? base + "&ref=" + encodeURIComponent(ref) : base;
    }
    return "";
  }

  function render(items) {
    grid.innerHTML = "";
    items.forEach(function (p) {
      var title = String(p.name || p.title || "Marketplace item");
      var cat = productCategory(p);
      var priceVal = p.price != null ? p.price : p.basePrice;
      var price = priceVal != null ? String(priceVal) : "";
      var currency = String(p.currency || "EUR");
      var target = pickTargetUrl(p);
      var internal = isDbMarketplaceListing(p);
      var pid = Number(p.id || p.productId || 0);
      var listingHref = internal && pid > 0 ? hotPicksListingHref(pid) : "";
      var commissionEnabled = isCommissionTrackedUrl(target);
      var joinLabel = isLoggedIn() ? "Saved with your account route" : "Sign in to save + track this pick";
      var shopLabel = String(p.shopName || p.shop_name || "").trim();
      var domId = "vc-hot-product-" + String(p.id != null ? p.id : pid).replace(/[^a-zA-Z0-9-_]/g, "-");
      if (domId === "vc-hot-product-") {
        domId = "vc-hot-product-anon";
      }
      var html;
      var outboundTracked = offerHref(p);
      if (internal && pid > 0) {
        var sellerLine = shopLabel ? "Sold by " + escapeHtml(shopLabel) + "." : "VibeCart marketplace listing.";
        html =
          '<article class="card vc-hot-internal" id="' +
          escapeHtml(domId) +
          '">' +
          '<img src="' +
          escapeHtml(pickImage(p)) +
          '" alt="' +
          escapeHtml(title) +
          '" loading="lazy" decoding="async" />' +
          "<h3>" +
          escapeHtml(title) +
          "</h3>" +
          '<p class="note">Category: ' +
          escapeHtml(cat) +
          (price ? " · " + escapeHtml(currency + " " + price) : "") +
          "</p>" +
          '<p class="note">' +
          sellerLine +
          "</p>" +
          '<p class="hero-actions"><a class="btn btn-primary" href="./marketplace-buy.html?productId=' +
          encodeURIComponent(String(pid)) +
          '">Continue to checkout</a>' +
          '<a class="btn btn-secondary" href="' +
          escapeHtml(listingHref) +
          '">Listing link</a>' +
          '<a class="btn btn-secondary" href="./account-hub.html#account-access">' +
          escapeHtml(joinLabel) +
          "</a></p>" +
          "</article>";
        grid.insertAdjacentHTML("beforeend", html);
      } else if (!internal && target) {
        var ctaHref = outboundTracked || target;
        var ctaLabel = outboundTracked ? "Open tracked storefront" : "Open source website";
        html =
          '<article class="card">' +
          '<img src="' +
          escapeHtml(pickImage(p)) +
          '" alt="' +
          escapeHtml(title) +
          '" loading="lazy" decoding="async" />' +
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
          '<p class="hero-actions"><a class="btn btn-primary vc-hot-offer-link" href="' +
          escapeHtml(ctaHref) +
          '" data-aff-shop="' +
          escapeHtml(title) +
          '" data-aff-target="' +
          escapeHtml(target) +
          '" data-aff-commission="' +
          (commissionEnabled ? "1" : "0") +
          '">' +
          escapeHtml(ctaLabel) +
          '</a><a class="btn btn-secondary" href="./account-hub.html#account-access">' +
          escapeHtml(joinLabel) +
          "</a></p>" +
          "</article>";
        grid.insertAdjacentHTML("beforeend", html);
      }
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
    var focusId = readFocusProductId();
    var br = bridgeRefForLinks();
    if (br && status && status.parentNode) {
      var note = document.createElement("p");
      note.className = "note";
      note.style.cssText = "margin:0.5rem 0 0;padding:0.55rem 0.75rem;border-radius:10px;border:1px solid rgba(61,158,120,0.35);background:rgba(61,158,120,0.12)";
      note.innerHTML =
        "Bridge visit · ref <strong>" +
        escapeHtml(br) +
        "</strong> — we attach this to outbound shop links for your traffic.";
      status.parentNode.insertBefore(note, status);
    }
    scheduleTrendEngine();
    try {
      var fromCountry = inferCountryCode();

      var url = "/api/public/products/live";
      if (fromCountry && fromCountry.length === 2) {
        url += "?fromCountry=" + encodeURIComponent(fromCountry);
      }

      var response = await fetch(url);
      var body = await response.json();
      var all = normalizePayload(body);

      if (focusId > 0) {
        try {
          var dRes = await fetch("/api/public/products/by-id?productId=" + encodeURIComponent(String(focusId)));
          var dBody = await dRes.json();
          if (dRes.ok && dBody.ok && dBody.product) {
            var row = dBody.product;
            all = all.filter(function (x) {
              return Number(x.id) !== focusId;
            });
            all.unshift({
              id: row.id,
              name: row.title,
              title: row.title,
              shopName: row.shopName,
              basePrice: row.basePrice,
              currency: row.currency,
              categoryId: row.categoryId,
              categoryName: row.categoryName,
              imageUrl: row.imageUrl,
              stock: row.stock
            });
          }
        } catch {
          /* ignore */
        }
      }

      try {
        var rawLocal = localStorage.getItem("vibecart-seller-live-listing");
        var localListing = rawLocal ? JSON.parse(rawLocal) : null;
        var localTitle = String((localListing && localListing.title) || "").trim();
        if (localTitle) {
          var localCategory = lane ? lane : "All";
          var localPrice = localListing && localListing.price != null ? localListing.price : "";
          var localCurrency = String((localListing && localListing.currency) || "EUR");
          var localTarget = window.location.origin + "/seller-boost.html";
          all.unshift({
            id: "local-seller-" + Date.now(),
            name: localTitle,
            title: localTitle,
            category: localCategory,
            price: localPrice,
            currency: localCurrency,
            targetUrl: localTarget,
            url: localTarget,
            shopUrl: localTarget
          });
        }
      } catch {
        /* ignore */
      }

      var filtered = all;
      if (lane && !focusId) {
        filtered = all.filter(function (p) {
          return productCategory(p).toLowerCase() === lane;
        });
      } else if (lane && focusId) {
        filtered = all.filter(function (p) {
          return Number(p.id) === focusId || productCategory(p).toLowerCase() === lane;
        });
      }
      var top = filtered.filter(function (row) {
        if (isDbMarketplaceListing(row)) {
          return true;
        }
        return isExternalTarget(pickTargetUrl(row));
      }).slice(0, 36);
      var topExternal = top.filter(function (row) {
        return isExternalTarget(pickTargetUrl(row));
      }).length;
      if (status) {
        if (focusId > 0) {
          status.textContent =
            "Focused on listing #" +
            focusId +
            (lane ? " · lane filter " + lane + " still applies to other cards." : " · share this URL to return.");
        } else if (!top.length) {
          status.textContent = "No live listings match this lane right now.";
        } else if (!topExternal) {
          status.textContent =
            (lane ? "Showing VibeCart marketplace listings for " + lane + "." : "Showing VibeCart marketplace listings.") +
            " External partner picks appear when available.";
        } else {
          status.textContent = lane
            ? "Showing live " + lane + " picks — marketplace + partner storefronts."
            : "Showing live hot picks — marketplace + partner storefronts.";
        }
      }
      render(top);
      if (focusId > 0) {
        requestAnimationFrame(function () {
          var el = document.getElementById("vc-hot-product-" + String(focusId));
          if (el) {
            el.classList.add("vc-hot-product--focused");
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      }
    } catch {
      if (status) {
        status.textContent = "Could not load live picks right now. Please try again shortly.";
      }
    }
  }

  boot();
})();
