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

function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    throw new Error(`Unexpected content: ${label} -> ${needle}`);
  }
}

function main() {
  const index = read("index.html");
  const lite = read("homepage-min.js");

  // Frozen homepage script surface.
  assertIncludes(index, 'src="./homepage-min.js', "homepage-min loaded");
  assertIncludes(index, 'src="./script-safe.js', "script-safe loaded");
  assertNotIncludes(index, 'src="./script.js', "main script.js should stay disabled on homepage");

  // Core CTA behavior should remain direct and deterministic.
  assertIncludes(index, '/api/public/shop/redirect?shop=Amazon%20Electronics', "Open shop direct redirect link");
  assertIncludes(index, 'href="#market" class="btn btn-primary"', "Shop Now is in-page anchor");

  // Minimal script responsibilities (safe local interactions).
  assertIncludes(lite, "initCategoryFilter()", "category filter init");
  assertIncludes(lite, "initBridgePathToggle()", "bridge toggle init");
  assertIncludes(lite, "initAiAssistantLite()", "AI lite init");
  assertIncludes(lite, "initTrackingLite()", "tracking lite init");
  assertIncludes(lite, "initBookingLite()", "booking lite init");
  assertIncludes(lite, "initAdsLite()", "ads lite init");
  assertIncludes(lite, "initInsuranceLite()", "insurance lite init");
  assertIncludes(lite, "initInsuranceTipsLite()", "tips lite init");
  assertIncludes(lite, "initHealthCoachLite()", "health coach lite init");
  assertIncludes(lite, "initRewardsLite()", "rewards lite init");
  assertIncludes(lite, "initCommunicationLite()", "communication lite init");
  assertIncludes(lite, "advancedShockReelV1", "shock reel feature flag");
  assertIncludes(lite, "initShockReelLite()", "shock reel lite init");
  assertIncludes(lite, "advancedEpicCarouselV1", "epic carousel feature flag");
  assertIncludes(lite, "initEpicCarouselLite()", "epic carousel lite init");

  // Guard against accidental reintroduction of old risky route.
  assertNotIncludes(lite, "buy-journey.html?flow=buy&lane=fashion", "legacy fashion-lane redirect");

  console.log("smoke-homepage-lite: all checks passed");
}

main();

