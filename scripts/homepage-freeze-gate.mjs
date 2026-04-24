import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(haystack, needle, label) {
  assert(haystack.includes(needle), `Missing expectation: ${label} -> ${needle}`);
}

function assertNotIncludes(haystack, needle, label) {
  assert(!haystack.includes(needle), `Unexpected content: ${label} -> ${needle}`);
}

function assertMirrorEqual(aRel, bRel) {
  const a = read(aRel);
  const b = read(bRel);
  assert(a === b, `Mirror drift detected: ${aRel} != ${bRel}`);
}

function checkLocationAssignUsage(lite) {
  const matches = lite.match(/window\.location\.assign\(/g) || [];
  assert(matches.length === 1, `Expected exactly 1 window.location.assign usage, found ${matches.length}`);
  assertIncludes(lite, 'window.location.assign("./global-search.html?q=" + encodeURIComponent(q));', "search-only assign");
}

function main() {
  const index = read("deploy-web/index.html");
  const lite = read("deploy-web/homepage-min.js");

  assertIncludes(index, 'src="./script-safe.js', "script-safe loaded on homepage");
  assertIncludes(index, 'src="./homepage-min.js', "homepage-min loaded on homepage");
  assertNotIncludes(index, 'src="./script.js', "script.js must stay disabled on homepage");

  assertNotIncludes(lite, "buy-journey.html", "legacy buy journey redirect");
  assertNotIncludes(lite, "checkout-details.html?flow=buy", "internal non-coach checkout route");
  assertNotIncludes(lite, "javascript:", "javascript pseudo-link patterns");

  checkLocationAssignUsage(lite);

  assertIncludes(lite, "advancedSellerReadinessV1", "latest advanced feature flag");
  assertIncludes(lite, "initSellerReadinessLite()", "latest advanced feature init");

  assertMirrorEqual("deploy-web/homepage-min.js", "homepage-min.js");
  assertMirrorEqual("deploy-web/homepage-min.js", "vibecart-netlify/homepage-min.js");
  assertMirrorEqual("deploy-web/index.html", "index.html");
  assertMirrorEqual("deploy-web/index.html", "vibecart-netlify/index.html");

  console.log("homepage-freeze-gate: all checks passed");
}

main();

