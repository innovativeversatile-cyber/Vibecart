"use strict";

/**
 * Backend-ready guard functions.
 * Integrate into checkout and shipment creation endpoints.
 */

async function getApprovedPaymentProvider(db, { providerCode, buyerCountry, sellerCountry, currency }) {
  const [rows] = await db.execute(
    `SELECT p.id, p.provider_code
     FROM approved_payment_providers p
     JOIN approved_payment_provider_routes r ON r.provider_id = p.id
     WHERE p.provider_code = ?
       AND p.active = 1
       AND p.pci_dss_compliant = 1
       AND p.supports_3ds = 1
       AND p.supports_tokenization = 1
       AND p.risk_scoring_enabled = 1
       AND r.active = 1
       AND r.buyer_country = ?
       AND r.seller_country = ?
       AND r.currency = ?
     LIMIT 1`,
    [providerCode, buyerCountry, sellerCountry, currency]
  );
  return rows[0] || null;
}

async function getApprovedDeliveryPartner(db, { partnerCode, fromCountry, toCountry, shippingMethod }) {
  const [rows] = await db.execute(
    `SELECT d.id, d.partner_code
     FROM approved_delivery_partners d
     JOIN approved_delivery_partner_routes r ON r.partner_id = d.id
     WHERE d.partner_code = ?
       AND d.active = 1
       AND d.tracking_enabled = 1
       AND d.proof_of_delivery_enabled = 1
       AND d.security_screening_enabled = 1
       AND d.reliability_score >= 90.00
       AND r.active = 1
       AND r.from_country = ?
       AND r.to_country = ?
       AND r.shipping_method = ?
     LIMIT 1`,
    [partnerCode, fromCountry, toCountry, shippingMethod]
  );
  return rows[0] || null;
}

async function enforceSecurePayment(db, payload) {
  const approved = await getApprovedPaymentProvider(db, payload);
  if (!approved) {
    throw new Error("Blocked: payment provider not approved for this route/currency/security policy.");
  }
  return approved;
}

async function enforceSecureDelivery(db, payload) {
  const approved = await getApprovedDeliveryPartner(db, payload);
  if (!approved) {
    throw new Error("Blocked: delivery partner not approved for this route/security policy.");
  }
  return approved;
}

module.exports = {
  enforceSecurePayment,
  enforceSecureDelivery
};
