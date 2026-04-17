"use strict";

const crypto = require("crypto");
const mysql = require("mysql2/promise");

function hashPublicPassword(password, saltHex) {
  const salt = Buffer.from(saltHex, "hex");
  const out = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256");
  return out.toString("hex");
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "vibecart"
  });

  try {
    await conn.beginTransaction();

    const ownerEmail = "innovativeversatile@gmail.com";
    const ownerPassword = "VibeCart#Admin2026!";
    const ownerPhrase = "KudaKwaishe#Owner";
    const ownerPassSalt = crypto.randomBytes(16).toString("hex");
    const ownerPhraseSalt = crypto.randomBytes(16).toString("hex");
    const ownerPasswordHash = `${ownerPassSalt}:${hashPublicPassword(ownerPassword, ownerPassSalt)}`;
    const ownerPhraseHash = `${ownerPhraseSalt}:${hashPublicPassword(ownerPhrase, ownerPhraseSalt)}`;
    await conn.execute(
      "UPDATE owner_auth_profiles SET active = 0 WHERE owner_email = ?",
      [ownerEmail]
    );
    await conn.execute(
      `INSERT INTO owner_auth_profiles (
        owner_email, password_hash, security_phrase_hash, mfa_required, active
      ) VALUES (?, ?, ?, 0, 1)`,
      [ownerEmail, ownerPasswordHash, ownerPhraseHash]
    );

    const sellerEmail = "seller.seed@vibecart.local";
    const [sellerRows] = await conn.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [sellerEmail]
    );
    let sellerUserId = Number(sellerRows[0]?.id || 0);
    if (!sellerUserId) {
      const saltHex = crypto.randomBytes(16).toString("hex");
      const passwordHash = `${saltHex}:${hashPublicPassword("SeedSeller#2026", saltHex)}`;
      const [insertedSeller] = await conn.execute(
        `INSERT INTO users (email, password_hash, full_name, role, country_code, is_verified)
         VALUES (?, ?, 'VibeCart Seed Seller', 'seller', 'PL', 1)`,
        [sellerEmail, passwordHash]
      );
      sellerUserId = Number(insertedSeller.insertId || 0);
    }

    const [categoryRows] = await conn.execute(
      "SELECT id FROM categories ORDER BY id ASC LIMIT 1"
    );
    let categoryId = Number(categoryRows[0]?.id || 0);
    if (!categoryId) {
      const [insertedCategory] = await conn.execute(
        "INSERT INTO categories (name, legal_only) VALUES ('General', 1)"
      );
      categoryId = Number(insertedCategory.insertId || 0);
    }

    const shopSlug = "vibecart-seed-shop";
    const [shopRows] = await conn.execute(
      "SELECT id FROM shops WHERE slug = ? LIMIT 1",
      [shopSlug]
    );
    let shopId = Number(shopRows[0]?.id || 0);
    if (!shopId) {
      const [insertedShop] = await conn.execute(
        `INSERT INTO shops (owner_user_id, name, slug, description, active)
         VALUES (?, 'VibeCart Seed Shop', ?, 'Seeded catalog for checkout and delivery pipeline.', 1)`,
        [sellerUserId, shopSlug]
      );
      shopId = Number(insertedShop.insertId || 0);
    }

    const [productRows] = await conn.execute(
      "SELECT id FROM products WHERE shop_id = ? AND title = 'VibeCart Seed Product' LIMIT 1",
      [shopId]
    );
    let productId = Number(productRows[0]?.id || 0);
    if (!productId) {
      const [insertedProduct] = await conn.execute(
        `INSERT INTO products (
          shop_id, category_id, title, description, base_price, currency, stock, origin_country, status
        ) VALUES (?, ?, 'VibeCart Seed Product', 'Seed product for live order flow verification.', 49.00, 'EUR', 50, 'PL', 'active')`,
        [shopId, categoryId]
      );
      productId = Number(insertedProduct.insertId || 0);
    }

    const europeSeeds = [
      {
        sellerEmail: "seller.pl@vibecart.local",
        sellerName: "Warsaw Tech Outlet",
        country: "PL",
        shopName: "Warsaw Tech Outlet",
        shopSlug: "warsaw-tech-outlet",
        shopDescription: "Poland-origin electronics and accessories for Africa buyers.",
        productTitle: "Polish Smart Device Bundle",
        productDescription: "Poland-origin device pack tailored for cross-border retail in Africa.",
        price: 129.9,
        stock: 140
      },
      {
        sellerEmail: "seller.de@vibecart.local",
        sellerName: "Berlin Urban Supply",
        country: "DE",
        shopName: "Berlin Urban Supply",
        shopSlug: "berlin-urban-supply",
        shopDescription: "Germany-based legal products for Africa route buyers.",
        productTitle: "Berlin Streetwear Starter Pack",
        productDescription: "Germany-origin streetwear bundle for Africa-bound orders.",
        price: 68.5,
        stock: 190
      },
      {
        sellerEmail: "seller.fr@vibecart.local",
        sellerName: "Lyon Home Essentials",
        country: "FR",
        shopName: "Lyon Home Essentials",
        shopSlug: "lyon-home-essentials",
        shopDescription: "France-origin essentials optimized for export to Africa markets.",
        productTitle: "French Home Essentials Kit",
        productDescription: "High-demand home essentials from France for trusted cross-border trade.",
        price: 54.25,
        stock: 210
      }
    ];
    const africaSeeds = [
      {
        sellerEmail: "seller.za@vibecart.local",
        sellerName: "Cape Artisan Collective",
        country: "ZA",
        shopName: "Cape Artisan Exports",
        shopSlug: "cape-artisan-exports",
        shopDescription: "South African handmade and ethical goods for Europe buyers.",
        productTitle: "Cape Rooibos Wellness Tea Pack",
        productDescription: "Premium South African rooibos export pack, buyer-safe and customs-ready.",
        price: 24.9,
        stock: 200
      },
      {
        sellerEmail: "seller.ke@vibecart.local",
        sellerName: "Nairobi Origin Traders",
        country: "KE",
        shopName: "Nairobi Origin Foods",
        shopSlug: "nairobi-origin-foods",
        shopDescription: "Kenyan specialty products prepared for cross-border buyers in Europe.",
        productTitle: "Kenyan Single-Origin Coffee Beans",
        productDescription: "Freshly packed Nairobi export coffee beans with traceable origin details.",
        price: 19.5,
        stock: 260
      },
      {
        sellerEmail: "seller.ng@vibecart.local",
        sellerName: "Lagos Premium Supply",
        country: "NG",
        shopName: "Lagos Premium Supply",
        shopSlug: "lagos-premium-supply",
        shopDescription: "Nigeria-based legal marketplace offers for Europe delivery lanes.",
        productTitle: "Nigerian Cocoa Powder (Export Grade)",
        productDescription: "Export-grade cocoa powder from Nigerian producers, compliant for Europe import.",
        price: 27,
        stock: 180
      },
      {
        sellerEmail: "seller.gh@vibecart.local",
        sellerName: "Accra Heritage Market",
        country: "GH",
        shopName: "Accra Heritage Market",
        shopSlug: "accra-heritage-market",
        shopDescription: "Ghanaian cultural and natural goods for trusted Europe shoppers.",
        productTitle: "Ghana Shea Butter Bundle",
        productDescription: "Natural Ghana shea butter bundle, retail-ready packaging for Europe buyers.",
        price: 22.75,
        stock: 220
      },
      {
        sellerEmail: "seller.zw@vibecart.local",
        sellerName: "Harare Fine Produce",
        country: "ZW",
        shopName: "Harare Fine Produce",
        shopSlug: "harare-fine-produce",
        shopDescription: "Zimbabwean specialty produce listed for Europe marketplace demand.",
        productTitle: "Zimbabwe Dried Fruit Export Mix",
        productDescription: "Shelf-stable dried fruit mix from Zimbabwe, optimized for cross-border fulfillment.",
        price: 18.4,
        stock: 300
      }
    ];
    const seedRoute = async (seed) => {
      const [seedSellerRows] = await conn.execute(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [seed.sellerEmail]
      );
      let seedSellerId = Number(seedSellerRows[0]?.id || 0);
      if (!seedSellerId) {
        const seedSaltHex = crypto.randomBytes(16).toString("hex");
        const seedPasswordHash = `${seedSaltHex}:${hashPublicPassword("SeedSeller#2026", seedSaltHex)}`;
        const [insertedSeedSeller] = await conn.execute(
          `INSERT INTO users (email, password_hash, full_name, role, country_code, is_verified)
           VALUES (?, ?, ?, 'seller', ?, 1)`,
          [seed.sellerEmail, seedPasswordHash, seed.sellerName, seed.country]
        );
        seedSellerId = Number(insertedSeedSeller.insertId || 0);
      }

      const [seedShopRows] = await conn.execute(
        "SELECT id FROM shops WHERE slug = ? LIMIT 1",
        [seed.shopSlug]
      );
      let seedShopId = Number(seedShopRows[0]?.id || 0);
      if (!seedShopId) {
        const [insertedSeedShop] = await conn.execute(
          `INSERT INTO shops (owner_user_id, name, slug, description, active)
           VALUES (?, ?, ?, ?, 1)`,
          [seedSellerId, seed.shopName, seed.shopSlug, seed.shopDescription]
        );
        seedShopId = Number(insertedSeedShop.insertId || 0);
      }

      const [seedProductRows] = await conn.execute(
        "SELECT id FROM products WHERE shop_id = ? AND title = ? LIMIT 1",
        [seedShopId, seed.productTitle]
      );
      if (!Number(seedProductRows[0]?.id || 0)) {
        await conn.execute(
          `INSERT INTO products (
            shop_id, category_id, title, description, base_price, currency, stock, origin_country, status
          ) VALUES (?, ?, ?, ?, ?, 'EUR', ?, ?, 'active')`,
          [seedShopId, categoryId, seed.productTitle, seed.productDescription, Number(seed.price), Number(seed.stock), seed.country]
        );
      }
      return seedShopId;
    };
    const europeShopIds = [];
    for (const seed of europeSeeds) {
      europeShopIds.push(await seedRoute(seed));
    }
    const africaShopIds = [];
    for (const seed of africaSeeds) {
      africaShopIds.push(await seedRoute(seed));
    }

    await conn.commit();
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        ok: true,
        ownerEmail,
        ownerPassword,
        ownerPhrase,
        sellerEmail,
        seedShopId: shopId,
        seedProductId: productId,
        europeShopIds,
        africaShopIds
      })
    );
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback failure
    }
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("SEED_PUBLIC_CATALOG_FAILED", error.message || error);
  process.exit(1);
});
