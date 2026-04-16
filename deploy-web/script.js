"use strict";

const categoryFilter = document.getElementById("categoryFilter");
const categoryCards = document.querySelectorAll("[data-filter]");
const products = document.querySelectorAll(".product");
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
const trackingTimeline = document.getElementById("trackingTimeline");
const nextTrackingStep = document.getElementById("nextTrackingStep");
const openReturnWindow = document.getElementById("openReturnWindow");
const returnWindowInfo = document.getElementById("returnWindowInfo");
const installAppBtn = document.getElementById("installAppBtn");
const interactionMode = document.getElementById("interactionMode");
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
const medicationName = document.getElementById("medicationName");
const medicationDose = document.getElementById("medicationDose");
const medicationTime = document.getElementById("medicationTime");
const addMedicationPlanBtn = document.getElementById("addMedicationPlan");
const healthCheckinType = document.getElementById("healthCheckinType");
const healthCheckinValue = document.getElementById("healthCheckinValue");
const healthCheckinNotes = document.getElementById("healthCheckinNotes");
const addHealthCheckinBtn = document.getElementById("addHealthCheckin");
const refreshCoachDashboardBtn = document.getElementById("refreshCoachDashboard");
const coachDashboard = document.getElementById("coachDashboard");
const SETTINGS_KEY = "vibecart-site-settings";
const INTERACTION_MODE_KEY = "vibecart-interaction-mode";
const REWARD_KEY = "vibecart-reward-profile";
const ONBOARDING_KEY = "vibecart-onboarding-done";
let pendingDisclaimerAction = null;
let pendingDisclaimerCheckbox = null;
let disclaimerWatchdogTimer = null;
const PUBLIC_USER_KEY = "vibecart-public-user-id";

function getPublicUserId() {
  const stored = Number(localStorage.getItem(PUBLIC_USER_KEY) || "0");
  if (stored > 0) {
    return stored;
  }
  const generated = Math.floor(Math.random() * 900000) + 100000;
  localStorage.setItem(PUBLIC_USER_KEY, String(generated));
  return generated;
}

function filterProducts(value) {
  products.forEach((item) => {
    const category = item.getAttribute("data-category");
    const show = value === "All" || category === value;
    item.style.display = show ? "block" : "none";
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", (event) => {
    filterProducts(event.target.value);
  });
}

categoryCards.forEach((card) => {
  card.addEventListener("click", () => {
    const chosen = card.getAttribute("data-filter") || "All";
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

const market = resolveMarketFromLocale();
applyOwnerSettings();
setMarketCopy(market);
applyAdaptiveTheme();
registerEngagementSignals();

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
  if (needText && (titleText.includes("phone") || needText.includes("phone")) && product.category === "Electronics") {
    score += 4;
  }
  if (needText && (needText.includes("study") || needText.includes("book")) && product.category === "Books") {
    score += 4;
  }
  if (needText && (needText.includes("game") || needText.includes("gaming")) && product.category === "Gaming") {
    score += 4;
  }
  if (product.price <= preference.budget) {
    score += 6;
  } else if (product.price <= preference.budget * 1.2) {
    score += 2;
  }

  return score;
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

  const ranked = parseProductCards()
    .map((product) => ({ ...product, score: scoreProduct(product, preference) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!ranked.length || ranked[0].score <= 0) {
    aiResult.textContent =
      "No exact match yet. Try increasing budget or selecting 'Any' category for better suggestions.";
    return;
  }

  const lines = ranked.map(
    (item, idx) =>
      `${idx + 1}. ${item.title} - EUR ${item.price} (${item.category}) | ${item.shipping}`
  );
  aiResult.textContent = `Top AI picks for you: ${lines.join(" || ")}`;
}

if (aiSuggest) {
  aiSuggest.addEventListener("click", getAISuggestions);
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
      <h3>${ad.brand}</h3>
      <p><strong>${ad.title}</strong></p>
      <p>${ad.body}</p>
      <button class="btn btn-primary">${ad.cta}</button>
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
  bookingSlotsResult.textContent = `${service} slots on ${date}: ${sampleSlots.join(", ")}. Bookings auto-confirm and notify provider + client.`;
}

if (showBookingSlots) {
  showBookingSlots.addEventListener("click", renderBookingSlots);
}

const demoInsurancePlans = [
  {
    provider: "CampusLife Assurance",
    plan: "Student Life Basic",
    type: "Life Cover",
    price: "EUR 4.99 / month",
    benefits: "Starter life protection and emergency support guidance."
  },
  {
    provider: "WellNest Health Cover",
    plan: "Student Health Shield",
    type: "Health Cover",
    price: "EUR 6.99 / month",
    benefits: "Basic outpatient support and tele-health guidance."
  },
  {
    provider: "FamilyCare Secure",
    plan: "Funeral Family Plan",
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
    node.className = "shop";
    node.innerHTML = `
      <h3>${item.plan}</h3>
      <p><strong>${item.provider}</strong> - ${item.type}</p>
      <p class="price">${item.price}</p>
      <p>${item.benefits}</p>
      <button class="btn btn-primary insurance-action-btn">Request Plan Details</button>
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
    const payload = await response.json();
    if (!response.ok || !payload.ok || !Array.isArray(payload.plans) || payload.plans.length === 0) {
      renderInsurancePlans();
      return;
    }
    insurancePlans.innerHTML = "";
    payload.plans.slice(0, 6).forEach((plan) => {
      const node = document.createElement("article");
      node.className = "shop";
      node.innerHTML = `
        <h3>${plan.plan_name}</h3>
        <p><strong>${plan.provider_name}</strong> - ${plan.plan_type}</p>
        <p class="price">${plan.currency} ${Number(plan.monthly_premium).toFixed(2)} / month</p>
        <p>${plan.summary_text || "Verified insurance plan for students and families."}</p>
        <button class="btn btn-primary insurance-action-btn">Request Plan Details</button>
      `;
      insurancePlans.appendChild(node);
    });
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
        wellbeingTips.textContent = "Insurance disclaimer accepted. You can continue to policy detail/subscription flow.";
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
    medicationTrackingEnabled: true
  };
  const response = await fetch("/api/public/coach/profile/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  coachDashboard.textContent = result.ok
    ? "AI Coach profile saved. You can now add medication and daily check-ins."
    : "Could not save coach profile right now.";
}

async function addMedicationPlan() {
  if (!coachDashboard || !medicationName || !medicationDose || !medicationTime) {
    return;
  }
  const payload = {
    userId: getPublicUserId(),
    medicationName: medicationName.value.trim(),
    dosageText: medicationDose.value.trim(),
    scheduleTime: medicationTime.value.trim(),
    scheduleType: "daily"
  };
  if (!payload.medicationName || !payload.dosageText || !payload.scheduleTime) {
    coachDashboard.textContent = "Enter medication name, dosage, and schedule time first.";
    return;
  }
  const response = await fetch("/api/public/coach/medication/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  coachDashboard.textContent = result.ok
    ? "Medication plan added. You will see it in your coach dashboard."
    : "Could not add medication plan right now.";
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

async function refreshCoachDashboard() {
  if (!coachDashboard) {
    return;
  }
  try {
    const response = await fetch(`/api/public/coach/dashboard?userId=${encodeURIComponent(getPublicUserId())}`);
    const payload = await response.json();
    if (!payload || !payload.ok) {
      coachDashboard.textContent = "Coach dashboard is not available right now.";
      return;
    }
    const profile = payload.profile || {};
    const meds = Array.isArray(payload.medicationSchedules) ? payload.medicationSchedules : [];
    const checkins = Array.isArray(payload.recentCheckins) ? payload.recentCheckins : [];
    const medText = meds.length
      ? meds.map((item) => `${item.medication_name} (${item.dosage_text}) at ${item.schedule_time}`).join(" | ")
      : "No medication schedules yet.";
    const checkinText = checkins.length
      ? checkins.slice(0, 3).map((item) => `${item.checkin_type}: ${item.metric_value || "n/a"}`).join(" | ")
      : "No recent check-ins yet.";
    coachDashboard.textContent =
      `Focus: ${profile.coach_focus || "not set"} | Goal: ${profile.goal_notes || "not set"} || Medications: ${medText} || Recent check-ins: ${checkinText}`;
  } catch {
    coachDashboard.textContent = "Coach dashboard request failed. Please try again.";
  }
}

if (saveCoachProfileBtn) {
  saveCoachProfileBtn.addEventListener("click", saveCoachProfile);
}
if (addMedicationPlanBtn) {
  addMedicationPlanBtn.addEventListener("click", addMedicationPlan);
}
if (addHealthCheckinBtn) {
  addHealthCheckinBtn.addEventListener("click", addHealthCheckin);
}
if (refreshCoachDashboardBtn) {
  refreshCoachDashboardBtn.addEventListener("click", refreshCoachDashboard);
}
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
    node.className = "shop";
    node.innerHTML = `
      <h3>${item.name}</h3>
      <p><strong>${item.type}</strong> Trust Score: <span class="price">${item.score}/100</span></p>
      <p>${item.note}</p>
    `;
    trustCards.appendChild(node);
  });
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
      node.className = "shop";
      node.innerHTML = `
        <h3>${String(item.entity_type).toUpperCase()} #${item.entity_id}</h3>
        <p><strong>Trust Score:</strong> <span class="price">${Number(item.trust_score).toFixed(1)}/100</span></p>
        <p>Delivery: ${item.delivery_success_rate ?? "n/a"} | Dispute: ${item.dispute_rate ?? "n/a"} | Verify: ${item.verification_score ?? "n/a"}</p>
      `;
      trustCards.appendChild(node);
    });
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
    const payload = await response.json();
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
  "Step 1: Check Trust Lab scores before buying from new sellers or providers.",
  "Step 2: Use AI Assistant for budget-safe product picks and compare options fast.",
  "Step 3: Activate rewards by completing secure actions and on-time payments."
];
let onboardingIndex = 0;

function openOnboardingModal() {
  // Fail-safe: disable blocking onboarding modal flow.
  if (rewardStatus) {
    rewardStatus.textContent =
      "Smart Tour tips: Check Trust Lab scores, use AI Assistant for budget-safe picks, and complete secure actions for rewards.";
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

loadTrustCards();
loadRewardProfile();
wireMarketActionButtons();
localStorage.setItem(ONBOARDING_KEY, "1");
