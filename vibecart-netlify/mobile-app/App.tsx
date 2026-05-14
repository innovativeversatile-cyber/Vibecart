import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AppState,
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
const INJECT_MOBILE_CLASS = `(function(){try{var d=document.documentElement,b=document.body||null;d.classList.add('vc-mobile-app');d.style.setProperty('--vc-mobile-tab-h','50px');d.style.width='100%';d.style.maxWidth='100%';if(b){b.classList.add('vc-mobile-shell');b.style.width='100%';b.style.maxWidth='430px';b.style.margin='0 auto';b.style.minHeight='100dvh';b.style.overflowX='clip';}var m=document.querySelector('meta[name="viewport"]');if(m){m.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');}var s=document.getElementById('vc-mobile-frame-fix');if(!s){s=document.createElement('style');s.id='vc-mobile-frame-fix';s.textContent='html.vc-mobile-app,html.vc-mobile-app body{overscroll-behavior-y:none!important;overscroll-behavior-x:none!important;-webkit-overflow-scrolling:auto;scroll-behavior:auto!important;}html.vc-mobile-app *{scroll-behavior:auto!important;}html.vc-mobile-app .topbar,html.vc-mobile-app .global-market-sticky,html.vc-mobile-app .vc-post-hero-scroll-prompt{position:static!important;top:auto!important;}html.vc-mobile-app .vc-post-hero-scroll-prompt,html.vc-mobile-app .vc-cinematic-concierge-rail{display:none!important;}html.vc-mobile-app [class*=\"rail\"],html.vc-mobile-app [class*=\"deck\"],html.vc-mobile-app [class*=\"story\"]{scroll-snap-type:none!important;}';(document.head||d).appendChild(s);}}catch(e){}})();true;`;

/** Hash/path sync only (scroll-based state tracking removed for stability). */
const INJECT_HASH_SYNC = `(function(){
  try {
    var RN = typeof window !== "undefined" && window.ReactNativeWebView;
    if (!RN || !RN.postMessage) return true;
    var last = "";
    function send(k) {
      if (!k || k === last) return;
      last = k;
      try {
        RN.postMessage(JSON.stringify({ vcDock: k, src: "vc" }));
      } catch (e) {}
    }
    function dockFromPath() {
      var p = (location.pathname || "").split("/").pop() || "";
      p = p.toLowerCase();
      if (/^shop-hub|regional-shops|shops-/.test(p)) return "shops";
      if (/^bridge-hub/.test(p)) return "bridge";
      if (/^hot-picks|buy-journey/.test(p)) return "market";
      if (/^account-hub|legal-settings|sell-journey|rewards-hub|insurance|wellbeing|orders-tracking|security-overview|browse-categories|lane-welcome|audience-fit|seller-boost/.test(p)) return "more";
      return "";
    }
    function dockFromHash() {
      var fromPath = dockFromPath();
      if (fromPath) return fromPath;
      var h = (location.hash || "").replace(/^#/, "").split("&")[0].split("?")[0];
      if (!h) return "home";
      if (h === "shops") return "shops";
      if (h === "bridge-routes") return "bridge";
      if (h === "market") return "market";
      if (h === "settings-hub" || h === "account-access") return "more";
      if (h === "sell" || h.indexOf("seller") === 0) return "more";
      if (h === "rewards") return "market";
      if (h === "categories") return "home";
      if (h === "insurance" || h === "buyer-advantages" || h === "tracking") return "home";
      return "home";
    }
    send(dockFromHash());
    window.addEventListener("hashchange", function () {
      send(dockFromHash());
    }, false);
    window.addEventListener("popstate", function () {
      send(dockFromHash());
    }, false);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) send(dockFromHash());
    });
  } catch (e) {}
  return true;
})();`;

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

/** Extra strip above the tab dock (global search + inbox parity with deploy-web site chrome). */
const QUICK_CHROME_HEIGHT = 28;

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

const DOCK_KEYS: DockKey[] = ["home", "shops", "bridge", "market", "more"];

type VcSceneId =
  | "intro"
  | "lane"
  | "fit"
  | "rewards"
  | "categories"
  | "shops"
  | "bridge"
  | "market"
  | "hub";

const VC_SCENE_IDS: VcSceneId[] = [
  "intro",
  "lane",
  "fit",
  "rewards",
  "categories",
  "shops",
  "bridge",
  "market",
  "hub"
];

type VcFlowHaptic = "next" | "prev" | "done";

function parseVcWebViewPayload(data: string): {
  dock: DockKey | null;
  scene: VcSceneId | null;
  flowHaptic: VcFlowHaptic | null;
  openUrl: string | null;
} {
  try {
    const o = JSON.parse(data) as { vcDock?: string; vcScene?: string; vcFlowHaptic?: string; vcOpenUrl?: string };
    const dk = String(o.vcDock || "");
    const dock = DOCK_KEYS.includes(dk as DockKey) ? (dk as DockKey) : null;
    const rawScene = String(o.vcScene || "").trim();
    const scene = VC_SCENE_IDS.includes(rawScene as VcSceneId) ? (rawScene as VcSceneId) : null;
    const fh = String(o.vcFlowHaptic || "").trim().toLowerCase();
    const flowHaptic: VcFlowHaptic | null =
      fh === "next" || fh === "prev" || fh === "done" ? (fh as VcFlowHaptic) : null;
    const rawOpen = String(o.vcOpenUrl || "").trim();
    const openUrl = /^https?:\/\//i.test(rawOpen) ? rawOpen : null;
    return { dock, scene, flowHaptic, openUrl };
  } catch {
    return { dock: null, scene: null, flowHaptic: null, openUrl: null };
  }
}

export default function App(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [disclaimerPeek, setDisclaimerPeek] = useState(false);
  const [resumePulseVisible, setResumePulseVisible] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [dockActive, setDockActive] = useState<DockKey>("home");
  const webViewRef = useRef<WebViewType>(null);
  const sceneHapticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHapticScene = useRef<string>("");
  const pulse = useRef(new Animated.Value(0)).current;
  const splashOp = useRef(new Animated.Value(1)).current;
  const appStateRef = useRef(AppState.currentState);
  const resumePulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splashStartRef = useRef(Date.now());
  const loadSuccessHapticDoneRef = useRef(false);
  const earlyPaintRef = useRef(false);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const runSplashReveal = useCallback(() => {
    if (splashTimerRef.current) {
      clearTimeout(splashTimerRef.current);
      splashTimerRef.current = null;
    }
    Animated.timing(splashOp, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      setIsLoading(false);
      if (!loadSuccessHapticDoneRef.current) {
        loadSuccessHapticDoneRef.current = true;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    });
  }, [splashOp]);

  const scheduleSplashReveal = useCallback(() => {
    if (splashTimerRef.current) {
      clearTimeout(splashTimerRef.current);
      splashTimerRef.current = null;
    }
    const minSplashMs = earlyPaintRef.current ? 140 : 420;
    const elapsed = Date.now() - splashStartRef.current;
    const wait = Math.max(0, minSplashMs - elapsed);
    splashTimerRef.current = setTimeout(() => {
      splashTimerRef.current = null;
      runSplashReveal();
    }, wait);
  }, [runSplashReveal]);

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
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (
        acceptedDisclaimer &&
        !isLoading &&
        (prev === "background" || prev === "inactive") &&
        next === "active"
      ) {
        if (resumePulseTimer.current) {
          clearTimeout(resumePulseTimer.current);
        }
        setResumePulseVisible(true);
        resumePulseTimer.current = setTimeout(() => {
          setResumePulseVisible(false);
          resumePulseTimer.current = null;
        }, 1800);
      }
    });
    return () => {
      sub.remove();
      if (resumePulseTimer.current) {
        clearTimeout(resumePulseTimer.current);
      }
    };
  }, [acceptedDisclaimer, isLoading]);

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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setDockActive(key);
    const root = baseUrl.replace(/\/$/, "");
    const map: Record<DockKey, string> = {
      home: `${root}/`,
      shops: `${root}/shop-hub.html`,
      bridge: `${root}/bridge-hub.html`,
      market: `${root}/hot-picks.html`,
      more: `${root}/account-hub.html`
    };
    const target = map[key];
    webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(target)}; true;`);
  };

  const navigateWebPath = (pathWithQuery: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const root = baseUrl.replace(/\/$/, "");
    const suffix = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
    const target = `${root}${suffix}`;
    webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(target)}; true;`);
  };

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.04]
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1]
  });

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.28]
  });

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.62, 0.08]
  });

  const bottomPad = Platform.OS === "ios" ? 14 : 8;

  const hardReloadWebView = () => {
    if (splashTimerRef.current) {
      clearTimeout(splashTimerRef.current);
      splashTimerRef.current = null;
    }
    earlyPaintRef.current = false;
    setErrorText("");
    setIsLoading(true);
    splashOp.setValue(1);
    loadSuccessHapticDoneRef.current = false;
    setWebViewKey((n) => n + 1);
  };

  useEffect(() => {
    splashStartRef.current = Date.now();
    earlyPaintRef.current = false;
  }, [webViewKey]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <WebView
        key={webViewKey}
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
        pullToRefreshEnabled={Platform.OS === "ios"}
        thirdPartyCookiesEnabled
        androidLayerType="hardware"
        mixedContentMode="never"
        textZoom={100}
        scalesPageToFit={false}
        {...(Platform.OS === "android"
          ? {
              /* Prefer device-width layout in Android WebView (avoids desktop-scale strip + pinch to see hero). */
              useWideViewPort: false,
              setBuiltInZoomControls: false,
              setDisplayZoomControls: false
            }
          : {})}
        overScrollMode="never"
        /* iOS defaults allowsInlineMediaPlayback=false — inline <video> stays 0:00 / won't play without this. */
        allowsInlineMediaPlayback
        /* true blocks playback in some WebViews even when the user taps the video control; we don't autoplay video in HTML. */
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScriptBeforeContentLoaded={INJECT_MOBILE_CLASS}
        injectedJavaScript={INJECT_HASH_SYNC}
        onMessage={(ev: { nativeEvent: { data: string } }) => {
          const raw = String(ev.nativeEvent.data || "");
          try {
            const o = JSON.parse(raw) as { vcPaintReady?: boolean };
            if (o && o.vcPaintReady) {
              earlyPaintRef.current = true;
              scheduleSplashReveal();
            }
          } catch {
            /* ignore */
          }
          const { dock, scene, flowHaptic, openUrl } = parseVcWebViewPayload(raw);
          if (openUrl) {
            void Linking.openURL(openUrl).catch(() => {});
          }
          if (dock) {
            setDockActive(dock);
          }
          if (flowHaptic === "next") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          } else if (flowHaptic === "prev") {
            void Haptics.selectionAsync().catch(() => {});
          } else if (flowHaptic === "done") {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          if (scene && scene !== lastHapticScene.current) {
            lastHapticScene.current = scene;
            if (sceneHapticTimer.current) {
              clearTimeout(sceneHapticTimer.current);
            }
            sceneHapticTimer.current = setTimeout(() => {
              sceneHapticTimer.current = null;
              void Haptics.selectionAsync();
            }, 140);
          }
        }}
        onLoadStart={() => {
          setErrorText("");
        }}
        onContentProcessDidTerminate={() => {
          webViewRef.current?.reload();
        }}
        onLoadEnd={() => {
          void getOrCreateInstallId().then((id) => {
            webViewRef.current?.injectJavaScript(
              `(function(){try{window.__VC_INSTALL_ID__=${JSON.stringify(id)};}catch(e){}})();true;`
            );
          });
          scheduleSplashReveal();
        }}
        onError={(event) => {
          if (splashTimerRef.current) {
            clearTimeout(splashTimerRef.current);
            splashTimerRef.current = null;
          }
          splashOp.stopAnimation();
          splashOp.setValue(0);
          setIsLoading(false);
          setErrorText(event.nativeEvent.description || "Could not load VibeCart.");
        }}
        onShouldStartLoadWithRequest={(request) => isAllowedUrl(request.url, allowedHost)}
        setSupportMultipleWindows
        onOpenWindow={(event) => {
          const target = String(event?.nativeEvent?.targetUrl || "").trim();
          if (/^https?:\/\//i.test(target)) {
            void Linking.openURL(target).catch(() => {});
          }
        }}
      />
      {resumePulseVisible && (
        <View pointerEvents="none" style={styles.resumePulseLayer}>
          <View style={styles.splashMarkWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.splashRing,
                { opacity: ringOpacity, transform: [{ scale: ringScale }] }
              ]}
            />
            <Animated.View style={{ transform: [{ scale }], opacity }}>
              <View style={styles.markOuter}>
                <View style={styles.markInner}>
                  <Text style={styles.markLetter}>V</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      )}
      {isLoading && (
        <Animated.View style={[styles.splash, { opacity: splashOp }]}>
          <View style={styles.splashMarkWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.splashRing,
                { opacity: ringOpacity, transform: [{ scale: ringScale }] }
              ]}
            />
            <Animated.View style={{ transform: [{ scale }], opacity }}>
              <View style={styles.markOuter}>
                <View style={styles.markInner}>
                  <Text style={styles.markLetter}>V</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      )}
      {!!errorText && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorText}>{errorText}</Text>
          <Pressable
            style={({ pressed }) => [styles.errorRetryBtn, pressed && { opacity: 0.88 }]}
            onPress={hardReloadWebView}
          >
            <Text style={styles.errorRetryLabel}>Retry</Text>
          </Pressable>
        </View>
      )}
      {acceptedDisclaimer && !isLoading && Platform.OS === "android" && (
        <Pressable
          style={({ pressed }) => [styles.refreshFab, pressed && { opacity: 0.85 }]}
          onPress={() => webViewRef.current?.reload()}
          accessibilityRole="button"
          accessibilityLabel="Refresh VibeCart"
        >
          <Ionicons name="refresh-outline" size={22} color="#f8f4ff" />
        </Pressable>
      )}
      {acceptedDisclaimer && (
        <Pressable
          style={[
            styles.disclaimerChip,
            { bottom: 62 + QUICK_CHROME_HEIGHT + bottomPad }
          ]}
          onPress={() => setDisclaimerPeek((v) => !v)}
        >
          <Text style={styles.disclaimerChipText}>{disclaimerPeek ? "Hide legal note" : "Legal · risk note"}</Text>
        </Pressable>
      )}
      {disclaimerPeek && acceptedDisclaimer && (
        <View
          style={[
            styles.disclaimerPop,
            { bottom: 102 + QUICK_CHROME_HEIGHT + bottomPad }
          ]}
        >
          <Text style={styles.disclaimerPopText}>
            VibeCart uses strong protection controls, but no platform can eliminate all risk. Follow local laws and
            platform terms.
          </Text>
        </View>
      )}
      {!acceptedDisclaimer && (
        <View style={styles.acceptanceOverlay}>
          <View style={styles.acceptanceCard}>
            <Text style={styles.acceptanceTitle}>Welcome to VibeCart</Text>
            <Text style={styles.acceptanceLead}>
              Secure cross-border lanes, trust tooling, and a dock tuned for phone. You are on the live marketplace —
              not a demo sandbox.
            </Text>
            <Text style={styles.acceptanceText}>
              I accept the risk note and agree to use VibeCart lawfully. Full terms and privacy live on the site.
            </Text>
            <Pressable
              onPress={() => {
                const u = `${baseUrl.replace(/\/$/, "")}/privacy.html`;
                void Linking.openURL(u);
              }}
            >
              <Text style={styles.acceptancePrivacyLink}>Open privacy policy</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.acceptanceButton, pressed && { opacity: 0.88 }]}
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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
        <View style={[styles.dockShell, { paddingBottom: bottomPad }]}>
          <View style={styles.quickChrome} accessibilityRole="toolbar">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Global search"
              style={({ pressed }) => [styles.quickChromeBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateWebPath("/global-search.html")}
            >
              <Ionicons name="search-outline" size={18} color="#e8dcc8" />
              <Text style={styles.quickChromeLabel}>Find</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Inbox and messages"
              style={({ pressed }) => [styles.quickChromeBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateWebPath("/index.html#communication")}
            >
              <Ionicons name="mail-outline" size={18} color="#e8dcc8" />
              <Text style={styles.quickChromeLabel}>Inbox</Text>
            </Pressable>
          </View>
          <View style={styles.dock}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Home"
              style={({ pressed }) => [styles.dockBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateDock("home")}
            >
              <Ionicons
                name="home-outline"
                size={19}
                color={dockActive === "home" ? "#e8a317" : "#7d6f9a"}
              />
              <Text style={[styles.dockLabel, dockActive === "home" && styles.dockLabelActive]}>Home</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Regional shops"
              style={({ pressed }) => [styles.dockBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateDock("shops")}
            >
              <Ionicons
                name="folder-outline"
                size={19}
                color={dockActive === "shops" ? "#e8a317" : "#7d6f9a"}
              />
              <Text style={[styles.dockLabel, dockActive === "shops" && styles.dockLabelActive]}>Lanes</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Trade bridge"
              style={({ pressed }) => [styles.dockBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateDock("bridge")}
            >
              <Ionicons
                name="git-network-outline"
                size={19}
                color={dockActive === "bridge" ? "#e8a317" : "#7d6f9a"}
              />
              <Text style={[styles.dockLabel, dockActive === "bridge" && styles.dockLabelActive]}>Bridge</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Market"
              style={({ pressed }) => [styles.dockBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateDock("market")}
            >
              <Ionicons
                name="storefront-outline"
                size={19}
                color={dockActive === "market" ? "#e8a317" : "#7d6f9a"}
              />
              <Text style={[styles.dockLabel, dockActive === "market" && styles.dockLabelActive]}>Picks</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Account and hub"
              style={({ pressed }) => [styles.dockBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateDock("more")}
            >
              <Ionicons
                name="menu-outline"
                size={19}
                color={dockActive === "more" ? "#e8a317" : "#7d6f9a"}
              />
              <Text style={[styles.dockLabel, dockActive === "more" && styles.dockLabelActive]}>Hub</Text>
            </Pressable>
          </View>
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
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07040f"
  },
  resumePulseLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 4, 15, 0.88)"
  },
  splashMarkWrap: {
    position: "relative",
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center"
  },
  splashRing: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: "rgba(232,163,23,0.45)"
  },
  markOuter: {
    width: 76,
    height: 76,
    borderRadius: 26,
    padding: 2,
    backgroundColor: "rgba(232,163,23,0.35)"
  },
  markInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#12081c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  markLetter: {
    fontSize: 36,
    fontWeight: "900",
    color: "#e8a317",
    letterSpacing: -1
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
  errorRetryBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#e8a317",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10
  },
  errorRetryLabel: {
    color: "#1a0a08",
    fontWeight: "800",
    fontSize: 14
  },
  refreshFab: {
    position: "absolute",
    top: 52,
    right: 12,
    zIndex: 32,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18,12,32,0.92)",
    borderWidth: 1,
    borderColor: "rgba(232,163,23,0.4)"
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
    marginBottom: 10,
    lineHeight: 20,
    fontSize: 13
  },
  acceptancePrivacyLink: {
    color: "#e8a317",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 14,
    textDecorationLine: "underline"
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
  dockShell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 45
  },
  quickChrome: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 12,
    minHeight: QUICK_CHROME_HEIGHT,
    backgroundColor: "rgba(14, 10, 28, 0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(232, 163, 23, 0.12)"
  },
  quickChromeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(232, 163, 23, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(232, 163, 23, 0.28)"
  },
  quickChromeLabel: {
    color: "#e8dcc8",
    fontSize: 10,
    fontWeight: "700"
  },
  dock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 0,
    backgroundColor: "rgba(10, 6, 22, 0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(232, 163, 23, 0.14)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 12
      },
      android: { elevation: 12 }
    })
  },
  dockBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    paddingVertical: 1
  },
  dockBtnPressed: {
    opacity: 0.88
  },
  dockLabel: {
    marginTop: 1,
    fontSize: 7.5,
    fontWeight: "700",
    color: "#6e6288",
    letterSpacing: 0.35,
    textTransform: "uppercase"
  },
  dockLabelActive: {
    color: "#e8dcc8"
  }
});
