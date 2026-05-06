/* Seller bridge toolkit — corridor link builder + copy helpers (works without Clipboard API in some browsers). */
(function () {
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function copyText(text, onOk, onFail) {
    var t = String(text || "");
    function fallbackExec() {
      try {
        var ta = document.createElement("textarea");
        ta.value = t;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = false;
        try {
          ok = document.execCommand("copy");
        } catch {
          ok = false;
        }
        document.body.removeChild(ta);
        if (ok && typeof onOk === "function") {
          onOk();
          return;
        }
      } catch {
        /* ignore */
      }
      if (typeof onFail === "function") {
        onFail();
      }
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(t).then(onOk).catch(fallbackExec);
    } else {
      fallbackExec();
    }
  }

  function setBootMessage(text) {
    var el = document.getElementById("vcSbtBootMessage");
    if (el) {
      el.textContent = text || "";
      el.hidden = !text;
    }
  }

  function bootCardOnlyView(params) {
    document.body.classList.add("vc-sbt-card-only");
    var only = document.getElementById("vcSbtCardOnly");
    if (!only) return;
    var name = String(params.get("name") || params.get("seller") || "VibeCart seller").trim() || "VibeCart seller";
    var corridor = String(params.get("corridor") || "Your corridor").trim();
    var tagline = String(params.get("tagline") || "Shop the bridge — curated lane on VibeCart.").trim();
    var wa = String(params.get("wa") || "").replace(/\D/g, "");
    var cta = String(params.get("cta") || "./hot-picks.html").trim() || "./hot-picks.html";
    var ref = String(params.get("ref") || "").trim();
    var ctaHref = cta + (cta.indexOf("?") >= 0 ? "&" : "?") + "ref=" + encodeURIComponent(ref || "bridge");

    only.hidden = false;
    only.innerHTML =
      '<article class="vc-sbt-card">' +
      '<span class="vc-sbt-pill">VibeCart · bridge lane</span>' +
      "<h3>" +
      escapeHtml(name) +
      "</h3>" +
      '<p class="vc-sbt-meta">' +
      escapeHtml(corridor) +
      "</p>" +
      '<p class="note" style="margin:0 0 1rem">' +
      escapeHtml(tagline) +
      "</p>" +
      '<p class="hero-actions" style="margin:0;flex-wrap:wrap;gap:0.5rem">' +
      '<a class="btn btn-primary" href="' +
      escapeAttr(ctaHref) +
      '">Enter shop lane</a>' +
      (wa
        ? '<a class="btn btn-secondary" href="' +
          escapeAttr("https://wa.me/" + wa + "?text=" + encodeURIComponent("Hi — I'm messaging from your VibeCart bridge card.")) +
          '">WhatsApp</a>'
        : "") +
      '<a class="btn btn-secondary" href="' +
      escapeAttr(window.location.pathname || "./seller-bridge-toolkit.html") +
      '">Open link builder</a>' +
      "</p>" +
      (ref ? '<p class="note" style="margin-top:0.85rem;margin-bottom:0">Ref · ' + escapeHtml(ref) + "</p>" : "") +
      '<p class="note" style="margin-top:0.75rem;font-size:0.82rem">Shared preview card. Use “Open link builder” to copy links and edit fields.</p>' +
      "</article>";

    try {
      var link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.href.split("#")[0];
      document.head.appendChild(link);
    } catch {
      /* ignore */
    }
  }

  function bindToolkitEditors() {
    var nameEl = document.getElementById("vcSbtSellerName");
    var pitchEl = document.getElementById("vcSbtPitch");
    var refEl = document.getElementById("vcSbtRef");
    var waEl = document.getElementById("vcSbtWa");
    var ctaEl = document.getElementById("vcSbtCta");
    var outEl = document.getElementById("vcSbtLinkOut");
    var copyPreview = document.getElementById("vcSbtCopyAndPreview");
    var copyOnly = document.getElementById("vcSbtCopyLink");
    if (!nameEl || !pitchEl || !refEl || !waEl || !ctaEl || !outEl || !copyPreview || !copyOnly) {
      setBootMessage("Toolkit form is incomplete — hard refresh or re-open seller-bridge-toolkit.html from the repo.");
      return;
    }

    var refTouched = false;

    function slugRef(s) {
      var t = String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 28);
      return t || "seller";
    }

    nameEl.addEventListener("input", function () {
      if (refTouched) return;
      refEl.value = slugRef(nameEl.value);
    });
    refEl.addEventListener("input", function () {
      refTouched = true;
    });

    function baseUrl() {
      return window.location.origin + window.location.pathname;
    }

    function buildParams() {
      var q = new URLSearchParams();
      q.set("card", "1");
      q.set("name", String(nameEl.value || "").trim() || "VibeCart seller");
      var pitch = String(pitchEl.value || "").trim() || "Shop the bridge on VibeCart.";
      q.set("corridor", pitch);
      q.set("tagline", pitch);
      var ref = String(refEl.value || "").trim().replace(/[^a-zA-Z0-9-]/g, "") || "seller";
      q.set("ref", ref);
      var waDigits = String(waEl.value || "").replace(/\D/g, "");
      if (waDigits) q.set("wa", waDigits);
      q.set("cta", String(ctaEl.value || "./hot-picks.html").trim());
      return q;
    }

    function fullLink() {
      return baseUrl() + "?" + buildParams().toString();
    }

    var openWa = document.getElementById("vcSbtOpenWa");

    function revealOut(url) {
      outEl.textContent = url;
      outEl.hidden = false;
      if (openWa) {
        openWa.disabled = !String(waEl.value || "").replace(/\D/g, "");
      }
    }

    copyPreview.addEventListener("click", function () {
      var url = fullLink();
      revealOut(url);
      copyText(
        url,
        function () {
          try {
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            /* ignore */
          }
        },
        function () {
          try {
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            /* ignore */
          }
          window.prompt("Copy this link (Ctrl+C, Enter):", url);
        }
      );
    });

    copyOnly.addEventListener("click", function () {
      var url = outEl.hidden ? fullLink() : String(outEl.textContent || "").trim().split("\n")[0];
      copyText(
        url,
        function () {
          revealOut(url + "\n\n(copied)");
        },
        function () {
          window.prompt("Copy this link (Ctrl+C, Enter):", url);
        }
      );
    });

    var copyStatus = document.getElementById("vcSbtCopyStatus");
    if (copyStatus) {
      copyStatus.addEventListener("click", function () {
        var box = document.getElementById("vcSbtStatusCopy");
        var t = box ? box.textContent : "";
        copyText(
          t,
          function () {},
          function () {
            window.prompt("Copy (Ctrl+C, Enter):", t);
          }
        );
      });
    }

    var copyWa = document.getElementById("vcSbtCopyWa");
    if (copyWa) {
      copyWa.addEventListener("click", function () {
        var link = outEl.hidden ? fullLink() : String(outEl.textContent || "").trim().split("\n")[0];
        var ref = String(refEl.value || "").trim() || "your ref";
        var body =
          "Hey — here is my VibeCart bridge link for this week's drop / booking:\n" +
          link +
          "\n\nQuestions? Reply here. Ref: " +
          ref;
        copyText(
          body,
          function () {},
          function () {
            window.prompt("Copy (Ctrl+C, Enter):", body);
          }
        );
      });
    }

    if (openWa) {
      openWa.addEventListener("click", function () {
        var wa = String(waEl.value || "").replace(/\D/g, "");
        if (!wa) return;
        var link = outEl.hidden ? fullLink() : String(outEl.textContent || "").trim().split("\n")[0];
        var ref = String(refEl.value || "").trim() || "your ref";
        var body =
          "Hey — here is my VibeCart bridge link for this week's drop / booking:\n" +
          link +
          "\n\nQuestions? Reply here. Ref: " +
          ref;
        window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(body), "_blank", "noopener,noreferrer");
      });
    }

    var params = new URLSearchParams(window.location.search || "");
    if (params.get("name")) nameEl.value = params.get("name");
    if (params.get("tagline")) pitchEl.value = params.get("tagline");
    else if (params.get("corridor")) pitchEl.value = params.get("corridor");
    if (params.get("ref")) {
      refEl.value = params.get("ref");
      refTouched = true;
    }
    if (params.get("wa")) waEl.value = params.get("wa");
    if (params.get("cta")) ctaEl.value = params.get("cta");
    if (openWa && String(waEl.value || "").replace(/\D/g, "")) {
      openWa.disabled = false;
    }

    setBootMessage("");
  }

  function bootSellerBridgeToolkit() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      if (String(params.get("card") || "") === "1") {
        bootCardOnlyView(params);
        return;
      }
      bindToolkitEditors();
    } catch (err) {
      setBootMessage(String((err && err.message) || "Toolkit could not start."));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootSellerBridgeToolkit, { once: true });
  } else {
    bootSellerBridgeToolkit();
  }
})();
