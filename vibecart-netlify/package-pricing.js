(function () {
  function resolveCurrency() {
    var locale = String((navigator.language || "").toLowerCase());
    var tz = "";
    try {
      tz = String((Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase());
    } catch {
      tz = "";
    }
    if (locale.includes("pl") || tz.includes("warsaw")) {
      return "PLN";
    }
    if (locale.includes("en-na") || tz.includes("windhoek")) {
      return "NAD";
    }
    if (locale.includes("en-ng") || tz.includes("lagos")) {
      return "NGN";
    }
    if (locale.includes("en-bw") || tz.includes("gaborone")) {
      return "BWP";
    }
    if (locale.includes("en-zm") || tz.includes("lusaka")) {
      return "ZMW";
    }
    if (locale.includes("en-za") || tz.includes("johannesburg")) {
      return "ZAR";
    }
    if (locale.includes("sw-ke") || tz.includes("nairobi")) {
      return "KES";
    }
    if (tz.includes("harare")) {
      return "USD";
    }
    if (locale.includes("en-gb")) {
      return "GBP";
    }
    if (locale.includes("en-us")) {
      return "USD";
    }
    return "EUR";
  }

  function rateFor(currency) {
    var rates = {
      EUR: 1,
      PLN: 4.3,
      ZAR: 20.2,
      NAD: 20.2,
      NGN: 1750,
      BWP: 14.8,
      ZMW: 30.2,
      KES: 140,
      USD: 1.08,
      GBP: 0.86
    };
    return rates[currency] || 1;
  }

  function countryTaxProfile(currency) {
    var table = {
      EUR: { country: "EU", rate: 0.21, mode: "excluded" },
      PLN: { country: "Poland", rate: 0.23, mode: "excluded" },
      ZAR: { country: "South Africa", rate: 0.15, mode: "excluded" },
      NAD: { country: "Namibia", rate: 0.15, mode: "excluded" },
      NGN: { country: "Nigeria", rate: 0.075, mode: "excluded" },
      BWP: { country: "Botswana", rate: 0.14, mode: "excluded" },
      ZMW: { country: "Zambia", rate: 0.16, mode: "excluded" },
      KES: { country: "Kenya", rate: 0.16, mode: "excluded" },
      USD: { country: "United States", rate: 0, mode: "excluded" },
      GBP: { country: "United Kingdom", rate: 0.2, mode: "excluded" }
    };
    return table[currency] || { country: "your country", rate: 0.2, mode: "excluded" };
  }

  function renderTopDisclosure(currency, fmt, profile) {
    var el = document.getElementById("priceDisclosureTop");
    if (!el) {
      return;
    }
    var modeText = profile.mode === "included" ? "includes" : "excludes";
    var sampleBase = 29;
    var sampleFinal = profile.mode === "included" ? sampleBase : sampleBase * (1 + profile.rate);
    el.textContent =
      "Prices shown in " +
      currency +
      " " +
      modeText +
      " local taxes. Estimated final charge in " +
      profile.country +
      ": " +
      fmt.format(sampleFinal) +
      "/month for Pro-level plans.";
  }

  function localizePrices() {
    var currency = resolveCurrency();
    var rate = rateFor(currency);
    var profile = countryTaxProfile(currency);
    var fmt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2
    });
    renderTopDisclosure(currency, fmt, profile);
    document.querySelectorAll("[data-base-eur]").forEach(function (el) {
      var eur = Number(el.getAttribute("data-base-eur") || "0");
      if (!Number.isFinite(eur) || eur <= 0) {
        return;
      }
      var label = String(el.getAttribute("data-price-label") || "month");
      var converted = eur * rate;
      var finalValue = profile.mode === "included" ? converted : converted * (1 + profile.rate);
      var taxText = profile.mode === "included" ? "incl. local tax" : "excl. tax";
      el.textContent = fmt.format(converted) + "/" + label + " (" + taxText + ")";
      var estimateNode = document.createElement("span");
      estimateNode.className = "note";
      estimateNode.textContent = "Estimated final charge: " + fmt.format(finalValue) + "/" + label + ".";
      var parent = el.parentElement;
      if (parent && !parent.querySelector(".price-estimate-note")) {
        estimateNode.className = "note price-estimate-note";
        parent.appendChild(estimateNode);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", localizePrices, { once: true });
  } else {
    localizePrices();
  }
})();
