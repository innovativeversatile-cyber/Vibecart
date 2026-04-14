"use strict";

function ensure(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

const SCAM_RULES = [
  { key: "pay outside", weight: 35 },
  { key: "send otp", weight: 45 },
  { key: "gift card", weight: 25 },
  { key: "crypto only", weight: 25 },
  { key: "wire transfer", weight: 30 },
  { key: "urgent payment", weight: 20 }
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
  await db.execute(
    `INSERT INTO chat_safety_events (
      conversation_id, sender_user_id, risk_level, risk_score, matched_rules, message_excerpt
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      conversationId ? Number(conversationId) : null,
      senderUserId ? Number(senderUserId) : null,
      evaluation.riskLevel,
      evaluation.riskScore,
      evaluation.matchedRules.join(", "),
      String(messageText).slice(0, 255)
    ]
  );
  return { ok: true, ...evaluation };
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
  const { userId, medicationName, dosageText, scheduleType, scheduleTime, instructions } = payload;
  ensure(userId, "Missing userId.");
  ensure(medicationName, "Missing medicationName.");
  ensure(dosageText, "Missing dosageText.");
  ensure(scheduleTime, "Missing scheduleTime.");
  const [result] = await db.execute(
    `INSERT INTO medication_schedules (
      user_id, medication_name, dosage_text, schedule_type, schedule_time, instructions, active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      Number(userId),
      String(medicationName).slice(0, 140),
      String(dosageText).slice(0, 120),
      String(scheduleType || "daily"),
      String(scheduleTime).slice(0, 30),
      instructions ? String(instructions).slice(0, 255) : null
    ]
  );
  return { ok: true, medicationScheduleId: result.insertId };
}

async function logHealthCheckin(db, payload) {
  const { userId, checkinType, metricValue, notes } = payload;
  ensure(userId, "Missing userId.");
  ensure(checkinType, "Missing checkinType.");
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

async function getCoachDashboard(db, payload) {
  const userId = Number(payload.userId || 0);
  ensure(userId, "Missing userId.");
  const [profileRows] = await db.execute(
    `SELECT user_id, coach_focus, goal_notes, baseline_weight_kg, target_weight_kg, daily_activity_goal, medication_tracking_enabled, health_risk_notes
     FROM ai_coach_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  const [medRows] = await db.execute(
    `SELECT id, medication_name, dosage_text, schedule_type, schedule_time, instructions
     FROM medication_schedules
     WHERE user_id = ? AND active = 1
     ORDER BY id DESC
     LIMIT 10`,
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
  return {
    ok: true,
    profile: profileRows[0] || null,
    medicationSchedules: medRows,
    recentCheckins: checkinRows
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
     WHERE ms.active = 1
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
               'Please log medication/activity check-in for today to stay on track.',
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
  addMedicationSchedule,
  logHealthCheckin,
  getCoachDashboard,
  listChatSafetyEvents,
  getCoachMetricsSummary,
  queueDailyHealthReminders
};
