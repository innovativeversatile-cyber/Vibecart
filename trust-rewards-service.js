"use strict";

const REWARD_RULES = Object.freeze({
  maxDailyPoints: 120,
  minSecondsBetweenEarns: 45,
  earnPointsByEvent: {
    safe_purchase: 20,
    booking_completed: 18,
    on_time_subscription: 16,
    referral: 25
  },
  redeemCost: 60
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeEventType(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveTier(points) {
  if (points >= 400) {
    return "campus_pro_saver";
  }
  if (points >= 220) {
    return "campus_smart";
  }
  return "starter";
}

async function listTrustProfiles(db, payload) {
  const entityType = String(payload.entityType || "").trim().toLowerCase();
  const params = [];
  let sql =
    `SELECT entity_type, entity_id, trust_score, delivery_success_rate, dispute_rate, verification_score, response_speed_score, updated_at
     FROM trust_profiles`;
  if (entityType) {
    sql += " WHERE entity_type = ?";
    params.push(entityType);
  }
  sql += " ORDER BY trust_score DESC, updated_at DESC LIMIT 100";
  const [rows] = await db.execute(sql, params);
  return { ok: true, items: rows };
}

async function upsertTrustProfile(db, payload) {
  const entityType = String(payload.entityType || "").trim().toLowerCase();
  const entityId = Number(payload.entityId || 0);
  assert(["seller", "provider", "courier", "insurer"].includes(entityType), "Invalid entity type.");
  assert(entityId > 0, "Invalid entity id.");

  const score = Number(payload.trustScore || 50);
  const delivery = payload.deliverySuccessRate == null ? null : Number(payload.deliverySuccessRate);
  const dispute = payload.disputeRate == null ? null : Number(payload.disputeRate);
  const verification = payload.verificationScore == null ? null : Number(payload.verificationScore);
  const response = payload.responseSpeedScore == null ? null : Number(payload.responseSpeedScore);

  await db.execute(
    `INSERT INTO trust_profiles (
      entity_type, entity_id, trust_score, delivery_success_rate, dispute_rate, verification_score, response_speed_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      trust_score = VALUES(trust_score),
      delivery_success_rate = VALUES(delivery_success_rate),
      dispute_rate = VALUES(dispute_rate),
      verification_score = VALUES(verification_score),
      response_speed_score = VALUES(response_speed_score),
      updated_at = CURRENT_TIMESTAMP`,
    [entityType, entityId, score, delivery, dispute, verification, response]
  );
  return { ok: true, entityType, entityId };
}

async function ensureRewardProfile(db, userId) {
  await db.execute(
    `INSERT INTO user_reward_profiles (user_id, points_balance, current_tier, safe_action_streak_weeks, last_activity_at)
     VALUES (?, 0, 'starter', 0, NOW())
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId]
  );
}

async function getRewardProfile(db, payload) {
  const userId = Number(payload.userId || 0);
  assert(userId > 0, "Invalid userId.");
  await ensureRewardProfile(db, userId);
  const [rows] = await db.execute(
    `SELECT user_id, points_balance, current_tier, safe_action_streak_weeks, last_activity_at, updated_at
     FROM user_reward_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  const profile = rows[0];
  return { ok: true, profile };
}

async function earnRewardPoints(db, payload) {
  const userId = Number(payload.userId || 0);
  const eventType = normalizeEventType(payload.eventType);
  assert(userId > 0, "Invalid userId.");
  assert(Object.prototype.hasOwnProperty.call(REWARD_RULES.earnPointsByEvent, eventType), "Invalid earn event type.");
  const points = REWARD_RULES.earnPointsByEvent[eventType];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await ensureRewardProfile(conn, userId);

    const [dailyRows] = await conn.execute(
      `SELECT COALESCE(SUM(points_delta), 0) AS earned_today
       FROM reward_events
       WHERE user_id = ?
         AND points_delta > 0
         AND created_at >= DATE(NOW())`,
      [userId]
    );
    const earnedToday = Number(dailyRows[0]?.earned_today || 0);
    if (earnedToday + points > REWARD_RULES.maxDailyPoints) {
      throw new Error("REWARD_DAILY_LIMIT_REACHED");
    }

    const [recentRows] = await conn.execute(
      `SELECT created_at
       FROM reward_events
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    const recent = recentRows[0];
    if (recent) {
      const ageSeconds = Math.floor((Date.now() - new Date(recent.created_at).getTime()) / 1000);
      if (ageSeconds < REWARD_RULES.minSecondsBetweenEarns) {
        throw new Error("REWARD_TOO_FAST");
      }
    }

    await conn.execute(
      `INSERT INTO reward_events (user_id, event_type, points_delta, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, eventType, points, payload.referenceType || null, payload.referenceId || null]
    );

    const [profileRows] = await conn.execute(
      `SELECT points_balance, safe_action_streak_weeks
       FROM user_reward_profiles
       WHERE user_id = ?
       FOR UPDATE`,
      [userId]
    );
    const profile = profileRows[0];
    const nextPoints = Number(profile.points_balance || 0) + points;
    const nextTier = resolveTier(nextPoints);
    const nextStreak = Number(profile.safe_action_streak_weeks || 0) + (eventType === "safe_purchase" ? 1 : 0);
    await conn.execute(
      `UPDATE user_reward_profiles
       SET points_balance = ?, current_tier = ?, safe_action_streak_weeks = ?, last_activity_at = NOW(), updated_at = NOW()
       WHERE user_id = ?`,
      [nextPoints, nextTier, nextStreak, userId]
    );

    await conn.commit();
    return { ok: true, userId, pointsEarned: points, pointsBalance: nextPoints, currentTier: nextTier, streakWeeks: nextStreak };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function redeemReward(db, payload) {
  const userId = Number(payload.userId || 0);
  assert(userId > 0, "Invalid userId.");
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await ensureRewardProfile(conn, userId);
    const [rows] = await conn.execute(
      `SELECT points_balance, current_tier, safe_action_streak_weeks
       FROM user_reward_profiles
       WHERE user_id = ?
       FOR UPDATE`,
      [userId]
    );
    const profile = rows[0];
    const balance = Number(profile.points_balance || 0);
    if (balance < REWARD_RULES.redeemCost) {
      throw new Error("INSUFFICIENT_REWARD_POINTS");
    }
    const nextPoints = balance - REWARD_RULES.redeemCost;
    const nextTier = resolveTier(nextPoints);
    await conn.execute(
      `INSERT INTO reward_events (user_id, event_type, points_delta, reference_type, reference_id)
       VALUES (?, 'redeem', ?, ?, ?)`,
      [userId, -REWARD_RULES.redeemCost, payload.referenceType || "perk", payload.referenceId || null]
    );
    await conn.execute(
      `UPDATE user_reward_profiles
       SET points_balance = ?, current_tier = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [nextPoints, nextTier, userId]
    );
    await conn.commit();
    return { ok: true, userId, pointsBalance: nextPoints, currentTier: nextTier };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  REWARD_RULES,
  listTrustProfiles,
  upsertTrustProfile,
  getRewardProfile,
  earnRewardPoints,
  redeemReward
};
