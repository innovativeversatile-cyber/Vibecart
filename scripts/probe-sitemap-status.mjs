#!/usr/bin/env node
/** Probe sitemap URLs on production for non-200 status. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const xml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const extra = [
  "https://vibe-cart.com/index.html",
  "https://www.vibe-cart.com/",
  "https://www.vibe-cart.com/shop-hub.html",
  "https://vibe-cart.com/medication-support.html",
  "https://vibe-cart.com/shops-europe.html",
  "https://vibe-cart.com/admin.html"
];

const all = [...new Set([...urls, ...extra])];
const bad = [];

for (const url of all) {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": "VibeCart-SEO-Probe/1" } });
    if (res.status >= 400) {
      bad.push({ url, status: res.status });
    }
  } catch (e) {
    bad.push({ url, status: "ERR", err: String(e.message || e) });
  }
}

console.log("probed", all.length, "urls");
if (bad.length) {
  console.log("issues:");
  bad.forEach((b) => console.log(b.status, b.url, b.err || ""));
  process.exitCode = 1;
} else {
  console.log("all OK");
}
