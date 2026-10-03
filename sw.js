/* Тренировки: офлайн-кэш */
const CACHE = "training-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function stamp(res) {
  return (res && (res.headers.get("etag") || res.headers.get("last-modified"))) || "";
}

async function tell(msg) {
  const list = await self.clients.matchAll({type: "window"});
  list.forEach((c) => c.postMessage(msg));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // шрифты и GitHub API идут напрямую

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, {ignoreSearch: true});
    const fresh = fetch(req).then((res) => {
      if (res && res.ok) {
        const before = cached ? stamp(cached) : null;
        cache.put(req, res.clone());
        if (before !== null && stamp(res) && stamp(res) !== before) tell("updated");
      }
      return res;
    }).catch(() => null);

    if (cached) { fresh.catch(() => {}); return cached; }
    const res = await fresh;
    return res || new Response("Нет сети и нет копии в кэше", {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}});
  })());
});
