/**
 * Password visibility toggles: pair each input with a button
 * <button type="button" class="vc-password-toggle" data-vc-pw-toggle-for="inputId">Show</button>
 */
(function () {
  "use strict";

  function bind(btn) {
    if (!btn || btn.getAttribute("data-vc-pw-bound") === "1") return;
    var id = String(btn.getAttribute("data-vc-pw-toggle-for") || "").trim();
    var input = id ? document.getElementById(id) : null;
    if (!input) return;
    btn.setAttribute("data-vc-pw-bound", "1");
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-pressed", "false");
    if (!btn.getAttribute("aria-label")) {
      btn.setAttribute("aria-label", "Show password");
    }
    btn.addEventListener("click", function () {
      var hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      btn.setAttribute("aria-pressed", hidden ? "true" : "false");
      btn.textContent = hidden ? "Hide" : "Show";
      btn.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
    });
  }

  function scan(root) {
    (root || document).querySelectorAll("[data-vc-pw-toggle-for]").forEach(bind);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      scan(document);
    });
  } else {
    scan(document);
  }
})();
