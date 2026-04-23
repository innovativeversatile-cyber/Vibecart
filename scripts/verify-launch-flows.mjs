import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const web = path.join(root, "deploy-web");

function read(rel) {
  return fs.readFileSync(path.join(web, rel), "utf8");
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Missing expectation: ${label} -> ${needle}`);
  }
}

function assertFile(rel) {
  const full = path.join(web, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing file: ${rel}`);
  }
}

function main() {
  assertFile("world-shop-experience.html");
  assertFile("coach-experience.html");
  assertFile("seller-live-preview.html");
  assertFile("sell-journey.js");

  const hot = read("hot-picks.html");
  assertIncludes(hot, 'href="./world-shop-experience.html"', "Hot picks primary CTA");

  const wb = read("wellbeing.html");
  assertIncludes(wb, "./coach-experience.html?flow=coach&plan=starter", "Coach starter preview link");
  assertIncludes(wb, "./coach-experience.html?flow=coach&plan=pro", "Coach pro preview link");

  const sell = read("sell-journey.html");
  assertIncludes(sell, 'id="sellStep2Continue"', "Seller step2 validation button");
  assertIncludes(sell, 'id="sellStep3Continue"', "Seller step3 validation button");
  assertIncludes(sell, 'href="./seller-live-preview.html"', "Seller preview route");

  const sellJs = read("sell-journey.js");
  assertIncludes(sellJs, "Add at least one photo", "Seller photo/title validation");
  assertIncludes(sellJs, "Select shipping mode and realistic delivery window", "Seller shipping validation");

  const script = read("script.js");
  assertIncludes(script, "initScrollPositionRestore", "Home scroll restore");

  const chrome = read("site-chrome.js");
  assertIncludes(chrome, "initLaneScrollRestore", "Lane scroll restore");

  console.log("verify-launch-flows: all checks passed");
}

main();
