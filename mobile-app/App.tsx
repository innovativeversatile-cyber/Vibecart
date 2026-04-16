import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebView as WebViewType } from "react-native-webview";

const INSTALL_STORAGE_KEY = "vibecart.mobile.installId";

async function getOrCreateInstallId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALL_STORAGE_KEY);
  if (existing && existing.length >= 8) {
    return existing;
  }
  const created = `vc-${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(INSTALL_STORAGE_KEY, created);
  return created;
}

async function registerPushWithBackend(apiBase: string, pushToken: string): Promise<void> {
  const base = apiBase.replace(/\/$/, "");
  const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : null;
  if (!platform) {
    return;
  }
  const installId = await getOrCreateInstallId();
  const locale =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 20) : null;
  const response = await fetch(`${base}/api/public/mobile/push/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installId,
      pushToken,
      platform,
      appVersion: Constants.expoConfig?.version ?? null,
      locale
    })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`push register failed: ${response.status} ${text}`);
  }
}

const FALLBACK_BASE_URL = "https://vibe-cart.com";

function isAllowedUrl(url: string, allowedHost: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.host === allowedHost;
  } catch {
    return false;
  }
}

/** Bust CDN/browser caches so the WebView loads the same deploy-web bundle as the live site after you ship updates. */
function withWebCacheTag(url: string, tag: string | undefined): string {
  if (!tag) {
    return url;
  }
  try {
    const next = new URL(url);
    next.searchParams.set("vc_app", tag);
    return next.toString();
  } catch {
    return url;
  }
}

export default function App(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const webViewRef = useRef<WebViewType>(null);

  const baseUrl = useMemo(() => {
    const fromConfig = Constants.expoConfig?.extra?.vibecartBaseUrl;
    return String(fromConfig || FALLBACK_BASE_URL);
  }, []);

  const apiBaseUrl = useMemo(() => {
    const fromConfig = Constants.expoConfig?.extra?.vibecartApiBaseUrl;
    return fromConfig ? String(fromConfig).trim().replace(/\/$/, "") : "";
  }, []);

  const allowedHost = useMemo(() => new URL(baseUrl).host, [baseUrl]);

  const webCacheTag = useMemo(() => {
    const fromExtra = Constants.expoConfig?.extra as { vibecartWebCacheTag?: string } | undefined;
    const explicit = fromExtra?.vibecartWebCacheTag?.trim();
    if (explicit) {
      return explicit;
    }
    return Constants.expoConfig?.version?.trim() || undefined;
  }, []);

  const entryUrl = useMemo(() => {
    const raw = initialUrl || baseUrl;
    return withWebCacheTag(raw, webCacheTag);
  }, [initialUrl, baseUrl, webCacheTag]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false
      })
    });

    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const extraEas = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
      const projectId = extraEas?.eas?.projectId;
      const tokenResult = await Notifications.getExpoPushTokenAsync(
        typeof projectId === "string" && projectId.length > 0 ? { projectId } : undefined
      ).catch(() => null);
      const expoToken = tokenResult?.data;
      if (!expoToken || !apiBaseUrl) {
        return;
      }
      await registerPushWithBackend(apiBaseUrl, expoToken);
    };
    setupNotifications().catch(() => {});
  }, [apiBaseUrl]);

  useEffect(() => {
    const toWebUrl = (rawUrl: string): string => {
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === "vibecart:") {
          const path = parsed.pathname.startsWith("/") ? parsed.pathname : `/${parsed.pathname}`;
          return `${baseUrl}${path}${parsed.search || ""}`;
        }
        return rawUrl;
      } catch {
        return baseUrl;
      }
    };

    const initLink = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        setInitialUrl(toWebUrl(url));
      }
    };
    initLink().catch(() => {});

    const sub = Linking.addEventListener("url", ({ url }) => {
      const target = toWebUrl(url);
      if (isAllowedUrl(target, allowedHost)) {
        webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(target)}; true;`);
      }
    });

    return () => sub.remove();
  }, [allowedHost, baseUrl]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: entryUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        incognito={false}
        setSupportMultipleWindows={false}
        originWhitelist={["https://*"]}
        allowsBackForwardNavigationGestures
        onLoadEnd={() => setIsLoading(false)}
        onError={(event) => {
          setIsLoading(false);
          setErrorText(event.nativeEvent.description || "Could not load VibeCart.");
        }}
        onShouldStartLoadWithRequest={(request) => isAllowedUrl(request.url, allowedHost)}
      />
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#6d7dff" size="large" />
          <Text style={styles.label}>Opening VibeCart securely...</Text>
        </View>
      )}
      {!!errorText && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      )}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          Disclaimer: VibeCart uses strong protection controls, but no platform can eliminate all risk.
          Users must follow local laws and platform terms.
        </Text>
      </View>
      {!acceptedDisclaimer && (
        <View style={styles.acceptanceOverlay}>
          <View style={styles.acceptanceCard}>
            <Text style={styles.acceptanceTitle}>Before You Continue</Text>
            <Text style={styles.acceptanceText}>
              I understand and accept the VibeCart risk disclaimer and legal-use policy.
            </Text>
            <Text
              style={styles.acceptanceButton}
              onPress={() => {
                setAcceptedDisclaimer(true);
              }}
            >
              I Accept
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070b17"
  },
  webview: {
    flex: 1,
    backgroundColor: "#070b17"
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 11, 23, 0.9)"
  },
  label: {
    marginTop: 12,
    color: "#e9edff"
  },
  errorBox: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#141d34",
    borderColor: "#2a3459",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12
  },
  errorTitle: {
    color: "#e9edff",
    fontWeight: "700",
    marginBottom: 4
  },
  errorText: {
    color: "#a8b0d0"
  },
  disclaimerBox: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    backgroundColor: "rgba(13, 20, 39, 0.95)",
    borderColor: "#2a3459",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  disclaimerText: {
    color: "#a8b0d0",
    fontSize: 11,
    lineHeight: 16
  },
  acceptanceOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(7, 11, 23, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  acceptanceCard: {
    width: "100%",
    maxWidth: 420,
    borderColor: "#2a3459",
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "#0f1730",
    padding: 14
  },
  acceptanceTitle: {
    color: "#e9edff",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8
  },
  acceptanceText: {
    color: "#a8b0d0",
    marginBottom: 12,
    lineHeight: 20
  },
  acceptanceButton: {
    color: "#0c1328",
    backgroundColor: "#6d7dff",
    textAlign: "center",
    fontWeight: "700",
    borderRadius: 10,
    paddingVertical: 10
  }
});
