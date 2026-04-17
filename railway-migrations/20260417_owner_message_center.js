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
      `CREATE TABLE IF NOT EXISTS owner_message_center (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        owner_auth_id BIGINT UNSIGNED NOT NULL,
        message_type ENUM('request','urgent','system') NOT NULL DEFAULT 'system',
        message_text VARCHAR(600) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME NULL,
        FOREIGN KEY (owner_auth_id) REFERENCES owner_auth_profiles(id),
        INDEX idx_owner_message_center_owner_created (owner_auth_id, created_at),
        INDEX idx_owner_message_center_owner_read (owner_auth_id, read_at)
      )`
    );
    // eslint-disable-next-line no-console
    console.log("OWNER_MESSAGE_CENTER_TABLE_READY");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("OWNER_MESSAGE_CENTER_MIGRATION_FAILED", error.message || error);
  process.exit(1);
});

