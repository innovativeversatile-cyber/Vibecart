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
      `CREATE TABLE IF NOT EXISTS user_auth_sessions (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        session_token_hash VARCHAR(255) NOT NULL UNIQUE,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user_auth_sessions_user_expiry (user_id, expires_at)
      )`
    );
    // eslint-disable-next-line no-console
    console.log("USER_AUTH_SESSIONS_OK");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("USER_AUTH_SESSIONS_FAILED", error.message || error);
  process.exit(1);
});

