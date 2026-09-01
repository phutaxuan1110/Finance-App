// SNEK service worker — deliberately minimal.
//
// What it does:
//  - Lets the browser install the PWA (a service worker is a prerequisite
//    for installability on most platforms).
//  - Caches a small set of static, non-sensitive assets (icons, manifest)
//    so the app shell's chrome (icons, colors) is available offline.
//
// What it explicitly does NOT do:
//  - It never caches API responses or anything containing financial data.
//    SNEK has no backend API calls at all (data lives in localStorage), so
//    there is nothing sensitive for this worker to ever see or cache.
//  - It never caches HTML page navigations or JS/CSS bundles. Those are
//    always fetched from the network. This is what prevents the app from
//    getting "stuck" on an old version after you deploy a new one — the
//    service worker's job here is installability, not an offline app.
//
// Bump CACHE_NAME whenever the static asset list below changes; the old
// cache is deleted automatically on activate.
const CACHE_NAME = "snek-static-v1";
const STATIC_ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only ever intervene for same-origin GET requests to the specific
  // static assets listed above. Everything else (pages, data, cross-origin
  // requests) always goes straight to the network untouched.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
