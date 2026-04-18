"use strict";

/**
 * Idempotent demo catalog: users, shops, products, images, promos.
 * Safe to re-run; removes rows tied to fixed demo emails first.
 *
 *   npm run db:seed
 *
 * Requires schema already applied (`npm run db:apply-schema`).
 * Uses the same MySQL env resolution as `apply-schema.js` (see db-env / .env).
 */

const crypto = require("crypto");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { resolveMysqlConfig } = require("../db-env");

const DEMO_EMAILS = {
  buyer: "buyer-demo@vibecart.local",
  sellerEu: "seller-eu-demo@vibecart.local",
  sellerAf: "seller-af-demo@vibecart.local"
};

const DEMO_PASSWORD = "DemoPass123!";

function hashPublicPassword(password, saltHex) {
  const salt = Buffer.from(saltHex, "hex");
  return crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
}

function makePasswordHash() {
  const saltHex = crypto.randomBytes(16).toString("hex");
  return `${saltHex}:${hashPublicPassword(DEMO_PASSWORD, saltHex)}`;
}

function placeholders(n) {
  return Array(Math.max(0, n)).fill("?").join(",");
}

async function wipeDemoData(conn) {
  const emails = Object.values(DEMO_EMAILS);
  const [users] = await conn.query(`SELECT id FROM users WHERE email IN (${placeholders(emails.length)})`, emails);
  const userIds = users.map((r) => Number(r.id));
  if (userIds.length === 0) {
    return;
  }
  const uph = placeholders(userIds.length);
  const [shops] = await conn.query(`SELECT id FROM shops WHERE owner_user_id IN (${uph})`, userIds);
  const shopIds = shops.map((r) => Number(r.id));
  let productIds = [];
  if (shopIds.length) {
    const sph = placeholders(shopIds.length);
    const [prods] = await conn.query(`SELECT id FROM products WHERE shop_id IN (${sph})`, shopIds);
    productIds = prods.map((r) => Number(r.id));
  }

  const [orders] = await conn.query(
    `SELECT id FROM orders WHERE buyer_user_id IN (${uph})` +
      (shopIds.length ? ` OR seller_shop_id IN (${placeholders(shopIds.length)})` : ""),
    shopIds.length ? [...userIds, ...shopIds] : userIds
  );
  const orderIds = orders.map((r) => Number(r.id));

  const [convs] = await conn.query(
    `SELECT id FROM conversations WHERE buyer_user_id IN (${uph}) OR seller_user_id IN (${uph})`,
    [...userIds, ...userIds]
  );
  const convIds = convs.map((r) => Number(r.id));

  await conn.query("SET FOREIGN_KEY_CHECKS=0");
  try {
    if (convIds.length) {
      const cph = placeholders(convIds.length);
      await conn.query(`DELETE FROM conversation_messages WHERE conversation_id IN (${cph})`, convIds);
      await conn.query(`DELETE FROM conversations WHERE id IN (${cph})`, convIds);
    }
    if (orderIds.length) {
      const oph = placeholders(orderIds.length);
      await conn.query(`DELETE FROM order_status_updates WHERE order_id IN (${oph})`, orderIds);
      await conn.query(`DELETE FROM order_monetization_charges WHERE order_id IN (${oph})`, orderIds);
      await conn.query(`DELETE FROM payments WHERE order_id IN (${oph})`, orderIds);
      await conn.query(`DELETE FROM shipments WHERE order_id IN (${oph})`, orderIds);
      await conn.query(`DELETE FROM return_requests WHERE order_id IN (${oph})`, orderIds);
      await conn.query(`DELETE FROM order_items WHERE order_id IN (${oph})`, orderIds);
      await conn.query(`DELETE FROM orders WHERE id IN (${oph})`, orderIds);
    }
    if (productIds.length) {
      const piph = placeholders(productIds.length);
      await conn.query(`DELETE FROM compliance_checks WHERE product_id IN (${piph})`, productIds);
      await conn.query(`DELETE FROM product_images WHERE product_id IN (${piph})`, productIds);
      await conn.query(`DELETE FROM product_launches WHERE product_id IN (${piph})`, productIds);
    }
    if (shopIds.length) {
      const sph = placeholders(shopIds.length);
      await conn.query(`DELETE FROM seller_promotions WHERE shop_id IN (${sph})`, shopIds);
      await conn.query(`DELETE FROM product_launches WHERE shop_id IN (${sph})`, shopIds);
      await conn.query(`DELETE FROM listing_boost_purchases WHERE shop_id IN (${sph})`, shopIds);
      await conn.query(`DELETE FROM seller_subscriptions WHERE shop_id IN (${sph})`, shopIds);
      await conn.query(`DELETE FROM products WHERE shop_id IN (${sph})`, shopIds);
      await conn.query(`DELETE FROM shops WHERE id IN (${sph})`, shopIds);
    }
    await conn.query(`DELETE FROM user_auth_sessions WHERE user_id IN (${uph})`, userIds);
    await conn.query(`DELETE FROM users WHERE id IN (${uph})`, userIds);
  } finally {
    await conn.query("SET FOREIGN_KEY_CHECKS=1");
  }
}

async function main() {
  const cfg = resolveMysqlConfig();
  const _dbSslRaw = String(process.env.DB_SSL || "").trim().toLowerCase();
  const useSsl =
    _dbSslRaw === "true" ||
    _dbSslRaw === "1" ||
    /\.rlwy\.net$/i.test(cfg.host) ||
    /\.railway\.app$/i.test(cfg.host);

  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    multipleStatements: false,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await conn.beginTransaction();
    await wipeDemoData(conn);

    const passHash = makePasswordHash();

    const [buyerRes] = await conn.execute(
      `INSERT INTO users (email, password_hash, full_name, role, country_code, is_verified)
       VALUES (?, ?, ?, 'buyer', 'PL', 1)`,
      [DEMO_EMAILS.buyer, passHash, "Demo Buyer (Poland)"]
    );
    const buyerId = Number(buyerRes.insertId);

    const [euRes] = await conn.execute(
      `INSERT INTO users (email, password_hash, full_name, role, country_code, is_verified)
       VALUES (?, ?, ?, 'seller', 'PL', 1)`,
      [DEMO_EMAILS.sellerEu, makePasswordHash(), "Bridge Bazaar EU"]
    );
    const sellerEuId = Number(euRes.insertId);

    const [afRes] = await conn.execute(
      `INSERT INTO users (email, password_hash, full_name, role, country_code, is_verified)
       VALUES (?, ?, ?, 'seller', 'ZA', 1)`,
      [DEMO_EMAILS.sellerAf, makePasswordHash(), "Mama Makers Collective"]
    );
    const sellerAfId = Number(afRes.insertId);

    const [euShop] = await conn.execute(
      `INSERT INTO shops (owner_user_id, name, slug, description, active)
       VALUES (?, ?, ?, ?, 1)`,
      [
        sellerEuId,
        "Bridge Bazaar EU",
        "demo-bridge-bazaar-eu",
        "Polish/EU-origin demo listings for the Europe → Africa bridge. Prices are illustrative."
      ]
    );
    const shopEuId = Number(euShop.insertId);

    const [afShop] = await conn.execute(
      `INSERT INTO shops (owner_user_id, name, slug, description, active)
       VALUES (?, ?, ?, ?, 1)`,
      [
        sellerAfId,
        "Mama Makers Collective",
        "demo-mama-makers-collective",
        "African-origin crafts, fashion, and books for the Mama Africa lane — illustrative demo stock."
      ]
    );
    const shopAfId = Number(afShop.insertId);

    const [catRows] = await conn.query(`SELECT id, name FROM categories ORDER BY id ASC`);
    const catByName = new Map(catRows.map((r) => [String(r.name), Number(r.id)]));
    const cid = (name) => {
      const id = catByName.get(name);
      if (!id) {
        throw new Error(`Missing category "${name}" — run db:apply-schema first.`);
      }
      return id;
    };

    const catalog = [
      {
        shopId: shopEuId,
        category: "Electronics",
        title: "Ultralight Student Laptop 14\"",
        description: "EU warranty-friendly config for campus workflows — demo SKU.",
        price: 649.0,
        currency: "EUR",
        stock: 12,
        origin: "PL",
        img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopEuId,
        category: "Fashion",
        title: "Merino Travel Hoodie (unisex)",
        description: "Layer-friendly streetwear for long-haul campus commutes.",
        price: 72.5,
        currency: "EUR",
        stock: 40,
        origin: "DE",
        img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopEuId,
        category: "Books",
        title: "Cross-Border Trade Basics (2026 pocket edition)",
        description: "Plain-language duties, Incoterms-lite, and student seller checklist.",
        price: 18.9,
        currency: "EUR",
        stock: 200,
        origin: "PL",
        img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopEuId,
        category: "Gaming",
        title: "Wireless Pro Controller (EU bundle)",
        description: "Low-latency controller with USB-C dock — demo electronics lane.",
        price: 59.99,
        currency: "EUR",
        stock: 85,
        origin: "FR",
        img: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopEuId,
        category: "Electronics",
        title: "Noise-Canceling Campus Headset",
        description: "Focus blocks for dorms + library sessions.",
        price: 129.0,
        currency: "EUR",
        stock: 30,
        origin: "NL",
        img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopAfId,
        category: "Fashion",
        title: "Ankara Laptop Sleeve — hand-finished",
        description: "Padded sleeve with wax-print paneling; ships from Southern Africa.",
        price: 34.0,
        currency: "EUR",
        stock: 55,
        origin: "ZA",
        img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopAfId,
        category: "Books",
        title: "Founder Stories: Nairobi → Berlin",
        description: "Interviews with bridge-marketplace builders — inspirational non-fiction.",
        price: 22.5,
        currency: "EUR",
        stock: 120,
        origin: "KE",
        img: "https://images.unsplash.com/photo-1524995997946-a7c283d36034?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopAfId,
        category: "Electronics",
        title: "Solar Power Bank 20Ah (rugged)",
        description: "Outdoor-ready USB-C power for markets and campus events.",
        price: 48.0,
        currency: "EUR",
        stock: 70,
        origin: "NG",
        img: "https://images.unsplash.com/photo-1609091830311-c907288133f0?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopAfId,
        category: "Gaming",
        title: "Retro handheld — 500-in-1 (licensed shell)",
        description: "Pocket nostalgia console — demo gaming lane from West Africa.",
        price: 41.0,
        currency: "EUR",
        stock: 60,
        origin: "GH",
        img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80"
      },
      {
        shopId: shopAfId,
        category: "Fashion",
        title: "Beaded Statement Necklace — studio batch",
        description: "Limited artisan run; each piece slightly unique.",
        price: 28.75,
        currency: "EUR",
        stock: 24,
        origin: "ZW",
        img: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&q=80"
      }
    ];

    const productIds = [];
    for (const row of catalog) {
      const [ins] = await conn.execute(
        `INSERT INTO products (shop_id, category_id, title, description, base_price, currency, stock, origin_country, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          row.shopId,
          cid(row.category),
          row.title,
          row.description,
          row.price,
          row.currency,
          row.stock,
          row.origin
        ]
      );
      const pid = Number(ins.insertId);
      productIds.push(pid);
      await conn.execute(
        `INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, 0)`,
        [pid, row.img]
      );
    }

    await conn.execute(
      `INSERT INTO seller_promotions (shop_id, title, description, promo_type, discount_percent, starts_at, ends_at, active)
       VALUES (?, ?, ?, 'flash_sale', 12.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, 1)`,
      [
        shopEuId,
        "Bridge Week — EU tech & books",
        "Twelve percent off select EU-origin demo SKUs this month."
      ]
    );
    await conn.execute(
      `INSERT INTO seller_promotions (shop_id, title, description, promo_type, discount_percent, starts_at, ends_at, active)
       VALUES (?, ?, ?, 'featured', NULL, NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 60 DAY, 1)`,
      [
        shopAfId,
        "Mama Makers spotlight",
        "Featured lane for handcrafted fashion and solar accessories."
      ]
    );

    await conn.execute(
      `INSERT INTO product_launches (shop_id, product_id, launch_title, launch_message, launch_date, active)
       VALUES (?, ?, ?, ?, NOW() + INTERVAL 3 DAY, 1)`,
      [
        shopEuId,
        productIds[0],
        "Campus drop: ultralight laptops",
        "Notify buyers when the next EU refurb batch lands."
      ]
    );

    await conn.commit();

    // eslint-disable-next-line no-console
    console.log("OK: demo seed complete.");
    // eslint-disable-next-line no-console
    console.log("  Buyer:", DEMO_EMAILS.buyer, "| password:", DEMO_PASSWORD);
    // eslint-disable-next-line no-console
    console.log("  Seller EU:", DEMO_EMAILS.sellerEu, "| password:", DEMO_PASSWORD);
    // eslint-disable-next-line no-console
    console.log("  Seller AF:", DEMO_EMAILS.sellerAf, "| password:", DEMO_PASSWORD);
    // eslint-disable-next-line no-console
    console.log("  Shops:", shopEuId, shopAfId, "| products:", productIds.length, "| buyer user id:", buyerId);
    // eslint-disable-next-line no-console
    console.log("  Tip: log in via /api/public/auth/login then open Hot Picks — live tiles should populate.");
  } catch (e) {
    await conn.rollback().catch(() => {});
    // eslint-disable-next-line no-console
    console.error("FAILED:", e.message || e);
    process.exitCode = 1;
  } finally {
    await conn.end().catch(() => {});
  }
}

main();
