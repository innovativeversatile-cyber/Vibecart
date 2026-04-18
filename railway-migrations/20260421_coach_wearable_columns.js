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
      `ALTER TABLE ai_coach_profiles
        ADD COLUMN wearable_vendor VARCHAR(40) NULL AFTER medication_tracking_enabled,
        ADD COLUMN wearable_daily_digest TINYINT(1) NOT NULL DEFAULT 0 AFTER wearable_vendor,
        ADD COLUMN wearable_detailed_metrics TINYINT(1) NOT NULL DEFAULT 0 AFTER wearable_daily_digest`
    );
    // eslint-disable-next-line no-console
    console.log("COACH_WEARABLE_COLUMNS_OK");
  } catch (e) {
    const code = e && e.code;
    if (code === "ER_DUP_FIELDNAME" || String(e.message || "").includes("Duplicate column")) {
      // eslint-disable-next-line no-console
      console.log("COACH_WEARABLE_COLUMNS_ALREADY");
      return;
    }
    throw e;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("COACH_WEARABLE_COLUMNS_FAILED", error.message || error);
  process.exit(1);
});
