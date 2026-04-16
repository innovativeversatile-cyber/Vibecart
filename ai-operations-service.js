"use strict";

function toNum(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function createCrowdfundingCampaign(pool, input) {
  const title = String(input.title || "").trim();
  const description = String(input.description || "").trim();
  const targetAmount = toNum(input.targetAmount, 0);
  const currency = String(input.currency || "EUR").trim().toUpperCase();
  const countryCode = String(input.countryCode || "").trim().toUpperCase();
  const fundingType = String(input.fundingType || "goods_inventory").trim().toLowerCase();
  if (!title || !description || !targetAmount || !countryCode) {
    return { ok: false, code: "INVALID_CROWDFUNDING_INPUT" };
  }
  const [insert] = await pool.execute(
    `INSERT INTO crowdfunding_campaigns (
      title, description, target_amount, currency, country_code, funding_type, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
    [title, description, targetAmount, currency, countryCode, fundingType]
  );
  return { ok: true, campaignId: insert.insertId };
}

async function listCrowdfundingCampaigns(pool, input) {
  const status = String(input.status || "").trim().toLowerCase();
  const params = [];
  let sql = `SELECT id, title, target_amount, raised_amount, currency, country_code, funding_type, status, created_at
             FROM crowdfunding_campaigns`;
  if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC LIMIT 100";
  const [rows] = await pool.execute(sql, params);
  return { ok: true, items: rows };
}

async function ownerDecideCrowdfunding(pool, input) {
  const campaignId = toNum(input.campaignId, 0);
  const decision = String(input.decision || "").trim().toLowerCase();
  const ownerNotes = String(input.ownerNotes || "").trim().slice(0, 255);
  const allowed = new Set(["approved", "rejected", "manual_hold"]);
  if (!campaignId || !allowed.has(decision)) {
    return { ok: false, code: "INVALID_CROWDFUNDING_DECISION" };
  }
  await pool.execute(
    `UPDATE crowdfunding_campaigns
     SET status = ?, owner_notes = ?
     WHERE id = ?`,
    [decision, ownerNotes || null, campaignId]
  );
  return { ok: true };
}

async function recordCrowdfundingPledge(pool, input) {
  const campaignId = toNum(input.campaignId, 0);
  const userId = toNum(input.userId, 0);
  const amount = toNum(input.amount, 0);
  if (!campaignId || !userId || !amount) {
    return { ok: false, code: "INVALID_PLEDGE_INPUT" };
  }
  await pool.execute(
    `INSERT INTO crowdfunding_pledges (
      campaign_id, user_id, amount, currency, pledge_status
    )
    SELECT id, ?, ?, currency, 'committed'
    FROM crowdfunding_campaigns
    WHERE id = ?`,
    [userId, amount, campaignId]
  );
  await pool.execute(
    `UPDATE crowdfunding_campaigns
     SET raised_amount = raised_amount + ?
     WHERE id = ?`,
    [amount, campaignId]
  );
  return { ok: true };
}

async function runCulturalArbitrageScout(pool, input) {
  const sourceCountry = String(input.sourceCountry || "").trim().toUpperCase();
  const targetCountry = String(input.targetCountry || "").trim().toUpperCase();
  const category = String(input.category || "").trim().toLowerCase();

  const [rows] = await pool.execute(
    `SELECT
       p.id,
       p.title,
       p.base_price,
       p.currency,
       p.origin_country,
       c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.status = 'active'
     ORDER BY p.created_at DESC
     LIMIT 100`
  );

  const items = rows
    .filter((row) => !category || String(row.category_name || "").toLowerCase() === category)
    .map((row) => {
      const routeBonus = sourceCountry && targetCountry && sourceCountry !== targetCountry ? 12 : 5;
      const noveltyBonus = String(row.origin_country || "").toUpperCase() === sourceCountry ? 8 : 4;
      const priceSignal = Math.max(0, 25 - Math.round(toNum(row.base_price, 0) / 20));
      const opportunityScore = clamp(routeBonus + noveltyBonus + priceSignal + 40, 0, 100);
      return {
        productId: row.id,
        title: row.title,
        category: row.category_name,
        route: `${sourceCountry || row.origin_country}->${targetCountry || "GLOBAL"}`,
        opportunityScore
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 12);

  return { ok: true, items };
}

async function listAiOperationsQueue(pool) {
  const [rows] = await pool.execute(
    `SELECT id, operation_type, summary_text, recommendation_text, risk_level, execution_mode, status, created_at
     FROM ai_operations_queue
     ORDER BY created_at DESC
     LIMIT 100`
  );
  return { ok: true, items: rows };
}

async function createAiOperation(pool, input) {
  const operationType = String(input.operationType || "").trim().toLowerCase();
  const summaryText = String(input.summaryText || "").trim();
  const recommendationText = String(input.recommendationText || "").trim();
  const riskLevel = String(input.riskLevel || "medium").trim().toLowerCase();
  const executionMode = String(input.executionMode || "recommend_only").trim().toLowerCase();
  if (!operationType || !summaryText || !recommendationText) {
    return { ok: false, code: "INVALID_AI_OPERATION_INPUT" };
  }
  await pool.execute(
    `INSERT INTO ai_operations_queue (
      operation_type, summary_text, recommendation_text, risk_level, execution_mode, status
    ) VALUES (?, ?, ?, ?, ?, 'pending_owner_review')`,
    [operationType, summaryText, recommendationText, riskLevel, executionMode]
  );
  return { ok: true };
}

async function decideAiOperation(pool, input) {
  const operationId = toNum(input.operationId, 0);
  const decision = String(input.decision || "").trim().toLowerCase();
  const ownerNotes = String(input.ownerNotes || "").trim().slice(0, 255);
  const allowed = new Set(["approved", "rejected", "manual_hold", "executed"]);
  if (!operationId || !allowed.has(decision)) {
    return { ok: false, code: "INVALID_AI_OPERATION_DECISION" };
  }
  await pool.execute(
    `UPDATE ai_operations_queue
     SET status = ?, owner_notes = ?
     WHERE id = ?`,
    [decision, ownerNotes || null, operationId]
  );
  return { ok: true };
}

async function generateAiOpsRecommendations(pool) {
  const [sellerRows] = await pool.execute(`SELECT COUNT(*) AS active_sellers FROM shops WHERE active = 1`);
  const [productRows] = await pool.execute(`SELECT COUNT(*) AS active_products FROM products WHERE status = 'active'`);
  const [trustRows] = await pool.execute(`SELECT AVG(trust_score) AS avg_trust FROM trust_profiles`);
  const activeSellers = toNum(sellerRows[0]?.active_sellers, 0);
  const activeProducts = toNum(productRows[0]?.active_products, 0);
  const avgTrust = toNum(trustRows[0]?.avg_trust, 60);

  const items = [
    {
      operationType: "marketing",
      summaryText: "AI marketing recommendation for seller acquisition",
      recommendationText: activeSellers < 10
        ? "Prioritize seller acquisition in 1-2 launch corridors before expanding buyer campaigns."
        : "Shift marketing toward buyer conversion and high-trust categories.",
      riskLevel: "medium",
      executionMode: "recommend_only"
    },
    {
      operationType: "security",
      summaryText: "AI security monitoring recommendation",
      recommendationText: avgTrust < 70
        ? "Increase manual review thresholds and refresh trust-score audit rules."
        : "Maintain current trust controls and monitor anomalies only.",
      riskLevel: "high",
      executionMode: "owner_approval_required"
    },
    {
      operationType: "inventory",
      summaryText: "AI inventory and discovery recommendation",
      recommendationText: activeProducts < 25
        ? "Seed more inventory in top searched categories before broad discovery spend."
        : "Use discovery ranking experiments to improve cross-border conversion.",
      riskLevel: "medium",
      executionMode: "recommend_only"
    }
  ];

  return { ok: true, items };
}

module.exports = {
  createCrowdfundingCampaign,
  listCrowdfundingCampaigns,
  ownerDecideCrowdfunding,
  recordCrowdfundingPledge,
  runCulturalArbitrageScout,
  listAiOperationsQueue,
  createAiOperation,
  decideAiOperation,
  generateAiOpsRecommendations
};
