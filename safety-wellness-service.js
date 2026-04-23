"use strict";

function ensure(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

const COACH_FREE_FEATURES = Object.freeze([
  "coach_profile_basic",
  "coach_dashboard",
  "checkin_basic",
  "wearable_basic"
]);

const COACH_PLAN_FEATURES = Object.freeze({
  FREE: COACH_FREE_FEATURES,
  PLUS: [
    ...COACH_FREE_FEATURES,
    "checkin_unlimited",
    "wearable_advanced",
    "custom_plan_monthly"
  ],
  PRO: [
    ...COACH_FREE_FEATURES,
    "checkin_unlimited",
    "wearable_advanced",
    "custom_plan_monthly",
    "deep_analysis_report",
    "priority_human_review"
  ]
});

async function ensureCoachMonetizationTables(db) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS health_subscription_plans (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      plan_code VARCHAR(40) NOT NULL UNIQUE,
      plan_name VARCHAR(120) NOT NULL,
      monthly_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      currency CHAR(3) NOT NULL DEFAULT 'EUR',
      interval_days INT NOT NULL DEFAULT 30,
      features_json JSON NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS health_user_subscriptions (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      plan_id BIGINT UNSIGNED NOT NULL,
      status ENUM('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
      auto_renew TINYINT(1) NOT NULL DEFAULT 1,
      start_at DATETIME NOT NULL,
      end_at DATETIME NOT NULL,
      source_note VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES health_subscription_plans(id),
      INDEX idx_health_subscriptions_user_status (user_id, status, end_at)
    )`
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS health_feature_entitlements (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      feature_key VARCHAR(80) NOT NULL,
      source_type ENUM('subscription','addon','promo') NOT NULL DEFAULT 'subscription',
      source_id BIGINT UNSIGNED NULL,
      starts_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      INDEX idx_health_entitlements_user_feature (user_id, feature_key, expires_at)
    )`
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS health_addon_purchases (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      addon_code VARCHAR(60) NOT NULL,
      addon_name VARCHAR(140) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'EUR',
      status ENUM('pending','paid','failed','cancelled') NOT NULL DEFAULT 'paid',
      metadata_json JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      INDEX idx_health_addon_user_time (user_id, created_at)
    )`
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS health_partner_events (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NULL,
      partner_name VARCHAR(160) NOT NULL,
      event_type ENUM('click','lead','booking','purchase') NOT NULL DEFAULT 'click',
      payout_model ENUM('none','cpc','cpl','cpa','cps') NOT NULL DEFAULT 'none',
      payout_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      currency CHAR(3) NOT NULL DEFAULT 'EUR',
      status ENUM('tracked','approved','rejected','paid') NOT NULL DEFAULT 'tracked',
      metadata_json JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      INDEX idx_health_partner_status_time (status, created_at)
    )`
  );
  await db.execute(
    `INSERT INTO health_subscription_plans (plan_code, plan_name, monthly_price, currency, interval_days, features_json, active)
     VALUES
      ('FREE', 'VibeFit Free', 0.00, 'EUR', 30, JSON_ARRAY('coach_profile_basic','coach_dashboard','checkin_basic','wearable_basic'), 1),
      ('PLUS', 'VibeFit Plus', 6.99, 'EUR', 30, JSON_ARRAY('coach_profile_basic','coach_dashboard','checkin_basic','wearable_basic','checkin_unlimited','wearable_advanced','custom_plan_monthly'), 1),
      ('PRO', 'VibeFit Pro', 12.99, 'EUR', 30, JSON_ARRAY('coach_profile_basic','coach_dashboard','checkin_basic','wearable_basic','checkin_unlimited','wearable_advanced','custom_plan_monthly','deep_analysis_report','priority_human_review'), 1)
     ON DUPLICATE KEY UPDATE
      plan_name = VALUES(plan_name),
      monthly_price = VALUES(monthly_price),
      currency = VALUES(currency),
      interval_days = VALUES(interval_days),
      features_json = VALUES(features_json),
      active = VALUES(active)`
  );
}

function normalizeFeatureSet(features) {
  return new Set(
    (Array.isArray(features) ? features : [])
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
  );
}

async function getCoachMonetizationState(db, payload) {
  const userId = Number(payload.userId || 0);
  ensure(userId, "Missing userId.");
  await ensureCoachMonetizationTables(db);

  const [subRows] = await db.execute(
    `SELECT s.id, s.status, s.auto_renew, s.start_at, s.end_at,
            p.plan_code, p.plan_name, p.monthly_price, p.currency, p.features_json
     FROM health_user_subscriptions s
     JOIN health_subscription_plans p ON p.id = s.plan_id
     WHERE s.user_id = ?
       AND s.status = 'active'
       AND s.end_at > NOW()
     ORDER BY s.end_at DESC
     LIMIT 1`,
    [userId]
  );
  const activeSub = subRows[0] || null;
  const planCode = String(activeSub?.plan_code || "FREE").toUpperCase();
  const planFeatures = normalizeFeatureSet(COACH_PLAN_FEATURES[planCode] || COACH_FREE_FEATURES);

  const [entRows] = await db.execute(
    `SELECT feature_key, source_type, source_id, expires_at
     FROM health_feature_entitlements
     WHERE user_id = ?
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY id DESC
     LIMIT 500`,
    [userId]
  );
  const entitlementFeatures = normalizeFeatureSet(entRows.map((row) => row.feature_key));
  const mergedFeatures = new Set([...planFeatures, ...entitlementFeatures]);
  mergedFeatures.delete("medication_tracking");

  const [addonRows] = await db.execute(
    `SELECT id, addon_code, addon_name, amount, currency, status, created_at
     FROM health_addon_purchases
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );
  const [partnerRows] = await db.execute(
    `SELECT event_type, COUNT(*) AS n
     FROM health_partner_events
     WHERE user_id = ?
     GROUP BY event_type`,
    [userId]
  );

  return {
    ok: true,
    plan: {
      code: planCode,
      name: activeSub?.plan_name || "VibeFit Free",
      monthlyPrice: Number(activeSub?.monthly_price || 0),
      currency: String(activeSub?.currency || "EUR"),
      startsAt: activeSub?.start_at || null,
      endsAt: activeSub?.end_at || null,
      autoRenew: Number(activeSub?.auto_renew || 0) === 1,
      status: activeSub?.status || "active"
    },
    entitlements: Array.from(mergedFeatures).sort(),
    addOns: addonRows.map((row) => ({
      id: Number(row.id),
      addonCode: String(row.addon_code || ""),
      addonName: String(row.addon_name || ""),
      amount: Number(row.amount || 0),
      currency: String(row.currency || "EUR"),
      status: String(row.status || "paid"),
      createdAt: row.created_at
    })),
    partnerEvents: partnerRows.map((row) => ({
      eventType: String(row.event_type || "click"),
      count: Number(row.n || 0)
    }))
  };
}

function hasEntitlementKey(featureSet, key) {
  return featureSet.has(String(key || "").trim().toLowerCase());
}

async function startCoachSubscription(db, payload) {
  const userId = Number(payload.userId || 0);
  const planCode = String(payload.planCode || "").trim().toUpperCase();
  const autoRenew = payload.autoRenew === undefined ? 1 : payload.autoRenew ? 1 : 0;
  ensure(userId, "Missing userId.");
  ensure(planCode, "Missing planCode.");
  await ensureCoachMonetizationTables(db);

  const [planRows] = await db.execute(
    `SELECT id, plan_code, plan_name, monthly_price, currency, interval_days, features_json
     FROM health_subscription_plans
     WHERE plan_code = ? AND active = 1
     LIMIT 1`,
    [planCode]
  );
  const plan = planRows[0];
  if (!plan) {
    throw new Error("Health subscription plan not found.");
  }

  await db.execute(
    `UPDATE health_user_subscriptions
     SET status = 'expired'
     WHERE user_id = ? AND status = 'active' AND end_at <= NOW()`,
    [userId]
  );
  await db.execute(
    `UPDATE health_user_subscriptions
     SET status = 'cancelled'
     WHERE user_id = ? AND status = 'active'`,
    [userId]
  );

  const [subResult] = await db.execute(
    `INSERT INTO health_user_subscriptions (user_id, plan_id, status, auto_renew, start_at, end_at, source_note)
     VALUES (?, ?, 'active', ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?)`,
    [userId, Number(plan.id), autoRenew, Number(plan.interval_days || 30), String(payload.source || "web_checkout").slice(0, 120)]
  );
  const subscriptionId = Number(subResult.insertId);

  const features = normalizeFeatureSet(
    Array.isArray(plan.features_json) ? plan.features_json : COACH_PLAN_FEATURES[planCode] || COACH_FREE_FEATURES
  );
  for (const featureKey of features) {
    await db.execute(
      `INSERT INTO health_feature_entitlements (user_id, feature_key, source_type, source_id, starts_at, expires_at)
       VALUES (?, ?, 'subscription', ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [userId, featureKey, subscriptionId, Number(plan.interval_days || 30)]
    );
  }

  if (Number(plan.monthly_price || 0) > 0) {
    await db.execute(
      `INSERT INTO platform_revenue_entries (
        source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
      ) VALUES ('subscription_fee', ?, ?, 0.00, ?, ?, NOW())`,
      [subscriptionId, Number(plan.monthly_price), Number(plan.monthly_price), String(plan.currency || "EUR")]
    );
  }

  const state = await getCoachMonetizationState(db, { userId });
  return { ok: true, subscriptionId, planCode, state };
}

async function purchaseCoachAddon(db, payload) {
  const userId = Number(payload.userId || 0);
  const addonCode = String(payload.addonCode || "").trim().toUpperCase();
  ensure(userId, "Missing userId.");
  ensure(addonCode, "Missing addonCode.");
  await ensureCoachMonetizationTables(db);

  const CATALOG = {
    CUSTOM_4W_PLAN: {
      name: "Custom 4-week plan",
      amount: 4.99,
      currency: "EUR",
      entitlement: "custom_plan_export",
      durationDays: 45
    },
    DEEP_ANALYSIS: {
      name: "Deep analysis report",
      amount: 2.99,
      currency: "EUR",
      entitlement: "deep_analysis_report",
      durationDays: 30
    },
    PRIORITY_REVIEW: {
      name: "Priority human review",
      amount: 3.99,
      currency: "EUR",
      entitlement: "priority_human_review",
      durationDays: 30
    }
  };
  const addon = CATALOG[addonCode];
  if (!addon) {
    throw new Error("Unknown coach add-on.");
  }

  const [result] = await db.execute(
    `INSERT INTO health_addon_purchases (user_id, addon_code, addon_name, amount, currency, status, metadata_json)
     VALUES (?, ?, ?, ?, ?, 'paid', JSON_OBJECT('channel', ?, 'note', ?))`,
    [
      userId,
      addonCode,
      addon.name,
      Number(addon.amount),
      addon.currency,
      String(payload.channel || "web").slice(0, 30),
      String(payload.note || "").slice(0, 120)
    ]
  );
  const addOnPurchaseId = Number(result.insertId);

  await db.execute(
    `INSERT INTO health_feature_entitlements (user_id, feature_key, source_type, source_id, starts_at, expires_at)
     VALUES (?, ?, 'addon', ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [userId, addon.entitlement, addOnPurchaseId, Number(addon.durationDays || 30)]
  );

  await db.execute(
    `INSERT INTO platform_revenue_entries (
      source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
    ) VALUES ('boost_fee', ?, ?, 0.00, ?, ?, NOW())`,
    [addOnPurchaseId, Number(addon.amount), Number(addon.amount), addon.currency]
  );

  const state = await getCoachMonetizationState(db, { userId });
  return { ok: true, addOnPurchaseId, addonCode, state };
}

async function recordCoachPartnerEvent(db, payload) {
  await ensureCoachMonetizationTables(db);
  const userIdRaw = payload.userId == null ? null : Number(payload.userId);
  const userId = Number.isFinite(userIdRaw) && userIdRaw > 0 ? userIdRaw : null;
  const partnerName = String(payload.partnerName || "").trim();
  const eventType = String(payload.eventType || "click").trim().toLowerCase();
  const payoutModel = String(payload.payoutModel || "none").trim().toLowerCase();
  const payoutAmount = Number(payload.payoutAmount || 0);
  const currency = String(payload.currency || "EUR").trim().toUpperCase();
  ensure(partnerName, "Missing partnerName.");
  if (!["click", "lead", "booking", "purchase"].includes(eventType)) {
    throw new Error("Invalid partner event type.");
  }
  if (!["none", "cpc", "cpl", "cpa", "cps"].includes(payoutModel)) {
    throw new Error("Invalid payout model.");
  }
  const status = eventType === "click" ? "tracked" : "approved";

  const [result] = await db.execute(
    `INSERT INTO health_partner_events (
      user_id, partner_name, event_type, payout_model, payout_amount, currency, status, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      partnerName.slice(0, 160),
      eventType,
      payoutModel,
      Number.isFinite(payoutAmount) ? payoutAmount : 0,
      currency,
      status,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  );
  const partnerEventId = Number(result.insertId);

  if (status === "approved" && payoutAmount > 0) {
    await db.execute(
      `INSERT INTO platform_revenue_entries (
        source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
      ) VALUES ('insurance_commission', ?, ?, 0.00, ?, ?, NOW())`,
      [partnerEventId, Number(payoutAmount), Number(payoutAmount), currency]
    );
  }
  return { ok: true, partnerEventId, status };
}

const SCAM_RULES = [
  { key: "pay outside", weight: 35 },
  { key: "send otp", weight: 45 },
  { key: "gift card", weight: 25 },
  { key: "crypto only", weight: 25 },
  { key: "wire transfer", weight: 30 },
  { key: "urgent payment", weight: 20 },
  { key: "send money first", weight: 32 },
  { key: "fake listing", weight: 30 },
  { key: "item does not exist", weight: 28 },
  { key: "product does not exist", weight: 28 },
  { key: "no stock but pay", weight: 26 },
  { key: "guaranteed profit", weight: 22 },
  { key: "warehouse clearance unlimited", weight: 18 }
];

function evaluateChatRisk(messageText) {
  const text = String(messageText || "").toLowerCase();
  let score = 0;
  const matched = [];
  SCAM_RULES.forEach((rule) => {
    if (text.includes(rule.key)) {
      score += rule.weight;
      matched.push(rule.key);
    }
  });
  let riskLevel = "low";
  if (score >= 60) {
    riskLevel = "high";
  } else if (score >= 25) {
    riskLevel = "medium";
  }
  return { riskLevel, riskScore: score, matchedRules: matched };
}

async function logChatSafetyEvent(db, payload) {
  const { conversationId, senderUserId, messageText } = payload;
  ensure(messageText, "Missing messageText.");
  const evaluation = evaluateChatRisk(messageText);
  const convId = conversationId ? Number(conversationId) : 0;
  if (!convId) {
    return { ok: true, logged: false, skipReason: "no_conversation_id", ...evaluation };
  }
  const [convRows] = await db.execute(`SELECT id FROM conversations WHERE id = ? LIMIT 1`, [convId]);
  if (!convRows || !convRows[0]) {
    return { ok: true, logged: false, skipReason: "unknown_conversation", ...evaluation };
  }
  await db.execute(
    `INSERT INTO chat_safety_events (
      conversation_id, sender_user_id, risk_level, risk_score, matched_rules, message_excerpt
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      convId,
      senderUserId ? Number(senderUserId) : null,
      evaluation.riskLevel,
      evaluation.riskScore,
      evaluation.matchedRules.join(", "),
      String(messageText).slice(0, 255)
    ]
  );
  return { ok: true, logged: true, ...evaluation };
}

async function upsertCoachProfile(db, payload) {
  const { userId, coachFocus, goalNotes, baselineWeightKg, targetWeightKg, dailyActivityGoal, medicationTrackingEnabled, healthRiskNotes } = payload;
  ensure(userId, "Missing userId.");
  await db.execute(
    `INSERT INTO ai_coach_profiles (
      user_id, coach_focus, goal_notes, baseline_weight_kg, target_weight_kg, daily_activity_goal, medication_tracking_enabled, health_risk_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      coach_focus = VALUES(coach_focus),
      goal_notes = VALUES(goal_notes),
      baseline_weight_kg = VALUES(baseline_weight_kg),
      target_weight_kg = VALUES(target_weight_kg),
      daily_activity_goal = VALUES(daily_activity_goal),
      medication_tracking_enabled = VALUES(medication_tracking_enabled),
      health_risk_notes = VALUES(health_risk_notes),
      updated_at = CURRENT_TIMESTAMP`,
    [
      Number(userId),
      String(coachFocus || "general_fitness"),
      goalNotes ? String(goalNotes).slice(0, 255) : null,
      baselineWeightKg == null ? null : Number(baselineWeightKg),
      targetWeightKg == null ? null : Number(targetWeightKg),
      dailyActivityGoal ? String(dailyActivityGoal).slice(0, 180) : null,
      medicationTrackingEnabled ? 1 : 0,
      healthRiskNotes ? String(healthRiskNotes).slice(0, 255) : null
    ]
  );
  return { ok: true, userId: Number(userId) };
}

async function addMedicationSchedule(db, payload) {
  void db;
  void payload;
  return {
    ok: false,
    code: "FEATURE_DISABLED",
    message: "Medication scheduling has been removed from VibeCart."
  };
}

async function logHealthCheckin(db, payload) {
  const { userId, checkinType, metricValue, notes } = payload;
  ensure(userId, "Missing userId.");
  ensure(checkinType, "Missing checkinType.");
  const monetization = await getCoachMonetizationState(db, { userId: Number(userId) });
  const entitlementSet = new Set(monetization.entitlements);
  if (String(checkinType) === "medication_taken") {
    return {
      ok: false,
      code: "FEATURE_DISABLED",
      message: "Medication check-ins are not available."
    };
  }
  if (!hasEntitlementKey(entitlementSet, "checkin_unlimited")) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS n
       FROM health_checkin_events
       WHERE user_id = ?
         AND DATE(created_at) = CURRENT_DATE`,
      [Number(userId)]
    );
    const usedToday = Number(rows[0]?.n || 0);
    if (usedToday >= 5) {
      return {
        ok: false,
        code: "CHECKIN_LIMIT_REACHED",
        message: "Free plan daily limit reached (5 check-ins). Upgrade to Plus for unlimited check-ins."
      };
    }
  }
  const [result] = await db.execute(
    `INSERT INTO health_checkin_events (user_id, checkin_type, metric_value, notes)
     VALUES (?, ?, ?, ?)`,
    [
      Number(userId),
      String(checkinType),
      metricValue == null ? null : String(metricValue).slice(0, 120),
      notes == null ? null : String(notes).slice(0, 255)
    ]
  );
  return { ok: true, healthCheckinId: result.insertId };
}

async function upsertWearableCoachPrefs(db, payload) {
  const userId = Number(payload.userId || 0);
  ensure(userId, "Missing userId.");
  const vendorRaw = String(payload.wearableVendor || "none").slice(0, 40);
  const vendorDb = vendorRaw === "none" ? null : vendorRaw;
  const dailyDigest = payload.dailyDigest ? 1 : 0;
  const detailedMetrics = payload.detailedMetrics ? 1 : 0;
  if (detailedMetrics) {
    const monetization = await getCoachMonetizationState(db, { userId });
    if (!hasEntitlementKey(new Set(monetization.entitlements), "wearable_advanced")) {
      return {
        ok: false,
        code: "FEATURE_LOCKED",
        requiredFeature: "wearable_advanced",
        message: "Advanced wearable metrics require VibeFit Plus."
      };
    }
  }
  const [existing] = await db.execute(
    `SELECT user_id FROM ai_coach_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  if (!existing.length) {
    await db.execute(
      `INSERT INTO ai_coach_profiles (
        user_id, coach_focus, medication_tracking_enabled,
        wearable_vendor, wearable_daily_digest, wearable_detailed_metrics
      ) VALUES (?, 'general_fitness', 0, ?, ?, ?)`,
      [userId, vendorDb, dailyDigest, detailedMetrics]
    );
  } else {
    await db.execute(
      `UPDATE ai_coach_profiles
       SET wearable_vendor = ?, wearable_daily_digest = ?, wearable_detailed_metrics = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [vendorDb, dailyDigest, detailedMetrics, userId]
    );
  }
  return { ok: true, userId };
}

async function getCoachDashboard(db, payload) {
  const userId = Number(payload.userId || 0);
  ensure(userId, "Missing userId.");
  const [profileRows] = await db.execute(
    `SELECT user_id, coach_focus, goal_notes, baseline_weight_kg, target_weight_kg, daily_activity_goal, medication_tracking_enabled,
            wearable_vendor, wearable_daily_digest, wearable_detailed_metrics, health_risk_notes
     FROM ai_coach_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  const [checkinRows] = await db.execute(
    `SELECT checkin_type, metric_value, notes, created_at
     FROM health_checkin_events
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  );
  const monetization = await getCoachMonetizationState(db, { userId });
  return {
    ok: true,
    profile: profileRows[0] || null,
    medicationSchedules: [],
    recentCheckins: checkinRows,
    monetization
  };
}

async function listChatSafetyEvents(db, payload) {
  const limit = Math.min(Math.max(Number(payload.limit || 50), 1), 200);
  const riskLevel = String(payload.riskLevel || "").trim().toLowerCase();
  const args = [];
  let where = "";
  if (riskLevel === "medium" || riskLevel === "high" || riskLevel === "low") {
    where = "WHERE risk_level = ?";
    args.push(riskLevel);
  }
  const [rows] = await db.execute(
    `SELECT id, conversation_id, sender_user_id, risk_level, risk_score, matched_rules, message_excerpt, created_at
     FROM chat_safety_events
     ${where}
     ORDER BY created_at DESC
     LIMIT ?`,
    args.concat([limit])
  );
  return { ok: true, items: rows };
}

async function getCoachMetricsSummary(db) {
  const [profileRows] = await db.execute(
    `SELECT COUNT(*) AS total_profiles,
            SUM(CASE WHEN coach_focus = 'weight_loss' THEN 1 ELSE 0 END) AS weight_loss_count,
            SUM(CASE WHEN coach_focus = 'weight_gain' THEN 1 ELSE 0 END) AS weight_gain_count,
            SUM(CASE WHEN coach_focus = 'muscle_gain' THEN 1 ELSE 0 END) AS muscle_gain_count,
            SUM(CASE WHEN coach_focus = 'medical_support' THEN 1 ELSE 0 END) AS medical_support_count,
            SUM(CASE WHEN coach_focus = 'general_fitness' THEN 1 ELSE 0 END) AS general_fitness_count
     FROM ai_coach_profiles`
  );
  const [medRows] = await db.execute(
    `SELECT COUNT(*) AS active_medication_schedules
     FROM medication_schedules
     WHERE active = 1`
  );
  const [checkinRows] = await db.execute(
    `SELECT COUNT(*) AS checkins_last_7_days
     FROM health_checkin_events
     WHERE created_at >= (NOW() - INTERVAL 7 DAY)`
  );
  return {
    ok: true,
    summary: {
      totalProfiles: Number(profileRows[0]?.total_profiles || 0),
      weightLoss: Number(profileRows[0]?.weight_loss_count || 0),
      weightGain: Number(profileRows[0]?.weight_gain_count || 0),
      muscleGain: Number(profileRows[0]?.muscle_gain_count || 0),
      medicalSupport: Number(profileRows[0]?.medical_support_count || 0),
      generalFitness: Number(profileRows[0]?.general_fitness_count || 0),
      activeMedicationSchedules: Number(medRows[0]?.active_medication_schedules || 0),
      checkinsLast7Days: Number(checkinRows[0]?.checkins_last_7_days || 0)
    }
  };
}

async function queueDailyHealthReminders(db, payload) {
  const limit = Math.min(Math.max(Number(payload.limit || 500), 1), 5000);
  const [rows] = await db.execute(
    `SELECT DISTINCT ms.user_id
     FROM medication_schedules ms
     WHERE ms.active = 1 AND FALSE
     ORDER BY ms.user_id ASC
     LIMIT ?`,
    [limit]
  );

  let queued = 0;
  for (const row of rows) {
    const userId = Number(row.user_id);
    const [checkins] = await db.execute(
      `SELECT id
       FROM health_checkin_events
       WHERE user_id = ?
         AND DATE(created_at) = CURRENT_DATE
       LIMIT 1`,
      [userId]
    );
    if (checkins.length > 0) {
      continue;
    }
    await db.execute(
      `INSERT INTO notification_events (user_id, event_type, title, message, deep_link, delivery_status)
       VALUES (?, 'health_daily_reminder', 'Health Check-In Reminder',
               'Please log your activity or wellbeing check-in for today to stay on track.',
               'vibecart://health-coach', 'queued')`,
      [userId]
    );
    queued += 1;
  }

  return { ok: true, scannedUsers: rows.length, queued };
}

module.exports = {
  evaluateChatRisk,
  logChatSafetyEvent,
  upsertCoachProfile,
  upsertWearableCoachPrefs,
  addMedicationSchedule,
  logHealthCheckin,
  getCoachDashboard,
  getCoachMonetizationState,
  startCoachSubscription,
  purchaseCoachAddon,
  recordCoachPartnerEvent,
  listChatSafetyEvents,
  getCoachMetricsSummary,
  queueDailyHealthReminders
};
