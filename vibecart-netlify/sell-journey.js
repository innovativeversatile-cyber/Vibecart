(function () {
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
})();
