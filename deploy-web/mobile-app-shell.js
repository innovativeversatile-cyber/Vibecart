/* VibeCart mobile WebView shell — runs when the native app sets class `vc-mobile-app` on <html>. */
(function () {
  const AI_ID = "vc-mobile-ai";

  function readApiBase() {
    try {
      const el = document.querySelector('meta[name="vibecart-api-base"]');
      const raw = el && el.getAttribute("content");
      const s = String(raw || "").trim();
      if (s && !/^disabled$/i.test(s)) {
        return s.replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
    try {
      if (
        typeof window !== "undefined" &&
        window.location &&
        /^https?:$/i.test(String(window.location.protocol || ""))
      ) {
        return String(window.location.origin || "").replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
    return "";
  }

  const TIPS = [
    "Swipe the vibe reel sideways — hot lanes surface faster when you explore diagonally.",
    "Open Regional folders first: less noise, one lane at a time.",
    "Save your bridge path (Europe ↔ Mama Africa) before checkout — it powers shipping hints.",
    "Use the Trade bridge tiles for live listings; external bubbles open in a new tab.",
    "Poland → Zimbabwe? Pick Mama Africa lane, then Trade bridge: checkout shows seller shipping options and legal lanes you must confirm.",
    "Cross-border fun, not chaos: banned categories stay off-limits; if a route looks too good, double-check duties in the listing notes.",
    "Tell us one thing to improve below — we fold your notes into the next app polish cycle.",
    "When the web shell flashes “Live sync”, the API merged both bridge paths — try switching Mama Africa ↔ Europe before you filter categories.",
    "After a seed or seller upload, pull-to-refresh mentally: reopen Hot Picks so the WebView picks up new SKUs without clearing site data."
  ];

  function ensureAiCoach() {
    if (document.getElementById(AI_ID)) {
      return;
    }
    const wrap = document.createElement("div");
    wrap.id = AI_ID;
    wrap.className = "vc-mobile-ai";
    wrap.innerHTML = `
      <button type="button" class="vc-mobile-ai__orb" aria-expanded="false" aria-controls="vc-mobile-ai-panel" title="VibeCoach tips">
        <span class="vc-mobile-ai__pulse"></span>
        <span class="vc-mobile-ai__label">AI</span>
      </button>
      <div id="vc-mobile-ai-panel" class="vc-mobile-ai__panel" hidden>
        <div class="vc-mobile-ai__head">
          <strong>VibeCoach</strong>
          <span class="vc-mobile-ai__sub">On-device tips · no auto-buy</span>
        </div>
        <p id="vc-mobile-ai-tip" class="vc-mobile-ai__tip"></p>
        <label class="vc-mobile-ai__lab" for="vc-mobile-ai-feedback">What should we improve next?</label>
        <textarea id="vc-mobile-ai-feedback" class="vc-mobile-ai__ta" rows="2" maxlength="400" placeholder="One sentence is enough…"></textarea>
        <button type="button" class="btn btn-primary vc-mobile-ai__save">Save to device</button>
        <p id="vc-mobile-ai-saved" class="note vc-mobile-ai__saved" hidden>Saved locally — thank you.</p>
      </div>
    `;
    document.body.appendChild(wrap);

    const orb = wrap.querySelector(".vc-mobile-ai__orb");
    const panel = wrap.querySelector(".vc-mobile-ai__panel");
    const tipEl = wrap.querySelector("#vc-mobile-ai-tip");
    const ta = wrap.querySelector("#vc-mobile-ai-feedback");
    const saveBtn = wrap.querySelector(".vc-mobile-ai__save");
    const saved = wrap.querySelector("#vc-mobile-ai-saved");
    let tipIdx = 0;

    function showTip() {
      if (tipEl) {
        tipEl.textContent = TIPS[tipIdx % TIPS.length];
        tipIdx += 1;
      }
    }

    showTip();
    setInterval(showTip, 14000);

    orb?.addEventListener("click", () => {
      const open = panel?.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        orb.setAttribute("aria-expanded", "true");
      } else {
        panel?.setAttribute("hidden", "hidden");
        orb.setAttribute("aria-expanded", "false");
      }
    });

    saveBtn?.addEventListener("click", () => {
      const text = (ta && ta.value) ? String(ta.value).trim() : "";
      if (!text) {
        return;
      }
      try {
        const key = "vibecart-mobile-ai-feedback-log";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push({ t: Date.now(), text });
        localStorage.setItem(key, JSON.stringify(prev.slice(-40)));
        ta.value = "";
        if (saved) {
          saved.hidden = false;
          setTimeout(() => {
            saved.hidden = true;
          }, 2400);
        }
      } catch {
        /* ignore */
      }

      const base = readApiBase();
      if (base && text.length >= 4) {
        const wid =
          typeof window !== "undefined" && window.__VC_INSTALL_ID__
            ? String(window.__VC_INSTALL_ID__).trim().slice(0, 64)
            : "";
        const payload = {
          text,
          locale: (document.documentElement.lang || navigator.language || "").slice(0, 20),
          pageUrl: typeof location !== "undefined" ? String(location.href).slice(0, 512) : ""
        };
        if (wid.length >= 4) {
          payload.installId = wid;
        }
        fetch(`${base}/api/public/mobile/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    });
  }

  function enhanceHero() {
    const hero = document.querySelector(".hero");
    if (!hero || hero.querySelector(".vc-mobile-hero-aurora")) {
      return;
    }
    const aurora = document.createElement("div");
    aurora.className = "vc-mobile-hero-aurora";
    aurora.setAttribute("aria-hidden", "true");
    hero.insertBefore(aurora, hero.firstChild);
  }

  function boot() {
    if (!document.documentElement.classList.contains("vc-mobile-app")) {
      return;
    }
    document.body.classList.add("vc-mobile-shell");
    ensureAiCoach();
    enhanceHero();
    window.addEventListener(
      "vibecart-live-catalog",
      (ev) => {
        const n = Number(ev && ev.detail && ev.detail.count);
        if (!Number.isFinite(n) || n <= 0) {
          return;
        }
        try {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([12, 36, 16]);
          }
        } catch {
          /* ignore */
        }
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
