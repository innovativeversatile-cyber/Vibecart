"use strict";

/**
 * Apply schema.sql to the configured MySQL database (e.g. Railway `railway` after a volume wipe).
 * Strips CREATE DATABASE / USE vibecart so tables are created in the connection database (DB_NAME).
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { resolveMysqlConfig } = require("../db-env");

function stripSchemaPreamble(sql) {
  return sql
    .replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+vibecart\s*[^;]*;/gi, "")
    .replace(/USE\s+vibecart\s*;/gi, "")
    .trim();
}

async function main() {
  const schemaPath = path.join(__dirname, "..", "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    // eslint-disable-next-line no-console
    console.error("Missing schema.sql at", schemaPath);
    process.exit(1);
  }
  let sql = fs.readFileSync(schemaPath, "utf8");
  sql = stripSchemaPreamble(sql);
  if (!sql) {
    // eslint-disable-next-line no-console
    console.error("Schema empty after preamble strip.");
    process.exit(1);
  }

  const cfg = resolveMysqlConfig();
  const _dbSslRaw = String(process.env.DB_SSL || "").trim().toLowerCase();
  const useSsl =
    _dbSslRaw === "true" ||
    _dbSslRaw === "1" ||
    /\.rlwy\.net$/i.test(cfg.host) ||
    /\.railway\.app$/i.test(cfg.host);

  let conn;
  try {
    conn = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      multipleStatements: true,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
    });
    // eslint-disable-next-line no-console
    console.log("Applying schema to", cfg.user + "@" + cfg.host + ":" + cfg.port + "/" + cfg.database, "…");

    const force = String(process.env.DB_APPLY_SCHEMA_FORCE || "").trim() === "1";
    const [existingRows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
    );
    const existingCount = Number(existingRows[0]?.cnt || 0);
    if (existingCount > 0 && !force) {
      // eslint-disable-next-line no-console
      console.log("SKIP: table `users` already exists (database is not empty).");
      // eslint-disable-next-line no-console
      console.log("  Full schema.sql is only for fresh DBs. To fix owner admin login run: npm run db:reset-owner");
      // eslint-disable-next-line no-console
      console.log("  To force re-apply anyway (risky on prod): DB_APPLY_SCHEMA_FORCE=1 npm run db:apply-schema");
      return;
    }

    // schema.sql references some tables (e.g. shops) before they are created; disable FK checks for the bulk import.
    await conn.query("SET FOREIGN_KEY_CHECKS=0;\n" + sql + "\nSET FOREIGN_KEY_CHECKS=1;");
    // eslint-disable-next-line no-console
    console.log("OK: schema applied.");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("FAILED:", e.message || e);
    process.exitCode = 1;
  } finally {
    if (conn) {
      await conn.end().catch(() => {});
    }
  }
}

main();
