"use strict";

const crypto = require("crypto");

const SESSION_TTL_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashSecret(secret, saltHex) {
  const salt = Buffer.from(saltHex, "hex");
  const out = crypto.pbkdf2Sync(secret, salt, 120000, 32, "sha256");
  return out.toString("hex");
}

function secureToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function getOwnerProfile(db, ownerEmail) {
  const [rows] = await db.execute(
    `SELECT id, owner_email, password_hash, security_phrase_hash, mfa_required, active
     FROM owner_auth_profiles
     WHERE owner_email = ? AND active = 1
     LIMIT 1`,
    [ownerEmail.toLowerCase()]
  );
  return rows[0] || null;
}

async function checkLockout(db, ownerAuthId) {
  const [rows] = await db.execute(
    `SELECT created_at
     FROM owner_auth_events
     WHERE owner_auth_id = ? AND event_type = 'login_failed'
     ORDER BY created_at DESC
     LIMIT ?`,
    [ownerAuthId, MAX_ATTEMPTS]
  );
  if (rows.length < MAX_ATTEMPTS) {
    return false;
  }
  const newest = new Date(rows[0].created_at).getTime();
  const oldest = new Date(rows[rows.length - 1].created_at).getTime();
  const withinWindow = newest - oldest <= LOCKOUT_MS;
  return withinWindow;
}

async function recordAuthEvent(db, ownerAuthId, eventType, ip, details) {
  await db.execute(
    `INSERT INTO owner_auth_events (owner_auth_id, event_type, ip_address, details)
     VALUES (?, ?, ?, ?)`,
    [ownerAuthId, eventType, ip || null, details || null]
  );
}

async function createSession(db, ownerAuthId, ipAddress, userAgent) {
  const token = secureToken();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.execute(
    `INSERT INTO owner_auth_sessions (owner_auth_id, session_token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [ownerAuthId, tokenHash, ipAddress || null, userAgent || null, expiresAt]
  );
  return { token, expiresAt };
}

async function verifyMfaCode(db, ownerAuthId, code) {
  // Placeholder for TOTP verification with your MFA library/provider.
  // Current fallback: check active backup code hash.
  const [rows] = await db.execute(
    `SELECT id, backup_code_hash
     FROM owner_mfa_factors
     WHERE owner_auth_id = ? AND active = 1`,
    [ownerAuthId]
  );
  const codeHash = sha256(code);
  return rows.some((row) => row.backup_code_hash && row.backup_code_hash === codeHash);
}

async function ownerLogin(db, payload, meta) {
  const profile = await getOwnerProfile(db, payload.email);
  if (!profile) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const locked = await checkLockout(db, profile.id);
  if (locked) {
    await recordAuthEvent(db, profile.id, "login_blocked", meta.ip, "lockout_active");
    return { ok: false, code: "LOCKED_OUT" };
  }

  const [saltHex, passHash] = String(profile.password_hash).split(":");
  const [phraseSaltHex, phraseHash] = String(profile.security_phrase_hash).split(":");
  const matches =
    hashSecret(payload.password, saltHex) === passHash &&
    hashSecret(payload.securityPhrase, phraseSaltHex) === phraseHash;

  if (!matches) {
    await recordAuthEvent(db, profile.id, "login_failed", meta.ip, "bad_password_or_phrase");
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  if (profile.mfa_required) {
    const mfaOk = await verifyMfaCode(db, profile.id, payload.mfaCode || "");
    if (!mfaOk) {
      await recordAuthEvent(db, profile.id, "login_failed", meta.ip, "bad_mfa");
      return { ok: false, code: "MFA_REQUIRED_OR_INVALID" };
    }
  }

  const session = await createSession(db, profile.id, meta.ip, meta.userAgent);
  await recordAuthEvent(db, profile.id, "login_success", meta.ip, "owner_authenticated");
  return { ok: true, token: session.token, expiresAt: session.expiresAt };
}

module.exports = {
  ownerLogin,
  hashSecret,
  sha256
};
