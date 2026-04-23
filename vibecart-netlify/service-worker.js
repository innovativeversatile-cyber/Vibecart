// Bump CACHE_NAME whenever you need all clients to drop old cached assets.
const CACHE_NAME = "vibecart-pwa-v20260422routing1";
// Precache small static assets. Avoid index.html / main CSS+JS here so deploy updates still win on next load.
const OFFLINE_URLS = [
  "./manifest.json",
  "./icon.svg",
  "./icon-maskable.svg",
  "./policy.html",
  "./terms.html",
  "./privacy.html",
  "./flow-shell.js",
  "./regional-shops.html",
  "./browse-categories.html",
  "./hot-picks.html",
  "./buy-journey.html",
  "./sell-journey.html",
  "./rewards-hub.html",
  "./account-hub.html",
  "./lane-passport.html",
  "./legal-settings.html",
  "./security-overview.html",
  "./bridge-hub.html",
  "./orders-tracking.html",
  "./lane-welcome.html",
  "./audience-fit.html",
  "./seller-boost.html",
  "./insurance.html",
  "./wellbeing.html",
  "./payment-confirmation.html",
  "./checkout-details.html",
  "./plan-workspace.html",
  "./plan-workspace.js",
  "./live-market.html",
  "./world-shop-experience.html",
  "./popular-market.html",
  "./live-market-shops.html",
  "./live-market-shops.js",
  "./fashion-trends.html",
  "./fashion-trends.js",
  "./passport-booklet.js",
  "./affiliate-dashboard.html",
  "./affiliate-dashboard.js",
  "./global-search.html",
  "./global-search.js",
  "./epic-home.js",
  "./wow-home.js",
  "./site-chrome.js",
  "./passport-welcome.html",
  "./account-welcome.html",
  "./service-provider-hub.html",
  "./page-i18n.js",
  "./seller-gate.js",
  "./shop-favicons.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(OFFLINE_URLS.map((url) => cache.add(url).catch(() => undefined)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Always hit the network for full page loads so HTML updates are never stuck on an old SW cache.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        return caches.match("./index.html");
      })
  );
});

self.addEventListener("message", (event) => {
  const data = event && event.data ? event.data : null;
  if (!data || data.type !== "SHOW_NOTIFICATION") {
    return;
  }
  const title = String(data.title || "VibeCart");
  const body = String(data.body || "You have a new update.");
  const url = String(data.url || "./");
  self.registration.showNotification(title, {
    body,
    icon: "./icon.svg",
    badge: "./icon-maskable.svg",
    data: { url }
  });
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "You have a new VibeCart notification." };
  }
  const title = String(payload.title || "VibeCart");
  const body = String(payload.body || "You have a new update.");
  const url = String(payload.url || "./");
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./icon.svg",
      badge: "./icon-maskable.svg",
      data: { url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const targetUrl = String((event.notification && event.notification.data && event.notification.data.url) || "./");
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
