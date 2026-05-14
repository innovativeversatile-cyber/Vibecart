#!/usr/bin/env node
/**
 * Google-oriented SEO: meta description, robots, canonical, OG/Twitter, WebPage JSON-LD.
 * Regenerates sitemap.xml from indexable root *.html (excludes noindex heads).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://vibe-cart.com";
const LASTMOD = "2026-05-14";

/** Also process these deploy-only HTML if present (synced into root). */
const EXTRA_ROOT_HTML = [];

/** Thin utility pages: useful meta for previews, but not for organic SERPs. */
const FORCE_NOINDEX_HTML = new Set([
  "checkout-details.html",
  "payment-confirmation.html",
  "coach-payment-recovery.html",
  "top-class-checkout.html"
]);

/** Regional folder lanes: noindex but need canonical to avoid duplicate signals in GSC. */
const REGIONAL_NOINDEX_HTML = new Set([
  "shops-europe.html",
  "shops-mama-africa.html",
  "shops-asia.html",
  "shops-scents.html",
  "shops-global.html"
]);

function headSlice(html) {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : html.slice(0, 5000);
}

function isNoindex(html) {
  return /noindex/i.test(headSlice(html));
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "VibeCart";
}

function escapeAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function stripForOg(title) {
  return String(title || "")
    .replace(/\s*[·•|]\s*VibeCart.*$/i, "")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Curated meta descriptions (≈140–160 chars). Used when <meta name="description"> is missing.
 */
const DESCRIPTION_FALLBACK = {
  "buy-journey.html":
    "Follow the VibeCart guided buy path: choose a regional lane, confirm the marketplace disclaimer, then continue to live shops with clearer trust signals and safer next steps.",
  "live-market-shops.html":
    "Shop VibeCart’s live market grid by category—fashion, electronics, books, and more—with curated external retailers and filters that keep cross-border browsing organized.",
  "sell-journey.html":
    "Start selling on VibeCart with a focused seller path: listings, delivery story, trust signals, and links to growth tools so cross-border buyers understand your offer faster.",
  "my-business.html":
    "Manage VibeCart My Business: service bookings, portfolio offers, client requests, and provider workflows in one desk built for cross-border commerce and repeat clients.",
  "regional-shops.html":
    "Open VibeCart regional lanes for Europe, Africa, Asia, scents, and global folders—each tuned for trusted external shops plus fast return paths to the live marketplace.",
  "bridge-hub.html":
    "Use the VibeCart trade bridge hub for Africa–Europe–Asia routes: legal goods, corridor context, and links into regional shops and the live market when you are ready to buy.",
  "global-market.html":
    "Jump into VibeCart’s global market shortcuts: categories, featured external stores, and a direct line into the live marketplace without hunting through the whole homepage.",
  "shop-hub.html":
    "Cinematic shop-now on VibeCart: auto slideshow of real affiliate promos from SHEIN, Allegro, AliExpress and regional retailers — plus Health Coach checkout.",
  "browse-categories.html":
    "Pick a VibeCart category and land in the live marketplace with that filter already applied—less friction from intent to the right shop grid.",
  "live-market.html":
    "Browse VibeCart live market folders and choose how you enter the full marketplace—popular picks or the complete live shop experience.",
  "popular-market.html":
    "See what is trending on VibeCart’s popular market lane: fast entry points into live offers and regional context for cross-border shoppers.",
  "fashion-deals.html":
    "Compare curated fashion deals from verified external retailers on VibeCart: savings context, imagery, and direct links when you are ready to check out on the source site.",
  "electronics-deals.html":
    "Browse electronics lanes on VibeCart with verified retailers, typical savings notes, and direct paths to trusted external storefronts for phones, laptops, and gadgets.",
  "books-study-deals.html":
    "Find books and study-friendly storefront lanes on VibeCart with transparent external links and delivery rhythm notes for students and readers worldwide.",
  "best-bargains.html":
    "Scan mainstream bargain lanes on VibeCart with curated retailer cards, typical savings, and direct external links so you can compare before leaving for checkout.",
  "orders-tracking.html":
    "Track VibeCart marketplace orders in one place: status, delivery context, and next actions so cross-border buyers stay aligned with sellers and carriers.",
  "account-hub.html":
    "Open your VibeCart account hub for sign-in, orders, preferences, and marketplace tools—central place to manage buyer and seller settings safely.",
  "security-overview.html":
    "Read VibeCart’s security overview for safer cross-border shopping: trust signals, payment hygiene, fraud awareness, and what to expect before you pay.",
  "policy.html":
    "Read VibeCart’s marketplace policy: buyer and seller responsibilities, fair use of lanes, and how disputes and platform rules are designed to stay transparent.",
  "terms.html":
    "Read VibeCart’s terms of service for using the marketplace, accounts, listings, and cross-border commerce features on vibe-cart.com.",
  "privacy.html":
    "Understand how VibeCart handles privacy, account data, cookies, and marketplace telemetry—and what choices you have as a buyer or seller.",
  "seller-boost.html":
    "Use VibeCart seller boost tools to improve listing clarity, conversion, and visibility with practical prompts aligned to cross-border marketplace buyers.",
  "seller-messages.html":
    "Open VibeCart seller messages to coordinate with buyers: order-tied chat, safer handoffs, and faster answers without leaving the marketplace workflow.",
  "seller-orders.html":
    "Manage VibeCart seller orders: fulfillment status, buyer context, and operational next steps for cross-border shipments and digital goods where applicable.",
  "seller-payments.html":
    "Review VibeCart seller payments and payouts: balances, settings, and transparency so marketplace income stays easy to reconcile across regions.",
  "my-listings.html":
    "Edit and review your VibeCart listings in one grid: drafts, live items, and quick paths to improve photos, pricing, and shipping clarity for buyers.",
  "marketplace-buy.html":
    "Place a VibeCart marketplace order from a live listing with buyer-safe context, delivery notes, and checkout steps that stay on official flows.",
  "plan-workspace.html":
    "Use the VibeCart plan workspace for coach and wellness subscribers: structured plans, progress notes, and workspace tools that stay separate from public shop lanes.",
  "coach-experience.html":
    "Explore the VibeCart coach experience: structured sessions, subscription context, and clear paths for clients who purchased coach access on the marketplace.",
  "insurance.html":
    "Learn how VibeCart connects students and families to insurance partners, wellbeing context, and compliant next steps—informational hub, not a binding quote engine.",
  "rewards-hub.html":
    "Open the VibeCart rewards hub for loyalty context, perks, and marketplace incentives that reward repeat cross-border shoppers and engaged sellers.",
  "legal-settings.html":
    "Adjust VibeCart legal and compliance preferences where the product exposes them, and review links to policy, privacy, and security resources in one place.",
  "lane-welcome.html":
    "Choose your VibeCart lane—buy, sell, book, or fast—and get a calmer onboarding path with clearer next taps into the live marketplace and regional folders.",
  "passport-welcome.html":
    "Start the VibeCart passport welcome flow to personalize cross-border shopping lanes while keeping sensitive data off improvised chat channels.",
  "account-welcome.html":
    "Welcome new VibeCart accounts with a short orientation: safer payments, lane-first shopping, and where to find orders, messages, and seller tools.",
  "affiliate-dashboard.html":
    "Open the VibeCart affiliate dashboard for partner metrics, traffic summaries, and compliant next steps for marketplace referral programs.",
  "audience-fit.html":
    "Use VibeCart audience fit tools to align offers and lanes with shopper segments—helpful context before you spend on listings or external promotions.",
  "fashion-trends.html":
    "Scan VibeCart fashion trends lanes for seasonal style direction and fast jumps into curated external retailers when you want to compare real storefronts.",
  "seller-bridge-toolkit.html":
    "Download mindset and checklist value from the VibeCart seller bridge toolkit: cross-border positioning, lane discipline, and practical listing habits.",
  "seller-growth-workspace.html":
    "Use the VibeCart seller growth workspace for structured experiments, AI-assisted planning, and weekly execution prompts that respect marketplace compliance.",
  "seller-live-preview.html":
    "Preview how VibeCart seller storefronts and listing blocks read to buyers before you publish—catch confusing copy early.",
  "checkout-details.html":
    "Complete VibeCart secure checkout with card hygiene reminders—official flow only; never share CVV, OTP, or PINs in chat or unofficial forms.",
  "payment-confirmation.html":
    "Confirm your VibeCart payment status and next steps after checkout—use official screens only for receipts, disputes, and order-tied messaging.",
  "coach-payment-recovery.html":
    "Restore VibeCart coach access after a failed renewal: official recovery steps, no credential sharing in chat, and links back to secure billing surfaces.",
  "top-class-checkout.html":
    "Activate VibeCart Top-Class checkout with a two-step secure flow—premium unlock stays on official payment surfaces with clear receipts.",
  "global-search.html":
    "Search VibeCart pages and open worldwide shop discovery on Google Maps, OpenStreetMap, DuckDuckGo, or Google—plus fast site-only search on vibe-cart.com."
};

function extractDescriptionFromHtml(html) {
  const head = headSlice(html);
  const one = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (one) return one[1];
  const multi = head.match(/<meta[^>]*name=["']description["'][^>]*>([\s\S]*?)<\/meta>/i);
  if (multi) {
    const c = multi[0].match(/content=["']([^"']*)["']/i);
    if (c) return c[1];
  }
  return "";
}

function hasMetaDescription(head) {
  return /<meta\s[^>]*name=["']description["']/i.test(head);
}

function hasCanonical(head) {
  return /<link\s[^>]*rel=["']canonical["']/i.test(head);
}

function hasRobots(head) {
  return /<meta\s[^>]*name=["']robots["']/i.test(head);
}

function hasOgTitle(head) {
  return /<meta\s[^>]*property=["']og:title["']/i.test(head);
}

function hasWebPageLd(head) {
  return /"@type"\s*:\s*"WebPage"/i.test(head);
}

function buildJsonLd(path, title, description) {
  const url = `${ORIGIN}/${path}`;
  const node = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: stripForOg(title) || path.replace(".html", ""),
    description: String(description).slice(0, 300),
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "VibeCart",
      url: `${ORIGIN}/`
    },
    publisher: {
      "@type": "Organization",
      name: "VibeCart",
      url: `${ORIGIN}/`
    }
  };
  return `<script type="application/ld+json">\n${JSON.stringify(node)}\n  </script>`;
}

function insertBeforeStylesheet(html, snippet) {
  const re = /<link[^>]*rel=["']stylesheet["']/i;
  const idx = html.search(re);
  if (idx === -1) {
    return html.replace(/<\/head>/i, `  ${snippet}\n</head>`);
  }
  return html.slice(0, idx) + snippet + "\n  " + html.slice(idx);
}

function packHtml(filename, html) {
  if (filename === "index.html") {
    return html;
  }
  const head = headSlice(html);
  const title = extractTitle(html);
  const path = filename;
  const existingDesc = extractDescriptionFromHtml(html);
  let desc =
    existingDesc ||
    DESCRIPTION_FALLBACK[path] ||
    `${stripForOg(title)} on VibeCart — secure cross-border marketplace lanes, trusted payments, and clear next steps for buyers and sellers.`.slice(0, 158);

  const parts = [];

  if (!hasMetaDescription(head)) {
    parts.push(`<meta name="description" content="${escapeAttr(desc)}" />`);
  } else if (existingDesc) {
    desc = existingDesc.slice(0, 320);
  }

  if (!hasRobots(head)) {
    const robotsVal = FORCE_NOINDEX_HTML.has(path) ? "noindex, nofollow" : "index, follow";
    parts.push(`<meta name="robots" content="${robotsVal}" />`);
  }

  if (!hasCanonical(head)) {
    parts.push(`<link rel="canonical" href="${ORIGIN}/${path}" />`);
  }

  if (!hasOgTitle(head)) {
    const ogTitle = escapeAttr(stripForOg(title) || "VibeCart");
    const ogDesc = escapeAttr(String(desc).slice(0, 200));
    const url = `${ORIGIN}/${path}`;
    parts.push(`<meta property="og:type" content="website" />`);
    parts.push(`<meta property="og:url" content="${url}" />`);
    parts.push(`<meta property="og:title" content="${ogTitle}" />`);
    parts.push(`<meta property="og:description" content="${ogDesc}" />`);
    parts.push(`<meta name="twitter:card" content="summary" />`);
    parts.push(`<meta name="twitter:title" content="${ogTitle}" />`);
    parts.push(`<meta name="twitter:description" content="${ogDesc}" />`);
  }

  if (!hasWebPageLd(head)) {
    parts.push(buildJsonLd(path, title, desc));
  }

  if (!parts.length) return html;

  const block = `\n  <!-- seo-google-pack -->\n  ${parts.join("\n  ")}\n`;
  return insertBeforeStylesheet(html, block);
}

function priorityFor(path) {
  if (path === "index.html" || path === "/") return 1.0;
  if (/hot-picks|live-market-shops|shop-hub/.test(path)) return 0.92;
  if (/policy|terms|privacy/.test(path)) return 0.75;
  if (/regional-shops|account-hub|sell-journey|buy-journey|bridge-hub/.test(path)) return 0.86;
  if (/wellbeing|service-provider|global-search|live-market\.html/.test(path)) return 0.8;
  return 0.7;
}

function changefreqFor(path) {
  if (/hot-picks|live-market-shops|shop-hub|index/.test(path)) return "daily";
  if (/policy|terms|privacy|security|legal-settings|payment|checkout|coach-payment|top-class/.test(path)) return "monthly";
  return "weekly";
}

function writeSitemap(files) {
  const rows = [];
  rows.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  rows.push(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);
  rows.push(`  <url>`);
  rows.push(`    <loc>${ORIGIN}/</loc>`);
  rows.push(`    <lastmod>${LASTMOD}</lastmod>`);
  rows.push(`    <changefreq>daily</changefreq>`);
  rows.push(`    <priority>1.0</priority>`);
  rows.push(`  </url>`);

  const skip = new Set([
    "admin.html",
    "admin-app.html",
    "admin-messages.html",
    "owner-access-kuda-portal.html",
    "lane-passport.html",
    "shops-europe.html",
    "shops-mama-africa.html",
    "shops-asia.html",
    "shops-scents.html",
    "shops-global.html",
    "checkout-details.html",
    "payment-confirmation.html",
    "coach-payment-recovery.html",
    "top-class-checkout.html"
  ]);

  const sorted = files.filter((f) => f.endsWith(".html") && !skip.has(f)).sort();
  for (const f of sorted) {
    const abs = path.join(ROOT, f);
    if (!fs.existsSync(abs)) continue;
    const html = fs.readFileSync(abs, "utf8");
    if (isNoindex(html)) continue;
    rows.push(`  <url>`);
    rows.push(`    <loc>${ORIGIN}/${f}</loc>`);
    rows.push(`    <lastmod>${LASTMOD}</lastmod>`);
    rows.push(`    <changefreq>${changefreqFor(f)}</changefreq>`);
    rows.push(`    <priority>${priorityFor(f).toFixed(2)}</priority>`);
    rows.push(`  </url>`);
  }
  rows.push(`</urlset>`);
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), rows.join("\n") + "\n", "utf8");
}

let updated = 0;
const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));

for (const name of htmlFiles) {
  const abs = path.join(ROOT, name);
  let html = fs.readFileSync(abs, "utf8");
  if (name === "index.html") {
    continue;
  }
  if (isNoindex(html) && !FORCE_NOINDEX_HTML.has(name) && !REGIONAL_NOINDEX_HTML.has(name)) continue;
  const next = packHtml(name, html);
  if (next !== html) {
    fs.writeFileSync(abs, next, "utf8");
    updated++;
  }
}

writeSitemap(htmlFiles);

const robotsPath = path.join(ROOT, "robots.txt");
let robots = fs.readFileSync(robotsPath, "utf8");
if (!robots.includes("Disallow: /checkout-details.html")) {
  robots = robots.replace(
    "Disallow: /owner-access-kuda-portal.html\n",
    "Disallow: /owner-access-kuda-portal.html\nDisallow: /checkout-details.html\nDisallow: /payment-confirmation.html\nDisallow: /coach-payment-recovery.html\nDisallow: /top-class-checkout.html\n"
  );
  fs.writeFileSync(robotsPath, robots, "utf8");
}

console.log("seo-google-pack:", { htmlUpdated: updated, sitemap: "sitemap.xml" });
