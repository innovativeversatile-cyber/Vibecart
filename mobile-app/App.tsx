import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebView as WebViewType } from "react-native-webview";

const INSTALL_STORAGE_KEY = "vibecart.mobile.installId";
const DISCLAIMER_STORAGE_KEY = "vibecart.mobile.disclaimerAccepted.v1";

const INJECT_MOBILE_CLASS = `(function(){try{document.documentElement.classList.add('vc-mobile-app');document.documentElement.style.setProperty('--vc-mobile-tab-h','62px');}catch(e){}})();true;`;

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

type DockKey = "home" | "shops" | "bridge" | "market" | "more";

export default function App(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [disclaimerPeek, setDisclaimerPeek] = useState(false);
  const webViewRef = useRef<WebViewType>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const splashOp = useRef(new Animated.Value(1)).current;

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
    AsyncStorage.getItem(DISCLAIMER_STORAGE_KEY)
      .then((v) => {
        if (v === "1") {
          setAcceptedDisclaimer(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse]);

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

  const navigateDock = (key: DockKey) => {
    const root = baseUrl.replace(/\/$/, "");
    const map: Record<DockKey, string> = {
      home: `${root}/`,
      shops: `${root}/#shops`,
      bridge: `${root}/#bridge-routes`,
      market: `${root}/#market`,
      more: `${root}/#settings-hub`
    };
    const target = map[key];
    webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(target)}; true;`);
  };

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08]
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1]
  });

  const bottomPad = Platform.OS === "ios" ? 26 : 14;

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
        injectedJavaScriptBeforeContentLoaded={INJECT_MOBILE_CLASS}
        onLoadEnd={() => {
          void getOrCreateInstallId().then((id) => {
            webViewRef.current?.injectJavaScript(
              `(function(){try{window.__VC_INSTALL_ID__=${JSON.stringify(id)};}catch(e){}})();true;`
            );
          });
          Animated.timing(splashOp, {
            toValue: 0,
            duration: 560,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }).start(() => {
            setIsLoading(false);
          });
        }}
        onError={(event) => {
          splashOp.stopAnimation();
          splashOp.setValue(0);
          setIsLoading(false);
          setErrorText(event.nativeEvent.description || "Could not load VibeCart.");
        }}
        onShouldStartLoadWithRequest={(request) => isAllowedUrl(request.url, allowedHost)}
      />
      {isLoading && (
        <Animated.View style={[styles.splash, { opacity: splashOp }]}>
          <Animated.View style={{ transform: [{ scale }], opacity }}>
            <View style={styles.markOuter}>
              <View style={styles.markInner}>
                <Text style={styles.markLetter}>V</Text>
              </View>
            </View>
          </Animated.View>
          <Text style={styles.splashTitle}>VibeCart</Text>
          <Text style={styles.splashSub}>Cross-border marketplace</Text>
          <ActivityIndicator color="#e8a317" size="small" style={{ marginTop: 18 }} />
        </Animated.View>
      )}
      {!!errorText && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      )}
      {acceptedDisclaimer && (
        <Pressable
          style={[styles.disclaimerChip, { bottom: 62 + bottomPad }]}
          onPress={() => setDisclaimerPeek((v) => !v)}
        >
          <Text style={styles.disclaimerChipText}>{disclaimerPeek ? "Hide legal note" : "Legal · risk note"}</Text>
        </Pressable>
      )}
      {disclaimerPeek && acceptedDisclaimer && (
        <View style={[styles.disclaimerPop, { bottom: 102 + bottomPad }]}>
          <Text style={styles.disclaimerPopText}>
            VibeCart uses strong protection controls, but no platform can eliminate all risk. Follow local laws and
            platform terms.
          </Text>
        </View>
      )}
      {!acceptedDisclaimer && (
        <View style={styles.acceptanceOverlay}>
          <View style={styles.acceptanceCard}>
            <Text style={styles.acceptanceTitle}>Welcome in</Text>
            <Text style={styles.acceptanceLead}>
              After this pulse fades you land on a calmer, folder-first home — with a dock and an on-device VibeCoach
              for tips.
            </Text>
            <Text style={styles.acceptanceText}>
              I understand and accept the VibeCart risk disclaimer and legal-use policy.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.acceptanceButton, pressed && { opacity: 0.88 }]}
              onPress={() => {
                setAcceptedDisclaimer(true);
                AsyncStorage.setItem(DISCLAIMER_STORAGE_KEY, "1").catch(() => {});
              }}
            >
              <Text style={styles.acceptanceButtonLabel}>Enter VibeCart</Text>
            </Pressable>
          </View>
        </View>
      )}
      {acceptedDisclaimer && !isLoading && (
        <View style={[styles.dock, { paddingBottom: bottomPad }]}>
          <Pressable style={styles.dockBtn} onPress={() => navigateDock("home")}>
            <Ionicons name="home-outline" size={22} color="#f6f2ff" />
            <Text style={styles.dockLabel}>Home</Text>
          </Pressable>
          <Pressable style={styles.dockBtn} onPress={() => navigateDock("shops")}>
            <Ionicons name="folder-outline" size={22} color="#f6f2ff" />
            <Text style={styles.dockLabel}>Folders</Text>
          </Pressable>
          <Pressable style={styles.dockBtn} onPress={() => navigateDock("bridge")}>
            <Ionicons name="git-network-outline" size={22} color="#f6f2ff" />
            <Text style={styles.dockLabel}>Bridge</Text>
          </Pressable>
          <Pressable style={styles.dockBtn} onPress={() => navigateDock("market")}>
            <Ionicons name="storefront-outline" size={22} color="#f6f2ff" />
            <Text style={styles.dockLabel}>Market</Text>
          </Pressable>
          <Pressable style={styles.dockBtn} onPress={() => navigateDock("more")}>
            <Ionicons name="menu-outline" size={22} color="#f6f2ff" />
            <Text style={styles.dockLabel}>More</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#07040f"
  },
  webview: {
    flex: 1,
    backgroundColor: "#07040f"
  },
  splash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07040f"
  },
  markOuter: {
    width: 112,
    height: 112,
    borderRadius: 36,
    padding: 3,
    backgroundColor: "rgba(232,163,23,0.35)"
  },
  markInner: {
    flex: 1,
    borderRadius: 33,
    backgroundColor: "#12081c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  markLetter: {
    fontSize: 52,
    fontWeight: "900",
    color: "#e8a317",
    letterSpacing: -2
  },
  splashTitle: {
    marginTop: 22,
    fontSize: 26,
    fontWeight: "800",
    color: "#f8f4ff",
    letterSpacing: 1.2
  },
  splashSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#b9b4d6",
    letterSpacing: 2,
    textTransform: "uppercase"
  },
  errorBox: {
    position: "absolute",
    bottom: 96,
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
  disclaimerChip: {
    position: "absolute",
    right: 12,
    zIndex: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(18,12,32,0.92)",
    borderWidth: 1,
    borderColor: "rgba(232,163,23,0.35)"
  },
  disclaimerChipText: {
    color: "#e8dcc8",
    fontSize: 11,
    fontWeight: "700"
  },
  disclaimerPop: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 39,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(13,20,39,0.96)",
    borderWidth: 1,
    borderColor: "#2a3459"
  },
  disclaimerPopText: {
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
    backgroundColor: "rgba(4,2,12,0.94)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 50
  },
  acceptanceCard: {
    width: "100%",
    maxWidth: 420,
    borderColor: "rgba(232,163,23,0.35)",
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: "#0c0818",
    padding: 18
  },
  acceptanceTitle: {
    color: "#fff6ec",
    fontWeight: "800",
    fontSize: 22,
    marginBottom: 8
  },
  acceptanceLead: {
    color: "#c9c2e8",
    marginBottom: 12,
    lineHeight: 22,
    fontSize: 14
  },
  acceptanceText: {
    color: "#a8b0d0",
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 13
  },
  acceptanceButton: {
    backgroundColor: "#e8a317",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  acceptanceButtonLabel: {
    color: "#1a0a08",
    fontWeight: "800",
    fontSize: 16
  },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingTop: 6,
    backgroundColor: "rgba(8,4,18,0.94)",
    borderTopWidth: 1,
    borderTopColor: "rgba(232,163,23,0.28)",
    zIndex: 45
  },
  dockBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4
  },
  dockLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "#dcd4ff",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  }
});
