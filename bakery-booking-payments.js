"use strict";

const { sendPushToUser } = require("./push-notification-service");

async function ensureBakeryBookingStripeColumns(pool) {
  const alters = [
    "ALTER TABLE bakery_bookings ADD COLUMN stripe_checkout_session_id VARCHAR(255) NULL",
    "ALTER TABLE bakery_bookings ADD COLUMN stripe_payment_status VARCHAR(40) NULL",
    "ALTER TABLE bakery_bookings ADD COLUMN stripe_paid_amount DECIMAL(12,2) NULL"
  ];
  for (const sql of alters) {
    try {
      await pool.execute(sql);
    } catch (e) {
      if (!String(e.message || e).includes("Duplicate column name")) {
        /* ignore */
      }
    }
  }
}

/**
 * Stripe Checkout fulfillment for My Business bakery bookings (metadata.vibecart_flow = bakery_booking).
 */
async function tryFulfillBakeryBookingCheckout(pool, session) {
  const md = session.metadata || {};
  if (String(md.vibecart_flow || "").toLowerCase() !== "bakery_booking") {
    return { ok: true, skipped: true, reason: "not_bakery_booking" };
  }
  const bookingId = Number(md.booking_id || 0);
  if (!bookingId) {
    return { ok: false, code: "MISSING_BOOKING_ID" };
  }
  const paymentStatus = String(session.payment_status || "").toLowerCase();
  if (paymentStatus !== "paid") {
    return { ok: true, skipped: true, reason: "payment_not_paid", paymentStatus };
  }
  await ensureBakeryBookingStripeColumns(pool);
  const sessionId = String(session.id || "").trim();
  const amountCents = Number(session.amount_total);
  const paid = Number.isFinite(amountCents) ? Number((amountCents / 100).toFixed(2)) : null;
  const currency = String(session.currency || "usd").toUpperCase().slice(0, 8);

  const [bRows] = await pool.execute(
    `SELECT id, baker_user_id, buyer_user_id, booking_status, stripe_payment_status FROM bakery_bookings WHERE id = ? LIMIT 1`,
    [bookingId]
  );
  const b = bRows[0];
  if (!b) {
    return { ok: false, code: "BOOKING_NOT_FOUND" };
  }
  if (String(b.stripe_payment_status || "").toLowerCase() === "paid") {
    return { ok: true, skipped: true, reason: "already_paid", bookingId };
  }

  await pool.execute(
    `UPDATE bakery_bookings
     SET stripe_checkout_session_id = COALESCE(stripe_checkout_session_id, ?),
         stripe_payment_status = 'paid',
         stripe_paid_amount = COALESCE(?, stripe_paid_amount)
     WHERE id = ?
     LIMIT 1`,
    [sessionId, paid, bookingId]
  );

  const bakerId = Number(b.baker_user_id || 0);
  if (bakerId) {
    try {
      await sendPushToUser(pool, {
        userId: bakerId,
        title: "Booking payment received",
        message: `Payment recorded for booking #${bookingId} (${paid != null ? paid + " " + currency : "paid"}).`,
        deepLink: `${String(md.success_return_base || "https://vibe-cart.com").replace(/\/+$/, "")}/my-business.html`,
        eventType: "bakery_booking_paid"
      });
    } catch {
      /* ignore */
    }
  }

  return {
    ok: true,
    status: "bakery_booking_paid",
    providerReference: sessionId,
    userId: Number(b.buyer_user_id || 0),
    orderId: bookingId,
    featureCount: 0
  };
}

module.exports = {
  ensureBakeryBookingStripeColumns,
  tryFulfillBakeryBookingCheckout
};
