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
      `CREATE TABLE IF NOT EXISTS barter_terms_acceptance (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        terms_version VARCHAR(40) NOT NULL DEFAULT 'v1',
        accepted TINYINT(1) NOT NULL DEFAULT 1,
        acceptance_text VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_barter_terms_user_time (user_id, created_at)
      )`
    );

    await conn.execute(
      `CREATE TABLE IF NOT EXISTS barter_profiles (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL UNIQUE,
        offers_text TEXT NOT NULL,
        needs_text TEXT NOT NULL,
        country_code CHAR(2) NOT NULL,
        category_focus VARCHAR(80) NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_barter_profiles_country_active (country_code, active)
      )`
    );

    await conn.execute(
      `CREATE TABLE IF NOT EXISTS barter_offers (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        offer_title VARCHAR(180) NOT NULL,
        offer_description TEXT NOT NULL,
        want_description TEXT NOT NULL,
        origin_country CHAR(2) NOT NULL,
        target_country CHAR(2) NULL,
        category VARCHAR(80) NULL,
        status ENUM('open','matched','suspended','closed') NOT NULL DEFAULT 'open',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_barter_offers_status_country (status, origin_country, target_country)
      )`
    );

    await conn.execute(
      `CREATE TABLE IF NOT EXISTS barter_match_candidates (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        source_offer_id BIGINT UNSIGNED NOT NULL,
        candidate_offer_id BIGINT UNSIGNED NOT NULL,
        match_score DECIMAL(6,2) NOT NULL,
        match_reason VARCHAR(255) NULL,
        review_status ENUM('pending_owner_review','owner_approved','owner_rejected','manual_hold') NOT NULL DEFAULT 'pending_owner_review',
        owner_notes VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_offer_id) REFERENCES barter_offers(id),
        FOREIGN KEY (candidate_offer_id) REFERENCES barter_offers(id),
        INDEX idx_barter_match_source_status (source_offer_id, review_status, match_score),
        INDEX idx_barter_match_candidate (candidate_offer_id, review_status)
      )`
    );

    await conn.execute(
      `CREATE TABLE IF NOT EXISTS barter_bypass_events (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        conversation_snippet VARCHAR(255) NULL,
        detected_rules VARCHAR(255) NULL,
        risk_level ENUM('low','medium','high') NOT NULL DEFAULT 'low',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_barter_bypass_user_risk_time (user_id, risk_level, created_at)
      )`
    );

    await conn.execute(
      `CREATE TABLE IF NOT EXISTS barter_account_enforcement (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        action_type ENUM('warn','suspend','ban') NOT NULL DEFAULT 'suspend',
        reason_text VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        expires_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_barter_enforcement_user_active (user_id, active, expires_at)
      )`
    );

    // eslint-disable-next-line no-console
    console.log("BARTER_CORE_TABLES_OK");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("BARTER_CORE_TABLES_FAILED", error.message || error);
  process.exit(1);
});

