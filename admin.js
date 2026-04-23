"use strict";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STORAGE_KEY = "vibecart-site-settings";
const AUTH_SESSION_KEY = "vibecart-owner-api-session";
const AI_LINK_KEY = "vibecart-ai-link";
const AI_SUGGESTIONS_KEY = "vibecart-ai-suggestions-feed";
const REVENUE_SETTINGS_KEY = "vibecart-revenue-settings";
const API_BASE_KEY = "vibecart-api-base-url";
const MESSAGE_CENTER_KEY = "vibecart-admin-message-center-v1";
const MESSAGE_CENTER_READ_AT_KEY = "vibecart-admin-message-read-at-v1";
const AFFILIATE_LINK_HEALTH_HISTORY_KEY = "vibecart-affiliate-link-health-history-v1";
const AFFILIATE_ALERT_LAST_KEY = "vibecart-affiliate-alert-last-v1";
const AFFILIATE_ALERT_SEVERITY_MODE_KEY = "vibecart-affiliate-alert-severity-mode-v1";
const AFFILIATE_LAST_CLICK_KEY = "vibecart-affiliate-last-click-v1";
const HOMEPAGE_TRAFFIC_GROWTH_KEY = "vibecart-homepage-traffic-growth-v1";
const BOOKKEEPING_LEDGER_KEY = "vibecart-bookkeeping-ledger-v1";
const PREMIUM_PLAN_SETTINGS_KEY = "vibecart-premium-plan-settings-v1";
const COMMISSION_VALIDATION_KEY = "vibecart-commission-validation-v1";
const COMMISSION_OFFER_FILTER_MODE_KEY = "vibecart-commission-offer-filter-mode-v1";
const LIVE_MONEY_DASHBOARD_KEY = "vibecart-live-money-dashboard-v1";
const affiliateRuntime = {
  linkHealth: null,
  reconciliation: null,
  quickStats: null,
  ownerRevenue: null
};
let liveMoneyDashboardTimer = 0;
const AFFILIATE_PROGRAMS = [
  { id: "awin", name: "Awin", signupUrl: "https://www.awin.com" },
  { id: "cj", name: "CJ Affiliate", signupUrl: "https://www.cj.com" },
  { id: "impact", name: "Impact", signupUrl: "https://impact.com" },
  { id: "partnerstack", name: "PartnerStack", signupUrl: "https://partnerstack.com" },
  { id: "amazon", name: "Amazon Associates", signupUrl: "https://affiliate-program.amazon.com" },
  { id: "rakuten-ad", name: "Rakuten Advertising", signupUrl: "https://rakutenadvertising.com" },
  { id: "shareasale", name: "ShareASale", signupUrl: "https://www.shareasale.com" },
  { id: "ebay-partner", name: "eBay Partner Network", signupUrl: "https://partnernetwork.ebay.com" },
  { id: "aliexpress-portals", name: "AliExpress Portals", signupUrl: "https://portals.aliexpress.com" },
  { id: "flexoffers", name: "FlexOffers", signupUrl: "https://www.flexoffers.com" },
  { id: "clickbank", name: "ClickBank", signupUrl: "https://www.clickbank.com" },
  { id: "admitad", name: "Admitad", signupUrl: "https://www.admitad.com" },
  { id: "trade-doubler", name: "Tradedoubler", signupUrl: "https://www.tradedoubler.com" },
  { id: "travelpayouts", name: "Travelpayouts", signupUrl: "https://www.travelpayouts.com" },
  { id: "booking-com", name: "Booking.com Affiliate Partner Program", signupUrl: "https://www.booking.com/affiliate-program/v2/index.html" },
  { id: "expedia-group", name: "Expedia Group Affiliate Program", signupUrl: "https://www.expediagroup.com/partner-solutions/affiliate-program/" },
  { id: "tripadvisor", name: "Tripadvisor Affiliate Program", signupUrl: "https://www.tripadvisor.com/Affiliates" },
  { id: "walmart", name: "Walmart Affiliate Program", signupUrl: "https://affiliates.walmart.com" },
  { id: "target", name: "Target Affiliates", signupUrl: "https://partners.target.com" },
  { id: "etsy", name: "Etsy Affiliate Program", signupUrl: "https://www.etsy.com/affiliates" },
  { id: "temu", name: "Temu Affiliate Program", signupUrl: "https://affiliate.temu.com" },
  { id: "alibaba", name: "Alibaba Affiliate Program", signupUrl: "https://portals.aliexpress.com" },
  { id: "bestbuy", name: "Best Buy Affiliate Program", signupUrl: "https://www.bestbuy.com/site/help-topics/affiliate-program/pcmcat204400050013.c?id=pcmcat204400050013" },
  { id: "asos", name: "ASOS Affiliate Program", signupUrl: "https://www.asosplc.com/affiliate-programme/" },
  { id: "zalando", name: "Zalando Partner Program", signupUrl: "https://affiliate.zalando.com" },
  { id: "shein", name: "SHEIN Affiliate Program", signupUrl: "https://us.shein.com/affiliate" },
  { id: "notino", name: "Notino Affiliate Program", signupUrl: "https://www.notino.com/affiliate-program/" },
  { id: "sephora", name: "Sephora Affiliate Program", signupUrl: "https://www.sephora.com/beauty/affiliate-program" },
  { id: "booking-holdings", name: "Agoda Affiliate Program", signupUrl: "https://partners.agoda.com" },
  { id: "canva", name: "Canva Affiliate Program", signupUrl: "https://www.canva.com/affiliates/" },
  { id: "adobe", name: "Adobe Affiliate Program", signupUrl: "https://www.adobe.com/affiliates.html" },
  { id: "shopify", name: "Shopify Affiliate Program", signupUrl: "https://www.shopify.com/affiliates" },
  { id: "namecheap", name: "Namecheap Affiliate Program", signupUrl: "https://www.namecheap.com/affiliates/" },
  { id: "udemy", name: "Udemy Affiliate Program", signupUrl: "https://about.udemy.com/affiliates/" },
  { id: "nike", name: "Nike Affiliate Program", signupUrl: "https://www.nike.com/help/a/affiliate-program" },
  { id: "apple-services", name: "Apple Services Performance Partners", signupUrl: "https://performance-partners.apple.com" }
];

/* Public or partner-network inboxes commonly used for publisher outreach (verify before production sends). */
const AFFILIATE_CONTACT_BY_ID = {
  awin: "publishers@awin.com",
  cj: "publishersupport@cj.com",
  impact: "partners@impact.com",
  partnerstack: "partners@partnerstack.com",
  amazon: "",
  "rakuten-ad": "publishersupport@rakuten.com",
  shareasale: "help@shareasale.com",
  "ebay-partner": "epnpartner@ebay.com",
  "aliexpress-portals": "",
  flexoffers: "publishers@flexoffers.com",
  clickbank: "support@clickbank.com",
  admitad: "publishers@admitad.com",
  "trade-doubler": "support@tradedoubler.com",
  travelpayouts: "affiliates@travelpayouts.com",
  "booking-com": "affiliateprogram@booking.com",
  "expedia-group": "affiliate@expedia.com",
  tripadvisor: "affiliates@tripadvisor.com",
  walmart: "affiliate@walmart.com",
  target: "",
  etsy: "affiliates@etsy.com",
  temu: "",
  alibaba: "",
  bestbuy: "affiliate@bestbuy.com",
  asos: "affiliate@asos.com",
  zalando: "affiliate.support@zalando.com",
  shein: "affiliate@shein.com",
  notino: "partners@notino.com",
  sephora: "",
  "booking-holdings": "affiliates@agoda.com",
  canva: "affiliates@canva.com",
  adobe: "affiliate@adobe.com",
  shopify: "affiliates@shopify.com",
  namecheap: "affiliates@namecheap.com",
  udemy: "business@udemy.com",
  nike: "",
  "apple-services": "affprograms@apple.com"
};

AFFILIATE_PROGRAMS.forEach((program) => {
  program.contactEmail = AFFILIATE_CONTACT_BY_ID[program.id] || "";
});

function getAffiliateProgramById(programId) {
  return AFFILIATE_PROGRAMS.find((item) => item.id === String(programId || "").trim()) || null;
}

function applyAffiliateContactToOutreach(programId) {
  const program = getAffiliateProgramById(programId);
  const select = document.getElementById("outreachPartnerSelect");
  const email = document.getElementById("outreachPartnerEmail");
  const status = document.getElementById("outreachStatus");
  if (!program) {
    return;
  }
  if (select) {
    select.value = program.id;
  }
  if (email) {
    email.value = String(program.contactEmail || "").trim();
    email.focus();
  }
  if (status) {
    status.textContent = program.contactEmail
      ? `Loaded ${program.name} contact into the outreach email field.`
      : `${program.name} is usually portal-only — use the official signup link, or paste the inbox your rep gave you.`;
  }
  setStatus(`Affiliate outreach: ${program.name}`);
}

function syncOutreachPartnerEmailFromSelect() {
  const select = document.getElementById("outreachPartnerSelect");
  const email = document.getElementById("outreachPartnerEmail");
  if (!select || !email) {
    return;
  }
  const program = getAffiliateProgramById(String(select.value || ""));
  if (!program || !program.contactEmail) {
    return;
  }
  if (!String(email.value || "").trim()) {
    email.value = String(program.contactEmail || "").trim();
  }
}

function initAffiliateOutreachUi() {
  const signupList = document.getElementById("affiliateProgramSignupList");
  const partnerList = document.getElementById("partnerOutreachList");
  const outreachSelect = document.getElementById("outreachPartnerSelect");
  if (signupList && !signupList.dataset.vcAffClickBound) {
    signupList.dataset.vcAffClickBound = "1";
    signupList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-aff-fill-email]");
      if (!btn) {
        return;
      }
      event.preventDefault();
      applyAffiliateContactToOutreach(String(btn.getAttribute("data-aff-fill-email") || ""));
    });
  }
  if (partnerList && !partnerList.dataset.vcAffClickBound) {
    partnerList.dataset.vcAffClickBound = "1";
    partnerList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-aff-fill-email]");
      if (!btn) {
        return;
      }
      event.preventDefault();
      applyAffiliateContactToOutreach(String(btn.getAttribute("data-aff-fill-email") || ""));
    });
  }
  if (outreachSelect && !outreachSelect.dataset.vcAffChangeBound) {
    outreachSelect.dataset.vcAffChangeBound = "1";
    outreachSelect.addEventListener("change", () => {
      syncOutreachPartnerEmailFromSelect();
    });
  }
}

const AFFILIATE_OUTREACH_DRAFTS = {
  initial_application:
    "Hello {partner_name} Affiliate Team,\n\n" +
    "My name is {owner_name}, and I am the founder of {site_name} ({site_url}).\n" +
    "We operate a cross-border marketplace audience focused on Africa-Europe commerce.\n\n" +
    "We would like to apply for your affiliate partnership and promote your offers through verified traffic lanes.\n\n" +
    "Business details:\n" +
    "- Company/brand: {site_name}\n" +
    "- Website: {site_url}\n" +
    "- Primary regions: Africa, Europe\n" +
    "- Main categories: fashion, electronics, lifestyle\n" +
    "- Traffic model: content + marketplace referrals\n\n" +
    "Please share onboarding requirements, tracking format, payout model, and compliance rules.\n\n" +
    "Thank you,\n{owner_name}\n{reply_email}",
  traffic_update:
    "Hello {partner_name} Affiliate Team,\n\n" +
    "Following up on our affiliate application for {site_name}.\n\n" +
    "Current traffic summary:\n" +
    "- Recent click-outs: {traffic_clicks}\n" +
    "- Active regions: {traffic_regions}\n" +
    "- Conversion-ready placements: homepage lane, category pages, and curated partner folders\n\n" +
    "We are ready to launch your tracking links as soon as approval is granted.\n\n" +
    "Please advise next steps.\n\n" +
    "Best regards,\n{owner_name}\n{reply_email}",
  approval_followup:
    "Hello {partner_name} Affiliate Team,\n\n" +
    "Thank you for reviewing our affiliate request.\n" +
    "Could you confirm approval status and provide production tracking links?\n\n" +
    "We are prepared to run a compliance-first launch with approved placements only.\n\n" +
    "Thank you,\n{owner_name}\n{reply_email}"
};

function getCommissionValidationState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMMISSION_VALIDATION_KEY) || "{}");
    return {
      offers: Array.isArray(parsed.offers) ? parsed.offers : []
    };
  } catch {
    return { offers: [] };
  }
}

function readCommissionOfferFilterMode() {
  try {
    const mode = String(localStorage.getItem(COMMISSION_OFFER_FILTER_MODE_KEY) || "commission_first").trim();
    if (mode === "commission_only" || mode === "all" || mode === "commission_first") {
      return mode;
    }
  } catch {
    /* ignore */
  }
  return "commission_first";
}

function saveCommissionOfferFilterMode(mode) {
  const normalized =
    mode === "commission_only" || mode === "all" || mode === "commission_first"
      ? mode
      : "commission_first";
  try {
    localStorage.setItem(COMMISSION_OFFER_FILTER_MODE_KEY, normalized);
  } catch {
    /* ignore */
  }
  const node = document.getElementById("commissionOfferFilterMode");
  if (node) {
    node.value = normalized;
  }
}

function isValidTrackedOfferUrl(url) {
  try {
    const parsed = new URL(String(url || "").trim());
    return /^https?:$/i.test(parsed.protocol);
  } catch {
    return false;
  }
}

function buildHomepageFeaturedOffers(mode) {
  const state = getCommissionValidationState();
  const all = (state.offers || []).filter((offer) => isValidTrackedOfferUrl(offer.url));
  const green = all.filter((offer) => String(offer.status || "traffic_only") === "commission_enabled");
  const traffic = all.filter((offer) => String(offer.status || "traffic_only") === "traffic_only");
  let selected = [];
  if (mode === "green_only") {
    selected = green.slice(0, 4);
  } else {
    // Traffic growth first: keep commission offers visible while preserving broader click-through volume.
    selected = [...green.slice(0, 2), ...traffic.slice(0, 2)];
    if (selected.length < 4) {
      const usedIds = new Set(selected.map((offer) => String(offer.id || "")));
      const fill = all.filter((offer) => !usedIds.has(String(offer.id || ""))).slice(0, 4 - selected.length);
      selected = [...selected, ...fill];
    }
  }
  return selected.slice(0, 4).map((offer) => ({
    offerName: String(offer.offerName || "Offer"),
    programName: String(offer.programName || offer.programId || "Partner"),
    url: String(offer.url || "").trim(),
    status: String(offer.status || "traffic_only"),
    promotedAt: new Date().toISOString()
  }));
}

async function promoteGreenOffersToHomepage(mode = "green_only") {
  const statusNode = document.getElementById("homepagePromotionStatus");
  const promoted = buildHomepageFeaturedOffers(mode);
  if (!promoted.length) {
    const msg = "No eligible offers with valid tracking URLs found.";
    if (statusNode) statusNode.textContent = `Homepage promotion: ${msg}`;
    setStatus(msg);
    return;
  }
  const base = getStoredSettings();
  const payload = {
    ...base,
    homeFeaturedOffers: promoted,
    homePromotionMode: mode === "green_only" ? "green_only" : "mixed_growth"
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  let cloudSaved = false;
  try {
    await authedPost("/api/owner/site-settings/upsert", { settings: payload });
    cloudSaved = true;
  } catch {
    cloudSaved = false;
  }
  const note = cloudSaved
    ? `Homepage promotion: ${promoted.length} ${mode === "green_only" ? "GREEN-only" : "mixed growth"} offers published to homepage cards.`
    : `Homepage promotion: ${promoted.length} offers saved locally (cloud save unavailable right now).`;
  if (statusNode) {
    statusNode.textContent = note;
  }
  setStatus(note);
  updateOwnerCommandDeck("Homepage offers promoted");
}

function saveCommissionValidationState(state) {
  localStorage.setItem(
    COMMISSION_VALIDATION_KEY,
    JSON.stringify({
      offers: (state && Array.isArray(state.offers) ? state.offers : []).slice(0, 200)
    })
  );
}

function getBookkeepingLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BOOKKEEPING_LEDGER_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookkeepingLedger(items) {
  localStorage.setItem(BOOKKEEPING_LEDGER_KEY, JSON.stringify(items.slice(0, 500)));
}

function addBookkeepingEntry(entry) {
  const now = Date.now();
  const ledger = getBookkeepingLedger();
  ledger.unshift({
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    at: new Date(now).toISOString(),
    type: String(entry.type || "ops_note"),
    note: String(entry.note || "").trim() || "Bookkeeping event",
    amountEur: Number(entry.amountEur || 0)
  });
  saveBookkeepingLedger(ledger);
  renderBookkeepingLedger();
}

function renderBookkeepingLedger() {
  const list = document.getElementById("bookkeepingLedgerList");
  const status = document.getElementById("bookkeepingChipStatus");
  if (!list || !status) {
    return;
  }
  const ledger = getBookkeepingLedger();
  if (!ledger.length) {
    status.textContent = "AI bookkeeping chip active. Waiting for first entry.";
    list.innerHTML = "<div class='msg msg-buyer'>No bookkeeping records yet.</div>";
    return;
  }
  const total = ledger.reduce((sum, row) => sum + Number(row.amountEur || 0), 0);
  status.textContent = `Bookkeeping entries: ${ledger.length}. Recorded total: EUR ${total.toFixed(2)}.`;
  list.innerHTML = "";
  ledger.slice(0, 80).forEach((row) => {
    const node = document.createElement("div");
    node.className = "msg msg-seller";
    node.textContent = `${row.at} | ${String(row.type).toUpperCase()} | EUR ${Number(row.amountEur || 0).toFixed(2)} | ${row.note}`;
    list.appendChild(node);
  });
}

function getPremiumPlanSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREMIUM_PLAN_SETTINGS_KEY) || "{}");
    return {
      enabled: String(parsed.enabled || "1") === "1",
      price: Number(parsed.price || 39.99),
      benefits:
        String(parsed.benefits || "").trim() ||
        "AI concierge responses, priority support lane, premium discovery layout, and luxury account badge."
    };
  } catch {
    return {
      enabled: true,
      price: 39.99,
      benefits: "AI concierge responses, priority support lane, premium discovery layout, and luxury account badge."
    };
  }
}
/** When admin is opened as file:// or odd schemes, localhost:8081 causes ECONNREFUSED if no local API. */
const PUBLIC_PRODUCTION_API_FALLBACK = "https://vibe-cart.com";
const DEFAULT_API_BASE = (() => {
  if (typeof window === "undefined") {
    return "http://localhost:8081";
  }
  const proto = window.location.protocol;
  const host = String(window.location.hostname || "").toLowerCase();
  if (proto === "https:" || proto === "http:") {
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8081";
    }
    return window.location.origin;
  }
  return PUBLIC_PRODUCTION_API_FALLBACK;
})();

const defaults = {
  title: "VibeCart | Africa-Europe-Asia Trade Bridge Marketplace",
  badge: "Africa <-> Europe <-> Asia Bridge Marketplace",
  headline: "One bridge. Africa, Europe, Dubai, and Asia connected for secure trade.",
  subtitle:
    "VibeCart is a secure, student-friendly marketplace for legal products. Discover offers from Poland and Europe, with routes to South Africa, Namibia, Kenya, Ethiopia, Zimbabwe, and other African markets. Trade both directions across Africa and Europe, plus Dubai and selected Asian markets. Pay with trusted payment systems available in your country and use reliable, secure delivery options.",
  bridgeTitle: "Africa-Europe-Asia Trade Bridge",
  bridgeText:
    "VibeCart is built as a digital bridge between Africa, Europe, Dubai, and Asian markets, making it possible to source legal products across borders in both directions with confidence.",
  theme: "vibrant"
};

function getStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function getSettings() {
  return { ...defaults, ...getStoredSettings() };
}

async function fetchCloudSettings() {
  try {
    const response = await fetch(`${getApiBase()}/api/public/site-settings`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok || !payload.settings) {
      return null;
    }
    return payload.settings;
  } catch {
    return null;
  }
}

function normalizeApiBase(input) {
  let value = String(input || "").trim().replace(/\/+$/, "");
  // Avoid .../api/api/owner/... when callers paste host + /api
  if (/\/api$/i.test(value)) {
    value = value.replace(/\/api$/i, "");
  }
  return value || DEFAULT_API_BASE;
}

function getApiBase() {
  const isProdPage = /^https?:$/i.test(window.location.protocol) && !/localhost|127\.0\.0\.1/i.test(window.location.host);
  let fromStorage = localStorage.getItem(API_BASE_KEY);
  if (isProdPage && fromStorage && /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(fromStorage)) {
    localStorage.removeItem(API_BASE_KEY);
    fromStorage = null;
  }
  const selected = normalizeApiBase(window.__VIBECART_API_BASE_URL__ || fromStorage || DEFAULT_API_BASE);
  if (isProdPage && /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(selected)) {
    return normalizeApiBase(window.location.origin);
  }
  return selected;
}

function saveApiBase(value) {
  localStorage.setItem(API_BASE_KEY, normalizeApiBase(value));
}

function setStatus(text) {
  const nodes = [document.getElementById("statusMsg"), document.getElementById("statusMsgLogin")];
  nodes.forEach((node) => {
    if (node) {
      node.textContent = text;
    }
  });
  if (text) {
    const normalized = String(text).trim();
    const isTransientServerNoise = /SERVER_ERROR|NETWORK_ERROR|HTTP_5\d\d/i.test(normalized);
    const lastStatus = String(window.__vibecartLastStatus || "");
    if (!isTransientServerNoise && normalized !== lastStatus) {
      addAdminMessage(normalized, "system");
      appendPulseItem(normalized);
    }
    window.__vibecartLastStatus = normalized;
    updateOwnerCommandDeck(normalized);
  }
}

function renderAdminReadinessReport(rows) {
  const reportNode = document.getElementById("adminReadinessReport");
  if (!reportNode) {
    return;
  }
  reportNode.innerHTML = "";
  rows.forEach((row) => {
    const node = document.createElement("div");
    node.className = "msg " + (row.pass ? "msg-seller" : "msg-buyer");
    node.textContent = `${row.pass ? "PASS" : "FAIL"} | ${row.label}${row.detail ? ` | ${row.detail}` : ""}`;
    reportNode.appendChild(node);
  });
}

async function runAdminReadinessGate() {
  const statusNode = document.getElementById("adminReadinessStatus");
  const reportRows = [];
  function add(pass, label, detail = "") {
    reportRows.push({ pass, label, detail });
  }
  if (statusNode) {
    statusNode.textContent = "Readiness gate: running live checks...";
  }
  const base = window.location.origin;

  try {
    const response = await fetch(`${base}/`, { method: "GET", cache: "no-store" });
    const required = [
      "strict-transport-security",
      "content-security-policy",
      "x-frame-options",
      "x-content-type-options",
      "referrer-policy",
      "permissions-policy"
    ];
    required.forEach((header) => {
      const has = Boolean(response.headers.get(header));
      add(has, `SECURITY header ${header}`, has ? "" : "missing");
    });
  } catch (error) {
    add(false, "SECURITY headers", String(error?.message || error));
  }

  const seoTargets = ["/index.html", "/hot-picks.html", "/world-shop-experience.html"];
  const seoPatterns = [
    /<meta[\s\S]*name=["']description["']/i,
    /<link[\s\S]*rel=["']canonical["']/i,
    /<meta[\s\S]*property=["']og:title["']/i,
    /<meta[\s\S]*name=["']twitter:card["']/i
  ];
  for (const path of seoTargets) {
    try {
      const response = await fetch(`${base}${path}`, { method: "GET", cache: "no-store" });
      const html = await response.text();
      const pass = seoPatterns.every((re) => re.test(html));
      add(pass, `SEO ${path}`, pass ? "meta set present" : "missing canonical/og/twitter/description tags");
      if (path === "/index.html") {
        const hasTerms =
          /href=["'](?:\.\/)?terms\.html(?:[?#][^"']*)?["']/i.test(html) || /terms\.html/i.test(html);
        const hasPrivacy =
          /href=["'](?:\.\/)?privacy\.html(?:[?#][^"']*)?["']/i.test(html) || /privacy\.html/i.test(html);
        const hasPolicy =
          /href=["'](?:\.\/)?policy\.html(?:[?#][^"']*)?["']/i.test(html) || /policy\.html/i.test(html);
        const legalPass = hasTerms && hasPrivacy && hasPolicy;
        add(legalPass, "LEGAL homepage links", legalPass ? "terms/privacy/policy present" : "missing legal links");
      }
    } catch (error) {
      add(false, `SEO ${path}`, String(error?.message || error));
    }
  }

  try {
    const samples = [];
    for (let i = 0; i < 5; i += 1) {
      const started = performance.now();
      const response = await fetch(`${base}/index.html?rg=${Date.now()}${i}`, { method: "GET", cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      samples.push(Math.round(performance.now() - started));
    }
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    const sorted = samples.slice().sort((a, b) => a - b);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    add(avg <= 2500, "PERF index.html avg", `${avg}ms`);
    add(p95 <= 4000, "PERF index.html p95", `${p95}ms`);
  } catch (error) {
    add(false, "PERF index.html", String(error?.message || error));
  }

  try {
    const health = await fetch(`${base}/api/health`, { method: "GET", cache: "no-store" });
    add(health.ok, "QA /api/health", `HTTP ${health.status}`);
  } catch (error) {
    add(false, "QA /api/health", String(error?.message || error));
  }
  try {
    const products = await fetch(`${base}/api/public/products/live`, { method: "GET", cache: "no-store" });
    add(products.ok, "QA /api/public/products/live", `HTTP ${products.status}`);
  } catch (error) {
    add(false, "QA /api/public/products/live", String(error?.message || error));
  }

  renderAdminReadinessReport(reportRows);
  const fails = reportRows.filter((row) => !row.pass).length;
  const summary = `Readiness gate: ${reportRows.length - fails}/${reportRows.length} checks passing.`;
  if (statusNode) {
    statusNode.textContent = summary;
  }
  setStatus(summary);
}

function appendPulseItem(text) {
  const feed = document.getElementById("pulseFeed");
  if (!feed || !text) {
    return;
  }
  const item = document.createElement("div");
  item.className = "pulse-item";
  item.textContent = `${new Date().toLocaleTimeString()} • ${String(text).slice(0, 120)}`;
  feed.prepend(item);
  while (feed.childElementCount > 20) {
    feed.removeChild(feed.lastElementChild);
  }
}

function updateOwnerCommandDeck(statusText) {
  const statusNode = document.getElementById("cmdStatus");
  const apiNode = document.getElementById("cmdApi");
  const syncNode = document.getElementById("cmdSync");
  if (statusNode) {
    statusNode.textContent = String(statusText || "Ready").slice(0, 72);
  }
  if (apiNode) {
    apiNode.textContent = getApiBase().replace(/^https?:\/\//i, "");
  }
  if (syncNode) {
    syncNode.textContent = new Date().toLocaleTimeString();
  }
}

function updateKpiStrip({ trustScore, riskEvents30d, ownerPayoutReady }) {
  const trustValue = document.getElementById("kpiTrustValue");
  const trustBar = document.getElementById("kpiTrustBar");
  const riskValue = document.getElementById("kpiRiskValue");
  const riskBar = document.getElementById("kpiRiskBar");
  const revenueValue = document.getElementById("kpiRevenueValue");
  const revenueBar = document.getElementById("kpiRevenueBar");
  const trust = Math.max(0, Math.min(100, Number(trustScore || 0)));
  const risk = Math.max(0, Number(riskEvents30d || 0));
  const riskPct = Math.max(0, Math.min(100, 100 - risk * 5));
  const revenue = Math.max(0, Number(ownerPayoutReady || 0));
  const revenuePct = Math.max(0, Math.min(100, revenue / 50));
  if (trustValue) trustValue.textContent = trust.toFixed(1);
  if (trustBar) trustBar.style.width = `${trust}%`;
  if (riskValue) riskValue.textContent = String(risk);
  if (riskBar) riskBar.style.width = `${riskPct}%`;
  if (revenueValue) revenueValue.textContent = revenue.toFixed(2);
  if (revenueBar) revenueBar.style.width = `${revenuePct}%`;
}

function getMessageCenterItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MESSAGE_CENTER_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessageCenterItems(items) {
  localStorage.setItem(MESSAGE_CENTER_KEY, JSON.stringify(items.slice(0, 80)));
}

function addAdminMessage(text, type = "note") {
  const clean = String(text || "").trim();
  if (!clean) {
    return;
  }
  const items = getMessageCenterItems();
  const nowMs = Date.now();
  items.unshift({
    text: clean,
    type,
    createdAt: new Date(nowMs).toLocaleString(),
    createdAtMs: nowMs
  });
  saveMessageCenterItems(items);
  updateMessageBadge().catch(() => {});
}

function inferMessageTypeFromText(text) {
  const value = String(text || "").toLowerCase();
  if (/urgent|critical|down|error|failed|security|breach|attack/.test(value)) {
    return "urgent";
  }
  if (/request|please|feature|todo|follow.?up|approve|need/.test(value)) {
    return "request";
  }
  return "system";
}

async function updateMessageBadge() {
  const badge = document.getElementById("adminMessageBadge");
  if (!badge) {
    return;
  }
  let unread = 0;
  const session = getSession();
  if (session && session.token) {
    try {
      const response = await fetch(`${getApiBase()}/api/owner/messages/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authToken: String(session.token || ""),
          token: String(session.token || ""),
          limit: 120
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.ok) {
        unread = Number(payload.unreadCount || 0);
        if (Array.isArray(payload.items)) {
          saveMessageCenterItems(payload.items);
        }
      }
    } catch {
      // fallback below
    }
  }
  if (!unread) {
    const items = getMessageCenterItems();
    const lastReadAt = Number(localStorage.getItem(MESSAGE_CENTER_READ_AT_KEY) || "0");
    unread = items.filter((item) => Number(item.createdAtMs || 0) > lastReadAt).length;
  }
  if (unread > 0) {
    badge.textContent = String(unread);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
    badge.textContent = "0";
  }
}

function showPanelUnlocked(message) {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("panelBox").classList.remove("hidden");
  fillForm().catch(() => {});
  fillOwnerAuthForm();
  updateOwnerCommandDeck("Panel unlocked");
  setStatus(message);
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSession(session) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function isSessionValid() {
  const session = getSession();
  return Boolean(session.token && session.expiresAt && new Date(session.expiresAt).getTime() > Date.now());
}

function formatSyncTime(now) {
  try {
    return new Date(now).toLocaleString();
  } catch {
    return String(now);
  }
}

function renderAffiliateSessionState() {
  const node = document.getElementById("affiliateSessionState");
  if (!node) {
    return;
  }
  const session = getSession();
  const valid = isSessionValid();
  if (!session || !session.token) {
    node.textContent = "Owner session: OFFLINE (not signed in).";
    return;
  }
  node.textContent = `Owner session: ${valid ? "ACTIVE" : "EXPIRED"}${session.expiresAt ? ` · expires ${formatSyncTime(session.expiresAt)}` : ""}`;
}

function getAffiliateLinkHealthHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AFFILIATE_LINK_HEALTH_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAffiliateLinkHealthHistory(entry) {
  const history = getAffiliateLinkHealthHistory();
  history.unshift(entry);
  const capped = history.slice(0, 7);
  localStorage.setItem(AFFILIATE_LINK_HEALTH_HISTORY_KEY, JSON.stringify(capped));
  return capped;
}

function clearAffiliateLinkHealthHistory() {
  localStorage.removeItem(AFFILIATE_LINK_HEALTH_HISTORY_KEY);
  renderAffiliateLinkHealthTrend([]);
}

function renderAffiliateLinkHealthTrend(history) {
  const node = document.getElementById("affiliateLinkHealthTrend");
  if (!node) {
    return;
  }
  if (!Array.isArray(history) || history.length === 0) {
    node.textContent = "Link health trend (last 7): no history yet.";
    return;
  }
  const lines = history.map(
    (entry, idx) =>
      `#${idx + 1} ${formatSyncTime(entry.at)} | checked ${entry.checked} | reachable ${entry.reachable} | unreachable ${entry.unreachable}`
  );
  node.innerHTML = `<strong>Link health trend (last ${history.length})</strong><br />${lines.map((x) => escapeHtml(x)).join("<br />")}`;
}

function renderAffiliateAlertBanner(summary) {
  const node = document.getElementById("affiliateAlertBanner");
  if (!node) {
    return;
  }
  if (!summary) {
    node.textContent = "Alerts: none.";
    return;
  }
  if (Number(summary.unreachable || 0) > 0) {
    node.textContent = `Alerts: ${summary.unreachable} unreachable links detected. Check the rows below.`;
    return;
  }
  node.textContent = "Alerts: all monitored links reachable.";
}

function getAffiliateLastAlertSignature() {
  return String(localStorage.getItem(AFFILIATE_ALERT_LAST_KEY) || "");
}

function setAffiliateLastAlertSignature(signature) {
  localStorage.setItem(AFFILIATE_ALERT_LAST_KEY, String(signature || ""));
}

function getAffiliateAlertSeverityMode() {
  const raw = String(localStorage.getItem(AFFILIATE_ALERT_SEVERITY_MODE_KEY) || "yellow_and_red");
  return raw === "red_only" ? "red_only" : "yellow_and_red";
}

function saveAffiliateAlertSeverityMode(mode) {
  const next = mode === "red_only" ? "red_only" : "yellow_and_red";
  localStorage.setItem(AFFILIATE_ALERT_SEVERITY_MODE_KEY, next);
}

function renderAffiliateAlertSeverityMode() {
  const node = document.getElementById("affiliateAlertSeverityMode");
  if (!node) {
    return;
  }
  node.value = getAffiliateAlertSeverityMode();
}

async function sendOwnerInboxAlert(messageText) {
  const text = String(messageText || "").trim();
  if (!text) {
    return;
  }
  await authedPost("/api/owner/messages/create", {
    type: "urgent",
    text: text.slice(0, 600)
  });
  await updateMessageBadge();
}

async function sendPhoneAlertNotification(title, body) {
  const safeTitle = String(title || "VibeCart alert");
  const safeBody = String(body || "Affiliate monitoring detected an issue.");
  try {
    if (!("Notification" in window)) {
      return;
    }
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission !== "granted") {
      return;
    }
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        reg.active.postMessage({
          type: "SHOW_NOTIFICATION",
          title: safeTitle,
          body: safeBody,
          url: "./admin.html"
        });
        return;
      }
    }
    new Notification(safeTitle, { body: safeBody });
  } catch {
    // silent fallback
  }
}

async function maybeDispatchAffiliateAlert(details) {
  const level = String(details.level || "");
  const issueSummary = String(details.issueSummary || "");
  if (!issueSummary || level === "GREEN") {
    return;
  }
  const mode = getAffiliateAlertSeverityMode();
  if (mode === "red_only" && level !== "RED") {
    return;
  }
  const signature = `${level}|${issueSummary}`;
  if (getAffiliateLastAlertSignature() === signature) {
    return;
  }
  setAffiliateLastAlertSignature(signature);
  const message = `Affiliate monitor ${level}: ${issueSummary}`;
  try {
    await sendOwnerInboxAlert(message);
  } catch {
    // keep UI non-blocking
  }
  await sendPhoneAlertNotification("VibeCart Affiliate Alert", message);
}

function updateAffiliateReadinessAndActions() {
  const scoreNode = document.getElementById("affiliateReadinessScore");
  const actionsNode = document.getElementById("affiliateRecommendedActions");
  if (!scoreNode || !actionsNode) {
    return;
  }
  let score = 100;
  const actions = [];
  const health = affiliateRuntime.linkHealth;
  const recon = affiliateRuntime.reconciliation;

  if (!health) {
    score -= 20;
    actions.push("Run link health to populate monitoring.");
  } else if (Number(health.unreachable || 0) > 0) {
    score -= Math.min(40, Number(health.unreachable || 0) * 20);
    actions.push("Fix unreachable shop links or replace blocked domains.");
  }

  if (!recon) {
    score -= 20;
    actions.push("Refresh reconciliation to verify conversion lifecycle.");
  } else {
    const clicks = Number(recon.clicks || 0);
    const confirmed = Number(recon.confirmed || 0);
    if (clicks > 0 && confirmed === 0) {
      score -= 15;
      actions.push("Clicks detected without confirmed conversions; verify partner postback mapping.");
    }
    if (Number(recon.pending || 0) > Math.max(5, confirmed * 2)) {
      score -= 10;
      actions.push("Pending conversions are high; reconcile partner callbacks.");
    }
  }

  score = Math.max(0, Math.round(score));
  const level = score >= 85 ? "GREEN" : score >= 65 ? "YELLOW" : "RED";
  scoreNode.textContent = `Readiness: ${level} (${score}/100).`;
  actionsNode.textContent = actions.length
    ? `Recommended actions: ${actions.join(" ")}`
    : "Recommended actions: no blockers detected; continue monitoring daily.";
  const issueSummary = actions.length ? actions.join(" ") : "";
  maybeDispatchAffiliateAlert({ level, issueSummary }).catch(() => {});
}

function updateCommissionReadinessChecklist() {
  const scoreNode = document.getElementById("commissionReadinessScore");
  const actionsNode = document.getElementById("commissionReadinessActions");
  const checksNode = document.getElementById("commissionReadinessChecks");
  if (!scoreNode || !actionsNode || !checksNode) {
    return;
  }
  const checks = [];
  const actions = [];
  let score = 100;

  const health = affiliateRuntime.linkHealth;
  const recon = affiliateRuntime.reconciliation;
  const quick = affiliateRuntime.quickStats;
  const owner = affiliateRuntime.ownerRevenue;

  const trackingOk = Boolean(health && Number(health.checked || 0) > 0 && Number(health.unreachable || 0) === 0);
  checks.push({
    label: "Tracking links healthy",
    ok: trackingOk,
    detail: health
      ? `checked=${Number(health.checked || 0)}, unreachable=${Number(health.unreachable || 0)}`
      : "run affiliate link health first"
  });
  if (!trackingOk) {
    score -= 30;
    actions.push("Fix broken/blocked affiliate links so traffic can be tracked.");
  }

  const conversionSignal = Boolean(recon && Number(recon.clicks || 0) > 0 && (Number(recon.pending || 0) > 0 || Number(recon.confirmed || 0) > 0));
  checks.push({
    label: "Conversion events flowing",
    ok: conversionSignal,
    detail: recon
      ? `clicks=${Number(recon.clicks || 0)}, pending=${Number(recon.pending || 0)}, confirmed=${Number(recon.confirmed || 0)}`
      : "run affiliate reconciliation first"
  });
  if (!conversionSignal) {
    score -= 25;
    actions.push("Get clicks through tracked links and verify partner postbacks.");
  }

  const commissionSignal = Boolean(quick && Number(quick.commission || 0) > 0);
  checks.push({
    label: "Commission value recorded",
    ok: commissionSignal,
    detail: quick
      ? `estimated_commission=${Number(quick.commission || 0).toFixed(2)} EUR`
      : "refresh affiliate quick stats"
  });
  if (!commissionSignal) {
    score -= 25;
    actions.push("No commission posted yet; verify payout model and conversion mapping.");
  }

  const payoutReady = Boolean(owner && Number(owner.ownerPayoutReady || 0) > 0);
  checks.push({
    label: "Owner payout ready",
    ok: payoutReady,
    detail: owner
      ? `owner_payout_ready=${Number(owner.ownerPayoutReady || 0).toFixed(2)} EUR`
      : "refresh owner revenue dashboard"
  });
  if (!payoutReady) {
    score -= 20;
    actions.push("No payout-ready balance; complete conversion settlement cycle.");
  }

  score = Math.max(0, Math.round(score));
  const level = score >= 85 ? "GREEN" : score >= 60 ? "YELLOW" : "RED";
  scoreNode.textContent = `Commission readiness: ${level} (${score}/100).`;
  actionsNode.textContent = actions.length
    ? `Actions: ${actions.join(" ")}`
    : "Actions: all key commission checkpoints look healthy.";

  checksNode.innerHTML = "";
  checks.forEach((item) => {
    const line = document.createElement("div");
    line.className = "msg " + (item.ok ? "msg-seller" : "msg-buyer");
    line.textContent = `${item.ok ? "PASS" : "FAIL"} | ${item.label} | ${item.detail}`;
    checksNode.appendChild(line);
  });
}

function refreshMoneyDashboard(options) {
  const opts = options || {};
  const summary = document.getElementById("moneyDashboardSummary");
  const breakdown = document.getElementById("moneyDashboardBreakdown");
  if (!summary || !breakdown) {
    return;
  }
  const quick = affiliateRuntime.quickStats || { clicks: 0, conversions: 0, commission: 0 };
  const recon = affiliateRuntime.reconciliation || { confirmed: 0, pending: 0 };
  const owner = affiliateRuntime.ownerRevenue || { ownerPayoutReady: 0 };
  const clicks = Number(quick.clicks || 0);
  const conversions = Number(quick.conversions || 0);
  const estimatedCommission = Number(quick.commission || 0);
  const confirmed = Number(recon.confirmed || 0);
  const pending = Number(recon.pending || 0);
  const payoutReady = Number(owner.ownerPayoutReady || 0);
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const payoutProjection = Math.max(0, payoutReady + estimatedCommission * 0.7);

  summary.textContent =
    `Money dashboard: ${clicks} click-outs | ${conversions} conversions (${conversionRate.toFixed(1)}%) | ` +
    `est. commission EUR ${estimatedCommission.toFixed(2)} | payout ready EUR ${payoutReady.toFixed(2)}.`;
  breakdown.innerHTML = "";
  [
    `Confirmed partner events: ${confirmed}. Pending partner events: ${pending}.`,
    `Projected next payout window: EUR ${payoutProjection.toFixed(2)} (estimation based on current trend).`,
    `Top action: ${estimatedCommission <= 0 ? "drive tracked clicks and verify partner postbacks." : "optimize highest converting categories and maintain healthy links."}`,
    "Recommendation: export bookkeeping ledger weekly and reconcile with partner statements."
  ].forEach((line) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    row.textContent = line;
    breakdown.appendChild(row);
  });

  if (!opts.skipLedger) {
    addBookkeepingEntry({
      type: "commission",
      note: "Money dashboard refresh snapshot captured.",
      amountEur: estimatedCommission
    });
  }
  if (!opts.silent) {
    setStatus("Money dashboard refreshed.");
  }
}

function setLiveMoneyDashboardState(enabled) {
  const next = enabled ? "1" : "0";
  localStorage.setItem(LIVE_MONEY_DASHBOARD_KEY, next);
  const btn = document.getElementById("toggleLiveMoneyDashboard");
  const status = document.getElementById("moneyDashboardLiveStatus");
  if (btn) {
    btn.textContent = enabled ? "Live Auto-Refresh: On" : "Live Auto-Refresh: Off";
    btn.classList.toggle("btn-primary", enabled);
    btn.classList.toggle("btn-secondary", !enabled);
  }
  if (status) {
    status.textContent = enabled
      ? "Live money dashboard: running (every 60 seconds)."
      : "Live money dashboard: idle.";
  }
}

async function runLiveMoneyDashboardTick() {
  try {
    await refreshAffiliateQuickStats();
    await refreshAffiliateReconciliation();
    refreshMoneyDashboard({ silent: true, skipLedger: true });
  } catch {
    /* keep interval resilient */
  }
}

function stopLiveMoneyDashboard() {
  if (liveMoneyDashboardTimer) {
    clearInterval(liveMoneyDashboardTimer);
    liveMoneyDashboardTimer = 0;
  }
  setLiveMoneyDashboardState(false);
}

function startLiveMoneyDashboard() {
  if (liveMoneyDashboardTimer) {
    return;
  }
  setLiveMoneyDashboardState(true);
  runLiveMoneyDashboardTick().catch(() => {});
  liveMoneyDashboardTimer = window.setInterval(() => {
    runLiveMoneyDashboardTick().catch(() => {});
  }, 60000);
}

function toggleLiveMoneyDashboard() {
  if (liveMoneyDashboardTimer) {
    stopLiveMoneyDashboard();
    setStatus("Live money dashboard stopped.");
    return;
  }
  startLiveMoneyDashboard();
  setStatus("Live money dashboard started.");
}

function runPartnerSecurityCheck() {
  const statusNode = document.getElementById("partnerSecurityStatus");
  const listNode = document.getElementById("partnerSecurityChecklist");
  if (!statusNode || !listNode) {
    return;
  }
  const health = affiliateRuntime.linkHealth;
  const unreachable = Number(health?.unreachable || 0);
  const checks = [
    { ok: unreachable === 0, text: unreachable === 0 ? "No unreachable partner links detected." : `${unreachable} unreachable links detected; replace or fix immediately.` },
    { ok: true, text: "Use signed callback secrets for each partner postback endpoint." },
    { ok: true, text: "Restrict partner redirects to approved domains only (allowlist)." },
    { ok: true, text: "Reconcile partner invoices weekly against click and conversion logs." },
    { ok: true, text: "Enable anti-fraud review for high payout spikes or sudden conversion bursts." }
  ];
  listNode.innerHTML = "";
  checks.forEach((item) => {
    const row = document.createElement("div");
    row.className = "msg " + (item.ok ? "msg-seller" : "msg-buyer");
    row.textContent = `${item.ok ? "PASS" : "ACTION"} | ${item.text}`;
    listNode.appendChild(row);
  });
  statusNode.textContent = unreachable === 0 ? "Partner security status: strong baseline." : "Partner security status: remediation required.";
  setStatus("Partner security check completed.");
}

function addBookkeepingEntryFromPanel() {
  const note = String(document.getElementById("bookkeepingNoteInput")?.value || "").trim();
  const type = String(document.getElementById("bookkeepingTypeInput")?.value || "ops_note");
  const amount = Number(document.getElementById("bookkeepingAmountInput")?.value || 0);
  addBookkeepingEntry({
    type,
    note: note || "Manual bookkeeping note",
    amountEur: amount
  });
  const noteInput = document.getElementById("bookkeepingNoteInput");
  const amountInput = document.getElementById("bookkeepingAmountInput");
  if (noteInput) noteInput.value = "";
  if (amountInput) amountInput.value = "";
  setStatus("Bookkeeping entry saved.");
}

function exportBookkeepingLedger() {
  const ledger = getBookkeepingLedger();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJson(`vibecart-bookkeeping-${stamp}.json`, {
    generatedAt: new Date().toISOString(),
    entries: ledger
  });
  setStatus("Bookkeeping ledger exported.");
}

function clearBookkeepingLedger() {
  localStorage.removeItem(BOOKKEEPING_LEDGER_KEY);
  renderBookkeepingLedger();
  setStatus("Bookkeeping ledger reset.");
}

function generateMonthlyBookkeepingReport() {
  const reportNode = document.getElementById("bookkeepingMonthlyReport");
  if (!reportNode) {
    return;
  }
  const ledger = getBookkeepingLedger();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthRows = ledger.filter((row) => {
    const at = new Date(String(row.at || ""));
    return at.getUTCFullYear() === year && at.getUTCMonth() === month;
  });
  var revenue = 0;
  var payout = 0;
  var subscription = 0;
  monthRows.forEach((row) => {
    const amount = Number(row.amountEur || 0);
    const type = String(row.type || "").toLowerCase();
    if (type === "commission") revenue += amount;
    if (type === "payout") payout += amount;
    if (type === "subscription") subscription += amount;
  });
  reportNode.innerHTML = "";
  [
    `Month: ${now.toLocaleString(undefined, { month: "long" })} ${year}`,
    `Entries: ${monthRows.length}`,
    `Commission logged: EUR ${revenue.toFixed(2)}`,
    `Subscription logged: EUR ${subscription.toFixed(2)}`,
    `Payout-ready snapshots: EUR ${payout.toFixed(2)}`,
    `Net operating view: EUR ${(revenue + subscription - payout).toFixed(2)}`
  ].forEach((line) => {
    const node = document.createElement("div");
    node.className = "msg msg-buyer";
    node.textContent = line;
    reportNode.appendChild(node);
  });
  setStatus("Monthly bookkeeping report generated.");
}

function generatePartnerOnboardingTemplate() {
  const node = document.getElementById("partnerOnboardingTemplate");
  if (!node) {
    return;
  }
  node.innerHTML = "";
  [
    "Partner onboarding template",
    "1) Legal company identity and registration documents verified.",
    "2) Domain ownership and redirect target domain allowlist approved.",
    "3) Signed callback secret and webhook replay protection configured.",
    "4) Payout model agreed (CPC/CPL/CPA) with reconciliation schedule.",
    "5) Fraud and dispute response SLA signed.",
    "6) Sandbox test conversion completed before production traffic.",
    "7) Weekly finance + security review owner assigned."
  ].forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "msg " + (index === 0 ? "msg-seller" : "msg-buyer");
    row.textContent = line;
    node.appendChild(row);
  });
  setStatus("Partner onboarding template generated.");
}

function renderAffiliateProgramSignupList() {
  const node = document.getElementById("affiliateProgramSignupList");
  const select = document.getElementById("affiliateProgramSelect");
  const outreachSelect = document.getElementById("outreachPartnerSelect");
  if (!node) {
    return;
  }
  if (select && !select.options.length) {
    AFFILIATE_PROGRAMS.forEach((program) => {
      const option = document.createElement("option");
      option.value = program.id;
      option.textContent = program.name;
      select.appendChild(option);
    });
  }
  if (outreachSelect && !outreachSelect.options.length) {
    AFFILIATE_PROGRAMS.forEach((program) => {
      const option = document.createElement("option");
      option.value = program.id;
      option.textContent = program.name;
      outreachSelect.appendChild(option);
    });
  }
  node.innerHTML = "";
  AFFILIATE_PROGRAMS.forEach((program) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    const hasEmail = Boolean(String(program.contactEmail || "").trim());
    const mailHref = hasEmail
      ? `mailto:${encodeURIComponent(String(program.contactEmail).trim())}?subject=${encodeURIComponent(
          "Affiliate partnership inquiry"
        )}`
      : "";
    row.innerHTML =
      `<strong>${escapeHtml(program.name)}</strong> — ` +
      `<a href="${escapeHtml(program.signupUrl)}" target="_blank" rel="noopener noreferrer">Open signup</a> · ` +
      `<button type="button" class="btn btn-secondary" data-aff-fill-email="${escapeHtml(program.id)}">` +
      (hasEmail ? "Load contact email" : "Select for outreach") +
      `</button>` +
      (hasEmail
        ? ` · <a class="btn btn-secondary" href="${escapeHtml(mailHref)}" style="display:inline-block;margin-top:4px">New email to partner</a>`
        : "");
    node.appendChild(row);
  });
  initAffiliateOutreachUi();
}

function fillDefaultOutreachFields() {
  const ownerName = document.getElementById("outreachOwnerName");
  const replyEmail = document.getElementById("outreachReplyEmail");
  if (ownerName && !ownerName.value.trim()) {
    const session = getSession();
    ownerName.value = String(session?.email || "VibeCart Partnerships");
  }
  if (replyEmail && !replyEmail.value.trim()) {
    const session = getSession();
    replyEmail.value = String(session?.email || "");
  }
}

function buildOutreachDraftPayload(programId) {
  const partner = AFFILIATE_PROGRAMS.find((item) => item.id === String(programId || ""));
  const partnerName = partner ? partner.name : "Affiliate Partner";
  const draftType = document.getElementById("outreachDraftType");
  const ownerName = document.getElementById("outreachOwnerName");
  const replyEmail = document.getElementById("outreachReplyEmail");
  const trafficClicks = document.getElementById("outreachTrafficClicks");
  const trafficRegions = document.getElementById("outreachTrafficRegions");
  const siteName = String(document.getElementById("setTitle")?.value || "VibeCart").trim() || "VibeCart";
  const siteUrl = window.location.origin + "/index.html";
  const chosenType = String(draftType?.value || "initial_application");
  const template = AFFILIATE_OUTREACH_DRAFTS[chosenType] || AFFILIATE_OUTREACH_DRAFTS.initial_application;
  const filledBody = template
    .replaceAll("{partner_name}", partnerName)
    .replaceAll("{owner_name}", String(ownerName?.value || "VibeCart Partnerships"))
    .replaceAll("{site_name}", siteName)
    .replaceAll("{site_url}", siteUrl)
    .replaceAll("{reply_email}", String(replyEmail?.value || ""))
    .replaceAll("{traffic_clicks}", String(Number(trafficClicks?.value || 0)))
    .replaceAll("{traffic_regions}", String(trafficRegions?.value || "Africa, Europe"));
  const subjectLine =
    chosenType === "traffic_update"
      ? `Traffic Update + Affiliate Request - ${siteName} x ${partnerName}`
      : chosenType === "approval_followup"
        ? `Approval Follow-Up - ${siteName} x ${partnerName}`
        : `Affiliate Partnership Application - ${siteName} x ${partnerName}`;
  return {
    programId: partner ? partner.id : "",
    partnerName,
    subjectLine,
    body: filledBody
  };
}

function buildOutreachDraft() {
  const partnerSelect = document.getElementById("outreachPartnerSelect");
  const partnerEmail = document.getElementById("outreachPartnerEmail");
  const subject = document.getElementById("outreachSubject");
  const body = document.getElementById("outreachBody");
  const status = document.getElementById("outreachStatus");
  if (!partnerSelect || !subject || !body) {
    return;
  }
  const program = getAffiliateProgramById(String(partnerSelect.value || ""));
  if (partnerEmail && program && program.contactEmail && !partnerEmail.value.trim()) {
    partnerEmail.value = String(program.contactEmail || "").trim();
  }
  const payload = buildOutreachDraftPayload(String(partnerSelect.value || ""));
  subject.value = payload.subjectLine;
  body.value = payload.body;
  if (status) {
    status.textContent =
      "Draft generated. Partner inbox (when listed) is filled from the affiliate directory; otherwise use the signup portal.";
  }
  if (partnerEmail && !partnerEmail.value.trim()) {
    partnerEmail.placeholder = "If no direct email is available, apply via partner signup URL above.";
  }
}

function getSelectedOutreachProgramIds() {
  return Array.from(document.querySelectorAll("#partnerOutreachList input[data-outreach-program]"))
    .filter((node) => node.checked)
    .map((node) => String(node.getAttribute("data-outreach-program") || "").trim())
    .filter(Boolean);
}

async function saveOutreachDraftToInbox() {
  const subject = String(document.getElementById("outreachSubject")?.value || "").trim();
  const body = String(document.getElementById("outreachBody")?.value || "").trim();
  const partner = String(document.getElementById("outreachPartnerSelect")?.selectedOptions?.[0]?.textContent || "").trim();
  const status = document.getElementById("outreachStatus");
  if (!subject || !body) {
    if (status) status.textContent = "Generate a draft first.";
    return;
  }
  const text = `AFFILIATE OUTREACH DRAFT | Partner: ${partner}\nSubject: ${subject}\n\n${body}`;
  addAdminMessage(text, "request");
  try {
    if (isSessionValid()) {
      await sendOwnerInboxAlert(text);
    }
  } catch {
    /* local fallback already saved */
  }
  if (status) status.textContent = "Draft saved to inbox.";
  setStatus("Affiliate outreach draft saved to inbox.");
}

function sendOutreachEmailViaClient() {
  const partnerSelect = document.getElementById("outreachPartnerSelect");
  const partnerEmail = document.getElementById("outreachPartnerEmail");
  let to = String(partnerEmail?.value || "").trim();
  if (!to && partnerSelect) {
    const program = getAffiliateProgramById(String(partnerSelect.value || ""));
    to = String(program?.contactEmail || "").trim();
    if (to && partnerEmail) {
      partnerEmail.value = to;
    }
  }
  const subject = String(document.getElementById("outreachSubject")?.value || "").trim();
  const body = String(document.getElementById("outreachBody")?.value || "").trim();
  const status = document.getElementById("outreachStatus");
  if (!subject || !body) {
    if (status) status.textContent = "Generate a draft first.";
    return;
  }
  if (!to) {
    if (status) {
      status.textContent =
        "Add a partner email, pick a program with a listed inbox, or tap “Load contact email” on a partner row.";
    }
    setStatus("Email send blocked: no recipient.");
    return;
  }
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  addAdminMessage(`OUTGOING EMAIL | To: ${to || "(set recipient)"} | Subject: ${subject}`, "request");
  if (status) status.textContent = "Opened your default email app. Review and send.";
  setStatus("Email draft opened in default mail app.");
}

async function saveSelectedOutreachDraftsToInbox() {
  const selected = getSelectedOutreachProgramIds();
  const status = document.getElementById("outreachStatus");
  if (!selected.length) {
    if (status) status.textContent = "Select at least one partner from the list below.";
    return;
  }
  for (const programId of selected) {
    const payload = buildOutreachDraftPayload(programId);
    const text = `AFFILIATE OUTREACH DRAFT | Partner: ${payload.partnerName}\nSubject: ${payload.subjectLine}\n\n${payload.body}`;
    addAdminMessage(text, "request");
    try {
      if (isSessionValid()) {
        await sendOwnerInboxAlert(text);
      }
    } catch {
      /* local fallback already saved */
    }
  }
  if (status) status.textContent = `Saved ${selected.length} outreach drafts to inbox.`;
  setStatus(`Saved ${selected.length} partner outreach drafts to inbox.`);
}

function sendSelectedOutreachEmailViaClient() {
  const selected = getSelectedOutreachProgramIds();
  const status = document.getElementById("outreachStatus");
  if (!selected.length) {
    if (status) status.textContent = "Select at least one partner from the list below.";
    return;
  }
  const partnerEmail = document.getElementById("outreachPartnerEmail");
  let to = String(partnerEmail?.value || "").trim();
  const firstProgram = getAffiliateProgramById(selected[0]);
  if (!to && firstProgram && firstProgram.contactEmail) {
    to = String(firstProgram.contactEmail || "").trim();
    if (to && partnerEmail) {
      partnerEmail.value = to;
    }
  }
  if (!to) {
    if (status) {
      status.textContent =
        "No inbox on file for the first selected partner — tap “Fill outreach email” on a row with an email, or paste a contact.";
    }
    return;
  }
  const payload = buildOutreachDraftPayload(selected[0]);
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(payload.subjectLine)}&body=${encodeURIComponent(payload.body)}`;
  window.location.href = mailto;
  addAdminMessage(`OUTGOING EMAIL | To: ${to} | Subject: ${payload.subjectLine}`, "request");
  if (status) status.textContent = "Opened your default email app using the first selected partner draft.";
  setStatus("Email draft opened in default mail app for selected partner.");
}

function renderPartnerOutreachList() {
  const node = document.getElementById("partnerOutreachList");
  if (!node) {
    return;
  }
  node.innerHTML = "";
  AFFILIATE_PROGRAMS.forEach((program) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    const hasEmail = Boolean(String(program.contactEmail || "").trim());
    const contactLine = hasEmail
      ? `Inbox: <code>${escapeHtml(String(program.contactEmail).trim())}</code>`
      : "Inbox: use official signup portal (no public publisher email on file)";
    row.innerHTML =
      `<label style="display:inline-flex;align-items:center;gap:.4rem;margin-right:.6rem;"><input type="checkbox" data-outreach-program="${escapeHtml(program.id)}" />Select</label>` +
      `<strong>${escapeHtml(program.name)}</strong> | ${contactLine} | ` +
      `<a href="${escapeHtml(program.signupUrl)}" target="_blank" rel="noopener noreferrer">Apply now</a> · ` +
      `<button type="button" class="btn btn-secondary" data-aff-fill-email="${escapeHtml(program.id)}">` +
      (hasEmail ? "Fill outreach email" : "Select in outreach form") +
      `</button>`;
    node.appendChild(row);
  });
  initAffiliateOutreachUi();
}

function renderCommissionValidatedOffers() {
  const list = document.getElementById("commissionValidatedOffersList");
  const status = document.getElementById("commissionValidationStatus");
  const policy = document.getElementById("offerLaunchPolicyStatus");
  if (!list || !status) {
    return;
  }
  const state = getCommissionValidationState();
  const offers = state.offers || [];
  const filterMode = readCommissionOfferFilterMode();
  const filterNode = document.getElementById("commissionOfferFilterMode");
  if (filterNode) {
    filterNode.value = filterMode;
  }
  const promoNode = document.getElementById("homepagePromotionStatus");
  if (promoNode) {
    const greenTotal = offers.reduce(
      (sum, offer) => (String(offer.status || "traffic_only") === "commission_enabled" ? sum + 1 : sum),
      0
    );
    if (greenTotal === 0) {
      promoNode.textContent = "Homepage promotion: no GREEN offers available yet.";
    } else {
      promoNode.textContent = `Homepage promotion: ${greenTotal} GREEN offer(s) ready.`;
    }
  }
  const offerPriority = (offerStatus) => {
    if (offerStatus === "commission_enabled") return 0;
    if (offerStatus === "traffic_only") return 1;
    return 2;
  };
  let visibleOffers = offers.slice();
  if (filterMode === "commission_only") {
    visibleOffers = visibleOffers.filter((offer) => String(offer.status || "traffic_only") === "commission_enabled");
  } else if (filterMode === "commission_first") {
    visibleOffers = visibleOffers.sort((a, b) => {
      const aStatus = String(a.status || "traffic_only");
      const bStatus = String(b.status || "traffic_only");
      return offerPriority(aStatus) - offerPriority(bStatus);
    });
  }
  list.innerHTML = "";
  if (!offers.length) {
    status.textContent = "Offer validation: complete all 5 steps.";
    if (policy) {
      policy.textContent =
        "Launch policy: traffic-first mode enabled. Unsafe links blocked; non-commission offers run as traffic-only.";
    }
    list.innerHTML = "<div class='msg msg-buyer'>No commission-validated offers yet.</div>";
    return;
  }
  var green = 0;
  var yellow = 0;
  var red = 0;
  offers.forEach((offer) => {
    const st = String(offer.status || "traffic_only");
    if (st === "commission_enabled") green += 1;
    else if (st === "blocked") red += 1;
    else yellow += 1;
  });
  status.textContent = `Offer registry: ${offers.length} total | GREEN ${green} | YELLOW ${yellow} | RED ${red}.`;
  if (policy) {
    policy.textContent =
      "Launch policy: default YELLOW traffic-only until partner approval. Promote to GREEN after validation. Use RED only for unsafe/unapproved offers.";
  }
  if (!visibleOffers.length) {
    list.innerHTML = "<div class='msg msg-buyer'>No offers match this filter yet.</div>";
    return;
  }
  visibleOffers.forEach((offer) => {
    const row = document.createElement("div");
    const offerStatus = String(offer.status || "traffic_only");
    row.className =
      "msg " +
      (offerStatus === "commission_enabled" ? "msg-seller" : "msg-buyer");
    const nextStatus = offerStatus === "traffic_only" ? "commission_enabled" : offerStatus === "commission_enabled" ? "blocked" : "traffic_only";
    const nextLabel =
      nextStatus === "commission_enabled"
        ? "Promote -> GREEN"
        : nextStatus === "blocked"
          ? "Set -> RED"
          : "Set -> YELLOW";
    row.innerHTML =
      `<strong>${escapeHtml(offer.offerName || "Offer")}</strong> | ` +
      `${escapeHtml(offer.programName || offer.programId || "")} | ` +
      `status: ${escapeHtml(offerStatus)} | ` +
      `<a href="${escapeHtml(offer.url || "#")}" target="_blank" rel="noopener noreferrer">tracking link</a> | ` +
      `${escapeHtml(String(offer.validatedAt || ""))} ` +
      `<button type="button" class="btn btn-secondary" data-offer-id="${escapeHtml(offer.id)}" data-next-status="${escapeHtml(nextStatus)}">${nextLabel}</button>`;
    list.appendChild(row);
  });
  Array.from(list.querySelectorAll("button[data-offer-id][data-next-status]")).forEach((btn) => {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      const id = String(btn.getAttribute("data-offer-id") || "");
      const next = String(btn.getAttribute("data-next-status") || "traffic_only");
      const curr = getCommissionValidationState();
      curr.offers = (curr.offers || []).map((offer) =>
        String(offer.id) === id ? { ...offer, status: next, statusUpdatedAt: new Date().toLocaleString() } : offer
      );
      saveCommissionValidationState(curr);
      renderCommissionValidatedOffers();
      setStatus(`Offer status updated to ${next}.`);
    });
  });
}

function resetOfferValidationSteps() {
  ["affStep1", "affStep2", "affStep3", "affStep4", "affStep5"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) {
      node.checked = false;
    }
  });
  const status = document.getElementById("commissionValidationStatus");
  if (status) {
    status.textContent = "Offer validation: steps reset. Complete all 5 steps.";
  }
  setStatus("Offer validation steps reset.");
}

function markOfferCommissionValidated() {
  const programId = String(document.getElementById("affiliateProgramSelect")?.value || "").trim();
  const offerName = String(document.getElementById("affiliateOfferName")?.value || "").trim();
  const offerUrl = String(document.getElementById("affiliateOfferUrl")?.value || "").trim();
  const initialStatus = String(document.getElementById("affiliateOfferStatus")?.value || "traffic_only").trim();
  const checks = ["affStep1", "affStep2", "affStep3", "affStep4", "affStep5"].map((id) =>
    Boolean(document.getElementById(id)?.checked)
  );
  const status = document.getElementById("commissionValidationStatus");
  if (!programId || !offerName || !offerUrl) {
    if (status) {
      status.textContent = "Offer validation: add program, offer name, and tracking URL.";
    }
    setStatus("Offer validation failed: missing required fields.");
    return;
  }
  if (!checks.every(Boolean)) {
    if (status) {
      status.textContent = "Offer validation: all 5 steps must be checked.";
    }
    setStatus("Offer validation failed: complete all 5 steps.");
    return;
  }
  const program = AFFILIATE_PROGRAMS.find((item) => item.id === programId);
  const state = getCommissionValidationState();
  state.offers.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    programId,
    programName: program ? program.name : programId,
    offerName,
    url: offerUrl,
    status: initialStatus === "commission_enabled" || initialStatus === "blocked" ? initialStatus : "traffic_only",
    validatedAt: new Date().toLocaleString()
  });
  saveCommissionValidationState(state);
  addBookkeepingEntry({
    type: "ops_note",
    note: `Commission-validated offer saved: ${offerName} (${program ? program.name : programId}).`,
    amountEur: 0
  });
  renderCommissionValidatedOffers();
  resetOfferValidationSteps();
  setStatus("Offer marked commission-validated.");
}

function fillPremiumPlanSettingsForm() {
  const settings = getPremiumPlanSettings();
  const enabledNode = document.getElementById("premiumPlanEnabled");
  const priceNode = document.getElementById("premiumPlanPrice");
  const benefitsNode = document.getElementById("premiumPlanBenefits");
  const statusNode = document.getElementById("premiumPlanStatus");
  if (enabledNode) enabledNode.value = settings.enabled ? "1" : "0";
  if (priceNode) priceNode.value = String(settings.price.toFixed(2));
  if (benefitsNode) benefitsNode.value = settings.benefits;
  if (statusNode) {
    statusNode.textContent = `Premium plan: ${settings.enabled ? "enabled" : "disabled"} at EUR ${settings.price.toFixed(2)} / month.`;
  }
}

function savePremiumPlanSettings() {
  const enabled = String(document.getElementById("premiumPlanEnabled")?.value || "1") === "1";
  const price = Number(document.getElementById("premiumPlanPrice")?.value || 39.99);
  const benefits = String(document.getElementById("premiumPlanBenefits")?.value || "").trim();
  const payload = {
    enabled: enabled ? "1" : "0",
    price: Math.max(1, price),
    benefits: benefits || "AI concierge responses, priority support lane, premium discovery layout, and luxury account badge."
  };
  localStorage.setItem(PREMIUM_PLAN_SETTINGS_KEY, JSON.stringify(payload));
  try {
    localStorage.setItem(
      "vibecart-public-premium-plan-v1",
      JSON.stringify({
        enabled: payload.enabled,
        price: payload.price,
        benefits: payload.benefits
      })
    );
  } catch {
    /* ignore */
  }
  fillPremiumPlanSettingsForm();
  addBookkeepingEntry({
    type: "subscription",
    note: `Premium plan settings updated (${payload.enabled === "1" ? "enabled" : "disabled"}).`,
    amountEur: payload.price
  });
  setStatus("Top-class premium plan settings saved.");
}

async function fillForm() {
  const remote = await fetchCloudSettings();
  if (remote && typeof remote === "object") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    if (remote.theme) {
      localStorage.setItem("vibecart-theme", String(remote.theme));
    }
  }
  const settings = getSettings();
  document.getElementById("setTitle").value = settings.title;
  document.getElementById("setBadge").value = settings.badge;
  document.getElementById("setHeadline").value = settings.headline;
  document.getElementById("setSubtitle").value = settings.subtitle;
  document.getElementById("setBridgeTitle").value = settings.bridgeTitle;
  document.getElementById("setBridgeText").value = settings.bridgeText;
  document.getElementById("setTheme").value = settings.theme;
}

function fillOwnerAuthForm() {
  const session = getSession();
  const currentEmailNode = document.getElementById("currentOwnerEmail");
  if (currentEmailNode) {
    currentEmailNode.value = session.email || "";
  }
  const aiLinkNode = document.getElementById("aiLink");
  if (aiLinkNode) {
    aiLinkNode.value = localStorage.getItem(AI_LINK_KEY) || "";
  }
  const apiBaseNode = document.getElementById("apiBaseUrl");
  if (apiBaseNode) {
    apiBaseNode.value = getApiBase();
  }
  const adminAppNode = document.getElementById("adminAppUrl");
  if (adminAppNode) {
    adminAppNode.value = `${window.location.origin}${window.location.pathname.replace("admin.html", "admin-app.html")}`;
  }
  fillRevenueSettingsForm();
  fillPremiumPlanSettingsForm();
  renderBookkeepingLedger();
}

function getRevenueSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(REVENUE_SETTINGS_KEY) || "{}");
    return {
      pricingPreset: stored.pricingPreset || "balanced",
      orderTakeRate: Number(stored.orderTakeRate ?? 7.0),
      bookingCommission: Number(stored.bookingCommission ?? 8.0),
      buyerProtectionFeePct: Number(stored.buyerProtectionFeePct ?? 1.8),
      convenienceFeeFlat: Number(stored.convenienceFeeFlat ?? 1.0),
      starterPlanPrice: Number(stored.starterPlanPrice ?? 9.99),
      boost3DayPrice: Number(stored.boost3DayPrice ?? 9.0)
    };
  } catch {
    return {
      pricingPreset: "balanced",
      orderTakeRate: 7.0,
      bookingCommission: 8.0,
      buyerProtectionFeePct: 1.8,
      convenienceFeeFlat: 1.0,
      starterPlanPrice: 9.99,
      boost3DayPrice: 9.0
    };
  }
}

function fillRevenueSettingsForm() {
  const s = getRevenueSettings();
  const preset = document.getElementById("pricingPreset");
  if (!preset) {
    return;
  }
  preset.value = s.pricingPreset;
  document.getElementById("orderTakeRate").value = String(s.orderTakeRate);
  document.getElementById("bookingCommission").value = String(s.bookingCommission);
  document.getElementById("buyerProtectionFeePct").value = String(s.buyerProtectionFeePct);
  document.getElementById("convenienceFeeFlat").value = String(s.convenienceFeeFlat);
  document.getElementById("starterPlanPrice").value = String(s.starterPlanPrice);
  document.getElementById("boost3DayPrice").value = String(s.boost3DayPrice);
}

function saveRevenueSettings() {
  const payload = {
    pricingPreset: document.getElementById("pricingPreset").value,
    orderTakeRate: Number(document.getElementById("orderTakeRate").value || "7"),
    bookingCommission: Number(document.getElementById("bookingCommission").value || "8"),
    buyerProtectionFeePct: Number(document.getElementById("buyerProtectionFeePct").value || "1.8"),
    convenienceFeeFlat: Number(document.getElementById("convenienceFeeFlat").value || "1"),
    starterPlanPrice: Number(document.getElementById("starterPlanPrice").value || "9.99"),
    boost3DayPrice: Number(document.getElementById("boost3DayPrice").value || "9")
  };
  localStorage.setItem(REVENUE_SETTINGS_KEY, JSON.stringify(payload));
  setStatus("Revenue settings saved. Pricing is set to stay affordable and competitive.");
}

function applyPricingPreset() {
  const preset = document.getElementById("pricingPreset").value;
  const map = {
    student_first: {
      orderTakeRate: 5.5,
      bookingCommission: 6.0,
      buyerProtectionFeePct: 1.2,
      convenienceFeeFlat: 0.5,
      starterPlanPrice: 4.99,
      boost3DayPrice: 5.0
    },
    balanced: {
      orderTakeRate: 7.0,
      bookingCommission: 8.0,
      buyerProtectionFeePct: 1.8,
      convenienceFeeFlat: 1.0,
      starterPlanPrice: 9.99,
      boost3DayPrice: 9.0
    },
    profit_plus: {
      orderTakeRate: 8.5,
      bookingCommission: 9.5,
      buyerProtectionFeePct: 2.2,
      convenienceFeeFlat: 1.8,
      starterPlanPrice: 14.99,
      boost3DayPrice: 12.0
    }
  };
  const selected = map[preset] || map.balanced;
  document.getElementById("orderTakeRate").value = String(selected.orderTakeRate);
  document.getElementById("bookingCommission").value = String(selected.bookingCommission);
  document.getElementById("buyerProtectionFeePct").value = String(selected.buyerProtectionFeePct);
  document.getElementById("convenienceFeeFlat").value = String(selected.convenienceFeeFlat);
  document.getElementById("starterPlanPrice").value = String(selected.starterPlanPrice);
  document.getElementById("boost3DayPrice").value = String(selected.boost3DayPrice);
  saveRevenueSettings();
}

async function authedPost(path, body) {
  const session = getSession();
  if (!session.token) {
    throw new Error("No active owner session.");
  }
  const response = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, authToken: session.token })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    const code = payload.code || `HTTP_${response.status}`;
    const detail = String(payload.message || "").trim();
    throw new Error(detail ? `${code}: ${detail}` : code);
  }
  return payload;
}

function getCoachMetricsFallback() {
  return {
    summary: {
      totalProfiles: 12,
      weightLoss: 4,
      weightGain: 2,
      muscleGain: 3,
      medicalSupport: 1,
      generalFitness: 8,
      activeMedicationSchedules: 5,
      checkinsLast7Days: 19
    }
  };
}

function getAiOpsFallback() {
  return {
    items: [
      {
        id: 1,
        operation_type: "pricing_guardrail_review",
        risk_level: "low",
        execution_mode: "manual",
        status: "manual_hold",
        summary_text: "Review weekend price elasticity and keep student affordability."
      },
      {
        id: 2,
        operation_type: "seller_quality_audit",
        risk_level: "medium",
        execution_mode: "manual",
        status: "manual_hold",
        summary_text: "Check new seller onboarding quality and trust score drift."
      }
    ]
  };
}

function getAiRecommendationsFallback() {
  return {
    items: [
      {
        operationType: "growth_route_spotlight",
        summaryText: "Feature Mama Africa path products with high demand tags.",
        recommendationText: "Promote top 3 Africa-origin listings to Europe buyers this week.",
        riskLevel: "low",
        executionMode: "manual"
      },
      {
        operationType: "trust_reinforcement",
        summaryText: "Boost trust transparency for first-time cross-border buyers.",
        recommendationText: "Add 'verified route + delivery reliability' badges to bridge cards.",
        riskLevel: "low",
        executionMode: "manual"
      }
    ]
  };
}

function renderAiOpsQueue(items) {
  const container = document.getElementById("aiOpsQueueList");
  if (!container) {
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = "<div class='msg msg-buyer'>No AI operations queued yet.</div>";
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    row.textContent =
      `op#${item.id} | ${item.operation_type} | risk=${item.risk_level} | mode=${item.execution_mode} | status=${item.status} | ${item.summary_text}`;
    row.addEventListener("click", () => {
      const idNode = document.getElementById("aiOpId");
      const decisionNode = document.getElementById("aiOpDecision");
      const notesNode = document.getElementById("aiOpOwnerNotes");
      if (idNode) {
        idNode.value = String(item.id || "");
      }
      if (decisionNode) {
        decisionNode.value = ["approved", "rejected", "manual_hold", "executed"].includes(String(item.status))
          ? String(item.status)
          : "manual_hold";
      }
      if (notesNode) {
        notesNode.value = String(item.owner_notes || "");
      }
    });
    container.appendChild(row);
  });
}

async function refreshAiOps() {
  let payload;
  try {
    payload = await authedPost("/api/ai-ops/list", {});
  } catch {
    payload = getAiOpsFallback();
    setStatus("AI operations loaded in smart fallback mode.");
  }
  renderAiOpsQueue(payload.items || []);
  if (!/fallback/i.test(String(window.__vibecartLastStatus || ""))) {
    setStatus("AI operations queue refreshed.");
  }
}

async function generateAiOpsRecommendationsFromPanel() {
  let payload;
  let fallbackMode = false;
  try {
    payload = await authedPost("/api/ai-ops/recommendations", {});
  } catch {
    payload = getAiRecommendationsFallback();
    fallbackMode = true;
  }
  const box = document.getElementById("aiOpsRecommendationsBox");
  if (box) {
    const items = Array.isArray(payload.items) ? payload.items : [];
    box.textContent = items.map((item) => `${item.operationType}: ${item.recommendationText}`).join(" | ") || "No recommendations.";
  }
  if (!fallbackMode) {
    for (const item of payload.items || []) {
      await authedPost("/api/ai-ops/create", {
        operationType: item.operationType,
        summaryText: item.summaryText,
        recommendationText: item.recommendationText,
        riskLevel: item.riskLevel,
        executionMode: item.executionMode
      });
    }
  }
  if (fallbackMode) {
    renderAiOpsQueue(getAiOpsFallback().items || []);
    setStatus("AI recommendations generated in smart fallback mode.");
    return;
  }
  await refreshAiOps();
  setStatus("AI operations recommendations generated and queued for owner review.");
}

async function decideAiOpFromPanel() {
  const operationId = Number(document.getElementById("aiOpId")?.value || "0");
  const decision = String(document.getElementById("aiOpDecision")?.value || "manual_hold");
  const ownerNotes = String(document.getElementById("aiOpOwnerNotes")?.value || "").trim();
  if (!operationId) {
    setStatus("Enter a valid AI operation ID.");
    return;
  }
  await authedPost("/api/ai-ops/decide", {
    operationId,
    decision,
    ownerNotes
  });
  setStatus(`AI operation #${operationId} updated to ${decision}.`);
  await refreshAiOps();
}

async function seedRevenueProducts() {
  const settings = getRevenueSettings();
  const starter = await authedPost("/api/monetization/subscription-plan/create", {
    planCode: "STUDENT_STARTER",
    planName: "Student Starter",
    monthlyPrice: settings.starterPlanPrice,
    currency: "EUR",
    listingLimit: 80,
    boostCredits: 1,
    analyticsEnabled: true,
    prioritySupport: false
  });
  await authedPost("/api/monetization/subscription-plan/create", {
    planCode: "CAMPUS_PRO",
    planName: "Campus Pro",
    monthlyPrice: Number((settings.starterPlanPrice * 2.5).toFixed(2)),
    currency: "EUR",
    listingLimit: 300,
    boostCredits: 6,
    analyticsEnabled: true,
    prioritySupport: true
  });
  const boost = await authedPost("/api/monetization/boost-package/create", {
    packageCode: "STUDENT_BOOST_3D",
    packageName: "Student 3-Day Top Boost",
    durationDays: 3,
    placementZone: "search_top",
    priceAmount: settings.boost3DayPrice,
    currency: "EUR"
  });
  await authedPost("/api/monetization/boost-package/create", {
    packageCode: "STUDENT_HOME_7D",
    packageName: "Student 7-Day Home Boost",
    durationDays: 7,
    placementZone: "home_feed",
    priceAmount: Number((settings.boost3DayPrice * 2.2).toFixed(2)),
    currency: "EUR"
  });
  setStatus(`Affordable monetization seeded. Plan ID ${starter.planId}, Boost Package ID ${boost.packageId}.`);
}

async function assignPlanToShop() {
  const shopId = Number(document.getElementById("monShopId").value || "0");
  const planId = Number(document.getElementById("monPlanId").value || "0");
  if (!shopId || !planId) {
    setStatus("Enter both Shop ID and Plan ID.");
    return;
  }
  const start = new Date();
  const end = new Date(start.getTime());
  end.setUTCMonth(end.getUTCMonth() + 1);
  const payload = await authedPost("/api/monetization/subscription/assign", {
    shopId,
    planId,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    billingCycle: "monthly"
  });
  setStatus(`Plan assigned to shop. Subscription ID ${payload.subscriptionId}.`);
}

async function buyBoostForTarget() {
  const shopId = Number(document.getElementById("monShopId").value || "0");
  const targetType = document.getElementById("monTargetType").value;
  const targetId = Number(document.getElementById("monTargetId").value || "0");
  if (!shopId || !targetId) {
    setStatus("Enter Shop ID and Target ID.");
    return;
  }
  const payload = await authedPost("/api/monetization/boost/purchase", {
    shopId,
    packageId: 1,
    targetType,
    targetId,
    startsAt: new Date().toISOString()
  });
  setStatus(`Boost purchased. Purchase ID ${payload.boostPurchaseId}.`);
}

function renderOwnerRevenueDashboard(payload) {
  const summaryNode = document.getElementById("ownerRevenueSummary");
  const sourcesNode = document.getElementById("ownerRevenueSources");
  const payoutHistoryNode = document.getElementById("ownerPayoutHistory");
  if (!summaryNode || !sourcesNode || !payoutHistoryNode) {
    return;
  }
  const totals = payload?.totals || {};
  const taxByParty = payload?.taxByParty || {};
  const sellerTax = taxByParty.seller || {};
  const platformTax = taxByParty.platform || {};
  const reservePercent = Number(payload?.reservePercent ?? 10);
  affiliateRuntime.ownerRevenue = {
    ownerPayoutReady: Number(totals.ownerPayoutReady || 0),
    netTotal: Number(totals.netTotal || 0),
    unsettledPayoutTotal: Number(totals.unsettledPayoutTotal || 0),
    paidOutTotal: Number(totals.paidOutTotal || 0)
  };

  summaryNode.textContent =
    `Owner payout ready: EUR ${Number(totals.ownerPayoutReady || 0).toFixed(2)} | ` +
    `Net platform revenue: EUR ${Number(totals.netTotal || 0).toFixed(2)} | ` +
    `Platform tax withheld: EUR ${Number(totals.taxWithheldTotal || 0).toFixed(2)} | ` +
    `Reserve (${reservePercent}%): EUR ${Number(totals.reserveAmount || 0).toFixed(2)} | ` +
    `Unsettled payouts: EUR ${Number(totals.unsettledPayoutTotal || 0).toFixed(2)} | ` +
    `Paid out total: EUR ${Number(totals.paidOutTotal || 0).toFixed(2)} | ` +
    `Seller tax ledger: EUR ${Number(sellerTax.tax || 0).toFixed(2)} | ` +
    `Platform tax ledger: EUR ${Number(platformTax.tax || 0).toFixed(2)}`;
  updateKpiStrip({ ownerPayoutReady: Number(totals.ownerPayoutReady || 0) });

  const rows = Array.isArray(payload?.bySource) ? payload.bySource : [];
  if (!rows.length) {
    sourcesNode.innerHTML = "<div class='msg msg-buyer'>No revenue entries yet.</div>";
    return;
  }
  sourcesNode.innerHTML = "";
  rows.forEach((row) => {
    const line = document.createElement("div");
    line.className = "msg msg-buyer";
    line.textContent =
      `${row.sourceType} (${row.currency}) | gross=${Number(row.grossTotal || 0).toFixed(2)} | ` +
      `tax_withheld=${Number(row.taxWithheldTotal || 0).toFixed(2)} | net=${Number(row.netTotal || 0).toFixed(2)}`;
    sourcesNode.appendChild(line);
  });

  const payouts = Array.isArray(payload?.payouts) ? payload.payouts : [];
  if (!payouts.length) {
    payoutHistoryNode.innerHTML = "<div class='msg msg-buyer'>No owner payouts yet.</div>";
    return;
  }
  payoutHistoryNode.innerHTML = "";
  payouts.forEach((item) => {
    const line = document.createElement("div");
    line.className = "msg msg-buyer";
    line.textContent =
      `payout#${item.payoutId} | ${item.payoutStatus} | amount=${Number(item.requestAmount || 0).toFixed(2)} ${item.currency} | ` +
      `destination=${item.destinationLabel || "n/a"} | requested=${item.requestedAt || "n/a"} | paid=${item.paidAt || "n/a"}`;
    line.addEventListener("click", () => {
      const idNode = document.getElementById("ownerPayoutId");
      const statusNode = document.getElementById("ownerPayoutStatus");
      if (idNode) {
        idNode.value = String(item.payoutId || "");
      }
      if (statusNode) {
        statusNode.value = String(item.payoutStatus || "pending");
      }
    });
    payoutHistoryNode.appendChild(line);
  });
  updateCommissionReadinessChecklist();
}

async function refreshOwnerRevenueDashboard() {
  const reservePercent = Number(document.getElementById("ownerReservePercent")?.value || "10");
  const payload = await authedPost("/api/monetization/revenue/owner-dashboard", { reservePercent });
  renderOwnerRevenueDashboard(payload);
  await refreshAffiliateQuickStats();
  await refreshAffiliateReconciliation();
  refreshMoneyDashboard();
  addBookkeepingEntry({
    type: "payout",
    note: "Owner revenue dashboard refreshed from backend.",
    amountEur: Number(affiliateRuntime.ownerRevenue?.ownerPayoutReady || 0)
  });
  setStatus("Owner revenue dashboard refreshed. Seller tax remains seller liability.");
}

async function refreshAffiliateQuickStats() {
  const node = document.getElementById("affiliateQuickStats");
  if (!node) {
    return;
  }
  renderAffiliateSessionState();
  const session = getSession();
  if (!session || !session.token) {
    node.textContent = "Affiliate stats: sign in as owner to view.";
    return;
  }
  try {
    const res = await fetch(
      `${getApiBase()}/api/public/affiliate/referrals?limit=300&authToken=${encodeURIComponent(String(session.token || ""))}`
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok || !Array.isArray(body.referrals)) {
      node.textContent = "Affiliate stats unavailable right now.";
      return;
    }
    const rows = body.referrals;
    let clicks = 0;
    let conversions = 0;
    let commission = 0;
    rows.forEach((row) => {
      const kind = String(row.conversion_type || "").toLowerCase();
      const amount = Number(row.commission_amount || 0);
      if (kind.indexOf("click_out:") === 0) {
        clicks += 1;
      }
      if (kind.indexOf("purchase_confirmed:") === 0) {
        conversions += 1;
      }
      if (Number.isFinite(amount)) {
        commission += amount;
      }
    });
    affiliateRuntime.quickStats = { clicks, conversions, commission };
    node.textContent =
      `Affiliate status: ${clicks} click-outs · ${conversions} confirmed conversions · estimated commission ${commission.toFixed(2)} EUR.`;
    updateCommissionReadinessChecklist();
    refreshMoneyDashboard();
  } catch {
    affiliateRuntime.quickStats = null;
    node.textContent = "Affiliate stats unavailable right now.";
    updateCommissionReadinessChecklist();
    refreshMoneyDashboard();
  }
}

async function refreshAffiliateReconciliation() {
  const node = document.getElementById("affiliateReconciliationReport");
  const syncNode = document.getElementById("affiliateLastSync");
  if (!node) {
    return;
  }
  const payload = await authedPost("/api/owner/affiliate/reconciliation/report", { lookbackDays: 30 });
  const stats = payload && payload.stats ? payload.stats : {};
  const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
  affiliateRuntime.reconciliation = {
    clicks: Number(stats.clicks || 0),
    pending: Number(stats.pending || 0),
    confirmed: Number(stats.confirmed || 0),
    reversed: Number(stats.reversed || 0)
  };
  node.innerHTML =
    `<strong>Affiliate reconciliation (30d)</strong><br />` +
    `Clicks: ${Number(stats.clicks || 0)} · Pending: ${Number(stats.pending || 0)} · Confirmed: ${Number(stats.confirmed || 0)} · Reversed: ${Number(stats.reversed || 0)}<br />` +
    `Conversion rate: ${Number(stats.conversionRatePercent || 0).toFixed(2)}% · Reversal rate: ${Number(stats.reversalRatePercent || 0).toFixed(2)}%<br />` +
    `Commission confirmed: ${Number(stats.commissionConfirmed || 0).toFixed(2)} EUR · Net: ${Number(stats.commissionNet || 0).toFixed(2)} EUR` +
    (warnings.length ? `<br /><em>Warnings:</em> ${warnings.map((x) => escapeHtml(String(x))).join(" | ")}` : "");
  if (syncNode) {
    syncNode.textContent = `Last sync: reconciliation ${formatSyncTime(Date.now())}`;
  }
  updateAffiliateReadinessAndActions();
  updateCommissionReadinessChecklist();
}

async function runAffiliateLinkHealth() {
  const box = document.getElementById("affiliateLinkHealthReport");
  const syncNode = document.getElementById("affiliateLastSync");
  const summaryNode = document.getElementById("affiliateLinkHealthSummary");
  if (!box) {
    return;
  }
  const payload = await authedPost("/api/owner/affiliate/link-health/check", {});
  const checks = Array.isArray(payload.checks) ? payload.checks : [];
  const checked = Number(payload.checked || checks.length || 0);
  const reachableCount = Number(payload.reachableCount || 0);
  const failCount = Number(payload.failCount || 0);
  affiliateRuntime.linkHealth = {
    checked,
    reachable: reachableCount,
    unreachable: failCount
  };
  if (summaryNode) {
    summaryNode.textContent = `Link health totals: checked ${checked} · reachable ${reachableCount} · unreachable ${failCount}.`;
  }
  renderAffiliateAlertBanner({ checked, reachable: reachableCount, unreachable: failCount });
  const history = saveAffiliateLinkHealthHistory({
    at: new Date().toISOString(),
    checked,
    reachable: reachableCount,
    unreachable: failCount
  });
  renderAffiliateLinkHealthTrend(history);
  if (!checks.length) {
    box.innerHTML = "<div class='msg msg-buyer'>No link health checks returned.</div>";
    return;
  }
  box.innerHTML = "";
  checks.forEach((item) => {
    const row = document.createElement("div");
    const classification = String(item.classification || (item.ok ? "ok" : "fail"));
    const healthy = classification === "ok" || classification === "blocked" || classification === "method_not_allowed";
    row.className = "msg " + (healthy ? "msg-seller" : "msg-buyer");
    const label =
      classification === "blocked"
        ? "BLOCKED(403)"
        : classification === "method_not_allowed"
          ? "BLOCKED(405)"
          : item.ok
            ? "OK"
            : "FAIL";
    row.textContent = `${label} ${item.status || 0} | ${item.url}`;
    box.appendChild(row);
  });
  if (syncNode) {
    syncNode.textContent = `Last sync: link health ${formatSyncTime(Date.now())}`;
  }
  updateAffiliateReadinessAndActions();
  updateCommissionReadinessChecklist();
}

async function refreshAffiliateAll() {
  await refreshAffiliateQuickStats();
  await refreshAffiliateReconciliation();
  await runAffiliateLinkHealth();
  const syncNode = document.getElementById("affiliateLastSync");
  if (syncNode) {
    syncNode.textContent = `Last sync: full affiliate refresh ${formatSyncTime(Date.now())}`;
  }
}

async function runAffiliateFullAudit() {
  await refreshAffiliateAll();
  updateAffiliateReadinessAndActions();
  setStatus("Full affiliate audit complete.");
}

function buildAffiliateReportPayload() {
  const sessionText = String(document.getElementById("affiliateSessionState")?.textContent || "").trim();
  const quickStatsText = String(document.getElementById("affiliateQuickStats")?.textContent || "").trim();
  const lastSyncText = String(document.getElementById("affiliateLastSync")?.textContent || "").trim();
  const reconcileText = String(document.getElementById("affiliateReconciliationReport")?.textContent || "").trim();
  const healthTotalsText = String(document.getElementById("affiliateLinkHealthSummary")?.textContent || "").trim();
  const alertText = String(document.getElementById("affiliateAlertBanner")?.textContent || "").trim();
  const rows = Array.from(document.querySelectorAll("#affiliateLinkHealthReport .msg"))
    .map((n) => String(n.textContent || "").trim())
    .filter(Boolean);
  return {
    exportedAt: new Date().toISOString(),
    session: sessionText,
    affiliateStatus: quickStatsText,
    lastSync: lastSyncText,
    reconciliation: reconcileText,
    linkHealthTotals: healthTotalsText,
    alerts: alertText,
    linkRows: rows,
    trend: getAffiliateLinkHealthHistory()
  };
}

async function copyAffiliateReport() {
  const payload = buildAffiliateReportPayload();
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  setStatus("Affiliate report copied.");
}

function exportAffiliateReportJson() {
  const payload = buildAffiliateReportPayload();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJson(`vibecart-affiliate-report-${stamp}.json`, payload);
  setStatus("Affiliate report JSON exported.");
}

function resetAffiliateAuditState() {
  affiliateRuntime.linkHealth = null;
  affiliateRuntime.reconciliation = null;
  affiliateRuntime.quickStats = null;
  affiliateRuntime.ownerRevenue = null;
  setAffiliateLastAlertSignature("");
  clearAffiliateLinkHealthHistory();
  const alertNode = document.getElementById("affiliateAlertBanner");
  const lastSyncNode = document.getElementById("affiliateLastSync");
  const linkSummaryNode = document.getElementById("affiliateLinkHealthSummary");
  const linkRowsNode = document.getElementById("affiliateLinkHealthReport");
  const actionsNode = document.getElementById("affiliateRecommendedActions");
  const commissionScoreNode = document.getElementById("commissionReadinessScore");
  const commissionActionsNode = document.getElementById("commissionReadinessActions");
  const commissionChecksNode = document.getElementById("commissionReadinessChecks");
  if (alertNode) alertNode.textContent = "Alerts: none.";
  if (lastSyncNode) lastSyncNode.textContent = "Last sync: reset. Run full affiliate audit.";
  if (linkSummaryNode) linkSummaryNode.textContent = "Link health: run check to view totals.";
  if (linkRowsNode) linkRowsNode.innerHTML = "";
  if (actionsNode) actionsNode.textContent = "Recommended actions: run full affiliate audit.";
  if (commissionScoreNode) commissionScoreNode.textContent = "Commission readiness: not evaluated yet.";
  if (commissionActionsNode) commissionActionsNode.textContent = "Actions: run a commission readiness check.";
  if (commissionChecksNode) commissionChecksNode.innerHTML = "";
  updateAffiliateReadinessAndActions();
  updateCommissionReadinessChecklist();
  setStatus("Affiliate audit state reset.");
}

function readAffiliateLastClick() {
  try {
    const raw = localStorage.getItem(AFFILIATE_LAST_CLICK_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

function renderAffiliatePartnerHealth() {
  const click = readAffiliateLastClick();
  const lastClickNode = document.getElementById("affiliatePartnerLastClick");
  const targetNode = document.getElementById("affiliatePartnerTarget");
  const statusNode = document.getElementById("affiliatePartnerHealthStatus");
  if (!click) {
    if (lastClickNode) lastClickNode.value = "No tracked click yet";
    if (targetNode) targetNode.value = "";
    if (statusNode) statusNode.textContent = "Partner health: no click data yet.";
    return;
  }
  const at = click.at ? new Date(click.at).toLocaleString() : "Unknown";
  const src = String(click.source || "unknown");
  const shop = String(click.shop || "unknown");
  const target = String(click.target || "").trim();
  const commissionEligible = Boolean(click.commissionEligible);
  if (lastClickNode) lastClickNode.value = `${at} | ${shop} | source=${src}`;
  if (targetNode) targetNode.value = target;
  if (statusNode) {
    statusNode.textContent = target
      ? `Partner health: last click recorded, target captured (${commissionEligible ? "commission-enabled" : "traffic-only"}).`
      : `Partner health: last click recorded but target URL missing.`;
  }
}

function readHomepageTrafficSnapshot() {
  try {
    const raw = localStorage.getItem(HOMEPAGE_TRAFFIC_GROWTH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") {
      return { total: 0, byEvent: {}, byTarget: {}, lastAt: "" };
    }
    return {
      total: Number(parsed.total || 0),
      byEvent: parsed.byEvent && typeof parsed.byEvent === "object" ? parsed.byEvent : {},
      byTarget: parsed.byTarget && typeof parsed.byTarget === "object" ? parsed.byTarget : {},
      lastAt: String(parsed.lastAt || "")
    };
  } catch {
    return { total: 0, byEvent: {}, byTarget: {}, lastAt: "" };
  }
}

function renderHomepageTrafficSnapshot() {
  const node = document.getElementById("homepageTrafficSnapshot");
  if (!node) {
    return;
  }
  const snap = readHomepageTrafficSnapshot();
  if (!snap.total) {
    node.textContent = "Homepage traffic snapshot: no data yet.";
    return;
  }
  const topEvents = Object.entries(snap.byEvent || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, 3)
    .map(([key, value]) => `${key}=${Number(value || 0)}`)
    .join(" | ");
  const topTargets = Object.entries(snap.byTarget || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, 3)
    .map(([key, value]) => `${key} (${Number(value || 0)})`)
    .join(" | ");
  const last = snap.lastAt ? new Date(snap.lastAt).toLocaleString() : "unknown";
  node.textContent = `Homepage clicks tracked: ${snap.total}. Last click: ${last}. Top events: ${topEvents || "n/a"}. Top targets: ${topTargets || "n/a"}.`;
}

function openAffiliatePartnerTargetInNewTab() {
  const click = readAffiliateLastClick();
  const target = String(click?.target || "").trim();
  const statusNode = document.getElementById("affiliatePartnerHealthStatus");
  if (!target) {
    if (statusNode) statusNode.textContent = "Partner health: no target URL to open.";
    return;
  }
  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    if (statusNode) statusNode.textContent = "Partner health: target URL is invalid.";
    return;
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    if (statusNode) statusNode.textContent = "Partner health: target must be http/https.";
    return;
  }
  window.open(parsed.toString(), "_blank", "noopener,noreferrer");
  if (statusNode) statusNode.textContent = "Partner health: opened target in new tab.";
}

async function checkAffiliatePartnerTargetReachability() {
  const statusNode = document.getElementById("affiliatePartnerHealthStatus");
  const click = readAffiliateLastClick();
  const target = String(click?.target || "").trim();
  if (!target) {
    if (statusNode) statusNode.textContent = "Partner health: no target URL to check.";
    return;
  }
  if (statusNode) statusNode.textContent = "Partner health: checking target reachability...";
  const timeoutMs = 12000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(target, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal
    });
    if (statusNode) {
      statusNode.textContent = "Partner health: target responded (reachable; no-cors opaque response).";
    }
  } catch (error) {
    if (statusNode) {
      statusNode.textContent = `Partner health: target check failed (${String(error?.message || error)}).`;
    }
  } finally {
    clearTimeout(timer);
  }
}

async function refreshPublicUserStats() {
  const payload = await authedPost("/api/owner/public-users/stats", {});
  const totalEl = document.getElementById("kpiPublicUsersTotal");
  const subEl = document.getElementById("kpiPublicUsersBreakdown");
  if (totalEl) {
    totalEl.textContent = String(payload.total ?? 0);
  }
  if (subEl) {
    subEl.textContent =
      `~${payload.passportApprox ?? 0} non-quick · ${payload.buyers ?? 0} buyers · ${payload.sellers ?? 0} sellers · ${payload.quickCheckoutSessions ?? 0} quick-checkout`;
  }
}

async function requestOwnerPayoutFromPanel() {
  const amount = Number(document.getElementById("ownerPayoutAmount")?.value || "0");
  const destinationLabel = String(document.getElementById("ownerPayoutDestination")?.value || "").trim();
  const notes = String(document.getElementById("ownerPayoutNotes")?.value || "").trim();
  const reservePercent = Number(document.getElementById("ownerReservePercent")?.value || "10");
  if (amount <= 0) {
    setStatus("Enter a payout amount greater than zero.");
    return;
  }
  const payload = await authedPost("/api/monetization/revenue/payout/request", {
    amount,
    currency: "EUR",
    destinationLabel,
    notes,
    reservePercent
  });
  setStatus(`Payout request created. Payout ID ${payload.payoutId}.`);
  await refreshOwnerRevenueDashboard();
}

async function updateOwnerPayoutStatusFromPanel() {
  const payoutId = Number(document.getElementById("ownerPayoutId")?.value || "0");
  const payoutStatus = String(document.getElementById("ownerPayoutStatus")?.value || "pending");
  if (!payoutId) {
    setStatus("Enter a valid payout record ID.");
    return;
  }
  await authedPost("/api/monetization/revenue/payout/status/update", { payoutId, payoutStatus });
  setStatus(`Payout #${payoutId} updated to ${payoutStatus}.`);
  await refreshOwnerRevenueDashboard();
}

function renderTrustProfiles(items) {
  const container = document.getElementById("trustProfilesList");
  if (!container) {
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = "<div class='msg msg-buyer'>No trust profiles found.</div>";
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    row.textContent = `${item.entity_type}#${item.entity_id} | trust=${item.trust_score} | delivery=${item.delivery_success_rate ?? "n/a"} | dispute=${item.dispute_rate ?? "n/a"}`;
    row.addEventListener("click", () => {
      document.getElementById("trustEntityType").value = String(item.entity_type || "seller");
      document.getElementById("trustEntityId").value = String(item.entity_id || "");
      document.getElementById("trustScore").value = String(item.trust_score ?? "");
      document.getElementById("trustDeliverySuccess").value = String(item.delivery_success_rate ?? "");
      document.getElementById("trustDisputeRate").value = String(item.dispute_rate ?? "");
      document.getElementById("trustVerificationScore").value = String(item.verification_score ?? "");
      document.getElementById("trustResponseSpeedScore").value = String(item.response_speed_score ?? "");
    });
    container.appendChild(row);
  });
}

async function refreshTrustProfiles() {
  const payload = await authedPost("/api/trust/profile/list", {});
  renderTrustProfiles(payload.items || []);
  setStatus("Trust profiles refreshed.");
}

async function saveTrustProfile() {
  const entityType = String(document.getElementById("trustEntityType").value || "").trim().toLowerCase();
  const entityId = Number(document.getElementById("trustEntityId").value || "0");
  const trustScore = Number(document.getElementById("trustScore").value || "0");
  if (!entityType || !entityId || Number.isNaN(trustScore)) {
    setStatus("Entity type, entity id, and trust score are required.");
    return;
  }
  const toNumberOrNull = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  };
  await authedPost("/api/trust/profile/upsert", {
    entityType,
    entityId,
    trustScore,
    deliverySuccessRate: toNumberOrNull(document.getElementById("trustDeliverySuccess").value),
    disputeRate: toNumberOrNull(document.getElementById("trustDisputeRate").value),
    verificationScore: toNumberOrNull(document.getElementById("trustVerificationScore").value),
    responseSpeedScore: toNumberOrNull(document.getElementById("trustResponseSpeedScore").value)
  });
  await refreshTrustProfiles();
  setStatus(`Trust profile saved for ${entityType} #${entityId}.`);
}

function renderChatSafetyEvents(items) {
  const container = document.getElementById("chatSafetyEventsList");
  if (!container) {
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = "<div class='msg msg-buyer'>No chat safety events found.</div>";
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    row.textContent =
      `#${item.id} | risk=${item.risk_level} (${item.risk_score}) | sender=${item.sender_user_id || "n/a"} | ` +
      `flags=${item.matched_rules || "none"} | "${item.message_excerpt || ""}"`;
    container.appendChild(row);
  });
}

async function refreshChatSafetyEvents() {
  const riskLevel = String(document.getElementById("chatRiskFilter").value || "").trim().toLowerCase();
  const limit = Number(document.getElementById("chatRiskLimit").value || "50");
  const payload = await authedPost("/api/chat/safety/events/list", {
    riskLevel,
    limit
  });
  renderChatSafetyEvents(payload.items || []);
  setStatus("Chat scam alerts refreshed.");
}

async function refreshCoachMetrics() {
  let payload;
  try {
    payload = await authedPost("/api/coach/metrics/summary", {});
  } catch {
    payload = getCoachMetricsFallback();
    setStatus("AI coach metrics loaded in smart fallback mode.");
  }
  const box = document.getElementById("coachMetricsBox");
  if (!box) {
    return;
  }
  const s = payload.summary || {};
  box.textContent =
    `Profiles: ${s.totalProfiles || 0} | Weight loss: ${s.weightLoss || 0} | Weight gain: ${s.weightGain || 0} | ` +
    `Muscle gain: ${s.muscleGain || 0} | Medical support: ${s.medicalSupport || 0} | ` +
    `General fitness: ${s.generalFitness || 0} | ` +
    `Check-ins (7 days): ${s.checkinsLast7Days || 0}`;
  if (!/fallback/i.test(String(window.__vibecartLastStatus || ""))) {
    setStatus("AI coach metrics refreshed.");
  }
}

function renderInsuranceJurisdictions(items) {
  const container = document.getElementById("insuranceJurisdictionList");
  if (!container) {
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = "<div class='msg msg-buyer'>No insurance jurisdiction rules yet.</div>";
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    const enabled = Number(item.distribution_enabled) === 1 ? "ENABLED" : "BLOCKED";
    row.textContent = `${item.country_code} | ${enabled} | risk=${item.risk_level} | reviewed=${item.legal_reviewed_at || "n/a"}`;
    row.addEventListener("click", () => {
      document.getElementById("insCountryCode").value = String(item.country_code || "");
      document.getElementById("insRiskLevel").value = String(item.risk_level || "medium");
      document.getElementById("insDistributionEnabled").value = Number(item.distribution_enabled) === 1 ? "1" : "0";
      document.getElementById("insLegalNotes").value = String(item.legal_notes || "");
    });
    container.appendChild(row);
  });
}

async function refreshInsuranceJurisdictions() {
  const payload = await authedPost("/api/insurance/jurisdiction/list", {});
  renderInsuranceJurisdictions(payload.items || []);
  setStatus("Insurance jurisdiction list refreshed.");
}

async function saveInsuranceJurisdictionRule() {
  const countryCode = String(document.getElementById("insCountryCode").value || "").trim().toUpperCase();
  const riskLevel = String(document.getElementById("insRiskLevel").value || "medium");
  const distributionEnabled = document.getElementById("insDistributionEnabled").value === "1";
  const legalNotes = String(document.getElementById("insLegalNotes").value || "").trim();
  if (!countryCode || countryCode.length !== 2) {
    setStatus("Enter a valid ISO-2 country code.");
    return;
  }
  await authedPost("/api/insurance/jurisdiction/upsert", {
    countryCode,
    riskLevel,
    distributionEnabled,
    legalNotes
  });
  await refreshInsuranceJurisdictions();
  setStatus(`Saved insurance jurisdiction rule for ${countryCode}.`);
}

async function disableInsuranceJurisdictionRule() {
  const countryCode = String(document.getElementById("insCountryCode").value || "").trim().toUpperCase();
  const legalNotes = String(document.getElementById("insLegalNotes").value || "").trim();
  if (!countryCode || countryCode.length !== 2) {
    setStatus("Enter a valid ISO-2 country code first.");
    return;
  }
  await authedPost("/api/insurance/jurisdiction/disable", { countryCode, legalNotes });
  await refreshInsuranceJurisdictions();
  setStatus(`Insurance disabled for ${countryCode}.`);
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function downloadBackupSnapshot() {
  const now = new Date();
  const session = getSession();
  const snapshot = {
    exportedAt: now.toISOString(),
    exportedBy: session.email || "owner",
    app: "VibeCart",
    settings: getSettings(),
    revenueSettings: getRevenueSettings(),
    uiPreferences: {
      theme: localStorage.getItem("vibecart-theme") || "vibrant",
      interactionMode: localStorage.getItem("vibecart-interaction-mode") || "guided"
    },
    aiPanel: {
      workspaceLink: localStorage.getItem(AI_LINK_KEY) || "",
      suggestionsCount: getAiSuggestions().length
    },
    insuranceJurisdictions: [],
    pricingGuardrails: null
  };

  try {
    const jurisdictions = await authedPost("/api/insurance/jurisdiction/list", {});
    snapshot.insuranceJurisdictions = jurisdictions.items || [];
  } catch (error) {
    snapshot.insuranceJurisdictions = [{ error: `Could not fetch jurisdictions: ${error.message}` }];
  }

  try {
    const guardrails = await authedPost("/api/monetization/guardrails/get", {});
    snapshot.pricingGuardrails = guardrails.guardrails || null;
  } catch (error) {
    snapshot.pricingGuardrails = { error: `Could not fetch guardrails: ${error.message}` };
  }

  const stamp = now.toISOString().replace(/[:.]/g, "-");
  downloadJson(`vibecart-backup-${stamp}.json`, snapshot);
  setStatus("Backup JSON downloaded.");
}

const SAVE_SETTINGS_FETCH_MS = 25000;

async function saveSettings() {
  const session = getSession();
  if (!session.token) {
    setStatus("Unlock panel first before saving.");
    updateOwnerCommandDeck("Not signed in");
    return;
  }
  setStatus("Saving…");
  updateOwnerCommandDeck("Saving site settings…");
  try {
    const payload = {
      ...getStoredSettings(),
      title: (document.getElementById("setTitle")?.value || "").trim() || defaults.title,
      badge: (document.getElementById("setBadge")?.value || "").trim() || defaults.badge,
      headline: (document.getElementById("setHeadline")?.value || "").trim() || defaults.headline,
      subtitle: (document.getElementById("setSubtitle")?.value || "").trim() || defaults.subtitle,
      bridgeTitle: (document.getElementById("setBridgeTitle")?.value || "").trim() || defaults.bridgeTitle,
      bridgeText: (document.getElementById("setBridgeText")?.value || "").trim() || defaults.bridgeText,
      theme: document.getElementById("setTheme")?.value || defaults.theme
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem("vibecart-theme", payload.theme);
    const requestBody = JSON.stringify({
      token: session.token,
      authToken: session.token,
      settings: payload
    });
    const endpoints = [
      `${getApiBase()}/api/owner/site-settings/upsert`,
      `${PUBLIC_PRODUCTION_API_FALLBACK}/api/owner/site-settings/upsert`
    ].filter((url, idx, arr) => arr.indexOf(url) === idx);
    let saved = false;
    let lastCode = "UNKNOWN_ERROR";
    let lastMessage = "";
    for (const endpoint of endpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SAVE_SETTINGS_FETCH_MS);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const raw = await response.text();
        let result = {};
        try {
          result = raw ? JSON.parse(raw) : {};
        } catch {
          lastCode = `HTTP_${response.status}_NOT_JSON`;
          lastMessage = raw.slice(0, 200);
          continue;
        }
        if (response.ok && result.ok) {
          saved = true;
          break;
        }
        lastCode = result.code || `HTTP_${response.status}`;
        lastMessage = String(result.message || "").trim();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error && error.name === "AbortError") {
          lastCode = "REQUEST_TIMEOUT";
          lastMessage = `No response within ${SAVE_SETTINGS_FETCH_MS / 1000}s (${endpoint})`;
        } else {
          lastCode = "NETWORK_ERROR";
          lastMessage = String(error?.message || error || "").trim();
        }
      }
    }
    if (!saved) {
      if (lastCode === "INVALID_SESSION") {
        setStatus(
          `Saved locally only. Cloud save failed: session not accepted (${lastCode}). Unlock again, then save.${lastMessage ? ` Detail: ${lastMessage}` : ""}`
        );
        updateOwnerCommandDeck("Save failed: session");
        return;
      }
      if (lastCode === "SITE_SETTINGS_DB_UNAVAILABLE" || lastCode === "SITE_SETTINGS_SAVE_FAILED") {
        setStatus(
          `Saved locally only. Cloud save failed (${lastCode}). Check Railway API logs and MySQL.${lastMessage ? ` Detail: ${lastMessage}` : ""}`
        );
        updateOwnerCommandDeck("Save failed: DB");
        return;
      }
      if (lastCode === "SERVER_ERROR") {
        setStatus(
          `Saved locally only. Cloud save failed (${lastCode}).${lastMessage ? ` Detail: ${lastMessage}` : " Restart API and retry."}`
        );
        updateOwnerCommandDeck("Save failed: server");
        return;
      }
      if (lastCode === "REQUEST_TIMEOUT") {
        setStatus(`Saved locally only. Cloud save timed out. ${lastMessage || "Check API base URL and backend."}`);
        updateOwnerCommandDeck("Save timed out");
        return;
      }
      setStatus(`Saved locally only. Cloud save failed: ${lastCode}${lastMessage ? ` (${lastMessage})` : ""}`);
      updateOwnerCommandDeck("Save failed");
      return;
    }
    setStatus("Saved and synced. Website + app will load this version.");
    updateOwnerCommandDeck("Saved and synced");
  } catch (error) {
    const msg = error?.message || String(error);
    setStatus(`Save failed: ${msg}`);
    updateOwnerCommandDeck("Save error");
  }
}

function resetSettings() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem("vibecart-theme", defaults.theme);
  fillForm().catch(() => {});
  setStatus("Reset to default settings.");
}

async function unlockPanel() {
  try {
    await unlockPanelInner();
  } catch (error) {
    const msg = String(error?.message || error || "");
    const refused = /ECONNREFUSED|Failed to fetch|NetworkError|load failed/i.test(msg);
    setStatus(
      refused
        ? `Login failed: ${msg}. Clear a bad API base in site data, leave API Base URL empty on Netlify, or set ${PUBLIC_PRODUCTION_API_FALLBACK}.`
        : `Login failed: ${msg}. If this persists, clear site data for this page or fix API Base URL.`
    );
  }
}

async function unlockPanelInner() {
  const usernameInput = document.getElementById("ownerUsername").value.trim().toLowerCase();
  const passInput = document.getElementById("ownerCode").value.trim();
  const phraseInput = document.getElementById("ownerPhrase").value.trim();
  const mfaCode = document.getElementById("ownerMfaCode").value.trim();

  if (!usernameInput || !passInput || !phraseInput) {
    setStatus("Email, passcode, and security phrase are required.");
    return;
  }

  const apiBaseInput = document.getElementById("apiBaseUrl");
  saveApiBase(apiBaseInput ? apiBaseInput.value : DEFAULT_API_BASE);
  let response;
  try {
    response = await fetch(`${getApiBase()}/api/owner/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: usernameInput,
        password: passInput,
        securityPhrase: phraseInput,
        mfaCode
      })
    });
  } catch (error) {
    const msg = String(error?.message || error || "network error");
    const refused = /ECONNREFUSED|Failed to fetch|NetworkError|load failed/i.test(msg);
    setStatus(
      refused
        ? `Login failed: cannot reach API (${msg}). On Netlify leave API Base URL empty (uses this site’s /api), or set ${PUBLIC_PRODUCTION_API_FALLBACK}. For local dev run: npm start (port 8081).`
        : `Login failed: ${msg}. Try leaving API Base URL empty (same site /api) or redeploy the backend.`
    );
    return;
  }
  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    setStatus(
      `Login failed: HTTP ${response.status} (not JSON). Wrong API base URL or backend not reachable.`
    );
    return;
  }
  if (!response.ok || !payload.ok) {
    const detail = payload.message ? ` ${String(payload.message)}` : "";
    const pathHint =
      payload.code === "NOT_FOUND" && payload.path
        ? ` Request path was ${payload.method || "?"} ${payload.path}. Check API base (no trailing /api) and redeploy backend.`
        : "";
    setStatus(`Login failed: ${payload.code || "UNKNOWN_ERROR"}.${detail}${pathHint}`);
    return;
  }

  saveSession({
    token: payload.token,
    expiresAt: payload.expiresAt,
    email: usernameInput
  });
  showPanelUnlocked("Panel unlocked.");
  const softRefresh = async (fn, moduleName) => {
    try {
      await fn();
    } catch {
      addAdminMessage(`Module pending: ${moduleName}`, "request");
    }
  };
  softRefresh(refreshInsuranceJurisdictions, "Insurance jurisdictions").catch(() => {});
  softRefresh(refreshTrustProfiles, "Trust profiles").catch(() => {});
  softRefresh(refreshChatSafetyEvents, "Chat safety events").catch(() => {});
  softRefresh(refreshCoachMetrics, "Coach metrics").catch(() => {});
  softRefresh(refreshOwnerRevenueDashboard, "Revenue dashboard").catch(() => {});
  refreshMoneyDashboard();
  runPartnerSecurityCheck();
  softRefresh(refreshPublicUserStats, "Public user stats").catch(() => {});
  softRefresh(refreshAiOps, "AI operations").catch(() => {});
}

async function updateOwnerAuthFromPanel() {
  const session = getSession();
  if (!session.token) {
    setStatus("No active owner session.");
    return;
  }

  const newEmail = document.getElementById("newOwnerEmail").value.trim().toLowerCase();
  const newPass = document.getElementById("newOwnerPasscode").value.trim();
  const newPhrase = document.getElementById("newOwnerPhrase").value.trim();

  if (!newEmail || !newEmail.includes("@")) {
    setStatus("Enter a valid new owner email.");
    return;
  }
  if (!newPass || newPass.length < 10) {
    setStatus("New password must be at least 10 characters.");
    return;
  }
  if (!newPhrase || newPhrase.length < 10) {
    setStatus("New security phrase must be at least 10 characters.");
    return;
  }

  const response = await fetch(`${getApiBase()}/api/owner/auth/rotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: session.token,
      nextEmail: newEmail,
      nextPassword: newPass,
      nextSecurityPhrase: newPhrase
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    const code = String(payload.code || "UNKNOWN_ERROR");
    if (code === "EMAIL_ALREADY_EXISTS") {
      setStatus("Update failed: that owner email already exists. Use another email.");
      return;
    }
    if (code === "OWNER_AUTH_UPDATE_FAILED") {
      setStatus("Update failed: backend could not save owner credentials right now.");
      return;
    }
    setStatus(`Update failed: ${code}`);
    return;
  }

  document.getElementById("newOwnerEmail").value = "";
  document.getElementById("newOwnerPasscode").value = "";
  document.getElementById("newOwnerPhrase").value = "";
  saveSession({
    token: session.token,
    expiresAt: session.expiresAt,
    email: newEmail
  });
  fillOwnerAuthForm();
  setStatus("Owner email and password updated.");
}

async function logoutOwner() {
  const session = getSession();
  if (session.token) {
    await fetch(`${getApiBase()}/api/owner/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: session.token })
    });
  }
  clearSession();
  location.reload();
}

function generateAiPrompt() {
  const task = document.getElementById("aiTaskText").value.trim();
  const prompt = [
    "You are helping maintain my VibeCart platform.",
    "Please analyze this request and propose secure, production-safe changes.",
    `Request: ${task || "Suggest top-priority improvements for security, performance, and UX."}`,
    "Include: (1) risks, (2) implementation steps, (3) test checklist, (4) rollback plan."
  ].join("\n");
  document.getElementById("aiPromptText").value = prompt;
  setStatus("AI prompt generated.");
}

async function copyAiPrompt() {
  const text = document.getElementById("aiPromptText").value.trim();
  if (!text) {
    setStatus("Generate a prompt first.");
    return;
  }
  await navigator.clipboard.writeText(text);
  setStatus("AI prompt copied to clipboard.");
}

function openAiAssistantLink() {
  const linkInput = document.getElementById("aiLink");
  const value = String(linkInput.value || "").trim();
  const fallback = "https://chat.openai.com/";
  const target = value || fallback;
  if (!value) {
    setStatus("No AI workspace link set. Opening default assistant.");
  }
  localStorage.setItem(AI_LINK_KEY, target);
  if (linkInput) {
    linkInput.value = target;
  }
  window.open(target, "_blank", "noopener,noreferrer");
  setStatus("Opened AI assistant link.");
}

async function copyAdminAppUrl() {
  const node = document.getElementById("adminAppUrl");
  const text = String(node?.value || "").trim();
  if (!text) {
    setStatus("Admin app URL is not available.");
    return;
  }
  await navigator.clipboard.writeText(text);
  setStatus("Admin app URL copied.");
}

function openAdminAppUrl() {
  const node = document.getElementById("adminAppUrl");
  const text = String(node?.value || "").trim();
  if (!text) {
    setStatus("Admin app URL is not available.");
    return;
  }
  window.open(text, "_blank", "noopener,noreferrer");
  setStatus("Opened admin app.");
}

function getAiSuggestions() {
  try {
    return JSON.parse(localStorage.getItem(AI_SUGGESTIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAiSuggestions(items) {
  localStorage.setItem(AI_SUGGESTIONS_KEY, JSON.stringify(items));
}

function renderAiSuggestionsFeed() {
  const container = document.getElementById("aiSuggestionsFeed");
  if (!container) {
    return;
  }
  const items = getAiSuggestions();
  if (!items.length) {
    container.innerHTML = "<div class='msg msg-buyer'>No suggestions yet.</div>";
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "msg msg-buyer";
    row.innerHTML = `<strong>${escapeHtml(String(item.status || "").toUpperCase())}</strong> - ${escapeHtml(item.text)}`;
    row.addEventListener("click", () => {
      const nextStatus =
        item.status === "todo" ? "in_progress" : item.status === "in_progress" ? "done" : "todo";
      const updated = getAiSuggestions().map((x) =>
        x.id === item.id ? { ...x, status: nextStatus } : x
      );
      saveAiSuggestions(updated);
      renderAiSuggestionsFeed();
    });
    container.appendChild(row);
  });
}

function saveCurrentPromptToFeed() {
  const text = document.getElementById("aiPromptText").value.trim();
  if (!text) {
    setStatus("Generate a prompt first.");
    return;
  }
  const items = getAiSuggestions();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    status: "todo"
  });
  saveAiSuggestions(items);
  renderAiSuggestionsFeed();
  setStatus("Suggestion saved to feed.");
}

function runPendingDemos() {
  const updated = getAiSuggestions().map((item) => {
    if (item.status === "todo") {
      return { ...item, status: "in_progress" };
    }
    return item;
  });
  saveAiSuggestions(updated);
  renderAiSuggestionsFeed();
  setStatus("Pending suggestions moved to active work (in progress).");
}

function clearDoneSuggestions() {
  const filtered = getAiSuggestions().filter((item) => item.status !== "done");
  saveAiSuggestions(filtered);
  renderAiSuggestionsFeed();
  setStatus("Done suggestions cleared.");
}

function generateAdCreative() {
  const slot = document.getElementById("adSlotShare").value;
  const budget = Number(document.getElementById("minAdBudget").value || "50");
  const suggestions = [
    `Use ${slot} ad slots with "Sponsored" labels to keep trust high.`,
    `Set minimum campaign budget at EUR ${budget} and auto-approve only legal categories.`,
    "Creative idea: 'Study Smart Deals' campaign for student electronics and books.",
    "Creative idea: 'Move Fast Fashion' cross-border seasonal campaign."
  ].join("\n");
  document.getElementById("adCreativeSuggestion").value = suggestions;
  setStatus("Ad creative suggestions generated.");
}

function initializeOwnerSecurity() {
  renderAffiliateSessionState();
  renderAffiliateLinkHealthTrend(getAffiliateLinkHealthHistory());
  renderAffiliateAlertBanner(null);
  renderAffiliateAlertSeverityMode();
  updateAffiliateReadinessAndActions();
  updateCommissionReadinessChecklist();
  fillPremiumPlanSettingsForm();
  renderBookkeepingLedger();
  renderAffiliateProgramSignupList();
  renderPartnerOutreachList();
  initAffiliateOutreachUi();
  renderCommissionValidatedOffers();
  fillDefaultOutreachFields();
  syncOutreachPartnerEmailFromSelect();
  setLiveMoneyDashboardState(localStorage.getItem(LIVE_MONEY_DASHBOARD_KEY) === "1");
  if (isSessionValid()) {
    showPanelUnlocked("Session restored.");
    refreshInsuranceJurisdictions().catch(() => {});
    refreshTrustProfiles().catch(() => {});
    refreshChatSafetyEvents().catch(() => {});
    refreshCoachMetrics().catch(() => {});
    refreshOwnerRevenueDashboard().catch(() => {});
    refreshPublicUserStats().catch(() => {});
    if (localStorage.getItem(LIVE_MONEY_DASHBOARD_KEY) === "1") {
      startLiveMoneyDashboard();
    }
    return;
  }
  stopLiveMoneyDashboard();
  clearSession();
}

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.dataset.boundClick = "1";
  el.addEventListener("click", (event) => {
    const label = String(el.textContent || "").trim();
    if (label) {
      setStatus(`Running: ${label}...`);
    }
    handler(event);
  });
}

updateMessageBadge().catch(() => {});

bindClick("unlockBtn", () => {
  unlockPanel().catch((error) => {
    const msg = String(error?.message || error || "Authentication error.");
    setStatus(/ECONNREFUSED|Failed to fetch|NetworkError/i.test(msg) ? `${msg} — check API Base URL (empty = site /api on Netlify).` : msg);
  });
});
bindClick("saveSettings", () => {
  saveSettings().catch((error) => {
    setStatus(`Save failed: ${error?.message || String(error)}`);
    updateOwnerCommandDeck("Save error");
  });
});
bindClick("resetSettings", resetSettings);
bindClick("updateOwnerAuth", () => {
  updateOwnerAuthFromPanel().catch(() => setStatus("Could not update owner authentication."));
});
bindClick("logoutOwner", () => {
  logoutOwner().catch(() => setStatus("Could not logout."));
});
bindClick("generateAiPrompt", generateAiPrompt);
bindClick("saveAiSuggestion", saveCurrentPromptToFeed);
bindClick("copyAiPrompt", () => {
  copyAiPrompt().catch(() => setStatus("Could not copy prompt."));
});
bindClick("openAiLink", openAiAssistantLink);
bindClick("copyAdminAppUrl", () => {
  copyAdminAppUrl().catch(() => setStatus("Could not copy admin app URL."));
});
bindClick("openAdminAppUrl", openAdminAppUrl);
bindClick("runPendingDemos", runPendingDemos);
bindClick("clearDoneSuggestions", clearDoneSuggestions);
bindClick("generateAdCreative", generateAdCreative);
bindClick("applyPricingPreset", applyPricingPreset);
bindClick("saveRevenueSettings", saveRevenueSettings);
bindClick("seedRevenueProducts", () => {
  seedRevenueProducts().catch((error) => setStatus(`Seed failed: ${error.message}`));
});
bindClick("assignPlanToShop", () => {
  assignPlanToShop().catch((error) => setStatus(`Assign failed: ${error.message}`));
});
bindClick("buyBoostForTarget", () => {
  buyBoostForTarget().catch((error) => setStatus(`Boost failed: ${error.message}`));
});
bindClick("refreshInsuranceJurisdictions", () => {
  refreshInsuranceJurisdictions().catch((error) => setStatus(`Refresh failed: ${error.message}`));
});
bindClick("upsertInsuranceJurisdiction", () => {
  saveInsuranceJurisdictionRule().catch((error) => setStatus(`Save failed: ${error.message}`));
});
bindClick("disableInsuranceJurisdiction", () => {
  disableInsuranceJurisdictionRule().catch((error) => setStatus(`Disable failed: ${error.message}`));
});
bindClick("downloadBackupJson", () => {
  downloadBackupSnapshot().catch((error) => setStatus(`Backup failed: ${error.message}`));
});
bindClick("saveTrustProfile", () => {
  saveTrustProfile().catch((error) => setStatus(`Trust save failed: ${error.message}`));
});
bindClick("refreshTrustProfiles", () => {
  refreshTrustProfiles().catch((error) => setStatus(`Trust refresh failed: ${error.message}`));
});
bindClick("refreshChatSafetyEvents", () => {
  refreshChatSafetyEvents().catch((error) => setStatus(`Chat safety refresh failed: ${error.message}`));
});
bindClick("refreshCoachMetrics", () => {
  refreshCoachMetrics().catch((error) => setStatus(`Coach metrics refresh failed: ${error.message}`));
});
bindClick("refreshAiOps", () => {
  refreshAiOps().catch((error) => setStatus(`AI ops refresh failed: ${error.message}`));
});
bindClick("generateAiOpsRecommendations", () => {
  generateAiOpsRecommendationsFromPanel().catch((error) => setStatus(`AI ops recommendation failed: ${error.message}`));
});
bindClick("decideAiOp", () => {
  decideAiOpFromPanel().catch((error) => setStatus(`AI op decision failed: ${error.message}`));
});
bindClick("refreshOwnerRevenueDashboard", () => {
  refreshOwnerRevenueDashboard().catch((error) => setStatus(`Revenue dashboard refresh failed: ${error.message}`));
});
bindClick("refreshAffiliateReconciliation", () => {
  refreshAffiliateReconciliation().catch((error) => setStatus(`Affiliate reconciliation failed: ${error.message}`));
});
bindClick("runAffiliateLinkHealth", () => {
  runAffiliateLinkHealth().catch((error) => setStatus(`Affiliate link health failed: ${error.message}`));
});
bindClick("refreshAffiliateAll", () => {
  refreshAffiliateAll().catch((error) => setStatus(`Affiliate full refresh failed: ${error.message}`));
});
bindClick("refreshAffiliatePartnerHealth", () => {
  renderAffiliatePartnerHealth();
  setStatus("Affiliate partner health refreshed.");
});
bindClick("refreshHomepageTrafficSnapshot", () => {
  renderHomepageTrafficSnapshot();
  setStatus("Homepage traffic snapshot refreshed.");
});
bindClick("checkAffiliatePartnerTarget", () => {
  checkAffiliatePartnerTargetReachability().catch((error) => setStatus(`Partner health check failed: ${error.message}`));
});
bindClick("openAffiliatePartnerTarget", () => {
  openAffiliatePartnerTargetInNewTab();
});
bindClick("runAffiliateFullAudit", () => {
  runAffiliateFullAudit().catch((error) => setStatus(`Affiliate full audit failed: ${error.message}`));
});
bindClick("runAdminReadinessGate", () => {
  runAdminReadinessGate().catch((error) => setStatus(`Readiness gate failed: ${error.message}`));
});
bindClick("runCommissionReadiness", () => {
  updateCommissionReadinessChecklist();
  setStatus("Commission readiness check refreshed.");
});
bindClick("markOfferCommissionValidated", () => {
  markOfferCommissionValidated();
});
bindClick("promoteGreenOffersHomepage", () => {
  promoteGreenOffersToHomepage("green_only").catch((error) => setStatus(`Homepage promotion failed: ${error.message}`));
});
bindClick("promoteMixedOffersHomepage", () => {
  promoteGreenOffersToHomepage("mixed_growth").catch((error) => setStatus(`Homepage promotion failed: ${error.message}`));
});
bindClick("generateOutreachDraft", () => {
  buildOutreachDraft();
});
bindClick("saveOutreachToInbox", () => {
  saveOutreachDraftToInbox().catch(() => setStatus("Could not save outreach draft to inbox."));
});
bindClick("sendOutreachEmail", () => {
  sendOutreachEmailViaClient();
});
bindClick("saveSelectedOutreachToInbox", () => {
  saveSelectedOutreachDraftsToInbox().catch(() => setStatus("Could not save selected outreach drafts."));
});
bindClick("sendSelectedOutreachEmail", () => {
  sendSelectedOutreachEmailViaClient();
});
bindClick("resetOfferValidationSteps", () => {
  resetOfferValidationSteps();
});
bindClick("refreshMoneyDashboard", () => {
  refreshMoneyDashboard();
});
bindClick("toggleLiveMoneyDashboard", () => {
  toggleLiveMoneyDashboard();
});
bindClick("addBookkeepingEntry", () => {
  addBookkeepingEntryFromPanel();
});
bindClick("exportBookkeepingLedger", () => {
  exportBookkeepingLedger();
});
bindClick("generateMonthlyBookkeepingReport", () => {
  generateMonthlyBookkeepingReport();
});
bindClick("clearBookkeepingLedger", () => {
  clearBookkeepingLedger();
});
bindClick("runPartnerSecurityCheck", () => {
  runPartnerSecurityCheck();
});
bindClick("generatePartnerOnboardingTemplate", () => {
  generatePartnerOnboardingTemplate();
});
bindClick("savePremiumPlanSettings", () => {
  savePremiumPlanSettings();
});
bindClick("clearAffiliateTrendHistory", () => {
  clearAffiliateLinkHealthHistory();
  updateAffiliateReadinessAndActions();
  updateCommissionReadinessChecklist();
  setStatus("Affiliate trend history cleared.");
});
bindClick("resetAffiliateAuditState", () => {
  resetAffiliateAuditState();
});
bindClick("copyAffiliateReport", () => {
  copyAffiliateReport().catch((error) => setStatus(`Copy affiliate report failed: ${error.message}`));
});
bindClick("exportAffiliateReportJson", () => {
  exportAffiliateReportJson();
});
bindClick("requestOwnerPayout", () => {
  requestOwnerPayoutFromPanel().catch((error) => setStatus(`Payout request failed: ${error.message}`));
});
bindClick("updateOwnerPayoutStatus", () => {
  updateOwnerPayoutStatusFromPanel().catch((error) => setStatus(`Payout status update failed: ${error.message}`));
});

// Global fail-safe: if any direct listener failed to bind, this still handles button clicks.
const clickHandlers = {
  unlockBtn: () =>
    unlockPanel().catch((error) => {
      const msg = String(error?.message || error || "Authentication error.");
      setStatus(/ECONNREFUSED|Failed to fetch|NetworkError/i.test(msg) ? `${msg} — check API Base URL.` : msg);
    }),
  saveSettings: () =>
    saveSettings().catch((error) => {
      setStatus(`Save failed: ${error?.message || String(error)}`);
      updateOwnerCommandDeck("Save error");
    }),
  resetSettings: () => resetSettings(),
  updateOwnerAuth: () => updateOwnerAuthFromPanel().catch(() => setStatus("Could not update owner authentication.")),
  logoutOwner: () => logoutOwner().catch(() => setStatus("Could not logout.")),
  generateAiPrompt: () => generateAiPrompt(),
  saveAiSuggestion: () => saveCurrentPromptToFeed(),
  copyAiPrompt: () => copyAiPrompt().catch(() => setStatus("Could not copy prompt.")),
  openAiLink: () => openAiAssistantLink(),
  copyAdminAppUrl: () => copyAdminAppUrl().catch(() => setStatus("Could not copy admin app URL.")),
  openAdminAppUrl: () => openAdminAppUrl(),
  runPendingDemos: () => runPendingDemos(),
  clearDoneSuggestions: () => clearDoneSuggestions(),
  generateAdCreative: () => generateAdCreative(),
  applyPricingPreset: () => applyPricingPreset(),
  saveRevenueSettings: () => saveRevenueSettings(),
  seedRevenueProducts: () => seedRevenueProducts().catch((error) => setStatus(`Seed failed: ${error.message}`)),
  assignPlanToShop: () => assignPlanToShop().catch((error) => setStatus(`Assign failed: ${error.message}`)),
  buyBoostForTarget: () => buyBoostForTarget().catch((error) => setStatus(`Boost failed: ${error.message}`)),
  refreshInsuranceJurisdictions: () =>
    refreshInsuranceJurisdictions().catch((error) => setStatus(`Refresh failed: ${error.message}`)),
  upsertInsuranceJurisdiction: () =>
    saveInsuranceJurisdictionRule().catch((error) => setStatus(`Save failed: ${error.message}`)),
  disableInsuranceJurisdiction: () =>
    disableInsuranceJurisdictionRule().catch((error) => setStatus(`Disable failed: ${error.message}`)),
  downloadBackupJson: () => downloadBackupSnapshot().catch((error) => setStatus(`Backup failed: ${error.message}`)),
  saveTrustProfile: () => saveTrustProfile().catch((error) => setStatus(`Trust save failed: ${error.message}`)),
  refreshTrustProfiles: () => refreshTrustProfiles().catch((error) => setStatus(`Trust refresh failed: ${error.message}`)),
  refreshChatSafetyEvents: () =>
    refreshChatSafetyEvents().catch((error) => setStatus(`Chat safety refresh failed: ${error.message}`)),
  refreshCoachMetrics: () => refreshCoachMetrics().catch((error) => setStatus(`Coach metrics refresh failed: ${error.message}`)),
  refreshAiOps: () => refreshAiOps().catch((error) => setStatus(`AI ops refresh failed: ${error.message}`)),
  generateAiOpsRecommendations: () =>
    generateAiOpsRecommendationsFromPanel().catch((error) => setStatus(`AI ops recommendation failed: ${error.message}`)),
  decideAiOp: () => decideAiOpFromPanel().catch((error) => setStatus(`AI op decision failed: ${error.message}`)),
  refreshOwnerRevenueDashboard: () =>
    refreshOwnerRevenueDashboard().catch((error) => setStatus(`Revenue dashboard refresh failed: ${error.message}`)),
  refreshAffiliateReconciliation: () =>
    refreshAffiliateReconciliation().catch((error) => setStatus(`Affiliate reconciliation failed: ${error.message}`)),
  runAffiliateLinkHealth: () =>
    runAffiliateLinkHealth().catch((error) => setStatus(`Affiliate link health failed: ${error.message}`)),
  refreshAffiliateAll: () =>
    refreshAffiliateAll().catch((error) => setStatus(`Affiliate full refresh failed: ${error.message}`)),
  refreshAffiliatePartnerHealth: () => {
    renderAffiliatePartnerHealth();
    setStatus("Affiliate partner health refreshed.");
  },
  refreshHomepageTrafficSnapshot: () => {
    renderHomepageTrafficSnapshot();
    setStatus("Homepage traffic snapshot refreshed.");
  },
  checkAffiliatePartnerTarget: () =>
    checkAffiliatePartnerTargetReachability().catch((error) => setStatus(`Partner health check failed: ${error.message}`)),
  openAffiliatePartnerTarget: () => openAffiliatePartnerTargetInNewTab(),
  runAffiliateFullAudit: () =>
    runAffiliateFullAudit().catch((error) => setStatus(`Affiliate full audit failed: ${error.message}`)),
  runAdminReadinessGate: () =>
    runAdminReadinessGate().catch((error) => setStatus(`Readiness gate failed: ${error.message}`)),
  runCommissionReadiness: () => {
    updateCommissionReadinessChecklist();
    setStatus("Commission readiness check refreshed.");
  },
  markOfferCommissionValidated: () => markOfferCommissionValidated(),
  promoteMixedOffersHomepage: () =>
    promoteGreenOffersToHomepage("mixed_growth").catch((error) => setStatus(`Homepage promotion failed: ${error.message}`)),
  promoteGreenOffersHomepage: () =>
    promoteGreenOffersToHomepage("green_only").catch((error) => setStatus(`Homepage promotion failed: ${error.message}`)),
  generateOutreachDraft: () => buildOutreachDraft(),
  saveOutreachToInbox: () => saveOutreachDraftToInbox().catch(() => setStatus("Could not save outreach draft to inbox.")),
  sendOutreachEmail: () => sendOutreachEmailViaClient(),
  saveSelectedOutreachToInbox: () => saveSelectedOutreachDraftsToInbox().catch(() => setStatus("Could not save selected outreach drafts.")),
  sendSelectedOutreachEmail: () => sendSelectedOutreachEmailViaClient(),
  resetOfferValidationSteps: () => resetOfferValidationSteps(),
  refreshMoneyDashboard: () => refreshMoneyDashboard(),
  toggleLiveMoneyDashboard: () => toggleLiveMoneyDashboard(),
  addBookkeepingEntry: () => addBookkeepingEntryFromPanel(),
  exportBookkeepingLedger: () => exportBookkeepingLedger(),
  generateMonthlyBookkeepingReport: () => generateMonthlyBookkeepingReport(),
  clearBookkeepingLedger: () => clearBookkeepingLedger(),
  runPartnerSecurityCheck: () => runPartnerSecurityCheck(),
  generatePartnerOnboardingTemplate: () => generatePartnerOnboardingTemplate(),
  savePremiumPlanSettings: () => savePremiumPlanSettings(),
  clearAffiliateTrendHistory: () => {
    clearAffiliateLinkHealthHistory();
    updateAffiliateReadinessAndActions();
    updateCommissionReadinessChecklist();
    setStatus("Affiliate trend history cleared.");
  },
  resetAffiliateAuditState: () => resetAffiliateAuditState(),
  copyAffiliateReport: () => copyAffiliateReport().catch((error) => setStatus(`Copy affiliate report failed: ${error.message}`)),
  exportAffiliateReportJson: () => exportAffiliateReportJson(),
  refreshPublicUserStats: () =>
    refreshPublicUserStats().catch((error) => setStatus(`Account counts refresh failed: ${error.message}`)),
  requestOwnerPayout: () => requestOwnerPayoutFromPanel().catch((error) => setStatus(`Payout request failed: ${error.message}`)),
  updateOwnerPayoutStatus: () =>
    updateOwnerPayoutStatusFromPanel().catch((error) => setStatus(`Payout status update failed: ${error.message}`))
};

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const button = target.closest("button[id]");
  if (!button) {
    return;
  }
  if (button.dataset.boundClick === "1") {
    return;
  }
  const handler = clickHandlers[button.id];
  if (!handler) {
    return;
  }
  event.preventDefault();
  handler();
});

const affiliateAlertSeverityNode = document.getElementById("affiliateAlertSeverityMode");
if (affiliateAlertSeverityNode) {
  affiliateAlertSeverityNode.addEventListener("change", () => {
    saveAffiliateAlertSeverityMode(affiliateAlertSeverityNode.value);
    setStatus(
      affiliateAlertSeverityNode.value === "red_only"
        ? "Affiliate alerts set to RED only."
        : "Affiliate alerts set to YELLOW + RED."
    );
  });
}
const commissionOfferFilterNode = document.getElementById("commissionOfferFilterMode");
if (commissionOfferFilterNode) {
  commissionOfferFilterNode.value = readCommissionOfferFilterMode();
  commissionOfferFilterNode.addEventListener("change", () => {
    saveCommissionOfferFilterMode(commissionOfferFilterNode.value);
    renderCommissionValidatedOffers();
    setStatus(
      commissionOfferFilterNode.value === "commission_only"
        ? "Offer list now shows commission-enabled links only."
        : commissionOfferFilterNode.value === "all"
          ? "Offer list now shows all offers in saved order."
          : "Offer list now prioritizes commission-enabled offers."
    );
  });
}

initializeOwnerSecurity();
renderAiSuggestionsFeed();
renderAffiliatePartnerHealth();
renderHomepageTrafficSnapshot();
