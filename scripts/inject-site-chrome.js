"use strict";

const fs = require("fs");
const path = require("path");

const deployDir = path.join(__dirname, "..", "deploy-web");
const tag = '<script src="./site-chrome.js?v=20260421chrome1" defer></script>';

const files = fs.readdirSync(deployDir).filter((f) => f.endsWith(".html"));

let updated = 0;
for (const file of files) {
  const full = path.join(deployDir, file);
  let html = fs.readFileSync(full, "utf8");
  if (!html.includes("shops-lane-topbar")) {
    continue;
  }
  if (html.includes("site-chrome.js")) {
    continue;
  }
  if (!html.includes("</body>")) {
    continue;
  }
  const next = html.replace("</body>", `  ${tag}\n</body>`);
  if (next === html) {
    continue;
  }
  fs.writeFileSync(full, next, "utf8");
  updated += 1;
  console.log("patched", file);
}
console.log("done, updated", updated);
