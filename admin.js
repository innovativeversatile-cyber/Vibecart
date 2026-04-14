"use strict";

const STORAGE_KEY = "vibecart-site-settings";
const AUTH_SESSION_KEY = "vibecart-owner-api-session";
const AI_LINK_KEY = "vibecart-ai-link";
const AI_SUGGESTIONS_KEY = "vibecart-ai-suggestions-feed";
const REVENUE_SETTINGS_KEY = "vibecart-revenue-settings";
const API_BASE_KEY = "vibecart-api-base-url";
const DEFAULT_API_BASE = "http://localhost:8081";

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

function normalizeApiBase(input) {
  const value = String(input || "").trim().replace(/\/+$/, "");
  return value || DEFAULT_API_BASE;
}

function getApiBase() {
  const fromStorage = localStorage.getItem(API_BASE_KEY);
  return normalizeApiBase(window.__VIBECART_API_BASE_URL__ || fromStorage || DEFAULT_API_BASE);
}

function saveApiBase(value) {
  localStorage.setItem(API_BASE_KEY, normalizeApiBase(value));
}

function setStatus(text) {
  const node = document.getElementById("statusMsg");
  if (node) {
    node.textContent = text;
  }
}

function showPanelUnlocked(message) {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("panelBox").classList.remove("hidden");
  fillForm();
  fillOwnerAuthForm();
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

function fillForm() {
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
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.code || "REQUEST_FAILED");
  }
  return payload;
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
  const payload = await authedPost("/api/coach/metrics/summary", {});
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
  setStatus("AI coach metrics refreshed.");
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

function saveSettings() {
  const payload = {
    title: document.getElementById("setTitle").value.trim() || defaults.title,
    badge: document.getElementById("setBadge").value.trim() || defaults.badge,
    headline: document.getElementById("setHeadline").value.trim() || defaults.headline,
    subtitle: document.getElementById("setSubtitle").value.trim() || defaults.subtitle,
    bridgeTitle: document.getElementById("setBridgeTitle").value.trim() || defaults.bridgeTitle,
    bridgeText: document.getElementById("setBridgeText").value.trim() || defaults.bridgeText,
    theme: document.getElementById("setTheme").value || defaults.theme
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  localStorage.setItem("vibecart-theme", payload.theme);
  setStatus("Saved. Open the website page to see updates.");
}

function resetSettings() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem("vibecart-theme", defaults.theme);
  fillForm();
  setStatus("Reset to default settings.");
}

async function unlockPanel() {
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
  const response = await fetch(`${getApiBase()}/api/owner/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: usernameInput,
      password: passInput,
      securityPhrase: phraseInput,
      mfaCode
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    setStatus(`Login failed: ${payload.code || "UNKNOWN_ERROR"}`);
    return;
  }

  saveSession({
    token: payload.token,
    expiresAt: payload.expiresAt,
    email: usernameInput
  });
  showPanelUnlocked("Panel unlocked via backend authentication.");
  refreshInsuranceJurisdictions().catch(() => setStatus("Panel unlocked. Could not load jurisdiction list yet."));
  refreshTrustProfiles().catch(() => setStatus("Panel unlocked. Could not load trust list yet."));
  refreshChatSafetyEvents().catch(() => setStatus("Panel unlocked. Could not load chat safety events yet."));
  refreshCoachMetrics().catch(() => setStatus("Panel unlocked. Could not load coach metrics yet."));
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
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    setStatus(`Update failed: ${payload.code || "UNKNOWN_ERROR"}`);
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
    return;
  }
  clearSession();
}

document.getElementById("unlockBtn").addEventListener("click", () => {
  unlockPanel().catch(() => setStatus("Authentication error."));
});
document.getElementById("saveSettings").addEventListener("click", saveSettings);
document.getElementById("resetSettings").addEventListener("click", resetSettings);
document.getElementById("updateOwnerAuth").addEventListener("click", () => {
  updateOwnerAuthFromPanel().catch(() => setStatus("Could not update owner authentication."));
});
document.getElementById("logoutOwner").addEventListener("click", () => {
  logoutOwner().catch(() => setStatus("Could not logout."));
});
document.getElementById("generateAiPrompt").addEventListener("click", generateAiPrompt);
document.getElementById("saveAiSuggestion").addEventListener("click", saveCurrentPromptToFeed);
document.getElementById("copyAiPrompt").addEventListener("click", () => {
  copyAiPrompt().catch(() => setStatus("Could not copy prompt."));
});
document.getElementById("openAiLink").addEventListener("click", openAiAssistantLink);
document.getElementById("copyAdminAppUrl").addEventListener("click", () => {
  copyAdminAppUrl().catch(() => setStatus("Could not copy admin app URL."));
});
document.getElementById("openAdminAppUrl").addEventListener("click", openAdminAppUrl);
document.getElementById("runPendingDemos").addEventListener("click", runPendingDemos);
document.getElementById("clearDoneSuggestions").addEventListener("click", clearDoneSuggestions);
document.getElementById("generateAdCreative").addEventListener("click", generateAdCreative);
document.getElementById("applyPricingPreset").addEventListener("click", applyPricingPreset);
document.getElementById("saveRevenueSettings").addEventListener("click", saveRevenueSettings);
document.getElementById("seedRevenueProducts").addEventListener("click", () => {
  seedRevenueProducts().catch((error) => setStatus(`Seed failed: ${error.message}`));
});
document.getElementById("assignPlanToShop").addEventListener("click", () => {
  assignPlanToShop().catch((error) => setStatus(`Assign failed: ${error.message}`));
});
document.getElementById("buyBoostForTarget").addEventListener("click", () => {
  buyBoostForTarget().catch((error) => setStatus(`Boost failed: ${error.message}`));
});
document.getElementById("refreshInsuranceJurisdictions").addEventListener("click", () => {
  refreshInsuranceJurisdictions().catch((error) => setStatus(`Refresh failed: ${error.message}`));
});
document.getElementById("upsertInsuranceJurisdiction").addEventListener("click", () => {
  saveInsuranceJurisdictionRule().catch((error) => setStatus(`Save failed: ${error.message}`));
});
document.getElementById("disableInsuranceJurisdiction").addEventListener("click", () => {
  disableInsuranceJurisdictionRule().catch((error) => setStatus(`Disable failed: ${error.message}`));
});
document.getElementById("downloadBackupJson").addEventListener("click", () => {
  downloadBackupSnapshot().catch((error) => setStatus(`Backup failed: ${error.message}`));
});
document.getElementById("saveTrustProfile").addEventListener("click", () => {
  saveTrustProfile().catch((error) => setStatus(`Trust save failed: ${error.message}`));
});
document.getElementById("refreshTrustProfiles").addEventListener("click", () => {
  refreshTrustProfiles().catch((error) => setStatus(`Trust refresh failed: ${error.message}`));
});
document.getElementById("refreshChatSafetyEvents").addEventListener("click", () => {
  refreshChatSafetyEvents().catch((error) => setStatus(`Chat safety refresh failed: ${error.message}`));
});
document.getElementById("refreshCoachMetrics").addEventListener("click", () => {
  refreshCoachMetrics().catch((error) => setStatus(`Coach metrics refresh failed: ${error.message}`));
});

initializeOwnerSecurity();
renderAiSuggestionsFeed();
