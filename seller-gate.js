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
      var res = await fetch("/api/public/auth/session", {
        headers: { Authorization: "Bearer " + token }
      });
      var body = await res.json().catch(function () { return {}; });
      var role = String((body && body.user && body.user.role) || "").toLowerCase();
      if (!res.ok || !body.ok || role !== "seller") {
        window.location.replace("./account-hub.html?seller_required=1");
      }
    } catch {
      window.location.replace("./account-hub.html?seller_required=1");
    }
  }

  enforceSellerAccess();
})();
