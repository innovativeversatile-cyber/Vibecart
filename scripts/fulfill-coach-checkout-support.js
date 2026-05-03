"use strict";

/**
 * Support / ops: idempotently fulfill a paid Stripe Checkout session for coach flow
 * (same logic as webhook + public recovery), without the customer using the web UI.
 *
 * Security:
 * - Run only on a trusted machine with .env (STRIPE_SECRET_KEY + DB).
 * - Set ALLOW_MANUAL_COACH_FULFILL=1 for this process only, then unset.
 * - Do NOT paste session IDs or customer emails into public chats.
 *
 * Usage:
 *   ALLOW_MANUAL_COACH_FULFILL=1 node scripts/fulfill-coach-checkout-support.js cs_live_xxxx
 *
 * Railway (one-off):
 *   npx @railway/cli run -- env ALLOW_MANUAL_COACH_FULFILL=1 node scripts/fulfill-coach-checkout-support.js cs_live_xxxx
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");
const Stripe = require("stripe");
const { resolveMysqlConfig } = require("../db-env");
const { fulfillStripeCoachCheckoutSession } = require("../safety-wellness-service");

async function main() {
  if (String(process.env.ALLOW_MANUAL_COACH_FULFILL || "").trim() !== "1") {
    // eslint-disable-next-line no-console
    console.error(
      "Refusing to run: set ALLOW_MANUAL_COACH_FULFILL=1 for this single invocation (then remove it).\n" +
        "Example: ALLOW_MANUAL_COACH_FULFILL=1 node scripts/fulfill-coach-checkout-support.js cs_live_..."
    );
    process.exit(1);
  }
  const sessionId = String(process.argv[2] || "").trim();
  if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    // eslint-disable-next-line no-console
    console.error("Pass one Stripe Checkout session id as argv[2] (cs_live_… or cs_test_…).");
    process.exit(1);
  }
  const sk = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) {
    // eslint-disable-next-line no-console
    console.error("Missing STRIPE_SECRET_KEY in environment.");
    process.exit(1);
  }
  const cfg = resolveMysqlConfig();
  const _dbSslRaw = String(process.env.DB_SSL || "").trim().toLowerCase();
  const useSsl =
    _dbSslRaw === "true" ||
    _dbSslRaw === "1" ||
    /\.rlwy\.net$/i.test(cfg.host) ||
    /\.railway\.app$/i.test(cfg.host);

  const pool = await mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 2,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });

  const stripe = new Stripe(sk);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Stripe retrieve failed:", String(e.message || e));
    await pool.end();
    process.exit(1);
  }

  const meta = session.metadata || {};
  const flow = String(meta.flow || "").toLowerCase();
  const email = String(session.customer_details?.email || session.customer_email || "").trim();
  // eslint-disable-next-line no-console
  console.log("Session:", session.id, "payment_status:", session.payment_status, "flow:", flow, "customer_email:", email || "(none)");

  const result = await fulfillStripeCoachCheckoutSession(pool, session);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  await pool.end();
  process.exit(result.ok ? 0 : 1);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
