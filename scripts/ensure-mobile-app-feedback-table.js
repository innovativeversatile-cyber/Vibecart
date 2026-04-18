"use strict";

/**
 * Ensures `mobile_app_feedback` exists (idempotent).
 * Uses the same env vars as owner-auth-api.js; loads ../.env when present (simple KEY=VALUE lines).
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { resolveMysqlConfig } = require("../db-env");

const root = path.join(__dirname, "..");
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  const text = fs.readFileSync(envFile, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

const _db = resolveMysqlConfig();
const DB_HOST = _db.host;
const DB_PORT = _db.port;
const DB_USER = _db.user;
const DB_PASSWORD = _db.password;
const DB_NAME = _db.database;

const _dbSslRaw = String(process.env.DB_SSL || "").trim().toLowerCase();
const _useMysqlSsl =
  _dbSslRaw === "true" ||
  _dbSslRaw === "1" ||
  /\.rlwy\.net$/i.test(DB_HOST) ||
  /\.railway\.app$/i.test(DB_HOST);

const _railTemplate = process.env.MYSQL_PUBLIC_URL && String(process.env.MYSQL_PUBLIC_URL).includes("${{");
if (_railTemplate) {
  // eslint-disable-next-line no-console
  console.error(
    "MYSQL_PUBLIC_URL contains ${{...}} — that is Railway UI template syntax, not a real connection string for Node.\n" +
      "Fix: Railway → your MySQL service → Connect → copy the full mysql://... value into MYSQL_PUBLIC_URL in .env,\n" +
      "or from vibecart/: npx @railway/cli login && railway link && npm run db:ensure-mobile-feedback:railway"
  );
  process.exit(1);
}

const DDL = `
CREATE TABLE IF NOT EXISTS mobile_app_feedback (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  install_id VARCHAR(64) NULL,
  body VARCHAR(2000) NOT NULL,
  locale VARCHAR(20) NULL,
  app_version VARCHAR(50) NULL,
  page_url VARCHAR(512) NULL,
  user_agent VARCHAR(400) NULL,
  client_ip VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mobile_app_feedback_created (created_at),
  INDEX idx_mobile_app_feedback_install (install_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: false,
      ...(_useMysqlSsl ? { ssl: { rejectUnauthorized: false } } : {})
    });
    await conn.query(DDL);
    // eslint-disable-next-line no-console
    console.log("OK: mobile_app_feedback table ensured.");
  } catch (e) {
    const msg = String(e.message || e);
    // eslint-disable-next-line no-console
    console.error("FAILED:", msg);
    if (msg.includes("ECONNREFUSED") && DB_HOST === "127.0.0.1") {
      // eslint-disable-next-line no-console
      console.error(
        "Hint: No MySQL on this PC. Set MYSQL_PUBLIC_URL in .env to the public mysql:// URL from Railway → MySQL → Connect (not ${{ }} templates)."
      );
    }
    if (msg.includes("ENOTFOUND") && msg.includes("railway.internal")) {
      // eslint-disable-next-line no-console
      console.error(
        "Hint: MYSQL_URL from `railway run` is private (*.railway.internal) and only works inside Railway. From your PC use MYSQL_PUBLIC_URL=... from Connect, or run this SQL in Railway’s MySQL shell / Data tab."
      );
    }
    process.exitCode = 1;
  } finally {
    if (conn) {
      await conn.end().catch(() => {});
    }
  }
}

main();
