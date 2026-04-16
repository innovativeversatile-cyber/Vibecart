"use strict";

const http = require("http");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");
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
  recordAffiliateReferral,
  getOwnerRevenueDashboard,
  requestOwnerPayout,
  updateOwnerPayoutStatus
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
const {
  runFraudPrecheck,
  evaluateTrustSafety,
  getDiscoveryRecommendations,
  getTechnicalRiskRecommendations,
  getOwnerRiskDashboard
} = require("./risk-intelligence-service");
const {
  acceptBarterTerms,
  upsertBarterProfile,
  createBarterOffer,
  buildBarterMatches,
  listPublicBarterMatches,
  reportBarterBypassAttempt,
  listOwnerBarterMatchReviews,
  decideBarterMatch,
  suspendBarterAccount
} = require("./barter-intelligence-service");
const {
  createCrowdfundingCampaign,
  listCrowdfundingCampaigns,
  ownerDecideCrowdfunding,
  recordCrowdfundingPledge,
  runCulturalArbitrageScout,
  listAiOperationsQueue,
  createAiOperation,
  decideAiOperation,
  generateAiOpsRecommendations
} = require("./ai-operations-service");

const PORT = Number(process.env.PORT || 8081);
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "vibecart";
const CRON_SECRET = String(process.env.CRON_SECRET || "");
const NOTIFICATION_EMAIL = String(process.env.NOTIFICATION_EMAIL || "1vibe.cart@gmail.com").trim().toLowerCase();
const EMAIL_NOTIFICATIONS_ENABLED = String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "false").trim().toLowerCase() === "true";
const SMTP_HOST = String(process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").trim().toLowerCase() === "true";
const SMTP_USER = String(process.env.SMTP_USER || "").trim();
const SMTP_PASS = String(process.env.SMTP_PASS || "").trim();
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || "1vibe.cart@gmail.com").trim();

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
let notificationTransporter = null;

function getNotificationTransporter() {
  if (!EMAIL_NOTIFICATIONS_ENABLED || !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  if (!notificationTransporter) {
    notificationTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }
  return notificationTransporter;
}

async function sendAdminNotificationEmail(subject, lines) {
  if (!NOTIFICATION_EMAIL) {
    return;
  }
  const transporter = getNotificationTransporter();
  if (!transporter) {
    return;
  }

  const safeSubject = String(subject || "VibeCart admin notification").slice(0, 200);
  const textBody = Array.isArray(lines)
    ? lines.map((line) => String(line || "").trim()).filter(Boolean).join("\n")
    : String(lines || "").trim();
  if (!textBody) {
    return;
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: NOTIFICATION_EMAIL,
      subject: `[VibeCart] ${safeSubject}`,
      text: textBody
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Email notification send failed:", error.message || error);
  }
}

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

async function handleOwnerRevenueDashboard(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await getOwnerRevenueDashboard(pool, data.body || {});
  return sendJson(res, 200, result);
}

async function handleOwnerPayoutRequest(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await requestOwnerPayout(pool, data.body || {});
  return sendJson(res, 200, result);
}

async function handleOwnerPayoutStatusUpdate(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await updateOwnerPayoutStatus(pool, data.body || {});
  return sendJson(res, 200, result);
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

async function handlePublicPlatformRiskScoreboard(req, res) {
  const [trustRows] = await pool.execute(
    `SELECT AVG(trust_score) AS avg_trust_score FROM trust_profiles`
  );
  const avgTrust = Number(trustRows[0]?.avg_trust_score || 60);

  const [chatRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_count,
       COUNT(*) AS total_count
     FROM chat_safety_events
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const highSafety = Number(chatRows[0]?.high_count || 0);
  const totalSafety = Number(chatRows[0]?.total_count || 0);
  const highRatio = totalSafety > 0 ? highSafety / totalSafety : 0;

  const [complianceRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN result = 'blocked' THEN 1 ELSE 0 END) AS blocked_count,
       COUNT(*) AS total_count
     FROM compliance_checks
     WHERE checked_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const blockedCompliance = Number(complianceRows[0]?.blocked_count || 0);
  const totalCompliance = Number(complianceRows[0]?.total_count || 0);
  const blockedRatio = totalCompliance > 0 ? blockedCompliance / totalCompliance : 0;

  const [deliveryRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
       COUNT(*) AS total_count
     FROM shipments
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const deliveredCount = Number(deliveryRows[0]?.delivered_count || 0);
  const failedCount = Number(deliveryRows[0]?.failed_count || 0);
  const totalDelivery = Number(deliveryRows[0]?.total_count || 0);
  const deliveryReliability = totalDelivery > 0 ? deliveredCount / totalDelivery : 0.6;

  const [disputeRows] = await pool.execute(
    `SELECT COUNT(*) AS dispute_count
     FROM return_requests
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const disputeCount = Number(disputeRows[0]?.dispute_count || 0);

  const [sellerRows] = await pool.execute(
    `SELECT COUNT(*) AS active_sellers
     FROM shops
     WHERE active = 1`
  );
  const activeSellers = Number(sellerRows[0]?.active_sellers || 0);

  const [productRows] = await pool.execute(
    `SELECT COUNT(*) AS active_products
     FROM products
     WHERE status = 'active'`
  );
  const activeProducts = Number(productRows[0]?.active_products || 0);

  const [buyerRows] = await pool.execute(
    `SELECT COUNT(DISTINCT buyer_user_id) AS active_buyers_30d
     FROM orders
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const activeBuyers30d = Number(buyerRows[0]?.active_buyers_30d || 0);

  const [riskEventRows] = await pool.execute(
    `SELECT risk_focus, COALESCE(SUM(score_delta), 0) AS total_delta
     FROM platform_risk_events
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)
     GROUP BY risk_focus`
  );
  const riskDeltaMap = Object.create(null);
  riskEventRows.forEach((row) => {
    riskDeltaMap[String(row.risk_focus)] = Number(row.total_delta || 0);
  });

  const liquidityBase = activeSellers > 0
    ? Math.min(100, Math.round((activeBuyers30d / Math.max(activeSellers, 1)) * 30 + Math.min(activeProducts, 400) / 8))
    : 45;
  const trustBase = Math.round((avgTrust * 0.7) + ((1 - highRatio) * 30));
  const badDebtBase = Math.round((1 - highRatio) * 55 + deliveryReliability * 30 + (1 - blockedRatio) * 15);
  const complianceBase = Math.round((1 - blockedRatio) * 85 + 10);
  const scalingBase = Math.round(Math.max(45, Math.min(95, 55 + Math.log10(Math.max(totalDelivery + totalSafety + totalCompliance, 1)) * 20)));
  const cacBase = Math.round(Math.max(40, Math.min(90, 50 + Math.min(activeBuyers30d, 500) / 10 - Math.min(disputeCount, 80) / 4)));
  const logisticsBase = Math.round(deliveryReliability * 80 + Math.max(0, 20 - Math.min(disputeCount, 40) / 2));

  const scoreboard = {
    liquidity: Math.max(0, Math.min(100, liquidityBase + (riskDeltaMap.liquidity || 0))),
    trust: Math.max(0, Math.min(100, trustBase + (riskDeltaMap.trust || 0))),
    bad_debt: Math.max(0, Math.min(100, badDebtBase + (riskDeltaMap.bad_debt || 0))),
    compliance: Math.max(0, Math.min(100, complianceBase + (riskDeltaMap.compliance || 0))),
    scaling: Math.max(0, Math.min(100, scalingBase + (riskDeltaMap.scaling || 0))),
    cac: Math.max(0, Math.min(100, cacBase + (riskDeltaMap.cac || 0))),
    logistics: Math.max(0, Math.min(100, logisticsBase + (riskDeltaMap.logistics || 0)))
  };

  return sendJson(res, 200, {
    ok: true,
    scoreboard,
    signals: {
      activeSellers,
      activeProducts,
      activeBuyers30d,
      highSafetyEvents30d: highSafety,
      disputeCount30d: disputeCount,
      deliveryReliability: Number((deliveryReliability * 100).toFixed(2))
    }
  });
}

async function handlePublicPlatformRiskPlan(req, res) {
  const body = await readJson(req);
  const allowed = new Set(["liquidity", "trust", "bad_debt", "compliance", "scaling", "cac", "logistics"]);
  const riskFocus = String(body.riskFocus || "").trim().toLowerCase();
  const riskSignal = String(body.riskSignal || "").trim().slice(0, 255);
  const planHeadline = String(body.planHeadline || "").trim().slice(0, 255);
  const scoreDelta = Number(body.scoreDelta || 0);

  if (!allowed.has(riskFocus)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_RISK_FOCUS" });
  }
  if (!planHeadline) {
    return sendJson(res, 400, { ok: false, code: "PLAN_HEADLINE_REQUIRED" });
  }
  if (!Number.isFinite(scoreDelta) || Math.abs(scoreDelta) > 20) {
    return sendJson(res, 400, { ok: false, code: "INVALID_SCORE_DELTA" });
  }

  await pool.execute(
    `INSERT INTO platform_risk_events (
      risk_focus, risk_signal, plan_headline, score_delta
    ) VALUES (?, ?, ?, ?)`,
    [riskFocus, riskSignal || null, planHeadline, Math.round(scoreDelta)]
  );
  return sendJson(res, 200, { ok: true });
}

async function handlePublicFraudPrecheck(req, res) {
  const body = await readJson(req);
  const result = await runFraudPrecheck(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicTrustSafetyEvaluate(req, res) {
  const body = await readJson(req);
  const result = await evaluateTrustSafety(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicDiscoveryRecommendations(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const result = await getDiscoveryRecommendations(pool, {
    userCountry: String(urlObj.searchParams.get("userCountry") || "").trim().toUpperCase(),
    preferredCategory: String(urlObj.searchParams.get("preferredCategory") || "").trim()
  });
  return sendJson(res, 200, result);
}

async function handlePublicTechnicalRiskRecommendations(req, res) {
  const result = await getTechnicalRiskRecommendations(pool);
  return sendJson(res, 200, result);
}

async function handleOwnerRiskDashboard(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await getOwnerRiskDashboard(pool);
  return sendJson(res, 200, result);
}

async function handlePublicBarterAcceptTerms(req, res) {
  const body = await readJson(req);
  const result = await acceptBarterTerms(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicBarterProfileUpsert(req, res) {
  const body = await readJson(req);
  const result = await upsertBarterProfile(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicBarterOfferCreate(req, res) {
  const body = await readJson(req);
  const result = await createBarterOffer(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicBarterMatchBuild(req, res) {
  const body = await readJson(req);
  const result = await buildBarterMatches(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicBarterMatches(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const result = await listPublicBarterMatches(pool, {
    offerId: Number(urlObj.searchParams.get("offerId") || 0)
  });
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicBarterBypassReport(req, res) {
  const body = await readJson(req);
  const result = await reportBarterBypassAttempt(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handleOwnerBarterMatchReviews(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await listOwnerBarterMatchReviews(pool, data.body || {});
  return sendJson(res, 200, result);
}

async function handleOwnerBarterMatchDecision(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await decideBarterMatch(pool, data.body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  await sendAdminNotificationEmail("Barter match decision recorded", [
    `Match ID: ${data.body?.matchId || "n/a"}`,
    `Decision: ${data.body?.decision || "n/a"}`,
    `Owner notes: ${data.body?.ownerNotes || "none"}`,
    `Timestamp: ${new Date().toISOString()}`
  ]);
  return sendJson(res, 200, result);
}

async function handleOwnerBarterSuspendAccount(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await suspendBarterAccount(pool, data.body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicCrowdfundingCreate(req, res) {
  const body = await readJson(req);
  const result = await createCrowdfundingCampaign(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicCrowdfundingList(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const result = await listCrowdfundingCampaigns(pool, {
    status: String(urlObj.searchParams.get("status") || "").trim()
  });
  return sendJson(res, 200, result);
}

async function handlePublicCrowdfundingPledge(req, res) {
  const body = await readJson(req);
  const result = await recordCrowdfundingPledge(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicCulturalArbitrageScout(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const result = await runCulturalArbitrageScout(pool, {
    sourceCountry: String(urlObj.searchParams.get("sourceCountry") || "").trim(),
    targetCountry: String(urlObj.searchParams.get("targetCountry") || "").trim(),
    category: String(urlObj.searchParams.get("category") || "").trim()
  });
  return sendJson(res, 200, result);
}

async function handleOwnerCrowdfundingReviewList(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await listCrowdfundingCampaigns(pool, data.body || {});
  return sendJson(res, 200, result);
}

async function handleOwnerCrowdfundingDecision(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await ownerDecideCrowdfunding(pool, data.body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  await sendAdminNotificationEmail("Crowdfunding decision recorded", [
    `Campaign ID: ${data.body?.campaignId || "n/a"}`,
    `Decision: ${data.body?.decision || "n/a"}`,
    `Owner notes: ${data.body?.ownerNotes || "none"}`,
    `Timestamp: ${new Date().toISOString()}`
  ]);
  return sendJson(res, 200, result);
}

async function handleOwnerAiOperationsList(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await listAiOperationsQueue(pool);
  return sendJson(res, 200, result);
}

async function handleOwnerAiOperationsCreate(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await createAiOperation(pool, data.body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  await sendAdminNotificationEmail("AI operation queued", [
    `Operation type: ${data.body?.operationType || "n/a"}`,
    `Risk level: ${data.body?.riskLevel || "n/a"}`,
    `Execution mode: ${data.body?.executionMode || "n/a"}`,
    `Summary: ${data.body?.summaryText || "none"}`,
    `Timestamp: ${new Date().toISOString()}`
  ]);
  return sendJson(res, 200, result);
}

async function handleOwnerAiOperationsDecide(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await decideAiOperation(pool, data.body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  await sendAdminNotificationEmail("AI operation decision recorded", [
    `Operation ID: ${data.body?.operationId || "n/a"}`,
    `Decision: ${data.body?.decision || "n/a"}`,
    `Owner notes: ${data.body?.ownerNotes || "none"}`,
    `Timestamp: ${new Date().toISOString()}`
  ]);
  return sendJson(res, 200, result);
}

async function handleOwnerAiOpsRecommendations(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await generateAiOpsRecommendations(pool);
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
    if (req.method === "GET" && req.url.startsWith("/api/public/platform-risk/scoreboard")) {
      return await handlePublicPlatformRiskScoreboard(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/discovery/recommendations")) {
      return await handlePublicDiscoveryRecommendations(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/technical-risk/recommendations")) {
      return await handlePublicTechnicalRiskRecommendations(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/barter/matches")) {
      return await handlePublicBarterMatches(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/crowdfunding/campaigns")) {
      return await handlePublicCrowdfundingList(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/cultural-arbitrage/scout")) {
      return await handlePublicCulturalArbitrageScout(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/platform-risk/plan") {
      return await handlePublicPlatformRiskPlan(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/barter/terms/accept") {
      return await handlePublicBarterAcceptTerms(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/barter/profile/upsert") {
      return await handlePublicBarterProfileUpsert(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/barter/offer/create") {
      return await handlePublicBarterOfferCreate(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/barter/match/build") {
      return await handlePublicBarterMatchBuild(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/barter/bypass/report") {
      return await handlePublicBarterBypassReport(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/crowdfunding/campaign/create") {
      return await handlePublicCrowdfundingCreate(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/crowdfunding/pledge") {
      return await handlePublicCrowdfundingPledge(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/fraud/precheck") {
      return await handlePublicFraudPrecheck(req, res);
    }
    if (req.method === "POST" && req.url === "/api/public/trust-safety/evaluate") {
      return await handlePublicTrustSafetyEvaluate(req, res);
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
    if (req.method === "POST" && req.url === "/api/monetization/revenue/owner-dashboard") {
      return await handleOwnerRevenueDashboard(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/revenue/payout/request") {
      return await handleOwnerPayoutRequest(req, res);
    }
    if (req.method === "POST" && req.url === "/api/monetization/revenue/payout/status/update") {
      return await handleOwnerPayoutStatusUpdate(req, res);
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
    if (req.method === "POST" && req.url === "/api/risk/owner-dashboard") {
      return await handleOwnerRiskDashboard(req, res);
    }
    if (req.method === "POST" && req.url === "/api/barter/match/review/list") {
      return await handleOwnerBarterMatchReviews(req, res);
    }
    if (req.method === "POST" && req.url === "/api/barter/match/review/decide") {
      return await handleOwnerBarterMatchDecision(req, res);
    }
    if (req.method === "POST" && req.url === "/api/barter/account/suspend") {
      return await handleOwnerBarterSuspendAccount(req, res);
    }
    if (req.method === "POST" && req.url === "/api/crowdfunding/review/list") {
      return await handleOwnerCrowdfundingReviewList(req, res);
    }
    if (req.method === "POST" && req.url === "/api/crowdfunding/review/decide") {
      return await handleOwnerCrowdfundingDecision(req, res);
    }
    if (req.method === "POST" && req.url === "/api/ai-ops/list") {
      return await handleOwnerAiOperationsList(req, res);
    }
    if (req.method === "POST" && req.url === "/api/ai-ops/create") {
      return await handleOwnerAiOperationsCreate(req, res);
    }
    if (req.method === "POST" && req.url === "/api/ai-ops/decide") {
      return await handleOwnerAiOperationsDecide(req, res);
    }
    if (req.method === "POST" && req.url === "/api/ai-ops/recommendations") {
      return await handleOwnerAiOpsRecommendations(req, res);
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
