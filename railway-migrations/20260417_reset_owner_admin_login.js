"use strict";

const crypto = require("crypto");
const mysql = require("mysql2/promise");

function hashSecret(secret, saltHex) {
  const salt = Buffer.from(saltHex, "hex");
  const out = crypto.pbkdf2Sync(secret, salt, 120000, 32, "sha256");
  return out.toString("hex");
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "vibecart"
  });

  const ownerEmail = "innovativeversatile@gmail.com";
  const ownerPassword = "VibeCart#Admin2026!";
  const securityPhrase = "KudaKwaishe#Owner";

  const passSalt = crypto.randomBytes(16).toString("hex");
  const phraseSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = `${passSalt}:${hashSecret(ownerPassword, passSalt)}`;
  const phraseHash = `${phraseSalt}:${hashSecret(securityPhrase, phraseSalt)}`;

  try {
    await conn.beginTransaction();
    await conn.execute(
      "UPDATE owner_auth_profiles SET active = 0 WHERE owner_email = ?",
      [ownerEmail]
    );
    await conn.execute(
      `INSERT INTO owner_auth_profiles (
        owner_email, password_hash, security_phrase_hash, mfa_required, active
      ) VALUES (?, ?, ?, 0, 1)`,
      [ownerEmail, passwordHash, phraseHash]
    );
    await conn.commit();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      ok: true,
      ownerEmail,
      mfaRequired: false
    }));
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback issues
    }
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("RESET_OWNER_ADMIN_LOGIN_FAILED", error.message || error);
  process.exit(1);
});
