(function () {
  function authHeaders() {
    var token = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    if (!token) return {};
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.authHeaders === "function") {
      return window.VibeCartSessionDevice.authHeaders(token);
    }
    return { Authorization: "Bearer " + token };
  }
  function setStatus(id, text) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = text || "";
    }
  }

  function requireStep2Fields() {
    var files = document.getElementById("vcSellPhotos");
    var title = document.getElementById("vcSellTitle");
    var condition = document.getElementById("vcSellCondition");
    var hasPhoto = Boolean(files && files.files && files.files.length > 0);
    var hasTitle = Boolean(String((title && title.value) || "").trim());
    var hasCondition = Boolean(String((condition && condition.value) || "").trim());
    var price = Number((document.getElementById("vcSellPrice") || {}).value || 0);
    var stock = Number((document.getElementById("vcSellStock") || {}).value || 0);
    if (!hasPhoto || !hasTitle || !hasCondition) {
      setStatus("sellStep2Status", "Add at least one photo, title, and condition before continuing.");
      return false;
    }
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 1) {
      setStatus("sellStep2Status", "Add valid price and stock before continuing.");
      return false;
    }
    setStatus("sellStep2Status", "");
    return true;
  }

  function requireStep3Fields() {
    var mode = String((document.getElementById("vcSellShipMode") || {}).value || "").trim();
    var windowBand = String((document.getElementById("vcSellShipWindow") || {}).value || "").trim();
    if (!mode || !windowBand) {
      setStatus("sellStep3Status", "Select shipping mode and realistic delivery window before continuing.");
      return false;
    }
    setStatus("sellStep3Status", "");
    return true;
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

  var step3Continue = document.getElementById("sellStep3Continue");
  if (step3Continue) {
    step3Continue.addEventListener(
      "click",
      function (event) {
        if (!requireStep3Fields()) {
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

  async function publishListing() {
    if (!requireStep2Fields() || !requireStep3Fields()) {
      return;
    }
    var title = String((document.getElementById("vcSellTitle") || {}).value || "").trim();
    var condition = String((document.getElementById("vcSellCondition") || {}).value || "").trim();
    var categoryName = String((document.getElementById("vcSellCategory") || {}).value || "Fashion").trim();
    var basePrice = Number((document.getElementById("vcSellPrice") || {}).value || 0);
    var stock = Number((document.getElementById("vcSellStock") || {}).value || 1);
    var originCountry = String((document.getElementById("vcSellCountry") || {}).value || "ZA").trim().toUpperCase();
    var details = String((document.getElementById("vcSellDescription") || {}).value || "").trim();
    var shippingMode = String((document.getElementById("vcSellShipMode") || {}).value || "").trim();
    var shippingWindow = String((document.getElementById("vcSellShipWindow") || {}).value || "").trim();
    var description = [details, "Condition: " + condition, "Shipping: " + shippingMode + " (" + shippingWindow + ")"].filter(Boolean).join(" | ");
    setStatus("sellStep3Status", "Publishing listing...");
    try {
      var response = await fetch("/api/public/products/publish", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
        body: JSON.stringify({
          title: title,
          description: description,
          categoryName: categoryName,
          basePrice: basePrice,
          currency: "EUR",
          stock: stock,
          originCountry: originCountry
        })
      });
      var body = await response.json().catch(function () {
        return {};
      });
      if (!response.ok || !body.ok || !body.product || !body.product.id) {
        setStatus("sellStep3Status", "Publish failed: " + String(body.code || "Try seller login again."));
        return;
      }
      try {
        localStorage.setItem("vibecart-seller-last-product-id", String(body.product.id));
      } catch {
        /* ignore */
      }
      setStatus("sellStep3Status", "Live now: " + body.product.title + " (#" + body.product.id + ").");
      window.setTimeout(function () {
        window.location.assign("./my-listings.html");
      }, 450);
    } catch {
      setStatus("sellStep3Status", "Publish failed. Check connection and login.");
    }
  }

  var publishBtn = document.getElementById("sellPublishBtn");
  if (publishBtn) {
    publishBtn.addEventListener("click", function (event) {
      event.preventDefault();
      publishListing();
    });
  }
})();
