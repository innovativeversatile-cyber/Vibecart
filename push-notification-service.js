"use strict";

/**
 * Backend helper for push registration + order notifications.
 * Replace sendViaProvider() with your real push provider integration.
 */

async function registerDeviceToken(db, payload) {
  const { userId, platform, pushToken, appVersion, locale } = payload;
  if (!userId || !platform || !pushToken) {
    throw new Error("Missing required push registration fields.");
  }
  if (!["android", "ios", "web"].includes(platform)) {
    throw new Error("Unsupported platform.");
  }

  await db.execute(
    `INSERT INTO device_push_tokens (user_id, platform, push_token, app_version, locale, active)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       platform = VALUES(platform),
       app_version = VALUES(app_version),
       locale = VALUES(locale),
       active = 1,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, platform, pushToken, appVersion || null, locale || null]
  );

  return { ok: true };
}

async function loadOrderUsers(db, orderId) {
  const [rows] = await db.execute(
    `SELECT o.id, o.buyer_user_id, s.owner_user_id AS seller_user_id
     FROM orders o
     JOIN shops s ON s.id = o.seller_shop_id
     WHERE o.id = ?
     LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

async function getActiveTokensByUser(db, userId) {
  const [rows] = await db.execute(
    `SELECT push_token
     FROM device_push_tokens
     WHERE user_id = ? AND active = 1`,
    [userId]
  );
  return rows.map((row) => row.push_token);
}

async function logNotificationEvent(db, userId, eventType, title, message, deepLink) {
  const [result] = await db.execute(
    `INSERT INTO notification_events (user_id, event_type, title, message, deep_link, delivery_status)
     VALUES (?, ?, ?, ?, ?, 'queued')`,
    [userId, eventType, title, message, deepLink]
  );
  return result.insertId;
}

async function markNotificationSent(db, eventId, providerMessageId) {
  await db.execute(
    `UPDATE notification_events
     SET delivery_status = 'sent', provider_message_id = ?, sent_at = NOW()
     WHERE id = ?`,
    [providerMessageId || null, eventId]
  );
}

async function markNotificationFailed(db, eventId, errorMessage) {
  await db.execute(
    `UPDATE notification_events
     SET delivery_status = 'failed', error_message = ?
     WHERE id = ?`,
    [errorMessage || "unknown_error", eventId]
  );
}

async function sendViaProvider(tokens, title, message, deepLink) {
  // Stub integration: replace with Expo/FCM/APNs call.
  // Return shape should include provider message IDs.
  return tokens.map((token) => ({
    token,
    success: true,
    providerMessageId: `mock-${Date.now()}`
  }));
}

async function sendOrderUpdateNotifications(db, payload) {
  const { orderId, statusCode, statusMessage } = payload;
  if (!orderId || !statusCode || !statusMessage) {
    throw new Error("Missing required order notification fields.");
  }

  const orderUsers = await loadOrderUsers(db, orderId);
  if (!orderUsers) {
    throw new Error("Order not found.");
  }

  const deepLink = `vibecart://orders/${orderId}`;
  const title = "Order Update";
  const message = statusMessage;

  const targets = [orderUsers.buyer_user_id, orderUsers.seller_user_id];
  let queued = 0;

  for (const userId of targets) {
    const tokens = await getActiveTokensByUser(db, userId);
    const eventId = await logNotificationEvent(db, userId, `order_${statusCode}`, title, message, deepLink);
    queued += 1;

    try {
      const results = await sendViaProvider(tokens, title, message, deepLink);
      const anySent = results.some((item) => item.success);
      if (anySent) {
        await markNotificationSent(db, eventId, results[0]?.providerMessageId || null);
      } else {
        await markNotificationFailed(db, eventId, "provider_rejected");
      }
    } catch (error) {
      await markNotificationFailed(db, eventId, String(error.message || error));
    }
  }

  return { ok: true, queued };
}

module.exports = {
  registerDeviceToken,
  sendOrderUpdateNotifications
};
