"use strict";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function overlapScore(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) {
    return 0;
  }
  let common = 0;
  setA.forEach((w) => {
    if (setB.has(w)) {
      common += 1;
    }
  });
  return common / Math.max(setA.size, setB.size);
}

async function hasAcceptedBarterTerms(pool, userId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM barter_terms_acceptance
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return Boolean(rows[0]);
}

async function acceptBarterTerms(pool, input) {
  const userId = toNum(input.userId);
  const termsVersion = String(input.termsVersion || "v1").trim();
  if (!userId || !termsVersion) {
    return { ok: false, code: "INVALID_TERMS_ACCEPTANCE_INPUT" };
  }
  await pool.execute(
    `INSERT INTO barter_terms_acceptance (
      user_id, terms_version, accepted, acceptance_text
    ) VALUES (?, ?, 1, ?)`,
    [
      userId,
      termsVersion,
      "User accepted barter rules: no off-platform bypass, escrow and logistics required."
    ]
  );
  return { ok: true };
}

async function upsertBarterProfile(pool, input) {
  const userId = toNum(input.userId);
  const offersText = String(input.offersText || "").trim();
  const needsText = String(input.needsText || "").trim();
  const countryCode = String(input.countryCode || "").trim().toUpperCase();
  const categoryFocus = String(input.categoryFocus || "").trim().toLowerCase();
  if (!userId || !offersText || !needsText || !countryCode) {
    return { ok: false, code: "INVALID_BARTER_PROFILE_INPUT" };
  }
  if (!(await hasAcceptedBarterTerms(pool, userId))) {
    return { ok: false, code: "BARTER_TERMS_NOT_ACCEPTED" };
  }
  await pool.execute(
    `INSERT INTO barter_profiles (
      user_id, offers_text, needs_text, country_code, category_focus, active
    ) VALUES (?, ?, ?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      offers_text = VALUES(offers_text),
      needs_text = VALUES(needs_text),
      country_code = VALUES(country_code),
      category_focus = VALUES(category_focus),
      active = 1,
      updated_at = NOW()`,
    [userId, offersText, needsText, countryCode, categoryFocus || null]
  );
  return { ok: true };
}

async function createBarterOffer(pool, input) {
  const userId = toNum(input.userId);
  const offerTitle = String(input.offerTitle || "").trim();
  const offerDescription = String(input.offerDescription || "").trim();
  const wantDescription = String(input.wantDescription || "").trim();
  const originCountry = String(input.originCountry || "").trim().toUpperCase();
  const targetCountry = String(input.targetCountry || "").trim().toUpperCase();
  const category = String(input.category || "").trim().toLowerCase();
  if (!userId || !offerTitle || !offerDescription || !wantDescription || !originCountry) {
    return { ok: false, code: "INVALID_BARTER_OFFER_INPUT" };
  }
  if (!(await hasAcceptedBarterTerms(pool, userId))) {
    return { ok: false, code: "BARTER_TERMS_NOT_ACCEPTED" };
  }
  const [insert] = await pool.execute(
    `INSERT INTO barter_offers (
      user_id, offer_title, offer_description, want_description, origin_country, target_country, category, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
    [userId, offerTitle, offerDescription, wantDescription, originCountry, targetCountry || null, category || null]
  );
  return { ok: true, offerId: insert.insertId };
}

async function buildBarterMatches(pool, input) {
  const offerId = toNum(input.offerId);
  if (!offerId) {
    return { ok: false, code: "OFFER_ID_REQUIRED" };
  }
  const [sourceRows] = await pool.execute(
    `SELECT id, user_id, offer_description, want_description, origin_country, target_country, category
     FROM barter_offers
     WHERE id = ? AND status = 'open'
     LIMIT 1`,
    [offerId]
  );
  const source = sourceRows[0];
  if (!source) {
    return { ok: false, code: "OFFER_NOT_FOUND" };
  }

  const [candidateRows] = await pool.execute(
    `SELECT id, user_id, offer_title, offer_description, want_description, origin_country, target_country, category
     FROM barter_offers
     WHERE status = 'open'
       AND id <> ?
       AND user_id <> ?
     ORDER BY created_at DESC
     LIMIT 250`,
    [offerId, source.user_id]
  );

  const matches = candidateRows.map((row) => {
    const sourceNeedsVsCandidateOffer = overlapScore(source.want_description, row.offer_description);
    const sourceOfferVsCandidateNeeds = overlapScore(source.offer_description, row.want_description);
    const mutual = (sourceNeedsVsCandidateOffer + sourceOfferVsCandidateNeeds) / 2;
    const routeBonus =
      source.origin_country && row.origin_country && source.origin_country !== row.origin_country ? 0.12 : 0.04;
    const categoryBonus =
      source.category && row.category && String(source.category) === String(row.category) ? 0.08 : 0;
    const score = clamp(Math.round((mutual + routeBonus + categoryBonus) * 100), 0, 100);
    return {
      offerId: row.id,
      userId: row.user_id,
      score,
      reason: `mutual_need=${Math.round(mutual * 100)} route_bonus=${Math.round(routeBonus * 100)}`
    };
  }).filter((x) => x.score >= 35).sort((a, b) => b.score - a.score).slice(0, 25);

  await pool.execute(`DELETE FROM barter_match_candidates WHERE source_offer_id = ?`, [offerId]);
  for (const m of matches) {
    await pool.execute(
      `INSERT INTO barter_match_candidates (
        source_offer_id, candidate_offer_id, match_score, match_reason, review_status
      ) VALUES (?, ?, ?, ?, 'pending_owner_review')`,
      [offerId, m.offerId, m.score, m.reason]
    );
  }
  return { ok: true, count: matches.length };
}

async function listPublicBarterMatches(pool, input) {
  const offerId = toNum(input.offerId);
  if (!offerId) {
    return { ok: false, code: "OFFER_ID_REQUIRED" };
  }
  const [rows] = await pool.execute(
    `SELECT
       c.id AS match_id,
       c.match_score,
       c.review_status,
       o.id AS candidate_offer_id,
       o.offer_title,
       o.offer_description,
       o.want_description,
       o.origin_country,
       o.target_country,
       o.category
     FROM barter_match_candidates c
     JOIN barter_offers o ON o.id = c.candidate_offer_id
     WHERE c.source_offer_id = ?
       AND c.review_status IN ('pending_owner_review','owner_approved')
     ORDER BY c.match_score DESC
     LIMIT 25`,
    [offerId]
  );
  return { ok: true, items: rows };
}

async function reportBarterBypassAttempt(pool, input) {
  const userId = toNum(input.userId);
  const conversationSnippet = String(input.conversationSnippet || "").trim().slice(0, 255);
  if (!userId) {
    return { ok: false, code: "USER_ID_REQUIRED" };
  }
  const riskyHints = ["whatsapp", "telegram", "pay direct", "cashapp", "outside app", "off platform", "bank transfer"];
  const lower = conversationSnippet.toLowerCase();
  const matched = riskyHints.filter((hint) => lower.includes(hint));
  const riskLevel = matched.length >= 2 ? "high" : matched.length === 1 ? "medium" : "low";
  await pool.execute(
    `INSERT INTO barter_bypass_events (
      user_id, conversation_snippet, detected_rules, risk_level
    ) VALUES (?, ?, ?, ?)`,
    [userId, conversationSnippet || null, matched.join(","), riskLevel]
  );
  return { ok: true, riskLevel, matched };
}

async function listOwnerBarterMatchReviews(pool, input) {
  const status = String(input.status || "").trim().toLowerCase();
  const limit = clamp(toNum(input.limit, 50), 1, 200);
  let sql = `SELECT
      c.id AS match_id,
      c.source_offer_id,
      c.candidate_offer_id,
      c.match_score,
      c.match_reason,
      c.review_status,
      c.owner_notes,
      c.created_at
    FROM barter_match_candidates c`;
  const params = [];
  if (status) {
    sql += " WHERE c.review_status = ?";
    params.push(status);
  }
  sql += " ORDER BY c.created_at DESC LIMIT ?";
  params.push(limit);
  const [rows] = await pool.execute(sql, params);
  return { ok: true, items: rows };
}

async function decideBarterMatch(pool, input) {
  const matchId = toNum(input.matchId);
  const decision = String(input.decision || "").trim().toLowerCase();
  const ownerNotes = String(input.ownerNotes || "").trim().slice(0, 255);
  const allowed = new Set(["owner_approved", "owner_rejected", "manual_hold"]);
  if (!matchId || !allowed.has(decision)) {
    return { ok: false, code: "INVALID_MATCH_DECISION" };
  }
  await pool.execute(
    `UPDATE barter_match_candidates
     SET review_status = ?, owner_notes = ?
     WHERE id = ?`,
    [decision, ownerNotes || null, matchId]
  );
  return { ok: true };
}

async function suspendBarterAccount(pool, input) {
  const userId = toNum(input.userId);
  const reason = String(input.reason || "").trim().slice(0, 255);
  const days = clamp(toNum(input.days, 7), 1, 365);
  if (!userId || !reason) {
    return { ok: false, code: "INVALID_SUSPENSION_INPUT" };
  }
  await pool.execute(
    `INSERT INTO barter_account_enforcement (
      user_id, action_type, reason_text, active, expires_at
    ) VALUES (?, 'suspend', ?, 1, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [userId, reason, days]
  );
  await pool.execute(
    `UPDATE barter_profiles
     SET active = 0
     WHERE user_id = ?`,
    [userId]
  );
  await pool.execute(
    `UPDATE barter_offers
     SET status = 'suspended'
     WHERE user_id = ?
       AND status IN ('open','matched')`,
    [userId]
  );
  return { ok: true };
}

module.exports = {
  acceptBarterTerms,
  upsertBarterProfile,
  createBarterOffer,
  buildBarterMatches,
  listPublicBarterMatches,
  reportBarterBypassAttempt,
  listOwnerBarterMatchReviews,
  decideBarterMatch,
  suspendBarterAccount
};
