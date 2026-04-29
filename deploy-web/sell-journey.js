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
    if (!hasTitle || !hasCondition) {
      setStatus("sellStep2Status", "Add title and condition before continuing.");
      return false;
    }
    if (!hasPhoto) {
      setStatus("sellStep2Status", "No photo uploaded - continuing in draft mode. Add photos later before final publishing.");
      return true;
    }
    setStatus("sellStep2Status", "");
    return true;
  }

  function requireStep3Fields() {
    var mode = String((document.getElementById("vcSellShipMode") || {}).value || "").trim();
    var courier = String((document.getElementById("vcSellCourierCompany") || {}).value || "").trim();
    var windowBand = String((document.getElementById("vcSellShipWindow") || {}).value || "").trim();
    if (!courier) {
      var courierEl = document.getElementById("vcSellCourierCompany");
      if (courierEl && courierEl.options && courierEl.options.length) {
        courierEl.value = String(courierEl.options[0].value || "DHL").trim();
        courier = String(courierEl.value || "DHL").trim();
      }
    }
    if (!mode || !courier || !windowBand) {
      setStatus("sellStep3Status", "Select shipping mode, delivery company, and realistic delivery window before continuing.");
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
  var firstContinue = document.querySelector('[data-flow-step]:not([hidden]) [data-flow-next]');
  if (firstContinue) {
    firstContinue.addEventListener(
      "click",
      function (event) {
        var ack = document.getElementById("sellJourneyDisclaimerAck");
        if (ack && !ack.checked) {
          setStatus("sellStep1Status", "Accept the seller disclaimer to continue.");
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
          return;
        }
        setStatus("sellStep1Status", "");
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
          shippingCompany: String((document.getElementById("vcSellCourierCompany") || {}).value || "").trim(),
          shippingWindow: String((document.getElementById("vcSellShipWindow") || {}).value || "").trim()
        };
        localStorage.setItem("vibecart-seller-preview-draft", JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    });
  }
})();
