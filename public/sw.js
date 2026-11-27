// ============================================================
// Service Worker — оффлайн-кеш приложения
// ============================================================
const CACHE_NAME = 'fcmpo-editor-v1';
const CORE_ASSETS = [
  '/editor.html',
  '/messages.js',
  '/app-core.js',
  '/kp.js',
  '/daily-menu-module.js',
  '/generator-module.js',
  '/analytics-module.js',
  '/analytics-widget.js',
  '/manifest.json',
  '/app-icon.svg',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS).catch(function() { return; });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Сетевые ресурсы (CDN) — stale-while-revalidate
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        const fetchPromise = fetch(event.request).then(function(resp) {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(event.request, clone); });
          }
          return resp;
        }).catch(function() { return cached; });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Локальные ресурсы — cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(resp) {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(event.request, clone); });
        }
        return resp;
      }).catch(function() { return caches.match('/editor.html'); });
    })
  );
});
