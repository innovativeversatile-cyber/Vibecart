"use strict";
/* eslint-env node */

const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

function readEasProjectId() {
  const filePath = path.join(__dirname, ".eas", "project.json");
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const id = raw && typeof raw.projectId === "string" ? raw.projectId.trim() : "";
    return id.length > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

const projectId = process.env.EAS_PROJECT_ID || readEasProjectId();
const extra = { ...(appJson.expo.extra || {}) };

if (projectId) {
  extra.eas = { ...(extra.eas || {}), projectId };
}

// Stable public API host (Railway custom domain). Override per build: EXPO_PUBLIC_VIBECART_API_URL.
const apiFromEnv = process.env.EXPO_PUBLIC_VIBECART_API_URL?.trim();
if (apiFromEnv) {
  extra.vibecartApiBaseUrl = apiFromEnv.replace(/\/$/, "");
} else if (typeof extra.vibecartApiBaseUrl === "string") {
  extra.vibecartApiBaseUrl = extra.vibecartApiBaseUrl.replace(/\/$/, "");
}

module.exports = {
  expo: {
    ...appJson.expo,
    extra
  }
};
