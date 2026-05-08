#!/usr/bin/env node
/**
 * Injects or replaces <meta name="keywords"> in root *.html for crawler-visible SEO.
 * Skips pages that are noindex in the first 2KB of the file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** Curated phrases per file (comma-separated). Keep under ~900 chars each. */
const KEYWORDS_BY_FILE = {
  "account-hub.html":
    "VibeCart account hub, buyer seller settings, profile and orders, marketplace account, cross-border shopping account, secure login, order history, delivery preferences",
  "account-welcome.html":
    "VibeCart account welcome, new user onboarding, marketplace signup, buyer seller welcome, secure account setup",
  "affiliate-dashboard.html":
    "VibeCart affiliate dashboard, partner traffic, referral program, marketplace affiliates, commission tracking",
  "audience-fit.html":
    "VibeCart audience fit, shopper segments, marketplace targeting, buyer personas, conversion insights",
  "best-bargains.html":
    "best bargains online, discount shopping, retailer deals, VibeCart deals lane, mainstream promotions, save money shopping, cross-border discounts",
  "books-study-deals.html":
    "textbooks online, study books deals, bookshop discounts, VibeCart books lane, student shopping, international book delivery",
  "bridge-hub.html":
    "Africa Europe trade bridge, cross-border commerce hub, Dubai Asia shipping, VibeCart trade base, import export legal goods, international marketplace bridge",
  "browse-categories.html":
    "browse marketplace categories, VibeCart category picker, live market filters, fashion electronics books, global shop categories",
  "buy-journey.html":
    "safe online buying guide, VibeCart buy journey, secure checkout steps, cross-border purchase help, trusted seller checkout, buyer protection tips",
  "coach-experience.html":
    "VibeCart coach experience, fitness coaching sessions, wellness coach booking, structured coaching programs",
  "coach-payment-recovery.html":
    "VibeCart coach payment recovery, restore coach access, subscription billing help, coach checkout recovery, wellness subscription",
  "checkout-details.html":
    "VibeCart secure checkout, marketplace payment step, buyer checkout details, order payment flow vibe-cart.com",
  "payment-confirmation.html":
    "VibeCart payment confirmation, order paid success, marketplace payment receipt, checkout complete",
  "electronics-deals.html":
    "electronics deals online, laptops phones gadgets, tech retailer discounts, VibeCart electronics lane, verified tech shops",
  "fashion-deals.html":
    "fashion deals online, apparel discounts, clothing retailers, VibeCart fashion lane, style shopping cross-border",
  "fashion-trends.html":
    "fashion trends marketplace, seasonal style picks, VibeCart fashion trends, apparel shopping inspiration",
  "global-market.html":
    "global marketplace hub, VibeCart world market, featured stores, live marketplace entry, international shopping shortcuts",
  "global-search.html":
    "VibeCart global search, find shops and pages, marketplace search, Google Maps OpenStreetMap search, city shop finder, site search vibe-cart.com",
  "hot-picks.html":
    "VibeCart hot picks, live retailer deals, curated promotions, external checkout trusted shops, deal discovery, shopping picks today",
  "insurance.html":
    "student insurance marketplace, family insurance tips, VibeCart insurance partners, wellbeing and coverage information",
  "lane-passport.html":
    "VibeCart lane passport, shopper identity preferences, personalized marketplace lanes, cross-border shopper profile",
  "lane-welcome.html":
    "VibeCart lane welcome, buyer seller book fast lanes, marketplace intent onboarding, shopping mode selection",
  "legal-settings.html":
    "VibeCart legal settings, compliance preferences, marketplace legal notices, user legal choices",
  "live-market-shops.html":
    "live market shops, VibeCart retailer grid, category filtered marketplace, global live shops, trusted external retailers, cross-border live catalog",
  "live-market.html":
    "VibeCart live market folders, popular market navigation, shop grid entry, marketplace live offers",
  "marketplace-buy.html":
    "VibeCart marketplace buy, place order listing, buyer checkout flow, secure marketplace purchase, live listing order",
  "my-business.html":
    "VibeCart My Business, service provider dashboard, client bookings, seller portfolio offers, provider slots and requests",
  "my-listings.html":
    "VibeCart my listings, seller listings management, edit marketplace listings, seller inventory hub",
  "orders-tracking.html":
    "track VibeCart orders, delivery status, parcel tracking, buyer order updates, shipping timeline marketplace",
  "passport-welcome.html":
    "VibeCart passport welcome, cross-border shopper passport, marketplace travel shopping profile",
  "plan-workspace.html":
    "VibeCart plan workspace, fitness plan workspace, coach subscription planning, workout workspace",
  "policy.html":
    "VibeCart policy, marketplace terms of use, buyer seller rules, legal policy shopping",
  "popular-market.html":
    "popular market VibeCart, trending shop lanes, marketplace popular picks, regional hot markets",
  "privacy.html":
    "VibeCart privacy policy, data protection marketplace, user privacy rights, cookie and data practices",
  "regional-shops.html":
    "regional shops Europe Africa Asia, VibeCart regional lanes, scents global shops, cross-region marketplace, Dubai trade shops",
  "rewards-hub.html":
    "VibeCart rewards hub, loyalty marketplace, shopper rewards, points and perks",
  "security-overview.html":
    "VibeCart security overview, safe payments marketplace, fraud prevention shopping, trust and safety buyers sellers",
  "sell-journey.html":
    "sell online VibeCart, start selling cross-border, seller onboarding, marketplace listing guide, grow sales international",
  "seller-boost.html":
    "VibeCart seller boost, marketplace promotion tools, seller growth conversion, listing visibility tips",
  "seller-bridge-toolkit.html":
    "seller bridge toolkit, cross-border seller tools, VibeCart export import seller, trade corridor seller",
  "seller-growth-workspace.html":
    "VibeCart seller growth workspace, AI growth plan, seller analytics workspace, marketplace expansion",
  "seller-live-preview.html":
    "VibeCart seller live preview, listing preview storefront, seller shop preview",
  "seller-messages.html":
    "VibeCart seller messages, buyer seller chat hub, marketplace messaging, order conversations",
  "seller-orders.html":
    "VibeCart seller orders, manage marketplace orders, seller fulfillment dashboard",
  "seller-payments.html":
    "VibeCart seller payments, payouts marketplace, seller earnings dashboard, payment settings",
  "service-provider-hub.html":
    "service provider hub VibeCart, book professionals online, prepayment service checkout, salon and pro bookings",
  "shop-hub.html":
    "VibeCart shop hub, discount lanes curated retailers, hot picks navigation, marketplace shop shortcuts",
  "shops-asia.html":
    "Asia shops marketplace, VibeCart Asia lane, regional Asian retailers, cross-border Asia shopping",
  "shops-europe.html":
    "Europe shops marketplace, VibeCart Europe lane, EU UK retailers, European cross-border shopping",
  "shops-global.html":
    "global shops VibeCart, worldwide retailer lane, international shop directory marketplace",
  "shops-mama-africa.html":
    "Africa shops marketplace, VibeCart Mama Africa lane, African retailers cross-border, diaspora shopping Africa",
  "shops-scents.html":
    "beauty fragrance shops, scents marketplace, VibeCart beauty lane, perfume cosmetics retailers",
  "terms.html":
    "VibeCart terms of service, marketplace user agreement, legal terms shopping",
  "wellbeing.html":
    "VibeCart wellbeing, health check-ins goals, wearable preferences, private wellness marketplace",
  "world-shop-experience.html":
    "world shop experience VibeCart, global shopping lanes, live offers external checkout, international storefront preview"
};

const INDEX_KEYWORDS =
  "VibeCart, vibe-cart.com, cross-border marketplace, Africa Europe Asia marketplace, Dubai ecommerce, international online shopping, secure marketplace payments, tracked global shipping, buy sell legal goods, marketplace buyers and sellers, B2C ecommerce, diaspora shopping, import export retail, fashion electronics books deals, hot picks live shops, seller tools My Business, order tracking, global search shops, trade bridge marketplace, trusted checkout, conversion focused storefront, multilingual shopping hub";

function headHasNoindex(html) {
  const slice = html.slice(0, 2500).toLowerCase();
  return slice.includes("noindex");
}

function injectKeywords(html, keywords) {
  const esc = keywords.replace(/"/g, "&quot;");
  const block = `\n  <meta name="keywords" content="${esc}" />\n`;
  if (/<meta\s[^>]*name=["']keywords["']/i.test(html)) {
    return html.replace(
      /<meta\s[^>]*name=["']keywords["'][^>]*\/?>/i,
      `<meta name="keywords" content="${esc}" />`
    );
  }
  const oneLine = html.match(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/>/i);
  if (oneLine && oneLine.index !== undefined) {
    const end = oneLine.index + oneLine[0].length;
    return html.slice(0, end) + block + html.slice(end);
  }
  const multi = html.match(/<meta[^>]*name=["']description["'][^>]*>[\s\S]*?<\/meta>/i);
  if (multi && multi.index !== undefined) {
    const end = multi.index + multi[0].length;
    return html.slice(0, end) + block + html.slice(end);
  }
  const tm = html.match(/<\/title>\s*/i);
  if (tm && tm.index !== undefined) {
    const end = tm.index + tm[0].length;
    return html.slice(0, end) + block + html.slice(end);
  }
  return null;
}

function replaceIndexKeywords(html) {
  return html.replace(
    /<meta[\s\n\r\t]*name=["']keywords["'][\s\n\r\t]*content=["'][^"']*["'][\s\n\r\t]*\/>/i,
    `<meta\n      name="keywords"\n      content="${INDEX_KEYWORDS.replace(/"/g, "&quot;")}"\n    />`
  );
}

let updated = 0;
let skipped = 0;

for (const name of fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"))) {
  const abs = path.join(ROOT, name);
  let html = fs.readFileSync(abs, "utf8");

  if (name === "index.html") {
    const next = replaceIndexKeywords(html);
    if (next !== html) {
      fs.writeFileSync(abs, next, "utf8");
      updated++;
    }
    continue;
  }

  if (headHasNoindex(html)) {
    skipped++;
    continue;
  }

  const kw = KEYWORDS_BY_FILE[name];
  if (!kw) {
    console.warn("seo-inject: no keyword map for", name, "— skip");
    skipped++;
    continue;
  }

  if (/<meta\s[^>]*name=["']keywords["']/i.test(html)) {
    const next = html.replace(
      /<meta\s[^>]*name=["']keywords["'][^>]*\/?>/i,
      `<meta name="keywords" content="${kw.replace(/"/g, "&quot;")}" />`
    );
    if (next !== html) {
      fs.writeFileSync(abs, next, "utf8");
      updated++;
    }
    continue;
  }

  const next = injectKeywords(html, kw);
  if (next) {
    fs.writeFileSync(abs, next, "utf8");
    updated++;
  } else {
    console.warn("seo-inject: could not find anchor in", name);
    skipped++;
  }
}

console.log("seo-inject-keywords:", { updated, skipped });
