"use strict";

/**
 * Bakery / My Business booking status transitions (provider-driven).
 * @param {string} from
 * @param {string} to
 * @returns {{ ok: boolean, noop?: boolean }}
 */
function isAllowedBookingStatusTransition(from, to) {
  const f = String(from || "").toLowerCase();
  const t = String(to || "").toLowerCase();
  if (f === t) {
    return { ok: true, noop: true };
  }
  if (f === "pending" && (t === "confirmed" || t === "declined")) {
    return { ok: true };
  }
  if (f === "confirmed" && t === "completed") {
    return { ok: true };
  }
  return { ok: false };
}

module.exports = { isAllowedBookingStatusTransition };
