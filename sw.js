// Network-first for the app's own files so updates show up at once; the cache answers when offline
// or when the network takes longer than 3 s (weak signal at the port).
// Forecasts (Open-Meteo) are not cached here: weather.js keeps its own copy in localStorage.
importScripts("src/net-first-sw.js");

const VERSION = "v11";
const SHELL = [
  "src/net-first-sw.js", "src/ui/backup.js",
  "./", "index.html", "styles.css", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "src/app.js", "src/config.js", "src/date.js", "src/shift.js", "src/tide-name.js",
  "src/tide-data.js", "src/weather.js", "src/store.js", "src/prefs.js", "src/holiday.js",
  "src/ui/month.js", "src/ui/day.js", "src/ui/event-form.js", "src/ui/esc.js", "src/ui/marks.js", "src/ui/swipe.js", "src/ui/emoji.js",
  "data/tide/2026.json", "data/tide/2027.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    self.networkFirst(e.request, {
      // GitHub Pages says max-age=600; "no-cache" makes the browser ask the server each time
      // (a cheap 304 when unchanged), so a new version shows up at once instead of 10 minutes later.
      // (Page loads are fetched by URL: some browsers refuse options on a navigation request.)
      fetchFn: (r) => fetch(r.mode === "navigate" ? r.url : r, { cache: "no-cache" }),
      match: (r) => caches.match(r, { ignoreSearch: true }),
      put: (r, res) => caches.open(VERSION).then((c) => c.put(r, res)),
      timeoutMs: 3000,
    }).catch(() => caches.match("index.html")),
  );
});
