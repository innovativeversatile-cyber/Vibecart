import fs from "fs";

const html = fs.readFileSync("service-provider-hub.html", "utf8");

function inlineScripts(h) {
  const out = [];
  let i = 0;
  while (true) {
    const o = h.indexOf("<script", i);
    if (o < 0) break;
    const gt = h.indexOf(">", o);
    const tag = h.slice(o, gt + 1);
    if (/\bsrc\s*=/.test(tag)) {
      const c = h.indexOf("</script>", gt);
      i = c + 9;
      continue;
    }
    const c = h.indexOf("</script>", gt);
    out.push(h.slice(gt + 1, c).trim());
    i = c + 9;
  }
  return out;
}

const parts = inlineScripts(html);
if (parts.length < 2) {
  throw new Error(`expected at least 2 inline blocks, got ${parts.length}`);
}
const main = parts[0];
const lean = parts[parts.length - 1];
const inner = main
  .replace(/^\(\s*function\s*\(\)\s*\{\s*/, "")
  .replace(/\}\)\(\);\s*$/, "");
const js = `(function () {\n  "use strict";\n${inner}\n})();\n${lean}\n`;
fs.writeFileSync("service-provider-hub.js", js);
console.log("wrote service-provider-hub.js bytes=", js.length);
