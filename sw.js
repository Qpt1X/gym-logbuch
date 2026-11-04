// Gym-Logbuch Service Worker: macht die App offline nutzbar.
// Bei jeder neuen App-Version die Versionsnummer hochzählen.
const VERSION = "gym-logbuch-3.27";
const APP_FILES = [
  "./",
  "./index.html",
  "./report.js",
  "./anatomy.js",
  "./body/m-front.webp","./body/m-back.webp","./body/f-front.webp","./body/f-back.webp",
  "./body/m-front-map.png","./body/m-back-map.png","./body/f-front-map.png","./body/f-back-map.png",
  "./manifest.webmanifest",
  "./manifest-bear-1.webmanifest","./manifest-bear-2.webmanifest","./manifest-bear-3.webmanifest","./manifest-bear-4.webmanifest",
  "./manifest-bear-5.webmanifest","./manifest-bear-6.webmanifest","./manifest-bear-7.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/bear-1-thumb.webp","./icons/bear-2-thumb.webp","./icons/bear-3-thumb.webp","./icons/bear-4-thumb.webp",
  "./icons/bear-5-thumb.webp","./icons/bear-6-thumb.webp","./icons/bear-7-thumb.webp",
  "./icons/bear-f1-thumb.webp","./icons/bear-f2-thumb.webp","./icons/bear-f3-thumb.webp","./icons/bear-f4-thumb.webp","./icons/bear-f5-thumb.webp","./icons/bear-f6-thumb.webp","./icons/bear-f7-thumb.webp","./icons/bear-f8-thumb.webp","./icons/bear-f9-thumb.webp","./icons/bear-f10-thumb.webp","./icons/bear-f11-thumb.webp","./icons/bear-f12-thumb.webp",
  "./manifest-bear-f1.webmanifest","./manifest-bear-f2.webmanifest","./manifest-bear-f3.webmanifest","./manifest-bear-f4.webmanifest","./manifest-bear-f5.webmanifest","./manifest-bear-f6.webmanifest","./manifest-bear-f7.webmanifest","./manifest-bear-f8.webmanifest","./manifest-bear-f9.webmanifest","./manifest-bear-f10.webmanifest","./manifest-bear-f11.webmanifest","./manifest-bear-f12.webmanifest"
];
const PREFS = "gym-logbuch-prefs";
const ICON_IDS = ["bear-1","bear-2","bear-3","bear-4","bear-5","bear-6","bear-7","bear-f1","bear-f2","bear-f3","bear-f4","bear-f5","bear-f6","bear-f7","bear-f8","bear-f9","bear-f10","bear-f11","bear-f12"];

// Manifest mit dem App-Symbol, das in der App gewählt wurde
async function manifestResponse(req){
  let base = await caches.match("./manifest.webmanifest", { ignoreSearch: true });
  if (!base) { try { base = await fetch(req); } catch (e) { return Response.error(); } }
  let json; try { json = await base.clone().json(); } catch (e) { return base; }
  try {
    const hit = await (await caches.open(PREFS)).match("./__icon");
    const id = hit ? (await hit.json()).icon : "std";
    if (ICON_IDS.includes(id)) json.icons = [
      { src: `icons/${id}-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `icons/${id}-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `icons/${id}-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" }
    ];
  } catch (e) {}
  return new Response(JSON.stringify(json), { headers: { "Content-Type": "application/manifest+json" } });
}
const FONT_CACHE = "gym-logbuch-fonts";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(APP_FILES.map(u => new Request(u, { cache: "reload" })))));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== VERSION && k !== FONT_CACHE && k !== PREFS).map(k => caches.delete(k))
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

  if (url.pathname.endsWith("/manifest.webmanifest")) { event.respondWith(manifestResponse(req)); return; }

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
