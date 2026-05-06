/**
 * Per-browser device secret for public session binding. Sent on login/register and
 * as X-VibeCart-Device-Binding on authenticated API calls (with Bearer token).
 */
(function (w) {
  "use strict";
  function stripIntroBlocking() {
    try {
      if (w.document && w.document.body) {
        w.document.body.classList.remove("vc-intro-blocking");
      }
    } catch (e) {
      /* ignore */
    }
  }
  stripIntroBlocking();
  if (w.document && w.document.readyState === "loading") {
    w.document.addEventListener("DOMContentLoaded", stripIntroBlocking);
  }
  var KEY = "vibecart-device-binding-v1";

  function getOrCreate() {
    try {
      var s = w.localStorage.getItem(KEY);
      if (s && s.length >= 16) {
        return s;
      }
      var arr = new Uint8Array(32);
      w.crypto.getRandomValues(arr);
      s = Array.from(arr, function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
      w.localStorage.setItem(KEY, s);
      return s;
    } catch (e) {
      return "";
    }
  }

  w.VibeCartSessionDevice = {
    HEADER: "X-VibeCart-Device-Binding",
    getSecret: getOrCreate,
    registerPayloadField: function () {
      var sec = getOrCreate();
      return sec ? { deviceBinding: sec } : {};
    },
    authHeaders: function (token) {
      var h = { Authorization: "Bearer " + token };
      var sec = getOrCreate();
      if (sec) {
        h["X-VibeCart-Device-Binding"] = sec;
      }
      return h;
    },
    merge: function (token, base) {
      var o = Object.assign({}, base || {});
      if (token) {
        o.Authorization = "Bearer " + token;
      }
      var sec = getOrCreate();
      if (sec) {
        o["X-VibeCart-Device-Binding"] = sec;
      }
      return o;
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
