/* Web Push registration for seller/buyer message alerts (requires VAPID on API + HTTPS). */
(function () {
  "use strict";

  function readToken() {
    try {
      return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch {
      return "";
    }
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    var raw = window.atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) {
      out[i] = raw.charCodeAt(i);
    }
    return out;
  }

  function postRegister(token, subscription) {
    var headers = { "Content-Type": "application/json" };
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
      headers = window.VibeCartSessionDevice.merge(token, headers);
    } else {
      headers.Authorization = "Bearer " + token;
    }
    return fetch("/api/public/account/web-push/register", {
      method: "POST",
      credentials: "same-origin",
      headers: headers,
      body: JSON.stringify({ subscription: subscription })
    }).then(function (r) {
      return r.json().catch(function () {
        return {};
      });
    });
  }

  function setBanner(text) {
    var el = document.getElementById("vcSellerMsgPushStatus");
    if (el) {
      el.textContent = text || "";
    }
  }

  function tryRegister() {
    var token = readToken();
    var btn = document.getElementById("vcSellerMsgPushBtn");
    if (!token) {
      setBanner("Sign in first to enable device notifications.");
      if (btn) btn.disabled = true;
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setBanner("This browser does not support push notifications.");
      if (btn) btn.disabled = true;
      return;
    }
    if (btn) {
      btn.addEventListener("click", function () {
        setBanner("Requesting permission…");
        btn.disabled = true;
        fetch("/api/public/web-push/config", { credentials: "same-origin" })
          .then(function (r) {
            return r.json();
          })
          .then(function (j) {
            if (!j || !j.ok || !j.publicKey) {
              setBanner(
                "Push is not configured on the server yet (needs VAPID keys). You can still use messages here in the browser."
              );
              btn.disabled = false;
              return null;
            }
            return navigator.serviceWorker
              .register("./service-worker.js", { scope: "./" })
              .then(function (reg) {
                return reg.pushManager
                  .getSubscription()
                  .then(function (existing) {
                    if (existing) return existing;
                    return reg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(String(j.publicKey))
                    });
                  });
              })
              .then(function (sub) {
                if (!sub) return;
                return postRegister(token, sub.toJSON());
              })
              .then(function (body) {
                if (body && body.ok) {
                  setBanner("This device is registered. When the platform sends a message alert, it can appear in your system notification tray (browser/OS dependent).");
                } else {
                  setBanner("Could not finish registration. Try again after signing in, or use a secure HTTPS origin.");
                  btn.disabled = false;
                }
              })
              .catch(function () {
                setBanner("Permission denied or registration failed. Check browser notification settings.");
                btn.disabled = false;
              });
          })
          .catch(function () {
            setBanner("Could not load push config from the API.");
            btn.disabled = false;
          });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryRegister, { once: true });
  } else {
    tryRegister();
  }
})();
