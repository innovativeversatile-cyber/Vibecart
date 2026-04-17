"use strict";

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
const SELLER_ONBOARDED_KEY = "vibecart-seller-onboarded-count";
const QUICK_BUY_TOKEN_KEY = "vibecart-quick-buy-token";
const QUICK_BUY_EMAIL_KEY = "vibecart-quick-buy-email";
const QUICK_BUY_PASSWORD_KEY = "vibecart-quick-buy-password";
const CINEMATIC_INTRO_KEY = "vibecart-cinematic-intro-v1";
const NIGHT_NEON_KEY = "vibecart-night-neon-mode-v1";
let pendingDisclaimerAction = null;
let pendingDisclaimerCheckbox = null;
let disclaimerWatchdogTimer = null;
const PUBLIC_USER_KEY = "vibecart-public-user-id";
const easterKeyBuffer = [];
const AFRICA_ORIGIN_CODES = new Set(["ZA", "KE", "NG", "GH", "ZW", "NA", "ET", "TZ", "UG", "RW", "BW", "ZM"]);
const EUROPE_ORIGIN_CODES = new Set(["PL", "DE", "FR", "ES", "IT", "NL", "BE", "PT", "SE", "NO", "DK", "FI", "IE", "AT", "CZ", "HU", "RO", "GR", "CH", "GB"]);
const BRIDGE_PATH_KEY = "vibecart-bridge-path";
const BUYER_DESTINATION_KEY = "vibecart-buyer-destination";
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
    bridgeShops.innerHTML = `<article class="shop"><h3>Live route shops</h3><p>No seeded listings on <strong>${getPathLabel(path)}</strong> yet. Scroll up to <a href="#shops">regional shop folders</a> for curated retailers, or add products in the database.</p></article>`;
    return;
  }
  bridgeShops.innerHTML = "";
  shops.forEach((shop) => {
    const node = document.createElement("article");
    node.className = "shop";
    node.innerHTML = `
      <h3>${shop.shopName}</h3>
      <p>Origin: ${shop.originCountry}</p>
      <p>${shop.count} live product${shop.count === 1 ? "" : "s"} on this path.</p>
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
    node.innerHTML = `
      <h3>${String(item.title || "Live Product")}</h3>
      <p class="price">${String(item.currency || "EUR")} ${Number(item.basePrice || 0).toFixed(2)}</p>
      <p>Shop: ${String(item.shopName || "Unknown Shop")} | Ships from ${String(item.originCountry || "").toUpperCase()}</p>
      <button class="btn btn-primary buy-now-btn" data-title="${String(item.title || "").replace(/"/g, "&quot;")}" data-price="${Number(item.basePrice || 0)}">Buy in 1 Click</button>
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
      `Active path: ${getPathLabel(activeBridgePath)}. ${count} live product${count === 1 ? "" : "s"} on this path (${total} loaded).${suffix}`;
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
  try {
    liveMarketplaceCache = await fetchLiveMarketplaceProducts();
  } catch {
    liveMarketplaceCache = [];
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


function initCinematicIntro() {
  const intro = document.getElementById("cinematicIntro");
  if (!intro) {
    return;
  }
  if (localStorage.getItem(CINEMATIC_INTRO_KEY) === "1") {
    intro.remove();
    return;
  }
  intro.classList.add("is-visible");
  const hide = () => {
    intro.classList.add("is-hidden");
    localStorage.setItem(CINEMATIC_INTRO_KEY, "1");
    setTimeout(() => intro.remove(), 520);
  };
  setTimeout(hide, 2100);
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

  const applyDiagonal = () => {
    const viewportMid = window.innerHeight * 0.5;
    const trackRect = track.getBoundingClientRect();
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

  window.addEventListener("scroll", applyDiagonal, { passive: true });
  track.addEventListener("scroll", applyDiagonal, { passive: true });
  applyDiagonal();

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
    const count = Math.max(14, Math.floor(width / 70));
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

  const frame = () => {
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
  if (expressCheckoutStatus) {
    expressCheckoutStatus.textContent = `Secret unlocked: ${phrase}`;
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
      const title = String(btn.getAttribute("data-title") || "Selected item");
      if (expressCheckoutStatus) {
        expressCheckoutStatus.textContent = "Creating live order and loading tracking...";
      }
      runLiveOneClickCheckout(title).catch((error) => {
        if (expressCheckoutStatus) {
          expressCheckoutStatus.textContent = `Checkout failed: ${String(error.message || error)}`;
        }
      });
    });
  });
}

async function ensureQuickBuyerToken() {
  const cached = String(localStorage.getItem(QUICK_BUY_TOKEN_KEY) || "");
  if (cached) {
    return cached;
  }
  const email = String(localStorage.getItem(QUICK_BUY_EMAIL_KEY) || "");
  const password = String(localStorage.getItem(QUICK_BUY_PASSWORD_KEY) || "");
  if (email && password) {
    const loginResponse = await fetch("/api/public/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "buyer" })
    });
    const loginBody = await loginResponse.json();
    if (loginResponse.ok && loginBody.ok && loginBody.token) {
      localStorage.setItem(QUICK_BUY_TOKEN_KEY, String(loginBody.token));
      return String(loginBody.token);
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
  localStorage.setItem(QUICK_BUY_EMAIL_KEY, generatedEmail);
  localStorage.setItem(QUICK_BUY_PASSWORD_KEY, generatedPassword);
  localStorage.setItem(QUICK_BUY_TOKEN_KEY, String(registerBody.token));
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

function initLuxuryMotion() {
  document.body.classList.add("luxe-ready");
  const nodes = document.querySelectorAll(
    ".hero, .section, .home-cta-strip, .bento-card, .product, .shop, .settings-card"
  );
  nodes.forEach((node, index) => {
    if (index < 3) {
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
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );
  nodes.forEach((node) => observer.observe(node));
}

function initBrandSignatureMotion() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  const links = Array.from(nav.querySelectorAll("a[data-quick-target]"));
  const sections = links
    .map((link) => document.getElementById(String(link.getAttribute("data-quick-target") || "")))
    .filter(Boolean);

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = String(link.getAttribute("data-quick-target") || "");
      const target = document.getElementById(targetId);
      if (target) {
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
initLuxuryMotion();
initBrandSignatureMotion();
initMobileQuickNav();
wireOneClickBuy();
initializeBridgePaths().catch(() => {});
initCinematicIntro();
initVibeFlowMotion();
initHeroCanvasFx();

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

loadTrustCards();
loadRewardProfile();
wireMarketActionButtons();
localStorage.setItem(ONBOARDING_KEY, "1");
