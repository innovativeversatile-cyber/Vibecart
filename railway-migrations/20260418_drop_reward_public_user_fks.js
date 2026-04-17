"use strict";

/**
 * Public site uses browser-generated numeric IDs (see script.js getPublicUserId).
 * Those IDs are not rows in `users`, so FOREIGN KEY (user_id) REFERENCES users(id)
 * caused 500 on GET /api/public/rewards/profile and related inserts.
 *
 * Run once against Railway MySQL (same env as the API):
 *   node railway-migrations/20260418_drop_reward_public_user_fks.js
 */

const mysql = require("mysql2/promise");

async function dropForeignKeysForTable(conn, tableName) {
  const [rows] = await conn.execute(
    `SELECT CONSTRAINT_NAME AS name
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [tableName]
  );
  for (const row of rows) {
    const name = String(row.name || "").trim();
    if (!name) {
      continue;
    }
    await conn.execute(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${name}\``);
    // eslint-disable-next-line no-console
    console.log(`Dropped FK ${name} on ${tableName}`);
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "vibecart"
  });
  try {
    for (const table of ["user_reward_profiles", "reward_events", "disclaimer_acceptance_events"]) {
      await dropForeignKeysForTable(conn, table);
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ok: true, code: "REWARD_PUBLIC_FK_DROP_DONE" }));
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  if (String(error.code || "") === "ECONNREFUSED" || /ECONNREFUSED/i.test(String(error.message || ""))) {
    console.error(
      "DROP_REWARD_PUBLIC_FK_FAILED: cannot reach MySQL (ECONNREFUSED). Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME to your Railway database and run this script from a network that allows MySQL (often Railway shell or VPN), not from a random laptop without DB access."
    );
    process.exit(1);
    return;
  }
  console.error("DROP_REWARD_PUBLIC_FK_FAILED", error.message || error);
  process.exit(1);
});
