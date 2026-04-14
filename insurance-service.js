"use strict";

function asMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function ensure(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

const INSURANCE_GUARDRAILS = Object.freeze({
  defaultCommissionPercent: 4,
  maxCommissionPercent: 6
});

async function assertJurisdictionAllowed(db, countryCode) {
  const cc = String(countryCode || "").trim().toUpperCase();
  ensure(cc, "Missing countryCode for jurisdiction check.");
  const [rows] = await db.execute(
    `SELECT distribution_enabled, risk_level
     FROM insurance_jurisdiction_controls
     WHERE country_code = ?
     LIMIT 1`,
    [cc]
  );
  const row = rows[0];
  if (!row || Number(row.distribution_enabled) !== 1 || row.risk_level !== "low") {
    throw new Error("INSURANCE_JURISDICTION_BLOCKED");
  }
  return cc;
}

async function listInsuranceJurisdictions(db) {
  const [rows] = await db.execute(
    `SELECT country_code, distribution_enabled, risk_level, legal_reviewed_at, legal_notes, updated_at
     FROM insurance_jurisdiction_controls
     ORDER BY country_code ASC`,
    []
  );
  return { ok: true, items: rows };
}

async function upsertInsuranceJurisdiction(db, payload) {
  const countryCode = String(payload.countryCode || "").trim().toUpperCase();
  const distributionEnabled = payload.distributionEnabled ? 1 : 0;
  const riskLevel = String(payload.riskLevel || "medium").trim().toLowerCase();
  const legalNotes = payload.legalNotes ? String(payload.legalNotes).trim() : null;
  ensure(countryCode, "Missing countryCode.");
  if (!["low", "medium", "high"].includes(riskLevel)) {
    throw new Error("Invalid risk level.");
  }
  await db.execute(
    `INSERT INTO insurance_jurisdiction_controls (
      country_code, distribution_enabled, risk_level, legal_reviewed_at, legal_notes
    ) VALUES (?, ?, ?, NOW(), ?)
    ON DUPLICATE KEY UPDATE
      distribution_enabled = VALUES(distribution_enabled),
      risk_level = VALUES(risk_level),
      legal_reviewed_at = NOW(),
      legal_notes = VALUES(legal_notes)`,
    [countryCode, distributionEnabled, riskLevel, legalNotes]
  );
  return { ok: true, countryCode, distributionEnabled, riskLevel };
}

async function disableInsuranceJurisdiction(db, payload) {
  const countryCode = String(payload.countryCode || "").trim().toUpperCase();
  ensure(countryCode, "Missing countryCode.");
  await db.execute(
    `UPDATE insurance_jurisdiction_controls
     SET distribution_enabled = 0,
         risk_level = 'high',
         legal_reviewed_at = NOW(),
         legal_notes = COALESCE(?, legal_notes)
     WHERE country_code = ?`,
    [payload.legalNotes ? String(payload.legalNotes).trim() : null, countryCode]
  );
  return { ok: true, countryCode, distributionEnabled: 0, riskLevel: "high" };
}

async function getCommissionRule(db, providerId, billingType) {
  const [rows] = await db.execute(
    `SELECT commission_percent, max_commission_percent
     FROM insurance_commission_rules
     WHERE active = 1
       AND (provider_id = ? OR provider_id IS NULL)
       AND (applies_to = ? OR applies_to = 'all')
     ORDER BY provider_id IS NULL ASC, id DESC
     LIMIT 1`,
    [Number(providerId), String(billingType)]
  );
  const row = rows[0];
  if (!row) {
    return INSURANCE_GUARDRAILS.defaultCommissionPercent;
  }
  const commission = Number(row.commission_percent || INSURANCE_GUARDRAILS.defaultCommissionPercent);
  const max = Number(row.max_commission_percent || INSURANCE_GUARDRAILS.maxCommissionPercent);
  return Math.min(commission, max, INSURANCE_GUARDRAILS.maxCommissionPercent);
}

async function listPublicInsurancePlans(db, payload) {
  const countryCode = await assertJurisdictionAllowed(db, payload.countryCode);
  const [rows] = await db.execute(
    `SELECT p.id, p.plan_name, p.plan_type, p.monthly_premium, p.currency, p.waiting_period_days, p.renewal_cycle, p.summary_text,
            ip.provider_name, ip.website_url
     FROM insurance_plans p
     INNER JOIN insurance_providers ip ON ip.id = p.provider_id
     WHERE p.active = 1 AND ip.active = 1 AND ip.legal_verified = 1
     ORDER BY p.monthly_premium ASC, p.id DESC
     LIMIT 100`,
    []
  );
  return { ok: true, countryCode, plans: rows };
}

async function createInsuranceProvider(db, payload) {
  const { providerName, providerType, contactEmail, websiteUrl, legalVerified } = payload;
  ensure(providerName, "Missing providerName.");
  ensure(contactEmail, "Missing contactEmail.");
  const [result] = await db.execute(
    `INSERT INTO insurance_providers (
      provider_name, provider_type, contact_email, website_url, legal_verified, active
    ) VALUES (?, ?, ?, ?, ?, 1)`,
    [
      String(providerName).trim(),
      String(providerType || "mixed"),
      String(contactEmail).trim().toLowerCase(),
      websiteUrl ? String(websiteUrl).trim() : null,
      legalVerified ? 1 : 0
    ]
  );
  return { ok: true, insuranceProviderId: result.insertId };
}

async function createInsurancePlan(db, payload) {
  const { providerId, planName, planType, monthlyPremium, currency, waitingPeriodDays, renewalCycle, summaryText } = payload;
  ensure(providerId, "Missing providerId.");
  ensure(planName, "Missing planName.");
  ensure(monthlyPremium != null, "Missing monthlyPremium.");
  const [result] = await db.execute(
    `INSERT INTO insurance_plans (
      provider_id, plan_name, plan_type, monthly_premium, currency, waiting_period_days, renewal_cycle, summary_text, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      Number(providerId),
      String(planName).trim(),
      String(planType || "student_cover"),
      asMoney(monthlyPremium),
      String(currency || "EUR").trim().toUpperCase(),
      Number(waitingPeriodDays || 0),
      String(renewalCycle || "monthly"),
      summaryText ? String(summaryText).trim() : null
    ]
  );
  return { ok: true, insurancePlanId: result.insertId };
}

async function subscribeUserToInsurance(db, payload) {
  const { userId, planId, startsAt, autoRenew } = payload;
  ensure(userId, "Missing userId.");
  ensure(planId, "Missing planId.");
  ensure(startsAt, "Missing startsAt.");
  const policyNumber = `VC-POL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const [userRows] = await db.execute(
    `SELECT country_code
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [Number(userId)]
  );
  const user = userRows[0];
  if (!user) {
    throw new Error("User not found.");
  }
  await assertJurisdictionAllowed(db, user.country_code);

  const [planRows] = await db.execute(
    `SELECT p.monthly_premium, p.currency, p.renewal_cycle, p.provider_id, ip.legal_verified
     FROM insurance_plans p
     INNER JOIN insurance_providers ip ON ip.id = p.provider_id
     WHERE p.id = ? AND p.active = 1 AND ip.active = 1
     LIMIT 1`,
    [Number(planId)]
  );
  const plan = planRows[0];
  if (!plan || !plan.legal_verified) {
    throw new Error("Insurance plan not found.");
  }

  const [subResult] = await db.execute(
    `INSERT INTO insurance_subscriptions (
      user_id, plan_id, policy_number, starts_at, next_due_at, status, auto_renew
    ) VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL 1 MONTH), 'active', ?)`,
    [Number(userId), Number(planId), policyNumber, startsAt, startsAt, autoRenew === false ? 0 : 1]
  );

  const [paymentResult] = await db.execute(
    `INSERT INTO insurance_payment_events (
      subscription_id, amount, currency, status, due_at
    ) VALUES (?, ?, ?, 'due', DATE_ADD(?, INTERVAL 1 MONTH))`,
    [subResult.insertId, plan.monthly_premium, plan.currency, startsAt]
  );

  const commissionPct = await getCommissionRule(db, plan.provider_id, "new_subscription");
  const commissionAmount = asMoney((Number(plan.monthly_premium) * commissionPct) / 100);
  await db.execute(
    `INSERT INTO insurance_commission_entries (
      subscription_id, payment_event_id, provider_id, commission_percent, premium_amount, commission_amount, currency, billing_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new_subscription')`,
    [subResult.insertId, paymentResult.insertId, plan.provider_id, commissionPct, plan.monthly_premium, commissionAmount, plan.currency]
  );
  await db.execute(
    `INSERT INTO platform_revenue_entries (
      source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
    ) VALUES ('insurance_commission', ?, ?, 0.00, ?, ?, NOW())`,
    [subResult.insertId, commissionAmount, commissionAmount, plan.currency]
  );

  await db.execute(
    `INSERT INTO notification_events (
      user_id, event_type, title, message, deep_link, delivery_status
    ) VALUES (?, 'insurance_subscription_started', ?, ?, ?, 'queued')`,
    [
      Number(userId),
      "Insurance subscription active",
      `Your policy ${policyNumber} is active. Next premium is due in one month.`,
      `/insurance/subscriptions/${subResult.insertId}`
    ]
  );

  return { ok: true, subscriptionId: subResult.insertId, policyNumber, commissionAmount, commissionPercent: commissionPct };
}

async function queueInsuranceDueReminders(db, payload) {
  const daysAhead = Number(payload.daysAhead || 5);
  const [rows] = await db.execute(
    `SELECT s.id, s.user_id, s.next_due_at, s.policy_number, p.plan_name
     FROM insurance_subscriptions s
     INNER JOIN insurance_plans p ON p.id = s.plan_id
     WHERE s.status = 'active'
       AND s.next_due_at <= DATE_ADD(NOW(), INTERVAL ? DAY)`,
    [daysAhead]
  );

  let queued = 0;
  for (const row of rows) {
    await db.execute(
      `INSERT INTO notification_events (
        user_id, event_type, title, message, deep_link, delivery_status
      ) VALUES (?, 'insurance_due_reminder', ?, ?, ?, 'queued')`,
      [
        row.user_id,
        "Insurance due date reminder",
        `${row.plan_name} premium for policy ${row.policy_number} is due on ${new Date(row.next_due_at).toISOString()}.`,
        `/insurance/subscriptions/${row.id}`
      ]
    );
    queued += 1;
  }
  return { ok: true, remindersQueued: queued, daysAhead };
}

async function recordInsurancePayment(db, payload) {
  const { subscriptionId, amount, currency, paidAt, isRenewal } = payload;
  ensure(subscriptionId, "Missing subscriptionId.");
  ensure(amount != null, "Missing amount.");
  const [subRows] = await db.execute(
    `SELECT s.id, s.user_id, s.plan_id, p.provider_id, p.currency, p.monthly_premium
     FROM insurance_subscriptions s
     INNER JOIN insurance_plans p ON p.id = s.plan_id
     WHERE s.id = ? AND s.status = 'active'
     LIMIT 1`,
    [Number(subscriptionId)]
  );
  const sub = subRows[0];
  if (!sub) {
    throw new Error("Subscription not found.");
  }

  const [payResult] = await db.execute(
    `INSERT INTO insurance_payment_events (
      subscription_id, amount, currency, status, due_at, paid_at
    ) VALUES (?, ?, ?, 'paid', NOW(), ?)`,
    [Number(subscriptionId), asMoney(amount), String(currency || sub.currency), paidAt || new Date().toISOString()]
  );

  const billingType = isRenewal ? "renewal" : "new_subscription";
  const commissionPct = await getCommissionRule(db, sub.provider_id, billingType);
  const commissionAmount = asMoney((asMoney(amount) * commissionPct) / 100);
  await db.execute(
    `INSERT INTO insurance_commission_entries (
      subscription_id, payment_event_id, provider_id, commission_percent, premium_amount, commission_amount, currency, billing_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [Number(subscriptionId), payResult.insertId, sub.provider_id, commissionPct, asMoney(amount), commissionAmount, String(currency || sub.currency), billingType]
  );
  await db.execute(
    `INSERT INTO platform_revenue_entries (
      source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
    ) VALUES ('insurance_commission', ?, ?, 0.00, ?, ?, NOW())`,
    [payResult.insertId, commissionAmount, commissionAmount, String(currency || sub.currency)]
  );
  await db.execute(
    `UPDATE insurance_subscriptions
     SET next_due_at = DATE_ADD(COALESCE(next_due_at, NOW()), INTERVAL 1 MONTH)
     WHERE id = ?`,
    [Number(subscriptionId)]
  );
  return { ok: true, paymentEventId: payResult.insertId, commissionAmount, commissionPercent: commissionPct };
}

async function linkExistingPolicy(db, payload) {
  const { userId, providerId, externalPolicyNumber, policyHolderName, policyType, nextDueAt } = payload;
  ensure(userId, "Missing userId.");
  ensure(providerId, "Missing providerId.");
  ensure(externalPolicyNumber, "Missing externalPolicyNumber.");
  const [userRows] = await db.execute(
    `SELECT country_code
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [Number(userId)]
  );
  const user = userRows[0];
  if (!user) {
    throw new Error("User not found.");
  }
  await assertJurisdictionAllowed(db, user.country_code);
  const [result] = await db.execute(
    `INSERT INTO insurance_policy_links (
      user_id, provider_id, external_policy_number, policy_holder_name, policy_type, status, next_due_at, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, 'active', ?, NOW())
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      policy_holder_name = VALUES(policy_holder_name),
      policy_type = VALUES(policy_type),
      status = 'active',
      next_due_at = VALUES(next_due_at),
      last_synced_at = NOW()`,
    [
      Number(userId),
      Number(providerId),
      String(externalPolicyNumber).trim(),
      policyHolderName ? String(policyHolderName).trim() : null,
      String(policyType || "other"),
      nextDueAt || null
    ]
  );
  return { ok: true, linked: true, policyLinkId: result.insertId || null };
}

async function updatePolicyLink(db, payload) {
  const { policyLinkId, status, nextDueAt } = payload;
  ensure(policyLinkId, "Missing policyLinkId.");
  await db.execute(
    `UPDATE insurance_policy_links
     SET status = COALESCE(?, status),
         next_due_at = COALESCE(?, next_due_at),
         last_synced_at = NOW()
     WHERE id = ?`,
    [status || null, nextDueAt || null, Number(policyLinkId)]
  );
  return { ok: true, policyLinkId: Number(policyLinkId) };
}

async function queueExistingPolicyDueReminders(db, payload) {
  const daysAhead = Number(payload.daysAhead || 5);
  const [rows] = await db.execute(
    `SELECT l.id, l.user_id, l.external_policy_number, l.next_due_at, p.provider_name
     FROM insurance_policy_links l
     INNER JOIN insurance_providers p ON p.id = l.provider_id
     WHERE l.status = 'active'
       AND l.next_due_at IS NOT NULL
       AND l.next_due_at <= DATE_ADD(NOW(), INTERVAL ? DAY)`,
    [daysAhead]
  );
  let queued = 0;
  for (const row of rows) {
    await db.execute(
      `INSERT INTO notification_events (
        user_id, event_type, title, message, deep_link, delivery_status
      ) VALUES (?, 'insurance_linked_policy_due_reminder', ?, ?, ?, 'queued')`,
      [
        Number(row.user_id),
        "Linked policy due reminder",
        `${row.provider_name} policy ${row.external_policy_number} is due on ${new Date(row.next_due_at).toISOString()}.`,
        `/insurance/policy-links/${row.id}`
      ]
    );
    queued += 1;
  }
  return { ok: true, policyRemindersQueued: queued, daysAhead };
}

async function runInsuranceDailyJob(db, payload) {
  const daysAhead = Number(payload.daysAhead || 5);
  const due = await queueInsuranceDueReminders(db, { daysAhead });
  const linked = await queueExistingPolicyDueReminders(db, { daysAhead });
  return {
    ok: true,
    daysAhead,
    remindersQueued: due.remindersQueued,
    linkedPolicyRemindersQueued: linked.policyRemindersQueued
  };
}

async function publishWellbeingAlert(db, payload) {
  const { countryCode, audience, title, message, infoUrl, severity, startsAt, endsAt } = payload;
  ensure(title, "Missing wellbeing title.");
  ensure(message, "Missing wellbeing message.");
  const [result] = await db.execute(
    `INSERT INTO wellbeing_alerts (
      country_code, audience, title, message, info_url, severity, active, starts_at, ends_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      countryCode ? String(countryCode).trim().toUpperCase() : null,
      String(audience || "all_users"),
      String(title).trim(),
      String(message).trim(),
      infoUrl ? String(infoUrl).trim() : null,
      String(severity || "info"),
      startsAt || null,
      endsAt || null
    ]
  );
  return { ok: true, wellbeingAlertId: result.insertId };
}

async function queueWellbeingNotifications(db, payload) {
  const { userId, countryCode } = payload;
  ensure(userId, "Missing userId.");
  const [rows] = await db.execute(
    `SELECT id, title, message
     FROM wellbeing_alerts
     WHERE active = 1
       AND (country_code IS NULL OR country_code = ?)
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
     ORDER BY severity DESC, created_at DESC
     LIMIT 5`,
    [countryCode ? String(countryCode).trim().toUpperCase() : null]
  );

  let queued = 0;
  for (const alert of rows) {
    await db.execute(
      `INSERT INTO notification_events (
        user_id, event_type, title, message, deep_link, delivery_status
      ) VALUES (?, 'wellbeing_alert', ?, ?, ?, 'queued')`,
      [Number(userId), alert.title, alert.message, `/wellbeing/alerts/${alert.id}`]
    );
    queued += 1;
  }
  return { ok: true, wellbeingNotificationsQueued: queued };
}

module.exports = {
  INSURANCE_GUARDRAILS,
  assertJurisdictionAllowed,
  listInsuranceJurisdictions,
  upsertInsuranceJurisdiction,
  disableInsuranceJurisdiction,
  listPublicInsurancePlans,
  createInsuranceProvider,
  createInsurancePlan,
  subscribeUserToInsurance,
  recordInsurancePayment,
  linkExistingPolicy,
  updatePolicyLink,
  queueExistingPolicyDueReminders,
  runInsuranceDailyJob,
  queueInsuranceDueReminders,
  publishWellbeingAlert,
  queueWellbeingNotifications
};
