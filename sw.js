// Gym-Logbuch Service Worker: macht die App offline nutzbar.
// Bei jeder neuen App-Version die Versionsnummer hochzählen.
const VERSION = "gym-logbuch-2.7";
const APP_FILES = [
  "./",
  "./index.html",
  "./report.js",
  "./anatomy.js",
  "./body/m-front.webp","./body/m-back.webp","./body/f-front.webp","./body/f-back.webp",
  "./body/m-front-map.png","./body/m-back-map.png","./body/f-front-map.png","./body/f-back-map.png",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];
const FONT_CACHE = "gym-logbuch-fonts";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(APP_FILES.map(u => new Request(u, { cache: "reload" })))));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== VERSION && k !== FONT_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Schriften von Google: einmal laden, dann offline aus dem Speicher
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache => cache.match(req).then(hit =>
        hit || fetch(req).then(res => { cache.put(req, res.clone()); return res; })
      ))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // App-Dateien: sofort aus dem Speicher, damit die App auch im Keller-Gym ohne Netz startet
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() =>
        req.mode === "navigate" ? caches.match("./index.html") : Response.error()
      );
    })
  );
});
