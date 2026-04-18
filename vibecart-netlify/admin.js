"use strict";

const STORAGE_KEY = "vibecart-site-settings";
const AUTH_SESSION_KEY = "vibecart-owner-api-session";
const AI_LINK_KEY = "vibecart-ai-link";
const AI_SUGGESTIONS_KEY = "vibecart-ai-suggestions-feed";
const REVENUE_SETTINGS_KEY = "vibecart-revenue-settings";
const API_BASE_KEY = "vibecart-api-base-url";
const MESSAGE_CENTER_KEY = "vibecart-admin-message-center-v1";
const MESSAGE_CENTER_READ_AT_KEY = "vibecart-admin-message-read-at-v1";
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
}

async function refreshOwnerRevenueDashboard() {
  const reservePercent = Number(document.getElementById("ownerReservePercent")?.value || "10");
  const payload = await authedPost("/api/monetization/revenue/owner-dashboard", { reservePercent });
  renderOwnerRevenueDashboard(payload);
  setStatus("Owner revenue dashboard refreshed. Seller tax remains seller liability.");
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
    `General fitness: ${s.generalFitness || 0} | Active medication plans: ${s.activeMedicationSchedules || 0} | ` +
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
  if (!value) {
    setStatus("Add your AI workspace link first.");
    return;
  }
  localStorage.setItem(AI_LINK_KEY, value);
  window.open(value, "_blank", "noopener,noreferrer");
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
    row.innerHTML = `<strong>${item.status.toUpperCase()}</strong> - ${item.text}`;
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
  setStatus("Pending suggestions moved to demo run (in progress).");
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
  if (isSessionValid()) {
    showPanelUnlocked("Session restored.");
    refreshInsuranceJurisdictions().catch(() => {});
    refreshTrustProfiles().catch(() => {});
    refreshChatSafetyEvents().catch(() => {});
    refreshCoachMetrics().catch(() => {});
    refreshOwnerRevenueDashboard().catch(() => {});
    return;
  }
  clearSession();
}

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.dataset.boundClick = "1";
  el.addEventListener("click", handler);
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

initializeOwnerSecurity();
renderAiSuggestionsFeed();
