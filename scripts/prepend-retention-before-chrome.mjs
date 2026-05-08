#!/usr/bin/env node
/**
 * Ensures visitor-retention.js loads as a normal deferred script before site-chrome.js
 * on every page that uses site-chrome (dynamic injection proved flaky in production).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RET = '<script src="./visitor-retention.js?v=20260508ret4" defer></script>';

let touched = 0;
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isFile() || !ent.name.endsWith(".html")) continue;
  const fp = path.join(ROOT, ent.name);
  let s = fs.readFileSync(fp, "utf8");
  if (!s.includes("site-chrome.js")) continue;
  if (s.includes("visitor-retention.js")) continue;
  const m = s.match(/(\s*)<script\s+src="\.\/site-chrome\.js[^"]*"\s*defer>\s*<\/script>/);
  if (!m) {
    console.warn("skip (no site-chrome defer match):", ent.name);
    continue;
  }
  const replaced = s.replace(
    /(\s*)<script\s+src="\.\/site-chrome\.js[^"]*"\s*defer>\s*<\/script>/,
    m[1] + RET + "\n" + m[0]
  );
  if (replaced === s) continue;
  fs.writeFileSync(fp, replaced, "utf8");
  touched += 1;
}
console.log("prepend-retention-before-chrome:", touched, "html files");
