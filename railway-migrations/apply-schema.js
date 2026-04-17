"use strict";

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const schemaPath = path.join(__dirname, "..", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    await conn.query(sql);
    // eslint-disable-next-line no-console
    console.log("SCHEMA_APPLY_OK");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("SCHEMA_APPLY_FAILED", error.message || error);
  process.exit(1);
});

