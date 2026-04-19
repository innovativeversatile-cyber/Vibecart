/**
 * Compares vibe-cart.com DNS to Netlify load balancer targets.
 * Run: node scripts/diagnose-vibe-cart-dns.mjs
 * Does not need secrets. Uses Node 18+ dns.promises.
 */
import dns from "node:dns/promises";
import { setTimeout as delay } from "node:timers/promises";

const APEX = "vibe-cart.com";
const NETLIFY_APP = "vibecart-marketplace.netlify.app";
const LB_HOST = "apex-loadbalancer.netlify.com";

const DOC_A_FALLBACK = ["75.2.60.5", "99.83.231.61"];

async function ipv4(name) {
  try {
    const rows = await dns.lookup(name, { all: true });
    return rows
      .filter((x) => x.family === 4)
      .map((x) => x.address)
      .sort();
  } catch {
    return [];
  }
}

function sameSet(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

async function probeHttp(label, url) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 12000);
    const r = await fetch(url, { signal: ac.signal, redirect: "follow" });
    clearTimeout(t);
    const text = await r.text();
    const slice = text.replace(/\s+/g, " ").slice(0, 80);
    console.log(`${label}: HTTP ${r.status} — ${slice}`);
    return r.ok;
  } catch (e) {
    console.log(`${label}: FAILED — ${e.cause?.message || e.message || e}`);
    return false;
  }
}

console.log("VibeCart DNS / reachability check\n");

const apexA = await ipv4(APEX);
const appA = await ipv4(NETLIFY_APP);
const lbA = await ipv4(LB_HOST);

console.log(`A records  ${APEX}:`, apexA.length ? apexA.join(", ") : "(none / NXDOMAIN)");
console.log(`A records  ${NETLIFY_APP}:`, appA.length ? appA.join(", ") : "(none)");
console.log(`A records  ${LB_HOST}:`, lbA.length ? lbA.join(", ") : "(none)");
console.log("");

const matchesLb = apexA.length && lbA.length && apexA.every((ip) => lbA.includes(ip));
const matchesDocFallback = apexA.length && apexA.every((ip) => DOC_A_FALLBACK.includes(ip));

if (matchesLb || matchesDocFallback) {
  console.log("Apex A records look aligned with Netlify load balancer targets.");
} else if (apexA.length) {
  console.log("PROBLEM: Apex A records do NOT match Netlify load balancer IPs.");
  console.log(`  Expected (docs fallback): ${DOC_A_FALLBACK.join(" or ")}`);
  console.log(`  Or same set as: ${LB_HOST} → ${lbA.join(", ")}`);
  console.log("  Fix: Netlify → Domains → DNS for vibe-cart.com → remove wrong A records,");
  console.log("       add what Netlify shows (often ALIAS to apex-loadbalancer.netlify.com,");
  console.log("       or A records 75.2.60.5 + 99.83.231.61 per external DNS docs).");
} else {
  console.log("No IPv4 A records found for apex (check DNS / propagation).");
}

console.log("");
await probeHttp("HTTPS custom domain", `https://${APEX}/`);
await delay(200);
await probeHttp("HTTPS Netlify default host", `https://${NETLIFY_APP}/`);

console.log("");
console.log("Temporary workaround: use https://" + NETLIFY_APP + "/ until apex DNS is fixed.");
