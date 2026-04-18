"use strict";

/**
 * Drops all tables in the current database (FK-safe). Use after a failed schema import.
 */

const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { resolveMysqlConfig } = require("../db-env");

async function main() {
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
    const [rows] = await conn.query(
      `SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`
    );
    const names = rows.map((r) => r.t).filter(Boolean);
    if (names.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No tables to drop.");
      return;
    }
    await conn.query("SET FOREIGN_KEY_CHECKS=0");
    for (const t of names) {
      const q = "`" + String(t).replace(/`/g, "") + "`";
      await conn.query("DROP TABLE IF EXISTS " + q);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS=1");
    // eslint-disable-next-line no-console
    console.log("OK: dropped", names.length, "tables.");
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
