"use strict";

const PRICE_GUARDRAILS = Object.freeze({
  maxOrderTakeRatePercent: 10,
  maxBookingCommissionPercent: 12,
  maxProtectionFeePercent: 3,
  maxConvenienceFeeFlat: 2.5,
  maxStarterPlanPriceEur: 15,
  maxBoost3DayPriceEur: 15,
  maxAffiliateCommissionPercent: 20,
  maxLogisticsMarginPercent: 25
});

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function guard(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureOwnerPayoutTable(db) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS owner_payouts (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      request_amount DECIMAL(12,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'EUR',
      destination_label VARCHAR(180) NULL,
      notes VARCHAR(255) NULL,
      payout_status ENUM('pending','ready','paid','on_hold') NOT NULL DEFAULT 'pending',
      requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_owner_payouts_status_time (payout_status, requested_at)
    )`
  );
}

function applyPricingGuardrails(payload) {
  const orderTakeRatePercent = Number(payload.orderTakeRatePercent || 0);
  const bookingCommissionPercent = Number(payload.bookingCommissionPercent || 0);
  const protectionFeePercent = Number(payload.protectionFeePercent || 0);
  const convenienceFeeFlat = Number(payload.convenienceFeeFlat || 0);
  const starterPlanPriceEur = Number(payload.starterPlanPriceEur || 0);
  const boost3DayPriceEur = Number(payload.boost3DayPriceEur || 0);

  if (orderTakeRatePercent) {
    guard(orderTakeRatePercent <= PRICE_GUARDRAILS.maxOrderTakeRatePercent, "Order take rate exceeds affordability guardrail.");
  }
  if (bookingCommissionPercent) {
    guard(bookingCommissionPercent <= PRICE_GUARDRAILS.maxBookingCommissionPercent, "Booking commission exceeds affordability guardrail.");
  }
  if (protectionFeePercent) {
    guard(protectionFeePercent <= PRICE_GUARDRAILS.maxProtectionFeePercent, "Protection fee percent exceeds affordability guardrail.");
  }
  if (convenienceFeeFlat) {
    guard(convenienceFeeFlat <= PRICE_GUARDRAILS.maxConvenienceFeeFlat, "Convenience fee exceeds affordability guardrail.");
  }
  if (starterPlanPriceEur) {
    guard(starterPlanPriceEur <= PRICE_GUARDRAILS.maxStarterPlanPriceEur, "Starter plan price exceeds affordability guardrail.");
  }
  if (boost3DayPriceEur) {
    guard(boost3DayPriceEur <= PRICE_GUARDRAILS.maxBoost3DayPriceEur, "Boost price exceeds affordability guardrail.");
  }
}

async function createSubscriptionPlan(db, payload) {
  const { planCode, planName, monthlyPrice, currency, listingLimit, boostCredits, analyticsEnabled, prioritySupport } = payload;
  if (!planCode || !planName || monthlyPrice == null) {
    throw new Error("Missing subscription plan fields.");
  }
  if (String(planCode).trim().toUpperCase().includes("STARTER")) {
    applyPricingGuardrails({ starterPlanPriceEur: Number(monthlyPrice) });
  }
  const [result] = await db.execute(
    `INSERT INTO seller_subscription_plans (
      plan_code, plan_name, monthly_price, currency, listing_limit, boost_credits, analytics_enabled, priority_support, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      String(planCode).trim().toUpperCase(),
      String(planName).trim(),
      toMoney(monthlyPrice),
      String(currency || "EUR").trim().toUpperCase(),
      listingLimit == null ? null : Number(listingLimit),
      Number(boostCredits || 0),
      analyticsEnabled ? 1 : 0,
      prioritySupport ? 1 : 0
    ]
  );
  return { ok: true, planId: result.insertId };
}

async function assignSellerSubscription(db, payload) {
  const { shopId, planId, startAt, endAt, billingCycle } = payload;
  if (!shopId || !planId || !startAt || !endAt) {
    throw new Error("Missing seller subscription fields.");
  }
  const [result] = await db.execute(
    `INSERT INTO seller_subscriptions (shop_id, plan_id, start_at, end_at, status, billing_cycle)
     VALUES (?, ?, ?, ?, 'active', ?)`,
    [Number(shopId), Number(planId), startAt, endAt, String(billingCycle || "monthly")]
  );

  const [planRows] = await db.execute(
    `SELECT monthly_price, currency
     FROM seller_subscription_plans
     WHERE id = ?
     LIMIT 1`,
    [Number(planId)]
  );
  const plan = planRows[0];
  if (plan) {
    await db.execute(
      `INSERT INTO platform_revenue_entries (
        source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
      ) VALUES ('subscription_fee', ?, ?, 0.00, ?, ?, NOW())`,
      [result.insertId, plan.monthly_price, plan.monthly_price, plan.currency]
    );
  }
  return { ok: true, subscriptionId: result.insertId };
}

async function createBoostPackage(db, payload) {
  const { packageCode, packageName, durationDays, placementZone, priceAmount, currency } = payload;
  if (!packageCode || !packageName || !durationDays || !placementZone || priceAmount == null) {
    throw new Error("Missing boost package fields.");
  }
  if (Number(durationDays) <= 3) {
    applyPricingGuardrails({ boost3DayPriceEur: Number(priceAmount) });
  }
  const [result] = await db.execute(
    `INSERT INTO listing_boost_packages (
      package_code, package_name, duration_days, placement_zone, price_amount, currency, active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      String(packageCode).trim().toUpperCase(),
      String(packageName).trim(),
      Number(durationDays),
      String(placementZone).trim(),
      toMoney(priceAmount),
      String(currency || "EUR").trim().toUpperCase()
    ]
  );
  return { ok: true, packageId: result.insertId };
}

async function purchaseBoost(db, payload) {
  const { shopId, packageId, targetType, targetId, startsAt } = payload;
  if (!shopId || !packageId || !targetType || !targetId || !startsAt) {
    throw new Error("Missing boost purchase fields.");
  }

  const [pkgRows] = await db.execute(
    `SELECT duration_days, price_amount, currency
     FROM listing_boost_packages
     WHERE id = ? AND active = 1
     LIMIT 1`,
    [Number(packageId)]
  );
  const pkg = pkgRows[0];
  if (!pkg) {
    throw new Error("Boost package not found.");
  }

  const [result] = await db.execute(
    `INSERT INTO listing_boost_purchases (
      shop_id, package_id, target_type, target_id, starts_at, ends_at, status, amount_paid, currency
    ) VALUES (?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), 'scheduled', ?, ?)`,
    [Number(shopId), Number(packageId), String(targetType), Number(targetId), startsAt, startsAt, Number(pkg.duration_days), pkg.price_amount, pkg.currency]
  );

  await db.execute(
    `INSERT INTO platform_revenue_entries (
      source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
    ) VALUES ('boost_fee', ?, ?, 0.00, ?, ?, NOW())`,
    [result.insertId, pkg.price_amount, pkg.price_amount, pkg.currency]
  );

  return { ok: true, boostPurchaseId: result.insertId };
}

async function applyOrderMonetizationCharges(db, payload) {
  const { orderId, protectionFee, convenienceFee, escrowPriorityFee, logisticsMarginFee, currency } = payload;
  if (!orderId) {
    throw new Error("Missing orderId.");
  }
  const protection = toMoney(protectionFee);
  const convenience = toMoney(convenienceFee);
  const escrow = toMoney(escrowPriorityFee);
  const logistics = toMoney(logisticsMarginFee);
  const totalFee = toMoney(protection + convenience + escrow + logistics);
  applyPricingGuardrails({
    protectionFeePercent: Number(payload.protectionFeePercent || 0),
    convenienceFeeFlat: convenience
  });

  const [orderRows] = await db.execute(
    `SELECT id, shipping_fee, total_amount, currency
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [Number(orderId)]
  );
  const order = orderRows[0];
  if (!order) {
    throw new Error("Order not found.");
  }

  await db.execute(
    `INSERT INTO order_monetization_charges (
      order_id, protection_fee, convenience_fee, escrow_priority_fee, logistics_margin_fee, currency
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [Number(orderId), protection, convenience, escrow, logistics, String(currency || order.currency)]
  );

  await db.execute(
    `UPDATE orders
     SET shipping_fee = shipping_fee + ?, total_amount = total_amount + ?
     WHERE id = ?`,
    [totalFee, totalFee, Number(orderId)]
  );

  await db.execute(
    `INSERT INTO platform_revenue_entries (
      source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
    ) VALUES ('order_fee', ?, ?, 0.00, ?, ?, NOW())`,
    [Number(orderId), totalFee, totalFee, String(currency || order.currency)]
  );

  return { ok: true, orderId: Number(orderId), addedFeesTotal: totalFee };
}

async function createLogisticsRateCard(db, payload) {
  const { fromCountry, toCountry, shippingMethod, providerCost, platformPrice, currency } = payload;
  if (!fromCountry || !toCountry || !shippingMethod || providerCost == null || platformPrice == null) {
    throw new Error("Missing logistics rate fields.");
  }
  const provider = Number(providerCost);
  const platform = Number(platformPrice);
  const marginPct = provider > 0 ? ((platform - provider) / provider) * 100 : 0;
  guard(marginPct <= PRICE_GUARDRAILS.maxLogisticsMarginPercent, "Logistics margin exceeds affordability guardrail.");
  const [result] = await db.execute(
    `INSERT INTO logistics_rate_cards (
      from_country, to_country, shipping_method, provider_cost, platform_price, currency, active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      String(fromCountry).trim().toUpperCase(),
      String(toCountry).trim().toUpperCase(),
      String(shippingMethod).trim(),
      toMoney(providerCost),
      toMoney(platformPrice),
      String(currency || "EUR").trim().toUpperCase()
    ]
  );
  return { ok: true, logisticsRateCardId: result.insertId };
}

async function createAffiliatePartner(db, payload) {
  const { partnerName, partnerType, contactEmail, defaultCommissionPercent } = payload;
  if (!partnerName || !contactEmail) {
    throw new Error("Missing affiliate partner fields.");
  }
  guard(
    Number(defaultCommissionPercent || 0) <= PRICE_GUARDRAILS.maxAffiliateCommissionPercent,
    "Affiliate commission exceeds guardrail."
  );
  const [result] = await db.execute(
    `INSERT INTO affiliate_partners (partner_name, partner_type, contact_email, default_commission_percent, active)
     VALUES (?, ?, ?, ?, 1)`,
    [String(partnerName).trim(), String(partnerType || "other"), String(contactEmail).trim().toLowerCase(), Number(defaultCommissionPercent || 0)]
  );
  return { ok: true, affiliatePartnerId: result.insertId };
}

async function recordAffiliateReferral(db, payload) {
  const { partnerId, referredUserId, referenceCode, conversionType, conversionValue, commissionAmount, currency } = payload;
  if (!partnerId || !referenceCode) {
    throw new Error("Missing affiliate referral fields.");
  }
  const [result] = await db.execute(
    `INSERT INTO affiliate_referrals (
      partner_id, referred_user_id, reference_code, conversion_type, conversion_value, commission_amount, currency, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
    [
      Number(partnerId),
      referredUserId ? Number(referredUserId) : null,
      String(referenceCode).trim(),
      String(conversionType || "signup"),
      toMoney(conversionValue),
      toMoney(commissionAmount),
      String(currency || "EUR").trim().toUpperCase()
    ]
  );

  await db.execute(
    `INSERT INTO platform_revenue_entries (
      source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
    ) VALUES ('affiliate_commission', ?, ?, 0.00, ?, ?, NOW())`,
    [result.insertId, toMoney(commissionAmount), toMoney(commissionAmount), String(currency || "EUR").trim().toUpperCase()]
  );

  return { ok: true, affiliateReferralId: result.insertId };
}

async function getOwnerRevenueDashboard(db, payload = {}) {
  await ensureOwnerPayoutTable(db);
  const reservePercentInput = Number(payload.reservePercent ?? 10);
  const reservePercent = Number.isFinite(reservePercentInput)
    ? Math.min(50, Math.max(0, reservePercentInput))
    : 10;

  const [totalsRows] = await db.execute(
    `SELECT
       COALESCE(SUM(gross_amount), 0) AS gross_total,
       COALESCE(SUM(tax_withheld_amount), 0) AS tax_withheld_total,
       COALESCE(SUM(net_amount), 0) AS net_total
     FROM platform_revenue_entries`
  );
  const totals = totalsRows[0] || {};
  const grossTotal = toMoney(totals.gross_total);
  const taxWithheldTotal = toMoney(totals.tax_withheld_total);
  const netTotal = toMoney(totals.net_total);

  const [sourceRows] = await db.execute(
    `SELECT source_type, currency,
            COALESCE(SUM(gross_amount), 0) AS gross_total,
            COALESCE(SUM(tax_withheld_amount), 0) AS tax_withheld_total,
            COALESCE(SUM(net_amount), 0) AS net_total
     FROM platform_revenue_entries
     GROUP BY source_type, currency
     ORDER BY net_total DESC`
  );

  const [taxRows] = await db.execute(
    `SELECT liable_party,
            COALESCE(SUM(taxable_amount), 0) AS taxable_total,
            COALESCE(SUM(tax_amount), 0) AS tax_total
     FROM tax_ledger_entries
     GROUP BY liable_party`
  );
  const taxByParty = { seller: { taxable: 0, tax: 0 }, platform: { taxable: 0, tax: 0 }, buyer: { taxable: 0, tax: 0 } };
  taxRows.forEach((row) => {
    const party = String(row.liable_party || "").toLowerCase();
    if (!taxByParty[party]) {
      return;
    }
    taxByParty[party] = {
      taxable: toMoney(row.taxable_total),
      tax: toMoney(row.tax_total)
    };
  });

  const reserveAmount = toMoney((netTotal * reservePercent) / 100);
  const [payoutTotalsRows] = await db.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN payout_status IN ('pending','ready') THEN request_amount ELSE 0 END), 0) AS unsettled_total,
       COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN request_amount ELSE 0 END), 0) AS paid_total
     FROM owner_payouts`
  );
  const payoutTotals = payoutTotalsRows[0] || {};
  const unsettledPayoutTotal = toMoney(payoutTotals.unsettled_total);
  const paidOutTotal = toMoney(payoutTotals.paid_total);
  const ownerPayoutReady = toMoney(Math.max(0, netTotal - reserveAmount - unsettledPayoutTotal));

  const [recentPayoutRows] = await db.execute(
    `SELECT id, request_amount, currency, destination_label, notes, payout_status, requested_at, paid_at
     FROM owner_payouts
     ORDER BY requested_at DESC
     LIMIT 20`
  );

  return {
    ok: true,
    policy: {
      sellerHandlesTaxes: true,
      ownerReceivesNetAfterPlatformWithholding: true
    },
    reservePercent,
    totals: {
      grossTotal,
      taxWithheldTotal,
      netTotal,
      reserveAmount,
      ownerPayoutReady,
      unsettledPayoutTotal,
      paidOutTotal
    },
    taxByParty,
    bySource: sourceRows.map((row) => ({
      sourceType: row.source_type,
      currency: row.currency,
      grossTotal: toMoney(row.gross_total),
      taxWithheldTotal: toMoney(row.tax_withheld_total),
      netTotal: toMoney(row.net_total)
    })),
    payouts: recentPayoutRows.map((row) => ({
      payoutId: row.id,
      requestAmount: toMoney(row.request_amount),
      currency: row.currency,
      destinationLabel: row.destination_label || "",
      notes: row.notes || "",
      payoutStatus: row.payout_status,
      requestedAt: row.requested_at,
      paidAt: row.paid_at
    })),
    notes: [
      "Seller tax obligations remain with sellers according to their jurisdiction.",
      "Owner payout-ready amount uses platform net revenue minus reserve holdback."
    ]
  };
}

async function requestOwnerPayout(db, payload = {}) {
  await ensureOwnerPayoutTable(db);
  const amount = toMoney(payload.amount);
  const currency = String(payload.currency || "EUR").trim().toUpperCase() || "EUR";
  const destinationLabel = String(payload.destinationLabel || "").trim();
  const notes = String(payload.notes || "").trim();
  const reservePercentInput = Number(payload.reservePercent ?? 10);
  const reservePercent = Number.isFinite(reservePercentInput)
    ? Math.min(50, Math.max(0, reservePercentInput))
    : 10;
  guard(amount > 0, "Payout amount must be greater than zero.");

  const dashboard = await getOwnerRevenueDashboard(db, { reservePercent });
  guard(amount <= Number(dashboard.totals.ownerPayoutReady || 0), "Payout amount exceeds owner payout-ready balance.");

  const [result] = await db.execute(
    `INSERT INTO owner_payouts (request_amount, currency, destination_label, notes, payout_status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [amount, currency, destinationLabel || null, notes || null]
  );
  return { ok: true, payoutId: result.insertId, payoutStatus: "pending" };
}

async function updateOwnerPayoutStatus(db, payload = {}) {
  await ensureOwnerPayoutTable(db);
  const payoutId = Number(payload.payoutId || 0);
  const payoutStatus = String(payload.payoutStatus || "").trim().toLowerCase();
  const allowed = new Set(["pending", "ready", "paid", "on_hold"]);
  guard(payoutId > 0, "Valid payoutId is required.");
  guard(allowed.has(payoutStatus), "Invalid payout status.");

  if (payoutStatus === "paid") {
    await db.execute(
      `UPDATE owner_payouts
       SET payout_status = ?, paid_at = NOW()
       WHERE id = ?`,
      [payoutStatus, payoutId]
    );
  } else {
    await db.execute(
      `UPDATE owner_payouts
       SET payout_status = ?, paid_at = NULL
       WHERE id = ?`,
      [payoutStatus, payoutId]
    );
  }
  return { ok: true, payoutId, payoutStatus };
}

module.exports = {
  PRICE_GUARDRAILS,
  applyPricingGuardrails,
  createSubscriptionPlan,
  assignSellerSubscription,
  createBoostPackage,
  purchaseBoost,
  applyOrderMonetizationCharges,
  createLogisticsRateCard,
  createAffiliatePartner,
  recordAffiliateReferral,
  getOwnerRevenueDashboard,
  requestOwnerPayout,
  updateOwnerPayoutStatus
};
