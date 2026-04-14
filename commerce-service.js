"use strict";

async function resolveTaxRate(dbOrConn, countryCode, appliesTo) {
  const [rows] = await dbOrConn.execute(
    `SELECT id, tax_type, rate_percent
     FROM tax_rules
     WHERE country_code = ? AND applies_to = ? AND active = 1
     ORDER BY state_region IS NULL DESC, id DESC
     LIMIT 1`,
    [countryCode, appliesTo]
  );
  return rows[0] || null;
}

async function createServiceProvider(db, payload) {
  const { userId, businessName, serviceType, countryCode, city, baseCurrency } = payload;
  if (!userId || !businessName || !serviceType || !countryCode) {
    throw new Error("Missing service provider fields.");
  }
  const [result] = await db.execute(
    `INSERT INTO service_providers (user_id, business_name, service_type, country_code, city, base_currency, active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [userId, businessName, serviceType, countryCode, city || null, baseCurrency || "EUR"]
  );
  return { ok: true, providerId: result.insertId };
}

async function createServiceOffering(db, payload) {
  const { providerId, serviceName, durationMinutes, priceAmount, currency } = payload;
  if (!providerId || !serviceName || !durationMinutes || !priceAmount) {
    throw new Error("Missing service offering fields.");
  }
  const [result] = await db.execute(
    `INSERT INTO service_offerings (provider_id, service_name, duration_minutes, price_amount, currency, active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [providerId, serviceName, durationMinutes, priceAmount, currency || "EUR"]
  );
  return { ok: true, serviceOfferingId: result.insertId };
}

async function bulkCreateAvailabilitySlots(db, payload) {
  const { providerId, slots } = payload;
  if (!providerId || !Array.isArray(slots) || slots.length === 0) {
    throw new Error("Missing availability slots.");
  }
  let inserted = 0;
  for (const slot of slots) {
    await db.execute(
      `INSERT INTO provider_availability_slots (provider_id, slot_start, slot_end, status)
       VALUES (?, ?, ?, 'available')`,
      [providerId, slot.slotStart, slot.slotEnd]
    );
    inserted += 1;
  }
  return { ok: true, inserted };
}

async function createBookingWithTaxAndPayout(db, payload) {
  const { providerId, clientUserId, serviceOfferingId, slotId, countryCode } = payload;
  if (!providerId || !clientUserId || !serviceOfferingId || !slotId || !countryCode) {
    throw new Error("Missing booking fields.");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [slotRows] = await conn.execute(
      `SELECT id, status
       FROM provider_availability_slots
       WHERE id = ? AND provider_id = ?
       FOR UPDATE`,
      [slotId, providerId]
    );
    const slot = slotRows[0];
    if (!slot || slot.status !== "available") {
      throw new Error("Slot unavailable.");
    }

    const [serviceRows] = await conn.execute(
      `SELECT id, price_amount, currency
       FROM service_offerings
       WHERE id = ? AND provider_id = ? AND active = 1
       LIMIT 1`,
      [serviceOfferingId, providerId]
    );
    const service = serviceRows[0];
    if (!service) {
      throw new Error("Service offering not found.");
    }

    const subtotal = Number(service.price_amount);
    const taxRule = await resolveTaxRate(conn, countryCode, "service_booking");
    const taxPercent = taxRule ? Number(taxRule.rate_percent) : 0;
    const taxAmount = Number((subtotal * taxPercent / 100).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    const [bookingResult] = await conn.execute(
      `INSERT INTO service_bookings (
        provider_id, client_user_id, service_offering_id, slot_id, subtotal_amount, tax_amount, total_amount, currency, booking_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [providerId, clientUserId, serviceOfferingId, slotId, subtotal, taxAmount, total, service.currency]
    );
    const bookingId = bookingResult.insertId;

    await conn.execute(
      `UPDATE provider_availability_slots
       SET status = 'booked'
       WHERE id = ?`,
      [slotId]
    );

    if (taxRule) {
      await conn.execute(
        `INSERT INTO tax_ledger_entries (
          reference_type, reference_id, country_code, tax_type, taxable_amount, tax_amount, currency, remittance_status
        ) VALUES ('booking', ?, ?, ?, ?, ?, ?, 'pending')`,
        [bookingId, countryCode, taxRule.tax_type, subtotal, taxAmount, service.currency]
      );
    }

    const platformFee = Number((subtotal * 0.08).toFixed(2));
    const netPayout = Number((subtotal - platformFee - taxAmount).toFixed(2));
    await conn.execute(
      `INSERT INTO provider_payouts (
        provider_id, source_type, source_id, gross_amount, platform_fee_amount, tax_withheld_amount, net_payout_amount, currency, payout_status
      ) VALUES (?, 'service_booking', ?, ?, ?, ?, ?, ?, 'pending')`,
      [providerId, bookingId, subtotal, platformFee, taxAmount, netPayout, service.currency]
    );

    await conn.execute(
      `INSERT INTO platform_revenue_entries (
        source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
      ) VALUES ('booking_fee', ?, ?, ?, ?, ?, NOW())`,
      [bookingId, platformFee + taxAmount, taxAmount, platformFee, service.currency]
    );

    await conn.commit();
    return { ok: true, bookingId, subtotal, taxAmount, total, netPayout };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function createAdvertiserInvoice(db, payload) {
  const { advertiserId, campaignId, countryCode, subtotalAmount, currency } = payload;
  if (!advertiserId || !campaignId || !countryCode || !subtotalAmount) {
    throw new Error("Missing advertiser invoice fields.");
  }
  const subtotal = Number(subtotalAmount);
  const taxRule = await resolveTaxRate(db, countryCode, "advertising_invoice");
  const taxPercent = taxRule ? Number(taxRule.rate_percent) : 0;
  const taxAmount = Number((subtotal * taxPercent / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));

  const [result] = await db.execute(
    `INSERT INTO advertiser_invoices (
      advertiser_id, campaign_id, subtotal_amount, tax_amount, total_amount, currency, invoice_status, issued_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'issued', NOW())`,
    [advertiserId, campaignId, subtotal, taxAmount, total, currency || "EUR"]
  );
  const invoiceId = result.insertId;

  if (taxRule) {
    await db.execute(
      `INSERT INTO tax_ledger_entries (
        reference_type, reference_id, country_code, tax_type, taxable_amount, tax_amount, currency, remittance_status
      ) VALUES ('ad_invoice', ?, ?, ?, ?, ?, ?, 'pending')`,
      [invoiceId, countryCode, taxRule.tax_type, subtotal, taxAmount, currency || "EUR"]
    );
  }

  return { ok: true, invoiceId, subtotal, taxAmount, total };
}

async function settleAdvertiserInvoice(db, payload) {
  const { invoiceId } = payload;
  if (!invoiceId) {
    throw new Error("Missing invoiceId.");
  }
  const [rows] = await db.execute(
    `SELECT id, subtotal_amount, tax_amount, total_amount, currency
     FROM advertiser_invoices
     WHERE id = ? AND invoice_status = 'issued'
     LIMIT 1`,
    [invoiceId]
  );
  const invoice = rows[0];
  if (!invoice) {
    throw new Error("Invoice not found or not payable.");
  }

  await db.execute(
    `UPDATE advertiser_invoices
     SET invoice_status = 'paid', paid_at = NOW()
     WHERE id = ?`,
    [invoiceId]
  );

  const netAmount = Number(invoice.total_amount) - Number(invoice.tax_amount);
  await db.execute(
    `INSERT INTO platform_revenue_entries (
      source_type, source_id, gross_amount, tax_withheld_amount, net_amount, currency, recognized_at
    ) VALUES ('ad_invoice', ?, ?, ?, ?, ?, NOW())`,
    [invoiceId, invoice.total_amount, invoice.tax_amount, netAmount, invoice.currency]
  );

  return { ok: true, invoiceId, netAmount };
}

module.exports = {
  createServiceProvider,
  createServiceOffering,
  bulkCreateAvailabilitySlots,
  createBookingWithTaxAndPayout,
  createAdvertiserInvoice,
  settleAdvertiserInvoice
};
