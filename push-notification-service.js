"use strict";

const crypto = require("crypto");

/**
 * Backend helper for push registration + order notifications.
 * Native: Expo + FCM legacy (`FCM_SERVER_KEY`). Browser: Web Push via `web-push` + VAPID env vars.
 */

let webPushModule;
function loadWebPush() {
  if (webPushModule !== undefined) {
    return webPushModule;
  }
  try {
    webPushModule = require("web-push");
  } catch {
    webPushModule = null;
  }
  return webPushModule;
}

let webPushVapidReady = false;
function ensureWebPushVapidConfigured() {
  const webpush = loadWebPush();
  if (!webpush) {
    return false;
  }
  if (webPushVapidReady) {
    return true;
  }
  const pub = String(process.env.VAPID_PUBLIC_KEY || "").trim();
  const prv = String(process.env.VAPID_PRIVATE_KEY || "").trim();
  const subj = String(process.env.VAPID_SUBJECT || "mailto:support@vibe-cart.com").trim();
  if (!pub || !prv) {
    return false;
  }
  webpush.setVapidDetails(subj, pub, prv);
  webPushVapidReady = true;
  return true;
}

function tryParseWebPushSubscription(raw) {
  const s = String(raw || "").trim();
  if (!s.startsWith("{")) {
    return null;
  }
  try {
    const o = JSON.parse(s);
    if (!o || typeof o.endpoint !== "string" || !o.keys || typeof o.keys.p256dh !== "string" || typeof o.keys.auth !== "string") {
      return null;
    }
    return o;
  } catch {
    return null;
  }
}

async function ensureWebPushSubscriptionsTable(db) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS web_push_subscriptions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      endpoint_hash CHAR(64) NOT NULL,
      subscription_json JSON NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_web_push_user_endpoint (user_id, endpoint_hash),
      KEY idx_web_push_user_active (user_id, active),
      CONSTRAINT fk_web_push_user FOREIGN KEY (user_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
}

/**
 * Persist a browser PushSubscription JSON for a signed-in user (VAPID). Uses a dedicated table so long endpoints fit.
 */
async function registerWebPushSubscription(db, payload) {
  const userId = Number(payload.userId || 0);
  const subscription = payload.subscription;
  if (!userId) {
    throw new Error("Missing userId.");
  }
  if (!subscription || typeof subscription.endpoint !== "string") {
    throw new Error("Invalid PushSubscription (endpoint required).");
  }
  const keys = subscription.keys || {};
  if (typeof keys.p256dh !== "string" || typeof keys.auth !== "string") {
    throw new Error("Invalid PushSubscription keys (p256dh and auth required).");
  }
  const normalized = {
    endpoint: String(subscription.endpoint).trim().slice(0, 4096),
    keys: {
      p256dh: String(keys.p256dh).trim().slice(0, 512),
      auth: String(keys.auth).trim().slice(0, 256)
    },
    expirationTime: subscription.expirationTime != null ? subscription.expirationTime : undefined
  };
  if (normalized.endpoint.length < 12) {
    throw new Error("Invalid subscription endpoint.");
  }
  const endpointHash = crypto.createHash("sha256").update(normalized.endpoint, "utf8").digest("hex");
  const jsonStr = JSON.stringify(normalized);

  await ensureWebPushSubscriptionsTable(db);
  await db.execute(
    `INSERT INTO web_push_subscriptions (user_id, endpoint_hash, subscription_json, active)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       subscription_json = VALUES(subscription_json),
       active = 1,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, endpointHash, jsonStr]
  );
  return { ok: true };
}

async function registerMobileInstallPush(db, payload) {
  const installId = String(payload.installId || "").trim().slice(0, 64);
  const pushToken = String(payload.pushToken || "").trim().slice(0, 512);
  const platform = String(payload.platform || "").trim().toLowerCase();
  const appVersion = payload.appVersion ? String(payload.appVersion).trim().slice(0, 50) : null;
  const locale = payload.locale ? String(payload.locale).trim().slice(0, 20) : null;

  if (installId.length < 8 || !pushToken || pushToken.length < 10) {
    throw new Error("Missing installId or pushToken.");
  }
  if (!["android", "ios"].includes(platform)) {
    throw new Error("Unsupported platform.");
  }

  await db.execute(
    `INSERT INTO mobile_push_installs (install_id, push_token, platform, app_version, locale)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       push_token = VALUES(push_token),
       platform = VALUES(platform),
       app_version = VALUES(app_version),
       locale = VALUES(locale),
       updated_at = CURRENT_TIMESTAMP`,
    [installId, pushToken, platform, appVersion, locale]
  );

  return { ok: true };
}

/**
 * Anonymous UX / improvement notes from the mobile WebView shell (VibeCoach).
 * Optional install_id when the native app chooses to send it later.
 */
async function recordMobileAppFeedback(db, payload) {
  const body = String(payload.body || "").trim();
  if (body.length < 4 || body.length > 2000) {
    throw new Error("Feedback text must be between 4 and 2000 characters.");
  }
  const installId = payload.installId ? String(payload.installId).trim().slice(0, 64) : null;
  const locale = payload.locale ? String(payload.locale).trim().slice(0, 20) : null;
  const appVersion = payload.appVersion ? String(payload.appVersion).trim().slice(0, 50) : null;
  const pageUrl = payload.pageUrl ? String(payload.pageUrl).trim().slice(0, 512) : null;
  const userAgent = payload.userAgent ? String(payload.userAgent).trim().slice(0, 400) : null;
  const clientIp = payload.clientIp ? String(payload.clientIp).trim().slice(0, 64) : null;

  await db.execute(
    `INSERT INTO mobile_app_feedback (install_id, body, locale, app_version, page_url, user_agent, client_ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [installId, body, locale, appVersion, pageUrl, userAgent, clientIp]
  );

  return { ok: true };
}

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
  const native = rows.map((row) => row.push_token);
  let webStrings = [];
  try {
    const [webRows] = await db.execute(
      `SELECT subscription_json FROM web_push_subscriptions WHERE user_id = ? AND active = 1`,
      [userId]
    );
    webStrings = webRows.map((row) => {
      const j = row.subscription_json;
      if (j && typeof j === "object") {
        return JSON.stringify(j);
      }
      return String(j || "").trim();
    });
  } catch {
    webStrings = [];
  }
  return native.concat(webStrings);
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
  const list = Array.isArray(tokens) ? tokens : [];
  const fcmKey = String(process.env.FCM_SERVER_KEY || "").trim();
  if (!list.length) {
    return [];
  }
  const expoTokens = [];
  const fcmTokens = [];
  const webSubs = [];
  for (const token of list) {
    const t = String(token || "").trim();
    if (!t) {
      continue;
    }
    const webParsed = tryParseWebPushSubscription(t);
    if (webParsed) {
      webSubs.push({ subscription: webParsed, raw: t.slice(0, 120) });
      continue;
    }
    if (/^(ExponentPushToken|ExpoPushToken)\[.+\]$/i.test(t)) {
      expoTokens.push(t);
    } else {
      fcmTokens.push(t);
    }
  }

  const results = [];
  const webPayload = JSON.stringify({
    title: String(title || "").slice(0, 120),
    body: String(message || "").slice(0, 500),
    url: String(deepLink || "./").slice(0, 512)
  });
  if (webSubs.length && ensureWebPushVapidConfigured()) {
    const webpush = loadWebPush();
    for (const { subscription, raw } of webSubs) {
      try {
        await webpush.sendNotification(subscription, webPayload, {
          TTL: 3600,
          urgency: "normal"
        });
        results.push({ token: raw, success: true, providerMessageId: "web_push" });
      } catch (err) {
        const status = err && err.statusCode;
        results.push({
          token: raw,
          success: false,
          providerMessageId: null,
          webPushStatus: status || null
        });
      }
    }
  } else if (webSubs.length) {
    for (const { raw } of webSubs) {
      results.push({ token: raw, success: false, providerMessageId: null });
    }
  }

  if (expoTokens.length) {
    for (const token of expoTokens) {
      try {
        const res = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            to: token,
            title: String(title || "").slice(0, 120),
            body: String(message || "").slice(0, 500),
            sound: "default",
            data: deepLink ? { url: String(deepLink).slice(0, 512) } : {}
          })
        });
        const body = await res.json().catch(() => ({}));
        const payload = body && body.data ? body.data : {};
        const ok = res.ok && String(payload.status || "").toLowerCase() === "ok";
        results.push({
          token,
          success: ok,
          providerMessageId: payload.id ? String(payload.id) : null
        });
      } catch {
        results.push({ token, success: false, providerMessageId: null });
      }
    }
  }

  if (!fcmTokens.length) {
    return results;
  }
  if (!fcmKey) {
    return results.concat(
      fcmTokens.map((token) => ({
        token,
        success: false,
        providerMessageId: null
      }))
    );
  }

  for (const token of fcmTokens) {
    const t = String(token || "").trim();
    if (!t) {
      continue;
    }
    try {
      const res = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${fcmKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: t,
          notification: { title: String(title || "").slice(0, 120), body: String(message || "").slice(0, 500) },
          data: deepLink ? { url: String(deepLink).slice(0, 512) } : {}
        })
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && Number(body.success || 0) >= 1;
      results.push({
        token: t,
        success: ok,
        providerMessageId: body.message_id ? String(body.message_id) : body.multicast_id != null ? String(body.multicast_id) : null
      });
    } catch {
      results.push({ token: t, success: false, providerMessageId: null });
    }
  }
  return results;
}

/**
 * Sends a push to every active device + browser subscription for a public `users.id`.
 * Native: `FCM_SERVER_KEY` and/or Expo. Browser: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_SUBJECT`.
 */
async function sendPushToUser(db, opts) {
  const userId = Number(opts.userId || 0);
  const title = String(opts.title || "VibeCart").trim().slice(0, 120);
  const message = String(opts.message || "").trim().slice(0, 500);
  const deepLink = String(opts.deepLink || "vibecart://").trim().slice(0, 512);
  const eventType = String(opts.eventType || "owner_alert").trim().slice(0, 64);
  if (!userId) {
    return { ok: false, code: "MISSING_USER_ID" };
  }
  const tokens = await getActiveTokensByUser(db, userId);
  if (!tokens.length) {
    return { ok: true, skipped: true, reason: "no_device_tokens" };
  }
  const eventId = await logNotificationEvent(db, userId, eventType, title, message, deepLink);
  try {
    const results = await sendViaProvider(tokens, title, message, deepLink);
    const anySent = results.some((item) => item.success);
    if (anySent) {
      await markNotificationSent(db, eventId, results.find((r) => r.success)?.providerMessageId || null);
    } else {
      await markNotificationFailed(db, eventId, "push_provider_failed_or_keys_missing");
    }
  } catch (error) {
    await markNotificationFailed(db, eventId, String(error.message || error));
  }
  return { ok: true, eventId };
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
  registerMobileInstallPush,
  recordMobileAppFeedback,
  registerDeviceToken,
  registerWebPushSubscription,
  ensureWebPushSubscriptionsTable,
  sendOrderUpdateNotifications,
  sendPushToUser
};
