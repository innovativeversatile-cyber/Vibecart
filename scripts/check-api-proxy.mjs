/**
 * Reads netlify.toml proxy target and probes /api/health on Railway + via vibe-cart.com.
 * Run from repo root: node scripts/check-api-proxy.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tomlPath = path.join(root, "netlify.toml");
const toml = fs.readFileSync(tomlPath, "utf8");
const m = toml.match(/to\s*=\s*"https:\/\/([^/]+)\/api\/:splat"/);
if (!m) {
  console.error("Could not parse Railway host from netlify.toml");
  process.exit(1);
}
const railwayHost = m[1];

async function probe(label, url) {
  try {
    const r = await fetch(url, { redirect: "follow" });
    const text = await r.text();
    const slice = text.replace(/\s+/g, " ").slice(0, 140);
    console.log(`${label} ${r.status} ${url}`);
    console.log(`  body: ${slice}`);
    return r.ok;
  } catch (e) {
    console.log(`${label} ERROR ${url}`);
    console.log(`  ${e.message || e}`);
    return false;
  }
}

console.log("Railway host from netlify.toml:", railwayHost);
console.log("");
await probe("Direct Railway", `https://${railwayHost}/api/health`);
console.log("");
await probe("Via Netlify site", "https://vibe-cart.com/api/health");
