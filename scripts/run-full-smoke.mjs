/**
 * VibeCart public smoke suite (API + static link integrity).
 * Run: node scripts/run-full-smoke.mjs
 *
 * Env:
 *   SMOKE_API_BASE   — default: parsed from netlify.toml Railway host (https://…)
 *   SMOKE_SITE_BASE  — default: https://vibecart-marketplace.netlify.app (use when apex DNS is broken)
 *   SMOKE_MUTATIONS  — default "1". Set "0" to skip POSTs that write to the DB.
 *   SMOKE_RATE_COOLDOWN_MS — default 63000. Pause after public GET batch so a 30/min IP limit (if counting GETs) can reset before POSTs.
 *   SMOKE_POST_CHUNK_PAUSE_MS — default 63000. Pause after every 25 POSTs for the same reason on strict deploys.
 *
 * Honest limits: cannot drive the Expo app, Stripe card networks, or owner-only message center from this script.
 * Service bookings (/api/bookings/*) require authenticated sessions — not exercised here without a dedicated test harness.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const deployWeb = path.join(root, "deploy-web");
const mutations = String(process.env.SMOKE_MUTATIONS ?? "1").trim() !== "0";

function readRailwayHostFromToml() {
  const toml = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
  const m = toml.match(/to\s*=\s*"https:\/\/([^/]+)\/api\/:splat"/);
  return m ? m[1] : "vibecart-production.up.railway.app";
}

const API_BASE = String(process.env.SMOKE_API_BASE || `https://${readRailwayHostFromToml()}`).replace(/\/$/, "");
const SITE_BASE = String(process.env.SMOKE_SITE_BASE || "https://vibecart-marketplace.netlify.app").replace(/\/$/, "");

const results = { pass: 0, fail: 0, notes: [] };
const RATE_COOLDOWN_MS = Number(process.env.SMOKE_RATE_COOLDOWN_MS ?? 63000);
const POST_CHUNK_PAUSE_MS = Number(process.env.SMOKE_POST_CHUNK_PAUSE_MS ?? 63000);
let mutationPostCount = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function note(msg) {
  results.notes.push(msg);
}

function fail(label, detail) {
  results.fail += 1;
  console.error(`FAIL ${label}: ${detail}`);
}

function pass(label) {
  results.pass += 1;
  console.log(`OK   ${label}`);
}

async function req(method, url, body, extraHeaders = {}) {
  const opts = { method, headers: { Accept: "application/json", ...extraHeaders } };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: r.status, text, json };
}

function responseOk(status, json) {
  if (status < 200 || status >= 300) {
    return false;
  }
  if (json == null || typeof json !== "object") {
    return true;
  }
  if (Object.prototype.hasOwnProperty.call(json, "ok")) {
    return json.ok !== false;
  }
  return true;
}

async function getOk(label, path) {
  try {
    const { status, json } = await req("GET", `${API_BASE}${path}`);
    if (responseOk(status, json)) {
      pass(label);
      return json;
    }
    fail(label, `HTTP ${status} ${JSON.stringify(json || {}).slice(0, 200)}`);
  } catch (e) {
    fail(label, e.message || String(e));
  }
  return null;
}

async function postExpectOk(label, path, body, extraHeaders = {}) {
  if (!mutations) {
    note(`SKIP (SMOKE_MUTATIONS=0) ${label}`);
    return null;
  }
  if (mutationPostCount > 0 && mutationPostCount % 25 === 0 && POST_CHUNK_PAUSE_MS > 0) {
    note(`RATE chunk pause ${POST_CHUNK_PAUSE_MS}ms after ${mutationPostCount} POSTs`);
    await sleep(POST_CHUNK_PAUSE_MS);
  }
  mutationPostCount += 1;
  try {
    const { status, json } = await req("POST", `${API_BASE}${path}`, body, extraHeaders);
    if (responseOk(status, json)) {
      pass(label);
      return json;
    }
    fail(label, `HTTP ${status} ${JSON.stringify(json || {}).slice(0, 240)}`);
  } catch (e) {
    fail(label, e.message || String(e));
  }
  return null;
}

async function headSite(path) {
  const url = `${SITE_BASE}${path}`;
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (r.status >= 200 && r.status < 400) {
      pass(`SITE HEAD ${path}`);
    } else {
      fail(`SITE HEAD ${path}`, `HTTP ${r.status}`);
    }
  } catch (e) {
    fail(`SITE HEAD ${path}`, e.message || String(e));
  }
}

function crawlLocalHtmlLinks() {
  const htmlFiles = fs
    .readdirSync(deployWeb)
    .filter((f) => f.endsWith(".html"))
    .map((f) => path.join(deployWeb, f));
  const linkRe = /href\s*=\s*["'](\.\/[^"']+)["']/gi;
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, "utf8");
    let m;
    while ((m = linkRe.exec(content)) !== null) {
      const rel = m[1].replace(/^\.\//, "");
      const clean = rel.split("?")[0].split("#")[0];
      if (!clean || clean.startsWith("http")) {
        continue;
      }
      const target = path.join(deployWeb, clean);
      if (!fs.existsSync(target)) {
        fail(`LOCAL LINK ${path.basename(file)} → ./${clean}`, "missing file");
      } else {
        pass(`LOCAL LINK ${path.basename(file)} → ./${clean}`);
      }
    }
  }
}

console.log("VibeCart full smoke");
console.log("  API_BASE:", API_BASE);
console.log("  SITE_BASE:", SITE_BASE);
console.log("  MUTATIONS:", mutations ? "on" : "off");
console.log("");

crawlLocalHtmlLinks();

const pages = [
  "/",
  "/index.html",
  "/admin.html",
  "/policy.html",
  "/terms.html",
  "/privacy.html",
  "/shops-europe.html",
  "/shops-mama-africa.html",
  "/shops-asia.html",
  "/shops-scents.html",
  "/shops-global.html",
  "/manifest.json",
  "/icon.svg"
];
for (const p of pages) {
  await headSite(p);
}

await getOk("GET /api/health", "/api/health");
await getOk("GET /api/public/site-settings", "/api/public/site-settings");
await getOk("GET /api/public/products/live", "/api/public/products/live");
await getOk("GET /api/public/insurance/plans", "/api/public/insurance/plans");
await getOk("GET /api/public/trust/profiles", "/api/public/trust/profiles");
await getOk("GET /api/public/rewards/profile", "/api/public/rewards/profile?userId=1");
await getOk("GET /api/public/coach/dashboard?userId=1", "/api/public/coach/dashboard?userId=1");
await getOk("GET /api/public/platform-risk/scoreboard", "/api/public/platform-risk/scoreboard");
await getOk("GET /api/public/discovery/recommendations?userCountry=PL", "/api/public/discovery/recommendations?userCountry=PL");
await getOk("GET /api/public/technical-risk/recommendations", "/api/public/technical-risk/recommendations");
await getOk("GET /api/public/barter/matches?offerId=1", "/api/public/barter/matches?offerId=1");
await getOk("GET /api/public/crowdfunding/campaigns", "/api/public/crowdfunding/campaigns");
await getOk("GET /api/public/cultural-arbitrage/scout", "/api/public/cultural-arbitrage/scout");
await getOk("GET /api/public/payments/config", "/api/public/payments/config");

if (mutations && RATE_COOLDOWN_MS > 0) {
  note(`RATE cooldown ${RATE_COOLDOWN_MS}ms after GET batch before mutations`);
  await sleep(RATE_COOLDOWN_MS);
}

const chatSamples = [
  "Thanks, I'll pick up on campus tomorrow.",
  "Please wire transfer the full amount today to my cousin account.",
  "Can you send otp codes to my phone for verification?",
  "This is a fake listing — item does not exist but pay first.",
  "Warehouse clearance unlimited stock, crypto only."
];
for (let i = 0; i < chatSamples.length; i++) {
  await postExpectOk(`POST chat/safety #${i + 1}`, "/api/public/chat/safety-check", {
    messageText: chatSamples[i]
  });
}

const fraudBodies = [
  { orderAmount: 50, buyerCountry: "PL", sellerCountry: "PL", paymentMethod: "card", isNewSeller: false },
  { orderAmount: 900, buyerCountry: "US", sellerCountry: "NG", paymentMethod: "card", isNewSeller: true },
  { orderAmount: 1200, buyerCountry: "DE", sellerCountry: "KE", paymentMethod: "manual_wire", isNewSeller: true },
  { orderAmount: 10, buyerCountry: "FR", sellerCountry: "FR", paymentMethod: "card", isNewSeller: false },
  { orderAmount: 600, buyerCountry: "GB", sellerCountry: "ZA", paymentMethod: "card", isNewSeller: false }
];
for (let i = 0; i < fraudBodies.length; i++) {
  await postExpectOk(`POST fraud/precheck #${i + 1}`, "/api/public/fraud/precheck", fraudBodies[i]);
}

for (let i = 0; i < 5; i++) {
  await postExpectOk(`POST trust-safety/evaluate #${i + 1}`, "/api/public/trust-safety/evaluate", {
    entityType: "seller",
    entityId: i + 1
  });
}

const focuses = ["liquidity", "trust", "bad_debt", "compliance", "scaling"];
for (let i = 0; i < focuses.length; i++) {
  await postExpectOk(`POST platform-risk/plan #${i + 1}`, "/api/public/platform-risk/plan", {
    riskFocus: focuses[i],
    riskSignal: `smoke signal ${i + 1}`,
    planHeadline: `Smoke mitigation headline ${i + 1}`,
    scoreDelta: i % 2 === 0 ? 3 : -2
  });
}

/** Real DB users + ENUMs from schema.sql (ai_coach_profiles.coach_focus, health_checkin_events.checkin_type). */
const smokeSessions = [];
if (mutations) {
  const cohortTs = Date.now();
  const signupPassword = "SmokeTest!9";
  const healthCohort = [
    { tag: "fit-a", coachFocus: "general_fitness", baselineWeightKg: 72, targetWeightKg: 70, goalNotes: "Fit cohort A" },
    { tag: "fit-b", coachFocus: "general_fitness", baselineWeightKg: 68, targetWeightKg: 66, goalNotes: "Fit cohort B" },
    { tag: "obese-a", coachFocus: "weight_loss", baselineWeightKg: 118, targetWeightKg: 92, goalNotes: "Weight-loss cohort A" },
    { tag: "obese-b", coachFocus: "weight_loss", baselineWeightKg: 132, targetWeightKg: 100, goalNotes: "Weight-loss cohort B" },
    { tag: "obese-c", coachFocus: "weight_loss", baselineWeightKg: 125, targetWeightKg: 95, goalNotes: "Weight-loss cohort C" }
  ];
  for (const h of healthCohort) {
    const email = `smoke.coach.${cohortTs}.${h.tag}@example.com`;
    const reg = await req("POST", `${API_BASE}/api/public/auth/register`, {
      email,
      password: signupPassword,
      role: "buyer",
      fullName: `Smoke ${h.tag}`,
      countryCode: "PL"
    });
    if (reg.status === 200 && reg.json?.ok && reg.json.token && reg.json.user?.id) {
      pass(`POST auth/register (${h.tag})`);
      const userId = Number(reg.json.user.id);
      smokeSessions.push({ token: reg.json.token, userId });
      await postExpectOk(`POST coach/profile ${h.tag}`, "/api/public/coach/profile/upsert", {
        userId,
        coachFocus: h.coachFocus,
        baselineWeightKg: h.baselineWeightKg,
        targetWeightKg: h.targetWeightKg,
        goalNotes: h.goalNotes,
        dailyActivityGoal: "45 minutes brisk walking",
        medicationTrackingEnabled: false,
        healthRiskNotes: "Smoke test synthetic cohort"
      });
    } else {
      fail(`POST auth/register (${h.tag})`, `HTTP ${reg.status} ${JSON.stringify(reg.json || {}).slice(0, 200)}`);
      break;
    }
  }
}

const checkinTypes = ["weight", "activity", "symptom", "medication_taken", "wellbeing"];
if (mutations && smokeSessions.length > 0) {
  for (let i = 0; i < 15; i++) {
    const sess = smokeSessions[i % smokeSessions.length];
    const d = new Date();
    d.setDate(d.getDate() + i - 7);
    const iso = d.toISOString().slice(0, 10);
    await postExpectOk(`POST coach/checkin #${i + 1}`, "/api/public/coach/checkin/add", {
      userId: sess.userId,
      checkinType: checkinTypes[i % checkinTypes.length],
      metricValue: String(70 + (i % 5)),
      notes: `Smoke booking-style cadence ${iso} slot ${(i % 5) + 9}:00`
    });
  }
}

if (mutations && smokeSessions.length > 0) {
  const checkoutToken = smokeSessions[0].token;
  const products = await req("GET", `${API_BASE}/api/public/products/live`);
  const list = products.json?.products || products.json?.items || [];
  const first = Array.isArray(list) ? list[0] : null;
  const pid = first ? Number(first.id || first.productId || 0) : 0;
  if (pid) {
    let ordersOk = 0;
    for (let o = 0; o < 5; o++) {
      const oc = await req(
        "POST",
        `${API_BASE}/api/public/orders/create`,
        {
          productId: pid,
          quantity: 1,
          buyerCountry: "PL",
          shippingMethod: "express"
        },
        { Authorization: `Bearer ${checkoutToken}` }
      );
      if (oc.status === 200 && oc.json?.ok) {
        ordersOk += 1;
        pass(`POST orders/create checkout #${o + 1}`);
      } else {
        fail(`POST orders/create checkout #${o + 1}`, `HTTP ${oc.status} ${JSON.stringify(oc.json || {}).slice(0, 200)}`);
        break;
      }
    }
    if (ordersOk === 5) {
      note("Five sequential checkouts completed for one buyer + one product (stock permitting).");
    }
  } else {
    note("SKIP checkout chain: no product id from /api/public/products/live");
  }
} else if (mutations) {
  note("SKIP coach check-ins and checkout: health cohort registration did not complete.");
}

console.log("");
console.log("--- Summary ---");
console.log(`PASS: ${results.pass}  FAIL: ${results.fail}`);
results.notes.forEach((n) => console.log(`NOTE: ${n}`));
console.log("");
console.log(
  "Not covered by this script: Expo WebView UI, Stripe card capture, webhook delivery, /api/bookings/* (requires provider session), admin message center (owner session), push notifications on a device."
);
console.log("If vibe-cart.com times out, keep using SMOKE_SITE_BASE=https://vibecart-marketplace.netlify.app until apex DNS is fixed.");

process.exit(results.fail > 0 ? 1 : 0);
