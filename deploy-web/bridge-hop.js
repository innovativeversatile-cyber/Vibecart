(function () {
  var key = "vibecart-bridge-path";
  document.querySelectorAll("[data-bridge-hop]").forEach(function (link) {
    link.addEventListener("click", function () {
      var path = link.getAttribute("data-bridge-hop");
      if (!path) return;
      try {
        localStorage.setItem(key, path);
      } catch (e) {}
    });
  });
})();
