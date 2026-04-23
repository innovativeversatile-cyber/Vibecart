import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
const DOCK_COACH_DISMISSED_KEY = "vibecart.dock.coach.dismissed.v1";

const INJECT_MOBILE_CLASS = `(function(){try{var d=document.documentElement,b=document.body||null;d.classList.add('vc-mobile-app');d.style.setProperty('--vc-mobile-tab-h','62px');d.style.width='100%';d.style.maxWidth='100%';if(b){b.classList.add('vc-mobile-shell');b.style.width='100%';b.style.maxWidth='100%';}var m=document.querySelector('meta[name="viewport"]');if(m){m.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover');}}catch(e){}})();true;`;

/**
 * Hash + scroll intelligence: dock follows the section actually in view (IntersectionObserver),
 * with hash/deep-link as bootstrap. Feels "alive" while scrolling — not just URL string matching.
 */
const INJECT_HASH_SYNC = `(function(){
  try {
    var RN = typeof window !== "undefined" && window.ReactNativeWebView;
    if (!RN || !RN.postMessage) return true;
    var last = "";
    var debounce = 0;
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
      if (/^regional-shops|shops-/.test(p)) return "shops";
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
    function wireScrollSpy() {
      var latest = new Map();
      var map = [];
      var hero = document.querySelector("main .hero");
      if (hero) map.push({ el: hero, k: "home" });
      [["shops","shops"],["bridge-routes","bridge"],["market","market"],["account-access","more"],["settings-hub","more"],["sell","more"],["rewards","market"],["categories","home"]].forEach(function (row) {
        var el = document.getElementById(row[0]);
        if (el) map.push({ el: el, k: row[1] });
      });
      if (!map.length) return;
      function pick() {
        var scores = { home: 0, shops: 0, bridge: 0, market: 0, more: 0 };
        latest.forEach(function (r, el) {
          var k = el.getAttribute("data-vc-track");
          if (k) scores[k] = Math.max(scores[k] || 0, r);
        });
        var bestK = "home", bestV = -1;
        Object.keys(scores).forEach(function (k) {
          if (scores[k] > bestV) { bestV = scores[k]; bestK = k; }
        });
        if (bestV < 0.04) {
          send(dockFromHash());
          return;
        }
        send(bestK);
      }
      function schedule() {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(pick, 120);
      }
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          latest.set(en.target, en.intersectionRatio);
        });
        schedule();
      }, { root: null, rootMargin: "-14% 0px -32% 0px", threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.45, 0.6, 0.75, 1] });
      map.forEach(function (m) {
        try {
          m.el.setAttribute("data-vc-track", m.k);
          obs.observe(m.el);
        } catch (e) {}
      });
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
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", wireScrollSpy);
    } else {
      wireScrollSpy();
    }
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
const QUICK_CHROME_HEIGHT = 42;

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
} {
  try {
    const o = JSON.parse(data) as { vcDock?: string; vcScene?: string; vcFlowHaptic?: string };
    const dk = String(o.vcDock || "");
    const dock = DOCK_KEYS.includes(dk as DockKey) ? (dk as DockKey) : null;
    const rawScene = String(o.vcScene || "").trim();
    const scene = VC_SCENE_IDS.includes(rawScene as VcSceneId) ? (rawScene as VcSceneId) : null;
    const fh = String(o.vcFlowHaptic || "").trim().toLowerCase();
    const flowHaptic: VcFlowHaptic | null =
      fh === "next" || fh === "prev" || fh === "done" ? (fh as VcFlowHaptic) : null;
    return { dock, scene, flowHaptic };
  } catch {
    return { dock: null, scene: null, flowHaptic: null };
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
  const [dockCoachVisible, setDockCoachVisible] = useState(false);
  const webViewRef = useRef<WebViewType>(null);
  const sceneHapticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHapticScene = useRef<string>("");
  const pulse = useRef(new Animated.Value(0)).current;
  const splashOp = useRef(new Animated.Value(1)).current;
  const appStateRef = useRef(AppState.currentState);
  const resumePulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splashStartRef = useRef(Date.now());

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
    if (!acceptedDisclaimer) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(DOCK_COACH_DISMISSED_KEY)
      .then((v) => {
        if (v === "1") {
          return;
        }
        setDockCoachVisible(true);
        timer = setTimeout(() => {
          setDockCoachVisible(false);
          AsyncStorage.setItem(DOCK_COACH_DISMISSED_KEY, "1").catch(() => {});
        }, 10000);
      })
      .catch(() => {});
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [acceptedDisclaimer]);

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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDockActive(key);
    const root = baseUrl.replace(/\/$/, "");
    const map: Record<DockKey, string> = {
      home: `${root}/`,
      shops: `${root}/regional-shops.html`,
      bridge: `${root}/bridge-hub.html`,
      market: `${root}/hot-picks.html`,
      more: `${root}/account-hub.html`
    };
    const target = map[key];
    webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(target)}; true;`);
  };

  const navigateWebPath = (pathWithQuery: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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

  const bottomPad = Platform.OS === "ios" ? 26 : 14;

  const hardReloadWebView = () => {
    setErrorText("");
    setIsLoading(true);
    splashOp.setValue(1);
    setWebViewKey((n) => n + 1);
  };

  useEffect(() => {
    splashStartRef.current = Date.now();
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
        mediaPlaybackRequiresUserAction={true}
        injectedJavaScriptBeforeContentLoaded={INJECT_MOBILE_CLASS}
        injectedJavaScript={INJECT_HASH_SYNC}
        onMessage={(ev: { nativeEvent: { data: string } }) => {
          const { dock, scene, flowHaptic } = parseVcWebViewPayload(ev.nativeEvent.data);
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
          const minSplashMs = 900;
          const elapsed = Date.now() - splashStartRef.current;
          const wait = Math.max(0, minSplashMs - elapsed);
          setTimeout(() => {
            Animated.timing(splashOp, {
              toValue: 0,
              duration: 420,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }).start(() => {
              setIsLoading(false);
            });
          }, wait);
        }}
        onError={(event) => {
          splashOp.stopAnimation();
          splashOp.setValue(0);
          setIsLoading(false);
          setErrorText(event.nativeEvent.description || "Could not load VibeCart.");
        }}
        onShouldStartLoadWithRequest={(request) => isAllowedUrl(request.url, allowedHost)}
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
            { bottom: (dockCoachVisible ? 118 : 62) + QUICK_CHROME_HEIGHT + bottomPad }
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
            { bottom: (dockCoachVisible ? 158 : 102) + QUICK_CHROME_HEIGHT + bottomPad }
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
          {dockCoachVisible ? (
            <View style={styles.dockCoach}>
              <Text style={styles.dockCoachText}>Pick a lane — the marketplace moves with you.</Text>
            </View>
          ) : null}
          <View style={styles.quickChrome} accessibilityRole="toolbar">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Global search"
              style={({ pressed }) => [styles.quickChromeBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateWebPath("/global-search.html")}
            >
              <Ionicons name="search-outline" size={22} color="#e8dcc8" />
              <Text style={styles.quickChromeLabel}>Find</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Inbox and messages"
              style={({ pressed }) => [styles.quickChromeBtn, pressed && styles.dockBtnPressed]}
              onPress={() => navigateWebPath("/index.html#communication")}
            >
              <Ionicons name="mail-outline" size={22} color="#e8dcc8" />
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
                size={24}
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
                size={24}
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
                size={24}
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
                size={24}
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
                size={24}
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
    gap: 12,
    paddingVertical: 6,
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
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(232, 163, 23, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(232, 163, 23, 0.28)"
  },
  quickChromeLabel: {
    color: "#e8dcc8",
    fontSize: 12,
    fontWeight: "700"
  },
  dockCoach: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: "center",
    backgroundColor: "rgba(6, 3, 14, 0.55)"
  },
  dockCoachText: {
    fontSize: 11,
    lineHeight: 15,
    color: "#9a8fb8",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.2
  },
  dock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
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
    minHeight: 52,
    paddingVertical: 4
  },
  dockBtnPressed: {
    opacity: 0.88
  },
  dockLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
    color: "#6e6288",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  dockLabelActive: {
    color: "#e8dcc8"
  }
});
