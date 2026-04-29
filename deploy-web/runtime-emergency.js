(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function bindSmartTour() {
    var openBtn = byId("openOnboarding");
    var modal = byId("onboardingModal");
    var text = byId("onboardingText");
    var nextBtn = byId("onboardingNext");
    var closeBtn = byId("onboardingClose");
    if (!openBtn || !modal || !text || !nextBtn || !closeBtn) return;
    if (openBtn.getAttribute("data-vc-emergency-tour") === "1") return;
    openBtn.setAttribute("data-vc-emergency-tour", "1");

    var steps = [
      "Welcome. This quick tour helps you shop safely, save money, and use trusted sellers.",
      "Step 1: Start with Hot Picks and compare options quickly.",
      "Step 2: Use AI Assistant for budget-safe product picks and compare options fast.",
      "Step 3: Activate rewards by completing secure actions and on-time payments."
    ];
    var idx = 0;
    function render() {
      text.textContent = steps[idx] || steps[0];
      nextBtn.textContent = idx >= steps.length - 1 ? "Finish" : "Next";
    }
    function openModal() {
      idx = 0;
      render();
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    }
    function closeModal() {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }
    openBtn.addEventListener("click", function (event) {
      event.preventDefault();
      openModal();
    }, true);
    nextBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (idx < steps.length - 1) {
        idx += 1;
        render();
      } else {
        closeModal();
      }
    }, true);
    closeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      closeModal();
    }, true);
  }

  function bindExperienceModes() {
    var fullBtn = byId("vcPersonaFun");
    var homeBtn = byId("vcPersonaEff");
    var status = byId("vcPersonaStatus");
    if (!fullBtn || !homeBtn) return;
    if (fullBtn.getAttribute("data-vc-emergency-mode") === "1") return;
    fullBtn.setAttribute("data-vc-emergency-mode", "1");

    function apply(mode) {
      var full = mode === "full";
      document.body.classList.toggle("vc-layout-aura", full);
      document.body.classList.toggle("vc-layout-exclusive", !full);
      document.body.classList.toggle("vc-mode-full-experience", full);
      document.body.classList.toggle("vc-mode-home-focused", !full);
      document.body.style.filter = full ? "saturate(1.08) contrast(1.03)" : "saturate(0.92) contrast(1.08)";
      fullBtn.classList.toggle("btn-primary", full);
      fullBtn.classList.toggle("btn-secondary", !full);
      homeBtn.classList.toggle("btn-primary", !full);
      homeBtn.classList.toggle("btn-secondary", full);
      if (status) {
        status.textContent = full
          ? "Full experience live (emergency runtime)."
          : "Back to home focused live (emergency runtime).";
      }
      try {
        localStorage.setItem("vibecart-home-lite-experience-mode", full ? "full" : "home");
      } catch {
        /* ignore */
      }
    }

    fullBtn.addEventListener("click", function (event) {
      event.preventDefault();
      apply("full");
    }, true);
    homeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      apply("home");
    }, true);
  }

  function boot() {
    bindSmartTour();
    bindExperienceModes();
    document.body && document.body.setAttribute("data-vc-emergency-runtime", "1");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
