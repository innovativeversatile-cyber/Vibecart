"use strict";
/* eslint-env node */

const fs = require("fs");
const path = require("path");

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

/**
 * Use the `({ config })` form so Expo merges `app.json` first and expo-doctor sees a single pipeline.
 * @see https://docs.expo.dev/workflow/configuration/
 */
module.exports = ({ config }) => {
  const projectId =
    process.env.EAS_PROJECT_ID ||
    readEasProjectId() ||
    (config.extra &&
      config.extra.eas &&
      typeof config.extra.eas.projectId === "string" &&
      config.extra.eas.projectId.trim()) ||
    undefined;

  const extra = { ...(config.extra || {}) };

  if (projectId) {
    extra.eas = { ...(extra.eas || {}), projectId };
  }

  const apiFromEnv = process.env.EXPO_PUBLIC_VIBECART_API_URL?.trim();
  if (apiFromEnv) {
    extra.vibecartApiBaseUrl = apiFromEnv.replace(/\/$/, "");
  } else if (typeof extra.vibecartApiBaseUrl === "string") {
    extra.vibecartApiBaseUrl = extra.vibecartApiBaseUrl.replace(/\/$/, "");
  }

  const easProjectIdForUpdates = extra.eas && typeof extra.eas.projectId === "string" ? extra.eas.projectId.trim() : "";

  return {
    ...config,
    extra,
    ios: {
      ...config.ios,
      infoPlist: {
        ...(config.ios && config.ios.infoPlist ? config.ios.infoPlist : {}),
        ITSAppUsesNonExemptEncryption: false
      }
    },
    ...(easProjectIdForUpdates
      ? {
          updates: { url: `https://u.expo.dev/${easProjectIdForUpdates}` },
          runtimeVersion: { policy: "appVersion" }
        }
      : {})
  };
};
