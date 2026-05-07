"use strict";

/**
 * Buyer-facing catalog must not surface npm/db seed merchants (@vibecart.local),
 * demo-prefixed shop slugs, or the Railway seed catalog shop slug.
 * Use with queries that already alias the shop row as `s`.
 */
const SQL_JOIN_REAL_MARKETPLACE_OWNER = `JOIN users vc_shop_owner ON vc_shop_owner.id = s.owner_user_id`;

const SQL_AND_REAL_MARKETPLACE_ONLY = ` AND LOWER(vc_shop_owner.email) NOT LIKE '%@vibecart.local'
  AND IFNULL(TRIM(s.slug), '') NOT LIKE 'demo-%'
  AND IFNULL(TRIM(s.slug), '') <> 'vibecart-seed-shop'`;

function isDemoOrSeedMarketplaceListing(ownerEmail, shopSlug) {
  const em = String(ownerEmail || "").trim().toLowerCase();
  const sl = String(shopSlug || "").trim().toLowerCase();
  if (em.endsWith("@vibecart.local")) return true;
  if (sl.startsWith("demo-") || sl === "vibecart-seed-shop") return true;
  return false;
}

module.exports = {
  SQL_JOIN_REAL_MARKETPLACE_OWNER,
  SQL_AND_REAL_MARKETPLACE_ONLY,
  isDemoOrSeedMarketplaceListing
};
