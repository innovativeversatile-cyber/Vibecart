"use strict";

const crypto = require("crypto");
const mysql = require("mysql2/promise");

function hashSecret(secret, saltHex) {
  const salt = Buffer.from(saltHex, "hex");
  const out = crypto.pbkdf2Sync(secret, salt, 120000, 32, "sha256");
  return out.toString("hex");
}

async function main() {
  const email = "innovativeversatile@gmail.com";
  const password = "VibeCart#Admin2026!";
  const phrase = "KudaKwaishe#Owner";

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "vibecart"
  });

  try {
    const [rows] = await conn.execute(
      `SELECT id, owner_email, password_hash, security_phrase_hash, mfa_required, active
       FROM owner_auth_profiles
       WHERE owner_email = ?
       ORDER BY id DESC`,
      [email]
    );
    const active = rows.find((row) => Number(row.active) === 1);
    if (!active) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ ok: false, code: "NO_ACTIVE_OWNER_PROFILE", count: rows.length }));
      return;
    }
    const [saltHex, passHash] = String(active.password_hash || "").split(":");
    const [phraseSaltHex, phraseHash] = String(active.security_phrase_hash || "").split(":");
    const passMatches = saltHex ? hashSecret(password, saltHex) === passHash : false;
    const phraseMatches = phraseSaltHex ? hashSecret(phrase, phraseSaltHex) === phraseHash : false;
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        ok: true,
        ownerId: Number(active.id),
        ownerEmail: String(active.owner_email),
        active: Number(active.active),
        mfaRequired: Boolean(active.mfa_required),
        passMatches,
        phraseMatches,
        totalRows: rows.length
      })
    );
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("DEBUG_OWNER_AUTH_FAILED", error.message || error);
  process.exit(1);
});
