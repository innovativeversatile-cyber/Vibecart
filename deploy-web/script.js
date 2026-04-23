"use strict";

(function removeLegacyReceiptRehearsalDom() {
  try {
    document.getElementById("vcReceiptRehearsal")?.remove();
    const skip = document.getElementById("vcSkipReceiptToggle");
    const row = skip?.closest?.(".settings-toggle") || skip?.closest?.("label");
    if (row) {
      row.remove();
    } else {
      skip?.remove();
    }
  } catch {
    /* ignore */
  }
})();

const categoryFilter = document.getElementById("categoryFilter");
const categoryCards = document.querySelectorAll("[data-filter]");
let products = Array.from(document.querySelectorAll(".product"));
const productsGrid = document.getElementById("products");
const bridgePathSwitch = document.getElementById("bridgePathSwitch");
const bridgePathStatus = document.getElementById("bridgePathStatus");
const bridgeShops = document.getElementById("bridgeShops");
const buyerDestinationSelect = document.getElementById("buyerDestinationSelect");
const buyerDestinationHint = document.getElementById("buyerDestinationHint");
const regionHeadline = document.getElementById("regionHeadline");
const marketMode = document.getElementById("marketMode");
const heroTitle = document.getElementById("heroTitle");
const heroBadge = document.getElementById("heroBadge");
const heroSubtitle = document.getElementById("heroSubtitle");
const bridgeTitle = document.getElementById("bridgeTitle");
const bridgeText = document.getElementById("bridgeText");
const messagesBox = document.getElementById("messagesBox");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const chatSafetyAlert = document.getElementById("chatSafetyAlert");
const aiNeed = document.getElementById("aiNeed");
const aiBudget = document.getElementById("aiBudget");
const aiCategory = document.getElementById("aiCategory");
const aiSuggest = document.getElementById("aiSuggest");
const aiResult = document.getElementById("aiResult");
const sgNiche = document.getElementById("sgNiche");
const sgRegion = document.getElementById("sgRegion");
const sgChannel = document.getElementById("sgChannel");
const sgOwnerName = document.getElementById("sgOwnerName");
const sgRunPlan = document.getElementById("sgRunPlan");
const sgPlanOut = document.getElementById("sgPlanOut");
const sgCount = document.getElementById("sgCount");
const sgMilestone = document.getElementById("sgMilestone");
const sgDec = document.getElementById("sgDec");
const sgInc = document.getElementById("sgInc");
const trackingTimeline = document.getElementById("trackingTimeline");
const nextTrackingStep = document.getElementById("nextTrackingStep");
const openReturnWindow = document.getElementById("openReturnWindow");
const returnWindowInfo = document.getElementById("returnWindowInfo");
const installAppBtn = document.getElementById("installAppBtn");
const expressCheckoutStatus = document.getElementById("expressCheckoutStatus");
const interactionMode = document.getElementById("interactionMode");
const siteLanguage = document.getElementById("siteLanguage");
const aiAssistantSection = document.getElementById("ai-assistant");
const communicationSection = document.getElementById("communication");
const trackingSection = document.getElementById("tracking");
const adSlots = document.getElementById("adSlots");
const refreshAds = document.getElementById("refreshAds");
const bookingServiceType = document.getElementById("bookingServiceType");
const bookingDate = document.getElementById("bookingDate");
const showBookingSlots = document.getElementById("showBookingSlots");
const bookingSlotsResult = document.getElementById("bookingSlotsResult");
const insurancePlans = document.getElementById("insurancePlans");
const refreshInsurance = document.getElementById("refreshInsurance");
const queueInsuranceTips = document.getElementById("queueInsuranceTips");
const wellbeingTips = document.getElementById("wellbeingTips");
const trustCards = document.getElementById("trustCards");
const trustSnapshotMeta = document.getElementById("trustSnapshotMeta");
const vcJurisdictionLine = document.getElementById("vcJurisdictionLine");
const vcJurisdictionExplain = document.getElementById("vcJurisdictionExplain");
const vcJurisdictionPanel = document.getElementById("vcJurisdictionPanel");
const vcPersonaHint = document.getElementById("vcPersonaHint");
const vcUiSoundToggle = document.getElementById("vcUiSoundToggle");
const vcRitualToggle = document.getElementById("vcRitualToggle");
const vcSignatureRitual = document.getElementById("vcSignatureRitual");
const vcRitualDismiss = document.getElementById("vcRitualDismiss");
const vcLaneNoteDate = document.getElementById("vcLaneNoteDate");
const marketLivePulse = document.getElementById("marketLivePulse");
const rewardTier = document.getElementById("rewardTier");
const rewardPoints = document.getElementById("rewardPoints");
const rewardStreak = document.getElementById("rewardStreak");
const rewardProgressBar = document.getElementById("rewardProgressBar");
const rewardStatus = document.getElementById("rewardStatus");
const earnRewardPoints = document.getElementById("earnRewardPoints");
const redeemReward = document.getElementById("redeemReward");
const openOnboarding = document.getElementById("openOnboarding");
const onboardingModal = document.getElementById("onboardingModal");
const onboardingText = document.getElementById("onboardingText");
const onboardingNext = document.getElementById("onboardingNext");
const onboardingClose = document.getElementById("onboardingClose");
const marketDisclaimerAck = document.getElementById("marketDisclaimerAck");
const insuranceDisclaimerAck = document.getElementById("insuranceDisclaimerAck");
const disclaimerGateModal = document.getElementById("disclaimerGateModal");
const disclaimerGateText = document.getElementById("disclaimerGateText");
const disclaimerGateContinue = document.getElementById("disclaimerGateContinue");
const disclaimerGateClose = document.getElementById("disclaimerGateClose");
const coachFocus = document.getElementById("coachFocus");
const coachGoalNotes = document.getElementById("coachGoalNotes");
const coachBaselineWeight = document.getElementById("coachBaselineWeight");
const coachTargetWeight = document.getElementById("coachTargetWeight");
const coachActivityGoal = document.getElementById("coachActivityGoal");
const saveCoachProfileBtn = document.getElementById("saveCoachProfile");
const healthCheckinType = document.getElementById("healthCheckinType");
const healthCheckinValue = document.getElementById("healthCheckinValue");
const healthCheckinNotes = document.getElementById("healthCheckinNotes");
const addHealthCheckinBtn = document.getElementById("addHealthCheckin");
const refreshCoachDashboardBtn = document.getElementById("refreshCoachDashboard");
const coachDashboard = document.getElementById("coachDashboard");
const wearableVendor = document.getElementById("wearableVendor");
const wearableDailyDigest = document.getElementById("wearableDailyDigest");
const wearableDetailedMetrics = document.getElementById("wearableDetailedMetrics");
const saveWearablePrefsBtn = document.getElementById("saveWearablePrefs");
const syncWearableDemoBtn = document.getElementById("syncWearableDemo");
const wearableLinkStatus = document.getElementById("wearableLinkStatus");
const SETTINGS_KEY = "vibecart-site-settings";
const INTERACTION_MODE_KEY = "vibecart-interaction-mode";
const AI_PERSONA_KEY = "vibecart-ai-persona";
const PERSONA_PATH_KEY = "vibecart-path-persona";
const UI_SOUND_KEY = "vibecart-ui-sound";
const RITUAL_ENABLED_KEY = "vibecart-ritual-enabled";
const RITUAL_SESSION_KEY = "vibecart-session-ritual-shown";
const BRIDGE_PASSPORT_STAMP_KEY = "vibecart-bridge-passport-stamp-v1";
const LISTING_HEALTH_KEY = "vibecart-listing-health-v1";
const SERENDIPITY_SESSION_KEY = "vibecart-serendipity-idx-v1";

const RADAR_HINTS = {
  en: [
    "Cross-list one hero SKU in both Europe and Mama Africa lanes to compare demand in each lane.",
    "Pair student pickup (campus) with tracked courier for higher trust scores on first orders.",
    "Bundle beauty + books in a themed cart campaign — composite AOV often beats single-category pushes.",
    "Surface insurance add-on at checkout for electronics above EUR 150 — fewer dispute losses.",
    "Localize policy footers per destination country; conversion lifts when legal text matches reader language."
  ],
  pl: [
    "Wystaw jeden hitowy SKU jednocześnie w Europie i Mama Africa, żeby zmierzyć popyt.",
    "Połącz odbiór kampusowy z kurierem śledzonym przy pierwszych zamówieniach.",
    "Zestaw kampanii kosmetyki + książki — wyższy koszyk niż pojedyncze kategorie.",
    "Dodaj ubezpieczenie przy elektronice >150 EUR — mniej strat przy sporach.",
    "Stopki polityk per kraj docelowy — wyższa konwersja, gdy język prawa = język czytelnika."
  ],
  fr: [
    "Lister un SKU phare Europe + Mama Africa pour tester l’élasticité.",
    "Coupler retrait campus + colis suivi pour les premières commandes.",
    "Campagne panier beauté + livres — panier moyen souvent plus haut.",
    "Assurance à checkout >150 EUR électronique — moins de litiges.",
    "Pieds de page juridiques localisés — meilleure conversion."
  ],
  pt: [
    "Publique um SKU herói na Europa e Mama Africa para testar procura.",
    "Combine recolha no campus com courier rastreado nas primeiras encomendas.",
    "Campanha carrinho beleza + livros — ticket médio costuma subir.",
    "Seguro no checkout para eletrónica >150 EUR — menos disputas.",
    "Rodapés legais por país — mais conversão quando o idioma coincide."
  ],
  sw: [
    "Weka bidhaa moja mashuhuri Ulaya na Mama Africa upime mahitaji.",
    "Changanya pickup chuo na uwasilishaji unaofuatiliwa kwa agizo la kwanza.",
    "Kampeni ya cart ya urembo + vitabu — thamani ya wastani inaweza kupanda.",
    "Bima kwenye checkout kwa elektroniki >150 EUR — migogoro midogo.",
    "Vijedwali vya sera kwa nchi — mabadiliko makubwa wakati lugha inalingana."
  ],
  ar: [
    "اعرض SKU واحدًا بارزًا في أوروبا و«ماما أفريكا» لقياس الطلب.",
    "اجمع الاستلام الجامعي مع تتبع الشحن للطلبات الأولى.",
    "حملة سلة: تجميل + كتب — غالبًا يرتفع متوسط قيمة الطلب.",
    "تأمين عند الدفع للإلكترونيات فوق 150 يورو — نزاعات أقل.",
    "تذييلات سياسات حسب البلد — تحسين التحويل عند تطابق اللغة."
  ]
};
const REWARD_KEY = "vibecart-reward-profile";
const ONBOARDING_KEY = "vibecart-onboarding-done";
const SELLER_ONBOARDED_KEY = "vibecart-seller-onboarded-count";
const QUICK_BUY_TOKEN_KEY = "vibecart-quick-buy-token";
const QUICK_BUY_EMAIL_KEY = "vibecart-quick-buy-email";
const QUICK_BUY_PASSWORD_KEY = "vibecart-quick-buy-password";
const WEARABLE_PREF_KEY = "vibecart-wearable-prefs";
const COACH_ENTITLEMENTS_CACHE_KEY = "vibecart-coach-entitlements-v1";
const COACH_AUTO_RENEW_KEY = "vibecart-coach-auto-renew-v1";
const PREMIUM_AUTO_RENEW_KEY = "vibecart-premium-auto-renew-v1";
let coachMonetizationState = null;
let coachEntitlements = new Set();
const BRIDGE_JUMP_ALLOW_KEY = "vibecart-allow-bridge-jump-once";
const BRIDGE_TARGET_IDS = new Set(["bridge-routes", "bridgeTitle", "bridgeText", "bridgeShops"]);
const AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
const HOMEPAGE_TRAFFIC_GROWTH_KEY = "vibecart-homepage-traffic-growth-v1";
const HOMEPAGE_PROMOTED_OFFERS_LIMIT = 4;

function trackAffiliateClick(payload) {
  try {
    localStorage.setItem(
      AFFILIATE_LAST_CLICK_KEY,
      JSON.stringify({
        at: new Date().toISOString(),
        source: String(payload?.source || "unknown"),
        shop: String(payload?.shop || ""),
        target: String(payload?.target || ""),
        commissionEligible: Boolean(payload?.commissionEligible)
      })
    );
  } catch {
    /* ignore */
  }
}

function isCommissionTrackedUrl(url) {
  try {
    var parsed = new URL(String(url || ""));
    if (!/^https?:$/i.test(parsed.protocol)) return false;
    var keys = ["tag", "ref", "aff", "affiliate", "affid", "subid", "clickid", "irclickid", "pub_id", "publisher_id"];
    for (var i = 0; i < keys.length; i += 1) {
      if (parsed.searchParams.get(keys[i])) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function applyPromotedHomepageOffers(settings) {
  const cards = Array.from(document.querySelectorAll("#products .product"));
  if (!cards.length) {
    return;
  }
  const raw = Array.isArray(settings?.homeFeaturedOffers) ? settings.homeFeaturedOffers : [];
  const promoted = raw
    .map((entry) => ({
      offerName: String(entry?.offerName || "").trim(),
      programName: String(entry?.programName || "").trim(),
      url: String(entry?.url || "").trim(),
      status: String(entry?.status || "traffic_only").trim()
    }))
    .filter((entry) => entry.offerName && entry.url)
    .slice(0, HOMEPAGE_PROMOTED_OFFERS_LIMIT);
  if (!promoted.length) {
    return;
  }
  promoted.forEach((offer, idx) => {
    const card = cards[idx];
    if (!card) {
      return;
    }
    const titleNode = card.querySelector("h3");
    if (titleNode) {
      titleNode.textContent = offer.offerName;
    }
    const button = card.querySelector(".buy-now-btn");
    if (button) {
      button.setAttribute("data-title", offer.offerName);
      button.setAttribute("data-shop-name", offer.offerName);
      button.setAttribute("data-shop-url", offer.url);
    }
    const noteNode = card.querySelector("p.note");
    if (noteNode) {
      const tracked = offer.status === "commission_enabled" || isCommissionTrackedUrl(offer.url);
      noteNode.textContent = tracked
        ? "External checkout on source site. Commission-enabled partner."
        : "External checkout on source site. Traffic-only partner.";
    }
    const detailNodes = Array.from(card.querySelectorAll("p")).filter((p) => !p.classList.contains("price") && !p.classList.contains("note"));
    const detail = detailNodes.length ? detailNodes[0] : null;
    if (detail) {
      detail.textContent = `Featured from ${offer.programName || "Affiliate partner"} lane.`;
    }
  });
}

function trackHomepageTrafficEvent(eventName, targetLabel) {
  try {
    const raw = localStorage.getItem(HOMEPAGE_TRAFFIC_GROWTH_KEY);
    const curr = raw ? JSON.parse(raw) : {};
    const byEvent = curr.byEvent && typeof curr.byEvent === "object" ? curr.byEvent : {};
    const byTarget = curr.byTarget && typeof curr.byTarget === "object" ? curr.byTarget : {};
    const eventKey = String(eventName || "unknown").slice(0, 64);
    const targetKey = String(targetLabel || "unknown").slice(0, 120);
    byEvent[eventKey] = Number(byEvent[eventKey] || 0) + 1;
    byTarget[targetKey] = Number(byTarget[targetKey] || 0) + 1;
    const next = {
      total: Number(curr.total || 0) + 1,
      byEvent,
      byTarget,
      lastAt: new Date().toISOString()
    };
    localStorage.setItem(HOMEPAGE_TRAFFIC_GROWTH_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function initHomepageTrafficSignals() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const buyBtn = target.closest(".buy-now-btn");
    if (buyBtn) {
      trackHomepageTrafficEvent(
        "buy_now_click",
        String(buyBtn.getAttribute("data-shop-name") || buyBtn.getAttribute("data-title") || "homepage-offer")
      );
      return;
    }
    const link = target.closest("a[href]");
    if (!link) return;
    const href = String(link.getAttribute("href") || "").trim().toLowerCase();
    if (!href) return;
    if (href.includes("hot-picks.html")) {
      trackHomepageTrafficEvent("hot_picks_click", href);
      return;
    }
    if (href.includes("world-shop-experience.html")) {
      trackHomepageTrafficEvent("world_shop_experience_click", href);
      return;
    }
    if (href.includes("live-market-shops.html")) {
      trackHomepageTrafficEvent("live_market_shops_click", href);
    }
  });
}

function clearLegacyBridgeNavOverlays() {
  document.getElementById("vcCinematicFloatingMap")?.remove();
  document.getElementById("vcCinematicCueRail")?.remove();
  document.getElementById("vcCinematicPullHint")?.remove();
  document.body.classList.remove("vc-cinematic-map-on");
}

function allowOneBridgeJump() {
  try {
    sessionStorage.setItem(BRIDGE_JUMP_ALLOW_KEY, "1");
  } catch {
    /* ignore */
  }
}

function consumeBridgeJumpAllowance() {
  try {
    const ok = sessionStorage.getItem(BRIDGE_JUMP_ALLOW_KEY) === "1";
    if (ok) {
      sessionStorage.removeItem(BRIDGE_JUMP_ALLOW_KEY);
    }
    return ok;
  } catch {
    return false;
  }
}

function initBridgeAntiHijackGuard() {
  clearLegacyBridgeNavOverlays();
  // Hard guard: block programmatic bridge auto-scroll unless explicitly allowed.
  try {
    const proto = window.Element && window.Element.prototype;
    if (proto && typeof proto.scrollIntoView === "function" && !proto.__vcBridgeGuardPatched) {
      const nativeScrollIntoView = proto.scrollIntoView;
      Object.defineProperty(proto, "__vcBridgeGuardPatched", { value: true, configurable: true });
      proto.scrollIntoView = function patchedScrollIntoView(...args) {
        try {
          const id = String(this && this.id ? this.id : "");
          if (BRIDGE_TARGET_IDS.has(id) && !consumeBridgeJumpAllowance()) {
            return;
          }
        } catch {
          /* ignore */
        }
        return nativeScrollIntoView.apply(this, args);
      };
    }
  } catch {
    /* ignore */
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      const anchor = target && target.closest ? target.closest("a[href]") : null;
      if (!anchor) {
        return;
      }
      const href = String(anchor.getAttribute("href") || "");
      const samePageBridgeJump = href === "#bridge-routes" || href.endsWith("/index.html#bridge-routes") || href === "./index.html#bridge-routes";
      const bridgeHubJump = href.includes("bridge-hub.html");
      if (!samePageBridgeJump && !bridgeHubJump) {
        return;
      }
      // Allow only explicit bridge CTA links to jump; block accidental overlay hits.
      const explicit = anchor.hasAttribute("data-allow-bridge-nav");
      if (explicit) {
        allowOneBridgeJump();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  window.addEventListener("hashchange", () => {
    if (window.location.hash !== "#bridge-routes") {
      return;
    }
    if (consumeBridgeJumpAllowance()) {
      return;
    }
    try {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    } catch {
      /* ignore */
    }
  });
}

function initGlobalTapHijackGuard() {
  const blockIfSuspicious = (event) => {
    const target = event.target;
    const anchor = target && target.closest ? target.closest("a[href]") : null;
    if (!anchor) {
      return;
    }
    const href = String(anchor.getAttribute("href") || "");
    const isBridgeHref = href === "#bridge-routes" || href === "./index.html#bridge-routes" || href.endsWith("/index.html#bridge-routes");
    const explicit = anchor.hasAttribute("data-allow-bridge-nav");
    if (isBridgeHref && !explicit) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }
  };
  document.addEventListener("click", blockIfSuspicious, true);
}

function initFashionTrendsRouteGuard() {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      const anchor = target && target.closest ? target.closest("a[href]") : null;
      if (!anchor) {
        return;
      }
      const href = String(anchor.getAttribute("href") || "");
      if (!href.includes("fashion-trends.html")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      window.location.assign("./fashion-trends.html");
    },
    true
  );
}

function initLanguageControlShield() {
  if (!siteLanguage) {
    return;
  }
  const topbarLang = siteLanguage.closest(".topbar-lang");
  const halt = (event) => {
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
  };
  ["pointerdown", "touchstart", "mousedown", "mouseup", "click"].forEach((type) => {
    siteLanguage.addEventListener(type, halt, true);
    topbarLang?.addEventListener(type, halt, true);
  });
}

function initTopbarSearchShield() {
  var form = document.getElementById("shopSearchForm");
  if (!form) {
    return;
  }
  var controls = [form, document.getElementById("shopSearchInput"), form.querySelector("button[type='submit']")].filter(Boolean);
  var halt = function (event) {
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
  };
  ["pointerdown", "touchstart", "mousedown", "mouseup", "click"].forEach(function (type) {
    controls.forEach(function (el) {
      el.addEventListener(type, halt, true);
    });
  });
  form.addEventListener(
    "submit",
    function (event) {
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

function initScrollPositionRestore() {
  var key = "vibecart-scroll-y:" + String(window.location.pathname || "/");
  var navFlag = "vibecart-restore-next";
  try {
    var navEntries = performance && performance.getEntriesByType ? performance.getEntriesByType("navigation") : [];
    var navType = navEntries && navEntries[0] ? String(navEntries[0].type || "") : "";
    var shouldRestore = navType === "back_forward" || sessionStorage.getItem(navFlag) === "1";
    if (shouldRestore) {
      var rawY = sessionStorage.getItem(key);
      var y = Number(rawY || "0");
      if (Number.isFinite(y) && y > 0) {
        window.setTimeout(function () {
          window.scrollTo({ top: y, left: 0, behavior: "auto" });
        }, 0);
      }
    }
    sessionStorage.removeItem(navFlag);
  } catch {
    /* ignore */
  }

  window.addEventListener(
    "scroll",
    function () {
      try {
        sessionStorage.setItem(key, String(Math.max(0, Math.round(window.scrollY || 0))));
      } catch {
        /* ignore */
      }
    },
    { passive: true }
  );

  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest("a[href]") : null;
      if (!anchor) {
        return;
      }
      var href = String(anchor.getAttribute("href") || "").trim();
      if (!href || href[0] === "#" || /^javascript:/i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)) {
        return;
      }
      try {
        sessionStorage.setItem(key, String(Math.max(0, Math.round(window.scrollY || 0))));
        sessionStorage.setItem(navFlag, "1");
      } catch {
        /* ignore */
      }
    },
    true
  );
}
const NIGHT_NEON_KEY = "vibecart-night-neon-mode-v1";
let pendingDisclaimerAction = null;
let pendingDisclaimerCheckbox = null;
let disclaimerWatchdogTimer = null;
const PUBLIC_USER_KEY = "vibecart-public-user-id";
const PUBLIC_AUTH_TOKEN_KEY = "vibecart-public-auth-token";
const PUBLIC_AUTH_USER_KEY = "vibecart-public-auth-user";
const PUBLIC_AUTH_JOURNEY_KEY = "vibecart-public-auth-journey";
const easterKeyBuffer = [];
const AFRICA_ORIGIN_CODES = new Set(["ZA", "KE", "NG", "GH", "ZW", "NA", "ET", "TZ", "UG", "RW", "BW", "ZM"]);
const EUROPE_ORIGIN_CODES = new Set(["PL", "DE", "FR", "ES", "IT", "NL", "BE", "PT", "SE", "NO", "DK", "FI", "IE", "AT", "CZ", "HU", "RO", "GR", "CH", "GB"]);
const BRIDGE_PATH_KEY = "vibecart-bridge-path";
const BUYER_DESTINATION_KEY = "vibecart-buyer-destination";
const VIBE_PASSPORT_KEY = "vibecart-vibe-passport";
const VIBE_GOLDEN_STAMP_KEY = "vibecart-vibe-golden-stamp";
const VIBE_VIP_KEY = "vibecart-vibe-vip-v1";

function hashVcDailySeed(input) {
  let h = 2166136261;
  const s = String(input || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrlHref(href) {
  const s = String(href || "").trim();
  const lower = s.toLowerCase();
  if (!s || lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return "#";
  }
  return s;
}

(() => {
  try {
    localStorage.removeItem(QUICK_BUY_EMAIL_KEY);
    localStorage.removeItem(QUICK_BUY_PASSWORD_KEY);
    const legacyToken = localStorage.getItem(QUICK_BUY_TOKEN_KEY);
    if (legacyToken) {
      sessionStorage.setItem(QUICK_BUY_TOKEN_KEY, legacyToken);
      localStorage.removeItem(QUICK_BUY_TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
})();

(function initVcPhoneClass() {
  function apply() {
    try {
      const narrow = window.matchMedia("(max-width: 900px)").matches;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      document.documentElement.classList.toggle("vc-phone", narrow || coarse);
    } catch {
      /* ignore */
    }
  }
  apply();
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    window.addEventListener("resize", apply, { passive: true });
    const mq1 = window.matchMedia("(max-width: 900px)");
    const mq2 = window.matchMedia("(pointer: coarse)");
    if (typeof mq1.addEventListener === "function") {
      mq1.addEventListener("change", apply);
      mq2.addEventListener("change", apply);
    } else if (typeof mq1.addListener === "function") {
      mq1.addListener(apply);
      mq2.addListener(apply);
    }
  }
})();

function getVcRegionKeyFromCard(card) {
  const raw = String(card?.getAttribute("data-vc-region") || "").trim();
  if (raw) {
    return raw;
  }
  const href = String(card?.getAttribute("href") || "");
  if (href.includes("mama-africa")) {
    return "mama-africa";
  }
  if (href.includes("europe")) {
    return "europe";
  }
  if (href.includes("asia")) {
    return "asia";
  }
  if (href.includes("scents")) {
    return "scents";
  }
  if (href.includes("global")) {
    return "global";
  }
  return "europe";
}

function pickDailyFortune(regionKey, chronoBand) {
  const band = String(chronoBand || "day");
  const pool = ROUTE_FORTUNE_TABLE[regionKey]?.[band] || ROUTE_FORTUNE_TABLE.europe[band] || ROUTE_FORTUNE_TABLE.europe.day;
  const d = new Date();
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const idx = hashVcDailySeed(`${dateKey}|${regionKey}|${band}`) % pool.length;
  return pool[idx];
}

const ROUTE_FORTUNE_TABLE = {
  europe: {
    dawn: [
      "Today's whisper: a crisp EU morning favors careful listings — polish your photos before the rush.",
      "Route luck: UK–EU lanes feel cooperative at dawn; message sellers early.",
      "Dawn fortune: small bundles across borders compound faster than single heavy carts."
    ],
    day: [
      "Midday momentum: continental demand peaks for practical gear and study essentials.",
      "Day route: transparency in shipping estimates converts browsers in the EU cluster.",
      "Bright-hour tip: cross-list one hero SKU in two EU countries to read the spread."
    ],
    dusk: [
      "Dusk signal: sentimental buys tick up — lifestyle and gifts love golden hour.",
      "Evening fortune: Irish and UK readers reward clear return windows.",
      "Sunset route: pair fashion with books for warmer average carts."
    ],
    night: [
      "Night oracle: patient buyers hunt rare electronics; detail your condition notes.",
      "Late route: neon-hour window-shoppers want trust badges and escrow cues.",
      "Moonlit lane: niche fragrances find curious clicks after dark."
    ]
  },
  "mama-africa": {
    dawn: [
      "Dawn over Mama Africa: campus pickups and tracked couriers build first-order trust.",
      "Early route: Nairobi–Joburg curiosity is high — answer chats within minutes.",
      "Sunrise fortune: bundle beauty with books for playful cart chemistry."
    ],
    day: [
      "Daylight bridge: ZA and NG lanes reward honest duty notes on cross-border SKUs.",
      "Afternoon luck: highlight warranty clarity on electronics above local norms.",
      "Solar route: student cities love hybrid delivery (pickup + courier)."
    ],
    dusk: [
      "Dusk rhythm: family shoppers scan home goods — show scale in photos.",
      "Golden hour: Ghana and Kenya clicks favor sellers who localize policy footers.",
      "Evening tide: seasonal fashion moves faster with modeled shots."
    ],
    night: [
      "Night pulse: insomniac collectors watch vintage tech — list quirks proudly.",
      "Late bridge: discreet chat tone wins insurance add-ons on valuable parcels.",
      "Starlight: cross-lane curiosity spikes for Gulf-bridge teasers."
    ]
  },
  asia: {
    dawn: [
      "Dawn monsoon calm: SEA early birds compare shipping tiers — show all options.",
      "Morning route: Dubai bridge keywords lift when you mention tracked air.",
      "First light: Japan–Korea authenticity cues matter for collectibles."
    ],
    day: [
      "Day heat: Gulf and India traffic loves concise duty estimates.",
      "Midday fortune: cross-border beauty needs ingredient clarity.",
      "Solar lane: China cluster shoppers reward fast seller response times."
    ],
    dusk: [
      "Dusk haze: impulse gifts rise — pair scents with stationery.",
      "Twilight: Middle East evening scrollers favor bilingual titles.",
      "Sunset: Korea gaming accessories spike when bundles include cables."
    ],
    night: [
      "Night market energy: niche tools and hobby parts shine after hours.",
      "Moon route: insure electronics parcels boldly; night buyers read fine print.",
      "Late tide: Dubai window shoppers want delivery date ranges, not vague weeks."
    ]
  },
  scents: {
    dawn: [
      "Dawn mist: light florals and clean citruses win the first scroll of the day.",
      "Morning aura: note pyramids in descriptions reduce sample-to-cart hesitation.",
      "Sunrise scent luck: travel sprays outperform heavy bottles at dawn."
    ],
    day: [
      "Day bloom: niche houses convert when batch codes are photographed.",
      "Afternoon spritz: duos (wash + perfume) lift average order value.",
      "Bright hour: cooling aquatics trend in warm regions — tag climate hints."
    ],
    dusk: [
      "Dusk velvet: ambers and woods feel cinematic — lean into story copy.",
      "Golden hour: discovery sets beat single SKUs for hesitant buyers.",
      "Sunset musk: gift wrap toggles nudge premium conversions."
    ],
    night: [
      "Night oud: collectors read longevity notes — be specific, not poetic only.",
      "Moonlit musk: limited runs should show fill levels and storage.",
      "Late bloom: cross-region buyers compare VAT — state inclusive/exclusive clearly."
    ]
  },
  global: {
    dawn: [
      "Dawn brands: flagship SKUs with crisp UPC data surface better in search.",
      "Early global lane: vintage picks need era tags and flaw photos.",
      "Sunrise: marketplace power sellers win with bundle SKUs."
    ],
    day: [
      "Day mainstream: free returns messaging lifts fashion conversion.",
      "Afternoon: tech SKUs need serial policy clarity for global buyers.",
      "Solar: omnichannel hints (pickup vs ship) reduce cart anxiety."
    ],
    dusk: [
      "Dusk resale: authenticity cards move luxury accessories faster.",
      "Twilight global: seasonal palettes shift — tag hemisphere.",
      "Evening: limited drops should show countdown integrity."
    ],
    night: [
      "Night global: insomniac pros compare seller ratings across regions.",
      "Moon brands: warranty localization wins on electronics.",
      "Late lane: transparent repair history sells refurbished tech."
    ]
  }
};

function unlockVibeVip(reason, opts) {
  const announce = !opts || opts.announce !== false;
  const was = localStorage.getItem(VIBE_VIP_KEY) === "1";
  localStorage.setItem(VIBE_VIP_KEY, "1");
  document.body.classList.add("vc-vip-mode");
  const ribbon = document.getElementById("vcVipRibbon");
  if (ribbon) {
    ribbon.classList.remove("hidden");
  }
  if (expressCheckoutStatus && !was && announce) {
    const tag = reason ? ` (${reason})` : "";
    expressCheckoutStatus.textContent = `VIP lane unlocked${tag} — constellation glow and calmer chrome.`;
  }
}

function restoreVibeVip() {
  if (localStorage.getItem(VIBE_VIP_KEY) !== "1") {
    return;
  }
  document.body.classList.add("vc-vip-mode");
  const ribbon = document.getElementById("vcVipRibbon");
  if (ribbon) {
    ribbon.classList.remove("hidden");
  }
}

function initVibeVipSecrets() {
  restoreVibeVip();
  const mark = document.querySelector(".brand-mark");
  const tapWindowMs = 2600;
  let brandTaps = [];
  if (mark) {
    mark.addEventListener("click", () => {
      const now = Date.now();
      brandTaps = brandTaps.filter((t) => now - t < tapWindowMs);
      brandTaps.push(now);
      if (brandTaps.length >= 5) {
        brandTaps = [];
        if (localStorage.getItem(VIBE_VIP_KEY) !== "1") {
          unlockVibeVip("brand rhythm");
        }
      }
    });
  }
  const chips = Array.from(document.querySelectorAll(".region-chip[data-vc-chip-order]"));
  let seq = 0;
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const want = seq + 1;
      const got = Number(chip.getAttribute("data-vc-chip-order") || "0");
      if (got === 1) {
        seq = 1;
      } else if (got === want) {
        seq = want;
      } else {
        seq = 0;
        return;
      }
      if (seq >= 5 && localStorage.getItem(VIBE_VIP_KEY) !== "1") {
        seq = 0;
        unlockVibeVip("region constellation");
      }
    });
  });
}

function initPremiumSubscriptionExperience() {
  const root = document.getElementById("topClassExperience");
  const activateBtn = document.getElementById("activatePremiumExperience");
  const autoRenewInput = document.getElementById("premiumAutoRenew");
  const renewStatus = document.getElementById("premiumRenewStatus");
  const priceChip = document.getElementById("premiumPlanPriceChip");
  const lead = document.getElementById("premiumPlanLead");
  if (!root) {
    return;
  }
  let settings = { enabled: "1", price: 39.99, benefits: "" };
  try {
    const stored = JSON.parse(localStorage.getItem("vibecart-public-premium-plan-v1") || "{}");
    settings = {
      enabled: String(stored.enabled || "1"),
      price: Number(stored.price || 39.99),
      benefits: String(stored.benefits || "")
    };
  } catch {
    /* ignore */
  }
  if (settings.enabled !== "1") {
    root.classList.add("hidden");
    return;
  }
  if (priceChip) {
    priceChip.textContent = `EUR ${Math.max(1, Number(settings.price || 39.99)).toFixed(2)} / month`;
  }
  if (lead && settings.benefits) {
    lead.textContent = settings.benefits;
  }
  if (autoRenewInput) {
    var savedPremiumAutoRenew = localStorage.getItem(PREMIUM_AUTO_RENEW_KEY);
    autoRenewInput.checked = savedPremiumAutoRenew === null ? true : savedPremiumAutoRenew === "1";
    autoRenewInput.addEventListener("change", function () {
      localStorage.setItem(PREMIUM_AUTO_RENEW_KEY, autoRenewInput.checked ? "1" : "0");
      if (renewStatus) {
        renewStatus.textContent = autoRenewInput.checked
          ? "Automatic renewal is enabled for the top-class subscription."
          : "Automatic renewal is off. You can still renew manually anytime.";
      }
    });
    if (renewStatus) {
      renewStatus.textContent = autoRenewInput.checked
        ? "Automatic renewal is enabled for the top-class subscription."
        : "Automatic renewal is off. You can still renew manually anytime.";
    }
  }
  if (activateBtn) {
    activateBtn.addEventListener("click", () => {
      var autoRenew = autoRenewInput ? !!autoRenewInput.checked : true;
      localStorage.setItem(PREMIUM_AUTO_RENEW_KEY, autoRenew ? "1" : "0");
      unlockVibeVip("top-class subscription");
      if (expressCheckoutStatus) {
        expressCheckoutStatus.textContent = "Top-class experience activated. AI concierge and luxury lane are now live.";
      }
      if (renewStatus) {
        renewStatus.textContent = autoRenew
          ? "Top-class active with automatic renewal enabled."
          : "Top-class active with manual renewal preference.";
      }
      activateBtn.textContent = "Top-Class Activated";
      activateBtn.classList.remove("btn-primary");
      activateBtn.classList.add("btn-secondary");
    });
  }
}

function initShopFolderConstellation() {
  const wrap = document.querySelector(".shop-folder-experience");
  const svg = document.getElementById("shopFolderConstellation");
  const row = document.querySelector(".shop-folder-landing");
  if (!wrap || !svg || !row) {
    return;
  }
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || vcShouldReduceScrollEffects()) {
    return;
  }
  const cards = Array.from(row.querySelectorAll(".shop-folder-card"));
  if (!cards.length) {
    return;
  }
  let hovered = null;
  let touchTimer = 0;
  let leaveTimer = 0;

  const sizeSvg = () => {
    const w = Math.max(1, wrap.clientWidth);
    const h = Math.max(1, wrap.clientHeight);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  };

  const draw = () => {
    sizeSvg();
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    if (!hovered) {
      return;
    }
    const idx = cards.indexOf(hovered);
    if (idx < 0) {
      return;
    }
    const wrapRect = wrap.getBoundingClientRect();
    const centerOf = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width * 0.5 - wrapRect.left,
        y: r.top + r.height * 0.5 - wrapRect.top
      };
    };
    const from = centerOf(hovered);
    const neighbors = [idx - 1, idx + 1].filter((i) => i >= 0 && i < cards.length);
    neighbors.forEach((j) => {
      const to = centerOf(cards[j]);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(from.x));
      line.setAttribute("y1", String(from.y));
      line.setAttribute("x2", String(to.x));
      line.setAttribute("y2", String(to.y));
      line.setAttribute("class", "shop-folder-constellation-line");
      svg.appendChild(line);
    });
    [from, ...neighbors.map((j) => centerOf(cards[j]))].forEach((pt) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", String(pt.x));
      c.setAttribute("cy", String(pt.y));
      c.setAttribute("r", "3.2");
      c.setAttribute("class", "shop-folder-constellation-node");
      svg.appendChild(c);
    });
  };

  const setHover = (card) => {
    if (leaveTimer) {
      window.clearTimeout(leaveTimer);
      leaveTimer = 0;
    }
    hovered = card;
    draw();
  };

  cards.forEach((card) => {
    card.addEventListener(
      "pointerenter",
      () => {
        setHover(card);
      },
      { passive: true }
    );
    card.addEventListener(
      "pointerleave",
      () => {
        if (hovered !== card) {
          return;
        }
        if (leaveTimer) {
          window.clearTimeout(leaveTimer);
        }
        leaveTimer = window.setTimeout(() => {
          leaveTimer = 0;
          if (hovered === card) {
            hovered = null;
            draw();
          }
        }, 45);
      },
      { passive: true }
    );
    card.addEventListener(
      "touchstart",
      () => {
        setHover(card);
        if (touchTimer) {
          window.clearTimeout(touchTimer);
        }
        touchTimer = window.setTimeout(() => {
          hovered = null;
          draw();
        }, 900);
      },
      { passive: true }
    );
  });
  row.addEventListener("scroll", draw, { passive: true });
  window.addEventListener("resize", draw, { passive: true });
  draw();
}

function initDailyRouteFortune() {
  const el = document.getElementById("vibeRouteFortune");
  if (!el) {
    return;
  }
  const row = document.querySelector(".shop-folder-landing");
  const cards = row ? Array.from(row.querySelectorAll(".shop-folder-card")) : [];
  const chrono = () => String(document.body.getAttribute("data-vc-chronotope") || "day");
  const renderForCard = (card) => {
    const region = getVcRegionKeyFromCard(card);
    el.textContent = pickDailyFortune(region, chrono());
  };
  const renderDefault = () => {
    const band = chrono();
    const d = new Date();
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const general = ROUTE_FORTUNE_TABLE.europe[band] || ROUTE_FORTUNE_TABLE.europe.day;
    const idx = hashVcDailySeed(`${dateKey}|orbit|${band}`) % general.length;
    el.textContent = `Daily route oracle · ${general[idx]} Hover a folder for a lane-specific reading.`;
  };
  renderDefault();
  cards.forEach((card) => {
    card.addEventListener(
      "pointerenter",
      () => renderForCard(card),
      { passive: true }
    );
    card.addEventListener(
      "focus",
      () => renderForCard(card)
    );
    card.addEventListener(
      "touchstart",
      () => renderForCard(card),
      { passive: true }
    );
  });
}
let activeBridgePath = localStorage.getItem(BRIDGE_PATH_KEY) || "from-europe";
let liveMarketplaceCache = [];

function getPublicUserId() {
  const stored = Number(localStorage.getItem(PUBLIC_USER_KEY) || "0");
  if (stored > 0) {
    return stored;
  }
  const generated = Math.floor(Math.random() * 900000) + 100000;
  localStorage.setItem(PUBLIC_USER_KEY, String(generated));
  return generated;
}

function inferCategoryFromTitle(title) {
  const text = String(title || "").toLowerCase();
  if (/phone|laptop|camera|tablet|headset|controller|gaming|console|tech|electronic/.test(text)) {
    return "Electronics";
  }
  if (/fashion|hoodie|dress|shoe|sneaker|wear|streetwear|bag/.test(text)) {
    return "Fashion";
  }
  if (/book|textbook|guide|course|manual/.test(text)) {
    return "Books";
  }
  if (/game|gaming|controller|joystick/.test(text)) {
    return "Gaming";
  }
  return "Electronics";
}

function classifyBridgePath(originCountry) {
  const code = String(originCountry || "").trim().toUpperCase();
  if (AFRICA_ORIGIN_CODES.has(code)) {
    return "from-africa";
  }
  if (EUROPE_ORIGIN_CODES.has(code)) {
    return "from-europe";
  }
  return "other";
}

function getPathLabel(path) {
  return path === "from-africa" ? "Mama Africa to Europe" : "From Europe to Africa";
}

function getBuyerCountryCode() {
  const destination = String(localStorage.getItem(BUYER_DESTINATION_KEY) || "africa").toLowerCase();
  return destination === "europe" ? "PL" : "ZA";
}

function getBuyerShippingMethod() {
  const destination = String(localStorage.getItem(BUYER_DESTINATION_KEY) || "africa").toLowerCase();
  return destination === "europe" ? "priority-eu-lane" : "express-africa-lane";
}

function getBuyerDestinationLabel() {
  const destination = String(localStorage.getItem(BUYER_DESTINATION_KEY) || "africa").toLowerCase();
  return destination === "europe" ? "Europe buyer" : "Africa buyer";
}

function updateBuyerDestinationHint() {
  if (!buyerDestinationHint) {
    return;
  }
  const destination = String(localStorage.getItem(BUYER_DESTINATION_KEY) || "africa").toLowerCase();
  if (destination === "europe") {
    buyerDestinationHint.textContent = "Checkout defaults: Europe buyer (country PL), priority EU lane shipping.";
  } else {
    buyerDestinationHint.textContent = "Checkout defaults: Africa buyer (country ZA), express Africa lane shipping.";
  }
  updateJurisdictionStrip();
}

function updateJurisdictionStrip() {
  if (!vcJurisdictionLine) {
    return;
  }
  const route = getPathLabel(activeBridgePath);
  const buyer = getBuyerDestinationLabel();
  const langHint = (navigator.language || "en").slice(0, 5);
  vcJurisdictionLine.textContent = `Route: ${route} · Buyer mode: ${buyer} · Browser: ${langHint}.`;
  updateLaneWeatherQuiet();
}

function updateLaneWeatherQuiet() {
  const wEl = document.getElementById("vcLaneWeather");
  const qEl = document.getElementById("vcQuietHoursNote");
  if (!wEl) {
    return;
  }
  const hour = new Date().getHours();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const shortTz = tz.includes("/") ? tz.split("/").slice(-2).join("/") : tz;
  let band = "night";
  if (hour >= 5 && hour < 12) {
    band = "dawn";
  } else if (hour >= 12 && hour < 17) {
    band = "day";
  } else if (hour >= 17 && hour < 21) {
    band = "dusk";
  }
  const bandLabel = band === "dawn" ? "Dawn" : band === "day" ? "Day" : band === "dusk" ? "Dusk" : "Night";
  wEl.textContent = `Lane weather: ${bandLabel} rhythm · ${shortTz || "your zone"}`;
  if (qEl) {
    const quiet = hour >= 22 || hour < 7;
    qEl.classList.toggle("hidden", !quiet);
    qEl.textContent = quiet ? "Quiet hours: messages may read slower until morning." : "";
  }
}

function initJurisdictionStripUi() {
  if (vcJurisdictionExplain && vcJurisdictionPanel) {
    vcJurisdictionExplain.addEventListener("click", () => {
      const open = vcJurisdictionPanel.classList.toggle("hidden");
      vcJurisdictionExplain.setAttribute("aria-expanded", open ? "false" : "true");
    });
    vcJurisdictionExplain.setAttribute("aria-expanded", "false");
    vcJurisdictionExplain.setAttribute("aria-controls", "vcJurisdictionPanel");
  }
  updateJurisdictionStrip();
}

function initHeroHueDrift() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const tick = () => {
    const y = window.scrollY || 0;
    const span = Math.min(520, Math.max(240, window.innerHeight * 0.6));
    const t = Math.max(0, Math.min(1, y / span));
    document.documentElement.style.setProperty("--vc-hero-hue", `${(t * 22).toFixed(2)}deg`);
  };
  window.addEventListener("scroll", tick, { passive: true });
  tick();
}

function playUiSoftChime() {
  try {
    if (localStorage.getItem(UI_SOUND_KEY) !== "1") {
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return;
    }
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    o.start(now);
    o.stop(now + 0.18);
  } catch {
    /* ignore */
  }
}

function initShopFolderUiSound() {
  document.body.addEventListener(
    "click",
    (event) => {
      const link = event.target && event.target.closest ? event.target.closest("a.shop-folder-card") : null;
      if (!link) {
        return;
      }
      playUiSoftChime();
    },
    true
  );
}

function personaHintKey(persona) {
  if (persona === "buyer") {
    return "pathChooser.hintBuyer";
  }
  if (persona === "seller") {
    return "pathChooser.hintSeller";
  }
  return "pathChooser.hintCurious";
}

function applyPersonaHint(persona) {
  if (!vcPersonaHint) {
    return;
  }
  const i18n = window.VibeCartI18n;
  const key = personaHintKey(persona);
  const text = i18n && i18n.t ? i18n.t(currentUiLocale(), key) : "";
  vcPersonaHint.textContent = text || "";
  vcPersonaHint.hidden = !text;
}

function initPathPersonaChooser() {
  const routeByPersona = {
    buyer: "./buy-journey.html?flow=buy&lane=fashion",
    seller: "./sell-journey.html"
  };
  document.querySelectorAll("[data-vc-persona]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const persona = btn.getAttribute("data-vc-persona") || "curious";
      try {
        localStorage.setItem(PERSONA_PATH_KEY, persona);
      } catch {
        /* ignore */
      }
      applyPersonaHint(persona);
      if (persona === "curious") {
        const el = document.getElementById("categories");
        if (el) {
          try {
            const lenis = window.__vibecartLenis;
            if (lenis && typeof lenis.scrollTo === "function") {
              lenis.scrollTo(el, { offset: -88 });
              return;
            }
          } catch {
            /* ignore */
          }
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      const route = routeByPersona[persona] || "./buy-journey.html?flow=buy&lane=fashion";
      window.location.assign(route);
    });
  });
  try {
    const saved = localStorage.getItem(PERSONA_PATH_KEY);
    if (saved === "buyer" || saved === "seller" || saved === "curious") {
      applyPersonaHint(saved);
    }
  } catch {
    /* ignore */
  }
}

function initLaneNoteDate() {
  if (!vcLaneNoteDate) {
    return;
  }
  const d = new Date();
  vcLaneNoteDate.setAttribute("datetime", d.toISOString().slice(0, 10));
  vcLaneNoteDate.textContent = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initUiSoundAndRitualSettings() {
  try {
    if (vcUiSoundToggle) {
      vcUiSoundToggle.checked = localStorage.getItem(UI_SOUND_KEY) === "1";
      vcUiSoundToggle.addEventListener("change", () => {
        localStorage.setItem(UI_SOUND_KEY, vcUiSoundToggle.checked ? "1" : "0");
      });
    }
    if (vcRitualToggle) {
      vcRitualToggle.checked = localStorage.getItem(RITUAL_ENABLED_KEY) !== "0";
      vcRitualToggle.addEventListener("change", () => {
        localStorage.setItem(RITUAL_ENABLED_KEY, vcRitualToggle.checked ? "1" : "0");
      });
    }
  } catch {
    /* ignore */
  }
}

function hideSignatureRitual() {
  if (!vcSignatureRitual) {
    return;
  }
  vcSignatureRitual.classList.add("hidden");
  vcSignatureRitual.setAttribute("aria-hidden", "true");
  try {
    sessionStorage.setItem(RITUAL_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

function showSignatureRitual() {
  if (!vcSignatureRitual) {
    return;
  }
  vcSignatureRitual.classList.remove("hidden");
  vcSignatureRitual.setAttribute("aria-hidden", "false");
  vcRitualDismiss?.focus();
  window.setTimeout(() => hideSignatureRitual(), 5200);
}

function initSignatureRitual() {
  if (!vcSignatureRitual || !vcRitualDismiss) {
    return;
  }
  vcRitualDismiss.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    hideSignatureRitual();
  });
  vcSignatureRitual.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") {
      e.stopImmediatePropagation();
    }
    if (e.target === vcSignatureRitual) {
      hideSignatureRitual();
    }
  });
  const marketEl = document.getElementById("market");
  if (!marketEl || typeof IntersectionObserver !== "function") {
    return;
  }
  let armed = true;
  const obs = new IntersectionObserver(
    (entries) => {
      if (!armed) {
        return;
      }
      entries.forEach((en) => {
        if (!en.isIntersecting || en.intersectionRatio < 0.12) {
          return;
        }
        try {
          if (localStorage.getItem(RITUAL_ENABLED_KEY) === "0") {
            return;
          }
          if (sessionStorage.getItem(RITUAL_SESSION_KEY) === "1") {
            return;
          }
          if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            sessionStorage.setItem(RITUAL_SESSION_KEY, "1");
            return;
          }
        } catch {
          return;
        }
        armed = false;
        showSignatureRitual();
        obs.disconnect();
      });
    },
    { threshold: [0, 0.12, 0.25] }
  );
  obs.observe(marketEl);
}

function initVibecartLanePack() {
  initJurisdictionStripUi();
  initHeroHueDrift();
  initShopFolderUiSound();
  initPathPersonaChooser();
  initLaneNoteDate();
  initUiSoundAndRitualSettings();
  initSignatureRitual();
  initAiAssistantShortcuts();
  initVcExperiencePack();
}

const SERENDIPITY_POOL = [
  {
    title: "Book + gadget bundle curiosity",
    sub: "Pair light SKUs — friendlier cross-border carts than one heavy item.",
    href: "#market"
  },
  {
    title: "Scent lane detour",
    sub: "Niche fragrance rewards patient buyers; check category rules for your country.",
    href: "./shops-scents.html"
  },
  {
    title: "Campus pickup fantasy",
    sub: "When the lane allows pickup, state it clearly — buyers love honest handoffs.",
    href: "#seller-growth-ai"
  },
  {
    title: "Transparency first",
    sub: "Scan the snapshot cards — ranges are normal in bridge trade.",
    href: "#public-transparency"
  },
  {
    title: "Mama Africa row",
    sub: "Zimbabwe bubble tiles and regional rhythm — browse the folder.",
    href: "./shops-mama-africa.html"
  }
];

function initVcExperiencePack() {
  initSerendipityLane();
  initPassportStampDisplay();
  initListingHealthMeter();
}

function initSerendipityLane() {
  const host = document.getElementById("vcSerendipityLane");
  if (!host) {
    return;
  }
  let idx = 0;
  try {
    const raw = sessionStorage.getItem(SERENDIPITY_SESSION_KEY);
    if (raw !== null && raw !== "") {
      idx = Number(raw) % SERENDIPITY_POOL.length;
    } else {
      idx = Math.floor(Math.random() * SERENDIPITY_POOL.length);
      sessionStorage.setItem(SERENDIPITY_SESSION_KEY, String(idx));
    }
  } catch {
    idx = Math.floor(Math.random() * SERENDIPITY_POOL.length);
  }
  const pick = SERENDIPITY_POOL[idx];
  host.innerHTML = `<p class="vc-serendipity-eyebrow">Serendipity lane</p><p class="vc-serendipity-title">${escapeHtml(pick.title)}</p><p class="vc-serendipity-sub">${escapeHtml(pick.sub)}</p><a class="btn btn-secondary" href="${safeUrlHref(pick.href)}">Try this angle</a>`;
  host.hidden = false;
}

async function runLiveOneClickCheckoutWithExtras(itemTitle) {
  if (expressCheckoutStatus) {
    expressCheckoutStatus.textContent = "Creating live order and loading tracking...";
  }
  try {
    await runLiveOneClickCheckout(itemTitle);
    showSealedToast();
    maybeAwardPassportStamp();
  } catch (error) {
    if (expressCheckoutStatus) {
      expressCheckoutStatus.textContent = `Checkout failed: ${String(error.message || error)}`;
    }
  }
}

function showSealedToast() {
  const el = document.getElementById("vcSealedToast");
  if (!el) {
    return;
  }
  el.textContent = authT("sealed.word") || "Sealed.";
  el.classList.add("vc-sealed-toast--show");
  if (navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch {
      /* ignore */
    }
  }
  window.clearTimeout(showSealedToast._t);
  showSealedToast._t = window.setTimeout(() => {
    el.classList.remove("vc-sealed-toast--show");
  }, 2200);
}

function maybeAwardPassportStamp() {
  try {
    if (localStorage.getItem(BRIDGE_PASSPORT_STAMP_KEY)) {
      return;
    }
    localStorage.setItem(BRIDGE_PASSPORT_STAMP_KEY, new Date().toISOString().slice(0, 10));
    paintPassportStamp();
  } catch {
    /* ignore */
  }
}

function paintPassportStamp() {
  const el = document.getElementById("vcBridgePassportStamp");
  if (!el) {
    return;
  }
  el.classList.remove("hidden");
}

function initPassportStampDisplay() {
  try {
    if (localStorage.getItem(BRIDGE_PASSPORT_STAMP_KEY)) {
      paintPassportStamp();
    }
  } catch {
    /* ignore */
  }
}

function initListingHealthMeter() {
  const root = document.getElementById("vcListingHealth");
  if (!root) {
    return;
  }
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem(LISTING_HEALTH_KEY) || "{}");
  } catch {
    state = {};
  }
  const keys = ["photos", "shipping", "policy"];
  const apply = () => {
    let n = 0;
    keys.forEach((k) => {
      const cb = root.querySelector(`input[data-vc-lh-key="${k}"]`);
      if (cb) {
        cb.checked = Boolean(state[k]);
        if (state[k]) {
          n += 1;
        }
      }
    });
    root.querySelectorAll(".vc-lh-bar").forEach((bar, i) => {
      bar.classList.toggle("is-on", i < n);
    });
    try {
      localStorage.setItem(LISTING_HEALTH_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  };
  root.querySelectorAll("input[data-vc-lh-key]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const k = cb.getAttribute("data-vc-lh-key");
      if (k) {
        state[k] = cb.checked;
      }
      apply();
    });
  });
  apply();
}

function applyBuyerDestinationDefaultForPath(path) {
  const destination = path === "from-africa" ? "europe" : "africa";
  localStorage.setItem(BUYER_DESTINATION_KEY, destination);
  if (buyerDestinationSelect) {
    buyerDestinationSelect.value = destination;
  }
  updateBuyerDestinationHint();
}

async function fetchLiveMarketplaceProducts() {
  const urls = [
    "/api/public/products/live?limit=100&bridgePath=from-europe",
    "/api/public/products/live?limit=100&bridgePath=from-africa"
  ];
  const merged = [];
  const seen = new Set();
  for (const url of urls) {
    const response = await fetch(url);
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok || !Array.isArray(body.products)) {
      continue;
    }
    body.products.forEach((item) => {
      const id = Number(item.id);
      if (!Number.isFinite(id) || seen.has(id)) {
        return;
      }
      seen.add(id);
      merged.push(item);
    });
  }
  if (merged.length === 0) {
    throw new Error("NO_LIVE_PRODUCTS");
  }
  return merged;
}

function getProductsForPath(path) {
  return liveMarketplaceCache.filter((item) => classifyBridgePath(item.originCountry) === path);
}

const DEMO_BRIDGE_SHOPS = {
  "from-europe": [
    {
      name: "Lublin Campus Deals",
      origin: "PL",
      href: "./shops-europe.html",
      line: "Open the Europe folder page — bubble tiles, then Trade bridge for live VibeCart listings."
    },
    {
      name: "Warsaw Campus Deals",
      origin: "PL",
      href: "./shops-europe.html",
      line: "Same lane page — use Trade bridge when you want Poland → Africa checkout paths."
    },
    { name: "Berlin & Lyon (live)", origin: "DE / FR", href: "#market", line: "Browse the live grid on the marketplace when this lane is quiet." },
    {
      name: "EU national retailers",
      origin: "EU",
      href: "./shops-europe.html",
      line: "Continental retailers live on the Europe lane page; external bubbles still open in a new tab."
    }
  ],
  "from-africa": [
    {
      name: "Mama Africa lane",
      origin: "AFR",
      href: "./shops-mama-africa.html",
      line: "Dedicated Mama Africa page — Zimbabwe row + bubble tiles; Trade bridge for cross-border checkout."
    },
    { name: "Takealot (South Africa)", origin: "ZA", href: "https://www.takealot.com", line: "External marketplace — high national traffic.", external: true },
    { name: "Jumia South Africa", origin: "ZA", href: "https://www.jumia.co.za", line: "External storefront on the Africa → Europe story.", external: true },
    { name: "More shops coming", origin: "—", href: "#market", line: "Open the live marketplace to see listings as sellers publish them." }
  ]
};

function renderBridgePathShops(pathProducts, path) {
  if (!bridgeShops) {
    return;
  }
  const grouped = new Map();
  pathProducts.forEach((item) => {
    const key = `${item.shopId || "0"}:${item.shopName || "Unknown Shop"}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        shopName: String(item.shopName || "Unknown Shop"),
        originCountry: String(item.originCountry || "").toUpperCase(),
        count: 0
      });
    }
    grouped.get(key).count += 1;
  });
  const shops = Array.from(grouped.values()).slice(0, 12);
  if (shops.length === 0) {
    const demos = DEMO_BRIDGE_SHOPS[path] || DEMO_BRIDGE_SHOPS["from-europe"];
    bridgeShops.innerHTML = "";
    demos.forEach((row) => {
      const node = document.createElement("article");
      node.className = "shop";
      const safeName = escapeHtml(row.name || "Shop");
      const safeLine = escapeHtml(row.line || "");
      const safeOrigin = escapeHtml(row.origin || "");
      const ext = row.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      const href = safeUrlHref(row.href);
      node.innerHTML = `
        <a href="${escapeHtml(href)}"${ext}><h3>${safeName}</h3></a>
        <p class="note">${safeOrigin}</p>
        <p>${safeLine}</p>
      `;
      bridgeShops.appendChild(node);
    });
    return;
  }
  bridgeShops.innerHTML = "";
  shops.forEach((shop) => {
    const node = document.createElement("article");
    node.className = "shop";
    node.innerHTML = `
      <h3>${escapeHtml(shop.shopName)}</h3>
      <p>Origin: ${escapeHtml(shop.originCountry)}</p>
      <p>${escapeHtml(shop.count)} live product${shop.count === 1 ? "" : "s"} on this path.</p>
    `;
    bridgeShops.appendChild(node);
  });
}

function renderBridgePathProducts(pathProducts) {
  if (!productsGrid) {
    return;
  }
  if (!Array.isArray(pathProducts) || pathProducts.length === 0) {
    // Keep static HTML demo products when the API has no live catalog (avoid empty “storefront”).
    if (productsGrid.querySelector(".product")) {
      products = Array.from(productsGrid.querySelectorAll(".product"));
      filterProducts(categoryFilter ? categoryFilter.value : "All");
      return;
    }
    productsGrid.innerHTML =
      `<article class="product" data-category="All">
        <h3>No live route products found</h3>
        <p class="price">Awaiting listings</p>
        <p>Seed shops/products for this bridge path, then refresh.</p>
      </article>`;
    products = Array.from(document.querySelectorAll(".product"));
    return;
  }
  productsGrid.innerHTML = "";
  pathProducts.slice(0, 36).forEach((item) => {
    const category = inferCategoryFromTitle(item.title);
    const node = document.createElement("article");
    node.className = "product";
    node.setAttribute("data-category", category);
    const title = String(item.title || "Live Product");
    const currency = String(item.currency || "EUR");
    const shopName = String(item.shopName || "Unknown Shop");
    const origin = String(item.originCountry || "").toUpperCase();
    node.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p class="price">${escapeHtml(currency)} ${escapeHtml(Number(item.basePrice || 0).toFixed(2))}</p>
      <p>Shop: ${escapeHtml(shopName)} | Ships from ${escapeHtml(origin)}</p>
      <button class="btn btn-primary buy-now-btn" data-title="${escapeHtml(title)}" data-price="${Number(item.basePrice || 0)}">Open shop</button>
    `;
    productsGrid.appendChild(node);
  });
  products = Array.from(document.querySelectorAll(".product"));
}

function setBridgePath(path) {
  activeBridgePath = path === "from-africa" ? "from-africa" : "from-europe";
  localStorage.setItem(BRIDGE_PATH_KEY, activeBridgePath);
  if (bridgePathStatus) {
    const count = getProductsForPath(activeBridgePath).length;
    const total = liveMarketplaceCache.length;
    const otherPath = activeBridgePath === "from-africa" ? "from-europe" : "from-africa";
    const otherCount = getProductsForPath(otherPath).length;
    let suffix = "";
    if (count === 0 && total > 0) {
      suffix = ` No listings match this path in the live catalog yet (${otherCount} on ${getPathLabel(otherPath)}).`;
    } else if (count === 0 && total === 0) {
      suffix = " Live catalog is empty — check API connection or seed products.";
    }
    bridgePathStatus.textContent =
      `Current route: ${getPathLabel(activeBridgePath)}. ${count} live product${count === 1 ? "" : "s"} on this path (${total} loaded).${suffix}`;
  }
  if (bridgePathSwitch) {
    bridgePathSwitch.querySelectorAll("[data-bridge-path]").forEach((btn) => {
      const isActive = btn.getAttribute("data-bridge-path") === activeBridgePath;
      btn.classList.toggle("btn-primary", isActive);
      btn.classList.toggle("btn-secondary", !isActive);
    });
  }
  const pathProducts = getProductsForPath(activeBridgePath);
  applyBuyerDestinationDefaultForPath(activeBridgePath);
  renderBridgePathShops(pathProducts, activeBridgePath);
  renderBridgePathProducts(pathProducts);
  wireOneClickBuy();
  wireMarketActionButtons();
  filterProducts(categoryFilter ? categoryFilter.value : "All");
}

function updateMarketLivePulse(totalCount) {
  if (!marketLivePulse) {
    return;
  }
  if (!totalCount || totalCount <= 0) {
    marketLivePulse.hidden = true;
    marketLivePulse.textContent = "";
    return;
  }
  marketLivePulse.hidden = false;
  marketLivePulse.textContent = `Live sync · ${totalCount} listings merged from both bridge paths`;
}

function maybeCelebrateLiveCatalog(totalCount) {
  if (totalCount < 4) {
    return;
  }
  try {
    if (sessionStorage.getItem("vibecart-live-burst") === "1") {
      return;
    }
    sessionStorage.setItem("vibecart-live-burst", "1");
  } catch {
    return;
  }
  const layer = document.createElement("div");
  layer.className = "vc-live-burst";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1300);
}

async function initializeBridgePaths() {
  if (buyerDestinationSelect && buyerDestinationSelect.dataset.boundBuyerDestination !== "1") {
    buyerDestinationSelect.dataset.boundBuyerDestination = "1";
    buyerDestinationSelect.addEventListener("change", () => {
      localStorage.setItem(BUYER_DESTINATION_KEY, String(buyerDestinationSelect.value || "africa"));
      updateBuyerDestinationHint();
    });
  }
  updateBuyerDestinationHint();
  if (bridgePathSwitch) {
    bridgePathSwitch.querySelectorAll("[data-bridge-path]").forEach((btn) => {
      if (btn.dataset.boundBridgePath === "1") {
        return;
      }
      btn.dataset.boundBridgePath = "1";
      btn.addEventListener("click", () => {
        setBridgePath(btn.getAttribute("data-bridge-path") || "from-europe");
      });
    });
  }
  let liveLoadCount = 0;
  try {
    liveMarketplaceCache = await fetchLiveMarketplaceProducts();
    liveLoadCount = liveMarketplaceCache.length;
  } catch {
    liveMarketplaceCache = [];
  }
  updateMarketLivePulse(liveLoadCount);
  if (liveLoadCount > 0) {
    maybeCelebrateLiveCatalog(liveLoadCount);
    try {
      window.dispatchEvent(new CustomEvent("vibecart-live-catalog", { detail: { count: liveLoadCount } }));
    } catch {
      /* ignore */
    }
  }
  setBridgePath(activeBridgePath);
  document.querySelectorAll("[data-bridge-hop]").forEach((link) => {
    if (link.dataset.bridgeHopBound === "1") {
      return;
    }
    link.dataset.bridgeHopBound = "1";
    link.addEventListener("click", () => {
      const path = link.getAttribute("data-bridge-hop");
      if (path) {
        setBridgePath(path);
      }
    });
  });
}

function filterProducts(value) {
  products.forEach((item) => {
    const category = item.getAttribute("data-category");
    const show = value === "All" || category === value;
    item.style.display = show ? "block" : "none";
  });
}

function initVcDeepLinkFromQuery() {
  try {
    const p = new URLSearchParams(window.location.search || "");
    const cat = String(p.get("cat") || "").trim();
    const allowed = new Set(["All", "Electronics", "Fashion", "Books", "Gaming"]);
    categoryCards.forEach((card) => {
      const name = String(card.getAttribute("data-filter") || "All").trim();
      const isSelected = !!cat && allowed.has(cat) && name === cat;
      card.classList.toggle("vc-cat-selected", isSelected);
      card.setAttribute("aria-current", isSelected ? "true" : "false");
    });
    if (cat && categoryFilter && allowed.has(cat)) {
      categoryFilter.value = cat;
      filterProducts(cat);
    }
    const flow = String(p.get("flow") || "").trim();
    if (flow === "buy" || flow === "browse" || flow === "sell") {
      try {
        sessionStorage.setItem("vibecart-active-flow", flow);
      } catch {
        /* ignore */
      }
    }
    const hash = (window.location.hash || "").replace(/^#/, "").split("&")[0];
    const scrollDeferred = () => {
      const explicitMarketJump = String(p.get("instant") || "") === "1";
      if (hash === "market" && explicitMarketJump && (flow === "buy" || flow === "browse" || cat)) {
        const el = document.getElementById("market");
        if (!el) {
          return;
        }
        const lenis = window.__vibecartLenis;
        try {
          if (
            lenis &&
            typeof lenis.scrollTo === "function" &&
            !document.documentElement.classList.contains("vc-mobile-app")
          ) {
            lenis.scrollTo(el, { offset: -88 });
          } else {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } catch {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      if (hash === "sell" && flow === "sell") {
        document.getElementById("sell")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    /* Lenis binds later in this file — defer scroll so smooth scroll is available on desktop. */
    window.setTimeout(scrollDeferred, 480);
  } catch {
    /* ignore */
  }
}

function initVcScrollKinetics() {
  try {
    const root = document.documentElement;
    if (!root.classList.contains("vc-mobile-app") && !root.classList.contains("vc-phone")) {
      return;
    }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    root.classList.add("vc-mobile-kinetic");
    let ticking = false;
    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY || 0;
        root.style.setProperty("--vc-scroll", String(Math.min(1, y / 1600)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  } catch {
    /* ignore */
  }
}

function vcShouldReduceScrollEffects() {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return true;
    }
    if (Number(navigator.maxTouchPoints || 0) > 0 && window.innerWidth < 1024) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/* Lane passport: long smooth Lenis scroll reads as “rolling”; snap this section instead. */
const VC_INSTANT_SCROLL_IDS = new Set(["account-access"]);

function vcPreferInstantScrollForId(id) {
  const raw = String(id || "")
    .replace(/^#/, "")
    .split("&")[0]
    .trim();
  return VC_INSTANT_SCROLL_IDS.has(raw);
}

function vcPreferInstantScrollForElement(el) {
  try {
    return !!(el && el.id && vcPreferInstantScrollForId(el.id));
  } catch {
    return false;
  }
}

function vcIntroSkipVisualViewportBinding() {
  try {
    /* RN WebView + many Android WebViews: vv.width/height are wrong vs layout; overlay clips until user zooms. */
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      return true;
    }
    const ua = String(navigator.userAgent || "");
    if (/Android/i.test(ua) && /\bwv\b/i.test(ua)) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function bindVcIntroVisualViewport(intro) {
  if (!intro || typeof window === "undefined") {
    return () => {};
  }
  if (vcIntroSkipVisualViewportBinding()) {
    return () => {};
  }
  const vv = window.visualViewport;
  if (!vv) {
    return () => {};
  }
  let ticking = false;
  const apply = () => {
    if (!intro.isConnected) {
      return;
    }
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      if (!intro.isConnected) {
        return;
      }
      intro.classList.add("vc-intro-vv-bound");
      intro.style.top = `${vv.offsetTop}px`;
      intro.style.left = `${vv.offsetLeft}px`;
      intro.style.width = `${vv.width}px`;
      intro.style.height = `${vv.height}px`;
      intro.style.right = "auto";
      intro.style.bottom = "auto";
    });
  };
  apply();
  vv.addEventListener("resize", apply, { passive: true });
  vv.addEventListener("scroll", apply, { passive: true });
  return () => {
    vv.removeEventListener("resize", apply);
    vv.removeEventListener("scroll", apply);
    intro.classList.remove("vc-intro-vv-bound");
    intro.style.removeProperty("top");
    intro.style.removeProperty("left");
    intro.style.removeProperty("width");
    intro.style.removeProperty("height");
    intro.style.removeProperty("right");
    intro.style.removeProperty("bottom");
  };
}

function vcIsCompactCinematic() {
  const r = document.documentElement;
  return r.classList.contains("vc-mobile-app") || r.classList.contains("vc-phone");
}

function initVcBridgeCinemaTeaser() {
  try {
    if (!vcIsCompactCinematic()) {
      return;
    }
    const p = document.getElementById("bridgeText");
    if (!p || p.closest(".vc-bridge-cinema")) {
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "vc-bridge-cinema";
    p.replaceWith(wrap);
    p.classList.add("vc-bridge-cinema__body");
    wrap.appendChild(p);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vc-bridge-cinema__toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Roll the full bridge take";
    btn.addEventListener("click", () => {
      const open = !wrap.classList.contains("vc-bridge-cinema--open");
      wrap.classList.toggle("vc-bridge-cinema--open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Tuck it back" : "Roll the full bridge take";
    });
    wrap.appendChild(btn);
  } catch {
    /* ignore */
  }
}

function initVcMarketFitTeaser() {
  try {
    if (!vcIsCompactCinematic()) {
      return;
    }
    const section = document.getElementById("market-fit");
    const lead = document.getElementById("marketFitLead");
    if (!section || !lead || lead.dataset.vcFitToggle === "1") {
      return;
    }
    lead.dataset.vcFitToggle = "1";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vc-bridge-cinema__toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Unfold the fit line";
    btn.addEventListener("click", () => {
      const open = !section.classList.contains("market-fit--open");
      section.classList.toggle("market-fit--open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Shorten again" : "Unfold the fit line";
    });
    lead.insertAdjacentElement("afterend", btn);
  } catch {
    /* ignore */
  }
}

function initVcHeroParallaxLite() {
  try {
    if (!vcIsCompactCinematic()) {
      return;
    }
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }
    const img = document.querySelector(".hero-image img");
    if (!img) {
      return;
    }
    let ticking = false;
    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const y = Math.min(window.scrollY * 0.1, 36);
        img.style.transform = `translate3d(0, ${y}px, 0) scale(1.02)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  } catch {
    /* ignore */
  }
}

function initVcCinematicFloatingMapAndCues() {
  try {
    // Global kill-switch: this layer can intercept clicks/taps and feel like page hijack.
    // Keep disabled on all devices until redesigned.
    return;
    if (!vcIsCompactCinematic() || !("IntersectionObserver" in window)) {
      return;
    }
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scenes = Array.from(document.querySelectorAll("[data-vc-scene]"));
    if (!scenes.length) {
      return;
    }
    if (document.getElementById("vcCinematicFloatingMap")) {
      return;
    }
    const map = document.createElement("nav");
    map.id = "vcCinematicFloatingMap";
    map.setAttribute("aria-label", "Scene map");
    const cue = document.createElement("nav");
    cue.id = "vcCinematicCueRail";
    cue.setAttribute("aria-label", "Scene markers");

    const labels = {
      intro: "Open",
      lane: "Lane",
      fit: "Fit",
      rewards: "Win",
      categories: "Grid",
      shops: "Folders",
      bridge: "Bridge",
      market: "Live",
      hub: "Hub"
    };

    let lastRnScenePosted = "";
    const tryPostSceneToNative = (sid) => {
      if (!sid || sid === lastRnScenePosted) {
        return;
      }
      lastRnScenePosted = sid;
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ vcScene: sid, src: "vc" }));
        }
      } catch {
        /* ignore */
      }
    };

    scenes.forEach((sec) => {
      const id = String(sec.getAttribute("data-vc-scene") || "").trim();
      if (!id) {
        return;
      }
      const a = document.createElement("a");
      a.href = sec.id ? `#${sec.id}` : "#scene-top";
      a.textContent = labels[id] || id;
      a.dataset.vcSceneLink = id;
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        const el = sec.id ? document.getElementById(sec.id) : document.getElementById("scene-top");
        el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        tryPostSceneToNative(id);
      });
      map.appendChild(a);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.title = labels[id] || id;
      dot.setAttribute("aria-label", `Go to ${labels[id] || id}`);
      dot.dataset.vcSceneCue = id;
      dot.addEventListener("click", () => {
        const el = sec.id ? document.getElementById(sec.id) : document.getElementById("scene-top");
        el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        tryPostSceneToNative(id);
      });
      cue.appendChild(dot);
    });

    document.body.appendChild(map);
    document.body.appendChild(cue);

    const setActive = (activeId) => {
      document.body.dataset.vcActiveScene = activeId;
      map.querySelectorAll("a").forEach((a) => {
        a.classList.toggle("vc-cinematic-map-link--active", a.dataset.vcSceneLink === activeId);
      });
      cue.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("vc-cinematic-cue--active", b.dataset.vcSceneCue === activeId);
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0.12)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) {
          return;
        }
        const id = String(visible.target.getAttribute("data-vc-scene") || "");
        if (id) {
          setActive(id);
          tryPostSceneToNative(id);
        }
      },
      { root: null, rootMargin: "-22% 0px -38% 0px", threshold: [0, 0.08, 0.16, 0.28] }
    );
    scenes.forEach((s) => io.observe(s));

    let mapShown = false;
    const onWinScroll = () => {
      const y = window.scrollY || 0;
      const show = y > 140;
      if (show !== mapShown) {
        mapShown = show;
        map.classList.toggle("vc-cinematic-map--visible", show);
        document.body.classList.toggle("vc-cinematic-map-on", show);
      }
    };
    window.addEventListener("scroll", onWinScroll, { passive: true });
    onWinScroll();
    setActive("intro");
  } catch {
    /* ignore */
  }
}

function initVcPullPathHint() {
  try {
    if (!vcIsCompactCinematic()) {
      return;
    }
    if (sessionStorage.getItem("vibecart-pull-hint-dismissed") === "1") {
      return;
    }
    const root = document.documentElement;
    const inApp = root.classList.contains("vc-mobile-app");
    const ua = String(navigator.userAgent || "");
    const android = /Android/i.test(ua);
    if (!inApp && !android) {
      return;
    }
    if (document.getElementById("vcCinematicPullHint")) {
      return;
    }
    const el = document.createElement("div");
    el.id = "vcCinematicPullHint";
    el.innerHTML = `<span>${
      inApp
        ? "Native refresh lives top-right — pull isn’t the only move."
        : "Tip: use your browser refresh when you want the freshest lane copy."
    }</span><button type="button" aria-label="Dismiss">✕</button>`;
    const btn = el.querySelector("button");
    btn?.addEventListener("click", () => {
      el.classList.remove("vc-pull-hint--show");
      try {
        sessionStorage.setItem("vibecart-pull-hint-dismissed", "1");
      } catch {
        /* ignore */
      }
      window.setTimeout(() => el.remove(), 400);
    });
    document.body.appendChild(el);
    window.requestAnimationFrame(() => el.classList.add("vc-pull-hint--show"));
    window.setTimeout(() => {
      if (el.isConnected) {
        btn?.click();
      }
    }, 9000);
  } catch {
    /* ignore */
  }
}

function initVcCinematicExperience() {
  initVcBridgeCinemaTeaser();
  initVcMarketFitTeaser();
  initVcHeroParallaxLite();
  initVcCinematicFloatingMapAndCues();
  initVcPullPathHint();
}

function initVcHorizontalRails() {
  try {
    const root = document.documentElement;
    if (!root.classList.contains("vc-mobile-app") && !root.classList.contains("vc-phone")) {
      return;
    }
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delayMs = root.classList.contains("vc-mobile-app") ? 3200 : 520;
    window.setTimeout(() => {
      try {
        const rails = Array.from(document.querySelectorAll(".vc-mobile-rail:not(.vc-mobile-rail--chips)"));
        rails.forEach((rail, idx) => {
          if (reduceMotion || rail.dataset.vcRailHint === "1") {
            return;
          }
          if (idx !== 0 || rail.scrollWidth <= rail.clientWidth + 8) {
            return;
          }
          rail.dataset.vcRailHint = "1";
          window.requestAnimationFrame(() => {
            try {
              rail.scrollBy({ left: 28, behavior: "smooth" });
              window.setTimeout(() => {
                try {
                  rail.scrollBy({ left: -28, behavior: "smooth" });
                } catch {
                  /* ignore */
                }
              }, 720);
            } catch {
              /* ignore */
            }
          });
        });
      } catch {
        /* ignore */
      }
    }, delayMs);
  } catch {
    /* ignore */
  }
}

function initVcMobileAppFx() {
  try {
    if (!document.documentElement.classList.contains("vc-mobile-app")) {
      return;
    }
    const main = document.querySelector("main");
    if (!main) {
      return;
    }
    main.classList.add("vc-mobile-feed");
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(main.querySelectorAll("section"));
    if (!nodes.length) {
      return;
    }
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("vc-revealed"));
      return;
    }
    const vh = window.innerHeight || 640;
    nodes.forEach((el, i) => {
      el.style.setProperty("--vc-reveal-d", `${Math.min(i, 14) * 42}ms`);
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.94) {
        el.classList.add("vc-revealed");
      }
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) {
            return;
          }
          en.target.classList.add("vc-revealed");
          io.unobserve(en.target);
        });
      },
      { root: null, rootMargin: "0px 0px -5% 0px", threshold: [0, 0.07, 0.14] }
    );
    nodes.forEach((el) => {
      if (!el.classList.contains("vc-revealed")) {
        io.observe(el);
      }
    });
  } catch {
    /* ignore */
  }
}

function initMobileWebLayoutGuards() {
  try {
    const app = document.documentElement.classList.contains("vc-mobile-app");
    const narrow =
      window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (!app && !narrow && !coarse) {
      return;
    }
    document.documentElement.style.setProperty("width", "100%");
    document.documentElement.style.setProperty("max-width", "100%");
    document.body.style.setProperty("width", "100%");
    document.body.style.setProperty("max-width", "100%");
    document.documentElement.style.setProperty("overflow-x", "hidden");
    document.body.style.setProperty("overflow-x", "hidden");
    const main = document.querySelector("main");
    if (main) {
      main.style.setProperty("max-width", "100%");
      main.style.setProperty("width", "100%");
    }
    const footer = document.querySelector(".footer");
    if (footer) {
      footer.style.setProperty("max-width", "100%");
      footer.style.setProperty("width", "100%");
    }
  } catch {
    /* ignore */
  }
}

function initCinematicIntro() {
  const intro = document.getElementById("cinematicIntro");
  if (!intro) {
    return;
  }
  try {
    document.body.appendChild(intro);
  } catch {
    /* ignore */
  }
  try {
    window.scrollTo(0, 0);
  } catch {
    /* ignore */
  }
  try {
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("instant") === "1") {
      intro.remove();
      return;
    }
  } catch {
    /* ignore */
  }
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    intro.classList.add("cinematic-intro--soft");
  }
  const coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  /* Touch / phone: longer hold + next frame so the overlay paints before the hide timer. */
  const holdMs = reduceMotion ? 1600 : coarsePointer ? 3000 : 2200;
  let unbindIntroVv = () => {};
  const reveal = () => {
    intro.classList.add("is-visible");
    intro.setAttribute("aria-hidden", "false");
    unbindIntroVv = bindVcIntroVisualViewport(intro);
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(reveal);
    });
  } else {
    reveal();
  }
  const hide = () => {
    try {
      unbindIntroVv();
    } catch {
      /* ignore */
    }
    intro.classList.add("is-hidden");
    intro.setAttribute("aria-hidden", "true");
    setTimeout(() => intro.remove(), 520);
  };
  setTimeout(hide, holdMs);
}

function initConnectivityBanner() {
  const el = document.getElementById("vcConnectivityBanner");
  if (!el) {
    return;
  }
  const paint = () => {
    if (!navigator.onLine) {
      el.classList.remove("hidden");
      el.textContent =
        "You are offline. Legal pages may still open from cache; cart, checkout, and live listings need a connection.";
    } else {
      el.classList.add("hidden");
      el.textContent = "";
    }
  };
  window.addEventListener("online", paint);
  window.addEventListener("offline", paint);
  paint();
}

function initShopFolderKeyboardNav() {
  const row = document.querySelector(".shop-folder-landing");
  if (!row) {
    return;
  }
  row.setAttribute("tabindex", "0");
  row.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      row.scrollBy({ left: Math.min(row.clientWidth * 0.88, 320), behavior: "smooth" });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      row.scrollBy({ left: -Math.min(row.clientWidth * 0.88, 320), behavior: "smooth" });
    }
  });
}

function initVibePassport() {
  const cards = Array.from(document.querySelectorAll(".shop-folder-card"));
  const badge = document.getElementById("vibePassportBadge");
  const aura = document.getElementById("vibeAuraLine");
  const burstLayer = document.getElementById("vibePassportBurstLayer");
  if (!cards.length || !badge) {
    return;
  }
  let count = Number(localStorage.getItem(VIBE_PASSPORT_KEY) || "0");
  let goldenShown = localStorage.getItem(VIBE_GOLDEN_STAMP_KEY) === "1";
  const auraLines = {
    dawn: [
      "Dawn aura: quiet ambition, soft gold routes, first-mover energy.",
      "Dawn aura: early clicks tend to feel luckier here."
    ],
    day: [
      "Day aura: bold trade light, clean momentum, no hesitation.",
      "Day aura: practical brilliance with a little swagger."
    ],
    dusk: [
      "Dusk aura: richer glow, deeper contrast, smoother folder hunting.",
      "Dusk aura: perfect hour for emotional browsing and brave carts."
    ],
    night: [
      "Night aura: neon confidence, collector mood, quiet power.",
      "Night aura: secret-market energy without the chaos."
    ]
  };
  const livingTier = (n) => (n >= 40 ? 4 : n >= 20 ? 3 : n >= 8 ? 2 : 1);
  const renderBadge = () => {
    const rank = count >= 40 ? "Legend" : count >= 20 ? "Pro" : count >= 8 ? "Explorer" : "Rookie";
    const tier = livingTier(count);
    badge.textContent = `Vibe Passport: ${count} stamp${count === 1 ? "" : "s"} · ${rank} · living tier ${tier}`;
  };
  const renderAura = () => {
    if (!aura) {
      return;
    }
    const chrono = String(document.body.getAttribute("data-vc-chronotope") || "day");
    const lines = auraLines[chrono] || auraLines.day;
    aura.textContent = lines[count % lines.length];
  };
  renderBadge();
  renderAura();
  badge.style.cursor = "pointer";
  badge.title = "Open Vibe Passport";
  if (badge.dataset.vibePassportOpenBound !== "1") {
    badge.dataset.vibePassportOpenBound = "1";
    badge.addEventListener("click", () => {
      window.location.assign("./lane-passport.html");
    });
  }

  cards.forEach((card) => {
    if (card.dataset.vibePassportBound === "1") {
      return;
    }
    card.dataset.vibePassportBound = "1";
    card.addEventListener("click", () => {
      count += 1;
      localStorage.setItem(VIBE_PASSPORT_KEY, String(count));
      renderBadge();
      renderAura();
      if (!burstLayer) {
        return;
      }
      const stamp = document.createElement("div");
      const tier = livingTier(count);
      stamp.className = `vibe-passport-stamp vibe-passport-stamp--tier-${tier} vibe-passport-stamp--alive`;
      const title = card.querySelector(".shop-folder-card-title");
      const label = title ? String(title.textContent || "").trim().toUpperCase() : "ROUTE";
      const isGoldenStamp = !goldenShown && count >= 5 && Math.random() < 0.22;
      if (isGoldenStamp) {
        goldenShown = true;
        localStorage.setItem(VIBE_GOLDEN_STAMP_KEY, "1");
        stamp.classList.add("vibe-passport-stamp--gold");
      }
      stamp.textContent = isGoldenStamp
        ? `${label} · GOLD ROUTE`
        : `${label} · VC-${(count % 1000).toString().padStart(3, "0")}`;
      burstLayer.appendChild(stamp);
      const hangMs = tier >= 3 ? 1680 : tier >= 2 ? 1560 : 1450;
      setTimeout(() => stamp.remove(), hangMs);
    });
  });
}

function initVibeFlowMotion() {
  const track = document.getElementById("vibeFlowTrack");
  if (!track) {
    return;
  }
  let swipeCount = 0;
  let touchStartX = 0;
  let longPressTimer = null;
  let neonArmed = false;
  const cards = Array.from(track.querySelectorAll("[data-diagonal-layer]"));
  const lightMotion = vcShouldReduceScrollEffects();

  track.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        track.scrollLeft += event.deltaY * 1.05;
      }
    },
    { passive: false }
  );

  const resetDiagonalStyles = () => {
    cards.forEach((card) => {
      card.style.transform = "";
      card.style.opacity = "";
      card.style.filter = "";
    });
  };

  let diagRaf = 0;
  const applyDiagonal = () => {
    if (lightMotion || !cards.length) {
      return;
    }
    const viewportMid = window.innerHeight * 0.5;
    const trackRect = track.getBoundingClientRect();
    if (trackRect.bottom < 0 || trackRect.top > window.innerHeight) {
      return;
    }
    const lensCenterX = trackRect.left + trackRect.width * 0.5;
    const lensRange = Math.max(trackRect.width * 0.42, 1);
    cards.forEach((card) => {
      const depth = Number(card.getAttribute("data-diagonal-layer") || "1");
      const rect = card.getBoundingClientRect();
      const distance = (rect.top + rect.height * 0.5 - viewportMid) / viewportMid;
      const xShift = distance * depth * -8;
      const yShift = distance * depth * 6;
      const cardCenterX = rect.left + rect.width * 0.5;
      const centerDelta = Math.abs(cardCenterX - lensCenterX);
      const centerBoost = Math.max(0, 1 - centerDelta / lensRange);
      const scale = 0.9 + centerBoost * 0.24;
      const opacity = 0.72 + centerBoost * 0.28;
      card.style.transform = `translate(${xShift}px, ${yShift}px) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = `saturate(${(0.88 + centerBoost * 0.28).toFixed(3)})`;
    });
  };

  const scheduleDiagonal = () => {
    if (lightMotion) {
      return;
    }
    cancelAnimationFrame(diagRaf);
    diagRaf = requestAnimationFrame(() => {
      applyDiagonal();
    });
  };

  if (lightMotion) {
    resetDiagonalStyles();
  } else {
    window.addEventListener("scroll", scheduleDiagonal, { passive: true });
    track.addEventListener("scroll", scheduleDiagonal, { passive: true });
    scheduleDiagonal();
  }

  const activateNeonMode = () => {
    document.body.classList.add("night-neon");
    localStorage.setItem(NIGHT_NEON_KEY, "1");
    if (expressCheckoutStatus) {
      expressCheckoutStatus.textContent = "Night Neon mode unlocked.";
    }
  };
  const deactivateNeonMode = () => {
    document.body.classList.remove("night-neon");
    localStorage.removeItem(NIGHT_NEON_KEY);
    if (expressCheckoutStatus) {
      expressCheckoutStatus.textContent = "Night Neon mode disabled.";
    }
  };

  if (localStorage.getItem(NIGHT_NEON_KEY) === "1") {
    activateNeonMode();
  }

  track.addEventListener("touchstart", (event) => {
    touchStartX = Number(event.touches?.[0]?.clientX || 0);
  }, { passive: true });

  track.addEventListener("touchend", (event) => {
    const endX = Number(event.changedTouches?.[0]?.clientX || 0);
    if (Math.abs(endX - touchStartX) > 34) {
      swipeCount += 1;
      if (swipeCount >= 3) {
        neonArmed = true;
      }
    }
  }, { passive: true });

  const beginHold = () => {
    if (!neonArmed) {
      return;
    }
    longPressTimer = setTimeout(() => {
      if (document.body.classList.contains("night-neon")) {
        deactivateNeonMode();
      } else {
        activateNeonMode();
      }
      neonArmed = false;
      swipeCount = 0;
    }, 900);
  };

  const endHold = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  track.addEventListener("pointerdown", beginHold);
  track.addEventListener("pointerup", endHold);
  track.addEventListener("pointerleave", endHold);
}

function initHeroCanvasFx() {
  const canvas = document.getElementById("heroCanvasFx");
  if (!canvas) {
    return;
  }
  if (vcShouldReduceScrollEffects()) {
    canvas.classList.add("hero-canvas-fx--off");
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const particles = [];
  let width = 0;
  let height = 0;

  const resize = () => {
    const host = canvas.parentElement || canvas;
    width = Math.max(320, Math.floor(host.clientWidth || 0));
    height = Math.max(240, Math.floor(host.clientHeight || 0));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seed = () => {
    particles.length = 0;
    const count = Math.max(10, Math.floor(width / 110));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.2 + Math.random() * 3.4,
        vx: -0.12 + Math.random() * 0.24,
        vy: -0.08 + Math.random() * 0.16,
        hue: [30, 165, 265][i % 3]
      });
    }
  };

  let frameSkip = 0;
  const frame = () => {
    frameSkip += 1;
    if (frameSkip % 2 === 0) {
      requestAnimationFrame(frame);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(255,140,40,0.18)");
    grad.addColorStop(0.5, "rgba(15,235,190,0.14)");
    grad.addColorStop(1, "rgba(140,110,255,0.18)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 92%, 68%, 0.45)`;
      ctx.fill();
    });
    requestAnimationFrame(frame);
  };

  resize();
  seed();
  frame();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });
}

function startVoiceCommandMode() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (expressCheckoutStatus) {
      expressCheckoutStatus.textContent = "Voice command not supported on this browser.";
    }
    return;
  }
  const rec = new SpeechRec();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = false;
  rec.onresult = (event) => {
    const text = String(event.results?.[0]?.[0]?.transcript || "").toLowerCase();
    if (text.includes("shop")) {
      document.getElementById("market")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (text.includes("sell")) {
      document.getElementById("sell")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (text.includes("unlock vibe")) {
      revealHiddenPhrase();
    }
    if (expressCheckoutStatus) {
      expressCheckoutStatus.textContent = `Voice command: ${text || "no command captured"}`;
    }
  };
  rec.start();
}

function revealHiddenPhrase() {
  const code = [75, 117, 100, 97, 32, 107, 119, 97, 105, 115, 104, 101];
  const phrase = String.fromCharCode(...code);
  const wasVip = localStorage.getItem(VIBE_VIP_KEY) === "1";
  unlockVibeVip("name cipher", { announce: false });
  if (expressCheckoutStatus) {
    const vipNote = !wasVip ? " · VIP lane opened." : "";
    expressCheckoutStatus.textContent = `Secret unlocked: ${phrase}${vipNote}`;
  }
}

function wireOneClickBuy() {
  document.querySelectorAll(".buy-now-btn").forEach((btn) => {
    if (btn.dataset.boundQuickBuy === "1") {
      return;
    }
    btn.dataset.boundQuickBuy = "1";
    btn.addEventListener("click", () => {
      if (marketDisclaimerAck && !marketDisclaimerAck.checked) {
        if (expressCheckoutStatus) {
          expressCheckoutStatus.textContent = "Please accept the marketplace disclaimer first.";
        }
        return;
      }
      var shop = String(btn.getAttribute("data-shop-name") || btn.getAttribute("data-title") || "Selected shop").trim();
      var target = String(btn.getAttribute("data-shop-url") || "").trim();
      var cat = "All";
      try {
        var card = btn.closest ? btn.closest(".product") : null;
        if (card) {
          cat = String(card.getAttribute("data-category") || "All").trim();
        }
      } catch {
        cat = "All";
      }
      if (!target) {
        if (expressCheckoutStatus) {
          expressCheckoutStatus.textContent = "This listing has no external destination yet. Please choose another offer.";
        }
        return;
      }
      var redirectUrl =
        "/api/public/shop/redirect?shop=" +
        encodeURIComponent(shop) +
        "&cat=" +
        encodeURIComponent(cat) +
        "&partner=" +
        encodeURIComponent(shop) +
        "&target=" +
        encodeURIComponent(target);
      trackAffiliateClick({ source: "index-buy-button", shop, target, commissionEligible: isCommissionTrackedUrl(target) });
      window.location.assign(redirectUrl);
    });
  });
}

function getStoredPublicAuth() {
  try {
    const token = localStorage.getItem(PUBLIC_AUTH_TOKEN_KEY);
    const raw = localStorage.getItem(PUBLIC_AUTH_USER_KEY);
    if (!token || !raw) {
      return null;
    }
    const user = JSON.parse(raw);
    if (!user || typeof user !== "object") {
      return null;
    }
    return { token: String(token), user };
  } catch {
    return null;
  }
}

function persistPublicAuth(token, user) {
  try {
    localStorage.setItem(PUBLIC_AUTH_TOKEN_KEY, String(token));
    localStorage.setItem(PUBLIC_AUTH_USER_KEY, JSON.stringify(user));
    if (user && Number(user.id) > 0) {
      localStorage.setItem(PUBLIC_USER_KEY, String(user.id));
    }
  } catch {
    /* ignore */
  }
}

function clearPublicAuth() {
  try {
    localStorage.removeItem(PUBLIC_AUTH_TOKEN_KEY);
    localStorage.removeItem(PUBLIC_AUTH_USER_KEY);
    localStorage.removeItem(PUBLIC_USER_KEY);
  } catch {
    /* ignore */
  }
}

async function validatePublicSession(token) {
  try {
    const response = await fetch("/api/public/auth/session", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await response.json().catch(() => ({}));
    return Boolean(response.ok && body.ok && body.user);
  } catch {
    return false;
  }
}

function authT(key) {
  const i18n = window.VibeCartI18n;
  const lang = typeof currentUiLocale === "function" ? currentUiLocale() : "en";
  if (i18n && i18n.t) {
    const v = i18n.t(lang, key);
    if (v) {
      return v;
    }
    return i18n.t("en", key) || "";
  }
  return "";
}

function scorePassword(pw) {
  const s = String(pw || "");
  let score = 0;
  if (s.length >= 8) {
    score += 1;
  }
  if (s.length >= 12) {
    score += 1;
  }
  if (/[0-9]/.test(s)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/.test(s)) {
    score += 1;
  }
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) {
    score += 1;
  }
  return Math.min(4, score);
}

function updatePasswordMeter() {
  const input = document.getElementById("vcAuthPassword");
  const meter = document.getElementById("vcAuthPwMeter");
  if (!input || !meter) {
    return;
  }
  const sc = scorePassword(input.value);
  let key = "accountPassport.pwShort";
  if (sc >= 3) {
    key = "accountPassport.pwStrong";
  } else if (sc >= 1) {
    key = "accountPassport.pwFair";
  }
  meter.textContent = authT(key);
}

function paintAuthLoggedIn(user) {
  const out = document.getElementById("vcAuthLoggedOut");
  const inn = document.getElementById("vcAuthLoggedIn");
  const welcome = document.getElementById("vcAuthWelcomeLine");
  const meta = document.getElementById("vcAuthMetaLine");
  const memberAura = document.getElementById("vcMemberAura");
  const guestAura = document.getElementById("vcGuestAura");
  const memberAuraTitle = document.getElementById("vcMemberAuraTitle");
  const memberAuraText = document.getElementById("vcMemberAuraText");
  const memberAuraChip = document.getElementById("vcMemberAuraChip");
  if (out) {
    out.classList.add("hidden");
  }
  if (inn) {
    inn.classList.remove("hidden");
  }
  const name = String(user.fullName || user.email || "Traveler");
  const email = String(user.email || "");
  const roleRaw = String(user.role || "");
  const roleLabel =
    roleRaw === "seller" ? authT("accountPassport.roleSellerLabel") : authT("accountPassport.roleBuyerLabel");
  const cc = String(user.countryCode || "");
  var stampCount = 0;
  var isVip = false;
  try {
    stampCount = Number(localStorage.getItem(VIBE_PASSPORT_KEY) || "0");
    isVip = localStorage.getItem(VIBE_VIP_KEY) === "1";
  } catch {
    stampCount = 0;
    isVip = false;
  }
  var level = "Explorer";
  if (isVip || stampCount >= 8) {
    level = "Legend";
  } else if (stampCount >= 5) {
    level = "Elite";
  } else if (stampCount >= 2) {
    level = "Citizen";
  }
  if (welcome) {
    const tpl = authT("accountPassport.welcome");
    welcome.textContent = tpl ? tpl.replace("{name}", name) : `Welcome, ${name}`;
  }
  if (meta) {
    const tpl = authT("accountPassport.meta");
    meta.textContent = tpl
      ? tpl.replace("{email}", email).replace("{role}", roleLabel).replace("{country}", cc)
      : `${email} · ${roleLabel} · ${cc}`;
  }
  if (memberAuraTitle) {
    memberAuraTitle.textContent = `Welcome, ${name}. Your VibeCart passport is active.`;
  }
  if (memberAuraText) {
    memberAuraText.textContent =
      `Holder level: ${level}. You have ${stampCount} passport stamp${stampCount === 1 ? "" : "s"} on this device.`;
  }
  if (memberAuraChip) {
    memberAuraChip.textContent = `VibeCart Passport Holder · ${level}`;
  }
  if (memberAura) {
    memberAura.classList.remove("hidden");
    memberAura.classList.remove("vc-member-aura--explorer", "vc-member-aura--citizen", "vc-member-aura--elite", "vc-member-aura--legend");
    memberAura.classList.add(
      level === "Legend"
        ? "vc-member-aura--legend"
        : level === "Elite"
          ? "vc-member-aura--elite"
          : level === "Citizen"
            ? "vc-member-aura--citizen"
            : "vc-member-aura--explorer"
    );
  }
  if (guestAura) {
    guestAura.classList.add("hidden");
  }
}

function paintAuthLoggedOut() {
  const out = document.getElementById("vcAuthLoggedOut");
  const inn = document.getElementById("vcAuthLoggedIn");
  const memberAura = document.getElementById("vcMemberAura");
  const guestAura = document.getElementById("vcGuestAura");
  if (out) {
    out.classList.remove("hidden");
  }
  if (inn) {
    inn.classList.add("hidden");
  }
  if (memberAura) {
    memberAura.classList.add("hidden");
  }
  if (guestAura) {
    guestAura.classList.remove("hidden");
  }
}

function setAuthStatus(message) {
  const el = document.getElementById("vcAuthStatus");
  if (el) {
    el.textContent = message || "";
  }
}

async function refreshPublicSessionOnLoad() {
  const auth = getStoredPublicAuth();
  if (!auth || !auth.token) {
    paintAuthLoggedOut();
    return;
  }
  try {
    const response = await fetch("/api/public/auth/session", {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok || !body.user) {
      clearPublicAuth();
      paintAuthLoggedOut();
      return;
    }
    persistPublicAuth(auth.token, body.user);
    paintAuthLoggedIn(body.user);
  } catch {
    clearPublicAuth();
    paintAuthLoggedOut();
  }
}

function refreshAccountPassportLabels() {
  const roleInput = document.getElementById("vcAuthRole");
  const seller = String(roleInput?.value || "buyer") === "seller";
  const roleLabel = document.getElementById("vcAuthRoleLabel");
  const sellerNote = document.getElementById("vcAuthSellerNote");
  const toggleRoleBtn = document.getElementById("vcAuthToggleRole");
  const countryNote = document.getElementById("vcAuthCountryNote");
  if (roleLabel) {
    roleLabel.textContent = seller ? authT("accountPassport.roleSellerShort") : authT("accountPassport.roleBuyerShort");
  }
  if (sellerNote) {
    sellerNote.classList.toggle("hidden", !seller);
  }
  if (toggleRoleBtn) {
    toggleRoleBtn.textContent = seller
      ? authT("accountPassport.switchToBuyer")
      : authT("accountPassport.switchToSeller");
  }
  if (countryNote) {
    countryNote.textContent = authT("accountPassport.countryAuto");
  }
}

function initPublicAccountAuth() {
  const panelCreate = document.getElementById("vcAuthPanelCreate");
  const panelLogin = document.getElementById("vcAuthPanelLogin");
  const linkToLogin = document.getElementById("vcAuthLinkToLogin");
  const linkToCreate = document.getElementById("vcAuthLinkToCreate");
  const formCreate = document.getElementById("vcAuthFormCreate");
  const formLogin = document.getElementById("vcAuthFormLogin");
  const roleInput = document.getElementById("vcAuthRole");
  const country = document.getElementById("vcAuthCountry");
  const pw = document.getElementById("vcAuthPassword");
  const emailCreate = document.getElementById("vcAuthEmail");
  const fullNameInput = document.getElementById("vcAuthFullName");
  const btnCreate = document.getElementById("vcAuthSubmitCreate");
  const btnLogin = document.getElementById("vcAuthSubmitLogin");
  const btnLogout = document.getElementById("vcAuthLogout");
  const toggleRoleBtn = document.getElementById("vcAuthToggleRole");
  const journeyInput = document.getElementById("vcAuthJourney");
  const journeyPassportBtn = document.getElementById("vcAuthJourneyPassport");
  const journeyAccountBtn = document.getElementById("vcAuthJourneyAccount");
  const journeyHint = document.getElementById("vcAuthJourneyHint");
  const createSubmitLabel = document.getElementById("vcAuthSubmitCreate");

  if (!panelCreate || !panelLogin) {
    return;
  }

  function showCreate() {
    panelCreate.classList.remove("hidden");
    panelLogin.classList.add("hidden");
    panelLogin.setAttribute("hidden", "hidden");
  }

  function showLogin() {
    panelLogin.classList.remove("hidden");
    panelCreate.classList.add("hidden");
    panelLogin.removeAttribute("hidden");
  }

  function refreshJourneyUi() {
    const journey = String(journeyInput?.value || "passport").toLowerCase() === "account" ? "account" : "passport";
    if (journeyPassportBtn) {
      journeyPassportBtn.classList.toggle("is-active", journey === "passport");
    }
    if (journeyAccountBtn) {
      journeyAccountBtn.classList.toggle("is-active", journey === "account");
    }
    if (createSubmitLabel) {
      createSubmitLabel.textContent = journey === "passport" ? "Create passport" : "Create account";
    }
    if (journeyHint) {
      journeyHint.textContent =
        journey === "passport"
          ? "Flow: Create passport -> Enter details -> Congratulations, welcome to the VibeCart family with your VibeCart passport."
          : "Flow: Create account -> Enter details -> Congratulations, welcome to the VibeCart community.";
    }
  }

  linkToLogin?.addEventListener("click", (event) => {
    event.preventDefault();
    showLogin();
  });
  linkToCreate?.addEventListener("click", (event) => {
    event.preventDefault();
    showCreate();
  });
  journeyPassportBtn?.addEventListener("click", () => {
    if (journeyInput) {
      journeyInput.value = "passport";
    }
    refreshJourneyUi();
  });
  journeyAccountBtn?.addEventListener("click", () => {
    if (journeyInput) {
      journeyInput.value = "account";
    }
    refreshJourneyUi();
  });

  toggleRoleBtn?.addEventListener("click", () => {
    const nowSeller = String(roleInput?.value || "buyer") === "seller";
    if (roleInput) {
      roleInput.value = nowSeller ? "buyer" : "seller";
    }
    refreshAccountPassportLabels();
  });

  if (country && typeof getBuyerCountryCode === "function") {
    const code = getBuyerCountryCode();
    if ([...country.options].some((o) => o.value === code)) {
      country.value = code;
    }
  }
  if (roleInput) {
    roleInput.value = "buyer";
  }
  if (journeyInput && !journeyInput.value) {
    journeyInput.value = "passport";
  }
  refreshAccountPassportLabels();
  refreshJourneyUi();

  if (emailCreate && fullNameInput) {
    emailCreate.addEventListener("blur", () => {
      if (String(fullNameInput.value || "").trim().length >= 2) {
        return;
      }
      const local = String(emailCreate.value || "").trim().split("@")[0];
      if (local.length < 2) {
        return;
      }
      const pretty = local.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
      if (pretty.length >= 2) {
        fullNameInput.value = pretty.charAt(0).toUpperCase() + pretty.slice(1);
      }
    });
  }

  if (pw) {
    pw.addEventListener("input", updatePasswordMeter);
  }

  async function submitCreate(event) {
    event.preventDefault();
    setAuthStatus("");
    const fullName = String(document.getElementById("vcAuthFullName")?.value || "").trim();
    const email = String(document.getElementById("vcAuthEmail")?.value || "").trim().toLowerCase();
    const password = String(document.getElementById("vcAuthPassword")?.value || "");
    const role = String(roleInput?.value || "buyer");
    const journey = String(journeyInput?.value || "passport").toLowerCase() === "account" ? "account" : "passport";
    const countryCode = String(country?.value || "ZA").toUpperCase();
    if (fullName.length < 2 || !email || password.length < 8 || countryCode.length !== 2) {
      setAuthStatus(authT("accountPassport.errMissingFields"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthStatus(authT("accountPassport.errInvalidEmail"));
      return;
    }
    if (btnCreate) {
      btnCreate.disabled = true;
    }
    setAuthStatus(authT("accountPassport.creating"));
    try {
      const response = await fetch("/api/public/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, fullName, countryCode })
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setAuthStatus(authT("accountPassport.err409"));
        showLogin();
        const loginEmail = document.getElementById("vcAuthLoginEmail");
        if (loginEmail) {
          loginEmail.value = email;
        }
        return;
      }
      if (!response.ok || !body.ok || !body.token) {
        const detail =
          body && (body.message || body.code)
            ? ` (${String(body.code || "")}: ${String(body.message || "").slice(0, 120)})`
            : "";
        setAuthStatus(authT("accountPassport.errGeneric") + detail);
        return;
      }
      persistPublicAuth(body.token, body.user);
      try {
        localStorage.setItem(PUBLIC_AUTH_JOURNEY_KEY, journey);
      } catch {
        /* ignore */
      }
      paintAuthLoggedIn(body.user);
      setAuthStatus(
        journey === "passport"
          ? "Congratulations, welcome to the VibeCart family with your VibeCart passport."
          : "Congratulations, welcome to the VibeCart community."
      );
      const nextUrl =
        journey === "passport"
          ? `./passport-welcome.html?welcome=1&new=1&journey=passport&name=${encodeURIComponent(String(body.user?.fullName || fullName || ""))}&email=${encodeURIComponent(email)}`
          : `./account-welcome.html?welcome=1&new=1&journey=account&name=${encodeURIComponent(String(body.user?.fullName || fullName || ""))}&email=${encodeURIComponent(email)}`;
      window.setTimeout(() => {
        window.location.assign(nextUrl);
      }, 420);
    } catch {
      setAuthStatus(authT("accountPassport.errGeneric"));
    } finally {
      if (btnCreate) {
        btnCreate.disabled = false;
      }
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setAuthStatus("");
    const email = String(document.getElementById("vcAuthLoginEmail")?.value || "").trim().toLowerCase();
    const password = String(document.getElementById("vcAuthLoginPassword")?.value || "");
    if (!email || !password) {
      setAuthStatus(authT("accountPassport.errGeneric"));
      return;
    }
    if (btnLogin) {
      btnLogin.disabled = true;
    }
    try {
      const response = await fetch("/api/public/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setAuthStatus(authT("accountPassport.err401"));
        return;
      }
      if (response.status === 403) {
        setAuthStatus(authT("accountPassport.err403"));
        return;
      }
      if (!response.ok || !body.ok || !body.token) {
        setAuthStatus(authT("accountPassport.errGeneric"));
        return;
      }
      persistPublicAuth(body.token, body.user);
      paintAuthLoggedIn(body.user);
      setAuthStatus("");
    } catch {
      setAuthStatus(authT("accountPassport.errGeneric"));
    } finally {
      if (btnLogin) {
        btnLogin.disabled = false;
      }
    }
  }

  formCreate?.addEventListener("submit", submitCreate);
  formLogin?.addEventListener("submit", submitLogin);

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      const auth = getStoredPublicAuth();
      if (auth && auth.token) {
        try {
          await fetch("/api/public/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` }
          });
        } catch {
          /* ignore */
        }
      }
      clearPublicAuth();
      paintAuthLoggedOut();
      setAuthStatus(authT("accountPassport.signedOut"));
    });
  }

  refreshPublicSessionOnLoad().catch(() => {});
}

async function ensureQuickBuyerToken() {
  const auth = getStoredPublicAuth();
  if (auth && auth.token && auth.user && auth.user.role === "buyer") {
    const ok = await validatePublicSession(auth.token);
    if (ok) {
      return auth.token;
    }
    clearPublicAuth();
  }
  const cached = String(sessionStorage.getItem(QUICK_BUY_TOKEN_KEY) || "");
  if (cached) {
    const ok = await validatePublicSession(cached);
    if (ok) {
      return cached;
    }
    try {
      sessionStorage.removeItem(QUICK_BUY_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }
  const generatedEmail = `quickbuyer+${Date.now()}@vibecart.local`;
  const generatedPassword = `Quick#${Math.random().toString(36).slice(2, 10)}A1`;
  const registerResponse = await fetch("/api/public/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: generatedEmail,
      password: generatedPassword,
      role: "buyer",
      fullName: "Quick Buyer",
      countryCode: "ZA"
    })
  });
  const registerBody = await registerResponse.json();
  if (!registerResponse.ok || !registerBody.ok || !registerBody.token) {
    throw new Error(registerBody.code || "BUYER_SESSION_FAILED");
  }
  try {
    sessionStorage.setItem(QUICK_BUY_TOKEN_KEY, String(registerBody.token));
  } catch {
    /* sessionStorage blocked — caller must handle missing persistence */
  }
  return String(registerBody.token);
}

async function resolveLiveProductId(preferredTitle) {
  const response = await fetch("/api/public/products/live?limit=30");
  const body = await response.json();
  if (!response.ok || !body.ok || !Array.isArray(body.products) || body.products.length === 0) {
    throw new Error("NO_LIVE_PRODUCTS");
  }
  const titleNeedle = String(preferredTitle || "").trim().toLowerCase();
  const matched = body.products.find((item) => String(item.title || "").toLowerCase() === titleNeedle)
    || body.products.find((item) => String(item.title || "").toLowerCase().includes(titleNeedle))
    || body.products[0];
  return Number(matched.id);
}

async function runLiveOneClickCheckout(itemTitle) {
  const token = await ensureQuickBuyerToken();
  const productId = await resolveLiveProductId(itemTitle);
  const buyerCountry = getBuyerCountryCode();
  const shippingMethod = getBuyerShippingMethod();
  const createResponse = await fetch("/api/public/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      quantity: 1,
      buyerCountry,
      shippingMethod
    })
  });
  const createBody = await createResponse.json();
  if (!createResponse.ok || !createBody.ok || !createBody.order?.orderId) {
    throw new Error(createBody.code || "ORDER_CREATE_FAILED");
  }
  const trackResponse = await fetch(`/api/public/orders/track?orderId=${Number(createBody.order.orderId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const trackBody = await trackResponse.json();
  if (!trackResponse.ok || !trackBody.ok || !trackBody.order) {
    throw new Error(trackBody.code || "ORDER_TRACK_FAILED");
  }
  const shipment = trackBody.shipment;
  const buyerDestination = getBuyerDestinationLabel();
  if (expressCheckoutStatus) {
    expressCheckoutStatus.textContent =
      `Order #${createBody.order.orderId} created for ${buyerDestination} (${trackBody.order.status}). ` +
      (shipment
        ? `Courier: ${shipment.courier} | Tracking: ${shipment.trackingNumber || "pending"}`
        : "Shipment will appear after payment capture.");
  }
  startOrderTrackingPoll(createBody.order.orderId, token).catch(() => {});
}

async function startOrderTrackingPoll(orderId, token) {
  const maxChecks = 20;
  const waitMs = 4000;
  for (let i = 0; i < maxChecks; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    const trackResponse = await fetch(`/api/public/orders/track?orderId=${Number(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const trackBody = await trackResponse.json();
    if (!trackResponse.ok || !trackBody.ok || !trackBody.order) {
      continue;
    }
    const shipment = trackBody.shipment;
    const latestUpdate = Array.isArray(trackBody.updates) && trackBody.updates.length > 0
      ? trackBody.updates[0].statusMessage
      : "Tracking refreshed.";
    if (expressCheckoutStatus) {
      expressCheckoutStatus.textContent =
        `Order #${orderId} now ${trackBody.order.status}. ` +
        (shipment
          ? `Courier: ${shipment.courier} | Tracking: ${shipment.trackingNumber || "pending"} | ${latestUpdate}`
          : latestUpdate);
    }
    const status = String(trackBody.order.status || "").toLowerCase();
    if (status === "shipped" || status === "delivered" || status === "cancelled" || status === "refunded") {
      break;
    }
  }
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", (event) => {
    filterProducts(event.target.value);
  });
}

categoryCards.forEach((card) => {
  card.addEventListener("click", () => {
    const chosen = card.getAttribute("data-filter") || "All";
    categoryCards.forEach((item) => {
      item.classList.toggle("vc-cat-selected", item === card);
      item.setAttribute("aria-current", item === card ? "true" : "false");
    });
    if (categoryFilter) {
      categoryFilter.value = chosen;
    }
    filterProducts(chosen);
  });
});

function resolveMarketFromLocale() {
  const locale = (navigator.language || "").toLowerCase();
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();

  if (locale.includes("pl") || tz.includes("warsaw") || tz.includes("lublin")) {
    return "poland";
  }
  if (locale.includes("en-za") || tz.includes("johannesburg")) {
    return "south-africa";
  }
  if (locale.includes("sw-ke") || tz.includes("nairobi")) {
    return "kenya";
  }
  if (tz.includes("windhoek")) {
    return "namibia";
  }
  if (tz.includes("addis_ababa")) {
    return "ethiopia";
  }
  if (tz.includes("harare")) {
    return "zimbabwe";
  }
  if (tz.includes("dubai")) {
    return "dubai";
  }
  if (tz.includes("kolkata") || tz.includes("singapore") || tz.includes("tokyo")) {
    return "asia";
  }
  return "africa-general";
}

function setMarketCopy(market) {
  const messages = {
    poland: "VibeCart connects Poland sellers to trusted buyers across Africa and Europe.",
    "south-africa": "Optimized for South Africa buyers with cross-border sourcing from Poland and Europe.",
    kenya: "Optimized for Kenya buyers with access to legal listings from Poland and Europe.",
    namibia: "Optimized for Namibia buyers with reliable delivery routes from Poland and Europe.",
    ethiopia: "Optimized for Ethiopia buyers with legal imports from Poland and Europe.",
    zimbabwe: "Optimized for Zimbabwe buyers with legal products from Poland and Europe.",
    dubai: "Optimized for Dubai market users with secure cross-border sourcing from Europe, Africa, and Asia.",
    asia: "Optimized for Asian market users with secure trade routes to Europe and Africa.",
    "africa-general": "Optimized for African, European, Dubai, and Asian markets with legal cross-border sourcing."
  };

  if (regionHeadline) {
    regionHeadline.textContent = messages[market] || messages["africa-general"];
  }
  if (marketMode) {
    marketMode.textContent = `Market mode: ${market}. Interface copy and style adapt to user region and engagement trends.`;
  }
}

function applyAdaptiveTheme() {
  const themeChoices = ["vibrant", "neo", "elegant"];
  const stored = localStorage.getItem("vibecart-theme");
  const engagement = Number(localStorage.getItem("vibecart-engagement") || "0");

  let theme = stored;
  if (!theme || !themeChoices.includes(theme)) {
    const index = engagement % themeChoices.length;
    theme = themeChoices[index];
  }
  document.body.setAttribute("data-theme", theme);
}

function applyOwnerSettings() {
  let settings = {};
  try {
    settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    settings = {};
  }

  if (settings.title) {
    document.title = settings.title;
  }
  if (settings.badge && heroBadge) {
    heroBadge.textContent = settings.badge;
  }
  if (settings.headline && heroTitle) {
    heroTitle.textContent = settings.headline;
  }
  if (settings.subtitle && heroSubtitle) {
    heroSubtitle.textContent = settings.subtitle;
  }
  if (settings.bridgeTitle && bridgeTitle) {
    bridgeTitle.textContent = settings.bridgeTitle;
  }
  if (settings.bridgeText && bridgeText) {
    bridgeText.textContent = settings.bridgeText;
  }
  applyPromotedHomepageOffers(settings);
}

async function hydrateOwnerSettingsFromCloud() {
  try {
    const response = await fetch("/api/public/site-settings");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok || !payload.settings) {
      return;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload.settings));
    if (payload.settings.theme) {
      localStorage.setItem("vibecart-theme", String(payload.settings.theme));
    }
    applyOwnerSettings();
    applyAdaptiveTheme();
  } catch {
    // keep local fallback
  }
}

function registerEngagementSignals() {
  const interactive = document.querySelectorAll("a, button, select");
  interactive.forEach((node) => {
    node.addEventListener("click", () => {
      const current = Number(localStorage.getItem("vibecart-engagement") || "0");
      const next = current + 1;
      localStorage.setItem("vibecart-engagement", String(next));

      // Every 6 interactions rotate theme to keep UI fresh.
      if (next % 6 === 0) {
        const cycle = ["vibrant", "neo", "elegant"];
        const newTheme = cycle[(next / 6) % cycle.length];
        localStorage.setItem("vibecart-theme", newTheme);
        document.body.setAttribute("data-theme", newTheme);
      }
    });
  });
}

const VC_CHRONO_KEY = "vibecart-vc-chronotope";
const VC_DEPTH_KEY = "vibecart-vc-hero-depth";

function applyVcChronotope() {
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    document.body.setAttribute("data-vc-chronotope", "day");
    return;
  }
  const on = localStorage.getItem(VC_CHRONO_KEY) !== "0";
  if (!on) {
    document.body.setAttribute("data-vc-chronotope", "day");
    return;
  }
  const h = new Date().getHours();
  const band =
    h >= 5 && h < 9 ? "dawn" : h >= 9 && h < 17 ? "day" : h >= 17 && h < 21 ? "dusk" : "night";
  document.body.setAttribute("data-vc-chronotope", band);
}

function initVcAtmosphere() {
  applyVcChronotope();
  window.setInterval(applyVcChronotope, 60 * 60 * 1000);
  const chBtn = document.getElementById("vcChronoToggle");
  const depBtn = document.getElementById("vcDepthToggle");
  if (chBtn) {
    const syncCh = () => {
      const on = localStorage.getItem(VC_CHRONO_KEY) !== "0";
      chBtn.textContent = on ? "Rhythm tint: on" : "Rhythm tint: off";
    };
    syncCh();
    chBtn.addEventListener("click", () => {
      localStorage.setItem(VC_CHRONO_KEY, localStorage.getItem(VC_CHRONO_KEY) === "0" ? "1" : "0");
      syncCh();
      applyVcChronotope();
    });
  }
  if (depBtn) {
    const syncD = () => {
      const on = localStorage.getItem(VC_DEPTH_KEY) !== "0";
      depBtn.textContent = on ? "Hero depth tilt: on" : "Hero depth tilt: off";
      document.body.classList.toggle("vc-hero-depth", on);
    };
    syncD();
    depBtn.addEventListener("click", () => {
      localStorage.setItem(VC_DEPTH_KEY, localStorage.getItem(VC_DEPTH_KEY) === "0" ? "1" : "0");
      syncD();
    });
  } else {
    document.body.classList.toggle("vc-hero-depth", localStorage.getItem(VC_DEPTH_KEY) !== "0");
  }
}

function initHeroParallaxDepth() {
  const hero = document.querySelector(".hero");
  const copy = document.querySelector(".hero-copy");
  if (!hero || !copy) {
    return;
  }
  if (vcShouldReduceScrollEffects()) {
    return;
  }
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  if (localStorage.getItem(VC_DEPTH_KEY) === "0") {
    return;
  }
  let raf = 0;
  const apply = (cx, cy) => {
    if (!document.body.classList.contains("vc-hero-depth")) {
      copy.style.transform = "";
      return;
    }
    const rx = Math.max(-5.5, Math.min(5.5, (cx - 0.5) * 11));
    const ry = Math.max(-4.5, Math.min(4.5, (cy - 0.5) * -9));
    copy.style.transform = `perspective(960px) rotateY(${rx.toFixed(2)}deg) rotateX(${ry.toFixed(2)}deg) translateZ(8px)`;
  };
  hero.addEventListener(
    "pointermove",
    (e) => {
      if (!document.body.classList.contains("vc-hero-depth")) {
        return;
      }
      const r = hero.getBoundingClientRect();
      const cx = (e.clientX - r.left) / Math.max(1, r.width);
      const cy = (e.clientY - r.top) / Math.max(1, r.height);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply(cx, cy));
    },
    { passive: true }
  );
  hero.addEventListener("pointerleave", () => {
    copy.style.transform = "";
  });
}

function initLuxuryMotion() {
  const params = new URLSearchParams(window.location.search || "");
  if (params.get("instant") === "1") {
    document.body.classList.add("luxe-ready", "luxe-instant");
    document.querySelectorAll(".hero, .section").forEach((node) => node.classList.add("is-visible"));
    return;
  }
  document.body.classList.add("luxe-ready");
  const nodes = document.querySelectorAll(".hero, .section");
  nodes.forEach((node, index) => {
    if (index < 4) {
      node.classList.add("is-visible");
    }
  });
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px 4% 0px" }
  );
  nodes.forEach((node) => observer.observe(node));
  window.setTimeout(() => {
    if (!document.body.classList.contains("luxe-ready") || document.body.classList.contains("luxe-instant")) {
      return;
    }
    nodes.forEach((node) => {
      if (!node.classList.contains("is-visible")) {
        node.classList.add("is-visible");
      }
    });
  }, 2600);
}

function initBrandSignatureMotion() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  if (vcShouldReduceScrollEffects()) {
    return;
  }
  const hero = document.querySelector(".hero");
  const heroVisual = document.querySelector(".hero-image");
  const heroBg = document.querySelector(".hero-captivate-bg");
  if (!hero || !heroVisual || !heroBg) {
    return;
  }

  const applyDepth = (x, y) => {
    heroVisual.style.transform = `translate(${x * 12}px, ${y * 12}px) scale(1.02)`;
    heroBg.style.transform = `translate(${x * -16}px, ${y * -10}px) scale(1.03)`;
  };

  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    applyDepth(x, y);
  });
  hero.addEventListener("mouseleave", () => {
    heroVisual.style.transform = "translate(0, 0) scale(1)";
    heroBg.style.transform = "translate(0, 0) scale(1)";
  });

  window.addEventListener(
    "scroll",
    () => {
      const rect = hero.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height * 0.5 - viewportH * 0.5) / viewportH));
      heroVisual.style.transform = `translate(0, ${progress * -14}px) scale(1.02)`;
      heroBg.style.transform = `translate(0, ${progress * -24}px) scale(1.04)`;
    },
    { passive: true }
  );

  if (window.DeviceOrientationEvent) {
    window.addEventListener(
      "deviceorientation",
      (event) => {
        const beta = Number(event.beta || 0);
        const gamma = Number(event.gamma || 0);
        const tiltX = Math.max(-0.5, Math.min(0.5, gamma / 40));
        const tiltY = Math.max(-0.5, Math.min(0.5, beta / 80));
        applyDepth(tiltX, tiltY);
      },
      { passive: true }
    );
  }
}

function initMobileQuickNav() {
  const nav = document.getElementById("mobileQuickNav");
  if (!nav) {
    return;
  }
  /* Only same-page # links belong in scroll-spy; external href + data-quick-target caused wrong highlights (Account vs passport). */
  const links = Array.from(nav.querySelectorAll("a[data-quick-target]")).filter((link) => {
    const href = String(link.getAttribute("href") || "");
    return href.startsWith("#");
  });
  const sections = links
    .map((link) => document.getElementById(String(link.getAttribute("data-quick-target") || "")))
    .filter(Boolean);

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = String(link.getAttribute("href") || "");
      if (!href.startsWith("#")) {
        return;
      }
      event.preventDefault();
      const targetId = String(link.getAttribute("data-quick-target") || "");
      const target = document.getElementById(targetId);
      if (target) {
        if (vcPreferInstantScrollForElement(target)) {
          const lenis = window.__vibecartLenis;
          try {
            if (lenis && typeof lenis.scrollTo === "function") {
              lenis.scrollTo(target, { offset: -88, immediate: true });
              return;
            }
          } catch {
            /* ignore */
          }
          target.scrollIntoView({ behavior: "auto", block: "start" });
          return;
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  if (!("IntersectionObserver" in window) || sections.length === 0) {
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) {
        return;
      }
      const id = String(visible.target.id || "");
      links.forEach((link) => {
        const active = String(link.getAttribute("data-quick-target") || "") === id;
        link.classList.toggle("is-active", active);
      });
    },
    { threshold: [0.2, 0.4, 0.6] }
  );
  sections.forEach((section) => observer.observe(section));
}

const market = resolveMarketFromLocale();
applyOwnerSettings();
hydrateOwnerSettingsFromCloud().catch(() => {});
setMarketCopy(market);
applyAdaptiveTheme();
registerEngagementSignals();
initVcAtmosphere();
initLuxuryMotion();
initHeroParallaxDepth();
initBrandSignatureMotion();
initMobileQuickNav();
wireOneClickBuy();
initializeBridgePaths().catch(() => {});
initVcDeepLinkFromQuery();
initMobileWebLayoutGuards();
initVcMobileAppFx();
initVcScrollKinetics();
initVcHorizontalRails();
initVcCinematicExperience();
initCinematicIntro();
initConnectivityBanner();
initShopFolderKeyboardNav();
initShopFolderConstellation();
initDailyRouteFortune();
initVibeVipSecrets();
initPremiumSubscriptionExperience();
initVibePassport();
initVibeFlowMotion();
initHeroCanvasFx();
initShopSearch();
initHeroChips();
initBrandHomeLink();

window.addEventListener("keydown", (event) => {
  easterKeyBuffer.push(String(event.key || "").toLowerCase());
  if (easterKeyBuffer.length > 20) {
    easterKeyBuffer.shift();
  }
  if (easterKeyBuffer.join("").includes("kudakwaishe")) {
    revealHiddenPhrase();
  }
});

if (heroTitle) {
  heroTitle.setAttribute("title", "Adaptive secure marketplace");
}

function appendMessage(text, senderType) {
  if (!messagesBox) {
    return;
  }
  const node = document.createElement("div");
  node.classList.add("msg");
  node.classList.add(senderType === "seller" ? "msg-seller" : "msg-buyer");
  node.textContent = text;
  messagesBox.appendChild(node);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function initializeCommunicationHub() {
  if (!messagesBox || !chatInput || !chatSend) {
    return;
  }

  appendMessage("Buyer: Hi, is this item available for delivery to Nairobi?", "buyer");
  appendMessage("Seller: Yes, available. I can ship with secure tracked delivery.", "seller");

  chatSend.addEventListener("click", async () => {
    const text = chatInput.value.trim();
    if (!text) {
      return;
    }
    appendMessage(`You: ${text}`, "buyer");
    chatInput.value = "";
    await runChatSafetyCheck(text);
  });
}

initializeCommunicationHub();

async function runChatSafetyCheck(messageText) {
  if (!chatSafetyAlert) {
    return;
  }
  chatSafetyAlert.classList.add("hidden");
  chatSafetyAlert.textContent = "";
  try {
    const response = await fetch("/api/public/chat/safety-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderUserId: getPublicUserId(),
        messageText
      })
    });
    const payload = await response.json();
    if (!payload || !payload.ok || payload.riskLevel === "low") {
      return;
    }
    const matchedText = Array.isArray(payload.matchedRules) && payload.matchedRules.length
      ? ` Indicators: ${payload.matchedRules.join(", ")}.`
      : "";
    chatSafetyAlert.textContent = `Safety warning (${payload.riskLevel}): this message may contain scam patterns.${matchedText}`;
    chatSafetyAlert.classList.remove("hidden");
  } catch {
    chatSafetyAlert.textContent = "Safety check is temporarily unavailable. Do not share OTPs or pay outside VibeCart.";
    chatSafetyAlert.classList.remove("hidden");
  }
}

function parseProductCards() {
  return Array.from(products).map((card) => {
    const title = card.querySelector("h3")?.textContent?.trim() || "Unknown Product";
    const priceText = card.querySelector(".price")?.textContent || "EUR 99999";
    const price = Number(priceText.replace(/[^\d.]/g, "")) || 99999;
    const shipping = card.querySelector("p:not(.price)")?.textContent?.trim() || "";
    const category = card.getAttribute("data-category") || "All";
    return { title, price, shipping, category };
  });
}

function scoreProduct(product, preference) {
  let score = 0;
  const needText = preference.need.toLowerCase();
  const titleText = product.title.toLowerCase();

  if (preference.category === "All" || preference.category === product.category) {
    score += 5;
  }
  const fashionWords = [
    "fashion",
    "clothes",
    "clothing",
    "outfit",
    "dress",
    "shoe",
    "sneaker",
    "jacket",
    "night",
    "wear",
    "style",
    "jeans",
    "skirt",
    "hoodie"
  ];
  if (needText && fashionWords.some((w) => needText.includes(w)) && product.category === "Fashion") {
    score += 8;
  }
  if (needText && (titleText.includes("phone") || needText.includes("phone")) && product.category === "Electronics") {
    score += 4;
  }
  if (needText && (needText.includes("study") || needText.includes("book")) && product.category === "Books") {
    score += 4;
  }
  if (needText && (needText.includes("game") || needText.includes("gaming")) && product.category === "Gaming") {
    score += 4;
  }
  const electronicsWords = ["laptop", "tablet", "charger", "headphone", "tech", "electronic", "usb", "camera"];
  if (needText && electronicsWords.some((w) => needText.includes(w)) && product.category === "Electronics") {
    score += 7;
  }
  if (needText && (needText.includes("read") || needText.includes("textbook")) && product.category === "Books") {
    score += 5;
  }
  if (product.price <= preference.budget) {
    score += 6;
  } else if (product.price <= preference.budget * 1.2) {
    score += 2;
  }

  return score;
}

function currentUiLocale() {
  const i18n = window.VibeCartI18n;
  if (!i18n) {
    return "en";
  }
  const raw = i18n.getStored();
  if (!raw) {
    return "en";
  }
  return i18n.pick(raw);
}

function applyGlobalVisualLayout(personaMode) {
  const aura = personaMode === "fun";
  document.body.classList.toggle("vc-layout-aura", aura);
  document.body.classList.toggle("vc-layout-exclusive", !aura);
  document.body.dataset.vcPersona = aura ? "aura" : "exclusive";
}

function syncShopSearchPlaceholder() {
  const input = document.getElementById("shopSearchInput");
  if (!input) {
    return;
  }
  const i18n = window.VibeCartI18n;
  const key = input.getAttribute("data-i18n-placeholder");
  if (!i18n || !key) {
    return;
  }
  const val = i18n.t(currentUiLocale(), key);
  if (val) {
    input.setAttribute("placeholder", val);
  }
}

function initShopSearch() {
  const form = document.getElementById("shopSearchForm");
  const input = document.getElementById("shopSearchInput");
  const status = document.getElementById("shopSearchStatus");
  if (!form || !input) {
    return;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = String(input.value || "").trim();
    if (!q) {
      if (status) {
        status.textContent = "Enter what you want to find.";
      }
      return;
    }
    if (status) {
      status.textContent = "Searching everything...";
    }
    window.location.assign(`./global-search.html?q=${encodeURIComponent(q)}`);
  });
}

function vcScrollToSelector(selector) {
  const el = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!el) {
    return;
  }
  const instant = vcPreferInstantScrollForElement(el);
  const lenis = window.__vibecartLenis;
  try {
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(
        el,
        instant ? { offset: -88, immediate: true } : { offset: -88, duration: 0.85 }
      );
      return;
    }
  } catch {
    /* ignore */
  }
  el.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
}

function flashTargetSection(el) {
  if (!el) {
    return;
  }
  el.classList.remove("vc-target-flash");
  void el.offsetWidth;
  el.classList.add("vc-target-flash");
  window.setTimeout(() => {
    el.classList.remove("vc-target-flash");
  }, 1250);
}

function initHeroChips() {
  const strip = document.querySelector(".signature-strip--interactive");
  if (!strip) {
    return;
  }
  const hint = document.getElementById("heroChipHint");
  const chips = strip.querySelectorAll(".hero-chip[data-hero-chip-target]");
  const hintKeyFor = (kind) => {
    if (kind === "checkout") {
      return "hero.chipHintCheckout";
    }
    if (kind === "sellers") {
      return "hero.chipHintSellers";
    }
    return "hero.chipHintDelivery";
  };
  const announce = (chip) => {
    if (!hint) {
      return;
    }
    const kind = String(chip.getAttribute("data-hero-chip") || "");
    const key = hintKeyFor(kind);
    const i18n = window.VibeCartI18n;
    const L = currentUiLocale();
    hint.textContent = i18n && typeof i18n.t === "function" ? i18n.t(L, key) : "";
  };
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const kind = String(chip.getAttribute("data-hero-chip") || "");
      const route =
        kind === "checkout"
          ? "./buy-journey.html?flow=buy&lane=fashion"
          : kind === "sellers"
            ? "./regional-shops.html"
            : "./orders-tracking.html";
      strip.querySelectorAll(".hero-chip").forEach((c) => c.classList.remove("hero-chip--active"));
      chip.classList.add("hero-chip--active");
      announce(chip);
      window.location.assign(route);
    });
  });
  const refreshHintIfChipActive = () => {
    const active = strip.querySelector(".hero-chip--active");
    if (active) {
      announce(active);
    }
  };
  if (siteLanguage) {
    siteLanguage.addEventListener("change", refreshHintIfChipActive);
  }
}

function initBrandHomeLink() {
  const link = document.getElementById("brandHomeLink");
  if (!link) {
    return;
  }
  const href = String(link.getAttribute("href") || "").trim();
  if (href && href !== "#") {
    return;
  }
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const lenis = window.__vibecartLenis;
    try {
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, { immediate: true });
        return;
      }
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
  });
}

function getAISuggestions() {
  if (!aiResult || !aiSuggest || !aiNeed || !aiBudget || !aiCategory) {
    return;
  }

  const preference = {
    need: aiNeed.value.trim(),
    budget: Number(aiBudget.value) || 99999,
    category: aiCategory.value || "All"
  };

  const cards = parseProductCards();
  if (!cards.length) {
    aiResult.textContent =
      "No demo listings found on this page yet. Scroll to Live Marketplace above, then try again.";
    return;
  }

  const scored = cards
    .map((product) => ({ ...product, score: scoreProduct(product, preference) }))
    .sort((a, b) => b.score - a.score);
  let ranked = scored.slice(0, 3);

  const L = currentUiLocale();
  const i18n = window.VibeCartI18n;
  const noMatch =
    i18n && typeof i18n.t === "function"
      ? i18n.t(L, "ai.noMatch")
      : "No exact match yet. Try increasing budget or selecting 'Any' category for better suggestions.";
  if (!ranked.length) {
    aiResult.textContent = noMatch;
    return;
  }

  if (ranked[0].score <= 0) {
    const budget = preference.budget;
    ranked = scored
      .map((p) => ({
        ...p,
        score: -Math.abs(p.price - budget)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    if (!ranked.length) {
      aiResult.textContent = noMatch;
      return;
    }
  }

  const lines = ranked.map(
    (item, idx) =>
      `${idx + 1}. ${item.title} - EUR ${item.price} (${item.category}) | ${item.shipping}`
  );
  const persona = localStorage.getItem(AI_PERSONA_KEY) || "efficient";
  const effPrefix =
    i18n && typeof i18n.t === "function" ? i18n.t(L, "ai.resultEffPrefix") : "Ranked matches";
  const funPrefix =
    i18n && typeof i18n.t === "function" ? i18n.t(L, "ai.resultFunPrefix") : "Vibe-ranked picks";
  const prefix = persona === "fun" ? funPrefix : effPrefix;
  const joiner = persona === "fun" ? " ✦ " : " | ";
  const relaxed =
    scored[0].score <= 0 ? " (relaxed budget fit — refine your need text for tighter style matches)" : "";
  aiResult.textContent = `${prefix}: ${lines.join(joiner)}${relaxed}`;
  try {
    aiAssistantSection?.scrollIntoView({ behavior: "smooth", block: "center" });
    aiResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch {
    /* ignore */
  }
}

if (aiSuggest) {
  aiSuggest.addEventListener("click", (event) => {
    event.preventDefault();
    getAISuggestions();
  });
}

function initAiAssistantShortcuts() {
  const run = (event) => {
    if (event.key !== "Enter") {
      return;
    }
    const t = event.target;
    if (t !== aiNeed && t !== aiBudget) {
      return;
    }
    event.preventDefault();
    getAISuggestions();
  };
  aiNeed?.addEventListener("keydown", run);
  aiBudget?.addEventListener("keydown", run);
}

function getSellerOnboardedCount() {
  const raw = Number(localStorage.getItem(SELLER_ONBOARDED_KEY) || "0");
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(10, Math.floor(raw)));
}

function setSellerOnboardedCount(next) {
  localStorage.setItem(SELLER_ONBOARDED_KEY, String(Math.max(0, Math.min(10, Math.floor(next)))));
  renderSellerGrowthProgress();
}

function renderSellerGrowthProgress() {
  if (sgCount) {
    sgCount.textContent = String(getSellerOnboardedCount());
  }
  if (sgMilestone) {
    const c = getSellerOnboardedCount();
    if (c >= 10) {
      sgMilestone.textContent =
        "10/10 reached. Next: turn AI focus to buyer traffic, first orders, and featured shop pages.";
    } else if (c >= 7) {
      sgMilestone.textContent = `${c}/10: verify payout details, tighten listing quality, and line up two backup sellers so momentum does not stall.`;
    } else if (c >= 4) {
      sgMilestone.textContent = `${c}/10: increase outreach volume, ask each seller for one warm intro, and pilot a small referral reward.`;
    } else {
      sgMilestone.textContent = `${c}/10: daily outbound plus one live touchpoint (table, room, or call) each week until you pass four verified sellers.`;
    }
  }
}

function buildSellerGrowthPlanText(niche, region, channel, ownerName) {
  const name = ownerName.trim() || "there";
  const ch =
    channel === "whatsapp"
      ? "WhatsApp groups and voice notes"
      : channel === "instagram"
        ? "Instagram DMs and short reels comments"
        : channel === "orgs"
          ? "student societies, faith groups, and hobby clubs"
          : channel === "mixed"
            ? "a mix of campus tables, WhatsApp, and Instagram"
            : "campus tables, flyers, and short in-person pitches";

  const dm = `Hi — ${name} from VibeCart. We help ${niche} sellers in ${region} reach serious buyers with clear fees and safer payouts. If you want early placement and founder support, reply YES and I will send the 3-minute setup checklist.`;

  const orgPitch = `Quick pitch: VibeCart is building the first ten ${niche} sellers in ${region} with extra visibility and hands-on onboarding. We handle the boring compliance copy; you keep quality and delivery promises tight.`;

  return (
    `AI Seller Growth Plan (target: 10 verified sellers) — niche: ${niche}; region: ${region}; channel focus: ${ch}. ` +
    "Definition of verified: accepted seller terms, completed profile, at least one live listing, and one test order path or manual review done. " +
    "Week 1 — Build a list of 40 prospects (friends-of-friends, small shops, student side-hustles). Message 10 per day using the template below. Book 5 short calls. " +
    "Week 2 — Convert calls into 4 live shops minimum; collect two referrals from each new seller. Run one group intro (online or campus) explaining fees and trust. " +
    "Week 3 — Push for 8 total sellers; fix blockers (photos, pricing, delivery wording) same-day. Start a simple leaderboard in your notes: speed-to-second-listing. " +
    "Week 4 — Close to 10; freeze messy categories; document your repeatable onboarding checklist for the next wave. " +
    `Daily cadence: 45 minutes prospecting, 30 minutes follow-ups, 15 minutes logging outcomes in your tracker (use the + button when someone is truly verified). ` +
    `DM template: "${dm}" ` +
    `Live/room line: "${orgPitch}" ` +
    "If progress stalls before 6 sellers, AI rule: cut your pitch to one sentence plus one proof (fee table or mock screenshot) and double touchpoints instead of rewriting copy."
  );
}

function runSellerGrowthPlan() {
  if (!sgPlanOut) {
    return;
  }
  const niche = (sgNiche && sgNiche.value.trim()) || "legal general goods";
  const region = (sgRegion && sgRegion.value.trim()) || "your primary city";
  const channel = sgChannel ? String(sgChannel.value || "mixed") : "mixed";
  const owner = sgOwnerName ? sgOwnerName.value.trim() : "";
  sgPlanOut.textContent = buildSellerGrowthPlanText(niche, region, channel, owner);
}

if (sgRunPlan) {
  sgRunPlan.addEventListener("click", runSellerGrowthPlan);
}
if (sgDec) {
  sgDec.addEventListener("click", () => setSellerOnboardedCount(getSellerOnboardedCount() - 1));
}
if (sgInc) {
  sgInc.addEventListener("click", () => setSellerOnboardedCount(getSellerOnboardedCount() + 1));
}

renderSellerGrowthProgress();
if (sgPlanOut && getSellerOnboardedCount() === 0 && !String(sgPlanOut.textContent || "").trim()) {
  runSellerGrowthPlan();
}

const trackingSteps = [
  "Order placed and payment verified.",
  "Seller confirmed and is preparing shipment.",
  "Package picked up by courier partner.",
  "Package in transit to destination country.",
  "Out for delivery to buyer address.",
  "Delivered successfully."
];

let trackingIndex = 0;

function renderTrackingStep(text) {
  if (!trackingTimeline) {
    return;
  }
  const row = document.createElement("div");
  row.className = "tracking-step";
  row.textContent = text;
  trackingTimeline.appendChild(row);
}

function initializeTracking() {
  if (!trackingTimeline) {
    return;
  }
  renderTrackingStep(`Update 1: ${trackingSteps[0]}`);
}

function pushNextTrackingUpdate() {
  if (!trackingTimeline || !nextTrackingStep) {
    return;
  }
  if (trackingIndex >= trackingSteps.length - 1) {
    renderTrackingStep("No further updates. Delivery process is complete.");
    return;
  }
  trackingIndex += 1;
  renderTrackingStep(`Update ${trackingIndex + 1}: ${trackingSteps[trackingIndex]}`);
}

function enableReturnWindow() {
  if (!returnWindowInfo) {
    return;
  }
  const now = new Date();
  const expires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  returnWindowInfo.textContent =
    `Return/refuse window status: open until ${expires.toLocaleString()}. Buyer can accept/return/refuse, seller gets response updates.`;
}

if (nextTrackingStep) {
  nextTrackingStep.addEventListener("click", pushNextTrackingUpdate);
}
if (openReturnWindow) {
  openReturnWindow.addEventListener("click", enableReturnWindow);
}
initializeTracking();
initHomepageTrafficSignals();

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installAppBtn) {
    installAppBtn.classList.remove("hidden");
  }
});

if (installAppBtn) {
  installAppBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installAppBtn.classList.add("hidden");
  });
}

function applyInteractionMode(mode) {
  if (!aiAssistantSection || !communicationSection || !trackingSection) {
    return;
  }
  if (mode === "simple") {
    aiAssistantSection.style.display = "none";
    communicationSection.style.display = "none";
    trackingSection.style.display = "block";
    return;
  }
  if (mode === "pro") {
    aiAssistantSection.style.display = "block";
    communicationSection.style.display = "block";
    trackingSection.style.display = "block";
    return;
  }
  aiAssistantSection.style.display = "block";
  communicationSection.style.display = "block";
  trackingSection.style.display = "block";
}

function initializeInteractionMode() {
  const stored = localStorage.getItem(INTERACTION_MODE_KEY) || "guided";
  if (interactionMode) {
    interactionMode.value = stored;
  }
  applyInteractionMode(stored);
  if (interactionMode) {
    interactionMode.addEventListener("change", (event) => {
      const nextMode = String(event.target.value || "guided");
      localStorage.setItem(INTERACTION_MODE_KEY, nextMode);
      applyInteractionMode(nextMode);
    });
  }
}

initializeInteractionMode();

function renderOpportunityRadar() {
  const ul = document.getElementById("vcOpportunityRadar");
  if (!ul) {
    return;
  }
  const lang = currentUiLocale();
  const lines = RADAR_HINTS[lang] || RADAR_HINTS.en;
  ul.innerHTML = "";
  lines.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });
}

function maybeShowLocaleInferenceOffer() {
  const i18n = window.VibeCartI18n;
  const banner = document.getElementById("localeSuggestBanner");
  const textEl = document.getElementById("localeSuggestText");
  const applyBtn = document.getElementById("localeSuggestApply");
  const dismissBtn = document.getElementById("localeSuggestDismiss");
  if (!i18n || !banner || !textEl || !applyBtn || !dismissBtn) {
    return;
  }
  const inferred = i18n.inferLocaleFromEnvironment();
  if (!inferred || inferred === "en") {
    return;
  }
  const storedRaw = i18n.getStored();
  const active = storedRaw ? i18n.pick(storedRaw) : "en";
  if (active === inferred) {
    return;
  }
  try {
    if (localStorage.getItem("vibecart-locale-offer-dismiss") === inferred) {
      return;
    }
  } catch {
    /* ignore */
  }
  const ui = storedRaw ? i18n.pick(storedRaw) : "en";
  const hook = i18n.suggestHookFor(inferred);
  const cap = i18n.t(ui, "lang.aiOfferCaption") || i18n.t("en", "lang.aiOfferCaption");
  textEl.textContent = `${hook} ${cap}`;
  applyBtn.textContent = i18n.t(ui, "lang.aiOfferSwitch") || i18n.t("en", "lang.aiOfferSwitch");
  dismissBtn.textContent = i18n.t(ui, "lang.aiOfferDismiss") || i18n.t("en", "lang.aiOfferDismiss");
  banner.classList.remove("hidden");
  applyBtn.onclick = () => {
    i18n.setStored(inferred);
    if (siteLanguage && [...siteLanguage.options].some((o) => o.value === inferred)) {
      siteLanguage.value = inferred;
    }
    banner.classList.add("hidden");
    renderOpportunityRadar();
    syncShopSearchPlaceholder();
  };
  dismissBtn.onclick = () => {
    try {
      localStorage.setItem("vibecart-locale-offer-dismiss", inferred);
    } catch {
      /* ignore */
    }
    banner.classList.add("hidden");
  };
}

function initLocaleAndPersonaDeck() {
  const i18n = window.VibeCartI18n;
  if (i18n) {
    let stored = i18n.getStored();
    if (!stored) {
      stored = "en";
    }
    if (siteLanguage) {
      if ([...siteLanguage.options].some((o) => o.value === stored)) {
        siteLanguage.value = stored;
      }
      siteLanguage.addEventListener("change", () => {
        i18n.setStored(siteLanguage.value);
        renderOpportunityRadar();
        syncShopSearchPlaceholder();
        try {
          const p = localStorage.getItem(PERSONA_PATH_KEY);
          if (p === "buyer" || p === "seller" || p === "curious") {
            applyPersonaHint(p);
          }
        } catch {
          /* ignore */
        }
        try {
          const a = getStoredPublicAuth();
          if (a && a.user) {
            paintAuthLoggedIn(a.user);
          }
        } catch {
          /* ignore */
        }
        updateJurisdictionStrip();
        refreshAccountPassportLabels();
      });
    }
    i18n.apply(stored || "en");
    syncShopSearchPlaceholder();
    maybeShowLocaleInferenceOffer();
  }

  const funBtn = document.getElementById("vcPersonaFun");
  const effBtn = document.getElementById("vcPersonaEff");
  const persona = localStorage.getItem(AI_PERSONA_KEY) || "efficient";

  function paintPersonaButtons(active) {
    if (!funBtn || !effBtn) {
      return;
    }
    const isFun = active === "fun";
    funBtn.setAttribute("aria-pressed", isFun ? "true" : "false");
    effBtn.setAttribute("aria-pressed", isFun ? "false" : "true");
    funBtn.classList.toggle("btn-primary", isFun);
    funBtn.classList.toggle("btn-secondary", !isFun);
    effBtn.classList.toggle("btn-primary", !isFun);
    effBtn.classList.toggle("btn-secondary", isFun);
    applyGlobalVisualLayout(active);
    updatePersonaStatusBanner(active);
  }

  function updatePersonaStatusBanner(active) {
    const statusEl = document.getElementById("vcPersonaStatus");
    if (!statusEl) {
      return;
    }
    const i18n = window.VibeCartI18n;
    const lang = currentUiLocale();
    const key = active === "fun" ? "persona.status.aura" : "persona.status.exclusive";
    const line = i18n && i18n.t ? i18n.t(lang, key) : "";
    statusEl.textContent =
      line ||
      (active === "fun"
        ? "Aura layout live — warm gradients, pulse mark, softer motion on phones."
        : "Exclusive layout live — crisp grids, cooler contrast, faster visual rhythm.");
  }

  paintPersonaButtons(persona === "fun" ? "fun" : "efficient");
  funBtn?.addEventListener("click", () => {
    localStorage.setItem(AI_PERSONA_KEY, "fun");
    paintPersonaButtons("fun");
    renderOpportunityRadar();
  });
  effBtn?.addEventListener("click", () => {
    localStorage.setItem(AI_PERSONA_KEY, "efficient");
    paintPersonaButtons("efficient");
    renderOpportunityRadar();
  });

  renderOpportunityRadar();
}

initLocaleAndPersonaDeck();

const demoAds = [
  {
    brand: "TechNova",
    title: "Student Laptop Week",
    body: "Save on reliable laptops for study and business.",
    cta: "Shop TechNova"
  },
  {
    brand: "UrbanFit",
    title: "Streetwear Drop",
    body: "New fashion arrivals across Africa and Europe routes.",
    cta: "Explore UrbanFit"
  },
  {
    brand: "LearnPro Books",
    title: "Exam Prep Picks",
    body: "Top-rated academic books and revision kits.",
    cta: "Browse LearnPro"
  }
];

function renderAdSlots() {
  if (!adSlots) {
    return;
  }
  const shuffled = [...demoAds].sort(() => Math.random() - 0.5);
  adSlots.innerHTML = "";
  shuffled.forEach((ad) => {
    const node = document.createElement("article");
    node.className = "ad-card";
    node.innerHTML = `
      <span class="ad-badge">Sponsored</span>
      <h3>${escapeHtml(ad.brand)}</h3>
      <p><strong>${escapeHtml(ad.title)}</strong></p>
      <p>${escapeHtml(ad.body)}</p>
      <button class="btn btn-primary">${escapeHtml(ad.cta)}</button>
    `;
    adSlots.appendChild(node);
  });
}

renderAdSlots();
if (refreshAds) {
  refreshAds.addEventListener("click", renderAdSlots);
}

function renderBookingSlots() {
  if (!bookingSlotsResult || !bookingServiceType || !bookingDate) {
    return;
  }
  const date = bookingDate.value || "selected date";
  const service = bookingServiceType.value || "Service";
  const sampleSlots = ["09:00", "11:00", "13:30", "16:00"];
  const safeService = encodeURIComponent(service);
  const safeDate = encodeURIComponent(date);
  const checkoutLink = `./checkout-details.html?flow=service_booking&service=${safeService}&date=${safeDate}`;
  bookingSlotsResult.innerHTML = `${service} slots on ${date}: ${sampleSlots.join(
    ", "
  )}. Payment is required before the date is locked.<br/><a class="btn btn-primary" href="${checkoutLink}">Pay deposit and reserve date</a>`;
  const prepayBtn = document.getElementById("bookingPrepayRouteBtn");
  if (prepayBtn) {
    prepayBtn.setAttribute("href", checkoutLink);
  }
}

if (showBookingSlots) {
  showBookingSlots.addEventListener("click", renderBookingSlots);
}

const TRUSTED_INSURANCE_PROVIDER_DOMAINS = new Set([
  "allianz.com",
  "axa.com",
  "cigna.com",
  "bupa.com",
  "discovery.co.za",
  "oldmutual.co.za"
]);

function normalizeInsuranceUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) {
    return "";
  }
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.href;
  } catch {
    return "";
  }
}

function isTrustedInsuranceWebsite(rawUrl) {
  const href = normalizeInsuranceUrl(rawUrl);
  if (!href) {
    return false;
  }
  try {
    const host = new URL(href).hostname.replace(/^www\./, "").toLowerCase();
    return Array.from(TRUSTED_INSURANCE_PROVIDER_DOMAINS).some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const demoInsurancePlans = [
  {
    provider: "Allianz",
    website: "https://www.allianz.com",
    plan: "Student Life Basic (illustrative)",
    type: "Life Cover",
    price: "EUR 4.99 / month",
    benefits: "Starter life protection and emergency support guidance."
  },
  {
    provider: "AXA",
    website: "https://www.axa.com",
    plan: "Student Health Shield (illustrative)",
    type: "Health Cover",
    price: "EUR 6.99 / month",
    benefits: "Basic outpatient support and tele-health guidance."
  },
  {
    provider: "Bupa",
    website: "https://www.bupa.com",
    plan: "Family Protect Plan (illustrative)",
    type: "Funeral Cover",
    price: "EUR 5.49 / month",
    benefits: "Affordable funeral support for student families."
  }
];

function renderInsurancePlans() {
  if (!insurancePlans) {
    return;
  }
  insurancePlans.innerHTML = "";
  demoInsurancePlans.forEach((item) => {
    const node = document.createElement("article");
    node.className = "vc-info-card";
    const providerUrl = normalizeInsuranceUrl(item.website);
    node.innerHTML = `
      <h3>${escapeHtml(item.plan)}</h3>
      <p><strong>${escapeHtml(item.provider)}</strong> - ${escapeHtml(item.type)}</p>
      <p class="price">${escapeHtml(item.price)}</p>
      <p>${escapeHtml(item.benefits)}</p>
      <p>
        <a class="btn btn-primary insurance-action-btn insurance-provider-link" data-provider-url="${escapeHtml(providerUrl)}" href="${escapeHtml(providerUrl)}" target="_blank" rel="noopener noreferrer">Visit provider website</a>
      </p>
    `;
    insurancePlans.appendChild(node);
  });
}

async function loadPublicInsurancePlans() {
  if (!insurancePlans) {
    return;
  }
  try {
    const localeCountry = (navigator.language || "").split("-")[1] || "";
    const response = await fetch(`/api/public/insurance/plans?countryCode=${encodeURIComponent(localeCountry)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok || !Array.isArray(payload.plans) || payload.plans.length === 0) {
      renderInsurancePlans();
      return;
    }
    insurancePlans.innerHTML = "";
    let rendered = 0;
    payload.plans.slice(0, 12).forEach((plan) => {
      const providerUrlRaw = plan.provider_website || plan.provider_url || plan.website_url || "";
      if (!isTrustedInsuranceWebsite(providerUrlRaw)) {
        return;
      }
      const providerUrl = normalizeInsuranceUrl(providerUrlRaw);
      if (!providerUrl) {
        return;
      }
      const node = document.createElement("article");
      node.className = "vc-info-card";
      const summary = plan.summary_text || "Verified insurance plan for students and families.";
      node.innerHTML = `
        <h3>${escapeHtml(plan.plan_name)}</h3>
        <p><strong>${escapeHtml(plan.provider_name)}</strong> - ${escapeHtml(plan.plan_type)}</p>
        <p class="price">${escapeHtml(plan.currency)} ${escapeHtml(Number(plan.monthly_premium).toFixed(2))} / month</p>
        <p>${escapeHtml(summary)}</p>
        <p>
          <a class="btn btn-primary insurance-action-btn insurance-provider-link" data-provider-url="${escapeHtml(providerUrl)}" href="${escapeHtml(providerUrl)}" target="_blank" rel="noopener noreferrer">Visit provider website</a>
        </p>
      `;
      insurancePlans.appendChild(node);
      rendered += 1;
    });
    if (!rendered) {
      renderInsurancePlans();
    }
  } catch {
    renderInsurancePlans();
  }
  wireInsuranceActionButtons();
}

function renderWellbeingTips() {
  if (!wellbeingTips) {
    return;
  }
  const tips = [
    "Set a reminder 5 days before subscription due date so cover does not lapse.",
    "Read waiting periods and exclusions before confirming a plan.",
    "Keep emergency contact numbers and policy number saved offline.",
    "Use trusted providers only and avoid sharing one-time payment codes."
  ];
  wellbeingTips.textContent = `Well-being and protection tips: ${tips.join(" | ")}`;
}

async function recordDisclaimerAcceptance(contextType, accepted) {
  try {
    const userId = getPublicUserId();
    await fetch("/api/public/disclaimer/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        contextType,
        accepted,
        acceptanceText:
          contextType === "insurance_subscription"
            ? "User accepted insurance third-party decision disclaimer."
            : "User accepted marketplace risk and legal responsibility disclaimer."
      })
    });
  } catch {
    // Ignore telemetry failure; UI flow still continues.
  }
}

function openDisclaimerGate(message, onContinue, checkboxNode) {
  // Fail-safe mode: avoid blocking modal entirely.
  if (checkboxNode) {
    checkboxNode.checked = true;
  }
  if (wellbeingTips) {
    wellbeingTips.textContent = `${message} Auto-accepted to keep the page responsive.`;
  }
  if (typeof onContinue === "function") {
    Promise.resolve(onContinue()).catch(() => {});
  }
  closeDisclaimerGate();
}

function closeDisclaimerGate() {
  if (!disclaimerGateModal) {
    return;
  }
  disclaimerGateModal.classList.add("hidden");
  if (disclaimerWatchdogTimer) {
    clearTimeout(disclaimerWatchdogTimer);
    disclaimerWatchdogTimer = null;
  }
  pendingDisclaimerAction = null;
  pendingDisclaimerCheckbox = null;
}

function wireMarketActionButtons() {
  const buttons = document.querySelectorAll(".product .btn.btn-primary");
  buttons.forEach((button) => {
    if (button.dataset.guardReady === "1") {
      return;
    }
    button.dataset.guardReady = "1";
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      if (!marketDisclaimerAck || !marketDisclaimerAck.checked) {
        openDisclaimerGate(
          "Before continuing, accept the marketplace disclaimer checkbox below the market section.",
          null,
          marketDisclaimerAck
        );
        return;
      }
      await recordDisclaimerAcceptance("marketplace_checkout", true);
      if (wellbeingTips) {
        wellbeingTips.textContent = "Disclaimer accepted. You can continue to product detail/checkout flow.";
      }
    });
  });
}

function wireInsuranceActionButtons() {
  const buttons = document.querySelectorAll(".insurance-action-btn");
  buttons.forEach((button) => {
    if (button.dataset.guardReady === "1") {
      return;
    }
    button.dataset.guardReady = "1";
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const providerUrl = String(button.getAttribute("data-provider-url") || button.getAttribute("href") || "").trim();
      if (!insuranceDisclaimerAck || !insuranceDisclaimerAck.checked) {
        openDisclaimerGate(
          "Before continuing, accept the insurance disclaimer checkbox in the insurance section.",
          null,
          insuranceDisclaimerAck
        );
        return;
      }
      await recordDisclaimerAcceptance("insurance_subscription", true);
      if (wellbeingTips) {
        wellbeingTips.textContent = "Insurance disclaimer accepted. Opening trusted provider website.";
      }
      if (providerUrl && isTrustedInsuranceWebsite(providerUrl)) {
        window.open(normalizeInsuranceUrl(providerUrl), "_blank", "noopener,noreferrer");
      }
    });
  });
}

loadPublicInsurancePlans();
if (refreshInsurance) {
  refreshInsurance.addEventListener("click", loadPublicInsurancePlans);
}
if (queueInsuranceTips) {
  queueInsuranceTips.addEventListener("click", renderWellbeingTips);
}
if (disclaimerGateClose) {
  disclaimerGateClose.addEventListener("click", closeDisclaimerGate);
}
if (disclaimerGateContinue) {
  disclaimerGateContinue.addEventListener("click", async () => {
    disclaimerGateContinue.disabled = true;
    disclaimerGateContinue.textContent = "Processing...";
    try {
      if (pendingDisclaimerCheckbox) {
        pendingDisclaimerCheckbox.checked = true;
      }
      if (pendingDisclaimerAction) {
        await pendingDisclaimerAction();
      } else if (wellbeingTips) {
        wellbeingTips.textContent = "Disclaimer accepted. Please continue with your action.";
      }
    } catch {
      if (wellbeingTips) {
        wellbeingTips.textContent = "Disclaimer accepted. You can continue even if telemetry failed.";
      }
    } finally {
      disclaimerGateContinue.disabled = false;
      disclaimerGateContinue.textContent = "I Accept and Continue";
      closeDisclaimerGate();
    }
  });
}
if (disclaimerGateModal) {
  disclaimerGateModal.addEventListener("click", (event) => {
    if (event.target === disclaimerGateModal) {
      closeDisclaimerGate();
    }
  });
}
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDisclaimerGate();
  }
});

function rememberCoachEntitlements(entitlements) {
  coachEntitlements = new Set(
    (Array.isArray(entitlements) ? entitlements : [])
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
  );
  try {
    localStorage.setItem(COACH_ENTITLEMENTS_CACHE_KEY, JSON.stringify(Array.from(coachEntitlements)));
  } catch {
    /* ignore */
  }
}

function restoreCoachEntitlements() {
  try {
    const raw = localStorage.getItem(COACH_ENTITLEMENTS_CACHE_KEY);
    if (!raw) {
      return;
    }
    rememberCoachEntitlements(JSON.parse(raw));
  } catch {
    /* ignore */
  }
}

function coachHasEntitlement(key) {
  return coachEntitlements.has(String(key || "").trim().toLowerCase());
}

function renderCoachMonetizationUi(state) {
  const section = document.getElementById("health-coach");
  if (!section) {
    return;
  }
  let host = document.getElementById("coachMonetizationHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "coachMonetizationHost";
    host.className = "alt";
    host.style.marginTop = "1rem";
    host.innerHTML = `
      <h3>VibeFit plans & add-ons</h3>
      <p class="note">Unlock unlimited check-ins, advanced wearable sync, and deep analysis reports.</p>
      <div class="hero-actions">
        <button type="button" id="coachPlanPlus" class="btn btn-primary">Start Plus (€6.99/mo)</button>
        <button type="button" id="coachPlanPro" class="btn btn-secondary">Start Pro (€12.99/mo)</button>
        <button type="button" id="coachAddonDeep" class="btn btn-secondary">Buy Deep Analysis (€2.99)</button>
        <button type="button" id="coachPartnerWellNest" class="btn btn-secondary">Open WellNest partner</button>
      </div>
      <label class="note" style="display:flex;align-items:center;gap:.45rem;margin:.5rem 0 0;">
        <input type="checkbox" id="coachAutoRenewChoice" checked />
        Enable automatic renewal for coach subscription
      </label>
      <p id="coachMonetizationStatus" class="note" aria-live="polite"></p>
    `;
    const anchor = coachDashboard ? coachDashboard.parentElement : section;
    anchor?.insertBefore(host, coachDashboard || null);
    document.getElementById("coachPlanPlus")?.addEventListener("click", () => {
      startCoachSubscriptionCheckout("PLUS").catch(() => {});
    });
    document.getElementById("coachPlanPro")?.addEventListener("click", () => {
      startCoachSubscriptionCheckout("PRO").catch(() => {});
    });
    document.getElementById("coachAddonDeep")?.addEventListener("click", () => {
      buyCoachAddonCheckout("DEEP_ANALYSIS").catch(() => {});
    });
    document.getElementById("coachPartnerWellNest")?.addEventListener("click", () => {
      trackCoachPartnerEvent("WellNest Health Cover", "click", "cpl", 0, { source: "health-coach-ui" }).catch(() => {});
      window.open("./insurance.html", "_blank", "noopener");
    });
    var coachAutoRenewChoice = document.getElementById("coachAutoRenewChoice");
    if (coachAutoRenewChoice) {
      var savedAutoRenew = localStorage.getItem(COACH_AUTO_RENEW_KEY);
      coachAutoRenewChoice.checked = savedAutoRenew === null ? true : savedAutoRenew === "1";
      coachAutoRenewChoice.addEventListener("change", function () {
        localStorage.setItem(COACH_AUTO_RENEW_KEY, coachAutoRenewChoice.checked ? "1" : "0");
      });
    }
  }
  const status = document.getElementById("coachMonetizationStatus");
  if (!status) {
    return;
  }
  if (!state || !state.plan) {
    status.textContent = "Plan info unavailable right now.";
    return;
  }
  const plan = state.plan;
  const features = Array.isArray(state.entitlements) ? state.entitlements : [];
  status.textContent = `Plan: ${plan.name} (${plan.code}) · ${plan.currency} ${Number(plan.monthlyPrice || 0).toFixed(2)}/month · features: ${features.join(", ") || "none"}.`;
}

async function refreshCoachMonetizationState() {
  try {
    const response = await fetch(`/api/public/coach/monetization?userId=${encodeURIComponent(getPublicUserId())}`);
    const payload = await response.json();
    if (!payload || !payload.ok) {
      return null;
    }
    coachMonetizationState = payload;
    rememberCoachEntitlements(payload.entitlements || []);
    renderCoachMonetizationUi(payload);
    return payload;
  } catch {
    return null;
  }
}

async function startCoachSubscriptionCheckout(planCode) {
  if (!coachDashboard) {
    return;
  }
  coachDashboard.textContent = `Starting ${planCode} subscription...`;
  var autoRenewPref = localStorage.getItem(COACH_AUTO_RENEW_KEY);
  var autoRenew = autoRenewPref === null ? true : autoRenewPref === "1";
  const response = await fetch("/api/public/coach/subscription/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: getPublicUserId(),
      planCode,
      source: "web-health-coach",
      autoRenew: autoRenew
    })
  });
  const result = await response.json();
  if (!result || !result.ok) {
    coachDashboard.textContent = "Could not start subscription right now.";
    return;
  }
  coachDashboard.textContent = `${planCode} activated. Premium coach features are now available. Auto-renew: ${autoRenew ? "on" : "off"}.`;
  await refreshCoachMonetizationState();
  await refreshCoachDashboard();
}

async function buyCoachAddonCheckout(addonCode) {
  if (!coachDashboard) {
    return;
  }
  coachDashboard.textContent = "Processing add-on purchase...";
  const response = await fetch("/api/public/coach/addon/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: getPublicUserId(),
      addonCode,
      channel: "web"
    })
  });
  const result = await response.json();
  if (!result || !result.ok) {
    coachDashboard.textContent = "Add-on purchase failed right now.";
    return;
  }
  coachDashboard.textContent = "Add-on unlocked. Refreshing coach dashboard.";
  await refreshCoachMonetizationState();
  await refreshCoachDashboard();
}

async function trackCoachPartnerEvent(partnerName, eventType, payoutModel, payoutAmount, metadata) {
  await fetch("/api/public/coach/partner/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: getPublicUserId(),
      partnerName,
      eventType,
      payoutModel,
      payoutAmount,
      currency: "EUR",
      metadata: metadata || null
    })
  }).catch(() => {});
}

async function saveCoachProfile() {
  if (!coachFocus || !coachDashboard) {
    return;
  }
  const payload = {
    userId: getPublicUserId(),
    coachFocus: coachFocus.value || "general_fitness",
    goalNotes: coachGoalNotes ? coachGoalNotes.value.trim() : "",
    baselineWeightKg: coachBaselineWeight && coachBaselineWeight.value ? Number(coachBaselineWeight.value) : null,
    targetWeightKg: coachTargetWeight && coachTargetWeight.value ? Number(coachTargetWeight.value) : null,
    dailyActivityGoal: coachActivityGoal ? coachActivityGoal.value.trim() : "",
    medicationTrackingEnabled: false
  };
  const response = await fetch("/api/public/coach/profile/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  coachDashboard.textContent = result.ok
    ? "AI Coach profile saved. You can now add daily check-ins."
    : "Could not save coach profile right now.";
}

async function addHealthCheckin() {
  if (!coachDashboard || !healthCheckinType) {
    return;
  }
  const payload = {
    userId: getPublicUserId(),
    checkinType: healthCheckinType.value || "wellbeing",
    metricValue: healthCheckinValue ? healthCheckinValue.value.trim() : "",
    notes: healthCheckinNotes ? healthCheckinNotes.value.trim() : ""
  };
  const response = await fetch("/api/public/coach/checkin/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  coachDashboard.textContent = result.ok
    ? "Health check-in saved securely."
    : "Could not save health check-in right now.";
}

function readWearablePrefs() {
  try {
    const raw = localStorage.getItem(WEARABLE_PREF_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function wearableVendorLabel(value) {
  const map = {
    none: "not linked",
    apple_watch: "Apple Watch",
    wear_os: "Wear OS",
    samsung_galaxy: "Samsung Galaxy Watch",
    garmin: "Garmin",
    fitbit: "Fitbit / Pixel Watch",
    polar: "Polar",
    whoop: "Whoop / Oura",
    other: "other device"
  };
  return map[value] || value || "not linked";
}

function formatWearableSummaryLine() {
  const prefs = readWearablePrefs();
  if (!prefs || prefs.vendor === "none" || !prefs.vendor) {
    return "Wearable: not configured on this browser.";
  }
  const digest = prefs.dailyDigest ? "daily digest on" : "daily digest off";
  const detail = prefs.detailedMetrics ? "HRV/sleep stages when allowed" : "basic metrics only";
  return `Wearable: ${wearableVendorLabel(prefs.vendor)} | ${digest} | ${detail}`;
}

function loadWearablePrefsIntoForm() {
  const prefs = readWearablePrefs();
  if (!prefs) {
    return;
  }
  if (wearableVendor && prefs.vendor) {
    wearableVendor.value = prefs.vendor;
  }
  if (wearableDailyDigest && typeof prefs.dailyDigest === "boolean") {
    wearableDailyDigest.checked = prefs.dailyDigest;
  }
  if (wearableDetailedMetrics && typeof prefs.detailedMetrics === "boolean") {
    wearableDetailedMetrics.checked = prefs.detailedMetrics;
  }
  if (wearableLinkStatus) {
    wearableLinkStatus.textContent = `Saved on this device: ${formatWearableSummaryLine()}`;
  }
}

async function saveWearablePreferences() {
  const prefs = {
    vendor: wearableVendor ? String(wearableVendor.value || "none") : "none",
    dailyDigest: wearableDailyDigest ? Boolean(wearableDailyDigest.checked) : true,
    detailedMetrics: wearableDetailedMetrics ? Boolean(wearableDetailedMetrics.checked) : false,
    updatedAt: new Date().toISOString()
  };
  if (prefs.detailedMetrics && !coachHasEntitlement("wearable_advanced")) {
    if (wearableLinkStatus) {
      wearableLinkStatus.textContent = "Detailed wearable metrics require VibeFit Plus.";
    }
    return;
  }
  try {
    localStorage.setItem(WEARABLE_PREF_KEY, JSON.stringify(prefs));
  } catch {
    if (wearableLinkStatus) {
      wearableLinkStatus.textContent = "Could not save wearable preferences in this browser.";
    }
    return;
  }
  if (wearableLinkStatus) {
    wearableLinkStatus.textContent = `Saved on this device. ${formatWearableSummaryLine()} — open the mobile app to complete HealthKit / Health Connect pairing.`;
  }
  try {
    const response = await fetch("/api/public/coach/wearable/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: getPublicUserId(),
        wearableVendor: prefs.vendor,
        dailyDigest: prefs.dailyDigest,
        detailedMetrics: prefs.detailedMetrics
      })
    });
    if (response.ok) {
      const result = await response.json();
      if (result && result.ok && wearableLinkStatus) {
        wearableLinkStatus.textContent += " Server acknowledged wearable preferences.";
      }
    }
  } catch {
    /* optional API not deployed */
  }
}

async function logWearableDemoCheckin() {
  const prefs = readWearablePrefs();
  if (!prefs || prefs.vendor === "none" || !prefs.vendor) {
    if (wearableLinkStatus) {
      wearableLinkStatus.textContent = "Choose a watch family and save preferences before logging a sample sync.";
    }
    return;
  }
  if (!coachDashboard) {
    return;
  }
  const demoSteps = 7200 + Math.floor(Math.random() * 4200);
  const demoSleep = prefs.detailedMetrics ? "6h58 REM" : "6h58";
  const demoActive = 38 + Math.floor(Math.random() * 35);
  const tag = (wearableVendorLabel(prefs.vendor) || "watch").slice(0, 10);
  let metricValue = `W:${tag} ${demoSteps}st ${demoActive}m ${demoSleep}`;
  if (prefs.detailedMetrics) {
    metricValue += " rHR58";
  }
  if (metricValue.length > 118) {
    metricValue = metricValue.slice(0, 118);
  }
  const payload = {
    userId: getPublicUserId(),
    checkinType: "activity",
    metricValue,
    notes: "Sample wearable sync from web."
  };
  try {
    const response = await fetch("/api/public/coach/checkin/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (wearableLinkStatus) {
      wearableLinkStatus.textContent = result.ok
        ? "Sample sync logged to your coach check-ins. Refresh the coach dashboard to see it."
        : "Sample sync could not reach the coach API — preference is still saved locally.";
    }
    if (result.ok) {
      await refreshCoachDashboard();
    }
  } catch {
    if (wearableLinkStatus) {
      wearableLinkStatus.textContent = "Network error during sample sync. Preferences remain saved locally.";
    }
  }
}

async function refreshCoachDashboard() {
  if (!coachDashboard) {
    return;
  }
  const wearableLine = formatWearableSummaryLine();
  try {
    const response = await fetch(`/api/public/coach/dashboard?userId=${encodeURIComponent(getPublicUserId())}`);
    const payload = await response.json();
    if (!payload || !payload.ok) {
      coachDashboard.textContent = `Coach dashboard is not available right now. ${wearableLine}`;
      return;
    }
    const profile = payload.profile || {};
    const checkins = Array.isArray(payload.recentCheckins) ? payload.recentCheckins : [];
    if (payload.monetization && payload.monetization.ok) {
      coachMonetizationState = payload.monetization;
      rememberCoachEntitlements(payload.monetization.entitlements || []);
      renderCoachMonetizationUi(payload.monetization);
    }
    const checkinText = checkins.length
      ? checkins.slice(0, 3).map((item) => `${item.checkin_type}: ${item.metric_value || "n/a"}`).join(" | ")
      : "No recent check-ins yet.";
    let wearOut = wearableLine;
    if (profile.wearable_vendor) {
      wearOut += ` | Server: ${profile.wearable_vendor} digest=${Number(profile.wearable_daily_digest) === 1 ? "on" : "off"}`;
    }
    const planText = coachMonetizationState && coachMonetizationState.plan
      ? `Plan: ${coachMonetizationState.plan.code}`
      : "Plan: FREE";
    coachDashboard.textContent =
      `Focus: ${profile.coach_focus || "not set"} | Goal: ${profile.goal_notes || "not set"} | ${planText} || Recent check-ins: ${checkinText} || ${wearOut}`;
  } catch {
    coachDashboard.textContent = `Coach dashboard request failed. Please try again. ${wearableLine}`;
  }
}

if (saveCoachProfileBtn) {
  saveCoachProfileBtn.addEventListener("click", saveCoachProfile);
}
if (addHealthCheckinBtn) {
  addHealthCheckinBtn.addEventListener("click", addHealthCheckin);
}
if (refreshCoachDashboardBtn) {
  refreshCoachDashboardBtn.addEventListener("click", refreshCoachDashboard);
}
if (saveWearablePrefsBtn) {
  saveWearablePrefsBtn.addEventListener("click", saveWearablePreferences);
}
if (syncWearableDemoBtn) {
  syncWearableDemoBtn.addEventListener("click", logWearableDemoCheckin);
}
restoreCoachEntitlements();
loadWearablePrefsIntoForm();
refreshCoachMonetizationState().catch(() => {});
refreshCoachDashboard();

const trustEntities = [
  { name: "Lublin Campus Deals", type: "Seller", score: 96, note: "Fast dispatch and low dispute rate." },
  { name: "Warsaw Campus Deals", type: "Seller", score: 95, note: "Reliable order handling and low dispute rate." },
  { name: "WellNest Health Cover", type: "Insurance", score: 93, note: "Verified partner with stable support." },
  { name: "DHL Express Route PL-ZA", type: "Delivery", score: 95, note: "Strong on-time and proof-of-delivery record." }
];

function renderTrustCards() {
  if (!trustCards) {
    return;
  }
  trustCards.innerHTML = "";
  trustEntities.forEach((item) => {
    const node = document.createElement("article");
    node.className = "vc-info-card trust-card-boring";
    node.innerHTML = `
      <h3>${escapeHtml(item.name)}</h3>
      <p><span class="price">${escapeHtml(String(item.type))}</span> · trust band ${escapeHtml(String(item.score))}/100 (illustrative)</p>
      <p>${escapeHtml(item.note)}</p>
    `;
    trustCards.appendChild(node);
  });
  updateTrustSnapshotMeta(false);
}

function updateTrustSnapshotMeta(fromLiveApi) {
  if (!trustSnapshotMeta) {
    return;
  }
  const i18n = window.VibeCartI18n;
  const lang = typeof currentUiLocale === "function" ? currentUiLocale() : "en";
  const time = new Date().toLocaleString();
  if (i18n && i18n.t) {
    const raw = i18n.t(lang, "transparency.updated") || i18n.t("en", "transparency.updated");
    if (raw) {
      trustSnapshotMeta.textContent = raw.replace("{time}", time);
      return;
    }
  }
  trustSnapshotMeta.textContent = fromLiveApi
    ? `Loaded ${time} · live trust rows below.`
    : `Loaded ${time} · illustrative rows until live data is available.`;
}

async function loadTrustCards() {
  if (!trustCards) {
    return;
  }
  try {
    const response = await fetch("/api/public/trust/profiles");
    const payload = await response.json();
    if (!response.ok || !payload.ok || !Array.isArray(payload.items) || payload.items.length === 0) {
      renderTrustCards();
      return;
    }
    trustCards.innerHTML = "";
    payload.items.slice(0, 6).forEach((item) => {
      const node = document.createElement("article");
      node.className = "vc-info-card trust-card-boring";
      const et = String(item.entity_type || "").toUpperCase();
      const eid = escapeHtml(item.entity_id);
      const ts = escapeHtml(Number(item.trust_score).toFixed(1));
      const dsr = escapeHtml(item.delivery_success_rate ?? "n/a");
      const dr = escapeHtml(item.dispute_rate ?? "n/a");
      const vs = escapeHtml(item.verification_score ?? "n/a");
      node.innerHTML = `
        <h3>${escapeHtml(et)} #${eid}</h3>
        <p>Trust band <span class="price">${ts}/100</span> · delivery ${dsr} · disputes ${dr} · verify ${vs}</p>
        <p>Snapshot — not a promise of future performance.</p>
      `;
      trustCards.appendChild(node);
    });
    updateTrustSnapshotMeta(true);
  } catch {
    renderTrustCards();
  }
}

function getRewardProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REWARD_KEY) || "{}");
    return {
      points: Number(parsed.points || 120),
      streakWeeks: Number(parsed.streakWeeks || 3)
    };
  } catch {
    return { points: 120, streakWeeks: 3 };
  }
}

async function loadRewardProfile() {
  const userId = getPublicUserId();
  try {
    const response = await fetch(`/api/public/rewards/profile?userId=${encodeURIComponent(userId)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok || !payload.profile) {
      renderRewards();
      return;
    }
    const profile = {
      points: Number(payload.profile.points_balance || 0),
      streakWeeks: Number(payload.profile.safe_action_streak_weeks || 0)
    };
    saveRewardProfile(profile);
    renderRewards();
  } catch {
    renderRewards();
  }
}

function getTier(points) {
  if (points >= 400) return "Campus Pro Saver";
  if (points >= 220) return "Campus Smart";
  return "Starter";
}

function renderRewards() {
  if (!rewardPoints || !rewardTier || !rewardStreak || !rewardProgressBar || !rewardStatus) {
    return;
  }
  const profile = getRewardProfile();
  const pointsToNext = Math.max(0, 400 - profile.points);
  const progress = Math.min(100, Math.round((profile.points / 400) * 100));
  rewardPoints.textContent = String(profile.points);
  rewardTier.textContent = getTier(profile.points);
  rewardStreak.textContent = `${profile.streakWeeks} weeks`;
  rewardProgressBar.style.width = `${progress}%`;
  rewardStatus.textContent =
    pointsToNext > 0
      ? `Keep going. ${pointsToNext} points to unlock Campus Pro Saver tier.`
      : "Top tier unlocked. You now receive priority student rewards.";
}

function saveRewardProfile(profile) {
  localStorage.setItem(REWARD_KEY, JSON.stringify(profile));
}

function addRewardPoints(amount) {
  const profile = getRewardProfile();
  profile.points += amount;
  if (amount > 0 && profile.points % 70 < amount) {
    profile.streakWeeks += 1;
  }
  saveRewardProfile(profile);
  renderRewards();
}

if (earnRewardPoints) {
  earnRewardPoints.addEventListener("click", async () => {
    const userId = getPublicUserId();
    try {
      const response = await fetch("/api/public/rewards/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          eventType: "safe_purchase"
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (rewardStatus) {
          rewardStatus.textContent = payload.code || "Could not add points now.";
        }
        return;
      }
      saveRewardProfile({ points: payload.pointsBalance, streakWeeks: payload.streakWeeks });
      renderRewards();
    } catch {
      addRewardPoints(20);
    }
  });
}
if (redeemReward) {
  redeemReward.addEventListener("click", async () => {
    const userId = getPublicUserId();
    try {
      const response = await fetch("/api/public/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          referenceType: "perk",
          referenceId: 1
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (rewardStatus) {
          rewardStatus.textContent = payload.code || "Could not redeem reward.";
        }
        return;
      }
      const previous = getRewardProfile();
      saveRewardProfile({ points: payload.pointsBalance, streakWeeks: previous.streakWeeks });
      renderRewards();
      if (rewardStatus) {
        rewardStatus.textContent = "Reward redeemed: Student delivery discount unlocked.";
      }
    } catch {
      const profile = getRewardProfile();
      if (profile.points < 60) {
        if (rewardStatus) {
          rewardStatus.textContent = "Not enough points yet. Complete more safe actions.";
        }
        return;
      }
      profile.points -= 60;
      saveRewardProfile(profile);
      renderRewards();
    }
  });
}

const onboardingSteps = [
  "Welcome. This quick tour helps you shop safely, save money, and use trusted sellers.",
  "Step 1: Start with Hot Picks and compare options quickly.",
  "Step 2: Use AI Assistant for budget-safe product picks and compare options fast.",
  "Step 3: Activate rewards by completing secure actions and on-time payments."
];
let onboardingIndex = 0;

function openOnboardingModal() {
  // Fail-safe: disable blocking onboarding modal flow.
  if (rewardStatus) {
    rewardStatus.textContent =
      "Smart Tour tips: Explore Hot Picks, use AI Assistant for budget-safe finds, and complete secure actions for rewards.";
  }
  localStorage.setItem(ONBOARDING_KEY, "1");
}

function closeOnboardingModal() {
  if (!onboardingModal) {
    localStorage.setItem(ONBOARDING_KEY, "1");
    return;
  }
  onboardingModal.classList.add("hidden");
  localStorage.setItem(ONBOARDING_KEY, "1");
}

if (openOnboarding) {
  openOnboarding.addEventListener("click", openOnboardingModal);
}
if (onboardingNext) {
  onboardingNext.addEventListener("click", () => {
    if (!onboardingText) {
      return;
    }
    if (onboardingIndex >= onboardingSteps.length - 1) {
      closeOnboardingModal();
      return;
    }
    onboardingIndex += 1;
    onboardingText.textContent = onboardingSteps[onboardingIndex];
  });
}
if (onboardingClose) {
  onboardingClose.addEventListener("click", closeOnboardingModal);
}

initBridgeAntiHijackGuard();
initGlobalTapHijackGuard();
initFashionTrendsRouteGuard();
initLanguageControlShield();
initTopbarSearchShield();
initScrollPositionRestore();
initVibecartLanePack();
initPublicAccountAuth();
loadTrustCards();
loadRewardProfile();
wireMarketActionButtons();
localStorage.setItem(ONBOARDING_KEY, "1");

(function initPremiumMotion() {
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mqReduce.matches) {
    return;
  }
  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lightScroll = vcShouldReduceScrollEffects();
  const allowCursorGlow =
    !reduceMotion &&
    !lightScroll &&
    window.matchMedia &&
    window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  if (allowCursorGlow) {
    document.documentElement.classList.add("vc-cursor-glow");
    let glowRaf = 0;
    document.documentElement.addEventListener(
      "pointermove",
      (e) => {
        const x = (e.clientX / Math.max(window.innerWidth, 1)) * 100;
        const y = (e.clientY / Math.max(window.innerHeight, 1)) * 100;
        cancelAnimationFrame(glowRaf);
        glowRaf = requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--vc-cx", `${x.toFixed(2)}%`);
          document.documentElement.style.setProperty("--vc-cy", `${y.toFixed(2)}%`);
        });
      },
      { passive: true }
    );
  }

  if (reduceMotion || lightScroll || typeof window.Lenis !== "function") {
    return;
  }
  try {
    const lenis = new window.Lenis({
      lerp: 0.55,
      smoothWheel: true,
      wheelMultiplier: 1.35
    });
    function onLenisFrame(time) {
      lenis.raf(time);
      requestAnimationFrame(onLenisFrame);
    }
    requestAnimationFrame(onLenisFrame);
    window.__vibecartLenis = lenis;
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href || href.length < 2 || href === "#") {
        return;
      }
      const id = href.slice(1);
      if (!id || id.includes(":")) {
        return;
      }
      if (id === "bridge-routes" && !anchor.hasAttribute("data-allow-bridge-nav")) {
        return;
      }
      if (anchor.dataset.vcLenisAnchor === "1") {
        return;
      }
      anchor.dataset.vcLenisAnchor = "1";
      anchor.addEventListener("click", (event) => {
        const target = document.getElementById(id);
        if (!target) {
          return;
        }
        event.preventDefault();
        const instant = vcPreferInstantScrollForId(id);
        const inApp = document.documentElement.classList.contains("vc-mobile-app");
        if (!inApp) {
          try {
            lenis.scrollTo(target, instant ? { offset: -88, immediate: true } : { offset: -88 });
            return;
          } catch {
            /* fall through */
          }
        }
        target.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
      });
    });
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashTarget = hash.slice(1);
      if (hashTarget === "bridge-routes" && !consumeBridgeJumpAllowance()) {
        try {
          history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        } catch {
          /* ignore */
        }
        return;
      }
      const jump = document.getElementById(hashTarget);
      if (jump) {
        const instant = vcPreferInstantScrollForId(hashTarget);
        requestAnimationFrame(() => {
          const inApp = document.documentElement.classList.contains("vc-mobile-app");
          if (!inApp) {
            try {
              lenis.scrollTo(jump, instant ? { offset: -88, immediate: true } : { offset: -88 });
              return;
            } catch {
              /* fall through */
            }
          }
          jump.scrollIntoView({ behavior: "auto", block: "start" });
        });
      }
    }
  } catch {
    /* ignore smooth scroll init failures */
  }
})();

(function initVibecartServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  window.addEventListener("load", () => {
    const inAppShell = document.documentElement.classList.contains("vc-mobile-app");
    if (inAppShell) {
      // Do not wipe storage inside app WebView; it can break app boot/session restore.
      return;
    }
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
      .catch(() => {});
    if (window.caches && typeof window.caches.keys === "function") {
      window.caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
        .catch(() => {});
    }
  });
})();
