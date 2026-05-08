#!/usr/bin/env node
/**
 * Appends visitor-retention.js before </body> for HTML that uses shop/home layouts
 * but does not already load site-chrome.js (pages with site-chrome load retention via prepend-retention-before-chrome.mjs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TAG = '  <script src="./visitor-retention.js?v=20260508ret4" defer></script>\n';

let n = 0;
for (const name of fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"))) {
  const abs = path.join(ROOT, name);
  let html = fs.readFileSync(abs, "utf8");
  if (html.includes("visitor-retention.js")) continue;
  if (html.includes("site-chrome.js")) continue;
  const isShop = html.includes("shops-lane-page");
  const isHome = html.includes("vc-layout-exclusive") || html.includes("vc-premium-unified");
  if (!isShop && !isHome) continue;
  if (!html.includes("</body>")) continue;
  html = html.replace("</body>", TAG + "</body>");
  fs.writeFileSync(abs, html, "utf8");
  n++;
}
console.log("append-visitor-retention:", n);
