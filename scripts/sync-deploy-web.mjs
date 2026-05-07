#!/usr/bin/env node
/**
 * Keeps deploy-web/ (Netlify publish root) in sync with source files at repo root.
 * Run on every Netlify build so production always matches the tree you commit.
 *
 * Strategy:
 * 1. For every file under deploy-web/, copy from ../<same-relative-path> when it exists at repo root.
 * 2. Copy all root *.html (new pages land in deploy without manually duplicating once).
 * 3. Copy known root static assets (styles, icon, robots, manifest, SW).
 * 4. Recursive copy media/, vendor/, mobile-app/ (excluding mobile-app/node_modules).
 * 5. Optionally mirror deploy-web/ → vibecart-netlify/ (SKIP_NETLIFY_MIRROR=1 to skip).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEPLOY = path.join(ROOT, "deploy-web");
const NETLIFY = path.join(ROOT, "vibecart-netlify");

const SKIP_NAMES = new Set(["node_modules", ".git", ".cursor", ".netlify"]);

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

/** Walk deploy-web; refresh from ROOT when a matching path exists. */
function syncDeployTreeFromRoot() {
  let updated = 0;
  let missing = 0;
  function walk(rel) {
    const abs = path.join(DEPLOY, rel);
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
        if (SKIP_NAMES.has(ent.name)) continue;
        walk(rel ? path.join(rel, ent.name) : ent.name);
      }
      return;
    }
    const src = path.join(ROOT, rel);
    if (exists(src)) {
      copyFile(src, abs);
      updated += 1;
    } else {
      missing += 1;
    }
  }
  walk("");
  return { updated, missing };
}

function copyRootHtmlAndStatics() {
  let n = 0;
  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isFile()) continue;
    if (ent.name.endsWith(".html")) {
      copyFile(path.join(ROOT, ent.name), path.join(DEPLOY, ent.name));
      n += 1;
    }
  }
  for (const name of [
    "styles.css",
    "icon.svg",
    "robots.txt",
    "sitemap.xml",
    "manifest.json",
    "service-worker.js"
  ]) {
    const src = path.join(ROOT, name);
    if (exists(src)) {
      copyFile(src, path.join(DEPLOY, name));
      n += 1;
    }
  }
  return n;
}

/** Root client bundles allowed to appear in deploy-web even before a first manual copy exists there. */
const ROOT_JS_ALWAYS_DEPLOY = new Set([
  "seller-growth-workspace.js",
  "seller-bridge-toolkit.js",
  "seller-messages.js",
  "seller-payments.js",
  "orders-tracking.js",
  "fashion-deals.js",
  "best-bargains.js",
  "electronics-deals.js",
  "books-study-deals.js"
]);

/** Only copy root .js files that already exist in deploy-web (avoids shipping server bundles). */
function syncExistingRootJs() {
  let n = 0;
  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".js")) continue;
    const dst = path.join(DEPLOY, ent.name);
    if (!exists(dst) && !ROOT_JS_ALWAYS_DEPLOY.has(ent.name)) continue;
    const src = path.join(ROOT, ent.name);
    copyFile(src, dst);
    n += 1;
  }
  return n;
}

function copyDirFiltered(srcDir, dstDir, filter) {
  if (!exists(srcDir)) return 0;
  fs.mkdirSync(dstDir, { recursive: true });
  let count = 0;
  function walk(rel) {
    const from = path.join(srcDir, rel);
    const st = fs.statSync(from);
    if (st.isDirectory()) {
      if (filter && !filter(from, rel, true)) return;
      for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
        if (SKIP_NAMES.has(ent.name)) continue;
        walk(rel ? path.join(rel, ent.name) : ent.name);
      }
      return;
    }
    if (filter && !filter(from, rel, false)) return;
    const to = path.join(dstDir, rel);
    copyFile(from, to);
    count += 1;
  }
  walk("");
  return count;
}

function syncMobileApp() {
  const src = path.join(ROOT, "mobile-app");
  const dst = path.join(DEPLOY, "mobile-app");
  if (!exists(src)) return 0;
  if (exists(dst)) {
    fs.rmSync(dst, { recursive: true, force: true });
  }
  const filter = (_abs, rel, isDir) => {
    return !String(rel || "").split(path.sep).includes("node_modules");
  };
  return copyDirFiltered(src, dst, filter);
}

function mirrorDeployToNetlify() {
  if (process.env.SKIP_NETLIFY_MIRROR === "1") {
    console.log("sync-deploy-web: SKIP_NETLIFY_MIRROR=1 — not mirroring to vibecart-netlify/");
    return;
  }
  if (!exists(NETLIFY)) {
    console.warn("sync-deploy-web: vibecart-netlify/ missing, skip mirror.");
    return;
  }
  fs.cpSync(DEPLOY, NETLIFY, { recursive: true, force: true });
  console.log("sync-deploy-web: mirrored deploy-web/ → vibecart-netlify/");
}

function main() {
  if (!exists(DEPLOY)) {
    console.error("sync-deploy-web: deploy-web/ not found.");
    process.exit(1);
  }
  const a = syncDeployTreeFromRoot();
  const b = copyRootHtmlAndStatics();
  const c = syncExistingRootJs();
  let d = 0;
  for (const dir of ["media", "vendor"]) {
    d += copyDirFiltered(path.join(ROOT, dir), path.join(DEPLOY, dir), null);
  }
  d += syncMobileApp();
  console.log(
    `sync-deploy-web: deploy-web refreshed (tree files from root: ${a.updated}, root-only missing sources: ${a.missing}, html+static writes: ${b}, existing js refreshed: ${c}, dir/mobile files: ${d}).`
  );
  mirrorDeployToNetlify();
}

main();
