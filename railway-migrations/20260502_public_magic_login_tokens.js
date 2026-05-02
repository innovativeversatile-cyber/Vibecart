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

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS public_magic_login_tokens (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_public_magic_token (token_hash),
      KEY idx_public_magic_exp (expires_at),
      KEY idx_public_magic_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  // eslint-disable-next-line no-console
  console.log("PUBLIC_MAGIC_LOGIN_TOKENS_OK");
  await conn.end();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("PUBLIC_MAGIC_LOGIN_TOKENS_FAILED", error.message || error);
  process.exit(1);
});
