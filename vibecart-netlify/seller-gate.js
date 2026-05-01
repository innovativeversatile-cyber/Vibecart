(function () {
  async function enforceSellerAccess() {
    var token = "";
    try {
      token = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch {
      token = "";
    }
    if (!token) {
      window.location.replace("./account-hub.html?seller_required=1");
      return;
    }
    try {
      var hdr =
        window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.authHeaders === "function"
          ? window.VibeCartSessionDevice.authHeaders(token)
          : { Authorization: "Bearer " + token };
      var res = await fetch("/api/public/auth/session", {
        headers: hdr
      });
      var body = await res.json().catch(function () { return {}; });
      var role = String((body && body.user && body.user.role) || "").toLowerCase();
      if (!res.ok || !body.ok || role !== "seller") {
        window.location.replace("./account-hub.html?seller_required=1");
        return;
      }
      if (body.token) {
        try {
          localStorage.setItem("vibecart-public-auth-token", String(body.token));
        } catch (e) {
          /* ignore */
        }
      }
    } catch {
      window.location.replace("./account-hub.html?seller_required=1");
    }
  }

  enforceSellerAccess();
})();
