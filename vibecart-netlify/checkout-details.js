(function () {
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
  }

  function resolveDialCode() {
    var fallback = { code: "+48", country: "PL" };
    try {
      var tz = String((Intl.DateTimeFormat().resolvedOptions().timeZone || "")).toLowerCase();
      if (tz.indexOf("warsaw") >= 0) return { code: "+48", country: "PL" };
      if (tz.indexOf("johannesburg") >= 0) return { code: "+27", country: "ZA" };
      if (tz.indexOf("harare") >= 0) return { code: "+263", country: "ZW" };
      if (tz.indexOf("lagos") >= 0) return { code: "+234", country: "NG" };
      if (tz.indexOf("london") >= 0) return { code: "+44", country: "GB" };
      if (tz.indexOf("new_york") >= 0 || tz.indexOf("los_angeles") >= 0 || tz.indexOf("chicago") >= 0) {
        return { code: "+1", country: "US" };
      }
    } catch {
      /* ignore */
    }
    try {
      var locale = String(navigator.language || "").toUpperCase();
      if (locale.endsWith("-PL")) return { code: "+48", country: "PL" };
      if (locale.endsWith("-ZA")) return { code: "+27", country: "ZA" };
      if (locale.endsWith("-ZW")) return { code: "+263", country: "ZW" };
      if (locale.endsWith("-NG")) return { code: "+234", country: "NG" };
      if (locale.endsWith("-GB")) return { code: "+44", country: "GB" };
      if (locale.endsWith("-US")) return { code: "+1", country: "US" };
    } catch {
      /* ignore */
    }
    return fallback;
  }

  function taxRateByCountry(countryCode) {
    var code = String(countryCode || "").toUpperCase();
    var map = {
      PL: 0.23,
      ZA: 0.15,
      ZW: 0.15,
      NG: 0.075,
      GB: 0.2,
      US: 0
    };
    return Number(map[code] || 0.2);
  }

  function basePlanAmount(flow, plan) {
    var f = String(flow || "").toLowerCase();
    var p = String(plan || "").toLowerCase();
    if (f === "coach") {
      if (p === "pro") return 30;
      if (p === "plus") return 18.5;
      if (p === "ai-home") return 12.5;
      return 10.5;
    }
    if (f === "insurance") {
      if (p === "shield-pro") return 24.5;
      if (p === "family-protect") return 17.5;
      return 10.5;
    }
    return 10;
  }

  function initCheckoutDetails() {
    var title = document.getElementById("checkoutTitle");
    var note = document.getElementById("checkoutPlanNote");
    var back = document.getElementById("checkoutBackLink");
    var typeEl = document.getElementById("checkoutServiceType");
    var nameEl = document.getElementById("checkoutFullName");
    var emailEl = document.getElementById("checkoutEmail");
    var modeEl = document.getElementById("checkoutUserMode");
    var dialCodeEl = document.getElementById("checkoutDialCode");
    var phoneEl = document.getElementById("checkoutPhone");
    var cityEl = document.getElementById("checkoutCity");
    var postalEl = document.getElementById("checkoutPostalCode");
    var countryEl = document.getElementById("checkoutCountry");
    var fastFields = document.getElementById("checkoutFastTrackFields");
    var newFields = document.getElementById("checkoutNewUserFields");
    var accountEmailEl = document.getElementById("checkoutAccountEmail");
    var passcodeEl = document.getElementById("checkoutPasscode");
    var confirmBtn = document.getElementById("checkoutConfirmBtn");
    var statusEl = document.getElementById("checkoutStatus");
    var paymentMethodEl = document.getElementById("checkoutPaymentMethod");
    var autoRenewEl = document.getElementById("checkoutAutoRenew");
    var taxDisclosureEl = document.getElementById("checkoutTaxDisclosure");

    var params = new URLSearchParams(window.location.search || "");
    var flow = String(params.get("flow") || "").toLowerCase();
    var plan = String(params.get("plan") || "").trim();
    var addonPlan = String(params.get("addonPlan") || "").trim().toLowerCase();
    var requestedAutoRenew = String(params.get("autoRenew") || "").trim();
    if (autoRenewEl) {
      if (requestedAutoRenew === "0") {
        autoRenewEl.checked = false;
      } else if (requestedAutoRenew === "1") {
        autoRenewEl.checked = true;
      }
    }

    if (flow === "insurance") {
      if (typeEl) {
        typeEl.value = "coach";
      }
      if (title) {
        title.textContent = "Insurance checkout is external";
      }
      if (note) {
        note.textContent = "VibeCart does not process insurance customer payments. Continue directly on licensed provider websites.";
      }
      if (back) {
        back.href = "./insurance.html#insurance-packages";
        back.textContent = "Back to insurance providers";
      }
      if (confirmBtn) {
        confirmBtn.textContent = "Open trusted insurance providers";
      }
      if (taxDisclosureEl) {
        taxDisclosureEl.textContent = "Insurance payments are handled by the insurer. VibeCart earns referral commission only after partner-confirmed conversions.";
      }
      if (statusEl) {
        statusEl.textContent = "Insurance flow is referral-only. No internal insurance checkout is available.";
      }
      if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
          window.location.assign("./insurance.html#insurance-packages");
        });
      }
      return;
    }

    if (flow !== "coach") {
      if (title) {
        title.textContent = "External checkout only";
      }
      if (note) {
        note.textContent = "Only Health Coach subscriptions are checked out on VibeCart. Other purchases are completed on partner websites.";
      }
      if (back) {
        back.href = "./world-shop-experience.html";
        back.textContent = "Back to world shop experience";
      }
      var targetRaw =
        String(params.get("target") || "").trim() ||
        String(params.get("shopUrl") || "").trim() ||
        String(params.get("providerUrl") || "").trim() ||
        String(params.get("url") || "").trim();
      var target = "";
      var lower = targetRaw.toLowerCase();
      if (targetRaw && lower.indexOf("javascript:") !== 0 && lower.indexOf("data:") !== 0 && lower.indexOf("vbscript:") !== 0) {
        target = targetRaw;
      }
      if (confirmBtn) {
        confirmBtn.textContent = target ? "Open assigned website" : "Return to world shop";
        confirmBtn.addEventListener("click", function () {
          window.location.assign(target || "./world-shop-experience.html");
        });
      }
      if (statusEl) {
        statusEl.textContent = target
          ? "This purchase is external. Continue on the assigned website."
          : "No external destination was provided. Please return and pick another offer.";
      }
      return;
    }

    if (flow === "coach") {
      if (typeEl) {
        typeEl.value = flow;
      }
      if (title) {
        title.textContent = "Secure coach checkout";
      }
      if (note) {
        var bundleText = addonPlan ? " + " + addonPlan : "";
        note.textContent = "Selected package: " + (plan || "standard") + bundleText + ". Complete payment details below.";
      }
      if (back) {
        back.href = "./buy-journey.html?flow=" + encodeURIComponent(flow) + "&plan=" + encodeURIComponent(plan);
      }
    }

    try {
      var draft = JSON.parse(sessionStorage.getItem("vibecart-checkout-draft") || "{}");
      if (draft && typeof draft === "object") {
        if (nameEl && draft.name) {
          nameEl.value = String(draft.name);
        }
        if (emailEl && draft.email) {
          emailEl.value = String(draft.email);
        }
      }
    } catch {
      /* ignore */
    }

    var applyModeUi = function () {
      var mode = modeEl ? String(modeEl.value || "new") : "new";
      if (fastFields) {
        fastFields.hidden = mode !== "fast";
      }
      if (newFields) {
        newFields.hidden = mode === "fast";
      }
    };
    if (modeEl) {
      modeEl.addEventListener("change", applyModeUi);
    }
    applyModeUi();

    var dial = resolveDialCode();
    var selectedCountry = dial.country;
    var updateTaxDisclosure = function () {
      if (!taxDisclosureEl) {
        return;
      }
      var rate = taxRateByCountry(selectedCountry);
      var base = basePlanAmount(typeEl ? typeEl.value : flow, plan || "standard");
      var finalAmount = base * (1 + rate);
      var fmt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
      });
      taxDisclosureEl.textContent =
        "Package base: " +
        fmt.format(base) +
        " (excl. tax). Estimated final deduction for " +
        selectedCountry +
        ": " +
        fmt.format(finalAmount) +
        " including country tax.";
    };
    var applyDialCode = function (code) {
      if (!phoneEl) {
        return;
      }
      var prefix = String(code || "+48").trim();
      var current = String(phoneEl.value || "").trim();
      var currentPrefix = "";
      var currentRest = current;
      var match = current.match(/^(\+\d{1,4})\s*(.*)$/);
      if (match) {
        currentPrefix = match[1];
        currentRest = String(match[2] || "").trim();
      }
      phoneEl.placeholder = prefix + " ...";
      if (!current) {
        phoneEl.value = prefix + " ";
        return;
      }
      if (currentPrefix && currentPrefix !== prefix) {
        phoneEl.value = prefix + " " + currentRest;
        return;
      }
      if (!currentPrefix) {
        phoneEl.value = prefix + " " + current;
      }
    };
    if (dialCodeEl) {
      dialCodeEl.value = dial.code;
      dialCodeEl.addEventListener("change", function () {
        applyDialCode(dialCodeEl.value);
        var selected = dialCodeEl.options[dialCodeEl.selectedIndex];
        selectedCountry = String((selected && selected.getAttribute("data-country")) || selectedCountry || "PL").toUpperCase();
        updateTaxDisclosure();
      });
    }
    if (phoneEl) {
      applyDialCode(dialCodeEl ? dialCodeEl.value : dial.code);
    }
    if (countryEl) {
      countryEl.value = selectedCountry;
      countryEl.addEventListener("change", function () {
        selectedCountry = String(countryEl.value || selectedCountry || "PL").toUpperCase();
        updateTaxDisclosure();
      });
    }
    if (typeEl) {
      typeEl.addEventListener("change", updateTaxDisclosure);
    }
    updateTaxDisclosure();

    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        var mode = modeEl ? String(modeEl.value || "new") : "new";
        var payload = {
          flow: typeEl ? typeEl.value : "service",
          plan: plan || "standard",
          addonPlan: addonPlan || "",
          checkoutMode: mode,
          method: String((paymentMethodEl && paymentMethodEl.value) || "card").trim() || "card",
          autoRenew: !!(autoRenewEl && autoRenewEl.checked)
        };
        if (mode === "fast") {
          var accEmail = String((accountEmailEl && accountEmailEl.value) || "").trim();
          var pass = String((passcodeEl && passcodeEl.value) || "").trim();
          if (!isValidEmail(accEmail) || pass.length < 4) {
            if (statusEl) {
              statusEl.textContent = "Fast track requires a valid account email and passcode.";
            }
            return;
          }
          payload.name = "Existing account";
          payload.email = accEmail;
          payload.fastTrack = true;
        } else {
          var nm = String((nameEl && nameEl.value) || "").trim();
          var em = String((emailEl && emailEl.value) || "").trim();
          var ph = String((document.getElementById("checkoutPhone")?.value || "")).trim();
          var ad = String((document.getElementById("checkoutAddress")?.value || "")).trim();
          var city = String((cityEl && cityEl.value) || "").trim();
          var postal = String((postalEl && postalEl.value) || "").trim();
          var country = String((countryEl && countryEl.value) || selectedCountry || "PL").trim().toUpperCase();
          if (!nm || !isValidEmail(em) || ph.length < 7 || ad.length < 4 || city.length < 2 || postal.length < 3 || country.length !== 2) {
            if (statusEl) {
              statusEl.textContent = "Please enter valid name, email, phone, street, city, postal code, and country.";
            }
            return;
          }
          payload.name = nm;
          payload.email = em;
          payload.phone = ph;
          payload.address = ad;
          payload.city = city;
          payload.postalCode = postal;
          payload.country = country;
          payload.fastTrack = false;
        }
        try {
          sessionStorage.setItem("vibecart-final-payment", JSON.stringify(payload));
        } catch {
          /* ignore */
        }
        if (statusEl) {
          statusEl.textContent = "Details confirmed. Opening secure payment...";
        }
        window.location.assign(
          "/api/public/payments/checkout/redirect?flow=" +
            encodeURIComponent(payload.flow || "service") +
            "&plan=" +
            encodeURIComponent(payload.plan || "standard") +
            (payload.addonPlan
              ? "&addonPlan=" + encodeURIComponent(payload.addonPlan)
              : "") +
            "&paymentMethod=" +
            encodeURIComponent(payload.method || "card") +
            "&autoRenew=" +
            encodeURIComponent(payload.autoRenew ? "1" : "0") +
            "&customerName=" +
            encodeURIComponent(payload.name || "") +
            "&customerEmail=" +
            encodeURIComponent(payload.email || "") +
            "&customerPhone=" +
            encodeURIComponent(payload.phone || "") +
            "&customerAddress=" +
            encodeURIComponent(payload.address || "") +
            "&customerCity=" +
            encodeURIComponent(payload.city || "") +
            "&customerPostalCode=" +
            encodeURIComponent(payload.postalCode || "") +
            "&customerCountry=" +
            encodeURIComponent(payload.country || "")
        );
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCheckoutDetails, { once: true });
  } else {
    initCheckoutDetails();
  }
})();
