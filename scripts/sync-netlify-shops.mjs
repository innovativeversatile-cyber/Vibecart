import fs from "fs";

const deployPath = new URL("../deploy-web/index.html", import.meta.url);
const netlifyPath = new URL("../../vibecart-netlify/index.html", import.meta.url);

const deploy = fs.readFileSync(deployPath, "utf8");
let net = fs.readFileSync(netlifyPath, "utf8");

const s = deploy.indexOf('<section id="shops"');
const e = deploy.indexOf('<section id="bridge-routes"');
if (s < 0 || e < 0) {
  throw new Error("Could not find shops / bridge-routes in deploy-web/index.html");
}
const shops = deploy.slice(s, e);

const re =
  /<section id="shops"[\s\S]*?<\/section>\s*\n\s*<section class="section">\s*\n\s*<h2 id="bridgeTitle">/;
if (!re.test(net)) {
  throw new Error("Could not find shops + bridge block in vibecart-netlify/index.html");
}

net = net.replace(
  re,
  `${shops}      <section id="bridge-routes" class="section">\n        <h2 id="bridgeTitle">`
);
fs.writeFileSync(netlifyPath, net);
console.log("Wrote regional shop folders into vibecart-netlify/index.html");
