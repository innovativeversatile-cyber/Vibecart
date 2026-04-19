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
  sendOrderUpdateNotifications
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
  generateAiOpsRecommendations,
  queueAiOpsRecommendations,
  getAiReadinessStatus
} = require("./ai-operations-service");
const {
  createStripePaymentIntent,
  persistWebhookEvent,
  processStripeWebhookEvent,
  getPaymentReadiness
} = require("./payment-service");

const PORT = Number(process.env.PORT || 8081);
const _db = resolveMysqlConfig();
const DB_HOST = _db.host;
const DB_PORT = _db.port;
const DB_USER = _db.user;
const DB_PASSWORD = _db.password;
const DB_NAME = _db.database;
const CRON_SECRET = String(process.env.CRON_SECRET || "");
const NOTIFICATION_EMAIL = String(process.env.NOTIFICATION_EMAIL || "").trim().toLowerCase();
const EMAIL_NOTIFICATIONS_ENABLED = String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "false").trim().toLowerCase() === "true";
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
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
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
const loginHits = new Map();
const RATE_WINDOW_MS = 60 * 1000;
/** Mutating requests only (GET/HEAD/OPTIONS are not counted). */
const RATE_MAX = 60;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const PUBLIC_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const logoEmailIpHits = new Map();
const LOGO_EMAIL_WINDOW_MS = 60 * 60 * 1000;
const LOGO_EMAIL_MAX_PER_HOUR = 10;
let notificationTransporter = null;
let logoSmtpTransporter = null;

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
      subject: `[ADMIN ONLY][VibeCart] ${safeSubject}`,
      text: textBody
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Email notification send failed:", error.message || error);
  }
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

async function createPublicSession(userId, ipAddress, userAgent) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + PUBLIC_SESSION_TTL_MS);
  await pool.execute(
    `INSERT INTO user_auth_sessions (user_id, session_token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, ipAddress || null, userAgent || null, expiresAt]
  );
  return { token, expiresAt };
}

async function requirePublicSession(token) {
  const tokenHash = sha256(token);
  const [rows] = await pool.execute(
    `SELECT s.id, s.user_id, s.expires_at, s.revoked_at, u.email, u.full_name, u.role, u.country_code, u.is_verified
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
  return row;
}

function getBearerToken(req) {
  const auth = String(req.headers.authorization || "");
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return auth.slice(7).trim();
}

async function requirePublicSessionRole(req, res, allowedRoles) {
  const token = getBearerToken(req);
  if (!token) {
    sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
    return null;
  }
  const session = await requirePublicSession(token);
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

async function handlePublicAuthRegister(req, res) {
  const body = await readJson(req);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const roleRaw = String(body.role || "buyer").trim().toLowerCase();
  const role = roleRaw === "seller" ? "seller" : "buyer";
  const fullName = String(body.fullName || "").trim();
  const countryCode = String(body.countryCode || "").trim().toUpperCase();

  if (!isValidEmail(email) || password.length < 8 || fullName.length < 2 || countryCode.length !== 2) {
    return sendJson(res, 400, { ok: false, code: "INVALID_SIGNUP_INPUT" });
  }

  const [existingRows] = await pool.execute(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  if (existingRows.length > 0) {
    return sendJson(res, 409, { ok: false, code: "EMAIL_ALREADY_EXISTS" });
  }

  const saltHex = crypto.randomBytes(16).toString("hex");
  const passwordHash = `${saltHex}:${hashPublicPassword(password, saltHex)}`;
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

  const session = await createPublicSession(userId, getIp(req), String(req.headers["user-agent"] || ""));
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
  if (role && (role === "buyer" || role === "seller") && user.role !== role) {
    return sendJson(res, 403, { ok: false, code: "ROLE_MISMATCH" });
  }

  clearLoginLimit(ip, email);
  const session = await createPublicSession(Number(user.id), ip, String(req.headers["user-agent"] || ""));
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

async function handlePublicAuthSession(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  const session = await requirePublicSession(token);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: "INVALID_SESSION" });
  }
  return sendJson(res, 200, {
    ok: true,
    user: {
      id: Number(session.user_id),
      email: String(session.email),
      fullName: String(session.full_name),
      role: String(session.role),
      countryCode: String(session.country_code),
      isVerified: Boolean(session.is_verified)
    }
  });
}

async function handlePublicAuthLogout(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { ok: false, code: "TOKEN_REQUIRED" });
  }
  await pool.execute(
    `UPDATE user_auth_sessions
     SET revoked_at = NOW()
     WHERE session_token_hash = ?`,
    [sha256(token)]
  );
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
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      code: "MESSAGE_DELETE_FAILED",
      message: String(error.message || error)
    });
  }
}

async function handlePublicMobilePushRegister(req, res) {
  try {
    const body = await readJson(req);
    const result = await registerMobileInstallPush(pool, body);
    return sendJson(res, 200, result);
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

async function handlePublicWearableCoachPrefs(req, res) {
  const body = await readJson(req);
  const result = await upsertWearableCoachPrefs(pool, body || {});
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
  const shippingMethod = String(body.shippingMethod || "express").trim().toLowerCase();
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
    const shippingFee = isCrossBorder ? 12.5 : 6.5;
    const markupAmount = Number((subtotal * 0.03).toFixed(2));
    const totalAmount = Number((subtotal + shippingFee + markupAmount).toFixed(2));
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
    await conn.commit();
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
        currency: String(product.currency || "EUR").toUpperCase(),
        fromCountry: String(product.origin_country || "").toUpperCase(),
        toCountry: buyerCountry,
        status: "pending"
      },
      next: {
        paymentIntentEndpoint: "/api/public/payments/intent/create",
        trackingEndpoint: `/api/public/orders/track?orderId=${orderId}`
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
  const session = await requirePublicSession(token);
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
    }))
  });
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
  if (processed.ok && !processed.skipped) {
    await sendAdminNotificationEmail("Payment webhook processed", [
      `Event: ${event.type}`,
      `Order ID: ${processed.orderId || "n/a"}`,
      `Result status: ${processed.status || "n/a"}`,
      `Provider reference: ${processed.providerReference || "n/a"}`,
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
        dbConfigured: Boolean(DB_HOST && DB_USER && DB_NAME)
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
    if (isLogoEmailRoute) {
      if (isLogoEmailIpLimited(ip)) {
        return sendJson(res, 429, { ok: false, code: "RATE_LIMITED" });
      }
    } else if (!isStripeWebhook && isRateLimited(ip, req.method)) {
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
    if (req.method === "POST" && pathname === "/api/public/rewards/earn") {
      return await handlePublicRewardEarn(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/register") {
      return await handlePublicAuthRegister(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/login") {
      return await handlePublicAuthLogin(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/auth/logout") {
      return await handlePublicAuthLogout(req, res);
    }
    if (req.method === "GET" && pathname === "/api/public/auth/session") {
      return await handlePublicAuthSession(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/rewards/redeem") {
      return await handlePublicRewardRedeem(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/disclaimer/accept") {
      return await handlePublicDisclaimerAccept(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/mobile/push/register") {
      return await handlePublicMobilePushRegister(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/mobile/feedback") {
      return await handlePublicMobileFeedback(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/brand/email-logo") {
      return await handlePublicBrandEmailLogo(req, res, ip);
    }
    if (req.method === "POST" && pathname === "/api/public/chat/safety-check") {
      return await handlePublicChatSafetyCheck(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/profile/upsert") {
      return await handlePublicCoachProfile(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/medication/add") {
      return await handlePublicMedicationSchedule(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/checkin/add") {
      return await handlePublicHealthCheckin(req, res);
    }
    if (req.method === "POST" && pathname === "/api/public/coach/wearable/prefs") {
      return await handlePublicWearableCoachPrefs(req, res);
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
    if (req.method === "GET" && req.url.startsWith("/api/public/payments/config")) {
      return await handlePublicPaymentConfig(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/products/live")) {
      return await handlePublicProductsLive(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/api/public/orders/track")) {
      return await handlePublicOrderTrack(req, res);
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
    if (req.method === "POST" && pathname === "/api/public/payments/intent/create") {
      return await handlePublicCreatePaymentIntent(req, res);
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

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Owner auth API running on http://localhost:${PORT}`);
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
