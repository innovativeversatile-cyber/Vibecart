/**
 * Static integrity: every same-origin asset link in deploy-web/*.html resolves on disk.
 * Run: node scripts/audit-static-links.mjs
 *
 * Does not prove JS-driven navigation or API availability — only that HTML-declared
 * relative targets exist so clicks do not 404 as static files.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const deployWeb = path.join(root, "deploy-web");

const fails = [];
const warns = [];

function walkHtmlFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => path.join(dir, f));
}

function stripHtmlEntities(s) {
  return String(s || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

/** Pull href="..." / href='...' from raw HTML (no full parser). */
function extractHrefs(html) {
  const out = [];
  const re = /\bhref\s*=\s*(["'])([^"']*)\1/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(stripHtmlEntities(m[2].trim()));
  }
  return out;
}

function extractLocalAssetRefs(html) {
  const out = [];
  const re = /\b(?:src|href)\s*=\s*(["'])(\.\/[^"']+)\1/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(stripHtmlEntities(m[2].trim()));
  }
  return out;
}

function resolveFromDeployWeb(href) {
  const h = String(href || "").trim();
  if (!h || h === "#") return { kind: "empty_hash" };
  if (h.startsWith("http://") || h.startsWith("https://")) return { kind: "external" };
  if (h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("javascript:") || h.startsWith("data:")) {
    return { kind: "scheme", raw: h };
  }
  if (h.startsWith("/api/") || h.startsWith("/api?")) return { kind: "api" };
  if (h.startsWith("//")) return { kind: "protocol_relative" };

  let pathname = h.split("#")[0].split("?")[0];
  if (pathname.startsWith("/")) {
    pathname = pathname.replace(/^\//, "");
  } else if (!pathname.startsWith(".")) {
    pathname = "./" + pathname;
  }
  const normalized = path.normalize(path.join(deployWeb, pathname));
  if (!normalized.startsWith(deployWeb)) {
    return { kind: "escape", raw: h };
  }
  return { kind: "file", abs: normalized, raw: h };
}

function idExistsInHtml(html, frag) {
  if (!frag) return true;
  const id = frag.replace(/^#/, "");
  if (!id) return true;
  const re = new RegExp(`\\bid\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i");
  return re.test(html);
}

/** BFS over static .html href graph from a start page (same folder). */
function reachableFrom(startBasename, graph) {
  const seen = new Set();
  const q = [startBasename];
  seen.add(startBasename);
  while (q.length) {
    const n = q.shift();
    for (const nb of graph.get(n) || []) {
      if (!seen.has(nb)) {
        seen.add(nb);
        q.push(nb);
      }
    }
  }
  return seen;
}

const ADMIN_ISLAND = /^(admin\.html|admin-app\.html|admin-messages\.html|owner-access-kuda-portal\.html)$/i;

/** Scripted continuation anchors (not visible in HTML href crawl). */
const FLOW_FILE_ASSERTIONS = [
  { rel: "buy-journey.js", needles: ["./checkout-details.html"] },
  { rel: "sell-journey.js", needles: ["sellPublishBtn", "/api/public/products/publish"] },
  { rel: "checkout-details.js", needles: ["sessionStorage.setItem", "vibecart-final-payment"] }
];

function assertFlowAnchors() {
  for (const { rel, needles } of FLOW_FILE_ASSERTIONS) {
    const abs = path.join(deployWeb, rel);
    if (!fs.existsSync(abs)) {
      fails.push({ file: rel, href: "(flow)", msg: "flow anchor file missing" });
      continue;
    }
    const body = fs.readFileSync(abs, "utf8");
    for (const needle of needles) {
      if (!body.includes(needle)) {
        fails.push({ file: rel, href: needle, msg: "expected flow string missing" });
      }
    }
  }
}

function main() {
  const htmlPaths = walkHtmlFiles(deployWeb);
  const graph = new Map();

  for (const filePath of htmlPaths) {
    const base = path.basename(filePath);
    const html = fs.readFileSync(filePath, "utf8");
    const hrefs = extractHrefs(html);
    const assets = extractLocalAssetRefs(html);
    const outbound = new Set();

    for (const raw of [...hrefs, ...assets]) {
      if (raw === "#" || raw === "") {
        warns.push({ file: base, href: raw || "(empty)", msg: "href is # or empty — may rely on JS" });
        continue;
      }
      if (raw.startsWith("#") && raw.length > 1) {
        if (!idExistsInHtml(html, raw)) {
          warns.push({ file: base, href: raw, msg: "fragment id not found in same file" });
        }
        continue;
      }

      const r = resolveFromDeployWeb(raw);
      if (r.kind === "external" || r.kind === "api" || r.kind === "scheme" || r.kind === "protocol_relative") {
        continue;
      }
      if (r.kind === "empty_hash") {
        warns.push({ file: base, href: "#", msg: "bare hash link" });
        continue;
      }
      if (r.kind === "escape") {
        fails.push({ file: base, href: raw, msg: "path escapes deploy-web" });
        continue;
      }
      if (r.kind !== "file") continue;

      if (!fs.existsSync(r.abs)) {
        fails.push({ file: base, href: raw, msg: `missing → ${path.relative(root, r.abs)}` });
      } else {
        if (r.abs.endsWith(".html")) {
          outbound.add(path.basename(r.abs));
        }
      }
    }

    graph.set(base, [...outbound]);
  }

  assertFlowAnchors();

  const allBasenames = new Set(htmlPaths.map((p) => path.basename(p)));
  const fromHome = reachableFrom("index.html", graph);
  const notFromHomeStatic = [...allBasenames].filter((name) => !fromHome.has(name) && !ADMIN_ISLAND.test(name));

  console.log(`audit-static-links: scanned ${htmlPaths.length} HTML files in deploy-web/`);
  console.log(
    `audit-static-links: from index.html static href graph, reachable ${fromHome.size}/${allBasenames.size} .html pages`
  );
  if (notFromHomeStatic.length) {
    console.log(
      `audit-static-links: INFO ${notFromHomeStatic.length} page(s) not in index.html static href graph (often OK: site-chrome, JSON-LD, return-only flows, deep links): ${notFromHomeStatic.sort().join(", ")}`
    );
  }

  warns.forEach((w) => {
    console.warn(`WARN ${w.file} | ${w.href} | ${w.msg}`);
  });

  if (fails.length) {
    fails.forEach((f) => {
      console.error(`FAIL ${f.file} | ${f.href} | ${f.msg}`);
    });
    console.error(`\naudit-static-links: ${fails.length} broken target(s), ${warns.length} warning(s)`);
    process.exit(1);
  }

  console.log(`audit-static-links: OK — no missing local targets (${warns.length} optional warning(s))`);
  process.exit(0);
}

main();
