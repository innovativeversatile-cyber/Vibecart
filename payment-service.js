"use strict";

function toNum(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toMinorUnits(amount) {
  return Math.round(toNum(amount, 0) * 100);
}

function makeTrackingNumber(partnerCode, orderId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${String(partnerCode || "VC").slice(0, 6).toUpperCase()}-${String(orderId)}-${stamp}-${rand}`;
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

async function cancelStaleStripeIntents(pool, stripe, orderId) {
  const [rows] = await pool.execute(
    `SELECT provider_reference
     FROM payments
     WHERE order_id = ?
       AND provider = 'STRIPE'
       AND status = 'initiated'`,
    [orderId]
  );
  for (const row of rows) {
    const ref = String(row.provider_reference || "");
    if (!ref) {
      continue;
    }
    try {
      await stripe.paymentIntents.cancel(ref);
    } catch {
      /* ignore cancel errors for already-succeeded or unknown intents */
    }
  }
  if (rows.length > 0) {
    await pool.execute(
      `DELETE FROM payments
       WHERE order_id = ?
         AND provider = 'STRIPE'
         AND status = 'initiated'`,
      [orderId]
    );
  }
}

async function resolveOrderForShipment(pool, orderId) {
  const [rows] = await pool.execute(
    `SELECT o.id, o.buyer_country, o.seller_shop_id, p.origin_country AS from_country
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     WHERE o.id = ?
     ORDER BY oi.id ASC
     LIMIT 1`,
    [orderId]
  );
  const row = rows[0];
  if (!row) {
    return { ok: false, code: "ORDER_NOT_FOUND_FOR_SHIPMENT" };
  }
  return {
    ok: true,
    fromCountry: String(row.from_country || "").trim().toUpperCase(),
    toCountry: String(row.buyer_country || "").trim().toUpperCase()
  };
}

async function resolveApprovedDeliveryRoute(pool, fromCountry, toCountry) {
  const [rows] = await pool.execute(
    `SELECT d.id, d.partner_code, d.partner_name, r.shipping_method
     FROM approved_delivery_partner_routes r
     JOIN approved_delivery_partners d ON d.id = r.partner_id
     WHERE r.active = 1
       AND d.active = 1
       AND d.tracking_enabled = 1
       AND d.proof_of_delivery_enabled = 1
       AND d.security_screening_enabled = 1
       AND d.reliability_score >= 90.00
       AND r.from_country = ?
       AND r.to_country = ?
     ORDER BY CASE r.shipping_method
       WHEN 'express' THEN 1
       WHEN 'priority' THEN 2
       ELSE 3
     END ASC, d.reliability_score DESC
     LIMIT 1`,
    [fromCountry, toCountry]
  );
  const row = rows[0];
  if (!row) {
    return { ok: false, code: "NO_APPROVED_DELIVERY_ROUTE" };
  }
  return {
    ok: true,
    partnerId: Number(row.id),
    partnerCode: String(row.partner_code),
    partnerName: String(row.partner_name),
    shippingMethod: String(row.shipping_method || "standard")
  };
}

async function autoCreateShipmentForPaidOrder(pool, orderId) {
  const [existing] = await pool.execute(
    `SELECT id, courier, shipping_method, tracking_number, status
     FROM shipments
     WHERE order_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [orderId]
  );
  if (existing[0]) {
    return {
      ok: true,
      reused: true,
      shipmentId: Number(existing[0].id),
      courier: String(existing[0].courier),
      shippingMethod: String(existing[0].shipping_method),
      trackingNumber: String(existing[0].tracking_number || ""),
      shipmentStatus: String(existing[0].status || "pending")
    };
  }

  const resolvedOrder = await resolveOrderForShipment(pool, orderId);
  if (!resolvedOrder.ok) {
    return resolvedOrder;
  }
  const route = await resolveApprovedDeliveryRoute(pool, resolvedOrder.fromCountry, resolvedOrder.toCountry);
  if (!route.ok) {
    await pool.execute(
      `UPDATE orders
       SET status = 'processing'
       WHERE id = ?
         AND status IN ('pending', 'paid', 'processing')`,
      [orderId]
    );
    await pool.execute(
      `INSERT INTO order_status_updates (
        order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
      ) VALUES (?, 'manual_delivery_review', 'No approved delivery route found. Order routed for manual logistics review.', 'system', 1, 1)`,
      [orderId]
    );
    return route;
  }

  const trackingNumber = makeTrackingNumber(route.partnerCode, orderId);
  const [inserted] = await pool.execute(
    `INSERT INTO shipments (
      order_id, approved_partner_id, courier, shipping_method, from_country, to_country, tracking_number, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'label_created')`,
    [
      orderId,
      route.partnerId,
      route.partnerName,
      route.shippingMethod,
      resolvedOrder.fromCountry,
      resolvedOrder.toCountry,
      trackingNumber
    ]
  );

  await pool.execute(
    `UPDATE orders
     SET status = 'shipped'
     WHERE id = ?
       AND status IN ('pending', 'paid', 'processing')`,
    [orderId]
  );
  await pool.execute(
    `INSERT INTO order_status_updates (
      order_id, status_code, status_message, actor_role, notify_buyer, notify_seller
    ) VALUES
      (?, 'shipment_label_created', ?, 'system', 1, 1),
      (?, 'shipment_in_transit', ?, 'courier', 1, 1)`,
    [
      orderId,
      `Shipment label created with ${route.partnerName}. Tracking: ${trackingNumber}.`,
      orderId,
      `Parcel dispatched via ${route.partnerName} (${route.shippingMethod}).`
    ]
  );

  return {
    ok: true,
    shipmentId: Number(inserted.insertId || 0),
    courier: route.partnerName,
    shippingMethod: route.shippingMethod,
    trackingNumber,
    shipmentStatus: "label_created"
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
  await cancelStaleStripeIntents(pool, stripe, order.id);
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
  const shipment = await autoCreateShipmentForPaidOrder(pool, orderId);
  return {
    ok: true,
    orderId,
    providerReference,
    status: "captured",
    shipment
  };
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
  const rawPi = charge.payment_intent;
  const paymentIntentId =
    typeof rawPi === "string"
      ? rawPi
      : rawPi && typeof rawPi === "object" && rawPi.id
        ? String(rawPi.id)
        : "";
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

