"use strict";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function getDeliverySignal(pool) {
  const [rows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
       COUNT(*) AS total_count
     FROM shipments
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const row = rows[0] || {};
  const delivered = toNum(row.delivered_count);
  const failed = toNum(row.failed_count);
  const total = toNum(row.total_count);
  const reliability = total > 0 ? delivered / total : 0.65;
  return {
    delivered,
    failed,
    total,
    reliability
  };
}

async function getTrustSignal(pool) {
  const [rows] = await pool.execute(
    `SELECT AVG(trust_score) AS avg_score
     FROM trust_profiles`
  );
  return clamp(Math.round(toNum(rows[0]?.avg_score, 60)), 0, 100);
}

async function getSafetySignal(pool) {
  const [rows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_count,
       SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) AS medium_count,
       COUNT(*) AS total_count
     FROM chat_safety_events
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const row = rows[0] || {};
  const high = toNum(row.high_count);
  const medium = toNum(row.medium_count);
  const total = toNum(row.total_count);
  const riskRatio = total > 0 ? (high * 1.0 + medium * 0.4) / total : 0.12;
  return {
    high,
    medium,
    total,
    riskRatio
  };
}

async function runFraudPrecheck(pool, input) {
  const orderAmount = toNum(input.orderAmount, 0);
  const buyerCountry = String(input.buyerCountry || "").trim().toUpperCase();
  const sellerCountry = String(input.sellerCountry || "").trim().toUpperCase();
  const paymentMethod = String(input.paymentMethod || "").trim().toLowerCase();
  const isNewSeller = Boolean(input.isNewSeller);

  const safety = await getSafetySignal(pool);
  const delivery = await getDeliverySignal(pool);

  let riskScore = 35;
  if (orderAmount >= 500) riskScore += 18;
  if (orderAmount >= 1000) riskScore += 12;
  if (buyerCountry && sellerCountry && buyerCountry !== sellerCountry) riskScore += 8;
  if (paymentMethod.includes("manual")) riskScore += 18;
  if (isNewSeller) riskScore += 10;
  riskScore += Math.round(safety.riskRatio * 20);
  riskScore += Math.round((1 - delivery.reliability) * 15);
  riskScore = clamp(riskScore, 0, 100);

  const level = riskScore >= 75 ? "high" : riskScore >= 50 ? "medium" : "low";
  const action = level === "high"
    ? "hold_and_step_up_verification"
    : level === "medium"
      ? "extra_checks_before_capture"
      : "allow_standard_flow";

  return {
    ok: true,
    level,
    riskScore,
    action,
    reasons: [
      "amount_and_route_evaluation",
      "marketplace_safety_pattern_check",
      "delivery_reliability_signal_check"
    ]
  };
}

async function evaluateTrustSafety(pool, input) {
  const entityType = String(input.entityType || "seller").trim().toLowerCase();
  const entityId = toNum(input.entityId, 0);
  if (!entityType || !entityId) {
    return { ok: false, code: "ENTITY_REQUIRED" };
  }

  const [trustRows] = await pool.execute(
    `SELECT trust_score, delivery_success_rate, dispute_rate, verification_score, response_speed_score
     FROM trust_profiles
     WHERE entity_type = ? AND entity_id = ?
     LIMIT 1`,
    [entityType, entityId]
  );
  const row = trustRows[0] || {};
  const trustScore = toNum(row.trust_score, 50);
  const delivery = toNum(row.delivery_success_rate, 70);
  const dispute = toNum(row.dispute_rate, 12);
  const verification = toNum(row.verification_score, 60);
  const responseSpeed = toNum(row.response_speed_score, 60);

  const composite = clamp(
    Math.round(
      trustScore * 0.45 +
      delivery * 0.2 +
      verification * 0.2 +
      responseSpeed * 0.15 -
      dispute * 0.3
    ),
    0,
    100
  );

  const decision = composite >= 75 ? "trusted" : composite >= 55 ? "watch" : "high_review";
  return {
    ok: true,
    entityType,
    entityId,
    compositeScore: composite,
    decision
  };
}

async function getDiscoveryRecommendations(pool, input) {
  const userCountry = String(input.userCountry || "").trim().toUpperCase();
  const preferredCategory = String(input.preferredCategory || "").trim().toLowerCase();

  const params = [];
  let whereClause = "WHERE p.status = 'active' AND s.active = 1";
  if (preferredCategory) {
    whereClause += " AND LOWER(c.name) = ?";
    params.push(preferredCategory);
  }

  const [rows] = await pool.execute(
    `SELECT
       p.id AS product_id,
       p.title,
       p.base_price,
       p.currency,
       p.origin_country,
       c.name AS category_name,
       s.name AS shop_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN shops s ON s.id = p.shop_id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT 20`,
    params
  );

  const trustByShop = new Map();
  const [trustRows] = await pool.execute(
    `SELECT entity_id, trust_score
     FROM trust_profiles
     WHERE entity_type = 'seller'`
  );
  trustRows.forEach((r) => {
    trustByShop.set(Number(r.entity_id), toNum(r.trust_score, 55));
  });

  const scored = rows.map((r) => {
    const price = toNum(r.base_price, 0);
    const trust = trustByShop.get(Number(r.product_id)) || 60;
    const countryBonus = userCountry && String(r.origin_country || "").toUpperCase() !== userCountry ? 4 : 0;
    const noveltyBonus = 6;
    const score = clamp(Math.round(trust * 0.6 + noveltyBonus + countryBonus - Math.min(price / 80, 18)), 0, 100);
    return {
      productId: r.product_id,
      title: r.title,
      category: r.category_name,
      shop: r.shop_name,
      price: `${r.currency} ${price.toFixed(2)}`,
      score
    };
  }).sort((a, b) => b.score - a.score).slice(0, 8);

  return {
    ok: true,
    recommendations: scored
  };
}

async function getTechnicalRiskRecommendations(pool) {
  const delivery = await getDeliverySignal(pool);
  const safety = await getSafetySignal(pool);

  const [orderRows] = await pool.execute(
    `SELECT COUNT(*) AS total_orders_30d
     FROM orders
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const orders30d = toNum(orderRows[0]?.total_orders_30d);

  const risk = clamp(
    Math.round((1 - delivery.reliability) * 45 + safety.riskRatio * 35 + (orders30d > 2500 ? 20 : orders30d > 1000 ? 10 : 5)),
    0,
    100
  );
  const priority = risk >= 70 ? "high" : risk >= 45 ? "medium" : "low";

  const recommendations = [
    "Enable stricter API rate limits on chat safety and checkout endpoints during spikes.",
    "Move heavy non-critical jobs (reminders, digest rebuilds, analytics aggregation) to queue workers.",
    "Add endpoint-level latency/error SLO alarms with auto-escalation for sustained failures."
  ];
  if (delivery.reliability < 0.75) {
    recommendations.push("Activate route-level circuit breaker for low reliability couriers.");
  }
  if (safety.riskRatio > 0.2) {
    recommendations.push("Increase trust-and-safety moderation throughput with temporary review mode.");
  }

  return {
    ok: true,
    priority,
    technicalRiskScore: risk,
    recommendations
  };
}

async function getOwnerRiskDashboard(pool) {
  const trustScore = await getTrustSignal(pool);
  const safety = await getSafetySignal(pool);
  const delivery = await getDeliverySignal(pool);

  const [riskRows] = await pool.execute(
    `SELECT risk_focus, COUNT(*) AS event_count, COALESCE(SUM(score_delta), 0) AS total_delta
     FROM platform_risk_events
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)
     GROUP BY risk_focus`
  );
  const byFocus = riskRows.map((r) => ({
    riskFocus: String(r.risk_focus),
    eventCount: toNum(r.event_count),
    totalDelta: toNum(r.total_delta)
  }));

  const [weeklyRows] = await pool.execute(
    `SELECT DATE(created_at) AS day_key, COUNT(*) AS events
     FROM platform_risk_events
     WHERE created_at >= (NOW() - INTERVAL 7 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day_key ASC`
  );

  const [monthlyRows] = await pool.execute(
    `SELECT DATE(created_at) AS day_key, COUNT(*) AS events
     FROM platform_risk_events
     WHERE created_at >= (NOW() - INTERVAL 30 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day_key ASC`
  );

  return {
    ok: true,
    summary: {
      avgTrustScore: trustScore,
      highSafetyEvents30d: safety.high,
      mediumSafetyEvents30d: safety.medium,
      deliveryReliability30d: Number((delivery.reliability * 100).toFixed(2))
    },
    byFocus,
    trends: {
      sevenDay: weeklyRows.map((r) => ({ day: String(r.day_key), events: toNum(r.events) })),
      thirtyDay: monthlyRows.map((r) => ({ day: String(r.day_key), events: toNum(r.events) }))
    }
  };
}

module.exports = {
  runFraudPrecheck,
  evaluateTrustSafety,
  getDiscoveryRecommendations,
  getTechnicalRiskRecommendations,
  getOwnerRiskDashboard
};
