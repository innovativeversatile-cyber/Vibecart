import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebView as WebViewType } from "react-native-webview";

const FALLBACK_BASE_URL = "https://vibecart-marketplace.netlify.app";

function isAllowedUrl(url: string, allowedHost: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.host === allowedHost;
  } catch {
    return false;
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

  const allowedHost = useMemo(() => new URL(baseUrl).host, [baseUrl]);
  const entryUrl = useMemo(() => initialUrl || baseUrl, [initialUrl, baseUrl]);

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
      await Notifications.getExpoPushTokenAsync().catch(() => null);
      // TODO: Send push token to your backend once endpoint is ready.
    };
    setupNotifications().catch(() => {});
  }, []);

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
