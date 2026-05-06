(function () {
  "use strict";

  function readToken() {
    try {
      return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch {
      return "";
    }
  }

  function mergeHeaders(token, headers) {
    var h = headers || {};
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
      return window.VibeCartSessionDevice.merge(token, h);
    }
    h.Authorization = "Bearer " + token;
    return h;
  }

  function setLine(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || "";
  }

  function loadPayoutAccount() {
    var token = readToken();
    if (!token) {
      setLine("vcPayoutFormHint", "Sign in with Lane passport to load or save payout routing.");
      return;
    }
    setLine("vcPayoutFormHint", "Loading…");
    fetch("/api/public/seller/payout-account", {
      method: "GET",
      credentials: "same-origin",
      headers: mergeHeaders(token, { Accept: "application/json" })
    })
      .then(function (r) {
        return r.json().catch(function () {
          return {};
        });
      })
      .then(function (j) {
        if (!j || !j.ok) {
          setLine("vcPayoutFormHint", String((j && j.message) || j.code || "Could not load payout settings."));
          return;
        }
        var input = document.getElementById("vcStripeConnectAccountId");
        if (input && j.stripeAccountId) {
          input.value = String(j.stripeAccountId);
        }
        setLine(
          "vcPayoutFormHint",
          j.hasAccount
            ? "A Stripe Connect account is on file. Update it below if you switched banks in Stripe."
            : "No payout account yet — paste your Stripe Connect account ID (starts with acct_) from the Stripe Dashboard."
        );
      })
      .catch(function () {
        setLine("vcPayoutFormHint", "Network error loading payout settings.");
      });
  }

  function savePayoutAccount() {
    var token = readToken();
    var input = document.getElementById("vcStripeConnectAccountId");
    var id = input ? String(input.value || "").trim() : "";
    if (!token) {
      setLine("vcPayoutSaveStatus", "Sign in first.");
      return;
    }
    if (!/^acct_[a-zA-Z0-9]+$/.test(id)) {
      setLine("vcPayoutSaveStatus", "Enter a valid Connect account ID like acct_1AbCdEfGhIjKlMn.");
      return;
    }
    setLine("vcPayoutSaveStatus", "Saving…");
    fetch("/api/public/seller/payout-account/upsert", {
      method: "POST",
      credentials: "same-origin",
      headers: mergeHeaders(token, { "Content-Type": "application/json", Accept: "application/json" }),
      body: JSON.stringify({ stripeAccountId: id })
    })
      .then(function (r) {
        return r.json().catch(function () {
          return {};
        });
      })
      .then(function (j) {
        if (!j || !j.ok) {
          setLine("vcPayoutSaveStatus", String((j && j.message) || j.code || "Save failed."));
          return;
        }
        setLine("vcPayoutSaveStatus", "Saved. After both sides confirm an order, the API can transfer to this Connect account when Stripe is configured on the host.");
      })
      .catch(function () {
        setLine("vcPayoutSaveStatus", "Network error while saving.");
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("vcPayoutSaveBtn");
    if (btn) btn.addEventListener("click", savePayoutAccount);
    loadPayoutAccount();
  });
})();
