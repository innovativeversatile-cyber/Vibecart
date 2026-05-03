/* Same-origin client for POST /api/public/ai/generate (OpenAI runs on Railway; key never in browser). */
(function (global) {
  function apiBase() {
    try {
      var m = document.querySelector('meta[name="vibecart-api-base"]');
      var s = m && m.getAttribute("content");
      if (s && String(s).trim() && !/^disabled$/i.test(String(s).trim())) {
        return String(s).trim().replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
    try {
      if (typeof global.location !== "undefined" && global.location && /^https?:$/i.test(String(global.location.protocol || ""))) {
        return String(global.location.origin || "").replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
    return "";
  }

  function vibecartAiGenerate(agent, input) {
    var base = apiBase();
    if (!base) {
      return Promise.reject(new Error("no_api_base"));
    }
    var headers = { "Content-Type": "application/json" };
    try {
      var token = String(global.localStorage.getItem("vibecart-public-auth-token") || "").trim();
      if (token && global.VibeCartSessionDevice && typeof global.VibeCartSessionDevice.merge === "function") {
        headers = global.VibeCartSessionDevice.merge(token, headers);
      } else if (token) {
        headers.Authorization = "Bearer " + token;
      }
    } catch (e) {
      /* ignore */
    }
    return fetch(base + "/api/public/ai/generate", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ agent: agent, input: input || {} })
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) {
          var msg = (data && (data.message || data.code)) || String(r.status);
          throw new Error(msg);
        }
        if (!data || !data.ok || !data.result) {
          throw new Error("bad_response");
        }
        return data.result;
      });
    });
  }

  global.vibecartAiGenerate = vibecartAiGenerate;
})(typeof window !== "undefined" ? window : globalThis);
