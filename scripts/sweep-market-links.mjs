#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const files = [
  path.join(root, "live-market-shops.js"),
  path.join(root, "hot-picks.js")
];

function unique(list) {
  return Array.from(new Set(list));
}

function extractUrlsFromFile(filePath) {
  const body = fs.readFileSync(filePath, "utf8");
  const urls = [];
  const re = /https:\/\/[^\s"'`),]+/g;
  let m;
  while ((m = re.exec(body))) {
    urls.push(m[0]);
  }
  return urls;
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (!res.ok || res.status >= 400) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return { url, ok: res.ok, status: res.status, finalUrl: res.url };
  } catch (err) {
    return { url, ok: false, status: 0, finalUrl: "", error: String(err && err.message ? err.message : err) };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const strict = process.argv.includes("--strict");
  const urls = unique(files.flatMap(extractUrlsFromFile));
  const out = [];
  for (const url of urls) {
    // Ignore static image helper URLs used as placeholders.
    if (
      url.includes("images.unsplash.com") ||
      url.includes("picsum.photos") ||
      url.includes("source.unsplash.com") ||
      url.includes("google.com/s2/favicons")
    ) {
      continue;
    }
    out.push(await probe(url));
  }

  const failed = out.filter((x) => !x.ok);
  const passed = out.filter((x) => x.ok);

  console.log(`sweep-market-links: checked ${out.length} outbound links`);
  console.log(`sweep-market-links: pass ${passed.length}, fail ${failed.length}`);
  failed.forEach((row) => {
    console.log(`FAIL ${row.status || "ERR"} ${row.url}${row.error ? " :: " + row.error : ""}`);
  });

  if (strict && failed.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("sweep-market-links failed:", err);
  process.exit(1);
});
