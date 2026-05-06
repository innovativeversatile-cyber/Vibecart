"use strict";

require("dotenv").config();

const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const { resolveMysqlConfig } = require("./db-env");
const nodemailer = require("nodemailer");
const Stripe = require("stripe");
const { ownerLogin, hashSecret, sha256 } = require("./owner-auth-service");
const {
  registerMobileInstallPush,
  recordMobileAppFeedback,
  registerDeviceToken,
  registerWebPushSubscription,
  sendOrderUpdateNotifications,
  sendPushToUser
} = require("./push-notification-service");
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
  upsertWearableCoachPrefs,
  logHealthCheckin,
  getCoachDashboard,
  getCoachMonetizationState,
  startCoachSubscription,
  purchaseCoachAddon,
  recordCoachPartnerEvent,
  fulfillStripeCoachCheckoutSession,
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
  generateAiOpsRecommendations,
  queueAiOpsRecommendations,
  getAiReadinessStatus
} = require("./ai-operations-service");
const {
  runPublicGenerativeAgent,
  runOwnerGenerativeAgent,
  generateOwnerSecurityComplianceReviewLLM,
  generateOwnerSiteAutopilotPlanLLM,
  generateAccountActivityDigestLLM,
  isGenerativeAiConfigured
} = require("./generative-ai-service");
const { getMacroRegionFromCountry } = require("./analytics-region-map");
const {
  createStripePaymentIntent,
  persistWebhookEvent,
  processStripeWebhookEvent,
  getPaymentReadiness
} = require("./payment-service");
const { isAllowedBookingStatusTransition } = require("./booking-state-machine");
const { ensureBakeryBookingStripeColumns } = require("./bakery-booking-payments");
const {
  attachBakeryBookingChatWss,
  broadcastBookingChatRefresh,
  attachBakeryProviderDeskWss,
  broadcastProviderDesk
} = require("./bakery-realtime");

const PORT = Number(process.env.PORT || 8081);
const _db = resolveMysqlConfig();
const DB_HOST = _db.host;
const DB_PORT = _db.port;
const DB_USER = _db.user;
const DB_PASSWORD = _db.password;
const DB_NAME = _db.database;
const CRON_SECRET = String(process.env.CRON_SECRET || "");
/** userId -> last ms for POST /api/public/account/ai-digest */
const publicAccountDigestRate = new Map();
/** userId -> last ms for POST /api/public/account/coach-workspace/encourage-push */
const coachWorkspaceEncouragePushRate = new Map();
const ANALYTICS_VISITOR_SALT = String(process.env.ANALYTICS_VISITOR_SALT || CRON_SECRET || "vibecart-analytics-salt-dev").trim();
const NOTIFICATION_EMAIL = String(process.env.NOTIFICATION_EMAIL || "").trim().toLowerCase();
const EMAIL_NOTIFICATIONS_ENABLED = String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "false").trim().toLowerCase() === "true";
const _userTxEnv = String(process.env.USER_TRANSACTIONAL_EMAIL_ENABLED || "").trim().toLowerCase();
/** Set true to allow SMTP for buyer/provider mail even when EMAIL_NOTIFICATIONS_ENABLED is false. */
const USER_TRANSACTIONAL_EMAIL_FORCE_ON = ["true", "1", "yes", "on"].includes(_userTxEnv);
/** Explicitly turns off buyer/provider transactional email only. */
const USER_TRANSACTIONAL_EMAIL_FORCE_OFF = ["false", "0", "no", "off"].includes(_userTxEnv);
const SMTP_HOST = String(process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").trim().toLowerCase() === "true";
const SMTP_USER = String(process.env.SMTP_USER || "").trim();
const SMTP_PASS = String(process.env.SMTP_PASS || "").trim();
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || NOTIFICATION_EMAIL || "noreply@localhost").trim();
const BRAND_LOGO_EMAIL_ENABLED =
  String(process.env.BRAND_LOGO_EMAIL_ENABLED || "false").trim().toLowerCase() === "true";
const PAYMENT_PROVIDER = String(process.env.PAYMENT_PROVIDER || "stripe").trim().toLowerCase();
const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || "").trim();
const STRIPE_PUBLISHABLE_KEY = String(process.env.STRIPE_PUBLISHABLE_KEY || "").trim();
const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
const PAYMENT_INTENT_API_SECRET = String(process.env.PAYMENT_INTENT_API_SECRET || "").trim();
const AFFILIATE_POSTBACK_TOKEN = String(process.env.AFFILIATE_POSTBACK_TOKEN || "").trim();
const PAYPAL_CLIENT_ID = String(process.env.PAYPAL_CLIENT_ID || "").trim();
const PAYPAL_CLIENT_SECRET = String(process.env.PAYPAL_CLIENT_SECRET || "").trim();
const PAYPAL_API_BASE = String(process.env.PAYPAL_API_BASE || "https://api-m.paypal.com").trim().replace(/\/$/, "");
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
/** Bump when shipping payment/coach fixes so `/api/health` proves Railway picked up the deploy. */
const PUBLIC_API_BUILD_TAG = "20260206-coach-v2";
/** When unset: ON. Set AI_AUTOPILOT_ENABLED=false|0|off|no to disable. Set true|1|on|yes to force enable. */
const AI_AUTOPILOT_ENABLED = (() => {
  const raw = process.env.AI_AUTOPILOT_ENABLED;
  if (raw === undefined || String(raw).trim() === "") {
    return true;
  }
  const s = String(raw).trim().toLowerCase();
  if (s === "false" || s === "0" || s === "off" || s === "no") {
    return false;
  }
  if (s === "true" || s === "1" || s === "on" || s === "yes") {
    return true;
  }
  return false;
})();
const AI_AUTOPILOT_INTERVAL_MINUTES = Math.max(15, Number(process.env.AI_AUTOPILOT_INTERVAL_MINUTES || 120));
const AI_AUTOPILOT_DEDUPE_HOURS = Math.max(1, Number(process.env.AI_AUTOPILOT_DEDUPE_HOURS || 24));
const PROMO_SCOUT_ENABLED = false;
const PROMO_SCOUT_INTERVAL_MINUTES = Math.max(10, Number(process.env.PROMO_SCOUT_INTERVAL_MINUTES || 30));
const FIRST5_FLASH_WINDOW_MINUTES = Math.max(5, Number(process.env.FIRST5_FLASH_WINDOW_MINUTES || 15));

const _mysqlPublicRaw = process.env.MYSQL_PUBLIC_URL;
if (_mysqlPublicRaw && String(_mysqlPublicRaw).includes("${{")) {
  // eslint-disable-next-line no-console
  console.warn(
    "MYSQL_PUBLIC_URL contains ${{...}} (Railway UI syntax). Node does not expand that in .env — using discrete DB_* / MYSQL* vars instead. Expect DB errors until you paste a literal mysql:// URL or fix Railway env."
  );
}

const _dbSslRaw = String(process.env.DB_SSL || "").trim().toLowerCase();
const _useMysqlSsl =
  _dbSslRaw === "true" ||
  _dbSslRaw === "1" ||
  /\.rlwy\.net$/i.test(DB_HOST) ||
  /\.railway\.app$/i.test(DB_HOST);

if (/\.rlwy\.net$/i.test(DB_HOST)) {
  const hasRailMysqlCreds =
    Boolean(String(process.env.MYSQLUSER || "").trim()) ||
    Boolean(String(process.env.MYSQLPASSWORD || "").trim()) ||
    Boolean(String(process.env.MYSQL_ROOT_PASSWORD || "").trim()) ||
    Boolean(String(process.env.MYSQL_PUBLIC_URL || "").trim()) ||
    Boolean(String(process.env.DB_PASSWORD || "").trim());
  if (!hasRailMysqlCreds) {
    // eslint-disable-next-line no-console
    console.warn(
      "[vibecart] DB_HOST is Railway public MySQL (*.rlwy.net) but MYSQLUSER / MYSQLPASSWORD / MYSQL_ROOT_PASSWORD / MYSQL_PUBLIC_URL are unset in .env.\n" +
        "  Railway almost never accepts a random DB_PASSWORD as root. Open Railway → MySQL → Variables and copy MYSQLUSER + MYSQLPASSWORD (or MYSQL_ROOT_PASSWORD), or paste the full mysql:// URL as MYSQL_PUBLIC_URL."
    );
  }
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10,
  ...(_useMysqlSsl ? { ssl: { rejectUnauthorized: false } } : {})
});

const ipHits = new Map();
const analyticsVisitHits = new Map();
const hotPicksAiHits = new Map();
const HOT_PICKS_AI_WINDOW_MS = 60 * 60 * 1000;
const HOT_PICKS_AI_MAX = 20;
const coachWorkspaceAiHits = new Map();
const COACH_WORKSPACE_AI_WINDOW_MS = 60 * 60 * 1000;
const COACH_WORKSPACE_AI_MAX = 32;
const brandonGuideAiHits = new Map();
const BRANDON_GUIDE_AI_WINDOW_MS = 60 * 60 * 1000;
const BRANDON_GUIDE_AI_MAX = 48;
const loginHits = new Map();
const RATE_WINDOW_MS = 60 * 1000;
/** Mutating requests only (GET/HEAD/OPTIONS are not counted). */
const RATE_MAX = 60;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const PUBLIC_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** HMAC-style binding: server pepper + per-device secret from client (never store raw secret). */
const SESSION_DEVICE_PEPPER = String(
  process.env.SESSION_DEVICE_PEPPER || CRON_SECRET || "vibecart-session-device-dev"
).trim();
/** Min 5m. Default 12h: rotates bearer token to narrow replay window; client must persist new token from /auth/session. */
const SESSION_TOKEN_ROTATE_MS = Math.max(
  5 * 60 * 1000,
  Number(process.env.SESSION_TOKEN_ROTATE_MS || 12 * 60 * 60 * 1000)
);
let publicSessionDeviceColumnsEnsured = false;
let publicMagicLoginTableEnsured = false;
const magicLinkEmailHits = new Map();
const MAGIC_LINK_WINDOW_MS = 15 * 60 * 1000;
const MAGIC_LINK_MAX_PER_WINDOW = 5;
const logoEmailIpHits = new Map();
const LOGO_EMAIL_WINDOW_MS = 60 * 60 * 1000;
const LOGO_EMAIL_MAX_PER_HOUR = 10;
let notificationTransporter = null;
let logoSmtpTransporter = null;

function getNotificationTransporter() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  if (!EMAIL_NOTIFICATIONS_ENABLED && !USER_TRANSACTIONAL_EMAIL_FORCE_ON) {
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
      subject: `[ADMIN ONLY][VibeCart] ${safeSubject}`,
      text: textBody
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Email notification send failed:", error.message || error);
  }
}

/** Buyer/provider transactional mail when SMTP transporter exists and user mail is not explicitly disabled. */
async function sendUserTransactionalEmail(toEmail, subject, textBody) {
  if (USER_TRANSACTIONAL_EMAIL_FORCE_OFF) {
    return;
  }
  const to = String(toEmail || "").trim().toLowerCase();
  if (!isValidEmail(to)) {
    return;
  }
  const transporter = getNotificationTransporter();
  if (!transporter) {
    return;
  }
  const safeSubject = String(subject || "VibeCart update").slice(0, 200);
  const text = String(textBody || "").trim().slice(0, 8000);
  if (!text) {
    return;
  }
  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: `[VibeCart] ${safeSubject}`,
      text
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("User transactional email failed:", error.message || error);
  }
}

function queueUserTransactionalEmail(toEmail, subject, textBody) {
  void sendUserTransactionalEmail(toEmail, subject, textBody).catch(() => {
    /* ignore */
  });
}

async function getUserEmailById(userId) {
  const uid = Number(userId || 0);
  if (!uid) {
    return "";
  }
  const [rows] = await pool.execute(`SELECT email FROM users WHERE id = ? LIMIT 1`, [uid]);
  const row = rows[0];
  return row && row.email ? String(row.email || "").trim() : "";
}

function applyCorsHeaders(req, res) {
  if (!req || !res) {
    return;
  }
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-VibeCart-Device-Binding");
}

function setSecurityHeaders(res) {
  const req = res.req;
  applyCorsHeaders(req, res);
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), usb=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  // Allow browser admin UIs (e.g. Netlify) to call this API directly; same-origin proxy still works.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function sendJson(res, statusCode, body) {
  setSecurityHeaders(res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", [cookieValue]);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", existing.concat(cookieValue));
    return;
  }
  res.setHeader("Set-Cookie", [String(existing), cookieValue]);
}

function shouldUseSecureCookie(req) {
  try {
    const xfProto = String((req && req.headers && req.headers["x-forwarded-proto"]) || "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    if (xfProto === "https") return true;
    const host = String((req && req.headers && req.headers.host) || "").toLowerCase();
    return host && host.indexOf("localhost") !== 0 && host.indexOf("127.0.0.1") !== 0;
  } catch {
    return true;
  }
}

function setPublicAuthCookie(res, token, expiresAt) {
  const t = String(token || "").trim();
  if (!t) return;
  const exp =
    expiresAt instanceof Date && Number.isFinite(expiresAt.getTime()) ? expiresAt : new Date(Date.now() + PUBLIC_SESSION_TTL_MS);
  const secure = shouldUseSecureCookie(res && res.req);
  const cookie =
    `vibecart_public_auth=${encodeURIComponent(t)}; Path=/; Expires=${exp.toUTCString()}; SameSite=Lax; HttpOnly` +
    (secure ? "; Secure" : "");
  appendSetCookie(res, cookie);
}

function clearPublicAuthCookie(res) {
  const secure = shouldUseSecureCookie(res && res.req);
  const cookie =
    "vibecart_public_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly" +
    (secure ? "; Secure" : "");
  appendSetCookie(res, cookie);
}

function readCookieToken(req, key) {
  try {
    const raw = String((req && req.headers && req.headers.cookie) || "");
    if (!raw) return "";
    const parts = raw.split(";");
    for (const p of parts) {
      const seg = String(p || "").trim();
      const eq = seg.indexOf("=");
      if (eq <= 0) continue;
      const k = seg.slice(0, eq).trim();
      if (k !== key) continue;
      return decodeURIComponent(seg.slice(eq + 1).trim());
    }
    return "";
  } catch {
    return "";
  }
}

function getIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

/** Node `req.url` includes `?query` — route matching must use the pathname only. */
function requestPathname(rawUrl) {
  return String(rawUrl || "").split("?")[0].split("#")[0];
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

function isRateLimited(ip, method) {
  const m = String(method || "GET").toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") {
    return false;
  }
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

function isHotPicksAiRateLimited(ip) {
  const key = String(ip || "unknown").slice(0, 80);
  const now = Date.now();
  const item = hotPicksAiHits.get(key) || { count: 0, start: now };
  if (now - item.start > HOT_PICKS_AI_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  hotPicksAiHits.set(key, item);
  return item.count > HOT_PICKS_AI_MAX;
}

function isCoachWorkspaceAiRateLimited(ip) {
  const key = String(ip || "unknown").slice(0, 80);
  const now = Date.now();
  const item = coachWorkspaceAiHits.get(key) || { count: 0, start: now };
  if (now - item.start > COACH_WORKSPACE_AI_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  coachWorkspaceAiHits.set(key, item);
  return item.count > COACH_WORKSPACE_AI_MAX;
}

function isBrandonGuideAiRateLimited(ip) {
  const key = String(ip || "unknown").slice(0, 80);
  const now = Date.now();
  const item = brandonGuideAiHits.get(key) || { count: 0, start: now };
  if (now - item.start > BRANDON_GUIDE_AI_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  brandonGuideAiHits.set(key, item);
  return item.count > BRANDON_GUIDE_AI_MAX;
}

function loginRateKey(ip, email) {
  return `${String(ip || "unknown").slice(0, 80)}::${String(email || "").toLowerCase().slice(0, 120)}`;
}

function isLoginLimited(ip, email) {
  const key = loginRateKey(ip, email);
  const now = Date.now();
  const item = loginHits.get(key) || { count: 0, start: now };
  if (now - item.start > LOGIN_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  loginHits.set(key, item);
  return item.count > LOGIN_MAX_ATTEMPTS;
}

function clearLoginLimit(ip, email) {
  loginHits.delete(loginRateKey(ip, email));
}

function magicLinkEmailKey(ip, email) {
  return `${String(ip || "").trim()}|${String(email || "").trim().toLowerCase()}`;
}

function isMagicLinkEmailLimited(ip, email) {
  const now = Date.now();
  const key = magicLinkEmailKey(ip, email);
  const item = magicLinkEmailHits.get(key) || { count: 0, start: now };
  if (now - item.start > MAGIC_LINK_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  magicLinkEmailHits.set(key, item);
  return item.count > MAGIC_LINK_MAX_PER_WINDOW;
}

async function ensurePublicMagicLoginTokensTable() {
  if (publicMagicLoginTableEnsured) {
    return;
  }
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS public_magic_login_tokens (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_public_magic_token (token_hash),
      KEY idx_public_magic_exp (expires_at),
      KEY idx_public_magic_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  publicMagicLoginTableEnsured = true;
}

function isValidEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (e.length < 5 || e.length > 120) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function hashPublicPassword(password, saltHex) {
  const salt = Buffer.from(saltHex, "hex");
  const out = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256");
  return out.toString("hex");
}

function verifyPublicPassword(password, storedHash) {
  const [saltHex, digestHex] = String(storedHash || "").split(":");
  if (!saltHex || !digestHex) {
    return false;
  }
  return hashPublicPassword(password, saltHex) === digestHex;
}

function normalizeDeviceBindingSecret(raw) {
  const s = String(raw || "").trim();
  if (s.length < 16 || s.length > 256) {
    return "";
  }
  return s;
}

function hashDeviceBindingSecret(secret) {
  const norm = normalizeDeviceBindingSecret(secret);
  if (!norm) {
    return "";
  }
  return sha256(`${SESSION_DEVICE_PEPPER}|${norm}`);
}

function getDeviceBindingFromRequest(req) {
  if (!req || !req.headers) {
    return "";
  }
  const h = req.headers["x-vibecart-device-binding"] || req.headers["X-VibeCart-Device-Binding"];
  return normalizeDeviceBindingSecret(h);
}

function deviceBindingMatchesStored(storedHashHex, presentedSecret) {
  if (!storedHashHex || !presentedSecret) {
    return false;
  }
  const want = hashDeviceBindingSecret(presentedSecret);
  if (!want || want.length !== String(storedHashHex).length) {
    return false;
  }
  try {
    const a = Buffer.from(String(storedHashHex), "hex");
    const b = Buffer.from(want, "hex");
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function ensurePublicSessionDeviceColumns() {
  if (publicSessionDeviceColumnsEnsured) {
    return;
  }
  const alters = [
    "ALTER TABLE user_auth_sessions ADD COLUMN device_binding_hash VARCHAR(64) NULL",
    "ALTER TABLE user_auth_sessions ADD COLUMN last_token_rotated_at DATETIME NULL"
  ];
  for (const sql of alters) {
    try {
      await pool.execute(sql);
    } catch (err) {
      const msg = String((err && err.message) || err);
      if (!/Duplicate column name/i.test(msg)) {
        throw err;
      }
    }
  }
  publicSessionDeviceColumnsEnsured = true;
}

async function createPublicSession(userId, ipAddress, userAgent, deviceBindingSecret) {
  await ensurePublicSessionDeviceColumns();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + PUBLIC_SESSION_TTL_MS);
  const bindNorm = normalizeDeviceBindingSecret(deviceBindingSecret);
  const deviceHash = bindNorm ? hashDeviceBindingSecret(bindNorm) : null;
  await pool.execute(
    `INSERT INTO user_auth_sessions (user_id, session_token_hash, device_binding_hash, ip_address, user_agent, expires_at, last_token_rotated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, tokenHash, deviceHash, ipAddress || null, userAgent || null, expiresAt]
  );
  return { token, expiresAt };
}

async function requirePublicSession(token, req, opts) {
  await ensurePublicSessionDeviceColumns();
  const tokenHash = sha256(token);
  const [rows] = await pool.execute(
    `SELECT s.id, s.user_id, s.expires_at, s.revoked_at, s.device_binding_hash, s.last_token_rotated_at,
            u.email, u.full_name, u.role, u.country_code, u.is_verified
     FROM user_auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.session_token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  if (row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }
  const skipBinding = Boolean(opts && opts.skipDeviceBinding);
  if (row.device_binding_hash && !skipBinding) {
    const presented = req ? getDeviceBindingFromRequest(req) : "";
    if (!deviceBindingMatchesStored(row.device_binding_hash, presented)) {
      return null;
    }
  }
  return row;
}

async function maybeRotatePublicSessionToken(sessionRow) {
  if (!sessionRow || !sessionRow.id) {
    return null;
  }
  const last = sessionRow.last_token_rotated_at ? new Date(sessionRow.last_token_rotated_at).getTime() : 0;
  if (Date.now() - last < SESSION_TOKEN_ROTATE_MS) {
    return null;
  }
  const newToken = crypto.randomBytes(32).toString("hex");
  const newHash = sha256(newToken);
  const expiresAt = new Date(Date.now() + PUBLIC_SESSION_TTL_MS);
  const [result] = await pool.execute(
    `UPDATE user_auth_sessions
     SET session_token_hash = ?, expires_at = ?, last_token_rotated_at = NOW()
     WHERE id = ? AND revoked_at IS NULL
     LIMIT 1`,
    [newHash, expiresAt, Number(sessionRow.id)]
  );
  if (!result || Number(result.affectedRows || 0) < 1) {
    return null;
  }
  return { token: newToken, expiresAt };
}

function getBearerToken(req) {
  const auth = String(req.headers.authorization || "");
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return String(readCookieToken(req, "vibecart_public_auth") || "").trim();
}

async function requirePublicSessionRole(req, res, allowedRoles) {
  const token = getBearerToken(req);
  if (!token) {
    sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
    return null;
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
    return null;
  }
  const role = String(session.role || "").toLowerCase();
  if (!allowedRoles.has(role)) {
    sendJson(res, 403, { ok: false, code: "ROLE_FORBIDDEN" });
    return null;
  }
  return session;
}

/** Bakery desk: many providers sign in as `buyer` but still own listings; ownership is enforced per row. */
const VC_BAKERY_PROVIDER_ROLES = new Set(["seller", "service_provider", "buyer"]);

function sendHighValueAccountRequired(res) {
  return sendJson(res, 401, {
    ok: false,
    code: "ACCOUNT_REQUIRED_HIGH_VALUE",
    message: "Sign in to your account before running this high-value action."
  });
}

async function requirePublicAccountSession(req, res, allowedRoles = null) {
  let token = getBearerToken(req);
  let tokenFromQuery = false;
  if (!token && req && req.url) {
    try {
      const urlObj = new URL(req.url, "http://localhost");
      token = String(urlObj.searchParams.get("token") || urlObj.searchParams.get("authToken") || "").trim();
      tokenFromQuery = Boolean(token);
    } catch {
      // ignore URL parse errors and continue with header-only auth
    }
  }
  if (!token) {
    sendHighValueAccountRequired(res);
    return null;
  }
  const session = await requirePublicSession(token, req, { skipDeviceBinding: tokenFromQuery });
  if (!session) {
    sendHighValueAccountRequired(res);
    return null;
  }
  if (allowedRoles && allowedRoles.size > 0) {
    const role = String(session.role || "").toLowerCase();
    if (!allowedRoles.has(role)) {
      sendJson(res, 403, { ok: false, code: "ROLE_FORBIDDEN" });
      return null;
    }
  }
  return session;
}

function normalizeProductCategoryName(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) {
    return "Fashion";
  }
  if (raw === "electronics" || raw === "electronic" || raw === "tech" || raw === "technology") {
    return "Electronics";
  }
  if (raw === "fashion" || raw === "style" || raw === "clothing" || raw === "apparel") {
    return "Fashion";
  }
  if (raw === "books" || raw === "book" || raw === "reading") {
    return "Books";
  }
  if (raw === "gaming" || raw === "games" || raw === "game") {
    return "Gaming";
  }
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 120) || "Fashion";
}

async function ensureCategoryIdByName(categoryName) {
  const normalized = normalizeProductCategoryName(categoryName);
  const [rows] = await pool.execute(`SELECT id FROM categories WHERE name = ? LIMIT 1`, [normalized]);
  if (Array.isArray(rows) && rows.length && Number(rows[0].id) > 0) {
    return { categoryId: Number(rows[0].id), categoryName: normalized };
  }
  const [insertResult] = await pool.execute(
    `INSERT INTO categories (name, legal_only) VALUES (?, 1)`,
    [normalized]
  );
  return { categoryId: Number(insertResult.insertId), categoryName: normalized };
}

async function ensureSellerProductMetricsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS seller_product_metrics (
      product_id BIGINT UNSIGNED PRIMARY KEY,
      view_count INT UNSIGNED NOT NULL DEFAULT 0,
      click_count INT UNSIGNED NOT NULL DEFAULT 0,
      sold_count INT UNSIGNED NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_seller_product_metrics_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`
  );
}

async function ensureSellerSaleNotificationsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS seller_sale_notifications (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      seller_user_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      order_id BIGINT UNSIGNED NOT NULL,
      message VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      INDEX idx_seller_sale_notifications_user (seller_user_id, created_at),
      INDEX idx_seller_sale_notifications_order (order_id)
    )`
  );
}

async function incrementSellerProductMetric(productId, fieldName, by = 1) {
  const pid = Number(productId || 0);
  if (!pid || !["view_count", "click_count", "sold_count"].includes(fieldName)) {
    return;
  }
  await ensureSellerProductMetricsTable();
  await pool.execute(
    `INSERT INTO seller_product_metrics (product_id, ${fieldName})
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE ${fieldName} = ${fieldName} + VALUES(${fieldName})`,
    [pid, Math.max(1, Number(by || 1))]
  );
}

const VC_SELLER_LISTING_ROLES = new Set(["seller", "buyer", "service_provider"]);

async function handlePublicSellerListings(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_SELLER_LISTING_ROLES);
  if (!session) return;
  await ensureSellerProductMetricsTable();
  const [rows] = await pool.execute(
    `SELECT
      p.id,
      p.title,
      p.description,
      p.base_price,
      p.currency,
      p.stock,
      p.status,
      p.origin_country,
      p.created_at,
      c.name AS category_name,
      COALESCE(m.view_count, 0) AS view_count,
      COALESCE(m.click_count, 0) AS click_count,
      COALESCE(m.sold_count, 0) AS sold_count,
      (
        SELECT COUNT(*)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id
          AND o.status IN ('pending', 'paid', 'shipped', 'delivered')
      ) AS order_count
     FROM products p
     JOIN shops s ON s.id = p.shop_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN seller_product_metrics m ON m.product_id = p.id
     WHERE s.owner_user_id = ?
     ORDER BY p.id DESC
     LIMIT 300`,
    [Number(session.user_id)]
  );
  return sendJson(res, 200, {
    ok: true,
    count: rows.length,
    listings: rows.map((row) => ({
      id: Number(row.id),
      title: String(row.title || ""),
      description: String(row.description || ""),
      categoryName: String(row.category_name || ""),
      basePrice: Number(row.base_price || 0),
      currency: String(row.currency || "EUR"),
      stock: Number(row.stock || 0),
      status: String(row.status || "active"),
      originCountry: String(row.origin_country || ""),
      createdAt: row.created_at,
      stats: {
        views: Number(row.view_count || 0),
        clicks: Number(row.click_count || 0),
        soldQty: Number(row.sold_count || 0),
        orders: Number(row.order_count || 0)
      }
    }))
  });
}

async function handlePublicSellerListingUpdate(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_SELLER_LISTING_ROLES);
  if (!session) return;
  const body = await readJson(req);
  const productId = Number(body.productId || 0);
  const nextStatusRaw = String(body.status || "").trim().toLowerCase();
  const stockRaw = body.stock;
  const basePriceRaw = body.basePrice;
  const remove = Boolean(body.remove || body.archive || body.delete);
  if (!productId) {
    return sendJson(res, 400, { ok: false, code: "INVALID_PRODUCT_ID" });
  }
  const [ownedRows] = await pool.execute(
    `SELECT p.id
     FROM products p
     JOIN shops s ON s.id = p.shop_id
     WHERE p.id = ? AND s.owner_user_id = ?
     LIMIT 1`,
    [productId, Number(session.user_id)]
  );
  if (!ownedRows.length) {
    return sendJson(res, 403, { ok: false, code: "LISTING_FORBIDDEN" });
  }
  if (remove) {
    /* Schema ENUM is draft|active|suspended|sold_out — use draft for seller-hidden listings */
    await pool.execute(`UPDATE products SET status = 'draft', stock = 0 WHERE id = ? LIMIT 1`, [productId]);
    return sendJson(res, 200, { ok: true, removed: true });
  }
  const updates = [];
  const params = [];
  if (Number.isFinite(Number(basePriceRaw)) && Number(basePriceRaw) > 0) {
    updates.push("base_price = ?");
    params.push(Number(Number(basePriceRaw).toFixed(2)));
  }
  if (stockRaw != null && Number.isFinite(Number(stockRaw))) {
    updates.push("stock = ?");
    params.push(Math.max(0, Math.min(9999, Math.floor(Number(stockRaw)))));
  }
  if (nextStatusRaw) {
    let nextStatus = "active";
    if (nextStatusRaw === "paused") {
      nextStatus = "suspended";
    } else if (nextStatusRaw === "archived" || nextStatusRaw === "removed" || nextStatusRaw === "deleted") {
      nextStatus = "draft";
    } else {
      nextStatus = "active";
    }
    updates.push("status = ?");
    params.push(nextStatus);
  }
  const title = String(body.title || "").trim();
  if (title.length >= 4 && title.length <= 180) {
    updates.push("title = ?");
    params.push(title);
  }
  if (body.description !== undefined && body.description !== null) {
    const desc = String(body.description || "").trim();
    if (desc.length <= 12000) {
      updates.push("description = ?");
      params.push(desc.length ? desc : null);
    }
  }
  if (!updates.length) {
    return sendJson(res, 400, { ok: false, code: "NO_UPDATES" });
  }
  params.push(productId);
  await pool.execute(`UPDATE products SET ${updates.join(", ")} WHERE id = ? LIMIT 1`, params);
  return sendJson(res, 200, { ok: true });
}

async function handlePublicSellerSaleNotifications(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_SELLER_LISTING_ROLES);
  if (!session) return;
  await ensureSellerSaleNotificationsTable();
  const [rows] = await pool.execute(
    `SELECT id, product_id, order_id, message, created_at, read_at
     FROM seller_sale_notifications
     WHERE seller_user_id = ?
     ORDER BY id DESC
     LIMIT 120`,
    [Number(session.user_id)]
  );
  return sendJson(res, 200, {
    ok: true,
    count: rows.length,
    notifications: rows.map((row) => ({
      id: Number(row.id),
      productId: Number(row.product_id),
      orderId: Number(row.order_id),
      message: String(row.message || ""),
      createdAt: row.created_at,
      readAt: row.read_at
    }))
  });
}

async function ensureBakeryServicesTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS bakery_services (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      baker_user_id BIGINT UNSIGNED NOT NULL,
      business_name VARCHAR(160) NOT NULL,
      work_title VARCHAR(160) NOT NULL,
      style_theme VARCHAR(180) NULL,
      base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency VARCHAR(8) NOT NULL DEFAULT 'USD',
      requirements_text TEXT NULL,
      image_url VARCHAR(500) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bakery_services_baker (baker_user_id, is_active, id)
    )`
  );
}

async function ensureBakeryBookingsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS bakery_bookings (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      service_id BIGINT UNSIGNED NOT NULL,
      baker_user_id BIGINT UNSIGNED NOT NULL,
      buyer_user_id BIGINT UNSIGNED NULL,
      customer_name VARCHAR(140) NOT NULL,
      customer_phone VARCHAR(60) NULL,
      event_date DATE NOT NULL,
      occasion_type VARCHAR(120) NULL,
      style_theme VARCHAR(180) NULL,
      request_details TEXT NULL,
      budget_amount DECIMAL(12,2) NULL,
      booking_status VARCHAR(30) NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bakery_bookings_baker (baker_user_id, booking_status, id),
      INDEX idx_bakery_bookings_service (service_id, id)
    )`
  );
  try {
    await pool.execute("ALTER TABLE bakery_bookings ADD COLUMN payment_preference VARCHAR(32) NULL");
  } catch (e) {
    if (!String(e.message || e).includes("Duplicate column name")) {
      /* ignore */
    }
  }
  try {
    await pool.execute("ALTER TABLE bakery_bookings ADD COLUMN service_line VARCHAR(120) NULL");
  } catch (e) {
    if (!String(e.message || e).includes("Duplicate column name")) {
      /* ignore */
    }
  }
  try {
    await pool.execute("CREATE INDEX idx_bakery_bookings_buyer ON bakery_bookings (buyer_user_id, id)");
  } catch (e) {
    const m = String((e && e.message) || e);
    if (!/Duplicate key name/i.test(m) && !/already exists/i.test(m)) {
      /* ignore */
    }
  }
  try {
    await pool.execute("ALTER TABLE bakery_bookings MODIFY COLUMN occasion_type VARCHAR(600) NULL");
  } catch {
    /* ignore */
  }
  try {
    await pool.execute("ALTER TABLE bakery_bookings ADD COLUMN requested_start_time VARCHAR(16) NULL");
  } catch (e) {
    if (!String(e.message || e).includes("Duplicate column name")) {
      /* ignore */
    }
  }
  try {
    await pool.execute("ALTER TABLE bakery_bookings ADD COLUMN confirmed_start_time VARCHAR(16) NULL");
  } catch (e) {
    if (!String(e.message || e).includes("Duplicate column name")) {
      /* ignore */
    }
  }
  try {
    await pool.execute("ALTER TABLE bakery_bookings ADD COLUMN confirmed_duration_minutes INT NULL");
  } catch (e) {
    if (!String(e.message || e).includes("Duplicate column name")) {
      /* ignore */
    }
  }
}

function normalizeBakerySlotHHMM(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return "";
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm) || h < 0 || h > 23 || mm < 0 || mm > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function bakeryHhmmToMinutes(hhmm) {
  const x = normalizeBakerySlotHHMM(hhmm);
  if (!x) return null;
  const [h, m] = x.split(":").map((n) => Number(n));
  return h * 60 + m;
}

function extractTimePreferenceFromOccasion(occasionType) {
  const occ = String(occasionType || "");
  const m = occ.match(/Time preference:\s*(\d{1,2}:\d{2})/i);
  if (m) return normalizeBakerySlotHHMM(m[1]);
  return "";
}

function buildBakeryOccasionTypeStored(paymentPreference, preferredSlotNormalized) {
  const pay = paymentPreference ? `Payment: ${String(paymentPreference).trim()}` : "";
  const slot = normalizeBakerySlotHHMM(preferredSlotNormalized) || "";
  const timeLine = slot ? `Time preference: ${slot}` : "Time preference: flexible";
  const out = [pay, timeLine].filter(Boolean).join(" · ");
  return out.slice(0, 600);
}

async function loadBookingBlocksForPublicSlots(poolRef, serviceId, slotDate) {
  const sid = Number(serviceId || 0);
  const dk = String(slotDate || "").slice(0, 10);
  if (!sid || !dk) return [];
  const [bRows] = await poolRef.execute(
    `SELECT b.booking_status, b.occasion_type, b.requested_start_time, b.confirmed_start_time, b.confirmed_duration_minutes,
            s.slot_duration_minutes
     FROM bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     WHERE b.service_id = ? AND b.event_date = ?
       AND b.booking_status IN ('pending','confirmed')`,
    [sid, dk]
  );
  const blocks = [];
  const fallbackDur = (row) => {
    const n = Number(row.slot_duration_minutes || 0);
    return Number.isFinite(n) && n >= 15 ? n : 60;
  };
  for (const row of bRows || []) {
    const st = String(row.booking_status || "").toLowerCase();
    let start =
      normalizeBakerySlotHHMM(row.confirmed_start_time) ||
      normalizeBakerySlotHHMM(row.requested_start_time) ||
      extractTimePreferenceFromOccasion(row.occasion_type);
    if (!start) continue;
    let dur = Number(row.confirmed_duration_minutes || 0);
    if (st === "confirmed") {
      if (!Number.isFinite(dur) || dur < 15) dur = fallbackDur(row);
    } else {
      dur = fallbackDur(row);
    }
    if (!Number.isFinite(dur) || dur < 15) dur = 60;
    blocks.push({ start, durationMinutes: dur });
  }
  return blocks;
}

function filterSlotTimesByConfirmedBlocks(slotTimes, blocks) {
  const list = Array.isArray(slotTimes) ? slotTimes : [];
  const bs = Array.isArray(blocks) ? blocks : [];
  if (!bs.length) return list;
  return list.filter((raw) => {
    const sm = bakeryHhmmToMinutes(raw);
    if (sm == null) return true;
    for (const b of bs) {
      const st = bakeryHhmmToMinutes(b.start);
      if (st == null) continue;
      const end = st + (Number(b.durationMinutes) || 60);
      if (sm >= st && sm < end) return false;
    }
    return true;
  });
}

async function deleteBakerySlotsInRange(poolRef, serviceId, slotDate, startHHMM, durationMinutes) {
  const sid = Number(serviceId || 0);
  const dk = String(slotDate || "").slice(0, 10);
  const start = normalizeBakerySlotHHMM(startHHMM);
  const dur = Number(durationMinutes || 0);
  if (!sid || !dk || !start || !Number.isFinite(dur) || dur < 5) return 0;
  const startMin = bakeryHhmmToMinutes(start);
  if (startMin == null) return 0;
  const endMin = startMin + dur;
  const [slotRows] = await poolRef.execute(
    `SELECT slot_time FROM bakery_schedule_slots WHERE service_id = ? AND slot_date = ?`,
    [sid, dk]
  );
  const toDelete = [];
  for (const row of slotRows || []) {
    const st = normalizeBakerySlotHHMM(row.slot_time);
    const sm = bakeryHhmmToMinutes(st);
    if (sm == null) continue;
    if (sm >= startMin && sm < endMin) toDelete.push(st);
  }
  if (!toDelete.length) return 0;
  const ph = toDelete.map(() => "?").join(",");
  const [del] = await poolRef.execute(
    `DELETE FROM bakery_schedule_slots WHERE service_id = ? AND slot_date = ? AND slot_time IN (${ph})`,
    [sid, dk, ...toDelete]
  );
  return Number((del && del.affectedRows) || 0);
}

let bakeryBookingEventsTableEnsured = false;
async function ensureBakeryBookingEventsTable() {
  if (bakeryBookingEventsTableEnsured) {
    return;
  }
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS bakery_booking_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      booking_id BIGINT UNSIGNED NOT NULL,
      actor_user_id BIGINT UNSIGNED NOT NULL,
      from_status VARCHAR(30) NULL,
      to_status VARCHAR(30) NOT NULL,
      note VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_bakery_evt_booking (booking_id, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  bakeryBookingEventsTableEnsured = true;
}

let bakeryBookingMessagesTableEnsured = false;
async function ensureBakeryBookingMessagesTable() {
  if (bakeryBookingMessagesTableEnsured) {
    return;
  }
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS bakery_booking_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      booking_id BIGINT UNSIGNED NOT NULL,
      sender_user_id BIGINT UNSIGNED NOT NULL,
      body VARCHAR(2000) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_bakery_msg_booking (booking_id, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  bakeryBookingMessagesTableEnsured = true;
}

let bakeryScheduleSlotsTableEnsured = false;
async function ensureBakeryScheduleSlotsTable() {
  if (bakeryScheduleSlotsTableEnsured) {
    return;
  }
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS bakery_schedule_slots (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      service_id BIGINT UNSIGNED NOT NULL,
      slot_date DATE NOT NULL,
      slot_time VARCHAR(8) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_bakery_slot (service_id, slot_date, slot_time),
      KEY idx_bakery_slot_svc_date (service_id, slot_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  bakeryScheduleSlotsTableEnsured = true;
}

let clientEventLogsTableEnsured = false;
async function ensureClientEventLogsTable() {
  if (clientEventLogsTableEnsured) {
    return;
  }
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS client_event_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(120) NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'info',
      page_path VARCHAR(255) NULL,
      event_message VARCHAR(500) NULL,
      payload_json JSON NULL,
      user_agent VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_client_event_logs_type (event_type, created_at),
      KEY idx_client_event_logs_sev (severity, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  clientEventLogsTableEnsured = true;
}

let gdprPrivacyRequestTableEnsured = false;
async function ensureGdprPrivacyRequestTable() {
  if (gdprPrivacyRequestTableEnsured) {
    return;
  }
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS gdpr_privacy_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      request_type VARCHAR(40) NOT NULL,
      note_text VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_gdpr_user (user_id, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  gdprPrivacyRequestTableEnsured = true;
}

async function handlePublicBakeryScheduleSlotsList(req, res) {
  let serviceId = 0;
  let slotDate = "";
  let monthKey = "";
  try {
    const u = new URL(req.url, "http://localhost");
    serviceId = Number(u.searchParams.get("serviceId") || 0);
    slotDate = String(u.searchParams.get("date") || "").trim().slice(0, 10);
    monthKey = String(u.searchParams.get("month") || "").trim().slice(0, 7);
  } catch {
    serviceId = 0;
  }
  if (!serviceId || (!slotDate && !monthKey)) {
    return sendJson(res, 400, { ok: false, code: "SERVICE_DATE_REQUIRED" });
  }
  await ensureBakeryScheduleSlotsTable();
  if (monthKey) {
    const [rowsByDay] = await pool.execute(
      `SELECT slot_date, COUNT(*) AS n
       FROM bakery_schedule_slots
       WHERE service_id = ?
         AND slot_date >= CONCAT(?, '-01')
         AND slot_date < DATE_ADD(CONCAT(?, '-01'), INTERVAL 1 MONTH)
       GROUP BY slot_date
       ORDER BY slot_date ASC`,
      [serviceId, monthKey, monthKey]
    );
    return sendJson(res, 200, {
      ok: true,
      month: monthKey,
      availableDates: (Array.isArray(rowsByDay) ? rowsByDay : []).map((r) => ({
        date: String(r.slot_date || "").slice(0, 10),
        slots: Number(r.n || 0)
      }))
    });
  }
  const [rows] = await pool.execute(
    `SELECT slot_time FROM bakery_schedule_slots WHERE service_id = ? AND slot_date = ? ORDER BY slot_time ASC`,
    [serviceId, slotDate]
  );
  let slots = rows.map((r) => normalizeBakerySlotHHMM(r.slot_time) || String(r.slot_time || "").trim()).filter(Boolean);
  try {
    const blocks = await loadBookingBlocksForPublicSlots(pool, serviceId, slotDate);
    slots = filterSlotTimesByConfirmedBlocks(slots, blocks);
  } catch {
    /* ignore filter errors */
  }
  return sendJson(res, 200, {
    ok: true,
    slots
  });
}

async function handlePublicClientEventLog(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  let body = {};
  try {
    body = await readJson(req);
  } catch {
    body = {};
  }
  const eventType = String(body.eventType || "").trim().slice(0, 120) || "client_event";
  const severity = String(body.severity || "info").trim().toLowerCase().slice(0, 20);
  const pagePath = String(body.pagePath || "").trim().slice(0, 255);
  const eventMessage = String(body.message || "").trim().slice(0, 500);
  const payload = body && typeof body.payload === "object" ? body.payload : null;
  const userAgent = String((req.headers && req.headers["user-agent"]) || "").trim().slice(0, 255);
  await ensureClientEventLogsTable();
  await pool.execute(
    `INSERT INTO client_event_logs (event_type, severity, page_path, event_message, payload_json, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [eventType, severity || "info", pagePath || null, eventMessage || null, payload ? JSON.stringify(payload) : null, userAgent || null]
  );
  return sendJson(res, 200, { ok: true });
}

async function handlePublicBakeryScheduleSlotsUpsert(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  const body = await readJson(req);
  const serviceId = Number(body.serviceId || 0);
  const slotDate = String(body.slotDate || "").trim().slice(0, 10);
  const slotTimes = Array.isArray(body.slotTimes) ? body.slotTimes : [];
  if (!serviceId || !slotDate || !slotTimes.length) {
    return sendJson(res, 400, { ok: false, code: "SLOT_FIELDS_REQUIRED" });
  }
  await ensureBakeryScheduleSlotsTable();
  const [svc] = await pool.execute(
    `SELECT id FROM bakery_services WHERE id = ? AND baker_user_id = ? LIMIT 1`,
    [serviceId, Number(session.user_id)]
  );
  if (!svc[0]) {
    return sendJson(res, 403, { ok: false, code: "SERVICE_FORBIDDEN" });
  }
  await pool.execute(`DELETE FROM bakery_schedule_slots WHERE service_id = ? AND slot_date = ?`, [serviceId, slotDate]);
  let inserted = 0;
  for (const t of slotTimes) {
    const st = String(t || "").trim().slice(0, 8);
    if (!st) continue;
    try {
      await pool.execute(
        `INSERT INTO bakery_schedule_slots (service_id, slot_date, slot_time) VALUES (?, ?, ?)`,
        [serviceId, slotDate, st]
      );
      inserted += 1;
    } catch {
      /* ignore duplicate */
    }
  }
  return sendJson(res, 200, { ok: true, serviceId, slotDate, inserted });
}

async function handlePublicBakeryScheduleSlotsAdd(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  const body = await readJson(req);
  const serviceId = Number(body.serviceId || 0);
  const slotDate = String(body.slotDate || "").trim().slice(0, 10);
  const slotTimes = Array.isArray(body.slotTimes) ? body.slotTimes : [];
  if (!serviceId || !slotDate || !slotTimes.length) {
    return sendJson(res, 400, { ok: false, code: "SLOT_FIELDS_REQUIRED" });
  }
  await ensureBakeryScheduleSlotsTable();
  const [svc] = await pool.execute(
    `SELECT id FROM bakery_services WHERE id = ? AND baker_user_id = ? LIMIT 1`,
    [serviceId, Number(session.user_id)]
  );
  if (!svc[0]) {
    return sendJson(res, 403, { ok: false, code: "SERVICE_FORBIDDEN" });
  }
  let inserted = 0;
  for (const t of slotTimes) {
    const st = String(t || "").trim().slice(0, 8);
    if (!st) continue;
    try {
      await pool.execute(
        `INSERT INTO bakery_schedule_slots (service_id, slot_date, slot_time) VALUES (?, ?, ?)`,
        [serviceId, slotDate, st]
      );
      inserted += 1;
    } catch {
      /* ignore duplicate */
    }
  }
  return sendJson(res, 200, { ok: true, serviceId, slotDate, inserted });
}

async function handlePublicBakeryScheduleSlotsRemove(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  const body = await readJson(req);
  const serviceId = Number(body.serviceId || 0);
  const slotDate = String(body.slotDate || "").trim().slice(0, 10);
  const slotTimes = Array.isArray(body.slotTimes) ? body.slotTimes : [];
  if (!serviceId || !slotDate || !slotTimes.length) {
    return sendJson(res, 400, { ok: false, code: "SLOT_FIELDS_REQUIRED" });
  }
  await ensureBakeryScheduleSlotsTable();
  const [svc] = await pool.execute(
    `SELECT id FROM bakery_services WHERE id = ? AND baker_user_id = ? LIMIT 1`,
    [serviceId, Number(session.user_id)]
  );
  if (!svc[0]) {
    return sendJson(res, 403, { ok: false, code: "SERVICE_FORBIDDEN" });
  }
  const normalized = slotTimes
    .map((t) => String(t || "").trim().slice(0, 8))
    .filter(Boolean);
  if (!normalized.length) {
    return sendJson(res, 400, { ok: false, code: "SLOT_TIMES_EMPTY" });
  }
  const placeholders = normalized.map(() => "?").join(", ");
  const [del] = await pool.execute(
    `DELETE FROM bakery_schedule_slots
     WHERE service_id = ? AND slot_date = ? AND slot_time IN (${placeholders})`,
    [serviceId, slotDate, ...normalized]
  );
  return sendJson(res, 200, { ok: true, serviceId, slotDate, removed: Number(del.affectedRows || 0) });
}

async function handlePublicBakeryBookingCheckoutStart(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  if (!stripe) {
    return sendJson(res, 503, { ok: false, code: "STRIPE_NOT_CONFIGURED" });
  }
  const body = await readJson(req);
  const bookingId = Number(body.bookingId || 0);
  const payMode = String(body.payMode || "deposit").toLowerCase();
  if (!bookingId) {
    return sendJson(res, 400, { ok: false, code: "BOOKING_ID_REQUIRED" });
  }
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingStripeColumns(pool);
  const [bRows] = await pool.execute(
    `SELECT b.id, b.buyer_user_id, b.booking_status, b.stripe_payment_status, b.payment_preference,
            s.base_price, s.currency, s.work_title, s.business_name
     FROM bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     WHERE b.id = ?
     LIMIT 1`,
    [bookingId]
  );
  const b = bRows[0];
  if (!b) {
    return sendJson(res, 404, { ok: false, code: "BOOKING_NOT_FOUND" });
  }
  if (Number(b.buyer_user_id || 0) !== Number(session.user_id)) {
    return sendJson(res, 403, { ok: false, code: "BOOKING_FORBIDDEN" });
  }
  if (String(b.booking_status || "").toLowerCase() !== "confirmed") {
    return sendJson(res, 400, { ok: false, code: "BOOKING_NOT_CONFIRMED", message: "Pay after your provider accepts." });
  }
  if (String(b.stripe_payment_status || "").toLowerCase() === "paid") {
    return sendJson(res, 400, { ok: false, code: "ALREADY_PAID" });
  }
  const base = Number(b.base_price || 0);
  const fraction = payMode === "full" || String(b.payment_preference || "").toLowerCase().includes("full") ? 1 : 0.25;
  let amount = Number((base * fraction).toFixed(2));
  if (!Number.isFinite(amount) || amount < 1) {
    amount = Math.max(1, Number(base) || 1);
  }
  const currency = String(b.currency || "USD").trim().toLowerCase().slice(0, 8) || "usd";
  const baseUrl = resolvePublicWebBaseUrl(req).replace(/\/+$/, "");
  const successUrl = `${baseUrl}/my-business.html?booking_paid=${bookingId}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/my-business.html?booking_pay_cancel=${bookingId}`;
  const label = `${String(b.business_name || "Provider")} · ${String(b.work_title || "Booking")} #${bookingId}`;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: String(session.email || "").trim() || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: label,
            description: payMode === "full" ? "Full balance (My Business)" : "Deposit (My Business)"
          }
        }
      }
    ],
    metadata: {
      vibecart_flow: "bakery_booking",
      booking_id: String(bookingId),
      success_return_base: baseUrl,
      pay_mode: payMode,
      buyer_user_id: String(Number(session.user_id))
    }
  });
  await pool.execute(
    `UPDATE bakery_bookings SET stripe_checkout_session_id = ? WHERE id = ? LIMIT 1`,
    [String(checkoutSession.id || ""), bookingId]
  );
  return sendJson(res, 200, {
    ok: true,
    url: String(checkoutSession.url || ""),
    checkoutSessionId: String(checkoutSession.id || "")
  });
}

async function handlePublicUserPrivacyExport(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const uid = Number(session.user_id);
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingMessagesTable();
  const [asBuyer] = await pool.execute(
    `SELECT b.id, b.service_id, b.booking_status, b.event_date, b.created_at, b.request_details
     FROM bakery_bookings b WHERE b.buyer_user_id = ? ORDER BY b.id DESC LIMIT 100`,
    [uid]
  );
  const [asBaker] = await pool.execute(
    `SELECT b.id, b.service_id, b.booking_status, b.event_date, b.created_at, b.customer_name
     FROM bakery_bookings b WHERE b.baker_user_id = ? ORDER BY b.id DESC LIMIT 100`,
    [uid]
  );
  const bookingIds = [...new Set([...asBuyer.map((r) => r.id), ...asBaker.map((r) => r.id)])].slice(0, 50);
  let messages = [];
  if (bookingIds.length) {
    const placeholders = bookingIds.map(() => "?").join(",");
    const [mrows] = await pool.execute(
      `SELECT booking_id, sender_user_id, body, created_at FROM bakery_booking_messages WHERE booking_id IN (${placeholders}) ORDER BY id DESC LIMIT 500`,
      bookingIds
    );
    messages = mrows;
  }
  return sendJson(res, 200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    user: {
      id: uid,
      email: String(session.email || ""),
      role: String(session.role || "")
    },
    bakeryBookingsAsBuyer: asBuyer,
    bakeryBookingsAsProvider: asBaker,
    bakeryBookingMessagesSample: messages
  });
}

async function handlePublicUserPrivacyDeleteRequest(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  await ensureGdprPrivacyRequestTable();
  const body = await readJson(req);
  const note = String(body.note || body.reason || "").trim().slice(0, 500);
  await pool.execute(`INSERT INTO gdpr_privacy_requests (user_id, request_type, note_text) VALUES (?, 'delete_account', ?)`, [
    Number(session.user_id),
    note || null
  ]);
  return sendJson(res, 200, {
    ok: true,
    message:
      "Request recorded. For production deletion (right to erasure), your team should process this row in gdpr_privacy_requests and follow your DPA process."
  });
}

async function handlePublicBakeryServiceUpsert(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryServicesTable();
  await ensureBakeryServiceGalleryColumn();
  await ensureBakeryServiceSlotDurationColumn();
  const body = await readJson(req);
  const serviceId = Number(body.serviceId || 0);
  const businessName = String(body.businessName || "").trim().slice(0, 160);
  const workTitle = String(body.workTitle || "").trim().slice(0, 160);
  const styleTheme = String(body.styleTheme || "").trim().slice(0, 180);
  const requirementsText = String(body.requirementsText || "").trim().slice(0, 4000);
  let imageUrl = String(body.imageUrl || "").trim().slice(0, 500);
  const currency = String(body.currency || "USD").trim().toUpperCase().slice(0, 8) || "USD";
  const basePrice = Number.isFinite(Number(body.basePrice)) ? Math.max(0, Number(Number(body.basePrice).toFixed(2))) : 0;
  const galleryJson = sanitizeBakeryGalleryInput(body.gallery);
  const galleryArr = galleryJson ? parseBakeryGalleryJson(galleryJson) : [];
  const firstImg = galleryArr.find((x) => x && x.kind === "image" && typeof x.url === "string");
  if (firstImg && firstImg.url) {
    imageUrl = String(firstImg.url).trim().slice(0, 500);
  }
  const rawDur = Number(body.slotDurationMinutes);
  const slotDurationMinutes = Number.isFinite(rawDur)
    ? Math.min(480, Math.max(15, Math.round(rawDur)))
    : 60;
  if (!businessName || !workTitle) {
    return sendJson(res, 400, { ok: false, code: "BUSINESS_AND_WORK_REQUIRED" });
  }
  if (serviceId > 0) {
    await pool.execute(
      `UPDATE bakery_services
       SET business_name = ?, work_title = ?, style_theme = ?, base_price = ?, currency = ?, requirements_text = ?, image_url = ?, gallery_json = ?, slot_duration_minutes = ?
       WHERE id = ? AND baker_user_id = ?
       LIMIT 1`,
      [
        businessName,
        workTitle,
        styleTheme || null,
        basePrice,
        currency,
        requirementsText || null,
        imageUrl || null,
        galleryJson,
        slotDurationMinutes,
        serviceId,
        Number(session.user_id)
      ]
    );
    return sendJson(res, 200, { ok: true, serviceId });
  }
  const [inserted] = await pool.execute(
    `INSERT INTO bakery_services (
      baker_user_id, business_name, work_title, style_theme, base_price, currency, requirements_text, image_url, gallery_json, slot_duration_minutes, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      Number(session.user_id),
      businessName,
      workTitle,
      styleTheme || null,
      basePrice,
      currency,
      requirementsText || null,
      imageUrl || null,
      galleryJson,
      slotDurationMinutes
    ]
  );
  return sendJson(res, 200, { ok: true, serviceId: Number(inserted.insertId || 0) });
}

async function handlePublicBakeryServicesMine(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryServicesTable();
  await ensureBakeryServiceGalleryColumn();
  await ensureBakeryServiceSlotDurationColumn();
  const [rows] = await pool.execute(
    `SELECT id, business_name, work_title, style_theme, base_price, currency, requirements_text, image_url, gallery_json, slot_duration_minutes, is_active, created_at, updated_at
     FROM bakery_services
     WHERE baker_user_id = ?
     ORDER BY id DESC
     LIMIT 200`,
    [Number(session.user_id)]
  );
  return sendJson(res, 200, {
    ok: true,
    services: rows.map((row) => ({
      id: Number(row.id),
      businessName: String(row.business_name || ""),
      workTitle: String(row.work_title || ""),
      styleTheme: String(row.style_theme || ""),
      basePrice: Number(row.base_price || 0),
      currency: String(row.currency || "USD"),
      requirementsText: String(row.requirements_text || ""),
      imageUrl: String(row.image_url || ""),
      gallery: galleryArrayForApi(row.gallery_json),
      slotDurationMinutes: Number(row.slot_duration_minutes || 60) || 60,
      isActive: Boolean(Number(row.is_active || 0)),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  });
}

async function handlePublicBakeryServicesDiscover(req, res) {
  await ensureBakeryServicesTable();
  await ensureBakeryServiceGalleryColumn();
  await ensureBakeryServiceSlotDurationColumn();
  await ensureBakeryScheduleSlotsTable();
  const urlObj = new URL(req.url, "http://localhost");
  const q = String(urlObj.searchParams.get("q") || "").trim().toLowerCase();
  const line = String(urlObj.searchParams.get("line") || "").trim().toLowerCase();
  const [rows] = await pool.execute(
    `SELECT bs.id, bs.baker_user_id, bs.business_name, bs.work_title, bs.style_theme, bs.base_price, bs.currency, bs.requirements_text, bs.image_url, bs.gallery_json, bs.slot_duration_minutes, bs.is_active,
            u.full_name,
            COUNT(CASE WHEN bss.slot_date >= CURDATE() THEN 1 END) AS future_slot_count
     FROM bakery_services bs
     JOIN users u ON u.id = bs.baker_user_id
     LEFT JOIN bakery_schedule_slots bss ON bss.service_id = bs.id
     GROUP BY bs.id
     HAVING MAX(bs.is_active) = 1 OR future_slot_count > 0
     ORDER BY bs.id DESC
     LIMIT 150`
  );
  const filtered = rows.filter((row) => {
    const bizName = String(row.business_name || "").toLowerCase();
    const workTitle = String(row.work_title || "").toLowerCase();
    const reqText = String(row.requirements_text || "").toLowerCase();
    const style = String(row.style_theme || "").toLowerCase();
    // Hide system hardpass/smoke fixtures from real client discovery.
    if (
      bizName.indexOf("hardpass") >= 0 ||
      workTitle.indexOf("hardpass") >= 0 ||
      reqText.indexOf("hardpass") >= 0 ||
      style.indexOf("hardpass") >= 0 ||
      bizName.indexOf("ui studio") >= 0
    ) {
      return false;
    }
    const text = `${row.business_name || ""} ${row.work_title || ""} ${row.style_theme || ""} ${row.full_name || ""}`.toLowerCase();
    if (line) {
      const words = line.split(/[^a-z0-9]+/).filter(Boolean);
      if (words.length && !words.every((w) => text.includes(w))) {
        return false;
      }
    }
    if (!q) return true;
    return text.includes(q);
  });
  return sendJson(res, 200, {
    ok: true,
    services: filtered.map((row) => ({
      id: Number(row.id),
      bakerUserId: Number(row.baker_user_id),
      bakerName: String(row.full_name || "Baker"),
      businessName: String(row.business_name || ""),
      workTitle: String(row.work_title || ""),
      styleTheme: String(row.style_theme || ""),
      basePrice: Number(row.base_price || 0),
      currency: String(row.currency || "USD"),
      requirementsText: String(row.requirements_text || ""),
      imageUrl: String(row.image_url || ""),
      gallery: galleryArrayForApi(row.gallery_json),
      slotDurationMinutes: Number(row.slot_duration_minutes || 60) || 60,
      hasFutureSlots: Number(row.future_slot_count || 0) > 0
    }))
  });
}

async function handlePublicBakeryServiceToggle(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryServicesTable();
  const body = await readJson(req);
  const serviceId = Number(body.serviceId || 0);
  const isActive = Number(body.isActive ? 1 : 0);
  if (!serviceId) {
    return sendJson(res, 400, { ok: false, code: "SERVICE_ID_REQUIRED" });
  }
  await pool.execute(
    `UPDATE bakery_services
     SET is_active = ?
     WHERE id = ? AND baker_user_id = ?
     LIMIT 1`,
    [isActive, serviceId, Number(session.user_id)]
  );
  return sendJson(res, 200, { ok: true, serviceId, isActive: Boolean(isActive) });
}

async function handlePublicBakeryServiceDelete(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  await ensureBakeryServicesTable();
  await ensureBakeryScheduleSlotsTable();
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingMessagesTable();
  await ensureBakeryBookingEventsTable();
  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const serviceId = Number(body.serviceId || 0);
  if (!serviceId) {
    return sendJson(res, 400, { ok: false, code: "SERVICE_ID_REQUIRED" });
  }
  const uid = Number(session.user_id);
  const [svc] = await pool.execute(`SELECT id FROM bakery_services WHERE id = ? AND baker_user_id = ? LIMIT 1`, [
    serviceId,
    uid
  ]);
  if (!svc[0]) {
    return sendJson(res, 403, { ok: false, code: "SERVICE_FORBIDDEN" });
  }
  const [bookingRows] = await pool.execute(`SELECT id FROM bakery_bookings WHERE service_id = ?`, [serviceId]);
  const bookingIds = bookingRows.map((r) => Number(r.id)).filter((id) => id > 0);
  if (bookingIds.length) {
    const ph = bookingIds.map(() => "?").join(", ");
    await pool.execute(`DELETE FROM bakery_booking_messages WHERE booking_id IN (${ph})`, bookingIds);
    await pool.execute(`DELETE FROM bakery_booking_events WHERE booking_id IN (${ph})`, bookingIds);
  }
  await pool.execute(`DELETE FROM bakery_bookings WHERE service_id = ?`, [serviceId]);
  await pool.execute(`DELETE FROM bakery_schedule_slots WHERE service_id = ?`, [serviceId]);
  await pool.execute(`DELETE FROM bakery_services WHERE id = ? AND baker_user_id = ? LIMIT 1`, [serviceId, uid]);
  return sendJson(res, 200, { ok: true, serviceId, removedBookings: bookingIds.length });
}

async function handlePublicBakeryBookingCreate(req, res) {
  const maybeToken = getBearerToken(req);
  if (!maybeToken) {
    return sendJson(res, 401, {
      ok: false,
      code: "SIGNIN_REQUIRED",
      message: "Sign in to send a booking request so we can link your reservation and notify you."
    });
  }
  const session = await requirePublicSession(maybeToken, req);
  if (!session || !Number(session.user_id)) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const body = await readJson(req);
  await ensureBakeryServicesTable();
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingEventsTable();
  const serviceId = Number(body.serviceId || 0);
  const customerName = String(body.customerName || "").trim().slice(0, 140);
  const customerPhone = String(body.customerPhone || "").trim().slice(0, 60);
  const eventDate = String(body.eventDate || "").trim().slice(0, 10);
  const occasionTypeRaw = String(body.occasionType || "").trim();
  const styleTheme = String(body.styleTheme || "").trim().slice(0, 180);
  const requestDetails = String(body.requestDetails || "").trim().slice(0, 4000);
  let preferredSlot = normalizeBakerySlotHHMM(String(body.preferredSlot || "").trim()) || "";
  const prefRawLower = String(body.preferredSlot || "").trim().toLowerCase();
  const wantsTimeFlexible =
    prefRawLower === "flexible" || /\btime preference:\s*flexible\b/i.test(occasionTypeRaw);
  const budgetAmount = Number.isFinite(Number(body.budgetAmount)) ? Number(Number(body.budgetAmount).toFixed(2)) : null;
  const paymentPreference = String(body.paymentPreference || "").trim().slice(0, 32) || null;
  const serviceLine = String(body.serviceLine || "").trim().slice(0, 120) || null;
  if (!serviceId || !customerName || !eventDate || !requestDetails) {
    return sendJson(res, 400, { ok: false, code: "BOOKING_FIELDS_REQUIRED" });
  }
  if (!preferredSlot) {
    preferredSlot = extractTimePreferenceFromOccasion(occasionTypeRaw) || "";
  }
  if (!wantsTimeFlexible && (!preferredSlot || !/^[0-2]\d:[0-5]\d$/.test(preferredSlot))) {
    try {
      await ensureBakeryScheduleSlotsTable();
      const [firstSlotRows] = await pool.execute(
        `SELECT slot_time
         FROM bakery_schedule_slots
         WHERE service_id = ? AND slot_date = ?
         ORDER BY slot_time ASC
         LIMIT 1`,
        [serviceId, eventDate]
      );
      preferredSlot = normalizeBakerySlotHHMM(firstSlotRows[0] ? String(firstSlotRows[0].slot_time || "").trim() : "") || "";
    } catch {
      preferredSlot = "";
    }
  }
  if (!preferredSlot || !/^[0-2]\d:[0-5]\d$/.test(preferredSlot)) {
    preferredSlot = "";
  }
  const occasionTypeStored = buildBakeryOccasionTypeStored(paymentPreference, preferredSlot);
  const requestedStartForRow = preferredSlot || null;
  const [services] = await pool.execute(
    `SELECT id, baker_user_id, work_title
     FROM bakery_services
     WHERE id = ?
       AND (
         is_active = 1
         OR EXISTS (
           SELECT 1
           FROM bakery_schedule_slots bss
           WHERE bss.service_id = bakery_services.id
             AND bss.slot_date >= CURDATE()
           LIMIT 1
         )
       )
     LIMIT 1`,
    [serviceId]
  );
  const svc = services[0];
  if (!svc) {
    return sendJson(res, 404, { ok: false, code: "BAKERY_SERVICE_NOT_FOUND" });
  }
  await ensureBakeryScheduleSlotsTable();
  if (preferredSlot) {
    const [slotRows] = await pool.execute(
      `SELECT slot_time FROM bakery_schedule_slots WHERE service_id = ? AND slot_date = ?`,
      [serviceId, eventDate]
    );
    const hasSlot = (slotRows || []).some((r) => normalizeBakerySlotHHMM(r.slot_time) === preferredSlot);
    if (!hasSlot) {
      return sendJson(res, 409, { ok: false, code: "SLOT_UNAVAILABLE", message: "That slot is no longer available." });
    }
  }
  const buyerId = Number(session.user_id);
  const [inserted] = await pool.execute(
    `INSERT INTO bakery_bookings (
      service_id, baker_user_id, buyer_user_id, customer_name, customer_phone, event_date, occasion_type, style_theme, request_details, budget_amount, payment_preference, service_line, booking_status, requested_start_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      serviceId,
      Number(svc.baker_user_id),
      buyerId,
      customerName,
      customerPhone || null,
      eventDate,
      occasionTypeStored || null,
      styleTheme || null,
      requestDetails,
      budgetAmount,
      paymentPreference,
      serviceLine,
      requestedStartForRow
    ]
  );
  const bookingId = Number(inserted.insertId || 0);
  const mbUrl = `${resolvePublicWebBaseUrl(req)}/my-business.html`;
  const mbProviderDeep = `${mbUrl}?mbBookingId=${bookingId}#mb-provider-bookings`;
  let providerPushResult = { ok: true, skipped: true, reason: "unknown" };
  const timeHint = preferredSlot ? ` at ${preferredSlot}` : " (time flexible)";
  try {
    providerPushResult = await sendPushToUser(pool, {
      userId: Number(svc.baker_user_id),
      title: "New booking request",
      message: `${customerName} requested "${String(svc.work_title || "your service")}" for ${eventDate}${timeHint}. Open My Business to accept or decline.`,
      deepLink: mbProviderDeep,
      eventType: "bakery_booking_new"
    });
  } catch {
    /* ignore push failures */
  }
  try {
    await pool.execute(
      `INSERT INTO bakery_booking_events (booking_id, actor_user_id, from_status, to_status, note) VALUES (?, ?, NULL, 'pending', ?)`,
      [bookingId, buyerId, "created"]
    );
  } catch {
    /* ignore audit failures */
  }
  const bakerEmail = await getUserEmailById(Number(svc.baker_user_id));
  if (bakerEmail) {
    queueUserTransactionalEmail(
      bakerEmail,
      "New booking request",
      [
        `${customerName} requested "${String(svc.work_title || "your service")}" for ${eventDate}${timeHint}.`,
        `Booking #${bookingId}.`,
        "Open My Business (provider) to accept or decline.",
        mbProviderDeep,
        "",
        `Details: ${requestDetails.slice(0, 1200)}`
      ].join("\n")
    );
  }
  const buyerEmail = await getUserEmailById(buyerId);
  if (buyerEmail) {
    queueUserTransactionalEmail(
      buyerEmail,
      "We received your booking request",
      [
        `Your reservation request #${bookingId} for "${String(svc.work_title || "service")}" on ${eventDate} was sent.`,
        "Your provider will accept or decline — we will notify you by push and email when they respond.",
        `${mbUrl}#mb-client-service-desk`
      ].join("\n")
    );
  }
  try {
    broadcastProviderDesk(Number(svc.baker_user_id), {
      reason: "booking_new",
      bookingId,
      serviceId,
      customerName,
      eventDate,
      preferredTime: preferredSlot || null
    });
  } catch {
    /* ignore realtime failures */
  }
  return sendJson(res, 200, {
    ok: true,
    bookingId,
    providerPush:
      providerPushResult && providerPushResult.skipped && providerPushResult.reason === "no_device_tokens"
        ? "no_device_tokens"
        : "queued"
  });
}

async function handlePublicBakeryBookingsMine(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryBookingsTable();
  const [rows] = await pool.execute(
    `SELECT b.id, b.service_id, b.customer_name, b.customer_phone, b.event_date, b.occasion_type, b.style_theme, b.request_details, b.budget_amount, b.booking_status, b.created_at,
            b.requested_start_time, b.confirmed_start_time, b.confirmed_duration_minutes,
            s.work_title, s.business_name
     FROM bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     WHERE b.baker_user_id = ?
     ORDER BY b.id DESC
     LIMIT 200`,
    [Number(session.user_id)]
  );
  return sendJson(res, 200, {
    ok: true,
    bookings: rows.map((row) => ({
      id: Number(row.id),
      serviceId: Number(row.service_id),
      businessName: String(row.business_name || ""),
      workTitle: String(row.work_title || ""),
      customerName: String(row.customer_name || ""),
      customerPhone: String(row.customer_phone || ""),
      eventDate: row.event_date,
      occasionType: String(row.occasion_type || ""),
      requestedStartTime: row.requested_start_time == null ? null : String(row.requested_start_time || ""),
      confirmedStartTime: row.confirmed_start_time == null ? null : String(row.confirmed_start_time || ""),
      confirmedDurationMinutes:
        row.confirmed_duration_minutes == null ? null : Number(row.confirmed_duration_minutes),
      preferredTime:
        normalizeBakerySlotHHMM(row.requested_start_time) ||
        extractTimePreferenceFromOccasion(row.occasion_type) ||
        null,
      styleTheme: String(row.style_theme || ""),
      requestDetails: String(row.request_details || ""),
      budgetAmount: row.budget_amount == null ? null : Number(row.budget_amount),
      bookingStatus: String(row.booking_status || "pending"),
      createdAt: row.created_at
    }))
  });
}

async function handlePublicBakeryBookingsAsBuyer(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  await ensureBakeryBookingsTable();
  const [rows] = await pool.execute(
    `SELECT b.id, b.service_id, b.customer_name, b.customer_phone, b.event_date, b.occasion_type, b.style_theme, b.request_details, b.budget_amount, b.booking_status, b.created_at, b.service_line, b.payment_preference,
            b.requested_start_time, b.confirmed_start_time, b.confirmed_duration_minutes,
            s.work_title, s.business_name
     FROM bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     WHERE b.buyer_user_id = ?
     ORDER BY b.id DESC
     LIMIT 40`,
    [Number(session.user_id)]
  );
  return sendJson(res, 200, {
    ok: true,
    bookings: rows.map((row) => ({
      id: Number(row.id),
      serviceId: Number(row.service_id),
      businessName: String(row.business_name || ""),
      workTitle: String(row.work_title || ""),
      customerName: String(row.customer_name || ""),
      customerPhone: String(row.customer_phone || ""),
      eventDate: row.event_date,
      occasionType: String(row.occasion_type || ""),
      requestedStartTime: row.requested_start_time == null ? null : String(row.requested_start_time || ""),
      confirmedStartTime: row.confirmed_start_time == null ? null : String(row.confirmed_start_time || ""),
      confirmedDurationMinutes:
        row.confirmed_duration_minutes == null ? null : Number(row.confirmed_duration_minutes),
      preferredTime:
        normalizeBakerySlotHHMM(row.requested_start_time) ||
        extractTimePreferenceFromOccasion(row.occasion_type) ||
        null,
      styleTheme: String(row.style_theme || ""),
      requestDetails: String(row.request_details || ""),
      budgetAmount: row.budget_amount == null ? null : Number(row.budget_amount),
      bookingStatus: String(row.booking_status || "pending"),
      serviceLine: row.service_line == null ? null : String(row.service_line || ""),
      paymentPreference: row.payment_preference == null ? null : String(row.payment_preference || ""),
      createdAt: row.created_at
    }))
  });
}

async function handlePublicBakeryBookingsClearMine(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryBookingsTable();
  const body = await readJson(req).catch(() => ({}));
  const serviceLine = String((body && body.serviceLine) || "").trim().toLowerCase();
  let sql =
    `UPDATE bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     SET b.booking_status = 'declined'
     WHERE b.baker_user_id = ?
       AND b.booking_status IN ('pending','confirmed')`;
  const params = [Number(session.user_id)];
  if (serviceLine) {
    sql += " AND LOWER(COALESCE(b.service_line, s.style_theme, '')) LIKE ?";
    params.push(serviceLine + "%");
  }
  const [result] = await pool.execute(sql, params);
  return sendJson(res, 200, { ok: true, cleared: Number((result && result.affectedRows) || 0) });
}

async function handlePublicBakeryBookingsPurgeCalendarClosed(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingEventsTable();
  await ensureBakeryBookingMessagesTable();
  const body = await readJson(req).catch(() => ({}));
  const eventDate = String((body && body.eventDate) || "").trim().slice(0, 10);
  const serviceLine = String((body && body.serviceLine) || "").trim().toLowerCase();
  const bakerId = Number(session.user_id);
  let sql = `SELECT b.id
     FROM bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     WHERE b.baker_user_id = ?
       AND LOWER(TRIM(b.booking_status)) IN ('declined','completed','cancelled')`;
  const params = [bakerId];
  if (eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    sql += " AND b.event_date = ?";
    params.push(eventDate);
  }
  if (serviceLine) {
    sql += " AND LOWER(COALESCE(b.service_line, s.style_theme, '')) LIKE ?";
    params.push(`${serviceLine}%`);
  }
  const [idRows] = await pool.execute(sql, params);
  const ids = (Array.isArray(idRows) ? idRows : [])
    .map((r) => Number(r.id))
    .filter((id) => id > 0);
  if (!ids.length) {
    return sendJson(res, 200, { ok: true, removed: 0 });
  }
  const ph = ids.map(() => "?").join(",");
  try {
    await pool.execute(`DELETE FROM bakery_booking_messages WHERE booking_id IN (${ph})`, ids);
  } catch {
    /* ignore */
  }
  try {
    await pool.execute(`DELETE FROM bakery_booking_events WHERE booking_id IN (${ph})`, ids);
  } catch {
    /* ignore */
  }
  const [del] = await pool.execute(`DELETE FROM bakery_bookings WHERE id IN (${ph})`, ids);
  return sendJson(res, 200, { ok: true, removed: Number((del && del.affectedRows) || ids.length) });
}

async function handlePublicBakeryBookingStatusUpdate(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingEventsTable();
  const body = await readJson(req);
  const bookingId = Number(body.bookingId || 0);
  const status = String(body.status || "").trim().toLowerCase();
  const allowed = new Set(["pending", "confirmed", "declined", "completed"]);
  if (!bookingId || !allowed.has(status)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_BOOKING_STATUS" });
  }
  const [beforeRows] = await pool.execute(
    `SELECT b.id, b.service_id, b.event_date, b.occasion_type, b.requested_start_time, b.buyer_user_id, b.booking_status, s.work_title, s.slot_duration_minutes
     FROM bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     WHERE b.id = ? AND b.baker_user_id = ?
     LIMIT 1`,
    [bookingId, Number(session.user_id)]
  );
  const before = beforeRows[0];
  if (!before) {
    return sendJson(res, 404, { ok: false, code: "BOOKING_NOT_FOUND" });
  }
  const fromStatus = String(before.booking_status || "pending").toLowerCase();
  const transition = isAllowedBookingStatusTransition(fromStatus, status);
  if (transition.noop) {
    return sendJson(res, 200, { ok: true, bookingId, status, noop: true });
  }
  if (!transition.ok) {
    return sendJson(res, 400, {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      message: `Cannot move booking from "${fromStatus}" to "${status}".`
    });
  }
  await pool.execute(
    `UPDATE bakery_bookings
     SET booking_status = ?
     WHERE id = ? AND baker_user_id = ?
     LIMIT 1`,
    [status, bookingId, Number(session.user_id)]
  );
  if (status === "confirmed") {
    const rawDur = Number(body.durationMinutes || 0);
    const fallbackDur = Number(before.slot_duration_minutes || 60) || 60;
    const durationMinutes = Number.isFinite(rawDur) && rawDur >= 15 && rawDur <= 480 ? Math.round(rawDur) : fallbackDur;
    const dateKey = String(before.event_date || "").slice(0, 10);
    let start =
      normalizeBakerySlotHHMM(before.requested_start_time) ||
      extractTimePreferenceFromOccasion(before.occasion_type) ||
      "";
    if (dateKey && Number(before.service_id || 0) > 0 && start) {
      try {
        await deleteBakerySlotsInRange(pool, Number(before.service_id), dateKey, start, durationMinutes);
      } catch {
        /* do not fail accept if slot cleanup fails */
      }
      try {
        await pool.execute(
          `UPDATE bakery_bookings
           SET confirmed_start_time = ?, confirmed_duration_minutes = ?
           WHERE id = ? AND baker_user_id = ?
           LIMIT 1`,
          [start, durationMinutes, bookingId, Number(session.user_id)]
        );
      } catch {
        /* ignore persist failures on older schemas */
      }
    }
  }
  try {
    await pool.execute(
      `INSERT INTO bakery_booking_events (booking_id, actor_user_id, from_status, to_status, note) VALUES (?, ?, ?, ?, NULL)`,
      [bookingId, Number(session.user_id), fromStatus, status]
    );
  } catch {
    /* ignore audit failures */
  }
  const mbUrl = `${resolvePublicWebBaseUrl(req)}/my-business.html`;
  const mbClientDeep = `${mbUrl}#mb-client-service-desk`;
  const buyerId = Number(before.buyer_user_id || 0);
  if (buyerId && (status === "confirmed" || status === "declined")) {
    try {
      await sendPushToUser(pool, {
        userId: buyerId,
        title: status === "confirmed" ? "Booking confirmed" : "Booking update",
        message:
          status === "confirmed"
            ? `Your booking #${bookingId} for "${String(before.work_title || "service")}" was accepted. You can message your provider in My Business.`
            : `Your booking request #${bookingId} was declined. Pick another time or provider when you are ready.`,
        deepLink: mbClientDeep,
        eventType: "bakery_booking_status"
      });
    } catch {
      /* ignore */
    }
    const buyerEmail = await getUserEmailById(buyerId);
    if (buyerEmail) {
      if (status === "confirmed") {
        queueUserTransactionalEmail(
          buyerEmail,
          "Your booking was accepted",
          [
            `Good news — booking #${bookingId} for "${String(before.work_title || "service")}" was accepted.`,
            "You can message your provider in My Business after you open your client session.",
            mbUrl
          ].join("\n")
        );
      } else {
        queueUserTransactionalEmail(
          buyerEmail,
          "Booking update",
          [`Your booking request #${bookingId} was declined. You can send a new request when you are ready.`, mbUrl].join("\n")
        );
      }
    }
  }
  if (buyerId && status === "completed") {
    try {
      await sendPushToUser(pool, {
        userId: buyerId,
        title: "Booking completed",
        message: `Booking #${bookingId} for "${String(before.work_title || "service")}" was marked complete by your provider.`,
        deepLink: mbClientDeep,
        eventType: "bakery_booking_status"
      });
    } catch {
      /* ignore */
    }
    const buyerEmailDone = await getUserEmailById(buyerId);
    if (buyerEmailDone) {
      queueUserTransactionalEmail(
        buyerEmailDone,
        "Booking completed",
        [
          `Your provider marked booking #${bookingId} for "${String(before.work_title || "service")}" as complete.`,
          mbUrl
        ].join("\n")
      );
    }
  }
  return sendJson(res, 200, { ok: true, bookingId, status });
}

async function handlePublicBakeryBookingDetail(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  let bookingId = 0;
  try {
    const urlObj = new URL(req.url, "http://localhost");
    bookingId = Number(urlObj.searchParams.get("bookingId") || 0);
  } catch {
    bookingId = 0;
  }
  if (!bookingId) {
    return sendJson(res, 400, { ok: false, code: "BOOKING_ID_REQUIRED" });
  }
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingStripeColumns(pool);
  const [rows] = await pool.execute(
    `SELECT b.id, b.service_id, b.baker_user_id, b.buyer_user_id, b.customer_name, b.customer_phone, b.event_date, b.booking_status,
            b.occasion_type, b.style_theme, b.request_details, b.budget_amount, b.payment_preference, b.service_line,
            b.stripe_payment_status, b.stripe_paid_amount,
            b.requested_start_time, b.confirmed_start_time, b.confirmed_duration_minutes,
            s.work_title, s.business_name
     FROM bakery_bookings b
     JOIN bakery_services s ON s.id = b.service_id
     WHERE b.id = ?
     LIMIT 1`,
    [bookingId]
  );
  const row = rows[0];
  if (!row) {
    return sendJson(res, 404, { ok: false, code: "BOOKING_NOT_FOUND" });
  }
  const uid = Number(session.user_id);
  if (Number(row.baker_user_id) !== uid && Number(row.buyer_user_id || 0) !== uid) {
    return sendJson(res, 403, { ok: false, code: "BOOKING_FORBIDDEN" });
  }
  return sendJson(res, 200, {
    ok: true,
    booking: {
      id: Number(row.id),
      serviceId: Number(row.service_id),
      bakerUserId: Number(row.baker_user_id),
      buyerUserId: row.buyer_user_id == null ? null : Number(row.buyer_user_id),
      customerName: String(row.customer_name || ""),
      customerPhone: row.customer_phone == null ? "" : String(row.customer_phone || ""),
      eventDate: row.event_date,
      bookingStatus: String(row.booking_status || "pending"),
      occasionType: String(row.occasion_type || ""),
      requestedStartTime: row.requested_start_time == null ? null : String(row.requested_start_time || ""),
      confirmedStartTime: row.confirmed_start_time == null ? null : String(row.confirmed_start_time || ""),
      confirmedDurationMinutes:
        row.confirmed_duration_minutes == null ? null : Number(row.confirmed_duration_minutes),
      preferredTime:
        normalizeBakerySlotHHMM(row.requested_start_time) ||
        extractTimePreferenceFromOccasion(row.occasion_type) ||
        null,
      styleTheme: String(row.style_theme || ""),
      requestDetails: String(row.request_details || ""),
      budgetAmount: row.budget_amount == null ? null : Number(row.budget_amount),
      paymentPreference: row.payment_preference == null ? null : String(row.payment_preference || ""),
      serviceLine: row.service_line == null ? null : String(row.service_line || ""),
      workTitle: String(row.work_title || ""),
      businessName: String(row.business_name || ""),
      stripePaymentStatus: row.stripe_payment_status == null ? null : String(row.stripe_payment_status || ""),
      stripePaidAmount: row.stripe_paid_amount == null ? null : Number(row.stripe_paid_amount)
    }
  });
}

async function handlePublicBakeryBookingMessagesList(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  let bookingId = 0;
  try {
    const urlObj = new URL(req.url, "http://localhost");
    bookingId = Number(urlObj.searchParams.get("bookingId") || 0);
  } catch {
    bookingId = 0;
  }
  if (!bookingId) {
    return sendJson(res, 400, { ok: false, code: "BOOKING_ID_REQUIRED" });
  }
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingMessagesTable();
  const [bRows] = await pool.execute(
    `SELECT id, baker_user_id, buyer_user_id, booking_status FROM bakery_bookings WHERE id = ? LIMIT 1`,
    [bookingId]
  );
  const b = bRows[0];
  if (!b) {
    return sendJson(res, 404, { ok: false, code: "BOOKING_NOT_FOUND" });
  }
  const uid = Number(session.user_id);
  if (Number(b.baker_user_id) !== uid && Number(b.buyer_user_id || 0) !== uid) {
    return sendJson(res, 403, { ok: false, code: "BOOKING_FORBIDDEN" });
  }
  if (String(b.booking_status || "").toLowerCase() !== "confirmed") {
    return sendJson(res, 400, { ok: false, code: "CHAT_NOT_AVAILABLE", message: "Chat opens after the provider accepts." });
  }
  const [msgs] = await pool.execute(
    `SELECT id, sender_user_id, body, created_at
     FROM bakery_booking_messages
     WHERE booking_id = ?
     ORDER BY id ASC
     LIMIT 200`,
    [bookingId]
  );
  const bakerId = Number(b.baker_user_id);
  return sendJson(res, 200, {
    ok: true,
    messages: msgs.map((m) => {
      const sid = Number(m.sender_user_id);
      let senderLabel = "Participant";
      if (sid === uid) {
        senderLabel = "You";
      } else if (sid === bakerId) {
        senderLabel = "Provider";
      } else {
        senderLabel = "Client";
      }
      return {
        id: Number(m.id),
        senderUserId: sid,
        senderLabel,
        body: String(m.body || ""),
        createdAt: m.created_at
      };
    })
  });
}

async function handlePublicBakeryBookingMessagesPost(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const body = await readJson(req);
  const bookingId = Number(body.bookingId || 0);
  const text = String(body.message || body.body || "").trim().slice(0, 2000);
  if (!bookingId || text.length < 1) {
    return sendJson(res, 400, { ok: false, code: "MESSAGE_FIELDS_REQUIRED" });
  }
  await ensureBakeryBookingsTable();
  await ensureBakeryBookingMessagesTable();
  const [bRows] = await pool.execute(
    `SELECT id, baker_user_id, buyer_user_id, booking_status FROM bakery_bookings WHERE id = ? LIMIT 1`,
    [bookingId]
  );
  const b = bRows[0];
  if (!b) {
    return sendJson(res, 404, { ok: false, code: "BOOKING_NOT_FOUND" });
  }
  const uid = Number(session.user_id);
  if (Number(b.baker_user_id) !== uid && Number(b.buyer_user_id || 0) !== uid) {
    return sendJson(res, 403, { ok: false, code: "BOOKING_FORBIDDEN" });
  }
  if (String(b.booking_status || "").toLowerCase() !== "confirmed") {
    return sendJson(res, 400, { ok: false, code: "CHAT_NOT_AVAILABLE" });
  }
  await pool.execute(
    `INSERT INTO bakery_booking_messages (booking_id, sender_user_id, body) VALUES (?, ?, ?)`,
    [bookingId, uid, text]
  );
  const other =
    Number(b.baker_user_id) === uid ? Number(b.buyer_user_id || 0) : Number(b.baker_user_id);
  if (other) {
    try {
      await sendPushToUser(pool, {
        userId: other,
        title: "New booking message",
        message: `You have a new message on booking #${bookingId}.`,
        deepLink: `${resolvePublicWebBaseUrl(req)}/my-business.html`,
        eventType: "bakery_booking_message"
      });
    } catch {
      /* ignore */
    }
  }
  try {
    broadcastBookingChatRefresh(bookingId);
  } catch {
    /* ignore */
  }
  return sendJson(res, 200, { ok: true });
}

async function ensureOrderSettlementTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS order_settlements (
      order_id BIGINT UNSIGNED PRIMARY KEY,
      buyer_confirmed_at DATETIME NULL,
      seller_confirmed_at DATETIME NULL,
      released_at DATETIME NULL,
      seller_user_id BIGINT UNSIGNED NOT NULL,
      seller_shop_id BIGINT UNSIGNED NOT NULL,
      seller_payout_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      service_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
      payout_status VARCHAR(30) NOT NULL DEFAULT 'pending',
      payout_reference VARCHAR(160) NULL,
      assistant_summary TEXT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
}

async function ensureSellerPayoutAccountsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS seller_payout_accounts (
      seller_user_id BIGINT UNSIGNED PRIMARY KEY,
      stripe_account_id VARCHAR(80) NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
}

function resolveShippingQuote(methodRaw, isCrossBorder, subtotal) {
  const method = String(methodRaw || "standard").trim().toLowerCase();
  const shippingRates = isCrossBorder
    ? { pickup: 0, economy: 9.5, standard: 14.5, express: 19.5 }
    : { pickup: 0, economy: 4.5, standard: 6.5, express: 9.5 };
  const safeMethod = shippingRates[method] != null ? method : "standard";
  const shippingFee = Number(shippingRates[safeMethod].toFixed(2));
  const serviceFee = Number((Number(subtotal || 0) * 0.03).toFixed(2));
  return {
    method: safeMethod,
    shippingFee,
    serviceFee,
    estimatedTotal: Number((Number(subtotal || 0) + shippingFee + serviceFee).toFixed(2))
  };
}

function buildOrderAssistantSummary(order, settlement) {
  const buyerDone = Boolean(settlement && settlement.buyer_confirmed_at);
  const sellerDone = Boolean(settlement && settlement.seller_confirmed_at);
  if (!buyerDone && !sellerDone) {
    return "AI mediator: waiting for buyer and seller confirmation. Funds remain protected in escrow until both sides confirm delivery details.";
  }
  if (buyerDone && !sellerDone) {
    return "AI mediator: buyer confirmed. Seller confirmation is pending. Auto-release will run immediately once seller confirms.";
  }
  if (!buyerDone && sellerDone) {
    return "AI mediator: seller confirmed dispatch/completion. Buyer confirmation is pending before escrow release.";
  }
  if (settlement && settlement.released_at) {
    return `AI mediator: both sides confirmed. Escrow released automatically. Seller payout sent (${Number(
      settlement.seller_payout_amount || 0
    ).toFixed(2)} ${String(settlement.currency || "EUR")}) and service fee retained by platform.`;
  }
  return `AI mediator: both sides confirmed. Finalizing automatic payout now for order #${Number(order?.id || 0)}.`;
}

async function tryReleaseOrderSettlement(orderId) {
  await ensureOrderSettlementTable();
  const [rows] = await pool.execute(
    `SELECT os.order_id, os.buyer_confirmed_at, os.seller_confirmed_at, os.released_at, os.seller_user_id, os.seller_payout_amount, os.service_fee_amount, os.currency,
            o.status
     FROM order_settlements os
     JOIN orders o ON o.id = os.order_id
     WHERE os.order_id = ?
     LIMIT 1`,
    [Number(orderId)]
  );
  const row = rows[0];
  if (!row) return { ok: false, code: "ORDER_SETTLEMENT_NOT_FOUND" };
  const buyerConfirmed = Boolean(row.buyer_confirmed_at);
  const sellerConfirmed = Boolean(row.seller_confirmed_at);
  if (!buyerConfirmed || !sellerConfirmed) {
    return { ok: true, released: false };
  }
  if (row.released_at) {
    return { ok: true, released: true, alreadyReleased: true, payoutStatus: row.payout_status || "released" };
  }
  let payoutStatus = "released_no_connect";
  let payoutReference = "";
  await ensureSellerPayoutAccountsTable();
  const [acctRows] = await pool.execute(
    `SELECT stripe_account_id
     FROM seller_payout_accounts
     WHERE seller_user_id = ?
     LIMIT 1`,
    [Number(row.seller_user_id)]
  );
  const stripeAccountId = String(acctRows[0]?.stripe_account_id || "").trim();
  if (stripe && stripeAccountId) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.max(1, Math.round(Number(row.seller_payout_amount || 0) * 100)),
        currency: String(row.currency || "EUR").toLowerCase(),
        destination: stripeAccountId,
        description: `VibeCart order payout #${Number(orderId)}`,
        transfer_group: `order_${Number(orderId)}`
      });
      payoutStatus = "released";
      payoutReference = String(transfer.id || "");
    } catch {
      payoutStatus = "release_failed";
    }
  }
  await pool.execute(
    `UPDATE order_settlements
     SET released_at = CURRENT_TIMESTAMP,
         payout_status = ?,
         payout_reference = ?
     WHERE order_id = ?
     LIMIT 1`,
    [payoutStatus, payoutReference || null, Number(orderId)]
  );
  await pool.execute(`UPDATE orders SET status = 'completed' WHERE id = ? LIMIT 1`, [Number(orderId)]);
  await pool.execute(
    `INSERT INTO order_status_updates (
      order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
    ) VALUES (?, 'escrow_released', ?, 'system', 1, 1)`,
    [
      Number(orderId),
      payoutStatus === "released"
        ? "Both parties confirmed. Escrow released and seller payout sent automatically."
        : "Both parties confirmed. Escrow released; seller payout queued (Stripe Connect account required)."
    ]
  );
  return { ok: true, released: true, payoutStatus, payoutReference };
}

function normalizePublicShopSlugPart(input) {
  const raw = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return raw || "shop";
}

async function handlePublicSellerShopEnsure(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const session = await requirePublicSessionRole(req, res, new Set(["seller", "buyer", "service_provider"]));
  if (!session) {
    return;
  }
  let body = {};
  try {
    body = await readJson(req);
  } catch {
    body = {};
  }
  const uid = Number(session.user_id);
  const [haveRows] = await pool.execute(
    `SELECT id, name FROM shops WHERE owner_user_id = ? AND active = 1 ORDER BY id ASC LIMIT 1`,
    [uid]
  );
  const have = haveRows[0];
  if (have && Number(have.id || 0) > 0) {
    return sendJson(res, 200, {
      ok: true,
      already: true,
      shop: { id: Number(have.id), name: String(have.name || "") }
    });
  }
  const brand = String(body.shopName || body.name || "My VibeCart shop").trim().slice(0, 120) || "My VibeCart shop";
  const slug = `${normalizePublicShopSlugPart(brand)}-${uid}-${crypto.randomBytes(2).toString("hex")}`;
  const desc = String(body.description || "Shop created from guided selling.").trim().slice(0, 500);
  const [ins] = await pool.execute(
    `INSERT INTO shops (owner_user_id, name, slug, description, active) VALUES (?, ?, ?, ?, 1)`,
    [uid, brand, slug, desc || null]
  );
  return sendJson(res, 200, {
    ok: true,
    shop: { id: Number(ins.insertId), name: brand, slug }
  });
}

async function handlePublicProductPublish(req, res) {
  /** Same shop ownership gate as listings; buyers/providers with an active shop can publish. */
  const session = await requirePublicSessionRole(req, res, new Set(["seller", "buyer", "service_provider"]));
  if (!session) {
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }

  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const categoryName = normalizeProductCategoryName(body.categoryName || body.category || "");
  const originCountry = String(body.originCountry || session.country_code || "").trim().toUpperCase();
  const currency = String(body.currency || "EUR").trim().toUpperCase();
  const basePrice = Number(body.basePrice != null ? body.basePrice : body.price);
  const stockRaw = Number(body.stock != null ? body.stock : 1);
  const stock = Number.isFinite(stockRaw) ? Math.max(1, Math.min(9999, Math.floor(stockRaw))) : 1;

  if (title.length < 4 || title.length > 180) {
    return sendJson(res, 400, { ok: false, code: "INVALID_TITLE", message: "Title must be 4-180 characters." });
  }
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return sendJson(res, 400, { ok: false, code: "INVALID_PRICE", message: "Enter a valid positive price." });
  }
  if (currency.length !== 3) {
    return sendJson(res, 400, { ok: false, code: "INVALID_CURRENCY", message: "Currency must be a 3-letter code." });
  }
  if (originCountry.length !== 2) {
    return sendJson(res, 400, { ok: false, code: "INVALID_COUNTRY", message: "Origin country must be an ISO-2 code." });
  }

  const [shopRows] = await pool.execute(
    `SELECT id, name
     FROM shops
     WHERE owner_user_id = ? AND active = 1
     ORDER BY id ASC
     LIMIT 1`,
    [Number(session.user_id)]
  );
  const shop = shopRows[0];
  if (!shop || Number(shop.id || 0) <= 0) {
    return sendJson(res, 404, { ok: false, code: "SHOP_NOT_FOUND", message: "Seller shop was not found." });
  }

  const category = await ensureCategoryIdByName(categoryName);
  const [insertResult] = await pool.execute(
    `INSERT INTO products (
      shop_id, category_id, title, description, base_price, currency, stock, origin_country, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      Number(shop.id),
      Number(category.categoryId),
      title,
      description || null,
      Number(basePrice.toFixed(2)),
      currency,
      stock,
      originCountry
    ]
  );

  return sendJson(res, 200, {
    ok: true,
    product: {
      id: Number(insertResult.insertId),
      shopId: Number(shop.id),
      shopName: String(shop.name || ""),
      categoryId: Number(category.categoryId),
      categoryName: String(category.categoryName),
      title,
      description,
      basePrice: Number(basePrice.toFixed(2)),
      currency,
      stock,
      originCountry,
      status: "active"
    }
  });
}

async function handlePublicAuthRegister(req, res) {
  const body = await readJson(req);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const roleRaw = String(body.role || "buyer").trim().toLowerCase();
  const role = roleRaw === "seller" ? "seller" : "buyer";
  const fullName = String(body.fullName || "").trim();
  const countryCode = String(body.countryCode || "").trim().toUpperCase();

  if (!isValidEmail(email) || fullName.length < 2 || countryCode.length !== 2) {
    return sendJson(res, 400, { ok: false, code: "INVALID_SIGNUP_INPUT" });
  }
  if (role === "seller" && password.length < 8) {
    return sendJson(res, 400, {
      ok: false,
      code: "INVALID_SIGNUP_INPUT",
      message: "Service providers must create a password (8+ characters)."
    });
  }
  if (role === "buyer" && password.length > 0 && password.length < 8) {
    return sendJson(res, 400, {
      ok: false,
      code: "INVALID_SIGNUP_INPUT",
      message: "Password must be at least 8 characters, or leave it blank for email sign-in later."
    });
  }

  const [existingRows] = await pool.execute(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  if (existingRows.length > 0) {
    return sendJson(res, 409, { ok: false, code: "EMAIL_ALREADY_EXISTS" });
  }

  let effectivePassword = password;
  if (role === "buyer" && (!password || password.length < 8)) {
    effectivePassword = `${crypto.randomBytes(28).toString("base64url")}Aa1!`;
  }

  const saltHex = crypto.randomBytes(16).toString("hex");
  const passwordHash = `${saltHex}:${hashPublicPassword(effectivePassword, saltHex)}`;
  const [insertUser] = await pool.execute(
    `INSERT INTO users (email, password_hash, full_name, role, country_code, is_verified)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [email, passwordHash, fullName, role, countryCode]
  );
  const userId = Number(insertUser.insertId);

  if (role === "seller") {
    const baseSlug = String(fullName || "seller")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 36) || "seller";
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const shopSlug = `${baseSlug}-${randomSuffix}`;
    await pool.execute(
      `INSERT INTO shops (owner_user_id, name, slug, description, active)
       VALUES (?, ?, ?, ?, 1)`,
      [userId, `${fullName} Shop`, shopSlug, "Seller storefront created automatically at signup."]
    );
  }

  const deviceBinding = String(body.deviceBinding || "").trim();
  const session = await createPublicSession(
    userId,
    getIp(req),
    String(req.headers["user-agent"] || ""),
    deviceBinding
  );
  setPublicAuthCookie(res, session.token, session.expiresAt);
  return sendJson(res, 200, {
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: userId,
      email,
      fullName,
      role,
      countryCode,
      isVerified: false
    }
  });
}

async function handlePublicAuthLogin(req, res) {
  const body = await readJson(req);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "").trim().toLowerCase();
  const deviceBinding = String(body.deviceBinding || "").trim();
  const ip = getIp(req);
  if (!isValidEmail(email) || !password) {
    return sendJson(res, 400, { ok: false, code: "INVALID_LOGIN_INPUT" });
  }
  if (isLoginLimited(ip, email)) {
    return sendJson(res, 429, { ok: false, code: "LOGIN_RATE_LIMITED" });
  }

  const [rows] = await pool.execute(
    `SELECT id, email, password_hash, full_name, role, country_code, is_verified
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  const user = rows[0];
  if (!user || !verifyPublicPassword(password, user.password_hash)) {
    return sendJson(res, 401, { ok: false, code: "INVALID_CREDENTIALS" });
  }
  if (
    role &&
    role !== "citizen" &&
    (role === "buyer" || role === "seller") &&
    String(user.role || "").toLowerCase() !== role
  ) {
    return sendJson(res, 403, { ok: false, code: "ROLE_MISMATCH" });
  }

  clearLoginLimit(ip, email);
  const session = await createPublicSession(
    Number(user.id),
    ip,
    String(req.headers["user-agent"] || ""),
    deviceBinding
  );
  setPublicAuthCookie(res, session.token, session.expiresAt);
  return sendJson(res, 200, {
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: Number(user.id),
      email: String(user.email),
      fullName: String(user.full_name),
      role: String(user.role),
      countryCode: String(user.country_code),
      isVerified: Boolean(user.is_verified)
    }
  });
}

/**
 * Buyer-only passwordless return: sends a one-time link when SMTP is configured.
 * Always responds generically on success-shaped paths to reduce email enumeration.
 */
async function handlePublicAuthMagicLinkRequest(req, res) {
  const ip = getIp(req);
  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const email = String(body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_EMAIL" });
  }
  if (isMagicLinkEmailLimited(ip, email)) {
    return sendJson(res, 429, { ok: false, code: "MAGIC_LINK_RATE_LIMITED" });
  }
  const transporter = getLogoSmtpTransporter();
  if (!transporter) {
    return sendJson(res, 503, {
      ok: false,
      code: "SMTP_NOT_CONFIGURED",
      message: "Email sign-in is not available on this server yet. Service providers can sign in with a password."
    });
  }
  try {
    await ensurePublicMagicLoginTokensTable();
  } catch (e) {
    return sendJson(res, 500, { ok: false, code: "MAGIC_LINK_DB_ERROR" });
  }

  const [rows] = await pool.execute(
    `SELECT id, role FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  const userRow = rows[0];
  const okBuyer = userRow && String(userRow.role || "").toLowerCase() === "buyer";
  if (okBuyer) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await pool.execute(`DELETE FROM public_magic_login_tokens WHERE user_id = ? AND consumed_at IS NULL`, [
      Number(userRow.id)
    ]);
    await pool.execute(
      `INSERT INTO public_magic_login_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [Number(userRow.id), tokenHash, expiresAt]
    );
    const baseUrl = resolvePublicWebBaseUrl(req);
    const link = `${baseUrl}/lane-passport.html?magic_login=${encodeURIComponent(rawToken)}`;
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "Your VibeCart sign-in link",
        text:
          "Use this one-time link to sign in to VibeCart (valid about 30 minutes). If you did not request this, ignore this email.\n\n" +
          link +
          "\n\n" +
          `Request IP: ${ip}\n`
      });
    } catch (error) {
      return sendJson(res, 502, {
        ok: false,
        code: "EMAIL_SEND_FAILED",
        message: String(error.message || error).slice(0, 200)
      });
    }
  }
  return sendJson(res, 200, {
    ok: true,
    sent: true,
    message: "If that email is a shopper account, we sent a sign-in link. Check your inbox and spam folder."
  });
}

async function handlePublicAuthMagicLinkConsume(req, res) {
  let rawToken = "";
  try {
    const urlObj = new URL(req.url, "http://localhost");
    rawToken = String(urlObj.searchParams.get("token") || "").trim();
  } catch {
    rawToken = "";
  }
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_MAGIC_TOKEN" });
  }
  try {
    await ensurePublicMagicLoginTokensTable();
  } catch {
    return sendJson(res, 500, { ok: false, code: "MAGIC_LINK_DB_ERROR" });
  }
  const tokenHash = sha256(rawToken);
  const [tokRows] = await pool.execute(
    `SELECT t.id AS tid, t.user_id, t.expires_at, t.consumed_at, u.email, u.full_name, u.role, u.country_code, u.is_verified
     FROM public_magic_login_tokens t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );
  const row = tokRows[0];
  if (!row || String(row.role || "").toLowerCase() !== "buyer") {
    return sendJson(res, 400, { ok: false, code: "MAGIC_TOKEN_INVALID" });
  }
  if (row.consumed_at) {
    return sendJson(res, 400, { ok: false, code: "MAGIC_TOKEN_USED" });
  }
  const exp = new Date(row.expires_at).getTime();
  if (!Number.isFinite(exp) || exp < Date.now()) {
    return sendJson(res, 400, { ok: false, code: "MAGIC_TOKEN_EXPIRED" });
  }
  await pool.execute(`UPDATE public_magic_login_tokens SET consumed_at = NOW() WHERE id = ?`, [Number(row.tid)]);
  const deviceBinding = String(getDeviceBindingFromRequest(req) || "").trim();
  const session = await createPublicSession(
    Number(row.user_id),
    getIp(req),
    String(req.headers["user-agent"] || ""),
    deviceBinding
  );
  setPublicAuthCookie(res, session.token, session.expiresAt);
  return sendJson(res, 200, {
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: Number(row.user_id),
      email: String(row.email),
      fullName: String(row.full_name),
      role: String(row.role),
      countryCode: String(row.country_code),
      isVerified: Boolean(row.is_verified)
    }
  });
}

async function handlePublicAuthSession(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    clearPublicAuthCookie(res);
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    clearPublicAuthCookie(res);
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const rotated = await maybeRotatePublicSessionToken(session);
  const payload = {
    ok: true,
    user: {
      id: Number(session.user_id),
      email: String(session.email),
      fullName: String(session.full_name),
      role: String(session.role),
      countryCode: String(session.country_code),
      isVerified: Boolean(session.is_verified)
    }
  };
  if (rotated && rotated.token) {
    payload.token = rotated.token;
    payload.expiresAt = rotated.expiresAt;
    setPublicAuthCookie(res, rotated.token, rotated.expiresAt);
  }
  return sendJson(res, 200, payload);
}

async function handlePublicAuthSessionRoleUpdate(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    clearPublicAuthCookie(res);
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const want = String(body.role || "").trim().toLowerCase();
  if (want !== "buyer" && want !== "seller" && want !== "citizen") {
    return sendJson(res, 400, { ok: false, code: "INVALID_ROLE" });
  }
  const dbRole = want === "citizen" ? "buyer" : want;
  const uid = Number(session.user_id);
  await pool.execute(`UPDATE users SET role = ? WHERE id = ? LIMIT 1`, [dbRole, uid]);
  const [urows] = await pool.execute(
    `SELECT id, email, full_name, role, country_code, is_verified FROM users WHERE id = ? LIMIT 1`,
    [uid]
  );
  const u = urows[0];
  if (!u) {
    return sendJson(res, 500, { ok: false, code: "USER_MISSING" });
  }
  return sendJson(res, 200, {
    ok: true,
    passportMode: want,
    user: {
      id: Number(u.id),
      email: String(u.email),
      fullName: String(u.full_name),
      role: String(u.role),
      countryCode: String(u.country_code),
      isVerified: Boolean(u.is_verified)
    }
  });
}

async function handlePublicAuthLogout(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    clearPublicAuthCookie(res);
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    clearPublicAuthCookie(res);
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  await pool.execute(
    `UPDATE user_auth_sessions
     SET revoked_at = NOW()
     WHERE id = ?
     LIMIT 1`,
    [Number(session.id)]
  );
  clearPublicAuthCookie(res);
  return sendJson(res, 200, { ok: true });
}

function isLogoEmailIpLimited(ip) {
  const now = Date.now();
  const item = logoEmailIpHits.get(ip) || { count: 0, start: now };
  if (now - item.start > LOGO_EMAIL_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  logoEmailIpHits.set(ip, item);
  return item.count > LOGO_EMAIL_MAX_PER_HOUR;
}

function getLogoSmtpTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  if (!logoSmtpTransporter) {
    logoSmtpTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }
  return logoSmtpTransporter;
}

function isValidLogoRecipientEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (e.length < 5 || e.length > 120) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function handlePublicBrandEmailLogo(req, res, ip) {
  if (!BRAND_LOGO_EMAIL_ENABLED) {
    return sendJson(res, 503, { ok: false, code: "FEATURE_DISABLED" });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }

  if (String(body.website || "").trim() !== "") {
    return sendJson(res, 400, { ok: false, code: "INVALID_REQUEST" });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!isValidLogoRecipientEmail(email)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_EMAIL" });
  }

  const transporter = getLogoSmtpTransporter();
  if (!transporter) {
    return sendJson(res, 503, { ok: false, code: "SMTP_NOT_CONFIGURED" });
  }

  const iconPath = path.join(__dirname, "icon.svg");
  let iconSvg;
  try {
    iconSvg = await fs.readFile(iconPath);
  } catch {
    return sendJson(res, 500, { ok: false, code: "LOGO_FILE_MISSING" });
  }

  const maskPath = path.join(__dirname, "icon-maskable.svg");
  const attachments = [
    {
      filename: "vibecart-icon.svg",
      content: iconSvg,
      contentType: "image/svg+xml"
    }
  ];
  if (fsSync.existsSync(maskPath)) {
    attachments.push({
      filename: "vibecart-icon-maskable.svg",
      content: await fs.readFile(maskPath),
      contentType: "image/svg+xml"
    });
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: "Your VibeCart logo files (SVG)",
      text:
        "Attached are the VibeCart SVG logo files from the official site bundle.\n\n" +
        "Use them according to your brand guidelines and any trademark rules that apply to your jurisdiction.\n\n" +
        `Request IP (for abuse monitoring): ${ip}\n`
      ,
      attachments
    });
  } catch (error) {
    return sendJson(res, 502, {
      ok: false,
      code: "EMAIL_SEND_FAILED",
      message: String(error.message || error).slice(0, 200)
    });
  }

  return sendJson(res, 200, { ok: true });
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

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total > 2_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

/** Raw binary upload (e.g. phone photo/video) with a higher cap than readJson. */
async function readUploadBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("FILE_TOO_LARGE"));
        try {
          req.destroy();
        } catch {
          /* ignore */
        }
        return;
      }
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

const BAKERY_MEDIA_ROOT = path.join(process.cwd(), "uploads", "bakery-media");
const BAKERY_MEDIA_MAX_BYTES = 26_214_400; /* 25 MiB */
const BAKERY_MEDIA_IMAGE_MAX = 12_582_912; /* 12 MiB decoded */
const BAKERY_MEDIA_VIDEO_MAX = BAKERY_MEDIA_MAX_BYTES;

let bakeryMediaTableEnsured = false;
async function ensureBakeryMediaTable() {
  if (bakeryMediaTableEnsured) {
    return;
  }
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS bakery_media (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      storage_key CHAR(32) NOT NULL,
      owner_user_id BIGINT UNSIGNED NOT NULL,
      content_type VARCHAR(120) NOT NULL,
      byte_length INT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_bakery_media_key (storage_key),
      INDEX idx_bakery_media_owner (owner_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await fs.mkdir(BAKERY_MEDIA_ROOT, { recursive: true });
  bakeryMediaTableEnsured = true;
}

let bakeryGalleryColumnEnsured = false;
async function ensureBakeryServiceGalleryColumn() {
  if (bakeryGalleryColumnEnsured) {
    return;
  }
  try {
    await pool.execute("ALTER TABLE bakery_services ADD COLUMN gallery_json MEDIUMTEXT NULL AFTER image_url");
  } catch (e) {
    const m = String((e && e.message) || e);
    if (!/Duplicate column name/i.test(m)) {
      /* ignore only duplicate-column; other errors surface on next query */
    }
  }
  bakeryGalleryColumnEnsured = true;
}

let bakerySlotDurationColumnEnsured = false;
async function ensureBakeryServiceSlotDurationColumn() {
  if (bakerySlotDurationColumnEnsured) {
    return;
  }
  try {
    await pool.execute(
      "ALTER TABLE bakery_services ADD COLUMN slot_duration_minutes INT UNSIGNED NOT NULL DEFAULT 60 AFTER gallery_json"
    );
  } catch (e) {
    const m = String((e && e.message) || e);
    if (!/Duplicate column name/i.test(m)) {
      /* ignore only duplicate-column */
    }
  }
  bakerySlotDurationColumnEnsured = true;
}

function detectBakeryMediaMime(buf) {
  if (!buf || buf.length < 12) return "";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  return "";
}

function sanitizeBakeryGalleryInput(raw) {
  if (!Array.isArray(raw) || !raw.length) {
    return null;
  }
  const out = [];
  for (const item of raw.slice(0, 12)) {
    const kind = String((item && item.kind) || "image").toLowerCase() === "video" ? "video" : "image";
    const url = String((item && item.url) || "").trim().slice(0, 2000);
    if (!url) continue;
    if (/^https?:\/\//i.test(url)) {
      out.push({ kind, url });
      continue;
    }
    if (/^\/api\/public\/bakery-media\/[a-f0-9]{32}$/i.test(url)) {
      out.push({ kind, url });
    }
  }
  return out.length ? JSON.stringify(out) : null;
}

function parseBakeryGalleryJson(text) {
  if (!text) return [];
  try {
    const v = JSON.parse(String(text));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function galleryArrayForApi(text) {
  const arr = parseBakeryGalleryJson(text);
  return arr
    .filter((x) => x && (x.kind === "image" || x.kind === "video") && typeof x.url === "string")
    .slice(0, 12)
    .map((x) => ({ kind: x.kind, url: String(x.url).slice(0, 2000) }));
}

async function handlePublicBakeryServiceMediaUpload(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_BAKERY_PROVIDER_ROLES);
  if (!session) return;
  await ensureBakeryMediaTable();
  let buf;
  try {
    buf = await readUploadBody(req, BAKERY_MEDIA_MAX_BYTES);
  } catch (e) {
    const code = String(e && e.message) === "FILE_TOO_LARGE" ? "FILE_TOO_LARGE" : "UPLOAD_READ_FAILED";
    return sendJson(res, 413, { ok: false, code, message: "File is too large (max 25 MB video, 12 MB image)." });
  }
  if (!buf || buf.length < 16) {
    return sendJson(res, 400, { ok: false, code: "EMPTY_FILE" });
  }
  const headerMime = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  const sniff = detectBakeryMediaMime(buf);
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
  let mime = sniff || headerMime;
  if (!allowed.has(mime)) {
    return sendJson(res, 400, {
      ok: false,
      code: "UNSUPPORTED_MEDIA",
      message: "Use JPEG, PNG, WebP photos, or MP4 video."
    });
  }
  if (mime.startsWith("image/") && buf.length > BAKERY_MEDIA_IMAGE_MAX) {
    return sendJson(res, 413, { ok: false, code: "IMAGE_TOO_LARGE", message: "Image must be 12 MB or smaller." });
  }
  if (mime.startsWith("video/") && buf.length > BAKERY_MEDIA_VIDEO_MAX) {
    return sendJson(res, 413, { ok: false, code: "VIDEO_TOO_LARGE", message: "Video must be 25 MB or smaller." });
  }
  const storageKey = crypto.randomBytes(16).toString("hex");
  const filePath = path.join(BAKERY_MEDIA_ROOT, storageKey);
  try {
    await pool.execute(
      `INSERT INTO bakery_media (storage_key, owner_user_id, content_type, byte_length) VALUES (?, ?, ?, ?)`,
      [storageKey, Number(session.user_id), mime, buf.length]
    );
  } catch (e) {
    return sendJson(res, 500, { ok: false, code: "MEDIA_DB_FAILED", message: String(e.message || e).slice(0, 200) });
  }
  try {
    await fs.writeFile(filePath, buf, { mode: 0o640 });
  } catch (e) {
    try {
      await pool.execute(`DELETE FROM bakery_media WHERE storage_key = ? LIMIT 1`, [storageKey]);
    } catch {
      /* ignore */
    }
    return sendJson(res, 500, { ok: false, code: "MEDIA_WRITE_FAILED", message: String(e.message || e).slice(0, 200) });
  }
  const publicPath = `/api/public/bakery-media/${storageKey}`;
  return sendJson(res, 200, {
    ok: true,
    url: publicPath,
    kind: mime.startsWith("video/") ? "video" : "image",
    contentType: mime,
    bytes: buf.length
  });
}

async function handlePublicBakeryMediaGet(req, res, pathname) {
  applyCorsHeaders(req, res);
  await ensureBakeryMediaTable();
  const key = String(pathname.split("/").pop() || "").trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(key)) {
    res.statusCode = 400;
    res.end("Bad key");
    return;
  }
  const [rows] = await pool.execute(
    `SELECT content_type, byte_length FROM bakery_media WHERE storage_key = ? LIMIT 1`,
    [key]
  );
  const row = rows[0];
  if (!row) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  const filePath = path.join(BAKERY_MEDIA_ROOT, key);
  let data;
  try {
    data = await fs.readFile(filePath);
  } catch {
    res.statusCode = 404;
    res.end("Missing file");
    return;
  }
  const ct = String(row.content_type || "application/octet-stream");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.writeHead(200, {
    "Content-Type": ct,
    "Content-Length": data.length,
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(data);
}

const PROMO_SCOUT_SEED_SHOPS = {
  Electronics: [
    { shop: "Amazon Electronics", url: "https://www.amazon.com/electronics", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&h=560&q=78" },
    { shop: "MediaMarkt", url: "https://www.mediamarkt.de", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&h=560&q=78" },
    { shop: "Takealot Tech", url: "https://www.takealot.com", image: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=900&h=560&q=78" }
  ],
  Fashion: [
    { shop: "ASOS", url: "https://www.asos.com", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&h=560&q=78" },
    { shop: "Zalando", url: "https://www.zalando.com", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&h=560&q=78" },
    { shop: "Superbalist", url: "https://www.superbalist.com", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&h=560&q=78" }
  ],
  Books: [
    { shop: "AbeBooks", url: "https://www.abebooks.com", image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&h=560&q=78" },
    { shop: "Empik", url: "https://www.empik.com", image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&h=560&q=78" },
    { shop: "Text Book Centre", url: "https://textbookcentre.com", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&h=560&q=78" }
  ],
  Gaming: [
    { shop: "Steam Store", url: "https://store.steampowered.com", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&h=560&q=78" },
    { shop: "PlayStation Store", url: "https://store.playstation.com", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&h=560&q=78" }
  ]
};
const promoScoutState = {
  updatedAt: null,
  byCategory: {
    Electronics: [],
    Fashion: [],
    Books: [],
    Gaming: [],
    All: []
  }
};

function makePromoDiscount(seedBase, idx) {
  return Math.min(70, 12 + ((seedBase + idx * 23) % 41));
}

function runPromotionScoutCycle() {
  const nowIso = new Date().toISOString();
  const seedBase = Number(Date.now() % 997);
  const byCategory = {};
  Object.keys(PROMO_SCOUT_SEED_SHOPS).forEach((category) => {
    byCategory[category] = PROMO_SCOUT_SEED_SHOPS[category].map((entry, idx) => {
      const discountPercent = makePromoDiscount(seedBase, idx);
      const windowHours = 4 + ((seedBase + idx * 19) % 24);
      return {
        id: `${category.toLowerCase()}-${idx}-${seedBase}`,
        category,
        shop: entry.shop,
        url: entry.url,
        image: entry.image,
        discountPercent,
        promoTitle: `${entry.shop} ${discountPercent}% off`,
        promoText: `AI scout detected promotion momentum. Estimated live window: ${windowHours}h.`,
        startsAt: nowIso,
        endsAt: new Date(Date.now() + windowHours * 60 * 60 * 1000).toISOString(),
        source: "vibecart-ai-promo-scout"
      };
    });
  });
  byCategory.All = []
    .concat(byCategory.Electronics || [])
    .concat(byCategory.Fashion || [])
    .concat(byCategory.Books || [])
    .concat(byCategory.Gaming || [])
    .sort((a, b) => Number(b.discountPercent || 0) - Number(a.discountPercent || 0));
  promoScoutState.updatedAt = nowIso;
  promoScoutState.byCategory = byCategory;
  return promoScoutState;
}

function listPromotionScoutFeed(categoryRaw, limitRaw) {
  const category = String(categoryRaw || "All").trim();
  const key = category && promoScoutState.byCategory[category] ? category : "All";
  const limit = Math.max(1, Math.min(24, Number(limitRaw || 8) || 8));
  if (!promoScoutState.updatedAt) {
    runPromotionScoutCycle();
  }
  const items = (promoScoutState.byCategory[key] || []).slice(0, limit);
  return {
    ok: true,
    category: key,
    updatedAt: promoScoutState.updatedAt,
    refreshIntervalMinutes: PROMO_SCOUT_INTERVAL_MINUTES,
    count: items.length,
    items
  };
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

let ownerSiteSettingsTableReady = false;
async function ensureOwnerSiteSettingsTable() {
  if (ownerSiteSettingsTableReady) {
    return;
  }
  try {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS owner_site_settings (
        id TINYINT UNSIGNED PRIMARY KEY,
        settings_json JSON NOT NULL,
        updated_by_owner_auth_id BIGINT UNSIGNED NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );
  } catch {
    // Fallback for environments where JSON column DDL/casts are restricted.
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS owner_site_settings (
        id TINYINT UNSIGNED PRIMARY KEY,
        settings_json LONGTEXT NOT NULL,
        updated_by_owner_auth_id BIGINT UNSIGNED NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );
  }
  ownerSiteSettingsTableReady = true;
}

let ownerMessageCenterTableReady = false;
async function ensureOwnerMessageCenterTable() {
  if (ownerMessageCenterTableReady) {
    return;
  }
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS owner_message_center (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      owner_auth_id BIGINT UNSIGNED NOT NULL,
      message_type ENUM('request','urgent','system') NOT NULL DEFAULT 'system',
      message_text VARCHAR(600) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      FOREIGN KEY (owner_auth_id) REFERENCES owner_auth_profiles(id),
      INDEX idx_owner_message_center_owner_created (owner_auth_id, created_at),
      INDEX idx_owner_message_center_owner_read (owner_auth_id, read_at)
    )`
  );
  ownerMessageCenterTableReady = true;
}

async function recordOwnerDecisionForMessageCenter(pool, ownerAuthId, messageText, messageType = "urgent") {
  const oid = Number(ownerAuthId || 0);
  if (!oid) {
    return;
  }
  const text = String(messageText || "").trim().slice(0, 600);
  if (!text) {
    return;
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch {
    return;
  }
  const typeRaw = String(messageType || "urgent").trim().toLowerCase();
  const type = typeRaw === "request" || typeRaw === "urgent" ? typeRaw : "system";
  await pool.execute(
    `INSERT INTO owner_message_center (owner_auth_id, message_type, message_text) VALUES (?, ?, ?)`,
    [oid, type, text]
  );
  const pushUid = await resolveOwnerNotificationUserId(pool);
  if (pushUid > 0) {
    try {
      await sendPushToUser(pool, {
        userId: pushUid,
        title: "VibeCart: your decision",
        message: text,
        deepLink: "vibecart://admin-messages",
        eventType: "owner_decision"
      });
    } catch (err) {
      console.error("Owner decision push failed:", err.message || err);
    }
  }
}

let ownerNotificationUserIdCache = { value: 0, expiresAt: 0 };
async function resolveOwnerNotificationUserId(poolRef) {
  const envUid = Number(String(process.env.OWNER_NOTIFICATION_USER_ID || "").trim() || 0);
  if (envUid > 0) {
    return envUid;
  }
  const now = Date.now();
  if (ownerNotificationUserIdCache.value > 0 && ownerNotificationUserIdCache.expiresAt > now) {
    return ownerNotificationUserIdCache.value;
  }
  try {
    const [rows] = await poolRef.execute(
      `SELECT user_id
       FROM device_push_tokens
       WHERE active = 1
       ORDER BY updated_at DESC
       LIMIT 1`
    );
    const resolved = Number(rows && rows[0] ? rows[0].user_id : 0);
    if (resolved > 0) {
      ownerNotificationUserIdCache = {
        value: resolved,
        expiresAt: now + 5 * 60 * 1000
      };
      return resolved;
    }
  } catch {
    // no-op: fallback to disabled
  }
  return 0;
}

async function notifyOwnerMessageCenterPush(poolRef, eventType, messageText) {
  const pushUid = await resolveOwnerNotificationUserId(poolRef);
  if (pushUid <= 0) {
    return;
  }
  const eventNorm = String(eventType || "update").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_") || "update";
  const text = String(messageText || "Admin message center updated.").trim().slice(0, 300);
  if (!text) {
    return;
  }
  try {
    await sendPushToUser(poolRef, {
      userId: pushUid,
      title: "VibeCart Admin Inbox",
      message: text,
      deepLink: "vibecart://admin-messages",
      eventType: `owner_message_${eventNorm}`
    });
  } catch (err) {
    console.error("Owner message center push failed:", err.message || err);
  }
}

let publicUserPreferencesTableReady = false;
async function ensurePublicUserPreferencesTable() {
  if (publicUserPreferencesTableReady) {
    return;
  }
  try {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS user_preferences (
        user_id BIGINT UNSIGNED PRIMARY KEY,
        preferences_json JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_preferences_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      )`
    );
  } catch {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS user_preferences (
        user_id BIGINT UNSIGNED PRIMARY KEY,
        preferences_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );
  }
  publicUserPreferencesTableReady = true;
}

async function handlePublicUserPreferencesGet(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  try {
    await ensurePublicUserPreferencesTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "PREFERENCES_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  const [rows] = await pool.execute(
    `SELECT preferences_json, updated_at
     FROM user_preferences
     WHERE user_id = ?
     LIMIT 1`,
    [Number(session.user_id)]
  );
  const row = rows[0];
  if (!row) {
    return sendJson(res, 200, { ok: true, preferences: {}, updatedAt: null });
  }
  let preferences = row.preferences_json;
  if (typeof preferences === "string") {
    try {
      preferences = JSON.parse(preferences);
    } catch {
      preferences = {};
    }
  }
  if (!preferences || typeof preferences !== "object") {
    preferences = {};
  }
  return sendJson(res, 200, {
    ok: true,
    preferences,
    updatedAt: row.updated_at || null
  });
}

async function handlePublicUserPreferencesUpsert(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const incoming = body && typeof body.preferences === "object" && body.preferences
    ? body.preferences
    : null;
  if (!incoming) {
    return sendJson(res, 400, { ok: false, code: "PREFERENCES_REQUIRED" });
  }
  try {
    await ensurePublicUserPreferencesTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "PREFERENCES_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  let existingPrefs = {};
  try {
    const [existingRows] = await pool.execute(
      `SELECT preferences_json
       FROM user_preferences
       WHERE user_id = ?
       LIMIT 1`,
      [Number(session.user_id)]
    );
    const ex = existingRows[0];
    if (ex && ex.preferences_json) {
      existingPrefs = typeof ex.preferences_json === "string" ? JSON.parse(ex.preferences_json) : ex.preferences_json;
    }
  } catch {
    existingPrefs = {};
  }
  if (!existingPrefs || typeof existingPrefs !== "object") {
    existingPrefs = {};
  }
  const safePrefs = {
    ...existingPrefs,
    planViewMode:
      incoming.planViewMode != null
        ? String(incoming.planViewMode || "merged").trim().toLowerCase().slice(0, 32)
        : String(existingPrefs.planViewMode || "merged").trim().toLowerCase().slice(0, 32)
  };
  if (incoming.providerAiDashboards && typeof incoming.providerAiDashboards === "object") {
    const nextDash = {};
    Object.keys(incoming.providerAiDashboards)
      .slice(0, 40)
      .forEach((k) => {
        const key = String(k || "").trim().toLowerCase().slice(0, 120);
        if (!key) return;
        const entry = incoming.providerAiDashboards[k];
        if (!entry || typeof entry !== "object") return;
        const sections = Array.isArray(entry.sections)
          ? entry.sections
              .map((s) => ({
                title: String((s && s.title) || "").trim().slice(0, 120),
                intent: String((s && s.intent) || "").trim().slice(0, 280),
                automation: String((s && s.automation) || "").trim().slice(0, 280)
              }))
              .filter((s) => s.title && s.intent)
              .slice(0, 12)
          : [];
        nextDash[key] = {
          requirements: String(entry.requirements || "").trim().slice(0, 1600),
          sections,
          updatedAt: String(entry.updatedAt || new Date().toISOString()).slice(0, 40)
        };
      });
    safePrefs.providerAiDashboards = nextDash;
  } else if (existingPrefs.providerAiDashboards && typeof existingPrefs.providerAiDashboards === "object") {
    safePrefs.providerAiDashboards = existingPrefs.providerAiDashboards;
  }
  try {
    await ensurePublicUserPreferencesTable();
    await pool.execute(
      `INSERT INTO user_preferences (user_id, preferences_json)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         preferences_json = VALUES(preferences_json),
         updated_at = CURRENT_TIMESTAMP`,
      [Number(session.user_id), JSON.stringify(safePrefs)]
    );
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "PREFERENCES_SAVE_FAILED",
      message: String(error.message || error)
    });
  }
  return sendJson(res, 200, { ok: true, preferences: safePrefs });
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

  try {
    const [result] = await pool.execute(
      `UPDATE owner_auth_profiles
       SET owner_email = ?, password_hash = ?, security_phrase_hash = ?, updated_at = NOW()
       WHERE id = ?`,
      [nextEmail, passHash, phraseHash, session.owner_auth_id]
    );
    if (!Number(result?.affectedRows || 0)) {
      return sendJson(res, 404, { ok: false, code: "OWNER_PROFILE_NOT_FOUND" });
    }
  } catch (error) {
    const duplicate =
      Number(error?.errno || 0) === 1062 ||
      String(error?.code || "") === "ER_DUP_ENTRY" ||
      String(error?.message || "").toLowerCase().includes("duplicate");
    if (duplicate) {
      return sendJson(res, 409, { ok: false, code: "EMAIL_ALREADY_EXISTS" });
    }
    return sendJson(res, 503, {
      ok: false,
      code: "OWNER_AUTH_UPDATE_FAILED",
      message: String(error.message || error)
    });
  }

  return sendJson(res, 200, { ok: true });
}

async function handleOwnerSiteSettingsUpsert(req, res) {
  const body = await readJson(req);
  const token = String(body.token || body.authToken || "");
  const settings = body.settings && typeof body.settings === "object" ? body.settings : null;
  if (!token || !settings) {
    return sendJson(res, 400, { ok: false, code: "MISSING_FIELDS" });
  }
  const session = await requireActiveSession(token);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  try {
    await ensureOwnerSiteSettingsTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "SITE_SETTINGS_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  try {
    await pool.execute(
      `INSERT INTO owner_site_settings (id, settings_json, updated_by_owner_auth_id)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE
         settings_json = VALUES(settings_json),
         updated_by_owner_auth_id = VALUES(updated_by_owner_auth_id),
         updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(settings), Number(session.owner_auth_id)]
    );
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "SITE_SETTINGS_SAVE_FAILED",
      message: String(error.message || error)
    });
  }
  return sendJson(res, 200, { ok: true });
}

async function handlePublicSiteSettingsGet(req, res) {
  try {
    await ensureOwnerSiteSettingsTable();
  } catch {
    return sendJson(res, 200, { ok: true, settings: null, updatedAt: null });
  }
  const [rows] = await pool.execute(
    `SELECT settings_json, updated_at
     FROM owner_site_settings
     WHERE id = 1
     LIMIT 1`
  );
  const row = rows[0];
  if (!row) {
    return sendJson(res, 200, { ok: true, settings: null });
  }
  let settings = row.settings_json;
  if (typeof settings === "string") {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = null;
    }
  }
  return sendJson(res, 200, { ok: true, settings, updatedAt: row.updated_at || null });
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

async function handleOwnerMessageCenterList(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_CENTER_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  const limit = Math.max(1, Math.min(200, Number(data.body.limit || 120)));
  const [rows] = await pool.execute(
    `SELECT id, message_type, message_text, created_at, read_at
     FROM owner_message_center
     WHERE owner_auth_id = ?
     ORDER BY id DESC
     LIMIT ${limit}`,
    [Number(data.session.owner_auth_id)]
  );
  const unreadCount = rows.reduce((count, row) => count + (row.read_at ? 0 : 1), 0);
  return sendJson(res, 200, {
    ok: true,
    unreadCount,
    items: rows.map((row) => ({
      id: Number(row.id),
      type: String(row.message_type || "system"),
      text: String(row.message_text || ""),
      createdAt: row.created_at,
      createdAtMs: new Date(row.created_at).getTime(),
      readAt: row.read_at || null
    }))
  });
}

async function handleOwnerMessageCenterCreate(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_CENTER_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  const rawText = String(data.body.text || "").trim();
  if (!rawText) {
    return sendJson(res, 400, { ok: false, code: "MESSAGE_TEXT_REQUIRED" });
  }
  const text = rawText.slice(0, 600);
  const typeRaw = String(data.body.type || "system").trim().toLowerCase();
  const type = typeRaw === "urgent" || typeRaw === "request" ? typeRaw : "system";
  const [inserted] = await pool.execute(
    `INSERT INTO owner_message_center (owner_auth_id, message_type, message_text)
     VALUES (?, ?, ?)`,
    [Number(data.session.owner_auth_id), type, text]
  );
  await notifyOwnerMessageCenterPush(
    pool,
    "create",
    `${type.toUpperCase()}: ${text.slice(0, 160)}`
  );
  return sendJson(res, 200, {
    ok: true,
    id: Number(inserted.insertId || 0)
  });
}

async function handleOwnerMessageCenterMarkRead(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_CENTER_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  await pool.execute(
    `UPDATE owner_message_center
     SET read_at = NOW()
     WHERE owner_auth_id = ?
       AND read_at IS NULL`,
    [Number(data.session.owner_auth_id)]
  );
  await notifyOwnerMessageCenterPush(pool, "mark_read", "All admin inbox messages marked as read.");
  return sendJson(res, 200, { ok: true });
}

async function handleOwnerMessageCenterClear(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_CENTER_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  await pool.execute(
    `DELETE FROM owner_message_center
     WHERE owner_auth_id = ?`,
    [Number(data.session.owner_auth_id)]
  );
  await notifyOwnerMessageCenterPush(pool, "clear", "Admin inbox was cleared.");
  return sendJson(res, 200, { ok: true });
}

async function handleOwnerMessageCenterUpdate(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_CENTER_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  const messageId = Number(data.body.messageId || data.body.id || 0);
  if (!Number.isFinite(messageId) || messageId <= 0) {
    return sendJson(res, 400, { ok: false, code: "MESSAGE_ID_REQUIRED" });
  }
  const readStateRaw = data.body.readState;
  const hasReadPatch = readStateRaw !== undefined && readStateRaw !== null && String(readStateRaw).trim() !== "";
  const typeRaw = String(data.body.messageType || data.body.type || "").trim().toLowerCase();
  const hasTypePatch = Boolean(typeRaw);
  if (!hasReadPatch && !hasTypePatch) {
    return sendJson(res, 400, { ok: false, code: "MESSAGE_UPDATE_EMPTY" });
  }
  let nextType = null;
  if (hasTypePatch) {
    nextType = typeRaw === "urgent" || typeRaw === "request" ? typeRaw : "system";
  }
  const ownerId = Number(data.session.owner_auth_id);
  const readNorm = hasReadPatch ? String(readStateRaw).trim().toLowerCase() : "";
  if (hasReadPatch && readNorm !== "read" && readNorm !== "unread") {
    return sendJson(res, 400, { ok: false, code: "MESSAGE_READ_STATE_INVALID" });
  }
  try {
    if (hasReadPatch && hasTypePatch) {
      const readAtSql = readNorm === "read" ? "NOW()" : "NULL";
      const [result] = await pool.execute(
        `UPDATE owner_message_center
         SET read_at = ${readAtSql},
             message_type = ?
         WHERE id = ?
           AND owner_auth_id = ?`,
        [nextType, messageId, ownerId]
      );
      if (!result.affectedRows) {
        return sendJson(res, 404, { ok: false, code: "MESSAGE_NOT_FOUND" });
      }
      await notifyOwnerMessageCenterPush(
        pool,
        "update",
        `Admin inbox message updated: ${nextType.toUpperCase()} · ${readNorm === "read" ? "marked read" : "marked unread"}.`
      );
      return sendJson(res, 200, { ok: true });
    }
    if (hasReadPatch) {
      const readAtSql = readNorm === "read" ? "NOW()" : "NULL";
      const [result] = await pool.execute(
        `UPDATE owner_message_center
         SET read_at = ${readAtSql}
         WHERE id = ?
           AND owner_auth_id = ?`,
        [messageId, ownerId]
      );
      if (!result.affectedRows) {
        return sendJson(res, 404, { ok: false, code: "MESSAGE_NOT_FOUND" });
      }
      await notifyOwnerMessageCenterPush(
        pool,
        "read_state",
        `Admin inbox message ${readNorm === "read" ? "marked read" : "marked unread"}.`
      );
      return sendJson(res, 200, { ok: true });
    }
    const [result] = await pool.execute(
      `UPDATE owner_message_center
       SET message_type = ?
       WHERE id = ?
         AND owner_auth_id = ?`,
      [nextType, messageId, ownerId]
    );
    if (!result.affectedRows) {
      return sendJson(res, 404, { ok: false, code: "MESSAGE_NOT_FOUND" });
    }
    await notifyOwnerMessageCenterPush(
      pool,
      "type",
      `Admin inbox message moved to ${nextType.toUpperCase()}.`
    );
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_UPDATE_FAILED",
      message: String(error.message || error)
    });
  }
}

async function handleOwnerMessageCenterDelete(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_CENTER_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }
  const messageId = Number(data.body.messageId || data.body.id || 0);
  if (!Number.isFinite(messageId) || messageId <= 0) {
    return sendJson(res, 400, { ok: false, code: "MESSAGE_ID_REQUIRED" });
  }
  try {
    const [result] = await pool.execute(
      `DELETE FROM owner_message_center
       WHERE id = ?
         AND owner_auth_id = ?`,
      [messageId, Number(data.session.owner_auth_id)]
    );
    if (!result.affectedRows) {
      return sendJson(res, 404, { ok: false, code: "MESSAGE_NOT_FOUND" });
    }
    await notifyOwnerMessageCenterPush(pool, "delete", "An admin inbox message was deleted.");
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_DELETE_FAILED",
      message: String(error.message || error)
    });
  }
}

async function handleOwnerMessageCenterStream(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const token = String(urlObj.searchParams.get("authToken") || urlObj.searchParams.get("token") || "").trim();
  const session = await requireActiveSession(token);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  try {
    await ensureOwnerMessageCenterTable();
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_CENTER_DB_UNAVAILABLE",
      message: String(error.message || error)
    });
  }

  applyCorsHeaders(req, res);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.statusCode = 200;
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const ownerAuthId = Number(session.owner_auth_id);
  let lastSignature = "";
  let closed = false;

  const emit = (eventName, payload) => {
    if (closed) {
      return;
    }
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload || {})}\n\n`);
  };

  const loadSnapshot = async () => {
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(MAX(id), 0) AS latest_id,
         SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread_count,
         COUNT(*) AS total_count
       FROM owner_message_center
       WHERE owner_auth_id = ?`,
      [ownerAuthId]
    );
    const row = rows && rows[0] ? rows[0] : {};
    const latestId = Number(row.latest_id || 0);
    const unreadCount = Number(row.unread_count || 0);
    const totalCount = Number(row.total_count || 0);
    return { latestId, unreadCount, totalCount };
  };

  const pushSnapshotIfChanged = async () => {
    const snapshot = await loadSnapshot();
    const signature = `${snapshot.latestId}|${snapshot.unreadCount}|${snapshot.totalCount}`;
    if (signature !== lastSignature) {
      lastSignature = signature;
      emit("message_delta", snapshot);
    } else {
      emit("keepalive", { ok: true, ts: Date.now() });
    }
  };

  emit("connected", { ok: true, ts: Date.now() });
  await pushSnapshotIfChanged();

  const timer = setInterval(() => {
    pushSnapshotIfChanged().catch(() => {
      emit("error", { ok: false, code: "STREAM_POLL_FAILED" });
    });
  }, 7000);

  req.on("close", () => {
    closed = true;
    clearInterval(timer);
  });
}

async function handlePublicMobilePushRegister(req, res) {
  try {
    const body = await readJson(req);
    const result = await registerMobileInstallPush(pool, body);

    // If caller is signed in, also bind this token to user_id so sendPushToUser can deliver
    // even when provider is offline (not on website).
    const token = getBearerToken(req) || String(body.authToken || body.token || "").trim();
    if (token) {
      try {
        const session = await requirePublicSession(token, req);
        if (session && Number(session.user_id) > 0) {
          const tokenRaw = String(body.pushToken || "").trim();
          const platformRaw = String(body.platform || "").trim().toLowerCase();
          const inferredPlatform =
            platformRaw === "android" || platformRaw === "ios" || platformRaw === "web"
              ? platformRaw
              : /^(ExponentPushToken|ExpoPushToken)\[.+\]$/i.test(tokenRaw)
                ? "ios"
                : "android";
          await registerDeviceToken(pool, {
            userId: Number(session.user_id),
            platform: inferredPlatform,
            pushToken: tokenRaw,
            appVersion: body.appVersion ? String(body.appVersion) : null,
            locale: body.locale ? String(body.locale) : null
          });
        }
      } catch {
        /* keep endpoint resilient for anonymous install registration */
      }
    }

    return sendJson(res, 200, Object.assign({ linkedToUser: Boolean(token) }, result));
  } catch (error) {
    return sendJson(res, 400, { ok: false, code: "MOBILE_PUSH_REGISTER_FAILED", message: String(error.message || error) });
  }
}

async function handlePublicMobileFeedback(req, res) {
  const ip = getIp(req);
  try {
    const body = await readJson(req);
    const text = String(body.text || body.feedback || body.body || "").trim();
    if (text.length < 4 || text.length > 2000) {
      return sendJson(res, 400, { ok: false, code: "INVALID_FEEDBACK_TEXT" });
    }
    const installId = body.installId ? String(body.installId).trim().slice(0, 64) : null;
    const locale = body.locale ? String(body.locale).trim().slice(0, 20) : null;
    const appVersion = body.appVersion ? String(body.appVersion).trim().slice(0, 50) : null;
    const pageUrl = body.pageUrl ? String(body.pageUrl).trim().slice(0, 512) : null;
    const userAgent = req.headers["user-agent"] ? String(req.headers["user-agent"]).slice(0, 400) : null;
    await recordMobileAppFeedback(pool, {
      body: text,
      installId: installId && installId.length >= 4 ? installId : null,
      locale,
      appVersion,
      pageUrl,
      userAgent,
      clientIp: ip
    });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MOBILE_FEEDBACK_STORE_FAILED",
      message: String(error.message || error)
    });
  }
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

async function ensureDefaultAffiliatePartnerId() {
  try {
    const [rows] = await pool.execute(
      `SELECT id FROM affiliate_partners WHERE active = 1 ORDER BY id ASC LIMIT 1`
    );
    if (Array.isArray(rows) && rows.length && Number(rows[0].id) > 0) {
      return Number(rows[0].id);
    }
  } catch {
    /* ignore and try create fallback */
  }
  try {
    const created = await createAffiliatePartner(pool, {
      partnerName: "VibeCart Internal",
      partnerType: "internal",
      contactEmail: "affiliate@vibe-cart.com",
      defaultCommissionPercent: 0
    });
    if (created && Number(created.affiliatePartnerId) > 0) {
      return Number(created.affiliatePartnerId);
    }
  } catch {
    /* ignore and retry read */
  }
  const [retryRows] = await pool.execute(
    `SELECT id FROM affiliate_partners WHERE active = 1 ORDER BY id ASC LIMIT 1`
  );
  if (Array.isArray(retryRows) && retryRows.length && Number(retryRows[0].id) > 0) {
    return Number(retryRows[0].id);
  }
  throw new Error("AFFILIATE_PARTNER_NOT_AVAILABLE");
}

async function handlePublicShopRedirect(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const targetRaw = String(urlObj.searchParams.get("target") || "").trim();
  const shopName = String(urlObj.searchParams.get("shop") || "").trim();
  const category = String(urlObj.searchParams.get("cat") || "").trim();
  const partnerName = String(urlObj.searchParams.get("partner") || "").trim();
  const partnerIdRaw = Number(urlObj.searchParams.get("partnerId") || 0);
  const partnerId = Number.isFinite(partnerIdRaw) && partnerIdRaw > 0 ? partnerIdRaw : 0;
  const refFromQuery = String(urlObj.searchParams.get("ref") || "").trim();
  const referredUserIdRaw = String(urlObj.searchParams.get("referredUserId") || "").trim();
  const referredUserId = referredUserIdRaw ? Number(referredUserIdRaw) : null;
  const productIdRaw = Number(urlObj.searchParams.get("productId") || 0);
  const productId = Number.isFinite(productIdRaw) && productIdRaw > 0 ? productIdRaw : 0;
  const fallback = "/live-market-shops.html";
  let safeTarget = fallback;
  let referenceCode = refFromQuery || `shop-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  try {
    const parsed = new URL(targetRaw);
    const proto = String(parsed.protocol || "").toLowerCase();
    if (proto === "https:" || proto === "http:") {
      safeTarget = parsed.toString();
    }
  } catch {
    safeTarget = fallback;
  }
  try {
    var resolvedPartnerId = partnerId > 0 ? partnerId : await ensureDefaultAffiliatePartnerId();
    await recordAffiliateReferral(pool, {
      partnerId: resolvedPartnerId,
      referredUserId: Number.isFinite(referredUserId) ? referredUserId : null,
      referenceCode,
      conversionType: `click_out:${category || "general"}:${(partnerName || shopName || "shop").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      conversionValue: 0,
      commissionAmount: 0,
      currency: "EUR"
    });
  } catch {
    /* ignore tracking failures and continue redirect */
  }
  if (productId > 0) {
    try {
      await incrementSellerProductMetric(productId, "click_count", 1);
    } catch {
      /* ignore metric failures */
    }
  }
  try {
    const targetUrl = new URL(safeTarget);
    if (!targetUrl.searchParams.get("vc_ref")) {
      targetUrl.searchParams.set("vc_ref", referenceCode);
    }
    safeTarget = targetUrl.toString();
  } catch {
    /* ignore */
  }
  res.statusCode = 302;
  res.setHeader("Location", safeTarget);
  res.end();
}

async function handlePublicAffiliateReferralsList(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const token = String(urlObj.searchParams.get("authToken") || req.headers["x-owner-auth-token"] || "").trim();
  const session = await requireActiveSession(token);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  var limit = Number(urlObj.searchParams.get("limit") || 100);
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = 100;
  }
  limit = Math.min(300, Math.floor(limit));
  try {
    const [rows] = await pool.execute(
      `SELECT id, partner_id, referred_user_id, reference_code, conversion_type, conversion_value, commission_amount, currency, status
       FROM affiliate_referrals
       ORDER BY id DESC
       LIMIT ?`,
      [limit]
    );
    return sendJson(res, 200, { ok: true, count: rows.length, referrals: rows });
  } catch {
    return sendJson(res, 200, { ok: true, count: 0, referrals: [] });
  }
}

async function ensureAffiliatePostbackEventsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS affiliate_postback_events (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      dedupe_key VARCHAR(190) NOT NULL,
      ref_code VARCHAR(120) NOT NULL,
      partner_id BIGINT UNSIGNED NULL,
      status_label VARCHAR(30) NOT NULL,
      payload_json JSON NULL,
      received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_affiliate_postback_dedupe (dedupe_key),
      INDEX idx_affiliate_postback_ref (ref_code, received_at)
    )`
  );
}

async function saveAffiliatePostbackEventOnce(params) {
  await ensureAffiliatePostbackEventsTable();
  const payloadJson = JSON.stringify(params.payload || {});
  const [result] = await pool.execute(
    `INSERT IGNORE INTO affiliate_postback_events
      (dedupe_key, ref_code, partner_id, status_label, payload_json)
     VALUES (?, ?, ?, ?, ?)`,
    [
      String(params.dedupeKey || "").slice(0, 190),
      String(params.ref || "").slice(0, 120),
      params.partnerId ? Number(params.partnerId) : null,
      String(params.status || "").slice(0, 30),
      payloadJson
    ]
  );
  return Boolean(result && Number(result.affectedRows || 0) > 0);
}

function normalizeAffiliateStatus(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (raw === "approved" || raw === "paid" || raw === "confirmed" || raw === "success") {
    return "confirmed";
  }
  if (raw === "refunded" || raw === "reversed" || raw === "rejected" || raw === "chargeback" || raw === "cancelled") {
    return "reversed";
  }
  return "pending";
}

async function handlePublicAffiliatePostback(req, res) {
  if (!AFFILIATE_POSTBACK_TOKEN) {
    return sendJson(res, 503, { ok: false, code: "AFFILIATE_POSTBACK_NOT_CONFIGURED" });
  }
  const urlObj = new URL(req.url, "http://localhost");
  const token = String(
    urlObj.searchParams.get("token") ||
      req.headers["x-affiliate-postback-token"] ||
      ""
  ).trim();
  if (!token || token !== AFFILIATE_POSTBACK_TOKEN) {
    return sendJson(res, 401, { ok: false, code: "AFFILIATE_POSTBACK_UNAUTHORIZED" });
  }
  const ref = String(urlObj.searchParams.get("ref") || "").trim();
  if (!ref) {
    return sendJson(res, 400, { ok: false, code: "AFFILIATE_REF_REQUIRED" });
  }
  const partnerIdRaw = Number(urlObj.searchParams.get("partnerId") || 0);
  const partnerId = Number.isFinite(partnerIdRaw) && partnerIdRaw > 0 ? partnerIdRaw : 0;
  const value = Number(urlObj.searchParams.get("value") || 0);
  const commission = Number(urlObj.searchParams.get("commission") || 0);
  const currency = String(urlObj.searchParams.get("currency") || "EUR").trim().toUpperCase();
  const status = normalizeAffiliateStatus(urlObj.searchParams.get("status") || "pending");
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeCommission = Number.isFinite(commission) ? commission : 0;
  const dedupeKey = sha256(
    [
      ref,
      String(partnerId || ""),
      status,
      safeValue.toFixed(2),
      safeCommission.toFixed(2),
      currency || "EUR"
    ].join("|")
  );
  try {
    const inserted = await saveAffiliatePostbackEventOnce({
      dedupeKey,
      ref,
      partnerId,
      status,
      payload: {
        ref,
        partnerId,
        value: safeValue,
        commission: safeCommission,
        currency,
        status
      }
    });
    if (!inserted) {
      return sendJson(res, 200, {
        ok: true,
        postback: "duplicate_ignored",
        referenceCode: ref
      });
    }
    var resolvedPartnerId = partnerId > 0 ? partnerId : await ensureDefaultAffiliatePartnerId();
    const result = await recordAffiliateReferral(pool, {
      partnerId: resolvedPartnerId,
      referredUserId: null,
      referenceCode: ref + "-conv-" + status,
      conversionType: "purchase_" + status,
      conversionValue: safeValue,
      commissionAmount: safeCommission,
      currency: currency || "EUR"
    });
    return sendJson(res, 200, {
      ok: true,
      postback: "recorded",
      referenceCode: ref,
      affiliateReferralId: result.affiliateReferralId
    });
  } catch (error) {
    return sendJson(res, 400, { ok: false, code: "AFFILIATE_POSTBACK_FAILED", message: String(error.message || error) });
  }
}

async function handleOwnerAffiliateReconciliation(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const lookbackDaysRaw = Number(data.body.lookbackDays || 30);
  const lookbackDays = Number.isFinite(lookbackDaysRaw) ? Math.max(1, Math.min(365, Math.floor(lookbackDaysRaw))) : 30;
  const [rows] = await pool.execute(
    `SELECT conversion_type, COALESCE(SUM(commission_amount), 0) AS commission_total, COUNT(*) AS items
     FROM affiliate_referrals
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY conversion_type`,
    [lookbackDays]
  );
  let clicks = 0;
  let pending = 0;
  let confirmed = 0;
  let reversed = 0;
  let commissionConfirmed = 0;
  let commissionReversed = 0;
  rows.forEach((row) => {
    const kind = String(row.conversion_type || "").toLowerCase();
    const items = Number(row.items || 0);
    const amount = Number(row.commission_total || 0);
    if (kind.indexOf("click_out:") === 0) {
      clicks += items;
      return;
    }
    if (kind.indexOf("purchase_pending") === 0) {
      pending += items;
      return;
    }
    if (kind.indexOf("purchase_confirmed") === 0) {
      confirmed += items;
      commissionConfirmed += amount;
      return;
    }
    if (kind.indexOf("purchase_reversed") === 0) {
      reversed += items;
      commissionReversed += amount;
    }
  });
  const conversionRate = clicks > 0 ? Number(((confirmed / clicks) * 100).toFixed(2)) : 0;
  const reversalRate = confirmed > 0 ? Number(((Math.abs(reversed) / confirmed) * 100).toFixed(2)) : 0;
  const warnings = [];
  if (clicks >= 30 && conversionRate < 0.4) warnings.push("Low conversion rate from click-outs.");
  if (confirmed >= 10 && reversalRate > 25) warnings.push("High reversal ratio on confirmed conversions.");
  if (pending > confirmed * 2 && pending > 20) warnings.push("Large pending conversion backlog.");
  return sendJson(res, 200, {
    ok: true,
    lookbackDays,
    stats: {
      clicks,
      pending,
      confirmed,
      reversed,
      conversionRatePercent: conversionRate,
      reversalRatePercent: reversalRate,
      commissionConfirmed: Number(commissionConfirmed.toFixed(2)),
      commissionReversed: Number(commissionReversed.toFixed(2)),
      commissionNet: Number((commissionConfirmed + commissionReversed).toFixed(2))
    },
    warnings
  });
}

async function handleOwnerAffiliateLinkHealth(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const raw = Array.isArray(data.body.urls) ? data.body.urls : [];
  const fallback = [
    "https://www.amazon.de",
    "https://www.takealot.com",
    "https://www.jumia.co.ke",
    "https://www.zalando.com",
    "https://store.steampowered.com"
  ];
  const targets = (raw.length ? raw : fallback)
    .map((u) => String(u || "").trim())
    .filter(Boolean)
    .slice(0, 40);
  const checks = await Promise.all(
    targets.map(async (target) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);
        const response = await fetch(target, { method: "GET", redirect: "follow", signal: controller.signal });
        clearTimeout(timer);
        const status = Number(response.status || 0);
        const reachable = Boolean(response.ok || status === 403 || status === 405);
        const classification = response.ok
          ? "ok"
          : status === 403
            ? "blocked"
            : status === 405
              ? "method_not_allowed"
              : "fail";
        return { url: target, ok: response.ok, reachable, classification, status };
      } catch {
        return { url: target, ok: false, reachable: false, classification: "fail", status: 0 };
      }
    })
  );
  const okCount = checks.filter((c) => c.ok).length;
  const reachableCount = checks.filter((c) => c.reachable).length;
  return sendJson(res, 200, {
    ok: true,
    checked: checks.length,
    okCount,
    reachableCount,
    failCount: checks.length - reachableCount,
    checks
  });
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
  if (!Number.isFinite(userId) || userId <= 0) {
    return sendJson(res, 400, { ok: false, code: "INVALID_USER_ID" });
  }
  try {
    const result = await getRewardProfile(pool, { userId });
    return sendJson(res, 200, result);
  } catch (error) {
    const errno = Number(error.errno || 0);
    const sqlCode = String(error.code || "");
    const msg = String(error.message || error || "");
    const fkBroken =
      errno === 1452 ||
      sqlCode === "ER_NO_REFERENCED_ROW_2" ||
      /foreign key|cannot add or update a child row/i.test(msg);
    if (fkBroken) {
      return sendJson(res, 200, {
        ok: true,
        profile: {
          user_id: userId,
          points_balance: 0,
          current_tier: "starter",
          safe_action_streak_weeks: 0,
          last_activity_at: null,
          updated_at: null
        },
        fallback: true,
        code: "REWARD_PROFILE_DB_CONSTRAINT"
      });
    }
    throw error;
  }
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

async function handlePublicAiGenerate(req, res) {
  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const agent = String(body.agent || "").trim();
  const allowed = new Set([
    "coach_matcher",
    "coach_workspace_plan",
    "seller_growth_plan",
    "vibecoach_tip",
    "hot_picks_trends",
    "brandon_guide",
    "mb_studio_suite",
    "provider_dashboard_sections"
  ]);
  if (!allowed.has(agent)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_AGENT" });
  }
  const ip = getIp(req);
  if (agent === "hot_picks_trends") {
    if (isHotPicksAiRateLimited(ip)) {
      return sendJson(res, 429, {
        ok: false,
        code: "RATE_LIMITED",
        message: "Trend engine refresh is temporarily limited for this network. Try again in a little while."
      });
    }
  }
  if (agent === "coach_workspace_plan") {
    if (isCoachWorkspaceAiRateLimited(ip)) {
      return sendJson(res, 429, {
        ok: false,
        code: "RATE_LIMITED",
        message: "Plan workspace AI is temporarily limited for this network. Try again shortly or use the on-page template."
      });
    }
  }
  if (agent === "brandon_guide" || agent === "mb_studio_suite") {
    if (isBrandonGuideAiRateLimited(ip)) {
      return sendJson(res, 429, {
        ok: false,
        code: "RATE_LIMITED",
        message: "Brandon / studio AI is temporarily limited for this network. Try again shortly — offline tools still work."
      });
    }
  }
  const result = await runPublicGenerativeAgent(agent, body.input || {});
  if (!result.ok) {
    const status =
      result.code === "OPENAI_NOT_CONFIGURED"
        ? 503
        : result.code === "INVALID_AGENT" || result.code === "AI_PARSE_ERROR" || result.code === "INVALID_INPUT"
          ? 400
          : 502;
    return sendJson(res, status, result);
  }
  return sendJson(res, 200, { ok: true, agent, result });
}

async function handleOwnerAiGenerate(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const agent = String(data.body.agent || "").trim();
  const allowed = new Set(["admin_prompt", "admin_ad_creative", "admin_outreach"]);
  if (!allowed.has(agent)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_AGENT" });
  }
  const result = await runOwnerGenerativeAgent(agent, data.body.input || {});
  if (!result.ok) {
    const status =
      result.code === "OPENAI_NOT_CONFIGURED" ? 503 : result.code === "INVALID_AGENT" || result.code === "AI_PARSE_ERROR" ? 400 : 502;
    return sendJson(res, status, result);
  }
  return sendJson(res, 200, { ok: true, agent, result });
}

async function handlePublicCoachDashboard(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const userId = Number(urlObj.searchParams.get("userId") || 0);
  const result = await getCoachDashboard(pool, { userId });
  return sendJson(res, 200, result);
}

async function handlePublicCoachMonetization(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const userId = Number(urlObj.searchParams.get("userId") || 0);
  const result = await getCoachMonetizationState(pool, { userId });
  return sendJson(res, 200, result);
}

async function handlePublicCoachProfile(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
  const result = await upsertCoachProfile(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicHealthCheckin(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
  const result = await logHealthCheckin(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicWearableCoachPrefs(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
  const result = await upsertWearableCoachPrefs(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicCoachSubscriptionStart(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
  const result = await startCoachSubscription(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicCoachAddonPurchase(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
  const result = await purchaseCoachAddon(pool, body || {});
  return sendJson(res, 200, result);
}

async function handlePublicCoachPartnerEvent(req, res) {
  const body = await readJson(req);
  const result = await recordCoachPartnerEvent(pool, body || {});
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

const ANALYTICS_RATE_WINDOW_MS = 60 * 1000;
const ANALYTICS_RATE_MAX = 180;

function isAnalyticsVisitRateLimited(ip) {
  const key = String(ip || "unknown").slice(0, 80);
  const now = Date.now();
  const item = analyticsVisitHits.get(key) || { count: 0, start: now };
  if (now - item.start > ANALYTICS_RATE_WINDOW_MS) {
    item.count = 0;
    item.start = now;
  }
  item.count += 1;
  analyticsVisitHits.set(key, item);
  return item.count > ANALYTICS_RATE_MAX;
}

async function ensureSiteAnalyticsVisitsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS site_analytics_visits (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      path VARCHAR(512) NOT NULL,
      referrer VARCHAR(512) NULL,
      country_code CHAR(2) NULL,
      region_key VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
      visitor_day_hash CHAR(64) NOT NULL,
      ip_hash CHAR(64) NOT NULL,
      user_agent_hash CHAR(64) NOT NULL,
      INDEX idx_sav_created (created_at),
      INDEX idx_sav_country_created (country_code, created_at),
      INDEX idx_sav_region_created (region_key, created_at),
      INDEX idx_sav_visitor_day (visitor_day_hash, created_at)
    )`
  );
}

function getGeoCountryFromHeaders(req) {
  const h = req.headers || {};
  const candidates = [
    String(h["cf-ipcountry"] || "").trim(),
    String(h["CF-IPCountry"] || "").trim(),
    String(h["x-vercel-ip-country"] || "").trim(),
    String(h["X-Vercel-IP-Country"] || "").trim(),
    String(h["x-nf-country"] || "").trim(),
    String(h["X-NF-Country"] || "").trim(),
    String(h["x-appengine-country"] || "").trim(),
    String(h["X-AppEngine-Country"] || "").trim(),
    String(h["cloudfront-viewer-country"] || "").trim(),
    String(h["CloudFront-Viewer-Country"] || "").trim()
  ];
  for (const raw of candidates) {
    const v = String(raw || "")
      .trim()
      .toUpperCase();
    if (v.length === 2 && /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1") {
      return v;
    }
  }
  return null;
}

async function handlePublicAnalyticsVisit(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const ip = getIp(req);
  if (isAnalyticsVisitRateLimited(ip)) {
    return sendJson(res, 429, { ok: false, code: "RATE_LIMITED" });
  }
  let body = {};
  try {
    body = (await readJson(req)) || {};
  } catch {
    body = {};
  }
  const path = String(body.path || "/").slice(0, 512);
  const referrer = String(body.referrer || "").slice(0, 512);
  const ua = String(req.headers["user-agent"] || "").slice(0, 512);
  const dayUtc = new Date().toISOString().slice(0, 10);
  const visitorDayHash = crypto
    .createHash("sha256")
    .update(`${ANALYTICS_VISITOR_SALT}|${ip}|${ua}|${dayUtc}`, "utf8")
    .digest("hex");
  const ipHash = crypto.createHash("sha256").update(`${ANALYTICS_VISITOR_SALT}|${ip}`, "utf8").digest("hex");
  const uaHash = crypto.createHash("sha256").update(`${ANALYTICS_VISITOR_SALT}|${ua}`, "utf8").digest("hex");
  const countryCode = getGeoCountryFromHeaders(req);
  const regionKey = getMacroRegionFromCountry(countryCode);
  try {
    await ensureSiteAnalyticsVisitsTable();
    await pool.execute(
      `INSERT INTO site_analytics_visits (path, referrer, country_code, region_key, visitor_day_hash, ip_hash, user_agent_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [path, referrer || null, countryCode, regionKey, visitorDayHash, ipHash, uaHash]
    );
    return sendJson(res, 200, { ok: true });
  } catch {
    return sendJson(res, 200, { ok: true, note: "visit_accepted_but_db_unavailable" });
  }
}

async function handleOwnerAnalyticsOverview(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    await ensureSiteAnalyticsVisitsTable();
    const [allTimeR] = await pool.execute(`SELECT COUNT(*) AS n FROM site_analytics_visits`);
    const [d7R] = await pool.execute(
      `SELECT COUNT(*) AS n FROM site_analytics_visits WHERE created_at >= (NOW() - INTERVAL 7 DAY)`
    );
    const [d30R] = await pool.execute(
      `SELECT COUNT(*) AS n FROM site_analytics_visits WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
    );
    const [uniq7R] = await pool.execute(
      `SELECT COUNT(DISTINCT visitor_day_hash) AS n FROM site_analytics_visits WHERE created_at >= (NOW() - INTERVAL 7 DAY)`
    );
    const [uniq30R] = await pool.execute(
      `SELECT COUNT(DISTINCT visitor_day_hash) AS n FROM site_analytics_visits WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
    );
    const allTimeRow = allTimeR[0];
    const d7Row = d7R[0];
    const d30Row = d30R[0];
    const uniq7Row = uniq7R[0];
    const uniq30Row = uniq30R[0];
    const [countryVisitRows] = await pool.execute(
      `SELECT UPPER(country_code) AS country_code, COUNT(*) AS visits
       FROM site_analytics_visits
       WHERE created_at >= (NOW() - INTERVAL 30 DAY)
       GROUP BY country_code
       ORDER BY visits DESC
       LIMIT 60`
    );
    const [regionVisitRows] = await pool.execute(
      `SELECT region_key, COUNT(*) AS visits
       FROM site_analytics_visits
       WHERE created_at >= (NOW() - INTERVAL 30 DAY)
       GROUP BY region_key
       ORDER BY visits DESC
       LIMIT 20`
    );
    const [totalRows] = await pool.execute(`SELECT COUNT(*) AS n FROM users`);
    const [buyerRows] = await pool.execute(`SELECT COUNT(*) AS n FROM users WHERE LOWER(role) = 'buyer'`);
    const [sellerRows] = await pool.execute(`SELECT COUNT(*) AS n FROM users WHERE LOWER(role) = 'seller'`);
    const [quickRows] = await pool.execute(`SELECT COUNT(*) AS n FROM users WHERE email LIKE ?`, ["quickbuyer%@vibecart.local"]);
    const [accountCountryRows] = await pool.execute(
      `SELECT UPPER(country_code) AS country_code, COUNT(*) AS n
       FROM users
       GROUP BY country_code
       ORDER BY n DESC
       LIMIT 60`
    );
    const total = Number(totalRows[0]?.n || 0);
    const buyers = Number(buyerRows[0]?.n || 0);
    const sellers = Number(sellerRows[0]?.n || 0);
    const quickCheckoutSessions = Number(quickRows[0]?.n || 0);
    const passportApprox = Math.max(0, total - quickCheckoutSessions);
    return sendJson(res, 200, {
      ok: true,
      generatedAt: new Date().toISOString(),
      visits: {
        allTime: Number(allTimeRow[0]?.n || 0),
        last7Days: Number(d7Row[0]?.n || 0),
        last30Days: Number(d30Row[0]?.n || 0),
        uniqueVisitorsApprox7d: Number(uniq7Row[0]?.n || 0),
        uniqueVisitorsApprox30d: Number(uniq30Row[0]?.n || 0)
      },
      visitsByCountry: (countryVisitRows || []).map((row) => ({
        countryCode: row.country_code ? String(row.country_code) : "UNKNOWN",
        visits: Number(row.visits || 0)
      })),
      visitsByRegion: (regionVisitRows || []).map((row) => ({
        regionKey: String(row.region_key || "UNKNOWN"),
        visits: Number(row.visits || 0)
      })),
      accounts: {
        total,
        buyers,
        sellers,
        quickCheckoutSessions,
        passportApprox
      },
      accountsByCountry: (accountCountryRows || []).map((row) => ({
        countryCode: String(row.country_code || "").toUpperCase(),
        count: Number(row.n || 0)
      })),
      notes: [
        "Visit counts are stored in MySQL (site_analytics_visits) from POST /api/public/analytics/visit.",
        "Country for visits uses CDN/proxy geo headers (e.g. CF-IPCountry, x-nf-country) when present; otherwise UNKNOWN.",
        "Unique visitors are approximated as COUNT(DISTINCT visitor_day_hash) per rolling window (salted IP+UA+UTC day)."
      ]
    });
  } catch (error) {
    return sendJson(res, 500, { ok: false, code: "ANALYTICS_OVERVIEW_FAILED", message: String(error.message || error) });
  }
}

async function handleOwnerPublicUserStats(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  try {
    const [totalRows] = await pool.execute(`SELECT COUNT(*) AS n FROM users`);
    const [buyerRows] = await pool.execute(`SELECT COUNT(*) AS n FROM users WHERE LOWER(role) = 'buyer'`);
    const [sellerRows] = await pool.execute(`SELECT COUNT(*) AS n FROM users WHERE LOWER(role) = 'seller'`);
    const [quickRows] = await pool.execute(
      `SELECT COUNT(*) AS n FROM users WHERE email LIKE ?`,
      ["quickbuyer%@vibecart.local"]
    );
    const total = Number(totalRows[0]?.n || 0);
    const buyers = Number(buyerRows[0]?.n || 0);
    const sellers = Number(sellerRows[0]?.n || 0);
    const quickCheckoutSessions = Number(quickRows[0]?.n || 0);
    const passportApprox = Math.max(0, total - quickCheckoutSessions);
    return sendJson(res, 200, {
      ok: true,
      total,
      buyers,
      sellers,
      quickCheckoutSessions,
      passportApprox
    });
  } catch {
    return sendJson(res, 500, { ok: false, code: "PUBLIC_USER_STATS_FAILED" });
  }
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

async function ensureCoachFollowupJobsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS coach_followup_jobs (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      stripe_checkout_session_id VARCHAR(255) NOT NULL,
      flow VARCHAR(40) NOT NULL DEFAULT 'coach',
      plan_slug VARCHAR(40) NOT NULL,
      stage_day INT NOT NULL,
      due_at DATETIME NOT NULL,
      status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
      sent_at DATETIME NULL,
      fail_reason VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_coach_followup_stage (user_id, stripe_checkout_session_id, stage_day),
      KEY idx_coach_followup_due (status, due_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
}

function coachFollowupMessage(planSlug, stageDay) {
  const plan = String(planSlug || "starter").toLowerCase();
  const planTitle =
    plan === "pro" ? "Coach Pro" : plan === "plus" ? "Coach Plus" : plan === "ai-home" ? "AI Home Workout" : "Starter Coach";
  if (stageDay <= 1) {
    return {
      title: `${planTitle}: day 1 momentum`,
      body: "Welcome in. Keep it simple today: one routine block and one quick check-in. You are building the streak."
    };
  }
  if (stageDay <= 3) {
    return {
      title: `${planTitle}: day 3 check-in`,
      body: "Great consistency so far. Reply with your energy level and we will adapt your routine smartly."
    };
  }
  if (stageDay <= 7) {
    return {
      title: `${planTitle}: week 1 unlocked`,
      body: "Week one matters most. Stay with the plan and we will tune intensity and meals around your progress."
    };
  }
  return {
    title: `${planTitle}: week 2 push`,
    body: "You are in the compounding phase now. Keep showing up, and let your coach AI handle the adjustments."
  };
}

async function handleCoachFollowupsCron(req, res) {
  const cronHeader = String(req.headers["x-cron-token"] || "");
  if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
    return sendJson(res, 401, { ok: false, code: "INVALID_CRON_TOKEN" });
  }
  await ensureCoachFollowupJobsTable();
  let body = {};
  try {
    body = await readJson(req);
  } catch {
    body = {};
  }
  const limit = Math.min(Math.max(Number(body.limit || 200), 1), 2000);
  const [rows] = await pool.execute(
    `SELECT id, user_id, stripe_checkout_session_id, plan_slug, stage_day
     FROM coach_followup_jobs
     WHERE status = 'pending' AND due_at <= NOW()
     ORDER BY due_at ASC
     LIMIT ?`,
    [limit]
  );
  let sent = 0;
  let emailFallback = 0;
  let failed = 0;
  for (const row of rows) {
    const jobId = Number(row.id);
    const userId = Number(row.user_id);
    const msg = coachFollowupMessage(row.plan_slug, Number(row.stage_day || 0));
    const deep = `${resolvePublicWebBaseUrl(req).replace(/\/$/, "")}/plan-workspace.html?flow=coach&plan=${encodeURIComponent(String(row.plan_slug || "starter"))}`;
    try {
      const pushResult = await sendPushToUser(pool, {
        userId,
        title: msg.title,
        message: msg.body,
        deepLink: deep,
        eventType: "coach_followup"
      });
      if (pushResult && pushResult.ok && !pushResult.skipped) {
        await pool.execute(`UPDATE coach_followup_jobs SET status='sent', sent_at=NOW(), fail_reason=NULL WHERE id=? LIMIT 1`, [jobId]);
        sent += 1;
        continue;
      }
      const toEmail = await getUserEmailById(userId);
      if (toEmail) {
        queueUserTransactionalEmail(
          toEmail,
          msg.title,
          `${msg.body}\n\nOpen your package dashboard: ${deep}\n\nVibeCart Coach`
        );
        await pool.execute(
          `UPDATE coach_followup_jobs SET status='sent', sent_at=NOW(), fail_reason='email_fallback' WHERE id=? LIMIT 1`,
          [jobId]
        );
        emailFallback += 1;
      } else {
        await pool.execute(
          `UPDATE coach_followup_jobs SET status='failed', fail_reason='no_push_tokens_and_no_email' WHERE id=? LIMIT 1`,
          [jobId]
        );
        failed += 1;
      }
    } catch (err) {
      await pool.execute(
        `UPDATE coach_followup_jobs SET status='failed', fail_reason=? WHERE id=? LIMIT 1`,
        [String(err && err.message ? err.message : err).slice(0, 250), jobId]
      );
      failed += 1;
    }
  }
  return sendJson(res, 200, { ok: true, scanned: rows.length, sent, emailFallback, failed });
}

async function handleOwnerNotificationReliability(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const days = Math.min(Math.max(Number(data.body?.days || 14), 1), 90);
  const [summaryRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN delivery_status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
       SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
       SUM(CASE WHEN delivery_status = 'queued' THEN 1 ELSE 0 END) AS queued_count
     FROM notification_events
     WHERE created_at >= (NOW() - INTERVAL ? DAY)`,
    [days]
  );
  const [eventRows] = await pool.execute(
    `SELECT event_type, COUNT(*) AS n
     FROM notification_events
     WHERE created_at >= (NOW() - INTERVAL ? DAY)
     GROUP BY event_type
     ORDER BY n DESC
     LIMIT 20`,
    [days]
  );
  const [platformRows] = await pool.execute(
    `SELECT platform, COUNT(*) AS n
     FROM device_push_tokens
     WHERE active = 1
     GROUP BY platform
     ORDER BY n DESC`
  );
  return sendJson(res, 200, {
    ok: true,
    days,
    summary: {
      total: Number(summaryRows[0]?.total || 0),
      sent: Number(summaryRows[0]?.sent_count || 0),
      failed: Number(summaryRows[0]?.failed_count || 0),
      queued: Number(summaryRows[0]?.queued_count || 0)
    },
    byEventType: (eventRows || []).map((r) => ({ eventType: String(r.event_type || ""), count: Number(r.n || 0) })),
    activeDeviceTokensByPlatform: (platformRows || []).map((r) => ({
      platform: String(r.platform || ""),
      count: Number(r.n || 0)
    }))
  });
}

async function handleOwnerClientEventHotspots(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  await ensureClientEventLogsTable();
  const days = Math.min(Math.max(Number(data.body?.days || 14), 1), 90);
  const limit = Math.min(Math.max(Number(data.body?.limit || 20), 5), 100);
  const [summaryRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) AS error_count,
       SUM(CASE WHEN severity = 'warn' THEN 1 ELSE 0 END) AS warn_count
     FROM client_event_logs
     WHERE created_at >= (NOW() - INTERVAL ? DAY)`,
    [days]
  );
  const [byEventRows] = await pool.execute(
    `SELECT event_type, COUNT(*) AS n
     FROM client_event_logs
     WHERE created_at >= (NOW() - INTERVAL ? DAY)
     GROUP BY event_type
     ORDER BY n DESC
     LIMIT ?`,
    [days, limit]
  );
  const [byPathRows] = await pool.execute(
    `SELECT
       COALESCE(NULLIF(page_path, ''), 'unknown') AS page_path,
       COUNT(*) AS n,
       SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) AS errors
     FROM client_event_logs
     WHERE created_at >= (NOW() - INTERVAL ? DAY)
     GROUP BY COALESCE(NULLIF(page_path, ''), 'unknown')
     ORDER BY n DESC, errors DESC
     LIMIT ?`,
    [days, limit]
  );
  return sendJson(res, 200, {
    ok: true,
    days,
    summary: summaryRows[0] || { total: 0, error_count: 0, warn_count: 0 },
    topEvents: Array.isArray(byEventRows) ? byEventRows : [],
    topPages: Array.isArray(byPathRows) ? byPathRows : []
  });
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

async function handlePublicMobileFirst5State(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const locale = String(urlObj.searchParams.get("locale") || req.headers["accept-language"] || "en").toLowerCase();
  const timezone = String(urlObj.searchParams.get("timezone") || "").toLowerCase();
  const countryCodeRaw = String(urlObj.searchParams.get("countryCode") || "").trim().toUpperCase();
  const now = new Date();
  const hour = now.getUTCHours();

  let countryCode = countryCodeRaw;
  if (countryCode.length !== 2) {
    try {
      const guessed = getMacroRegionFromCountry(countryCodeRaw);
      if (guessed && guessed.length === 2) {
        countryCode = guessed.toUpperCase();
      }
    } catch {
      countryCode = "";
    }
  }
  const regionSignal = `${locale} ${timezone} ${countryCode}`.toLowerCase();

  let intentDefault = "buy";
  if (hour >= 12 && hour <= 17) {
    intentDefault = "sell";
  } else if (hour >= 18 || hour <= 5) {
    intentDefault = /africa|za|ke|ng|zw|tz|ug|sn|nd|xh|zu/.test(regionSignal) ? "fast" : "buy";
  }

  const nowMs = Date.now();
  const campaignWindowMs = FIRST5_FLASH_WINDOW_MINUTES * 60 * 1000;
  const campaignSlot = Math.floor(nowMs / campaignWindowMs);
  const endsAtMs = (campaignSlot + 1) * campaignWindowMs;
  const remainingMs = Math.max(0, endsAtMs - nowMs);

  let activeShoppers = 0;
  let closingDeals = 0;
  let verifiedSellers = 0;
  try {
    const [activeVisitorsR] = await pool.execute(
      `SELECT COUNT(DISTINCT visitor_day_hash) AS n
       FROM site_analytics_visits
       WHERE created_at >= (NOW() - INTERVAL 20 MINUTE)`
    );
    const [closingDealsR] = await pool.execute(
      `SELECT COUNT(*) AS n
       FROM products
       WHERE status = 'active'
         AND stock > 0
         AND created_at >= (NOW() - INTERVAL 7 DAY)`
    );
    const [verifiedSellerR] = await pool.execute(
      `SELECT COUNT(DISTINCT shop_id) AS n
       FROM products
       WHERE status = 'active'
         AND stock > 0`
    );
    activeShoppers = Math.max(0, Number((activeVisitorsR[0] && activeVisitorsR[0].n) || 0));
    closingDeals = Math.max(0, Number((closingDealsR[0] && closingDealsR[0].n) || 0));
    verifiedSellers = Math.max(0, Number((verifiedSellerR[0] && verifiedSellerR[0].n) || 0));
  } catch {
    activeShoppers = 0;
    closingDeals = 0;
    verifiedSellers = 0;
  }

  const insightMap = {
    buy: "Focus on trust + delivery certainty first, then lock the best offer.",
    sell: "Lead with one niche product story and conversion improves faster.",
    fast: "Use speed lane: shortlist quickly, verify checkout, and execute."
  };
  const tipsMap = {
    buy: [
      "Compare 2-3 listings, then decide by delivery confidence.",
      "Check seller response speed before final payment."
    ],
    sell: [
      "Clear title + strong first image improves listing performance.",
      "Answer buyer questions with ETA and policy in one message."
    ],
    fast: [
      "Use Hot Picks for discovery, then verify on Security overview.",
      "Track order immediately after checkout for confidence."
    ]
  };

  return sendJson(res, 200, {
    ok: true,
    serverTime: now.toISOString(),
    first5: {
      intentDefault,
      flash: {
        campaignId: `flash-${campaignSlot}`,
        endsAt: new Date(endsAtMs).toISOString(),
        remainingMs
      },
      proof: {
        activeShoppers,
        closingDeals,
        verifiedSellers
      },
      brandon: {
        insight: insightMap[intentDefault] || insightMap.buy,
        tips: tipsMap[intentDefault] || tipsMap.buy
      }
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
  const session = await requirePublicSessionRole(req, res, new Set(["seller"]));
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
  const result = await upsertBarterProfile(pool, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  return sendJson(res, 200, result);
}

async function handlePublicBarterOfferCreate(req, res) {
  const session = await requirePublicSessionRole(req, res, new Set(["seller"]));
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
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
  await recordOwnerDecisionForMessageCenter(
    pool,
    data.session.owner_auth_id,
    `Barter match #${data.body?.matchId || "?"}: ${data.body?.decision || "n/a"}. Notes: ${data.body?.ownerNotes || "none"}`.slice(0, 600),
    "urgent"
  );
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
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
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
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  body.userId = Number(session.user_id);
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
  await recordOwnerDecisionForMessageCenter(
    pool,
    data.session.owner_auth_id,
    `Crowdfunding campaign #${data.body?.campaignId || "?"}: ${data.body?.decision || "n/a"}. Notes: ${data.body?.ownerNotes || "none"}`.slice(0, 600),
    "urgent"
  );
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
  await recordOwnerDecisionForMessageCenter(
    pool,
    data.session.owner_auth_id,
    `AI operation #${data.body?.operationId || "?"}: ${data.body?.decision || "n/a"}. Notes: ${data.body?.ownerNotes || "none"}`.slice(0, 600),
    "urgent"
  );
  return sendJson(res, 200, result);
}

async function buildOwnerAutomationStatsBundle() {
  const stats = {
    activeSellers: 0,
    activeProducts: 0,
    avgTrustScore: 60,
    highRiskChatEvents7d: 0,
    snapshotGeneratedAt: new Date().toISOString()
  };
  try {
    const [sellerRows] = await pool.execute(`SELECT COUNT(*) AS active_sellers FROM shops WHERE active = 1`);
    stats.activeSellers = Number(sellerRows[0]?.active_sellers || 0);
  } catch {
    /* ignore */
  }
  try {
    const [productRows] = await pool.execute(`SELECT COUNT(*) AS active_products FROM products WHERE status = 'active'`);
    stats.activeProducts = Number(productRows[0]?.active_products || 0);
  } catch {
    /* ignore */
  }
  try {
    const [trustRows] = await pool.execute(`SELECT AVG(trust_score) AS avg_trust FROM trust_profiles`);
    stats.avgTrustScore = Number(trustRows[0]?.avg_trust || 60);
  } catch {
    /* ignore */
  }
  try {
    const [chatRows] = await pool.execute(
      `SELECT COUNT(*) AS c FROM chat_safety_events WHERE risk_level = 'high' AND created_at >= (NOW() - INTERVAL 7 DAY)`
    );
    stats.highRiskChatEvents7d = Number(chatRows[0]?.c || 0);
  } catch {
    /* ignore */
  }
  return stats;
}

async function buildAccountSnapshotForDigest(userId) {
  const uid = Number(userId || 0);
  const snap = {
    ordersCount: 0,
    hasCoachProfile: false,
    insuranceSubscriptionsApprox: 0,
    snapshotGeneratedAt: new Date().toISOString()
  };
  if (!uid) {
    return snap;
  }
  try {
    const [orows] = await pool.execute(`SELECT COUNT(*) AS c FROM orders WHERE buyer_user_id = ?`, [uid]);
    snap.ordersCount = Number(orows[0]?.c || 0);
  } catch {
    /* ignore */
  }
  try {
    const [crows] = await pool.execute(`SELECT id FROM ai_coach_profiles WHERE user_id = ? LIMIT 1`, [uid]);
    snap.hasCoachProfile = Array.isArray(crows) && crows.length > 0;
  } catch {
    /* ignore */
  }
  try {
    const [irows] = await pool.execute(
      `SELECT COUNT(*) AS c FROM insurance_subscriptions WHERE user_id = ? AND status IN ('active','paused')`,
      [uid]
    );
    snap.insuranceSubscriptionsApprox = Number(irows[0]?.c || 0);
  } catch {
    /* ignore */
  }
  return snap;
}

async function handleOwnerAiOpsSecurityReview(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  if (!isGenerativeAiConfigured()) {
    return sendJson(res, 503, { ok: false, code: "OPENAI_NOT_CONFIGURED" });
  }
  const stats = await buildOwnerAutomationStatsBundle();
  const result = await generateOwnerSecurityComplianceReviewLLM(stats);
  if (!result.ok) {
    const status = result.code === "AI_PARSE_ERROR" ? 400 : 502;
    return sendJson(res, status, result);
  }
  await sendAdminNotificationEmail("VibeCart AI — security & compliance review", [
    `Summary (truncated): ${String(result.executiveSummary || "").slice(0, 400)}`,
    `High-risk chat events (7d): ${stats.highRiskChatEvents7d}`,
    `Timestamp: ${stats.snapshotGeneratedAt}`
  ]);
  return sendJson(res, 200, { ok: true, stats, result });
}

async function handleOwnerAiOpsAutopilotPlan(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  if (!isGenerativeAiConfigured()) {
    return sendJson(res, 503, { ok: false, code: "OPENAI_NOT_CONFIGURED" });
  }
  const stats = await buildOwnerAutomationStatsBundle();
  const result = await generateOwnerSiteAutopilotPlanLLM(stats);
  if (!result.ok) {
    const status = result.code === "AI_PARSE_ERROR" ? 400 : 502;
    return sendJson(res, status, result);
  }
  await sendAdminNotificationEmail("VibeCart AI — owner autopilot plan draft", [
    `Plan: ${String(result.planTitle || "").slice(0, 200)}`,
    `Workstreams: ${Array.isArray(result.workstreams) ? result.workstreams.length : 0}`,
    `Timestamp: ${new Date().toISOString()}`
  ]);
  return sendJson(res, 200, { ok: true, stats, result });
}

async function handlePublicAccountAiDigest(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const deliverPush = Boolean(body && body.deliverPush);
  const uid = Number(session.user_id || 0);
  const now = Date.now();
  const last = Number(publicAccountDigestRate.get(String(uid)) || 0);
  if (now - last < 4 * 60 * 1000) {
    return sendJson(res, 429, { ok: false, code: "RATE_LIMITED", message: "Account digest is limited to once every 4 minutes." });
  }
  publicAccountDigestRate.set(String(uid), now);
  if (publicAccountDigestRate.size > 8000) {
    const first = publicAccountDigestRate.keys().next().value;
    publicAccountDigestRate.delete(first);
  }
  const snapshot = await buildAccountSnapshotForDigest(uid);
  const result = await generateAccountActivityDigestLLM(snapshot);
  if (!result.ok) {
    const status = result.code === "AI_PARSE_ERROR" ? 400 : 502;
    return sendJson(res, status, result);
  }
  if (deliverPush) {
    const base = resolvePublicWebBaseUrl(req);
    const headline = String(result.headline || "Your VibeCart digest").trim().slice(0, 120);
    const nudge0 =
      Array.isArray(result.nudges) && result.nudges.length ? String(result.nudges[0] || "").trim() : "";
    const pushBody = (nudge0 || headline).slice(0, 500);
    try {
      await sendPushToUser(pool, {
        userId: uid,
        title: headline || "Account digest",
        message: pushBody,
        deepLink: `${base.replace(/\/$/, "")}/account-hub.html`,
        eventType: "account_ai_digest"
      });
    } catch {
      /* ignore push failures */
    }
  }
  return sendJson(res, 200, { ok: true, result });
}

async function handlePublicWebPushConfig(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const pub = String(process.env.VAPID_PUBLIC_KEY || "").trim();
  if (!pub) {
    return sendJson(res, 200, { ok: false, code: "WEB_PUSH_NOT_CONFIGURED" });
  }
  return sendJson(res, 200, { ok: true, publicKey: pub });
}

async function handlePublicWebPushRegister(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const sub = body && body.subscription ? body.subscription : body;
  try {
    await registerWebPushSubscription(pool, {
      userId: Number(session.user_id || 0),
      subscription: sub
    });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 400, {
      ok: false,
      code: "WEB_PUSH_REGISTER_FAILED",
      message: String(error.message || error).slice(0, 200)
    });
  }
}

async function handlePublicCoachWorkspaceEncouragePush(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
  }
  const uid = Number(session.user_id || 0);
  const now = Date.now();
  const last = Number(coachWorkspaceEncouragePushRate.get(String(uid)) || 0);
  if (now - last < 45 * 1000) {
    return sendJson(res, 429, {
      ok: false,
      code: "RATE_LIMITED",
      message: "Coach encouragement pushes are limited to once every 45 seconds."
    });
  }
  coachWorkspaceEncouragePushRate.set(String(uid), now);
  if (coachWorkspaceEncouragePushRate.size > 8000) {
    const first = coachWorkspaceEncouragePushRate.keys().next().value;
    coachWorkspaceEncouragePushRate.delete(first);
  }
  const title = String(body.title || "Your coach is with you").trim().slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 500);
  if (!message) {
    return sendJson(res, 400, { ok: false, code: "MISSING_MESSAGE", message: "message is required." });
  }
  const base = resolvePublicWebBaseUrl(req);
  const deep = `${String(base || "").replace(/\/$/, "")}/plan-workspace.html`;
  try {
    await sendPushToUser(pool, {
      userId: uid,
      title: title || "VibeCart Coach",
      message,
      deepLink: deep,
      eventType: "coach_workspace_encourage"
    });
  } catch {
    /* ignore push failures */
  }
  return sendJson(res, 200, { ok: true });
}

async function handleOwnerAiOpsRecommendations(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await generateAiOpsRecommendations(pool);
  return sendJson(res, 200, result);
}

async function handleOwnerAiOpsQueueRecommendations(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const dedupeWindowHours = Number(data.body?.dedupeWindowHours || AI_AUTOPILOT_DEDUPE_HOURS);
  const result = await queueAiOpsRecommendations(pool, { dedupeWindowHours });
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  await sendAdminNotificationEmail("AI operations recommendations queued", [
    `Queued: ${result.queuedCount}`,
    `Deduped: ${result.dedupedCount}`,
    `Interval mode: owner/manual`,
    `Timestamp: ${new Date().toISOString()}`
  ]);
  return sendJson(res, 200, result);
}

async function handleOwnerAiReadiness(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await getAiReadinessStatus(pool);
  return sendJson(res, 200, {
    ...result,
    automation: {
      enabled: AI_AUTOPILOT_ENABLED,
      intervalMinutes: AI_AUTOPILOT_INTERVAL_MINUTES,
      dedupeHours: AI_AUTOPILOT_DEDUPE_HOURS
    }
  });
}

async function runAiAutopilotCycle(trigger = "interval") {
  const result = await queueAiOpsRecommendations(pool, {
    dedupeWindowHours: AI_AUTOPILOT_DEDUPE_HOURS
  });
  if (result.ok && result.queuedCount > 0) {
    await sendAdminNotificationEmail("AI autopilot queued recommendations", [
      `Trigger: ${trigger}`,
      `Queued: ${result.queuedCount}`,
      `Deduped: ${result.dedupedCount}`,
      `Timestamp: ${new Date().toISOString()}`
    ]);
  }
  return result;
}

async function handleAiOpsCronAutopilot(req, res) {
  const cronHeader = String(req.headers["x-cron-token"] || "");
  if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
    return sendJson(res, 401, { ok: false, code: "INVALID_CRON_TOKEN" });
  }
  const result = await runAiAutopilotCycle("cron");
  return sendJson(res, result.ok ? 200 : 400, result);
}

async function handlePublicOrderCreate(req, res) {
  const session = await requirePublicSessionRole(req, res, new Set(["buyer"]));
  if (!session) {
    return;
  }
  const body = await readJson(req);
  const productId = Number(body.productId || 0);
  const quantity = Math.max(1, Math.min(20, Number(body.quantity || 1)));
  const shippingMethod = String(body.shippingMethod || "standard").trim().toLowerCase();
  const buyerCountry = String(body.buyerCountry || session.country_code || "").trim().toUpperCase();
  if (!productId || buyerCountry.length !== 2) {
    return sendJson(res, 400, { ok: false, code: "INVALID_ORDER_INPUT" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [products] = await conn.execute(
      `SELECT p.id, p.shop_id, p.base_price, p.currency, p.stock, p.origin_country, p.title
       FROM products p
       WHERE p.id = ?
         AND p.status = 'active'
       LIMIT 1`,
      [productId]
    );
    const product = products[0];
    if (!product) {
      await conn.rollback();
      return sendJson(res, 404, { ok: false, code: "PRODUCT_NOT_AVAILABLE" });
    }
    if (Number(product.stock || 0) < quantity) {
      await conn.rollback();
      return sendJson(res, 400, { ok: false, code: "INSUFFICIENT_STOCK" });
    }
    const unitPrice = Number(product.base_price || 0);
    const subtotal = Number((unitPrice * quantity).toFixed(2));
    const isCrossBorder = String(product.origin_country || "").toUpperCase() !== buyerCountry;
    const shippingQuote = resolveShippingQuote(shippingMethod, isCrossBorder, subtotal);
    const shippingFee = Number(shippingQuote.shippingFee || 0);
    const markupAmount = Number(shippingQuote.serviceFee || 0);
    const totalAmount = Number(shippingQuote.estimatedTotal || 0);
    const [insertOrder] = await conn.execute(
      `INSERT INTO orders (
        buyer_user_id, seller_shop_id, subtotal, markup_amount, shipping_fee, total_amount, currency, buyer_country, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        Number(session.user_id),
        Number(product.shop_id),
        subtotal,
        markupAmount,
        shippingFee,
        totalAmount,
        String(product.currency || "EUR").toUpperCase(),
        buyerCountry
      ]
    );
    const orderId = Number(insertOrder.insertId || 0);
    await conn.execute(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES (?, ?, ?, ?)`,
      [orderId, productId, quantity, unitPrice]
    );
    await conn.execute(
      `UPDATE products
       SET stock = GREATEST(0, stock - ?)
       WHERE id = ?`,
      [quantity, productId]
    );
    await conn.execute(
      `INSERT INTO order_status_updates (
        order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
      ) VALUES (?, 'order_created', ?, 'buyer', 1, 1)`,
      [orderId, `Order created for ${String(product.title || "item")} (${quantity}x).`]
    );
    await ensureSellerSaleNotificationsTable();
    const [sellerRows] = await conn.execute(
      `SELECT owner_user_id
       FROM shops
       WHERE id = ?
       LIMIT 1`,
      [Number(product.shop_id)]
    );
    const sellerUserId = Number(sellerRows[0]?.owner_user_id || 0);
    if (sellerUserId > 0) {
      await conn.execute(
        `INSERT INTO seller_sale_notifications (
          seller_user_id, product_id, order_id, message
        ) VALUES (?, ?, ?, ?)`,
        [
          sellerUserId,
          productId,
          orderId,
          `Sale: ${String(product.title || "item")} (${quantity}x) was ordered.`
        ]
      );
    }
    await ensureOrderSettlementTable();
    const sellerPayoutAmount = Number((totalAmount - markupAmount).toFixed(2));
    await conn.execute(
      `INSERT INTO order_settlements (
        order_id, seller_user_id, seller_shop_id, seller_payout_amount, service_fee_amount, currency, payout_status, assistant_summary
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        orderId,
        sellerUserId > 0 ? sellerUserId : 0,
        Number(product.shop_id),
        sellerPayoutAmount,
        markupAmount,
        String(product.currency || "EUR").toUpperCase(),
        "AI mediator: escrow started. Waiting for buyer and seller confirmation."
      ]
    );
    await conn.commit();
    try {
      await incrementSellerProductMetric(productId, "sold_count", quantity);
    } catch {
      /* ignore metric failures */
    }
    try {
      const [sellerOwnerRows] = await pool.execute(
        `SELECT owner_user_id
         FROM shops
         WHERE id = ?
         LIMIT 1`,
        [Number(product.shop_id)]
      );
      const sellerUserId = Number(sellerOwnerRows[0]?.owner_user_id || 0);
      if (sellerUserId > 0) {
        const ordersUrl = `${resolvePublicWebBaseUrl(req).replace(/\/$/, "")}/seller-orders.html`;
        await sendPushToUser(pool, {
          userId: sellerUserId,
          title: "Item sold on VibeCart",
          message: `${String(product.title || "One item")} (${quantity}x) has a new order.`,
          deepLink: ordersUrl,
          eventType: "seller_sale"
        });
      }
    } catch {
      /* ignore push failures */
    }
    return sendJson(res, 200, {
      ok: true,
      order: {
        orderId,
        productId,
        quantity,
        shippingMethod,
        subtotal,
        markupAmount,
        shippingFee,
        totalAmount,
        payoutToSeller: sellerPayoutAmount,
        serviceFee: markupAmount,
        currency: String(product.currency || "EUR").toUpperCase(),
        fromCountry: String(product.origin_country || "").toUpperCase(),
        toCountry: buyerCountry,
        status: "pending"
      },
      next: {
        paymentIntentEndpoint: "/api/public/payments/intent/create",
        trackingEndpoint: `/api/public/orders/track?orderId=${orderId}`,
        confirmEndpoint: "/api/public/orders/confirm"
      }
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback error
    }
    throw error;
  } finally {
    conn.release();
  }
}

async function handlePublicOrderTrack(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const urlObj = new URL(req.url, "http://localhost");
  const orderId = Number(urlObj.searchParams.get("orderId") || 0);
  if (!orderId) {
    return sendJson(res, 400, { ok: false, code: "INVALID_ORDER_ID" });
  }
  const [orders] = await pool.execute(
    `SELECT id, buyer_user_id, seller_shop_id, subtotal, markup_amount, shipping_fee, total_amount, currency, buyer_country, status, created_at
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [orderId]
  );
  const order = orders[0];
  if (!order) {
    return sendJson(res, 404, { ok: false, code: "ORDER_NOT_FOUND" });
  }
  const [sellerShops] = await pool.execute(
    `SELECT id
     FROM shops
     WHERE id = ?
       AND owner_user_id = ?
     LIMIT 1`,
    [Number(order.seller_shop_id), Number(session.user_id)]
  );
  const isBuyer = Number(order.buyer_user_id) === Number(session.user_id);
  const isSellerOwner = sellerShops.length > 0;
  if (!isBuyer && !isSellerOwner) {
    return sendJson(res, 403, { ok: false, code: "ORDER_FORBIDDEN" });
  }
  const [shipmentRows] = await pool.execute(
    `SELECT id, courier, shipping_method, from_country, to_country, tracking_number, status, created_at
     FROM shipments
     WHERE order_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [orderId]
  );
  const [updateRows] = await pool.execute(
    `SELECT status_code, status_message, actor_role, created_at
     FROM order_status_updates
     WHERE order_id = ?
     ORDER BY id DESC
     LIMIT 20`,
    [orderId]
  );
  await ensureOrderSettlementTable();
  const [settlementRows] = await pool.execute(
    `SELECT buyer_confirmed_at, seller_confirmed_at, released_at, seller_payout_amount, service_fee_amount, currency, payout_status, payout_reference, assistant_summary
     FROM order_settlements
     WHERE order_id = ?
     LIMIT 1`,
    [orderId]
  );
  const settlement = settlementRows[0] || null;
  const assistantSummary = buildOrderAssistantSummary(order, settlement);
  if (settlement && String(settlement.assistant_summary || "") !== assistantSummary) {
    await pool.execute(
      `UPDATE order_settlements
       SET assistant_summary = ?
       WHERE order_id = ?
       LIMIT 1`,
      [assistantSummary, orderId]
    );
  }
  return sendJson(res, 200, {
    ok: true,
    order: {
      orderId: Number(order.id),
      status: String(order.status),
      subtotal: Number(order.subtotal),
      markupAmount: Number(order.markup_amount),
      shippingFee: Number(order.shipping_fee),
      totalAmount: Number(order.total_amount),
      currency: String(order.currency),
      buyerCountry: String(order.buyer_country),
      createdAt: order.created_at
    },
    shipment: shipmentRows[0]
      ? {
          shipmentId: Number(shipmentRows[0].id),
          courier: String(shipmentRows[0].courier),
          shippingMethod: String(shipmentRows[0].shipping_method),
          fromCountry: String(shipmentRows[0].from_country),
          toCountry: String(shipmentRows[0].to_country),
          trackingNumber: String(shipmentRows[0].tracking_number || ""),
          status: String(shipmentRows[0].status),
          createdAt: shipmentRows[0].created_at
        }
      : null,
    updates: updateRows.map((row) => ({
      statusCode: String(row.status_code),
      statusMessage: String(row.status_message),
      actorRole: String(row.actor_role),
      createdAt: row.created_at
    })),
    settlement: settlement
      ? {
          buyerConfirmedAt: settlement.buyer_confirmed_at,
          sellerConfirmedAt: settlement.seller_confirmed_at,
          releasedAt: settlement.released_at,
          sellerPayoutAmount: Number(settlement.seller_payout_amount || 0),
          serviceFeeAmount: Number(settlement.service_fee_amount || 0),
          currency: String(settlement.currency || "EUR"),
          payoutStatus: String(settlement.payout_status || "pending"),
          payoutReference: String(settlement.payout_reference || "")
        }
      : null,
    assistant: {
      summary: assistantSummary
    }
  });
}

async function handlePublicOrderQuote(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const productId = Number(urlObj.searchParams.get("productId") || 0);
  const buyerCountry = String(urlObj.searchParams.get("buyerCountry") || "").trim().toUpperCase();
  const shippingMethod = String(urlObj.searchParams.get("shippingMethod") || "standard").trim().toLowerCase();
  const quantity = Math.max(1, Math.min(20, Number(urlObj.searchParams.get("quantity") || 1)));
  if (!productId || buyerCountry.length !== 2) {
    return sendJson(res, 400, { ok: false, code: "INVALID_QUOTE_INPUT" });
  }
  const [rows] = await pool.execute(
    `SELECT id, title, base_price, currency, origin_country
     FROM products
     WHERE id = ? AND status = 'active'
     LIMIT 1`,
    [productId]
  );
  const product = rows[0];
  if (!product) {
    return sendJson(res, 404, { ok: false, code: "PRODUCT_NOT_AVAILABLE" });
  }
  const subtotal = Number((Number(product.base_price || 0) * quantity).toFixed(2));
  const isCrossBorder = String(product.origin_country || "").toUpperCase() !== buyerCountry;
  const quote = resolveShippingQuote(shippingMethod, isCrossBorder, subtotal);
  return sendJson(res, 200, {
    ok: true,
    quote: {
      productId,
      title: String(product.title || ""),
      quantity,
      shippingMethod: quote.method,
      subtotal,
      shippingFee: quote.shippingFee,
      serviceFee: quote.serviceFee,
      totalAmount: quote.estimatedTotal,
      currency: String(product.currency || "EUR").toUpperCase(),
      fromCountry: String(product.origin_country || "").toUpperCase(),
      toCountry: buyerCountry,
      options: isCrossBorder
        ? [
            { code: "economy", fee: 9.5 },
            { code: "standard", fee: 14.5 },
            { code: "express", fee: 19.5 },
            { code: "pickup", fee: 0 }
          ]
        : [
            { code: "economy", fee: 4.5 },
            { code: "standard", fee: 6.5 },
            { code: "express", fee: 9.5 },
            { code: "pickup", fee: 0 }
          ]
    }
  });
}

async function handlePublicOrderConfirm(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const body = await readJson(req);
  const orderId = Number(body.orderId || 0);
  if (!orderId) {
    return sendJson(res, 400, { ok: false, code: "INVALID_ORDER_ID" });
  }
  const [orderRows] = await pool.execute(
    `SELECT id, buyer_user_id, seller_shop_id
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [orderId]
  );
  const order = orderRows[0];
  if (!order) {
    return sendJson(res, 404, { ok: false, code: "ORDER_NOT_FOUND" });
  }
  const [sellerRows] = await pool.execute(
    `SELECT owner_user_id
     FROM shops
     WHERE id = ?
     LIMIT 1`,
    [Number(order.seller_shop_id)]
  );
  const sellerUserId = Number(sellerRows[0]?.owner_user_id || 0);
  const isBuyer = Number(order.buyer_user_id) === Number(session.user_id);
  const isSeller = sellerUserId > 0 && sellerUserId === Number(session.user_id);
  if (!isBuyer && !isSeller) {
    return sendJson(res, 403, { ok: false, code: "ORDER_FORBIDDEN" });
  }
  await ensureOrderSettlementTable();
  if (isBuyer) {
    await pool.execute(
      `UPDATE order_settlements
       SET buyer_confirmed_at = COALESCE(buyer_confirmed_at, CURRENT_TIMESTAMP)
       WHERE order_id = ?
       LIMIT 1`,
      [orderId]
    );
  }
  if (isSeller) {
    await pool.execute(
      `UPDATE order_settlements
       SET seller_confirmed_at = COALESCE(seller_confirmed_at, CURRENT_TIMESTAMP)
       WHERE order_id = ?
       LIMIT 1`,
      [orderId]
    );
  }
  await pool.execute(
    `INSERT INTO order_status_updates (
      order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
    ) VALUES (?, 'delivery_confirmation', ?, ?, 1, 1)`,
    [orderId, isBuyer ? "Buyer confirmed delivery details." : "Seller confirmed fulfillment details.", isBuyer ? "buyer" : "seller"]
  );
  const release = await tryReleaseOrderSettlement(orderId);
  return sendJson(res, 200, {
    ok: true,
    orderId,
    side: isBuyer ? "buyer" : "seller",
    released: Boolean(release && release.released),
    payoutStatus: release?.payoutStatus || "pending"
  });
}

async function handlePublicOrdersMine(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const [sellerShopRows] = await pool.execute(
    `SELECT id
     FROM shops
     WHERE owner_user_id = ?
     ORDER BY id ASC
     LIMIT 1`,
    [Number(session.user_id)]
  );
  const sellerShopId = Number(sellerShopRows[0]?.id || 0);
  const [rows] = await pool.execute(
    `SELECT o.id, o.status, o.total_amount, o.currency, o.created_at, o.buyer_user_id, o.seller_shop_id,
            oi.product_id, oi.quantity, p.title,
            os.buyer_confirmed_at, os.seller_confirmed_at, os.released_at, os.payout_status, os.seller_payout_amount, os.service_fee_amount, os.assistant_summary
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     LEFT JOIN order_settlements os ON os.order_id = o.id
     WHERE o.buyer_user_id = ? OR (? > 0 AND o.seller_shop_id = ?)
     ORDER BY o.id DESC
     LIMIT 150`,
    [Number(session.user_id), sellerShopId, sellerShopId]
  );
  return sendJson(res, 200, {
    ok: true,
    orders: rows.map((row) => ({
      orderId: Number(row.id),
      status: String(row.status || ""),
      totalAmount: Number(row.total_amount || 0),
      currency: String(row.currency || "EUR"),
      createdAt: row.created_at,
      productId: Number(row.product_id || 0),
      title: String(row.title || ""),
      quantity: Number(row.quantity || 1),
      progress: {
        buyerConfirmedAt: row.buyer_confirmed_at,
        sellerConfirmedAt: row.seller_confirmed_at,
        releasedAt: row.released_at,
        payoutStatus: String(row.payout_status || "pending"),
        sellerPayoutAmount: row.seller_payout_amount == null ? null : Number(row.seller_payout_amount),
        serviceFeeAmount: row.service_fee_amount == null ? null : Number(row.service_fee_amount),
        assistantSummary: String(row.assistant_summary || "")
      }
    }))
  });
}

async function handlePublicOrderDisputeCreate(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token, req);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  const body = await readJson(req);
  const orderId = Number(body.orderId || 0);
  const reason = String(body.reason || "").trim().slice(0, 600);
  if (!orderId || reason.length < 8) {
    return sendJson(res, 400, { ok: false, code: "INVALID_DISPUTE_INPUT" });
  }
  const [orderRows] = await pool.execute(
    `SELECT o.id, o.buyer_user_id, o.seller_shop_id, s.owner_user_id AS seller_user_id
     FROM orders o
     LEFT JOIN shops s ON s.id = o.seller_shop_id
     WHERE o.id = ?
     LIMIT 1`,
    [orderId]
  );
  const order = orderRows[0];
  if (!order) {
    return sendJson(res, 404, { ok: false, code: "ORDER_NOT_FOUND" });
  }
  const isBuyer = Number(order.buyer_user_id) === Number(session.user_id);
  const isSeller = Number(order.seller_user_id || 0) === Number(session.user_id);
  if (!isBuyer && !isSeller) {
    return sendJson(res, 403, { ok: false, code: "ORDER_FORBIDDEN" });
  }
  const actorRole = isBuyer ? "buyer" : "seller";
  await pool.execute(
    `INSERT INTO order_status_updates (
      order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
    ) VALUES (?, 'dispute_opened', ?, ?, 1, 1)`,
    [orderId, `Dispute opened by ${actorRole}: ${reason}`, actorRole]
  );
  await pool.execute(`UPDATE orders SET status = 'disputed' WHERE id = ? LIMIT 1`, [orderId]);
  await ensureOrderSettlementTable();
  await pool.execute(
    `UPDATE order_settlements
     SET assistant_summary = ?
     WHERE order_id = ?
     LIMIT 1`,
    ["AI mediator: dispute opened. Auto-release paused until resolution update is posted.", orderId]
  );
  return sendJson(res, 200, { ok: true, orderId, status: "disputed" });
}

async function handlePublicSellerPayoutAccountGet(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const session = await requirePublicSessionRole(req, res, VC_SELLER_LISTING_ROLES);
  if (!session) return;
  await ensureSellerPayoutAccountsTable();
  const [rows] = await pool.execute(
    `SELECT stripe_account_id
     FROM seller_payout_accounts
     WHERE seller_user_id = ?
     LIMIT 1`,
    [Number(session.user_id)]
  );
  const raw = rows[0] ? String(rows[0].stripe_account_id || "").trim() : "";
  return sendJson(res, 200, {
    ok: true,
    hasAccount: Boolean(raw),
    stripeAccountId: raw
  });
}

async function handlePublicSellerPayoutAccountUpsert(req, res) {
  const session = await requirePublicSessionRole(req, res, VC_SELLER_LISTING_ROLES);
  if (!session) return;
  const body = await readJson(req);
  const stripeAccountId = String(body.stripeAccountId || "").trim();
  if (!/^acct_[a-zA-Z0-9]+$/.test(stripeAccountId)) {
    return sendJson(res, 400, { ok: false, code: "INVALID_STRIPE_ACCOUNT_ID" });
  }
  await ensureSellerPayoutAccountsTable();
  await pool.execute(
    `INSERT INTO seller_payout_accounts (seller_user_id, stripe_account_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE stripe_account_id = VALUES(stripe_account_id)`,
    [Number(session.user_id), stripeAccountId]
  );
  return sendJson(res, 200, { ok: true, stripeAccountId });
}

async function handlePublicProductsLive(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const categoryId = Number(urlObj.searchParams.get("categoryId") || 0);
  const fromCountry = String(urlObj.searchParams.get("fromCountry") || "").trim().toUpperCase();
  const bridgePath = String(urlObj.searchParams.get("bridgePath") || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(100, Number(urlObj.searchParams.get("limit") || 40)));
  const filters = [];
  const params = [];
  const europeOriginCodes = [
    "PL",
    "DE",
    "FR",
    "ES",
    "IT",
    "NL",
    "BE",
    "PT",
    "SE",
    "NO",
    "DK",
    "FI",
    "IE",
    "AT",
    "CZ",
    "HU",
    "RO",
    "GR",
    "CH",
    "GB"
  ];
  const africaOriginCodes = [
    "ZA",
    "KE",
    "NG",
    "GH",
    "ZW",
    "NA",
    "ET",
    "TZ",
    "UG",
    "RW",
    "BW",
    "ZM"
  ];
  if (categoryId > 0) {
    filters.push("p.category_id = ?");
    params.push(categoryId);
  }
  if (fromCountry.length === 2) {
    filters.push("p.origin_country = ?");
    params.push(fromCountry);
  }
  if (!fromCountry && bridgePath === "from-europe") {
    filters.push(`p.origin_country IN (${europeOriginCodes.map(() => "?").join(",")})`);
    params.push(...europeOriginCodes);
  } else if (!fromCountry && bridgePath === "from-africa") {
    filters.push(`p.origin_country IN (${africaOriginCodes.map(() => "?").join(",")})`);
    params.push(...africaOriginCodes);
  }
  const whereClause = filters.length > 0 ? ` AND ${filters.join(" AND ")}` : "";
  const sql = `SELECT p.id, p.shop_id, s.name AS shop_name, p.category_id, p.title, p.base_price, p.currency, p.stock, p.origin_country
     FROM products p
     JOIN shops s ON s.id = p.shop_id
     WHERE p.status = 'active'
       AND p.stock > 0
       ${whereClause}
     ORDER BY p.id DESC
     LIMIT ${limit}`;
  const [rows] = params.length > 0 ? await pool.execute(sql, params) : await pool.query(sql);
  if (Array.isArray(rows) && rows.length) {
    const ids = rows.map((row) => Number(row.id || 0)).filter((id) => id > 0);
    if (ids.length) {
      try {
        await ensureSellerProductMetricsTable();
        const values = ids.map((id) => `(${id},1)`).join(",");
        await pool.query(
          `INSERT INTO seller_product_metrics (product_id, view_count)
           VALUES ${values}
           ON DUPLICATE KEY UPDATE view_count = view_count + VALUES(view_count)`
        );
      } catch {
        /* ignore metric failures */
      }
    }
  }
  return sendJson(res, 200, {
    ok: true,
    count: rows.length,
    products: rows.map((row) => ({
      id: Number(row.id),
      shopId: Number(row.shop_id),
      shopName: String(row.shop_name),
      categoryId: Number(row.category_id),
      title: String(row.title),
      basePrice: Number(row.base_price),
      currency: String(row.currency || "EUR"),
      stock: Number(row.stock),
      originCountry: String(row.origin_country || "").toUpperCase()
    }))
  });
}

async function handlePublicPaymentConfig(req, res) {
  return sendJson(res, 200, {
    ok: true,
    provider: PAYMENT_PROVIDER,
    stripePublishableKey: STRIPE_PUBLISHABLE_KEY || null
  });
}

async function handlePublicCreatePaymentIntent(req, res) {
  if (PAYMENT_PROVIDER !== "stripe") {
    return sendJson(res, 400, { ok: false, code: "UNSUPPORTED_PAYMENT_PROVIDER" });
  }
  if (!stripe) {
    return sendJson(res, 500, { ok: false, code: "STRIPE_NOT_CONFIGURED" });
  }
  if (!PAYMENT_INTENT_API_SECRET) {
    return sendJson(res, 503, {
      ok: false,
      code: "PAYMENT_INTENT_SECRET_NOT_CONFIGURED",
      message:
        "Set PAYMENT_INTENT_API_SECRET in Railway and call this endpoint only from a trusted server (never from public browser JS)."
    });
  }
  const intentSecretHeader = String(req.headers["x-payment-intent-secret"] || "").trim();
  if (intentSecretHeader !== PAYMENT_INTENT_API_SECRET) {
    return sendJson(res, 401, { ok: false, code: "INVALID_PAYMENT_INTENT_SECRET" });
  }
  const body = await readJson(req);
  const result = await createStripePaymentIntent(pool, stripe, body || {});
  if (!result.ok) {
    return sendJson(res, 400, result);
  }
  await sendAdminNotificationEmail("Payment intent created", [
    `Order ID: ${result.orderId}`,
    `Provider: ${result.provider}`,
    `Amount: ${result.amount} ${result.currency}`,
    `Payment intent: ${result.paymentIntentId}`,
    `Timestamp: ${new Date().toISOString()}`
  ]);
  return sendJson(res, 200, result);
}

function coachPlanMeta(plan) {
  const p = String(plan || "").trim().toLowerCase();
  if (p === "pro") return { plan: "pro", amount: 30, currency: "EUR", label: "Coach Pro Elite" };
  if (p === "plus") return { plan: "plus", amount: 18.5, currency: "EUR", label: "Coach Plus Gym" };
  if (p === "ai-home") return { plan: "ai-home", amount: 12.5, currency: "EUR", label: "AI Home + Meals" };
  return { plan: "starter", amount: 10.5, currency: "EUR", label: "Coach Starter" };
}

function resolveCheckoutAmount(flow, plan, addonPlan) {
  const f = String(flow || "").trim().toLowerCase();
  const p = String(plan || "").trim().toLowerCase();
  const addon = String(addonPlan || "").trim().toLowerCase();
  if (f === "coach") {
    const primary = coachPlanMeta(p);
    if (!addon || addon === primary.plan) {
      return {
        amount: primary.amount,
        currency: primary.currency,
        label: primary.label,
        plans: [primary.plan]
      };
    }
    const second = coachPlanMeta(addon);
    const amount = Number((primary.amount + second.amount).toFixed(2));
    return {
      amount,
      currency: "EUR",
      label: `${primary.label} + ${second.label} Bundle`,
      plans: [primary.plan, second.plan]
    };
  }
  if (f === "insurance") {
    if (p === "shield-pro") return { amount: 24.5, currency: "EUR", label: "Health Shield Pro" };
    if (p === "family-protect") return { amount: 17.5, currency: "EUR", label: "Family Protect" };
    return { amount: 10.5, currency: "EUR", label: "Student Lite" };
  }
  if (f === "top_class") {
    return { amount: 39.99, currency: "EUR", label: "Top-Class Prestige Membership" };
  }
  return { amount: 10, currency: "EUR", label: "Service Checkout" };
}

function resolveStripeCheckoutMoney(amountMeta, method) {
  const selected = String(method || "").trim().toLowerCase();
  let amount = Number(amountMeta.amount || 0);
  let currency = String(amountMeta.currency || "USD").trim().toUpperCase();
  // BLIK requires PLN in Stripe Checkout, so convert when needed.
  if (selected === "blik" && currency !== "PLN") {
    const fxToPln = {
      USD: 4.0,
      EUR: 4.3,
      GBP: 5.0
    };
    const rate = Number(fxToPln[currency] || 4.0);
    amount = amount * rate;
    currency = "PLN";
  }
  return {
    amount: Math.max(0, Number(amount.toFixed(2))),
    currency
  };
}

function resolveStripePaymentTypes(method) {
  const selected = String(method || "").trim().toLowerCase();
  if (selected === "blik") {
    return ["blik", "card"];
  }
  if (selected === "paypal") {
    return ["paypal", "card"];
  }
  if (selected === "revolut") {
    return ["revolut_pay", "card"];
  }
  // Wallets like Apple Pay / Google Pay are served through card rails in Checkout.
  return ["card"];
}

function stripeCheckoutCustomText() {
  return {
    submit: {
      message:
        "Final amount is calculated for your country at payment (taxes may apply). By continuing, you authorize the displayed total to be charged."
    }
  };
}

/**
 * Stripe success/cancel URLs must point at the static site (Netlify), not the API host (Railway).
 * Set PUBLIC_WEB_ORIGIN or VIBECART_WEB_URL (e.g. https://vibe-cart.com) in production if proxies omit X-Forwarded-Host.
 */
function tryPublicSiteOriginFromReferer(req) {
  const trimOrigin = (s) => String(s || "").trim().replace(/\/+$/, "");
  const ref = String(req.headers.referer || req.headers.referrer || "").trim();
  if (!ref) {
    return "";
  }
  try {
    const u = new URL(ref);
    const o = trimOrigin(u.origin);
    if (!o || !/^https?:\/\//i.test(o)) {
      return "";
    }
    const low = o.toLowerCase();
    if (low.includes("railway.app") || low.includes(".rlwy.net")) {
      return "";
    }
    return o;
  } catch {
    return "";
  }
}

function resolvePublicWebBaseUrl(req) {
  const trimOrigin = (s) => String(s || "").trim().replace(/\/+$/, "");
  const fromEnv = trimOrigin(process.env.PUBLIC_WEB_ORIGIN || process.env.VIBECART_WEB_URL || "");
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv;
  }
  const fromRef = tryPublicSiteOriginFromReferer(req);
  if (fromRef) {
    return fromRef;
  }
  const xfRaw = String(req.headers["x-forwarded-host"] || "").trim();
  const xfHost = xfRaw.split(",")[0].trim();
  const protoRaw = String(req.headers["x-forwarded-proto"] || "https").trim();
  const proto = (protoRaw.split(",")[0].trim() || "https").toLowerCase();
  const safeProto = proto === "http" ? "http" : "https";
  const host = String(req.headers.host || "").trim();
  if (xfHost) {
    return `${safeProto}://${xfHost}`;
  }
  const hl = host.toLowerCase();
  if (hl.includes("railway.app") || hl.includes(".rlwy.net")) {
    return "https://vibe-cart.com";
  }
  return `${safeProto}://${host || "vibe-cart.com"}`;
}

function buildPostPaymentReturnUrl(baseUrl, flow, plan, method, addonPlan) {
  const f = String(flow || "").trim().toLowerCase();
  const p = String(plan || "").trim().toLowerCase();
  const m = String(method || "card").trim().toLowerCase();
  const addon = String(addonPlan || "").trim().toLowerCase();
  if (f === "coach" || f === "insurance") {
    return (
      `${baseUrl}/plan-workspace.html?flow=${encodeURIComponent(f)}` +
      `&plan=${encodeURIComponent(p || "standard")}` +
      (addon ? `&addonPlan=${encodeURIComponent(addon)}` : "") +
      `&provider=${encodeURIComponent(m || "card")}`
    );
  }
  if (f === "top_class") {
    return (
      `${baseUrl}/top-class-checkout.html?flow=top_class` +
      `&plan=${encodeURIComponent(p || "prestige")}` +
      `&provider=${encodeURIComponent(m || "card")}` +
      `&paid=1`
    );
  }
  return `${baseUrl}/payment-confirmation.html?provider=${encodeURIComponent(m || "card")}`;
}

async function createStripePrefillCustomer(input) {
  if (!stripe) {
    return null;
  }
  const email = String(input.email || "").trim();
  const name = String(input.name || "").trim();
  const phone = String(input.phone || "").trim();
  const line1 = String(input.addressLine1 || "").trim();
  const city = String(input.city || "").trim();
  const postalCode = String(input.postalCode || "").trim();
  const country = String(input.country || "").trim().toUpperCase();
  if (!email && !name) {
    return null;
  }
  try {
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: name || undefined,
      phone: phone || undefined,
      address:
        line1 || city || postalCode || country
          ? {
              line1: line1 || undefined,
              city: city || undefined,
              postal_code: postalCode || undefined,
              country: country || undefined
            }
          : undefined
    });
    return customer && customer.id ? String(customer.id) : null;
  } catch {
    return null;
  }
}

async function createPaypalOrder(input) {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!tokenRes.ok) {
    return { ok: false, code: "PAYPAL_AUTH_FAILED" };
  }
  const tokenBody = await tokenRes.json();
  const accessToken = String(tokenBody.access_token || "");
  if (!accessToken) {
    return { ok: false, code: "PAYPAL_TOKEN_MISSING" };
  }
  const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: input.currency,
            value: input.amount.toFixed(2)
          },
          description: input.label
        }
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl
      }
    })
  });
  if (!orderRes.ok) {
    return { ok: false, code: "PAYPAL_ORDER_CREATE_FAILED" };
  }
  const orderBody = await orderRes.json();
  const approveLink = Array.isArray(orderBody.links)
    ? orderBody.links.find((l) => String(l.rel || "").toLowerCase() === "approve")
    : null;
  if (!approveLink || !approveLink.href) {
    return { ok: false, code: "PAYPAL_APPROVAL_LINK_MISSING" };
  }
  return { ok: true, orderId: String(orderBody.id || ""), redirectUrl: String(approveLink.href) };
}

async function handlePublicCheckoutStart(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const body = await readJson(req);
  const method = String(body.paymentMethod || "").trim().toLowerCase();
  const flow = String(body.flow || "").trim().toLowerCase();
  const plan = String(body.plan || "").trim().toLowerCase();
  const addonPlan = String(body.addonPlan || "").trim().toLowerCase();
  const autoRenew = String(body.autoRenew || "0").trim() === "1";
  const amountMeta = resolveCheckoutAmount(flow, plan, addonPlan);
  const money = resolveStripeCheckoutMoney(amountMeta, method);
  const paymentTypes = resolveStripePaymentTypes(method);
  if (!Number.isFinite(amountMeta.amount) || amountMeta.amount < 0) {
    return sendJson(res, 400, { ok: false, code: "INVALID_CHECKOUT_AMOUNT" });
  }
  if (amountMeta.amount === 0) {
    const baseFree = resolvePublicWebBaseUrl(req);
    return sendJson(res, 200, {
      ok: true,
      free: true,
      redirectUrl: `${baseFree}/payment-confirmation.html?provider=free`
    });
  }
  const baseUrl = resolvePublicWebBaseUrl(req);
  const returnUrl = buildPostPaymentReturnUrl(baseUrl, flow, plan, method, addonPlan);
  const cancelUrl =
    flow === "top_class"
      ? `${baseUrl}/top-class-checkout.html?flow=top_class&plan=${encodeURIComponent(plan || "prestige")}&cancelled=1`
      : `${baseUrl}/checkout-details.html?flow=${encodeURIComponent(flow)}&plan=${encodeURIComponent(plan)}`;

  if (!stripe) {
    return sendJson(res, 503, { ok: false, code: "STRIPE_NOT_CONFIGURED" });
  }
  const customerId = await createStripePrefillCustomer({
    email: body.customerEmail || session.email,
    name: body.customerName,
    phone: body.customerPhone,
    addressLine1: body.customerAddress,
    city: body.customerCity,
    postalCode: body.customerPostalCode,
    country: body.customerCountry
  });
  const isCoachAutoRenew = autoRenew && flow === "coach";
  const checkoutMode = isCoachAutoRenew ? "subscription" : "payment";
  const lineItemPriceData = {
    currency: money.currency.toLowerCase(),
    unit_amount: Math.round(money.amount * 100),
    product_data: {
      name: amountMeta.label,
      description: `Customer selected method: ${method || "card"}`
    }
  };
  if (checkoutMode === "subscription") {
    lineItemPriceData.recurring = { interval: "month" };
  }
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: checkoutMode,
    success_url: `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    billing_address_collection: "required",
    automatic_tax: { enabled: true },
    custom_text: stripeCheckoutCustomText(),
    customer: customerId || undefined,
    customer_email: customerId ? undefined : String(body.customerEmail || "").trim() || undefined,
    customer_update: {
      address: "auto",
      name: "auto"
    },
    payment_method_types: paymentTypes,
    line_items: [
      {
        quantity: 1,
        price_data: lineItemPriceData
      }
    ],
    subscription_data: checkoutMode === "subscription"
      ? {
          metadata: {
            flow,
            plan,
            addonPlan: addonPlan || "",
            selectedMethod: method || "card",
            autoRenew: "1",
            vibecart_user_id: String(Number(session.user_id) || ""),
            userId: String(Number(session.user_id) || "")
          }
        }
      : undefined,
    metadata: {
      flow,
      plan,
      addonPlan: addonPlan || "",
      selectedMethod: method || "card",
      autoRenew: isCoachAutoRenew ? "1" : "0",
      route: "all-methods-to-stripe",
      vibecart_user_id: String(Number(session.user_id) || ""),
      userId: String(Number(session.user_id) || "")
    }
  });
  return sendJson(res, 200, {
    ok: true,
    provider: "stripe",
    providerReference: String(checkoutSession.id || ""),
    redirectUrl: String(checkoutSession.url || "")
  });
}

/**
 * Lets a signed-in buyer reopen their coach workspace after a bad post-pay redirect (e.g. wrong host),
 * without charging again. Retrieves the Stripe Checkout session, confirms it is paid and belongs to
 * this account, then runs the same idempotent fulfillment as the webhook.
 */
async function handlePublicCheckoutRecover(req, res) {
  let recoverToken = getBearerToken(req);
  if (!recoverToken && req && req.url) {
    try {
      const recoverUrlObj = new URL(req.url, "http://localhost");
      recoverToken = String(
        recoverUrlObj.searchParams.get("token") || recoverUrlObj.searchParams.get("authToken") || ""
      ).trim();
    } catch {
      recoverToken = "";
    }
  }
  if (!recoverToken) {
    sendHighValueAccountRequired(res);
    return;
  }
  const acct = await requirePublicSession(recoverToken, req, { skipDeviceBinding: true });
  if (!acct) {
    sendHighValueAccountRequired(res);
    return;
  }
  if (!stripe) {
    return sendJson(res, 503, { ok: false, code: "STRIPE_NOT_CONFIGURED" });
  }
  let sessionId = "";
  if (req.method === "POST") {
    try {
      const body = await readJson(req);
      sessionId = String(body.session_id || body.sessionId || "").trim();
    } catch {
      return sendJson(res, 400, { ok: false, code: "INVALID_JSON" });
    }
  }
  if (!sessionId) {
    try {
      const urlObj = new URL(req.url, "http://localhost");
      sessionId = String(urlObj.searchParams.get("session_id") || "").trim();
    } catch {
      sessionId = "";
    }
  }
  // Stripe Checkout session ids are cs_test_… / cs_live_… (underscores after the mode prefix).
  if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return sendJson(res, 400, {
      ok: false,
      code: "INVALID_SESSION_ID",
      message: "Use the Checkout session ID from your Stripe receipt (starts with cs_)."
    });
  }
  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return sendJson(res, 400, {
      ok: false,
      code: "STRIPE_SESSION_NOT_FOUND",
      message:
        "Stripe could not find that session. Double-check the Checkout session ID (e.g. from the receipt link after session_id=, or Stripe Dashboard), live vs test mode, and that it matches this environment."
    });
  }
  const paymentStatus = String(checkoutSession.payment_status || "").toLowerCase();
  if (paymentStatus !== "paid") {
    return sendJson(res, 400, {
      ok: false,
      code: "PAYMENT_NOT_COMPLETE",
      paymentStatus,
      message:
        "Stripe still shows this checkout as not paid. If you were charged, wait a few minutes and try again, or open the receipt link in your Stripe email."
    });
  }
  const metadata = checkoutSession.metadata || {};
  const normalizedPlan = String(metadata.plan || "").trim().toLowerCase();
  const normalizedAddonPlan = String(metadata.addonPlan || "").trim().toLowerCase();
  const hasCoachPlanHint = new Set(["starter", "plus", "pro", "ai-home"]).has(normalizedPlan)
    || new Set(["starter", "plus", "pro", "ai-home"]).has(normalizedAddonPlan);
  const metadataFlow = String(metadata.flow || "").trim().toLowerCase();
  const flow = metadataFlow === "coach" || (!metadataFlow && hasCoachPlanHint) ? "coach" : metadataFlow;
  if (flow !== "coach") {
    return sendJson(res, 400, {
      ok: false,
      code: "NOT_COACH_CHECKOUT",
      message: "This receipt is not for a health coach package."
    });
  }
  const metaUser = Number(metadata.vibecart_user_id || metadata.userId || 0);
  const stripeEmail = String(
    checkoutSession.customer_details?.email || checkoutSession.customer_email || ""
  )
    .trim()
    .toLowerCase();
  const acctEmail = String(acct.email || "")
    .trim()
    .toLowerCase();
  const ownUserId = Number(acct.user_id);
  if (metaUser && metaUser !== ownUserId) {
    const canTrustEmailMatch = stripeEmail && acctEmail && stripeEmail === acctEmail;
    if (!canTrustEmailMatch) {
      return sendJson(res, 403, {
        ok: false,
        code: "NOT_YOUR_PURCHASE",
        message: "This payment is tied to a different VibeCart account."
      });
    }
  }
  if (!metaUser) {
    if (!stripeEmail || stripeEmail !== acctEmail) {
      return sendJson(res, 403, {
        ok: false,
        code: "EMAIL_MISMATCH",
        message: "Sign in with the same email you used at checkout, then try again."
      });
    }
  }
  const fulfillResult = await fulfillStripeCoachCheckoutSession(pool, checkoutSession);
  if (!fulfillResult.ok) {
    return sendJson(res, 400, fulfillResult);
  }
  const baseUrl = resolvePublicWebBaseUrl(req);
  const plan = String(metadata.plan || "starter").trim().toLowerCase();
  const addonPlan = String(metadata.addonPlan || "").trim().toLowerCase();
  const method = String(metadata.selectedMethod || "card")
    .trim()
    .toLowerCase();
  let redirectUrl = buildPostPaymentReturnUrl(baseUrl, flow, plan, method, addonPlan);
  if (!redirectUrl.includes("session_id=")) {
    redirectUrl += (redirectUrl.includes("?") ? "&" : "?") + "session_id=" + encodeURIComponent(sessionId);
  }
  return sendJson(res, 200, {
    ok: true,
    fulfillment: fulfillResult,
    redirectUrl
  });
}

/**
 * Signed-in user: list fulfilled Stripe coach checkouts so the web app can hydrate localStorage
 * and avoid plan-workspace ↔ account-hub redirect loops when the browser never captured session_id.
 */
async function handlePublicCoachCheckoutSessionsList(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const uid = Number(session.user_id);
  if (!uid) {
    return sendJson(res, 400, { ok: false, code: "INVALID_USER" });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT stripe_checkout_session_id AS sessionId, plan_slug AS plan, addon_slug AS addonPlan, created_at AS fulfilledAt
       FROM stripe_checkout_fulfillment_events
       WHERE user_id = ? AND flow = 'coach' AND payment_status = 'paid'
       ORDER BY id DESC
       LIMIT 25`,
      [uid]
    );
    const [subRows] = await pool.execute(
      `SELECT s.status, s.auto_renew, s.end_at, p.plan_code
       FROM health_user_subscriptions s
       JOIN health_subscription_plans p ON p.id = s.plan_id
       WHERE s.user_id = ?
       ORDER BY s.id DESC
       LIMIT 1`,
      [uid]
    );
    const sub = Array.isArray(subRows) && subRows[0] ? subRows[0] : null;
    const planCode = String((sub && sub.plan_code) || "").trim().toUpperCase();
    const subscriptionPlan =
      planCode === "PRO" ? "pro" : planCode === "PLUS" ? "plus" : planCode === "FREE" ? "starter" : "";
    const subscriptionStatus = String((sub && sub.status) || "").trim().toLowerCase();
    const renewal = {
      hasSubscription: Boolean(sub),
      subscriptionPlan: subscriptionPlan || "",
      subscriptionStatus,
      autoRenew: Boolean(sub && Number(sub.auto_renew) === 1),
      endAt: (sub && sub.end_at) || null,
      locked: subscriptionStatus === "paused"
    };
    const sessions = (Array.isArray(rows) ? rows : [])
      .map((r) => ({
        sessionId: String(r.sessionId || "").trim(),
        plan: String(r.plan || "starter").trim().toLowerCase(),
        addonPlan: String(r.addonPlan || "").trim().toLowerCase(),
        provider: "card",
        fulfilledAt: r.fulfilledAt || null
      }))
      .filter((s) => /^cs_[a-zA-Z0-9_]+$/.test(s.sessionId));
    return sendJson(res, 200, { ok: true, sessions, renewal });
  } catch {
    return sendJson(res, 200, { ok: true, sessions: [], renewal: { hasSubscription: false, locked: false } });
  }
}

async function handlePublicCheckoutRedirect(req, res) {
  const session = await requirePublicAccountSession(req, res);
  if (!session) {
    return;
  }
  const urlObj = new URL(req.url, "http://localhost");
  const flow = String(urlObj.searchParams.get("flow") || "").trim().toLowerCase();
  const plan = String(urlObj.searchParams.get("plan") || "").trim().toLowerCase();
  const addonPlan = String(urlObj.searchParams.get("addonPlan") || "").trim().toLowerCase();
  const method = String(urlObj.searchParams.get("paymentMethod") || "").trim().toLowerCase();
  const customerName = String(urlObj.searchParams.get("customerName") || "").trim();
  const customerEmail = String(urlObj.searchParams.get("customerEmail") || "").trim();
  const customerPhone = String(urlObj.searchParams.get("customerPhone") || "").trim();
  const customerAddress = String(urlObj.searchParams.get("customerAddress") || "").trim();
  const customerCity = String(urlObj.searchParams.get("customerCity") || "").trim();
  const customerPostalCode = String(urlObj.searchParams.get("customerPostalCode") || "").trim();
  const autoRenew = String(urlObj.searchParams.get("autoRenew") || "0").trim() === "1";
  let customerCountry = String(urlObj.searchParams.get("customerCountry") || "").trim().toUpperCase();
  if (!customerCountry || customerCountry.length !== 2) {
    customerCountry = String(session.country_code || "").trim().toUpperCase() || "PL";
  }
  const amountMeta = resolveCheckoutAmount(flow, plan, addonPlan);
  const money = resolveStripeCheckoutMoney(amountMeta, method);
  const paymentTypes = resolveStripePaymentTypes(method);
  if (!Number.isFinite(amountMeta.amount) || amountMeta.amount < 0) {
    const baseFree = resolvePublicWebBaseUrl(req);
    res.statusCode = 302;
    res.setHeader(
      "Location",
      `${baseFree}/payment-confirmation.html?provider=free&flow=${encodeURIComponent(flow || "service")}&plan=${encodeURIComponent(plan || "standard")}`
    );
    res.end();
    return;
  }
  if (!stripe) {
    return sendJson(res, 503, { ok: false, code: "STRIPE_NOT_CONFIGURED" });
  }
  const customerId = await createStripePrefillCustomer({
    email: customerEmail || String(session.email || ""),
    name: customerName,
    phone: customerPhone,
    addressLine1: customerAddress,
    city: customerCity,
    postalCode: customerPostalCode,
    country: customerCountry
  });
  const baseUrl = resolvePublicWebBaseUrl(req);
  const returnUrl = buildPostPaymentReturnUrl(baseUrl, flow, plan, method, addonPlan);
  const cancelUrl =
    flow === "top_class"
      ? `${baseUrl}/top-class-checkout.html?flow=top_class&plan=${encodeURIComponent(plan || "prestige")}&cancelled=1`
      : `${baseUrl}/checkout-details.html?flow=${encodeURIComponent(flow)}&plan=${encodeURIComponent(plan)}`;
  const isCoachAutoRenew = autoRenew && flow === "coach";
  const checkoutMode = isCoachAutoRenew ? "subscription" : "payment";
  const lineItemPriceData = {
    currency: money.currency.toLowerCase(),
    unit_amount: Math.round(money.amount * 100),
    product_data: {
      name: amountMeta.label,
      description: `Customer selected method: ${method || "card"}`
    }
  };
  if (checkoutMode === "subscription") {
    lineItemPriceData.recurring = { interval: "month" };
  }
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: checkoutMode,
    success_url: `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    billing_address_collection: "required",
    automatic_tax: { enabled: true },
    custom_text: stripeCheckoutCustomText(),
    customer: customerId || undefined,
    customer_email: customerId ? undefined : customerEmail || undefined,
    customer_update: {
      address: "auto",
      name: "auto"
    },
    payment_method_types: paymentTypes,
    line_items: [
      {
        quantity: 1,
        price_data: lineItemPriceData
      }
    ],
    subscription_data: checkoutMode === "subscription"
      ? {
          metadata: {
            flow,
            plan,
            addonPlan: addonPlan || "",
            selectedMethod: method || "card",
            autoRenew: "1",
            vibecart_user_id: String(Number(session.user_id) || ""),
            userId: String(Number(session.user_id) || "")
          }
        }
      : undefined,
    metadata: {
      flow,
      plan,
      addonPlan: addonPlan || "",
      selectedMethod: method || "card",
      autoRenew: isCoachAutoRenew ? "1" : "0",
      route: "all-methods-to-stripe",
      vibecart_user_id: String(Number(session.user_id) || ""),
      userId: String(Number(session.user_id) || "")
    }
  });
  res.statusCode = 302;
  res.setHeader("Location", String(checkoutSession.url || cancelUrl));
  res.end();
}

async function handleStripeWebhook(req, res) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return sendJson(res, 500, { ok: false, code: "STRIPE_WEBHOOK_NOT_CONFIGURED" });
  }
  const signature = String(req.headers["stripe-signature"] || "");
  if (!signature) {
    return sendJson(res, 400, { ok: false, code: "MISSING_STRIPE_SIGNATURE" });
  }
  const rawBody = await readRawBody(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch {
    return sendJson(res, 400, { ok: false, code: "INVALID_STRIPE_SIGNATURE" });
  }

  try {
    await persistWebhookEvent(pool, event);
  } catch (error) {
    const dup =
      error.errno === 1062 ||
      String(error.code || "") === "ER_DUP_ENTRY" ||
      String(error.message || "").toLowerCase().includes("duplicate");
    if (!dup) {
      throw error;
    }
    return sendJson(res, 200, { ok: true, duplicate: true });
  }

  const processed = await processStripeWebhookEvent(pool, event);
  if (processed && processed.ok && Number(processed.userId) > 0 && event && event.type === "invoice.payment_failed") {
    const userId = Number(processed.userId);
    await sendPushToUser(pool, {
      userId,
      eventType: "coach_renewal_payment_failed",
      title: "Renewal payment failed",
      body: "Your package renewal did not go through. Renew now to restore dashboard access."
    });
    const toEmail = await getUserEmailById(userId);
    if (toEmail) {
      queueUserTransactionalEmail(
        toEmail,
        "VibeCart renewal payment failed",
        "Your automatic package renewal payment failed. Please renew now to restore access to your dashboard."
      );
    }
  }
  if (processed && processed.ok && Number(processed.userId) > 0 && event && event.type === "invoice.paid") {
    await sendPushToUser(pool, {
      userId: Number(processed.userId),
      eventType: "coach_renewal_payment_success",
      title: "Renewal successful",
      body: "Your package renewed successfully. Your dashboard is active."
    });
  }
  if (processed.ok && !processed.skipped) {
    await sendAdminNotificationEmail("Payment webhook processed", [
      `Event: ${event.type}`,
      `Order ID: ${processed.orderId || "n/a"}`,
      `User ID: ${processed.userId != null ? processed.userId : "n/a"}`,
      `Result status: ${processed.status || "n/a"}`,
      `Provider reference: ${processed.providerReference || "n/a"}`,
      `Features granted: ${processed.featureCount != null ? processed.featureCount : "n/a"}`,
      `Timestamp: ${new Date().toISOString()}`
    ]);
  }
  return sendJson(res, processed.ok ? 200 : 400, processed);
}

async function handleOwnerPaymentReadiness(req, res) {
  const data = await readBodyWithSession(req, res);
  if (!data) {
    return;
  }
  const result = await getPaymentReadiness(pool, {
    providerCode: String(data.body?.providerCode || "STRIPE")
  });
  return sendJson(res, 200, {
    ...result,
    config: {
      provider: PAYMENT_PROVIDER,
      stripeConfigured: Boolean(stripe),
      stripePublishableConfigured: Boolean(STRIPE_PUBLISHABLE_KEY),
      stripeWebhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
      paymentIntentServerSecretConfigured: Boolean(PAYMENT_INTENT_API_SECRET)
    }
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = requestPathname(req.url);
    if (req.method === "GET" && (pathname === "/api/health" || pathname === "/health")) {
      return sendJson(res, 200, {
        ok: true,
        service: "vibecart-owner-api",
        dbConfigured: Boolean(DB_HOST && DB_USER && DB_NAME),
        buildTag: PUBLIC_API_BUILD_TAG,
        stripe: {
          secretConfigured: Boolean(STRIPE_SECRET_KEY),
          webhookSecretConfigured: Boolean(STRIPE_WEBHOOK_SECRET)
        },
        coachCheckoutWebhookEvents: ["checkout.session.completed", "checkout.session.async_payment_succeeded"]
      });
    }
    if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
      applyCorsHeaders(req, res);
      res.statusCode = 204;
      res.end();
      return;
    }
    const ip = getIp(req);
    const isStripeWebhook = req.method === "POST" && pathname === "/api/public/payments/webhook/stripe";
    const isLogoEmailRoute = req.method === "POST" && pathname === "/api/public/brand/email-logo";
    const isPublicAnalyticsVisit = req.method === "POST" && pathname === "/api/public/analytics/visit";
    if (isLogoEmailRoute) {
      if (isLogoEmailIpLimited(ip)) {
        return sendJson(res, 429, { ok: false, code: "RATE_LIMITED" });
      }
    } else if (!isStripeWebhook && !isPublicAnalyticsVisit && isRateLimited(ip, req.method)) {
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
    if (req.method === "GET" && req.url.startsWith("/api/public/coach/monetization")) {
      return await handlePublicCoachMonetization(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/rewards/earn") {
      return await handlePublicRewardEarn(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/register") {
      return await handlePublicAuthRegister(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/login") {
      return await handlePublicAuthLogin(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/magic-link/request") {
      return await handlePublicAuthMagicLinkRequest(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/auth/magic-link/consume") {
      return await handlePublicAuthMagicLinkConsume(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/logout") {
      return await handlePublicAuthLogout(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/auth/session") {
      return await handlePublicAuthSession(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/session/role") {
      return await handlePublicAuthSessionRoleUpdate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/seller/shop/ensure") {
      return await handlePublicSellerShopEnsure(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/user/preferences") {
      return await handlePublicUserPreferencesGet(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/user/preferences") {
      return await handlePublicUserPreferencesUpsert(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/rewards/redeem") {
      return await handlePublicRewardRedeem(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/disclaimer/accept") {
      return await handlePublicDisclaimerAccept(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/analytics/visit") {
      return await handlePublicAnalyticsVisit(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/mobile/push/register") {
      return await handlePublicMobilePushRegister(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/mobile/feedback") {
      return await handlePublicMobileFeedback(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/mobile/first5/state") {
      return await handlePublicMobileFirst5State(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/brand/email-logo") {
      return await handlePublicBrandEmailLogo(req, res, ip);
    }
    if (req.method === "POST" && pathname === "/api/public/chat/safety-check") {
      return await handlePublicChatSafetyCheck(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/ai/generate") {
      return await handlePublicAiGenerate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/account/ai-digest") {
      return await handlePublicAccountAiDigest(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/web-push/config") {
      return await handlePublicWebPushConfig(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/account/web-push/register") {
      return await handlePublicWebPushRegister(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/account/coach-workspace/encourage-push") {
      return await handlePublicCoachWorkspaceEncouragePush(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/profile/upsert") {
      return await handlePublicCoachProfile(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/checkin/add") {
      return await handlePublicHealthCheckin(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/wearable/prefs") {
      return await handlePublicWearableCoachPrefs(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/subscription/start") {
      return await handlePublicCoachSubscriptionStart(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/addon/purchase") {
      return await handlePublicCoachAddonPurchase(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/partner/event") {
      return await handlePublicCoachPartnerEvent(req, res);
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
    if (req.method === "GET" && req.url.startsWith("/api/public/promotions/scout")) {
      return sendJson(res, 410, {
        ok: false,
        code: "PROMO_SCOUT_DISABLED",
        message: "Synthetic promo scout disabled. Use curated real promotion links from frontend lanes."
      });
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/payments/config")) {
      return await handlePublicPaymentConfig(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/products/live")) {
      return await handlePublicProductsLive(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/products/publish") {
      return await handlePublicProductPublish(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/seller/listings") {
      return await handlePublicSellerListings(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/seller/listings/update") {
      return await handlePublicSellerListingUpdate(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/seller/notifications") {
      return await handlePublicSellerSaleNotifications(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/services/media/upload") {
      return await handlePublicBakeryServiceMediaUpload(req, res);
    }
    if (req.method === "GET" && pathname.startsWith("/api/public/bakery-media/")) {
      return await handlePublicBakeryMediaGet(req, res, pathname);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/services/upsert") {
      return await handlePublicBakeryServiceUpsert(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/bakery/services/mine") {
      return await handlePublicBakeryServicesMine(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/bakery/services/discover")) {
      return await handlePublicBakeryServicesDiscover(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/services/toggle") {
      return await handlePublicBakeryServiceToggle(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/services/delete") {
      return await handlePublicBakeryServiceDelete(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/bookings/create") {
      return await handlePublicBakeryBookingCreate(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/bakery/bookings/mine") {
      return await handlePublicBakeryBookingsMine(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/bakery/bookings/as-buyer") {
      return await handlePublicBakeryBookingsAsBuyer(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/bookings/clear-mine") {
      return await handlePublicBakeryBookingsClearMine(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/bookings/purge-calendar-closed") {
      return await handlePublicBakeryBookingsPurgeCalendarClosed(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/bookings/status/update") {
      return await handlePublicBakeryBookingStatusUpdate(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/bakery/bookings/detail")) {
      return await handlePublicBakeryBookingDetail(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/bakery/bookings/messages")) {
      return await handlePublicBakeryBookingMessagesList(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/bookings/messages") {
      return await handlePublicBakeryBookingMessagesPost(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/bakery/schedule/slots")) {
      return await handlePublicBakeryScheduleSlotsList(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/telemetry/client-event") {
      return await handlePublicClientEventLog(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/schedule/slots/upsert") {
      return await handlePublicBakeryScheduleSlotsUpsert(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/schedule/slots/add") {
      return await handlePublicBakeryScheduleSlotsAdd(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/schedule/slots/remove") {
      return await handlePublicBakeryScheduleSlotsRemove(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/bakery/bookings/checkout/start") {
      return await handlePublicBakeryBookingCheckoutStart(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/user/privacy/export") {
      return await handlePublicUserPrivacyExport(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/user/privacy/delete-request") {
      return await handlePublicUserPrivacyDeleteRequest(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/orders/track")) {
      return await handlePublicOrderTrack(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/orders/quote")) {
      return await handlePublicOrderQuote(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/orders/mine") {
      return await handlePublicOrdersMine(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/platform-risk/plan") {
      return await handlePublicPlatformRiskPlan(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/barter/terms/accept") {
      return await handlePublicBarterAcceptTerms(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/barter/profile/upsert") {
      return await handlePublicBarterProfileUpsert(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/barter/offer/create") {
      return await handlePublicBarterOfferCreate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/barter/match/build") {
      return await handlePublicBarterMatchBuild(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/barter/bypass/report") {
      return await handlePublicBarterBypassReport(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/crowdfunding/campaign/create") {
      return await handlePublicCrowdfundingCreate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/crowdfunding/pledge") {
      return await handlePublicCrowdfundingPledge(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/fraud/precheck") {
      return await handlePublicFraudPrecheck(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/trust-safety/evaluate") {
      return await handlePublicTrustSafetyEvaluate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/orders/create") {
      return await handlePublicOrderCreate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/orders/confirm") {
      return await handlePublicOrderConfirm(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/orders/dispute/create") {
      return await handlePublicOrderDisputeCreate(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/seller/payout-account") {
      return await handlePublicSellerPayoutAccountGet(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/seller/payout-account/upsert") {
      return await handlePublicSellerPayoutAccountUpsert(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/payments/intent/create") {
      return await handlePublicCreatePaymentIntent(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/payments/checkout/start") {
      return await handlePublicCheckoutStart(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/payments/checkout/redirect") {
      return await handlePublicCheckoutRedirect(req, res);
    }
    if (
      (req.method === "GET" || req.method === "POST") &&
      pathname === "/api/public/payments/checkout/recover"
    ) {
      return await handlePublicCheckoutRecover(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/payments/coach-checkout-sessions") {
      return await handlePublicCoachCheckoutSessionsList(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/shop/redirect") {
      return await handlePublicShopRedirect(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/affiliate/referrals") {
      return await handlePublicAffiliateReferralsList(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/affiliate/postback") {
      return await handlePublicAffiliatePostback(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/payments/webhook/stripe") {
      return await handleStripeWebhook(req, res);
    }
    if (req.method === "POST" && pathname === "/api/chat/safety/events/list") {
      return await handleOwnerChatSafetyEvents(req, res);
    }
    if (req.method === "POST" && pathname === "/api/coach/metrics/summary") {
      return await handleOwnerCoachMetrics(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/cron/daily-reminders") {
      return await handleInsuranceDailyCron(req, res);
    }
    if (req.method === "POST" && pathname === "/api/health/cron/daily-reminders") {
      return await handleHealthDailyCron(req, res);
    }
    if (req.method === "POST" && pathname === "/api/health/cron/coach-followups") {
      return await handleCoachFollowupsCron(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/auth/login") {
      return await handleLogin(req, res, ip);
    }
    if (req.method === "POST" && pathname === "/api/owner/auth/logout") {
      return await handleLogout(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/auth/rotate") {
      return await handleRotate(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/site-settings") {
      return await handlePublicSiteSettingsGet(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/site-settings/upsert") {
      return await handleOwnerSiteSettingsUpsert(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/ai/generate") {
      return await handleOwnerAiGenerate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/public-users/stats") {
      return await handleOwnerPublicUserStats(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/analytics/overview") {
      return await handleOwnerAnalyticsOverview(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/notifications/reliability") {
      return await handleOwnerNotificationReliability(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/client-events/hotspots") {
      return await handleOwnerClientEventHotspots(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/messages/list") {
      return await handleOwnerMessageCenterList(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/messages/create") {
      return await handleOwnerMessageCenterCreate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/messages/mark-read") {
      return await handleOwnerMessageCenterMarkRead(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/messages/clear") {
      return await handleOwnerMessageCenterClear(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/messages/update") {
      return await handleOwnerMessageCenterUpdate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/messages/delete") {
      return await handleOwnerMessageCenterDelete(req, res);
    }
    if (req.method === "GET" && pathname === "/api/owner/messages/stream") {
      return await handleOwnerMessageCenterStream(req, res);
    }
    if (req.method === "POST" && pathname === "/api/push/register-device-token") {
      return await handlePushRegister(req, res);
    }
    if (req.method === "POST" && pathname === "/api/push/send-order-update") {
      return await handlePushOrderUpdate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/bookings/provider/create") {
      return await handleCreateProvider(req, res);
    }
    if (req.method === "POST" && pathname === "/api/bookings/service/create") {
      return await handleCreateService(req, res);
    }
    if (req.method === "POST" && pathname === "/api/bookings/slots/bulk-create") {
      return await handleCreateSlots(req, res);
    }
    if (req.method === "POST" && pathname === "/api/bookings/create") {
      return await handleCreateBooking(req, res);
    }
    if (req.method === "POST" && pathname === "/api/bookings/status/update") {
      return await handleUpdateBookingStatus(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ads/invoice/create") {
      return await handleCreateAdInvoice(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ads/invoice/settle") {
      return await handleSettleAdInvoice(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/subscription-plan/create") {
      return await handleCreateSubscriptionPlan(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/subscription/assign") {
      return await handleAssignSellerSubscription(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/boost-package/create") {
      return await handleCreateBoostPackage(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/boost/purchase") {
      return await handlePurchaseBoost(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/order/charges/apply") {
      return await handleApplyOrderCharges(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/logistics-rate/create") {
      return await handleCreateLogisticsRate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/affiliate-partner/create") {
      return await handleCreateAffiliatePartner(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/affiliate-referral/record") {
      return await handleRecordAffiliateReferral(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/guardrails/get") {
      return await handleGetPricingGuardrails(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/guardrails/validate") {
      return await handleValidatePricing(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/revenue/owner-dashboard") {
      return await handleOwnerRevenueDashboard(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/revenue/payout/request") {
      return await handleOwnerPayoutRequest(req, res);
    }
    if (req.method === "POST" && pathname === "/api/monetization/revenue/payout/status/update") {
      return await handleOwnerPayoutStatusUpdate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/affiliate/reconciliation/report") {
      return await handleOwnerAffiliateReconciliation(req, res);
    }
    if (req.method === "POST" && pathname === "/api/owner/affiliate/link-health/check") {
      return await handleOwnerAffiliateLinkHealth(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/provider/create") {
      return await handleCreateInsuranceProvider(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/jurisdiction/list") {
      return await handleListInsuranceJurisdictions(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/jurisdiction/upsert") {
      return await handleUpsertInsuranceJurisdiction(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/jurisdiction/disable") {
      return await handleDisableInsuranceJurisdiction(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/plan/create") {
      return await handleCreateInsurancePlan(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/subscription/create") {
      return await handleSubscribeInsurance(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/subscription/record-payment") {
      return await handleRecordInsurancePayment(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/subscription/queue-due-reminders") {
      return await handleQueueInsuranceDueReminders(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/policy/link-existing") {
      return await handleLinkExistingPolicy(req, res);
    }
    if (req.method === "POST" && pathname === "/api/insurance/policy/update-linked") {
      return await handleUpdatePolicyLink(req, res);
    }
    if (req.method === "POST" && pathname === "/api/wellbeing/alert/publish") {
      return await handlePublishWellbeingAlert(req, res);
    }
    if (req.method === "POST" && pathname === "/api/wellbeing/alert/queue-notifications") {
      return await handleQueueWellbeingNotifications(req, res);
    }
    if (req.method === "POST" && pathname === "/api/trust/profile/upsert") {
      return await handleOwnerUpsertTrustProfile(req, res);
    }
    if (req.method === "POST" && pathname === "/api/trust/profile/list") {
      return await handleOwnerListTrustProfiles(req, res);
    }
    if (req.method === "POST" && pathname === "/api/risk/owner-dashboard") {
      return await handleOwnerRiskDashboard(req, res);
    }
    if (req.method === "POST" && pathname === "/api/barter/match/review/list") {
      return await handleOwnerBarterMatchReviews(req, res);
    }
    if (req.method === "POST" && pathname === "/api/barter/match/review/decide") {
      return await handleOwnerBarterMatchDecision(req, res);
    }
    if (req.method === "POST" && pathname === "/api/barter/account/suspend") {
      return await handleOwnerBarterSuspendAccount(req, res);
    }
    if (req.method === "POST" && pathname === "/api/crowdfunding/review/list") {
      return await handleOwnerCrowdfundingReviewList(req, res);
    }
    if (req.method === "POST" && pathname === "/api/crowdfunding/review/decide") {
      return await handleOwnerCrowdfundingDecision(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/list") {
      return await handleOwnerAiOperationsList(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/create") {
      return await handleOwnerAiOperationsCreate(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/decide") {
      return await handleOwnerAiOperationsDecide(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/recommendations") {
      return await handleOwnerAiOpsRecommendations(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/recommendations/queue") {
      return await handleOwnerAiOpsQueueRecommendations(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/readiness") {
      return await handleOwnerAiReadiness(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/security-review") {
      return await handleOwnerAiOpsSecurityReview(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/autopilot/plan") {
      return await handleOwnerAiOpsAutopilotPlan(req, res);
    }
    if (req.method === "POST" && pathname === "/api/ai-ops/cron/autopilot") {
      return await handleAiOpsCronAutopilot(req, res);
    }
    if (req.method === "POST" && pathname === "/api/payments/readiness") {
      return await handleOwnerPaymentReadiness(req, res);
    }
    return sendJson(res, 404, {
      ok: false,
      code: "NOT_FOUND",
      method: req.method,
      path: pathname
    });
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

async function validateBakeryChatWsToken(token, bookingId) {
  const sess = await requirePublicSession(token, { headers: {} }, { skipDeviceBinding: true });
  if (!sess) {
    return false;
  }
  const uid = Number(sess.user_id);
  await ensureBakeryBookingsTable();
  const [rows] = await pool.execute(
    `SELECT baker_user_id, buyer_user_id, booking_status FROM bakery_bookings WHERE id = ? LIMIT 1`,
    [bookingId]
  );
  const r = rows[0];
  if (!r) {
    return false;
  }
  if (String(r.booking_status || "").toLowerCase() !== "confirmed") {
    return false;
  }
  return Number(r.baker_user_id) === uid || Number(r.buyer_user_id || 0) === uid;
}

async function validateBakeryProviderDeskWsToken(token) {
  const sess = await requirePublicSession(token, { headers: {} }, { skipDeviceBinding: true });
  if (!sess || !Number(sess.user_id)) {
    return null;
  }
  const role = String(sess.role || "").toLowerCase();
  if (!VC_BAKERY_PROVIDER_ROLES.has(role)) {
    return null;
  }
  return { userId: Number(sess.user_id) };
}

attachBakeryBookingChatWss(server, { validate: validateBakeryChatWsToken });
attachBakeryProviderDeskWss(server, { validate: validateBakeryProviderDeskWsToken });

async function startOwnerAuthApiServer() {
  try {
    await ensurePublicSessionDeviceColumns();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[vibecart] ensurePublicSessionDeviceColumns:", String((err && err.message) || err));
  }
  server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Owner auth API running on http://localhost:${PORT}`);
  if (PROMO_SCOUT_ENABLED) {
    runPromotionScoutCycle();
    const promoIntervalMs = PROMO_SCOUT_INTERVAL_MINUTES * 60 * 1000;
    setInterval(() => {
      runPromotionScoutCycle();
    }, promoIntervalMs);
    // eslint-disable-next-line no-console
    console.log(`Promotion scout enabled. Interval: every ${PROMO_SCOUT_INTERVAL_MINUTES} minutes.`);
  }
  if (AI_AUTOPILOT_ENABLED) {
    const intervalMs = AI_AUTOPILOT_INTERVAL_MINUTES * 60 * 1000;
    runAiAutopilotCycle("startup").catch((error) => {
      // eslint-disable-next-line no-console
      console.error("AI autopilot startup cycle failed:", error.message || error);
    });
    setInterval(() => {
      runAiAutopilotCycle("interval").catch((error) => {
        // eslint-disable-next-line no-console
        console.error("AI autopilot interval cycle failed:", error.message || error);
      });
    }, intervalMs);
    // eslint-disable-next-line no-console
    console.log(`AI autopilot enabled. Interval: every ${AI_AUTOPILOT_INTERVAL_MINUTES} minutes.`);
  }
  });
}

startOwnerAuthApiServer();
