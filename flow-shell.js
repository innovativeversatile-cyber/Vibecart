/* Multi-step flows: persists current step in sessionStorage until user taps Done. */
(function () {
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function postFlowHaptic(kind) {
    try {
      var RN = typeof window !== "undefined" && window.ReactNativeWebView;
      if (!RN || !RN.postMessage) {
        return;
      }
      RN.postMessage(JSON.stringify({ vcFlowHaptic: kind, src: "vc-flow" }));
    } catch {
      /* ignore */
    }
  }

  document.querySelectorAll("[data-vc-flow-root]").forEach(function (root) {
    var flow = root.getAttribute("data-vc-flow-root") || "generic";
    var key = "vibecart-flow-" + flow;
    var steps = qsa("[data-flow-step]", root);
    if (!steps.length) {
      return;
    }
    var bar = root.querySelector("[data-flow-progress]");
    var label = root.querySelector("[data-flow-step-label]");
    var cur = 0;
    try {
      var saved = sessionStorage.getItem(key);
      if (saved != null && saved !== "") {
        cur = Math.max(0, Math.min(steps.length - 1, parseInt(saved, 10) || 0));
      }
    } catch {
      /* ignore */
    }

    function render() {
      steps.forEach(function (s, i) {
        var on = i === cur;
        s.hidden = !on;
        s.setAttribute("aria-hidden", on ? "false" : "true");
      });
      if (bar) {
        bar.style.width = ((100 * (cur + 1)) / steps.length).toFixed(2) + "%";
      }
      if (label) {
        label.textContent = "Step " + (cur + 1) + " of " + steps.length;
      }
      try {
        sessionStorage.setItem(key, String(cur));
      } catch {
        /* ignore */
      }
    }

    render();

    root.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) {
          return;
        }
        if (t.closest("[data-flow-next]")) {
          ev.preventDefault();
          cur = Math.min(steps.length - 1, cur + 1);
          postFlowHaptic("next");
          render();
          return;
        }
        if (t.closest("[data-flow-prev]")) {
          ev.preventDefault();
          cur = Math.max(0, cur - 1);
          postFlowHaptic("prev");
          render();
          return;
        }
        if (t.closest("[data-flow-done]")) {
          postFlowHaptic("done");
          try {
            sessionStorage.removeItem(key);
          } catch {
            /* ignore */
          }
        }
      },
      false
    );
  });
})();
