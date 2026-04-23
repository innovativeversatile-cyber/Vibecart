import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const deployWeb = path.join(root, "deploy-web");

const SITE_BASE = String(process.env.READINESS_SITE_BASE || "https://vibe-cart.com").replace(/\/$/, "");
const results = [];

function ok(label, detail = "") {
  results.push({ pass: true, label, detail });
  console.log(`OK   ${label}${detail ? ` | ${detail}` : ""}`);
}

function fail(label, detail = "") {
  results.push({ pass: false, label, detail });
  console.error(`FAIL ${label}${detail ? ` | ${detail}` : ""}`);
}

async function fetchWithTiming(url, opts = {}) {
  const start = Date.now();
  const response = await fetch(url, opts);
  const elapsedMs = Date.now() - start;
  return { response, elapsedMs };
}

async function checkSecurityHeaders() {
  const { response } = await fetchWithTiming(`${SITE_BASE}/`, { method: "GET", redirect: "follow" });
  const required = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy"
  ];
  required.forEach((h) => {
    if (response.headers.get(h)) ok(`SECURITY header ${h}`);
    else fail(`SECURITY header ${h}`, "missing");
  });
}

function fileIncludes(filePath, snippets) {
  const body = fs.readFileSync(filePath, "utf8");
  return snippets.every((s) => body.includes(s));
}

function fileMatchesAll(filePath, patterns) {
  const body = fs.readFileSync(filePath, "utf8");
  return patterns.every((re) => re.test(body));
}

function checkSeoMeta() {
  const checks = [
    {
      file: "index.html",
      patterns: [
        /<meta[\s\S]*name=["']description["']/i,
        /<link[\s\S]*rel=["']canonical["']/i,
        /<meta[\s\S]*property=["']og:title["']/i,
        /<meta[\s\S]*name=["']twitter:card["']/i
      ]
    },
    {
      file: "hot-picks.html",
      patterns: [
        /<meta[\s\S]*name=["']description["']/i,
        /<link[\s\S]*rel=["']canonical["']/i,
        /<meta[\s\S]*property=["']og:title["']/i,
        /<meta[\s\S]*name=["']twitter:card["']/i
      ]
    },
    {
      file: "world-shop-experience.html",
      patterns: [
        /<meta[\s\S]*name=["']description["']/i,
        /<link[\s\S]*rel=["']canonical["']/i,
        /<meta[\s\S]*property=["']og:title["']/i,
        /<meta[\s\S]*name=["']twitter:card["']/i
      ]
    }
  ];
  checks.forEach((check) => {
    const full = path.join(deployWeb, check.file);
    if (fileMatchesAll(full, check.patterns)) ok(`SEO ${check.file}`, "meta set present");
    else fail(`SEO ${check.file}`, "missing canonical/og/twitter/description tags");
  });
}

function checkLegalLinks() {
  const full = path.join(deployWeb, "index.html");
  const requiredLinks = ["./terms.html", "./privacy.html", "./policy.html"];
  if (fileIncludes(full, requiredLinks)) ok("LEGAL homepage links", "terms/privacy/policy present");
  else fail("LEGAL homepage links", "required legal links missing");
}

async function checkPerformanceSanity() {
  const samples = [];
  for (let i = 0; i < 5; i += 1) {
    const { response, elapsedMs } = await fetchWithTiming(`${SITE_BASE}/index.html`, { method: "GET", redirect: "follow" });
    if (!response.ok) {
      fail("PERF index.html", `HTTP ${response.status}`);
      return;
    }
    samples.push(elapsedMs);
  }
  const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  const p95 = samples.slice().sort((a, b) => a - b)[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))];
  if (avg <= 2500) ok("PERF index.html avg", `${avg}ms`);
  else fail("PERF index.html avg", `${avg}ms (>2500ms)`);
  if (p95 <= 4000) ok("PERF index.html p95", `${p95}ms`);
  else fail("PERF index.html p95", `${p95}ms (>4000ms)`);
}

function runQaScripts() {
  try {
    execSync("node scripts/verify-launch-flows.mjs", { cwd: root, stdio: "pipe" });
    ok("QA verify-launch-flows");
  } catch (error) {
    fail("QA verify-launch-flows", String(error?.message || error));
  }
  try {
    execSync("node scripts/run-full-smoke.mjs", {
      cwd: root,
      stdio: "pipe",
      env: { ...process.env, SMOKE_MUTATIONS: "0", SMOKE_SITE_BASE: SITE_BASE }
    });
    ok("QA smoke full", "mutations disabled");
  } catch (error) {
    fail("QA smoke full", String(error?.message || error));
  }
}

console.log(`Production readiness gate for ${SITE_BASE}`);
await checkSecurityHeaders();
checkSeoMeta();
checkLegalLinks();
await checkPerformanceSanity();
runQaScripts();

const failed = results.filter((r) => !r.pass);
console.log(`\nReadiness summary: ${results.length - failed.length}/${results.length} passing`);
if (failed.length) {
  failed.forEach((f) => console.error(`- ${f.label}: ${f.detail}`));
  process.exit(1);
}
process.exit(0);

