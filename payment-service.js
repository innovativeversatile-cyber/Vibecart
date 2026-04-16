"use strict";

function toNum(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toMinorUnits(amount) {
  return Math.round(toNum(amount, 0) * 100);
}

async function resolveOrderForPayment(pool, orderId) {
  const [orders] = await pool.execute(
    `SELECT id, total_amount, currency, buyer_country, status
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [orderId]
  );
  const order = orders[0];
  if (!order) {
    return { ok: false, code: "ORDER_NOT_FOUND" };
  }
  if (!["pending", "processing"].includes(String(order.status || "").toLowerCase())) {
    return { ok: false, code: "ORDER_NOT_PAYABLE", orderStatus: order.status };
  }

  const [sellerRows] = await pool.execute(
    `SELECT p.origin_country
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC
     LIMIT 1`,
    [orderId]
  );
  const sellerCountry = String(sellerRows[0]?.origin_country || "").trim().toUpperCase();
  if (!sellerCountry) {
    return { ok: false, code: "SELLER_COUNTRY_NOT_RESOLVED" };
  }

  return {
    ok: true,
    order: {
      id: Number(order.id),
      totalAmount: toNum(order.total_amount, 0),
      currency: String(order.currency || "EUR").trim().toUpperCase(),
      buyerCountry: String(order.buyer_country || "").trim().toUpperCase(),
      sellerCountry
    }
  };
}

async function resolveApprovedProviderRoute(pool, input) {
  const buyerCountry = String(input.buyerCountry || "").trim().toUpperCase();
  const sellerCountry = String(input.sellerCountry || "").trim().toUpperCase();
  const currency = String(input.currency || "").trim().toUpperCase();
  const providerCode = String(input.providerCode || "STRIPE").trim().toUpperCase();

  const [rows] = await pool.execute(
    `SELECT p.id, p.provider_code, p.provider_name
     FROM approved_payment_provider_routes r
     JOIN approved_payment_providers p ON p.id = r.provider_id
     WHERE p.active = 1
       AND r.active = 1
       AND p.provider_code = ?
       AND r.buyer_country = ?
       AND r.seller_country = ?
       AND r.currency = ?
     LIMIT 1`,
    [providerCode, buyerCountry, sellerCountry, currency]
  );
  const provider = rows[0];
  if (!provider) {
    return { ok: false, code: "NO_APPROVED_PAYMENT_ROUTE" };
  }
  return {
    ok: true,
    provider: {
      id: Number(provider.id),
      code: String(provider.provider_code),
      name: String(provider.provider_name)
    }
  };
}

async function createStripePaymentIntent(pool, stripe, input) {
  const orderId = toNum(input.orderId, 0);
  const paymentMethod = String(input.paymentMethod || "card").trim().toLowerCase();
  const providerCode = String(input.providerCode || "STRIPE").trim().toUpperCase();
  if (!orderId) {
    return { ok: false, code: "INVALID_ORDER_ID" };
  }
  if (paymentMethod !== "card") {
    return { ok: false, code: "UNSUPPORTED_PAYMENT_METHOD" };
  }

  const resolvedOrder = await resolveOrderForPayment(pool, orderId);
  if (!resolvedOrder.ok) {
    return resolvedOrder;
  }
  const order = resolvedOrder.order;
  const route = await resolveApprovedProviderRoute(pool, {
    buyerCountry: order.buyerCountry,
    sellerCountry: order.sellerCountry,
    currency: order.currency,
    providerCode
  });
  if (!route.ok) {
    return route;
  }

  const amountMinor = toMinorUnits(order.totalAmount);
  if (amountMinor <= 0) {
    return { ok: false, code: "INVALID_ORDER_AMOUNT" };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountMinor,
    currency: order.currency.toLowerCase(),
    payment_method_types: ["card"],
    metadata: {
      orderId: String(order.id),
      buyerCountry: order.buyerCountry,
      sellerCountry: order.sellerCountry,
      providerCode: route.provider.code
    }
  });

  await pool.execute(
    `INSERT INTO payments (
      order_id, approved_provider_id, provider, payment_method, provider_reference, amount, currency, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'initiated')`,
    [
      order.id,
      route.provider.id,
      route.provider.code,
      paymentMethod,
      String(paymentIntent.id),
      order.totalAmount,
      order.currency
    ]
  );

  return {
    ok: true,
    provider: route.provider.code,
    orderId: order.id,
    amount: order.totalAmount,
    currency: order.currency,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret
  };
}

async function persistWebhookEvent(pool, event) {
  await pool.execute(
    `INSERT INTO payment_webhook_events (
      provider, event_id, event_type, payload_json, processed_at
    ) VALUES (?, ?, ?, ?, NOW())`,
    [
      "STRIPE",
      String(event.id || ""),
      String(event.type || ""),
      JSON.stringify(event)
    ]
  );
}

async function handleStripePaymentIntentSucceeded(pool, paymentIntent) {
  const providerReference = String(paymentIntent.id || "");
  const orderId = toNum(paymentIntent.metadata?.orderId, 0);
  if (!providerReference || !orderId) {
    return { ok: false, code: "INVALID_STRIPE_METADATA" };
  }

  await pool.execute(
    `UPDATE payments
     SET status = 'captured'
     WHERE provider = 'STRIPE'
       AND provider_reference = ?`,
    [providerReference]
  );
  await pool.execute(
    `UPDATE orders
     SET status = 'paid'
     WHERE id = ?
       AND status IN ('pending', 'processing')`,
    [orderId]
  );
  await pool.execute(
    `INSERT INTO order_status_updates (
      order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
    ) VALUES (?, 'payment_captured', 'Payment captured successfully.', 'system', 1, 1)`,
    [orderId]
  );
  return { ok: true, orderId, providerReference, status: "captured" };
}

async function handleStripePaymentIntentFailed(pool, paymentIntent) {
  const providerReference = String(paymentIntent.id || "");
  const orderId = toNum(paymentIntent.metadata?.orderId, 0);
  if (!providerReference || !orderId) {
    return { ok: false, code: "INVALID_STRIPE_METADATA" };
  }

  await pool.execute(
    `UPDATE payments
     SET status = 'failed'
     WHERE provider = 'STRIPE'
       AND provider_reference = ?`,
    [providerReference]
  );
  await pool.execute(
    `INSERT INTO order_status_updates (
      order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
    ) VALUES (?, 'payment_failed', 'Payment attempt failed.', 'system', 1, 1)`,
    [orderId]
  );
  return { ok: true, orderId, providerReference, status: "failed" };
}

async function handleStripeChargeRefunded(pool, charge) {
  const paymentIntentId = String(charge.payment_intent || "");
  if (!paymentIntentId) {
    return { ok: false, code: "MISSING_PAYMENT_INTENT" };
  }
  const [rows] = await pool.execute(
    `SELECT order_id
     FROM payments
     WHERE provider = 'STRIPE'
       AND provider_reference = ?
     ORDER BY id DESC
     LIMIT 1`,
    [paymentIntentId]
  );
  const orderId = toNum(rows[0]?.order_id, 0);
  if (!orderId) {
    return { ok: false, code: "PAYMENT_NOT_FOUND_FOR_REFUND" };
  }
  await pool.execute(
    `UPDATE payments
     SET status = 'refunded'
     WHERE provider = 'STRIPE'
       AND provider_reference = ?`,
    [paymentIntentId]
  );
  await pool.execute(
    `UPDATE orders
     SET status = 'refunded'
     WHERE id = ?`,
    [orderId]
  );
  await pool.execute(
    `INSERT INTO order_status_updates (
      order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
    ) VALUES (?, 'payment_refunded', 'Payment refunded.', 'system', 1, 1)`,
    [orderId]
  );
  return { ok: true, orderId, providerReference: paymentIntentId, status: "refunded" };
}

async function processStripeWebhookEvent(pool, event) {
  if (!event || !event.type) {
    return { ok: false, code: "INVALID_WEBHOOK_EVENT" };
  }
  if (event.type === "payment_intent.succeeded") {
    return handleStripePaymentIntentSucceeded(pool, event.data?.object || {});
  }
  if (event.type === "payment_intent.payment_failed") {
    return handleStripePaymentIntentFailed(pool, event.data?.object || {});
  }
  if (event.type === "charge.refunded") {
    return handleStripeChargeRefunded(pool, event.data?.object || {});
  }
  return { ok: true, skipped: true, eventType: event.type };
}

async function getPaymentReadiness(pool, input = {}) {
  const providerCode = String(input.providerCode || "STRIPE").trim().toUpperCase();
  const [providerRows] = await pool.execute(
    `SELECT id, provider_code, provider_name, active, pci_dss_compliant, supports_3ds, supports_tokenization
     FROM approved_payment_providers
     WHERE provider_code = ?
     LIMIT 1`,
    [providerCode]
  );
  const [routeRows] = await pool.execute(
    `SELECT COUNT(*) AS active_routes
     FROM approved_payment_provider_routes r
     JOIN approved_payment_providers p ON p.id = r.provider_id
     WHERE p.provider_code = ?
       AND p.active = 1
       AND r.active = 1`,
    [providerCode]
  );
  const [paymentRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_payments,
       SUM(CASE WHEN status = 'captured' THEN 1 ELSE 0 END) AS captured_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
       SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded_count
     FROM payments
     WHERE provider = ?`,
    [providerCode]
  );

  return {
    ok: true,
    provider: providerRows[0] || null,
    activeRoutes: toNum(routeRows[0]?.active_routes, 0),
    stats: {
      totalPayments: toNum(paymentRows[0]?.total_payments, 0),
      capturedCount: toNum(paymentRows[0]?.captured_count, 0),
      failedCount: toNum(paymentRows[0]?.failed_count, 0),
      refundedCount: toNum(paymentRows[0]?.refunded_count, 0)
    }
  };
}

module.exports = {
  createStripePaymentIntent,
  persistWebhookEvent,
  processStripeWebhookEvent,
  getPaymentReadiness
};

