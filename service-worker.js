const CACHE_NAME = "yegnafarm-v4";
const ASSETS = [
  "/",
  "/index.html",
  "/chat.html",
  "/signup.html",
  "/crop-guide.html",
  "/market.html",
  "/dashboard.html",
  "/upload.html",
  "/css/style.css",
  "/js/api-config.js",
  "/js/app.js",
  "/js/auth-page.js",
  "/js/dashboard-expert.js",
  "/js/yegna-api.js",
  "/js/ui-toast.js",
  "/data/guides.json",
  "/assets/logo.png",
  "/assets/hero.jpg",
  "/assets/teff.png",
  "/assets/maize.png",
  "/assets/tomato.png",
  "/assets/fruit.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: "offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).catch(() => caches.match("/index.html"))
    )
  );
});
