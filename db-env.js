"use strict";

/**
 * Resolve MySQL connection settings from env (Railway + local).
 * Priority: explicit public/internal URL strings, then discrete MYSQL* / DB_* vars.
 */

function parseMysqlUrl(raw) {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith("mysql://") && !trimmed.startsWith("mysql2://")) {
    return null;
  }
  try {
    const normalized = trimmed.replace(/^mysql2:\/\//, "mysql://");
    const u = new URL(normalized);
    const database = (u.pathname || "").replace(/^\//, "").split("?")[0] || null;
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username || "") || "root",
      password: u.password ? decodeURIComponent(u.password) : "",
      database: database || "mysql"
    };
  } catch {
    return null;
  }
}

function firstMysqlUrlFromEnv() {
  const keys = [
    "MYSQL_PUBLIC_URL",
    "MYSQL_URL",
    "DATABASE_URL",
    "MYSQLPRIVATE_URL",
    "MYSQL_PRIVATE_URL"
  ];
  for (const k of keys) {
    const raw = process.env[k];
    if (!raw || typeof raw !== "string") {
      continue;
    }
    // Railway dashboard "variable references" use ${{ }} — not expanded when Node reads a .env file.
    if (raw.includes("${{")) {
      continue;
    }
    const parsed = parseMysqlUrl(raw);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function resolveMysqlConfig() {
  const fromUrl = firstMysqlUrlFromEnv();
  if (fromUrl) {
    return fromUrl;
  }
  // DB_HOST / DB_PORT first so a public TCP proxy in .env is not replaced by private MYSQLHOST.
  // MYSQLUSER / MYSQLPASSWORD before DB_* so Railway credentials override guessed root/password.
  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || "root",
    password:
      process.env.MYSQLPASSWORD ||
      process.env.MYSQL_ROOT_PASSWORD ||
      process.env.MYSQL_PASSWORD ||
      process.env.DB_PASSWORD ||
      "",
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || "vibecart"
  };
}

module.exports = { resolveMysqlConfig, parseMysqlUrl };
