"use strict";

const http = require("http");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const { ownerLogin, hashSecret, sha256 } = require("./owner-auth-service");
const { registerDeviceToken, sendOrderUpdateNotifications } = require("./push-notification-service");
const {
  createServiceProvider,
  createServiceOffering,
  bulkCreateAvailabilitySlots,
  createBookingWithTaxAndPayout,
  createAdvertiserInvoice,
  settleAdvertiserInvoice
} = require("./commerce-service");
const {
  PRICE_GUARDRAILS,
  applyPricingGuardrails,
  createSubscriptionPlan,
  assignSellerSubscription,
  createBoostPackage,
  purchaseBoost,
  applyOrderMonetizationCharges,
  createLogisticsRateCard,
  createAffiliatePartner,
  recordAffiliateReferral
} = require("./monetization-service");
const {
  listPublicInsurancePlans,
  listInsuranceJurisdictions,
  upsertInsuranceJurisdiction,
  disableInsuranceJurisdiction,
  createInsuranceProvider,
  createInsurancePlan,
  subscribeUserToInsurance,
  recordInsurancePayment,
  linkExistingPolicy,
  updatePolicyLink,
  runInsuranceDailyJob,
  queueInsuranceDueReminders,
  publishWellbeingAlert,
  queueWellbeingNotifications
} = require("./insurance-service");
const {
  REWARD_RULES,
  listTrustProfiles,
  upsertTrustProfile,
  getRewardProfile,
  earnRewardPoints,
  redeemReward
} = require("./trust-rewards-service");
const {
  logChatSafetyEvent,
  upsertCoachProfile,
  addMedicationSchedule,
  logHealthCheckin,
  getCoachDashboard,
  listChatSafetyEvents,
  getCoachMetricsSummary,
  queueDailyHealthReminders
} = require("./safety-wellness-service");

const PORT = Number(process.env.PORT || 8081);
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "vibecart";
const CRON_SECRET = String(process.env.CRON_SECRET || "");

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10
});

const ipHits = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;

function setSecurityHeaders(res) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function sendJson(res, statusCode, body) {
  setSecurityHeaders(res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

function getIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

async function logDisclaimerAcceptance(req, payload) {
  const userIdRaw = Number(payload.userId || 0);
  const userId = userIdRaw > 0 ? userIdRaw : null;
  const contextType = String(payload.contextType || "general").trim().toLowerCase();
  const accepted = payload.accepted === false ? 0 : 1;
  const acceptanceText = String(payload.acceptanceText || "Risk disclaimer accepted.").slice(0, 255);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 255);
  const ip = getIp(req);
  await pool.execute(
    `INSERT INTO disclaimer_acceptance_events (
      user_id, context_type, accepted, ip_address, user_agent, acceptance_text
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, contextType, accepted, ip, userAgent, acceptanceText]
  );
  return { ok: true };
}

function isRateLimited(ip) {
  const now = Date.now();
  const item = ipHits.get(ip) || { count: 0, start: now };
  if (now - item.start > RATE_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  ipHits.set(ip, item);
  return item.count > RATE_MAX;
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function requireActiveSession(token) {
  const hash = sha256(token);
  const [rows] = await pool.execute(
    `SELECT id, owner_auth_id, expires_at, revoked_at
     FROM owner_auth_sessions
     WHERE session_token_hash = ?
     LIMIT 1`,
    [hash]
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  if (row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }
  return row;
}

async function handleLogin(req, res, ip) {
  const body = await readJson(req);
  const meta = {
    ip,
    userAgent: String(req.headers["user-agent"] || "")
  };
  const result = await ownerLogin(pool, body, meta);
  if (!result.ok) {
    return sendJson(res, 401, result);
  }
  return sendJson(res, 200, result);
}

async function handleLogout(req, res) {
  const body = await readJson(req);
  const token = String(body.token || "");
  if (!token) {
    return sendJson(res, 400, { ok: false, code: "TOKEN_REQUIRED" });
  }
  await pool.execute(
    `UPDATE owner_auth_sessions
     SET revoked_at = NOW()
     WHERE session_token_hash = ?`,
    [sha256(token)]
  );
  return sendJson(res, 200, { ok: true });
}

async function handleRotate(req, res) {
  const body = await readJson(req);
  const token = String(body.token || "");
  const nextEmail = String(body.nextEmail || "").trim().toLowerCase();
  const nextPassword = String(body.nextPassword || "").trim();
  const nextPhrase = String(body.nextSecurityPhrase || "").trim();

  if (!token || !nextEmail || !nextPassword || !nextPhrase) {
    return sendJson(res, 400, { ok: false, code: "MISSING_FIELDS" });
  }
  if (nextPassword.length < 10 || nextPhrase.length < 10 || !nextEmail.includes("@")) {
    return sendJson(res, 400, { ok: false, code: "INVALID_NEW_CREDENTIALS" });
  }

  const session = await requireActiveSession(token);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }

  const passSalt = crypto.randomBytes(16).toString("hex");
  const phraseSalt = crypto.randomBytes(16).toString("hex");
  const passHash = `${passSalt}:${hashSecret(nextPassword, passSalt)}`;
  const phraseHash = `${phraseSalt}:${hashSecret(nextPhrase, phraseSalt)}`;

  await pool.execute(
    `UPDATE owner_auth_profiles
     SET owner_email = ?, password_hash = ?, security_phrase_hash = ?, updated_at = NOW()
     WHERE id = ?`,
    [nextEmail, passHash, phraseHash, session.owner_auth_id]
  );

  return sendJson(res, 200, { ok: true });
}

async function handlePushRegister(req, res) {
  const body = await readJson(req);
  const token = String(body.authToken || "");
  const session = await requireActiveSession(token);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const result = await registerDeviceToken(pool, body);
  return sendJson(res, 200, result);
}

async function handlePushOrderUpdate(req, res) {
  const body = await readJson(req);
  const token = String(body.authToken || "");
  const session = await requireActiveSession(token);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const result = await sendOrderUpdateNotifications(pool, body);
  return sendJson(res, 200, result);
}

async function readBodyWithSession(req, res) {
  const body = await readJson(req);
  const token = String(body.authToken || "");
  const session = await requireActiveSession(token);
  if (!session) {
    sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
    return null;
  }
  return { body, session };
}

async function handleCreateProvider(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createServiceProvider(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateService(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createServiceOffering(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateSlots(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await bulkCreateAvailabilitySlots(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateBooking(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createBookingWithTaxAndPayout(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleUpdateBookingStatus(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const bookingId = Number(data.body.bookingId || 0);
  const nextStatus = String(data.body.bookingStatus || "").trim().toLowerCase();
  const allowed = new Set(["pending", "confirmed", "completed", "cancelled", "refunded", "no_show"]);
  if (!bookingId || !allowed.has(nextStatus)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_STATUS_UPDATE" });
  }
  await pool.execute(
    `UPDATE service_bookings
     SET booking_status = ?
     WHERE id = ?`,
    [nextStatus, bookingId]
  );
  return sendJson(res, 200, { ok: true, bookingId, bookingStatus: nextStatus });
}

async function handleCreateAdInvoice(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createAdvertiserInvoice(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleSettleAdInvoice(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await settleAdvertiserInvoice(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateSubscriptionPlan(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createSubscriptionPlan(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleAssignSellerSubscription(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await assignSellerSubscription(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateBoostPackage(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createBoostPackage(pool, data.body);
  return sendJson(res, 200, result);
}

async function handlePurchaseBoost(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await purchaseBoost(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleApplyOrderCharges(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await applyOrderMonetizationCharges(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateLogisticsRate(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createLogisticsRateCard(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateAffiliatePartner(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createAffiliatePartner(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleRecordAffiliateReferral(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await recordAffiliateReferral(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleGetPricingGuardrails(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  return sendJson(res, 200, { ok: true, guardrails: PRICE_GUARDRAILS });
}

async function handleValidatePricing(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  applyPricingGuardrails(data.body);
  return sendJson(res, 200, { ok: true, message: "Pricing fits affordability guardrails." });
}

async function handleCreateInsuranceProvider(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createInsuranceProvider(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleCreateInsurancePlan(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createInsurancePlan(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleSubscribeInsurance(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await subscribeUserToInsurance(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleQueueInsuranceDueReminders(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await queueInsuranceDueReminders(pool, data.body);
  return sendJson(res, 200, result);
}

async function handlePublishWellbeingAlert(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await publishWellbeingAlert(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleQueueWellbeingNotifications(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await queueWellbeingNotifications(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleRecordInsurancePayment(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await recordInsurancePayment(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleLinkExistingPolicy(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await linkExistingPolicy(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleUpdatePolicyLink(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await updatePolicyLink(pool, data.body);
  return sendJson(res, 200, result);
}

async function handlePublicInsurancePlans(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const countryCode = String(urlObj.searchParams.get("countryCode") || "").trim().toUpperCase();
  const result = await listPublicInsurancePlans(pool, { countryCode });
  return sendJson(res, 200, result);
}

async function handleListInsuranceJurisdictions(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await listInsuranceJurisdictions(pool);
  return sendJson(res, 200, result);
}

async function handleUpsertInsuranceJurisdiction(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await upsertInsuranceJurisdiction(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleDisableInsuranceJurisdiction(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await disableInsuranceJurisdiction(pool, data.body);
  return sendJson(res, 200, result);
}

async function handleInsuranceDailyCron(req, res) {
  const cronHeader = String(req.headers["x-cron-token"] || "");
  if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
    return sendJson(res, 401, { ok: false, code: "INVALID_CRON_TOKEN" });
  }
  const body = await readJson(req);
  const result = await runInsuranceDailyJob(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicTrustProfiles(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const entityType = String(urlObj.searchParams.get("entityType") || "").trim().toLowerCase();
  const result = await listTrustProfiles(pool, { entityType });
  return sendJson(res, 200, result);
}

async function handlePublicRewardProfile(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const userId = Number(urlObj.searchParams.get("userId") || 0);
  const result = await getRewardProfile(pool, { userId });
  return sendJson(res, 200, result);
}

async function handlePublicRewardEarn(req, res) {
  const body = await readJson(req);
  const result = await earnRewardPoints(pool, body);
  return sendJson(res, 200, result);
}

async function handlePublicRewardRedeem(req, res) {
  const body = await readJson(req);
  const result = await redeemReward(pool, body);
  return sendJson(res, 200, result);
}

async function handleOwnerUpsertTrustProfile(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await upsertTrustProfile(pool, data.body);
  return sendJson(res, 200, result);
}

async function handlePublicDisclaimerAccept(req, res) {
  const body = await readJson(req);
  const result = await logDisclaimerAcceptance(req, body);
  return sendJson(res, 200, result);
}

async function handleOwnerListTrustProfiles(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await listTrustProfiles(pool, data.body || {});
  return sendJson(res, 200, result);
}

async function handlePublicChatSafetyCheck(req, res) {
  const body = await readJson(req);
  const result = await logChatSafetyEvent(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicCoachDashboard(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const userId = Number(urlObj.searchParams.get("userId") || 0);
  const result = await getCoachDashboard(pool, { userId });
  return sendJson(res, 200, result);
}

async function handlePublicCoachProfile(req, res) {
  const body = await readJson(req);
  const result = await upsertCoachProfile(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicMedicationSchedule(req, res) {
  const body = await readJson(req);
  const result = await addMedicationSchedule(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicHealthCheckin(req, res) {
  const body = await readJson(req);
  const result = await logHealthCheckin(pool, body || {});
  return sendJson(res, 200, result);
}

async function handleOwnerChatSafetyEvents(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await listChatSafetyEvents(pool, data.body || {});
  return sendJson(res, 200, result);
}

async function handleOwnerCoachMetrics(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await getCoachMetricsSummary(pool);
  return sendJson(res, 200, result);
}

async function handleHealthDailyCron(req, res) {
  const cronHeader = String(req.headers["x-cron-token"] || "");
  if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
    return sendJson(res, 401, { ok: false, code: "INVALID_CRON_TOKEN" });
  }
  const body = await readJson(req);
  const result = await queueDailyHealthReminders(pool, body || {});
  return sendJson(res, 200, result);
}

const server = http.createServer(async (req, res) => {
  try {
    const ip = getIp(req);
    if (isRateLimited(ip)) {
      return sendJson(res, 429, { ok: false, code: "RATE_LIMITED" });
    }

    if (req.method === "GET" && req.url.startsWith("/api/public/insurance/plans")) {
      return await handlePublicInsurancePlans(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/trust/profiles")) {
      return await handlePublicTrustProfiles(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/rewards/profile")) {
      return await handlePublicRewardProfile(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/coach/dashboard")) {
      return await handlePublicCoachDashboard(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/rewards/earn") {
      return await handlePublicRewardEarn(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/rewards/redeem") {
      return await handlePublicRewardRedeem(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/disclaimer/accept") {
      return await handlePublicDisclaimerAccept(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/chat/safety-check") {
      return await handlePublicChatSafetyCheck(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/coach/profile/upsert") {
      return await handlePublicCoachProfile(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/coach/medication/add") {
      return await handlePublicMedicationSchedule(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/coach/checkin/add") {
      return await handlePublicHealthCheckin(req, res);
    }
    if (req.method === "POST" && req.url === "/api/chat/safety/events/list") {
      return await handleOwnerChatSafetyEvents(req, res);
    }
    if (req.method === "POST" && req.url === "/api/coach/metrics/summary") {
      return await handleOwnerCoachMetrics(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/cron/daily-reminders") {
      return await handleInsuranceDailyCron(req, res);
    }
    if (req.method === "POST" && req.url === "/api/health/cron/daily-reminders") {
      return await handleHealthDailyCron(req, res);
    }
    if (req.method === "POST" && req.url === "/api/owner/auth/login") {
      return await handleLogin(req, res, ip);
    }
    if (req.method === "POST" && req.url === "/api/owner/auth/logout") {
      return await handleLogout(req, res);
    }
    if (req.method === "POST" && req.url === "/api/owner/auth/rotate") {
      return await handleRotate(req, res);
    }
    if (req.method === "POST" && req.url === "/api/push/register-device-token") {
      return await handlePushRegister(req, res);
    }
    if (req.method === "POST" && req.url === "/api/push/send-order-update") {
      return await handlePushOrderUpdate(req, res);
    }
    if (req.method === "POST" && req.url === "/api/bookings/provider/create") {
      return await handleCreateProvider(req, res);
    }
    if (req.method === "POST" && req.url === "/api/bookings/service/create") {
      return await handleCreateService(req, res);
    }
    if (req.method === "POST" && req.url === "/api/bookings/slots/bulk-create") {
      return await handleCreateSlots(req, res);
    }
    if (req.method === "POST" && req.url === "/api/bookings/create") {
      return await handleCreateBooking(req, res);
    }
    if (req.method === "POST" && req.url === "/api/bookings/status/update") {
      return await handleUpdateBookingStatus(req, res);
    }
    if (req.method === "POST" && req.url === "/api/ads/invoice/create") {
      return await handleCreateAdInvoice(req, res);
    }
    if (req.method === "POST" && req.url === "/api/ads/invoice/settle") {
      return await handleSettleAdInvoice(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/subscription-plan/create") {
      return await handleCreateSubscriptionPlan(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/subscription/assign") {
      return await handleAssignSellerSubscription(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/boost-package/create") {
      return await handleCreateBoostPackage(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/boost/purchase") {
      return await handlePurchaseBoost(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/order/charges/apply") {
      return await handleApplyOrderCharges(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/logistics-rate/create") {
      return await handleCreateLogisticsRate(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/affiliate-partner/create") {
      return await handleCreateAffiliatePartner(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/affiliate-referral/record") {
      return await handleRecordAffiliateReferral(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/guardrails/get") {
      return await handleGetPricingGuardrails(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/guardrails/validate") {
      return await handleValidatePricing(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/provider/create") {
      return await handleCreateInsuranceProvider(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/jurisdiction/list") {
      return await handleListInsuranceJurisdictions(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/jurisdiction/upsert") {
      return await handleUpsertInsuranceJurisdiction(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/jurisdiction/disable") {
      return await handleDisableInsuranceJurisdiction(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/plan/create") {
      return await handleCreateInsurancePlan(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/subscription/create") {
      return await handleSubscribeInsurance(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/subscription/record-payment") {
      return await handleRecordInsurancePayment(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/subscription/queue-due-reminders") {
      return await handleQueueInsuranceDueReminders(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/policy/link-existing") {
      return await handleLinkExistingPolicy(req, res);
    }
    if (req.method === "POST" && req.url === "/api/insurance/policy/update-linked") {
      return await handleUpdatePolicyLink(req, res);
    }
    if (req.method === "POST" && req.url === "/api/wellbeing/alert/publish") {
      return await handlePublishWellbeingAlert(req, res);
    }
    if (req.method === "POST" && req.url === "/api/wellbeing/alert/queue-notifications") {
      return await handleQueueWellbeingNotifications(req, res);
    }
    if (req.method === "POST" && req.url === "/api/trust/profile/upsert") {
      return await handleOwnerUpsertTrustProfile(req, res);
    }
    if (req.method === "POST" && req.url === "/api/trust/profile/list") {
      return await handleOwnerListTrustProfiles(req, res);
    }
    return sendJson(res, 404, { ok: false, code: "NOT_FOUND" });
  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("guardrail")) {
      return sendJson(res, 400, { ok: false, code: "PRICE_GUARDRAIL_BLOCKED", message: String(error.message) });
    }
    if (String(error.message || "") === "INSURANCE_JURISDICTION_BLOCKED") {
      return sendJson(res, 403, { ok: false, code: "INSURANCE_JURISDICTION_BLOCKED" });
    }
    if (String(error.message || "") === "REWARD_DAILY_LIMIT_REACHED") {
      return sendJson(res, 429, { ok: false, code: "REWARD_DAILY_LIMIT_REACHED", rules: REWARD_RULES });
    }
    if (String(error.message || "") === "REWARD_TOO_FAST") {
      return sendJson(res, 429, { ok: false, code: "REWARD_TOO_FAST", rules: REWARD_RULES });
    }
    if (String(error.message || "") === "INSUFFICIENT_REWARD_POINTS") {
      return sendJson(res, 400, { ok: false, code: "INSUFFICIENT_REWARD_POINTS", rules: REWARD_RULES });
    }
    return sendJson(res, 500, { ok: false, code: "SERVER_ERROR", message: String(error.message || error) });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Owner auth API running on http://localhost:${PORT}`);
});
