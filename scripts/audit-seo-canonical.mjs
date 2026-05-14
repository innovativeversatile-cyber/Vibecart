#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmls = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
const issues = { noCanonical: [], noindexNoCanonical: [], duplicateCanonical: [], noindex: [] };

for (const f of htmls) {
  const c = fs.readFileSync(path.join(ROOT, f), "utf8");
  const end = c.indexOf("</head>");
  const head = end > 0 ? c.slice(0, end) : c.slice(0, 5000);
  const cans = (head.match(/rel=["']canonical["']/gi) || []).length;
  const noindex = /noindex/i.test(head);
  if (noindex) issues.noindex.push(f);
  if (cans === 0) issues.noCanonical.push(f);
  if (noindex && cans === 0) issues.noindexNoCanonical.push(f);
  if (cans > 1) issues.duplicateCanonical.push(f);
}

console.log(JSON.stringify(issues, null, 2));
