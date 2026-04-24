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
  assertIncludes(lite, "advancedVisualRhythmV1", "visual rhythm feature flag");
  assertIncludes(lite, "initVisualRhythmLite()", "visual rhythm lite init");
  assertIncludes(lite, "advancedAtmosphereDeckV1", "atmosphere deck feature flag");
  assertIncludes(lite, "initAtmosphereDeckLite()", "atmosphere deck lite init");
  assertIncludes(lite, "advancedPersonaChooserV1", "persona chooser feature flag");
  assertIncludes(lite, "initPersonaChooserLite()", "persona chooser lite init");
  assertIncludes(lite, "advancedListingHealthV1", "listing health feature flag");
  assertIncludes(lite, "initListingHealthLite()", "listing health lite init");
  assertIncludes(lite, "advancedBridgeFaqCopyV1", "bridge faq copy feature flag");
  assertIncludes(lite, "initBridgeFaqCopyLite()", "bridge faq copy lite init");
  assertIncludes(lite, "advancedDetailsMemoryV1", "details memory feature flag");
  assertIncludes(lite, "initDetailsMemoryLite()", "details memory lite init");
  assertIncludes(lite, "advancedMobileQuickNavV1", "mobile quick nav feature flag");
  assertIncludes(lite, "initMobileQuickNavLite()", "mobile quick nav lite init");
  assertIncludes(lite, "advancedSellerReadinessV1", "seller readiness feature flag");
  assertIncludes(lite, "initSellerReadinessLite()", "seller readiness lite init");
  assertIncludes(lite, "advancedCheckoutClarityV1", "checkout clarity feature flag");
  assertIncludes(lite, "initCheckoutClarityLite()", "checkout clarity lite init");
  assertIncludes(lite, "advancedSellerNextActionV1", "seller next action feature flag");
  assertIncludes(lite, "initSellerNextActionLite()", "seller next action lite init");
  assertIncludes(lite, "advancedPartnerPinV1", "partner pin feature flag");
  assertIncludes(lite, "initPartnerPinLite()", "partner pin lite init");
  assertIncludes(lite, "advancedBuyerQuickStartV1", "buyer quick start feature flag");
  assertIncludes(lite, "initBuyerQuickStartLite()", "buyer quick start lite init");
  assertIncludes(lite, "advancedSellerMomentumV1", "seller momentum feature flag");
  assertIncludes(lite, "initSellerMomentumLite()", "seller momentum lite init");
  assertIncludes(lite, "advancedPartnerRecallV1", "partner recall feature flag");
  assertIncludes(lite, "initPartnerRecallLite()", "partner recall lite init");
  assertIncludes(lite, "advancedVisualJourneyV1", "visual journey feature flag");
  assertIncludes(lite, "initVisualJourneyLite()", "visual journey lite init");
  assertIncludes(lite, "advancedInstallPromptV1", "install prompt feature flag");
  assertIncludes(lite, "initInstallPromptLite()", "install prompt lite init");
  assertIncludes(lite, "advancedPwaBootstrapV1", "pwa bootstrap feature flag");
  assertIncludes(lite, "initPwaBootstrapLite()", "pwa bootstrap lite init");
  assertIncludes(lite, "advancedHealthCoachIntelV1", "health coach intel feature flag");
  assertIncludes(lite, "initHealthCoachIntelLite()", "health coach intel lite init");
  assertIncludes(lite, "advancedSellerGrowthIntelV1", "seller growth intel feature flag");
  assertIncludes(lite, "initSellerGrowthIntelLite()", "seller growth intel lite init");

  // Guard against accidental reintroduction of old risky route.
  assertNotIncludes(lite, "buy-journey.html?flow=buy&lane=fashion", "legacy fashion-lane redirect");

  console.log("smoke-homepage-lite: all checks passed");
}

main();

