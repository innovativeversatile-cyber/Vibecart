#!/usr/bin/env node
/**
 * One-step: refresh deploy-web + netlify mirrors, commit, push.
 * Usage: npm run ship -- "your commit message"
 * With no message: chore: ship YYYY-MM-DD
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const msgArg = process.argv.slice(2).join(" ").trim();
const msg =
  msgArg ||
  `chore: ship ${new Date().toISOString().slice(0, 10)}`;

execSync("npm run deploy:sync", { stdio: "inherit" });
execSync("git add -A", { stdio: "inherit" });
const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();
if (!status) {
  console.log("ship: clean tree after sync — nothing to commit.");
  process.exit(0);
}
execSync(`git commit -m ${JSON.stringify(msg)}`, { stdio: "inherit" });
execSync("git push origin HEAD", { stdio: "inherit" });
console.log("ship: pushed.");
