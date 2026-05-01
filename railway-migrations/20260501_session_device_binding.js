"use strict";

const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "vibecart"
  });

  try {
    await conn.execute(
      "ALTER TABLE user_auth_sessions ADD COLUMN device_binding_hash VARCHAR(64) NULL"
    );
  } catch (e) {
    if (!String(e.message || e).includes("Duplicate column name")) {
      throw e;
    }
  }
  try {
    await conn.execute(
      "ALTER TABLE user_auth_sessions ADD COLUMN last_token_rotated_at DATETIME NULL"
    );
  } catch (e) {
    if (!String(e.message || e).includes("Duplicate column name")) {
      throw e;
    }
  }
  // eslint-disable-next-line no-console
  console.log("SESSION_DEVICE_BINDING_OK");
  await conn.end();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("SESSION_DEVICE_BINDING_FAILED", error.message || error);
  process.exit(1);
});
