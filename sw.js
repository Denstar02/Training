/* Тренировки: офлайн-кэш */
const CACHE = "training-v4";
// движок камеры (2 МБ) живёт в отдельном кэше: смена версии кэша выше его не стирает
const KEEP = "training-cam-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== KEEP).map((k) => caches.delete(k))))
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
  if (/\/(auth|rest)\/v1\//.test(url.pathname) || url.pathname.endsWith("/health")) return;   // свой сервер: вход и данные — всегда из сети

  if (/\/cam\.js$/.test(url.pathname)) { e.respondWith(camEngine(e)); return; }

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

// движок камеры: сразу из кэша, а в фоне — лёгкая проверка «не изменился ли файл» (ответ 304 без скачивания)
async function camEngine(e) {
  const req = e.request, keep = await caches.open(KEEP);
  let cached = await keep.match(req, {ignoreSearch: true});
  if (!cached) {
    const old = await caches.match(req, {ignoreSearch: true});   // остался от прежней версии в общем кэше — переносим
    if (old) {
      await keep.put(req, old.clone()); cached = old;
      e.waitUntil(caches.open(CACHE).then((c) => c.delete(req, {ignoreSearch: true})).catch(() => {}));
    }
  }
  if (cached) {
    const h = {}, et = cached.headers.get("etag"), lm = cached.headers.get("last-modified");
    if (lm) h["If-Modified-Since"] = lm; else if (et) h["If-None-Match"] = et;   // дата надёжнее: сжатие на сервере меняет etag
    e.waitUntil(fetch(req.url, {headers: h, cache: "no-store"})
      .then((res) => { if (res && res.status === 200) return keep.put(req, res); })
      .catch(() => {}));
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok) await keep.put(req, res.clone());
    return res;
  } catch (err) {
    return new Response("Нет сети, а движок камеры ещё не сохранён на устройстве", {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}});
  }
}

// push-уведомления: сервер присылает {t: заголовок, b: текст, tag, go: куда открыть}
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {b: e.data ? e.data.text() : ""}; }
  const opts = {body: d.b || "", icon: "icon-192.png", badge: "badge-96.png", data: {go: d.go || ""}, lang: "ru"};
  if (d.tag) { opts.tag = d.tag; opts.renotify = true; }
  e.waitUntil(self.registration.showNotification(d.t || "Тренировки", opts));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const go = (e.notification.data && e.notification.data.go) || "";
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    for (const c of list) {
      if (new URL(c.url).origin !== self.location.origin) continue;
      try { await c.focus(); } catch (err) {}
      if (go) c.postMessage({type: "go", go});
      return;
    }
    await self.clients.openWindow(new URL("./" + (go ? "?go=" + go : ""), self.registration.scope).href);
  })());
});
