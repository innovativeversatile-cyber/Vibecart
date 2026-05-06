(function () {
  var SHOP_READY_KEY = "vibecart-sell-shop-ready-v1";

  try {
    sessionStorage.removeItem("vibecart-flow-sell");
  } catch {
    /* ignore — stale 2-step flow key; sell journey now uses data-vc-flow-root sell-v3 */
  }

  function setStatus(id, text) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = text || "";
    }
  }

  function setShopReady(ok) {
    try {
      if (ok) sessionStorage.setItem(SHOP_READY_KEY, "1");
      else sessionStorage.removeItem(SHOP_READY_KEY);
    } catch {
      /* ignore */
    }
  }

  function isShopReady() {
    try {
      return sessionStorage.getItem(SHOP_READY_KEY) === "1";
    } catch {
      return false;
    }
  }

  var RULES_SUMMARY = {
    ZA:
      "South Africa (summary): consumer protection (CPA), honest pricing, VAT where registered, POPIA for personal data, and clear returns/refunds in listings. Cross-border sales must state realistic delivery and duties where relevant.",
    KE:
      "Kenya (summary): comply with consumer protection rules, accurate weights/prices, data protection where you process personal data, and tax obligations with KRA when applicable. State delivery and payment terms clearly.",
    IE:
      "Ireland / EU (summary): EU consumer rights (withdrawal, faulty goods), GDPR for buyer data, Revenue tax rules when trading as a business, and accurate origin/shipping disclosures for customs.",
    NG:
      "Nigeria (summary): fair trading and truthful ads, consumer protection standards, clear contracts with buyers, and applicable tax registration when you trade above thresholds.",
    GH:
      "Ghana (summary): fair descriptions, consumer protection compliance, data handled responsibly, and GRA tax rules when you operate as a business seller.",
    EG:
      "Egypt (summary): truthful listings, consumer protection expectations, and business/tax registration where required for commercial selling.",
    GB:
      "United Kingdom (summary): Consumer Rights Act, GDPR/UK GDPR for personal data, Trading Standards expectations, and HMRC tax rules when trading as a business.",
    DE:
      "Germany / EU (summary): EU consumer law, Meinungsfreiheit aside — transparent prices (including VAT where applicable), Impressum/Pflichtangaben if you run a commercial shop site, and GDPR.",
    PL:
      "Poland / EU (summary): EU consumer protection, UOKiK-aligned fair trading, RODO (GDPR), and tax (VAT) rules for business sellers.",
    US:
      "United States (summary): FTC truth-in-advertising, state sales tax nexus rules where applicable, and category-specific regulations (electronics safety, cosmetics, etc.).",
    AE:
      "UAE / Gulf (summary): accurate commercial descriptions, consumer protection expectations, VAT where registered, and licensing for regulated goods.",
    ZW:
      "Zimbabwe (summary): fair trading, truthful product statements, and register/tax compliance when operating as a formal business.",
    OTHER:
      "General: follow VibeCart policy, local consumer law where you sell and where you ship, customs truth declarations, and tax rules for your business status. This summary is not legal advice — confirm with a qualified adviser."
  };

  function rulesForCode(code) {
    var c = String(code || "")
      .trim()
      .toUpperCase()
      .slice(0, 2);
    return RULES_SUMMARY[c] || RULES_SUMMARY.OTHER;
  }

  function paintRulesBody() {
    var sel = document.getElementById("vcSellRulesCountry");
    var body = document.getElementById("vcSellRulesBody");
    if (!body) return;
    var code = sel && sel.value ? sel.value : "OTHER";
    body.textContent = rulesForCode(code);
  }

  function syncRulesCountryFromOrigin() {
    var origin = document.getElementById("vcSellCountry");
    var sel = document.getElementById("vcSellRulesCountry");
    if (!origin || !sel) return;
    var cc = String(origin.value || "")
      .trim()
      .toUpperCase()
      .slice(0, 2);
    if (cc && sel.querySelector('option[value="' + cc + '"]')) {
      sel.value = cc;
    }
    paintRulesBody();
  }

  function requireStep2Fields() {
    var files = document.getElementById("vcSellPhotos");
    var title = document.getElementById("vcSellTitle");
    var condition = document.getElementById("vcSellCondition");
    var hasPhoto = Boolean(files && files.files && files.files.length > 0);
    var hasTitle = Boolean(String((title && title.value) || "").trim());
    var hasCondition = Boolean(String((condition && condition.value) || "").trim());
    if (!hasPhoto || !hasTitle || !hasCondition) {
      setStatus("sellStep2Status", "Add at least one photo, title, and condition before continuing.");
      return false;
    }
    setStatus("sellStep2Status", "");
    return true;
  }

  function requireStep3Fields() {
    var mode = String((document.getElementById("vcSellShipMode") || {}).value || "").trim();
    var windowBand = String((document.getElementById("vcSellShipWindow") || {}).value || "").trim();
    if (!mode || !windowBand) {
      setStatus("sellStep3Status", "Select shipping mode and realistic delivery window before publishing.");
      return false;
    }
    var ack = document.getElementById("vcSellPublishAck");
    if (!ack || !ack.checked) {
      setStatus("sellStep3Status", "Read the jurisdiction summary and tick the confirmation box before publishing.");
      return false;
    }
    setStatus("sellStep3Status", "");
    return true;
  }

  function getAuthToken() {
    try {
      return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch {
      return "";
    }
  }

  function buildPublishBody() {
    var title = String((document.getElementById("vcSellTitle") || {}).value || "").trim();
    var descriptionBase = String((document.getElementById("vcSellDescription") || {}).value || "").trim();
    var category = String((document.getElementById("vcSellCategory") || {}).value || "").trim();
    var origin = String((document.getElementById("vcSellCountry") || {}).value || "")
      .trim()
      .toUpperCase()
      .slice(0, 2);
    var price = Number((document.getElementById("vcSellPrice") || {}).value);
    var stock = Number((document.getElementById("vcSellStock") || {}).value);
    var currency = String((document.getElementById("vcSellCurrency") || {}).value || "EUR")
      .trim()
      .toUpperCase()
      .slice(0, 3);
    var shipMode = String((document.getElementById("vcSellShipMode") || {}).value || "").trim();
    var shipWin = String((document.getElementById("vcSellShipWindow") || {}).value || "").trim();
    var condition = String((document.getElementById("vcSellCondition") || {}).value || "").trim();
    var shipNote =
      "\n\n— VibeCart draft: condition " +
      condition +
      " · shipping " +
      shipMode +
      " · delivery window " +
      shipWin +
      " · jurisdiction notes acknowledged for " +
      String((document.getElementById("vcSellRulesCountry") || {}).value || "OTHER") +
      ".";
    return {
      title: title,
      description: (descriptionBase || "Listing published from guided sell journey.") + shipNote,
      categoryName: category,
      originCountry: origin || "ZA",
      currency: currency.length === 3 ? currency : "EUR",
      basePrice: price,
      stock: stock
    };
  }

  var sellShopStepContinue = document.getElementById("sellShopStepContinue");
  if (sellShopStepContinue) {
    sellShopStepContinue.addEventListener(
      "click",
      function (event) {
        if (!isShopReady()) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
          setStatus("vcSellShopStatus", "Create or confirm your shop first, then continue.");
        }
      },
      true
    );
  }

  var ensureShopBtn = document.getElementById("vcSellEnsureShop");
  if (ensureShopBtn) {
    ensureShopBtn.addEventListener("click", function () {
      var nameInput = document.getElementById("vcSellShopName");
      var shopName = String((nameInput && nameInput.value) || "").trim() || "My VibeCart shop";
      var token = getAuthToken();
      if (!token) {
        setStatus("vcSellShopStatus", "Sign in first (lane passport), then create your shop.");
        return;
      }
      ensureShopBtn.disabled = true;
      setStatus("vcSellShopStatus", "Saving shop…");
      var headers = { "Content-Type": "application/json" };
      if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
        headers = window.VibeCartSessionDevice.merge(token, headers);
      } else {
        headers.Authorization = "Bearer " + token;
      }
      fetch("/api/public/seller/shop/ensure", {
        method: "POST",
        credentials: "same-origin",
        headers: headers,
        body: JSON.stringify({ shopName: shopName })
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var json = {};
            try {
              json = text ? JSON.parse(text) : {};
            } catch {
              json = { ok: false };
            }
            return { res: res, json: json };
          });
        })
        .then(function (pair) {
          var j = pair.json || {};
          if (!pair.res.ok || !j.ok) {
            var code = String(j.code || "");
            var hint = String(j.message || j.code || "SHOP_SAVE_FAILED");
            if (code === "ROLE_FORBIDDEN" || pair.res.status === 403) {
              hint =
                "This account cannot create a shop with the current role. Open Account hub → Active lane → choose Seller or Buyer, then try again.";
            } else if (code === "TOKEN_REQUIRED" || pair.res.status === 401) {
              hint = "Sign in on Lane passport first (saved session), then create your shop.";
            } else if (!pair.res.ok && pair.res.status >= 500) {
              hint = "Server error saving shop — try again in a minute. If it persists, confirm the API is deployed.";
            }
            throw new Error(hint);
          }
          setShopReady(true);
          setStatus(
            "vcSellShopStatus",
            j.already
              ? "Shop already active — you can continue."
              : "Shop ready — continue to listing details."
          );
        })
        .catch(function (err) {
          setShopReady(false);
          var msg = String((err && err.message) || err || "Could not save shop.");
          if (/failed to fetch|networkerror|load failed/i.test(msg)) {
            msg =
              "Could not reach the VibeCart API from this page. Use the HTTPS site (not file://), sign in, and ensure the backend is running.";
          }
          setStatus("vcSellShopStatus", msg);
        })
        .finally(function () {
          ensureShopBtn.disabled = false;
        });
    });
  }

  var step2Continue = document.getElementById("sellStep2Continue");
  if (step2Continue) {
    step2Continue.addEventListener(
      "click",
      function (event) {
        if (!requireStep2Fields()) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
        }
      },
      true
    );
  }

  var rulesSel = document.getElementById("vcSellRulesCountry");
  if (rulesSel) {
    rulesSel.addEventListener("change", paintRulesBody);
  }
  var originEl = document.getElementById("vcSellCountry");
  if (originEl) {
    originEl.addEventListener("input", syncRulesCountryFromOrigin);
    originEl.addEventListener("change", syncRulesCountryFromOrigin);
  }
  paintRulesBody();
  syncRulesCountryFromOrigin();

  var previewBtn = document.getElementById("sellPreviewBtn");
  if (previewBtn) {
    previewBtn.addEventListener("click", function () {
      try {
        var payload = {
          title: String((document.getElementById("vcSellTitle") || {}).value || "").trim(),
          condition: String((document.getElementById("vcSellCondition") || {}).value || "").trim(),
          shippingMode: String((document.getElementById("vcSellShipMode") || {}).value || "").trim(),
          shippingWindow: String((document.getElementById("vcSellShipWindow") || {}).value || "").trim()
        };
        localStorage.setItem("vibecart-seller-preview-draft", JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    });
  }

  var publishBtn = document.getElementById("sellPublishBtn");
  if (publishBtn) {
    publishBtn.addEventListener("click", function () {
      if (!requireStep3Fields()) {
        return;
      }
      var body = buildPublishBody();
      if (body.title.length < 4) {
        setStatus("sellStep3Status", "Title must be at least 4 characters (server rule).");
        return;
      }
      if (!Number.isFinite(body.basePrice) || body.basePrice <= 0) {
        setStatus("sellStep3Status", "Enter a valid price greater than zero.");
        return;
      }
      if (!body.originCountry || body.originCountry.length !== 2) {
        setStatus("sellStep3Status", "Origin country must be a 2-letter ISO code (e.g. ZA, IE).");
        return;
      }
      var token = getAuthToken();
      if (!token) {
        setStatus("sellStep3Status", "Sign in as a seller first, then return here to publish.");
        return;
      }
      publishBtn.disabled = true;
      setStatus("sellStep3Status", "Publishing…");
      var headers = { "Content-Type": "application/json" };
      if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
        headers = window.VibeCartSessionDevice.merge(token, headers);
      } else {
        headers.Authorization = "Bearer " + token;
      }
      fetch("/api/public/products/publish", {
        method: "POST",
        credentials: "same-origin",
        headers: headers,
        body: JSON.stringify(body)
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var json = {};
            try {
              json = text ? JSON.parse(text) : {};
            } catch {
              json = { ok: false, code: "INVALID_RESPONSE", message: text ? text.slice(0, 200) : "Empty response" };
            }
            return { res: res, json: json };
          });
        })
        .then(function (pair) {
          var res = pair.res;
          var json = pair.json || {};
          if (!res.ok || !json.ok) {
            var code = String(json.code || "PUBLISH_FAILED");
            var msg = String(json.message || json.code || "Publish failed");
            if (code === "SHOP_NOT_FOUND") {
              msg =
                "No active shop on your account yet. Finish seller onboarding (shop profile) in account hub, then publish again.";
            }
            if (code === "ROLE_FORBIDDEN") {
              msg =
                "This session cannot publish (role). Sign in with an account that has a seller shop, or open Account hub to switch to seller journey.";
            }
            throw new Error(msg);
          }
          var id = json.product && json.product.id ? String(json.product.id) : "";
          setStatus(
            "sellStep3Status",
            "Published live. Product #" + id + " · open My listings to review."
          );
          try {
            sessionStorage.removeItem("vibecart-flow-sell");
            sessionStorage.removeItem("vibecart-flow-sell-v3");
            sessionStorage.removeItem(SHOP_READY_KEY);
          } catch {
            /* ignore */
          }
        })
        .catch(function (err) {
          setStatus("sellStep3Status", String((err && err.message) || "Publish failed."));
        })
        .finally(function () {
          publishBtn.disabled = false;
        });
    });
  }
})();
