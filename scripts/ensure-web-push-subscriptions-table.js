"use strict";

/**
 * Ensures `web_push_subscriptions` exists (idempotent). Same env pattern as other ensure-* scripts.
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { resolveMysqlConfig } = require("../db-env");
const { ensureWebPushSubscriptionsTable } = require("../push-notification-service");

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
const _dbSslRaw = String(process.env.DB_SSL || "").trim().toLowerCase();
const useSsl =
  _dbSslRaw === "true" ||
  _dbSslRaw === "1" ||
  /\.rlwy\.net$/i.test(_db.host) ||
  /\.railway\.app$/i.test(_db.host);

async function main() {
  const conn = await mysql.createConnection({
    host: _db.host,
    port: _db.port,
    user: _db.user,
    password: _db.password,
    database: _db.database,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });
  try {
    await ensureWebPushSubscriptionsTable(conn);
    // eslint-disable-next-line no-console
    console.log("OK: web_push_subscriptions table ensured.");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e.message || e);
  process.exit(1);
});
