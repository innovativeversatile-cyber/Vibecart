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
      `CREATE TABLE IF NOT EXISTS ai_operations_queue (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        operation_type ENUM('marketing','security','inventory','research','product_update','compliance','pricing') NOT NULL,
        summary_text VARCHAR(255) NOT NULL,
        recommendation_text TEXT NOT NULL,
        risk_level ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
        execution_mode ENUM('recommend_only','owner_approval_required','autonomous_safe') NOT NULL DEFAULT 'recommend_only',
        status ENUM('pending_owner_review','approved','rejected','manual_hold','executed') NOT NULL DEFAULT 'pending_owner_review',
        owner_notes VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ai_ops_status_type_time (status, operation_type, created_at)
      )`
    );

    await conn.execute(
      `CREATE TABLE IF NOT EXISTS platform_risk_events (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        risk_focus ENUM('liquidity','trust','bad_debt','compliance','scaling','cac','logistics') NOT NULL,
        risk_signal VARCHAR(255) NULL,
        plan_headline VARCHAR(255) NOT NULL,
        score_delta INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_platform_risk_focus_time (risk_focus, created_at)
      )`
    );

    await conn.execute(
      `CREATE TABLE IF NOT EXISTS trust_profiles (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        entity_type ENUM('seller','provider','courier','insurer') NOT NULL,
        entity_id BIGINT UNSIGNED NOT NULL,
        trust_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
        delivery_success_rate DECIMAL(5,2) NULL,
        dispute_rate DECIMAL(5,2) NULL,
        verification_score DECIMAL(5,2) NULL,
        response_speed_score DECIMAL(5,2) NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_trust_profile_entity (entity_type, entity_id),
        INDEX idx_trust_profiles_score (entity_type, trust_score)
      )`
    );

    // eslint-disable-next-line no-console
    console.log("AI_CORE_TABLES_OK");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("AI_CORE_TABLES_FAILED", error.message || error);
  process.exit(1);
});

