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
      if (
        tz.indexOf("dublin") >= 0 ||
        tz.indexOf("cork") >= 0 ||
        tz.indexOf("galway") >= 0 ||
        tz.indexOf("limerick") >= 0 ||
        tz === "europe/dublin"
      ) {
        return { code: "+353", country: "IE" };
      }
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
      if (locale.endsWith("-IE")) return { code: "+353", country: "IE" };
      if (locale.endsWith("-GB")) return { code: "+44", country: "GB" };
      if (locale.endsWith("-US")) return { code: "+1", country: "US" };
    } catch {
      /* ignore */
    }
    return fallback;
  }

  function readPublicAuth() {
    try {
      var token = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
      var raw = localStorage.getItem("vibecart-public-auth-user");
      var user = raw ? JSON.parse(raw) : {};
      return { token: token, user: user && typeof user === "object" ? user : {} };
    } catch {
      return { token: "", user: {} };
    }
  }

  function dialCodeForCountry(selectEl, countryCode) {
    var want = String(countryCode || "").toUpperCase();
    if (!selectEl || want.length !== 2) {
      return "";
    }
    var opts = selectEl.options;
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      var dc = String((o && o.getAttribute("data-country")) || "").toUpperCase();
      if (dc === want) {
        return String(o.value || "");
      }
    }
    return "";
  }

  function phoneDigitCount(raw) {
    return String(raw || "").replace(/\D/g, "").length;
  }

  function taxRateByCountry(countryCode) {
    var code = String(countryCode || "").toUpperCase();
    var map = {
      PL: 0.23,
      ZA: 0.15,
      ZW: 0.15,
      NG: 0.075,
      GB: 0.2,
      IE: 0.23,
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
    var passcodeWrap = document.getElementById("checkoutPasscodeWrap");
    var fastSignedHint = document.getElementById("checkoutFastTrackSignedInHint");
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

    if (flow === "service_booking") {
      var providerName = String(params.get("provider") || "").trim();
      var svcName = String(params.get("service") || "").trim();
      var deposit = String(params.get("deposit") || "0").trim();
      var payUrl = String(params.get("payUrl") || "").trim();
      var paymentMethod = String(params.get("paymentMethod") || "card").trim();
      var bookDate = String(params.get("date") || "").trim();
      var formMode = document.getElementById("checkoutUserMode");
      var formGrid = formMode && formMode.closest ? formMode.closest(".admin-grid") : null;
      if (formGrid) {
        formGrid.hidden = true;
      }
      if (taxDisclosureEl) {
        taxDisclosureEl.hidden = true;
      }
      if (title) {
        title.textContent = "Service prepay / booking";
      }
      if (note) {
        var bits = [];
        if (providerName) bits.push(providerName);
        if (svcName) bits.push(svcName);
        if (bookDate) bits.push("date " + bookDate);
        if (deposit && deposit !== "0") bits.push("deposit / amount note: " + deposit);
        if (paymentMethod) bits.push("payment method: " + paymentMethod);
        note.textContent =
          bits.join(" · ") ||
          "Your provider shared this route so clients can prepay or continue on VibeCart after the booking is accepted.";
      }
      if (back) {
        back.href = "./my-business.html";
        back.textContent = "Back to My Business";
      }
      var payOk = /^https:\/\//i.test(payUrl);
      if (confirmBtn) {
        if (payOk) {
          confirmBtn.textContent = "Open provider payment page";
          confirmBtn.addEventListener("click", function () {
            window.open(payUrl, "_blank", "noopener,noreferrer");
          });
        } else {
          confirmBtn.textContent = "Continue in My Business";
          confirmBtn.addEventListener("click", function () {
            window.location.assign("./my-business.html");
          });
        }
      }
      if (statusEl) {
        statusEl.textContent = payOk
          ? "Secure prepay opens in a new tab. If you do not have a booking yet, use My Business to send a reservation to this provider first."
          : "No HTTPS prepay link was included. Sign in on My Business, pick this provider’s offer, choose a published time, and send a reservation — your provider can then accept and enable VibeCart checkout if they use it.";
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
        back.href = "./wellbeing.html#coach-packages";
        back.textContent = "Back to coach packages";
      }
    }

    var pubAuth = readPublicAuth();

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
      var tokenNow = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
      if (fastFields) {
        fastFields.hidden = mode !== "fast";
      }
      if (newFields) {
        newFields.hidden = mode === "fast";
      }
      if (passcodeWrap) {
        passcodeWrap.hidden = mode !== "fast" || Boolean(tokenNow);
      }
      if (fastSignedHint) {
        fastSignedHint.hidden = mode !== "fast" || !tokenNow;
      }
    };
    if (modeEl) {
      modeEl.addEventListener("change", applyModeUi);
    }
    if (pubAuth.token && modeEl) {
      modeEl.value = "fast";
    }
    if (accountEmailEl && pubAuth.user) {
      var uem = String(pubAuth.user.email || pubAuth.user.userEmail || "").trim();
      if (uem && isValidEmail(uem)) {
        accountEmailEl.value = uem;
      }
    }
    if (nameEl && pubAuth.user && !nameEl.value) {
      var unm = String(pubAuth.user.fullName || pubAuth.user.name || "").trim();
      if (unm) {
        nameEl.value = unm;
      }
    }
    applyModeUi();

    var dial = resolveDialCode();
    var selectedCountry = dial.country;
    var savedCc = String((pubAuth.user && pubAuth.user.countryCode) || "").trim().toUpperCase();
    if (savedCc.length === 2) {
      selectedCountry = savedCc;
    }
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
      var initialDial = dialCodeForCountry(dialCodeEl, selectedCountry) || dial.code;
      dialCodeEl.value = initialDial;
      dialCodeEl.addEventListener("change", function () {
        applyDialCode(dialCodeEl.value);
        var selected = dialCodeEl.options[dialCodeEl.selectedIndex];
        selectedCountry = String((selected && selected.getAttribute("data-country")) || selectedCountry || "PL").toUpperCase();
        if (countryEl && selectedCountry.length === 2) {
          countryEl.value = selectedCountry;
        }
        updateTaxDisclosure();
      });
    }
    if (phoneEl) {
      applyDialCode(dialCodeEl ? dialCodeEl.value : dial.code);
    }
    if (countryEl) {
      if (selectedCountry.length === 2) {
        countryEl.value = selectedCountry;
      }
      countryEl.addEventListener("change", function () {
        selectedCountry = String(countryEl.value || selectedCountry || "PL").toUpperCase();
        if (dialCodeEl) {
          var nextDial = dialCodeForCountry(dialCodeEl, selectedCountry);
          if (nextDial) {
            dialCodeEl.value = nextDial;
            applyDialCode(nextDial);
          }
        }
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
          var tokenAtPay = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
          var pass = String((passcodeEl && passcodeEl.value) || "").trim();
          if (!isValidEmail(accEmail)) {
            if (statusEl) {
              statusEl.textContent = "Fast track requires a valid account email.";
            }
            return;
          }
          if (!tokenAtPay && pass.length < 4) {
            if (statusEl) {
              statusEl.textContent =
                "Sign in from Account hub to use fast track, or enter the one-time passcode from your account email. Otherwise choose “I am new”.";
            }
            return;
          }
          payload.name = "Existing account";
          payload.email = accEmail;
          payload.country = String((countryEl && countryEl.value) || selectedCountry || "").trim().toUpperCase();
          payload.fastTrack = true;
        } else {
          var nm = String((nameEl && nameEl.value) || "").trim();
          var em = String((emailEl && emailEl.value) || "").trim();
          var ph = String((document.getElementById("checkoutPhone")?.value || "")).trim();
          var ad = String((document.getElementById("checkoutAddress")?.value || "")).trim();
          var city = String((cityEl && cityEl.value) || "").trim();
          var postal = String((postalEl && postalEl.value) || "").trim();
          var country = String((countryEl && countryEl.value) || selectedCountry || "PL").trim().toUpperCase();
          var digits = phoneDigitCount(ph);
          if (!nm || !isValidEmail(em) || digits < 7 || digits > 15 || ad.length < 4 || city.length < 2 || postal.length < 3 || country.length !== 2) {
            if (statusEl) {
              statusEl.textContent = "Please enter valid name, email, phone (with country code), street, city, postal code, and country.";
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
        var payToken = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
        var loc =
          "/api/public/payments/checkout/redirect?flow=" +
          encodeURIComponent(payload.flow || "service") +
          "&plan=" +
          encodeURIComponent(payload.plan || "standard") +
          (payload.addonPlan ? "&addonPlan=" + encodeURIComponent(payload.addonPlan) : "") +
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
          encodeURIComponent(payload.country || "");
        if (payToken) {
          loc += "&authToken=" + encodeURIComponent(payToken);
        }
        window.location.assign(loc);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCheckoutDetails, { once: true });
  } else {
    initCheckoutDetails();
  }
})();
