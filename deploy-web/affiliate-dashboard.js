(function () {
  var session = null;
  try {
    session = JSON.parse(localStorage.getItem("vibecart-owner-api-session") || "null");
  } catch {
    session = null;
  }
  if (!session || !session.token) {
    window.location.replace("./admin.html");
    return;
  }
  var statusEl = document.getElementById("affiliateDashStatus");
  var grid = document.getElementById("affiliateDashGrid");
  if (!statusEl || !grid) {
    return;
  }

  function card(title, desc) {
    var node = document.createElement("article");
    node.className = "shop";
    node.innerHTML = "<h3>" + title + "</h3><p>" + desc + "</p>";
    return node;
  }

  fetch("/api/public/affiliate/referrals?limit=120&authToken=" + encodeURIComponent(String(session.token || "")))
    .then(function (res) { return res.json(); })
    .then(function (body) {
      var rows = body && Array.isArray(body.referrals) ? body.referrals : [];
      if (!rows.length) {
        statusEl.textContent = "No referral clicks recorded yet.";
        return;
      }
      statusEl.textContent = "Showing " + rows.length + " recent referral records.";
      rows.forEach(function (row) {
        var ref = String(row.reference_code || "");
        var kind = String(row.conversion_type || "");
        var partner = "Partner ID: " + String(row.partner_id || "n/a");
        var money = "Commission: " + String(row.commission_amount || 0) + " " + String(row.currency || "EUR");
        var desc = kind + " · " + partner + " · " + money + " · Ref: " + ref;
        grid.appendChild(card("Referral #" + String(row.id || ""), desc));
      });
    })
    .catch(function () {
      statusEl.textContent = "Could not load referrals right now.";
    });
})();
