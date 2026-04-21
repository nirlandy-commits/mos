const MOS_CACHE = "mos-static-v20260421-03";

const STATIC_ASSETS = [
  "/",
  "/app",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon-mos.png",
  "/logo-mos.svg",
  "/src/main.js?v=20260421-03",
  "/src/styles.css?v=20260421-03",
  "/src/tailwind.generated.css?v=20260421-03",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(MOS_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== MOS_CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(MOS_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html"))),
  );
});
