import fs from "fs";

const p = "service-provider-hub.html";
let html = fs.readFileSync(p, "utf8");
const marker = "</main>";
const i = html.indexOf(marker);
if (i < 0) throw new Error("missing </main>");
const head = html.slice(0, i + marker.length);
const tailStart = html.indexOf("</body>", i);
if (tailStart < 0) throw new Error("missing </body>");
const tail = html.slice(tailStart);
const scripts = `
  <script src="./session-device.js?v=20260510sess1"></script>
  <script src="./vibecart-ai-client.js?v=20260510sphub1" defer></script>
  <script src="./site-chrome.js?v=20260510sphub1" defer></script>
  <script src="./service-provider-hub.js?v=20260510sphub1" defer></script>
`;
fs.writeFileSync(p, head + "\n" + scripts + "\n" + tail);
console.log("patched", p);
