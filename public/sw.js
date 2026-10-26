/* Omnia's service worker keeps the shell installable and fast.
   It is deliberately network-first so a fresh deploy wins whenever the
   device is online. The update feed is never cached. */

const CACHE = 'omnia-runtime-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/updates/latest.json')) return;

  const cacheable =
    request.mode === 'navigate' ||
    url.pathname.includes('/_expo/') ||
    /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|json)$/.test(url.pathname);

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (cacheable && response.ok) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || Response.error())
      )
  );
});
